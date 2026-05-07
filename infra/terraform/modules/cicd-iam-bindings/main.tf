locals {
  github_actions_member = "serviceAccount:${var.github_actions_service_account_email}"
  terraform_member      = "serviceAccount:${var.terraform_service_account_email}"
}

resource "google_artifact_registry_repository_iam_member" "github_actions_writer" {
  project    = var.project_id
  location   = var.region
  repository = var.artifact_registry_repository_id
  role       = "roles/artifactregistry.writer"
  member     = local.github_actions_member
}

resource "google_service_account_iam_member" "github_actions_impersonates_terraform" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.terraform_service_account_email}"
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = local.github_actions_member
}

resource "google_project_iam_member" "terraform_project_roles" {
  for_each = var.terraform_service_account_project_roles

  project = var.project_id
  role    = each.value
  member  = local.terraform_member
}

resource "google_storage_bucket_iam_member" "terraform_state_bucket" {
  for_each = var.terraform_state_bucket_roles

  bucket = var.state_bucket_name
  role   = each.value
  member = local.terraform_member
}

resource "google_service_account_iam_member" "terraform_runtime_service_account_user" {
  for_each = var.runtime_service_account_emails

  service_account_id = "projects/${var.project_id}/serviceAccounts/${each.value}"
  role               = "roles/iam.serviceAccountUser"
  member             = local.terraform_member
}
