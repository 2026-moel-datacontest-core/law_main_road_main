# Phase 0 — Docs / Design Freeze

기준일: `2026-05-06`

## 1. Goal

Phase 0은 Terraform을 작성하기 전에 cloud migration 목표를 고정하는 단계다.
이 단계는 GCP 리소스를 만들지 않고, runtime behavior도 바꾸지 않는다.

핵심 목표는 세 가지다.

- 첫 migration target을 명확히 고정한다.
- 현재 MVP/SCN freeze 정책과 충돌하지 않는지 확인한다.
- Phase 1 Bootstrap + Foundation 작업자가 참고할 수 있는 문서 기준선을 만든다.

## 2. Phase Status

| Item | Status |
|---|---|
| Phase type | Docs / design freeze |
| Terraform root | none |
| Cloud resource creation | none |
| Runtime behavior change | none |
| Primary output | reviewed architecture baseline for Phase 1 |
| Next phase | [`phase1_bootstrap_foundation.md`](phase1_bootstrap_foundation.md) |

## 3. Read First

Phase 0 작업자는 아래 순서로 읽는다.

1. repo root `AGENTS.md`
2. repo root `CLAUDE.md`
3. [`../CLAUDE.md`](../CLAUDE.md)
4. [`../README.md`](../README.md)
5. [`../current_project_architecture.md`](../current_project_architecture.md)
6. [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md)
7. [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md)
8. [`../env_profiles.md`](../env_profiles.md)
9. [`README.md`](README.md)
10. this file

## 4. Scope

### In Scope

- Cloud migration target architecture review.
- Phase numbering and phase file consistency check.
- Current MVP boundary review.
- Local verification commands.
- Diagram/document consistency check.
- Issue classification before Phase 1.

### Out Of Scope

- Terraform implementation.
- GCP project creation.
- Secret value creation.
- GitHub Actions implementation.
- Cloud Run deployment.
- Cloud SQL creation.
- DB migration or seed import.
- API contract changes.
- Frontend route/UX changes.
- SCN-001 live/backend document draft generation.

## 5. Frozen Decisions

The following decisions are frozen for the first cloud migration unless a later
architecture review explicitly reopens them.

| Decision | Frozen Direction |
|---|---|
| Model runtime | Managed Vertex AI path |
| Local LLM | excluded |
| Compute Engine GPU VM | excluded |
| Frontend runtime | Cloud Run |
| Backend runtime | Cloud Run |
| Database | Cloud SQL PostgreSQL |
| Vector extension | pgvector initialized by migration script, not Terraform |
| Corpus seed | `law_chunks` seed/import by script |
| Artifact storage | private Cloud Storage bucket |
| Secrets | Secret Manager resources + secret values outside Terraform state |
| CI/CD auth | GitHub Actions + Workload Identity Federation |
| Observability | Cloud Logging / Monitoring / Alerting |
| Rollback | Cloud Run revision rollback + DB backup/runbook |
| First region | `asia-northeast3` |

### Phase 0 Final Decisions

These decisions are approved for the first Terraform authoring pass. They
describe the cloud target only and do not rename existing application code,
routes, database tables, or local service names.

