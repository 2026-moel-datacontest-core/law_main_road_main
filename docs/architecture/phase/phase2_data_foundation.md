# Phase 2 — Data Foundation

기준일: `2026-04-29`

## 1. Goal

Phase 2는 Cloud Run backend가 연결할 수 있는 managed PostgreSQL data
foundation을 만든다. 이 단계는 database infrastructure와 migration/seed
검증까지 다루지만, backend Cloud Run service를 배포하지는 않는다.

핵심 목표는 다음과 같다.

- Cloud SQL for PostgreSQL instance를 만든다.
- application database를 준비한다.
- DB credential 생성 경계를 Terraform state와 분리한다.
- Alembic migration으로 schema와 `pgvector` extension을 초기화한다.
- `law_chunks` corpus를 seed/import한다.
- embedding 생성과 HNSW/vector index 상태를 검증한다.
- Cloud Run scale-out 전에 필요한 DB connection guardrail 값을 선정하고,
  현재 backend가 그 값을 소비하지 못하면 Phase 3 구현 전제조건으로 남긴다.

## 2. Phase Status

| Item | Status |
|---|---|
| Phase type | Data infrastructure + DB bootstrap |
| Primary Terraform root | `infra/environments/{env}/data` |
| Primary module | `infra/modules/cloud-sql-postgres` |
| Runtime traffic | none |
| Backend Cloud Run | not deployed |
| Frontend Cloud Run | not deployed |
| DB schema/data | owned by migration/seed scripts |
| Required previous phase | [`phase1_bootstrap_foundation.md`](phase1_bootstrap_foundation.md) |
| Next phase | [`phase3_backend_runtime.md`](phase3_backend_runtime.md) |

## 3. Read First

Phase 2 작업자는 아래 순서로 읽는다.

1. repo root `AGENTS.md`
2. repo root `CLAUDE.md`
3. [`../CLAUDE.md`](../CLAUDE.md)
4. [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md)
5. [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md)
6. [`phase1_bootstrap_foundation.md`](phase1_bootstrap_foundation.md)
7. this file

## 4. Preconditions

Phase 2를 시작하기 전에 확인한다.

| Precondition | Required State |
|---|---|
| Phase 1 foundation | applied successfully |
| Terraform state backend | available from Phase 1 |
| Required APIs | `sqladmin.googleapis.com`, `secretmanager.googleapis.com`, `iam.googleapis.com` enabled |
| Region | `asia-northeast3` |
| Artifact bucket | exists, but not used for DB bootstrap |
| Secret shells | DB secret resources exist |
| DB password value | added outside Terraform before SQL user bootstrap |
| GCP auth | local admin user or approved `terraform-sa` impersonation path |
| Docker | not required |
| Cloud Run | not required |

If the GCP project, billing, or Phase 1 remote state is missing, Phase 2 is
blocked before Cloud SQL work.

## 5. Scope

### In Scope

- `data` Terraform root.
- `cloud-sql-postgres` module.
- Cloud SQL PostgreSQL instance.
- Application database shell.
- Backup and PITR configuration for prod.
- Cloud SQL connection metadata outputs.
- Deletion protection policy for prod.
- DB credential handling decision that avoids raw secret values in git.
- Alembic migration execution plan.
- `pgvector` extension and vector index verification.
- `law_chunks` seed import and version verification.
- Embedding generation/verification plan.
- DB connection pool guardrail for Phase 3 backend runtime.

### Out Of Scope

- Backend Cloud Run service.
- Frontend Cloud Run service.
- Cloud Run traffic splitting.
- GitHub Actions WIF.
- CI/CD workflow.
- Observability alert policies.
- API Gateway, Cloud Armor, private IP, Serverless VPC Access.
- Changing `/api/v1/answer` or `/api/v1/documents/draft` contracts.
- SCN-001 live/backend draft generation.
- Step 3 full retention lifecycle.
- Broad RAG/eval changes.

## 6. Terraform Layout

Create or maintain this layout.

```text
infra/
  modules/
    cloud-sql-postgres/
      main.tf
      variables.tf
      outputs.tf
      README.md
  environments/
    dev/
      data/
        main.tf
        variables.tf
        outputs.tf
        versions.tf
        terraform.tfvars.example
    prod/
      data/
        main.tf
        variables.tf
        outputs.tf
        versions.tf
        terraform.tfvars.example
```

The module name is intentionally `cloud-sql-postgres`, not
`cloud-sql-postgres-pgvector`.

