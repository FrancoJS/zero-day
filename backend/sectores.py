"""Catálogo fijo de sectores de Rancagua (odd/contrato-api.md). SIMULADO: nombres genéricos y
coordenadas aproximadas (sin GPS). Se pueden ajustar nombres y coordenadas; los `id` no cambian."""

from esquemas import Sector

SECTORES: list[Sector] = [
    Sector(id="centro", nombre="Centro", lat=-34.1705, lng=-70.7407),
    Sector(id="norte", nombre="Rancagua Norte", lat=-34.1540, lng=-70.7420),
    Sector(id="sur", nombre="Rancagua Sur", lat=-34.1890, lng=-70.7390),
    Sector(id="oriente", nombre="Oriente", lat=-34.1690, lng=-70.7180),
    Sector(id="poniente", nombre="Poniente", lat=-34.1720, lng=-70.7650),
    Sector(id="nororiente", nombre="Nororiente", lat=-34.1560, lng=-70.7210),
    Sector(id="suroriente", nombre="Suroriente", lat=-34.1870, lng=-70.7200),
    Sector(id="surponiente", nombre="Surponiente", lat=-34.1880, lng=-70.7620),
]

POR_ID: dict[str, Sector] = {s.id: s for s in SECTORES}


def buscar_sector(sector_id: str | None) -> Sector | None:
    return POR_ID.get(sector_id) if sector_id else None
