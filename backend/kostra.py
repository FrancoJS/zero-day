"""Cliente de Kostra con dos modos: mock (sin red) y live (API real).

AI_MODE=mock -> respuestas falsas realistas con latencia simulada, sin red.
AI_MODE=live -> llama a Kostra (compatible con OpenAI) en KOSTRA_BASE_URL.

Todos los errores salen como ErrorKostra con un codigo estable y un mensaje
en espanol listo para mostrar en pantalla.
"""

import asyncio
import logging
import os
from collections.abc import AsyncIterator
from dataclasses import dataclass

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncOpenAI,
)


registro = logging.getLogger("zeroday.kostra")


@dataclass
class RespuestaIA:
    """Respuesta completa del modelo. Los tokens son None si no se conocen (MOCK o Kostra no los informó)."""

    texto: str
    tokens_entrada: int | None = None
    tokens_salida: int | None = None


class ErrorKostra(Exception):
    """Error de IA con codigo estable, mensaje para el usuario y status HTTP."""

    def __init__(self, codigo: str, mensaje: str, estado_http: int = 502):
        super().__init__(mensaje)
        self.codigo = codigo
        self.mensaje = mensaje
        self.estado_http = estado_http


# status de Kostra -> (codigo, mensaje, status HTTP que devuelve nuestra API)
ERRORES_POR_STATUS = {
    401: ("key_invalida", "La API key de Kostra es inválida. Revisa KOSTRA_API_KEY en .env.", 502),
    402: ("saldo_agotado", "Se agotó el saldo de Kostra. Cambia a otra key o usa AI_MODE=mock.", 502),
    403: ("modelo_no_habilitado", "El modelo configurado no está habilitado en Kostra. Revisa KOSTRA_MODELO.", 502),
    429: ("limite_alcanzado", "Kostra limitó las peticiones (429). Espera unos segundos y reintenta.", 429),
}


def modo_ia() -> str:
    return "live" if os.getenv("AI_MODE", "mock").strip().lower() == "live" else "mock"


def modelo_ia() -> str:
    return os.getenv("KOSTRA_MODELO", "deepseek-v4.1-flash").strip()


def _timeout_s() -> float:
    return float(os.getenv("KOSTRA_TIMEOUT_S", "90"))


def _cliente() -> AsyncOpenAI:
    clave = os.getenv("KOSTRA_API_KEY", "").strip()
    if not clave:
        raise ErrorKostra(
            "key_faltante",
            "AI_MODE=live pero KOSTRA_API_KEY está vacía. Configúrala en .env o usa AI_MODE=mock.",
            500,
        )
    return AsyncOpenAI(
        api_key=clave,
        base_url=os.getenv("KOSTRA_BASE_URL", "https://ai.kostra.cloud/v1").strip(),
        timeout=_timeout_s(),
        max_retries=0,  # sin reintentos ocultos: con latencias altas colgarían la demo
    )


async def _crear(**parametros):
    """Llama a Kostra. Ante un 429 (llega en < 1 s) espera y reintenta UNA vez.
    Los timeouts no se reintentan: dejarían la demo colgada el doble."""
    cliente = _cliente()
    try:
        return await cliente.chat.completions.create(model=modelo_ia(), **parametros)
    except APIStatusError as error:
        if error.status_code != 429:
            raise
    await asyncio.sleep(float(os.getenv("KOSTRA_ESPERA_429_S", "3")))
    return await cliente.chat.completions.create(model=modelo_ia(), **parametros)


def _traducir_error(error: Exception) -> ErrorKostra:
    if isinstance(error, ErrorKostra):
        return error
    if isinstance(error, APITimeoutError):  # subclase de APIConnectionError: va primero
        return ErrorKostra(
            "timeout",
            f"Kostra no respondió en {_timeout_s():.0f} s. Prueba con un texto más corto o reintenta.",
            504,
        )
    if isinstance(error, APIConnectionError):
        return ErrorKostra("sin_conexion", "No se pudo conectar con Kostra. Revisa la red o KOSTRA_BASE_URL.", 502)
    if isinstance(error, APIStatusError):
        codigo, mensaje, estado = ERRORES_POR_STATUS.get(
            error.status_code,
            ("error_kostra", f"Kostra respondió con un error inesperado ({error.status_code}).", 502),
        )
        return ErrorKostra(codigo, mensaje, estado)
    return ErrorKostra("error_desconocido", f"Error inesperado al llamar a la IA ({type(error).__name__}).", 502)


