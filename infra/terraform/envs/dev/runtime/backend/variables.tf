variable "project_id" {
  description = "Existing GCP project id."
  type        = string
}

variable "env" {
  description = "Environment name. Phase 3 first apply-ready backend runtime root is dev only."
  type        = string
  default     = "dev"

  validation {
    condition     = var.env == "dev"
    error_message = "Only dev is apply-ready in this Phase 3 backend runtime root."
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

variable "backend_image" {
  description = "Immutable backend Artifact Registry image digest."
  type        = string

  validation {
    condition     = can(regex("^asia-northeast3-docker\\.pkg\\.dev/law-main-road/lmr-dev-ar/backend@sha256:[0-9a-f]{64}$", var.backend_image))
    error_message = "backend_image must be the approved immutable dev Artifact Registry backend digest."
  }
}

variable "database_url_secret_version" {
  description = "Secret Manager version for lmr-dev-database-url. This root references the version only and never creates secret values."
  type        = string
  default     = "latest"

  validation {
    condition     = can(regex("^(latest|[1-9][0-9]*)$", var.database_url_secret_version))
    error_message = "database_url_secret_version must be latest or a numeric Secret Manager version."
  }
}

variable "min_instance_count" {
  description = "Minimum backend Cloud Run instances for dev."
  type        = number
  default     = 0
}

variable "max_instance_count" {
  description = "Maximum backend Cloud Run instances for dev."
  type        = number
  default     = 2
}

variable "concurrency" {
  description = "Maximum requests per backend container instance."
  type        = number
  default     = 20
}

variable "timeout" {
  description = "Backend Cloud Run request timeout."
  type        = string
  default     = "300s"
}

variable "cpu" {
  description = "Backend Cloud Run CPU limit."
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Backend Cloud Run memory limit."
  type        = string
  default     = "512Mi"
}

variable "deletion_protection" {
  description = "Whether Terraform should prevent destroying the dev backend Cloud Run service."
  type        = bool
  default     = false
}

variable "allow_unauthenticated" {
  description = "Whether to grant allUsers roles/run.invoker for dev smoke."
  type        = bool
  default     = true
}

variable "db_pool_size" {
  description = "Backend DB_POOL_SIZE."
  type        = number
  default     = 2
}

variable "db_max_overflow" {
  description = "Backend DB_MAX_OVERFLOW."
  type        = number
  default     = 3
}

variable "db_pool_timeout_seconds" {
  description = "Backend DB_POOL_TIMEOUT_SECONDS."
  type        = number
  default     = 30
}

variable "gcp_location" {
  description = "Vertex AI location used by backend runtime."
  type        = string
  default     = "us-central1"
}

variable "vertex_answer_model" {
  description = "Vertex answer model used by backend runtime."
  type        = string
  default     = "gemini-2.5-flash"
}

variable "firebase_project_id" {
  description = "Firebase project id for backend Firebase Admin ID token verification."
  type        = string
  default     = "law-main-road"
}

variable "backend_cors_origin_regex" {
  description = "Temporary dev/bootstrap CORS origin regex. Update after Phase 4 frontend URL is known."
  type        = string
  default     = "^https?://(localhost|127\\.0\\.0\\.1):(30[0-9]{2}|5090)$"
}

variable "extra_backend_env_vars" {
  description = "Additional non-secret backend env vars for reviewed Phase 3 runtime tuning."
  type        = map(string)
  default     = {}
}
