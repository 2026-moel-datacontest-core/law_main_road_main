# Phase 1 Bootstrap Remote State

This root creates the versioned GCS bucket used by later Terraform roots for
remote state. It intentionally starts with local Terraform state because the GCS
backend bucket does not exist yet.

Current status on `2026-05-06`: applied for the first `dev` target. The state
bucket exists, and a post-apply plan check returned no changes.

Scope:

- enable only the bootstrap APIs needed for state bucket creation,
- create one private, versioned state bucket,
- do not create application runtime resources,
- do not create secret values or service account keys.

Run from this directory:

```bash
terraform init
terraform fmt -check
terraform validate
terraform plan -var='project_id=law-main-road'
```

Apply requires explicit human approval. The first approved apply has already
been completed for `dev`; use this only for a deliberate rerun or recovery:

```bash
terraform apply -var='project_id=law-main-road'
terraform output -raw state_bucket_name
```

After this root is applied, initialize
`infra/terraform/envs/dev/foundation` with the output bucket:

```bash
terraform init \
  -backend-config="bucket=<state_bucket_name>" \
  -backend-config="prefix=envs/dev/foundation"
```

Do not commit `terraform.tfstate*`. The root `.gitignore` already ignores local
state files by pattern once they are added there; verify before committing.

This bootstrap root intentionally has no committed `backend "gcs"` block, so
there is no `terraform init -migrate-state` step for this root in Phase 1.
After apply, keep the bootstrap local state in a private operator location or
delete/export it only after confirming no later cleanup depends on it. Later env
roots use the created bucket as their remote backend through `-backend-config`.
