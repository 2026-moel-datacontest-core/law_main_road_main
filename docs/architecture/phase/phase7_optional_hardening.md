# Phase 7 — Optional Hardening

기준일: `2026-05-11`

## 1. Goal

Phase 7은 Phase 1-6으로 완성한 1차 cloud migration을 더 기업형 운영
구조로 강화할지 판단하는 선택 단계다. 이 단계는 첫 portfolio migration의
필수 범위가 아니다.

핵심 목표는 다음과 같다.

- optional hardening 후보를 하나씩 독립적으로 평가한다.
- 보안, 네트워크, edge, API productization, batch automation 후보를 1차
  migration과 분리한다.
- 각 후보가 현재 frontend/backend/API/auth 구조와 충돌하는지 먼저 검토한다.
- 후보별 Terraform root, 수동 관리자 작업, smoke/security/load check,
  rollback 절차를 사전에 정의한다.
- 비용 증가가 있는 후보는 승인 없이 열지 않는다.

Phase 7의 기본 결정은 `defer`다. 명확한 이유가 있는 후보만 별도 design
note를 작성한 뒤 진행한다.

## 2. Phase Status

| Item | Status |
|---|---|
| Phase type | Optional hardening, candidate evaluation |
| Primary Terraform root | Candidate-specific; no default root required |
| Required previous phase | [`phase6_observability_reliability.md`](phase6_observability_reliability.md) |
| Core migration dependency | Phase 1-6 applied, smoke-tested, and operationally observed |
| Default decision | Defer until justified; Phase 7A frontend-domain slice is complete for `www.law-main-road.cloud` |

## 3. Read First

Phase 7 작업자는 아래 순서로 읽는다.

1. repo root `AGENTS.md`
2. repo root `CLAUDE.md`
3. [`../CLAUDE.md`](../CLAUDE.md)
4. [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md)
5. [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md)
6. [`phase1_bootstrap_foundation.md`](phase1_bootstrap_foundation.md)
7. [`phase2_data_foundation.md`](phase2_data_foundation.md)
8. [`phase3_backend_runtime.md`](phase3_backend_runtime.md)
9. [`phase4_frontend_runtime.md`](phase4_frontend_runtime.md)
10. [`phase5_cicd.md`](phase5_cicd.md)
11. [`phase6_observability_reliability.md`](phase6_observability_reliability.md)
12. this file

If a candidate changes API shape, auth flow, storage behavior, or deployment
topology, also read the related backend/frontend planning docs before opening
implementation.

## 4. Preconditions

Phase 7 후보는 아래 조건이 충족되기 전에는 열지 않는다.

| Precondition | Required State |
|---|---|
| Phase 1-6 | applied or documented as stable enough for candidate evaluation |
| Runtime smoke | backend/frontend smoke passes on Cloud Run |
| Observability | Phase 6 alert/logging baseline exists |
| Rollback | Cloud Run revision rollback path rehearsed or documented |
| Cost owner | candidate cost impact reviewed by project owner |
| Terraform state | target env remote state stable |
| API contracts | `/api/v1/answer` and `/api/v1/documents/draft` remain unchanged unless a separate product design opens them |
| SCN freeze | SCN-004 freeze and SCN-001 frozen draft boundary remain protected |

Phase 7 is not a shortcut to fix missing Phase 1-6 basics. If a hardening
candidate is needed because a previous phase is incomplete, finish the previous
phase first.

## 5. Scope

### In Scope

- Candidate evaluation notes.
- Candidate-specific Terraform roots or modules.
- Edge routing hardening.
- Network isolation hardening.
- Backend ingress hardening.
- API gateway/productization hardening.
- Batch/job automation for migration, seed, or corpus tasks.
- Rate limit and cost-abuse controls.
- Additional audit/log export controls.
- Disaster recovery drills beyond the Phase 6 minimum.

### Out of Scope

- Making all candidates mandatory.
- Replacing the managed Vertex AI path with a local model server.
- Adding Compute Engine GPU VM, Ollama, Qwen, vLLM, or self-hosted LLM serving.
- Changing public API contracts as part of infrastructure hardening.
- Opening SCN-001 live/backend document draft generation.
- Opening the protected SCN-001 draft endpoint.
- Opening Step 3 full retention lifecycle unless a separate data governance
  design explicitly approves it.
- Rewriting the app into a different product architecture just to add an edge
  service.

## 6. Candidate Summary

| Candidate | Default | Primary Value | Main Risk |
|---|---|---|---|
| Custom domain / Firebase Hosting edge | Phase 7A `www` slice complete; further edge/API work deferred | Stable portfolio URL with a lightweight managed HTTPS edge | DNS, certificate, Hosting config, and frontend API-base rebuild complexity |
| HTTPS Load Balancer + serverless NEG | Defer | Future centralized routing and Cloud Armor attachment | Cost, DNS, certificate, and Terraform complexity |
| Cloud Armor | Defer | WAF/rate limit edge protection | Requires LB path; false positives |
| Backend Cloud Run IAM auth | Defer | Non-public backend ingress | Browser frontend cannot directly call IAM-protected backend without topology change |
| Private IP / VPC egress | Defer | Network isolation for Cloud SQL/private services | VPC complexity, connector cost, routing/debugging overhead |
| API Gateway | Defer | API productization, API-key/quota style policy | OpenAPI/config drift, auth/CORS complexity |
| Cloud Run Jobs / Workflows | Defer | Repeatable migrations, seeds, corpus jobs | Idempotency, cost, failure recovery |
| App/API rate limiting | Defer | Vertex and API abuse cost control | Needs app, gateway, or edge policy design |
| Log export / audit sink | Defer | Longer audit trail and analysis | Data retention/privacy cost |
| DR restore rehearsal | Defer | Stronger recovery proof | Requires extra environment/time/cost |

