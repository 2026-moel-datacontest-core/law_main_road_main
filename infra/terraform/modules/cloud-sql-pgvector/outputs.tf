output "sql_instance_name" {
  description = "Cloud SQL instance name. Treat as internal cloud inventory."
  value       = google_sql_database_instance.this.name
}

output "sql_instance_id" {
  description = "Cloud SQL instance resource id. Treat as internal cloud inventory."
  value       = google_sql_database_instance.this.id
}

output "sql_connection_name" {
  description = "Cloud SQL connection name for Cloud SQL connector/Auth Proxy binding."
  value       = google_sql_database_instance.this.connection_name
}

output "sql_region" {
  description = "Cloud SQL region."
  value       = google_sql_database_instance.this.region
}

output "database_name" {
  description = "Application database name."
  value       = google_sql_database.app.name
}

output "database_host_hint" {
  description = "Connector/Auth Proxy host hint only. This is not a credential-bearing DATABASE_URL."
  value       = "/cloudsql/${google_sql_database_instance.this.connection_name}"
}

output "postgres_version" {
  description = "Configured PostgreSQL version."
  value       = var.postgres_version
}

output "edition" {
  description = "Configured Cloud SQL edition."
  value       = var.edition
}

output "tier" {
  description = "Configured Cloud SQL tier."
  value       = var.tier
}

output "disk_size_gb" {
  description = "Initial disk size in GB."
  value       = var.disk_size_gb
}

output "disk_autoresize" {
  description = "Whether storage auto-increase is enabled."
  value       = var.disk_autoresize
}

output "disk_autoresize_limit_gb" {
  description = "Storage auto-increase cap in GB."
  value       = var.disk_autoresize_limit_gb
}

output "availability_type" {
  description = "Configured availability type."
  value       = var.availability_type
}

output "backup_enabled" {
  description = "Whether automated backups are enabled."
  value       = var.backup_enabled
}

output "backup_retained_backups" {
  description = "Number of retained automated backups."
  value       = var.backup_retained_backups
}

output "pitr_enabled" {
  description = "Whether point-in-time recovery is enabled."
  value       = var.pitr_enabled
}

output "deletion_protection" {
  description = "Whether Terraform and Cloud SQL deletion protection are enabled."
  value       = var.deletion_protection
}

output "ipv4_enabled" {
  description = "Whether public IPv4 is enabled for connector/Auth Proxy access."
  value       = var.ipv4_enabled
}

output "authorized_networks_configured" {
  description = "Always false: this module does not declare authorized networks."
  value       = false
}

output "connector_access_posture" {
  description = "Expected access posture for Phase 3 runtime."
  value       = "cloud_sql_connector_or_auth_proxy"
}
