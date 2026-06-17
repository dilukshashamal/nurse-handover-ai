# AI Shift-Handoff & Nursing Note Summarizer (PoC)

This is a clinical shift-handover application that integrates Electronic Health Records (EHR) and unstructured nursing progress notes to generate a structured SBAR (Situation, Background, Assessment, Recommendation) summary. It allows outgoing nurses to review, edit, and authorize shift handovers with real-time audit trails.

---

## 1. Project Features

- **Split-Screen EHR & SBAR Layout**: Inspired by HCA Healthcare's clinical mobile layout, it displays the patient record on the left (vitals, diagnoses, allergies, labs, medications, and raw shift progress notes) alongside the AI-generated SBAR report on the right.
- **AI-Assisted SBAR Generation**: Automates the creation of handovers from FHIR-like patient charts and unstructured shift notes using Azure OpenAI (GPT-4o).
- **Edit & Approve Workflow**: Outgoing nurses can refine generated summaries, toggle checklists, and sign their names to authorize handovers.
- **Audit Trails**: All approved handovers are permanently logged with timestamps and signatures.
- **Production-Ready Terraform (IaC)**: Deploy the entire stack to Azure including Azure OpenAI, Cosmos DB, FHIR API, and App Services.

---

## 2. Recommended Production Architecture (Azure)

The production stack recommended for this application is built entirely on Microsoft Azure's secure clinical cloud:

- **Frontend**: React SPA hosted on **Azure App Service** or **Azure Static Web Apps**.
- **Backend**: Python FastAPI hosted on **Azure App Service** or **Azure Container Apps**.
- **AI Engine**: **Azure OpenAI Service (GPT-4o)** for clinical summary orchestration.
- **Data Ingestion**: **Azure Health Data Services (FHIR API)** to store and integrate EHR records.
- **Session & History Storage**: **Azure Cosmos DB (SQL/NoSQL API)**.
- **Infrastructure as Code**: **Terraform** for repeatable configurations.

---

## 3. Local Development Setup

To run the PoC locally, make sure you have:
- Python 3.10+
- Node.js 18+

### Step 1: Clone & Configure Environments

Create a `.env` file in the root directory (or rename `.env.example`):
```env
# Server Config
PORT=8000
HOST=127.0.0.1

# Azure OpenAI (Optional - Falls back to high-quality clinical mocks if empty)
AZURE_OPENAI_API_KEY="your-key-here"
AZURE_OPENAI_ENDPOINT="https://your-endpoint.openai.azure.com/"
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o"
AZURE_OPENAI_API_VERSION="2024-02-15-preview"
```

### Step 2: Run the FastAPI Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   python run.py
   ```
   The backend API will run at `http://127.0.0.1:8000`.

### Step 3: Run the Vite React Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The frontend UI will run at `http://localhost:5173`. Open this URL in your web browser.

---

## 4. Deploying to Azure via Terraform

All configuration files are available in `/terraform`.

1. Install Terraform CLI and Azure CLI.
2. Log in to your Azure account:
   ```bash
   az login
   ```
3. Initialize Terraform:
   ```bash
   cd terraform
   terraform init
   ```
4. Copy `terraform.tfvars.example` to `terraform.tfvars` and update variables as needed.
5. Review the plan:
   ```bash
   terraform plan
   ```
6. Apply the changes:
   ```bash
   terraform apply
   ```
   Terraform will create all required resource groups, Azure OpenAI deployments, Cosmos DB, FHIR instances, and deploy App Services.
