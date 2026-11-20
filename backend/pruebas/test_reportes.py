import json
"""Pruebas de los endpoints de reportes (odd/contrato-api.md v2, T2 / Módulo 2)."""

import tempfile
import unittest
from pathlib import Path

from pruebas.apoyo import PruebaAislada, importar_app

importar_app()
import bd  # noqa: E402
import semilla  # noqa: E402

CLAVE_BD = "clave-bd-reportes-secreta"
URL_INALCANZABLE = f"postgresql://zeroday:{CLAVE_BD}@127.0.0.1:1/zeroday"


class BaseSqliteReportes(PruebaAislada):
    def setUp(self):
        super().setUp()
        carpeta = tempfile.TemporaryDirectory(prefix="zd-reportes-")
        self.addCleanup(carpeta.cleanup)
        self.url = f"sqlite:///{Path(carpeta.name) / 'reportes.db'}"
        self.entorno(DATABASE_URL=self.url)
        self.addCleanup(self._cerrar_motor)

    def _cerrar_motor(self):
        motor = bd._motores.pop(self.url, None)
        if motor is not None:
            motor.dispose()
        bd._tablas_listas.discard(self.url)


class PruebasSectoresYBorrador(PruebaAislada):
    def test_get_sectores_devuelve_catalogo_de_8_sectores(self):
        cliente = self.cliente()
        respuesta = cliente.get("/api/sectores")
        self.assertEqual(respuesta.status_code, 200)
        sectores = respuesta.json()["sectores"]
        self.assertEqual(len(sectores), 8)
        self.assertEqual(sectores[0]["id"], "centro")
        self.assertIn("lat", sectores[0])
        self.assertIn("lng", sectores[0])

    def test_borrador_exige_ubicacion_pero_no_volumen(self):
        """Obligatorios: sector, tipo y ubicación. El volumen faltante no bloquea el envío."""
        from unittest import mock
        import analisis as modulo_analisis
        base = {"tipo_residuo": "escombros", "peligrosidad": "media", "prioridad": "alta",
                "accion_sugerida": "camion_tolva", "resumen": "Escombros junto a un colegio.",
                "evidencia": ["junto al colegio"], "pregunta_seguimiento": None, "respuesta_vecino": "Gracias."}
        cliente = self.cliente()
        casos = [
            ({**base, "ubicacion": None, "falta_informacion": []}, False),
            ({**base, "ubicacion": "pasaje Los Aromos", "falta_informacion": ["volumen aproximado"]}, True),
            ({**base, "ubicacion": "pasaje Los Aromos", "falta_informacion": ["ubicación exacta"]}, False),
        ]
        for resultado, esperado in casos:
            with mock.patch.object(modulo_analisis, "analisis_mock", return_value=json.dumps(resultado)):
                r = cliente.post("/api/reportes/borrador", json={"texto": "escombros junto al colegio", "sector_id": "sur"})
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.json()["completo"], esperado, resultado)

    def test_borrador_analiza_sin_guardar_y_calcula_completo(self):
        cliente = self.cliente()
        # 1) Sin ubicación exacta ni sector -> incompleto
        r1 = cliente.post(
            "/api/reportes/borrador",
            json={"texto": "Hay bolsas de basura tiradas hace días y huele mal", "sector_id": None},
        )
        self.assertEqual(r1.status_code, 200)
        datos1 = r1.json()
        self.assertFalse(datos1["completo"])
        self.assertFalse(datos1["analisis"]["guardado"])
        self.assertIn("ubicación exacta", datos1["analisis"]["resultado"]["falta_informacion"])

        # 2) Con ubicación exacta pero sin sector_id -> incompleto
        r2 = cliente.post(
            "/api/reportes/borrador",
            json={"texto": "Botaron escombros en la esquina de pasaje Los Aromos junto al colegio", "sector_id": None},
        )
        self.assertEqual(r2.status_code, 200)
        self.assertFalse(r2.json()["completo"])

        # 3) Con ubicación exacta y sector_id válido -> completo = True
        r3 = cliente.post(
            "/api/reportes/borrador",
            json={"texto": "Botaron escombros en la esquina de pasaje Los Aromos junto al colegio", "sector_id": "sur"},
        )
        self.assertEqual(r3.status_code, 200)
        self.assertTrue(r3.json()["completo"])

    def test_borrador_rechaza_sector_invalido(self):
        cliente = self.cliente()
        respuesta = cliente.post(
            "/api/reportes/borrador",
            json={"texto": "Hay basura en la esquina", "sector_id": "inexistente"},
        )
        self.assertEqual(respuesta.status_code, 422)
        self.assertEqual(respuesta.json()["codigo"], "sector_invalido")