| Area | Final decision |
|---|---|
| App/resource naming | Human-readable app label is `law-main-road`; Terraform/resource prefix is `lmr`; resource names use `lmr-{env}-{component}` where provider constraints allow. |
| First target | `dev` is the first cloud migration target. Keep both `envs/dev` and `envs/prod` in the Terraform layout, but make only `envs/dev` apply-ready and instantiate only `dev` first. `envs/prod` stays skeleton/README/tfvars-example only until a separate prod-opening review approves exact prod sizing, backup, PITR, HA, deletion protection, and deployment approval policy. |
| Project model | Start with the existing `law-main-road` GCP project and env-prefixed resources. Separate dev/prod GCP projects are deferred to future hardening. Treat exact project number and generated cloud resource names as internal inventory. |
| Terraform state | Run `bootstrap/remote-state` once with local state to create the GCS tfstate bucket. Later env roots use the GCS remote backend. Bootstrap local `terraform.tfstate*` files must never be committed and must be stored/exported/deleted according to the Phase 1 runbook after later remote backend roots are confirmed. |
| Naming inventory | GCS state/artifact bucket names need globally unique variants of the `lmr` naming pattern. Exact project id/number, bucket names, service account emails, SQL connection names, WIF provider names, and direct `run.app` URLs are internal inventory. |
| Cloud SQL | Dev starts with minimum viable Cloud SQL PostgreSQL + pgvector; exact dev tier/storage is decided before Phase 2 apply. Prod later starts on a small production tier. HA is deferred initially. Dev backup retention is 1-3 days; prod backup retention baseline is 7 days; PITR is prod-only baseline with a cost exception allowed before prod opens. |
| Env profiles | Detailed dev/demo/prod operating values live in [`../env_profiles.md`](../env_profiles.md). Phase 1-6 first apply uses the dev profile. Contest/domain posture may use the demo/contest profile after dev smoke passes. Prod requires a separate prod-opening review. |
| Budget preflight | Manual budget alert decision is `lmr-dev-demo-monthly`, KRW 70,000, `25/50/80/100 actual + 100 forecasted`, alert-only. Phase 6 may later manage or verify budget alert resources where billing IAM allows; that does not reopen the threshold decision. |
| Firebase/Auth | Use the existing Firebase-enabled `law-main-road` GCP project. Current MVP auth opens Google provider only; Firebase SMS MFA / Phone Auth is not enabled and is not needed for the MVP path. |
| Secrets | Terraform creates Secret Manager secret resources only. Terraform does not manage secret values by default; `google_secret_manager_secret_version` is forbidden by default unless a later explicit security review approves an exception. |
| Artifact storage | One private artifact bucket per env. Bucket names use a globally unique variant of `lmr-{env}-artifacts`; this is a bucket naming pattern, not an environment variable name. Before and After artifacts share the bucket and use `before-runs/` and `after-runs/` object prefixes. |
| Artifact env var | `ARTIFACT_BUCKET_NAME` is only a preferred candidate backend env var for the future GCS adapter. Do not wire it as active runtime config until Phase 3 implements or verifies adapter support. |
| Artifact retrieval | Signed URL vs auth proxy vs no retrieval UI is deferred and is not an initial Cloud Run migration blocker unless the current UI requires retrieval. |
| Custom domain | Phase 4 deploys with Cloud Run `run.app` URLs. Gabia DNS, Firebase Hosting edge, and custom domain are Phase 7A only; HTTPS Load Balancer is deferred until stronger edge hardening is approved. Direct `run.app` URLs remain internal inventory and should not appear in public docs/issues/screenshots. |
| Observability | Phase 6 starts with Cloud Logging app/request logs, uptime/smoke checks, error-rate checks, budget alert verification/ownership, and owner email/console notification. SLO and advanced alerting are deferred until baseline traffic exists. |
| Repository policy | `2026-moel-datacontest-core/law_main_road_main` stays the private development/deploy/WIF source repo. `Team-msp-architect-2026/msp-team02` stays a public curated submission mirror only, with no deploy permission, no WIF binding, and no service account key JSON. Keep `protect-main` policy-defined/enforcement-pending; do not upgrade GitHub Team or convert repo1 public in this preflight. |
| Automation | Terraform owns persistent cloud resources. GitHub Actions uses WIF keyless auth for CI/CD. Shell/Python runbooks are limited to describe, smoke, migration/seed orchestration, log redaction checks, and rollback drills; they must not create/modify persistent resources, store secrets, or change DB/DNS/traffic without explicit human approval. Baseline migration does not include a host configuration-management layer. |

### Decision Closure Status

Phase 0 does not claim every future implementation choice is complete. It closes
the decisions that are safe to close now, gates choices that need phase-local
cost/permission/code evidence, and defers optional hardening by design.

