resource "google_service_account" "this" {
  for_each = var.service_accounts

  project      = var.project_id
  account_id   = each.value.account_id
  display_name = each.value.display_name
  description  = each.value.description
}

resource "google_project_iam_member" "terraform_service_account" {
  for_each = var.terraform_service_account_project_roles

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.this[var.terraform_service_account_key].email}"
}

locals {
  github_wif_attribute_conditions = concat(
    [
      var.github_repository == null
      ? "false"
      : "assertion.repository == \"${var.github_repository}\"",
    ],
    var.github_repository_owner == null
    ? []
    : ["assertion.repository_owner == \"${var.github_repository_owner}\""],
    length(var.allowed_github_environments) == 0
    ? []
    : ["assertion.environment in ${jsonencode(sort(tolist(var.allowed_github_environments)))}"],
    length(var.allowed_github_refs) == 0
    ? []
    : ["assertion.ref in ${jsonencode(sort(tolist(var.allowed_github_refs)))}"],
    length(var.allowed_github_workflow_refs) == 0
    ? []
    : ["assertion.workflow_ref in ${jsonencode(sort(tolist(var.allowed_github_workflow_refs)))}"],
  )

  github_wif_attribute_condition = join(" && ", local.github_wif_attribute_conditions)
}

resource "google_iam_workload_identity_pool" "github" {
  count = var.enable_github_wif ? 1 : 0

  project                   = var.project_id
  workload_identity_pool_id = var.workload_identity_pool_id
  display_name              = var.workload_identity_pool_display_name
  description               = "GitHub Actions OIDC pool for keyless law-main-road deploys."
  disabled                  = false

  lifecycle {
    precondition {
      condition     = var.workload_identity_pool_id != null
      error_message = "workload_identity_pool_id is required when enable_github_wif is true."
    }
  }
}

resource "google_iam_workload_identity_pool_provider" "github" {
  count = var.enable_github_wif ? 1 : 0

  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github[0].workload_identity_pool_id
  workload_identity_pool_provider_id = var.workload_identity_provider_id
  display_name                       = "GitHub Actions"
  description                        = "GitHub Actions OIDC provider with repository and environment restrictions."
  disabled                           = false

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.environment"      = "assertion.environment"
    "attribute.job_workflow_ref" = "assertion.job_workflow_ref"
    "attribute.ref"              = "assertion.ref"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
    "attribute.workflow"         = "assertion.workflow"
    "attribute.workflow_ref"     = "assertion.workflow_ref"
  }

  attribute_condition = local.github_wif_attribute_condition

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  lifecycle {
    precondition {
      condition = (
        var.github_repository != null
        && var.github_repository_owner != null
        && var.github_actions_service_account_email != null
      )
      error_message = "github_repository, github_repository_owner, and github_actions_service_account_email are required when enable_github_wif is true."
    }
  }
}

resource "google_service_account_iam_member" "github_workload_identity_user" {
  count = var.enable_github_wif ? 1 : 0

  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.github_actions_service_account_email}"
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github[0].name}/attribute.repository/${var.github_repository}"
}
