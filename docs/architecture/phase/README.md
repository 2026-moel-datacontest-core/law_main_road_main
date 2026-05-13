# Cloud Migration Phase Index

기준일: `2026-05-13`

This directory contains phase-specific execution plans for the GCP migration
target. Use these files when assigning focused implementation work to an agent.

## How To Use

- For overall architecture, read
  [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md).
- For phase numbering and dependency map, read
  [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md).
- For dev/demo/prod setting differences, read
  [`../env_profiles.md`](../env_profiles.md).
- For implementation work, read the matching phase file below and follow its
  readiness gates, ownership split, verification commands, and rollback notes.

## Phase Files

| Phase | Name | File | Primary Goal |
|---:|---|---|---|
| 0 | Docs / Design Freeze | [`phase0_design_freeze.md`](phase0_design_freeze.md) | Freeze cloud migration target and verify local baseline |
| 1 | Bootstrap + Foundation | [`phase1_bootstrap_foundation.md`](phase1_bootstrap_foundation.md) | Create remote state, APIs, service accounts, Artifact Registry, Secret Manager shells, and private artifact bucket |
| 2 | Data Foundation | [`phase2_data_foundation.md`](phase2_data_foundation.md) | Create Cloud SQL PostgreSQL and run DB migration/pgvector/seed checks outside Terraform |
| 3 | Backend Runtime | [`phase3_backend_runtime.md`](phase3_backend_runtime.md) | Deploy backend Cloud Run service and verify API/auth/DB/Vertex/storage wiring |
| 4 | Frontend Runtime | [`phase4_frontend_runtime.md`](phase4_frontend_runtime.md) | Deploy frontend Cloud Run service and verify browser, Firebase, CORS, and preset flows |
| 5 | CI/CD | [`phase5_cicd.md`](phase5_cicd.md) | Add GitHub Actions, Workload Identity Federation, deploy permissions, and rollback job |
| 6 | Observability / Reliability | [`phase6_observability_reliability.md`](phase6_observability_reliability.md) | Add monitoring, alerting, lifecycle cleanup, and rollback drill |
| 7 | Optional Hardening | [`phase7_optional_hardening.md`](phase7_optional_hardening.md) | Phase 7A `www` Firebase Hosting custom domain is complete; Phase 7B private GCS artifact storage + observability is a candidate; evaluate any further LB/VPC/Cloud Armor/API Gateway/jobs separately |

## Terraform Authoring Map

Use this table when opening GitHub issues or assigning Terraform work. Phase 1
paths now exist under `infra/terraform`; Phase 2+ paths remain future authoring
paths until their phase opens.

| Phase | Issue Title | Terraform Root | Primary Modules | Create Resources? |
|---:|---|---|---|---|
| 0 | Phase 0: Cloud migration design freeze and Terraform readiness review | none | none | no |
| 1 | Phase 1: Bootstrap remote state and foundation resources | `infra/terraform/bootstrap/remote-state`, `infra/terraform/envs/{env}/foundation` | `project-services`, `iam-wif` service-account slice, `artifact-registry`, `secret-manager`, `artifact-bucket` | yes |
| 2 | Phase 2: Cloud SQL data foundation and migration/seed runbook | `infra/terraform/envs/{env}/data` | `cloud-sql-pgvector` | yes, but DB schema/data stay in scripts |
| 3 | Phase 3: Backend Cloud Run runtime and GCS artifact boundary | `infra/terraform/envs/{env}/runtime/backend` | `cloud-run-service` | yes |
| 4 | Phase 4: Frontend Cloud Run runtime and public build env | `infra/terraform/envs/{env}/runtime/frontend` | `cloud-run-service` | yes |
| 5 | Phase 5: GitHub Actions WIF keyless CI/CD | `infra/terraform/envs/{env}/cicd` | `iam-wif` WIF slice | yes |
| 6 | Phase 6: Observability, lifecycle, cleanup, and rollback drill | `infra/terraform/envs/{env}/ops` | `monitoring-alerts`, lifecycle/cleanup settings | yes |
| 7 | Phase 7A+: Optional hardening candidates | candidate-specific root/config | Firebase Hosting edge for 7A completed for `www`, `load-balancer-domain` deferred, candidate-specific modules | only after separate approval |

Each phase issue should include scope, acceptance criteria, forbidden changes,
validation commands, rollback/delete policy, secrets handling, and a
`Do not manage yet` list.

Phase 0 final decisions for Terraform authoring:

- First cloud migration target is `dev` only. Keep both `envs/dev` and
  `envs/prod` in the authoring layout, but make only `envs/dev` apply-ready in
  the first implementation pass. Keep `envs/prod` as skeleton/README/tfvars
  example material until a separate prod-opening review approves exact prod
  sizing, backup, PITR, HA, deletion protection, and deployment approval policy.
