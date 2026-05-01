# Phase 5 — CI/CD

기준일: `2026-04-29`

## 1. Goal

Phase 5는 Phase 3/4의 local/manual image push와 deploy 절차를 GitHub Actions
기반 CI/CD로 전환한다. 핵심은 장기 서비스 계정 키 없이 Workload Identity
Federation으로 GCP에 인증하고, PR 검증과 main/prod 배포를 분리하는 것이다.

핵심 목표는 다음과 같다.

- GitHub Actions에서 GCP service account key JSON을 사용하지 않는다.
- GitHub OIDC + Workload Identity Federation 기반 keyless auth를 구성한다.
- PR에서는 build/test/validate/plan 중심으로 검증하고 apply하지 않는다.
- main/protected environment에서는 image build/push와 Terraform apply를 수행한다.
- backend/frontend Cloud Run revision 배포 후 smoke를 실행한다.
- smoke 실패 시 새 revision을 stable로 취급하지 않고 rollback 경로를 제공한다.
- runtime service account와 deploy/Terraform identity를 분리한다.

## 2. Phase Status

| Item | Status |
|---|---|
| Phase type | CI/CD and keyless deploy automation |
| Primary Terraform root | `infra/environments/{env}/cicd` |
| Primary modules | `workload-identity-federation`, deploy IAM bindings |
| CI platform | GitHub Actions |
| GCP auth | Workload Identity Federation |
| Required previous phase | [`phase4_frontend_runtime.md`](phase4_frontend_runtime.md) |
| Next phase | [`phase6_observability_reliability.md`](phase6_observability_reliability.md) |

## 3. Read First

Phase 5 작업자는 아래 순서로 읽는다.

1. repo root `AGENTS.md`
2. repo root `CLAUDE.md`
3. [`../CLAUDE.md`](../CLAUDE.md)
4. [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md)
5. [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md)
6. [`phase3_backend_runtime.md`](phase3_backend_runtime.md)
7. [`phase4_frontend_runtime.md`](phase4_frontend_runtime.md)
8. this file
9. `backend/CLAUDE.md`
10. `frontend/CLAUDE.md`
11. `scripts/demo_preflight.sh`

## 4. Preconditions

Phase 5를 시작하기 전에 확인한다.

| Precondition | Required State |
|---|---|
| Phase 1 foundation | `github-actions-sa`, `terraform-sa`, Artifact Registry, state bucket exist |
| Phase 3 backend | backend Cloud Run deployed and smoke-tested |
| Phase 4 frontend | frontend Cloud Run deployed and browser-smoke-tested |
| Dockerfiles | backend/frontend image build strategy finalized |
| Terraform roots | `foundation`, `data`, `runtime/backend`, `runtime/frontend` are stable |
| GitHub repo | final owner/repo name known |
| Branch policy | `main` is protected or protection plan is approved |
| GitHub environments | `dev`/`prod` environment names and approval policy decided |
| Secret policy | no GCP service account key JSON in GitHub Secrets |
| Rollback target | previous stable backend/frontend revisions recorded |

If GitHub repository owner/name is not final, do not create a broad WIF binding.
WIF conditions should bind to the real repository.

## 5. Scope

### In Scope

- `cicd` Terraform root.
- Workload Identity Federation pool/provider.
- GitHub OIDC subject/attribute conditions.
- `github-actions-sa` impersonation policy.
- `github-actions-sa` deploy permissions.
- Optional `github-actions-sa -> terraform-sa` impersonation path.
- Artifact Registry push permissions.
- Terraform state access for CI.
- GitHub Actions workflow design.
- PR validation gates.
- main/prod deployment gates.
- post-deploy smoke gates.
- manual rollback workflow/runbook.

### Out Of Scope

- Runtime architecture changes.
- Backend or frontend API contract changes.
- Cloud SQL schema changes.
- Automatic destructive DB migrations.
- Secret value creation in GitHub.
- Service account key JSON.
- Observability alert policies.
- Artifact lifecycle cleanup.
- API Gateway, Cloud Armor, private VPC.
- SCN-001 live/backend document draft generation.
- Step 3 full retention lifecycle.

## 6. Terraform Layout

Create or maintain this layout.

