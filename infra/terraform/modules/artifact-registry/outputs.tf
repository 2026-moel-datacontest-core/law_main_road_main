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

output "cleanup_policy_dry_run" {
  description = "Whether cleanup policies are dry-run only."
  value       = google_artifact_registry_repository.this.cleanup_policy_dry_run
}

output "cleanup_policy_ids" {
  description = "Configured cleanup policy ids."
  value       = [for policy in google_artifact_registry_repository.this.cleanup_policies : policy.id]
}
