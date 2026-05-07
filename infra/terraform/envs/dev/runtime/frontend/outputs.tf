output "frontend_service_name" {
  description = "Frontend Cloud Run service name."
  value       = module.frontend_cloud_run.service_name
}

output "frontend_url" {
  description = "Frontend Cloud Run URL. Use this host for the Phase 4 Firebase Authorized Domains gate."
  value       = module.frontend_cloud_run.service_uri
}

output "frontend_latest_created_revision" {
  description = "Latest created frontend revision."
  value       = module.frontend_cloud_run.latest_created_revision
}

output "frontend_latest_ready_revision" {
  description = "Latest ready frontend revision."
  value       = module.frontend_cloud_run.latest_ready_revision
}

output "frontend_revision" {
  description = "Phase 4 status-note alias for the latest ready frontend revision."
  value       = module.frontend_cloud_run.latest_ready_revision
}

output "frontend_service_account_email" {
  description = "Frontend runtime service account email. Treat as internal cloud inventory."
  value       = local.foundation_outputs.frontend_service_account_email
}

output "firebase_authorized_domain_host" {
  description = "Host that must be added to Firebase Authentication Authorized Domains before Google Sign-In smoke."
  value       = trimprefix(module.frontend_cloud_run.service_uri, "https://")
}

output "expected_backend_url_source" {
  description = "Phase 3 backend URL source that must be baked into NEXT_PUBLIC_API_BASE_URL during frontend image build. Treat as internal cloud inventory."
  value       = "envs/dev/runtime/backend.backend_url"
}

output "backend_url_for_next_public_api_base_url" {
  description = "Phase 3 backend URL that must be baked into NEXT_PUBLIC_API_BASE_URL. Treat as internal cloud inventory."
  value       = local.backend_runtime_outputs.backend_url
}

output "backend_cors_origin_regex_candidate" {
  description = "Candidate BACKEND_CORS_ORIGIN_REGEX for the Phase 4 backend re-apply."
  value       = "^https://${replace(trimprefix(module.frontend_cloud_run.service_uri, "https://"), ".", "\\.")}$"
}

output "allow_unauthenticated" {
  description = "Whether allUsers receives roles/run.invoker."
  value       = module.frontend_cloud_run.allow_unauthenticated
}
