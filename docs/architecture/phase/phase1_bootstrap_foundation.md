# Phase 1 — Bootstrap + Foundation

기준일: `2026-04-29`

## 1. Goal

Phase 1은 이후 모든 GCP 리소스가 안전하게 올라갈 수 있는 foundation을 만든다.
이 단계는 아직 application runtime을 공개하지 않는다.

핵심 목표는 다음과 같다.

- Terraform remote state bucket을 준비한다.
- 필요한 GCP APIs를 활성화한다.
- runtime/deploy/Terraform service account를 분리한다.
- Artifact Registry Docker repository를 만든다.
- Secret Manager secret shell을 만든다. 실제 secret value는 넣지 않는다.
- Before artifact용 private Cloud Storage bucket을 만든다.

## 2. Phase Status

| Item | Status |
|---|---|
| Phase type | Bootstrap / foundation infra |
| Primary Terraform roots | `infra/bootstrap/remote-state`, `infra/environments/{env}/foundation` |
| Runtime traffic | none |
| DB creation | none |
| Secret values | not created by Terraform |
| Required previous phase | Phase 0 Ready for Phase 1 |
| Next phase | [`phase2_data_foundation.md`](phase2_data_foundation.md) |

## 3. Read First

Phase 1 작업자는 아래 순서로 읽는다.

1. repo root `AGENTS.md`
2. repo root `CLAUDE.md`
3. [`../CLAUDE.md`](../CLAUDE.md)
4. [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md)
5. [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md)
6. [`phase0_design_freeze.md`](phase0_design_freeze.md)
7. this file

## 4. Preconditions

Phase 1을 시작하기 전에 확인한다.

| Precondition | Required State |
|---|---|
| Phase 0 | Ready for Phase 1 |
| GCP project | selected or created manually |
| Billing | enabled manually |
| Region | `asia-northeast3` |
| Terraform auth | local admin user or approved `terraform-sa` impersonation path decided |
| GitHub Actions WIF | not required yet |
| Secret values | not needed yet |
| Docker | not required for Phase 1 |

If GCP project/billing is not ready, Phase 1 is blocked before Terraform work.

## 5. Scope

### In Scope

- Bootstrap remote state bucket.
- Foundation Terraform root.
- Required API enablement.
- Service accounts.
- Artifact Registry repository.
- Secret Manager secret resources.
- Private artifact bucket.
- IAM bindings required for these foundation resources.
- Module skeleton and output contracts for later phases.

### Out Of Scope

- Cloud SQL creation.
- pgvector extension.
- DB migration.
- `law_chunks` seed import.
- Cloud Run services.
- GitHub Actions Workload Identity Federation.
- CI/CD workflow.
- Monitoring alert policies.
- API Gateway, Cloud Armor, private VPC.
- Any raw secret value.

## 6. Terraform Layout

Create or maintain this layout.

```text
infra/
  bootstrap/
    remote-state/
      main.tf
      variables.tf
      outputs.tf
      versions.tf
      README.md
  modules/
    project-services/
      main.tf
      variables.tf
      outputs.tf
      README.md
    iam-service-accounts/
      main.tf
      variables.tf
      outputs.tf
      README.md
    artifact-registry/
      main.tf
      variables.tf
      outputs.tf
      README.md
    secret-manager/
      main.tf
      variables.tf
      outputs.tf
      README.md
    artifact-bucket/
      main.tf
      variables.tf
      outputs.tf
      README.md
  environments/
    dev/
      foundation/
        main.tf
        variables.tf
        outputs.tf
        versions.tf
        terraform.tfvars.example
    prod/
      foundation/
        main.tf
        variables.tf
        outputs.tf
        versions.tf
        terraform.tfvars.example
```

Use `prod` first if only one real environment is affordable, but keep the
directory shape environment-ready.

## 7. Root Responsibilities

| Root | Responsibility |
|---|---|
| `infra/bootstrap/remote-state` | GCS bucket for Terraform state; versioning; public access prevention |
| `infra/environments/{env}/foundation` | APIs, service accounts, Artifact Registry, Secret Manager shells, artifact bucket |

Do not use `terraform apply -target` as the normal workflow. Separate roots are
the phase boundary.

