# Phase 7A — Public Domain Routing

기준일: `2026-05-11`

## Status

Phase 7A는 `demo/contest` public presentation domain을 여는 optional hardening
후보다. 2026-05-11 기준 첫 `www` frontend-domain pass는 완료됐고, 이 문서는
opening gate와 완료 evidence를 함께 기록한다.

## Decision

Selected path:

```text
law-main-road.cloud
-> Gabia DNS
-> Firebase Hosting custom domain / managed certificate
-> Hosting frontend rewrite
-> existing dev Cloud Run frontend
```

Target profile:

```text
demo/contest on existing dev resources
```

Not selected for the first Phase 7A pass:

- separate `demo` Terraform environment,
- `prod` opening,
- Cloud DNS delegation,
- external HTTPS Load Balancer,
- serverless NEG,
- Cloud Armor,
- `api.law-main-road.cloud`.

## Domain And Host Plan

Purchased domain:

```text
law-main-road.cloud
```

Host plan:

| Host | Decision | Notes |
|---|---|---|
| `www.law-main-road.cloud` | first public frontend host | approved public demo URL |
| `law-main-road.cloud` | human decision gate | do not implement in the first frontend-only pass |
| `app.law-main-road.cloud` | defer | alternative only if `www` is rejected |
| `api.law-main-road.cloud` | defer | open only if a separate API domain is approved |

## Routing Plan

Default first-pass routing:

```text
https://www.law-main-road.cloud/**
-> Firebase Hosting rewrite
-> Cloud Run frontend
```

Deferred unless explicitly approved:

```text
https://www.law-main-road.cloud/api/**
-> Firebase Hosting rewrite
-> Cloud Run backend
```

The first Phase 7A implementation connects only the frontend public domain
unless same-origin API routing is explicitly approved. It does not add a
`/api/**` Hosting rewrite or change `NEXT_PUBLIC_API_BASE_URL`. The only backend
change in this pass is the explicitly approved small CORS extension for
`https://www.law-main-road.cloud`, while keeping the Phase 4 frontend Cloud Run
origin for rollback/debug.

If same-origin `/api/**` routing is later approved, rewrite rule ordering becomes
a hard gate. Firebase Hosting applies the first matching rewrite rule, so
`/api/**` must be listed before the frontend catch-all `/**`. The same-origin API
route also requires a frontend image rebuild with an approved build-time API base
such as:

```text
NEXT_PUBLIC_API_BASE_URL=https://www.law-main-road.cloud
```

Firebase Hosting rewrites to Cloud Run are subject to the Hosting 60-second
request timeout. Do not route long-running API paths through same-origin Hosting
rewrites until smoke confirms the request completes within that limit; otherwise
keep the direct backend Cloud Run fallback or open a separate API-domain/edge
decision.

If the same-origin API path is not ready, the fallback is to connect only the
frontend custom domain first and keep the existing backend Cloud Run URL as the
frontend API base during the first smoke. That fallback must still update
Firebase Authorized Domains for the approved frontend origin. Backend CORS is
changed only if a browser cross-origin path requires a new allowed origin and
that change is explicitly approved.

## Why Not Load Balancer First

External HTTPS Load Balancer with serverless NEG is deferred because Phase 7A is
for a contest/portfolio URL, not production edge consolidation.

Firebase Hosting is preferred for this pass because:

- Firebase is already used for Auth in this project.
- It provides a lighter custom-domain and managed-HTTPS path.
- It can rewrite to Cloud Run services in the current region.
- Gabia can remain authoritative for DNS.
- It avoids opening Cloud Armor, serverless NEG, and LB Terraform complexity
  before there is a concrete production edge requirement.

Load Balancer remains the future path if the project later needs Cloud Armor,
centralized multi-service routing, or a formal `api.law-main-road.cloud`
endpoint.

## Opening Gates

Before implementation:

- Phase 6 close-out verification is completed or explicitly accepted as stable
  enough for Phase 7A.
- Firebase Hosting billing/plan posture is accepted under the existing project
  budget monitoring.
- `www.law-main-road.cloud` is approved as the canonical public frontend host.
- Root apex behavior remains a human decision gate and is not required for the
  first `www` frontend-only pass.
