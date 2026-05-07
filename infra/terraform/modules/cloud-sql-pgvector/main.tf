locals {
  default_instance_name = "${var.prefix}-${var.env}-sql"
  instance_name = (
    var.instance_name != null && var.instance_name != ""
    ? var.instance_name
    : local.default_instance_name
  )
}

resource "google_sql_database_instance" "this" {
  project          = var.project_id
  name             = local.instance_name
  region           = var.region
  database_version = var.postgres_version

  deletion_protection = var.deletion_protection

  settings {
    tier              = var.tier
    edition           = var.edition
    availability_type = var.availability_type

    disk_type                   = var.disk_type
    disk_size                   = var.disk_size_gb
    disk_autoresize             = var.disk_autoresize
    disk_autoresize_limit       = var.disk_autoresize_limit_gb
    deletion_protection_enabled = var.deletion_protection

    user_labels = var.labels

    backup_configuration {
      enabled                        = var.backup_enabled
      start_time                     = var.backup_start_time
      point_in_time_recovery_enabled = var.pitr_enabled

      backup_retention_settings {
        retained_backups = var.backup_retained_backups
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      # No authorized_networks block is declared. Access is through the Cloud SQL
      # connector/Auth Proxy posture, not broad network allowlists.
      ipv4_enabled = var.ipv4_enabled
    }
  }
}

resource "google_sql_database" "app" {
  project  = var.project_id
  name     = var.database_name
  instance = google_sql_database_instance.this.name
}
