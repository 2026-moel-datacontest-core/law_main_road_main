# Architecture Documentation

Status: active architecture index

## Purpose

`docs/architecture/` is reserved for current architecture summaries and cloud
deployment architecture. It should explain target infrastructure, deployment
topology, CI/CD, storage/logging/security services, reliability, and operational
architecture.

Feature requirements, screen plans, API contracts, and data models belong in `docs/specs/`.

## Current File Classification

| File pattern | Role |
|---|---|
| `CLAUDE.md` | Local agent instruction for architecture documentation and phase-specific task routing. |
| `cloud_migration_architecture.md` / `cloud_migration_architecture.mmd` / `cloud_migration_architecture.drawio` | Follow-up production-oriented GCP migration architecture. These files describe a target cloud deployment path, not the current local MVP. Local LLM / Compute Engine GPU VM is intentionally excluded from the target. |
| `cloud_migration_phase_plan.md` | Phase-by-phase implementation architecture for the GCP migration target, with Terraform layer/module boundaries and verification gates. |
| `phase/phaseN_*.md` | Phase-specific execution documents. Use these for assigning or implementing one phase at a time. |
| `current_project_architecture.md` / `current_project_architecture.mmd` | Temporary current project reference that summarizes the current repo surfaces. Keep it for now as source material while `docs/specs/` is being filled out. After specs are complete, move/delete only if it becomes duplicate and there is an explicit follow-up task. |

## Future Production Runbook Docs

The migration architecture and phase plan already cover the Terraform
implementation baseline. The files below are follow-up operational runbooks after
the cloud deployment is live, not prerequisites for starting Phase 1.

- `cloud_overview.md`
- `cloud_overview.mmd`
- `cloud_detail.md`
- `cloud_detail.mmd`
- `ci_cd_pipeline.md`
- `security_boundary.md`
- `observability_runbook.md`
- `release_and_rollback.md`

## Principles

- Do not turn every feature state into an architecture diagram.
- Keep detailed feature behavior, screens, endpoint schemas, and data contracts in `docs/specs/`.
- Use architecture diagrams for cloud/service boundaries, deployment components, storage/logging/security paths, and future expansion options.
- Keep current MVP references clearly separated from the GCP migration
  target architecture.
- For phase-specific work, read `phase/README.md` and the matching
  `phase/phaseN_*.md` file before changing Terraform, runtime code, or
  deployment docs.
