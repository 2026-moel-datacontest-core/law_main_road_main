# Next Prompt - Cloud Migration Phase 2 DB Bootstrap Planning

기준일: `2026-05-07`

작업 위치:

```text
/home/jongwon/personal_project/temp_extract/law_main_road/law_main_road_frontend_final_followup
```

현재 목적:

```text
Cloud Migration Phase 2 Terraform apply는 완료됐다. 다음 세션에서는 Cloud SQL
인스턴스/DB shell 이후의 DB bootstrap, pgvector, Alembic migration, seed,
embedding 계획을 검토한다. 아직 DB user/password/secret value 생성, migration,
seed, embedding 실행은 별도 승인 전까지 하지 않는다.
```

## Current Status

완료:

- Phase 0 readiness: `PASS`
- Phase 1 bootstrap/foundation apply: `PASS`
- Phase 1 post-apply plan checks: `PASS`, no changes
- Phase 2 data foundation apply: `PASS`
- Phase 2 post-apply plan check: `PASS`, no changes
- Cloud SQL instance/database describe checks: `PASS`

Phase 2에서 생성된 범위:

- Cloud SQL PostgreSQL dev instance
- application database shell
- non-secret Terraform outputs for later phases

생성하지 않은 것:

- DB user/password
- Secret Manager secret versions
- credential-bearing `DATABASE_URL`
- pgvector extension
- Alembic schema migration
- HNSW/vector indexes
- `law_chunks` seed rows
- embeddings
- backend runtime IAM / `roles/cloudsql.client`
- Cloud Run
- WIF provider/trust binding
- GitHub Actions workflow
- prod resources
- backend/frontend/API/schema/runtime changes

## Read First

```text
AGENTS.md
CLAUDE.md
docs/architecture/CLAUDE.md
docs/architecture/env_profiles.md
docs/architecture/cloud_migration_phase_plan.md
docs/architecture/phase/phase1_bootstrap_foundation.md
docs/architecture/phase/phase2_data_foundation.md
docs/architecture/phase/phase3_backend_runtime.md
infra/terraform/README.md
infra/terraform/envs/dev/data/README.md
infra/terraform/modules/cloud-sql-pgvector/README.md
config/secrets/cloud_migration_private_runbook.md
```

`config/secrets/cloud_migration_private_runbook.md`는 gitignored private
inventory다. 내용을 public mirror, issue, README, screenshot, final output에
옮기지 않는다.

## First Verification

```bash
cd /home/jongwon/personal_project/temp_extract/law_main_road/law_main_road_frontend_final_followup
git status --short --untracked-files=all
git check-ignore -v config/secrets/cloud_migration_private_runbook.md
terraform fmt -check -recursive infra/terraform

cd infra/terraform/envs/dev/data
terraform validate
terraform plan -detailed-exitcode -var-file=terraform.tfvars.example
terraform output -json
```

Expected:

```text
dev data plan detailed exit code: 0, no changes
```

## Planning Focus

- DB app user/password bootstrap path.
- Whether to keep Phase 3 runtime as single `DATABASE_URL` secret first.
- How to add Secret Manager versions manually without exposing values in shell
  history, git, docs, Terraform state, or chat.
- Cloud SQL connection method from local admin machine for migration.
- `pgvector` extension creation boundary.
- Alembic migration command and expected head.
- HNSW/vector index verification.
- `law_chunks` seed/import source of truth.
- Expected row count: `1722`.
- Expected `selected_as_of`: `2026-04-11`.
- Embedding generation timing and retry policy.
- Stop/destroy policy for 30-day dev/demo cost control.

## Hard Boundaries

- Do not run DB user/password creation unless explicitly approved.
- Do not add Secret Manager versions unless explicitly approved.
- Do not run Alembic migration unless explicitly approved.
- Do not create pgvector extension, indexes, seed rows, or embeddings unless
  explicitly approved.
- Do not create Cloud Run, WIF provider, GitHub workflow, service account key
  JSON, backend runtime IAM, or prod resources.
- Do not modify backend/frontend/API/schema/runtime behavior unless the opened
  step explicitly allows it.
- Do not commit/push unless explicitly requested.

## Prompt To Use In A New Codex Session

```text
반드시 한국어로 답변해줘.

Model/reasoning:
- Use the strongest available model.
- Set reasoning effort to extra-high / xhigh.
- If fast mode is available with extra-high reasoning, use it.
- All spawned agents/sub-agents must also use extra-high / xhigh reasoning and
  fast mode if available.

Task:
Cloud Migration Phase 2 post-apply DB bootstrap/migration planning을 진행해줘.
아직 DB user/password 생성, Secret Manager version 추가, pgvector extension,
Alembic migration, seed, embedding 실행은 금지다. 오늘 목표는 안전한 실행 순서와
검증 기준을 정리하는 것이다.

Current state:
- Phase 1 bootstrap/foundation applied and no-change verified.
- Phase 2 dev Cloud SQL instance + app database shell applied.
- Phase 2 post-apply plan is no changes.
- No DB user/password, secret versions, pgvector extension, schema migration,
  indexes, seed rows, embeddings, backend runtime IAM, Cloud Run, WIF, workflow,
  or prod resources have been opened.

First:
1. Read `next_prompt.md`.
2. Read the files listed in `next_prompt.md`.
3. Run the First Verification command block.
4. Report whether Phase 2 post-apply state is still clean.

Planning output required:
1. DB bootstrap execution plan, step by step.
2. Secret value handling plan that avoids shell history and Terraform state.
3. Local connection method for Cloud SQL migration.
4. pgvector/Alembic/schema/index/seed/embedding order.
5. Verification SQL/check commands and expected results.
6. Rollback/stop/destroy guidance for dev.
7. Exact next prompt for the first approved DB bootstrap execution step.

Hard boundaries:
- Do not execute DB bootstrap/migration/seed/embedding.
- Do not create secret versions.
- Do not create service account keys.
- Do not grant backend runtime IAM.
- Do not deploy Cloud Run.
- Do not change backend/frontend/API/schema/runtime behavior.
- Do not commit/push unless explicitly requested.

Use agents:
- Use an agent loop for plan -> critical review -> fix -> verify.
- Reviewer must specifically check secrets, cost, rollback, idempotency, and
  Phase 3 handoff.
- Every agent/sub-agent must use extra-high / xhigh reasoning and fast mode if
  available.

Final response:
1. Phase 2 post-apply verification status
2. Recommended DB bootstrap/migration plan
3. Commands that will be run later, clearly marked as not yet executed
4. Remaining human decisions
5. Exact next prompt for approved execution
```
