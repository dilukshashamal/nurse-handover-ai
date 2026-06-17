output "resource_group_name" {
  value       = azurerm_resource_group.rg.name
  description = "The name of the resource group."
}

output "backend_url" {
  value       = "https://${azurerm_linux_web_app.backend.default_hostname}"
  description = "The URL of the FastAPI backend."
}

output "frontend_url" {
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
  description = "The URL of the React frontend."
}

output "cosmosdb_endpoint" {
  value       = azurerm_cosmosdb_account.cosmos.endpoint
  description = "The endpoint of the Cosmos DB account."
}

output "openai_endpoint" {
  value       = azurerm_cognitive_account.openai.endpoint
  description = "The endpoint of the Azure OpenAI service."
}

output "fhir_endpoint" {
  value       = "https://fhir-${var.project_name}-${var.environment}.azurehealthcareapis.com"
  description = "The endpoint of the FHIR API service."
}