Reason:

- Terraform owns Cloud SQL infrastructure.
- DB migration scripts own `CREATE EXTENSION vector`.
- Alembic migrations own schema and vector index creation.
- Seed scripts own `law_chunks` data import.

## 7. Root Responsibility

| Root | Responsibility |
|---|---|
| `infra/environments/{env}/data` | Compose Cloud SQL module, consume foundation outputs, expose DB outputs for runtime/backend |
| `infra/modules/cloud-sql-postgres` | Cloud SQL instance, database shell, backup settings, deletion protection, connection outputs |

Do not use `terraform apply -target` as the normal workflow. The `data` root is
the phase boundary.

## 8. Terraform Owns

Terraform owns these resources and settings.

| Area | Terraform Responsibility |
|---|---|
| Instance | Cloud SQL PostgreSQL instance |
| Database | application database shell, for example `klabor` |
| Region | `asia-northeast3` |
| Tier | env-specific small tier first |
| Storage | initial disk size, disk type, auto-increase policy |
| Backup | automated backup config for prod |
| PITR | enabled for prod if cost decision allows |
| Deletion protection | enabled for prod |
| Labels | `app`, `env`, `managed_by`, `owner` |
| Outputs | instance name, connection name, database name, region, connection metadata |

Terraform does not directly own:

- raw DB password values
- `pgvector` extension creation
- schema migration
- HNSW/vector index creation
- corpus seed data
- embedding generation

## 9. CI / Script Owns

Migration and seed scripts own DB contents.

| Script Area | Responsibility |
|---|---|
| Alembic | apply current schema migrations |
| Alembic revision `20260413_000001` | `CREATE EXTENSION IF NOT EXISTS vector`; create `law_chunks` |
| Alembic revision `20260413_000003` | create HNSW index `idx_law_chunks_embedding` |
| later Alembic revisions | `users`, `bridge_runs`, `before_review_jobs`, `after_artifact_runs`, visibility/linkage fields |
| `backend/scripts/ingest_chunks.py` | import/upsert `law_chunks` metadata |
| `backend/scripts/embed_chunks.py` | generate missing 768-dimension Vertex embeddings |
| `backend/verify/check_embeddings.py` | verify embedding dimension/completeness/index |
| SQL smoke | verify row counts, corpus marker, extension, tables, indexes |

Phase 2 can run these scripts manually from a developer machine or later from a
controlled CI job. Do not make Terraform run these scripts through ad hoc
`local-exec` as the default architecture.

## 10. Admin / Manual Owns

Some decisions remain administrator-owned.

| Area | Admin Responsibility |
|---|---|
| DB size | approve tier, storage, and expected cost |
| Backup | approve retention and PITR cost |
| DB credential value | add Secret Manager version outside Terraform |
| Destructive migration | approve separately; not part of first migration |
| Full embedding run | approve Vertex AI embedding cost/time |
| Production restore test | schedule after backup is enabled |

Admin actions should be recorded in the phase status note, not encoded as raw
values in Terraform.

## 11. DB User And Secret Boundary

Raw secret values must not be committed to git. Prefer not to store DB passwords
in Terraform state.

Recommended first migration boundary:

1. Terraform creates the Cloud SQL instance and application database.
2. Secret Manager secret shell already exists from Phase 1.
3. Admin or secured CI adds the DB password as a Secret Manager version.
4. A controlled DB bootstrap script creates/updates the app DB user using that
   secret value.
5. Backend Cloud Run receives DB credentials from Secret Manager in Phase 3.

If the implementation chooses Terraform `google_sql_user` with a password, the
password will still be stored in Terraform state even when the variable is marked
`sensitive`. That path requires an explicit decision and a locked-down state
bucket policy. The default portfolio-safe plan is to keep DB password material
outside Terraform state.

## 12. Module Contract

`infra/modules/cloud-sql-postgres` should expose a small, explicit contract.

### Inputs

| Input | Example | Notes |
|---|---|---|
| `project_id` | `my-gcp-project` | required |
| `env` | `dev` / `prod` | required |
| `prefix` | `kls` | required |
| `region` | `asia-northeast3` | required |
| `labels` | common labels | required |
| `database_name` | `klabor` | required |
| `postgres_version` | configurable | pin deliberately when implemented |
| `tier` | env-specific | start small |
| `disk_size_gb` | env-specific | avoid overprovisioning |
| `disk_type` | `PD_SSD` or chosen default | document cost tradeoff |
| `disk_autoresize` | `true` / `false` | prod usually true with max policy if supported |
| `availability_type` | `ZONAL` / `REGIONAL` | `ZONAL` acceptable for portfolio MVP |
| `backup_enabled` | `true` for prod | dev can be cheaper |
| `pitr_enabled` | cost-dependent | prod preferred if affordable |
| `deletion_protection` | `true` for prod | avoid accidental deletion |

