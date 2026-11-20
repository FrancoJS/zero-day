"""Esquemas Pydantic de entrada y salida. Desafío: triage municipal de reportes de microbasurales (AGENTS.md §0)."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_EVIDENCIA = 5
MAX_LARGO_FRAGMENTO = 90  # evidencia = frases cortas (2–8 palabras); las largas se descartan


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
    ubicacion: str | None = Field(
        None, description="Calle o referencia mencionada en el reporte (sin datos personales); null si no la dice"
    )
    respuesta_vecino: str | None = Field(
        None, description="Lo que el asistente le dice al vecino (2.ª persona, 1–2 frases); null si no viene"
    )
    pregunta_seguimiento: str | None = Field(
        None, description="Una pregunta corta al vecino sobre el dato más importante que falta; null si no falta nada"
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

    @field_validator("ubicacion", "pregunta_seguimiento", "respuesta_vecino", mode="before")
    @classmethod
    def _texto_corto_opcional(cls, valor):
        # Tolerante: vacío o no-texto -> null; texto largo se recorta (no gatilla reintento).
        if not isinstance(valor, str) or not valor.strip():
            return None
        return valor.strip()[:300]


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


# --- Contrato de la API de reportes (odd/contrato-api.md, S9). El backend (T2) implementa los
# endpoints con ESTOS modelos; el frontend usa la misma forma en frontend/src/datosEjemplo.js. ---

Prioridad = Literal["alta", "media", "baja"]
EstadoReporte = Literal["pendiente", "aprobado", "rechazado"]


class Sector(BaseModel):
    """Sector del catálogo fijo (sectores.py). Coordenadas APROXIMADAS (simulado, sin GPS)."""

    id: str
    nombre: str
    lat: float
    lng: float


class RespuestaSectores(BaseModel):
    sectores: list[Sector]


class SolicitudBorrador(BaseModel):
    """Chat del vecino: analiza SIN guardar. `texto` es todo lo que el vecino escribió hasta ahora
    (mensaje inicial + respuestas a las preguntas de seguimiento, en orden)."""

    texto: str = Field(..., min_length=1, max_length=4000)
    sector_id: str | None = None


class RespuestaBorrador(BaseModel):
    """`completo` = sector elegido y sin datos faltantes: el frontend habilita "Enviar"."""

    analisis: RespuestaAnalisis
    completo: bool


class SolicitudReporte(BaseModel):
    """Envío final del vecino: se analiza de nuevo (nunca se confía en un análisis del cliente) y se guarda."""

    texto: str = Field(..., min_length=1, max_length=4000)
    sector_id: str


class SectorRef(BaseModel):
    id: str
    nombre: str


class AnalisisGuardado(BaseModel):
    resultado: ResultadoAnalisis
    modo: Literal["mock", "live"]
    modelo: str
    latencia_ms: int
    evidencia_descartada: int = 0


class Reporte(BaseModel):
    id: int
    texto: str = Field(..., description="Texto del vecino con RUT/teléfono/correo reemplazados por [dato oculto]")
    sector: SectorRef
    creado_en: datetime
    simulado: bool = False
    estado: EstadoReporte = "pendiente"
    decidido_en: datetime | None = None
    nota_decision: str | None = None
    reportes_en_sector: int = Field(1, description="Pendientes en el mismo sector (coincidencia exacta), incluido este")
    analisis: AnalisisGuardado


class ResumenSector(BaseModel):
    sector_id: str
    nombre: str
    lat: float
    lng: float
    pendientes: int
    total: int
    prioridad_max: Prioridad | None = Field(None, description="Sobre los pendientes; null si no hay pendientes")


class RespuestaBandeja(BaseModel):
    reportes: list[Reporte]
    por_sector: list[ResumenSector]


class SolicitudDecision(BaseModel):
    decision: Literal["aprobar", "rechazar"]
    nota: str | None = Field(None, max_length=200)