| Status | Decisions |
|---|---|
| Finalized now | first target is `dev` only; keep `envs/dev` and `envs/prod` in the layout but make only `envs/dev` apply-ready and instantiate `dev` first; keep `envs/prod` skeleton/README/tfvars-example only until a separate prod-opening review; use the existing `law-main-road` GCP/Firebase project with env-prefixed resources; Firebase Auth Google provider only and no Firebase SMS MFA / Phone Auth for MVP; budget alert `lmr-dev-demo-monthly` with KRW 70,000 and `25/50/80/100 actual + 100 forecasted`; private source/deploy repo `2026-moel-datacontest-core/law_main_road_main`; public curated mirror `Team-msp-architect-2026/msp-team02` with no deploy permission; service account key JSON forbidden; `protect-main` policy-defined/enforcement-pending; `law-main-road` app label; `lmr` prefix; `lmr-{env}-{component}` resource naming where possible; local-state bootstrap creates the GCS tfstate bucket; env roots use GCS backend after bootstrap; bootstrap local `terraform.tfstate*` is never committed; Terraform creates Secret Manager secret resources only; `google_secret_manager_secret_version` is forbidden by default; one private artifact bucket per env; globally unique `lmr-{env}-artifacts` bucket naming pattern; `before-runs/` and `after-runs/` object prefixes; Phase 4 uses Cloud Run `run.app`; shell/Python runbooks are helper-only. |
| Phase-gated decision | Phase 2 before apply: dev Cloud SQL exact tier/storage. Phase 2 before prod opening: prod exact tier, PITR cost exception, backup retention confirmation. Phase 3 before backend deploy: GCS adapter implementation boundary and whether `ARTIFACT_BUCKET_NAME` becomes active runtime env. Phase 3 or later: artifact retrieval mode only if UI/runtime needs it. Phase 6: budget alert Terraform management if billing IAM allows, otherwise billing/admin checklist fallback. Phase 6: exact alert thresholds after baseline smoke/traffic. Phase 5: WIF implementation bound only to the private source/deploy repo. |
| Deferred by design | separate dev/prod GCP projects; Phase 7A custom domain / Firebase Hosting edge / Gabia DNS until opened; HTTPS Load Balancer; `api.<domain>` backend public endpoint; advanced SLO/alerting; signed URL/auth proxy/artifact retrieval UI unless required later; host configuration-management tooling for baseline migration. |

## 6. MVP / SCN Boundaries

Phase 0 must confirm that cloud migration docs do not weaken these boundaries.

| Boundary | Required State |
|---|---|
| SCN-004 demo freeze | unchanged |
| `POST /api/v1/answer` | public contract unchanged |
| `POST /api/v1/documents/draft` | public contract unchanged |
| SCN-001 Bridge/history | protected path remains Firebase Bearer based |
| SCN-001 fixed preset draft | frontend-local frozen draft path only |
| SCN-001 live/backend draft generation | not opened |
| Raw case payloads | not moved to Web Storage or logs |
| Firebase uid / provider subject / token | not exposed in UI/query/storage/log examples |
| Bridge context | continuity/reference only, not legal grounding |

## 7. Ownership

| Area | Owner | Phase 0 Responsibility |
|---|---|---|
| Terraform | none | Do not create Terraform resources in this phase |
| CI/scripts | local developer/agent | Run local smoke checks and report result |
| Admin/manual | project owner | Approve target scope and confirm readiness for Phase 1 |
| Documentation | agent | Keep architecture spec, phase plan, phase index, and this file aligned |

## 7A. Terraform Authoring Map

| Item | Phase 0 Contract |
|---|---|
| Terraform-managed resources | none |
| Manual prerequisites | target scope approval, GCP project/billing readiness decision, human GCP MFA requirement approval, shell/Python runbook boundary approval, diagram regenerate decision if needed |
| Inputs/variables | none for Terraform; docs record `asia-northeast3`, `1722` chunks, `selected_as_of = 2026-04-11` |
| Outputs | reviewed architecture baseline, Phase 1 readiness status, issue slicing notes |
| Secrets handling | do not create, rotate, print, or commit secret values |
| Apply order | no `terraform init/plan/apply`; Phase 1 starts after this docs gate |
| Validation command candidates | local checks, architecture reference search, drawio XML validation if drawio changed, generated PNG preview check, `git diff --check` |
| Rollback/delete policy | revert docs patch only; no cloud cleanup |
| Do not manage yet | all GCP resources, Terraform state bucket, Secret Manager versions, Cloud Run, Cloud SQL, WIF, custom domain/LB |

Phase 0 should record that all human accounts used for GCP Console, `gcloud`,
Terraform bootstrap, production approvals, DNS cutover, or emergency rollback
must use Google 2-Step Verification/MFA before Phase 1 resource apply. Record
only PASS/FAIL evidence; do not store recovery codes or MFA setup details in the
repo.

If shell/Python runbooks are opened later, Phase 0 treats them as operations
automation only. Do not create scripts during a docs-only readiness pass.

If a GCP MFA helper is opened later, use `gcp-mfa-main-guide1/` as the GCP
counterpart to the local `aws-mfa-main-guide1` UX. The helper should guide
`gcloud auth login`, ADC, active project, optional `terraform-sa` impersonation,
and MFA attestation. It must not collect OTP/recovery material or issue
long-lived credentials.

## 7B. GitHub Issue Readiness