- Same-origin `/api/**` routing is approved or explicitly deferred.
- If same-origin `/api/**` routing is approved, Hosting rewrite order is
  approved: `/api/**` before frontend catch-all `/**`.
- If same-origin `/api/**` routing is approved, long-running API paths are
  identified; any path that can exceed the Firebase Hosting 60-second timeout is
  kept on direct backend fallback or deferred to a separate API-domain/edge
  decision.
- If same-origin `/api/**` routing is approved, frontend rebuild impact for
  `NEXT_PUBLIC_API_BASE_URL` is accepted.
- If backend CORS changes are approved, backend CORS target and rollback origin
  are selected.
- DNS remains in Gabia unless Cloud DNS is separately opened.

## Implementation Scope

In scope:

- Firebase Hosting setup for the existing Firebase/GCP project.
- Root `firebase.json` owns the repo-managed Hosting rewrite for this pass. It
  routes only the frontend catch-all `**` to the existing dev frontend Cloud Run
  service in `asia-northeast3`.
- Do not commit `.firebaserc` for this pass. The deploy operator must pass the
  approved Firebase/GCP project id at deploy time or use a private local alias.
  Do not store the project id in public docs.
- Do not add `/api/**` to `firebase.json` unless same-origin API routing is
  explicitly approved. If `/api/**` is later approved, it must precede the
  frontend catch-all rewrite.
- Firebase custom domain setup for `www.law-main-road.cloud`.
- Gabia DNS records required by Firebase.
- Firebase Authentication Authorized Domains update.
- Frontend rebuild only if the API base change is explicitly approved.
- Backend CORS re-apply only if the approved routing path requires it.
- Route/auth smoke, direct-backend CORS/API smoke for the approved custom
  frontend origin, and rollback note.

Out of scope:

- backend/frontend feature changes,
- public API contract changes,
- SCN-004 freeze changes,
- SCN-001 live/backend draft opening,
- Firebase Auth persistence changes,
- raw case facts or token storage changes,
- external HTTPS Load Balancer,
- Cloud Armor,
- Cloud DNS delegation,
- `api.law-main-road.cloud`,
- `prod` resources.

## Repo-Managed Config

The first implementation adds only this Hosting shape:

```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "**",
        "run": {
          "serviceId": "lmr-dev-frontend",
          "region": "asia-northeast3"
        }
      }
    ]
  }
}
```

This is frontend-only routing. It does not:

- create a new Firebase project or Hosting site,
- add `.firebaserc`,
- add `/api/**`,
- change `NEXT_PUBLIC_API_BASE_URL`,
- change backend CORS except through the approved Phase 7A allowlist extension,
- change Cloud Run ingress or IAM,
- create or apply Terraform,
- connect `law-main-road.cloud` apex.

Deploy command shape after the human gates are cleared:

```bash
firebase deploy --only hosting --project <approved-firebase-project-id>
```

Use the approved private project id from the private runbook or Console context;
do not paste it into public docs, GitHub issue text, screenshots, or committed
files.

## Human-Only Custom Domain Steps

These steps are intentionally not automated in this patch.

1. Confirm Firebase Hosting billing/plan posture and that the existing Firebase
   project is the same project that owns the dev frontend Cloud Run service.
2. Deploy the repo-managed Hosting config with the command shape above, using
   the approved project id from private context.
3. In Firebase Console, open Hosting for the approved project and start custom
   domain connection for `www.law-main-road.cloud` only. Do not add the root
   apex yet.
4. Copy the DNS ownership record values shown by Firebase Console into Gabia DNS.
   The exact record type, host/name, and value must come from Firebase Console.
   Keep the ownership TXT record present as instructed by Firebase.
5. After Firebase verifies ownership, copy the requested Hosting target records
   shown by Firebase Console into Gabia DNS. Use the exact type, host/name, and
   value shown there; do not infer or reuse values from docs.
6. Wait for Firebase Hosting custom domain status and managed certificate status
   to become connected/ready. Record only redacted status evidence in public
   docs.
7. Add `www.law-main-road.cloud` to Firebase Authentication Authorized Domains.
8. Run the frontend route smoke first. After the approved backend CORS extension
   is applied, run the direct-backend auth/API smoke from the custom origin.
   Same-origin API routing remains separately gated.

