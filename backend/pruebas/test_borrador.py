"""POST /api/reportes/borrador (odd/contrato-api.md): el chat del vecino analiza SIN guardar.

- `completo` = sector válido Y sin información faltante (habilita "Enviar" en el frontend).
- `sector_id` inválido (no null y fuera del catálogo) -> 422 {"codigo": "sector_invalido"}.
- El borrador nunca escribe en la base de datos.
"""

import unittest

from pruebas.apoyo import PruebaAislada, importar_app

importar_app()
import main  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

# Texto que el mock clasifica con prioridad alta y SIN información faltante (menciona esquina y dígitos).
TEXTO_COMPLETO = "Botaron escombros y un colchón en la esquina de pasaje Los Aromos 123, junto al colegio"
# Texto sin ubicación: al mock le falta información (el vecino aún puede responder preguntas).
TEXTO_INCOMPLETO = "Hay un cerro de basura que huele muy mal"


class PruebasBorrador(PruebaAislada):
    def setUp(self):
        super().setUp()
        self.cliente = TestClient(main.app)

    def test_borrador_completo_con_sector_valido(self):
        respuesta = self.cliente.post("/api/reportes/borrador", json={"texto": TEXTO_COMPLETO, "sector_id": "sur"})
        self.assertEqual(respuesta.status_code, 200)
        datos = respuesta.json()
        self.assertTrue(datos["completo"])
        self.assertEqual(datos["analisis"]["resultado"]["tipo_residuo"], "mixto")
        self.assertEqual(datos["analisis"]["guardado"], False)

    def test_borrador_incompleto_por_falta_informacion(self):
        respuesta = self.cliente.post("/api/reportes/borrador", json={"texto": TEXTO_INCOMPLETO, "sector_id": "sur"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(respuesta.json()["completo"])
        self.assertTrue(respuesta.json()["analisis"]["resultado"]["falta_informacion"])

    def test_borrador_sin_sector_nunca_esta_completo(self):
        respuesta = self.cliente.post("/api/reportes/borrador", json={"texto": TEXTO_COMPLETO, "sector_id": None})
        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(respuesta.json()["completo"])

    def test_sector_invalido(self):
        respuesta = self.cliente.post("/api/reportes/borrador", json={"texto": TEXTO_COMPLETO, "sector_id": "no-existe"})
        self.assertEqual(respuesta.status_code, 422)
        self.assertEqual(respuesta.json()["codigo"], "sector_invalido")

    def test_sector_vacio_es_invalido(self):
        respuesta = self.cliente.post("/api/reportes/borrador", json={"texto": TEXTO_COMPLETO, "sector_id": ""})
        self.assertEqual(respuesta.status_code, 422)
        self.assertEqual(respuesta.json()["codigo"], "sector_invalido")

    def test_texto_vacio_es_entrada_invalida(self):
        respuesta = self.cliente.post("/api/reportes/borrador", json={"texto": "", "sector_id": "sur"})
        self.assertEqual(respuesta.status_code, 422)
        self.assertEqual(respuesta.json()["codigo"], "entrada_invalida")

    def test_borrador_no_guarda_en_bd(self):
        # La BD desactivada (DATABASE_URL vacía) no debe impedir el borrador: nunca se escribe nada.
        respuesta = self.cliente.post("/api/reportes/borrador", json={"texto": TEXTO_COMPLETO, "sector_id": "sur"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertFalse(respuesta.json()["analisis"]["guardado"])


if __name__ == "__main__":
    unittest.main()
