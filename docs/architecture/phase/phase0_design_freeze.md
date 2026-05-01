# Phase 0 — Docs / Design Freeze

기준일: `2026-04-29`

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
8. [`README.md`](README.md)
9. this file

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
xmllint --noout docs/architecture/cloud_migration_architecture.drawio
git diff --check -- docs/architecture
```

Interpretation:

- The old filename/reference search should return no active old-reference hits.
- Local LLM/GPU terms may appear only in explicit exclusion/not-in-scope sections.
- The conflict-pattern search should return no hits.
- `xmllint` must pass.
- `git diff --check` must pass.
- Do not hand-edit `.drawio`. If the Mermaid/source architecture and draw.io
  diverge during a docs-only review, record `drawio regenerate needed` in the
  status note and regenerate through an approved diagram workflow later.

## 10. Build Readiness Checks

These checks reduce later Cloud Run deployment risk. Phase 0 does not need to
fix missing build files, but it must record whether Phase 3/4 can start from an
existing container strategy.

Current code-read result on `2026-04-29`:

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

`.mmd` may be edited when a diagram label is clearly wrong. `.drawio` should not
be manually edited in this repo task; mark it as `regenerate needed` if it is
stale.

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
- Start with `infra/bootstrap/remote-state`.
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
- `cloud_migration_architecture.drawio` is valid XML and either matches current
  target architecture or is explicitly marked `regenerate needed` without
  hand-editing the `.drawio` file.
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