Do not change Gabia DNS, Firebase Authorized Domains, certificate/cutover state,
or any public posture beyond `www.law-main-road.cloud` without the matching
human gate.

## Verification

Required smoke:

- `https://www.law-main-road.cloud` loads the deployed frontend over HTTPS.
- `/`, `/before`, `/after`, and `/history` load or guard safely.
- Google Sign-In does not fail with `auth/unauthorized-domain`.
- API-calling flows from the custom domain use the existing direct backend API
  base plus the approved CORS allowlist extension. `/api/**` Hosting rewrite and
  `NEXT_PUBLIC_API_BASE_URL` changes remain deferred.
- If same-origin `/api/**` routing is used,
  `https://www.law-main-road.cloud/api/v1/auth/me` returns the expected
  unauthenticated response without raw token/user data.
- Same-origin API smoke includes representative non-long-running endpoints. Any
  long-running endpoint is verified separately or kept on the direct backend
  fallback.
- SCN-004 exact preset remains frozen.
- SCN-001 exact fixed preset remains frontend-local.
- Missing/invalid Firebase Bearer tokens are rejected on protected SCN-001 paths.
- Public docs/screenshots use the custom domain and do not expose direct backend
  Cloud Run URLs or internal cloud inventory.

## 2026-05-11 Frontend Domain Smoke Evidence

Scope:

- Target profile: `demo/contest` public presentation domain on existing `dev`
  resources.
- Host checked: `www.law-main-road.cloud` only.
- Root apex `law-main-road.cloud`, `api.law-main-road.cloud`, `/api/**`
  Hosting rewrites, `NEXT_PUBLIC_API_BASE_URL`, backend API contracts, auth
  persistence, and storage behavior were not changed. Backend CORS was changed
  only in the later approved small extension recorded below.
- Codex did not run a Firebase deploy, change Gabia DNS, or mutate Console
  settings during this smoke.

Observed DNS / TLS:

- Firebase Console custom domain status was reported by the project owner as
  `Connected` for `www.law-main-road.cloud`.
- `www.law-main-road.cloud` resolves through Firebase Hosting, with the generic
  Firebase Hosting IPv4 `199.36.158.100` observed. The Firebase default host
  name is treated as operational inventory and is not repeated in this public
  evidence note.
- An IPv6 answer was also observed through the same CNAME chain, but local IPv6
  connection from the smoke environment failed, so IPv6 reachability was not
  accepted as verified evidence.
- HTTPS certificate is issued for `www.law-main-road.cloud` by Google Trust
  Services, with the SAN containing `DNS:www.law-main-road.cloud`.
- Public TXT ownership record retention was not confirmed from this shell with
  `dig TXT`; Firebase Console remains the source of truth for ownership TXT
  status and should be checked before deleting any TXT record.

Route smoke:

| Check | Result |
|---|---|
| `curl -4 -L https://www.law-main-road.cloud/` | `200`, served the 법대로 frontend HTML |
| `curl -4 -L https://www.law-main-road.cloud/before` | `200` |
| `curl -4 -L https://www.law-main-road.cloud/after` | `200` |
| `curl -4 -L https://www.law-main-road.cloud/history` | `200` |
| Browser-like compressed `GET /` | `404 Site Not Found` from Firebase Hosting |
| Browser-like compressed `GET /before`, `/after`, `/history` | `200` |
| Browser-like compressed `GET /?smoke=20260511` | `200` |

Recheck after Console `Connected` status was reported:

- Browser-like compressed `GET /` initially still returned Firebase Hosting
  `404 Site Not Found`.
- Browser-like compressed `GET /before`, `/after`, and `/history` still
  returned `200` and rendered the 법대로 frontend.

Final recheck after the edge/cache state settled:

- Browser-like compressed `GET /`, `/before`, `/after`, and `/history` returned
  `200`.
- Headless browser route smoke for `/`, `/before`, `/after`, and `/history`
  returned `200`, page title `법대로`, and rendered 법대로 brand text.
- The Firebase default Hosting domain also returned `200`, but the approved
  public evidence and submission target remains `www.law-main-road.cloud`.

2026-05-13 cache hardening note:

