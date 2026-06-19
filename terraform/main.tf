data "azurerm_client_config" "current" {}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location
  
  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# 1. Azure OpenAI Service Account
resource "azurerm_cognitive_account" "openai" {
  name                  = "cog-openai-nh-${var.environment}"
  location              = var.location
  resource_group_name   = azurerm_resource_group.rg.name
  kind                  = "OpenAI"
  sku_name              = "S0"
  custom_subdomain_name = "cog-openai-nh-${var.environment}"
  
  tags = {
    Environment = var.environment
  }
}

# Deploy GPT-4o Model inside Azure OpenAI
resource "azurerm_cognitive_deployment" "gpt_model" {
  name                 = var.openai_model_name
  cognitive_account_id = azurerm_cognitive_account.openai.id
  
  model {
    format  = "OpenAI"
    name    = var.openai_model_name
    version = var.openai_model_version
  }

  scale {
    type     = "Standard"
    capacity = 30 # 30K Tokens per minute
  }
}

# 2. Azure Cosmos DB Account
resource "azurerm_cosmosdb_account" "cosmos" {
  name                = "cosmos-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  geo_location {
    location          = var.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }
  
  tags = {
    Environment = var.environment
  }
}

# Cosmos DB Database
resource "azurerm_cosmosdb_sql_database" "db" {
  name                = "nurse_handover_db"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
}

# Cosmos DB Container for Handover Logs & Sessions
resource "azurerm_cosmosdb_sql_container" "handover_logs" {
  name                = "handover_logs"
  resource_group_name = azurerm_resource_group.rg.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.db.name
  partition_key_path  = "/patientId"
}

# 3. Azure Health Data Services (FHIR API Workspace & Service)
resource "azurerm_healthcare_workspace" "fhir_workspace" {
  name                = "hwsnh${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_healthcare_fhir_service" "fhir" {
  name                = "fhirnh${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  workspace_id        = azurerm_healthcare_workspace.fhir_workspace.id
  kind                = "fhir-R4"

  authentication {
    authority = "https://login.microsoftonline.com/${data.azurerm_client_config.current.tenant_id}"
    audience  = "https://hwsnh${var.environment}-fhirnh${var.environment}.fhir.azurehealthcareapis.com"
  }
}

# 4. App Service Plan (Linux)
resource "azurerm_service_plan" "app_plan" {
  name                = "asp-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = var.app_service_plan_sku
}

# 5. Linux Web App - Python Backend (FastAPI)
resource "azurerm_linux_web_app" "backend" {
  name                = "app-backend-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.app_plan.id

  site_config {
    always_on        = false # Set to true if using B1 plan or above in production
    app_command_line = "gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.app.main:app"
    
    application_stack {
      python_version = "3.10"
    }
  }

  app_settings = {
    "PORT"                         = "8000"
    "AZURE_OPENAI_API_KEY"         = azurerm_cognitive_account.openai.primary_access_key
    "AZURE_OPENAI_ENDPOINT"        = azurerm_cognitive_account.openai.endpoint
    "AZURE_OPENAI_DEPLOYMENT_NAME" = azurerm_cognitive_deployment.gpt_model.name
    "AZURE_OPENAI_API_VERSION"     = "2024-02-15-preview"
    
    # Cosmos DB integration
    "COSMOS_ENDPOINT"              = azurerm_cosmosdb_account.cosmos.endpoint
    "COSMOS_KEY"                   = azurerm_cosmosdb_account.cosmos.primary_key
    
    # FHIR API integration
    "FHIR_URL"                     = "https://hwsnh${var.environment}-fhirnh${var.environment}.fhir.azurehealthcareapis.com"
  }
}

# 6. Linux Web App - React Frontend
resource "azurerm_linux_web_app" "frontend" {
  name                = "app-frontend-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.app_plan.id

  site_config {
    always_on = false
    
    application_stack {
      node_version = "18-lts"
    }
  }

  app_settings = {
    # Point the React client-side code to the Backend App Service URL
    "VITE_API_URL" = "https://${azurerm_linux_web_app.backend.default_hostname}"
  }
}