### Outputs

| Output | Used By |
|---|---|
| `sql_instance_name` | admin checks, runtime references |
| `sql_connection_name` | Cloud SQL connector / backend runtime |
| `sql_region` | backend env and docs |
| `database_name` | backend DB config |
| `database_host_hint` | local proxy/connector documentation only |
| `backup_enabled` | Phase 6 observability/reliability notes |
| `pitr_enabled` | Phase 6 reliability notes |

Do not output raw passwords or full credential-bearing `DATABASE_URL` from
Terraform.

## 13. Environment Defaults

Recommended starting point:

| Setting | dev | prod |
|---|---|---|
| Region | `asia-northeast3` | `asia-northeast3` |
| Availability | `ZONAL` | `ZONAL` first; `REGIONAL` later if needed |
| Min storage | small | small, monitored |
| Backup | optional/cost-aware | enabled |
| PITR | optional | enabled if cost allows |
| Deletion protection | optional | enabled |
| Public IP | avoid broad exposure | avoid broad exposure |
| Connector path | Cloud SQL connector/proxy | Cloud SQL connector |

Private IP + Serverless VPC Access is not part of Phase 2 first migration. Keep
it as Phase 7 hardening unless a real deployment constraint requires it earlier.

## 14. Naming And Labels

Follow the global naming convention.

```text
kls-{env}-sql
kls-{env}-db
```

Labels:

| Label | Value |
|---|---|
| `app` | `k-labor-shield` |
| `env` | `dev` / `prod` |
| `managed_by` | `terraform` |
| `owner` | `portfolio` |

If GCP resource naming restrictions require shorter names, keep the same semantic
shape and document the final names in the phase output note.

## 15. Apply Procedure

Terraform apply should be separate from DB migration.

```bash
cd infra/environments/{env}/data
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

Expected follow-up checks:

```bash
gcloud sql instances describe kls-{env}-sql --project ...
gcloud sql databases list --instance kls-{env}-sql --project ...
```

The exact instance name can differ if a suffix is required. Use Terraform outputs
as the source of truth.

## 16. DB Bootstrap Procedure

After Cloud SQL exists, connect with an approved admin path.

Recommended local path before CI/CD exists:

```bash
gcloud auth login
gcloud sql connect kls-{env}-sql --database=klabor --user=...
```

or use Cloud SQL Auth Proxy / connector according to the final implementation.

Then configure the app DB user without committing credentials:

```text
Secret Manager DB password version exists
  -> approved admin/CI reads secret value
  -> create or update app DB user
  -> grant only required privileges on application database/schema
