#!/bin/bash
# EventRent.az — Server Deploy Script
# Run this on the server after uploading the ZIP
# Usage: bash deploy.sh

set -e

APP="eventrent"
DATASTORE="/datastore/${APP}"
APP_DIR="${DATASTORE}/app"
ZIP_PATH="${DATASTORE}/${APP}.zip"

echo "=== EventRent Deploy ==="

# 1) Dizinlər yarat
mkdir -p "${DATASTORE}/uploads"
mkdir -p "${DATASTORE}/nginx-logs"
mkdir -p "${DATASTORE}/data"
mkdir -p "${APP_DIR}"

# 2) ZIP aç
echo "→ ZIP açılır..."
cd "${DATASTORE}"
unzip -o "${ZIP_PATH}" -d "${APP_DIR}"
# macOS artifacts təmizlə
find "${APP_DIR}" -name '__MACOSX' -exec rm -rf {} + 2>/dev/null || true
find "${APP_DIR}" -name '._*' -delete 2>/dev/null || true

# 3) Nested dir varsa düzəlt
INNER=$(ls "${APP_DIR}" | head -1)
if [ -d "${APP_DIR}/${INNER}" ] && [ "$(ls "${APP_DIR}" | wc -l)" -eq 1 ]; then
  mv "${APP_DIR}/${INNER}"/* "${APP_DIR}/"
  rm -rf "${APP_DIR}/${INNER}"
fi

cd "${APP_DIR}"

# 4) npm install (backend deps)
echo "→ npm install..."
npm ci --omit=dev

# 5) Frontend build (əgər dist yoxdursa)
if [ ! -d "dist" ]; then
  echo "→ Frontend build..."
  npm ci
  npm run build
fi

# 6) Docker image-ları build et
echo "→ Backend image build..."
docker build -t eventrent-backend:latest -f Dockerfile.backend "${APP_DIR}"

echo "→ Frontend image build..."
docker build -t eventrent-frontend:latest -f Dockerfile.frontend "${APP_DIR}"

# 7) /datastore/eventrent/data içinə DB kopyala (ilk deploy)
if [ ! -f "${DATASTORE}/data/eventrent.db" ] && [ -f "${APP_DIR}/data/eventrent.db" ]; then
  cp "${APP_DIR}/data/eventrent.db" "${DATASTORE}/data/eventrent.db"
  echo "→ DB kopyalandı"
fi

echo ""
echo "=== Build tamamlandı ==="
echo "Portainer-dən stack deploy edin: docker-compose.yml"
echo "Və ya: docker compose -f ${APP_DIR}/docker-compose.yml up -d"