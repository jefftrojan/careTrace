#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# CareTrace OS — HuggingFace Spaces Deploy Script
#
# Usage:
#   ./deploy-hf.sh backend          # deploy only the backend Space
#   ./deploy-hf.sh frontend         # deploy only the frontend Space
#   ./deploy-hf.sh all              # deploy both
#
# Prerequisites:
#   pip install huggingface_hub
#   huggingface-cli login
# ─────────────────────────────────────────────────────────────────────────────

set -e

HF_USER="trojan0x"
BACKEND_SPACE="$HF_USER/caretrace-backend"
FRONTEND_SPACE="$HF_USER/caretrace-frontend"

deploy_backend() {
  echo ""
  echo "▶ Deploying backend to $BACKEND_SPACE ..."

  # Upload Dockerfile (backend variant)
  huggingface-cli upload "$BACKEND_SPACE" Dockerfile.backend Dockerfile --repo-type space

  # Upload source directories
  huggingface-cli upload "$BACKEND_SPACE" backend backend --repo-type space
  huggingface-cli upload "$BACKEND_SPACE" mcp_server mcp_server --repo-type space

  # Upload Space README (triggers rebuild)
  huggingface-cli upload "$BACKEND_SPACE" spaces/backend/README.md README.md --repo-type space

  echo "✓ Backend deployed → https://huggingface.co/spaces/$BACKEND_SPACE"
  echo ""
  echo "  ⚠  Set this secret in Space Settings → Variables and secrets:"
  echo "     GITHUB_TOKEN = <your GitHub PAT with models:read scope>"
}

deploy_frontend() {
  echo ""
  echo "▶ Deploying frontend to $FRONTEND_SPACE ..."

  # Upload Dockerfile (frontend variant)
  huggingface-cli upload "$FRONTEND_SPACE" Dockerfile.frontend Dockerfile --repo-type space

  # Upload frontend source
  huggingface-cli upload "$FRONTEND_SPACE" frontend frontend --repo-type space

  # Upload Space README (triggers rebuild)
  huggingface-cli upload "$FRONTEND_SPACE" spaces/frontend/README.md README.md --repo-type space

  echo "✓ Frontend deployed → https://huggingface.co/spaces/$FRONTEND_SPACE"
}

case "${1:-all}" in
  backend)  deploy_backend ;;
  frontend) deploy_frontend ;;
  all)      deploy_backend; deploy_frontend ;;
  *)
    echo "Usage: $0 [backend|frontend|all]"
    exit 1
    ;;
esac

echo ""
echo "Done. HuggingFace will now build the Docker images."
echo "Build logs: https://huggingface.co/spaces/$HF_USER/caretrace-backend/logs"
