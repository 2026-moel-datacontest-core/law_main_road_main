# K-Labor Shield — Cloud Migration Phase Plan

기준일: `2026-04-29`

이 문서는 [`cloud_migration_architecture.md`](cloud_migration_architecture.md)의 GCP
migration target을 실제 구현 가능한 phase로 나눈 계획이다. 목표는 Terraform을
모듈화하고, 각 phase를 독립적으로 plan/apply/smoke할 수 있게 만드는 것이다.
각 phase의 작업 지시용 상세 체크리스트는 [`phase/`](phase/README.md)에 둔다.

## 1. Scope

### In Scope

- Cloud Run Frontend / Backend
- Cloud SQL PostgreSQL + pgvector
- Vertex AI managed model path
- private Cloud Storage artifact bucket
- Secret Manager
- IAM service accounts
- GitHub Actions + Workload Identity Federation
- Artifact Registry
- Terraform remote state
- Cloud Logging / Monitoring / Alerting
- Cloud Run revision rollback

### Not In Scope

- Local LLM / Compute Engine GPU VM / Ollama / Qwen / vLLM
- independent `/bridge` route
- live/backend SCN-001 document draft generation
- protected SCN-001 draft endpoint
- Step 3 full retention lifecycle beyond MVP soft-delete
- API Gateway, Cloud Armor, private IP/VPC as first migration requirements

## 2. Phase Principles

- Primary region: `asia-northeast3` (Seoul). This matches the Korea-focused user
  base and keeps Cloud Run / Cloud SQL / Artifact Registry close to the target
  traffic.
- Each phase must have a clear Terraform root, module boundary, outputs, smoke
  checks, and rollback note.
- Avoid using `terraform apply -target` as the normal workflow. Prefer separate
  root modules/layers for staged application.
- Each environment has isolated remote state.
- Cross-phase dependencies are passed through explicit Terraform outputs or
  remote-state data sources, not copy-pasted values.
- Runtime deployment must preserve the current public API contracts:
  `/api/v1/answer`, `/api/v1/documents/draft`, protected SCN-001 Bridge/history
  endpoints, and SCN-004 demo freeze behavior.
- Corpus migration keeps `selected_as_of = 2026-04-11` and `1722` chunks unless a
  deliberate corpus update phase is opened.

## 3. Recommended Terraform Layout

```text
infra/
  bootstrap/
    remote-state/
      main.tf
      variables.tf
  modules/
    project-services/
    iam-service-accounts/
    workload-identity-federation/
    artifact-registry/
    secret-manager/
    artifact-bucket/
    cloud-sql-postgres/
    cloud-run-service/
    monitoring-alerts/
  environments/
    dev/
      foundation/
      data/
      runtime/
        backend/
        frontend/
      cicd/
      ops/
    prod/
      foundation/
      data/
      runtime/
        backend/
        frontend/
      cicd/
      ops/
```

### Why Layered Roots

Layered roots are more verbose than one large Terraform root, but they make
phase-by-phase validation safer:

| Layer | Owns | Why separate |
|---|---|---|
| `bootstrap` | GCS state bucket, state locking primitives if added later | must exist before remote state |
| `foundation` | APIs, service accounts, Artifact Registry, Secret Manager shells, artifact bucket | low-risk infra with no app traffic |
| `data` | Cloud SQL, DB/user shell, backup settings | DB work needs separate rollback thinking; pgvector/schema/index/seed stay in migration scripts |
| `runtime/backend` | Cloud Run backend and runtime env wiring | backend can be smoke-tested before frontend points at it |
| `runtime/frontend` | Cloud Run frontend and public env wiring | frontend can consume backend URL output and roll back independently |
| `cicd` | GitHub Actions WIF and deploy permissions | can be tested with a restricted workflow first |
| `ops` | logging metrics, alert policies, lifecycle/cleanup policy wiring | should not block initial runtime launch |

## 4. Phase Overview

