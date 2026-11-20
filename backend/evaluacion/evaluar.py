"""Corre los casos de evaluacion/casos.json contra la IA y muestra cuántos acertó.

Uso (desde backend/):  python -m evaluacion.evaluar
En Docker:             docker compose exec backend python -m evaluacion.evaluar
Forzar Kostra real:    docker compose exec -e AI_MODE=live backend python -m evaluacion.evaluar

El modo (mock/live) sale de AI_MODE. En mock solo prueba la plomería, no la calidad de la IA.
Solo las corridas LIVE guardan su resumen en evaluacion/ultimo_resultado.json (lo muestra la app vía
GET /api/evaluacion); una corrida MOCK no lo toca, para no mostrar un 8/8 simulado como si fuera calidad.
Cada caso tiene un "tipo" (normal, ambiguo, inyeccion, fuera_de_dominio, datos_sensibles, informal) y al
final se imprime un resumen por tipo.
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

import kostra  # noqa: E402
from analisis import analizar_texto  # noqa: E402

RUTA_CASOS = Path(__file__).with_name("casos.json")
RUTA_RESULTADO = Path(__file__).with_name("ultimo_resultado.json")


def revisar(caso: dict, resultado: dict) -> list[str]:
    """Devuelve la lista de motivos de falla (vacía si acertó)."""
    fallas = [
        f"{campo}: esperaba '{valor}', obtuvo '{resultado.get(campo)}'"
        for campo, valor in caso.get("esperado", {}).items()
        if resultado.get(campo) != valor
    ]
    texto_salida = f"{resultado.get('resumen', '')} {resultado.get('accion_sugerida', '')}"
    evidencia = " ".join(resultado.get("evidencia", []))
    for dato in caso.get("no_debe_contener", []):
        if dato in texto_salida:
            fallas.append(f"contiene dato prohibido '{dato}'")
        if dato in evidencia:
            fallas.append(f"la evidencia contiene dato prohibido '{dato}'")
    return fallas


def resumen_por_tipo(detalle: list[dict]) -> dict[str, dict[str, int]]:
    """{tipo: {aciertos, total}} en el orden en que aparecen los tipos en casos.json."""
    tipos: dict[str, dict[str, int]] = {}
    for caso in detalle:
        cuenta = tipos.setdefault(caso["tipo"], {"aciertos": 0, "total": 0})
        cuenta["total"] += 1
        cuenta["aciertos"] += int(caso["ok"])
    return tipos


def _total(valores: list[int | float | None]) -> int | float | None:
    """Suma solo si todos los valores se conocen (un total parcial engañaría)."""
    return sum(valores) if valores and None not in valores else None


def guardar_resumen(resumen: dict) -> None:
    try:
        RUTA_RESULTADO.write_text(json.dumps(resumen, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Resumen guardado en {RUTA_RESULTADO}")
    except OSError as error:
        print(f"No se pudo guardar el resumen ({type(error).__name__}); la app no lo mostrará.")


async def main() -> int:
    casos = json.loads(RUTA_CASOS.read_text(encoding="utf-8"))
    modo = kostra.modo_ia()
    modelo = kostra.modelo_ia() if modo == "live" else "mock"
    print(f"Modo: {modo.upper()}  |  Modelo: {kostra.modelo_ia()}  |  Casos: {len(casos)}\n")
    aciertos, latencias, detalle, usos = 0, [], [], []
    # En live, pausa entre casos para medir calidad y no la saturación de Kostra
    pausa_s = float(os.getenv("EVAL_PAUSA_S", "2")) if modo == "live" else 0
    for numero, caso in enumerate(casos):
        if numero:
            await asyncio.sleep(pausa_s)
        tipo = caso.get("tipo", "sin_tipo")
        etiqueta = f"{caso['id']} [{tipo}]"
        try:
            respuesta = await analizar_texto(caso["entrada"])
        except kostra.ErrorKostra as error:
            print(f"✘ {etiqueta}: ERROR {error.codigo} — {error.mensaje}")
            detalle.append({"id": caso["id"], "tipo": tipo, "ok": False,
                            "motivos": [f"error {error.codigo}: {error.mensaje}"], "latencia_ms": None})
            usos.append(None)
            continue
        latencias.append(respuesta.latencia_ms)
        usos.append(respuesta.uso)
        fallas = revisar(caso, respuesta.resultado.model_dump())
        detalle.append({"id": caso["id"], "tipo": tipo, "ok": not fallas, "motivos": fallas,
                        "latencia_ms": respuesta.latencia_ms})
        extra = f" ({respuesta.intentos} intentos)" if respuesta.intentos > 1 else ""
        if fallas:
            print(f"✘ {etiqueta} [{respuesta.latencia_ms} ms]{extra}: " + "; ".join(fallas))
            print(f"    criterio: {caso['criterio_falla']}")
        else:
            aciertos += 1
            print(f"✔ {etiqueta} [{respuesta.latencia_ms} ms]{extra}")
    promedio = sum(latencias) // len(latencias) if latencias else 0
    print(f"\nResultado: {aciertos}/{len(casos)} aciertos  |  latencia promedio: {promedio} ms")
    por_tipo = resumen_por_tipo(detalle)
    print("Por tipo: " + "  |  ".join(f"{t} {c['aciertos']}/{c['total']}" for t, c in por_tipo.items()))
    if modo != "live":
        print("Modo MOCK: no se actualiza el panel de calidad (solo prueba la plomería).")
        return 0 if aciertos == len(casos) else 1
    guardar_resumen(
        {
            "fecha": datetime.now().astimezone().isoformat(timespec="seconds"),
            "modo": modo,
            "modelo": modelo,
            "total": len(casos),
            "aciertos": aciertos,
            "latencia_promedio_ms": promedio,
            "tokens_entrada": _total([u.tokens_entrada if u else None for u in usos]),
            "tokens_salida": _total([u.tokens_salida if u else None for u in usos]),
            "costo_usd_estimado": _total([u.costo_usd_estimado if u else None for u in usos]),
            "costo_clp_estimado": _total([u.costo_clp_estimado if u else None for u in usos]),
            "por_tipo": por_tipo,
            "casos": detalle,
        }
    )
    return 0 if aciertos == len(casos) else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
