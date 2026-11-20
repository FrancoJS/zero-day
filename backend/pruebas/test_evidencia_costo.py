"""Funciones puras: verificación de evidencia, envoltorio del texto y costo estimado."""

from pruebas.apoyo import PruebaAislada, importar_app

importar_app()
import analisis  # noqa: E402
import kostra  # noqa: E402
from esquemas import ResultadoAnalisis  # noqa: E402

TEXTO = "El sistema de pagos está caído, es urgente."


class PruebasEvidencia(PruebaAislada):
    def test_verificar_ignora_mayusculas_y_espacios(self):
        verificados, descartados = analisis.verificar_evidencia(["el SISTEMA  de pagos", "es urgente"], TEXTO)
        self.assertEqual((verificados, descartados), (["el SISTEMA  de pagos", "es urgente"], 0))

    def test_verificar_descarta_inventados(self):
        verificados, descartados = analisis.verificar_evidencia(["es urgente", "nadie contesta"], TEXTO)
        self.assertEqual((verificados, descartados), (["es urgente"], 1))

    def test_envoltorio_no_cuenta_como_texto(self):
        envuelto = analisis.envolver_texto(TEXTO)
        self.assertIn(f"<<<\n{TEXTO}\n>>>", envuelto)
        verificados, descartados = analisis.verificar_evidencia(["<<<", ">>>", "son datos"], TEXTO)
        self.assertEqual((verificados, descartados), ([], 3))

    def test_esquema_limpia_evidencia(self):
        resultado = ResultadoAnalisis.model_validate(
            {
                "categoria": "otro",
                "prioridad": "baja",
                "resumen": "r",
                "accion_sugerida": "a",
                "evidencia": ["  «hola»  ", "", 3, "x" * 201] + [f"f{i}" for i in range(10)],
            }
        )
        self.assertEqual(resultado.evidencia[0], "hola")
        self.assertEqual(len(resultado.evidencia), 5)  # MAX_EVIDENCIA
        self.assertNotIn("", resultado.evidencia)


class PruebasCosto(PruebaAislada):
    def test_clp_sin_dolar(self):
        self.entorno(KOSTRA_PRECIO_ENTRADA_CLP_1M="197", KOSTRA_PRECIO_SALIDA_CLP_1M="789")
        usd, clp = kostra.estimar_costo(275, 427)
        self.assertAlmostEqual(clp, 0.391078, places=9)
        self.assertIsNone(usd)

    def test_clp_con_dolar_y_coma_decimal(self):
        self.entorno(KOSTRA_PRECIO_ENTRADA_CLP_1M="197,0", KOSTRA_PRECIO_SALIDA_CLP_1M="789", DOLAR_CLP="950")
        usd, clp = kostra.estimar_costo(275, 427)
        self.assertAlmostEqual(clp, 0.391078, places=9)
        self.assertAlmostEqual(usd, 0.391078 / 950, places=12)

    def test_respaldo_usd(self):
        self.entorno(KOSTRA_PRECIO_ENTRADA_USD_1M="0.2", KOSTRA_PRECIO_SALIDA_USD_1M="0.8")
        usd, clp = kostra.estimar_costo(1_000_000, 1_000_000)
        self.assertAlmostEqual(usd, 1.0)
        self.assertIsNone(clp)
        self.entorno(DOLAR_CLP="950")
        self.assertAlmostEqual(kostra.estimar_costo(1_000_000, 1_000_000)[1], 950.0)

    def test_sin_precios_o_sin_tokens(self):
        self.assertEqual(kostra.estimar_costo(275, 427), (None, None))
        self.entorno(KOSTRA_PRECIO_ENTRADA_CLP_1M="197", KOSTRA_PRECIO_SALIDA_CLP_1M="789")
        self.assertEqual(kostra.estimar_costo(None, 427), (None, None))

    def test_precio_invalido_es_null(self):
        self.entorno(KOSTRA_PRECIO_ENTRADA_CLP_1M="abc", KOSTRA_PRECIO_SALIDA_CLP_1M="789")
        with self.assertLogs("zeroday.kostra", "WARNING"):
            self.assertEqual(kostra.estimar_costo(275, 427), (None, None))