| Phase | Name | Terraform root | Main output | Required before next |
|---:|---|---|---|---|
| 0 | Docs / Design Freeze | none | reviewed target docs | current/local checks still pass |
| 1 | Bootstrap + Foundation | `bootstrap/remote-state`, `{env}/foundation` | state bucket, APIs, service accounts, AR, secrets, artifact bucket | IAM and storage checks pass |
| 2 | Data Foundation | `{env}/data` | Cloud SQL PostgreSQL + migration-ready DB | migration/seed smoke pass |
| 3 | Backend Runtime | `{env}/runtime/backend` | Cloud Run backend revision | `/health`, retrieval/answer smoke pass |
| 4 | Frontend Runtime | `{env}/runtime/frontend` | Cloud Run frontend revision | browser route smoke pass |
| 5 | CI/CD | `{env}/cicd` + GitHub workflow | keyless deploy pipeline | PR/main workflow dry run pass |
| 6 | Observability / Reliability | `{env}/ops` | alerts, rollback/runbook controls | alert and rollback drills pass |
| 7 | Optional Hardening | new layer or extension modules | VPC/LB/Armor/jobs if needed | separate design approval |

For phase-specific execution detail, use:

- Phase 0: [`phase/phase0_design_freeze.md`](phase/phase0_design_freeze.md)
- Phase 1: [`phase/phase1_bootstrap_foundation.md`](phase/phase1_bootstrap_foundation.md)
- Phase 2: [`phase/phase2_data_foundation.md`](phase/phase2_data_foundation.md)
- Phase 3: [`phase/phase3_backend_runtime.md`](phase/phase3_backend_runtime.md)
- Phase 4: [`phase/phase4_frontend_runtime.md`](phase/phase4_frontend_runtime.md)
- Phase 5: [`phase/phase5_cicd.md`](phase/phase5_cicd.md)
- Phase 6: [`phase/phase6_observability_reliability.md`](phase/phase6_observability_reliability.md)
- Phase 7: [`phase/phase7_optional_hardening.md`](phase/phase7_optional_hardening.md)

## 5. Responsibility Split

Terraform should own stable cloud resources and IAM policy. CI/scripts should own
build, migration, seed, deploy, and smoke execution. Admin/manual work should
own sensitive values, production approvals, console-only setup where Terraform
is not worth the complexity, and go/no-go decisions.

| Phase | Terraform owns | CI / scripts own | Admin / manual owns |
|---:|---|---|---|
| 0 | none | local build/import/document checks | final scope approval; confirm Local LLM exclusion; decide whether to regenerate draw.io before presentation |
| 1 | remote state bucket, APIs, service accounts, Artifact Registry, Secret Manager secret shells, private artifact bucket, lifecycle baseline | `terraform fmt/validate/plan`; optional `gcloud describe` verification scripts | create/choose GCP project and billing; grant initial bootstrap permission; decide local user vs service-account impersonation for early Terraform; add actual secret versions outside Terraform state |
| 2 | Cloud SQL instance, application database shell, backup/PITR settings, SQL connection outputs, DB user/bootstrap contract | Alembic migration; pgvector/index verification; `law_chunks` seed import; row/dimension/index smoke | approve DB sizing/region/backup retention; provide DB password secret value; approve destructive DB changes if ever needed |
| 3 | backend Cloud Run service, service identity, env/secret wiring, Cloud SQL connector, Storage/Vertex IAM | build/push backend image; deploy revision; backend API smoke; auth-negative smoke | approve temporary/pre-Firebase frontend CORS policy; inspect logs for sensitive payload leakage; decide rollback on smoke failure |
| 4 | frontend Cloud Run service, service identity, runtime env wiring | build/push frontend image; route/browser smoke; SCN-004/SCN-001 preset smoke | Firebase console checks such as authorized domains/provider settings if not managed by Terraform; confirm deployed frontend URL is authorized; visual/demo approval |
| 5 | Workload Identity Federation, deploy IAM bindings, optional protected environment plumbing | GitHub Actions workflow; PR plan; main deploy; post-deploy smoke; rollback job command | configure GitHub protected environments/secrets policy; approve prod deploys; review failed deploys |
| 6 | log metrics, alert policies, lifecycle and cleanup policies | alert test scripts; rollback drill commands; cleanup dry-run checks | choose alert channels/thresholds; acknowledge/test incidents; approve retention/cost settings |
| 7 | optional hardening resources once approved | candidate-specific smoke/load/security checks | approve separate design, cost, and operational complexity before opening each candidate |

### Manual Work That Must Not Be Hidden In Terraform

- Secret values: store through Secret Manager versions, not Terraform literals.
- One-off or versioned DB migration execution.
- `law_chunks` corpus seed/import and verification.
- Firebase console/provider/domain checks unless a later Firebase Terraform scope
  is explicitly opened.
