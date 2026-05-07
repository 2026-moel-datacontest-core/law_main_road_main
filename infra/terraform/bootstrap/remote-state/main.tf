provider "google" {
  project = var.project_id
  region  = var.location
}

locals {
  normalized_project_id = lower(replace(var.project_id, "_", "-"))
  state_bucket_name = (
    var.state_bucket_name != null && var.state_bucket_name != ""
    ? var.state_bucket_name
    : lower("${var.prefix}-${var.env}-${local.normalized_project_id}-tfstate")
  )

  labels = merge(
    {
      app        = "law-main-road"
      component  = "terraform-state"
      env        = var.env
      managed_by = "terraform"
    },
    var.labels,
  )

  bootstrap_services = toset([
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "storage.googleapis.com",
  ])
}

resource "google_project_service" "bootstrap" {
  for_each = local.bootstrap_services

  project = var.project_id
  service = each.key

  disable_dependent_services = false
  disable_on_destroy         = false
}

resource "google_storage_bucket" "state" {
  project = var.project_id
  name    = local.state_bucket_name

  location                    = upper(var.location)
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  labels                      = local.labels

  versioning {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [
    google_project_service.bootstrap,
  ]
}
