# Cloud SQL pgvector Module

This module creates the Cloud SQL PostgreSQL infrastructure shell for the
pgvector-backed application database.

It manages:

- one `google_sql_database_instance`,
- one application database shell,
- backup, PITR, storage, availability, and deletion-protection settings,
- non-secret connection metadata outputs.

It intentionally does not manage:

- DB users,
- DB passwords,
- Secret Manager secret versions,
- credential-bearing `DATABASE_URL` values,
- `CREATE EXTENSION vector`,
- Alembic schema migrations,
- HNSW/vector indexes,
- `law_chunks` seed rows,
- embedding generation.

Access posture:

- Use Cloud SQL connector/Auth Proxy from Phase 3 runtime.
- This module does not grant backend runtime IAM; Phase 3 owns that grant.
- No `authorized_networks` block is declared.
- Private IP and Serverless VPC Access remain later hardening unless separately
  approved.

For first Phase 2 validation, compose this module only from
`infra/terraform/envs/dev/data`. `envs/prod/data` remains skeleton-only until a
separate prod-opening review.