- Initial local Terraform authentication and the first `bootstrap/remote-state`
  migration step before Workload Identity Federation is available.
- Production go/no-go and rollback decisions.
- Incident threshold tuning after observing real traffic.

## 6. Phase Details

### Phase 0 — Docs / Design Freeze

Responsibility:

- Terraform: none.
- CI/scripts: local import/build/document smoke checks.
- Admin/manual: approve target scope and decide draw.io regeneration timing.

Purpose:

- Keep the cloud migration target stable before writing Terraform.
- Confirm Local LLM is out of scope.
- Confirm SCN-004 demo freeze and public API contracts are not being changed.
- Confirm Cloud Run build readiness gaps. A docs-only code read on `2026-04-29`
  found no `backend/Dockerfile`, no `frontend/Dockerfile`, and no
  `output: "standalone"` setting in `frontend/next.config.mjs`. Phase 3/4 must
  add Dockerfiles or approve equivalent build strategies before claiming Cloud
  Run deployment readiness.
- Because `NEXT_PUBLIC_*` values are bundled at Next.js build time, the frontend
  image build must pass the public API/Firebase config as Docker build args or
  through an equivalent build-time config mechanism.

Checks:

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend && npm run build
```

Exit criteria:

- Cloud migration architecture spec and this phase plan agree.
- `cloud_migration_architecture.drawio` is regenerated from the current target
  architecture before presentation use, or the Phase 0 status note records
  `drawio regenerate needed`. Do not hand-edit the `.drawio` file during a
  docs-only review.

### Phase 1 — Bootstrap + Foundation

Responsibility:

- Terraform: remote state, APIs, service accounts, Artifact Registry, Secret
  Manager secret resources, private artifact bucket, baseline lifecycle settings.
- CI/scripts: Terraform formatting/validation/plan and resource describe checks.
- Admin/manual: create/select GCP project and billing, perform initial bootstrap
  authorization, decide local user vs `terraform-sa` impersonation for early
  Terraform, add secret versions outside Terraform state.

Terraform roots:

- `infra/bootstrap/remote-state`
- `infra/environments/{env}/foundation`

Bootstrap state note:

- `infra/bootstrap/remote-state` starts with local Terraform state on the first
  run because the GCS backend bucket does not exist yet.
- After `terraform apply` creates the state bucket, run
  `terraform init -migrate-state` before applying later roots.
- Do not configure a remote backend inside `bootstrap/remote-state` itself unless
  a separate pre-existing state bucket is deliberately chosen.

Modules:

- `project-services`
- `iam-service-accounts`
- `artifact-registry`
- `secret-manager`
- `artifact-bucket`

Creates:

- GCS Terraform remote state bucket
- required APIs
- `frontend-sa`
- `backend-sa`
- `github-actions-sa`
- `terraform-sa`
- Artifact Registry Docker repository
- Secret Manager secret shells
- private Before artifact bucket with public access prevention and uniform
  bucket-level access

Bucket naming:

- GCS bucket names are globally unique. Do not hardcode only
  `kls-{env}-artifacts` for Terraform apply.
- Use a deterministic unique suffix such as project id
  (`kls-{env}-{project_id}-artifacts`) or a Terraform `random_id` suffix, and
  expose the final bucket name as a foundation output.

Minimum `terraform-sa` roles:

| Area | Candidate role |
|---|---|
| Required API enablement | `roles/serviceusage.serviceUsageAdmin` |
| Cloud Run | `roles/run.admin` |
| Cloud SQL | `roles/cloudsql.admin` |
| State/artifact buckets | `roles/storage.admin`, narrowed to bucket scope where possible |
| Secret Manager | `roles/secretmanager.admin` |
| Artifact Registry | `roles/artifactregistry.admin` |
| Service accounts | `roles/iam.serviceAccountAdmin`, `roles/iam.serviceAccountUser` |
| Monitoring/logging | `roles/monitoring.admin`, `roles/logging.admin` |

Do not grant `roles/owner` or `roles/editor` for normal Terraform execution.
Any broader bootstrap-only IAM grant must be documented as temporary and removed
after foundation is applied.

Verification:

```text
terraform fmt -check
terraform validate
terraform plan
terraform apply
gcloud artifacts repositories describe ...
gcloud storage buckets describe ...
gcloud iam service-accounts describe ...
```

Acceptance:

- No service account has project-wide Owner/Editor.
- Artifact bucket is private.
- Artifact bucket name is globally unique and exported through Terraform output.
- Secret values are not committed to git.
- Terraform state is remote and versioned.

Rollback:

- Foundation has no live app traffic.
- Delete only after checking no later phase depends on the output values.

### Phase 2 — Data Foundation

Responsibility:

- Terraform: Cloud SQL instance, application database shell, backup/PITR
  configuration, connection outputs, non-secret DB bootstrap contract.
- CI/scripts: Alembic migration, pgvector/index checks, `law_chunks` seed import,
  row count and embedding dimension verification.
- Admin/manual: DB size/cost approval, DB password secret version, destructive
  migration approval if ever needed.

Terraform root:

- `infra/environments/{env}/data`

Modules:

- `cloud-sql-postgres`

Creates:

- Cloud SQL PostgreSQL instance
- application database shell
- non-secret app DB user/bootstrap contract
- backup/PITR settings for prod
- Cloud SQL connection metadata outputs

Boundary:

- Terraform creates the Cloud SQL instance, application database shell,
  network/connector metadata, backup settings, and non-secret DB bootstrap
  contract.
- pgvector extension, schema migration, vector index creation, and `law_chunks`
  seed import are initialized by migration/seed scripts, not directly by
  Terraform.
- Raw DB password values must stay out of Terraform state. If a SQL app user is
  required, create/update it through an approved admin or secured CI bootstrap
  step that reads Secret Manager, unless the team explicitly accepts the
  Terraform state exposure of `google_sql_user.password`.

Cloud SQL connection pool note:

- Phase 2 selects target DB pool values for Phase 3, but a docs-only code read
  on `2026-04-29` confirmed current `backend/app/db.py` initializes SQLAlchemy
  from `DATABASE_URL` only and does not yet read `DB_POOL_SIZE`,
  `DB_MAX_OVERFLOW`, or `DB_POOL_TIMEOUT_SECONDS`.
- Phase 3 must either add/verify these runtime pool controls or document an
  equivalent reviewed SQLAlchemy/Cloud SQL connection cap before claiming a
  production-ready backend rollout.
- Verify `(pool_size + max_overflow) * backend_max_cloud_run_instances` stays
  below `Cloud SQL max_connections - reserved admin connections`.
- For early small-tier testing, start with a conservative target such as
  `pool_size=2`, `max_overflow=3`, and a low Cloud Run `max_instance_count`.

Migration / seed operations:

```text
terraform apply data
  -> run DB migration
  -> enable/verify pgvector extension
  -> import law_chunks seed
  -> verify 1722 rows
  -> verify embedding dimension 768
  -> verify vector index
