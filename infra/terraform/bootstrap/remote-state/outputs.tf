output "state_bucket_name" {
  description = "Terraform remote state bucket name for later env roots. Treat as internal cloud inventory."
  value       = google_storage_bucket.state.name
}

output "state_bucket_url" {
  description = "Terraform remote state bucket URL. Treat as internal cloud inventory."
  value       = google_storage_bucket.state.url
}

output "bootstrap_services" {
  description = "Project APIs owned by the bootstrap root."
  value       = sort(keys(google_project_service.bootstrap))
}