```text
infra/
  modules/
    workload-identity-federation/
      main.tf
      variables.tf
      outputs.tf
      README.md
    cicd-iam-bindings/
      main.tf
      variables.tf
      outputs.tf
      README.md
  environments/
    dev/
      cicd/
        main.tf
        variables.tf
        outputs.tf
        versions.tf
        terraform.tfvars.example
    prod/
      cicd/
        main.tf
        variables.tf
        outputs.tf
        versions.tf
        terraform.tfvars.example
```

Suggested workflow files for the later implementation:

```text
.github/
  workflows/
    pr-checks.yml
    deploy.yml
    rollback.yml
```

This phase document does not create those files. It defines what they should do.

## 7. First Apply Bootstrap Note

The `cicd` root creates the WIF path that CI will later use. Therefore the first
apply of `infra/environments/{env}/cicd` cannot depend on that same WIF path.

Initial apply:

```bash
cd infra/environments/{env}/cicd
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

Run the first apply from an approved local admin or `terraform-sa` impersonation
path. After WIF is working, future changes to the `cicd` root can be managed by
the protected deploy workflow if the team approves that model.

Do not solve this bootstrap step by creating a long-lived service account key.

## 8. Identity Model

Recommended identity model:

```text
GitHub Actions OIDC token
  -> Workload Identity Pool Provider
  -> github-actions-sa
  -> optional impersonation of terraform-sa for Terraform apply
  -> Terraform updates Cloud Run services with backend-sa/frontend-sa attached
```

Service account responsibilities:

| Service Account | Responsibility |
|---|---|
| `github-actions-sa` | keyless CI entrypoint, image push, CI orchestration |
| `terraform-sa` | Terraform plan/apply for approved roots |
| `backend-sa` | backend Cloud Run runtime only |
| `frontend-sa` | frontend Cloud Run runtime only |

Keep runtime identities separate from deploy identities. Runtime service accounts
must not receive Artifact Registry writer, Terraform admin, or broad deploy
permissions.

## 9. WIF Attribute Conditions

WIF provider conditions should be narrow.

Required claims/conditions to model:

| Condition | Purpose |
|---|---|
| repository owner/name | prevent other repos from using the provider |
| branch/ref | allow deploy only from approved branch, normally `main` |
| GitHub environment | require `prod` environment approval before prod deploy |
| workflow name or path | optional extra restriction for deploy workflow |

PR rules:

- Fork PRs must not receive privileged GCP credentials.
- PRs should run local checks without WIF by default.
- If Terraform cloud `plan` is needed on PR, restrict it to trusted same-repo
  branches and never allow `apply`.

Example condition shape:

```text
assertion.repository == "OWNER/REPO"
  && assertion.ref == "refs/heads/main"
```

For prod deploys, prefer adding an environment condition as well:

```text
assertion.repository == "OWNER/REPO"
  && assertion.environment == "prod"
