# Contrato de la API de reportes (S9)

Fuente única para backend (T2) y frontend (T4, T5). Si hay que cambiarlo, se cambia **aquí primero** con acuerdo de los dos.
Todo lo que no está aquí (`/api/health`, `/api/ia/*`, `/api/historial`, `/api/evaluacion`) sigue igual.
Errores: siempre `{"codigo": "...", "mensaje": "..."}` en español, como el resto de la API.

## Datos

**Sector** (catálogo fijo en el backend, **simulado**: coordenadas aproximadas, sin GPS)
```json
{ "id": "centro", "nombre": "Centro", "lat": -34.1705, "lng": -70.7407 }
```
Catálogo inicial (el backend puede ajustar coordenadas, no los `id`):

| id | nombre | lat | lng |
|---|---|---|---|
| `centro` | Centro | -34.1705 | -70.7407 |
| `norte` | Rancagua Norte | -34.1540 | -70.7420 |
| `sur` | Rancagua Sur | -34.1890 | -70.7390 |
| `oriente` | Oriente | -34.1690 | -70.7180 |
| `poniente` | Poniente | -34.1720 | -70.7650 |
| `nororiente` | Nororiente | -34.1560 | -70.7210 |
| `suroriente` | Suroriente | -34.1870 | -70.7200 |
| `surponiente` | Surponiente | -34.1880 | -70.7620 |

**Reporte**
```json
{
  "id": 12,
  "texto": "Botaron escombros y un colchón en la esquina, junto al colegio…",
  "sector": { "id": "centro", "nombre": "Centro" },
  "creado_en": "2026-11-20T13:05:00Z",
  "simulado": false,
  "estado": "pendiente",
  "decidido_en": null,
  "nota_decision": null,
  "reportes_en_sector": 3,
  "analisis": {
    "resultado": {
      "tipo_residuo": "mixto",
      "peligrosidad": "media",
      "prioridad": "alta",
      "accion_sugerida": "camion_tolva",
      "resumen": "Escombros y colchón junto a un colegio; obliga a los niños a pasar por la calle.",
      "falta_informacion": ["volumen aproximado"],
      "evidencia": ["junto al colegio", "los cabros tienen que pasar por la calle"]
    },
    "modo": "live",
    "modelo": "deepseek-v4.1-flash",
    "latencia_ms": 2900,
    "evidencia_descartada": 0
  }
}
```
- `resultado` es exactamente `ResultadoAnalisis` de `backend/esquemas.py`.
- `texto` se guarda **con RUT, teléfonos y correos reemplazados por `[dato oculto]`** (mismo patrón `PATRONES_SENSIBLES` de `analisis.py`). El análisis se hace sobre el texto original; la evidencia ya excluye datos personales, así que se puede resaltar en el texto guardado.
- `estado`: `pendiente` · `aprobado` · `rechazado`. `decidido_en` y `nota_decision` son `null` mientras está pendiente.
- `reportes_en_sector`: cuántos reportes **pendientes** hay en el mismo sector (coincidencia exacta de `sector.id`), incluido este.
- `simulado`: `true` para los reportes de ejemplo cargados con la semilla.

## Endpoints

### `GET /api/sectores` → `200`
`{ "sectores": [Sector, …] }`

### `POST /api/reportes` (vista vecino)
Cuerpo: `{ "texto": "…", "sector_id": "centro" }` (`texto` 1–4000 caracteres, como `/api/ia/analizar`).
- `201` → `Reporte` (ya analizado y guardado).
- `422` `{"codigo": "sector_invalido"}` si el sector no existe; `422` normal si falta el texto.
- Errores de la IA: los mismos códigos y estados que `/api/ia/analizar` (`key_invalida`, `saldo_agotado`, `limite_alcanzado`, `timeout`…). **No se guarda** un reporte sin análisis.
- `503` `{"codigo": "bd_no_disponible"}` si la BD falla: aquí guardar **es** el objetivo, así que no se responde 201 sin guardar.

### `GET /api/reportes?estado=pendiente&sector_id=centro` (vista encargado)
Ambos parámetros son opcionales (`estado` por defecto: todos). Límite: 100 reportes.
```json
{
  "reportes": [Reporte, …],
  "por_sector": [
    { "sector_id": "centro", "nombre": "Centro", "lat": -34.1705, "lng": -70.7407,
      "pendientes": 3, "total": 4, "prioridad_max": "alta" }
  ]
}
```
- Orden de `reportes`: `pendiente` primero; dentro, prioridad `alta` → `media` → `baja`; a igual prioridad, el **más antiguo** primero (lleva más tiempo esperando).
- `por_sector`: solo sectores con al menos un reporte; `prioridad_max` se calcula sobre los **pendientes** (`null` si no hay pendientes). Es lo que usa el mapa (S6).
- `503` `{"codigo": "bd_no_disponible"}` si la BD falla.

### `POST /api/reportes/{id}/decision` (aprobar o rechazar el despacho — **simulado**)
Cuerpo: `{ "decision": "aprobar" | "rechazar", "nota": "opcional, máx. 200" }`.
- `200` → `Reporte` actualizado (`estado` `aprobado` o `rechazado`, `decidido_en`, `nota_decision`).
- `404` `{"codigo": "reporte_no_encontrado"}` · `409` `{"codigo": "ya_decidido"}` si no está pendiente.
- No se despacha nada real: solo se registra la decisión. La UI lo dice ("despacho simulado").

## Semilla de datos simulados

`docker compose exec backend python -m semilla` crea ~10 reportes de ejemplo (`simulado: true`) repartidos en los sectores, analizados con el modo actual (en live gasta ≈ 10 análisis, ≈ $4 CLP). Si ya hay reportes simulados, no duplica. La UI marca los simulados con una insignia **SIMULADO**.

## Mientras el backend no está

El frontend trabaja con datos de ejemplo con **esta misma forma** (un archivo `frontend/src/datosEjemplo.js` o similar) y cambia a la API real sin tocar los componentes.