```

Acceptance:

- DB schema migration is idempotent.
- `law_chunks` seed import is idempotent or version-gated.
- `selected_as_of = 2026-04-11` remains the active corpus marker.
- prod has automated backup; PITR enabled if cost decision allows.

Rollback:

- Backward-compatible migrations by default.
- Take backup before destructive changes.
- Destructive schema changes are not part of the first migration.

### Phase 3 — Backend Runtime

Responsibility:

- Terraform: backend Cloud Run service, `backend-sa` identity, env/secret wiring,
  Cloud SQL connector, Storage/Vertex IAM.
- CI/scripts: backend image build/push, revision deploy, backend smoke tests.
- Admin/manual: approve allowed origins and temporary CORS bootstrap, inspect
  sensitive log policy, decide rollback if smoke fails.

Terraform root:

- `infra/environments/{env}/runtime/backend`

Module:

- `cloud-run-service` for backend

Creates:

- backend Cloud Run service
- backend service identity = `backend-sa`
- Secret Manager injection
- Cloud SQL connector binding
- Storage bucket access
- Vertex AI access
- CORS environment config

Current backend env-name note:

- The current code reads `GCP_PROJECT`, `GCP_PROJECT_ID`, and `GCP_LOCATION` for
  Vertex/Before runtime paths. Do not wire only `GOOGLE_CLOUD_PROJECT` or
  `VERTEX_LOCATION` unless the backend code is updated to read those names.
- The current DB bootstrap path reads `DATABASE_URL` in `backend/app/db.py`.
  `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, and `DB_POOL_TIMEOUT_SECONDS` are target
  Cloud SQL guardrail names for Phase 3; verify or implement support before
  treating them as active runtime controls.
