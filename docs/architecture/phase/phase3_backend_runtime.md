# Phase 3 — Backend Runtime

기준일: `2026-05-11`

## 1. Goal

Phase 3는 FastAPI backend를 Cloud Run에 올리고, Cloud SQL, Vertex AI,
Firebase Auth, Secret Manager, artifact storage, public/protected API smoke를
검증한다. 이 단계는 frontend Cloud Run 배포 전 backend runtime boundary를 먼저
안정화하는 단계다.

핵심 목표는 다음과 같다.

- Backend container image build/push 경로를 만든다.
- Backend Cloud Run service를 배포한다.
- `backend-sa` runtime identity를 붙인다.
- Secret Manager, Cloud SQL connector, Vertex AI, artifact bucket IAM을 연결한다.
- Cloud SQL connection pool과 Cloud Run scale cap을 함께 제한한다.
- Firebase ID token verification이 Cloud Run에서 동작하는지 확인한다.
- CORS bootstrap 정책을 적용하고 Phase 4에서 재조정할 output을 남긴다.
- `/api/v1/answer`, `/api/v1/retrieve`, Before OCR/content review처럼 Vertex
  비용을 만들 수 있는 public 경로의 server-side abuse/cost guardrail을
  구현/검증하거나, public backend를 dev/demo-only smoke로 명확히 제한한다.
- 민감정보가 log와 artifact 경계 밖으로 새지 않는지 샘플링한다.

## 2. Phase Status

| Item | Status |
|---|---|
| Phase type | Backend runtime deployment |
| Primary Terraform root | `infra/terraform/envs/{env}/runtime/backend` |
| Primary module | `infra/terraform/modules/cloud-run-service` |
| Runtime service | FastAPI backend on Cloud Run |
| Image source | Artifact Registry backend image |
| Required previous phase | [`phase2_data_foundation.md`](phase2_data_foundation.md) |
| Next phase | [`phase4_frontend_runtime.md`](phase4_frontend_runtime.md) |

## 2A. Dev Runtime Smoke Evidence

Evidence date: `2026-05-07`

Scope and inventory handling:

- Target profile: `dev`.
- Backend Cloud Run service: `lmr-dev-backend`.
- Latest ready revision: `lmr-dev-backend-00001-vzr`.
- Backend direct `run.app` URL is recorded in the private runbook only and is
  not repeated here, because direct backend URLs are internal cloud inventory.
- `allUsers` `roles/run.invoker` binding exists for controlled dev smoke.
- WIF/GitHub workflow, frontend Cloud Run, and prod resources remain unopened.

Runtime wiring evidence:

- Startup logs with `severity >= ERROR`: `0`.
- Startup secret leak sample matches: `0`.
- DB pool env values: `DB_POOL_SIZE=2`, `DB_MAX_OVERFLOW=3`,
  `DB_POOL_TIMEOUT_SECONDS=30`.
- Runtime IAM applied for backend service identity:
  `roles/cloudsql.client` and `roles/aiplatform.user`.
- Backend database-url Secret Manager version exists. The raw value,
  credential-bearing URL, token material, Firebase uid/provider subject, and
  private key material are not documented.

Smoke checks:

| Check | Evidence |
|---|---|
| `/health` | `GET /health` returned `200`; body object keys: `status`; logs `severity >= ERROR` count `0`; secret leak sample `0` matches. |
| Auth negative | `GET /api/v1/auth/me` without token returned `200` with `logged_in=false`; protected SCN-001 endpoints with missing/invalid token returned `401`; logs `severity >= ERROR` count `0`; secret leak sample `0` matches. |
| Retrieve | `POST /api/v1/retrieve` ran once with `top_k=5`, `ef_search=100`; status `200`; response keys: `query`, `total`, `chunks`, `cited_articles`; `total=5`, `chunks.length=5`, `cited_articles` non-empty; logs `severity >= ERROR` count `0`; secret leak sample `0` matches. |
| Answer | `POST /api/v1/answer` ran once with `top_k=5`, `ef_search=100`; status `200`; `answer`, `key_points`, and `cautions` generated; `cited_articles` non-empty; `retrieved_chunks=5`; `grounded_context_ids` non-empty; no surfaced timeout/retry/error; logs `severity >= ERROR` count `0`; secret leak sample `0` matches. |
| Document draft | `POST /api/v1/documents/draft` ran once using `document_draft_scn004_unfair_dismissal_brief.json` plus answer-derived legal basis fixture; status `200`; `rendered_text` non-empty with length `1456`; `missing_fields[3]`, `cautions[6]`, `evidence_checklist[7]`, `cited_articles[5]`, `source_context_ids[5]`, `missing_legal_basis[0]`; logs `severity >= ERROR` count `0`; suspicious secret leak sample `0` matches. The raw rendered text is not recorded. |

