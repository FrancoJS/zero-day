"""Modo MOCK por HTTP: health, analizar, stream, errores forzados (MOCK_ERROR), entrada inválida y reintento de JSON."""

from unittest import mock

from pruebas.apoyo import PruebaAislada, importar_app, leer_eventos_sse, resultado_valido

importar_app()
import kostra  # noqa: E402

TEXTO = "El sistema de pagos está caído desde las 9:00 y no podemos cobrar a nadie, es urgente."

# MOCK_ERROR -> (codigo, status HTTP de /api/ia/analizar)
ERRORES_MOCK = {
    "401": ("key_invalida", 502),
    "402": ("saldo_agotado", 502),
    "403": ("modelo_no_habilitado", 502),
    "429": ("limite_alcanzado", 429),
    "timeout": ("timeout", 504),
}


class PruebasSaludMock(PruebaAislada):
    def test_health_campos(self):
        respuesta = self.cliente().get("/api/health")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            respuesta.json(),
            {"estado": "ok", "modo_ia": "mock", "modelo": "deepseek-v4.1-flash", "base_datos": "desactivada"},
        )

    def test_health_refleja_modo_y_modelo(self):
        self.entorno(AI_MODE=" LIVE ", KOSTRA_MODELO="glm-5.3")
        datos = self.cliente().get("/api/health").json()
        self.assertEqual((datos["modo_ia"], datos["modelo"]), ("live", "glm-5.3"))


class PruebasAnalizarMock(PruebaAislada):
    def test_analizar_ok(self):
        respuesta = self.cliente().post("/api/ia/analizar", json={"texto": TEXTO})
        self.assertEqual(respuesta.status_code, 200)
        datos = respuesta.json()
        self.assertEqual(datos["resultado"]["categoria"], "incidente")
        self.assertEqual(datos["resultado"]["prioridad"], "alta")
        self.assertTrue(datos["resultado"]["resumen"])
        self.assertTrue(datos["resultado"]["accion_sugerida"])
        self.assertEqual((datos["modo"], datos["modelo"], datos["intentos"]), ("mock", "mock", 1))
        self.assertIsInstance(datos["latencia_ms"], int)
        self.assertEqual(datos["evidencia_descartada"], 0)
        self.assertFalse(datos["guardado"])

    def test_uso_todo_null_en_mock(self):
        datos = self.cliente().post("/api/ia/analizar", json={"texto": TEXTO}).json()
        self.assertEqual(
            datos["uso"],
            {"tokens_entrada": None, "tokens_salida": None, "costo_usd_estimado": None, "costo_clp_estimado": None},
        )

    def test_uso_null_aunque_haya_precios(self):
        # Sin tokens no se inventa costo, aunque haya precios configurados
        self.entorno(KOSTRA_PRECIO_ENTRADA_CLP_1M="197", KOSTRA_PRECIO_SALIDA_CLP_1M="789", DOLAR_CLP="950")
        uso = self.cliente().post("/api/ia/analizar", json={"texto": TEXTO}).json()["uso"]
        self.assertTrue(all(valor is None for valor in uso.values()))

    def test_evidencia_sale_del_texto(self):
        evidencia = self.cliente().post("/api/ia/analizar", json={"texto": TEXTO}).json()["resultado"]["evidencia"]
        self.assertGreater(len(evidencia), 0)
        for fragmento in evidencia:
            self.assertIn(fragmento, TEXTO)

    def test_evidencia_sin_datos_sensibles(self):
        texto = "Mi RUT es 12.345.678-5 y mi correo es ana.perez@correo.cl, no puedo entrar a mi cuenta, me sale error."
        resultado = self.cliente().post("/api/ia/analizar", json={"texto": texto}).json()["resultado"]
        unido = " ".join(resultado["evidencia"]) + resultado["resumen"]
        self.assertNotIn("12.345.678-5", unido)
        self.assertNotIn("ana.perez@correo.cl", unido)


