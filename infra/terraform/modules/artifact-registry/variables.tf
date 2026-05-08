variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "location" {
  description = "Artifact Registry location."
  type        = string
}

variable "repository_id" {
  description = "Artifact Registry repository id."
  type        = string
}

variable "description" {
  description = "Repository description."
  type        = string
  default     = "Docker images for law-main-road cloud migration."
}

variable "labels" {
  description = "Repository labels."
  type        = map(string)
  default     = {}
}

variable "cleanup_policy_dry_run" {
  description = "Whether Artifact Registry cleanup policies are dry-run only. Keep true until irreversible deletion is approved."
  type        = bool
  default     = true
}

variable "cleanup_policies" {
  description = "Artifact Registry cleanup policies. Use dry-run until retention/rollback impact is approved."
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

  validation {
    condition = alltrue([
      for policy in var.cleanup_policies :
      can(regex("^[a-z][a-z0-9-]{0,126}[a-z0-9]$", policy.id))
      && contains(["DELETE", "KEEP"], policy.action)
      && !(
        policy.condition == null
        && policy.most_recent_versions == null
      )
      && !(
        policy.condition != null
        && policy.most_recent_versions != null
      )
      && !(
        policy.action == "DELETE"
        && policy.most_recent_versions != null
      )
    ])
    error_message = "Cleanup policies need a valid id, action DELETE/KEEP, and exactly one of condition or most_recent_versions; DELETE cannot use most_recent_versions."
  }
}
