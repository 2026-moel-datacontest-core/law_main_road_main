# 법대로(LawMainRoad) — Cloud Migration Phase Plan

기준일: `2026-05-07`

이 문서는 [`cloud_migration_architecture.md`](cloud_migration_architecture.md)의 GCP
migration target을 실제 구현 가능한 phase로 나눈 계획이다. 목표는 Terraform을
모듈화하고, 각 phase를 독립적으로 plan/apply/smoke할 수 있게 만드는 것이다.
각 phase의 작업 지시용 상세 체크리스트는 [`phase/`](phase/README.md)에 둔다.

## Terraform Authoring Contract

This is the contract for Terraform-writing passes. Phase 1 bootstrap/foundation
Terraform now exists under `infra/terraform`; later phase roots remain future
work until their phase is opened.

- Environment-specific operating values are defined in
  [`env_profiles.md`](env_profiles.md). This phase plan owns sequencing and
  resource ownership; the env profile document owns dev/demo/prod posture and
  scaling/sizing defaults.
- Terraform is authored in small phase roots. A phase root must be independently
  plan/apply/validate-able and must not require `terraform apply -target` as the
  normal path.
- Phase 0 is docs and decision freeze only. It has no Terraform root and creates
  no cloud resources.
- Phase 1 is the first resource phase. It owns remote state bootstrap,
  foundation APIs, service accounts, Artifact Registry, Secret Manager shells,
  and the private artifact bucket.
- Phase 7A custom domain / HTTPS Load Balancer / Gabia DNS remains optional
  hardening. It is not a hidden prerequisite for Phase 1-6.
- Terraform does not change application contracts. It must preserve
  `/api/v1/answer`, `/api/v1/documents/draft`, protected SCN-001 Bridge/history
  paths, SCN-004 demo freeze, SCN-001 frontend-local frozen draft behavior,
  Firebase `inMemoryPersistence`, and the Web Storage policy.
- Terraform must not own `pgvector` extension creation, schema migrations,
  vector indexes, `law_chunks` seed/import, image build logic, secret values, or
  runtime artifact payloads.

## GCP MFA And Runbook Script Contract

Human administrator access and repeatable operational commands are separate from
Terraform resource ownership.

| Area | Contract |
|---|---|
| GCP MFA | All human accounts used for GCP Console, `gcloud`, Terraform bootstrap, production approval, DNS cutover, or emergency rollback must have Google 2-Step Verification/MFA enabled before Phase 1 apply. |
| Enforcement owner | MFA is an admin/manual prerequisite. If the project is under Google Workspace or Cloud Identity, enforce/check it through the Admin console policy. For a personal Google account, enable 2-Step Verification on the account and record only PASS/FAIL. |
| Terraform role | Terraform should not store MFA secrets, recovery codes, or account recovery data. Terraform may document or later manage org/project security policy only if a separate organization-scope governance phase is opened. |
| CI/CD role | GitHub Actions uses Workload Identity Federation keyless auth. Non-interactive CI does not use a human MFA challenge and must not fall back to service account key JSON. |
| Runbook script role | Default operational automation should use small shell/Python scripts after Terraform has created resources. It belongs to the CI/scripts/manual automation lane, not the Terraform resource ownership lane. |
| Runbook script limits | Scripts must not create or drift Terraform-owned persistent resources, must not store secret values, and must not bypass approval gates for DB migration, seed, deploy, DNS cutover, or rollback. |

The AWS `aws-mfa-main-guide1` style is useful as a UX reference, but GCP does
not have a direct equivalent of `aws sts get-session-token` that accepts an OTP
and exports temporary access keys. The GCP version should be a login/preflight
guide that drives browser-based Google sign-in, ADC setup, optional service
account impersonation, and MFA attestation.

Suggested future GCP MFA guide layout, for documentation only in this phase:

```text
gcp-mfa-main-guide1/
  README.md
  gcp-mfa-login.sh
  gcp-mfa-clear.sh
```

Expected behavior:

- `gcp-mfa-login.sh <project_id> [terraform_sa_email]`
  - verifies `gcloud` is installed,
  - runs or instructs `gcloud auth login` for the human account,
  - runs or instructs `gcloud auth application-default login`,
  - sets the active project,
  - optionally sets `auth/impersonate_service_account` for `terraform-sa`,
  - blocks `GOOGLE_APPLICATION_CREDENTIALS_JSON` and committed service account
    key JSON paths,
  - verifies an access token can be minted,
  - records only `human_mfa_attested=PASS/FAIL`.
- `gcp-mfa-clear.sh`
  - unsets `auth/impersonate_service_account`,
  - unsets local credential env vars that should not leak into Cloud Run or CI,
  - does not revoke the user's Google account MFA setup.

