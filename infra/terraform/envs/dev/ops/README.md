# Dev Ops

Phase 6 dev-only observability and reliability root.

Creates or manages:

- Cloud Logging log-based counter metrics for current backend plain-text signals,
- Cloud Monitoring alert policies for backend/frontend 5xx, provider timeout,
  provider runtime errors, database/internal errors, artifact persistence
  failures, and Cloud SQL saturation candidates,
- optional minimal ops IAM grants for `terraform-sa`.

Does not create:

- notification channels before receiver approval,
- service account key JSON,
- secret values or Secret Manager versions,
- backend/frontend/API behavior changes,
- prod resources,
- Step 3 full retention lifecycle, physical purge, or account deletion.

Lifecycle and cleanup:

- The private artifact bucket is foundation-owned and already has the reviewed
  dev TTL input there. Phase 6 records the posture but does not claim GCS
  artifact durability while the backend writer can still use local paths.
- Artifact Registry is foundation-owned. Phase 6 cleanup policy inputs are wired
  through `envs/dev/foundation` with `cleanup_policy_dry_run = true`; do not
  disable dry-run until rollback image retention and irreversible delete impact
  are approved.

Initialize against the Phase 1 state bucket:

```bash
terraform init \
  -backend-config="bucket=lmr-dev-law-main-road-tfstate" \
  -backend-config="prefix=envs/dev/ops"
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars.example
```

Run `terraform apply` only after these gates are cleared:

- alert receiver/channel and incident owner are approved,
- threshold/noise posture is accepted for dev,
- lifecycle/delete impact is accepted,
- Cloud SQL backup/PITR verification path is selected,
- current runtime roots are reconciled or their drift is explicitly accepted.

The root reads existing `foundation`, `data`, `runtime/backend`, and
`runtime/frontend` remote states. It must not import or duplicate ownership of
Cloud Run, Cloud SQL, Artifact Registry, or the artifact bucket.