## 7. Candidate Decision Rules

Open a candidate only when all questions have a concrete answer.

| Question | Required Answer |
|---|---|
| What problem does it solve? | Security, reliability, compliance, cost, or product reason |
| Why is Phase 1-6 insufficient? | Clear gap, not aesthetics |
| What Terraform root owns it? | Isolated root or module ownership |
| Does it require code changes? | Yes/no, exact surface if yes |
| Does it change public API behavior? | Must be no unless separately approved |
| Does it affect SCN-004/SCN-001 demo behavior? | Must preserve current boundaries |
| What is the cost impact? | Estimated fixed and variable cost |
| What is the rollback path? | Concrete revert/traffic/DNS/state plan |
| What is the verification gate? | Smoke, load, security, or manual console check |

If the candidate answer is mostly "probably" or "TBD", keep it deferred.

## 8. Terraform Root Strategy

Do not create one large `hardening` root that owns unrelated resources. Use
candidate-specific roots when implementation begins.

Recommended shape:

```text
infra/terraform/
├── envs/
│   ├── dev/
│   │   ├── edge/
│   │   ├── networking/
│   │   ├── api-gateway/
│   │   └── jobs/
│   └── prod/
│       ├── edge/
│       ├── networking/
│       ├── api-gateway/
│       └── jobs/
└── modules/
    ├── load-balancer-domain/
    ├── cloud-armor-policy/
    ├── vpc-serverless-egress/
    ├── api-gateway/
    ├── cloud-run-job/
    └── workflows/
```

Use only the roots needed by the accepted candidate. For example, if Cloud Armor
is opened, `edge/` can own the HTTPS Load Balancer and Armor policy. If only
Cloud Run Jobs are opened, do not create `edge/` or `networking/`.

## 8A. Terraform Authoring Map

| Item | Phase 7 Contract |
|---|---|
| Terraform-managed resources | candidate-specific only, for example `load-balancer-domain`, Cloud Armor policy, VPC/serverless egress, API Gateway, Cloud Run Jobs/Workflows, audit sinks |
| Manual prerequisites | Phase 1-6 stable evidence or explicit exception, candidate design approval, cost approval, rollback plan, DNS/registrar/admin ownership where relevant |
| Inputs/variables | candidate-specific service names, domains, DNS targets, certificate settings, policies, service accounts, env/region labels |
| Outputs | candidate URLs/records/policy ids/job names plus rollback references; redact internal cloud inventory in public evidence |
| Secrets handling | no secret values, key JSON, raw logs, raw artifacts, DB credentials, Firebase private keys, or unsafe exported logs in Terraform/state/public notes |
| Apply order | approve candidate design note -> apply isolated candidate root -> run candidate smoke/security/load checks -> record rollback path |
| Validation command candidates | candidate-specific Terraform checks, domain/DNS/certificate checks, route/API/auth smoke, security/load checks where applicable |
| Rollback/delete policy | return to Phase 1-6 baseline; preserve Cloud Run revisions and DB; undo DNS/edge/network routing before deleting shared resources |
| Do not manage yet | unrelated hardening candidates, SCN/API/auth behavior changes, Local LLM/GPU/self-hosted inference, Step 3 full retention lifecycle unless separate governance design opens it |

## 8B. GitHub Issue Readiness

| Field | Content |
|---|---|
| Issue title | Phase 7A: Public domain routing with Firebase Hosting |
| Scope | Phase 7A first pass implemented Firebase Hosting custom domain routing for `www.law-main-road.cloud`, Gabia DNS/Firebase Auth domain setup, the approved backend CORS extension for direct backend API calls, smoke, and rollback notes. Same-origin `/api/**`, API-base rebuild, root apex, and `api.*` remain separate gates |
| Acceptance criteria | candidate preserves SCN/API/auth/storage boundaries; cost and DNS ownership are approved; custom domain smoke passes; backend CORS remains allowlist-only; rollback to Cloud Run direct URL is documented |
| Forbidden changes | making Phase 7 mandatory, mixing with Phase 1-6 fixes, API contract changes, auth persistence changes, raw inventory exposure, Local LLM/GPU/self-hosted model serving |
| Validation | candidate Terraform checks, DNS/cert checks, route/API/auth smoke, public evidence redaction review |
| Rollback | revert DNS/Hosting routing or frontend API base/CORS through the owning roots; keep direct Cloud Run URLs available until rollback is separately redesigned |

## 9. Terraform vs CI vs Admin Responsibility

