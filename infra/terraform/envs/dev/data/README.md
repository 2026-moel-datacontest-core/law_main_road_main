# Dev Data Foundation

Phase 2 dev-only data root.

Current status on `2026-05-07`: applied for the first `dev` target. A post-apply
plan returned no changes, Cloud SQL instance/database describe checks passed,
and post-Terraform DB/data readiness completed outside this Terraform root.

Created by this root:

- one Cloud SQL PostgreSQL instance,
- one application database shell.

Dev settings:

- `POSTGRES_17`,
- `ENTERPRISE`,
- `db-f1-micro`,
- 10 GB SSD,
- storage auto-increase enabled with 20 GB cap,
- automated backups enabled with 3 retained backups,
- PITR off,
- `ZONAL` availability / HA off,
- deletion protection false,
- Cloud SQL connector/Auth Proxy posture,
- no authorized networks.

Does not create:

- Cloud SQL users,
- DB passwords,
- Secret Manager secret versions or values,
- credential-bearing `DATABASE_URL`,
- pgvector extension,
- Alembic schema,
- HNSW/vector indexes,
- `law_chunks` seed rows,
- embeddings,
- Cloud Run,
- backend runtime IAM,
- WIF provider or GitHub workflow,
- service account key JSON.

Completed outside Terraform on `2026-05-07`:

- PostgreSQL admin password setup and application DB role/password setup.
- Split DB Secret Manager versions for DB user, DB name, and DB password.
- pgvector extension setup; observed vector version `0.8.1`.
- Alembic `upgrade head`; current/head `20260427_000007`.
- `law_chunks` seed from `backend/data/law_chunks/all_chunks.json`: `1722`
  rows, all `selected_as_of = 2026-04-11`.
- Embeddings with `gemini-embedding-001`: 768 dimensions, `1722` embedded rows,
  `0` null rows, warning/error `1/0` with one Vertex auto truncation warning.
- HNSW index verification: `idx_law_chunks_embedding` exists, valid and ready.
- Retrieval smoke for `top_k=5` and `top_k=10`.
- Answer smoke with `gemini-2.5-flash` and `citation_violations=0`.

Still not opened:

- credential-bearing database-url Secret Manager version,
- Cloud Run deploy,
- backend runtime IAM / Cloud SQL Client grant,
- WIF provider or GitHub workflow,
- service account key JSON,
- prod resources,
- backend/frontend/API/runtime code changes.

Initialize against the Phase 1 state bucket:

```bash
terraform init \
  -backend-config="bucket=lmr-dev-law-main-road-tfstate" \
  -backend-config="prefix=envs/dev/data"
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars.example
```

For local syntax validation before remote backend initialization:

```bash
terraform init -backend=false
terraform validate
```

Phase 1 foundation remote-state dependency:

```text
bucket: lmr-dev-law-main-road-tfstate
prefix: envs/dev/foundation
```

The root consumes Phase 1 outputs for project/region consistency checks,
and Secret Manager shell names. Secret values remain manual/admin or later
approved secured CI work.

Phase 3 receives only non-secret outputs: Cloud SQL connection name, database
name, Secret Manager shell names/ids, connector posture, and recommended DB pool
guardrails. Do not output a full `DATABASE_URL`.

Phase 3 backend runtime owns the Cloud SQL client IAM grant for `backend-sa`.
Do not grant backend runtime Cloud SQL access from this Phase 2 data root.

Do not run DB user/password bootstrap, Secret Manager versions, pgvector
extension setup, Alembic migration, seed import, embedding generation, or Cloud
Run deployment from this root. The first dev DB/data readiness pass has already
completed those DB/data steps outside Terraform; keep future reruns in approved
admin/runbook automation, not Terraform.
