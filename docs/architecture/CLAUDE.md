# CLAUDE.md — docs/architecture/

## Purpose

This directory owns architecture documentation only. Keep current MVP architecture,
target cloud migration architecture, phase execution plans, and operational
boundaries aligned.

## Read Order

For any cloud migration architecture or Terraform-planning task, read in this
order:

1. repo root `AGENTS.md`
2. repo root `CLAUDE.md`
3. `docs/architecture/README.md`
4. `docs/architecture/current_project_architecture.md`
5. `docs/architecture/cloud_migration_architecture.md`
6. `docs/architecture/cloud_migration_phase_plan.md`
7. `docs/architecture/phase/README.md`
8. the specific `docs/architecture/phase/phaseN_*.md` file for the requested phase

## Source Of Truth

- `cloud_migration_architecture.md`: target GCP architecture and service boundary.
- `cloud_migration_phase_plan.md`: phase numbering, layered Terraform roots, and
  cross-phase dependency map.
- `phase/phaseN_*.md`: tactical execution checklist for that phase.
- `current_project_architecture.md`: current local/MVP architecture reference.

When changing phase numbering, Terraform roots, or runtime boundaries, update the
architecture spec, phase plan, phase index, and affected phase file in the same
documentation patch.

## Rules

- Do not reintroduce Local LLM, Compute Engine GPU VM, Ollama, Qwen, or vLLM into
  the first cloud migration target.
- Do not change SCN-004 demo freeze, `/api/v1/answer`, `/api/v1/documents/draft`,
  protected SCN-001 Bridge/history contracts, or SCN-001 frontend-local frozen
  draft boundaries from architecture docs alone.
- Do not make Terraform responsible for `pgvector` extension creation, vector
  indexes, schema migration, or `law_chunks` seed import. Those remain
  migration/seed script responsibilities.
- Do not put raw secret values, service account JSON, Firebase uid, provider
  subject, raw contract text, raw Bridge payload, or raw answer/draft payload in
  docs, examples, logs, or Terraform state.
- Keep Terraform, CI/scripts, and Admin/manual responsibility split explicit.
- Prefer adding phase-specific detail under `phase/` instead of bloating the
  top-level phase plan.

## Phase Task Rule

When asked to implement or review a phase, first open the matching phase file:

- Phase 0: `phase/phase0_design_freeze.md`
- Phase 1: `phase/phase1_bootstrap_foundation.md`
- Phase 2: `phase/phase2_data_foundation.md`
- Phase 3: `phase/phase3_backend_runtime.md`
- Phase 4: `phase/phase4_frontend_runtime.md`
- Phase 5: `phase/phase5_cicd.md`
- Phase 6: `phase/phase6_observability_reliability.md`
- Phase 7: `phase/phase7_optional_hardening.md`

Report whether the phase is ready, blocked, or needs a preceding phase output
before editing Terraform or runtime code.