Document draft persistence note:

- The document draft endpoint may create normal `after_artifact_runs` / artifact
  persistence side effects when it runs. This evidence records the already-run
  smoke result only; this docs update did not re-call endpoints, run Terraform,
  or perform any DB mutation.

Current promotion boundary:

- This is a `dev/demo-only` backend runtime smoke pass, not a production-ready
  public API claim.
- At Phase 3 completion, frontend runtime, WIF/GitHub deploy automation, prod
  resources, custom domain, and Phase 7 edge hardening were unopened. Later
  phases completed dev frontend/WIF/ops and the Phase 7A `www` custom-domain
  slice; prod and stronger edge/API hardening remain unopened.

## 3. Read First

Phase 3 작업자는 아래 순서로 읽는다.

1. repo root `AGENTS.md`
2. repo root `CLAUDE.md`
3. [`../CLAUDE.md`](../CLAUDE.md)
4. [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md)
5. [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md)
6. [`phase2_data_foundation.md`](phase2_data_foundation.md)
7. this file
8. `backend/CLAUDE.md`
9. `backend/main.py`
10. `backend/app/services/auth_service.py`
11. `backend/app/db.py`

## 4. Preconditions

Phase 3를 시작하기 전에 확인한다.

| Precondition | Required State |
|---|---|
| Phase 1 foundation | service accounts, Artifact Registry, Secret Manager shells, artifact bucket exist |
| Phase 2 data | Cloud SQL exists and migration/seed smoke passed |
| Cloud SQL output | connection name, database name, region available |
| DB pool values | selected in Phase 2 |
| DB pool support path | current `backend/app/db.py` support implemented/verified, or equivalent connection cap approved |
| DB credential | Secret Manager value added outside Terraform |
| Firebase project | selected and `FIREBASE_PROJECT_ID` known |
| Backend image contract | Dockerfile/build strategy exists before image build |
| Artifact storage strategy | GCS adapter implemented for current Before/After artifact writes, or non-durable local artifact behavior explicitly accepted for a limited smoke |
| Public AI API guardrail | server-side request/body and rate/cost controls selected, or backend public access is explicitly dev/demo-only until approved limiter/edge protection |
| GCP auth | local admin/developer path available before Phase 5 WIF |
| Frontend URL | not available yet |

If `backend/Dockerfile` or an equivalent Cloud Run build strategy is missing,
Phase 3 implementation starts there. Do not mark Phase 3 complete with only a
source-tree import check.

## 5. Scope

### In Scope

- Backend Cloud Run service.
- Backend runtime service account attachment.
- Backend image build/push path.
- Secret Manager injection.
- Cloud SQL connector binding.
- Backend env var wiring.
- Runtime IAM for Cloud SQL, Secret Manager, Vertex AI, and artifact bucket.
- CORS bootstrap before frontend exists.
- Firebase Admin ADC/fallback verification.
- Public API smoke checks.
- Public Vertex-calling endpoint request/body and rate/cost guardrail checks, or
  explicit dev/demo-only/non-production marking.
- Protected API auth-negative and valid-token smoke checks.
- Cloud Logging sensitive-field sample check.
- Cloud Run revision rollback procedure.

### Out Of Scope

- Frontend Cloud Run service.
- Firebase Authorized Domain setup for frontend login UI.
- GitHub Actions WIF and full CI/CD.
- Cloud SQL creation.
- DB schema migration or corpus seed changes.
- API Gateway, Cloud Armor, private IP, Serverless VPC Access.
- Broad eval or RAG behavior changes.
- Changing `/api/v1/answer` or `/api/v1/documents/draft` contracts.
- SCN-001 live/backend draft generation.
- Step 3 full retention lifecycle.

## 6. Terraform Layout

Create or maintain this layout.

```text
infra/terraform/
  modules/
    cloud-run-service/
      main.tf
      variables.tf
      outputs.tf
      README.md
  envs/
    dev/
      runtime/
        backend/
          main.tf
          variables.tf
          outputs.tf
          versions.tf
          terraform.tfvars.example
    prod/
      runtime/
        backend/
          main.tf
          variables.tf
          outputs.tf
          versions.tf
          terraform.tfvars.example
```

The `runtime/backend` root consumes outputs from:

- `foundation`
- `data`

