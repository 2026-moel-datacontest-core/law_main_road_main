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

  runtime_service_account_emails = toset([
    local.foundation_outputs.backend_service_account_email,
    local.foundation_outputs.frontend_service_account_email,
  ])
}

check "foundation_matches_cicd_root" {
  assert {
    condition = (
      local.foundation_outputs.project_id == var.project_id
      && local.foundation_outputs.region == var.region
    )
    error_message = "Phase 5 CI/CD root must use the same project_id and region as the Phase 1 foundation remote state."
  }
}

check "mirror_repo_has_no_wif_access" {
  assert {
    condition     = var.github_repository != "Team-msp-architect-2026/msp-team02"
    error_message = "The public submission mirror must not receive WIF deploy access."
  }
}

module "github_wif" {
  source = "../../../modules/iam-wif"

  project_id       = var.project_id
  service_accounts = {}

  enable_github_wif                   = true
  workload_identity_pool_id           = "${local.resource_prefix}-github-pool"
  workload_identity_pool_display_name = "LMR ${var.env} GitHub Actions"
  workload_identity_provider_id       = "github"
  github_repository_owner             = var.github_repository_owner
  github_repository                   = var.github_repository
  allowed_github_environments         = var.allowed_github_environments
  allowed_github_refs                 = var.allowed_github_refs
  allowed_github_workflow_refs        = var.allowed_github_workflow_refs
  github_actions_service_account_email = (
    local.foundation_outputs.github_actions_service_account_email
  )
}

module "cicd_iam" {
  source = "../../../modules/cicd-iam-bindings"

  project_id                           = var.project_id
  region                               = var.region
  artifact_registry_repository_id      = local.foundation_outputs.artifact_registry_repository
  state_bucket_name                    = var.foundation_state_bucket
  github_actions_service_account_email = local.foundation_outputs.github_actions_service_account_email
  terraform_service_account_email      = local.foundation_outputs.terraform_service_account_email
  runtime_service_account_emails       = local.runtime_service_account_emails
  terraform_service_account_project_roles = (
    var.terraform_service_account_project_roles
  )
}
