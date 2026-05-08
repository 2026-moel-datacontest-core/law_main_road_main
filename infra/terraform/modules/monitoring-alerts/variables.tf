variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "labels" {
  description = "Base user labels applied to every alert policy."
  type        = map(string)
  default     = {}
}

variable "alert_policies" {
  description = "Cloud Monitoring metric-threshold alert policies keyed by stable policy id."
  type = map(object({
    display_name          = string
    combiner              = optional(string, "OR")
    enabled               = optional(bool, true)
    severity              = optional(string, "WARNING")
    notification_channels = optional(list(string), [])
    user_labels           = optional(map(string), {})
    documentation         = optional(string, "")
    auto_close            = optional(string, "604800s")
    conditions = list(object({
      display_name            = string
      filter                  = string
      duration                = optional(string, "300s")
      comparison              = optional(string, "COMPARISON_GT")
      threshold_value         = number
      evaluation_missing_data = optional(string, "EVALUATION_MISSING_DATA_INACTIVE")
      alignment_period        = optional(string, "300s")
      per_series_aligner      = optional(string, "ALIGN_SUM")
      cross_series_reducer    = optional(string, "REDUCE_SUM")
      group_by_fields         = optional(list(string), [])
      trigger_count           = optional(number, 1)
    }))
  }))
  default = {}

  validation {
    condition = alltrue([
      for _, policy in var.alert_policies :
      length(trimspace(policy.display_name)) > 0
      && contains(["OR", "AND", "AND_WITH_MATCHING_RESOURCE"], policy.combiner)
      && contains(["CRITICAL", "ERROR", "WARNING"], policy.severity)
      && length(policy.conditions) > 0
      && alltrue([
        for condition in policy.conditions :
        length(trimspace(condition.display_name)) > 0
        && length(trimspace(condition.filter)) > 0
        && condition.trigger_count >= 1
      ])
    ])
    error_message = "Each alert policy must have a display name, valid combiner/severity, and at least one complete condition."
  }
}
