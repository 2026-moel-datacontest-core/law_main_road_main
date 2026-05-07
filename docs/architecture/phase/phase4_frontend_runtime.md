# Phase 4 — Frontend Runtime

기준일: `2026-05-06`

## 1. Goal

Phase 4는 Next.js frontend를 Cloud Run에 배포하고, 실제 브라우저 기준으로
route, Firebase Google Sign-In, backend CORS, SCN-004/SCN-001 demo boundary를
검증한다. 이 단계는 frontend runtime을 공개하되, backend API contract나
SCN-001 live/backend document draft 범위는 열지 않는다.

핵심 목표는 다음과 같다.

- Next.js standalone 또는 승인된 동등 전략의 frontend image를 Artifact
  Registry에 push한다.
- Frontend Cloud Run service를 배포한다.
- `NEXT_PUBLIC_API_BASE_URL`과 Firebase public web config를 build-time 값으로
  고정한다.
- 배포된 frontend Cloud Run `run.app` URL을 Firebase Authorized Domains에
  등록한다.
- Backend `BACKEND_CORS_ORIGIN_REGEX`를 frontend Cloud Run URL에 맞게
  재적용한다. Custom domain / HTTPS Load Balancer는 Phase 7A에서 별도로 연다.
- `/`, `/before`, `/after`, `/after/result`, `/after/intake`, `/after/draft`,
  `/history` route smoke를 수행한다.
- SCN-004 freeze와 SCN-001 frontend-local frozen draft boundary가 유지되는지
  확인한다.

## 2. Phase Status

| Item | Status |
|---|---|
| Phase type | Frontend runtime deployment |
| Primary Terraform root | `infra/terraform/envs/{env}/runtime/frontend` |
| Primary module | `infra/terraform/modules/cloud-run-service` |
| Runtime service | Next.js frontend on Cloud Run |
| Image source | Artifact Registry frontend image |
| Required previous phase | [`phase3_backend_runtime.md`](phase3_backend_runtime.md) |
| Next phase | [`phase5_cicd.md`](phase5_cicd.md) |

## 2A. Dev Runtime Smoke Evidence

Evidence date: `2026-05-07`

Scope and inventory handling:

- Target profile: `dev`.
- Frontend Cloud Run service: `lmr-dev-frontend`.
- Latest ready frontend revision observed: `lmr-dev-frontend-00001-w9n`.
- Frontend direct `run.app` URL and backend direct `run.app` URL remain Terraform
  outputs / operational inventory. Do not copy them into public screenshots or
  public submission text unless the demo owner explicitly approves that public
  URL posture.
- WIF/GitHub workflow, prod resources, custom domain / HTTPS Load Balancer, and
  SCN-001 live/backend document draft generation remain unopened.

Runtime wiring evidence:

- Frontend image was built with Next.js standalone output and pushed to Artifact
  Registry as an immutable digest.
- `NEXT_PUBLIC_API_BASE_URL` was baked from the Phase 3 backend runtime output.
- Firebase public web config was provided through Docker build args only.
- Frontend Cloud Run `allUsers` `roles/run.invoker` exists for controlled dev
  smoke.
- Firebase Authorized Domains includes the deployed frontend Cloud Run host.
- Backend CORS was re-applied to the Phase 4 frontend Cloud Run origin.
- Cloud Run logs sampled across frontend/backend for the smoke window:
  `severity >= ERROR` count `0`; suspicious secret value matches `0`.

Smoke checks:

