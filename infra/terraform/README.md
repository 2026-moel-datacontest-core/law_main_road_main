# Terraform

Cloud migration Terraform lives here.

Current status:

- `bootstrap/remote-state`: applied for the first `dev` cloud target on
  `2026-05-06`.
- `envs/dev/foundation`: initialized against the approved GCS state bucket and
  applied on `2026-05-06`.
- `envs/prod/foundation`: skeleton only.
- `envs/dev/data`: Phase 2 data foundation root, plan-only until separate human
  approval opens Cloud SQL creation.
- `envs/prod/data`: skeleton only.

Phase 1 resources are limited to remote state bootstrap, required APIs, service
accounts, Artifact Registry, Secret Manager secret shells, a private artifact
bucket, and baseline IAM for those resources.

Phase 2 plan-only scope is limited to Cloud SQL PostgreSQL infrastructure and
non-secret metadata for Phase 3. It must not create DB users/passwords, Secret
Manager secret versions, pgvector extension, schema, indexes, seed data,
embeddings, backend runtime IAM, Cloud Run, WIF, GitHub workflows, service
account keys, or prod resources. The backend Cloud SQL client IAM grant belongs
to Phase 3 backend runtime wiring.

Forbidden without explicit phase approval:

- Cloud Run,
- Workload Identity Federation provider/trust binding,
- GitHub Actions workflow,
- secret values or `google_secret_manager_secret_version`,
- service account key JSON,
- Firebase Admin JSON,
- backend/frontend/API/runtime changes.

Validation used for authoring:

```bash
terraform fmt -check -recursive infra/terraform

cd infra/terraform/bootstrap/remote-state
terraform init
terraform validate
terraform plan -var='project_id=law-main-road'

cd ../../envs/dev/foundation
terraform init -backend=false
terraform validate

cd ../data
terraform init -backend=false
terraform validate
```

Post-apply validation on `2026-05-06`:

- bootstrap `terraform plan -detailed-exitcode`: no changes.
- dev foundation `terraform plan -detailed-exitcode`: no changes.

Do not run additional `terraform apply` or proceed to Phase 2 resources without
explicit human approval for that phase.
