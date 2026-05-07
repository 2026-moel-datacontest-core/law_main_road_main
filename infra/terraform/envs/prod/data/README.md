# Prod Data Foundation Skeleton

This directory is intentionally skeleton-only.

Prod is not opened in the first migration. Do not add backend state, real
tfvars, provider blocks, modules, or apply-ready Terraform resources here until
a separate prod-opening review approves:

- exact Cloud SQL tier and storage,
- backup retention,
- PITR,
- HA / availability posture,
- deletion protection,
- deployment approval policy,
- operating owner and rollback plan,
- cost posture.

The reusable module is `infra/terraform/modules/cloud-sql-pgvector`, but first
Phase 2 validation is dev-only through `infra/terraform/envs/dev/data`.

Forbidden here before prod-opening review:

- `backend "gcs"` configuration,
- `google_sql_database_instance`,
- `google_sql_database`,
- `google_sql_user`,
- `google_secret_manager_secret_version`,
- Cloud Run,
- WIF provider or GitHub workflow,
- service account key JSON,
- secret values or credential-bearing `DATABASE_URL`.