async def _simular_mock() -> None:
    """Latencia simulada y error forzado opcional (MOCK_ERROR=401|402|403|429|timeout)."""
    await asyncio.sleep(float(os.getenv("MOCK_LATENCIA_S", "1.5")))
    error_forzado = os.getenv("MOCK_ERROR", "").strip().lower()
    if error_forzado == "timeout":
        raise ErrorKostra("timeout", f"Kostra no respondió en {_timeout_s():.0f} s (simulado en MOCK).", 504)
    if error_forzado.isdigit() and int(error_forzado) in ERRORES_POR_STATUS:
        codigo, mensaje, estado = ERRORES_POR_STATUS[int(error_forzado)]
        raise ErrorKostra(codigo, f"{mensaje} (simulado en MOCK)", estado)


async def completar(mensajes: list[dict], respuesta_mock: str) -> RespuestaIA:
    """Devuelve la respuesta completa del modelo y su uso de tokens.
    En mock devuelve respuesta_mock sin tokens (no se inventan cifras)."""
    if modo_ia() == "mock":
        await _simular_mock()
        return RespuestaIA(texto=respuesta_mock)
    try:
        respuesta = await _crear(messages=mensajes, temperature=0.2)
        uso = getattr(respuesta, "usage", None)
        return RespuestaIA(
            texto=respuesta.choices[0].message.content or "",
            tokens_entrada=getattr(uso, "prompt_tokens", None),
            tokens_salida=getattr(uso, "completion_tokens", None),
        )
    except Exception as error:
        raise _traducir_error(error) from error


def _precio(nombre: str) -> float | None:
    """Lee un precio de .env (acepta coma decimal). Vacío o inválido -> None."""
    valor = os.getenv(nombre, "").strip().replace(",", ".")
    if not valor:
        return None
    try:
        return float(valor)
    except ValueError:
        registro.warning("%s no es un número; el costo no se calculará.", nombre)
        return None


def estimar_costo(tokens_entrada: int | None, tokens_salida: int | None) -> tuple[float | None, float | None]:
    """(costo_usd, costo_clp) ESTIMADOS con los precios de .env (por 1M de tokens).

    1. Si están KOSTRA_PRECIO_ENTRADA_CLP_1M y KOSTRA_PRECIO_SALIDA_CLP_1M (Kostra cobra en pesos),
       el CLP sale directo de ellos y el USD solo si está DOLAR_CLP (clp / dolar).
    2. Si no, respaldo en USD (KOSTRA_PRECIO_*_USD_1M); el CLP solo si está DOLAR_CLP.
    None si faltan precios o tokens."""
    if tokens_entrada is None or tokens_salida is None:
        return None, None
    dolar = _precio("DOLAR_CLP")
    entrada_clp = _precio("KOSTRA_PRECIO_ENTRADA_CLP_1M")
    salida_clp = _precio("KOSTRA_PRECIO_SALIDA_CLP_1M")
    if entrada_clp is not None and salida_clp is not None:
        costo_clp = (tokens_entrada * entrada_clp + tokens_salida * salida_clp) / 1_000_000
        return (costo_clp / dolar if dolar else None), costo_clp
    entrada_usd = _precio("KOSTRA_PRECIO_ENTRADA_USD_1M")
    salida_usd = _precio("KOSTRA_PRECIO_SALIDA_USD_1M")
    if entrada_usd is None or salida_usd is None:
        return None, None
    costo_usd = (tokens_entrada * entrada_usd + tokens_salida * salida_usd) / 1_000_000
    return costo_usd, (costo_usd * dolar if dolar is not None else None)


async def completar_stream(mensajes: list[dict], respuesta_mock: str) -> AsyncIterator[str]:
    """Entrega la respuesta en fragmentos a medida que llegan."""
    if modo_ia() == "mock":
        await _simular_mock()
        for palabra in respuesta_mock.split(" "):
            await asyncio.sleep(0.04)
            yield palabra + " "
        return
    try:
        flujo = await _crear(messages=mensajes, temperature=0.4, stream=True)
        async for fragmento in flujo:
            if fragmento.choices and fragmento.choices[0].delta.content:
                yield fragmento.choices[0].delta.content
    except Exception as error:
        raise _traducir_error(error) from error