- Current artifact persistence writes to local `backend/data/...` directories.
  Cloud Run production readiness requires a GCS artifact adapter or an explicitly
  documented limited/non-durable smoke decision.

Pre-WIF image push:

- Workload Identity Federation is not available until Phase 5. During Phase 3/4,
  push images locally with a developer/admin account using `gcloud auth login`
  and `gcloud auth configure-docker`.
- Do not create, commit, or store a service account key JSON for this temporary
  image push path.

CORS bootstrap note:

- The frontend URL is not known until Phase 4. Deploy the backend with an
  explicitly approved temporary `BACKEND_CORS_ORIGIN_REGEX`, then update that
  env var after the frontend Cloud Run URL or custom domain is confirmed.
- Avoid leaving wildcard CORS in prod after Phase 4.

Firebase Admin ADC note:

- Current backend initialization in `backend/app/services/auth_service.py`
  prefers ADC when `GOOGLE_APPLICATION_CREDENTIALS`, Cloud Run `K_SERVICE`, or
  local ADC is present; otherwise it can fall back to `FIREBASE_ADMIN_CREDENTIALS`.
- Phase 3 smoke must verify `GET /api/v1/auth/me` with a real Firebase ID token
  on Cloud Run. If ADC initialization fails in Cloud Run, use the Secret Manager
  credential fallback until a narrower ADC/IAM path is validated.

Verification:

```text
docker build -f backend/Dockerfile .  # or approved backend image build strategy
GET /health
POST /api/v1/retrieve smoke
POST /api/v1/answer demo query smoke
POST /api/v1/documents/draft deterministic smoke
protected endpoint auth-negative smoke
```

Acceptance:

- Backend starts without local `.env`.
- DB and Vertex calls use GCP service identity/managed config.
- `/api/v1/answer` and `/api/v1/documents/draft` response contracts are unchanged.
- `GET /api/v1/auth/me` verifies Firebase ID tokens on Cloud Run using ADC or the
  documented Secret Manager fallback.
- Logs do not include raw contract text, Firebase uid, provider subject, email,
  tokens, raw Bridge payload, or raw full answer/draft payload.
- After the first post-deploy smoke, manually sample Cloud Logging entries for
  the protected and public paths above. If noisy or risky fields appear, add
  structured-log redaction or Cloud Logging exclusion filters before promotion.

Rollback:

- Keep previous Cloud Run revision.
- If smoke fails, shift traffic back to previous stable revision.

### Phase 4 — Frontend Runtime

Responsibility:

- Terraform: frontend Cloud Run service, `frontend-sa` identity, runtime env
  wiring.
- CI/scripts: frontend image build/push, route smoke, preset flow smoke.
- Admin/manual: Firebase authorized domain/provider checks if not managed by
  Terraform, visual/demo approval.

Terraform root:

- `infra/environments/{env}/runtime/frontend`

Module:

- `cloud-run-service` for frontend

Creates:

- frontend Cloud Run service
- frontend service identity = `frontend-sa`
- `NEXT_PUBLIC_API_BASE_URL`
- Firebase public web config env vars

Verification:

```text
# If the Dockerfile strategy is selected; otherwise use the approved equivalent.
docker build -f frontend/Dockerfile frontend \
  --build-arg NEXT_PUBLIC_API_BASE_URL=...
GET /
GET /after
GET /before
GET /history
SCN-004 exact preset remains fixture/no public /answer call
SCN-001 Bridge demo remains frontend-local fixed fixture path
SCN-001 live/backend document draft remains out of migration scope
logged-out /after remains accessible
protected /before and history gates still use backendUser.logged_in
```

Acceptance:

- Main route and implemented routes load from deployed frontend.
- CORS allows deployed frontend origin only.
- Firebase Console Authorized Domains includes the deployed Cloud Run frontend
  URL or custom domain. Google Sign-In fails with `auth/unauthorized-domain`
  until this is added.
- Next.js Cloud Run container build is verified with `output: "standalone"` plus
  `frontend/Dockerfile`, or an explicitly approved equivalent build strategy.
- Frontend image build passes `NEXT_PUBLIC_API_BASE_URL` and Firebase public web
  config as Docker build args; setting only Cloud Run runtime env vars is not
  enough for client-bundled `NEXT_PUBLIC_*` values.
- Firebase `inMemoryPersistence` policy remains unchanged.
- No raw flow payload is moved into Web Storage.

Rollback:

