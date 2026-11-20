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
from analisis import analizar_texto, responder_stream  # noqa: E402
from esquemas import RegistroHistorial, RespuestaAnalisis, RespuestaHistorial, SolicitudTexto  # noqa: E402

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


app.include_router(api)
