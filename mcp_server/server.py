#!/usr/bin/env python3
"""
CareTrace MCP Server — Clinical Timeline Reconstruction
Exposes 3 tools via MCP for use in the Prompt Opinion platform.
"""

import json
import os
import uuid
from datetime import datetime
from typing import Optional
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    "CareTrace",
    instructions=(
        "CareTrace reconstructs fragmented patient history into coherent clinical timelines. "
        "Use extract_medical_entities on raw clinical text, build_fhir_bundle to create FHIR R4 "
        "resources, and reconstruct_patient_timeline to produce the full clinical narrative from "
        "multiple documents. All tools support SHARP context (patient_id, fhir_base_url)."
    ),
)

# AI provider: "github" uses GitHub Models (fast, cloud), "ollama" uses local Ollama
AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_MODEL = os.getenv("GITHUB_MODEL", "gpt-4o-mini")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")


def _schema_to_example(schema: dict) -> str:
    """Generate a compact JSON template from a schema to guide the model."""
    props = schema.get("properties", {})
    example = {}
    for key, val in props.items():
        if val.get("type") == "array":
            item_props = val.get("items", {}).get("properties", {})
            example[key] = [{k: f"<{k}>" for k in item_props}] if item_props else []
        elif val.get("type") == "string":
            example[key] = f"<{key}>"
    return json.dumps(example, indent=2)


def _github_json(prompt: str, schema: dict) -> dict:
    """Call GitHub Models via OpenAI-compatible API with embedded schema template."""
    try:
        from openai import OpenAI
        client = OpenAI(
            base_url="https://models.inference.ai.azure.com",
            api_key=GITHUB_TOKEN,
        )
        schema_template = _schema_to_example(schema)
        system_msg = (
            "You are a clinical NLP extraction system. "
            "Respond ONLY with a JSON object that follows this exact structure:\n"
            f"{schema_template}\n\n"
            "Fill in ALL fields with data extracted from the clinical document. "
            "Use empty arrays [] if a category has no data. Never omit keys."
        )
        resp = client.chat.completions.create(
            model=GITHUB_MODEL,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as exc:
        return {"error": str(exc)}


def _ollama_json(prompt: str, schema: dict) -> dict:
    """Call either GitHub Models or Ollama depending on AI_PROVIDER env var."""
    if AI_PROVIDER == "github":
        return _github_json(prompt, schema)
    try:
        import ollama as _ollama
        resp = _ollama.chat(
            model=OLLAMA_MODEL,
            messages=[{"role": "user", "content": prompt}],
            format=schema,
            options={"temperature": 0.1},
        )
        return json.loads(resp.message.content)
    except Exception as exc:
        return {"error": str(exc)}


# ── Tool 1: Entity Extraction ──────────────────────────────────────────────────

ENTITY_SCHEMA = {
    "type": "object",
    "properties": {
        "diagnoses": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "condition": {"type": "string"},
                    "date": {"type": "string"},
                    "status": {"type": "string"},
                    "icd10": {"type": "string"},
                },
                "required": ["condition"],
            },
        },
        "medications": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "dose": {"type": "string"},
                    "frequency": {"type": "string"},
                    "start_date": {"type": "string"},
                    "status": {"type": "string"},
                },
                "required": ["name"],
            },
        },
        "labs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "test": {"type": "string"},
                    "value": {"type": "string"},
                    "unit": {"type": "string"},
                    "date": {"type": "string"},
                    "flag": {"type": "string"},
                },
                "required": ["test"],
            },
        },
        "procedures": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "date": {"type": "string"},
                    "result": {"type": "string"},
                },
                "required": ["name"],
            },
        },
        "allergies": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "substance": {"type": "string"},
                    "reaction": {"type": "string"},
                },
                "required": ["substance"],
            },
        },
        "encounters": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string"},
                    "date": {"type": "string"},
                    "location": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["type"],
            },
        },
    },
    "required": ["diagnoses", "medications", "labs", "procedures", "allergies", "encounters"],
}


