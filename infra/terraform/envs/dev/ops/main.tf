provider "google" {
  project = var.project_id
  region  = var.region
}

data "terraform_remote_state" "foundation" {
  backend = "gcs"

  config = {
    bucket = var.foundation_state_bucket
    prefix = var.foundation_state_prefix
  }
}

data "terraform_remote_state" "data" {
  backend = "gcs"

  config = {
    bucket = var.data_state_bucket
    prefix = var.data_state_prefix
  }
}

data "terraform_remote_state" "backend_runtime" {
  backend = "gcs"

  config = {
    bucket = var.backend_runtime_state_bucket
    prefix = var.backend_runtime_state_prefix
  }
}

data "terraform_remote_state" "frontend_runtime" {
  backend = "gcs"

  config = {
    bucket = var.frontend_runtime_state_bucket
    prefix = var.frontend_runtime_state_prefix
  }
}

locals {
  foundation_outputs       = data.terraform_remote_state.foundation.outputs
  data_outputs             = data.terraform_remote_state.data.outputs
  backend_runtime_outputs  = data.terraform_remote_state.backend_runtime.outputs
  frontend_runtime_outputs = data.terraform_remote_state.frontend_runtime.outputs
  resource_prefix          = "${var.prefix}-${var.env}"

  labels = merge(
    {
      app        = "law-main-road"
      env        = var.env
      managed_by = "terraform"
      owner      = var.owner
      phase      = "phase6-ops"
    },
    var.labels,
  )

  backend_service_name  = local.backend_runtime_outputs.backend_service_name
  frontend_service_name = local.frontend_runtime_outputs.frontend_service_name
  database_name         = local.data_outputs.database_name
  sql_database_id       = "${var.project_id}:${local.data_outputs.sql_instance_name}"

  backend_log_filter_prefix = join(" AND ", [
    "resource.type=\"cloud_run_revision\"",
    "resource.labels.service_name=\"${local.backend_service_name}\"",
  ])

  log_metrics = {
    backend_provider_timeout_count = {
      display_name = "LMR dev backend provider timeout count"
      description  = "Counts backend provider timeout failures from current plain-text app logs."
      filter       = "${local.backend_log_filter_prefix} AND textPayload:\"reason=provider_timeout\""
    }
    backend_provider_runtime_error_count = {
      display_name = "LMR dev backend provider runtime error count"
      description  = "Counts backend provider/runtime failures from current plain-text app logs."
      filter       = "${local.backend_log_filter_prefix} AND (textPayload:\"reason=provider_runtime\" OR textPayload:\"reason=vertex_runtime\" OR textPayload:\"reason=query_embedding\")"
    }
    backend_database_error_count = {
      display_name = "LMR dev backend database error count"
      description  = "Counts backend database failures from current plain-text app logs."
      filter       = "${local.backend_log_filter_prefix} AND textPayload:\"reason=database\""
    }
    backend_internal_error_count = {
      display_name = "LMR dev backend internal error count"
      description  = "Counts backend internal failures from current plain-text app logs."
      filter       = "${local.backend_log_filter_prefix} AND textPayload:\"reason=internal\""
    }
    artifact_persist_failure_count = {
      display_name = "LMR dev artifact persistence failure count"
      description  = "Counts answer/document draft artifact persistence failures from current plain-text app logs."
      filter       = "${local.backend_log_filter_prefix} AND textPayload:\"artifact_persist_failed\""
    }
  }

  log_metric_types = {
    for key, name in module.log_based_metrics.metric_names :
    key => "logging.googleapis.com/user/${name}"
  }

  count_alert_alignment = {
    duration             = "300s"
    alignment_period     = "300s"
    per_series_aligner   = "ALIGN_DELTA"
    cross_series_reducer = "REDUCE_SUM"
  }

  gauge_alert_alignment = {
    duration             = "600s"
    alignment_period     = "300s"
    per_series_aligner   = "ALIGN_MEAN"
    cross_series_reducer = "REDUCE_MEAN"
  }

  alert_policies = {
    backend_5xx_count = {
      display_name          = "LMR dev backend 5xx count"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Dev backend Cloud Run returned 5xx responses. Confirm `/health`, recent deploys, provider timeout logs, and Cloud SQL saturation before rollback."
      conditions = [
        {
          display_name         = "Backend 5xx over 5 minutes"
          filter               = "metric.type=\"run.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${local.backend_service_name}\" AND metric.labels.\"response_code_class\"=\"5xx\""
          threshold_value      = var.backend_5xx_count_threshold
          duration             = local.count_alert_alignment.duration
          alignment_period     = local.count_alert_alignment.alignment_period
          per_series_aligner   = local.count_alert_alignment.per_series_aligner
          cross_series_reducer = local.count_alert_alignment.cross_series_reducer
        }
      ]
    }
    frontend_5xx_count = {
      display_name          = "LMR dev frontend 5xx count"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Dev frontend Cloud Run returned 5xx responses. Check route smoke and recent frontend revisions before rollback."
      conditions = [
        {
          display_name         = "Frontend 5xx over 5 minutes"
          filter               = "metric.type=\"run.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${local.frontend_service_name}\" AND metric.labels.\"response_code_class\"=\"5xx\""
          threshold_value      = var.frontend_5xx_count_threshold
          duration             = local.count_alert_alignment.duration
          alignment_period     = local.count_alert_alignment.alignment_period
          per_series_aligner   = local.count_alert_alignment.per_series_aligner
          cross_series_reducer = local.count_alert_alignment.cross_series_reducer
        }
      ]
    }
    provider_timeout_count = {
      display_name          = "LMR dev provider timeout count"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Provider timeout signal from backend logs. This tracks the known transient `provider_timeout` runtime risk."
      conditions = [
        {
          display_name         = "Provider timeouts over 5 minutes"
          filter               = "metric.type=\"${local.log_metric_types.backend_provider_timeout_count}\" AND resource.type=\"cloud_run_revision\""
          threshold_value      = var.provider_timeout_count_threshold
          duration             = local.count_alert_alignment.duration
          alignment_period     = local.count_alert_alignment.alignment_period
          per_series_aligner   = local.count_alert_alignment.per_series_aligner
          cross_series_reducer = local.count_alert_alignment.cross_series_reducer
        }
      ]
    }
    provider_runtime_error_count = {
      display_name          = "LMR dev provider runtime error count"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Provider runtime, Vertex runtime, or query embedding failures from backend logs."
      conditions = [
        {
          display_name         = "Provider/runtime errors over 5 minutes"
          filter               = "metric.type=\"${local.log_metric_types.backend_provider_runtime_error_count}\" AND resource.type=\"cloud_run_revision\""
          threshold_value      = var.runtime_error_count_threshold
          duration             = local.count_alert_alignment.duration
          alignment_period     = local.count_alert_alignment.alignment_period
          per_series_aligner   = local.count_alert_alignment.per_series_aligner
          cross_series_reducer = local.count_alert_alignment.cross_series_reducer
        }
      ]
    }
    database_error_count = {
      display_name          = "LMR dev backend database error count"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Backend application database errors. Compare with Cloud SQL CPU/memory/disk/connection alerts."
      conditions = [
        {
          display_name         = "Backend database errors over 5 minutes"
          filter               = "metric.type=\"${local.log_metric_types.backend_database_error_count}\" AND resource.type=\"cloud_run_revision\""
          threshold_value      = var.database_error_count_threshold
          duration             = local.count_alert_alignment.duration
          alignment_period     = local.count_alert_alignment.alignment_period
          per_series_aligner   = local.count_alert_alignment.per_series_aligner
          cross_series_reducer = local.count_alert_alignment.cross_series_reducer
        }
      ]
    }
    internal_error_count = {
      display_name          = "LMR dev backend internal error count"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Unexpected backend internal errors from application logs."
      conditions = [
        {
          display_name         = "Backend internal errors over 5 minutes"
          filter               = "metric.type=\"${local.log_metric_types.backend_internal_error_count}\" AND resource.type=\"cloud_run_revision\""
          threshold_value      = var.internal_error_count_threshold
          duration             = local.count_alert_alignment.duration
          alignment_period     = local.count_alert_alignment.alignment_period
          per_series_aligner   = local.count_alert_alignment.per_series_aligner
          cross_series_reducer = local.count_alert_alignment.cross_series_reducer
        }
      ]
    }
    artifact_persist_failure_count = {
      display_name          = "LMR dev artifact persistence failure count"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Artifact persistence failed in answer or document draft path. This does not implement Step 3 full retention lifecycle."
      conditions = [
        {
          display_name         = "Artifact persistence failures over 5 minutes"
          filter               = "metric.type=\"${local.log_metric_types.artifact_persist_failure_count}\" AND resource.type=\"cloud_run_revision\""
          threshold_value      = var.artifact_persist_failure_count_threshold
          duration             = local.count_alert_alignment.duration
          alignment_period     = local.count_alert_alignment.alignment_period
          per_series_aligner   = local.count_alert_alignment.per_series_aligner
          cross_series_reducer = local.count_alert_alignment.cross_series_reducer
        }
      ]
    }
    cloud_sql_cpu_utilization = {
      display_name          = "LMR dev Cloud SQL CPU utilization"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Cloud SQL CPU saturation candidate for the dev PostgreSQL instance."
      conditions = [
        {
          display_name         = "Cloud SQL CPU utilization over 10 minutes"
          filter               = "metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\" AND resource.type=\"cloudsql_database\" AND resource.labels.database_id=\"${local.sql_database_id}\""
          threshold_value      = var.cloud_sql_cpu_utilization_threshold
          duration             = local.gauge_alert_alignment.duration
          alignment_period     = local.gauge_alert_alignment.alignment_period
          per_series_aligner   = local.gauge_alert_alignment.per_series_aligner
          cross_series_reducer = local.gauge_alert_alignment.cross_series_reducer
        }
      ]
    }
    cloud_sql_memory_utilization = {
      display_name          = "LMR dev Cloud SQL memory utilization"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Cloud SQL memory saturation candidate for the dev PostgreSQL instance."
      conditions = [
        {
          display_name         = "Cloud SQL memory utilization over 10 minutes"
          filter               = "metric.type=\"cloudsql.googleapis.com/database/memory/utilization\" AND resource.type=\"cloudsql_database\" AND resource.labels.database_id=\"${local.sql_database_id}\""
          threshold_value      = var.cloud_sql_memory_utilization_threshold
          duration             = local.gauge_alert_alignment.duration
          alignment_period     = local.gauge_alert_alignment.alignment_period
          per_series_aligner   = local.gauge_alert_alignment.per_series_aligner
          cross_series_reducer = local.gauge_alert_alignment.cross_series_reducer
        }
      ]
    }
    cloud_sql_disk_utilization = {
      display_name          = "LMR dev Cloud SQL disk utilization"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Cloud SQL disk saturation candidate. Confirm storage autoresize and cap before increasing load."
      conditions = [
        {
          display_name         = "Cloud SQL disk utilization over 10 minutes"
          filter               = "metric.type=\"cloudsql.googleapis.com/database/disk/utilization\" AND resource.type=\"cloudsql_database\" AND resource.labels.database_id=\"${local.sql_database_id}\""
          threshold_value      = var.cloud_sql_disk_utilization_threshold
          duration             = local.gauge_alert_alignment.duration
          alignment_period     = local.gauge_alert_alignment.alignment_period
          per_series_aligner   = local.gauge_alert_alignment.per_series_aligner
          cross_series_reducer = local.gauge_alert_alignment.cross_series_reducer
        }
      ]
    }
    cloud_sql_postgres_connections = {
      display_name          = "LMR dev Cloud SQL PostgreSQL connections"
      severity              = "WARNING"
      notification_channels = var.notification_channels
      documentation         = "Cloud SQL PostgreSQL connection saturation candidate. Threshold is aligned to the dev backend DB pool guardrail and should be tuned by the operator."
      conditions = [
        {
          display_name         = "Cloud SQL PostgreSQL connections over 10 minutes"
          filter               = "metric.type=\"cloudsql.googleapis.com/database/postgresql/num_backends\" AND resource.type=\"cloudsql_database\" AND resource.labels.database_id=\"${local.sql_database_id}\" AND metric.labels.\"database\"=\"${local.database_name}\""
          threshold_value      = var.cloud_sql_postgres_connection_threshold
          duration             = local.gauge_alert_alignment.duration
          alignment_period     = local.gauge_alert_alignment.alignment_period
          per_series_aligner   = local.gauge_alert_alignment.per_series_aligner
          cross_series_reducer = local.gauge_alert_alignment.cross_series_reducer
        }
      ]
    }
  }
}