- Initial GCP model is one project with env-prefixed resources. Separate dev/prod
  GCP projects are future hardening.
- Human-readable app label is `law-main-road`; Terraform/resource prefix is
  `lmr`; resource names use `lmr-{env}-{component}` where provider constraints
  allow.
- Bucket naming pattern `lmr-{env}-artifacts` is separate from the future
  candidate backend env var `ARTIFACT_BUCKET_NAME`.

Decision status:

- Finalized now: naming, first `dev` target, one-project/env-prefixed model,
  dev-only apply target for the first implementation, prod skeleton-only
  authoring until a separate prod-opening review, state bootstrap contract,
  secret-value exclusion, artifact bucket/prefix contract, `run.app` first
  deployment, and shell/Python helper-only automation.
- Phase-gated: Cloud SQL exact sizing, prod PITR/cost confirmation, GCS adapter
  and `ARTIFACT_BUCKET_NAME` activation, artifact retrieval if runtime/UI needs
  it, Cloud Monitoring custom dashboard ownership, budget alert ownership, and
  exact alert thresholds.
- Deferred by design: separate dev/prod GCP projects, HTTPS Load Balancer,
  `api.<domain>`, root apex routing, same-origin `/api/**`, advanced
  SLO/alerting, and retrieval UI unless required later. Phase 7A `www` Firebase
  Hosting custom domain is complete.

## Shell/Python Runbook Boundary

The migration target is Cloud Run, Cloud SQL, GCS, Secret Manager, and managed
GCP services. There is no current EC2/GCE-style host fleet that needs OS/package
configuration management. Keep Terraform as the persistent cloud resource source
of truth, GitHub Actions as the deployment automation layer, and shell/Python
scripts as small approved runbooks.

## GCP MFA Helper Boundary

The local AWS guide `aws-mfa-main-guide1` is a useful UX reference, but the GCP
helper should not try to behave like AWS STS. GCP MFA is handled during Google
account/browser sign-in, while the helper validates the local CLI/ADC/bootstrap
state.

Suggested future GCP MFA path only:

```text
gcp-mfa-main-guide1/
  README.md
  gcp-mfa-login.sh
  gcp-mfa-clear.sh
```

Expected responsibilities:

- `gcp-mfa-login.sh <project_id> [terraform_sa_email]`: guide `gcloud auth login`,
  guide `gcloud auth application-default login`, set/check active project,
  optionally configure `auth/impersonate_service_account`, reject service account
  key JSON paths, verify token minting, and print `human_mfa_attested=PASS/FAIL`.
- `gcp-mfa-clear.sh`: clear impersonation and unsafe local credential env vars.

Forbidden responsibilities:

- collecting OTP codes, recovery codes, QR screenshots, phone numbers, or backup
  codes,
- exporting long-lived credential env vars,
- creating or storing service account key JSON,
- replacing WIF for GitHub Actions.

Suggested future script path only:

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

Good shell/Python runbook candidates:

- check that the active human GCP account exists and MFA prerequisite evidence
  has been recorded,
- run `gcloud ... describe`/read-only inventory checks after Terraform apply,
- orchestrate Alembic migration and `law_chunks` seed commands after approval,
- run backend/frontend post-deploy smoke,
- query logs for sensitive-field redaction checks,
- execute rehearsed rollback drill commands after manual approval.

Bad shell/Python runbook candidates:

- creating Terraform-owned persistent resources,
- storing secret values or service account key JSON,
- bypassing production approvals,
- mutating DNS, DB, or Cloud Run traffic without a recorded rollback plan,
- changing application API/auth/storage behavior.

## Global Invariants

- Managed Vertex AI path stays in scope; Local LLM / Compute Engine GPU VM stays
  out of scope for first migration.
- Terraform owns cloud resources and IAM, not DB schema/data mutation.
- CI/scripts own image build, migration, seed, Terraform invocation, smoke, and
  rollback command orchestration.
- Terraform owns Cloud Run service config, image reference, and steady-state
  traffic; CI must not become a second Cloud Run deploy owner.
- Admin/manual owns secret values, production approvals, Firebase console checks,
  and incident/rollback decisions.
- SCN-004 freeze and public API contracts remain unchanged.
- SCN-001 live/backend document draft generation remains out of scope.
- GitHub Actions uses Workload Identity Federation keyless auth; service account
  key JSON is forbidden.
- Human GCP admin accounts must use MFA/2-Step Verification before resource
  apply or emergency operations.
- Project id/number, service account email, bucket name, SQL connection name, WIF
  provider name, Secret Manager resource name, state bucket name, and direct
  backend `run.app` URL are internal cloud inventory.
