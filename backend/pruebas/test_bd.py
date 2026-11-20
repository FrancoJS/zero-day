"""Base de datos opcional: desactivada, SQLite temporal y Postgres inalcanzable (sin filtrar la contraseña)."""

import tempfile
from pathlib import Path

from pruebas.apoyo import PruebaAislada, importar_app

importar_app()
import bd  # noqa: E402

CLAVE_BD = "clave-bd-que-no-debe-salir"
URL_INALCANZABLE = f"postgresql://zeroday:{CLAVE_BD}@127.0.0.1:1/zeroday"


class PruebasBdDesactivada(PruebaAislada):
    def test_sin_database_url(self):
        cliente = self.cliente()
        self.assertEqual(cliente.get("/api/health").json()["base_datos"], "desactivada")
        respuesta = cliente.post("/api/ia/analizar", json={"texto": "hola, ¿cuál es el horario de la sucursal?"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(respuesta.json()["guardado"])
        historial = cliente.get("/api/historial")
        self.assertEqual(historial.status_code, 200)
        self.assertEqual(historial.json(), {"bd": "desactivada", "registros": []})


class PruebasBdSqlite(PruebaAislada):
    def setUp(self):
        super().setUp()
        carpeta = tempfile.TemporaryDirectory(prefix="zd-pruebas-")
        self.addCleanup(carpeta.cleanup)
        self.url = f"sqlite:///{Path(carpeta.name) / 'pruebas.db'}"
        self.entorno(DATABASE_URL=self.url)
        self.addCleanup(self._cerrar_motor)  # se ejecuta antes de borrar la carpeta

    def _cerrar_motor(self):
        motor = bd._motores.pop(self.url, None)
        if motor is not None:
            motor.dispose()
        bd._tablas_listas.discard(self.url)

    def test_guarda_y_lista_del_mas_nuevo_al_mas_antiguo(self):
        cliente = self.cliente()
        self.assertEqual(cliente.get("/api/health").json()["base_datos"], "conectada")
        textos = ["primero: el sistema no funciona", "segundo: quiero dejar un reclamo", "tercero: ok gracias"]
        for texto in textos:
            respuesta = cliente.post("/api/ia/analizar", json={"texto": texto})
            self.assertEqual(respuesta.status_code, 200)
            self.assertTrue(respuesta.json()["guardado"])
        datos = cliente.get("/api/historial").json()
        self.assertEqual(datos["bd"], "conectada")
        self.assertEqual([r["texto_entrada"] for r in datos["registros"]], list(reversed(textos)))
        primero = datos["registros"][0]
        self.assertEqual((primero["modo"], primero["modelo"], primero["categoria"]), ("mock", "mock", "otro"))
        self.assertEqual(len(cliente.get("/api/historial?limite=2").json()["registros"]), 2)

    def test_limite_fuera_de_rango(self):
        cliente = self.cliente()
        for limite in (0, 51):
            with self.subTest(limite=limite):
                respuesta = cliente.get(f"/api/historial?limite={limite}")
                self.assertEqual(respuesta.status_code, 422)
                self.assertEqual(respuesta.json()["codigo"], "entrada_invalida")


class PruebasBdInalcanzable(PruebaAislada):
    def setUp(self):
        super().setUp()
        self.entorno(DATABASE_URL=URL_INALCANZABLE)

    def test_analizar_sigue_funcionando_y_no_filtra_clave(self):
        cliente = self.cliente()
        with self.assertLogs("zeroday", "WARNING") as logs:
            analizar = cliente.post("/api/ia/analizar", json={"texto": "el sistema no funciona"})
            salud = cliente.get("/api/health")
            historial = cliente.get("/api/historial")
        self.assertEqual(analizar.status_code, 200)
        self.assertFalse(analizar.json()["guardado"])
        self.assertEqual(salud.json()["base_datos"], "error")
        self.assertEqual(historial.status_code, 503)
        self.assertEqual(historial.json()["codigo"], "bd_error")
        for cuerpo in (analizar.text, salud.text, historial.text, "\n".join(logs.output)):
            self.assertNotIn(CLAVE_BD, cuerpo)
            self.assertNotIn("127.0.0.1:1", cuerpo)
