#!/usr/bin/env bash
# Prepara un Ubuntu nuevo (ECS Huawei Cloud): instala Docker, clona el repo y levanta todo.
# Uso:   sudo bash setup.sh
# Rama:  sudo RAMA=feat/base-minima bash setup.sh
# Repo privado: el servidor necesita una deploy key de solo lectura (ver infra/README.md, "Repo privado").
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/FrancoJS/zero-day.git}"
RAMA="${RAMA:-main}"
DIRECTORIO="${DIRECTORIO:-/opt/zero-day}"

if [[ $EUID -ne 0 ]]; then
  echo "Correlo con sudo: sudo bash setup.sh" >&2
  exit 1
fi

echo "==> Instalando Docker (si falta)"
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl git
  curl -fsSL https://get.docker.com | sh
fi
command -v git >/dev/null 2>&1 || apt-get install -y git

echo "==> Código en $DIRECTORIO (rama $RAMA)"
if [[ -d "$DIRECTORIO/.git" ]]; then
  git -C "$DIRECTORIO" fetch origin
  git -C "$DIRECTORIO" checkout "$RAMA"
  git -C "$DIRECTORIO" pull --ff-only origin "$RAMA"
else
  git clone --branch "$RAMA" "$REPO_URL" "$DIRECTORIO"
fi
cd "$DIRECTORIO"

# Reemplaza o agrega VARIABLE=valor en .env sin usar sed (la key puede tener caracteres especiales)
fijar_variable() {
  local nombre="$1" valor="$2"
  grep -v "^${nombre}=" .env > .env.tmp || true
  printf '%s=%s\n' "$nombre" "$valor" >> .env.tmp
  mv .env.tmp .env
}

if [[ ! -f .env ]]; then
  echo "==> Creando .env"
  cp .env.example .env
  chmod 600 .env
  fijar_variable PUERTO_WEB 80
  read -rp "¿Modo de IA? [mock/live] (mock): " modo
  if [[ "${modo:-mock}" == "live" ]]; then
    read -rsp "KOSTRA_API_KEY (no se mostrará): " clave
    echo
    fijar_variable AI_MODE live
    fijar_variable KOSTRA_API_KEY "$clave"
  fi
else
  echo "==> .env ya existe, no se modifica"
fi

echo "==> Levantando con Docker Compose"
docker compose up -d --build
docker compose ps
echo
echo "Listo. Abrí http://<EIP-del-servidor>/ (security group con puerto 80 abierto)."
echo "Logs: cd $DIRECTORIO && docker compose logs -f"
