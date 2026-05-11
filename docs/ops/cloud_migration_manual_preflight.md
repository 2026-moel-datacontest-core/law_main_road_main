# Cloud Migration Manual Preflight

기준일: `2026-05-11`

이 문서는 GCP cloud migration Terraform authoring을 시작하기 전에 사람이 먼저
준비하고 결정해야 하는 항목을 정리한 운영 런북이다. 실제 Terraform 파일,
GCP resource, secret value, backend/frontend code는 이 문서 단계에서 만들거나
수정하지 않는다.

Phase 1 implementation note on `2026-05-06`: preflight/readiness is no longer
the only cloud migration artifact. Phase 1 Terraform bootstrap/foundation roots
now exist under `infra/terraform`, bootstrap and dev foundation were applied, and
post-apply plan checks returned no changes. No secret values, Cloud SQL, Cloud
Run, WIF provider, GitHub workflow, or backend/frontend runtime changes were
added in Phase 1.

Phase 7A implementation note on `2026-05-11`: `www.law-main-road.cloud` is the
approved `demo/contest` public frontend domain through Firebase Hosting. Backend
CORS was extended only for this custom origin plus the existing frontend
rollback/debug origin. Same-origin `/api/**`, frontend API-base rebuild,
`api.*`, root apex, HTTPS Load Balancer, Cloud Armor, and `prod` remain
separate gates.

Environment/profile별 운영값은
[`../architecture/env_profiles.md`](../architecture/env_profiles.md)를 기준으로
한다. 이 문서는 사람이 먼저 확인할 preflight checklist이고,
`env_profiles.md`는 dev/demo/prod 설정값의 source of truth다.
Budget alert와 public mirror repo 운영 결정은
[`cloud_migration_budget_and_mirror_policy.md`](cloud_migration_budget_and_mirror_policy.md)를
기준으로 한다.

현재 권장 baseline:

```text
target env: dev only
region: asia-northeast3
Firebase: existing GCP project에 Firebase 추가
public backend: dev/demo-only
GCP auth: human MFA + later GitHub WIF
service account key JSON: forbidden
Terraform: Phase 1부터 resource 생성
Ansible: first migration scope에서 사용하지 않음
demo/contest: dev smoke 후 `https://www.law-main-road.cloud` public contest posture 적용 완료
prod: separate prod-opening review 전까지 열지 않음
```

## 0. Free Trial / 30-Day Demo Assumption

현재 계획은 GCP Free Trial 또는 소액 dev/demo 사용을 전제로 한다.

- 테스트할 때만 올렸다가 내리고, 발표 직전 약 20일 정도만 계속 켜둔다.
- 전체 cloud resource 사용 기간은 약 30일로 본다.
- Cloud Run frontend/backend는 `min instances = 0`을 기본값으로 둔다.
- Cloud SQL은 비용의 주된 원인이므로 작은 dev tier로 시작하고, 필요 없는 기간에는
  stop 또는 destroy를 검토한다.
- Vertex AI live smoke는 정해진 소수의 smoke만 실행하고 반복 부하 테스트를 하지
  않는다.
- Public backend는 production-ready가 아니라 `dev/demo-only`로 표시한다.

Free Trial 주의:

- Free Trial은 일반적으로 90일 또는 $300 credit 소진 중 먼저 오는 시점에 끝난다.
- Free Trial billing account에서는 quota increase 요청이 제한된다.
- Free Trial이 끝나기 전에 paid billing account로 전환하지 않으면 resource가
  중지되고 이후 삭제될 수 있다.
- Gemini API in AI Studio 비용은 Google Cloud Free Trial credit 적용 대상이
  아닐 수 있으므로, 이 프로젝트는 Vertex AI 경로만 사용한다.
- Budget alert는 지출 hard cap이 아니라 알림이다.

30일 dev/demo 기준의 운영 결정:

```text
billing_mode: GCP Free Trial or small dev/demo paid usage
budget_name: lmr-dev-demo-monthly
budget_amount: KRW 70,000
budget_thresholds: 25/50/80/100 actual, 100 forecasted
budget_savings_credits: exclude Promotions/free-trial credits when available
budget_hard_cap: no, alert-only
production_claim: no
public_backend_policy: dev/demo-only
cloud_sql_create_now: no, Phase 2에서 필요할 때만
vertex_live_smoke: minimal
ai_studio_gemini_api: do not use
quota_increase_needed: not expected for dev/demo
```

## 1. GCP Project + Billing + MFA

목표는 project, billing, human MFA, 기본 region을 확정하는 것이다. 아직 Cloud SQL,
Cloud Run, bucket, service account를 직접 만들지 않는다.

Console에서 진행:

1. Google 계정 2-Step Verification / MFA를 켠다.
2. Google Cloud Console에서 project를 선택하거나 새로 만든다.
3. Billing에서 해당 project에 billing account를 연결한다.
4. Billing > Budgets & alerts에서 dev budget alert를 만든다.
5. 첫 cloud target region을 `asia-northeast3`로 확정한다.

Local CLI 확인:

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project <PROJECT_ID>
gcloud config get-value project
gcloud billing projects describe <PROJECT_ID>
```

