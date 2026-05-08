variable "project_id" {
  description = "Existing GCP project id."
  type        = string
}

variable "env" {
  description = "Environment name. Phase 1 first apply is dev only."
  type        = string
  default     = "dev"

  validation {
    condition     = var.env == "dev"
    error_message = "Only dev is apply-ready in Phase 1."
  }
}

variable "region" {
  description = "Primary GCP region."
  type        = string
  default     = "asia-northeast3"
}

variable "prefix" {
  description = "Short resource prefix."
  type        = string
  default     = "lmr"
}

variable "owner" {
  description = "Owner label value."
  type        = string
  default     = "portfolio"
}

variable "labels" {
  description = "Additional labels merged into managed resources."
  type        = map(string)
  default     = {}
}

variable "artifact_bucket_name" {
  description = "Optional explicit globally unique artifact bucket name. If unset, a deterministic project-id based name is used."
  type        = string
  default     = null
}

variable "artifact_lifecycle_delete_age_days" {
  description = "Object TTL for the private artifact bucket."
  type        = number
  default     = 30
}

variable "artifact_registry_cleanup_policy_dry_run" {
  description = "Whether Artifact Registry cleanup policies are dry-run only. Keep true until irreversible deletion is approved."
  type        = bool
  default     = true
}

variable "artifact_registry_cleanup_policies" {
  description = "Phase 6 image cleanup policies for the foundation-owned Artifact Registry repository."
  type = list(object({
    id     = string
    action = string
    condition = optional(object({
      tag_state             = optional(string)
      tag_prefixes          = optional(list(string))
      version_name_prefixes = optional(list(string))
      package_name_prefixes = optional(list(string))
      older_than            = optional(string)
      newer_than            = optional(string)
    }))
    most_recent_versions = optional(object({
      keep_count            = number
      package_name_prefixes = optional(list(string))
    }))
  }))
  default = []
}

variable "foundation_services" {
  description = "Post-bootstrap project APIs owned by the dev foundation root."
  type        = set(string)
  default = [
    "aiplatform.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "sqladmin.googleapis.com",
    "sts.googleapis.com",
  ]
}

variable "terraform_service_account_project_roles" {
  description = "Non-Owner/Editor project roles granted to lmr-dev-terraform-sa for Phase 1 foundation resource classes only. Later phases must explicitly review and add their own roles."
  type        = set(string)
  default = [
    "roles/artifactregistry.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/iam.serviceAccountUser",
    "roles/secretmanager.admin",
    "roles/serviceusage.serviceUsageAdmin",
    "roles/storage.admin",
  ]

  validation {
    condition = length(setintersection(var.terraform_service_account_project_roles, toset([
      "roles/editor",
      "roles/firebase.sdkAdminServiceAgent",
      "roles/iam.serviceAccountKeyAdmin",
      "roles/owner",
    ]))) == 0
    error_message = "Phase 1 terraform-sa roles must not include Owner, Editor, service account key admin, or Firebase service-agent roles."
  }
}
