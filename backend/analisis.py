"""Flujo principal de ejemplo: texto -> IA -> JSON validado (con un reintento) -> evidencia verificada."""

import json
import re
import time

from pydantic import ValidationError

import kostra
from esquemas import RespuestaAnalisis, ResultadoAnalisis, Uso
from prompts import PLANTILLA_TEXTO_USUARIO, PROMPT_ANALISIS, PROMPT_REINTENTO, PROMPT_STREAM


def extraer_json(texto: str) -> str:
    """Quita bloques ```json y texto alrededor; deja desde la primera { hasta la última }."""
    inicio, fin = texto.find("{"), texto.rfind("}")
    return texto[inicio : fin + 1] if inicio != -1 and fin > inicio else texto


def _validar(texto: str) -> ResultadoAnalisis:
    return ResultadoAnalisis.model_validate_json(extraer_json(texto))


def _normalizar(texto: str) -> str:
    """Minúsculas y espacios colapsados: así se compara la evidencia con el texto original."""
    return " ".join(texto.split()).casefold()


def verificar_evidencia(evidencia: list[str], texto: str) -> tuple[list[str], int]:
    """Deja solo los fragmentos que existen de verdad en el texto. Devuelve (verificados, descartados)."""
    original = _normalizar(texto)
    verificados = [fragmento for fragmento in evidencia if _normalizar(fragmento) in original]
    return verificados, len(evidencia) - len(verificados)


def envolver_texto(texto: str) -> str:
    """Marca el texto del usuario como DATOS entre <<< y >>> (defensa contra prompt injection)."""
    return PLANTILLA_TEXTO_USUARIO.format(texto=texto)


def _sumar(a: int | None, b: int | None) -> int | None:
    return None if a is None or b is None else a + b


async def analizar_texto(texto: str) -> RespuestaAnalisis:
    inicio = time.perf_counter()
    mensajes = [
        {"role": "system", "content": PROMPT_ANALISIS},
        {"role": "user", "content": envolver_texto(texto)},
    ]
    salida = await kostra.completar(mensajes, respuesta_mock=analisis_mock(texto))
    tokens_entrada, tokens_salida = salida.tokens_entrada, salida.tokens_salida
    intentos = 1
    try:
        resultado = _validar(salida.texto)
    except ValidationError as error:
        intentos = 2
        mensajes += [
            {"role": "assistant", "content": salida.texto},
            {"role": "user", "content": PROMPT_REINTENTO.format(error=_resumir_error(error))},
        ]
        salida = await kostra.completar(mensajes, respuesta_mock=analisis_mock(texto))
        # El reintento también se paga: se suman los tokens de ambos intentos
        tokens_entrada = _sumar(tokens_entrada, salida.tokens_entrada)
        tokens_salida = _sumar(tokens_salida, salida.tokens_salida)
        try:
            resultado = _validar(salida.texto)
        except ValidationError as error_final:
            raise kostra.ErrorKostra(
                "salida_invalida",
                "La IA respondió dos veces con un formato inválido. Reintenta o simplifica el texto.",
                502,
            ) from error_final
    # La evidencia inventada no gatilla reintento: se descarta y se informa cuántos fragmentos se quitaron.
    # Se compara con el texto ORIGINAL (no con el envoltorio): citar "<<<" o la etiqueta no cuenta como evidencia.
    resultado.evidencia, descartados = verificar_evidencia(resultado.evidencia, texto)
    costo_usd, costo_clp = kostra.estimar_costo(tokens_entrada, tokens_salida)
    return RespuestaAnalisis(
        resultado=resultado,
        modo=kostra.modo_ia(),
        modelo=kostra.modelo_ia() if kostra.modo_ia() == "live" else "mock",
        intentos=intentos,
        latencia_ms=int((time.perf_counter() - inicio) * 1000),
        uso=Uso(
            tokens_entrada=tokens_entrada,
            tokens_salida=tokens_salida,
            costo_usd_estimado=costo_usd,
            costo_clp_estimado=costo_clp,
        ),
        evidencia_descartada=descartados,
    )


async def responder_stream(texto: str):
    mensajes = [
        {"role": "system", "content": PROMPT_STREAM},
        {"role": "user", "content": envolver_texto(texto)},
    ]
    async for fragmento in kostra.completar_stream(mensajes, respuesta_mock=respuesta_larga_mock(texto)):
        yield fragmento


def _resumir_error(error: ValidationError) -> str:
    primero = error.errors()[0]
    campo = ".".join(str(parte) for parte in primero.get("loc", ())) or "json"
    return f"{campo}: {primero.get('msg', 'inválido')}"