| Field | Content |
|---|---|
| Issue title | Phase 0: Cloud migration design freeze and Terraform readiness review |
| Scope | Freeze target architecture, phase numbering, Terraform authoring contract, and docs/code-read blockers before Phase 1 |
| Acceptance criteria | architecture/phase docs agree; no Blocker/High readiness issue remains; SCN/API/auth/storage boundaries are preserved; GCP MFA and shell/Python runbook boundaries are recorded |
| Forbidden changes | Terraform files, cloud resources, secrets, backend/frontend code, API/schema/Auth/Bridge/Web Storage policy |
| Validation | local smoke candidates plus `git diff --check`; drawio XML check only if `.drawio` changed |
| Rollback | revert the docs-only patch |

## 8. Required Local Checks

Run from repo root unless a command explicitly changes directory.

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend && npm run build
```

Expected result:

- backend import prints `import_ok`.
- document draft deterministic smoke passes.
- frontend production build succeeds.

## 9. Architecture Consistency Checks

These checks are specific to Phase 0.

```bash
rg -n 'architecture_option4|architecture_project_current|Option 4|option4' docs/architecture --glob '!**/phase0_design_freeze.md'
rg -n 'Local LLM|Compute Engine GPU|Ollama|Qwen|vLLM' docs/architecture/cloud_migration_architecture.md docs/architecture/cloud_migration_phase_plan.md docs/architecture/phase
rg -n 'environments/(dev|prod)/main\.tf|Phase 2.*CI/CD|artifact-cleanup|BACKEND_CORS_ORIGIN_REGEX or' docs/architecture --glob '!**/phase0_design_freeze.md'
xmllint --noout \
  docs/architecture/images_drawio/final_architecture_overview.drawio \
  docs/architecture/images_drawio/final_architecture_detail.drawio \
  docs/architecture/cloud_migration_architecture.drawio
file \
  docs/architecture/images_drawio/final_architecture_overview.drawio.png \
  docs/architecture/images_drawio/final_architecture_detail.drawio.png
git diff --check -- docs/architecture
```

Interpretation:

- The old filename/reference search should return no active old-reference hits.
- Local LLM/GPU terms may appear only in explicit exclusion/not-in-scope sections.
- The conflict-pattern search should return no hits.
- `xmllint` must pass for overview/detail/root draw.io sources.
- PNG preview file checks must report valid PNG image data.
- `git diff --check` must pass.
- For normal docs-only review, do not make unrelated diagram churn. If the
  Mermaid/source architecture and draw.io diverge, either regenerate/edit the
  draw.io source and PNG preview in the same patch or record
  `drawio regenerate needed` in the status note.

## 10. Build Readiness Checks

These checks reduce later Cloud Run deployment risk. Phase 0 does not need to
fix missing build files, but it must record whether Phase 3/4 can start from an
existing container strategy.

Current code-read result rechecked on `2026-05-06`:

| Check | Current State | Required Before Cloud Run Deploy |
|---|---|---|
| `frontend/next.config.mjs` | no `output: "standalone"` setting | Phase 4 must add `output: "standalone"` or document an equivalent Cloud Run build strategy |
| `frontend/Dockerfile` | not present | Phase 4 must add it or use an approved equivalent frontend image build path |
| `backend/Dockerfile` | not present | Phase 3 must add it or use an approved equivalent backend image build path |
| `backend/app/db.py` | reads `DATABASE_URL` only | either support `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_TIMEOUT_SECONDS` or Phase 3 records this as a required backend-runtime implementation gap before production-ready Cloud SQL rollout |
| `backend/.env.example` | may document target envs before code support exists | documents DB pool guardrail env vars once Phase 3 backend support is implemented; otherwise records the documentation gap |

Optional after Dockerfiles or equivalent build commands exist:

```bash
docker build -f backend/Dockerfile .
docker build -f frontend/Dockerfile frontend \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

If Docker is not available locally, do not block Phase 0. Record it as
`Docker build not run locally` and let Phase 3/4 or CI validate image builds.

## 11. Diagram Consistency

The architecture diagram must match the target cloud direction.

Required diagram contents:

- Developer Platform: GitHub, GitHub Actions, WIF, Artifact Registry, Terraform,
  GCS remote state.
- Runtime Platform: Cloud Run Frontend, Cloud Run Backend, Firebase Auth, Cloud
  SQL PostgreSQL, Vertex AI, private Cloud Storage, Secret Manager.
- Operations Platform: Cloud Logging, Monitoring/Alerting, Cloud Run revisions,
  Cloud SQL backup/PITR, lifecycle/cost controls.

Forbidden diagram contents:

