resource "google_monitoring_alert_policy" "this" {
  for_each = var.alert_policies

  project               = var.project_id
  display_name          = each.value.display_name
  combiner              = each.value.combiner
  enabled               = each.value.enabled
  severity              = each.value.severity
  notification_channels = each.value.notification_channels
  user_labels           = merge(var.labels, each.value.user_labels)

  dynamic "documentation" {
    for_each = each.value.documentation == null || each.value.documentation == "" ? [] : [each.value.documentation]

    content {
      content   = documentation.value
      mime_type = "text/markdown"
    }
  }

  dynamic "conditions" {
    for_each = each.value.conditions

    content {
      display_name = conditions.value.display_name

      condition_threshold {
        filter                  = conditions.value.filter
        duration                = conditions.value.duration
        comparison              = conditions.value.comparison
        threshold_value         = conditions.value.threshold_value
        evaluation_missing_data = conditions.value.evaluation_missing_data

        aggregations {
          alignment_period     = conditions.value.alignment_period
          per_series_aligner   = conditions.value.per_series_aligner
          cross_series_reducer = conditions.value.cross_series_reducer
          group_by_fields      = conditions.value.group_by_fields
        }

        trigger {
          count = conditions.value.trigger_count
        }
      }
    }
  }

  alert_strategy {
    auto_close = each.value.auto_close
  }
}
