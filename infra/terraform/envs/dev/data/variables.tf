variable "project_id" {
  description = "Existing GCP project id."
  type        = string
}

variable "env" {
  description = "Environment name. Phase 2 first apply-ready data root is dev only."
  type        = string
  default     = "dev"

  validation {
    condition     = var.env == "dev"
    error_message = "Only dev is apply-ready in this Phase 2 data root."
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

variable "database_name" {
  description = "Application database shell name. DB users/passwords are managed outside Terraform."
  type        = string
  default     = "klabor"
}

variable "postgres_version" {
  description = "Cloud SQL PostgreSQL version for dev."
  type        = string
  default     = "POSTGRES_17"
}

variable "cloud_sql_edition" {
  description = "Cloud SQL edition for dev."
  type        = string
  default     = "ENTERPRISE"
}

variable "cloud_sql_tier" {
  description = "Cloud SQL tier for cost-controlled dev smoke."
  type        = string
  default     = "db-f1-micro"
}

variable "disk_type" {
  description = "Cloud SQL disk type."
  type        = string
  default     = "PD_SSD"
}

variable "disk_size_gb" {
  description = "Initial Cloud SQL disk size in GB."
  type        = number
  default     = 10
}

variable "disk_autoresize" {
  description = "Whether Cloud SQL storage auto-increase is enabled."
  type        = bool
  default     = true
}

variable "disk_autoresize_limit_gb" {
  description = "Cloud SQL storage auto-increase cap in GB."
  type        = number
  default     = 20
}

variable "availability_type" {
  description = "Cloud SQL availability type. ZONAL means HA is off."
  type        = string
  default     = "ZONAL"
}

variable "backup_enabled" {
  description = "Whether automated backups are enabled."
  type        = bool
  default     = true
}

variable "backup_start_time" {
  description = "UTC backup start time in HH:MM format."
  type        = string
  default     = "17:00"
}

variable "backup_retained_backups" {
  description = "Dev backup retention count."
  type        = number
  default     = 3
}

variable "pitr_enabled" {
  description = "Whether point-in-time recovery is enabled."
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Whether Terraform and Cloud SQL deletion protection are enabled."
  type        = bool
  default     = false
}

variable "ipv4_enabled" {
  description = "Whether public IPv4 is enabled for Cloud SQL connector/Auth Proxy access. No authorized networks are configured."
  type        = bool
  default     = true
}

variable "recommended_db_pool_size" {
  description = "Phase 3 backend DB_POOL_SIZE recommendation."
  type        = number
  default     = 2
}

variable "recommended_db_max_overflow" {
  description = "Phase 3 backend DB_MAX_OVERFLOW recommendation."
  type        = number
  default     = 3
}

variable "recommended_db_pool_timeout_seconds" {
  description = "Phase 3 backend DB_POOL_TIMEOUT_SECONDS recommendation."
  type        = number
  default     = 30
}

variable "recommended_backend_max_instances" {
  description = "Phase 3 backend max instances recommendation for early dev testing."
  type        = number
  default     = 2
}
