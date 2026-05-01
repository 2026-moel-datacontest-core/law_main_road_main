# Cloud Migration Phase Index

기준일: `2026-04-29`

This directory contains phase-specific execution plans for the GCP migration
target. Use these files when assigning focused implementation work to an agent.

## How To Use

- For overall architecture, read
  [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md).
- For phase numbering and dependency map, read
  [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md).
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
| 7 | Optional Hardening | [`phase7_optional_hardening.md`](phase7_optional_hardening.md) | Evaluate optional VPC/LB/Cloud Armor/API Gateway/jobs only after Phase 1-6 are stable |

## Global Invariants

- Managed Vertex AI path stays in scope; Local LLM / Compute Engine GPU VM stays
  out of scope for first migration.
- Terraform owns cloud resources and IAM, not DB schema/data mutation.
- CI/scripts own image build, migration, seed, deploy, smoke, and rollback
  commands.
- Admin/manual owns secret values, production approvals, Firebase console checks,
  and incident/rollback decisions.
- SCN-004 freeze and public API contracts remain unchanged.
- SCN-001 live/backend document draft generation remains out of scope.