@mcp.tool()
def extract_medical_entities(
    document_text: str,
    patient_id: Optional[str] = None,
    fhir_base_url: Optional[str] = None,
) -> str:
    """
    Extract structured medical entities from unstructured clinical text using local AI.
    Identifies diagnoses, medications, labs, procedures, allergies, and encounters with dates.
    Supports SHARP context propagation via patient_id and fhir_base_url.

    Args:
        document_text: Raw clinical document (discharge summary, lab report, referral, etc.)
        patient_id: SHARP — FHIR patient ID for context propagation
        fhir_base_url: SHARP — FHIR server base URL

    Returns:
        JSON string of extracted clinical entities
    """
    prompt = (
        "You are a clinical NLP system. Extract ALL medical entities from this document. "
        "Include every diagnosis, medication, lab result, procedure, allergy, and encounter. "
        "Include dates whenever mentioned. For ICD-10, provide the best matching code.\n\n"
        f"CLINICAL DOCUMENT:\n{document_text}"
    )
    result = _ollama_json(prompt, ENTITY_SCHEMA)
    result["_sharp"] = {
        "patient_id": patient_id,
        "fhir_base_url": fhir_base_url,
        "extracted_at": datetime.utcnow().isoformat(),
    }
    return json.dumps(result, indent=2)


# ── Tool 2: FHIR Bundle Builder ────────────────────────────────────────────────

