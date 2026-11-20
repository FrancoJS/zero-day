"""Contrato de reportes (odd/contrato-api.md): esquemas, catálogo de sectores y campos nuevos del análisis."""

import json
import unittest

from pruebas.apoyo import PruebaAislada, importar_app

importar_app()
import analisis  # noqa: E402
from esquemas import Reporte, RespuestaBandeja, ResultadoAnalisis, SolicitudDecision  # noqa: E402
from pydantic import ValidationError  # noqa: E402
from sectores import SECTORES, buscar_sector  # noqa: E402

RESULTADO = {
    "tipo_residuo": "mixto",
    "peligrosidad": "media",
    "prioridad": "alta",
    "accion_sugerida": "camion_tolva",
    "resumen": "Escombros y colchón junto a un colegio.",
    "falta_informacion": ["volumen aproximado"],
    "ubicacion": "pasaje Los Aromos con Av. España",
    "pregunta_seguimiento": "¿Cabe en una camioneta o se necesita un camión?",
    "evidencia": ["junto al colegio"],
}
REPORTE = {
    "id": 12,
    "texto": "Botaron escombros y un colchón junto al colegio",
    "sector": {"id": "sur", "nombre": "Rancagua Sur"},
    "creado_en": "2026-11-20T13:05:00Z",
    "simulado": False,
    "estado": "pendiente",
    "decidido_en": None,
    "nota_decision": None,
    "reportes_en_sector": 3,
    "analisis": {"resultado": RESULTADO, "modo": "live", "modelo": "deepseek-v4.1-flash", "latencia_ms": 2900, "evidencia_descartada": 0},
}


class PruebasContrato(PruebaAislada):
    def test_reporte_del_contrato_es_valido(self):
        reporte = Reporte.model_validate(REPORTE)
        self.assertEqual((reporte.sector.id, reporte.analisis.resultado.prioridad), ("sur", "alta"))

    def test_bandeja_con_resumen_por_sector(self):
        bandeja = RespuestaBandeja.model_validate(
            {
                "reportes": [REPORTE],
                "por_sector": [
                    {"sector_id": "sur", "nombre": "Rancagua Sur", "lat": -34.189, "lng": -70.739,
                     "pendientes": 3, "total": 4, "prioridad_max": "alta"}
                ],
            }
        )
        self.assertEqual(bandeja.por_sector[0].pendientes, 3)

    def test_decision_solo_aprobar_o_rechazar(self):
        self.assertEqual(SolicitudDecision(decision="aprobar").decision, "aprobar")
        with self.assertRaises(ValidationError):
            SolicitudDecision(decision="ejecutar")

    def test_ubicacion_y_pregunta_son_opcionales_y_tolerantes(self):
        base = {k: v for k, v in RESULTADO.items() if k not in ("ubicacion", "pregunta_seguimiento")}
        sin_campos = ResultadoAnalisis.model_validate(base)
        vacios = ResultadoAnalisis.model_validate({**base, "ubicacion": "  ", "pregunta_seguimiento": 3})
        self.assertEqual((sin_campos.ubicacion, sin_campos.pregunta_seguimiento), (None, None))
        self.assertEqual((vacios.ubicacion, vacios.pregunta_seguimiento), (None, None))

    def test_catalogo_de_sectores(self):
        ids = [s.id for s in SECTORES]
        self.assertEqual(
            ids, ["centro", "norte", "sur", "oriente", "poniente", "nororiente", "suroriente", "surponiente"]
        )
        self.assertEqual(buscar_sector("sur").nombre, "Rancagua Sur")
        self.assertIsNone(buscar_sector("no-existe"))
        self.assertIsNone(buscar_sector(None))


class PruebasMockCamposNuevos(PruebaAislada):
    def test_mock_pregunta_lo_que_falta(self):
        datos = json.loads(analisis.analisis_mock("Hay bolsas de basura tiradas hace días, huele muy mal"))
        self.assertIn("ubicación exacta", datos["falta_informacion"])
        self.assertTrue(datos["pregunta_seguimiento"].startswith("¿"))
        ResultadoAnalisis.model_validate(datos)

    def test_mock_extrae_ubicacion_sin_preguntar(self):
        datos = json.loads(analisis.analisis_mock("Botaron escombros en la esquina de pasaje Los Aromos, junto al colegio"))
        self.assertIn("esquina", datos["ubicacion"])
        self.assertIsNone(datos["pregunta_seguimiento"])


if __name__ == "__main__":
    unittest.main()
