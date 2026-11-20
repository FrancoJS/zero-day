# Contrato de la API de reportes (S9) — v2

Fuente única para backend (T2) y frontend (T4, T5). Si hay que cambiarlo, se cambia **aquí primero** con acuerdo de los dos.
Todo lo que no está aquí (`/api/health`, `/api/ia/*`, `/api/historial`, `/api/evaluacion`) sigue igual.
Errores: siempre `{"codigo": "...", "mensaje": "..."}` en español, como el resto de la API.

**Código fuente del contrato:** los modelos Pydantic están en `backend/esquemas.py` (sección "Contrato de la API de reportes": `Sector`, `SolicitudBorrador`, `RespuestaBorrador`, `SolicitudReporte`, `Reporte`, `RespuestaBandeja`, `SolicitudDecision`…) y el catálogo en `backend/sectores.py`. El backend los usa como `response_model`; el frontend usa la misma forma en `frontend/src/datosEjemplo.js`.

**v2 (diseño 04 y 03):** `ResultadoAnalisis` suma `ubicacion` y `pregunta_seguimiento`; nuevo `POST /api/reportes/borrador` para el chat del vecino; el mapa del encargado es Leaflet + OpenStreetMap con `lat`/`lng` de `por_sector`.

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
      "ubicacion": "pasaje Los Aromos con Av. España",
      "pregunta_seguimiento": "¿Cabe en una camioneta o se necesita un camión?",
      "evidencia": ["junto al colegio", "los cabros tienen que pasar por la calle"]
    },
    "modo": "live",
    "modelo": "deepseek-v4.1-flash",
    "latencia_ms": 2900,
    "evidencia_descartada": 0
  }
}
```
- `resultado` es exactamente `ResultadoAnalisis` de `backend/esquemas.py`. `ubicacion` y `pregunta_seguimiento` pueden ser `null`.
- `texto` se guarda **con RUT, teléfonos y correos reemplazados por `[dato oculto]`** (mismo patrón `PATRONES_SENSIBLES` de `analisis.py`). El análisis se hace sobre el texto original; la evidencia ya excluye datos personales, así que se puede resaltar en el texto guardado.
- `estado`: `pendiente` · `aprobado` · `rechazado`. `decidido_en` y `nota_decision` son `null` mientras está pendiente.
- `reportes_en_sector`: cuántos reportes **pendientes** hay en el mismo sector (coincidencia exacta de `sector.id`), incluido este.
- `simulado`: `true` para los reportes de ejemplo cargados con la semilla.

## Endpoints

### `GET /api/sectores` → `200`
`{ "sectores": [Sector, …] }`

### `POST /api/reportes/borrador` (chat del vecino — analiza **sin guardar**)
Cuerpo: `{ "texto": "…", "sector_id": "sur" | null }`. `texto` = todo lo que escribió el vecino en el chat, en orden, unido con saltos de línea (mensaje inicial + cada respuesta). No hay memoria en el servidor: cada turno manda el texto acumulado.
- `200` → `{ "analisis": RespuestaAnalisis, "completo": bool }` (`RespuestaAnalisis` = la misma de `/api/ia/analizar`).
- `completo` = `sector_id` válido **y** `falta_informacion` vacía. El frontend habilita "Enviar a Gestión de Calidad" solo si es `true` (o si el vecino ya respondió 2 preguntas: no se le pregunta más de 2 veces).
- La burbuja del asistente muestra `resumen` y, si existe, `pregunta_seguimiento`. Si no hay sector, el frontend pregunta el sector con botones (los 8 del catálogo), sin llamar a la IA.
- `422` `{"codigo": "sector_invalido"}` si `sector_id` no es `null` y no existe. Errores de la IA iguales a `/api/ia/analizar`.
- El panel "Tu reporte" se llena **en vivo** en el frontend: al llegar la respuesta muestra los campos uno por uno (≈250 ms cada uno, sin animación con `prefers-reduced-motion`).

### `POST /api/reportes` (vista vecino: envío final)
Cuerpo: `{ "texto": "…", "sector_id": "centro" }` (`texto` = el mismo texto acumulado del chat, 1–4000 caracteres). Se **vuelve a analizar** en el servidor (nunca se confía en el análisis que trae el cliente).
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
- `por_sector`: solo sectores con al menos un reporte; `prioridad_max` se calcula sobre los **pendientes** (`null` si no hay pendientes). Es lo que usa el mapa (S6): Leaflet + OpenStreetMap, un marcador por sector en `lat`/`lng` (color por `prioridad_max`, número = `pendientes`); clic = filtrar con `sector_id`. Si los tiles no cargan (sin internet), se muestra la lista por sector con un aviso.
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