- Local LLM.
- Compute Engine GPU VM.
- Ollama.
- Qwen.
- vLLM.
- Backend route to self-hosted inference.

`.mmd` may be edited when a diagram label is clearly wrong. `.drawio` files may
be regenerated/edited when the task explicitly includes visual refresh. Keep the
draw.io source and PNG preview aligned, and validate XML.

Current docs/visual status on `2026-05-06`: the overview/detail visual sources
under `images_drawio/` are the presentation/handoff diagrams. Until the GCS
adapter is implemented, diagrams must show the backend-to-GCS artifact path as
target-after-adapter or attach the Phase 3 blocker, not as an already-active
durable runtime path.

## 12. Issue Classification

During Phase 0 review, classify findings this way.

| Severity | Meaning | Phase 0 Action |
|---|---|---|
| Blocker | Phase 1 cannot start safely | Fix before Phase 1 |
| High | Phase 1 implementer will likely be confused or blocked | Fix before Phase 1 |
| Medium | Can be handled before the affected later phase | Record in affected phase file |
| Low | Naming, clarity, or portfolio polish | Fix opportunistically |

Examples:

- Terraform root/phase numbering conflict: Blocker.
- Local LLM still present in target runtime: Blocker.
- Missing `terraform-sa` minimum role guidance: High.
- Docker not installed locally: Medium, if Dockerfile/build path is documented.
- Alert threshold exact value not final: Low/Medium, Phase 6 concern.

## 13. Phase 0 Output

At the end of Phase 0, produce a short status note with this shape.

```markdown
## Phase 0 Status

Decision: Ready for Phase 1 / Blocked

Checks:
- backend import: PASS/FAIL
- document draft smoke: PASS/FAIL
- frontend build: PASS/FAIL
- architecture old-reference search: PASS/FAIL
- drawio XML validation: PASS/FAIL
- diff whitespace check: PASS/FAIL

Findings:
- Blocker: ...
- High: ...
- Medium: ...
- Low: ...

Phase 1 handoff:
- Use `docs/architecture/phase/phase1_bootstrap_foundation.md`.
- Start with `infra/terraform/bootstrap/remote-state`.
- Do not create secret values in Terraform.
```

## 14. Exit Criteria

Phase 0 is complete only when all required statements are true.

- Architecture spec, phase plan, phase index, and phase files agree on phase
  numbering.
- `cloud_migration_phase_plan.md` remains the source of truth for Terraform roots.
- `phase/phase1_bootstrap_foundation.md` is detailed enough to start Phase 1.
- No Blocker or High issue remains open.
- Local smoke checks either pass or have a clear, non-architecture blocker.
- `images_drawio/final_architecture_overview.drawio`,
  `images_drawio/final_architecture_detail.drawio`, and the secondary root
  `cloud_migration_architecture.drawio` are valid XML and match the current
  target architecture.
- No old `architecture_option4` naming remains as active docs reference.
- Current MVP boundaries and SCN freeze policies are preserved.

## 15. Rollback

Phase 0 changes are documentation-only. Rollback means reverting the affected
documentation patch. No cloud resource cleanup is needed.

## 16. Do Not

- Do not add Terraform resources in this phase.
- Do not create GCP resources.
- Do not add secret values.
- Do not change backend API contracts.
- Do not change frontend demo behavior.
- Do not open SCN-001 live/backend draft generation.
- Do not reintroduce Local LLM or GPU VM as first migration runtime.

## 17. Suggested Agent Prompt

Use this prompt when asking an agent to review or complete Phase 0.

```text
반드시 한국어로 답변해줘.

docs/architecture/CLAUDE.md를 먼저 읽고,
docs/architecture/phase/phase0_design_freeze.md 기준으로 Phase 0 상태를 검토해줘.

파일은 수정하지 말고 먼저 리뷰 결과만 알려줘.
확인할 것:
- cloud migration architecture와 phase plan의 phase 번호/terraform root 충돌 여부
- Local LLM / Compute Engine GPU VM이 first migration target에서 제외되어 있는지
- SCN-004 freeze와 /api/v1/answer, /api/v1/documents/draft contract가 보호되는지
- Phase 1 bootstrap/foundation으로 넘어가기 전 Blocker/High 이슈가 남았는지
- Required Local Checks와 Architecture Consistency Checks를 실행할 수 있는지

출력:
1. Decision: Ready for Phase 1 / Blocked
2. Blocker / High / Medium / Low findings
3. 실행한 command와 결과
4. Phase 1 handoff note
```
