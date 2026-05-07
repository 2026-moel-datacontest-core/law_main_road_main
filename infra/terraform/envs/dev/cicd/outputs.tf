output "project_id" {
  description = "GCP project id."
  value       = var.project_id
}

output "region" {
  description = "Primary region."
  value       = var.region
}

output "github_repository" {
  description = "Private GitHub repository allowed by the WIF provider."
  value       = var.github_repository
}

output "allowed_github_environments" {
  description = "GitHub environments allowed by the WIF provider."
  value       = sort(tolist(var.allowed_github_environments))
}

output "allowed_github_refs" {
  description = "Git refs allowed by the WIF provider."
  value       = sort(tolist(var.allowed_github_refs))
}

output "allowed_github_workflow_refs" {
  description = "GitHub workflow refs allowed by the WIF provider."
  value       = sort(tolist(var.allowed_github_workflow_refs))
}

output "workload_identity_provider_name" {
  description = "WIF provider resource name for google-github-actions/auth. Treat as internal cloud inventory."
  value       = module.github_wif.workload_identity_provider_name
}

output "github_actions_service_account_email" {
  description = "GitHub Actions keyless deploy service account email. Treat as internal cloud inventory."
  value       = local.foundation_outputs.github_actions_service_account_email
}

output "terraform_service_account_email" {
  description = "Terraform execution service account email. Treat as internal cloud inventory."
  value       = local.foundation_outputs.terraform_service_account_email
}

output "artifact_registry_repository" {
  description = "Artifact Registry Docker repository id."
  value       = local.foundation_outputs.artifact_registry_repository
}

output "wif_attribute_condition" {
  description = "CEL condition enforced by the WIF provider."
  value       = module.github_wif.github_wif_attribute_condition
}

output "cicd_iam_summary" {
  description = "Phase 5 CI/CD IAM grants managed by this root."
  value = {
    artifact_registry_writer       = module.cicd_iam.github_actions_artifact_registry_role
    github_actions_to_terraform_sa = module.cicd_iam.github_actions_can_impersonate_terraform_sa
    terraform_project_roles        = module.cicd_iam.terraform_service_account_project_roles
    terraform_runtime_service_account_user_targets = (
      module.cicd_iam.terraform_runtime_service_account_user_targets
    )
    terraform_state_bucket_roles = module.cicd_iam.terraform_state_bucket_roles
  }
}

output "github_actions_variable_names" {
  description = "GitHub Actions variables that must be configured from Terraform/private inventory outputs."
  value = [
    "ARTIFACT_REGISTRY_REPOSITORY",
    "BACKEND_SERVICE_NAME",
    "FRONTEND_SERVICE_NAME",
    "GCP_GITHUB_ACTIONS_SA",
    "GCP_PROJECT_ID",
    "GCP_REGION",
    "GCP_TERRAFORM_SA",
    "GCP_WIF_PROVIDER",
    "NEXT_PUBLIC_API_BASE_URL",
    "NEXT_PUBLIC_BEFORE_API_BASE_URL",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "TERRAFORM_STATE_BUCKET",
  ]
}
