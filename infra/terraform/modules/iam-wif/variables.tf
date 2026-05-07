variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "service_accounts" {
  description = "Service accounts to create. This Phase 1 slice does not create WIF providers."
  type = map(object({
    account_id   = string
    display_name = string
    description  = string
  }))
}

variable "terraform_service_account_key" {
  description = "Key in service_accounts for the Terraform execution service account."
  type        = string
  default     = "terraform"
}

variable "terraform_service_account_project_roles" {
  description = "Non-Owner/Editor project roles to grant to the Terraform service account for approved foundation management."
  type        = set(string)
  default     = []

  validation {
    condition = length(setintersection(var.terraform_service_account_project_roles, toset([
      "roles/editor",
      "roles/firebase.sdkAdminServiceAgent",
      "roles/iam.serviceAccountKeyAdmin",
      "roles/owner",
    ]))) == 0
    error_message = "Terraform service account roles must not include Owner, Editor, service account key admin, or Firebase service-agent roles."
  }
}
