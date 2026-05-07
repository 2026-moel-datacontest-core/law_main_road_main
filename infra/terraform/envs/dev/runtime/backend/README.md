# Dev Backend Runtime

Phase 3 dev-only backend runtime root.

This root plans the FastAPI backend Cloud Run service using the approved
immutable backend image digest and the existing Phase 1/2 remote-state outputs.

Creates or manages:

- backend Cloud Run service `lmr-dev-backend`,
- backend runtime service account attachment from Phase 1,
- Cloud SQL connector volume using the Phase 2 connection name,
- `DATABASE_URL` Secret Manager env reference only,
- non-secret backend runtime env vars,
- conservative Cloud Run scaling,
- `backend-sa` project IAM for Cloud SQL Client and Vertex AI User,
- public `roles/run.invoker` for controlled dev smoke.

Does not create:

- Secret Manager versions or raw secret values,
- `lmr-dev-database-url` payload,
- Cloud SQL instance/database/schema/data,
- DB users/passwords,
- Docker images or pushes,
- frontend Cloud Run,
- WIF/GitHub workflow,
- service account key JSON,
- Firebase Admin JSON,
- API/backend/frontend behavior changes.

Local syntax validation before remote backend initialization:

```bash
terraform init -backend=false
terraform validate
```

Remote backend plan gate:

```bash
terraform init \
  -backend-config="bucket=lmr-dev-law-main-road-tfstate" \
  -backend-config="prefix=envs/dev/runtime/backend"
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars.example
```

Do not run `terraform apply` until the Phase 3 apply prompt is approved.

Prerequisite before apply:

- Secret Manager secret `lmr-dev-database-url` must have at least one enabled
  version containing the credential-bearing SQLAlchemy `DATABASE_URL`.
- Keep the secret value out of Terraform files, tfvars, plan output, git,
  screenshots, and public evidence.

Current CORS posture is Phase 4 dev frontend Cloud Run only:

```text
^https://lmr-dev-frontend-nhthv64dcq-du\.a\.run\.app$
```

Use a local backend process or an explicit reviewed CORS override for local
frontend development against the Cloud Run backend.