기록할 값:

```text
project_id:
project_number:
billing_account_linked: PASS/FAIL
budget_alert_name: lmr-dev-demo-monthly
budget_alert_amount: KRW 70,000
budget_alert_thresholds: 25/50/80/100 actual, 100 forecasted
budget_alert_savings_credits:
budget_alert_created: PASS
human_mfa_attested: PASS/FAIL
region: asia-northeast3
first_target_env: dev
free_trial_remaining_credit:
free_trial_remaining_days:
```

금지:

- MFA recovery code, authenticator QR, backup code, phone number를 repo, issue,
  screenshot, chat에 남기지 않는다.
- Terraform Phase 1 전에는 Terraform-owned resource를 console에서 미리 만들지
  않는다.
- Budget alert를 spending hard cap으로 오해하지 않는다. Alert를 받으면 사람이
  resource stop/destroy 또는 운영값 조정을 결정한다.

## 2. Firebase Project / Auth Direction

권장 방향은 새 Firebase project를 따로 만드는 것이 아니라, 기존 Google Cloud
project에 Firebase를 추가하는 것이다. Firebase project는 Google Cloud project에
Firebase-specific configuration이 추가된 형태다.

Console에서 진행:

1. Firebase Console에 접속한다.
2. Add Firebase to existing Google Cloud project를 선택한다.
3. 위 GCP project를 선택한다.
4. Firebase Terms를 수락한다.
5. Web app을 추가한다.
6. Authentication > Sign-in method에서 Google provider를 활성화한다.
7. Authentication > Settings > Authorized domains를 확인한다.
8. `localhost`, Phase 4 frontend Cloud Run host, and Phase 7A
   `www.law-main-road.cloud` custom host가 Authorized Domains에 있는지 확인한다.

기록할 값:

```text
firebase_project_id:
firebase_web_app_created: PASS/FAIL
google_sign_in_enabled: PASS/FAIL
authorized_domains:
  - localhost
  - <frontend run.app domain>
  - www.law-main-road.cloud
auth_persistence_policy: inMemoryPersistence
providers_opened: Google only
phone_auth_opened: no
```

금지:

- Phone Auth를 이 migration 준비 작업에서 열지 않는다.
- Firebase Admin private key JSON을 frontend env, repo 문서, screenshot에 넣지
  않는다.
- Frontend Firebase Web config 값은 public config지만 repo에 실제 값을 commit하지
  않는다.

## 3. Secret Inventory Only

지금은 secret 값을 만들거나 문서에 적지 않는다. 필요한 secret name, owner,
Terraform boundary만 정리한다. Terraform은 나중에 Secret Manager secret resource
shell만 만들고, secret version/value는 수동 또는 별도 승인된 CI로 넣는다.

초기 inventory:

```text
lmr-dev-database-url
purpose: current backend DATABASE_URL compatible secret
value_owner: human/admin
terraform_creates_shell: yes
terraform_manages_value: no

lmr-dev-db-password
purpose: future split DB credential if backend config is separated
value_owner: human/admin
terraform_creates_shell: yes
terraform_manages_value: no

Firebase Admin credential JSON
purpose: not opened for current migration; use ADC/service identity
status: do not create unless a separate security exception is approved

lmr-dev-provider-key
purpose: not needed for Vertex AI ADC path
status: do not create unless external provider is added
```