# --- Respuestas MOCK: heurísticas simples, solo para trabajar sin red ---
# Están ajustadas para que casos.json pase en MOCK: eso prueba la plomería (flujo, validación, evaluador),
# NO dice nada de la calidad de la IA. La calidad solo se mide con AI_MODE=live.

PALABRAS_URGENTES = ("urgente", "caído", "caida", "no funciona", "emergencia", "bloqueado", "inmediato")
PALABRAS_CATEGORIA = {  # se revisan en este orden; "consulta" también se activa con "?"
    "incidente": ("error", "falla", "caído", "caida", "no funciona", "no anda", "bloqueado"),
    "reclamo": ("reclamo", "molesto", "pésimo", "pesimo", "mal servicio"),
    "solicitud": ("solicito", "necesito", "quisiera", "quiero"),
    "consulta": ("?", "cómo", "como ", "cuándo", "consulta"),
}
# Una "consulta" sin ninguna de estas palabras se trata como fuera de dominio (ej. cultura general) -> "otro"
PALABRAS_DOMINIO = (
    "horario", "atención", "atencion", "sucursal", "cuenta", "pedido", "servicio", "pago", "cobr",
    "sistema", "despacho", "compra", "producto", "factura",
)
PATRONES_SENSIBLES = r"\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b|\+?56\s?9\s?\d{4}\s?\d{4}|\S+@\S+"


def evidencia_mock(texto: str, palabras: tuple[str, ...]) -> list[str]:
    """Hasta 2 frases REALES del texto que contienen las palabras que decidieron el resultado.
    Nunca inventa texto y descarta frases con datos sensibles (RUT, teléfono, correo)."""
    # Corta en , ; ! ? y salto de línea (dejando el signo) y en un punto seguido de espacio o final
    # (así no se rompen RUT ni correos, que llevan puntos sin espacio).
    frases = re.split(r"(?<=[,;!?\n])|\.(?=\s|$)", texto)
    evidencia = []
    for frase in frases:
        frase = frase.strip().rstrip(",;").strip()
        if not frase or len(frase) > 200 or re.search(PATRONES_SENSIBLES, frase):
            continue
        if any(p in frase.lower() for p in palabras):
            evidencia.append(frase)
        if len(evidencia) == 2:
            break
    return evidencia


def analisis_mock(texto: str) -> str:
    minusculas = texto.lower()
    categoria = next(
        (cat for cat, palabras in PALABRAS_CATEGORIA.items() if any(p in minusculas for p in palabras)),
        "otro",
    )
    if categoria == "consulta" and not any(p in minusculas for p in PALABRAS_DOMINIO):
        categoria = "otro"  # pregunta ajena al negocio
    urgente = any(p in minusculas for p in PALABRAS_URGENTES)
    prioridad = "alta" if urgente else ("media" if categoria in ("incidente", "reclamo") else "baja")
    acciones = {
        "incidente": "Derivar a soporte técnico y confirmar al usuario el tiempo estimado de solución.",
        "reclamo": "Contactar al usuario, reconocer el problema y ofrecer una solución concreta.",
        "solicitud": "Registrar la solicitud y asignarla al área responsable.",
        "consulta": "Responder la consulta con la información disponible o derivar a quien corresponda.",
        "otro": "Revisar manualmente el mensaje para decidir el siguiente paso.",
    }
    decisivas = PALABRAS_CATEGORIA.get(categoria, ()) + (PALABRAS_URGENTES if urgente else ())
    resumen = re.sub(PATRONES_SENSIBLES, "[dato oculto]", texto.strip())
    return json.dumps(
        {
            "categoria": categoria,
            "prioridad": prioridad,
            "resumen": (resumen[:180] + "…") if len(resumen) > 180 else resumen,
            "accion_sugerida": acciones[categoria],
            "evidencia": evidencia_mock(texto, decisivas),
        },
        ensure_ascii=False,
    )


def respuesta_larga_mock(texto: str) -> str:
    return (
        "[Respuesta MOCK] Esta es una respuesta simulada para probar el streaming sin gastar créditos. "
        f"Recibí un texto de {len(texto)} caracteres. En modo live, aquí aparecería la respuesta real de Kostra "
        "fragmento a fragmento, lo que permite mostrar avance al usuario aunque el modelo tarde. "
        "Para activarlo, configura AI_MODE=live y KOSTRA_API_KEY en el archivo .env y reinicia el backend."
    )