| Check | Evidence |
|---|---|
| Route smoke | `GET /`, `/before`, `/after`, `/after/result`, `/after/intake`, `/after/draft`, and `/history` all returned `200`. Direct deep links still rely on the existing client guards and memory-state policy. |
| Backend reachability / CORS | Backend `/health` returned `200`; `GET /api/v1/auth/me` without token returned `200`; CORS preflight from the deployed frontend origin to `/api/v1/auth/me` returned `200` and echoed the deployed frontend origin. |
| SCN-004 freeze | Browser smoke confirmed exact `SCN-004-DEMO-FREEZE` path made `0` `/api/v1/answer` calls. The SCN-004 draft flow proceeded to `/after/draft` and made exactly `1` expected `/api/v1/documents/draft` call. |
| SCN-001 boundary | Browser smoke confirmed exact `SCN-001-BRIDGE-DEMO` path made `0` `/api/v1/answer` calls and `0` `/api/v1/documents/draft` calls through `/after -> /after/result -> /after/intake -> /after/draft`. The frozen draft remained frontend-local. |
| Login-free After | `/after` route loaded with logged-out state and remains available without Google login. |
| Firebase Authorized Domain | Automated popup smoke opened the Firebase auth domain and did not surface `auth/unauthorized-domain`. |
| Google Sign-In / protected history | Human browser smoke completed Google Sign-In on the deployed frontend without sharing raw tokens. Cloud Run request logs in the smoke window showed `200` for `/api/v1/auth/me`, `/api/v1/scn001/before-review-jobs`, and `/api/v1/scn001/bridge-runs`. |

Current promotion boundary:

- Phase 4 dev frontend runtime smoke is complete.
- This is still `dev/demo-only`, not a production-ready public API claim.
- WIF/GitHub workflow, prod resources, custom domain / HTTPS Load Balancer, and
  SCN-001 live/backend document draft generation remain unopened.

## 3. Read First

Phase 4 작업자는 아래 순서로 읽는다.

1. repo root `AGENTS.md`
2. repo root `CLAUDE.md`
3. [`../CLAUDE.md`](../CLAUDE.md)
4. [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md)
5. [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md)
6. [`phase3_backend_runtime.md`](phase3_backend_runtime.md)
7. this file
8. `frontend/CLAUDE.md`
9. `frontend/next.config.mjs`
10. `frontend/Dockerfile` if present, or the approved frontend image build strategy note
11. `frontend/src/lib/firebase.ts`
12. `frontend/src/context/AuthContext.tsx`
13. `frontend/src/lib/api.ts`

## 4. Preconditions

Phase 4를 시작하기 전에 확인한다.

| Precondition | Required State |
|---|---|
| Phase 3 backend | deployed and smoke-tested |
| Backend URL | available as Terraform output |
| Backend CORS bootstrap | temporary value approved in Phase 3 |
| Backend auth | `GET /api/v1/auth/me` valid-token smoke passed or fallback documented |
| Artifact Registry | frontend image repository exists from foundation |
| Frontend image build strategy | `frontend/Dockerfile` added and Cloud Run image build smoke passed |
| Next.js standalone | `frontend/next.config.mjs` uses `output: "standalone"` |
| Firebase web app | public config values available |
| Firebase Auth provider | Google provider enabled or explicitly scheduled before login smoke |
| GCP auth | local admin/developer image push path available before Phase 5 WIF |

If the backend URL is missing or `/health` fails, Phase 4 is blocked. Frontend
deployment should not hide a broken backend.

## 5. Scope

### In Scope

- Frontend Cloud Run service.
- Frontend runtime service account attachment.
- Frontend image build/push path.
- Build-time `NEXT_PUBLIC_*` configuration.
- Public frontend URL output.
- Firebase Authorized Domains manual check.
- Google Sign-In browser smoke.
- Backend CORS update after frontend URL is known.
- Implemented route smoke.
- SCN-004 exact preset freeze smoke.
- SCN-001 Bridge demo frontend-local frozen draft smoke.
- Auth gate verification based on backend-verified `backendUser.logged_in`.
- Frontend Cloud Run revision rollback procedure.

### Out Of Scope

- Backend Cloud Run implementation changes.
- Backend API contract changes.
- GitHub Actions WIF and full CI/CD.
- Firebase Admin SDK backend changes.
- Direct Google OAuth + backend-managed session cookie.
- Auth persistence change from `inMemoryPersistence`.
- Raw flow payload storage in Web Storage.
- SCN-001 live/backend document draft generation.
- Protected SCN-001 draft endpoint path/method/schema.
- Step 3 full retention lifecycle.
- Independent `/bridge` or Recovery implementation.
- API Gateway, Cloud Armor, private VPC.
- Custom domain / HTTPS Load Balancer. Use Phase 7A after the `run.app` path is
  stable.

