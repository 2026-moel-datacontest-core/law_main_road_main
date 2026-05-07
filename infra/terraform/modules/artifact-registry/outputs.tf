output "repository_id" {
  description = "Artifact Registry repository id."
  value       = google_artifact_registry_repository.this.repository_id
}

output "repository_name" {
  description = "Artifact Registry full resource name."
  value       = google_artifact_registry_repository.this.name
}

output "location" {
  description = "Artifact Registry location."
  value       = google_artifact_registry_repository.this.location
}
