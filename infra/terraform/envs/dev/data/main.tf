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

locals {
  foundation_outputs = data.terraform_remote_state.foundation.outputs
  resource_prefix    = "${var.prefix}-${var.env}"

  labels = merge(
    {
      app        = "law-main-road"
      env        = var.env
      managed_by = "terraform"
      owner      = var.owner
    },
    var.labels,
  )

  db_secret_ids = {
    database_url = local.foundation_outputs.secret_ids.database_url
    db_name      = local.foundation_outputs.secret_ids.db_name
    db_password  = local.foundation_outputs.secret_ids.db_password
    db_user      = local.foundation_outputs.secret_ids.db_user
  }

  db_secret_names = {
    database_url = local.foundation_outputs.secret_names.database_url
    db_name      = local.foundation_outputs.secret_names.db_name
    db_password  = local.foundation_outputs.secret_names.db_password
    db_user      = local.foundation_outputs.secret_names.db_user
  }
}

check "foundation_matches_data_root" {
  assert {
    condition = (
      local.foundation_outputs.project_id == var.project_id
      && local.foundation_outputs.region == var.region
    )
    error_message = "Phase 2 data root must use the same project_id and region as the Phase 1 foundation remote state."
  }
}

module "cloud_sql_pgvector" {
  source = "../../../modules/cloud-sql-pgvector"

  project_id = var.project_id
  env        = var.env
  prefix     = var.prefix
  region     = var.region
  labels     = merge(local.labels, { component = "cloud-sql" })

  database_name = var.database_name

  postgres_version = var.postgres_version
  edition          = var.cloud_sql_edition
  tier             = var.cloud_sql_tier

  disk_type                = var.disk_type
  disk_size_gb             = var.disk_size_gb
  disk_autoresize          = var.disk_autoresize
  disk_autoresize_limit_gb = var.disk_autoresize_limit_gb
  availability_type        = var.availability_type
  backup_enabled           = var.backup_enabled
  backup_start_time        = var.backup_start_time
  backup_retained_backups  = var.backup_retained_backups
  pitr_enabled             = var.pitr_enabled
  deletion_protection      = var.deletion_protection
  ipv4_enabled             = var.ipv4_enabled
}
