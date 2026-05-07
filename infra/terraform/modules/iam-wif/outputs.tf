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