@mcp.tool()
def build_fhir_bundle(
    entities_json: str,
    patient_name: str,
    patient_id: Optional[str] = None,
    fhir_base_url: Optional[str] = None,
) -> str:
    """
    Convert extracted medical entities into a valid FHIR R4 Bundle.
    Creates Patient, Condition, MedicationStatement, Observation, Encounter,
    and AllergyIntolerance resources. Optionally POSTs to a FHIR server.

    Args:
        entities_json: JSON from extract_medical_entities
        patient_name: Patient full name
        patient_id: SHARP — FHIR patient ID (auto-generated if not provided)
        fhir_base_url: SHARP — FHIR server URL (for live POST if provided)

    Returns:
        FHIR R4 Bundle JSON string
    """
    try:
        entities = json.loads(entities_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid entities JSON"})

    pid = patient_id or str(uuid.uuid4())
    base = fhir_base_url or "urn:caretrace"
    now = datetime.utcnow().isoformat() + "Z"
    entries = []

    def _iso_date(raw: str) -> Optional[str]:
        """Normalize any date string to YYYY-MM-DD for FHIR compliance."""
        if not raw:
            return None
        import re
        # Already ISO
        if re.match(r"^\d{4}-\d{2}-\d{2}", raw):
            return raw[:10]
        # Try parsing natural language dates
        months = {
            "january": "01", "february": "02", "march": "03", "april": "04",
            "may": "05", "june": "06", "july": "07", "august": "08",
            "september": "09", "october": "10", "november": "11", "december": "12",
            "jan": "01", "feb": "02", "mar": "03", "apr": "04",
            "jun": "06", "jul": "07", "aug": "08",
            "sep": "09", "oct": "10", "nov": "11", "dec": "12",
        }
        m = re.search(r"(\w+)\s+(\d{1,2}),?\s+(\d{4})", raw, re.IGNORECASE)
        if m:
            mon = months.get(m.group(1).lower())
            if mon:
                return f"{m.group(3)}-{mon}-{int(m.group(2)):02d}"
        # Year only
        m = re.match(r"^(\d{4})$", raw.strip())
        if m:
            return f"{m.group(1)}-01-01"
        return None

    # Patient
    entries.append({
        "fullUrl": f"{base}/Patient/{pid}",
        "resource": {
            "resourceType": "Patient",
            "id": pid,
            "meta": {"source": "caretrace"},
            "name": [{"use": "official", "text": patient_name}],
        },
    })

    # Conditions
    for dx in entities.get("diagnoses", []):
        cid = str(uuid.uuid4())
        res = {
            "resourceType": "Condition",
            "id": cid,
            "clinicalStatus": {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                    "code": dx.get("status", "active").lower(),
                }]
            },
            "subject": {"reference": f"Patient/{pid}"},
            "code": {
                "text": dx.get("condition", ""),
                "coding": [{
                    "system": "http://hl7.org/fhir/sid/icd-10",
                    "code": dx.get("icd10", ""),
                    "display": dx.get("condition", ""),
                }] if dx.get("icd10") else [],
            },
            "recordedDate": now,
        }
        if _iso_date(dx.get("date", "")):
            res["onsetDateTime"] = _iso_date(dx["date"])
        entries.append({"fullUrl": f"{base}/Condition/{cid}", "resource": res})

    # MedicationStatements
    _med_status_map = {
        "active": "active", "current": "active", "ongoing": "active", "new": "active",
        "initiated": "active", "started": "active", "continued": "active",
        "stopped": "stopped", "discontinued": "stopped", "ceased": "stopped",
        "completed": "completed", "finished": "completed",
        "on-hold": "on-hold", "held": "on-hold", "paused": "on-hold",
        "intended": "intended", "planned": "intended",
    }
    for med in entities.get("medications", []):
        mid = str(uuid.uuid4())
        raw_status = (med.get("status") or "active").lower().strip()
        status = _med_status_map.get(raw_status, "unknown")
        res = {
            "resourceType": "MedicationStatement",
            "id": mid,
            "status": status,
            "subject": {"reference": f"Patient/{pid}"},
            "medicationCodeableConcept": {"text": med.get("name", "")},
            "dateAsserted": now,
        }
        if med.get("dose") or med.get("frequency"):
            res["dosage"] = [{"text": f"{med.get('dose','')} {med.get('frequency','')}".strip()}]
        if _iso_date(med.get("start_date", "")):
            res["effectiveDateTime"] = _iso_date(med["start_date"])
        entries.append({"fullUrl": f"{base}/MedicationStatement/{mid}", "resource": res})

    # Observations (labs)
    for lab in entities.get("labs", []):
        oid = str(uuid.uuid4())
        res = {
            "resourceType": "Observation",
            "id": oid,
            "status": "final",
            "subject": {"reference": f"Patient/{pid}"},
            "code": {"text": lab.get("test", "")},
            "effectiveDateTime": _iso_date(lab.get("date", "")) or now,
        }
        if lab.get("value"):
            if lab.get("unit"):
                res["valueQuantity"] = {"value": lab["value"], "unit": lab.get("unit", "")}
            else:
                res["valueString"] = lab["value"]
        if lab.get("flag"):
            res["interpretation"] = [{"text": lab["flag"]}]
        entries.append({"fullUrl": f"{base}/Observation/{oid}", "resource": res})

    # Encounters
    for enc in entities.get("encounters", []):
        eid = str(uuid.uuid4())
        res = {
            "resourceType": "Encounter",
            "id": eid,
            "status": "finished",
            "class": {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "AMB",
            },
            "subject": {"reference": f"Patient/{pid}"},
            "type": [{"text": enc.get("type", "")}],
        }
        if _iso_date(enc.get("date", "")):
            res["period"] = {"start": _iso_date(enc["date"])}
        if enc.get("reason"):
            res["reasonCode"] = [{"text": enc["reason"]}]
        if enc.get("location"):
            res["serviceProvider"] = {"display": enc["location"]}
        entries.append({"fullUrl": f"{base}/Encounter/{eid}", "resource": res})

    # AllergyIntolerances
    for allergy in entities.get("allergies", []):
        aid = str(uuid.uuid4())
        res = {
            "resourceType": "AllergyIntolerance",
            "id": aid,
            "clinicalStatus": {
                "coding": [{
                    "system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                    "code": "active",
                }]
            },
            "patient": {"reference": f"Patient/{pid}"},
            "code": {"text": allergy.get("substance", "")},
        }
        if allergy.get("reaction"):
            res["reaction"] = [{"description": allergy["reaction"]}]
        entries.append({"fullUrl": f"{base}/AllergyIntolerance/{aid}", "resource": res})

    # Build as transaction bundle so HAPI FHIR accepts the POST
    tx_entries = []
    for entry in entries:
        resource = entry["resource"]
        rtype = resource["resourceType"]
        rid = resource["id"]
        tx_entries.append({
            **entry,
            "request": {"method": "PUT", "url": f"{rtype}/{rid}"},
        })

    bundle = {
        "resourceType": "Bundle",
        "id": str(uuid.uuid4()),
        "type": "transaction",
        "timestamp": now,
        "meta": {"source": "caretrace-mcp"},
        "entry": tx_entries,
    }

    # POST to HAPI FHIR server
    fhir_server_status = None
    if fhir_base_url and fhir_base_url.startswith("http"):
        try:
            import httpx
            r = httpx.post(
                fhir_base_url,
                json=bundle,
                headers={"Content-Type": "application/fhir+json", "Accept": "application/fhir+json"},
                timeout=15,
            )
            fhir_server_status = {"status": r.status_code, "posted": r.status_code in (200, 201)}
        except Exception as e:
            fhir_server_status = {"error": str(e), "posted": False}

    result = {"bundle": bundle, "resource_count": len(entries)}
    if fhir_server_status:
        result["fhir_server"] = fhir_server_status
    return json.dumps(result, indent=2)


