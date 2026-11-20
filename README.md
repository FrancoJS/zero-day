# Zero Day — Hackatón Huawei INACAP 2026

Base del equipo para construir un agente con IA en pocas horas: **FastAPI** (`backend/`) + **React, Vite y Tailwind** (`frontend/`) + **Postgres**, todo con Docker Compose. La IA corre en **Kostra** (`deepseek-v4.1-flash`) en modo `live`, o simulada en modo `mock`. Incluye un flujo de ejemplo (texto → JSON validado con evidencia verificada), streaming, manejo de errores, evaluación de calidad con casos, costo estimado por análisis y un kit de componentes. El sistema de diseño (tokens, clases y reglas, hoy el sistema municipal de Rancagua) vive en [`skills/design.skill`](./skills/design.skill).

Reglas y guía para agentes: [AGENTS.md](./AGENTS.md) · Pitch según la rúbrica: [PITCH.md](./PITCH.md) · Servidor con Terraform: [infra/README.md](./infra/README.md)

## Levantar en local

```bash
cp .env.example .env          # luego, a mano: AI_MODE=live y KOSTRA_API_KEY=...
docker compose up -d --build
```

| URL | Qué es |
|---|---|
| http://localhost:5173 | la app (arriba a la derecha: **Kostra LIVE** o **MOCK** y el estado de la BD) |
| http://localhost:5173/?galeria | **galería del kit**: todos los componentes con datos de ejemplo |
| http://localhost:8000/docs | Swagger del backend |

Postgres arranca por defecto y el backend se conecta solo. Para no usar BD: `DATABASE_URL=` (vacía) en `.env`. Si la BD falla, el análisis funciona igual.

## Mañana: crear el repo del evento desde esta plantilla

```bash
git clone git@github.com:FrancoJS/zero-day-base.git zero-day && cd zero-day
rm -rf .git && git init -b main && git add . && git commit -m "chore: base inicial Zero Day"
gh repo create zero-day --public --source . --remote origin --push
```

Se clona (no se copia la carpeta) para que **no viaje el `.env`** con la key. Después, cambiar `REPO_URL` en `setup.sh` por la URL HTTPS del repo nuevo.

## Levantar en el servidor (repo público)

```bash
# en tu PC: crear el servidor (ver infra/README.md) y entrar
ssh root@<IP>
# en el servidor
curl -fsSLO https://raw.githubusercontent.com/<usuario>/<repo>/main/setup.sh
sudo REPO_URL=https://github.com/<usuario>/<repo>.git bash setup.sh
```

`setup.sh` instala Docker, clona en `/opt/zero-day`, pide el modo y la key de Kostra (sin mostrarla) y deja la app en `http://<IP>/` (~2 min, probado en una VM Ubuntu 22.04). Para actualizar tras un `git push`: repetir el último comando (hace pull y no toca `.env`).

## Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/health` | modo de IA, modelo y estado de la BD |
| POST | `/api/ia/analizar` | `{texto}` → JSON validado (+1 reintento), evidencia verificada, `uso` (tokens y costo estimado), `guardado` |
| POST | `/api/ia/stream` | `{texto}` → SSE con eventos `fragmento`, `fin` o `error` |
| GET | `/api/historial?limite=10` | últimos análisis guardados en la BD |
| GET | `/api/evaluacion` | última evaluación **live** para el panel de calidad |

Errores siempre como `{codigo, mensaje}` en español. Para ver un error en la UI sin gastar créditos: `MOCK_ERROR=402` (o 401, 403, 429, timeout) con `AI_MODE=mock`.

## Pruebas y calidad

```bash
docker compose exec backend python -m unittest discover -s pruebas        # 54 pruebas, ~5 s, sin red
docker compose exec -e AI_MODE=live backend python -m evaluacion.evaluar  # casos por categoría contra Kostra real
```

La evaluación imprime `X/N aciertos` por categoría y actualiza el panel de calidad de la app (solo las corridas live). Base actual: **7/8, 2,9 s promedio, ≈ $0,40 CLP por análisis** (falla `fuera_de_dominio` hasta definir el dominio del desafío en el prompt).

## Problemas comunes

| Mensaje / síntoma | Qué hacer |
|---|---|
| `key_invalida` (401) | revisar `KOSTRA_API_KEY` en `.env` (sin espacios ni comillas) y `docker compose up -d` |
| `saldo_agotado` (402) | usar otra key de regalo o `AI_MODE=mock` |
| `limite_alcanzado` (429) | esperar y reintentar; no usar la key de la demo para agentes |
| `timeout` | Kostra tardó más de 90 s: reintentar o acortar el texto |
| "BD con error" | `docker compose ps` (¿`base_datos` arriba?) y revisar `DATABASE_URL`; el análisis sigue funcionando |
| El `.env` no se aplica | `docker compose up -d` (recrea el backend) |
| Puerto ocupado | cambiar `PUERTO_WEB` en `.env` |

```bash
docker compose logs -f backend    # ver errores
docker compose down               # detener (down -v borra también la BD)
```
