"""Esquemas Pydantic de entrada y salida. Desafío: triage municipal de reportes de microbasurales (AGENTS.md §0)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_EVIDENCIA = 5
MAX_LARGO_FRAGMENTO = 200


class SolicitudTexto(BaseModel):
    texto: str = Field(..., min_length=1, max_length=4000, description="Texto a procesar")


class ResultadoAnalisis(BaseModel):
    """Salida estructurada que se exige al modelo. Si no cumple, se reintenta una vez."""

    tipo_residuo: Literal["domiciliario", "escombros", "voluminoso", "poda", "peligroso", "mixto", "no_es_residuo"]
    peligrosidad: Literal["baja", "media", "alta"]
    prioridad: Literal["alta", "media", "baja"]
    accion_sugerida: Literal[
        "cuadrilla_estandar", "camion_tolva", "retiro_especializado", "fiscalizacion", "derivar", "pedir_mas_datos"
    ]
    resumen: str = Field(..., min_length=1, max_length=400)
    falta_informacion: list[str] = Field(
        default_factory=list, description="Datos que faltan para atender el reporte (ej. ubicación exacta, volumen)"
    )
    evidencia: list[str] = Field(
        default_factory=list,
        description="Fragmentos literales del texto de entrada que justifican la decisión (se verifican en analisis.py)",
    )

    @field_validator("evidencia", mode="before")
    @classmethod
    def _limpiar_evidencia(cls, valor):
        # Tolerante: un fragmento mal formado no debe gatillar el reintento; se descarta y listo.
        if not isinstance(valor, list):
            return valor  # no es lista: que falle la validación normal
        limpios = []
        for fragmento in valor:
            if isinstance(fragmento, str):
                fragmento = fragmento.strip().strip("\"'«»“”").strip()
                if fragmento and len(fragmento) <= MAX_LARGO_FRAGMENTO:
                    limpios.append(fragmento)
        return limpios[:MAX_EVIDENCIA]

    @field_validator("falta_informacion", mode="before")
    @classmethod
    def _limpiar_faltantes(cls, valor):
        if not isinstance(valor, list):
            return valor
        return [f.strip()[:150] for f in valor if isinstance(f, str) and f.strip()][:4]


class Uso(BaseModel):
    """Tokens y costo ESTIMADO del análisis. Todo es None si no se conoce (MOCK o sin precios configurados)."""

    tokens_entrada: int | None = None
    tokens_salida: int | None = None
    costo_usd_estimado: float | None = None
    costo_clp_estimado: float | None = None


class RespuestaAnalisis(BaseModel):
    resultado: ResultadoAnalisis
    modo: Literal["mock", "live"]
    modelo: str
    intentos: int
    latencia_ms: int
    uso: Uso = Field(default_factory=Uso)
    evidencia_descartada: int = Field(0, description="Fragmentos citados por la IA que no estaban en el texto")
    guardado: bool = Field(False, description="True si quedó guardado en la base de datos")


class RegistroHistorial(BaseModel):
    """Un análisis guardado (espejo de modelos.Analisis)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    texto_entrada: str
    tipo_residuo: str
    prioridad: str
    resumen: str
    accion_sugerida: str
    modo: str
    modelo: str
    latencia_ms: int
    creado_en: datetime


class RespuestaHistorial(BaseModel):
    bd: Literal["desactivada", "conectada"]
    registros: list[RegistroHistorial]