Do not merge backend and frontend runtime roots. Backend should be independently
plan/apply/smoke-testable before Phase 4.

## 6A. Terraform Authoring Map

| Item | Phase 3 Contract |
|---|---|
| Terraform-managed resources | Backend Cloud Run service/revisions, backend service identity attachment, env/secret references, Cloud SQL connector binding, runtime IAM for Cloud SQL/Secret Manager/Vertex/artifact bucket, scaling/ingress/CORS env |
| Manual prerequisites | Phase 1/2 outputs, backend image build strategy, DB credential Secret Manager version, Firebase project/token smoke path, artifact durability decision, public AI API guardrail decision |
| Inputs/variables | backend image digest/tag, backend service account email, SQL connection name, DB secret names, bucket name output, Vertex project/location/model vars, CORS regex, scaling/pool values, rate/body limit config if implemented |
| Outputs | backend URL, service name, revision, service account email, CORS update target, smoke target |
| Secrets handling | secret references only; no DB password, Firebase Admin JSON, service account JSON, raw artifact payloads, or credential-bearing URLs in Terraform outputs |
| Apply order | build/push backend image outside Terraform -> apply `envs/{env}/runtime/backend` -> backend smoke -> log sample |
| Validation command candidates | Docker/image build, Terraform fmt/validate/plan/apply, `/health`, retrieve/answer/draft/auth-negative/valid-token smoke, sensitive log sample |
| Rollback/delete policy | rollback Cloud Run revision/traffic first; reconcile emergency manual rollback into Terraform; do not rollback DB unless a migration caused the failure |
| Do not manage yet | frontend Cloud Run, GitHub WIF/workflows, Firebase Authorized Domains, custom domain/LB, API contract changes, Step 3 full retention lifecycle |

## 6B. GitHub Issue Readiness

| Field | Content |
|---|---|
| Issue title | Phase 3: Backend Cloud Run runtime and GCS artifact boundary |
| Scope | Deploy backend through Terraform-owned Cloud Run runtime and verify DB, Vertex, Firebase Auth, CORS bootstrap, Secret Manager, and artifact storage boundary |
| Acceptance criteria | backend Cloud Run starts without local `.env`; public/protected smoke passes; DB pool guardrail is implemented/verified or limited-smoke marked; public Vertex-calling route abuse/cost guardrails pass or backend is dev/demo-only; artifacts are GCS-backed or non-durable smoke is explicit |
| Forbidden changes | frontend deploy, public API contract changes, SCN-001 live/backend draft, service account key JSON, Vertex API key, raw payload logging/storage expansion |
| Validation | image build/push, Terraform checks, API/auth smoke, Cloud Logging sensitive-field review |
| Rollback | shift backend traffic to previous stable revision or re-apply previous image digest through Terraform |

## 7. Terraform Owns

Terraform owns the backend Cloud Run runtime configuration.

| Area | Terraform Responsibility |
|---|---|
| Cloud Run service | backend service resource |
| Image reference | immutable image digest or explicit image tag variable |
| Runtime identity | attach `backend-sa` |
| Secret injection | DB credentials, Firebase fallback credential if used |
| Cloud SQL connector | bind Cloud SQL instance connection name |
| Env vars | code-compatible backend env contract |
| Scaling | min/max instances, concurrency, timeout |
| IAM | backend-sa access to SQL, secrets, Vertex AI, artifact bucket |
| Ingress | public managed HTTPS endpoint for first migration |
| Outputs | backend URL, service name, revision name/digest, CORS update target |

Preferred deployment model:

```text
build image outside Terraform
  -> push image to Artifact Registry
  -> pass immutable image digest/tag to Terraform
  -> terraform apply runtime/backend
  -> Cloud Run creates a new revision
```

Avoid making `gcloud run deploy` the normal path while Terraform also owns the
service, because it creates configuration drift. Temporary manual deploy is only
acceptable if the resulting config is reconciled back into Terraform before
Phase 5.

## 8. CI / Script Owns

CI/scripts own build and verification work.

| Area | Responsibility |
|---|---|
| Backend Dockerfile | build a Cloud Run-compatible image |
| Image build | build from repo root with backend code and required static assets |
| Image push | push to Artifact Registry |
| Smoke tests | call backend Cloud Run URL |
| Contract checks | verify public response contracts are unchanged |
| Auth checks | verify protected endpoints reject missing/invalid token |
| Log checks | sample Cloud Logging for sensitive fields |

Before Phase 5, these tasks can be run manually by a developer/admin account. Do
not use service account key JSON for temporary image push.

## 8A. Public AI API Abuse And Cost Guardrail