## 6. Terraform Layout

Create or maintain this layout.

```text
infra/terraform/
  modules/
    cloud-run-service/
      main.tf
      variables.tf
      outputs.tf
      README.md
  envs/
    dev/
      runtime/
        frontend/
          main.tf
          variables.tf
          outputs.tf
          versions.tf
          terraform.tfvars.example
    prod/
      runtime/
        frontend/
          main.tf
          variables.tf
          outputs.tf
          versions.tf
          terraform.tfvars.example
```

The `runtime/frontend` root consumes outputs from:

- `foundation`
- `runtime/backend`

Backend and frontend stay in separate runtime roots so frontend rollback does not
force a backend revision change.

## 6A. Terraform Authoring Map

| Item | Phase 4 Contract |
|---|---|
| Terraform-managed resources | Frontend Cloud Run service/revisions, frontend service identity attachment, public ingress, scaling/concurrency, labels, frontend URL outputs |
| Manual prerequisites | Phase 3 backend URL/smoke, frontend image build strategy, Firebase public web config, Firebase Authorized Domain admin path, final CORS approval |
| Inputs/variables | frontend image digest/tag, backend URL for build-time config, Firebase `NEXT_PUBLIC_*` values, frontend service account email, scaling settings |
| Outputs | frontend URL, service name, revision, service account email, Firebase authorized-domain target |
| Secrets handling | Firebase public config is public but local-only in repo; no Firebase Admin JSON, DB URL, tokens, raw flow payloads, or private keys in frontend env/build args |
| Apply order | build frontend image with public env -> apply `envs/{env}/runtime/frontend` -> add Firebase Authorized Domain -> re-apply backend CORS -> browser smoke |
| Validation command candidates | `npm run build`, image build, Terraform fmt/validate/plan/apply, route/browser/CORS/auth/preset smoke |
| Rollback/delete policy | rollback frontend revision first; revert backend CORS only if the CORS re-apply caused failure; sync emergency traffic shifts back into Terraform |
| Do not manage yet | backend API changes, Firebase persistence change, Web Storage policy change, SCN-001 live/backend draft, custom domain/LB, WIF/workflows |

## 6B. GitHub Issue Readiness

| Field | Content |
|---|---|
| Issue title | Phase 4: Frontend Cloud Run runtime and public build env |
| Scope | Deploy frontend Cloud Run service with build-time `NEXT_PUBLIC_API_BASE_URL` and Firebase public config, then validate routes, auth, CORS, and demo freezes |
| Acceptance criteria | deployed routes load/guard safely; Google Sign-In works on authorized domain; CORS is narrowed; SCN-004 and SCN-001 frozen paths remain unchanged |
| Forbidden changes | backend API contracts, auth persistence, Web Storage raw payload storage, SCN-001 live/backend draft, independent `/bridge`, custom domain/LB |
| Validation | build/image/Terraform checks plus route, browser, CORS, Google Sign-In, SCN-004, and SCN-001 smoke |
| Rollback | shift frontend traffic to previous revision; re-apply previous backend CORS only if needed |

## 7. Terraform Owns

Terraform owns the frontend Cloud Run runtime configuration.

| Area | Terraform Responsibility |
|---|---|
| Cloud Run service | frontend service resource |
| Image reference | immutable image digest or explicit image tag variable |
| Runtime identity | attach `frontend-sa` |
| Ingress | public managed Cloud Run HTTPS endpoint for first migration |
| Scaling | min/max instances and concurrency |
| Labels | shared naming/labeling convention |
| Outputs | frontend URL, service name, revision name/digest |

Terraform does not create Firebase Authorized Domains in the first migration
unless a Firebase/IaC provider is deliberately added later. Treat it as an
admin/manual step in Phase 4.

## 8. CI / Script Owns

CI/scripts own frontend build and verification.