- Repoint frontend traffic to previous Cloud Run revision.
- Backend revision can stay stable if only frontend smoke fails.

### Phase 5 — CI/CD

Responsibility:

- Terraform: Workload Identity Federation, `github-actions-sa` impersonation and
  deploy IAM bindings.
- CI/scripts: GitHub Actions workflow, image build/push, Terraform plan/apply,
  Cloud Run deploy, post-deploy smoke, rollback command.
- Admin/manual: protected environment approval, production deploy approval,
  failed deploy review.

Terraform root:

- `infra/environments/{env}/cicd`

Modules:

- `workload-identity-federation`
- deploy IAM binding module if separated

Creates:

- GitHub OIDC trust to GCP
- `github-actions-sa` impersonation policy
- Artifact Registry writer permissions
- Cloud Run deploy permissions
- optional Terraform permissions for approved branches/environments

Workflow gates:

```text
pull_request:
  - frontend build
  - backend import/document smoke
  - terraform fmt/validate/plan
  - secret/dependency scan

main:
  - build images
  - push Artifact Registry
  - terraform plan/apply for selected env
  - deploy Cloud Run revisions
  - post-deploy smoke
```

Acceptance:

- No long-lived service account key JSON in GitHub Secrets.
- PR workflow can plan without applying.
- prod apply requires manual approval or protected environment.
- failed post-deploy smoke does not promote the new revision as stable.

Rollback:

- CI/CD rollback job shifts Cloud Run traffic to previous stable revisions.
- DB rollback remains manual/runbook-driven unless the migration is explicitly
  reversible.

### Phase 6 — Observability / Reliability

Responsibility:

- Terraform: log-based metrics, alert policies, cleanup/lifecycle policies.
- CI/scripts: alert test, rollback drill command, cleanup dry-run checks.
- Admin/manual: alert channel setup/approval, threshold tuning, incident response
  ownership, retention/cost approval.

Terraform root:

- `infra/environments/{env}/ops`

Modules:

- `monitoring-alerts`
- artifact bucket lifecycle settings, preferably inside `artifact-bucket`
- Artifact Registry cleanup settings, preferably inside `artifact-registry`

Creates:

- log-based metrics
- alert policies
- Cloud SQL backup failure alert policy where available, or a documented manual
  backup verification runbook if metrics are insufficient
- Storage lifecycle policy
- Artifact Registry cleanup policy

Minimum alerts:

| Alert | Signal |
|---|---|
| backend 5xx rate | sustained 5xx above threshold |
| provider timeout | repeated `provider_timeout` or OCR/provider failures |
| Cloud SQL saturation | high CPU or connection usage |

Acceptance:

- A rollback drill is documented and rehearsed once.
- Alert policies exist for prod.
- Artifact lifecycle deletion is enabled.
- Artifact Registry cleanup policy exists.

Rollback:

- Ops changes should be reversible independently from runtime.
- Alert thresholds can be tuned without app redeploy.

### Phase 7 — Optional Hardening

Responsibility:

- Terraform: candidate-specific resources only after approval.
- CI/scripts: candidate-specific smoke/load/security checks.
- Admin/manual: approve separate design, cost, and operational complexity.

Only open after Phase 1-6 are stable.

Candidates:

- backend Cloud Run IAM auth / service-to-service auth
- HTTPS Load Balancer + custom domain
- Cloud Armor
- private IP + Serverless VPC Access or Direct VPC egress
- API Gateway
- Cloud Run Jobs / Workflows for corpus ingestion automation

Rule:

- Each candidate needs a separate design note and cost/security reason.
- Do not mix optional hardening with SCN-004 demo freeze or public API contract
  changes.

## 7. Module Contract Checklist

Every Terraform module should document:

| Item | Required |
|---|---|
| Inputs | project id, region, env, naming prefix, labels |
| Outputs | resource ids needed by later layers |
| IAM grants | exact roles and target resources |
| Destructive behavior | whether deletion protection is enabled |
| Verification command | one command or console check |
| Rollback note | how to undo without damaging later phases |

Module design rules:

- Prefer resource-scoped IAM over project-wide IAM.
- Keep prod deletion protection on for Cloud SQL and state buckets.
- Keep secret values out of Terraform code and git.
- Use variables for env differences, not copied module forks.

## 8. Naming and Labeling Convention

Base variables:

| Variable | Value |
|---|---|
| `prefix` | `kls` |
| `env` | `dev` / `prod` |
| `primary_region` | `asia-northeast3` |

