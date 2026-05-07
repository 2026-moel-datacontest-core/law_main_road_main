output "project_id" {
  description = "GCP project id."
  value       = var.project_id
}

output "region" {
  description = "Primary region."
  value       = var.region
}

output "sql_instance_name" {
  description = "Cloud SQL instance name. Treat as internal cloud inventory."
  value       = module.cloud_sql_pgvector.sql_instance_name
}

output "sql_instance_id" {
  description = "Cloud SQL instance resource id. Treat as internal cloud inventory."
  value       = module.cloud_sql_pgvector.sql_instance_id
}

output "sql_connection_name" {
  description = "Cloud SQL connection name for Cloud SQL connector/Auth Proxy binding."
  value       = module.cloud_sql_pgvector.sql_connection_name
}

output "sql_region" {
  description = "Cloud SQL region."
  value       = module.cloud_sql_pgvector.sql_region
}

output "database_name" {
  description = "Application database name. DB user/password/bootstrap are outside Terraform."
  value       = module.cloud_sql_pgvector.database_name
}

output "database_host_hint" {
  description = "Connector/Auth Proxy host hint only. This is not a credential-bearing DATABASE_URL."
  value       = module.cloud_sql_pgvector.database_host_hint
}

output "db_secret_ids" {
  description = "Secret Manager secret ids from Phase 1. Values/versions are not managed by Terraform."
  value       = local.db_secret_ids
}

output "db_secret_names" {
  description = "Secret Manager resource names from Phase 1. Values/versions are not managed by Terraform."
  value       = local.db_secret_names
}

output "postgres_version" {
  description = "Configured PostgreSQL version."
  value       = module.cloud_sql_pgvector.postgres_version
}

output "cloud_sql_edition" {
  description = "Configured Cloud SQL edition."
  value       = module.cloud_sql_pgvector.edition
}

output "cloud_sql_tier" {
  description = "Configured Cloud SQL tier."
  value       = module.cloud_sql_pgvector.tier
}

output "disk_size_gb" {
  description = "Initial disk size in GB."
  value       = module.cloud_sql_pgvector.disk_size_gb
}

output "disk_autoresize" {
  description = "Whether storage auto-increase is enabled."
  value       = module.cloud_sql_pgvector.disk_autoresize
}

output "disk_autoresize_limit_gb" {
  description = "Storage auto-increase cap in GB."
  value       = module.cloud_sql_pgvector.disk_autoresize_limit_gb
}

output "availability_type" {
  description = "Configured availability type. ZONAL means HA is off."
  value       = module.cloud_sql_pgvector.availability_type
}

output "backup_enabled" {
  description = "Whether automated backups are enabled."
  value       = module.cloud_sql_pgvector.backup_enabled
}

output "backup_retained_backups" {
  description = "Number of retained automated backups."
  value       = module.cloud_sql_pgvector.backup_retained_backups
}

output "pitr_enabled" {
  description = "Whether point-in-time recovery is enabled."
  value       = module.cloud_sql_pgvector.pitr_enabled
}

output "deletion_protection" {
  description = "Whether Terraform and Cloud SQL deletion protection are enabled."
  value       = module.cloud_sql_pgvector.deletion_protection
}

output "authorized_networks_configured" {
  description = "Always false: no authorized networks are declared."
  value       = module.cloud_sql_pgvector.authorized_networks_configured
}

output "connector_access_posture" {
  description = "Expected Phase 3 access posture."
  value       = module.cloud_sql_pgvector.connector_access_posture
}

output "schema_and_seed_managed_by_terraform" {
  description = "Always false: pgvector extension, Alembic schema, HNSW index, law_chunks seed, and embeddings stay outside Terraform."
  value       = false
}

output "app_user_managed_by_terraform" {
  description = "Always false: DB app user/password/bootstrap stay outside Terraform secret values."
  value       = false
}

output "recommended_db_pool_size" {
  description = "Phase 3 backend DB_POOL_SIZE recommendation."
  value       = var.recommended_db_pool_size
}

output "recommended_db_max_overflow" {
  description = "Phase 3 backend DB_MAX_OVERFLOW recommendation."
  value       = var.recommended_db_max_overflow
}

output "recommended_db_pool_timeout_seconds" {
  description = "Phase 3 backend DB_POOL_TIMEOUT_SECONDS recommendation."
  value       = var.recommended_db_pool_timeout_seconds
}

output "recommended_backend_max_instances" {
  description = "Phase 3 backend max instances recommendation for early dev testing."
  value       = var.recommended_backend_max_instances
}
