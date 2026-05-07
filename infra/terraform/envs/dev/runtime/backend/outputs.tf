output "backend_service_name" {
  description = "Backend Cloud Run service name."
  value       = module.backend_cloud_run.service_name
}

output "backend_url" {
  description = "Backend Cloud Run URL. Treat direct run.app URLs as internal cloud inventory until public release approval."
  value       = module.backend_cloud_run.service_uri
}

output "backend_latest_created_revision" {
  description = "Latest created backend revision."
  value       = module.backend_cloud_run.latest_created_revision
}

output "backend_latest_ready_revision" {
  description = "Latest ready backend revision."
  value       = module.backend_cloud_run.latest_ready_revision
}

output "backend_service_account_email" {
  description = "Backend runtime service account email. Treat as internal cloud inventory."
  value       = local.foundation_outputs.backend_service_account_email
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name mounted through the Cloud Run connector. Treat as internal cloud inventory."
  value       = local.data_outputs.sql_connection_name
}

output "database_name" {
  description = "Application database name."
  value       = local.data_outputs.database_name
}

output "database_url_secret_id" {
  description = "Secret Manager secret id referenced for DATABASE_URL. Secret value/version payload is not managed by Terraform."
  value       = local.data_outputs.db_secret_ids.database_url
}

output "database_url_secret_version" {
  description = "Secret Manager version reference used for DATABASE_URL. The version value must exist before apply."
  value       = var.database_url_secret_version
}

output "cors_origin_regex" {
  description = "Current backend CORS origin regex. Update in Phase 4 after frontend URL is known."
  value       = var.backend_cors_origin_regex
}

output "db_pool_values" {
  description = "Backend DB pool guardrail values."
  value = {
    pool_size            = var.db_pool_size
    max_overflow         = var.db_max_overflow
    pool_timeout_seconds = var.db_pool_timeout_seconds
    max_instances        = var.max_instance_count
  }
}

output "runtime_iam_grants" {
  description = "Runtime IAM grants planned by this Phase 3 root."
  value = {
    backend_cloud_sql_client = "roles/cloudsql.client"
    backend_vertex_user      = "roles/aiplatform.user"
    public_invoker           = var.allow_unauthenticated ? "roles/run.invoker:allUsers" : "disabled"
  }
}
