# Prod Foundation Skeleton

Prod is not opened in Phase 1.

This directory is intentionally skeleton-only until a separate prod-opening
review approves exact prod sizing, backup/PITR, HA, deletion protection,
deployment approval policy, cost posture, and operating owner.

Do not add apply-ready `.tf` files, real backend state, real prod tfvars, Cloud
SQL, Cloud Run, WIF, GitHub workflows, secret values, or service account keys in
this directory during Phase 1.

Use `terraform.tfvars.example` only as a future input sketch.
