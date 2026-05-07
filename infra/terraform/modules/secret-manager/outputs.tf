output "secret_ids" {
  description = "Secret ids keyed by logical name."
  value = {
    for key, secret in google_secret_manager_secret.this :
    key => secret.secret_id
  }
}

output "secret_names" {
  description = "Secret resource names keyed by logical name."
  value = {
    for key, secret in google_secret_manager_secret.this :
    key => secret.name
  }
}
