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
