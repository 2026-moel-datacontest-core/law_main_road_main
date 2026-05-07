# Next Prompt - Cloud Migration Phase 2 Preparation

기준일: `2026-05-06`

작업 위치:

```text
/home/jongwon/personal_project/temp_extract/law_main_road/law_main_road_frontend_final_followup
```

현재 목적:

```text
Cloud Migration Phase 1은 apply까지 완료했다. 다음 세션에서는 Phase 1 결과를
검증한 뒤 Phase 2 data foundation을 계획/리뷰한다. Phase 2 apply는 별도 승인 전
실행하지 않는다.
```

## Current Status

완료:

- Manual preflight 1~6 완료
- GCP budget alert 생성 완료
  - name: `lmr-dev-demo-monthly`
  - amount: `KRW 70,000`
  - thresholds: `25/50/80/100 actual + 100 forecasted`
- Phase 0 readiness review: `PASS`
- Phase 1 implementation/review: `PASS WITH NOTES`
- Phase 1 bootstrap apply: `PASS`
- Phase 1 dev foundation apply: `PASS`
- Post-apply plan checks: `PASS`, no changes

Phase 1에서 생성된 범위:

- Terraform state bucket
- required APIs
- frontend/backend/github-actions/terraform service accounts
- Artifact Registry Docker repository
- Secret Manager secret shells only
- private artifact bucket
- foundation IAM

생성하지 않은 것:

- Cloud SQL
- Cloud Run
- WIF provider/trust binding
- GitHub Actions workflow
- secret values / secret versions
- service account key JSON
- Firebase Admin JSON shell
- backend/frontend/API/schema/runtime changes
- prod apply-ready resources

## Read First

```text
AGENTS.md
CLAUDE.md
docs/architecture/CLAUDE.md
docs/architecture/env_profiles.md
docs/architecture/phase/phase1_bootstrap_foundation.md
docs/architecture/phase/phase2_data_foundation.md
docs/ops/cloud_migration_manual_preflight.md
docs/ops/cloud_migration_budget_and_mirror_policy.md
infra/terraform/README.md
infra/terraform/bootstrap/remote-state/README.md
infra/terraform/envs/dev/foundation/README.md
config/secrets/cloud_migration_private_runbook.md
```

`config/secrets/cloud_migration_private_runbook.md`는 gitignored private
inventory다. 내용을 public mirror, issue, README, screenshot에 옮기지 않는다.

## First Verification

```bash
cd /home/jongwon/personal_project/temp_extract/law_main_road/law_main_road_frontend_final_followup
git status --short
git check-ignore -v config/secrets/cloud_migration_private_runbook.md
terraform fmt -check -recursive infra/terraform

cd infra/terraform/bootstrap/remote-state
terraform validate
terraform plan -var='project_id=law-main-road' -detailed-exitcode

cd ../../envs/dev/foundation
terraform validate
terraform plan -var-file=terraform.tfvars.example -detailed-exitcode
```

Expected:

```text
bootstrap plan detailed exit code: 0, no changes
dev foundation plan detailed exit code: 0, no changes
```

## Hard Boundaries

- Do not run any Phase 2 `terraform apply` without explicit approval.
- Do not create Cloud SQL until Phase 2 plan is reviewed.
- Do not create Cloud Run, WIF provider/trust, GitHub workflow, secret values,
  service account key JSON, Firebase Admin JSON shell, or prod resources.
- Do not modify backend/frontend/API/schema/runtime behavior unless the opened
  phase explicitly allows it.
- Do not change SCN-004 freeze or SCN-001 frozen draft/history/bridge boundaries.
- Do not commit/push unless explicitly requested.

## Prompt To Use In A New Codex Session

```text
반드시 한국어로 답변해줘.

Model/reasoning:
- Use the strongest available model.
- Set reasoning effort to extra-high / xhigh.
- If the environment supports fast mode with extra-high reasoning, use it.
- All spawned agents/sub-agents must also use extra-high / xhigh reasoning and
  fast mode if available.

Task:
Start Cloud Migration Phase 2 preparation from a completed Phase 1 baseline.

Current state:
- Phase 0 readiness: PASS.
- Phase 1 bootstrap/foundation: applied and post-apply no-change plan verified.
- Dev is the only opened cloud target.
- Prod remains skeleton-only.
- No Cloud SQL, Cloud Run, WIF provider, GitHub workflow, secret values, service
  account key JSON, Firebase Admin JSON shell, or app runtime changes exist from
  Phase 1.

First:
1. Read `next_prompt.md`.
2. Read the files listed in `next_prompt.md`.
3. Run the First Verification command block.
4. Report whether Phase 1 is still clean.
5. Review `docs/architecture/phase/phase2_data_foundation.md` and produce a
   Phase 2 execution plan.

Phase 2 planning focus:
- Cloud SQL PostgreSQL dev-only data foundation.
- Exact dev tier/storage/version/backup/PITR/deletion protection decision.
- Terraform root/module shape for `envs/dev/data`.
- Migration/pgvector/schema/seed runbook boundaries outside Terraform.
- Cost and rollback implications.

Hard boundaries:
- Do not run Phase 2 apply without explicit approval.
- Do not create Cloud Run or deploy app runtime.
- Do not put secret values in Terraform, tfvars, state, docs, issues, or chat.
- Do not add `google_secret_manager_secret_version`.
- Do not create service account keys.
- Do not open prod resources.
- Do not change backend/frontend/API/schema/runtime behavior.

Use agents:
- Use an agent loop for plan -> review -> fix -> verify until the Phase 2 plan is
  internally consistent.
- Every agent/sub-agent must use extra-high / xhigh reasoning and fast mode if
  available.

Final response:
1. Phase 1 verification status
2. Phase 2 readiness status
3. Recommended exact dev Cloud SQL settings and why
4. Files/docs that need updates before implementation
5. Blockers or decisions needed from the human
6. Exact next prompt for Phase 2 implementation
```



cpu 사용량, job 