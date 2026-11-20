"""Modelos ORM y operaciones de guardado/lectura (historial de análisis y bandeja de reportes municipales)."""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text, func, select
from sqlalchemy.orm import Mapped, mapped_column

from bd import Base, abrir_sesion
from esquemas import (
    AnalisisGuardado,
    Reporte,
    RespuestaAnalisis,
    RespuestaBandeja,
    ResumenSector,
    SectorRef,
)
from sectores import SECTORES, buscar_sector

ORDEN_PRIORIDAD = {"alta": 0, "media": 1, "baja": 2}


def _ahora_utc() -> datetime:
    return datetime.now(timezone.utc)


def _asegurar_utc(fecha: datetime | None) -> datetime | None:
    if fecha is None:
        return None
    return fecha.replace(tzinfo=timezone.utc) if fecha.tzinfo is None else fecha


class ReporteNoEncontrado(Exception):
    """El reporte solicitado no existe en la base de datos."""


class ReporteYaDecidido(Exception):
    """El reporte ya fue aprobado o rechazado anteriormente."""


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


class ReporteORM(Base):
    __tablename__ = "reportes"

    id: Mapped[int] = mapped_column(primary_key=True)
    texto: Mapped[str] = mapped_column(Text)
    sector_id: Mapped[str] = mapped_column(String(50), index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_ahora_utc, index=True)
    simulado: Mapped[bool] = mapped_column(Boolean, default=False)
    estado: Mapped[str] = mapped_column(String(20), default="pendiente", index=True)
    decidido_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=None)
    nota_decision: Mapped[str | None] = mapped_column(String(200), nullable=True, default=None)
    prioridad: Mapped[str] = mapped_column(String(20), index=True)
    analisis_json: Mapped[str] = mapped_column(Text)


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


def _a_esquema_reporte(fila: ReporteORM, reportes_en_sector: int) -> Reporte:
    sector = buscar_sector(fila.sector_id)
    nombre_sector = sector.nombre if sector else fila.sector_id
    return Reporte(
        id=fila.id,
        texto=fila.texto,
        sector=SectorRef(id=fila.sector_id, nombre=nombre_sector),
        creado_en=_asegurar_utc(fila.creado_en),
        simulado=fila.simulado,
        estado=fila.estado,
        decidido_en=_asegurar_utc(fila.decidido_en),
        nota_decision=fila.nota_decision,
        reportes_en_sector=reportes_en_sector,
        analisis=AnalisisGuardado.model_validate_json(fila.analisis_json),
    )


def _contar_pendientes_sector(sesion, sector_id: str) -> int:
    consulta = (
        select(func.count())
        .select_from(ReporteORM)
        .where(ReporteORM.sector_id == sector_id, ReporteORM.estado == "pendiente")
    )
    return int(sesion.scalar(consulta) or 0)


def crear_reporte(
    texto_limpio: str,
    sector_id: str,
    respuesta: RespuestaAnalisis,
    simulado: bool = False,
) -> Reporte:
    """Persiste un reporte ya analizado y devuelve el esquema Reporte con `reportes_en_sector` actualizado."""
    analisis_guardado = AnalisisGuardado(
        resultado=respuesta.resultado,
        modo=respuesta.modo,
        modelo=respuesta.modelo,
        latencia_ms=respuesta.latencia_ms,
        evidencia_descartada=respuesta.evidencia_descartada,
    )
    with abrir_sesion() as sesion:
        fila = ReporteORM(
            texto=texto_limpio,
            sector_id=sector_id,
            simulado=simulado,
            estado="pendiente",
            prioridad=respuesta.resultado.prioridad,
            analisis_json=analisis_guardado.model_dump_json(),
        )
        sesion.add(fila)
        sesion.commit()
        sesion.refresh(fila)
        pendientes = _contar_pendientes_sector(sesion, sector_id)
        return _a_esquema_reporte(fila, pendientes)


def listar_bandeja(
    estado: str | None = None,
    sector_id: str | None = None,
    limite: int = 100,
) -> RespuestaBandeja:
    """Devuelve la bandeja ordenada por estado (pendiente primero), prioridad (alta→baja) y antigüedad
    (más antiguo primero), junto con el resumen `por_sector` para el mapa."""
    with abrir_sesion() as sesion:
        todas = list(sesion.scalars(select(ReporteORM)))

    pendientes_por_sector: dict[str, int] = {}
    por_sector: list[ResumenSector] = []
    for sector in SECTORES:
        del_sector = [f for f in todas if f.sector_id == sector.id]
        pendientes = [f for f in del_sector if f.estado == "pendiente"]
        pendientes_por_sector[sector.id] = len(pendientes)
        if not del_sector:
            continue
        prioridad_max = min(
            (f.prioridad for f in pendientes),
            key=lambda p: ORDEN_PRIORIDAD.get(p, 99),
            default=None,
        )
        por_sector.append(
            ResumenSector(
                sector_id=sector.id,
                nombre=sector.nombre,
                lat=sector.lat,
                lng=sector.lng,
                pendientes=len(pendientes),
                total=len(del_sector),
                prioridad_max=prioridad_max,
            )
        )

    filtradas = [
        f
        for f in todas
        if (estado is None or f.estado == estado) and (sector_id is None or f.sector_id == sector_id)
    ]
    filtradas.sort(
        key=lambda f: (
            0 if f.estado == "pendiente" else 1,
            ORDEN_PRIORIDAD.get(f.prioridad, 99),
            _asegurar_utc(f.creado_en),
            f.id,
        )
    )
    reportes = [
        _a_esquema_reporte(f, pendientes_por_sector.get(f.sector_id, 0))
        for f in filtradas[:limite]
    ]
    return RespuestaBandeja(reportes=reportes, por_sector=por_sector)


def registrar_decision(reporte_id: int, decision: str, nota: str | None = None) -> Reporte:
    """Aprueba o rechaza el despacho de un reporte pendiente (simulado: solo registra la decisión)."""
    with abrir_sesion() as sesion:
        fila = sesion.get(ReporteORM, reporte_id)
        if fila is None:
            raise ReporteNoEncontrado()
        if fila.estado != "pendiente":
            raise ReporteYaDecidido()
        fila.estado = "aprobado" if decision == "aprobar" else "rechazado"
        fila.decidido_en = _ahora_utc()
        fila.nota_decision = nota.strip() if nota and nota.strip() else None
        sesion.commit()
        sesion.refresh(fila)
        pendientes = _contar_pendientes_sector(sesion, fila.sector_id)
        return _a_esquema_reporte(fila, pendientes)


def contar_reportes_simulados() -> int:
    """Cuántos reportes con `simulado=True` existen en la BD (para que `semilla.py` sea idempotente)."""
    with abrir_sesion() as sesion:
        consulta = select(func.count()).select_from(ReporteORM).where(ReporteORM.simulado.is_(True))
        return int(sesion.scalar(consulta) or 0)
