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

locals {
  foundation_outputs = data.terraform_remote_state.foundation.outputs
  data_outputs       = data.terraform_remote_state.data.outputs
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

  backend_env_vars = merge(
    {
      BACKEND_CORS_ORIGIN_REGEX = var.backend_cors_origin_regex
      BEFORE_LAW_SOURCE         = "db"
      DB_MAX_OVERFLOW           = tostring(var.db_max_overflow)
      DB_POOL_SIZE              = tostring(var.db_pool_size)
      DB_POOL_TIMEOUT_SECONDS   = tostring(var.db_pool_timeout_seconds)
      FIREBASE_PROJECT_ID       = var.firebase_project_id
      GCP_LOCATION              = var.gcp_location
      GCP_PROJECT               = var.project_id
      GCP_PROJECT_ID            = var.project_id
      LLM_PROVIDER              = "vertex"
      VERTEX_ANSWER_MODEL       = var.vertex_answer_model
    },
    var.extra_backend_env_vars,
  )

  backend_secret_env_vars = {
    DATABASE_URL = {
      secret  = local.data_outputs.db_secret_ids.database_url
      version = var.database_url_secret_version
    }
  }

  backend_service_account_member = "serviceAccount:${local.foundation_outputs.backend_service_account_email}"
}

check "foundation_matches_backend_runtime_root" {
  assert {
    condition = (
      local.foundation_outputs.project_id == var.project_id
      && local.foundation_outputs.region == var.region
    )
    error_message = "Phase 3 backend runtime root must use the same project_id and region as the Phase 1 foundation remote state."
  }
}

check "data_matches_backend_runtime_root" {
  assert {
    condition = (
      local.data_outputs.project_id == var.project_id
      && local.data_outputs.region == var.region
    )
    error_message = "Phase 3 backend runtime root must use the same project_id and region as the Phase 2 data remote state."
  }
}

check "db_pool_guardrail_matches_phase2_recommendation" {
  assert {
    condition = (
      var.db_pool_size == local.data_outputs.recommended_db_pool_size
      && var.db_max_overflow == local.data_outputs.recommended_db_max_overflow
      && var.db_pool_timeout_seconds == local.data_outputs.recommended_db_pool_timeout_seconds
      && var.max_instance_count == local.data_outputs.recommended_backend_max_instances
    )
    error_message = "Backend DB pool and max instance values must match the Phase 2 guardrail outputs unless Phase 3 explicitly updates both sides."
  }
}

resource "google_project_iam_member" "backend_cloud_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = local.backend_service_account_member
}

resource "google_project_iam_member" "backend_vertex_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = local.backend_service_account_member
}

module "backend_cloud_run" {
  source = "../../../../modules/cloud-run-service"

  project_id            = var.project_id
  service_name          = "${local.resource_prefix}-backend"
  location              = var.region
  description           = "LMR ${var.env} FastAPI backend runtime."
  labels                = merge(local.labels, { component = "backend-runtime" })
  image                 = var.backend_image
  service_account_email = local.foundation_outputs.backend_service_account_email

  ingress               = "INGRESS_TRAFFIC_ALL"
  deletion_protection   = var.deletion_protection
  min_instance_count    = var.min_instance_count
  max_instance_count    = var.max_instance_count
  concurrency           = var.concurrency
  timeout               = var.timeout
  cpu                   = var.cpu
  memory                = var.memory
  allow_unauthenticated = var.allow_unauthenticated
  env_vars              = local.backend_env_vars
  secret_env_vars       = local.backend_secret_env_vars
  startup_probe_path    = "/health"
  cloud_sql_instance_connections = [
    local.data_outputs.sql_connection_name,
  ]

  depends_on = [
    google_project_iam_member.backend_cloud_sql_client,
    google_project_iam_member.backend_vertex_user,
  ]
}
