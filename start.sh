#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "🟢 Starting CareTrace..."

# HAPI FHIR
echo "  → Starting HAPI FHIR server (port 8080)..."
docker compose up -d hapi-fhir 2>/dev/null && echo "  ✓ HAPI FHIR starting" || echo "  ⚠ Docker unavailable, skipping FHIR server"

# Backend
echo "  → Starting CareTrace backend (port 8000)..."
source venv/bin/activate
cd backend
python main.py &
BACKEND_PID=$!
echo "  ✓ Backend PID: $BACKEND_PID"

# Frontend
echo "  → Starting frontend (port 3000)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CareTrace is running"
echo "  Frontend:    http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  FHIR Server: http://localhost:8080/fhir"
echo "  API Docs:    http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Press Ctrl+C to stop all services"

wait
