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

variable "enable_github_wif" {
  description = "Whether to create a GitHub Actions Workload Identity Federation pool/provider and workloadIdentityUser binding."
  type        = bool
  default     = false
}

variable "workload_identity_pool_id" {
  description = "Workload Identity Pool id for GitHub Actions."
  type        = string
  default     = null

  validation {
    condition = (
      var.workload_identity_pool_id == null
      || can(regex("^[a-z][a-z0-9-]{3,31}$", var.workload_identity_pool_id))
    )
    error_message = "workload_identity_pool_id must be null or a 4-32 character lowercase id starting with a letter."
  }
}

variable "workload_identity_pool_display_name" {
  description = "Workload Identity Pool display name."
  type        = string
  default     = "GitHub Actions"
}

variable "workload_identity_provider_id" {
  description = "Workload Identity Pool Provider id for GitHub OIDC."
  type        = string
  default     = "github"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{3,31}$", var.workload_identity_provider_id))
    error_message = "workload_identity_provider_id must be a 4-32 character lowercase id starting with a letter."
  }
}

variable "github_repository" {
  description = "GitHub repository allowed to use the provider, formatted as OWNER/REPO."
  type        = string
  default     = null
}

variable "github_repository_owner" {
  description = "GitHub repository owner expected in the OIDC token."
  type        = string
  default     = null
}

variable "allowed_github_environments" {
  description = "GitHub environments allowed by the provider condition. Empty keeps the provider repository-only."
  type        = set(string)
  default     = []
}

variable "allowed_github_refs" {
  description = "Git refs allowed by the provider condition. Empty does not add a ref condition."
  type        = set(string)
  default     = []
}

variable "allowed_github_workflow_refs" {
  description = "GitHub workflow_ref values allowed by the provider condition. Empty does not add a workflow path condition."
  type        = set(string)
  default     = []
}

variable "github_actions_service_account_email" {
  description = "Existing GitHub Actions service account email that the GitHub OIDC principal may impersonate."
  type        = string
  default     = null
}
