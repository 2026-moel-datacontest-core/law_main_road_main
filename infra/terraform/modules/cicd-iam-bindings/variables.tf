variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "region" {
  description = "Primary GCP region / Artifact Registry location."
  type        = string
}

variable "artifact_registry_repository_id" {
  description = "Artifact Registry Docker repository id."
  type        = string
}

variable "state_bucket_name" {
  description = "Terraform remote state bucket name."
  type        = string
}

variable "github_actions_service_account_email" {
  description = "GitHub Actions keyless CI entrypoint service account email."
  type        = string
}

variable "terraform_service_account_email" {
  description = "Terraform execution service account email."
  type        = string
}

variable "runtime_service_account_emails" {
  description = "Runtime service accounts that Terraform may attach to Cloud Run services."
  type        = set(string)
  default     = []
}

variable "terraform_service_account_project_roles" {
  description = "Project roles granted to terraform-sa for approved CI/CD-managed roots."
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

variable "terraform_state_bucket_roles" {
  description = "Bucket-scoped roles granted to terraform-sa for the GCS backend."
  type        = set(string)
  default = [
    "roles/storage.legacyBucketReader",
    "roles/storage.objectAdmin",
  ]
}
