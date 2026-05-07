# Prod Backend Runtime Skeleton

Prod backend runtime is not opened.

This directory is intentionally skeleton-only until a separate prod-opening
review approves exact prod sizing, backup/PITR/HA, deletion protection,
deployment approval policy, operating owner, budget posture, abuse controls, and
rollback responsibility.

Do not add apply-ready `.tf` files, real prod tfvars, backend state config,
Cloud Run resources, IAM grants, or secret references here before that review.

The reusable module may support prod later, but first apply target remains
`envs/dev/*` only.
