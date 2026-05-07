variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "env" {
  description = "Environment name."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.env)
    error_message = "env must be dev or prod."
  }
}

variable "prefix" {
  description = "Short resource prefix."
  type        = string
}

variable "region" {
  description = "Cloud SQL region."
  type        = string
}

variable "labels" {
  description = "Labels applied to the Cloud SQL instance."
  type        = map(string)
  default     = {}
}

variable "instance_name" {
  description = "Optional Cloud SQL instance name. Defaults to {prefix}-{env}-sql."
  type        = string
  default     = null
}

variable "database_name" {
  description = "Application database name. Terraform creates only the database shell."
  type        = string
}

variable "postgres_version" {
  description = "Cloud SQL PostgreSQL database version."
  type        = string
}

variable "edition" {
  description = "Cloud SQL edition."
  type        = string

  validation {
    condition     = contains(["ENTERPRISE", "ENTERPRISE_PLUS"], var.edition)
    error_message = "edition must be ENTERPRISE or ENTERPRISE_PLUS."
  }
}

variable "tier" {
  description = "Cloud SQL machine tier."
  type        = string
}

variable "disk_size_gb" {
  description = "Initial data disk size in GB."
  type        = number

  validation {
    condition     = var.disk_size_gb >= 10
    error_message = "disk_size_gb must be at least 10 for Cloud SQL SSD."
  }
}

variable "disk_type" {
  description = "Cloud SQL disk type."
  type        = string

  validation {
    condition     = contains(["PD_HDD", "PD_SSD"], var.disk_type)
    error_message = "disk_type must be PD_HDD or PD_SSD."
  }
}

variable "disk_autoresize" {
  description = "Whether Cloud SQL storage auto-increase is enabled."
  type        = bool
}

variable "disk_autoresize_limit_gb" {
  description = "Maximum storage size in GB when disk_autoresize is enabled. Use 0 for provider default/unlimited."
  type        = number

  validation {
    condition     = var.disk_autoresize_limit_gb == 0 || var.disk_autoresize_limit_gb >= var.disk_size_gb
    error_message = "disk_autoresize_limit_gb must be 0 or at least disk_size_gb."
  }
}

variable "availability_type" {
  description = "Cloud SQL availability type."
  type        = string

  validation {
    condition     = contains(["ZONAL", "REGIONAL"], var.availability_type)
    error_message = "availability_type must be ZONAL or REGIONAL."
  }
}

variable "backup_enabled" {
  description = "Whether automated backups are enabled."
  type        = bool
}

variable "backup_start_time" {
  description = "UTC backup start time in HH:MM format."
  type        = string
  default     = "17:00"
}

variable "backup_retained_backups" {
  description = "Number of retained automated backups."
  type        = number

  validation {
    condition     = var.backup_retained_backups >= 1 && var.backup_retained_backups <= 365
    error_message = "backup_retained_backups must be between 1 and 365."
  }
}

variable "pitr_enabled" {
  description = "Whether point-in-time recovery is enabled."
  type        = bool
}

variable "deletion_protection" {
  description = "Whether Terraform and Cloud SQL deletion protection are enabled."
  type        = bool
}

variable "ipv4_enabled" {
  description = "Whether the instance has public IPv4 enabled. Authorized networks are intentionally not configured."
  type        = bool
  default     = true
}
