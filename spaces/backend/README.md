---
title: CareTrace OS — Backend
emoji: 🏥
colorFrom: red
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# CareTrace OS — Backend API

FastAPI + LangGraph multi-agent clinical timeline reconstruction engine.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/reconstruct` | Reconstruct patient timeline from documents |
| GET | `/api/fhir/proxy/{path}` | FHIR server proxy |

## Required Secrets (set in Space Settings → Variables and secrets)

| Name | Description |
|------|-------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token with `models:read` scope |

## Environment (pre-configured in Dockerfile)

| Name | Value |
|------|-------|
| `AI_PROVIDER` | `github` |
| `GITHUB_MODEL` | `gpt-4o-mini` |
| `HAPI_FHIR_URL` | `https://hapi.fhir.org/baseR4` |
| `PORT` | `7860` |
