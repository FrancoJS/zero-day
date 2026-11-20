"""Modelos ORM y operaciones de guardado/lectura.

PLANTILLA PARA ADAPTAR AL DESAFÍO: `Analisis` guarda cada resultado de /api/ia/analizar
como ejemplo. Cambiar columnas (y esquemas.RegistroHistorial) según lo que haya que guardar.
No hay migraciones: las tablas se crean con create_all si no existen. Si se cambian
columnas de una tabla que ya existe, borrar el volumen (`docker compose down -v`).
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text, select
from sqlalchemy.orm import Mapped, mapped_column

from bd import Base, abrir_sesion
from esquemas import RespuestaAnalisis


def _ahora_utc() -> datetime:
    return datetime.now(timezone.utc)


class Analisis(Base):
    __tablename__ = "analisis"

    id: Mapped[int] = mapped_column(primary_key=True)
    texto_entrada: Mapped[str] = mapped_column(Text)
    tipo_residuo: Mapped[str] = mapped_column(String(50))
    prioridad: Mapped[str] = mapped_column(String(50))
    resumen: Mapped[str] = mapped_column(Text)
    accion_sugerida: Mapped[str] = mapped_column(String(50))
    modo: Mapped[str] = mapped_column(String(10))
    modelo: Mapped[str] = mapped_column(String(100))
    latencia_ms: Mapped[int]
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora_utc, index=True)


def guardar_analisis(texto: str, respuesta: RespuestaAnalisis) -> None:
    """Guarda un análisis. Lanza excepción si la BD falla (main.py decide qué hacer)."""
    with abrir_sesion() as sesion:
        sesion.add(
            Analisis(
                texto_entrada=texto,
                tipo_residuo=respuesta.resultado.tipo_residuo,
                prioridad=respuesta.resultado.prioridad,
                resumen=respuesta.resultado.resumen,
                accion_sugerida=respuesta.resultado.accion_sugerida,
                modo=respuesta.modo,
                modelo=respuesta.modelo,
                latencia_ms=respuesta.latencia_ms,
            )
        )
        sesion.commit()


def listar_analisis(limite: int) -> list[Analisis]:
    """Últimos análisis, del más nuevo al más antiguo."""
    with abrir_sesion() as sesion:
        consulta = select(Analisis).order_by(Analisis.creado_en.desc(), Analisis.id.desc()).limit(limite)
        return list(sesion.scalars(consulta))