| Area | Responsibility |
|---|---|
| `npm run build` | Next.js build verification |
| Image build | build `frontend/Dockerfile` image or approved equivalent |
| Docker build args | pass `NEXT_PUBLIC_*` values at build time |
| Image push | push frontend image to Artifact Registry |
| Route smoke | verify deployed routes |
| Browser smoke | verify auth, CORS, presets, draft boundaries |
| Visual/demo approval support | capture screenshots or notes if needed |

Before Phase 5, these tasks can be run manually with a developer/admin account.
Do not use service account key JSON for temporary image push.

## 9. Admin / Manual Owns

Some actions remain administrator-owned in Phase 4.

| Area | Admin Responsibility |
|---|---|
| Firebase Authorized Domains | add deployed Cloud Run `run.app` URL |
| Firebase Google provider | confirm provider is enabled |
| Custom domain | deferred to Phase 7A; not required for first migration |
| Demo approval | confirm deployed UI matches presentation expectations |
| CORS approval | confirm final frontend origin regex before backend re-apply |
| Rollback | decide whether to shift frontend traffic back after smoke failure |

Admin actions should be recorded in the Phase 4 status note.

## 10. Frontend Image Contract

The current frontend uses:

- Next.js App Router

Current code-read result rechecked on `2026-05-07`:

- `frontend/next.config.mjs` sets `output: "standalone"`.
- `frontend/Dockerfile` is present and was used for the first Phase 4 dev image.

Target Phase 4 image strategy:

- use `frontend/next.config.mjs` `output: "standalone"` plus `frontend/Dockerfile`,
  or document and implement an equivalent Cloud Run-compatible frontend image
  build path in a later reviewed change.

Minimum image requirements:

- installs dependencies with `npm ci`
- runs `npm run build`
- copies `public`
- copies `.next/static`
- copies `.next/standalone` and starts `node server.js` if using the standalone strategy
- starts the approved Cloud Run-compatible Next.js server if using an equivalent strategy
- does not bake private secret values into the image
- does not include local `.env` files

Expected runtime command shape:

```text
node server.js
```

## 11. Build-Time Public Env Contract

`NEXT_PUBLIC_*` values are bundled into the browser build. Setting only Cloud Run
runtime env vars is not enough for the current frontend.

Required build args:

| Build Arg | Source | Secret? | Notes |
|---|---|---:|---|
| `NEXT_PUBLIC_API_BASE_URL` | Phase 3 backend URL | no | consumed by frontend API clients |
| `NEXT_PUBLIC_BEFORE_API_BASE_URL` | Phase 3 backend URL or omitted | no | optional Before client override; current frontend falls back to `NEXT_PUBLIC_API_BASE_URL` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app config | no | public Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase web app config | no | must match Firebase project |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase web app config | no | required |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app config | no | required |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase web app config | no | optional but supported |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase web app config | no | optional but supported |

Do not put Firebase Admin JSON, service account keys, DB URLs, tokens, or raw
case data in any `NEXT_PUBLIC_*` value.

If any required Firebase public config is missing, Google Sign-In will be
disabled by frontend status checks and should be treated as a Phase 4 blocker for
protected SCN-001 smoke.

## 12. Pre-WIF Image Push

Workload Identity Federation is not available until Phase 5. During Phase 4, use
a developer/admin account for image push.

```bash
PROJECT_ID=...
REGION=asia-northeast3
REPOSITORY=lmr-dev-ar
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/frontend:phase4-$(date +%Y%m%d%H%M%S)"
BACKEND_URL=...

gcloud auth login
gcloud auth configure-docker "$REGION-docker.pkg.dev"

# If the Dockerfile strategy is selected; otherwise use the approved equivalent.
docker build -f frontend/Dockerfile -t "$IMAGE" frontend \
  --build-arg NEXT_PUBLIC_API_BASE_URL="$BACKEND_URL" \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
docker push "$IMAGE"
```

Then pass `$IMAGE` or its immutable digest into the Terraform frontend runtime
root.

Do not create, commit, upload, or store a service account key JSON for this step.

## 13. Apply Procedure

Image build/push comes before Terraform apply.

