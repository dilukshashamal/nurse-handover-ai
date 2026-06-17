from typing import Dict, Any, List
from datetime import datetime

# Store active SBAR summaries (in-progress drafts)
# Key: patient_id, Value: SBAR JSON
active_drafts: Dict[str, Any] = {}

# Store handover history (auditable records)
# Key: patient_id, Value: List of handover logs
handover_logs: Dict[str, List[Dict[str, Any]]] = {}

def get_latest_handover(patient_id: str) -> Dict[str, Any] or None:
    logs = handover_logs.get(patient_id, [])
    if logs:
        return logs[-1]
    return None

def save_draft(patient_id: str, sbar_content: Dict[str, Any]):
    active_drafts[patient_id] = sbar_content

def get_draft(patient_id: str) -> Dict[str, Any] or None:
    return active_drafts.get(patient_id)

def log_handover(patient_id: str, nurse_name: str, sbar_content: Dict[str, Any]) -> Dict[str, Any]:
    log_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "approvedBy": nurse_name,
        "content": sbar_content
    }
    
    if patient_id not in handover_logs:
        handover_logs[patient_id] = []
        
    handover_logs[patient_id].append(log_entry)
    
    # Remove from active drafts once approved
    if patient_id in active_drafts:
        del active_drafts[patient_id]
        
    return log_entry

def get_logs(patient_id: str) -> List[Dict[str, Any]]:
    return handover_logs.get(patient_id, [])