- The custom domain can otherwise keep serving stale prerendered HTML/chunk
  references after a Cloud Run frontend redeploy because the Next.js standalone
  server returned long `s-maxage` headers.
- `frontend/next.config.mjs` and `firebase.json` now set `Cache-Control:
  no-store, max-age=0, must-revalidate` on the app routes (`/`, `/before`,
  `/after`, `/after/*`, `/history`) while leaving hashed `_next/static` assets
  outside the route-specific no-store list.

Interactive auth observation:

- The project owner reported that opening the custom domain surfaced
  `인증 확인 서버에 연결할 수 없습니다.`
- Passive headless route smoke did not reproduce the message without an active
  Firebase session.
- Current repo/config evidence explains the likely cause: the frontend image
  still calls the direct backend URL through `NEXT_PUBLIC_API_BASE_URL`, while
  backend `BACKEND_CORS_ORIGIN_REGEX` remains narrowed to the Phase 4 Cloud Run
  frontend origin only. Protected/auth API flows from
  `https://www.law-main-road.cloud` therefore need a small approved backend CORS
  re-apply, unless a later same-origin `/api/**` Hosting rewrite path is opened.

Backend CORS extension:

- Phase 7A CORS extension was applied through the dev backend runtime Terraform
  root only.
- New `BACKEND_CORS_ORIGIN_REGEX` allows exactly:
  `https://www.law-main-road.cloud` and the existing Phase 4 dev frontend Cloud
  Run rollback/debug origin.
- Wildcard CORS was not used.
- `/api/**` Firebase Hosting rewrite, `NEXT_PUBLIC_API_BASE_URL`, frontend
  rebuild, `api.law-main-road.cloud`, and root apex `law-main-road.cloud` were
  not opened.
- The first Terraform plan was not applied because it also showed a stale
  backend image digest in the tfvars file. The tfvars backend image reference
  was synced to the current Cloud Run image digest first, then the saved apply
  plan contained only the CORS env var update.
- Apply result: `0 added, 1 changed, 0 destroyed`. A refresh-only state update
  then recorded the latest backend revision outputs without infrastructure
  changes.

CORS / auth smoke after apply:

| Check | Result |
|---|---|
| Preflight from `https://www.law-main-road.cloud` to `/api/v1/auth/me` | `200`, `access-control-allow-origin` echoed the custom domain |
| Preflight from Phase 4 dev frontend Cloud Run origin | `200`, rollback/debug origin still allowed |
| Preflight from root apex `https://law-main-road.cloud` | `400`, no approved origin echo |
| `GET /api/v1/auth/me` from custom domain origin without token | `200`, `logged_in=false`, custom origin allowed |
| Browser fetch from `https://www.law-main-road.cloud` to `/api/v1/auth/me` | `200`, no CORS console error |
| Google login popup from custom domain | Popup opened through Firebase auth handler; no `auth/unauthorized-domain` observed in headless smoke |
| Custom domain routes `/`, `/after`, `/history` | `200` |
| Project-owner interactive smoke | Custom-domain login, auth verification, protected/history flows, and public routes reported working |

Decision:

- DNS and managed TLS are connected.
- The frontend-only custom domain route smoke passed for `/`, `/before`,
  `/after`, and `/history`.
- The small backend CORS extension is applied and verified for the custom
  frontend origin.
- `auth/unauthorized-domain` was not observed in the popup smoke.
- Project-owner interactive browser smoke reported that login/auth/history
  functionality works after the CORS extension.

Next action:

- Keep monitoring the custom domain during the demo window for provider timeout
  or auth API regressions.
- Keep this as `demo/contest`, not `prod`, and keep Cloud Run direct URLs as the
  private rollback path.

## Rollback

Rollback path:

- Keep Cloud Run managed HTTPS URLs available during Phase 7A.
- Roll back Firebase Hosting release/config if rewrite behavior is wrong.
- Remove or repoint Gabia DNS records if custom domain routing is faulty.
- Rebuild frontend with the previous API base if a same-origin API-base change
  caused the issue.
- Re-apply previous backend CORS if the custom-domain allowlist causes a smoke
  failure.

Do not disable direct Cloud Run URLs until a separate ingress and rollback design
approves that change.
