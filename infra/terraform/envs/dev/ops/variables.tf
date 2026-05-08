variable "project_id" {
  description = "Existing GCP project id."
  type        = string
}

variable "env" {
  description = "Environment name. Phase 6 first apply-ready ops root is dev only."
  type        = string
  default     = "dev"

  validation {
    condition     = var.env == "dev"
    error_message = "Only dev is apply-ready in this Phase 6 ops root."
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

variable "foundation_state_bucket" {
  description = "Phase 1 Terraform state bucket that contains envs/dev/foundation outputs."
  type        = string
  default     = "lmr-dev-law-main-road-tfstate"
}

variable "foundation_state_prefix" {
  description = "Remote-state prefix for Phase 1 dev foundation outputs."
  type        = string
  default     = "envs/dev/foundation"
}

variable "data_state_bucket" {
  description = "Phase 2 Terraform state bucket that contains envs/dev/data outputs."
  type        = string
  default     = "lmr-dev-law-main-road-tfstate"
}

variable "data_state_prefix" {
  description = "Remote-state prefix for Phase 2 dev data outputs."
  type        = string
  default     = "envs/dev/data"
}

variable "backend_runtime_state_bucket" {
  description = "Phase 3 Terraform state bucket that contains envs/dev/runtime/backend outputs."
  type        = string
  default     = "lmr-dev-law-main-road-tfstate"
}

variable "backend_runtime_state_prefix" {
  description = "Remote-state prefix for Phase 3 dev backend runtime outputs."
  type        = string
  default     = "envs/dev/runtime/backend"
}

variable "frontend_runtime_state_bucket" {
  description = "Phase 4 Terraform state bucket that contains envs/dev/runtime/frontend outputs."
  type        = string
  default     = "lmr-dev-law-main-road-tfstate"
}

variable "frontend_runtime_state_prefix" {
  description = "Remote-state prefix for Phase 4 dev frontend runtime outputs."
  type        = string
  default     = "envs/dev/runtime/frontend"
}

variable "notification_channels" {
  description = "Approved Cloud Monitoring notification channel resource names. Keep empty until receiver approval."
  type        = list(string)
  default     = []
}

variable "manage_terraform_ops_iam" {
  description = "Whether this root should grant terraform-sa the minimal ops roles needed for future ops applies."
  type        = bool
  default     = true
}

variable "terraform_service_account_ops_roles" {
  description = "Ops-only project roles granted to terraform-sa when manage_terraform_ops_iam is true."
  type        = set(string)
  default = [
    "roles/logging.configWriter",
    "roles/monitoring.alertPolicyEditor",
  ]

  validation {
    condition = length(setintersection(var.terraform_service_account_ops_roles, toset([
      "roles/editor",
      "roles/firebase.sdkAdminServiceAgent",
      "roles/iam.serviceAccountKeyAdmin",
      "roles/owner",
    ]))) == 0
    error_message = "Ops roles must not include Owner, Editor, service account key admin, or Firebase service-agent roles."
  }
}

variable "backend_5xx_count_threshold" {
  description = "Backend 5xx count threshold over the alert alignment period."
  type        = number
  default     = 0
}

variable "frontend_5xx_count_threshold" {
  description = "Frontend 5xx count threshold over the alert alignment period."
  type        = number
  default     = 0
}

variable "provider_timeout_count_threshold" {
  description = "Provider timeout count threshold over the alert alignment period."
  type        = number
  default     = 1
}

variable "runtime_error_count_threshold" {
  description = "Provider/runtime error count threshold over the alert alignment period."
  type        = number
  default     = 0
}

variable "database_error_count_threshold" {
  description = "Backend database error count threshold over the alert alignment period."
  type        = number
  default     = 0
}

variable "internal_error_count_threshold" {
  description = "Backend internal error count threshold over the alert alignment period."
  type        = number
  default     = 0
}

variable "artifact_persist_failure_count_threshold" {
  description = "Artifact persistence failure count threshold over the alert alignment period."
  type        = number
  default     = 0
}

variable "cloud_sql_cpu_utilization_threshold" {
  description = "Cloud SQL CPU utilization threshold, expressed as 0.0-1.0."
  type        = number
  default     = 0.8
}

variable "cloud_sql_memory_utilization_threshold" {
  description = "Cloud SQL memory utilization threshold, expressed as 0.0-1.0."
  type        = number
  default     = 0.8
}

variable "cloud_sql_disk_utilization_threshold" {
  description = "Cloud SQL disk utilization threshold, expressed as 0.0-1.0."
  type        = number
  default     = 0.8
}

variable "cloud_sql_postgres_connection_threshold" {
  description = "Cloud SQL PostgreSQL connection count threshold for the dev DB."
  type        = number
  default     = 8
}
