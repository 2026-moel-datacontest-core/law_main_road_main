output "github_actions_artifact_registry_role" {
  description = "Artifact Registry role granted to github-actions-sa."
  value       = google_artifact_registry_repository_iam_member.github_actions_writer.role
}

output "github_actions_can_impersonate_terraform_sa" {
  description = "Whether github-actions-sa can mint tokens for terraform-sa."
  value       = google_service_account_iam_member.github_actions_impersonates_terraform.role
}

output "terraform_service_account_project_roles" {
  description = "Project roles granted to terraform-sa by this module."
  value       = sort(keys(google_project_iam_member.terraform_project_roles))
}

output "terraform_state_bucket_roles" {
  description = "Bucket-scoped roles granted to terraform-sa for Terraform state access."
  value       = sort(keys(google_storage_bucket_iam_member.terraform_state_bucket))
}

output "terraform_runtime_service_account_user_targets" {
  description = "Runtime service account emails on which terraform-sa receives serviceAccountUser."
  value       = sort(keys(google_service_account_iam_member.terraform_runtime_service_account_user))
}