```bash
# 1. Build and push frontend image.
# If the Dockerfile strategy is selected; otherwise use the approved equivalent.
docker build -f frontend/Dockerfile -t "$IMAGE" frontend \
  --build-arg NEXT_PUBLIC_API_BASE_URL="$BACKEND_URL" \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="..." \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="..."
docker push "$IMAGE"

# 2. Apply frontend runtime.
cd infra/terraform/envs/{env}/runtime/frontend
terraform init
terraform fmt -check
terraform validate
terraform plan -var "frontend_image=$IMAGE"
terraform apply -var "frontend_image=$IMAGE"
```

Expected Terraform outputs:

| Output | Used By |
|---|---|
| `frontend_service_name` | rollback and describe checks |
| `frontend_url` | Firebase Authorized Domains and browser smoke |
| `frontend_revision` | rollback status note |
| `frontend_service_account_email` | IAM audit |

## 14. Firebase Authorized Domain

After the frontend Cloud Run URL is created, add it to Firebase Console
Authorized Domains. Phase 4 uses the Cloud Run `run.app` host; a purchased custom
domain is handled later in Phase 7A.

Required manual check:

```text
Firebase Console
  -> Authentication
  -> Settings
  -> Authorized domains
  -> add deployed frontend Cloud Run URL host
```

Google Sign-In fails with `auth/unauthorized-domain` until this is done.

Notes:

- Cloud Run service URL is stable for the service, even as revisions change.
- If a custom domain is later added in Phase 7A, add that custom domain and
  smoke that URL in the Phase 7A checklist.
- Do not add broad or unrelated domains just to make login pass.

## 15. Backend CORS Two-Pass Update

The backend was deployed in Phase 3 before the frontend URL was known. Phase 4
must update backend CORS after the frontend URL exists.

Procedure:

1. Deploy frontend and capture `frontend_url`.
2. Convert `frontend_url` host into an approved `BACKEND_CORS_ORIGIN_REGEX`.
3. Re-apply `infra/terraform/envs/{env}/runtime/backend` with the final CORS value.
4. Re-smoke browser calls from the deployed frontend.

Example shape:

```text
^https://lmr-dev-frontend-...\\.asia-northeast3\\.run\\.app$
```

If Phase 7A later adds a custom domain, replace or narrow this allowlist to the
approved custom frontend origin during that phase.

Do not leave wildcard CORS in prod.

## 16. Route Smoke

Use the deployed frontend URL.

```text
GET /
GET /before
GET /after
GET /after/result
GET /after/intake
GET /after/draft
GET /history
```

Expected route behavior:

| Route | Expected |
|---|---|
| `/` | loads main page; logged-out first viewport prioritizes Google login CTA |
| `/before` | protected Before actions rely on backend-verified login state |
| `/after` | remains accessible when logged out |
| `/after/result` | route guard handles missing in-memory flow state safely |
| `/after/intake` | route guard handles missing eligible answer/draft state safely |
| `/after/draft` | route guard handles missing draft state safely |
| `/history` | backend-verified logged-in users can view history; logged-out state is safe |

Do not treat direct deep-link guard redirects as failures if they match current
frontend behavior.

## 17. API And CORS Smoke

From the deployed frontend, verify browser-origin API calls.

Minimum checks:

- `GET /api/v1/auth/me` without token returns logged-out state.
- Google Sign-In popup succeeds after Firebase Authorized Domain is added.
- `GET /api/v1/auth/me` with Firebase ID token returns `logged_in = true`.
- SCN-001 protected history request sends `Authorization: Bearer <idToken>`.
- Missing/invalid token path remains rejected by backend.
- `/after` public answer call can reach backend when not using exact fixture path.
- CORS allows the deployed frontend origin.
- CORS does not require wildcard for prod.

If CORS fails, update backend `BACKEND_CORS_ORIGIN_REGEX` through the Phase 3
backend root and re-test. Do not patch frontend code to bypass CORS.

## 18. SCN-004 Freeze Smoke

SCN-004 is the main demo freeze path. Phase 4 must verify it still behaves like
the current MVP.

Expected:

