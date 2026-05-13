"""
CareTrace Backend — FastAPI + LangGraph orchestration
Exposes REST endpoints for the Next.js frontend.
"""

import json
import sys
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
from typing import Optional, Annotated
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict
import httpx

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "mcp_server"))
from server import extract_medical_entities, build_fhir_bundle, _ollama_json, TIMELINE_SCHEMA

app = FastAPI(title="CareTrace API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HAPI_FHIR_URL = os.getenv("HAPI_FHIR_URL", "http://localhost:8080/fhir")


# ── LangGraph State ────────────────────────────────────────────────────────────

class CareTraceState(TypedDict):
    documents: list[str]
    patient_name: str
    patient_id: Optional[str]
    fhir_base_url: Optional[str]
    extracted_entities: list[dict]
    merged_entities: dict
    fhir_bundle: dict
    fhir_server_response: Optional[dict]
    timeline: list[dict]
    risks: list[dict]
    clinical_summary: str
    primary_diagnosis: str
    care_trajectory: str
    entity_counts: dict


# ── Graph Nodes ────────────────────────────────────────────────────────────────

def node_extract(state: CareTraceState) -> dict:
    extracted = []
    for doc in state["documents"]:
        raw = extract_medical_entities(
            doc, state.get("patient_id"), state.get("fhir_base_url")
        )
        try:
            extracted.append(json.loads(raw))
        except Exception:
            pass

    merged: dict = {
        "diagnoses": [], "medications": [], "labs": [],
        "procedures": [], "allergies": [], "encounters": [],
    }
    for e in extracted:
        for key in merged:
            merged[key].extend(e.get(key, []))

    return {"extracted_entities": extracted, "merged_entities": merged}


def node_fhir_build(state: CareTraceState) -> dict:
    raw = build_fhir_bundle(
        json.dumps(state["merged_entities"]),
        state["patient_name"],
        state.get("patient_id"),
        state.get("fhir_base_url"),
    )
    result = json.loads(raw)
    return {
        "fhir_bundle": result.get("bundle", {}),
        "fhir_server_response": result.get("fhir_server"),
    }


def node_timeline(state: CareTraceState) -> dict:
    # Use already-extracted entities — no re-extraction
    merged = state["merged_entities"]
    prompt = (
        f"You are a senior clinician. Patient: {state['patient_name']}\n\n"
        f"EXTRACTED HISTORY:\n{json.dumps(merged, indent=2)}\n\n"
        "1. Build a chronological timeline of key medical events.\n"
        "2. Identify clinical risks: medication gaps, missing follow-ups, conflicting diagnoses, deteriorating trends.\n"
        "3. Write a 3-5 sentence physician-ready clinical summary.\n"
        "4. State the primary diagnosis and care trajectory."
    )
    analysis = _ollama_json(prompt, TIMELINE_SCHEMA)
    return {
        "timeline": analysis.get("timeline", []),
        "risks": analysis.get("risks", []),
        "clinical_summary": analysis.get("clinical_summary", ""),
        "primary_diagnosis": analysis.get("primary_diagnosis", ""),
        "care_trajectory": analysis.get("care_trajectory", ""),
        "entity_counts": {k: len(v) for k, v in merged.items()},
    }


def node_post_fhir(state: CareTraceState) -> dict:
    if not state.get("fhir_bundle"):
        return {}
    try:
        r = httpx.post(
            f"{HAPI_FHIR_URL}/",
            json=state["fhir_bundle"],
            headers={"Content-Type": "application/fhir+json"},
            timeout=10,
        )
        return {"fhir_server_response": {"status": r.status_code, "posted": True}}
    except Exception as e:
        return {"fhir_server_response": {"error": str(e), "posted": False}}


# ── Build Graph ────────────────────────────────────────────────────────────────

def build_graph():
    g = StateGraph(CareTraceState)
    g.add_node("extract", node_extract)
    g.add_node("fhir_build", node_fhir_build)
    g.add_node("timeline", node_timeline)
    g.add_node("post_fhir", node_post_fhir)

    g.set_entry_point("extract")
    g.add_edge("extract", "fhir_build")
    g.add_edge("fhir_build", "timeline")
    g.add_edge("timeline", "post_fhir")
    g.add_edge("post_fhir", END)

    return g.compile()


graph = build_graph()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "CareTrace", "version": "1.0.0"}


@app.post("/api/reconstruct")
async def reconstruct(
    patient_name: Annotated[str, Form()],
    patient_id: Annotated[Optional[str], Form()] = None,
    files: list[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one document required")

    documents = []
    for f in files:
        content = await f.read()
        try:
            documents.append(content.decode("utf-8"))
        except UnicodeDecodeError:
            documents.append(content.decode("latin-1"))

    initial_state: CareTraceState = {
        "documents": documents,
        "patient_name": patient_name,
        "patient_id": patient_id,
        "fhir_base_url": HAPI_FHIR_URL,
        "extracted_entities": [],
        "merged_entities": {},
        "fhir_bundle": {},
        "fhir_server_response": None,
        "timeline": [],
        "risks": [],
        "clinical_summary": "",
        "primary_diagnosis": "",
        "care_trajectory": "",
        "entity_counts": {},
    }

    result = graph.invoke(initial_state)

    return {
        "patient_name": result["patient_name"],
        "patient_id": result.get("patient_id"),
        "documents_processed": len(result["documents"]),
        "timeline": result["timeline"],
        "risks": result["risks"],
        "clinical_summary": result["clinical_summary"],
        "primary_diagnosis": result["primary_diagnosis"],
        "care_trajectory": result["care_trajectory"],
        "entity_counts": result["entity_counts"],
        "fhir_bundle": result["fhir_bundle"],
        "fhir_server": result.get("fhir_server_response"),
    }


@app.get("/api/fhir/proxy/{path:path}")
async def fhir_proxy(path: str):
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(f"{HAPI_FHIR_URL}/{path}", timeout=10)
            return r.json()
        except Exception as e:
            return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