Do not ask the script to collect OTP codes, recovery codes, QR screenshots, phone
numbers, or backup codes. MFA challenge handling remains in the Google browser
login/account security flow.

Suggested future shell/Python runbook layout, for documentation only in this
phase:

```text
scripts/cloud/
  phase1_foundation_check.sh
  phase1_secret_presence_check.sh
  phase2_migrate_seed.sh
  phase3_backend_smoke.py
  phase4_frontend_smoke.py
  phase6_log_redaction_check.py
  phase6_rollback_drill.sh
```

Do not create these files in a docs-only readiness pass. If implemented later,
prefer shell wrappers for `gcloud`, `terraform`, and rollback commands, and
Python scripts for JSON response assertions, DB checks, and log redaction checks.
Keep existing `backend/verify/*` and `backend/scripts/*` as the first reuse
targets before adding new automation.

## 1. Scope

### In Scope

- Cloud Run Frontend / Backend
- Cloud SQL PostgreSQL + pgvector
- Vertex AI managed model path
- private Cloud Storage artifact bucket for Before/After runtime artifacts
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
- custom domain / HTTPS Load Balancer, API Gateway, Cloud Armor, private IP/VPC
  as first migration requirements

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

The preferred authoring layout is below. Phase 1 has created the
bootstrap/foundation subset of this tree. Phase 2+ roots/modules remain planned
layout until their implementation phase opens.

