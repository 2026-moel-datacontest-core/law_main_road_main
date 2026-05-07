resource "google_storage_bucket" "this" {
  project = var.project_id
  name    = var.bucket_name

  location                    = upper(var.location)
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  labels                      = var.labels

  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_delete_age_days == null ? [] : [var.lifecycle_delete_age_days]

    content {
      action {
        type = "Delete"
      }

      condition {
        age = lifecycle_rule.value
      }
    }
  }
}
