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
| `cloud_migration_architecture.md` | Authoritative follow-up production-oriented GCP migration architecture. This file describes a target cloud deployment path, not the current local MVP. Local LLM / Compute Engine GPU VM is intentionally excluded from the target. |
| `cloud_migration_architecture.mmd` / `cloud_migration_architecture.drawio` | Secondary schematic references for the same target. The root draw.io file is kept as a backward-compatible overview schematic, but it is not the current presentation/handoff source. If it conflicts with `images_drawio/final_architecture_overview.drawio`, `cloud_migration_architecture.md`, or the phase plan, sync it or treat it as stale. |
| `images_drawio/` | Current presentation and implementation-handoff draw.io source files for overview/detail architecture visuals. Draw.io files are visual sources; PNGs are generated previews. Edit these first for visual updates. |
| `cloud_migration_phase_plan.md` | Phase-by-phase implementation architecture for the GCP migration target, with Terraform layer/module boundaries and verification gates. |
| `phase/phaseN_*.md` | Phase-specific execution documents. Use these for assigning or implementing one phase at a time. |
| `phase/hardening/phase7x_*.md` | Phase 7 candidate-specific design/opening-gate notes. Keep optional hardening details here instead of bloating the Phase 7 umbrella document. |
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
- Keep visual authority explicit: markdown architecture and phase docs own
  decisions; draw.io owns visual layout; PNG files are regenerated previews and
  must not drift from their draw.io source.
- Current presentation/handoff visual sources are
  `images_drawio/final_architecture_overview.drawio` and
  `images_drawio/final_architecture_detail.drawio`; their PNGs are generated
  previews, and the root `cloud_migration_architecture.drawio` is secondary.
- For phase-specific work, read `phase/README.md` and the matching
  `phase/phaseN_*.md` file before changing Terraform, runtime code, or
  deployment docs.
- For Phase 7 optional hardening, keep the umbrella decision in
  `phase/phase7_optional_hardening.md` and put candidate-specific opening gates
  under `phase/hardening/`.
