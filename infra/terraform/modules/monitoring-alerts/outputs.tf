output "alert_policy_names" {
  description = "Created alert policy resource names keyed by policy id."
  value       = { for key, policy in google_monitoring_alert_policy.this : key => policy.name }
}

output "alert_policy_display_names" {
  description = "Created alert policy display names keyed by policy id."
  value       = { for key, policy in google_monitoring_alert_policy.this : key => policy.display_name }
}