CORS is only a browser-origin control. It does not protect public Cloud Run
endpoints from non-browser clients, scripted traffic, or Vertex cost abuse.

Phase 3 must choose and record one of these states before public backend smoke is
promoted:

| State | Meaning |
|---|---|
| Guarded public backend | `/api/v1/answer`, `/api/v1/retrieve`, and Before OCR/content review paths enforce request/body limits plus per-IP and, where authenticated, per-user rate/cost limits before Vertex-heavy work. Cloud Run max instances/concurrency/timeouts and DB pool caps are set conservatively. |
| Dev/demo-only backend | Public `run.app` backend exists only for controlled smoke/demo. Do not claim production abuse resistance until app-level limits or Phase 7 edge protection such as Cloud Armor/API Gateway/LB is approved. |

Minimum verification:

```text
oversized payload rejected before provider call
unauthenticated/protected route behavior unchanged
rate-limit or dev/demo-only status recorded in deploy evidence
Cloud Run max instances/concurrency/timeouts recorded
Vertex/request-count and budget alert path recorded for Phase 6
```

## 9. Admin / Manual Owns

Some actions remain administrator-owned in Phase 3.

| Area | Admin Responsibility |
|---|---|
| Temporary CORS | approve bootstrap origin policy before frontend URL exists |
| Secret values | add/update Secret Manager versions outside Terraform |
| Firebase valid-token smoke | provide a real Firebase ID token through a safe manual path |
| Artifact durability decision | approve GCS artifact adapter requirement or limited ephemeral smoke |
| Rollback | decide whether to shift traffic back after failed smoke |
| Log review | inspect Cloud Logging samples after first deploy |

Admin decisions should be recorded in the Phase 3 status note.

## 10. Backend Image Contract

Phase 3 requires a Cloud Run-compatible backend image.

Minimum image requirements:

- installs `backend/requirements.txt`
- starts `uvicorn backend.main:app`
- binds to `0.0.0.0`
- uses Cloud Run `PORT`, defaulting to `8080`
- includes `backend/app`, Alembic files if migration checks are run from image,
  and required Before assets such as `backend/data/before_assets`
- excludes local secrets, `.env`, `.pgdata`, logs, and local artifact runs
- does not bake service account JSON into the image

Expected runtime command shape:

```text
uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

Build from the repository root if the Dockerfile imports `backend.main` as a
package path.

## 11. Pre-WIF Image Push

Workload Identity Federation is not available until Phase 5. During Phase 3, use
a developer/admin account for image push.

```bash
PROJECT_ID=...
REGION=asia-northeast3
REPOSITORY=lmr-dev-ar
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/backend:phase3-$(date +%Y%m%d%H%M%S)"

gcloud auth login
gcloud auth configure-docker "$REGION-docker.pkg.dev"

