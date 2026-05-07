# Dev CI/CD

Phase 5 dev-only CI/CD root.

Creates or manages:

- GitHub Actions Workload Identity Federation pool/provider,
- `roles/iam.workloadIdentityUser` binding for the private source repo only,
- Artifact Registry writer for `github-actions-sa`,
- `github-actions-sa` token creator on `terraform-sa`,
- reviewed deploy/project roles for `terraform-sa`,
- Terraform state bucket access for `terraform-sa`,
- `terraform-sa` `roles/iam.serviceAccountUser` on backend/frontend runtime
  service accounts.

Does not create:

- service account key JSON,
- GitHub Secrets or raw credential values,
- GitHub repository settings/rulesets/environments,
- Cloud Run services or images,
- database/schema/seed changes,
- Firebase Authorized Domains,
- prod resources.

The WIF provider is intentionally bound to the private deploy/source repo only:
`2026-moel-datacontest-core/law_main_road_main`. Do not grant access to the
public submission mirror `Team-msp-architect-2026/msp-team02`.

The provider condition is also narrowed to the `dev` GitHub environment,
approved dev refs, and only `.github/workflows/deploy-dev.yml` /
`.github/workflows/rollback-dev.yml`. The temporary `cloud_migration` ref is for
Phase 5 smoke and should be removed after the workflow is merged into the
approved deploy branch.

Local syntax validation before remote backend initialization:

```bash
terraform init -backend=false
terraform validate
```

Remote backend plan gate:

```bash
terraform init \
  -backend-config="bucket=<state-bucket-name>" \
  -backend-config="prefix=envs/dev/cicd"
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars.example
```

The first `terraform apply` must be run from an approved local admin or approved
`terraform-sa` impersonation path. Do not bootstrap CI/CD with a service account
key JSON.

After apply, configure GitHub Actions variables from the private Terraform
outputs / runbook inventory. Keep exact cloud inventory out of public artifacts.
At minimum the deploy workflow needs:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_WIF_PROVIDER`
- `GCP_GITHUB_ACTIONS_SA`
- `GCP_TERRAFORM_SA`
- `ARTIFACT_REGISTRY_REPOSITORY`
- `TERRAFORM_STATE_BUCKET`
- `BACKEND_SERVICE_NAME`
- `FRONTEND_SERVICE_NAME`
- Firebase public web config variables for frontend build args.

GitHub Secrets must not contain GCP service account key JSON. DB credentials and
Firebase Admin values stay in Secret Manager.
