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
7. `docs/architecture/env_profiles.md`
8. `docs/architecture/phase/README.md`
9. the specific `docs/architecture/phase/phaseN_*.md` file for the requested phase
10. for Phase 7 candidates, the relevant
    `docs/architecture/phase/hardening/phase7x_*.md` file if it exists

## Source Of Truth

- `cloud_migration_architecture.md`: target GCP architecture and service boundary.
- `cloud_migration_phase_plan.md`: phase numbering, layered Terraform roots, and
  cross-phase dependency map.
- `env_profiles.md`: dev / demo-contest / prod operating profiles, scaling,
  sizing, public posture, and prod-opening boundary.
- `phase/phaseN_*.md`: tactical execution checklist for that phase.
- `phase/hardening/phase7x_*.md`: candidate-specific Phase 7 optional hardening
  design/opening gates. These documents refine the Phase 7 umbrella without
  making every hardening candidate mandatory.
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
- For Phase 7 optional hardening, keep `phase/phase7_optional_hardening.md` as
  the umbrella and put accepted candidate details under `phase/hardening/`.
- For any cloud migration or Terraform task, identify the target profile before
  editing: `dev`, `demo/contest`, or `prod`. If the user does not explicitly
  approve `prod`, assume `dev` or `demo/contest`, not prod.
- First implementation/apply target is `dev` only. `envs/prod/*` must remain
  skeleton/README/tfvars-example only until a separate prod-opening review
  approves exact prod sizing, backup, PITR, HA, deletion protection, deployment
  approval policy, and operating owner.
- `demo/contest` is a public presentation posture after dev smoke passes. A
  custom domain or Gabia DNS does not by itself make the deployment prod.
- GitHub deploy/WIF must bind to
  `2026-moel-datacontest-core/law_main_road_main` only. Keep that source repo
  private during current preflight and keep `protect-main`
  policy-defined/enforcement-pending unless Phase 5 explicitly reopens GitHub
  Team upgrade or public conversion. Treat
  `Team-msp-architect-2026/msp-team02` as a public curated submission mirror with
  no deploy permission unless a later approved architecture change moves deploy
  ownership.

## Phase Task Rule

When asked to implement or review a phase, first open the matching phase file:

- Phase 0: `phase/phase0_design_freeze.md`
- Phase 1: `phase/phase1_bootstrap_foundation.md`
- Phase 2: `phase/phase2_data_foundation.md`
- Phase 3: `phase/phase3_backend_runtime.md`
- Phase 4: `phase/phase4_frontend_runtime.md`
- Phase 5: `phase/phase5_cicd.md`
- Phase 6: `phase/phase6_observability_reliability.md`
- Phase 7: `phase/phase7_optional_hardening.md`; if a candidate is opened, also
  read the matching `phase/hardening/phase7x_*.md`

Report whether the phase is ready, blocked, or needs a preceding phase output
before editing Terraform or runtime code.