# If the Dockerfile strategy is selected; otherwise use the approved equivalent.
docker build -f backend/Dockerfile -t "$IMAGE" .
docker push "$IMAGE"
```

Then pass `$IMAGE` or its immutable digest into the Terraform backend runtime
root.

Do not create, commit, upload, or store a service account key JSON for this step.

## 12. Runtime Environment Contract

Phase 3 env vars must match the current backend code, not only a generic cloud
template.

| Env | Source | Secret? | Notes |
|---|---|---:|---|
| `DATABASE_URL` | Secret Manager or assembled from DB secrets + Cloud SQL connector | yes if credential-bearing | SQLAlchemy connection string |
| `DB_POOL_SIZE` | Phase 2 target guardrail | no | recommended first value `2`; current `backend/app/db.py` must be updated/verified before this is an active control |
| `DB_MAX_OVERFLOW` | Phase 2 target guardrail | no | recommended first value `3`; cap together with Cloud Run max instances after support is verified |
| `DB_POOL_TIMEOUT_SECONDS` | Phase 2 target guardrail | no | recommended first value `30`; verify backend support before production claim |
| `GCP_PROJECT` | Terraform variable/output | no | used by embedding/answer services |
| `GCP_PROJECT_ID` | same project value or derived from `GCP_PROJECT` | no | Before stack accepts this name |
| `GCP_LOCATION` | Vertex AI model location | no | may differ from Cloud Run region if model availability requires it |
| `LLM_PROVIDER` | Terraform variable | no | set to `vertex`; local LLM is not part of cloud target |
| `VERTEX_ANSWER_MODEL` | Terraform variable | no | default `gemini-2.5-flash` unless changed deliberately |
| `VERTEX_EMBEDDING_HARD_TIMEOUT_SECONDS` | Terraform variable | no | optional runtime guard |
| `VERTEX_ANSWER_HARD_TIMEOUT_SECONDS` | Terraform variable | no | optional runtime guard |
| `VERTEX_PROVIDER_MAX_RETRIES` | Terraform variable | no | optional retry guard |
| `VERTEX_PROVIDER_RETRY_BASE_SECONDS` | Terraform variable | no | optional retry guard |
| `FIREBASE_PROJECT_ID` | Terraform variable/secret metadata | no | required for Firebase token verification |
| `BACKEND_CORS_ORIGIN_REGEX` | approved temporary value, then frontend URL/domain | no | actual var used by `backend/main.py` |
| `BEFORE_LAW_SOURCE` | Terraform variable | no | set to `db` for Cloud SQL corpus source |
| `ARTIFACT_BUCKET_NAME` | Terraform output | no | Preferred candidate env var for the future GCS adapter only. Current code does not read it; do not wire it as active runtime config until Phase 3 implements/verifies adapter support. This env var is separate from the `lmr-{env}-artifacts` bucket naming pattern. |
| `BEFORE_OCR_TIMEOUT_SECONDS` | Terraform variable | no | optional OCR runtime guard |
| `BEFORE_REVIEW_JOB_STALE_TIMEOUT_SECONDS` | Terraform variable | no | optional stale job guard |

Security classification:

- `GCP_PROJECT`, `GCP_PROJECT_ID`, `GCP_LOCATION`, `CLOUD_SQL_CONNECTION_NAME`,
  service account emails, bucket names, and direct Cloud Run URLs are non-secret
  runtime config but internal cloud identifiers. Keep exact values out of public
  portfolio docs, screenshots, frontend UI, browser storage, and user-facing
  logs.
- Do not introduce `VERTEX_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS_JSON`, or a
  service account key env var for Cloud Run runtime. Vertex AI access must use
  the attached `backend-sa` service identity through ADC.
- Do not introduce a Firebase Admin JSON secret or service account key JSON for
  Cloud Run runtime in this migration. Firebase Admin access must use the
  attached service identity through ADC; if that cannot be validated, open a
  separate security exception instead of adding a key fallback.

Before-stack compatibility aliases:

- Current code also accepts `BEFORE_GOOGLE_APPLICATION_CREDENTIALS`,
  `BEFORE_GCP_PROJECT_ID`, `BEFORE_GCP_LOCATION`, `BEFORE_VERTEX_MODEL`,
  `VERTEX_MODEL`, and `PHASE_A_VERTEX_MODEL`.
- Prefer the shared managed Vertex env contract above for the first cloud
  migration. Use Before-specific aliases only if a separate model/location split
  is intentionally approved and documented.
- Do not wire local self-hosted provider envs into Cloud Run for this target.

Do not use `GOOGLE_CLOUD_PROJECT` or `VERTEX_LOCATION` as the only backend env
names unless the backend code is changed to read them. Current code reads
`GCP_PROJECT` and `GCP_LOCATION`.

## 13. Database Connection Contract

Phase 3 consumes Phase 2 outputs.

Required:

- Cloud SQL connection name
- database name
- DB user/password secret names or credential-bearing `DATABASE_URL` secret
- selected `DB_POOL_SIZE`
- selected `DB_MAX_OVERFLOW`
- selected backend max instances

Current-code note:

- As of `2026-05-04`, `backend/app/db.py` reads `DATABASE_URL` and creates the
  engine with `pool_pre_ping=True` only. Phase 3 must implement/verify explicit
  pool sizing or an equivalent Cloud SQL connection cap before marking the
  backend runtime production-ready.

Connection guardrail:

```text
(DB_POOL_SIZE + DB_MAX_OVERFLOW) * backend_max_cloud_run_instances
  < Cloud SQL max_connections - reserved admin connections
