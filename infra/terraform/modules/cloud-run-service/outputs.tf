output "service_name" {
  description = "Cloud Run service name."
  value       = google_cloud_run_v2_service.this.name
}

output "service_location" {
  description = "Cloud Run service location."
  value       = google_cloud_run_v2_service.this.location
}

output "service_uri" {
  description = "Cloud Run service URI. Treat direct run.app URLs as internal cloud inventory until public release approval."
  value       = google_cloud_run_v2_service.this.uri
}

output "latest_created_revision" {
  description = "Latest created revision name."
  value       = google_cloud_run_v2_service.this.latest_created_revision
}

output "latest_ready_revision" {
  description = "Latest ready revision name."
  value       = google_cloud_run_v2_service.this.latest_ready_revision
}

output "service_account_email" {
  description = "Runtime service account email. Treat as internal cloud inventory."
  value       = var.service_account_email
}

output "allow_unauthenticated" {
  description = "Whether allUsers receives roles/run.invoker."
  value       = var.allow_unauthenticated
}
