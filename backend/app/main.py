import logging
from pathlib import Path
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List

from backend.app.config import settings
from backend.app.fhir_parser import parse_patient_bundle
from backend.app.llm_service import generate_sbar_summary
from backend.app import mock_data

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Shift-Handoff & Nursing Note Summarizer API",
    description="Backend API for parsing patient charts and summarizing handoffs using Azure OpenAI",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DraftSaveModel(BaseModel):
    sbar: Dict[str, Any]

class ApproveModel(BaseModel):
    nurseName: str
    sbar: Dict[str, Any]

def get_patient_file_path(patient_id: str) -> Path:
    filename = ""
    if patient_id == "pat-001":
        filename = "patient_1.json"
    elif patient_id == "pat-002":
        filename = "patient_2.json"
    elif patient_id == "pat-003":
        filename = "patient_3.json"
    else:
        # Check if any file matches
        raise HTTPException(status=404, detail=f"Patient {patient_id} not found.")
        
    file_path = settings.DATA_DIR / filename
    if not file_path.exists():
        raise HTTPException(status=404, detail=f"Patient data file {filename} does not exist.")
    return file_path

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "azureOpenAiConfigured": settings.has_azure_creds,
        "azureDeployment": settings.AZURE_OPENAI_DEPLOYMENT_NAME
    }

@app.get("/api/patients")
def list_patients():
    """Lists basic demographics for all patients available in the data directory."""
    patients = []
    try:
        # Loop through patient 1 to 3
        for pid in ["pat-001", "pat-002", "pat-003"]:
            try:
                path = get_patient_file_path(pid)
                parsed = parse_patient_bundle(path)
                pat = parsed.get("patient", {})
                
                # Fetch status if approved recently
                latest_log = mock_data.get_latest_handover(pid)
                
                patients.append({
                    "id": pat.get("id"),
                    "name": pat.get("name"),
                    "age": pat.get("age"),
                    "gender": pat.get("gender"),
                    "conditions": [c.get("display") for c in parsed.get("conditions", [])[:2]],
                    "status": "Approved" if latest_log else "Pending Handoff",
                    "lastHandoffBy": latest_log.get("approvedBy") if latest_log else None,
                    "lastHandoffTime": latest_log.get("timestamp") if latest_log else None
                })
            except Exception as e:
                logger.error(f"Error loading patient {pid}: {str(e)}")
                
        return patients
    except Exception as e:
        raise HTTPException(status=500, detail=f"Failed to scan patient database: {str(e)}")

@app.get("/api/patients/{patient_id}")
def get_patient_details(patient_id: str):
    """Retrieves full parsed EHR data for a specific patient."""
    file_path = get_patient_file_path(patient_id)
    try:
        parsed_data = parse_patient_bundle(file_path)
        # Attach latest handoff log if it exists
        parsed_data["latestHandoff"] = mock_data.get_latest_handover(patient_id)
        return parsed_data
    except Exception as e:
        raise HTTPException(status=500, detail=f"Failed to parse patient bundle: {str(e)}")

@app.post("/api/patients/{patient_id}/generate-sbar")
def trigger_sbar_generation(patient_id: str):
    """Parses patient chart and runs Azure OpenAI or clinical mock to generate SBAR summary."""
    file_path = get_patient_file_path(patient_id)
    try:
        parsed_data = parse_patient_bundle(file_path)
        sbar = generate_sbar_summary(parsed_data)
        
        # Save as current draft immediately
        mock_data.save_draft(patient_id, sbar)
        
        return sbar
    except Exception as e:
        logger.error(f"Error generating SBAR summary: {str(e)}")
        raise HTTPException(status=500, detail=f"Failed to generate SBAR summary: {str(e)}")

@app.get("/api/patients/{patient_id}/draft")
def get_sbar_draft(patient_id: str):
    """Retrieves the current SBAR draft if it exists."""
    draft = mock_data.get_draft(patient_id)
    if not draft:
        return {"sbar": None}
    return {"sbar": draft}

@app.post("/api/patients/{patient_id}/draft")
def save_sbar_draft(patient_id: str, payload: DraftSaveModel):
    """Saves the SBAR draft edit by the nurse."""
    mock_data.save_draft(patient_id, payload.sbar)
    return {"status": "success", "message": "Draft saved successfully."}

@app.post("/api/patients/{patient_id}/approve")
def approve_handover(patient_id: str, payload: ApproveModel):
    """Approves and logs the final SBAR handover, clearing the draft."""
    if not payload.nurseName.strip():
        raise HTTPException(status=400, detail="Nurse signature/name is required.")
        
    try:
        log_entry = mock_data.log_handover(patient_id, payload.nurseName, payload.sbar)
        return {"status": "success", "handover": log_entry}
    except Exception as e:
        raise HTTPException(status=500, detail=f"Failed to record handover approval: {str(e)}")

@app.get("/api/patients/{patient_id}/history")
def get_handover_history(patient_id: str):
    """Returns handover log history for auditing."""
    return mock_data.get_logs(patient_id)