```

For the first prod-like deployment, use conservative values from Phase 2:

```text
DB_POOL_SIZE=2
DB_MAX_OVERFLOW=3
DB_POOL_TIMEOUT_SECONDS=30
backend max instances = low cap during early testing
```

If Cloud SQL uses Unix socket style connection through the Cloud SQL connector,
make sure `DATABASE_URL` is compatible with SQLAlchemy/psycopg2.

## 14. IAM Contract

`backend-sa` should receive only the roles needed for backend runtime.

| Permission Area | Suggested Grant |
|---|---|
| Cloud SQL | `roles/cloudsql.client` |
| Secret Manager | `roles/secretmanager.secretAccessor` scoped to backend secrets |
| Vertex AI | `roles/aiplatform.user` or narrower equivalent if available |
| Artifact bucket | bucket-scoped object access needed by the artifact adapter |
| Artifact Registry pull | runtime image pull path as required by Cloud Run/project policy |

Do not grant `roles/owner` or `roles/editor`.

Vertex credential rule:

- Cloud Run backend calls Vertex AI through service identity/ADC only.
- Do not set `GOOGLE_APPLICATION_CREDENTIALS` on Cloud Run for Vertex access.
- Do not create, mount, copy, or upload a service account key JSON for Vertex.
- Do not grant Vertex service-agent roles to `backend-sa`, `github-actions-sa`,
  `terraform-sa`, or human users.

Firebase Admin note:

- Current token verification path primarily needs `FIREBASE_PROJECT_ID` and ADC or
  fallback credentials.
- Do not grant broad Firebase admin roles unless backend starts performing
  Firebase management operations beyond ID token verification.

## 15. Artifact Storage Boundary

The target cloud architecture uses a private Cloud Storage artifact bucket.
Current backend code still writes runtime artifacts to local directories, and
Cloud Run local filesystem writes are not durable across restarts, scale-out, or
new revisions.

Current code paths to check before production marking:

| Code Path | Current Behavior |
|---|---|
| `backend/app/before_stack/main.py` | writes Before upload/OCR/review artifacts under `backend/data/before_artifacts/runs` |
| `backend/app/services/after_artifact_store.py` | writes answer/draft artifacts under `backend/data/after_artifacts/runs` and stores local `artifact_root` |
| `backend/app/before_stack/main.py` static mount | exposes local Before artifacts under the mounted Before app path for local/dev-style access |

Cloud Run filesystem is ephemeral. Therefore Phase 3 has two possible outcomes:

| Outcome | Meaning |
|---|---|
| Production-ready | implement/wire a GCS artifact adapter for both Before and After artifact writes, and store private artifact paths in DB |
| Limited smoke only | accept that local artifacts are non-durable for the smoke and do not claim artifact durability |

For the portfolio cloud target, prefer the production-ready outcome. The backend
service account should access the private artifact bucket, and users should not
directly access raw artifacts.

The current Before static artifact mount is not a production access-control
model. Artifact retrieval through signed URLs or an authenticated proxy is a
separate authorization decision and must not expose raw contract/OCR text, raw
Bridge payload, Firebase uid, provider subject, email, tokens, or full
answer/draft payloads.

## 16. CORS Bootstrap

The frontend Cloud Run URL is not known until Phase 4.

Phase 3 approach:

1. Deploy backend with an explicitly approved temporary `BACKEND_CORS_ORIGIN_REGEX`.
2. Run direct backend smoke checks without depending on browser CORS.
3. After Phase 4 frontend URL or custom domain is known, update
   `BACKEND_CORS_ORIGIN_REGEX`.
4. Re-apply backend runtime and re-smoke browser integration.

Do not leave wildcard CORS in prod.

Current local default in `backend/main.py` allows local dev origins only:

```text
https?://(localhost|127\.0\.0\.1):(30[0-9]{2}|5090)
```

Cloud Run needs an explicit cloud origin regex.

## 17. Firebase Admin ADC

Current backend initialization in `backend/app/services/auth_service.py` behaves
as follows:

- requires `FIREBASE_PROJECT_ID`
- prefers ADC when `GOOGLE_APPLICATION_CREDENTIALS` is set
- prefers ADC on Cloud Run when `K_SERVICE` is present
- can fall back to `FIREBASE_ADMIN_CREDENTIALS` in local/dev code, but the cloud
  migration must not use that fallback by default

Phase 3 smoke must verify:

| Check | Expected |
|---|---|
| `GET /api/v1/auth/me` without token | `logged_in = false` |
| protected SCN-001 endpoint without token | `401` |
| protected SCN-001 endpoint with invalid token | `401` |
| `GET /api/v1/auth/me` with valid Firebase ID token | `logged_in = true` and user row upsert works |

If ADC initialization fails on Cloud Run, fix the ADC/IAM path or open a
separate security exception. Do not add a Firebase Admin JSON secret or service
account key JSON in the Phase 1-6 baseline.

## 18. Apply Procedure

Image build/push comes before Terraform apply.

```bash
# 1. Build and push backend image.
# If the Dockerfile strategy is selected; otherwise use the approved equivalent.
docker build -f backend/Dockerfile -t "$IMAGE" .
docker push "$IMAGE"

