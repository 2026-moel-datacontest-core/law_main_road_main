variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "service_name" {
  description = "Cloud Run service name."
  type        = string

  validation {
    condition     = can(regex("^[a-z]([a-z0-9-]{0,47}[a-z0-9])?$", var.service_name))
    error_message = "service_name must be a valid Cloud Run service name up to 49 characters."
  }
}

variable "location" {
  description = "Cloud Run region."
  type        = string
}

variable "description" {
  description = "Cloud Run service description."
  type        = string
  default     = "Terraform-managed Cloud Run service."
}

variable "labels" {
  description = "Labels applied to the Cloud Run service."
  type        = map(string)
  default     = {}
}

variable "image" {
  description = "Container image reference. Prefer an immutable Artifact Registry digest."
  type        = string

  validation {
    condition     = length(trimspace(var.image)) > 0
    error_message = "image must be a non-empty container image reference."
  }
}

variable "service_account_email" {
  description = "Runtime service account email attached to the Cloud Run revision."
  type        = string
}

variable "ingress" {
  description = "Cloud Run ingress setting."
  type        = string
  default     = "INGRESS_TRAFFIC_ALL"

  validation {
    condition = contains([
      "INGRESS_TRAFFIC_ALL",
      "INGRESS_TRAFFIC_INTERNAL_ONLY",
      "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER",
    ], var.ingress)
    error_message = "ingress must be a supported Cloud Run v2 ingress value."
  }
}

variable "deletion_protection" {
  description = "Whether Terraform should prevent destroying the Cloud Run service."
  type        = bool
  default     = true
}

variable "execution_environment" {
  description = "Cloud Run execution environment."
  type        = string
  default     = "EXECUTION_ENVIRONMENT_GEN2"

  validation {
    condition = contains([
      "EXECUTION_ENVIRONMENT_GEN1",
      "EXECUTION_ENVIRONMENT_GEN2",
    ], var.execution_environment)
    error_message = "execution_environment must be EXECUTION_ENVIRONMENT_GEN1 or EXECUTION_ENVIRONMENT_GEN2."
  }
}

variable "container_port" {
  description = "Container port exposed by the service."
  type        = number
  default     = 8080

  validation {
    condition     = var.container_port > 0 && var.container_port < 65536
    error_message = "container_port must be a valid TCP port."
  }
}

variable "timeout" {
  description = "Cloud Run request timeout duration, for example 300s."
  type        = string
  default     = "300s"
}

variable "concurrency" {
  description = "Maximum requests per container instance."
  type        = number
  default     = 20

  validation {
    condition     = var.concurrency >= 1
    error_message = "concurrency must be at least 1."
  }
}

variable "min_instance_count" {
  description = "Minimum Cloud Run instances."
  type        = number
  default     = 0

  validation {
    condition     = var.min_instance_count >= 0
    error_message = "min_instance_count must be non-negative."
  }
}

variable "max_instance_count" {
  description = "Maximum Cloud Run instances."
  type        = number
  default     = 2

  validation {
    condition     = var.max_instance_count >= 1
    error_message = "max_instance_count must be at least 1."
  }
}

variable "cpu" {
  description = "Cloud Run CPU limit."
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Cloud Run memory limit."
  type        = string
  default     = "512Mi"
}

variable "cpu_idle" {
  description = "Whether CPU is only allocated during requests."
  type        = bool
  default     = true
}

variable "startup_cpu_boost" {
  description = "Whether to enable startup CPU boost."
  type        = bool
  default     = true
}

variable "env_vars" {
  description = "Plain non-secret environment variables."
  type        = map(string)
  default     = {}

  validation {
    condition = alltrue([
      for name, value in var.env_vars :
      can(regex("^[A-Za-z_][A-Za-z0-9_]*$", name)) && value != null
    ])
    error_message = "env_vars keys must be valid environment variable names and values must be non-null."
  }
}

variable "secret_env_vars" {
  description = "Secret Manager environment variables keyed by env var name. Values are secret references only, not secret payloads."
  type = map(object({
    secret  = string
    version = string
  }))
  default = {}

  validation {
    condition = alltrue([
      for name, ref in var.secret_env_vars :
      can(regex("^[A-Za-z_][A-Za-z0-9_]*$", name))
      && length(trimspace(ref.secret)) > 0
      && length(trimspace(ref.version)) > 0
    ])
    error_message = "secret_env_vars keys must be valid environment variable names and secret/version references must be non-empty."
  }
}

variable "cloud_sql_instance_connections" {
  description = "Cloud SQL connection names mounted through the Cloud Run connector volume."
  type        = set(string)
  default     = []
}

variable "allow_unauthenticated" {
  description = "Whether to grant allUsers roles/run.invoker on the Cloud Run service."
  type        = bool
  default     = false
}

variable "startup_probe_path" {
  description = "Optional HTTP startup probe path. Set null to disable."
  type        = string
  default     = "/health"
}

variable "startup_probe_failure_threshold" {
  description = "Startup probe failure threshold."
  type        = number
  default     = 6
}

variable "startup_probe_initial_delay_seconds" {
  description = "Startup probe initial delay in seconds."
  type        = number
  default     = 0
}

variable "startup_probe_period_seconds" {
  description = "Startup probe period in seconds."
  type        = number
  default     = 10
}

variable "startup_probe_timeout_seconds" {
  description = "Startup probe timeout in seconds."
  type        = number
  default     = 5
}
