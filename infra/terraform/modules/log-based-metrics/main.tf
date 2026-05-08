resource "google_logging_metric" "this" {
  for_each = var.metrics

  project     = var.project_id
  name        = each.key
  description = each.value.description
  filter      = each.value.filter
  disabled    = each.value.disabled

  metric_descriptor {
    display_name = each.value.display_name
    metric_kind  = "DELTA"
    value_type   = "INT64"
    unit         = "1"
  }
}
