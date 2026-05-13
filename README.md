# CareTrace

**AI-powered Clinical Timeline Reconstruction**

CareTrace transforms fragmented patient documents — discharge summaries, lab reports, referral notes, medication lists, radiology reports — into a coherent longitudinal clinical history with structured FHIR R4 output, risk detection, and a physician-ready narrative.

Built for the **[Agents Assemble: Healthcare AI Endgame Challenge](https://promptopinion.com)** on the Prompt Opinion platform.

---

## The Problem

Patient history is scattered across hospitals, PDFs, labs, handwritten notes, and different EHRs. Clinicians waste critical time reconstructing "what actually happened to this patient."

## The Solution

Upload multiple fragmented clinical documents. CareTrace produces:

- **Chronological timeline** of key medical events
- **FHIR R4 Bundle** — Patient, Condition, MedicationStatement, Observation, Encounter, AllergyIntolerance
- **Risk flags** — medication gaps, missing follow-ups, conflicting diagnoses, deteriorating trends
- **Physician-ready narrative** summary and care trajectory

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Next.js Frontend                    │
│         Upload · Timeline · Risks · FHIR            │
└──────────────────────┬──────────────────────────────┘
                       │ POST /api/reconstruct
┌──────────────────────▼──────────────────────────────┐
│            FastAPI Backend (LangGraph)               │
│                                                      │
│  [extract] → [fhir_build] → [timeline] → [post_fhir]│
└───────────┬──────────────────────────────────────────┘
            │
    ┌────────┴──────────┬────────────────┐
    │                   │                │
┌───▼──────────┐  ┌─────▼──────┐  ┌─────▼─────┐
│  MCP Server  │  │  AI Layer  │  │   HAPI    │
│  (FastMCP)   │  │            │  │  FHIR R4  │
│              │  │ GitHub     │  │  :8080    │
│  3 tools     │  │ Models  OR │  └───────────┘
│  SHARP ctx   │  │ Ollama     │
└──────────────┘  └────────────┘
```

---

## MCP Tools (Prompt Opinion Superpowers)

The MCP server exposes 3 SHARP-context-enabled tools, published to the Prompt Opinion Marketplace.

### `extract_medical_entities`
Extracts structured clinical entities from unstructured text.
- **Input:** Raw document text + optional `patient_id`, `fhir_base_url`
- **Output:** JSON — diagnoses (ICD-10), medications, labs, procedures, allergies, encounters

### `build_fhir_bundle`
Converts extracted entities into a valid FHIR R4 transaction Bundle.
- **Input:** Entities JSON, patient name, optional SHARP context
- **Output:** FHIR R4 Bundle + optional live POST to HAPI FHIR server

### `reconstruct_patient_timeline`
The core tool — full pipeline from raw documents to clinical intelligence.
- **Input:** List of document texts, patient name, optional SHARP context
- **Output:** Timeline events, risk flags, FHIR bundle, clinical summary, care trajectory

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker
- GitHub token (for GitHub Models) **or** Ollama

### 1. Clone and install

```bash
git clone https://github.com/jefftrojan/caretrace.git
cd caretrace

python3 -m venv venv && source venv/bin/activate
pip install -r mcp_server/requirements.txt -r backend/requirements.txt

cd frontend && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env
```

**Option A — GitHub Models (fast, cloud-based):**
```env
AI_PROVIDER=github
GITHUB_TOKEN=your_github_pat_here
GITHUB_MODEL=gpt-4o-mini
```

**Option B — Ollama (local, zero data egress):**
```env
AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2:3b
```

### 3. Start all services

```bash
docker compose up -d          # HAPI FHIR on :8080
source venv/bin/activate
python backend/main.py &      # Backend API on :8000
cd frontend && npm run dev    # Frontend on :3000
```

Open **http://localhost:3000**

---

## Demo

Upload the 5 sample files from `sample_data/` — James Okonkwo's diabetic nephropathy journey:

| File | Event |
|---|---|
| `discharge_summary.txt` | March 2024 — DKA admission, new T2DM diagnosis |
| `lab_report.txt` | July 2024 — creatinine doubled, HbA1c 9.8% |
| `referral_note.txt` | August 2024 — nephrology referral, Metformin concern |
| `medication_list.txt` | September 2024 — Metformin stopped, SGLT2i started |
| `radiology_report.txt` | October 2024 — bilateral small kidneys on ultrasound |

**Output:** 8-event timeline, HIGH risk flag for renal deterioration, 59 FHIR resources, clinical narrative.

---

## Prompt Opinion Integration

### Running the MCP Server

```bash
source venv/bin/activate
cd mcp_server && python server.py
```

Configure in Prompt Opinion:
- **Transport:** stdio
- **Command:** `python server.py`
- **Working directory:** `mcp_server/`

### SHARP Context

All tools propagate SHARP context through multi-agent call chains:

```json
{
  "patient_id": "fhir-patient-uuid",
  "fhir_base_url": "https://your-fhir-server/fhir"
}
```

When invoked from the Prompt Opinion platform, SHARP context is automatically injected from the active EHR session.

---

## AI Providers

| Provider | Latency (5 docs) | Data stays local | Use case |
|---|---|---|---|
| GitHub Models (`gpt-4o-mini`) | ~60s | No (Azure) | Demo, dev |
| Ollama (`llama3.2:3b`) | ~5 min | Yes | HIPAA, air-gapped |

Switch with `AI_PROVIDER=github` or `AI_PROVIDER=ollama` in `.env`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| MCP Server | Python + FastMCP |
| Agent Orchestration | LangGraph |
| AI | GitHub Models / Ollama |
| FHIR | HAPI FHIR R4 (Docker) |
| API | FastAPI + uvicorn |
| Frontend | Next.js 15 + Tailwind CSS |
| Standard | MCP + SHARP context propagation |

---

## Project Structure

```
caretrace/
├── mcp_server/
│   ├── server.py          # FastMCP — 3 SHARP-enabled tools
│   ├── mcp_config.json    # Prompt Opinion marketplace config
│   └── requirements.txt
├── backend/
│   ├── main.py            # FastAPI + LangGraph graph
│   └── requirements.txt
├── frontend/
│   └── app/page.tsx       # Upload · Timeline · Risks · FHIR viewer
├── sample_data/           # 5 demo clinical documents
├── docker-compose.yml     # HAPI FHIR server
├── start.sh
└── .env.example
```

---

## License

MIT
