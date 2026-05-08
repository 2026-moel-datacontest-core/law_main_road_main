# Phase 7A — Public Domain Routing

기준일: `2026-05-08`

## Status

Phase 7A는 `demo/contest` public presentation domain을 여는 optional hardening
후보다. 이 문서는 implementation 전 decision/opening gate를 고정한다.

## Decision

Selected path:

```text
law-main-road.cloud
-> Gabia DNS
-> Firebase Hosting custom domain / managed certificate
-> Hosting rewrites
-> existing dev Cloud Run frontend/backend
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
| `www.law-main-road.cloud` | first public frontend host | canonical public demo URL candidate |
| `law-main-road.cloud` | redirect to `www` or same Hosting target | decide during Firebase custom-domain setup |
| `app.law-main-road.cloud` | defer | alternative only if `www` is rejected |
| `api.law-main-road.cloud` | defer | open only if a separate API domain is approved |

## Routing Plan

Preferred first-pass routing:

```text
https://www.law-main-road.cloud/**
-> Firebase Hosting rewrite
-> Cloud Run frontend

https://www.law-main-road.cloud/api/**
-> Firebase Hosting rewrite
-> Cloud Run backend
```

Rewrite rule ordering is a hard gate. Firebase Hosting applies the first matching
rewrite rule, so `/api/**` must be listed before the frontend catch-all `/**`.

The same-origin API route requires a frontend image rebuild with an approved
build-time API base such as:

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
Firebase Authorized Domains and backend CORS for the approved frontend origin.

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
- Root apex behavior is selected: redirect to `www` or same Hosting target.
- Same-origin `/api/**` routing is approved or explicitly deferred.
- Hosting rewrite order is approved: `/api/**` before frontend catch-all `/**`.
- Long-running API paths are identified; any path that can exceed the Firebase
  Hosting 60-second timeout is kept on direct backend fallback or deferred to a
  separate API-domain/edge decision.
- Frontend rebuild impact for `NEXT_PUBLIC_API_BASE_URL` is accepted.
- Backend CORS target and rollback origin are selected.
- DNS remains in Gabia unless Cloud DNS is separately opened.

## Implementation Scope

In scope:

- Firebase Hosting setup for the existing Firebase/GCP project.
- `firebase.json` Hosting rewrites if repo-managed Hosting config is selected.
  The `/api/**` rewrite must precede the frontend catch-all rewrite.
- Firebase custom domain setup for `www.law-main-road.cloud`.
- Gabia DNS records required by Firebase.
- Firebase Authentication Authorized Domains update.
- Frontend rebuild if the API base changes to the public custom domain.
- Backend CORS re-apply for the approved frontend custom origin when needed.
- Route/auth/API smoke and rollback note.

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

## Verification

Required smoke:

- `https://www.law-main-road.cloud` loads the deployed frontend over HTTPS.
- `/`, `/before`, `/after`, and `/history` load or guard safely.
- Google Sign-In does not fail with `auth/unauthorized-domain`.
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