```

Minimum DB user principle:

- app user should not be a superuser.
- app user should not own unrelated databases.
- migration role can be separate from runtime app role if the project grows.
- destructive grants are not needed for the first migration.

## 17. Migration Procedure

Run migration after the database is reachable through `DATABASE_URL`.

```bash
cd backend
python verify/ensure_postgres_ready.py
alembic upgrade head
```

Current migration responsibilities include:

| Migration | Responsibility |
|---|---|
| `20260413_000001_create_law_chunks_table.py` | `vector` extension and `law_chunks` table |
| `20260413_000002_make_structure_path_nullable.py` | current law chunk compatibility |
| `20260413_000003_add_embedding_hnsw_index.py` | HNSW vector index |
| `20260421_000004_create_before_review_jobs_table.py` | Before review jobs |
| `20260421_000005_create_after_artifact_runs_table.py` | After artifact runs |
| `20260422_000006_add_user_bridge_linkage_tables.py` | users and bridge linkage |
| `20260427_000007_add_scn001_history_visibility_fields.py` | MVP soft-delete visibility fields |

The migration step is idempotent at the Alembic level: repeated `alembic upgrade
head` should end at the same head revision.

## 18. Seed Procedure

The corpus source of truth is:

```text
backend/data/law_chunks/all_chunks.json
```

Expected corpus marker:

| Field | Expected |
|---|---|
| row count | `1722` |
| `selected_as_of` | `2026-04-11` |
| embedding dimension | `768` |
| embedding model | `gemini-embedding-001` |

Run metadata import first:

```bash
cd backend
python scripts/ingest_chunks.py --dry-run
python scripts/ingest_chunks.py
```

Then generate embeddings only after cost/time approval:

```bash
cd backend
python scripts/embed_chunks.py --limit 5 --dry-run
python scripts/embed_chunks.py --limit 5
python scripts/embed_chunks.py
```

Notes:

- `ingest_chunks.py` upserts metadata and preserves existing embeddings.
- `embed_chunks.py` fills missing embeddings through Vertex AI.
- The full embedding run can take time and incur cost.
- Do not modify `backend/data/law_chunks/` directly.

## 19. Verification Procedure

Run these checks after migration and seed.

```bash
cd backend
python verify/check_embeddings.py --require-index --require-complete
```

Recommended SQL checks:

```sql
SELECT COUNT(*) FROM law_chunks;
SELECT selected_as_of, COUNT(*) FROM law_chunks GROUP BY selected_as_of;
SELECT COUNT(*) FROM law_chunks WHERE embedding IS NULL;
SELECT extname FROM pg_extension WHERE extname = 'vector';
SELECT indexname FROM pg_indexes WHERE indexname = 'idx_law_chunks_embedding';
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM bridge_runs;
SELECT COUNT(*) FROM before_review_jobs;
SELECT COUNT(*) FROM after_artifact_runs;
```

Expected:

- `law_chunks` count is `1722`.
- every row uses `selected_as_of = 2026-04-11`.
- no embedding is `NULL` after the approved full embedding run.
- `vector` extension exists.
- `idx_law_chunks_embedding` exists.
- auth/history tables exist even if row counts are zero.

## 20. Cloud SQL Connection Guardrail

Small Cloud SQL tiers can have low connection limits. Phase 2 must produce the
numbers that Phase 3 uses for Cloud Run backend deployment.

Target backend runtime controls:

- `DB_POOL_SIZE`
- `DB_MAX_OVERFLOW`
- `DB_POOL_TIMEOUT_SECONDS`

Docs-only code review on `2026-04-29` confirmed current `backend/app/db.py`
creates the SQLAlchemy engine from `DATABASE_URL` only. Therefore these values
are Phase 2 output requirements and Phase 3 implementation/verification inputs,
not proof that the current backend already enforces the pool cap.

Before Phase 3 production rollout, verify:

```text
(DB_POOL_SIZE + DB_MAX_OVERFLOW) * backend_max_cloud_run_instances
  < Cloud SQL max_connections - reserved admin connections
