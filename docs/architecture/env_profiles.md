# Cloud Migration Environment Profiles

기준일: `2026-05-06`

이 문서는 cloud migration phase plan을 실행할 때 사용할 environment/profile별
운영 설정을 정리한다. Phase 문서는 무엇을 어떤 순서로 만들지 정의하고, 이
문서는 같은 구조를 어떤 값과 운영 posture로 실행할지 정의한다.

## Profile Rule

| Profile | Purpose | Resource creation status |
|---|---|---|
| `dev` | 내부 개발, Terraform 검증, smoke test | first apply target |
| `demo/contest` | 공모전 제출, 심사, 발표용 public URL/domain 운영 | dev smoke 통과 후 같은 dev 기반에 운영 posture만 강화 |
| `prod` | 실제 사용자 대상 장기 운영 | not opened; separate prod-opening review required |

Baseline rule:

- Phase 1-6 first implementation creates and validates `dev` only.
- Terraform modules should be reusable for prod, but `envs/prod/*` stays
  skeleton/README/tfvars-example only until prod-opening review.
- `demo/contest` is not a separate first Terraform environment by default. It is
  a time-bounded public presentation posture applied after dev smoke passes.
- `prod` must not be claimed only because a custom domain exists.
- GitHub deploy/WIF is bound only to the development/deploy source repo
  `2026-moel-datacontest-core/law_main_road_main`, which stays private for the
  current preflight. The public/submission mirror repo
  `Team-msp-architect-2026/msp-team02` must not receive deploy permission or
  service account key JSON.
- Keep the `protect-main` ruleset as policy-defined/enforcement-pending on the
  private deploy repo. Do not upgrade GitHub Team or convert the deploy repo to
  public unless Phase 5 explicitly reopens that decision.

## Dev Profile

Use this profile for initial Terraform authoring, local-to-cloud smoke, and
cost-controlled Free Trial / dev-demo validation.

| Area | Dev setting |
|---|---|
| Terraform apply | `envs/dev/*` only |
| GCP project model | existing `law-main-road` project with env-prefixed resources |
| Region | `asia-northeast3` |
| Public posture | `dev/demo-only`, not production-ready |
| Custom domain | no |
| Cloud Run frontend min instances | `0` |
| Cloud Run backend min instances | `0` |
| Cloud Run max instances | conservative cap, start `2-3` |
| Cloud Run billing | request-based unless Phase 3 explicitly changes it |
| Cloud SQL tier | `db-f1-micro` first; `db-g1-small` fallback if smoke is too weak |
| Cloud SQL storage | 10 GB candidate; confirm minimum/current price before apply |
| Cloud SQL availability | `ZONAL` |
| Cloud SQL HA | off |
| Cloud SQL backup retention | 3 days recommended; 1-3 day range allowed |
| Cloud SQL PITR | off/optional |
| Cloud SQL deletion protection | false unless later dependencies make deletion risky |
| Firebase Auth | existing `law-main-road` Firebase project, Google provider |
| Firebase Authorized Domains | `localhost`, `127.0.0.1`, Firebase defaults; Cloud Run frontend `run.app` after Phase 4 |
| Public backend guardrails | mark dev/demo-only until rate/body/scale/budget/log controls pass |
| Budget alert | `lmr-dev-demo-monthly`, KRW 70,000, 25/50/80/100 actual + 100 forecasted |

Dev acceptance:

- Cloud Run frontend/backend deploy and smoke pass.
- Backend can reach Cloud SQL and Vertex.
- SCN-004 exact preset freeze remains unchanged.
- SCN-001 exact frozen draft remains frontend-local.
- Public API is not described as production-ready.

## Demo / Contest Profile

Use this profile when a public URL is submitted for portfolio, contest review, or
presentation. This is stronger than day-to-day dev, but it is still not full prod.

| Area | Demo/contest setting |
|---|---|
| Terraform env | usually `dev` resources with presentation posture |
| Custom domain | optional Phase 7A after dev Cloud Run smoke passes |
| Gabia / DNS | Phase 7A candidate; not a Phase 1-6 prerequisite |
| Cloud Run frontend min instances | `1` during judging/presentation window |
| Cloud Run backend min instances | `1` during judging/presentation window |
| Cloud Run max instances | `2-3` unless load evidence requires more |
| Cloud SQL tier | keep dev DB if smoke is stable; consider `db-g1-small` if `db-f1-micro` is too weak |
| Cloud SQL backup retention | 3 days minimum; 7 days optional during contest window |
| Cloud SQL PITR | optional; enable only if cost/restore need is accepted |
| Cloud SQL HA | off unless contest rules or uptime requirement justify cost |
| Cloud SQL deletion protection | usually false for disposable dev-backed demo; true only if a long-lived demo database is approved |
| Public backend posture | `contest/demo`, not production-ready public API |
| Public AI endpoint controls | max instances, budget alerts, request/body/rate guardrails as available |
| Monitoring | basic uptime/smoke, error-rate/provider-timeout checks |
| Repository posture | private source repo deploys; public mirror repo is README/snapshot only |
| Post-window cleanup | set min instances back to `0`; stop/destroy resources not needed |

