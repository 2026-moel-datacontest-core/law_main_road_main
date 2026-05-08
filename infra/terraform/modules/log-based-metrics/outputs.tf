output "metric_names" {
  description = "Created log-based metric names."
  value       = { for key, metric in google_logging_metric.this : key => metric.name }
}

output "metric_types" {
  description = "Cloud Monitoring metric type strings for the user-defined log-based metrics."
  value       = { for key, metric in google_logging_metric.this : key => "logging.googleapis.com/user/${metric.name}" }
}
