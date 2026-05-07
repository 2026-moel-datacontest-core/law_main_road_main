output "service_account_emails" {
  description = "Service account emails keyed by logical name."
  value = {
    for key, service_account in google_service_account.this :
    key => service_account.email
  }
}

output "service_account_ids" {
  description = "Service account resource ids keyed by logical name."
  value = {
    for key, service_account in google_service_account.this :
    key => service_account.id
  }
}

output "terraform_service_account_roles" {
  description = "Project roles granted to the Terraform service account."
  value       = sort(keys(google_project_iam_member.terraform_service_account))
}

output "workload_identity_pool_name" {
  description = "Workload Identity Pool full resource name when GitHub WIF is enabled."
  value       = var.enable_github_wif ? google_iam_workload_identity_pool.github[0].name : null
}

output "workload_identity_provider_name" {
  description = "Workload Identity Provider full resource name for GitHub Actions auth."
  value       = var.enable_github_wif ? google_iam_workload_identity_pool_provider.github[0].name : null
}

output "github_wif_attribute_condition" {
  description = "CEL attribute condition enforced by the GitHub WIF provider."
  value       = var.enable_github_wif ? local.github_wif_attribute_condition : null
}

output "github_wif_principal_member" {
  description = "PrincipalSet member granted workloadIdentityUser on github-actions-sa."
  value = (
    var.enable_github_wif
    ? google_service_account_iam_member.github_workload_identity_user[0].member
    : null
  )
}
