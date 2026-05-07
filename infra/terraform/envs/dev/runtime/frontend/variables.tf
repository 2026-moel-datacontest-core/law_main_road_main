variable "project_id" {
  description = "Existing GCP project id."
  type        = string
}

variable "env" {
  description = "Environment name. Phase 4 first apply-ready frontend runtime root is dev only."
  type        = string
  default     = "dev"

  validation {
    condition     = var.env == "dev"
    error_message = "Only dev is apply-ready in this Phase 4 frontend runtime root."
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

variable "frontend_image" {
  description = "Immutable frontend Artifact Registry image digest."
  type        = string

  validation {
    condition = can(regex(
      "^asia-northeast3-docker\\.pkg\\.dev/law-main-road/lmr-dev-ar/frontend@sha256:[0-9a-f]{64}$",
      var.frontend_image,
    ))
    error_message = "frontend_image must be the approved immutable dev Artifact Registry frontend digest."
  }
}

variable "min_instance_count" {
  description = "Minimum frontend Cloud Run instances for dev."
  type        = number
  default     = 0
}

variable "max_instance_count" {
  description = "Maximum frontend Cloud Run instances for dev."
  type        = number
  default     = 2
}

variable "concurrency" {
  description = "Maximum requests per frontend container instance."
  type        = number
  default     = 40
}

variable "timeout" {
  description = "Frontend Cloud Run request timeout."
  type        = string
  default     = "60s"
}

variable "cpu" {
  description = "Frontend Cloud Run CPU limit."
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Frontend Cloud Run memory limit."
  type        = string
  default     = "512Mi"
}

variable "deletion_protection" {
  description = "Whether Terraform should prevent destroying the dev frontend Cloud Run service."
  type        = bool
  default     = false
}

variable "allow_unauthenticated" {
  description = "Whether to grant allUsers roles/run.invoker for dev frontend smoke."
  type        = bool
  default     = true
}