나중에 secret shell이 생긴 뒤 값을 넣는 예시:

```bash
read -rsp "secret value: " SECRET_VALUE; printf '\n'
printf '%s' "$SECRET_VALUE" | gcloud secrets versions add <SECRET_NAME> --data-file=-
unset SECRET_VALUE
```

금지:

- `google_secret_manager_secret_version`을 기본 Terraform path로 사용하지 않는다.
- DB password, credential-bearing `DATABASE_URL`, Firebase Admin JSON, token,
  provider subject, service account key JSON을 repo, Terraform state, tfvars,
  issue, screenshot, chat에 남기지 않는다.

## 4. DB Sizing / Backup Decision

지금은 Cloud SQL을 만들지 않고 sizing/backup 정책만 정한다. 실제 Cloud SQL은
Phase 2에서 Terraform으로 연다.

권장 dev 결정:

```text
db_env: dev
db_region: asia-northeast3
db_engine: PostgreSQL
db_version: PostgreSQL 17 candidate; Phase 2에서 Cloud SQL 지원/pgvector 확인 후 최종 pin
db_edition: Enterprise
db_tier: db-f1-micro first; db-g1-small fallback if smoke is too weak
storage_gb: 10 GB candidate, confirm Cloud SQL minimum/current pricing before apply
backup_retention: 3 days recommended for dev/demo; 1-3 days allowed
pitr: off/optional for dev, required before prod claim
deletion_protection: false for disposable dev, true for prod
ha: off for dev, revisit for prod
storage_auto_increase: decide with cap/cost awareness
```

Terraform authoring boundary:

```text
modules: prod-reusable
envs/dev: apply-ready first
envs/prod: skeleton/README/tfvars.example only
prod_apply: forbidden until separate prod-opening review
```

30일 dev/demo 비용 관점:

- Cloud SQL이 가장 큰 고정 비용원이 될 수 있다.
- Shared-core tier는 dev/test/smoke 용도로만 본다.
- `db-f1-micro` 또는 `db-g1-small` 수준으로 시작하고, production claim 전에는
  dedicated tier와 PITR/deletion protection을 다시 결정한다.
- Cloud SQL stop은 instance compute charge를 줄일 수 있지만 storage/IP charge는
  계속 남을 수 있다.

기록할 값:

```text
cloud_sql_create_timing: Phase 2 only
dev_tier_candidate: db-f1-micro first, db-g1-small fallback
dev_storage_gb: 10 GB candidate
dev_backup_retention_days: 3 recommended
dev_pitr: off/optional
prod_opened: no
```

## 5. Public Backend Policy

현재 권장 결정은 `dev/demo-only`다.

```text
public_backend_policy: dev/demo-only
production_ready_public_api: no
reason: /api/v1/answer, /api/v1/retrieve, Before OCR paths call Vertex/DB-heavy work
```

`dev/demo-only` 조건:

- Cloud Run max instances를 낮게 둔다.
- Cloud Run `min instances = 0`을 기본값으로 둔다.
- Budget alerts를 설정한다.
- Body/request limit과 rate limit은 Phase 3 또는 별도 implementation 후보로
  기록한다.
- CORS는 browser-origin control일 뿐 abuse/cost protection으로 보지 않는다.
- Public demo URL을 production-ready public AI API라고 표현하지 않는다.

Production-ready public API로 올리기 전 필요한 것:

- server-side rate limit
- request/body size limit
- per-IP/per-user quota
- Cloud Run max instances, concurrency, timeout, DB pool cap
- budget/quota alerts
- sensitive log redaction
- 필요 시 Phase 7 Cloud Armor / API Gateway / HTTPS Load Balancer 검토

## 6. GitHub Branch / Environment / WIF Direction

지금은 GitHub 정책을 정하고, WIF resource는 Phase 5 Terraform에서 만든다.

Repo 역할 결정:

```text
development_and_deploy_repo: 2026-moel-datacontest-core/law_main_road_main
development_and_deploy_repo_visibility: private
submission_mirror_repo: Team-msp-architect-2026/msp-team02
submission_mirror_repo_visibility: public
wif_enabled_repo_count: 1
mirror_repo_deploy_permission: no
mirror_repo_service_account_key_json: forbidden
github_team_upgrade_now: no
repo_public_conversion_now: no
```

