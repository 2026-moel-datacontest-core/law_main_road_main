output "log_metric_names" {
  description = "Created Phase 6 log-based metric names."
  value       = module.log_based_metrics.metric_names
}

output "log_metric_types" {
  description = "Created Phase 6 log-based metric types."
  value       = module.log_based_metrics.metric_types
}

output "alert_policy_names" {
  description = "Created Phase 6 alert policy resource names."
  value       = module.monitoring_alerts.alert_policy_names
}

output "alert_policy_display_names" {
  description = "Created Phase 6 alert policy display names."
  value       = module.monitoring_alerts.alert_policy_display_names
}

output "notification_channel_status" {
  description = "Notification channel wiring status."
  value = {
    configured = length(var.notification_channels) > 0
    count      = length(var.notification_channels)
  }
}

output "observed_runtime_targets" {
  description = "Runtime service targets used by Phase 6 monitoring."
  value = {
    backend_service  = local.backend_service_name
    frontend_service = local.frontend_service_name
    sql_instance     = local.data_outputs.sql_instance_name
  }
}

output "cloud_sql_backup_posture" {
  description = "Cloud SQL backup/PITR posture inherited from Phase 2 data foundation."
  value = {
    backup_enabled          = local.data_outputs.backup_enabled
    backup_retained_backups = local.data_outputs.backup_retained_backups
    pitr_enabled            = local.data_outputs.pitr_enabled
    deletion_protection     = local.data_outputs.deletion_protection
  }
}

output "lifecycle_cleanup_posture" {
  description = "Phase 6 lifecycle/cleanup posture. Artifact bucket and registry ownership remains in foundation."
  value = {
    artifact_bucket_lifecycle_days              = "managed in envs/dev/foundation"
    artifact_registry_cleanup_policy_dry_run    = try(local.foundation_outputs.artifact_registry_cleanup_policy_dry_run, null)
    artifact_registry_cleanup_policy_ids        = try(local.foundation_outputs.artifact_registry_cleanup_policy_ids, [])
    gcs_artifact_runtime_durability_not_claimed = true
  }
}

output "terraform_ops_iam_roles" {
  description = "Ops IAM roles granted to terraform-sa by this root when enabled."
  value       = var.manage_terraform_ops_iam ? sort(tolist(var.terraform_service_account_ops_roles)) : []
}
