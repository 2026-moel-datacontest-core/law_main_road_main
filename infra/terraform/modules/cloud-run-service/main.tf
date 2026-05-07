resource "google_cloud_run_v2_service" "this" {
  project             = var.project_id
  name                = var.service_name
  location            = var.location
  description         = var.description
  ingress             = var.ingress
  labels              = var.labels
  deletion_protection = var.deletion_protection

  template {
    service_account                  = var.service_account_email
    execution_environment            = var.execution_environment
    timeout                          = var.timeout
    max_instance_request_concurrency = var.concurrency

    scaling {
      min_instance_count = var.min_instance_count
      max_instance_count = var.max_instance_count
    }

    containers {
      image = var.image

      ports {
        name           = "http1"
        container_port = var.container_port
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }

        cpu_idle          = var.cpu_idle
        startup_cpu_boost = var.startup_cpu_boost
      }

      dynamic "env" {
        for_each = var.env_vars

        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secret_env_vars

        content {
          name = env.key

          value_source {
            secret_key_ref {
              secret  = env.value.secret
              version = env.value.version
            }
          }
        }
      }

      dynamic "startup_probe" {
        for_each = var.startup_probe_path == null ? [] : [var.startup_probe_path]

        content {
          failure_threshold     = var.startup_probe_failure_threshold
          initial_delay_seconds = var.startup_probe_initial_delay_seconds
          period_seconds        = var.startup_probe_period_seconds
          timeout_seconds       = var.startup_probe_timeout_seconds

          http_get {
            path = startup_probe.value
            port = var.container_port
          }
        }
      }

      dynamic "volume_mounts" {
        for_each = length(var.cloud_sql_instance_connections) == 0 ? [] : ["cloudsql"]

        content {
          name       = volume_mounts.value
          mount_path = "/cloudsql"
        }
      }
    }

    dynamic "volumes" {
      for_each = length(var.cloud_sql_instance_connections) == 0 ? [] : ["cloudsql"]

      content {
        name = volumes.value

        cloud_sql_instance {
          instances = var.cloud_sql_instance_connections
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      scaling,
    ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = google_cloud_run_v2_service.this.location
  name     = google_cloud_run_v2_service.this.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