운영 원칙:

- 1번 repo를 개발 이력, cloud migration 작업, GitHub Actions, WIF, deploy의
  기준 repo로 두고, 현재는 private로 유지한다.
- 2번 repo는 public 공모전/포트폴리오 제출용 curated mirror로 둔다.
- WIF attribute condition은 1번 repo에만 묶는다.
- 2번 repo README에는 최종 제출본과 함께 개발 기록을 볼 수 있는 1번 repo 링크를
  제공할 수 있다.
- 2번 repo에는 GCP deploy 권한, service account key JSON, cloud inventory,
  private runbook을 넣지 않는다.
- 현재는 GitHub Team 업그레이드나 1번 repo public 전환을 하지 않는다.
- README/mirror 세부 정책은
  [`cloud_migration_budget_and_mirror_policy.md`](cloud_migration_budget_and_mirror_policy.md)를
  따른다.

GitHub 설정 방향:

1. 1번 repo Settings > Branches에서 `main` protection rule을 만든다.
2. Require pull request before merging을 켠다.
3. Restrict deletions와 Block force pushes를 켠다.
4. Dismiss stale approvals를 권장한다.
5. Require status checks before merging은 CI workflow/check 이름이 생긴 뒤 켠다.
6. 1번 repo Settings > Environments에서 `dev`, `prod`를 만든다.
7. `prod`는 required reviewer / approval을 둔다.
8. GitHub Secrets에 GCP service account key JSON을 저장하지 않는다.

Private repo plan note:

- Private repo ruleset/protection enforcement가 GitHub Team 이상을 요구할 수 있다.
- 이 경우 ruleset은 `policy defined, enforcement pending`으로 기록하고, 현재는
  private repo + non-enforced manual PR discipline으로 진행한다.
- GitHub Team 업그레이드 또는 1번 repo public 전환은 Phase 5 deploy automation에서
  실제 enforced branch/environment protection이 필요해질 때만 다시 검토한다.
- `dev`/`prod` environment는 먼저 이름만 만들어둘 수 있다. WIF provider와 service
  account output이 생기기 전에는 environment secret/variable을 추가하지 않는다.

WIF 결정:

```text
github_owner: 2026-moel-datacontest-core
github_repo: law_main_road_main
mirror_owner: Team-msp-architect-2026
mirror_repo: msp-team02
branch_protection_main: enabled or policy_defined_enforcement_pending
current_branch_protection_decision: keep private repo, no Team upgrade now, no public conversion now
environments:
  - dev
  - prod
environment_secrets_variables: none until Phase 5 WIF outputs exist
wif_auth: yes
service_account_key_json: forbidden
pr_terraform_apply: forbidden
main_deploy: approval-gated
```

나중에 GitHub Actions workflow에서 필요한 기본 permission:

```yaml
permissions:
  contents: read
  id-token: write
```

금지:

- PR workflow에서 Terraform apply를 실행하지 않는다.
- Fork PR에 GCP credential이나 protected secret을 노출하지 않는다.
- Long-lived service account key JSON을 만들거나 GitHub Secrets에 저장하지 않는다.
- Mirror repo에 WIF/deploy 권한을 부여하지 않는다.

## 7. Private Decision Runbook

아래 template은 실제 project id, project number, domain, secret name 상태를 적을 수
있으므로 public repo에 그대로 commit하지 않는다. repo 밖 private note 또는 private
issue draft에 기록한다.

