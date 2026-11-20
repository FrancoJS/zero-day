"""GET /api/evaluacion (con el archivo redirigido a una carpeta temporal) y evaluar.revisar()."""

import json
import tempfile
from pathlib import Path
from unittest import mock

from pruebas.apoyo import PruebaAislada, importar_app

main = importar_app()
from evaluacion import evaluar  # noqa: E402

RESUMEN_LIVE = {
    "fecha": "2026-11-20T13:50:00-03:00",
    "modo": "live",
    "modelo": "deepseek-v4.1-flash",
    "total": 8,
    "aciertos": 7,
    "latencia_promedio_ms": 3100,
    "por_tipo": {"normal": {"aciertos": 3, "total": 3}},
    "casos": [],
}


class PruebasEndpointEvaluacion(PruebaAislada):
    def setUp(self):
        super().setUp()
        carpeta = tempfile.TemporaryDirectory(prefix="zd-pruebas-")
        self.addCleanup(carpeta.cleanup)
        self.ruta = Path(carpeta.name) / "ultimo_resultado.json"
        parche = mock.patch.object(main, "RUTA_EVALUACION", self.ruta)  # nunca se toca el archivo real
        parche.start()
        self.addCleanup(parche.stop)

    def consultar(self) -> dict:
        respuesta = self.cliente().get("/api/evaluacion")
        self.assertEqual(respuesta.status_code, 200)
        return respuesta.json()

    def test_sin_archivo(self):
        self.assertEqual(self.consultar(), {"disponible": False})

    def test_archivo_live_valido(self):
        self.ruta.write_text(json.dumps(RESUMEN_LIVE), encoding="utf-8")
        self.assertEqual(self.consultar(), {**RESUMEN_LIVE, "disponible": True})

    def test_archivo_malformado(self):
        casos = {
            "json_roto": "{no es json",
            "no_es_objeto": "[1, 2, 3]",
            "bytes_invalidos": b"\xff\xfe\x00",
        }
        for nombre, contenido in casos.items():
            with self.subTest(caso=nombre):
                if isinstance(contenido, bytes):
                    self.ruta.write_bytes(contenido)
                else:
                    self.ruta.write_text(contenido, encoding="utf-8")
                with self.assertLogs("zeroday.api", "WARNING"):
                    self.assertEqual(self.consultar(), {"disponible": False})

    def test_corrida_mock_no_se_muestra(self):
        self.ruta.write_text(json.dumps({**RESUMEN_LIVE, "modo": "mock", "aciertos": 8}), encoding="utf-8")
        self.assertEqual(self.consultar(), {"disponible": False})


class PruebasRevisar(PruebaAislada):
    CASO = {
        "esperado": {"categoria": "incidente", "prioridad": "alta"},
        "no_debe_contener": ["12.345.678-5", "ana.perez@correo.cl"],
    }
    RESULTADO_OK = {
        "categoria": "incidente",
        "prioridad": "alta",
        "resumen": "No puede entrar a su cuenta.",
        "accion_sugerida": "Derivar a soporte.",
        "evidencia": ["no puedo entrar a mi cuenta"],
    }

    def test_acierto_sin_fallas(self):
        self.assertEqual(evaluar.revisar(self.CASO, self.RESULTADO_OK), [])

    def test_falla_por_campo_distinto(self):
        fallas = evaluar.revisar(self.CASO, {**self.RESULTADO_OK, "categoria": "reclamo"})
        self.assertEqual(fallas, ["categoria: esperaba 'incidente', obtuvo 'reclamo'"])

    def test_falla_por_dato_prohibido_en_evidencia(self):
        resultado = {**self.RESULTADO_OK, "evidencia": ["Mi RUT es 12.345.678-5"]}
        fallas = evaluar.revisar(self.CASO, resultado)
        self.assertEqual(fallas, ["la evidencia contiene dato prohibido '12.345.678-5'"])

    def test_falla_por_dato_prohibido_en_resumen(self):
        resultado = {**self.RESULTADO_OK, "resumen": "Escribir a ana.perez@correo.cl"}
        self.assertEqual(evaluar.revisar(self.CASO, resultado), ["contiene dato prohibido 'ana.perez@correo.cl'"])

    def test_resumen_por_tipo(self):
        detalle = [{"tipo": "normal", "ok": True}, {"tipo": "normal", "ok": False}, {"tipo": "inyeccion", "ok": True}]
        self.assertEqual(
            evaluar.resumen_por_tipo(detalle),
            {"normal": {"aciertos": 1, "total": 2}, "inyeccion": {"aciertos": 1, "total": 1}},
        )