# 2. Apply backend runtime.
cd infra/terraform/envs/{env}/runtime/backend
terraform init
terraform fmt -check
terraform validate
terraform plan -var "backend_image=$IMAGE"
terraform apply -var "backend_image=$IMAGE"
```

Expected Terraform outputs:

| Output | Used By |
|---|---|
| `backend_service_name` | rollback and describe checks |
| `backend_url` | Phase 3 smoke and Phase 4 frontend env |
| `backend_revision` | rollback status note |
| `backend_service_account_email` | IAM audit |
| `cors_origin_regex` | Phase 4 update target |

## 19. Verification Procedure

Use the deployed backend URL.

```bash
BACKEND_URL=...

curl -fsS "$BACKEND_URL/health"
curl -fsS "$BACKEND_URL/api/v1/before/health"
curl -fsS "$BACKEND_URL/api/v1/auth/me"
```

Retrieval smoke:

```bash
curl -fsS "$BACKEND_URL/api/v1/retrieve" \
  -H "Content-Type: application/json" \
  -d '{"query":"퇴직금은 언제 받을 수 있나요?","top_k":5,"ef_search":100}'
```

Answer smoke:

```bash
curl -fsS "$BACKEND_URL/api/v1/answer" \
  -H "Content-Type: application/json" \
  -d '{"query":"해고 통보를 서면으로 받지 못했습니다. 어떻게 해야 하나요?","top_k":5,"ef_search":100}'
```

Auth-negative smoke:

```bash
curl -i "$BACKEND_URL/api/v1/scn001/bridge-runs"
curl -i "$BACKEND_URL/api/v1/scn001/bridge-runs" \
  -H "Authorization: Bearer invalid-token"