- `SCN-004-DEMO-FREEZE` exact preset uses fixed frontend fixture.
- Exact preset does not call public `/api/v1/answer`.
- SCN-004 exact path can proceed through existing draft flow.
- `/api/v1/documents/draft` public contract is unchanged.
- Document eligibility guard remains in place.
- Draft displays rendered text, missing fields, cautions, evidence checklist,
  cited articles, copy, and print behavior as currently implemented.

Do not mix SCN-004 freeze QA with new document type expansion.

## 19. SCN-001 Boundary Smoke

SCN-001 cloud frontend smoke must preserve the current boundary.

Expected:

- `SCN-001-BRIDGE-DEMO` exact preset uses fixed answer fixture.
- SCN-001 exact preset frozen draft remains frontend-local deterministic template.
- SCN-001 exact frozen draft does not call `/api/v1/documents/draft`.
- Modified/live SCN-001 and Bridge-origin paths remain answer-only / draft
  disabled.
- Saved history selector uses displayed safe subset only.
- Raw `after_query_seed`, raw Bridge payload, token, Firebase uid,
  provider_subject, email, and real internal ids are not exposed in
  UI/query/storage.
- Bridge remains continuity/reference only, not legal grounding.
- Continuity panel does not create or mutate `legal_basis`, `cited_articles`,
  `source_context_ids`, `grounded_context_ids`, or `retrieved_chunks`.

SCN-001 live/backend document draft generation remains out of migration scope.

## 20. Auth Persistence And Storage Policy

Phase 4 must keep the current frontend auth/storage policy.

Expected:

- Firebase Auth uses `inMemoryPersistence`.
- `browserSessionPersistence` is not introduced.
- token/auth state is not stored in `localStorage` or `sessionStorage`.
- raw `user_statement` is not stored in Web Storage.
- raw `answer_response` is not stored in Web Storage.
- raw `case_intake` is not stored in Web Storage.
- raw `draft_response` is not stored in Web Storage.
- Bridge handoff state remains React memory state.

If browser refresh clears flow state, that is acceptable for the current MVP
policy. Do not "fix" it by storing raw flow payloads.

## 21. Visual And Demo Approval

Phase 4 should include a manual browser pass because frontend runtime issues are
often visual or auth-popup related.

Recommended browser checks:

- desktop viewport for presentation path
- mobile/narrow viewport smoke for layout breakage
- login popup behavior
- `/before` progress and login gate UX
- `/after` saved history section when logged in
- `/history` folded incident cards
- `/after/draft` copy and print controls
- disclaimer visibility
- no local server/demo copy appears in deployed UI

This is approval evidence, not a request to change frontend code in this phase.

## 22. Acceptance Criteria

Phase 4 is complete when:

- Frontend image builds with `frontend/Dockerfile` or an explicitly approved
  equivalent Cloud Run image build strategy.
- `NEXT_PUBLIC_API_BASE_URL` points to the Phase 3 backend URL.
- Required Firebase public web config is provided at build time.
- `infra/terraform/envs/{env}/runtime/frontend` can run `terraform fmt -check`,
  `terraform validate`, `terraform plan`, and `terraform apply`.
- Frontend Cloud Run service starts.
- Frontend URL output exists.
- Firebase Authorized Domains includes the deployed frontend Cloud Run URL.
- Google Sign-In succeeds on the deployed frontend.
- Backend `BACKEND_CORS_ORIGIN_REGEX` is updated to allow the deployed frontend
  origin.
- Implemented routes load or guard safely.
- SCN-004 exact preset remains fixture-backed and does not call public
  `/api/v1/answer`.
- SCN-001 Bridge demo remains frontend-local fixed fixture/frozen draft path.
- SCN-001 live/backend document draft remains out of migration scope.
- Logged-out `/after` remains accessible.
- Protected `/before` and `/history` gates still use backend-verified
  `backendUser.logged_in`.
- Firebase `inMemoryPersistence` policy remains unchanged.
- No raw flow payload is moved into Web Storage.
- SCN-004 freeze remains unchanged.

## 23. Rollback

Cloud Run frontend rollback:

```text
new frontend revision deployed
  -> route/auth/CORS/preset smoke fails
  -> shift traffic to previous stable frontend revision
  -> keep backend revision stable unless backend CORS re-apply caused failure
```