| Area | Terraform Owns | CI/Scripts Own | Admin/Manual Owns |
|---|---|---|---|
| Edge/Hosting | Firebase Hosting config/site or candidate-specific Terraform where support is selected; no LB in 7A | smoke against domain and Cloud Run URLs | DNS ownership, cutover timing, domain purchase |
| Cloud Armor | policy, rules, attachment | security smoke and allowed/blocked request tests | threshold tuning, false-positive approval |
| Backend IAM auth | Cloud Run ingress/auth/IAM bindings if selected | service-to-service token smoke if topology supports it | approval for topology/code change |
| VPC/private IP | VPC/subnet/connector/direct egress settings, private service access if selected | connectivity smoke and DB connection test | network range decisions, cost approval |
| API Gateway | gateway, API config, IAM if selected | OpenAPI validation, gateway smoke | API policy decision, consumer onboarding |
| Jobs/Workflows | job/workflow resources, service accounts, IAM | build/execute job, migration/seed scripts | approving job execution windows |
| Audit/export | sinks, destinations, retention settings | query/export smoke | privacy/retention policy approval |
| DR drill | optional resources for restore environment | restore script/drill run | approval to run restore and pay for resources |

Secret values, DNS registrar changes, production traffic cutover, and emergency
rollback decisions remain administrator actions.

## 10. Candidate A — Custom Domain / Firebase Hosting Edge / Portfolio Launch

### When To Open

Open this candidate when a stable public domain is needed for portfolio review
or public sharing. This is the preferred place to use a domain purchased through
Gabia.

Do not open this candidate before the Phase 4 Cloud Run `run.app` frontend smoke
passes. Prefer opening it after Phase 5/6 when CI/CD, rollback notes, and basic
observability already exist. If portfolio timing requires opening it earlier,
record the missing Phase 5/6 evidence and do not claim full production readiness.

### Baseline Alternative

Phase 1-6 can use Cloud Run managed HTTPS URLs:

```text
https://lmr-dev-frontend-<hash>-<region>.run.app
https://lmr-dev-backend-<hash>-<region>.run.app
```

This is acceptable for first migration. A custom domain is not required for
basic production-oriented proof.

Cloud Run domain mapping is not the preferred path for this project because the
target region is `asia-northeast3` and the portfolio launch benefits from a
managed custom-domain edge. The selected Phase 7A path is Firebase Hosting custom
domain routing with rewrites to the existing Cloud Run services. External HTTPS
Load Balancer, serverless NEG, and Cloud Armor are deferred until a stronger
edge/security requirement justifies their cost and Terraform complexity.

### 2026-05-08 Domain Purchase / Routing Decision Note

Purchased public demo domain:

```text
law-main-road.cloud
```

Current decision:

- Treat `law-main-road.cloud` as a `demo/contest` public presentation domain on
  top of the existing `dev` resources.
- Do not create a separate `demo` Terraform environment only because the domain
  exists.
- Do not claim `prod` readiness only because a custom domain is purchased or
  connected.
- Keep Cloud Run managed HTTPS URLs available as the smoke and rollback path
  until a separate rollback design disables them.
- Do not use simple registrar URL forwarding as the preferred public portfolio
  path. It can be useful as a temporary redirect, but it is not a true custom
  domain hosting path and can make browser auth/routing behavior harder to
  reason about.

Host candidates:

| Host | Candidate use | Current decision |
|---|---|---|
| `www.law-main-road.cloud` | public frontend entry | Phase 7A first custom frontend host, connected |
| `law-main-road.cloud` | root entry or redirect to `www` | human decision gate; not in the first frontend-only pass |
| `app.law-main-road.cloud` | alternative frontend entry | defer unless `www` is rejected |
| `api.law-main-road.cloud` | backend API through edge routing | defer unless backend custom API routing is explicitly approved |

Selected Phase 7A implementation path:

- Use Firebase Hosting custom domain routing as the public edge.
- Keep Gabia DNS authoritative and add only the records Firebase/Google requires.
- Route `www.law-main-road.cloud` to the existing Cloud Run frontend through
  Firebase Hosting.
- Keep direct backend API calls for the first pass. Do not add `/api/**` Hosting
  rewrites or change `NEXT_PUBLIC_API_BASE_URL` unless same-origin API routing is
  separately approved.
- The only backend change approved for Phase 7A was the small
  `BACKEND_CORS_ORIGIN_REGEX` extension for `https://www.law-main-road.cloud`,
  while keeping the Phase 4 frontend Cloud Run origin as rollback/debug. Wildcard
  CORS remains forbidden.
- Defer `api.law-main-road.cloud`, external HTTPS Load Balancer, serverless NEG,
  Cloud Armor, Cloud DNS delegation, separate `demo` environment, and `prod`
  opening.

Implementation evidence is recorded in
[`hardening/phase7a_public_domain_routing.md`](hardening/phase7a_public_domain_routing.md):

- Firebase Hosting custom domain status for `www.law-main-road.cloud`:
  connected.
- Firebase Auth Authorized Domains includes `www.law-main-road.cloud`.
- Frontend routes `/`, `/before`, `/after`, and `/history` load over the custom
  domain.