```

Use the actual owner/repo names when implementing. Do not leave sample names in
Terraform.

## 10. Terraform Owns

Terraform owns CI/CD identity and deploy permission boundaries.

| Area | Terraform Responsibility |
|---|---|
| WIF pool/provider | GitHub OIDC trust |
| WIF binding | allow selected repo/workflow to impersonate `github-actions-sa` |
| Service account IAM | optional `github-actions-sa` impersonation of `terraform-sa` |
| Artifact Registry IAM | image push permission for CI |
| Terraform state IAM | read/write access for approved Terraform apply path |
| Cloud Run deploy IAM | only if workflow deploys directly instead of Terraform apply |
| Service account user IAM | allow Terraform/deploy identity to attach `backend-sa`/`frontend-sa` |

Do not grant `roles/owner` or `roles/editor`.

## 11. Recommended IAM Boundary

Preferred steady-state:

| Principal | Grant | Target |
|---|---|---|
| GitHub OIDC principal | `roles/iam.workloadIdentityUser` | `github-actions-sa` |
| `github-actions-sa` | Artifact Registry writer | Artifact Registry repo |
| `github-actions-sa` | token creator / impersonation grant | `terraform-sa`, if using impersonation |
| `terraform-sa` | Terraform infra roles from Phase 1 | scoped project/resources |
| `terraform-sa` | `roles/iam.serviceAccountUser` | `backend-sa`, `frontend-sa` |

Alternative direct-deploy model:

- `github-actions-sa` receives Cloud Run deploy permissions directly.
- This is simpler but easier to drift from Terraform-owned runtime config.
- If used, document exactly which Cloud Run fields CI may mutate and reconcile
  the final state back into Terraform.

For this project, prefer Terraform-owned deploys with image digest variables.

## 12. Workflow Overview

Recommended workflow separation:

| Workflow | Trigger | GCP Auth | Purpose |
|---|---|---:|---|
| `pr-checks.yml` | `pull_request` | no by default | local build/test/validate/security checks |
| `deploy.yml` | `push` to `main` or `workflow_dispatch` | yes via WIF | build/push images, Terraform apply, smoke |
| `rollback.yml` | `workflow_dispatch` with approval | yes via WIF | shift traffic or re-apply previous image/revision |

The first version can build both backend and frontend images every deploy. Later
optimization can add path filters, but do not let path filters skip required
smoke for shared API/config changes.

## 13. PR Checks

PR checks should be deterministic and should not mutate GCP.

Recommended PR jobs:

```text
pull_request:
  - checkout
  - Python setup
  - backend import smoke
  - document draft deterministic smoke
  - Node setup
  - frontend npm ci
  - frontend npm run build
  - terraform fmt -check
  - terraform validate for changed roots
  - secret scan
  - dependency scan
```

Existing local checks to preserve:

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend && npm run build
```

CI-specific notes:

- Backend import may need `DATABASE_URL`; use an ephemeral PostgreSQL service or
  a safe CI database configuration.
- Do not run live Vertex/eval full reports in PR by default.
- Do not add `eval/run_answer_evidence_report.py` to standard PR checks.
- Do not run Terraform `apply` on PR.
- Do not expose GCP credentials to fork PRs.

## 14. Security Checks

Minimum CI security checks:

| Check | Purpose |
|---|---|
| secret scan | catch `.env`, service account JSON, tokens, DB URLs |
| dependency scan | catch known vulnerable Python/Node packages |
| Dockerfile scan | optional image/package risk signal |
| Terraform validate | catch invalid IaC before deploy |
| WIF no-key check | ensure no service account key JSON is required |

Acceptable tool choices can vary. Examples:

- `gitleaks` or `trufflehog` for secret scanning.
- `pip-audit`, `npm audit`, or `osv-scanner` for dependencies.
- `trivy` for container/image scan.

Do not block Phase 5 design on a specific scanner vendor. Pick one practical set
when implementing and document the output.

## 15. Deploy Workflow

Recommended deploy workflow:

```text
push to main or workflow_dispatch
  -> checkout
  -> run PR-equivalent build/smoke gates
  -> authenticate to GCP through WIF
  -> configure Docker auth for Artifact Registry
  -> build backend image
  -> build frontend image with NEXT_PUBLIC_* build args
  -> push images to Artifact Registry
  -> resolve immutable image digests
  -> terraform plan with image digests
  -> protected environment approval for prod
  -> terraform apply
  -> post-deploy backend smoke
  -> post-deploy frontend/browser smoke
  -> record stable revision/digest
```

Use immutable tags/digests:

```text
backend:sha-${GITHUB_SHA}
frontend:sha-${GITHUB_SHA}
```

Terraform should receive image digests or immutable SHA tags, not `latest`.

## 16. Terraform Apply Strategy

Phase 5 should automate the runtime deploy path without reintroducing drift.

Preferred:

```text
CI builds/pushes images
  -> CI passes image digest variables to Terraform
  -> Terraform updates runtime/backend and runtime/frontend roots
  -> Cloud Run creates new revisions
```

Apply order:

1. `runtime/backend` if backend image or backend env/CORS changed.
2. `runtime/frontend` if frontend image or public build config changed.
3. `runtime/backend` again only when Phase 4 CORS update is part of the same
   controlled deploy.

Do not run `infra/bootstrap/remote-state` from normal CI deploy workflows.

Do not auto-run destructive DB migrations in the normal deploy job. If a DB
migration is required, use an explicit migration job or protected manual step
with backup/rollback notes.