## 8. Bootstrap State Procedure

The remote state bucket cannot be used before it exists. Start bootstrap with
local state.

```bash
cd infra/bootstrap/remote-state
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
terraform init -migrate-state
```

Rules:

- Do not configure a remote backend inside `bootstrap/remote-state` itself unless
  a separate pre-existing state bucket is deliberately chosen.
- Enable bucket versioning for state recovery.
- Enable public access prevention.
- Keep deletion protection / prevent-destroy policy where practical.
- Record the final state bucket name for foundation backend config.

## 9. Foundation Apply Procedure

After bootstrap migration is complete:

```bash
cd infra/environments/{env}/foundation
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

Expected follow-up describe checks:

```bash
gcloud services list --enabled --project ...
gcloud iam service-accounts describe ...
gcloud artifacts repositories describe ...
gcloud storage buckets describe ...
gcloud secrets describe ...
```

## 10. Required APIs

Phase 1 should enable the APIs required by Phase 1-6.

| API | Why |
|---|---|
| `run.googleapis.com` | Cloud Run frontend/backend |
| `sqladmin.googleapis.com` | Cloud SQL PostgreSQL |
| `secretmanager.googleapis.com` | Secret Manager |
| `artifactregistry.googleapis.com` | Docker images |
| `iam.googleapis.com` | service accounts and IAM bindings |
| `iamcredentials.googleapis.com` | service account impersonation |
| `sts.googleapis.com` | later Workload Identity Federation |
| `cloudresourcemanager.googleapis.com` | project metadata/IAM support |
| `serviceusage.googleapis.com` | API enablement |
| `logging.googleapis.com` | Cloud Logging |
| `monitoring.googleapis.com` | Cloud Monitoring / alerting |
| `aiplatform.googleapis.com` | Vertex AI managed path |
| `storage.googleapis.com` | artifact and state buckets |

If a provider requires an additional API during apply, add it to
`project-services` and document why.

## 11. Service Accounts

Create these service accounts.

| Service account | Purpose |
|---|---|
| `kls-{env}-frontend-sa` | Cloud Run frontend runtime identity |
| `kls-{env}-backend-sa` | Cloud Run backend runtime identity |
| `kls-{env}-github-actions-sa` | later GitHub Actions deploy identity |
| `kls-{env}-terraform-sa` | Terraform execution identity, if using impersonation |

Do not use one service account for every concern.

## 12. IAM Baseline

Minimum `terraform-sa` candidate roles, scoped to project/resource where possible:

| Area | Candidate role |
|---|---|
| Required API enablement | `roles/serviceusage.serviceUsageAdmin` |
| Cloud Run | `roles/run.admin` |
| Cloud SQL | `roles/cloudsql.admin` |
| State/artifact buckets | `roles/storage.admin`, narrowed to bucket scope where possible |
| Secret Manager | `roles/secretmanager.admin` |
| Artifact Registry | `roles/artifactregistry.admin` |
| Service accounts | `roles/iam.serviceAccountAdmin`, `roles/iam.serviceAccountUser` |
| Monitoring/logging | `roles/monitoring.admin`, `roles/logging.admin` |

Rules:

- Do not grant `roles/owner` or `roles/editor` for normal Terraform execution.
- Any broader bootstrap-only grant must be temporary, documented, and removed
  after foundation is applied.
- Prefer resource-scoped IAM over project-wide IAM.
- Runtime service accounts should not receive deployment or Terraform admin roles.

## 13. Runtime IAM Grants From Phase 1

Phase 1 may create baseline IAM bindings needed for foundation resources. Keep
runtime-specific grants narrow.

| Principal | Grant | Target |
|---|---|---|
| `backend-sa` | Secret accessor only for backend-needed secrets | specific Secret Manager resources |
| `backend-sa` | Storage object access | private artifact bucket |
| `github-actions-sa` | none or minimal placeholder | defer deploy permissions to Phase 5 |
| `frontend-sa` | none by default | add later only if backend IAM auth is introduced |

Do not grant Firebase service-agent roles such as
`roles/firebase.sdkAdminServiceAgent` to normal runtime service accounts.

## 14. Artifact Registry

Create one Docker repository for the first migration.

| Setting | Recommended |
|---|---|
| Name | `kls-{env}-ar` |
| Format | Docker |
| Region | `asia-northeast3` |
| Cleanup policy | may be configured later in Phase 6, or exposed as optional module input |

Expected later images:

- backend image.
- frontend image.

## 15. Artifact Bucket

Create a private bucket for Before artifacts.

| Setting | Required |
|---|---|
| Public access prevention | enabled |
| Uniform bucket-level access | enabled |
| Versioning | optional; decide by cost/privacy tradeoff |
| Lifecycle | baseline TTL rule, for example 7 or 30 days after policy decision |
| Name | globally unique, not just `kls-{env}-artifacts` |

Naming options:

```text
kls-{env}-{project_id}-artifacts
kls-{env}-artifacts-{random_id}
```

Output the final bucket name. Later phases must consume output, not copy-pasted
names.

## 16. Secret Manager Shells

Terraform creates secret resources only. Values are added manually or by a
secured CI step outside Terraform state.

Initial secret resources:

| Secret | Used by | Phase |
|---|---|---|
| `kls-{env}-db-user` | backend DB connection if not IAM DB auth | Phase 2/3 |
| `kls-{env}-db-password` | backend DB connection if not IAM DB auth | Phase 2/3 |
| `kls-{env}-db-name` | backend DB config; may be plain env if not sensitive | Phase 2/3 |
| `kls-{env}-firebase-admin-json` | fallback only if Cloud Run ADC fails | Phase 3 |
| `kls-{env}-app-secret` | future app signing/session secret if introduced | future |

Do not store Firebase public web config as private backend secrets. It is public
client config and is handled in Phase 4 as Docker build args/runtime config.

## 17. Module Contract Checklist

Every Phase 1 module should document:

| Item | Required |
|---|---|
| Inputs | `project_id`, `env`, `region`, `prefix`, `labels` |
| Outputs | resource ids/names needed by later phases |
| IAM grants | exact role and target resource |
| Destructive behavior | whether deletion protection or prevent-destroy is enabled |
| Verification | one `gcloud ... describe` or Terraform output check |
| Rollback | how to undo without damaging later phases |

## 18. Required Outputs

Foundation should expose outputs needed by later phases.

| Output | Used by |
|---|---|
| `project_id` | all later roots |
| `region` | all later roots |
| `artifact_registry_repository` | Phase 3/4/5 |
| `artifact_registry_location` | Phase 3/4/5 |
| `frontend_service_account_email` | Phase 4 |
| `backend_service_account_email` | Phase 3 |
| `github_actions_service_account_email` | Phase 5 |
| `terraform_service_account_email` | local/CI Terraform execution |
| `artifact_bucket_name` | Phase 3/6 |
| `secret_names` | Phase 2/3 |

## 19. Environment Variables / tfvars

Do not commit real `terraform.tfvars`. Commit only `terraform.tfvars.example`.

Suggested variables:

```hcl
project_id = "your-gcp-project-id"
env        = "prod"
region     = "asia-northeast3"
prefix     = "kls"
owner      = "portfolio"
```

Labels:

```hcl
labels = {
  app        = "k-labor-shield"
  env        = "prod"
  managed_by = "terraform"
  owner      = "portfolio"
}
```

## 20. Verification Commands

Run after apply.

```bash
terraform output
gcloud services list --enabled --project PROJECT_ID
gcloud iam service-accounts describe kls-prod-backend-sa@PROJECT_ID.iam.gserviceaccount.com
gcloud artifacts repositories describe kls-prod-ar --location asia-northeast3 --project PROJECT_ID
gcloud storage buckets describe gs://BUCKET_NAME
gcloud secrets describe kls-prod-db-password --project PROJECT_ID
```

Expected:

- Required APIs are enabled.
- Service accounts exist.
- Artifact Registry repository exists.
- Artifact bucket is private.
- Secret resources exist, with no values managed by Terraform.
- Terraform outputs are enough for Phase 2/3/4/5.

## 21. Acceptance Criteria

Phase 1 is complete only when all required statements are true.

- Bootstrap remote state bucket exists.
- Bootstrap local state has been migrated to remote state.
- Foundation root uses remote state.
- Required APIs are enabled.
- `frontend-sa`, `backend-sa`, `github-actions-sa`, and `terraform-sa` exist.
- No service account has project-wide Owner/Editor.
- Artifact Registry Docker repository exists.
- Secret Manager secret shells exist with no raw secret values in Terraform.
- Private artifact bucket has public access prevention and uniform bucket-level
  access enabled.
- Artifact bucket name is globally unique and exported as output.
- `terraform output` exposes required values for later phases.
- Phase 2 can start without redesigning foundation resources.

## 22. Phase 1 Output

At the end of Phase 1, produce a short status note with this shape.

```markdown
## Phase 1 Status

