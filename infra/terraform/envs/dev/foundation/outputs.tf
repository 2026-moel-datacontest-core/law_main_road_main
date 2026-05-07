output "project_id" {
  description = "GCP project id."
  value       = var.project_id
}

output "region" {
  description = "Primary region."
  value       = var.region
}

output "enabled_services" {
  description = "Post-bootstrap project APIs managed by this root."
  value       = module.project_services.enabled_services
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository id."
  value       = module.artifact_registry.repository_id
}

output "artifact_registry_name" {
  description = "Artifact Registry full resource name. Treat as internal cloud inventory."
  value       = module.artifact_registry.repository_name
}

output "artifact_registry_location" {
  description = "Artifact Registry location."
  value       = module.artifact_registry.location
}

output "frontend_service_account_email" {
  description = "Frontend runtime service account email. Treat as internal cloud inventory."
  value       = module.iam.service_account_emails["frontend"]
}

output "backend_service_account_email" {
  description = "Backend runtime service account email. Treat as internal cloud inventory."
  value       = module.iam.service_account_emails["backend"]
}

output "github_actions_service_account_email" {
  description = "Future GitHub Actions service account email. Treat as internal cloud inventory."
  value       = module.iam.service_account_emails["github_actions"]
}

output "terraform_service_account_email" {
  description = "Terraform service account email. Treat as internal cloud inventory."
  value       = module.iam.service_account_emails["terraform"]
}

output "terraform_service_account_roles" {
  description = "Project roles granted to the Terraform service account."
  value       = module.iam.terraform_service_account_roles
}

output "artifact_bucket_name" {
  description = "Private artifact bucket name. Treat as internal cloud inventory."
  value       = module.artifact_bucket.bucket_name
}

output "artifact_bucket_url" {
  description = "Private artifact bucket URL. Treat as internal cloud inventory."
  value       = module.artifact_bucket.bucket_url
}

output "secret_names" {
  description = "Secret Manager resource names keyed by logical name. Values are not managed by Terraform."
  value       = module.secrets.secret_names
}

output "secret_ids" {
  description = "Secret ids keyed by logical name. Values are not managed by Terraform."
  value       = module.secrets.secret_ids
}
