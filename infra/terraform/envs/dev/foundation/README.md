# Dev Foundation

Phase 1 dev-only foundation root.

Current status on `2026-05-06`: initialized with the Phase 1 GCS backend,
applied, and verified with a post-apply no-change plan.

Creates:

- post-bootstrap required Google APIs,
- `lmr-dev-frontend-sa`,
- `lmr-dev-backend-sa`,
- `lmr-dev-github-actions-sa`,
- `lmr-dev-terraform-sa`,
- one Docker Artifact Registry repository,
- Secret Manager secret shells only,
- one private artifact bucket,
- backend IAM access to DB-related secret shells and the artifact bucket.

Does not create:

- Cloud SQL,
- Cloud Run,
- GitHub Workload Identity Federation provider,
- GitHub Actions workflow,
- secret versions or values,
- service account key JSON,
- Firebase Admin JSON.

Initialize after `bootstrap/remote-state` has been applied and approved:

```bash
terraform init \
  -backend-config="bucket=<state_bucket_name>" \
  -backend-config="prefix=envs/dev/foundation"
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars.example
```

Run any additional `terraform apply` only after explicit human approval.

For local validation before the remote state bucket exists, use:

```bash
terraform init -backend=false
terraform validate
```

Do not commit real `terraform.tfvars`; commit only
`terraform.tfvars.example`.

`lmr-dev-terraform-sa` receives only Phase 1 foundation-class roles by default.
Cloud SQL, Cloud Run, monitoring/logging administration, and deploy roles must be
added by their owning phases after a separate boundary review.

The default `terraform-sa` grants are project-level bootstrap/foundation
candidate roles, but Phase 1 does not create a key, WIF provider, GitHub trust,
or workflow impersonation path for that account. Before using `terraform-sa` from
CI/CD or later phases, re-review and narrow/remove broad project-level grants
where resource-scoped bindings are available.
