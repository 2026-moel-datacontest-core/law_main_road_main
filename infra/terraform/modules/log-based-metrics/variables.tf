variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "metrics" {
  description = "Project-scoped counter log-based metrics keyed by metric name."
  type = map(object({
    display_name = string
    description  = string
    filter       = string
    disabled     = optional(bool, false)
  }))
  default = {}

  validation {
    condition = alltrue([
      for name, metric in var.metrics :
      can(regex("^[A-Za-z][A-Za-z0-9_]{0,99}$", name))
      && length(trimspace(metric.display_name)) > 0
      && length(trimspace(metric.description)) > 0
      && length(trimspace(metric.filter)) > 0
    ])
    error_message = "Metric names must start with a letter and use only letters, digits, and underscores; display_name, description, and filter must be non-empty."
  }
}
