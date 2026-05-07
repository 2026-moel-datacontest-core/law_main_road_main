provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  normalized_project_id = lower(replace(var.project_id, "_", "-"))
  resource_prefix       = "${var.prefix}-${var.env}"
  artifact_bucket_name = (
    var.artifact_bucket_name != null && var.artifact_bucket_name != ""
    ? var.artifact_bucket_name
    : lower("${local.resource_prefix}-${local.normalized_project_id}-artifacts")
  )

  labels = merge(
    {
      app        = "law-main-road"
      env        = var.env
      managed_by = "terraform"
      owner      = var.owner
    },
    var.labels,
  )

  service_accounts = {
    frontend = {
      account_id   = "${local.resource_prefix}-frontend-sa"
      display_name = "LMR ${var.env} frontend runtime"
      description  = "Cloud Run frontend runtime identity for law-main-road ${var.env}."
    }
    backend = {
      account_id   = "${local.resource_prefix}-backend-sa"
      display_name = "LMR ${var.env} backend runtime"
      description  = "Cloud Run backend runtime identity for law-main-road ${var.env}."
    }
    github_actions = {
      account_id   = "${local.resource_prefix}-github-actions-sa"
      display_name = "LMR ${var.env} GitHub Actions deploy"
      description  = "Future GitHub Actions deploy identity. WIF binding is deferred to Phase 5."
    }
    terraform = {
      account_id   = "${local.resource_prefix}-terraform-sa"
      display_name = "LMR ${var.env} Terraform"
      description  = "Terraform execution identity for approved law-main-road ${var.env} roots."
    }
  }

  secrets = {
    database_url = {
      secret_id = "${local.resource_prefix}-database-url"
      labels = {
        phase = "data-runtime"
      }
    }
    db_user = {
      secret_id = "${local.resource_prefix}-db-user"
      labels = {
        phase = "data-runtime"
      }
    }
    db_password = {
      secret_id = "${local.resource_prefix}-db-password"
      labels = {
        phase = "data-runtime"
      }
    }
    db_name = {
      secret_id = "${local.resource_prefix}-db-name"
      labels = {
        phase = "data-runtime"
      }
    }
    app_secret = {
      secret_id = "${local.resource_prefix}-app-secret"
      labels = {
        phase = "future"
      }
    }
  }

  backend_secret_accessor_keys = [
    "database_url",
    "db_user",
    "db_password",
    "db_name",
  ]
}

module "project_services" {
  source = "../../../modules/project-services"

  project_id = var.project_id
  services   = var.foundation_services
}

module "iam" {
  source = "../../../modules/iam-wif"

  project_id                              = var.project_id
  service_accounts                        = local.service_accounts
  terraform_service_account_project_roles = var.terraform_service_account_project_roles

  depends_on = [
    module.project_services,
  ]
}

module "artifact_registry" {
  source = "../../../modules/artifact-registry"

  project_id    = var.project_id
  location      = var.region
  repository_id = "${local.resource_prefix}-ar"
  labels        = merge(local.labels, { component = "artifact-registry" })

  depends_on = [
    module.project_services,
  ]
}

module "secrets" {
  source = "../../../modules/secret-manager"

  project_id = var.project_id
  secrets    = local.secrets
  labels     = merge(local.labels, { component = "secret-manager" })

  depends_on = [
    module.project_services,
  ]
}

module "artifact_bucket" {
  source = "../../../modules/artifact-bucket"

  project_id                = var.project_id
  bucket_name               = local.artifact_bucket_name
  location                  = var.region
  lifecycle_delete_age_days = var.artifact_lifecycle_delete_age_days
  labels                    = merge(local.labels, { component = "artifacts" })

  depends_on = [
    module.project_services,
  ]
}

resource "google_secret_manager_secret_iam_member" "backend_secret_accessor" {
  for_each = {
    for key, secret_id in module.secrets.secret_ids :
    key => secret_id
    if contains(local.backend_secret_accessor_keys, key)
  }

  project   = var.project_id
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${module.iam.service_account_emails["backend"]}"
}

resource "google_storage_bucket_iam_member" "backend_artifact_object_admin" {
  bucket = module.artifact_bucket.bucket_name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${module.iam.service_account_emails["backend"]}"
}