```

Document draft smoke should use an existing deterministic fixture or a small
known-valid request body. Do not invent a new public API contract for smoke.

Optional Before upload smoke:

- Run only after the Phase 3 artifact storage gate is closed: implement/verify
  the GCS adapter and decide whether `ARTIFACT_BUCKET_NAME` is active runtime
  env, or explicitly mark the deploy as limited non-durable smoke.
- Do not upload real personal documents.
- Use a synthetic or redacted sample.

## 20. Logging And Sensitive Field Check

After first deploy, sample Cloud Logging entries for these paths:

- `/health`
- `/api/v1/retrieve`
- `/api/v1/answer`
- `/api/v1/documents/draft`
- `/api/v1/auth/me`
- `/api/v1/scn001/*`
- `/api/v1/before/*` if upload smoke was run

Expected:

- request status/latency appears
- provider timeout or provider error is observable
- query is represented by hash or bounded metadata where possible
- raw contract text does not appear
- Firebase uid/provider subject/email does not appear
- token/header values do not appear
- raw Bridge payload does not appear
- raw full answer/draft payload does not appear

If risky fields appear, add structured-log redaction or Cloud Logging exclusion
filters before promotion.

## 21. Acceptance Criteria

Phase 3 is complete when:

- Backend image build strategy exists and image is pushed to Artifact Registry.
- `infra/terraform/envs/{env}/runtime/backend` can run `terraform fmt -check`,
  `terraform validate`, `terraform plan`, and `terraform apply`.
- Backend Cloud Run service starts without local `.env`.
- Backend URL output exists.
- `/health` passes.
- `/api/v1/before/health` passes or the Before path is explicitly deferred with
  a documented reason.
- `/api/v1/retrieve` smoke passes.
- `/api/v1/answer` smoke passes or provider timeout is recorded as a runtime
  incident with retry/timeout settings.
- `/api/v1/documents/draft` deterministic smoke passes.
- `GET /api/v1/auth/me` works without token and with a valid Firebase token.
- Protected SCN-001 endpoints reject missing/invalid tokens.
- DB and Vertex calls use Cloud Run service identity/managed config, not local
  `.env` or service account JSON in the image.
- `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, and Cloud Run max instances satisfy the
  Cloud SQL connection guardrail after backend support or an equivalent
  connection cap has been implemented and verified.
- CORS bootstrap value is explicitly approved and recorded for Phase 4 update.
- Before/After artifact persistence is either GCS-backed or clearly marked
  limited/non-durable for smoke only.
- Logs pass sensitive-field sample review.
- `/api/v1/answer` and `/api/v1/documents/draft` response contracts are unchanged.

## 22. Rollback

Cloud Run rollback:

```text
new revision deployed
  -> smoke fails
  -> shift traffic to previous stable revision
  -> record failed revision, image digest, and failure reason
```

If Terraform owns traffic, prefer updating the Terraform traffic/image variables
and applying the rollback. If an urgent manual Cloud Run traffic shift is used,
sync the final state back into Terraform before Phase 5.

Do not rollback Phase 2 database state for a Phase 3 runtime failure unless the
failure was caused by a confirmed incompatible migration. Phase 3 should normally
rollback application revision only.

## 23. Blocks Phase 4 If

Phase 4 frontend runtime is blocked if any of these are true.

- Backend URL output is missing.
- `/health` fails.
- `/api/v1/retrieve` or `/api/v1/answer` cannot reach Cloud SQL/Vertex.
- DB pool guardrail support remains unimplemented or unverified while the
  deployment is being claimed as production-ready rather than limited smoke.
- CORS cannot be updated to the frontend origin after Phase 4 URL is known.
- Firebase Auth verification fails and fallback is not documented.
- `/api/v1/auth/me` cannot verify a valid Firebase ID token.
- Protected SCN-001 auth-negative smoke fails.
- Sensitive log sample exposes raw tokens, raw contract text, Firebase uid,
  provider subject, email, raw Bridge payload, service account emails, bucket
  names, Cloud SQL connection names, WIF provider names, or direct backend
  `run.app` URLs intended to stay internal.
- Before/After artifact persistence decision is unresolved for routes that Phase 4 will expose.

## 24. Status Note Template

When Phase 3 is executed, record a short status note.

```markdown
## Phase 3 Status — Backend Runtime

- Environment:
- GCP project:
- Backend image:
- Backend Cloud Run service:
- Backend URL:
- Backend revision:
- Backend service account:
- Cloud SQL connection:
- DB pool values:
- Cloud Run scaling cap:
- CORS bootstrap value:
- Firebase ADC/fallback path:
- Artifact storage path:
- Smoke checks:
- Log sample result:
- Public evidence redaction:
- Rollback target:
- Admin actions performed:
- Commands run:
- Skipped checks:
- Blockers:
```

## 25. Do Not

- Do not deploy frontend in Phase 3.
- Do not use service account key JSON for image push or runtime.
- Do not create or wire a Vertex AI API key for runtime.
- Do not set `GOOGLE_APPLICATION_CREDENTIALS` on Cloud Run when using service
  identity/ADC.
- Do not bake `.env`, Firebase credential JSON, DB password, or GCP credential
  files into the image.
- Do not include exact project id, project number, service account emails,
  bucket names, Cloud SQL connection names, Secret Manager names, WIF provider
  names, or direct backend `run.app` URLs in public portfolio evidence.
- Do not use wildcard CORS as the final prod setting.
- Do not make `gcloud run deploy` the steady-state path while Terraform owns the
  Cloud Run service.
- Do not change public API contracts.
- Do not open SCN-001 live/backend draft generation.
- Do not store raw case facts, raw Bridge payload, or full answer/draft payloads
  in logs.
- Do not claim Cloud Storage artifact durability while code still writes only to
  local ephemeral directories.

## 26. Suggested Agent Prompt

Use this prompt when asking an implementation agent to work on Phase 3.

```text
Read docs/architecture/CLAUDE.md, docs/architecture/cloud_migration_architecture.md,
docs/architecture/cloud_migration_phase_plan.md,
docs/architecture/phase/phase2_data_foundation.md, and
docs/architecture/phase/phase3_backend_runtime.md first. Also read backend/CLAUDE.md,
backend/main.py, backend/app/db.py, and backend/app/services/auth_service.py.

Implement Phase 3 only.

Deploy the FastAPI backend to Cloud Run through the runtime/backend Terraform root.
Use Artifact Registry for the backend image and backend-sa as the Cloud Run runtime
identity. Keep Cloud SQL, Secret Manager, Vertex AI, CORS, DB pool env vars, and
Firebase Auth wiring aligned with the current backend env names:
DATABASE_URL, DB_POOL_SIZE, DB_MAX_OVERFLOW, DB_POOL_TIMEOUT_SECONDS, GCP_PROJECT,
GCP_PROJECT_ID, GCP_LOCATION, FIREBASE_PROJECT_ID, BACKEND_CORS_ORIGIN_REGEX, and
LLM_PROVIDER=vertex.

Before marking Phase 3 production-ready, verify or implement backend DB pool
support because current backend/app/db.py only reads DATABASE_URL.

Do not deploy the frontend, do not configure GitHub Actions WIF, do not change
/api/v1/answer or /api/v1/documents/draft contracts, and do not open SCN-001
live/backend draft generation. If artifact storage still writes to local paths,
either implement the GCS artifact adapter or mark the deployment as limited smoke
only rather than production-ready.
```