## 17. GitHub Variables And Secrets

Use GitHub variables for non-secret config.

Candidate GitHub variables:

| Variable | Secret? | Notes |
|---|---:|---|
| `GCP_PROJECT_ID` | no | target project |
| `GCP_REGION` | no | `asia-northeast3` |
| `GCP_WIF_PROVIDER` | no | WIF provider resource name |
| `GCP_GITHUB_ACTIONS_SA` | no | service account email |
| `ARTIFACT_REGISTRY_REPOSITORY` | no | Docker repo |
| `BACKEND_SERVICE_NAME` | no | smoke/rollback helper |
| `FRONTEND_SERVICE_NAME` | no | smoke/rollback helper |
| `NEXT_PUBLIC_API_BASE_URL` | no | can be derived from backend Terraform output |
| Firebase public web config | no | public frontend config, not private secret |

Avoid GitHub secrets for GCP auth. WIF replaces service account key JSON.

Secret values such as DB credentials and Firebase Admin fallback JSON should stay
in Secret Manager, not GitHub Secrets. GitHub Actions may reference Secret
Manager by name through Terraform/Cloud Run configuration, but should not print
or store raw values.

## 18. Post-Deploy Smoke

Deploy is not complete when Terraform apply finishes. Smoke must pass.

Backend smoke:

```text
GET /health
GET /api/v1/auth/me without token
POST /api/v1/retrieve demo query
POST /api/v1/answer demo query
POST /api/v1/documents/draft deterministic fixture
protected SCN-001 endpoint missing-token smoke
```

Frontend smoke:

```text
GET /
GET /before
GET /after
GET /history
SCN-004 exact preset remains fixture-backed
SCN-001 exact Bridge demo remains frontend-local frozen draft path
Google Sign-In smoke if browser credentials/test account policy allows it
```

If browser automation is not ready in the first CI/CD version, keep manual
browser smoke as a protected post-deploy checklist and do not claim fully
hands-off production deploy.

## 19. Promotion Policy

Promotion rule:

```text
build pass
  -> Terraform apply pass
  -> backend smoke pass
  -> frontend smoke pass
  -> mark revision/digest as stable
```

If post-deploy smoke fails:

- do not mark the new revision as stable
- rollback traffic to the previous stable revision
- keep logs and revision/digest evidence
- open a failed deploy note
- do not attempt DB rollback unless the failure is a confirmed migration issue

For prod, require GitHub protected environment approval before `terraform apply`.

## 20. Rollback Workflow

Rollback should be rehearsable and explicit.

Recommended rollback inputs:

| Input | Example |
|---|---|
| environment | `prod` |
| service | `backend`, `frontend`, or `both` |
| target revision | previous stable revision |
| reason | smoke failure, provider issue, UI regression |

Rollback options:

| Option | Behavior |
|---|---|
| Terraform rollback | re-apply previous image digest/revision variables |
| Cloud Run traffic rollback | `gcloud run services update-traffic` to previous stable revision |

Terraform rollback is cleaner for long-term state. Cloud Run traffic rollback is
acceptable for urgent recovery, but the final state must be reconciled back into
Terraform before the next deploy.

DB rollback remains manual/runbook-driven unless the migration is explicitly
reversible and separately approved.

## 21. Artifact And Provenance Records

Each successful deploy should record:

- Git commit SHA.
- backend image digest.
- frontend image digest.
- Terraform plan/apply run URL.
- backend Cloud Run revision.
- frontend Cloud Run revision.
- smoke result.
- rollback target.

This can start as a GitHub Actions summary. A later phase can move release notes
or deployment records into a formal runbook.

## 22. Environment Strategy

Recommended environment flow:

| Environment | Trigger | Approval |
|---|---|---|
| `dev` | push to non-prod branch or manual dispatch | optional |
| `prod` | `main` or manual dispatch | required protected environment approval |

If only prod is actually instantiated for cost reasons, keep `dev` workflow
structure documented but disabled or manual-only. Do not fake a dev environment
that does not exist.

## 23. Acceptance Criteria

Phase 5 is complete when:

- `infra/environments/{env}/cicd` can run `terraform fmt -check`,
  `terraform validate`, `terraform plan`, and initial `terraform apply`.
