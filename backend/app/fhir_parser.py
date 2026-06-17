import json
import base64
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

def calculate_age(birth_date_str: str) -> int:
    try:
        birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
        today = datetime.today()
        return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    except Exception:
        return 0

def parse_patient_bundle(file_path: Path) -> Dict[str, Any]:
    with open(file_path, "r", encoding="utf-8") as f:
        bundle = json.load(f)
        
    patient_info = {}
    conditions = []
    allergies = []
    vitals = {}
    labs = []
    medications = []
    raw_note = ""
    note_title = ""

    # Parse each resource entry in the bundle
    for entry in bundle.get("entry", []):
        resource = entry.get("resource", {})
        resource_type = resource.get("resourceType")
        
        if resource_type == "Patient":
            name_info = resource.get("name", [{}])[0]
            family = name_info.get("family", "")
            given = " ".join(name_info.get("given", []))
            birth_date = resource.get("birthDate", "")
            
            patient_info = {
                "id": resource.get("id"),
                "name": f"{given} {family}".strip(),
                "family": family,
                "given": given,
                "gender": resource.get("gender", "unknown").capitalize(),
                "birthDate": birth_date,
                "age": calculate_age(birth_date),
                "phone": resource.get("telecom", [{}])[0].get("value", "N/A")
            }
            
        elif resource_type == "Condition":
            display = resource.get("code", {}).get("coding", [{}])[0].get("display", "Unknown Condition")
            code = resource.get("code", {}).get("coding", [{}])[0].get("code", "")
            conditions.append({"code": code, "display": display, "status": resource.get("clinicalStatus", "active")})
            
        elif resource_type == "AllergyIntolerance":
            substance = resource.get("substance", {}).get("coding", [{}])[0].get("display", "Unknown Allergen")
            criticality = resource.get("criticality", "low")
            allergies.append({"substance": substance, "criticality": criticality})
            
        elif resource_type == "Observation":
            # Check if it is a vital sign
            categories = [c.get("coding", [{}])[0].get("code") for c in resource.get("category", [])]
            code_display = resource.get("code", {}).get("coding", [{}])[0].get("display", "")
            code_val = resource.get("code", {}).get("coding", [{}])[0].get("code", "")
            
            if "vital-signs" in categories or "vital-signs" in [c.get("coding", [{}])[0].get("display", "").lower() for c in resource.get("category", [])]:
                effective_time = resource.get("effectiveDateTime", "")
                
                # Check for blood pressure (which has components)
                if "Blood Pressure" in code_display or code_val == "85354-9":
                    systolic = 0
                    diastolic = 0
                    for comp in resource.get("component", []):
                        comp_display = comp.get("code", {}).get("coding", [{}])[0].get("display", "")
                        comp_code = comp.get("code", {}).get("coding", [{}])[0].get("code", "")
                        if "Systolic" in comp_display or comp_code == "8480-6":
                            systolic = comp.get("valueQuantity", {}).get("value", 0)
                        elif "Diastolic" in comp_display or comp_code == "8462-4":
                            diastolic = comp.get("valueQuantity", {}).get("value", 0)
                    vitals["Blood Pressure"] = f"{systolic}/{diastolic} mmHg"
                else:
                    val = resource.get("valueQuantity", {}).get("value")
                    unit = resource.get("valueQuantity", {}).get("unit", "")
                    vitals[code_display] = f"{val} {unit}"
            else:
                # Treat as laboratory measurement
                val = resource.get("valueQuantity", {}).get("value")
                unit = resource.get("valueQuantity", {}).get("unit", "")
                effective_time = resource.get("effectiveDateTime", "")
                labs.append({
                    "name": code_display,
                    "value": f"{val} {unit}" if val is not None else "N/A",
                    "time": effective_time
                })
                
        elif resource_type == "MedicationRequest":
            med_name = resource.get("medicationCodeableConcept", {}).get("coding", [{}])[0].get("display", "Unknown Medication")
            instructions = resource.get("dosageInstruction", [{}])[0].get("text", "No dosage instructions provided.")
            medications.append({"name": med_name, "instructions": instructions, "status": resource.get("status", "active")})
            
        elif resource_type == "DocumentReference":
            # Extract shift progress note
            content_info = resource.get("content", [{}])[0]
            attachment = content_info.get("attachment", {})
            note_title = attachment.get("title", "Shift Note")
            
            b64_data = attachment.get("data", "")
            if b64_data:
                try:
                    # Decode base64
                    decoded_bytes = base64.b64decode(b64_data)
                    raw_note = decoded_bytes.decode("utf-8")
                except Exception as e:
                    raw_note = f"[Error decoding shift note]: {str(e)}"
            else:
                raw_note = attachment.get("url", "No shift note text found.")

    return {
        "patient": patient_info,
        "conditions": conditions,
        "allergies": allergies,
        "vitals": vitals,
        "labs": labs,
        "medications": medications,
        "shiftNote": {
            "title": note_title,
            "content": raw_note
        }
    }