Decision: Ready for Phase 2 / Blocked

Applied roots:
- bootstrap/remote-state: PASS/FAIL
- environments/{env}/foundation: PASS/FAIL

Outputs:
- state bucket: ...
- artifact registry repository: ...
- artifact bucket: ...
- frontend-sa: ...
- backend-sa: ...
- github-actions-sa: ...
- terraform-sa: ...
- secret resources: ...

Checks:
- terraform fmt/validate/plan/apply: PASS/FAIL
- remote state migration: PASS/FAIL
- API enablement: PASS/FAIL
- service account describe: PASS/FAIL
- artifact registry describe: PASS/FAIL
- artifact bucket privacy: PASS/FAIL
- secret shell describe: PASS/FAIL

Findings:
- Blocker: ...
- High: ...
- Medium: ...
- Low: ...

Phase 2 handoff:
- Use `docs/architecture/phase/phase2_data_foundation.md`.
- Consume foundation outputs through remote state.
- Do not create pgvector/schema/seed with Terraform.
```

## 23. Rollback

Phase 1 has no live app traffic, but it may contain shared state and identity
resources. Roll back carefully.

Safe rollback order if no later phase depends on the resources:

1. Confirm no Phase 2+ resources have been created.
2. Remove foundation resources with `terraform destroy` from
   `infra/environments/{env}/foundation`.
3. Remove bootstrap remote state bucket only after exporting or deleting state
   intentionally.

Do not delete the state bucket while later roots exist.

## 24. Blocks Phase 2 If

- Remote state is not migrated.
- Foundation root cannot initialize remote state.
- Required APIs are not enabled.
- `backend-sa` does not exist.
- Artifact Registry repository output is missing.
- Artifact bucket output is missing.
- Secret Manager shell outputs are missing.
- Secret values were committed or placed in Terraform state.
- Any normal service account has Owner/Editor.

## 25. Do Not

- Do not create Cloud SQL in Phase 1.
- Do not deploy Cloud Run in Phase 1.
- Do not create WIF or GitHub workflow in Phase 1.
- Do not add real secret values to Terraform.
- Do not use a service account key JSON.
- Do not grant Owner/Editor as the normal solution.
- Do not use `terraform apply -target` as the normal phase workflow.
- Do not change backend/frontend runtime behavior.

## 26. Suggested Agent Prompt

Use this prompt when asking an agent to implement or review Phase 1.

```text
반드시 한국어로 답변해줘.

docs/architecture/CLAUDE.md를 먼저 읽고,
docs/architecture/phase/phase1_bootstrap_foundation.md 기준으로 Phase 1 Terraform skeleton을 구현해줘.

범위:
- infra/bootstrap/remote-state
- infra/modules/project-services
- infra/modules/iam-service-accounts
- infra/modules/artifact-registry
- infra/modules/secret-manager
- infra/modules/artifact-bucket
- infra/environments/{env}/foundation

주의:
- Cloud SQL, Cloud Run, WIF/GitHub Actions는 만들지 마.
- secret value는 Terraform에 넣지 마.
- service account key JSON은 만들지 마.
- Owner/Editor role을 정상 경로로 쓰지 마.
- GCS bucket 이름은 global unique하게 처리해.
- output은 Phase 2/3/4/5에서 remote state로 받을 수 있게 정의해.

완료 후:
- 수정 파일 목록
- terraform fmt/validate/plan 실행 결과
- apply를 실행하지 않았다면 이유
- Phase 2 handoff output 목록
을 보고해줘.
```
