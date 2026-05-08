# Terraform

Cloud migration Terraform lives here.

Current status:

- `bootstrap/remote-state`: applied for the first `dev` cloud target on
  `2026-05-06`.
- `envs/dev/foundation`: initialized against the approved GCS state bucket and
  applied on `2026-05-06`.
- `envs/prod/foundation`: skeleton only.
- `envs/dev/data`: applied for the first `dev` Cloud SQL data foundation on
  `2026-05-07`; post-Terraform DB/data readiness also completed outside
  Terraform on `2026-05-07`.
- `envs/prod/data`: skeleton only.
- `envs/dev/runtime/backend`: applied for the first `dev` backend Cloud Run
  runtime on `2026-05-07`; health/auth-negative/retrieve/answer/document draft
  smoke evidence passed.
- `envs/prod/runtime/backend`: skeleton/unopened only.
- `envs/dev/runtime/frontend`: applied for the first `dev` frontend Cloud Run
  runtime on `2026-05-07`; route/CORS/SCN-004/SCN-001 boundary smoke passed.
  Firebase Authorized Domain, Google Sign-In, and protected SCN-001 history
  smoke passed through the deployed frontend.
- `envs/dev/cicd`: Phase 5 dev CI/CD WIF/deploy root. Phase 5 deploy and
  rollback rehearsal evidence is recorded in
  `docs/architecture/phase/phase5_cicd.md`.
- `envs/dev/ops`: authored for Phase 6 dev observability/reliability. It creates
  log-based metrics, alert policies, and optional minimal ops IAM grants after
  human approval.
- `envs/prod/ops`: skeleton only.

Phase 1 resources are limited to remote state bootstrap, required APIs, service
accounts, Artifact Registry, Secret Manager secret shells, a private artifact
bucket, and baseline IAM for those resources.

The Phase 2 Terraform root is limited to Cloud SQL PostgreSQL infrastructure and
non-secret metadata for Phase 3. It must not create DB users/passwords, Secret
Manager secret versions, pgvector extension, schema, indexes, seed data,
embeddings, backend runtime IAM, Cloud Run, WIF, GitHub workflows, service
account keys, or prod resources. The backend Cloud SQL client IAM grant belongs
to Phase 3 backend runtime wiring.

Phase 2 DB/data readiness was completed by approved post-Terraform admin/runbook
steps: DB bootstrap, split DB Secret Manager versions, pgvector extension,
Alembic head, `law_chunks` seed, embeddings, HNSW index verification, retrieval
smoke, and answer smoke.

Phase 3 backend runtime readiness was completed for the first `dev` target by
approved runtime work: backend Cloud Run service deploy, backend service identity
attachment, database-url Secret Manager version presence, Cloud SQL Client and
Vertex AI User runtime IAM, DB pool env wiring, public dev smoke invoker, and
health/auth-negative/retrieve/answer/document draft smoke evidence. The raw
database-url value is not stored in Terraform files or this README.

Phase 4 frontend runtime readiness is applied for the first `dev` target by
approved runtime work: Next.js standalone image build/push, frontend Cloud Run
service deploy, frontend service identity attachment, public dev smoke invoker,
backend CORS re-apply to the frontend origin, route smoke, and SCN-004/SCN-001
frontend boundary smoke. Firebase Authorized Domain, Google Sign-In, and
protected SCN-001 history smoke passed through the deployed frontend without
recording raw tokens or user identifiers.

WIF/GitHub workflow code is now authored and rehearsed for Phase 5 dev only.
Service account key JSON, Firebase Admin JSON, prod resources, custom domain/LB,
and backend/frontend/API behavior expansion remain unopened from this Terraform
README's perspective.

Forbidden without explicit phase approval:

- additional Cloud Run resources or changes outside the approved first `dev`
  backend/frontend runtime smoke,
- applying Workload Identity Federation provider/trust binding before reviewed
  Phase 5 approval,
- extending GitHub Actions workflow beyond the reviewed dev-only Phase 5 scope,
- secret values in Terraform files/state or `google_secret_manager_secret_version`,
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

Post-apply validation on `2026-05-07`:

- dev data `terraform plan -detailed-exitcode`: no changes.
- Cloud SQL instance/database describe checks: PASS.
- dev backend runtime health/auth-negative/retrieve/answer/document draft smoke:
  PASS.
- dev backend runtime `terraform plan -detailed-exitcode`: no changes.
- dev frontend runtime `terraform plan -detailed-exitcode`: no changes.
- dev cicd `terraform validate`: PASS.
- dev cicd `terraform plan -detailed-exitcode`: create-only WIF/IAM plan; no
  destroy, no runtime replacement.

Phase 6 authoring validation on `2026-05-08`:

- `envs/dev/ops` `terraform validate`: PASS.
- `envs/dev/ops` `terraform plan -detailed-exitcode`: expected create-only ops
  plan; no destroy.
- `envs/dev/foundation` `terraform plan -detailed-exitcode`: expected in-place
  Artifact Registry cleanup dry-run policy plan; no destroy.

Do not run additional `terraform apply`, disable cleanup dry-run, configure alert
channels, execute rollback drills, or open prod resources without explicit human
approval for that phase.