- Google Sign-In popup opens without `auth/unauthorized-domain`.
- Backend CORS preflight and browser fetch from the custom origin pass for
  `/api/v1/auth/me`.
- `/api/**` Hosting rewrite, frontend API-base rebuild, `api.*`, root apex,
  HTTPS Load Balancer, Cloud Armor, and `prod` remain deferred.

### Possible Target

```text
User
-> Gabia DNS
-> Firebase Hosting custom domain / managed certificate
-> Hosting rewrite `/**`
-> Cloud Run frontend
```

Deferred unless explicitly approved:

```text
Frontend browser/API calls
-> same-origin `https://www.law-main-road.cloud/api/**`
-> Hosting rewrite `/api/**`
-> Cloud Run backend
```

Recommended portfolio host split:

| Host | Target | Default |
|---|---|---|
| `www.law-main-road.cloud` | frontend Cloud Run service through Firebase Hosting | yes |
| `law-main-road.cloud` | redirect to `www` or same Hosting target | human decision gate; not in the first frontend-only pass |
| `app.law-main-road.cloud` | alternative frontend host | defer unless `www` is rejected |
| `api.law-main-road.cloud` | backend API through a separate custom API host | defer unless explicitly approved |

If the backend is routed through Firebase Hosting, choose before frontend image
build whether `NEXT_PUBLIC_API_BASE_URL` becomes:

```text
https://www.law-main-road.cloud
```

or whether the first custom-domain pass keeps the backend Cloud Run URL:

```text
https://lmr-dev-backend-<hash>-<region>.run.app
```

Do not change `NEXT_PUBLIC_API_BASE_URL` routing casually. It is bundled into the
frontend image and directly affects CORS, Firebase browser smoke, and rollback.
Firebase Hosting applies the first matching rewrite rule, so `/api/**` must be
listed before the frontend catch-all `/**`. Hosting rewrites to Cloud Run are
also subject to the Hosting 60-second request timeout, so long-running API paths
need a direct backend fallback or a separate API-domain/edge decision before
they move behind the same-origin Hosting rewrite.

### Config / Terraform Scope

Likely resources or configuration:

- Firebase Hosting site/config for the selected Firebase project.
- Hosting rewrites:
  - `/api/**` to the existing Cloud Run backend only if same-origin API routing
    is explicitly approved for this pass,
  - `/**` to the existing Cloud Run frontend.
  If `/api/**` is approved, that rule must precede the frontend catch-all rule.
- Firebase Hosting custom domain for `www.law-main-road.cloud`. Root apex
  redirect or same target remains a separate human decision gate.
- Managed certificate provisioned through Firebase Hosting.
- DNS records remain manual in Gabia unless Cloud DNS is separately opened.
- No external HTTPS Load Balancer, serverless NEG, Cloud Armor, or `api.<domain>`
  in the first Phase 7A implementation.

### Admin Scope

- Own or purchase domain, for example through Gabia.
- Keep DNS in Gabia for the first Phase 7A implementation unless Cloud DNS is
  separately approved.
- Add required `A`/`AAAA`/`CNAME`/CAA records in the chosen DNS provider.
- Approve cutover window.
- Add final frontend custom domain to Firebase Authorized Domains.
- If the backend uses same-origin `/api/**`, approve frontend image rebuild using
  `NEXT_PUBLIC_API_BASE_URL=https://www.law-main-road.cloud` or an equivalent
  approved same-origin base.
- If the backend uses same-origin `/api/**`, approve the rewrite order and confirm
  that routed API calls complete within Firebase Hosting 60-second timeout
  limits. Keep long-running endpoints on direct backend fallback or defer them to
  a separate API-domain/edge design.
- Approve backend CORS update for the custom frontend origin if any browser
  cross-origin path remains or for rollback compatibility.

### Verification

- Custom frontend domain returns the deployed frontend over HTTPS.
- `/`, `/before`, `/after`, and `/history` load or guard safely from the custom
  frontend domain.
- If same-origin `/api/**` routing is used, an auth-negative request to
  `https://www.law-main-road.cloud/api/v1/auth/me` returns the expected
  unauthenticated response without exposing raw token/user data.
- Same-origin API smoke includes representative non-long-running endpoints; any
  long-running endpoint is verified separately or kept on the direct backend
  fallback.
- If the frontend keeps the direct backend API base, CORS preflight and browser
  fetch from `https://www.law-main-road.cloud` to a representative auth endpoint
  must pass with an allowlist-only backend CORS value.
- `NEXT_PUBLIC_API_BASE_URL` points to the intended backend path and matches the
  latest frontend image build.
- If backend CORS changes are approved, backend `BACKEND_CORS_ORIGIN_REGEX`
  allows only the approved frontend custom domain, plus any explicitly
  documented rollback origin.
- Google Sign-In does not fail with `auth/unauthorized-domain`.
- SCN-004 exact preset remains frozen.
- SCN-001 exact fixed preset remains frontend-local frozen draft path.
- SCN-001 protected auth-negative smoke still rejects missing/invalid Firebase
  Bearer tokens.
- DNS record values, certificate provisioning status, and Firebase Authorized
  Domain status are recorded in the Phase 7A status note.
- Public portfolio screenshots/docs use only the custom domain and redacted
  placeholders for project id, service account emails, bucket names, Cloud SQL
  connection names, WIF provider names, and direct backend `run.app` URLs.
- Cloud Run direct URLs are still usable for emergency rollback or explicitly
  disabled only after rollback is planned.

### Rollback

- Repoint DNS to previous target, lower TTL before planned cutover, or use Cloud
  Run direct URL.
- Roll back Firebase Hosting release/config if rewrites or custom domain behavior
  is faulty.
- Keep Cloud Run revisions unchanged during edge rollback.
- Revert `NEXT_PUBLIC_API_BASE_URL` and backend CORS only through the relevant
  Phase 4/3 roots if the backend public host changes.
- Record any Terraform state changes if emergency console edits are used.

### Risks

- Extra monthly cost.
- More Terraform resources and slower applies.
- DNS propagation delay.
- Managed certificate provisioning delay.
- Gabia DNS/manual record drift if DNS is not managed by Terraform.
- Firebase Authorized Domains must be updated after final domain is known.
- API base URL is build-time config, so backend host changes require a frontend
  rebuild/redeploy.
- Public launch evidence can accidentally expose cloud inventory through browser
  devtools, screenshots, Terraform outputs, or GitHub Actions summaries.

## 11. Candidate B — Cloud Armor

### When To Open

Open Cloud Armor when public abuse, coarse rate limiting, WAF-style protection,
or IP allow/deny rules are worth the edge complexity.

Cloud Armor normally belongs with the HTTPS Load Balancer path. Do not add it as
a first migration requirement.

### Possible Policies

- deny obvious bad paths
- rate-limit excessive requests
- allowlist admin-only tools if any are later exposed
- block countries or IP ranges only if there is a documented reason
- preview mode before enforce mode for risky rules

### Terraform Scope

- security policy
- rules
- backend service attachment
- optional log/metric integration

### Admin Scope

- Approve blocked patterns and thresholds.
- Review false-positive reports.
- Decide whether preview mode is enough for portfolio demo.

### Verification

- Normal frontend routes still load.
- Public backend endpoints used by the frontend still work.
- Firebase-auth protected SCN-001 endpoints still work.
- A known blocked request is rejected.
- A legitimate SCN-004 demo request is not blocked.
- Alert/log signal exists for blocked or rate-limited requests if required.

### Rollback

- Switch policy to preview mode.
- Detach policy from backend service.
- Remove only the Cloud Armor root/module without changing Cloud Run runtime.

### Risks

- False positives can break demo flow.
- Rate limits can block legitimate OCR/LLM smoke tests.
- Requires LB ownership if not already present.

## 12. Candidate C — Backend Cloud Run IAM Auth

### When To Open

Open this candidate only when the backend should no longer be directly public.
This is a real architecture change, not a simple Terraform toggle.

### Current Baseline

Phase 1-6 baseline:

```text
Browser
-> Cloud Run frontend
-> Browser calls backend via NEXT_PUBLIC_API_BASE_URL
-> Cloud Run backend public HTTPS
-> strict CORS allowlist
-> protected SCN-001 routes require Firebase Bearer token
```

This works because the browser can call the public backend directly.

### Important Constraint

Cloud Run IAM auth expects a Google-signed identity token for the Cloud Run
service audience. A browser frontend cannot safely mint and attach the frontend
Cloud Run service account's identity token to direct client-side API calls.

Therefore, making backend Cloud Run `requires authentication` usually requires
one of these topology changes:

| Option | Shape | Code Impact |
|---|---|---|
| BFF / server-side proxy | Browser -> frontend server -> backend | Frontend server routes/proxy required |
| API Gateway / LB auth layer | Browser -> gateway/edge -> backend | Gateway/edge config and possibly API/auth changes |
| Keep backend public | Browser -> backend | No topology change; rely on CORS + app auth |

Do not implement backend IAM auth until this decision is explicit.

### Terraform Scope

If opened:

- Cloud Run backend ingress/auth setting
- IAM binding allowing the calling service identity
- possible frontend service account permission to invoke backend
- possible API Gateway or LB resources depending on topology

### Admin Scope

- Approve browser/API topology change.
- Approve whether backend direct URL should be blocked.
- Approve any new auth user experience constraints.

### Verification

- Browser route can still call backend successfully.
- Unauthorized direct backend call is denied where intended.
- Firebase protected endpoints still verify Firebase Bearer tokens at the app
  layer.
- Public `/api/v1/answer` behavior remains unchanged if still intended public.
- SCN-004 exact preset remains frontend-local fixed answer path and does not
  accidentally depend on backend auth.

### Rollback

- Restore backend public ingress/auth setting.
- Rebuild frontend with previous `NEXT_PUBLIC_API_BASE_URL` if changed.
- Reapply previous CORS allowlist.
- Keep previous Cloud Run revision available.

### Risks

- Most likely candidate to break the current frontend call path.
- May require code changes outside Terraform.
- Can create confusing double-auth if Cloud Run IAM and Firebase Bearer auth are
  mixed without a clear boundary.

## 13. Candidate D — Private IP / VPC Egress

### When To Open

Open this candidate when Cloud SQL private connectivity, restricted egress, or
enterprise network isolation is worth the added complexity.

### Current Baseline

Phase 1-6 uses Cloud Run backend with Cloud SQL connectivity and least-privilege
runtime service account. This is acceptable for first migration if the DB is not
publicly exposed to arbitrary clients and credentials/secrets are controlled.

### Possible Target

```text
Cloud Run backend
-> Serverless VPC Access or Direct VPC egress
-> VPC subnet
-> Cloud SQL private IP
```

Exact implementation should be selected based on the current Google Cloud
region, service support, and cost at implementation time.

### Terraform Scope

- VPC
- subnet
- private service access if required
- Serverless VPC Access connector or Direct VPC egress config
- Cloud SQL private IP setting
- Cloud Run egress settings
- firewall rules only where relevant

### Admin Scope

- Approve CIDR ranges.
- Approve connector/direct egress cost.
- Approve whether public IP remains temporarily for migration.
- Confirm no overlap with existing networks if a shared project is used.

### Verification

- Backend connects to Cloud SQL through intended private path.
- Backend health endpoint passes.
- `/api/v1/retrieve` smoke passes.
- Cloud SQL connection count remains within guardrail.
- Vertex AI and other Google API calls still work after egress changes.
- Artifact bucket access still works.

### Rollback

- Re-enable previous Cloud SQL connection path.
- Remove Cloud Run egress config.
- Preserve DB instance and data.
- Avoid deleting VPC resources until runtime has returned to the previous path.

### Risks

- Hard to debug if DNS/routing/egress is misconfigured.
- Can break Vertex AI, Secret Manager, or Storage access if egress is too
  restrictive.
- Adds resources that can continue costing money when idle.

## 14. Candidate E — API Gateway

### When To Open

Open API Gateway only when the backend becomes an API product with external
consumers, API-key style quotas, versioned OpenAPI documentation, or policy
needs that cannot be handled by the current frontend/backend split.

### Current Baseline

The current app is primarily a frontend-led product:

```text
User -> Cloud Run frontend -> Cloud Run backend API
```

API Gateway is not required for this baseline.

### Terraform Scope

- API Gateway API
- API config
- gateway
- service account and invoker permissions
- optional custom domain/edge integration

### CI/Scripts Scope

- generate or validate OpenAPI spec
- deploy new API config version
- smoke through gateway URL
- test CORS preflight if browser calls gateway directly

### Admin Scope

- Decide whether API consumers exist.
- Decide quota and key policy.
- Decide whether Firebase auth remains app-level only or gateway-level policy is
  introduced.

### Verification

- Gateway route reaches backend.
- CORS preflight works from frontend origin.
- Protected SCN-001 routes still require Firebase Bearer auth.
- Public API behavior remains stable.
- Gateway errors are observable.

### Rollback

- Point frontend back to direct backend Cloud Run URL.
- Keep backend Cloud Run revision unchanged.
- Remove or disable gateway routing after traffic is off.

### Risks

- OpenAPI config can drift from FastAPI implementation.
- More complex CORS behavior.
- Potential double-auth confusion.
- Not useful unless API productization is a real goal.

## 15. Candidate F — Cloud Run Jobs / Workflows

### When To Open

Open this candidate when migration, seeding, law corpus import, embedding refresh,
or recurring maintenance tasks should move from local admin commands into
repeatable cloud-run automation.

Good candidates:

- DB migration job
- `pgvector` extension and vector index verification job
- `law_chunks` seed/import job
- corpus quality check job
- artifact cleanup verification job
- scheduled health smoke

### Boundary

Terraform can create the job/workflow infrastructure, service accounts, IAM, and
environment wiring. Terraform should not own DB schema contents or use ad hoc
`local-exec` as the main migration mechanism.

The rule from Phase 2 remains:

```text
Cloud SQL instance, database, and infrastructure -> Terraform
pgvector extension, schema migration, vector index, law_chunks seed -> scripts/jobs
```

### Terraform Scope

- Cloud Run Job resource
- optional Workflows resource
- job service account
- IAM for Cloud SQL, Secret Manager, Storage, Vertex AI if needed
- environment variables and secret references
- optional Scheduler trigger if separately approved

### CI/Scripts Scope

- build job image if separate from backend image
- execute job after deploy
- capture job logs/status
- fail pipeline on migration or seed failure
- keep job idempotent

### Admin Scope

- Approve when data jobs run in prod.
- Approve destructive migration restrictions.
- Approve corpus version and selected_as_of value.

### Verification

- Job starts and exits successfully.
- Migration is idempotent.
- `CREATE EXTENSION vector` path succeeds or reports already exists.
- `law_chunks` count matches expected imported corpus.
- Embedding dimension remains `768`.
- Job logs do not expose raw secrets or raw user artifacts.

### Rollback

- Re-run previous migration rollback only if explicitly supported.
- Prefer backward-compatible migrations.
- Restore DB backup when a destructive data issue occurs.
- Disable Scheduler trigger before investigating repeated failures.

### Risks

- Data tasks can be more dangerous than runtime deploys.
- Non-idempotent seeds can duplicate data.
- Embedding refresh can generate Vertex AI cost spikes.

## 16. Candidate G — Rate Limiting / Cost Abuse Control

### When To Open

Open this candidate when Vertex AI, OCR, or public API usage must be bounded
beyond basic Cloud Run scaling limits.

### Possible Locations

| Location | Use Case | Tradeoff |
|---|---|---|
| App-level middleware | user-aware quota, Firebase-auth-aware limits | requires code changes |
| Cloud Armor | coarse IP/rate controls | requires LB path |
| API Gateway | API-key/quota style controls | gateway complexity |
| Cloud Run max instances | hard runtime cost cap | can reduce availability |

### Terraform Scope

Depends on selected location. Cloud Run max instances can be runtime Terraform.
Cloud Armor and API Gateway need their own candidate roots.

### Admin Scope

- Define demo quota.
- Define abuse threshold.
- Approve user-facing error behavior if app-level limit is added later.

### Verification

- Normal demo flow passes.
- Excessive repeated calls are constrained.
- Provider timeout/error metrics remain observable.
- Cost budget/alert is aligned with the chosen limit.

### Rollback

- Loosen threshold.
- Disable policy.
- Restore previous Cloud Run max instance setting.

### Risks

- Too aggressive thresholds can break demo smoke.
- Infra-only limits cannot distinguish legitimate user states.

## 17. Candidate H — Audit Export / BigQuery Sink

### When To Open

Open this candidate when long-term audit analysis, security review, or incident
forensics require logs beyond normal Cloud Logging retention.

### Scope

Possible targets:

- BigQuery log sink
- Cloud Storage archive sink
- log retention policy
- access review for exported logs

### Data Boundary

Do not export raw contract text, OCR text, Firebase uid, provider subject,
email, raw Bridge payload, raw answer payload, or raw draft payload. If logs are
not already safe, fix logging policy before exporting.

### Verification

- Sink receives expected operational logs.
- Sensitive sample review passes.
- Access is limited to approved identities.
- Retention policy is documented.

### Rollback

- Disable sink.
- Delete test dataset/bucket if approved.
- Keep audit trail deletion aligned with privacy policy.

### Risks

- Exporting unsafe logs multiplies privacy exposure.
- BigQuery storage/query cost can grow silently.

## 18. Candidate I — DR Restore Rehearsal

### When To Open

Open this candidate when the project needs stronger recovery proof than Phase 6
backup/PITR checks.

### Possible Drill

```text
Cloud SQL backup/PITR source
-> temporary restore instance
-> migration compatibility check
-> law_chunks count/vector dimension check
-> backend read-only smoke
-> destroy temporary restore resources
```

### Terraform Scope

Often none, or a temporary environment/root if the drill is repeated. Avoid
permanent idle restore resources unless there is an operational reason.

### Admin Scope

- Approve restore window.
- Approve temporary cost.
- Confirm no production data is exposed to an unsafe environment.

### Verification

- Restore completes.
- App user can connect read-only or with limited scope.
- Core tables exist.
- `law_chunks` count and vector dimension are consistent.
- Temporary resources are destroyed after evidence capture.

### Rollback

- Destroy temporary restore instance.
- Revoke temporary access.
- Record findings without changing prod.

### Risks

- Accidental data exposure.
- Cost from forgotten temporary resources.
- Confusion between restored DB and prod DB.

## 19. Suggested Candidate Priority

If optional hardening is opened, use this order unless there is a stronger
project-specific reason.

| Priority | Candidate | Reason |
|---:|---|---|
| 1 | Custom domain or edge routing | Most visible portfolio polish if a public demo URL matters |
| 2 | Rate limiting / cost-abuse control | Protects Vertex/OCR/API cost exposure |
| 3 | Cloud Armor | Useful only after edge/LB path is chosen |
| 4 | Cloud Run Jobs / Workflows | Makes DB/corpus operations more repeatable |
| 5 | Private IP / VPC egress | Stronger network isolation, higher complexity |
| 6 | Backend IAM auth | Valuable, but likely requires frontend/API topology change |
| 7 | API Gateway | Useful only if backend becomes an API product |
| 8 | Audit export / DR rehearsal | Good operational evidence, but not first optional item |

For this project, backend IAM auth should not be first unless the frontend call
path is redesigned. A browser-based `NEXT_PUBLIC_API_BASE_URL` flow and an
IAM-protected backend do not naturally fit together.

## 20. Candidate Design Note Template

Create a separate design note before implementing any candidate.

Recommended location:

```text
docs/architecture/phase/hardening/
```

Recommended filename:

```text
phase7_<candidate_name>_design.md
```

Template:

```markdown
# Phase 7 Candidate — <Name>

## Decision

- Status: Proposed / Approved / Deferred / Rejected
- Environment:
- Owner:
- Date:

## Problem

What concrete gap does this solve?

## Why Phase 1-6 Are Insufficient

Why is the current migration baseline not enough?

## Target Architecture

Text diagram and service list.

## Current Architecture Impact

- Frontend:
- Backend:
- API contracts:
- Auth:
- Database:
- Storage:
- Observability:

## Terraform Scope

- Root:
- Modules:
- Resources:
- IAM:
- Outputs:

## CI/Scripts Scope

- Checks:
- Smoke:
- Failure behavior:

## Admin/Manual Scope

- DNS:
- Console steps:
- Approvals:
- Secret values:
- Cutover:

## Cost Impact

Fixed cost, variable cost, cleanup requirements.

## Security Impact

New trust boundary, exposed surface, IAM changes, logging concerns.

## Migration Plan

Step-by-step rollout.

## Verification

Commands and manual checks.

## Rollback

How to return to the Phase 1-6 baseline.

## Decision

Go / No-go / Defer and reason.
```

## 21. Acceptance Criteria

Phase 7 documentation is acceptable when:

- Phase 7 remains optional.
- Each candidate has clear open conditions.
- Terraform ownership is candidate-specific.
- Admin/manual actions are separated from Terraform.
- Candidate risks are visible before implementation.
- Phase 7A custom domain launch does not become a hidden Phase 4 requirement.
- Phase 7A documents DNS ownership, certificate status, Firebase Authorized
  Domains, CORS, frontend API base URL, and rollback before or at traffic
  cutover.
- Backend IAM auth caveat is explicitly documented.
- Private IP/VPC candidate does not become a hidden Phase 2/3 requirement.
- Cloud Armor/API Gateway are not presented as mandatory first migration items.
- Cloud Run Jobs/Workflows preserve the Phase 2 Terraform-vs-migration-script
  boundary.
- SCN-004 freeze, SCN-001 protected Bridge answer/history, SCN-001 frozen draft
  path, and public API contracts remain protected.

## 22. Blocks Candidate Approval If

Do not approve a Phase 7 candidate if any of these are true.

- It is only for architecture aesthetics.
- It has no rollback plan.
- It requires code changes but is described as Terraform-only.
- It changes public API contracts without a separate product/backend design.
- It breaks the current frontend browser call path.
- It creates a new cost center without approval.
- It stores secrets in Terraform state.
- It exports unsafe logs.
- It exposes project id/number, service account emails, private bucket names,
  Cloud SQL connection names, Secret Manager names, WIF provider names, direct
  backend `run.app` URLs, or credential material in public portfolio evidence.
- It weakens Firebase/Auth or raw data storage boundaries.
- It reintroduces Local LLM or self-hosted model serving.
- It mixes SCN-004 freeze changes with infrastructure hardening.

## 23. Status Note Template

When a Phase 7 candidate is evaluated or implemented, record a short status note.

```markdown
## Phase 7 Status — <Candidate>

- Candidate:
- Decision:
- Environment:
- GCP project:
- Terraform root:
- Modules/resources:
- Runtime services affected:
- Custom domain / DNS provider:
- Certificate status:
- Firebase Authorized Domain:
- Frontend API base URL:
- Backend CORS value:
- Public evidence redaction:
- API contract impact:
- Auth impact:
- Data/storage impact:
- Cost impact:
- Security review:
- Admin actions performed:
- Commands run:
- Smoke/security/load checks:
- Rollback path:
- Skipped checks:
- Blockers:
```

## 24. Do Not

- Do not implement Phase 7 as part of the first migration unless explicitly
  approved.
- Do not create a monolithic hardening root for unrelated candidates.
- Do not make backend Cloud Run IAM auth a simple toggle without addressing the
  browser frontend call path.
- Do not put API Gateway, Cloud Armor, or private IP/VPC into Phase 1-6
  acceptance criteria.
- Do not use Terraform `local-exec` as the main DB migration or corpus seed
  mechanism.
- Do not store DB passwords, Firebase private keys, provider keys, or service
  account JSON in Terraform state.
- Do not change `/api/v1/answer` or `/api/v1/documents/draft` public contracts.
- Do not open SCN-001 live/backend document draft generation.
- Do not open the protected SCN-001 draft endpoint.
- Do not weaken the frontend `inMemoryPersistence` auth boundary as part of
  infra hardening.
- Do not store raw case facts, raw OCR text, raw Bridge payload, answer payload,
  or draft payload in browser storage.
- Do not reintroduce Compute Engine GPU VM, Ollama, Qwen, vLLM, or a local LLM
  serving path.

## 25. Suggested Agent Prompt

Use this prompt when asking an implementation agent to evaluate one Phase 7
candidate.

```text
Read docs/architecture/CLAUDE.md,
docs/architecture/cloud_migration_architecture.md,
docs/architecture/cloud_migration_phase_plan.md,
docs/architecture/phase/phase6_observability_reliability.md, and
docs/architecture/phase/phase7_optional_hardening.md first.

Evaluate only this Phase 7 candidate: <candidate name>.

Do not implement it yet. Create a candidate design note under
docs/architecture/phase/hardening/ using the Phase 7 template. Explain the
problem, why Phase 1-6 are insufficient, Terraform root/module scope,
CI/scripts scope, admin/manual scope, cost impact, security impact, verification,
and rollback. Explicitly state whether code changes are required.

Do not change backend/frontend code, public API contracts, SCN-004 freeze,
SCN-001 protected Bridge answer/history behavior, SCN-001 frozen draft path, or
the managed Vertex AI path. Do not reintroduce Local LLM/self-hosted model
serving.
```