check "foundation_matches_ops_root" {
  assert {
    condition = (
      local.foundation_outputs.project_id == var.project_id
      && local.foundation_outputs.region == var.region
    )
    error_message = "Phase 6 ops root must use the same project_id and region as the Phase 1 foundation remote state."
  }
}

check "data_matches_ops_root" {
  assert {
    condition = (
      local.data_outputs.project_id == var.project_id
      && local.data_outputs.region == var.region
    )
    error_message = "Phase 6 ops root must use the same project_id and region as the Phase 2 data remote state."
  }
}

check "runtime_outputs_match_ops_root" {
  assert {
    condition = (
      local.backend_service_name == "${local.resource_prefix}-backend"
      && local.frontend_service_name == "${local.resource_prefix}-frontend"
    )
    error_message = "Phase 6 ops root requires completed Phase 3/4 runtime outputs for the same dev prefix."
  }
}

resource "google_project_iam_member" "terraform_ops_roles" {
  for_each = var.manage_terraform_ops_iam ? var.terraform_service_account_ops_roles : toset([])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${local.foundation_outputs.terraform_service_account_email}"
}

module "log_based_metrics" {
  source = "../../../modules/log-based-metrics"

  project_id = var.project_id
  metrics    = local.log_metrics
}

module "monitoring_alerts" {
  source = "../../../modules/monitoring-alerts"

  project_id     = var.project_id
  labels         = local.labels
  alert_policies = local.alert_policies

  depends_on = [
    module.log_based_metrics,
  ]
}
