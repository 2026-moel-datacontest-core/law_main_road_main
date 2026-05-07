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

data "terraform_remote_state" "backend_runtime" {
  backend = "gcs"

  config = {
    bucket = var.backend_runtime_state_bucket
    prefix = var.backend_runtime_state_prefix
  }
}

locals {
  foundation_outputs      = data.terraform_remote_state.foundation.outputs
  backend_runtime_outputs = data.terraform_remote_state.backend_runtime.outputs
  resource_prefix         = "${var.prefix}-${var.env}"

  labels = merge(
    {
      app        = "law-main-road"
      env        = var.env
      managed_by = "terraform"
      owner      = var.owner
    },
    var.labels,
  )
}

check "foundation_matches_frontend_runtime_root" {
  assert {
    condition = (
      local.foundation_outputs.project_id == var.project_id
      && local.foundation_outputs.region == var.region
    )
    error_message = "Phase 4 frontend runtime root must use the same project_id and region as the Phase 1 foundation remote state."
  }
}

check "backend_matches_frontend_runtime_root" {
  assert {
    condition = (
      length(trimspace(local.backend_runtime_outputs.backend_url)) > 0
      && local.backend_runtime_outputs.backend_service_name == "${local.resource_prefix}-backend"
    )
    error_message = "Phase 4 frontend runtime root requires a completed Phase 3 backend runtime output for the same dev prefix."
  }
}

module "frontend_cloud_run" {
  source = "../../../../modules/cloud-run-service"

  project_id            = var.project_id
  service_name          = "${local.resource_prefix}-frontend"
  location              = var.region
  description           = "LMR ${var.env} Next.js frontend runtime."
  labels                = merge(local.labels, { component = "frontend-runtime" })
  image                 = var.frontend_image
  service_account_email = local.foundation_outputs.frontend_service_account_email

  ingress               = "INGRESS_TRAFFIC_ALL"
  deletion_protection   = var.deletion_protection
  min_instance_count    = var.min_instance_count
  max_instance_count    = var.max_instance_count
  concurrency           = var.concurrency
  timeout               = var.timeout
  cpu                   = var.cpu
  memory                = var.memory
  allow_unauthenticated = var.allow_unauthenticated
  env_vars              = {}
  secret_env_vars       = {}
  startup_probe_path    = null
}
