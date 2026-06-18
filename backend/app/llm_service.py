import json
import logging
from typing import Dict, Any
from openai import OpenAI, AzureOpenAI
from app.config import settings
from app.prompts import SBAR_SYSTEM_PROMPT, SBAR_USER_TEMPLATE

logger = logging.getLogger(__name__)

try:
    from azure.identity import DefaultAzureCredential, get_bearer_token_provider
    HAS_AZURE_IDENTITY = True
except ImportError:
    HAS_AZURE_IDENTITY = False

def generate_mock_sbar(patient_id: str, name: str) -> Dict[str, Any]:
    """Generates high-quality clinical SBAR mocks based on synthetic patient ID for offline mode."""
    if patient_id == "pat-001":  # Robert Sterling (Post-Op CABG)
        return {
            "situation": f"Robert Sterling, 66-year-old male, Post-Op Day 2 following a 3-vessel Coronary Artery Bypass Graft (CABG). Currently stable on 2L nasal cannula, but experienced new onset sinus tachycardia during the shift.",
            "background": "Admitted for coronary artery bypass surgery. Past history of Essential Hypertension. Confirmed severe allergy to Penicillin.",
            "assessment": "Vitals: BP 134/82, HR 92 (fluctuated up to 110 bpm earlier), SpO2 96% on 2L O2 (drops to 91% on room air), Temp 37.4°C. Sternal incision is dry and intact with no active bleeding. Chest tubes have mild serosanguineous drainage (40 mL total for shift). Basal breath sounds are decreased; patient is using Incentive Spirometer (IS). Ambulated 50ft twice with PT, but requires supplemental oxygen.",
            "recommendation": "1. Maintain telemetry monitoring and track heart rate fluctuations. 2. Continue metoprolol as scheduled. 3. Encourage incentive spirometry every hour while awake. 4. Attempt to wean oxygen from 2L to room air if SpO2 remains stable above 95%.",
            "criticalAlerts": [
                "HIGH RISK: Severe allergy to Penicillin.",
                "New onset tachycardia (95-110 bpm) on shift; EKG confirmed sinus tachycardia.",
                "Requires 2L O2 to maintain SpO2 above 95%."
            ],
            "incomingTasks": [
                "Monitor telemetry closely for recurrence of tachycardia.",
                "Assess chest tube drainage at 2000 and 0000.",
                "Encourage deep breathing and incentive spirometer use hourly."
            ]
        }
    elif patient_id == "pat-002":  # Elena Chen (DKA)
        return {
            "situation": f"Elena Chen, 31-year-old female, admitted with Type 1 Diabetes Mellitus and Diabetic Ketoacidosis (DKA). Metabolic state is gradually resolving, and she is cooperative but fatigued.",
            "background": "Admitted yesterday with acute DKA. Moderate allergy to Sulfa Drugs. Currently on DKA insulin infusion protocol.",
            "assessment": "Vitals: BP 112/70, HR 104, Temp 36.8°C. Blood glucose is down to 210 mg/dL (from 320 mg/dL at shift start). Arterial pH has improved to 7.28 (up from 7.15). Active regular insulin IV infusion at 4 units/hour and maintenance IV of 0.45% NS + 20 mEq KCl at 150 mL/hour. Complained of mild nausea earlier, resolved after Ondansetron 4mg. Urine output is stable at 90 mL/hour. Reports dry mouth.",
            "recommendation": "1. Continue hourly blood glucose monitoring. 2. Maintain insulin infusion per protocol; if glucose drops below 150 mg/dL, switch fluid to D5 + 0.45% NS per DKA protocol. 3. Monitor potassium closely (current 4.0 mEq/L). 4. Draw Arterial Blood Gas (ABG) at 1900.",
            "criticalAlerts": [
                "ALLERGY: Sulfa Drugs.",
                "Active DKA protocol: insulin infusion running at 4 units/hour. Requires hourly fingersticks.",
                "Mild tachycardia (HR 104 bpm) secondary to dehydration/acidosis."
            ],
            "incomingTasks": [
                "Perform hourly blood glucose checks (next at 1800).",
                "Draw Arterial Blood Gas (ABG) at 1900.",
                "Assess electrolytes and adjust IV potassium as per lab values."
            ]
        }
    elif patient_id == "pat-003":  # Marcus Vance (COPD)
        return {
            "situation": f"Marcus Vance, 72-year-old male, admitted with an acute COPD exacerbation secondary to a mild upper respiratory infection. Currently stable on 3L nasal cannula with improved respiratory effort.",
            "background": "Admitted for acute respiratory distress. History of Chronic Obstructive Pulmonary Disease. Moderate allergy to Aspirin.",
            "assessment": "Vitals: BP 128/76, HR 88, SpO2 94% on 3L O2, Temp 37.1°C. Bilateral wheezing present, but decreased. Productive cough with thick white sputum. Received Solu-Medrol 40mg IV. Tolerated two nebulizer treatments (Albuterol + Ipratropium) well, stating breathing feels easier. Ambulated to the bathroom once with assist of 1; experienced mild transient shortness of breath.",
            "recommendation": "1. Keep oxygen at 3L nasal cannula to maintain SpO2 between 88-92% (COPD target) or up to 94% as tolerated. 2. Administer next scheduled nebulizer treatment at 1800. 3. Monitor for changes in sputum consistency or respiratory rate. 4. Attempt to wean oxygen to 2L if SpO2 remains stable.",
            "criticalAlerts": [
                "ALLERGY: Aspirin.",
                "COPD oxygen target is 88-92%. Currently at 94% on 3L O2; monitor for CO2 retention signs.",
                "Fall Risk: Ambulated with assist of 1, mild SOB on exertion."
            ],
            "incomingTasks": [
                "Administer scheduled Albuterol/Ipratropium nebulizer at 1800.",
                "Assess lung sounds pre- and post-nebulizer.",
                "Attempt to wean oxygen to 2L nasal cannula."
            ]
        }
    else:
        return {
            "situation": f"Patient {name}, demographics and current status.",
            "background": "History and active conditions. Allergies.",
            "assessment": "Vitals and active treatments.",
            "recommendation": "Plan of care and monitoring instructions.",
            "criticalAlerts": ["Monitor general status."],
            "incomingTasks": ["Complete routine assessment."]
        }

