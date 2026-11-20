"""API FastAPI. Todas las rutas van bajo /api (el frontend las recibe vía proxy de Vite)."""

import json
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # útil al correr fuera de Docker; en Docker las variables llegan por env_file

from fastapi import APIRouter, FastAPI, Query, Request  # noqa: E402
from fastapi.concurrency import run_in_threadpool  # noqa: E402
from fastapi.exceptions import RequestValidationError  # noqa: E402
from fastapi.responses import JSONResponse, StreamingResponse  # noqa: E402

import bd  # noqa: E402
import kostra  # noqa: E402
import modelos  # noqa: E402
from analisis import analizar_texto, ocultar_datos_sensibles, responder_stream  # noqa: E402
from esquemas import (  # noqa: E402
    EstadoReporte,
    RegistroHistorial,
    Reporte,
    RespuestaAnalisis,
    RespuestaBandeja,
    RespuestaBorrador,
    RespuestaHistorial,
    RespuestaSectores,
    SolicitudBorrador,
    SolicitudDecision,
    SolicitudReporte,
    SolicitudTexto,
)
from sectores import SECTORES, buscar_sector  # noqa: E402

registro = logging.getLogger("zeroday.api")

# Lo escribe `python -m evaluacion.evaluar` (no va al repo: depende de cada entorno)
RUTA_EVALUACION = Path(__file__).parent / "evaluacion" / "ultimo_resultado.json"


@asynccontextmanager
async def ciclo_de_vida(_: FastAPI):
    # Intenta crear las tablas al arrancar; si la BD no responde, solo avisa (se reintenta después).
    if bd.bd_activa():
        await run_in_threadpool(bd.preparar_tablas)
    yield


app = FastAPI(title="API Zero Day — Hackatón Huawei", lifespan=ciclo_de_vida)
api = APIRouter(prefix="/api")


@app.exception_handler(kostra.ErrorKostra)
async def manejar_error_kostra(_: Request, error: kostra.ErrorKostra) -> JSONResponse:
    return JSONResponse(status_code=error.estado_http, content={"codigo": error.codigo, "mensaje": error.mensaje})


@app.exception_handler(RequestValidationError)
async def manejar_entrada_invalida(_: Request, error: RequestValidationError) -> JSONResponse:
    # Pydantic entrega mensajes en inglés: se traducen los casos comunes para la UI.
    traducciones = {
        "string_too_short": "el texto no puede estar vacío.",
        "string_too_long": "el texto es demasiado largo (máximo 4000 caracteres).",
        "missing": "falta un campo obligatorio.",
    }
    primero = error.errors()[0]
    detalle = traducciones.get(primero.get("type", ""), "revisa los datos enviados.")
    return JSONResponse(status_code=422, content={"codigo": "entrada_invalida", "mensaje": f"Entrada inválida: {detalle}"})


def _error_sector_invalido() -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"codigo": "sector_invalido", "mensaje": "El sector indicado no existe en el catálogo de Rancagua."},
    )


def _error_bd_no_disponible(error: Exception | None = None) -> JSONResponse:
    if error is not None:
        registro.warning("Operación de reportes falló por base de datos (%s).", type(error).__name__)
    return JSONResponse(
        status_code=503,
        content={
            "codigo": "bd_no_disponible",
            "mensaje": "No se pudo acceder a la base de datos de reportes. Revisa DATABASE_URL y el servicio base_datos.",
        },
    )


@api.get("/health")
def salud() -> dict:
    return {
        "estado": "ok",
        "modo_ia": kostra.modo_ia(),
        "modelo": kostra.modelo_ia(),
        "base_datos": bd.estado_bd(),
    }


@api.post("/ia/analizar", response_model=RespuestaAnalisis)
async def analizar(solicitud: SolicitudTexto) -> RespuestaAnalisis:
    respuesta = await analizar_texto(solicitud.texto)
    if bd.bd_activa():
        try:
            await run_in_threadpool(modelos.guardar_analisis, solicitud.texto, respuesta)
            respuesta.guardado = True
        except Exception as error:  # la BD nunca debe romper el análisis
            registro.warning("No se pudo guardar el análisis (%s).", type(error).__name__)
    return respuesta


@api.get("/historial", response_model=RespuestaHistorial)
async def historial(limite: int = Query(10, ge=1, le=50)):
    if not bd.bd_activa():
        return RespuestaHistorial(bd="desactivada", registros=[])
    try:
        filas = await run_in_threadpool(modelos.listar_analisis, limite)
    except Exception as error:
        registro.warning("No se pudo leer el historial (%s).", type(error).__name__)
        return JSONResponse(
            status_code=503,
            content={
                "codigo": "bd_error",
                "mensaje": "No se pudo leer la base de datos. Revisa DATABASE_URL y que el servicio base_datos esté levantado.",
            },
        )
    return RespuestaHistorial(bd="conectada", registros=[RegistroHistorial.model_validate(f) for f in filas])