Recommended contest-window Cloud Run setting:

```text
frontend_min_instances: 1
backend_min_instances: 1
frontend_max_instances: 2-3
backend_max_instances: 2-3
```

Reasoning:

- `min_instances = 1` keeps one container warm and reduces first-request cold
  start risk during judging/presentation.
- For 1 vCPU / 512 MiB request-based services, one idle min instance is roughly
  low double-digit USD per month per frontend/backend pair before exact regional
  SKU/free-credit effects. Confirm with the pricing calculator before the
  contest window.
- After judging/presentation, revert min instances to `0` to control cost.

Demo/contest must not:

- claim production-ready public AI API without server-side abuse/cost controls,
- open SCN-001 live/backend document draft generation,
- change SCN-004 freeze behavior,
- store raw case facts or full answer/draft payloads in browser storage,
- expose direct backend `run.app` URL or internal cloud inventory in public
  screenshots/issues.

## Prod Profile

Prod is not opened in the first migration. Use this profile only after a separate
prod-opening review approves cost, reliability, security, and operating owner.

| Area | Prod baseline |
|---|---|
| Terraform env | `envs/prod/*`, apply only after prod-opening review |
| GCP project model | one project/env-prefixed first; separate prod project is future hardening |
| Custom domain | yes, after Phase 7A/domain design |
| Cloud Run min instances | `0` or `1` based on latency SLO and cost approval |
| Cloud Run max instances | based on load test and DB capacity |
| Cloud SQL tier | small dedicated production tier, not shared-core by default |
| Cloud SQL availability | `REGIONAL`/HA when uptime requirement justifies cost, otherwise explicit accepted risk |
| Cloud SQL backup retention | 7+ days |
| Cloud SQL PITR | enabled unless explicit cost exception approved |
| Cloud SQL deletion protection | true |
| Public backend posture | production-ready only after guardrails pass |
| Required public API controls | rate limit, request/body limit, per-caller quota or equivalent, Cloud Run scale cap, DB pool cap, budget/quota alerts, sensitive log review |
| Deployment policy | protected environment approval |
| Rollback | Cloud Run revision rollback rehearsed; DB restore runbook documented |

Prod-opening review must answer:

- Who owns incidents and rollback approval?
- What is the expected user/load profile?
- What DB tier, max connections, Cloud Run max instances, and DB pool settings
  are approved together?
- What budget alert and quota limits are active?
- Is HA required now, or is zonal DB an explicitly accepted risk?
- Are request/body/rate limits implemented and verified?
- Are sensitive logs sampled and clean?

## Cloud Run Scaling Notes

Cloud Run is serverless container hosting, not EC2 or EKS.

| Service | Operational model |
|---|---|
| EC2 | VM instances. You manage OS/runtime/processes and usually an Auto Scaling Group. |
| EKS | Kubernetes cluster. You manage cluster/node/pod/service/ingress complexity. |
| Cloud Run | Deploy container images. Google manages servers and request-driven autoscaling. |

Cloud Run can scale to zero, and can scale out when CPU/concurrency/request load
increases. Set `max_instances` to control cost and protect backing services such
as Cloud SQL.

Connection guardrail:

```text
possible_db_connections ~= cloud_run_max_instances * per_instance_db_pool_limit
```

Example:

```text
backend_max_instances = 3
per_instance_db_pool_limit = 5
possible_db_connections ~= 15
```

Small Cloud SQL tiers have low connection headroom, so Phase 3 must align:

- backend `max_instances`,
- Cloud Run concurrency,
- SQLAlchemy pool size / overflow,
- Cloud SQL tier and max connection capacity.

Current backend code reads `DATABASE_URL` only, so `DB_POOL_SIZE`,
`DB_MAX_OVERFLOW`, and `DB_POOL_TIMEOUT_SECONDS` remain Phase 3 implementation or
verification items before any production-ready claim.

## Source Documents

- [`cloud_migration_phase_plan.md`](cloud_migration_phase_plan.md)
- [`phase/README.md`](phase/README.md)
- [`phase/phase0_design_freeze.md`](phase/phase0_design_freeze.md)
- [`phase/phase1_bootstrap_foundation.md`](phase/phase1_bootstrap_foundation.md)
- [`phase/phase2_data_foundation.md`](phase/phase2_data_foundation.md)
- [`../ops/cloud_migration_manual_preflight.md`](../ops/cloud_migration_manual_preflight.md)