```

Recommended first values:

| Env | Value |
|---|---|
| `DB_POOL_SIZE` | `2` |
| `DB_MAX_OVERFLOW` | `3` |
| `DB_POOL_TIMEOUT_SECONDS` | `30` |
| backend max instances | low cap during early testing |

Record the chosen values in the Phase 2 output note so Phase 3 does not deploy
Cloud Run with unsafe defaults.

## 21. Runtime Output Contract For Phase 3

Phase 2 must expose enough information for backend runtime, without exposing
secrets.

| Output | Phase 3 Use |
|---|---|
| Cloud SQL connection name | Cloud Run Cloud SQL connector binding |
| database name | backend DB config |
| region | backend env / service config |
| DB secret names | Secret Manager injection |
| recommended pool size | backend env var |
| recommended max overflow | backend env var |
| recommended max instances | Cloud Run scaling cap |

Do not pass a full credential-bearing `DATABASE_URL` through Terraform output.
Build it at runtime from Secret Manager and connector configuration, or inject it
as a Secret Manager value managed outside Terraform state.

## 22. Security Checks

Before Phase 2 is considered complete, check:

- No DB password appears in `.tf`, `.tfvars`, shell history snippets, docs, or git
  diff.
- Terraform outputs do not include raw credentials.
- Cloud SQL is not broadly open to the internet.
- Runtime app user is not a superuser.
- Migration/admin privilege is not reused unnecessarily by runtime if a separate
  role is available.
- Backups and deletion protection match the env policy.
- `law_chunks` seed uses the repository source of truth, not an ad hoc local file.

## 23. Acceptance Criteria

Phase 2 is complete when:

- `infra/environments/{env}/data` can run `terraform fmt -check`,
  `terraform validate`, `terraform plan`, and `terraform apply`.
- Cloud SQL instance exists in `asia-northeast3`.
- Application database exists.
- DB credential handling is documented and does not put raw secret values in git.
- Alembic migration reaches head.
- `vector` extension exists.
- HNSW/vector index exists.
- `law_chunks` seed import is idempotent or version-gated.
- `law_chunks` row count is `1722`.
- `selected_as_of = 2026-04-11` remains the active corpus marker.
- Embedding dimension verification passes after the approved embedding run.
- Phase 3 receives Cloud SQL connection outputs and pool guardrail values.
- prod backup is enabled.
- prod PITR is enabled if the cost decision allows it.

## 24. Rollback

Rollback rules:

- Prefer backward-compatible migrations.
- Take backup before any destructive change.
- Destructive schema changes are not part of the first migration.
- Seed rollback should be versioned by corpus marker, not ad hoc row deletion.
- Do not drop `law_chunks` or auth/history tables to fix a failed seed.
- If a seed import is wrong, re-run the idempotent import with the correct corpus
  version.
- If embedding generation partially fails, re-run `embed_chunks.py` for missing
  rows; it targets rows with `NULL` embedding unless `--force` is used.

Cloud SQL deletion:

- Never delete prod Cloud SQL as a normal rollback.
- For dev, delete only after confirming no later phase depends on the instance
  and no needed test data remains.

## 25. Blocks Phase 3 If

Phase 3 backend runtime is blocked if any of these are true.

- Cloud SQL connection output is missing.
- Database credential path is not decided.
- Migration cannot run idempotently.
- `vector` extension verification fails.
- HNSW/vector index verification fails.
- `law_chunks` row count is not `1722`.
- embedding dimension verification fails.
- `selected_as_of` is not `2026-04-11`.
- DB pool guardrail values are not selected.
- Backend DB runtime support for the selected guardrail values, or an equivalent
  reviewed connection cap, is not decided.
- Cloud SQL tier/max connections cannot support the planned Cloud Run max
  instances.

## 26. Status Note Template

When Phase 2 is executed, record a short status note.

```markdown
## Phase 2 Status — Data Foundation

- Environment:
- GCP project:
- Region:
- Terraform root:
- Cloud SQL instance:
- Database:
- DB user strategy:
- Backup/PITR:
- Deletion protection:
- Migration head:
- law_chunks row count:
- selected_as_of:
- embedding status:
- HNSW index:
- DB pool values:
- Cloud Run max instance cap recommended for Phase 3:
- Admin actions performed:
- Commands run:
- Skipped checks:
- Blockers:
```

## 27. Do Not

- Do not rename the module to `cloud-sql-postgres-pgvector`.
- Do not make Terraform directly responsible for `pgvector` extension creation.
- Do not run DB migration through Terraform `local-exec` as the default path.
- Do not put raw DB passwords in Terraform, docs, or git.
- Do not expose full `DATABASE_URL` as a Terraform output if it contains
  credentials.
- Do not edit `backend/data/law_chunks/` directly.
- Do not change public API contracts.
- Do not open SCN-001 live/backend draft generation.
- Do not mix Phase 2 DB bootstrap with Phase 3 Cloud Run deployment in one patch.

## 28. Suggested Agent Prompt

Use this prompt when asking an implementation agent to work on Phase 2.

```text
Read docs/architecture/CLAUDE.md, docs/architecture/cloud_migration_architecture.md,
docs/architecture/cloud_migration_phase_plan.md, and
docs/architecture/phase/phase2_data_foundation.md first.

Implement Phase 2 only.

Create the Terraform data root and cloud-sql-postgres module for Cloud SQL
PostgreSQL in asia-northeast3. Keep pgvector extension, schema migration, vector
index creation, law_chunks seed import, and embedding generation outside
Terraform. Do not put raw DB passwords or full credential-bearing DATABASE_URL
values into Terraform state or git. Expose only non-secret outputs needed by
Phase 3 backend runtime.

Select DB pool guardrail values for Phase 3, but do not claim the current
backend consumes DB_POOL_SIZE / DB_MAX_OVERFLOW / DB_POOL_TIMEOUT_SECONDS until
backend/app/db.py support or an equivalent connection cap is implemented and
verified.

After Terraform work, document the exact migration/seed commands to run:
alembic upgrade head, ingest_chunks.py, embed_chunks.py, and check_embeddings.py.
Do not deploy Cloud Run or modify API contracts in this phase.
```
