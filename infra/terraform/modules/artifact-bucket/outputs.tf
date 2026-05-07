output "bucket_name" {
  description = "Artifact bucket name."
  value       = google_storage_bucket.this.name
}

output "bucket_url" {
  description = "Artifact bucket URL."
  value       = google_storage_bucket.this.url
}
