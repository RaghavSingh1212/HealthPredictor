#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "Starting MongoDB via Docker..."
  docker compose -f "$ROOT/docker-compose.yml" up -d mongodb
  export USE_IN_MEMORY_DB=false
  export MONGO_URI="mongodb://root:example@localhost:27017/med_db?authSource=admin"
else
  echo "Docker unavailable — using in-memory MongoDB for local dev."
fi

cd "$BACKEND"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
.venv/bin/pip install -q -r requirements.txt

echo "Starting API on http://localhost:8000"
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 2
if ! curl -sf http://localhost:8000/healthz >/dev/null; then
  echo "Backend failed to start. Check logs above."
  exit 1
fi

cd "$FRONTEND"
echo "Starting frontend on http://localhost:3000"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Med Triage System is running:"
echo "  Patient chat:       http://localhost:3000"
echo "  Clinician dashboard: http://localhost:3000/dashboard"
echo "  API health:         http://localhost:8000/healthz"
echo ""
echo "Press Ctrl+C to stop."

wait