Resource names use `kls-{env}-{component}` where the provider allows it.

Examples:

| Resource | Example name |
|---|---|
| Frontend Cloud Run | `kls-prod-frontend` |
| Backend Cloud Run | `kls-prod-backend` |
| Artifact bucket | `kls-prod-{project_id}-artifacts` or `kls-prod-artifacts-{random_id}` |
| Cloud SQL | `kls-prod-sql` |
| Artifact Registry | `kls-prod-ar` |
| Backend service account | `kls-prod-backend-sa` |
| GitHub Actions service account | `kls-prod-github-actions-sa` |

Standard labels:

| Label | Value |
|---|---|
| `app` | `k-labor-shield` |
| `env` | `dev` / `prod` |
| `managed_by` | `terraform` |
| `owner` | `portfolio` |

## 9. Secret and Environment Variable Contract

### Secret Manager Values

Actual secret values are added as Secret Manager versions outside Terraform
state. Terraform may create secret resources and IAM bindings, but should not
store raw secret values in `.tf` files or state.

| Secret | Used by | Notes |
|---|---|---|
| `kls-{env}-db-user` | backend | If not using IAM DB auth in the first migration |
| `kls-{env}-db-password` | backend | Secret value added manually or by a secured CI step |
| `kls-{env}-db-name` | backend | Can be plain env if not sensitive; keep consistent |
| `kls-{env}-firebase-admin-json` | backend | Only if ADC/service identity cannot cover Firebase Admin |
| `kls-{env}-app-secret` | backend | Future use if an app signing/session secret is introduced |

Firebase public web config is not a private secret. It belongs in frontend
public environment variables, while Firebase Admin credentials stay backend-only.

### Cloud Run Environment Contract

| Service | Env | Source | Secret? |
|---|---|---|---|
| backend | `GCP_PROJECT` | Terraform variable/output; actual env var used by embedding/answer services | no |
| backend | `GCP_PROJECT_ID` | Same project value or derived from `GCP_PROJECT`; actual env var accepted by Before stack | no |
| backend | `GCP_LOCATION` | Terraform variable; actual env var used by Vertex paths | no |
| backend | `LLM_PROVIDER` | Terraform variable, expected `vertex` | no |
| backend | `DATABASE_URL` or DB parts | Secret Manager + Cloud SQL connector output | yes if URL contains credentials |
| backend | `DB_POOL_SIZE` | Phase 2 target guardrail; Phase 3 must verify/implement backend support before production claim | no |
| backend | `DB_MAX_OVERFLOW` | Phase 2 target guardrail; cap with Cloud Run max instances after support is verified | no |
| backend | `DB_POOL_TIMEOUT_SECONDS` | Phase 2 target guardrail; verify/implement backend support in Phase 3 | no |
| backend | `CLOUD_SQL_CONNECTION_NAME` | Terraform output | no |
| backend | `BEFORE_ARTIFACT_BUCKET` | Terraform output for GCS artifact adapter; current code does not read this until adapter is implemented | no |
| backend | `BACKEND_CORS_ORIGIN_REGEX` | frontend URL output / approved domain; actual env var used by `backend/main.py` | no |
| backend | Firebase Admin config | ADC/service identity or Secret Manager fallback | yes if credential JSON is used |
| frontend | `NEXT_PUBLIC_API_BASE_URL` | backend Cloud Run URL output; Docker build arg | no |
| frontend | `NEXT_PUBLIC_BEFORE_API_BASE_URL` | optional override for Before API client; defaults to `NEXT_PUBLIC_API_BASE_URL` when unset | no |
| frontend | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase public web config; Docker build arg | no |
| frontend | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase public web config; Docker build arg | no |
| frontend | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase public web config; Docker build arg | no |
| frontend | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase public web config; Docker build arg | no |
| frontend | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase public web config, if used; Docker build arg | no |
| frontend | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase public web config, if used; Docker build arg | no |

Backend Before-stack compatibility note:

- Current code also accepts `BEFORE_GOOGLE_APPLICATION_CREDENTIALS`,
  `BEFORE_GCP_PROJECT_ID`, `BEFORE_GCP_LOCATION`, `BEFORE_VERTEX_MODEL`,
  `VERTEX_MODEL`, and `PHASE_A_VERTEX_MODEL` as local/dev or Before-specific
  aliases.