```markdown
# law-main-road cloud migration private decisions

Date: 2026-05-06

## GCP
project_id:
project_number:
billing_linked:
budget_alert_name:
budget_alert_amount:
budget_alert_thresholds:
budget_alert_created:
free_trial_remaining_credit:
free_trial_remaining_days:
region: asia-northeast3
human_mfa_attested:

## Firebase
firebase_project_id:
google_sign_in_enabled:
authorized_domains:
auth_persistence_policy: inMemoryPersistence

## Secrets
- lmr-dev-database-url: value manual, Terraform shell only
- lmr-dev-db-password: future split credential
- Firebase Admin credential JSON: not opened; use ADC/service identity unless a
  separate security exception is approved
- provider key: not needed for Vertex ADC

## Cloud SQL
env: dev only
engine/version:
tier:
storage_gb:
backup_retention:
pitr:
deletion_protection:

## Public Backend
policy: dev/demo-only
production_ready_public_api: no
required_before_prod:
- rate limit
- request/body limit
- Cloud Run scale cap
- budget/quota alerts
- log redaction

## GitHub
development_and_deploy_repo:
development_and_deploy_repo_visibility:
submission_mirror_repo:
submission_mirror_repo_visibility:
main protection:
environments:
WIF: yes
WIF bound repo:
mirror deploy permission: no
service account key JSON: forbidden

## Mirror
policy_doc: docs/ops/cloud_migration_budget_and_mirror_policy.md
repo2_readme_updated:
repo2_deploy_permissions: none
```

## 8. Handoff Prompt For Future Terraform Work

나중에 Codex 또는 Claude Code에게 Phase 1 구현을 맡길 때는 아래처럼 범위를 고정한다.

```text
docs/architecture/phase 기준으로 Phase 1부터 구현해줘.

내 결정사항:
- target env: dev only
- region: asia-northeast3
- project/billing: prepared
- budget alert: lmr-dev-demo-monthly, KRW 70,000, 25/50/80/100 actual + 100 forecasted
- human GCP MFA: PASS
- GitHub deploy/WIF repo: 2026-moel-datacontest-core/law_main_road_main
- GitHub mirror repo: Team-msp-architect-2026/msp-team02, no deploy permission
- GitHub WIF: service account key JSON forbidden; bind WIF only to deploy repo
- public backend: dev/demo-only until rate/body/scale/budget guardrails
- secrets: Secret Manager shell만 Terraform, values는 수동 입력
- Terraform modules는 prod 재사용 가능하게 작성하되, 첫 구현에서는 envs/dev만
  apply-ready로 만들고 envs/prod는 skeleton/README/tfvars.example 수준으로 둔다.

backend/frontend/API/schema/runtime behavior는 phase 문서에서 허용한 시점 전에는
변경하지 마. Terraform-owned persistent resources는 Terraform으로만 만들고,
script나 console 작업으로 drift를 만들지 마.
```

## References

- Google Cloud Free Trial / Free Tier:
  <https://docs.cloud.google.com/free/docs/free-cloud-features>
- Google Cloud Free Trial terms:
  <https://cloud.google.com/terms/free-trial>
- Google Cloud project management:
  <https://cloud.google.com/resource-manager/docs/creating-managing-projects>
- Cloud Billing project linking:
  <https://cloud.google.com/billing/docs/how-to/modify-project>
- Cloud Billing budgets and alerts:
  <https://cloud.google.com/billing/docs/how-to/budgets>
- Firebase with existing Google Cloud project:
  <https://firebase.google.com/docs/projects/use-firebase-with-existing-cloud-project>
- Firebase Google Sign-In:
  <https://firebase.google.com/docs/auth/web/google-signin>
- Firebase authorized domains:
  <https://support.google.com/firebase/answer/6400741>
- Firebase Auth limits:
  <https://firebase.google.com/docs/auth/limits>
- Secret Manager:
  <https://cloud.google.com/secret-manager/docs/creating-and-accessing-secrets>
- Cloud SQL PostgreSQL instance settings:
  <https://cloud.google.com/sql/docs/postgres/instance-settings>
- Cloud SQL PostgreSQL pricing:
  <https://cloud.google.com/sql/pricing>
- Cloud SQL stop/start:
  <https://cloud.google.com/sql/docs/mysql/start-stop-restart-instance>
- Cloud Run pricing:
  <https://cloud.google.com/run/pricing>
- Cloud Run max instances:
  <https://cloud.google.com/run/docs/configuring/max-instances>
- Google Cloud Workload Identity Federation for deployment pipelines:
  <https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines>
- GitHub branch protection:
  <https://docs.github.com/articles/about-required-reviews-for-pull-requests>
- GitHub environments:
  <https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments>
- GitHub OIDC:
  <https://docs.github.com/en/enterprise-cloud@latest/actions/reference/security/oidc>
