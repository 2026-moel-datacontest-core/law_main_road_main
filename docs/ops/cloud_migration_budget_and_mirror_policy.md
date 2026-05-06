# Cloud Migration Budget And Mirror Policy

기준일: `2026-05-06`

이 문서는 cloud migration preflight의 남은 운영 결정을 고정한다.

- GCP budget alert threshold 결정
- 2번 public mirror repo README / sync 정책

실제 cloud resource, Terraform file, GitHub Actions workflow, secret value는 이
문서에서 만들지 않는다.

## 1. Budget Alert Decision

Google Cloud budget alerts는 비용 알림이다. Budget threshold를 넘으면 설정된
수신자에게 알림을 보내지만, spending hard cap으로 동작하지 않는다. 과금 차단이나
resource 중지는 별도 자동화/수동 조치가 필요하다.

현재 프로젝트 결정:

```text
budget_name: lmr-dev-demo-monthly
scope: law-main-road project only
budget_period: monthly calendar period
budget_amount: KRW 70,000
savings_credits: exclude Promotions/free-trial credits when available, to monitor pre-credit usage
hard_cap: no, alert-only
pubsub_auto_shutdown: no for preflight
notification_channel: billing account default email recipients
owner_action_required_on_alert: yes
created_in_console: PASS on 2026-05-06
observed_spend_at_creation: KRW 350.99 / KRW 70,000
```

Threshold rules:

```text
25% actual spend: early warning
50% actual spend: inspect active resources
80% actual spend: stop/destroy idle dev resources unless demo window is active
100% actual spend: stop non-essential resources and review before continuing
100% forecasted spend: review projected month-end cost
```

Reasoning:

- 이 프로젝트는 Free Trial 또는 소액 dev/demo 사용을 전제로 한다.
- 30일 중 대부분은 resource를 올렸다 내리고, 발표/심사 직전 약 20일만 더 안정적으로
  운영한다.
- Cloud SQL, Cloud Run min instances, Vertex AI live smoke가 비용 변동의 주된
  원인이므로 낮은 budget으로 조기 감지한다.
- `KRW 70,000`은 dev/demo smoke와 contest window를 감시하기 위한 soft budget이다.
  실제 production budget이 아니다.
- Free Trial credit이 비용을 상쇄하면 기본 net spend 기준 alert가 늦을 수 있다.
  Free Trial 이후 실제 비용 감각을 보려면 `Promotions` 또는 가능한 경우 모든
  Savings/credits를 제외해 pre-credit usage를 기준으로 본다.
- Budget alert는 hard cap이 아니므로, alert를 받으면 사람이 Cloud Run min
  instances, Cloud SQL stop/destroy, Vertex live test 중단 여부를 결정한다.

Console setup:

1. Google Cloud Console > Billing > Budgets & alerts로 이동한다.
2. Create budget을 선택한다.
3. Name: `lmr-dev-demo-monthly`
4. Scope/filter: `law-main-road` project만 포함한다.
5. Amount: `KRW 70,000`을 입력한다.
6. Savings/credits: Free Trial 사용량 감시 목적이면 `Promotions`를 제외한다.
   가능한 UI라면 모든 Savings/credits를 제외해 credits 적용 전 사용 비용을 본다.
7. Period: monthly calendar period를 사용한다.
8. Thresholds:
   - 25% actual
   - 50% actual
   - 80% actual
   - 100% actual
   - 100% forecasted
9. Email alerts는 billing admin/default recipients로 시작한다.
10. Pub/Sub notification과 auto-shutdown은 이번 preflight에서는 만들지 않는다.

Alert response:

| Alert | Action |
|---|---|
| 25% actual | 비용 report에서 Cloud SQL, Cloud Run, Vertex 사용량을 확인한다. |
| 50% actual | 불필요한 Cloud SQL/Cloud Run/Vertex live smoke가 켜져 있는지 확인한다. |
| 80% actual | 발표/심사 기간이 아니면 min instances를 `0`으로 되돌리고 idle DB stop/destroy를 검토한다. |
| 100% actual | 필수 resource 외에는 중지하고, 추가 진행 전 비용 원인을 확인한다. |
| 100% forecasted | 월말 예상 비용이 budget을 넘는 원인을 확인하고 contest window 운영값을 조정한다. |