If Terraform owns traffic, prefer updating the Terraform traffic/image variables
and applying the rollback. If an urgent manual Cloud Run traffic shift is used,
sync the final state back into Terraform before Phase 5.

Backend rollback is not normally required for frontend smoke failure. If the
failure is caused by the Phase 4 CORS re-apply, revert the backend CORS value to
the previous stable value through the backend runtime root.

## 24. Blocks Phase 5 If

Phase 5 CI/CD is blocked if any of these are true.

- Frontend image build still requires manual secret handling.
- Required `NEXT_PUBLIC_*` values are undocumented.
- Google Sign-In fails on the deployed URL.
- Firebase Authorized Domain is missing.
- CORS cannot be restricted to the deployed frontend origin.
- Frontend URL output is missing.
- `/`, `/before`, `/after`, or `/history` fails to load/guard safely.
- SCN-004 exact preset no longer follows the fixture-backed freeze path.
- SCN-001 exact Bridge demo no longer follows the frontend-local frozen draft path.
- Raw flow payloads or auth tokens are introduced into Web Storage.

## 25. Status Note Template

When Phase 4 is executed, record a short status note.

```markdown
## Phase 4 Status — Frontend Runtime

- Environment:
- GCP project:
- Frontend image:
- Frontend Cloud Run service:
- Frontend URL:
- Frontend revision:
- Frontend service account:
- Backend URL baked into image:
- Firebase public config source:
- Firebase Authorized Domain:
- Backend CORS value after re-apply:
- Route smoke:
- Google Sign-In smoke:
- SCN-004 freeze smoke:
- SCN-001 boundary smoke:
- Visual/demo approval:
- Rollback target:
- Admin actions performed:
- Commands run:
- Skipped checks:
- Blockers:
```

## 26. Do Not

- Do not modify backend API contracts in Phase 4.
- Do not change `/api/v1/answer` or `/api/v1/documents/draft`.
- Do not open SCN-001 live/backend draft generation.
- Do not add protected SCN-001 draft endpoint.
- Do not change Firebase Auth persistence away from `inMemoryPersistence`.
- Do not store tokens or raw flow payloads in Web Storage.
- Do not hide CORS failure by weakening backend CORS to wildcard in prod.
- Do not add Firebase Admin credentials to frontend.
- Do not treat Firebase public web config as a private secret.
- Do not implement independent `/bridge` or Recovery.
- Do not implement custom domain / HTTPS Load Balancer in Phase 4; use Phase 7A.
- Do not mix SCN-004 freeze verification with SCN-005 or new document type
  expansion.

## 27. Suggested Agent Prompt

Use this prompt when asking an implementation agent to work on Phase 4.

```text
Read docs/architecture/CLAUDE.md, docs/architecture/cloud_migration_architecture.md,
docs/architecture/cloud_migration_phase_plan.md,
docs/architecture/phase/phase3_backend_runtime.md, and
docs/architecture/phase/phase4_frontend_runtime.md first. Also read
frontend/CLAUDE.md, frontend/next.config.mjs,
frontend/src/lib/firebase.ts, frontend/src/context/AuthContext.tsx, and
frontend/src/lib/api.ts.

Implement Phase 4 only.

Deploy the Next.js frontend to Cloud Run through the runtime/frontend Terraform
root. The current repo may not have frontend/Dockerfile or Next standalone
configured yet; add/verify a Cloud Run-compatible image build strategy first.
If using the Dockerfile strategy, build the image with NEXT_PUBLIC_API_BASE_URL
set to the Phase 3 backend URL and Firebase public web config passed as build
args.
After frontend_url is known, ensure Firebase Authorized Domains includes that
host, then update backend BACKEND_CORS_ORIGIN_REGEX through the backend runtime
root and re-smoke browser calls from the deployed frontend.

Do not change backend API contracts, do not change Firebase auth persistence, do
not store raw flow payloads in Web Storage, and do not open SCN-001 live/backend
document draft generation. Preserve SCN-004 exact fixture path and SCN-001
frontend-local frozen draft boundary.
```
