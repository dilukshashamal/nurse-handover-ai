variable "project_name" {
  type        = string
  description = "A naming prefix used for all resources to ensure uniqueness."
  default     = "nurse-handover"
}

variable "environment" {
  type        = string
  description = "Deployment environment name (e.g. dev, staging, prod)."
  default     = "dev"
}

variable "location" {
  type        = string
  description = "Azure region where resources will be created. Use regions that support Azure OpenAI and FHIR services."
  default     = "eastus2"
}

variable "app_service_plan_sku" {
  type        = string
  description = "The SKU size for the App Service Plan (e.g., B1, P1v2)."
  default     = "B1"
}

variable "openai_model_name" {
  type        = string
  description = "Model name to deploy in Azure OpenAI."
  default     = "gpt-4o"
}

variable "openai_model_version" {
  type        = string
  description = "Model version to deploy."
  default     = "2024-11-20" # Or standard gpt-4o version
}