- Workload Identity Federation is configured for the real GitHub repo.
- GitHub Actions can authenticate to GCP without service account key JSON.
- `github-actions-sa` and `terraform-sa` responsibilities are separated or the
  chosen simpler model is explicitly documented.
- PR workflow runs build/smoke/security/terraform validation without apply.
- Fork PRs do not receive privileged GCP credentials.
- Deploy workflow builds backend/frontend images.
- Deploy workflow pushes images to Artifact Registry.
- Deploy workflow deploys immutable image digests/tags through Terraform.
- Prod apply requires protected environment approval.
- Post-deploy smoke runs after apply.
- Failed smoke prevents stable promotion.
- Rollback workflow or runbook can shift backend/frontend traffic to a previous
  stable revision.
- No GCP service account key JSON exists in GitHub Secrets or repo.

## 24. Rollback

CI/CD rollback rules:

- Rollback application revisions first.
- Do not rollback Cloud SQL for normal app deploy failure.
- Do not delete Artifact Registry images needed for rollback.
- Preserve previous stable revision until at least one newer revision is smoke
  verified.
- If a manual Cloud Run traffic rollback is used, reconcile Terraform state and
  variables afterward.

Rollback job should require manual dispatch and approval for prod.

## 25. Blocks Phase 6 If

Phase 6 observability/reliability is blocked if any of these are true.

- WIF fails.
- Deploy pipeline needs service account key JSON.
- PR checks do not run.
- Terraform apply is possible from unprotected branches.
- Prod deploy has no manual/protected approval.
- Post-deploy smoke is missing.
- Smoke failure still promotes the new revision as stable.
- Rollback command/job is not documented or rehearsable.
- Runtime service accounts receive deploy/Terraform admin permissions.

## 26. Status Note Template

When Phase 5 is executed, record a short status note.

```markdown
## Phase 5 Status — CI/CD

- Environment:
- GCP project:
- GitHub repo:
- WIF provider:
- GitHub Actions service account:
- Terraform service account:
- Initial cicd root apply:
- PR workflow:
- Deploy workflow:
- Rollback workflow/runbook:
- Artifact Registry image tags:
- Protected environment:
- Post-deploy smoke:
- Security scans:
- Rollback target:
- Admin actions performed:
- Commands run:
- Skipped checks:
- Blockers:
```

## 27. Do Not

- Do not create or store service account key JSON.
- Do not put GCP credentials in GitHub Secrets.
- Do not expose GCP credentials to fork PRs.
- Do not let PR workflows run Terraform apply.
- Do not deploy from unprotected prod branches.
- Do not use `latest` as the deployed image reference.
- Do not grant `roles/owner` or `roles/editor`.
- Do not grant runtime service accounts deploy/Terraform admin permissions.
- Do not auto-run destructive DB migrations in the normal deploy job.
- Do not change backend/frontend API contracts in Phase 5.
- Do not open SCN-001 live/backend document draft generation.
- Do not add full live eval to the standard deploy path.

## 28. Suggested Agent Prompt

Use this prompt when asking an implementation agent to work on Phase 5.

```text
Read docs/architecture/CLAUDE.md, docs/architecture/cloud_migration_architecture.md,
docs/architecture/cloud_migration_phase_plan.md,
docs/architecture/phase/phase3_backend_runtime.md,
docs/architecture/phase/phase4_frontend_runtime.md, and
docs/architecture/phase/phase5_cicd.md first.

Implement Phase 5 only.

Add the Terraform cicd root and WIF/deploy IAM modules for GitHub Actions keyless
GCP authentication. Use the real GitHub owner/repo in WIF attribute conditions.
Do not create service account key JSON. Keep github-actions-sa, terraform-sa,
backend-sa, and frontend-sa responsibilities separated.

Create GitHub Actions workflow files for PR checks, protected deploy, and manual
rollback. PR checks must not apply Terraform and fork PRs must not receive
privileged GCP credentials. Deploy should build backend/frontend images, push
immutable SHA-tagged images to Artifact Registry, pass image digests/tags to
Terraform runtime roots, run post-deploy smoke, and avoid marking failed smoke as
stable. Do not change runtime API contracts or open SCN-001 live/backend draft
generation.
```
