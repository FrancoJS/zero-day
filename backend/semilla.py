"""Semilla de reportes simulados (odd/contrato-api.md).

Uso:
  docker compose exec backend python -m semilla

Crea ~10 reportes de ejemplo (`simulado=True`) repartidos en los sectores de Rancagua,
analizados con el modo actual (`AI_MODE=mock` o `live`). Si ya hay reportes simulados, no duplica.
"""

import asyncio
import sys

from dotenv import load_dotenv

load_dotenv()

import bd  # noqa: E402
import modelos  # noqa: E402
from analisis import analizar_texto, ocultar_datos_sensibles  # noqa: E402

REPORTES_SEMILLA: list[tuple[str, str]] = [
    (
        "sur",
        "Botaron escombros y un colchón en la esquina del pasaje Los Aromos con Av. España, junto al colegio. Los niños tienen que pasar por la calle.",
    ),
    (
        "poniente",
        "Están quemando basura en el sitio junto al canal en Av. Baquedano, sale mucho humo negro hacia las casas.",
    ),
    (
        "surponiente",
        "Dejaron bidones de aceite quemado y baterías viejas en el sitio eriazo al final de la calle, se están derramando.",
    ),
    (
        "oriente",
        "Hay un sillón viejo y un refrigerador malo botados en la esquina del pasaje hace más de una semana, montón enorme.",
    ),
    (
        "sur",
        "Mucha basura acumulada, bolsas rotas y cartones en la vereda de calle Carrera hace una semana.",
    ),
    (
        "centro",
        "Hay un montón de bolsas de basura tiradas en la plaza de calle Estado desde el fin de semana, ya huele muy mal.",
    ),
    (
        "nororiente",
        "Dejaron ramas de poda y pasto seco en la vereda de la avenida; se puede pasar pero estorba a los vecinos.",
    ),
    (
        "sur",
        "Dejaron bolsas de basura domiciliaria en la esquina junto al paradero de locomoción.",
    ),
    (
        "norte",
        "Tiraron sacos de cemento, ladrillos rotos y escombros de construcción en la vereda frente a la cancha.",
    ),
    (
        "suroriente",
        "Botaron un sofá roto y bolsas de basura en la esquina de la avenida principal hace varios días.",
    ),
]


async def cargar_semilla() -> int:
    if not bd.bd_activa() or not bd.preparar_tablas():
        print("Error: la base de datos no está disponible. Revisa DATABASE_URL.", file=sys.stderr)
        return 1

    existentes = modelos.contar_reportes_simulados()
    if existentes > 0:
        print(f"Semilla omitida: ya existen {existentes} reportes simulados en la base de datos.")
        return 0

    creados = 0
    for sector_id, texto in REPORTES_SEMILLA:
        respuesta = await analizar_texto(texto)
        texto_limpio = ocultar_datos_sensibles(texto)
        reporte = modelos.crear_reporte(texto_limpio, sector_id, respuesta, simulado=True)
        creados += 1
        print(
            f"[{creados}/{len(REPORTES_SEMILLA)}] Reporte #{reporte.id} ({reporte.sector.nombre}) -> "
            f"tipo={reporte.analisis.resultado.tipo_residuo}, prioridad={reporte.analisis.resultado.prioridad}"
        )

    print(f"Listo: {creados} reportes simulados creados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(cargar_semilla()))