## 2. Public Mirror Repo Policy

Repo role:

```text
source/deploy repo: 2026-moel-datacontest-core/law_main_road_main
source/deploy visibility: private
source/deploy responsibility: development history, cloud migration, WIF, deploy

submission mirror repo: Team-msp-architect-2026/msp-team02
submission mirror visibility: public
submission mirror responsibility: curated README, final snapshot, public portfolio/contest material
```

Mirror rule:

- 1번 repo는 private 개발/배포 기준 repo로 유지한다.
- 2번 repo는 public 제출용 mirror로 유지한다.
- 2번 repo에는 deploy 권한을 주지 않는다.
- 2번 repo에는 WIF, GCP credential, service account key JSON, Terraform state,
  private runbook을 넣지 않는다.
- 2번 repo README는 완성본 설명, 실행/시연 방법, public demo URL 또는 custom
  domain, 그리고 개발 이력 repo 안내만 담는다.
- 1번 repo가 private인 동안 2번 repo README의 1번 repo 링크는 “reviewer access
  required”로 표시한다. 심사자가 commit history 확인을 요구하면 1번 repo 접근권한을
  별도로 부여한다.

Recommended mirror README sections:

```markdown
# Law Main Road

## Overview

## Demo

## Key Features

## Architecture

## How To Run

## Repository Policy

This repository is a curated public submission mirror.
The development/deployment source repository is maintained separately as a
private repository. Reviewer access can be granted when commit history review is
required.

## Security / Privacy Notes

## License / Contest Notice
```

README draft:

- Use [`submission_mirror_readme_draft.md`](submission_mirror_readme_draft.md) as
  the starting text for Repo 2.
- Before copying it into Repo 2, fill only approved public demo URL/custom domain,
  license/contest notice, and sanitized screenshots.

Allowed in public mirror:

- product overview
- user-facing feature description
- sanitized architecture diagram
- sanitized screenshots
- local run command without secret values
- public frontend URL or approved custom domain
- source repo link with private/reviewer-access note
- public docs that do not reveal cloud inventory

Forbidden in public mirror:

- GCP service account key JSON
- Firebase Admin JSON
- `backend/.env`, `frontend/.env.local`, `.env*`
- `config/secrets/*`
- Terraform local state or backend config containing exact bucket names
- Secret Manager secret values or credential-bearing `DATABASE_URL`
- exact Cloud SQL connection name
- exact service account emails
- direct backend `run.app` URL if not intentionally public
- private runbook contents
- raw user/case facts, Firebase uid, provider subject, tokens, or full
  answer/draft payloads
- GitHub Actions variables/secrets that identify WIF provider/service account
  unless explicitly approved for public documentation

Mirror sync discipline:

1. Prepare changes in 1번 private source repo.
2. Run repo-local checks appropriate to the changed scope.
3. Remove local secrets, private runbook, cloud inventory, generated local state,
   and raw evidence before mirroring.
4. Push only curated source/docs/assets to 2번 mirror repo.
5. Keep 2번 mirror CI validation-only if CI is added later.
6. Do not add deploy workflow, WIF binding, or GCP secrets to 2번 mirror repo.

## 3. Remaining Manual Items

```text
gcp_budget_alert_console_created: PASS on 2026-05-06
gcp_budget_alert_amount: KRW 70,000
gcp_budget_alert_observed_spend_at_creation: KRW 350.99 / KRW 70,000
repo2_readme_draft: docs/ops/submission_mirror_readme_draft.md
repo2_readme_updated: pending until mirror README is edited in Repo 2
repo2_deploy_permissions: none
```

References:

- Google Cloud budgets and budget alerts:
  <https://cloud.google.com/billing/docs/how-to/budgets>
- Google Cloud Free Trial / Free Program:
  <https://cloud.google.com/free/docs/free-cloud-features>
- GitHub environments:
  <https://docs.github.com/actions/deployment/using-environments-for-deployment>
- GitHub branch protection:
  <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule>