def generate_sbar_summary(patient_data: Dict[str, Any]) -> Dict[str, Any]:
    patient_info = patient_data.get("patient", {})
    patient_id = patient_info.get("id", "")
    patient_name = patient_info.get("name", "Unknown Patient")
    
    if not settings.has_azure_creds:
        logger.info("Azure OpenAI credentials not set. Falling back to clinical mock generator.")
        return generate_mock_sbar(patient_id, patient_name)

    try:
        # Prepare inputs for OpenAI
        patient_str = json.dumps(patient_info, indent=2)
        conditions_str = json.dumps(patient_data.get("conditions", []), indent=2)
        allergies_str = json.dumps(patient_data.get("allergies", []), indent=2)
        vitals_str = json.dumps(patient_data.get("vitals", {}), indent=2)
        labs_str = json.dumps(patient_data.get("labs", []), indent=2)
        medications_str = json.dumps(patient_data.get("medications", []), indent=2)
        shift_note_str = patient_data.get("shiftNote", {}).get("content", "")

        user_content = SBAR_USER_TEMPLATE.format(
            patient_info=patient_str,
            conditions=conditions_str,
            allergies=allergies_str,
            vitals=vitals_str,
            labs=labs_str,
            medications=medications_str,
            shift_note=shift_note_str
        )

        # Setup client based on authentication method: API Key vs Entra ID
        if settings.AZURE_OPENAI_API_KEY:
            logger.info("Initializing Azure OpenAI client using API Key.")
            client = AzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
        elif HAS_AZURE_IDENTITY:
            logger.info("AZURE_OPENAI_API_KEY is empty. Initializing OpenAI/AzureOpenAI client using Entra ID token provider.")
            is_gateway = "/openai/v1" in settings.AZURE_OPENAI_ENDPOINT
            scope = "https://ai.azure.com/.default" if is_gateway else "https://cognitiveservices.azure.com/.default"
            
            token_provider = get_bearer_token_provider(DefaultAzureCredential(), scope)
            
            if is_gateway:
                client = OpenAI(
                    base_url=settings.AZURE_OPENAI_ENDPOINT,
                    api_key=token_provider()
                )
            else:
                client = AzureOpenAI(
                    azure_ad_token_provider=token_provider,
                    api_version=settings.AZURE_OPENAI_API_VERSION,
                    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
                )
        else:
            raise ValueError("No API key provided and azure-identity package is not installed.")

        response = client.chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": SBAR_SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        content = response.choices[0].message.content
        return json.loads(content)

    except Exception as e:
        logger.error(f"Error calling Azure OpenAI: {str(e)}. Falling back to mock data.")
        return generate_mock_sbar(patient_id, patient_name)
