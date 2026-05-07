variable "project_id" {
  description = "Existing GCP project id that will hold the Terraform state bucket."
  type        = string
}

variable "env" {
  description = "Environment label for the bootstrap state bucket."
  type        = string
  default     = "dev"

  validation {
    condition     = var.env == "dev"
    error_message = "Phase 1 bootstrap is dev-only."
  }
}

variable "location" {
  description = "GCS bucket location for Terraform state."
  type        = string
  default     = "asia-northeast3"
}

variable "prefix" {
  description = "Short resource prefix."
  type        = string
  default     = "lmr"
}

variable "state_bucket_name" {
  description = "Optional explicit globally unique Terraform state bucket name. If unset, a deterministic project-id based name is used."
  type        = string
  default     = null
}

variable "labels" {
  description = "Additional labels to apply to the state bucket."
  type        = map(string)
  default     = {}
}