```text
infra/terraform/
  bootstrap/
    remote-state/
      main.tf
      variables.tf
      outputs.tf
      versions.tf
      README.md
  modules/
    cloud-run-service/
    cloud-sql-pgvector/
    artifact-bucket/
    iam-wif/
    secret-manager/
    load-balancer-domain/        # optional Phase 7A only
    artifact-registry/           # supporting Phase 1 module
    project-services/            # supporting Phase 1 module
    monitoring-alerts/
  envs/
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

First implementation pass rule:

- Make `envs/dev/*` the only apply-ready environment roots.
- Keep `envs/prod/*` as skeleton, README, and `terraform.tfvars.example` material
  only. Do not add real prod backend state, real prod tfvars, or apply-ready prod
  resources until a separate prod-opening review approves exact prod sizing,
  backup, PITR, HA, deletion protection, deployment approvals, and cost posture.
- Reusable modules should be written with prod in mind, but prod resource
  creation is not part of the first cloud migration pass.

Implementation status on `2026-05-07`: Phase 1 created
`infra/terraform/bootstrap/remote-state`, `infra/terraform/envs/dev/foundation`,
Phase 1 modules, and `infra/terraform/envs/prod/foundation` skeleton material.
The bootstrap remote-state root and `envs/dev/foundation` have been applied for
the first `dev` target, and post-apply `terraform plan -detailed-exitcode`
checks returned no changes. Phase 2 `envs/dev/data` has also been applied for
the first `dev` target, and post-Terraform DB/data readiness has passed. Phase
3 `envs/dev/runtime/backend` has been applied for the first `dev` backend
runtime target, and health/auth-negative/retrieve/answer/document-draft smoke
evidence has passed. Phase 4 `envs/dev/runtime/frontend` has been applied for
the first `dev` frontend runtime target, and route/CORS/SCN-004/SCN-001 boundary
smoke passed. Firebase Authorized Domain, Google Sign-In, and protected SCN-001
history smoke passed through the deployed frontend. WIF/GitHub workflow and prod
resources remain unopened.

Notes:

- `cloud-sql-pgvector` is a naming convenience for Cloud SQL PostgreSQL that
  will host pgvector-backed tables. The module must not create the `vector`
  extension, schema, indexes, or seed rows.
- `iam-wif` can be split internally into service-account and WIF submodules if
  implementation clarity requires it, but the phase contract stays keyless and
  service-account-key-free.
- `load-balancer-domain` is optional Phase 7A only. Phase 1-6 must be valid on
  Cloud Run managed HTTPS URLs.

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

## 3A. State / Backend Decision

Terraform state is an internal cloud inventory and must be handled like a
sensitive operational asset even though most values are not password-like
secrets.

| Decision Area | Contract |
|---|---|
| Remote state need | Required for any shared/dev/prod cloud apply. Local state is allowed only for the first `bootstrap/remote-state` run before the bucket exists. |
| State bucket bootstrap | Phase 1 starts with a manual/local-state bootstrap root, then initializes later env roots against the versioned GCS backend bucket. Bootstrap local `terraform.tfstate*` files must never be committed and must be stored/exported/deleted according to the Phase 1 runbook after later remote backend roots are confirmed. A separate pre-existing bootstrap bucket is not the approved baseline. |
| State bucket policy | Versioning on, public access prevention on, uniform bucket-level access preferred, deletion/prevent-destroy guard for prod where practical. |
| State bucket naming | Follow the `lmr-{env/state}-{component}` style as appropriate and add a globally unique suffix when required. The exact state bucket name is internal inventory. |
| Secret values in tfstate | Disallowed by default. Terraform may create Secret Manager secret resources and IAM bindings, but raw secret versions are added manually or by secured CI outside Terraform state. `google_secret_manager_secret_version` is forbidden by default unless a later explicit security review approves an exception. |
| Sensitive outputs | Do not output DB passwords, credential-bearing `DATABASE_URL`, Firebase Admin JSON, tokens, raw artifact paths, raw payloads, or service account key material. |
| Internal inventory outputs | Project id/number, service account emails, bucket names, Cloud SQL connection names, WIF provider names, Secret Manager resource names, Terraform state bucket names, and direct `run.app` URLs are internal-only. Keep them in state/private runbooks, not public issue text, portfolio screenshots, or user-facing logs. |
| Destructive apply | Any replacement/delete of state bucket, prod Cloud SQL, prod artifact bucket, prod service accounts, or runtime Cloud Run services requires explicit human approval and rollback notes. |
| Destroy | `terraform destroy` is not a normal rollback for prod. Use Cloud Run revision rollback, backup/restore runbooks, and targeted cleanup only after dependency review. |

## 4. Phase Overview

| Phase | Name | Terraform root | Main output | Required before next |
|---:|---|---|---|---|
| 0 | Docs / Design Freeze | none | reviewed target docs | current/local checks still pass |
| 1 | Bootstrap + Foundation | `infra/terraform/bootstrap/remote-state`, `infra/terraform/envs/{env}/foundation` | state bucket, APIs, service accounts, AR, secrets, artifact bucket | IAM and storage checks pass |
| 2 | Data Foundation | `infra/terraform/envs/{env}/data` | Cloud SQL PostgreSQL + migration-ready DB | migration/seed smoke pass |
| 3 | Backend Runtime | `infra/terraform/envs/{env}/runtime/backend` | Cloud Run backend revision | `/health`, retrieval/answer smoke pass |
| 4 | Frontend Runtime | `infra/terraform/envs/{env}/runtime/frontend` | Cloud Run frontend revision | browser route smoke pass |
| 5 | CI/CD | `infra/terraform/envs/{env}/cicd` + GitHub workflow | keyless deploy pipeline | PR/main workflow dry run pass |
| 6 | Observability / Reliability | `infra/terraform/envs/{env}/ops` | alerts, rollback/runbook controls | alert and rollback drills pass |
| 7 | Optional Hardening | candidate root or `load-balancer-domain` module if approved | custom domain/LB/VPC/Armor/jobs if approved | separate design approval |

In the first implementation pass, every `{env}` placeholder in apply commands is
`dev`. `envs/prod/*` stays skeleton/README/tfvars-example only until a separate
prod-opening review.

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
| 0 | none | local build/import/document checks; optional shell/Python runbook design only | final scope approval; confirm Local LLM exclusion; confirm human GCP MFA requirement; decide whether to regenerate draw.io before presentation |
| 1 | remote state bucket, APIs, service accounts, Artifact Registry, Secret Manager secret shells, private artifact bucket, lifecycle baseline | `terraform fmt/validate/plan`; optional `gcloud describe` shell verification scripts | use the existing `law-main-road` GCP project with billing enabled; enable/check MFA for human admins; grant initial bootstrap permission; decide local user vs service-account impersonation for early Terraform; add actual secret versions outside Terraform state |
| 2 | Cloud SQL instance, application database shell, backup/PITR settings, SQL connection outputs, DB user/bootstrap contract | Alembic migration; pgvector/index verification; `law_chunks` seed import; row/dimension/index smoke; shell/Python migration/seed orchestration | approve DB sizing/region/backup retention; provide DB password secret value; approve destructive DB changes if ever needed |
| 3 | backend Cloud Run service, service identity, env/secret wiring, Cloud SQL connector, Storage/Vertex IAM, image reference, steady-state traffic | build/push backend image; pass immutable digest/tag into Terraform; backend API smoke; auth-negative smoke; Python/shell post-deploy smoke | approve temporary/pre-Firebase frontend CORS policy; inspect logs for sensitive payload leakage; decide rollback on smoke failure |
| 4 | frontend Cloud Run service, service identity, runtime env wiring, image reference, steady-state traffic | build/push frontend image; pass immutable digest/tag into Terraform; route/browser smoke; SCN-004/SCN-001 preset smoke; Python/shell route smoke | Firebase console checks such as authorized domains/provider settings if not managed by Terraform; confirm deployed frontend `run.app` URL is authorized; visual/demo approval |
| 5 | Workload Identity Federation, deploy IAM bindings, optional protected environment plumbing | GitHub Actions workflow; PR plan; main deploy; post-deploy smoke; rollback job command; shell/Python smoke/runbook scripts | configure GitHub protected environments/secrets policy; approve prod deploys; review failed deploys |
| 6 | log metrics, alert policies, lifecycle and cleanup policies | alert test scripts; rollback drill commands; cleanup dry-run checks; Python log-redaction and shell rollback-drill scripts | choose alert channels/thresholds; acknowledge/test incidents; approve retention/cost settings |
| 7 | optional hardening resources once approved | candidate-specific smoke/load/security checks; shell/Python validation scripts | approve separate design, cost, and operational complexity before opening each candidate |

### Manual Work That Must Not Be Hidden In Terraform

- Human GCP MFA / 2-Step Verification enrollment, recovery planning, and lockout
  checks.
- Secret values: store through Secret Manager versions, not Terraform literals.
- One-off or versioned DB migration execution.
- `law_chunks` corpus seed/import and verification.
- Firebase console/provider/domain checks unless a later Firebase Terraform scope
  is explicitly opened.
- Gabia registrar/DNS ownership, custom-domain cutover timing, and certificate
  readiness checks for Phase 7A.
- Initial local Terraform authentication and the first `bootstrap/remote-state`
  migration step before Workload Identity Federation is available.
- Production go/no-go and rollback decisions.
- Incident threshold tuning after observing real traffic.
- Shell/Python runbook script approval for any task that mutates deployment, DB,
  DNS, or rollback state.

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
- Confirm Cloud Run build readiness gaps. A docs-only code read rechecked on `2026-05-04`
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
- `images_drawio/final_architecture_overview.drawio` and
  `images_drawio/final_architecture_detail.drawio` are the current visual sources
  for presentation/handoff; their PNG previews must be regenerated after visual
  edits.
- Current docs/visual status on `2026-05-06`: the diagrams must show the private
  artifact bucket as target-after-adapter or attach the Phase 3 GCS adapter
  blocker. They must not imply the current local filesystem writers are already
  durable GCS writers.

### Phase 1 — Bootstrap + Foundation

Responsibility:

- Terraform: remote state, APIs, service accounts, Artifact Registry, Secret
  Manager secret resources, private Before/After artifact bucket, baseline lifecycle settings.
- CI/scripts: Terraform formatting/validation/plan and resource describe checks.
- Admin/manual: create/select GCP project and billing, perform initial bootstrap
  authorization, decide local user vs `terraform-sa` impersonation for early
  Terraform, add secret versions outside Terraform state.

Terraform roots:

- `infra/terraform/bootstrap/remote-state`
- `infra/terraform/envs/{env}/foundation`

First actual apply substitutes `{env}=dev` only. `envs/prod/*` stays
skeleton/README/tfvars-example material until a separate prod-opening review.

Bootstrap state note:

- `infra/terraform/bootstrap/remote-state` starts with local Terraform state on the first
  run because the GCS backend bucket does not exist yet.
- After `terraform apply` creates the state bucket, initialize later env roots
  with the GCS backend bucket and the phase-specific state prefix. The
  bootstrap root itself intentionally keeps no committed remote backend block in
  this baseline.
- Do not configure a remote backend inside `bootstrap/remote-state` itself for
  the approved baseline.
- Bootstrap local `terraform.tfstate*` files must never be committed. Store,
  export, or delete them according to the Phase 1 runbook after later remote
  backend roots are confirmed.

Modules:

- `project-services`
- `iam-wif` service-account foundation slice
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
- private Before/After runtime artifact bucket with public access prevention and
  uniform bucket-level access

Bucket naming:

- GCS bucket names are globally unique. Do not hardcode only
  `lmr-{env}-artifacts` for Terraform apply.
- Use a deterministic unique suffix such as project id
  (`lmr-{env}-{project_id}-artifacts`) or a Terraform `random_id` suffix, and
  expose the final bucket name as a foundation output. `lmr-{env}-artifacts` is
  a bucket naming pattern, not an environment variable name.

Phase 1 default `terraform-sa` roles:

| Area | Candidate role |
|---|---|
| Required API enablement | `roles/serviceusage.serviceUsageAdmin` |
| State/artifact buckets | `roles/storage.admin`, narrowed to bucket scope where possible |
| Secret Manager | `roles/secretmanager.admin` |
| Artifact Registry | `roles/artifactregistry.admin` |
| Service accounts | `roles/iam.serviceAccountAdmin`, `roles/iam.serviceAccountUser` |

Do not grant `roles/owner` or `roles/editor` for normal Terraform execution.
Do not grant service-account-key admin or Firebase service-agent roles.
Any broader bootstrap-only IAM grant must be documented as temporary and removed
after foundation is applied.
Cloud Run, Cloud SQL, monitoring, logging, and deploy permissions are reviewed
and added by the phases that first need them; Phase 1 does not grant those roles
by default.

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

- `infra/terraform/envs/{env}/data`

Modules:

- `cloud-sql-pgvector`

Creates:

- Cloud SQL PostgreSQL instance
- application database shell
- non-secret app DB user/bootstrap contract
- backup/PITR settings for prod; dev backup retention target is 1-3 days and
  prod backup retention baseline is 7 days
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
  rechecked on `2026-05-04` confirmed current `backend/app/db.py` initializes SQLAlchemy
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
- dev exact tier/storage was closed by the first Phase 2 apply:
  `POSTGRES_17`, `ENTERPRISE`, `db-f1-micro`, 10 GB SSD, 20 GB auto-increase
  cap, 3 retained backups, PITR off, `ZONAL`, HA off, deletion protection false.
- dev starts with minimum viable Cloud SQL PostgreSQL + pgvector, backup
  retention 1-3 days, and no initial HA requirement.
- prod later starts with a small production tier, backup retention baseline 7
  days, and prod-only PITR baseline unless a cost exception is approved before
  prod opens.

Current `dev` status on `2026-05-07`:

- Cloud SQL PostgreSQL instance and `klabor` application database exist.
- DB bootstrap completed outside Terraform; split DB Secret Manager versions
  were added for DB user/name/password, while the credential-bearing
  database-url version remains uncreated.
- pgvector exists, Alembic is at head `20260427_000007`, `law_chunks` has `1722`
  rows with `selected_as_of = 2026-04-11`, embeddings are complete at 768
  dimensions with zero null rows, and HNSW index verification passed.
- Retrieval smoke passed for `top_k=5` and `top_k=10`; answer smoke passed for
  `gemini-2.5-flash` with non-empty citations/grounding and
  `citation_violations=0`.
- Cloud Run deploy, backend runtime IAM/Cloud SQL Client, WIF/GitHub workflow,
  service account key JSON, prod resources, and backend/frontend/API/runtime
  code changes remain unopened.

Rollback:

- Backward-compatible migrations by default.
- Take backup before destructive changes.
- Destructive schema changes are not part of the first migration.

### Phase 3 — Backend Runtime

Responsibility:

- Terraform: backend Cloud Run service, `backend-sa` identity, env/secret wiring,
  Cloud SQL connector, Storage/Vertex IAM.
- CI/scripts: backend image build/push, pass immutable digest/tag into Terraform,
  backend smoke tests.
- Admin/manual: approve allowed origins and temporary CORS bootstrap, inspect
  sensitive log policy, decide rollback if smoke fails.

Terraform root:

- `infra/terraform/envs/{env}/runtime/backend`

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
- public Vertex-calling route guardrail config, where implemented

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
- Public `/api/v1/answer`, `/api/v1/retrieve`, and Before OCR/content review
  paths can create Vertex cost. CORS is not abuse protection. Phase 3 must either
  implement/verify server-side request/body and per-caller rate/cost controls, or
  mark the public backend as dev/demo-only until an approved limiter or Phase 7
  edge protection is opened.

Pre-WIF image push:

- Workload Identity Federation is not available until Phase 5. During Phase 3/4,
  push images locally with a developer/admin account using `gcloud auth login`
  and `gcloud auth configure-docker`.
- Do not create, commit, or store a service account key JSON for this temporary
  image push path.

CORS bootstrap note:

- The frontend URL is not known until Phase 4. Deploy the backend with an
  explicitly approved temporary `BACKEND_CORS_ORIGIN_REGEX`, then update that
  env var after the frontend Cloud Run `run.app` URL is confirmed. If Phase 7A
  later introduces a custom domain, re-apply CORS again in that phase.
- Avoid leaving wildcard CORS in prod after Phase 4 or Phase 7A.

Firebase Admin ADC note:

- Current backend initialization in `backend/app/services/auth_service.py`
  prefers ADC when `GOOGLE_APPLICATION_CREDENTIALS`, Cloud Run `K_SERVICE`, or
  local ADC is present; otherwise local/dev code can fall back to
  `FIREBASE_ADMIN_CREDENTIALS`. Cloud Run migration must not rely on that local
  credential fallback.
- Phase 3 smoke must verify `GET /api/v1/auth/me` with a real Firebase ID token
  on Cloud Run. If ADC initialization fails in Cloud Run, fix the ADC/IAM path
  or open a separate security exception; do not add a Firebase Admin JSON secret
  or service account key JSON in Phase 1-6.

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
- Public Vertex-calling paths have request/body limits and rate/cost guardrails,
  or the backend is explicitly marked dev/demo-only/non-production.
- `/api/v1/answer` and `/api/v1/documents/draft` response contracts are unchanged.
- `GET /api/v1/auth/me` verifies Firebase ID tokens on Cloud Run using
  ADC/service identity.
- Logs do not include raw contract text, Firebase uid, provider subject, email,
  tokens, raw Bridge payload, or raw full answer/draft payload.
- After the first post-deploy smoke, manually sample Cloud Logging entries for
  the protected and public paths above. If noisy or risky fields appear, add
  structured-log redaction or Cloud Logging exclusion filters before promotion.

Current `dev` status on `2026-05-07`:

- Backend Cloud Run service `lmr-dev-backend` has a latest ready revision
  `lmr-dev-backend-00001-vzr`; the direct backend `run.app` URL is kept in the
  private runbook as internal inventory.
- `allUsers` run invoker binding exists for controlled dev smoke.
- Startup logs and per-smoke log samples had `severity >= ERROR` count `0`; the
  sampled secret-leak checks had `0` matches.
- DB pool runtime env values are `DB_POOL_SIZE=2`, `DB_MAX_OVERFLOW=3`, and
  `DB_POOL_TIMEOUT_SECONDS=30`.
- Runtime IAM applied for backend service identity: Cloud SQL Client and Vertex
  AI User.
- Backend database-url Secret Manager version exists; raw secret values and
  credential-bearing URLs are not documented.
- `/health`, auth-negative, retrieve, answer, and SCN-004 document draft smoke
  checks passed with the counts recorded in
  [`phase/phase3_backend_runtime.md`](phase/phase3_backend_runtime.md#2a-dev-runtime-smoke-evidence).
- WIF/GitHub workflow, prod resources, and public production-ready API hardening
  remain unopened. Frontend Cloud Run is now handled by Phase 4.

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

- `infra/terraform/envs/{env}/runtime/frontend`

Module:

- `cloud-run-service` for frontend

Creates:

- frontend Cloud Run service
- frontend service identity = `frontend-sa`
- frontend URL outputs for Firebase Authorized Domain and smoke

Build-time inputs:

- `NEXT_PUBLIC_API_BASE_URL`
- Firebase public web config build args

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
  URL. Google Sign-In fails with `auth/unauthorized-domain` until this is added.
  Custom domains are handled by Phase 7A.
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

- `infra/terraform/envs/{env}/cicd`

Modules:

- `iam-wif`
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
  - resolve immutable image digests/tags
  - pass image digests/tags into Terraform
  - terraform plan/apply for selected env so Terraform-owned Cloud Run service updates create revisions
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

- `infra/terraform/envs/{env}/ops`

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
- Treat project ids, project numbers, service account emails, bucket names,
  Cloud SQL connection names, WIF provider names, Secret Manager names, and
  direct `run.app` URLs as internal cloud identifiers. They may exist in
  Terraform state/private runbooks, but public portfolio docs/screenshots should
  use placeholders or approved custom domains.
- Use variables for env differences, not copied module forks.

## 8. Naming and Labeling Convention

Base variables:

| Variable | Value |
|---|---|
| `prefix` | `lmr` |
| `env` | `dev` / `prod` |
| `primary_region` | `asia-northeast3` |

Resource names use `lmr-{env}-{component}` where the provider allows it.

Examples:

| Resource | Example name |
|---|---|
| Frontend Cloud Run | `lmr-dev-frontend` |
| Backend Cloud Run | `lmr-dev-backend` |
| Artifact bucket | `lmr-dev-{project_id}-artifacts` or `lmr-dev-artifacts-{random_id}` |
| Cloud SQL | `lmr-dev-sql` |
| Artifact Registry | `lmr-dev-ar` |
| Backend service account | `lmr-dev-backend-sa` |
| GitHub Actions service account | `lmr-dev-github-actions-sa` |

Standard labels:

| Label | Value |
|---|---|
| `app` | `law-main-road` |
| `env` | `dev` / `prod` |
| `managed_by` | `terraform` |
| `owner` | `portfolio` |

## 9. Secret and Environment Variable Contract

### Secret Manager Values

Actual secret values are added as Secret Manager versions outside Terraform
state. Terraform may create secret resources and IAM bindings, but should not
store raw secret values in `.tf` files or state. Terraform resource
`google_secret_manager_secret_version` is forbidden by default unless a later
explicit security review approves an exception.

| Secret | Used by | Notes |
|---|---|---|
| `lmr-{env}-database-url` | backend | Current backend-compatible credential-bearing DB URL; value added manually or by a secured CI step outside Terraform state |
| `lmr-{env}-db-user` | backend | If not using IAM DB auth in the first migration |
| `lmr-{env}-db-password` | backend | Secret value added manually or by a secured CI step |
| `lmr-{env}-db-name` | backend | Can be plain env if not sensitive; keep consistent |
| `lmr-{env}-app-secret` | backend | Future use if an app signing/session secret is introduced |

Firebase public web config is not a private secret. It belongs in frontend
public environment variables. Firebase Admin uses Cloud Run service identity /
ADC in the current migration; do not create a Firebase Admin JSON secret shell or
store service account key JSON.

Cloud identifier note:

- `GCP_PROJECT`, `GCP_PROJECT_ID`, `CLOUD_SQL_CONNECTION_NAME`, service account
  emails, Secret Manager names, bucket names, and WIF provider names are not
  password-like secrets, but they are internal inventory. Do not expose exact
  values in public portfolio content, screenshots, frontend UI, browser storage,
  or user-facing logs.
- Use custom domains for public demo URLs after Phase 7A. Keep direct backend
  `run.app` URLs out of public portfolio material when a custom API domain is
  available.
- Do not add any `VERTEX_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, or
  service-account-key style env var to this contract for Cloud Run runtime.
  Vertex AI uses backend service identity/ADC.

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
| backend | `ARTIFACT_BUCKET_NAME` | Preferred candidate env var for the future GCS adapter only. Current code does not read it; do not wire it as active runtime config until Phase 3 implements/verifies adapter support. This env var is separate from the `lmr-{env}-artifacts` bucket naming pattern. | no |
| backend | `BACKEND_CORS_ORIGIN_REGEX` | frontend URL output / approved domain; actual env var used by `backend/main.py` | no |
| backend | Firebase Admin config | ADC/service identity only for the current migration; credential JSON fallback is not opened | no |
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
  present; otherwise local/dev code can use `FIREBASE_ADMIN_CREDENTIALS`.
  Cloud Run migration must not rely on that local credential fallback.
- If backend ADC needs Firebase Authentication IAM beyond the default token
  verification path, use `roles/firebaseauth.admin` or a narrower custom role
  after validation. If that is too broad for production, open a separate
  security exception instead of creating a service account key JSON fallback in
  Phase 1-6.

## 10. Cost Guardrails

| Area | Guardrail |
|---|---|
| Cloud Run dev | `min_instance_count = 0`; cap max instances during early testing |
| Cloud Run demo/contest | after dev smoke, temporarily set min instances to `1` only during the judging/presentation window if latency needs it; see `env_profiles.md` |
| Cloud Run prod | not opened; choose min instances only during separate prod-opening review based on latency SLO and cost approval |
| Cloud SQL | dev starts minimum viable; prod later starts with a small production tier; enable deletion protection in prod; set dev backup retention to 1-3 days and prod baseline to 7 days |
| Vertex AI | keep exact demo presets fixture-backed where already implemented; public Vertex-calling routes need server-side request/body limits, per-caller rate/cost controls or dev/demo-only marking, request-count/provider-timeout monitoring, and budget/quota alerts |
| Billing/Budget | budget alert is a Terraform-managed target where billing permissions allow; otherwise use a billing/admin manual checklist fallback |
| Cloud Storage | lifecycle deletion for Before/After runtime artifacts, for example 7 or 30 days after policy decision |
| Artifact Registry | cleanup policy for old untagged images |
| Cloud Logging | set retention/exclusion policy for noisy non-audit logs |

Cloud SQL connection guardrail:

These names are the migration target contract. As of the `2026-05-04` docs-only
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

Detailed dev/demo/prod settings live in [`env_profiles.md`](env_profiles.md).
This section only records the high-level phase strategy.

| Env | Purpose | Cost posture | Data posture |
|---|---|---|---|
| `dev` | first cloud migration target; Terraform and deployment validation | smallest viable settings, low/no min instances | test corpus or reduced seed allowed if clearly marked |
| `demo/contest` | public contest/portfolio/presentation posture after dev smoke | temporarily warmer Cloud Run and stronger monitoring | normally dev-backed; not production-ready |
| `prod` | later real-user operation | conservative but cost-controlled | full `1722` chunk seed and backup enabled |

Keep both `dev` and `prod` directories, but make only `dev` apply-ready and
instantiate only `dev` first. Keep `prod` as skeleton/README/tfvars-example
material until a separate prod-opening review approves exact prod sizing,
backup, PITR, HA, deletion protection, deployment approvals, and cost posture.
The initial GCP model uses one project with env-prefixed resources. Separate
dev/prod GCP projects are deferred to future hardening.

### Phase 0 Decision Closure

Use this table when opening implementation issues. Do not keep finalized items
in generic "decision needed" lists.

| Status | Items |
|---|---|
| Finalized now | first target `dev` only; `envs/dev` and `envs/prod` layout with only `envs/dev` apply-ready and only `dev` instantiated first; `envs/prod` skeleton/README/tfvars-example only until a separate prod-opening review; one GCP project with env-prefixed resources; `law-main-road` app label; `lmr` prefix; `lmr-{env}-{component}` naming where allowed; local-state bootstrap for GCS tfstate bucket; env roots use GCS remote backend after bootstrap; bootstrap local `terraform.tfstate*` never committed; Terraform creates Secret Manager secret resources only; no Terraform-managed secret values by default; `google_secret_manager_secret_version` forbidden by default; one private artifact bucket per env; globally unique variant of `lmr-{env}-artifacts`; `before-runs/` and `after-runs/` object prefixes; Phase 4 uses Cloud Run `run.app`; baseline migration does not include host configuration-management tooling. |
| Phase-gated decision | Closed by Phase 2 dev apply: dev Cloud SQL exact tier/storage and DB/data readiness. Closed by Phase 3 dev backend smoke: backend Cloud Run runtime deploy, database-url secret version presence, backend Cloud SQL/Vertex runtime IAM, DB pool env wiring, and health/auth-negative/retrieve/answer/document draft smoke evidence. Phase 2 before prod opening: prod exact tier, PITR cost exception, backup retention confirmation. Phase 3 or later before any production-ready public API claim: GCS adapter durability, public endpoint rate/body/cost guardrails, and artifact retrieval mode if UI/runtime needs it. Phase 6: budget alert Terraform management if billing IAM allows, otherwise billing/admin checklist fallback. Phase 6: exact alert thresholds after baseline smoke/traffic. |
| Deferred by design | separate dev/prod GCP projects; Phase 7A custom domain / HTTPS Load Balancer / Gabia DNS; `api.<domain>` backend public endpoint; advanced SLO/alerting; signed URL/auth proxy/artifact retrieval UI unless required later. |

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

1. `infra/terraform/bootstrap/remote-state`
2. `infra/terraform/modules/project-services`
3. `infra/terraform/modules/iam-wif` service-account foundation slice
4. `infra/terraform/modules/artifact-registry`
5. `infra/terraform/modules/secret-manager`
6. `infra/terraform/modules/artifact-bucket`
7. `infra/terraform/modules/cloud-sql-pgvector`
8. backend Cloud Run service
9. frontend Cloud Run service
10. `infra/terraform/modules/iam-wif` WIF slice + GitHub Actions
11. monitoring alerts and cleanup policies
12. optional `infra/terraform/modules/load-balancer-domain` Phase 7A launch

This order keeps the first live application deployment after the foundational
security, storage, and DB layers are already verifiable.

## 15. Issue Slicing Guidance

Use the phase files as the tactical source, but do not force each phase into one
large GitHub issue when the implementation can be safer as smaller tickets.

Recommended issue split:

| Issue type | Recommended scope | Keep separate from |
|---|---|---|
| Docs readiness | Phase 0 final review, decision log, diagram regenerate note | Terraform implementation |
| Foundation infra | Phase 1 bootstrap/foundation Terraform modules and outputs | Cloud SQL, Cloud Run deploy |
| Data foundation | Phase 2 Cloud SQL module plus migration/seed runbook | Backend Cloud Run runtime |
| Backend runtime | Phase 3 backend image/deploy/env/IAM/smoke | Frontend runtime and WIF |
| Artifact adapter | GCS adapter for current Before/After local artifact writes, bucket env naming decision, sensitive access boundary | Public API contract changes, Step 3 full retention lifecycle |
| Frontend runtime | Phase 4 frontend image/build-time `NEXT_PUBLIC_*`, Firebase domain, CORS re-apply, browser smoke | Backend API/schema changes |
| CI/CD | Phase 5 WIF/workflows/rollback automation | Runtime feature changes |
| Shell/Python runbooks | Optional scripts for MFA prerequisite evidence, resource describe checks, migration/seed orchestration, post-deploy smoke, log redaction check, rollback drill | Terraform resource ownership and secret value storage |
| Observability | Phase 6 metrics/alerts/lifecycle/rollback drill | New structured logging code unless separately approved |
| Custom domain launch | Phase 7A Gabia DNS, HTTPS Load Balancer, serverless NEG, certificate, Firebase Authorized Domains, CORS, smoke | Phase 1-6 acceptance criteria and API contract changes |
| Optional hardening | One Phase 7 candidate per design note | Phase 1-6 acceptance criteria |

Every issue should include:

- purpose and phase,
- explicit in-scope and out-of-scope bullets,
- issue title,
- Terraform-managed resources,
- manual prerequisites,
- inputs/variables,
- outputs,
- secrets handling,
- apply order,
- validation command candidates,
- rollback/delete policy,
- do-not-manage-yet list,
- entry criteria from the previous phase,
- acceptance criteria,
- rollback or cleanup note,
- secret/IAM warning,
- SCN-004 freeze and SCN-001 auth/privacy boundary warning where relevant.

Do not combine cloud migration implementation with SCN-004 demo freeze changes,
SCN-001 live/backend draft generation, protected SCN-001 draft endpoint design,
auth persistence changes, or Web Storage policy changes.