@api.get("/evaluacion")
def evaluacion() -> dict:
    """Resumen de la última corrida LIVE de evaluacion.evaluar.
    Sin archivo, ilegible o de una corrida que no fue live: {disponible: false} (MOCK no mide calidad)."""
    if not RUTA_EVALUACION.is_file():
        return {"disponible": False}
    try:
        datos = json.loads(RUTA_EVALUACION.read_text(encoding="utf-8"))
        if not isinstance(datos, dict):
            raise ValueError("no es un objeto JSON")
    except (OSError, ValueError) as error:  # JSONDecodeError y UnicodeDecodeError son ValueError
        registro.warning("No se pudo leer %s (%s).", RUTA_EVALUACION.name, type(error).__name__)
        return {"disponible": False}
    if datos.get("modo") != "live":  # defensivo: evaluar.py ya no escribe corridas MOCK
        return {"disponible": False}
    return {**datos, "disponible": True}


def _evento_sse(evento: str, datos: dict) -> str:
    return f"event: {evento}\ndata: {json.dumps(datos, ensure_ascii=False)}\n\n"


@api.post("/ia/stream")
async def stream(solicitud: SolicitudTexto) -> StreamingResponse:
    """SSE: eventos 'fragmento' {texto}, luego 'fin' {latencia_ms} o 'error' {codigo, mensaje}."""

    async def generar():
        inicio = time.perf_counter()
        try:
            async for fragmento in responder_stream(solicitud.texto):
                yield _evento_sse("fragmento", {"texto": fragmento})
            yield _evento_sse("fin", {"latencia_ms": int((time.perf_counter() - inicio) * 1000)})
        except kostra.ErrorKostra as error:
            yield _evento_sse("error", {"codigo": error.codigo, "mensaje": error.mensaje})

    return StreamingResponse(
        generar(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# --- Endpoints del contrato de reportes (odd/contrato-api.md v2, S9) ---


@api.get("/sectores", response_model=RespuestaSectores)
def listar_sectores() -> RespuestaSectores:
    return RespuestaSectores(sectores=SECTORES)


@api.post("/reportes/borrador", response_model=RespuestaBorrador)
async def analizar_borrador_reporte(solicitud: SolicitudBorrador):
    """Chat del vecino: analiza sin guardar y determina si el borrador está `completo`."""
    sector = None
    if solicitud.sector_id is not None:
        sector = buscar_sector(solicitud.sector_id)
        if sector is None:
            return _error_sector_invalido()
    respuesta = await analizar_texto(solicitud.texto)
    completo = (sector is not None) and (len(respuesta.resultado.falta_informacion) == 0)
    return RespuestaBorrador(analisis=respuesta, completo=completo)


@api.post("/reportes", response_model=Reporte, status_code=201)
async def crear_reporte(solicitud: SolicitudReporte):
    """Envío final desde el chatbot del vecino: valida sector y BD, analiza con IA, oculta datos sensibles y guarda."""
    sector = buscar_sector(solicitud.sector_id)
    if sector is None:
        return _error_sector_invalido()
    if not bd.bd_activa() or not await run_in_threadpool(bd.preparar_tablas):
        return _error_bd_no_disponible()
    respuesta = await analizar_texto(solicitud.texto)
    texto_limpio = ocultar_datos_sensibles(solicitud.texto)
    try:
        return await run_in_threadpool(modelos.crear_reporte, texto_limpio, sector.id, respuesta)
    except Exception as error:
        return _error_bd_no_disponible(error)


@api.get("/reportes", response_model=RespuestaBandeja)
async def obtener_bandeja(
    estado: EstadoReporte | None = Query(None),
    sector_id: str | None = Query(None),
):
    """Bandeja priorizada del encargado + resumen `por_sector` para el mapa."""
    if not bd.bd_activa():
        return _error_bd_no_disponible()
    try:
        return await run_in_threadpool(modelos.listar_bandeja, estado, sector_id, 100)
    except Exception as error:
        return _error_bd_no_disponible(error)


@api.post("/reportes/{reporte_id}/decision", response_model=Reporte)
async def decidir_reporte(reporte_id: int, solicitud: SolicitudDecision):
    """Aprobar o rechazar el despacho propuesto para un reporte pendiente (simulado)."""
    if not bd.bd_activa():
        return _error_bd_no_disponible()
    try:
        return await run_in_threadpool(
            modelos.registrar_decision,
            reporte_id,
            solicitud.decision,
            solicitud.nota,
        )
    except modelos.ReporteNoEncontrado:
        return JSONResponse(
            status_code=404,
            content={"codigo": "reporte_no_encontrado", "mensaje": "No se encontró el reporte indicado."},
        )
    except modelos.ReporteYaDecidido:
        return JSONResponse(
            status_code=409,
            content={"codigo": "ya_decidido", "mensaje": "Este reporte ya fue aprobado o rechazado."},
        )
    except Exception as error:
        return _error_bd_no_disponible(error)


app.include_router(api)