- The first cloud migration should prefer the shared managed Vertex path with
  `GCP_PROJECT_ID`/`GCP_PROJECT`, `GCP_LOCATION`, and `VERTEX_ANSWER_MODEL`
  unless a deliberate Before-specific model/location split is opened.
- Do not wire local self-hosted provider envs into Cloud Run for the first
  migration target.

Firebase Admin ADC note:

- Do not grant Firebase service-agent roles such as
  `roles/firebase.sdkAdminServiceAgent` to normal runtime service accounts.
- Current backend code prefers ADC for Firebase Admin initialization when
  `GOOGLE_APPLICATION_CREDENTIALS`, Cloud Run `K_SERVICE`, or local ADC is
  present; otherwise it can use `FIREBASE_ADMIN_CREDENTIALS`.
- If backend ADC needs Firebase Authentication IAM beyond the default token
  verification path, use `roles/firebaseauth.admin` or a narrower custom role
  after validation. If that is too broad for production, fall back to an explicitly
  scoped Secret Manager credential policy and document the tradeoff.

## 10. Cost Guardrails

| Area | Guardrail |
|---|---|
| Cloud Run dev | `min_instance_count = 0`; cap max instances during early testing |
| Cloud Run prod | start with `min_instance_count = 0`; raise to `1` only if demo latency requires it |
| Cloud SQL | start with small tier; enable deletion protection in prod; set backup retention deliberately |
| Vertex AI | keep exact demo presets fixture-backed where already implemented; monitor request count and provider timeout |
| Cloud Storage | lifecycle deletion for Before artifacts, for example 7 or 30 days after policy decision |
| Artifact Registry | cleanup policy for old untagged images |
| Cloud Logging | set retention/exclusion policy for noisy non-audit logs |

Cloud SQL connection guardrail:

These names are the migration target contract. As of the `2026-04-29` docs-only
review, backend DB initialization must still be updated or otherwise verified to
consume them before a production-ready Phase 3 claim.

```text
(pool_size + max_overflow) * backend_max_cloud_run_instances
  < Cloud SQL max_connections - reserved admin connections
```

Small Cloud SQL tiers have low connection limits, so the small-tier cost choice is
only safe if backend pool size and Cloud Run `max_instance_count` are capped
together.

## 11. Dependency Map

```text
bootstrap
  -> foundation
      -> data
      -> cicd
  data + foundation
      -> runtime/backend
  runtime/backend
      -> runtime/frontend
  runtime + data
      -> ops
```

Critical dependency notes:

- `runtime/backend` depends on data outputs: Cloud SQL connection name, DB name,
  secret names, artifact bucket name.
- `runtime/frontend` depends on backend URL and Firebase public config.
- `cicd` depends on service accounts and Artifact Registry from `foundation`.
- `ops` depends on Cloud Run service names, Cloud SQL instance name, and bucket
  names.

## 12. Environment Strategy

| Env | Purpose | Cost posture | Data posture |
|---|---|---|---|
| `dev` | Terraform and deployment validation | smallest viable settings, low/no min instances | test corpus or reduced seed allowed if clearly marked |
| `prod` | portfolio/demo deployment | conservative but cost-controlled | full `1722` chunk seed and backup enabled |

If only one real GCP environment is affordable, keep both `dev` and `prod`
directories and instantiate only `prod` first. The module interface still stays
environment-ready.

## 13. Release Gate Summary

Do not promote a phase unless the previous phase meets its acceptance criteria.

| Gate | Blocks |
|---|---|
| Foundation IAM/storage check fails | all later phases |
| DB migration/seed count mismatch | backend runtime |
| Backend smoke fails | frontend launch and CI/CD promotion |
| Frontend route smoke fails | public demo promotion |
| CI/CD WIF fails | automated deployment |
| Alert/rollback drill missing | production-readiness claim |

## 14. First Implementation Order

Recommended first implementation sequence:

1. `bootstrap/remote-state`
2. `modules/project-services`
3. `modules/iam-service-accounts`
4. `modules/artifact-registry`
5. `modules/secret-manager`
6. `modules/artifact-bucket`
7. `modules/cloud-sql-postgres`
8. backend Cloud Run service
9. frontend Cloud Run service
10. Workload Identity Federation + GitHub Actions
11. monitoring alerts and cleanup policies

This order keeps the first live application deployment after the foundational
security, storage, and DB layers are already verifiable.