class PruebasStreamMock(PruebaAislada):
    def test_stream_fragmentos_y_fin(self):
        respuesta = self.cliente().post("/api/ia/stream", json={"texto": "hola"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertTrue(respuesta.headers["content-type"].startswith("text/event-stream"))
        eventos = leer_eventos_sse(respuesta.text)
        nombres = [nombre for nombre, _ in eventos]
        self.assertGreater(nombres.count("fragmento"), 1)
        self.assertEqual(nombres[-1], "fin")
        self.assertEqual(set(nombres[:-1]), {"fragmento"})
        self.assertIsInstance(eventos[-1][1]["latencia_ms"], int)
        texto = "".join(datos["texto"] for nombre, datos in eventos if nombre == "fragmento")
        self.assertIn("[Respuesta MOCK]", texto)
        self.assertIn("4 caracteres", texto)


class PruebasErroresMock(PruebaAislada):
    def test_errores_analizar(self):
        cliente = self.cliente()
        for forzado, (codigo, estado) in ERRORES_MOCK.items():
            with self.subTest(MOCK_ERROR=forzado):
                self.entorno(MOCK_ERROR=forzado)
                respuesta = cliente.post("/api/ia/analizar", json={"texto": TEXTO})
                self.assertEqual(respuesta.status_code, estado)
                datos = respuesta.json()
                self.assertEqual(set(datos), {"codigo", "mensaje"})
                self.assertEqual(datos["codigo"], codigo)
                self.assertIn("simulado en MOCK", datos["mensaje"])

    def test_errores_stream(self):
        cliente = self.cliente()
        for forzado, (codigo, _) in ERRORES_MOCK.items():
            with self.subTest(MOCK_ERROR=forzado):
                self.entorno(MOCK_ERROR=forzado)
                respuesta = cliente.post("/api/ia/stream", json={"texto": TEXTO})
                self.assertEqual(respuesta.status_code, 200)  # el error viaja como evento SSE
                eventos = leer_eventos_sse(respuesta.text)
                self.assertEqual(len(eventos), 1)
                nombre, datos = eventos[0]
                self.assertEqual(nombre, "error")
                self.assertEqual(datos["codigo"], codigo)
                self.assertTrue(datos["mensaje"])

    def test_mock_error_desconocido_se_ignora(self):
        self.entorno(MOCK_ERROR="500")
        self.assertEqual(self.cliente().post("/api/ia/analizar", json={"texto": TEXTO}).status_code, 200)


class PruebasEntradaInvalida(PruebaAislada):
    def test_texto_vacio(self):
        cliente = self.cliente()
        for ruta in ("/api/ia/analizar", "/api/ia/stream"):
            with self.subTest(ruta=ruta):
                respuesta = cliente.post(ruta, json={"texto": ""})
                self.assertEqual(respuesta.status_code, 422)
                self.assertEqual(
                    respuesta.json(),
                    {"codigo": "entrada_invalida", "mensaje": "Entrada inválida: el texto no puede estar vacío."},
                )

    def test_texto_largo_y_campo_faltante(self):
        cliente = self.cliente()
        casos = {
            "largo": ({"texto": "a" * 4001}, "demasiado largo"),
            "faltante": ({}, "falta un campo obligatorio"),
        }
        for nombre, (cuerpo, fragmento) in casos.items():
            with self.subTest(caso=nombre):
                respuesta = cliente.post("/api/ia/analizar", json=cuerpo)
                self.assertEqual(respuesta.status_code, 422)
                self.assertEqual(respuesta.json()["codigo"], "entrada_invalida")
                self.assertIn(fragmento, respuesta.json()["mensaje"])


class PruebasReintentoJson(PruebaAislada):
    def test_invalido_luego_valido(self):
        respuestas = [
            kostra.RespuestaIA(texto="no es json"),
            kostra.RespuestaIA(texto="```json\n" + resultado_valido([]) + "\n```"),
        ]
        falso = mock.AsyncMock(side_effect=respuestas)
        with mock.patch.object(kostra, "completar", falso):
            respuesta = self.cliente().post("/api/ia/analizar", json={"texto": TEXTO})
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json()["intentos"], 2)
        self.assertEqual(falso.await_count, 2)
        # El segundo intento lleva la respuesta mala y el pedido de corrección
        mensajes = falso.await_args_list[1].args[0]
        self.assertEqual(mensajes[-2], {"role": "assistant", "content": "no es json"})
        self.assertIn("no cumplió el formato", mensajes[-1]["content"])

    def test_esquema_invalido_tambien_reintenta(self):
        malo = resultado_valido([]).replace('"incidente"', '"urgencia"')  # categoría fuera del Literal
        falso = mock.AsyncMock(side_effect=[kostra.RespuestaIA(texto=malo), kostra.RespuestaIA(texto=resultado_valido([]))])
        with mock.patch.object(kostra, "completar", falso):
            datos = self.cliente().post("/api/ia/analizar", json={"texto": TEXTO}).json()
        self.assertEqual(datos["intentos"], 2)
        self.assertIn("categoria", falso.await_args_list[1].args[0][-1]["content"])

    def test_siempre_invalido(self):
        falso = mock.AsyncMock(return_value=kostra.RespuestaIA(texto="{\"categoria\": 1}"))
        with mock.patch.object(kostra, "completar", falso):
            respuesta = self.cliente().post("/api/ia/analizar", json={"texto": TEXTO})
        self.assertEqual(respuesta.status_code, 502)
        self.assertEqual(respuesta.json()["codigo"], "salida_invalida")
        self.assertEqual(falso.await_count, 2)  # un solo reintento, no más