class PruebasReportesCrud(BaseSqliteReportes):
    def test_crear_reporte_oculta_datos_sensibles_y_cuenta_pendientes_en_sector(self):
        cliente = self.cliente()
        texto_con_pii = (
            "Mi RUT es 12.345.678-5, mi fono +56 9 8765 4321 y correo vecino@rancagua.cl. "
            "Botaron escombros y un colchón en la esquina junto al colegio."
        )
        r1 = cliente.post("/api/reportes", json={"texto": texto_con_pii, "sector_id": "sur"})
        self.assertEqual(r1.status_code, 201)
        rep1 = r1.json()
        self.assertEqual(rep1["sector"], {"id": "sur", "nombre": "Rancagua Sur"})
        self.assertEqual(rep1["estado"], "pendiente")
        self.assertFalse(rep1["simulado"])
        self.assertEqual(rep1["reportes_en_sector"], 1)
        self.assertNotIn("12.345.678-5", rep1["texto"])
        self.assertNotIn("8765 4321", rep1["texto"])
        self.assertNotIn("vecino@rancagua.cl", rep1["texto"])
        self.assertIn("[dato oculto]", rep1["texto"])
        self.assertEqual(rep1["analisis"]["resultado"]["prioridad"], "alta")

        # Segundo reporte en el mismo sector incrementa reportes_en_sector a 2
        r2 = cliente.post(
            "/api/reportes",
            json={"texto": "Dejaron ramas de poda en la vereda de calle Carrera.", "sector_id": "sur"},
        )
        self.assertEqual(r2.status_code, 201)
        self.assertEqual(r2.json()["reportes_en_sector"], 2)

    def test_crear_reporte_con_sector_invalido_devuelve_422(self):
        cliente = self.cliente()
        r = cliente.post("/api/reportes", json={"texto": "Hay basura en la calle", "sector_id": "otro"})
        self.assertEqual(r.status_code, 422)
        self.assertEqual(r.json()["codigo"], "sector_invalido")

    def test_crear_reporte_no_guarda_si_la_ia_falla(self):
        self.entorno(AI_MODE="mock", MOCK_ERROR="429")
        cliente = self.cliente()
        r = cliente.post("/api/reportes", json={"texto": "Hay basura en la esquina", "sector_id": "centro"})
        self.assertEqual(r.status_code, 429)
        self.assertEqual(r.json()["codigo"], "limite_alcanzado")
        bandeja = cliente.get("/api/reportes").json()
        self.assertEqual(bandeja["reportes"], [])

    def test_bandeja_ordena_por_pendiente_prioridad_y_antiguedad_y_resume_por_sector(self):
        cliente = self.cliente()
        # 1) Baja en sur
        baja = cliente.post(
            "/api/reportes",
            json={"texto": "Dejaron ramas de poda en la vereda.", "sector_id": "sur"},
        ).json()
        # 2) Media en centro
        media = cliente.post(
            "/api/reportes",
            json={"texto": "Hay un montón enorme de bolsas de basura en la esquina.", "sector_id": "centro"},
        ).json()
        # 3) Alta en sur (más antigua entre las altas)
        alta_1 = cliente.post(
            "/api/reportes",
            json={"texto": "Botaron escombros en la esquina junto al colegio.", "sector_id": "sur"},
        ).json()
        # 4) Alta en sur (más nueva entre las altas)
        alta_2 = cliente.post(
            "/api/reportes",
            json={"texto": "Hay quema de basura con mucho humo junto al canal.", "sector_id": "sur"},
        ).json()

        # Aprobamos `alta_1` para que deje de estar pendiente y pase al final
        dec = cliente.post(f"/api/reportes/{alta_1['id']}/decision", json={"decision": "aprobar", "nota": "Camión en ruta"})
        self.assertEqual(dec.status_code, 200)
        self.assertEqual(dec.json()["estado"], "aprobado")
        self.assertEqual(dec.json()["nota_decision"], "Camión en ruta")
        self.assertIsNotNone(dec.json()["decidido_en"])

        bandeja = cliente.get("/api/reportes").json()
        ids_ordenados = [r["id"] for r in bandeja["reportes"]]
        # Pendientes primero: alta_2 (alta) -> media (media) -> baja (baja); luego decididos: alta_1 (aprobado)
        self.assertEqual(ids_ordenados, [alta_2["id"], media["id"], baja["id"], alta_1["id"]])

        # Resumen por_sector: centro (1 pendiente, media) y sur (2 pendientes de 3 totales, prioridad_max alta)
        por_sector = {s["sector_id"]: s for s in bandeja["por_sector"]}
        self.assertEqual(set(por_sector.keys()), {"centro", "sur"})
        self.assertEqual(
            (por_sector["sur"]["pendientes"], por_sector["sur"]["total"], por_sector["sur"]["prioridad_max"]),
            (2, 3, "alta"),
        )
        self.assertEqual(
            (por_sector["centro"]["pendientes"], por_sector["centro"]["total"], por_sector["centro"]["prioridad_max"]),
            (1, 1, "media"),
        )

        # Filtros por estado y sector_id
        solo_pendientes_sur = cliente.get("/api/reportes?estado=pendiente&sector_id=sur").json()
        self.assertEqual([r["id"] for r in solo_pendientes_sur["reportes"]], [alta_2["id"], baja["id"]])

    def test_decision_404_y_409_ya_decidido(self):
        cliente = self.cliente()
        no_existe = cliente.post("/api/reportes/999/decision", json={"decision": "aprobar"})
        self.assertEqual(no_existe.status_code, 404)
        self.assertEqual(no_existe.json()["codigo"], "reporte_no_encontrado")

        creado = cliente.post(
            "/api/reportes",
            json={"texto": "Bolsas de basura en la esquina.", "sector_id": "norte"},
        ).json()
        r1 = cliente.post(f"/api/reportes/{creado['id']}/decision", json={"decision": "rechazar", "nota": "Duplicado"})
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(r1.json()["estado"], "rechazado")

        r2 = cliente.post(f"/api/reportes/{creado['id']}/decision", json={"decision": "aprobar"})
        self.assertEqual(r2.status_code, 409)
        self.assertEqual(r2.json()["codigo"], "ya_decidido")

    def test_semilla_es_idempotente(self):
        import asyncio

        codigo_1 = asyncio.run(semilla.cargar_semilla())
        self.assertEqual(codigo_1, 0)
        bandeja_1 = self.cliente().get("/api/reportes").json()
        total_1 = len(bandeja_1["reportes"])
        self.assertEqual(total_1, len(semilla.REPORTES_SEMILLA))
        self.assertTrue(all(r["simulado"] for r in bandeja_1["reportes"]))

        # Segunda ejecución no duplica
        codigo_2 = asyncio.run(semilla.cargar_semilla())
        self.assertEqual(codigo_2, 0)
        bandeja_2 = self.cliente().get("/api/reportes").json()
        self.assertEqual(len(bandeja_2["reportes"]), total_1)


class PruebasReportesBdNoDisponible(PruebaAislada):
    def test_endpoints_de_reportes_devuelven_503_bd_no_disponible_sin_filtrar_clave(self):
        self.entorno(DATABASE_URL=URL_INALCANZABLE)
        cliente = self.cliente()
        with self.assertLogs("zeroday", "WARNING") as logs:
            r_post = cliente.post("/api/reportes", json={"texto": "Basura en la esquina", "sector_id": "centro"})
            r_get = cliente.get("/api/reportes")
            r_dec = cliente.post("/api/reportes/1/decision", json={"decision": "aprobar"})
        for respuesta in (r_post, r_get, r_dec):
            self.assertEqual(respuesta.status_code, 503)
            self.assertEqual(respuesta.json()["codigo"], "bd_no_disponible")
            self.assertNotIn(CLAVE_BD, respuesta.text)
            self.assertNotIn("127.0.0.1:1", respuesta.text)
        self.assertNotIn(CLAVE_BD, "\n".join(logs.output))


if __name__ == "__main__":
    unittest.main()