# ── Tool 3: Full Timeline Reconstruction ──────────────────────────────────────

TIMELINE_SCHEMA = {
    "type": "object",
    "properties": {
        "timeline": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "date": {"type": "string"},
                    "event": {"type": "string"},
                    "category": {"type": "string"},
                    "significance": {"type": "string"},
                },
                "required": ["date", "event", "category"],
            },
        },
        "risks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "type": {"type": "string"},
                    "description": {"type": "string"},
                    "severity": {"type": "string"},
                    "recommendation": {"type": "string"},
                },
                "required": ["type", "description", "severity"],
            },
        },
        "clinical_summary": {"type": "string"},
        "primary_diagnosis": {"type": "string"},
        "care_trajectory": {"type": "string"},
    },
    "required": ["timeline", "risks", "clinical_summary"],
}


@mcp.tool()
def reconstruct_patient_timeline(
    documents: list,
    patient_name: str,
    patient_id: Optional[str] = None,
    fhir_base_url: Optional[str] = None,
) -> str:
    """
    CORE TOOL — Reconstruct a complete patient clinical timeline from multiple
    fragmented clinical documents. This is CareTrace's primary capability.

    Ingests discharge summaries, lab reports, referral notes, medication lists,
    and radiology reports to produce a unified chronological clinical history,
    FHIR R4 Bundle, risk flags, and a physician-ready narrative.

    Args:
        documents: List of raw clinical document texts
        patient_name: Patient full name
        patient_id: SHARP — FHIR patient ID
        fhir_base_url: SHARP — FHIR server base URL

    Returns:
        JSON with timeline, risks, clinical_summary, fhir_bundle, and entity counts
    """
    merged = {
        "diagnoses": [], "medications": [], "labs": [],
        "procedures": [], "allergies": [], "encounters": [],
    }

    for doc in documents:
        raw = extract_medical_entities(doc, patient_id, fhir_base_url)
        try:
            extracted = json.loads(raw)
            for key in merged:
                merged[key].extend(extracted.get(key, []))
        except Exception:
            pass

    fhir_raw = build_fhir_bundle(
        json.dumps(merged), patient_name, patient_id, fhir_base_url
    )
    fhir_result = json.loads(fhir_raw)

    prompt = (
        f"You are a senior clinician. Patient: {patient_name}\n\n"
        f"EXTRACTED HISTORY:\n{json.dumps(merged, indent=2)}\n\n"
        "1. Build a chronological timeline of key medical events.\n"
        "2. Identify clinical risks: medication gaps, missing follow-ups, conflicting diagnoses, deteriorating trends.\n"
        "3. Write a 3–5 sentence physician-ready clinical summary.\n"
        "4. State the primary diagnosis and care trajectory."
    )
    analysis = _ollama_json(prompt, TIMELINE_SCHEMA)

    return json.dumps(
        {
            "patient_name": patient_name,
            "patient_id": patient_id,
            "documents_processed": len(documents),
            "timeline": analysis.get("timeline", []),
            "risks": analysis.get("risks", []),
            "clinical_summary": analysis.get("clinical_summary", ""),
            "primary_diagnosis": analysis.get("primary_diagnosis", ""),
            "care_trajectory": analysis.get("care_trajectory", ""),
            "fhir_bundle": fhir_result.get("bundle", {}),
            "fhir_server": fhir_result.get("fhir_server"),
            "entity_counts": {k: len(v) for k, v in merged.items()},
            "_sharp": {
                "patient_id": patient_id,
                "fhir_base_url": fhir_base_url,
                "reconstructed_at": datetime.utcnow().isoformat(),
            },
        },
        indent=2,
    )


if __name__ == "__main__":
    mcp.run()
