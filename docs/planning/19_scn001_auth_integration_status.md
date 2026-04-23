# SCN-001 Auth Integration Status

기준일: `2026-04-23`

## Purpose

이 문서는 설계 문서가 아니라 Phase 4 handoff/status checkpoint다. 현재 patch 기준으로 SCN-001 Firebase Auth Phase 0~3 완료 상태, SCN-004 freeze guard, Phase 4 bridge-runs 구현 정책, 다음 작업 순서를 한 곳에 고정한다.

## Current Status by Phase

| Phase | Status | Current patch 기준 |
|---|---|---|
| Phase 0 | 완료 | Firebase Auth MVP path와 Phase 0 decisions 문서화 완료 |
| Phase 1 | 완료 | DB model/migration 완료: `users`, `bridge_runs`, `before_review_jobs.user_id`, `after_artifact_runs.user_id`, `after_artifact_runs.source_bridge_run_id` |
| Phase 2 | 완료 | backend Firebase ID token verification, `GET /api/v1/auth/me`, optional/required current user dependency 완료 |
| Phase 3 | 완료 | frontend Firebase Web SDK, `AuthContext`, Login UI, `/api/v1/auth/me` backend verification UI 완료 |
| Phase 4 | patch-ready | SCN-001 protected bridge-runs endpoint + `BeforeHandoffDTO` extraction implemented in this patch |
| Phase 5 | next | Before review user linkage |
| Phase 6 | pending | Bridge -> After answer-only handoff |
| Phase 7 | pending | `after_artifact_runs` linkage |
| Phase 8 | pending | regression / demo preflight / manual rehearsal |

## Completed Commits / Evidence

Recent relevant commits:

- `a575b2e` docs(scn-001): add Firebase Auth Phase 0 decisions for MVP auth
- `6e02c7f` docs(auth): propagate scn-001 firebase auth phase 0 decisions
- `5e94d2d` feat(db): add user and bridge run linkage for scn-001 phase 1
- `0c6a41c` feat(auth): add Firebase ID token verification and auth status endpoint
- `eea42d2` docs(ops): document Firebase Auth local setup and smoke checks
- `ec46e67` feat(frontend): add Firebase Google auth integration
- `9cb6891` docs(auth): align Firebase persistence docs with in-memory frontend state

Manual / local evidence recorded for Phase 3:

- actual Google popup login E2E 통과
- `users` row upsert 확인
- repeated auth same `user_id` 확인
- `/after` login-free 확인
- frontend build 통과

Do not record Firebase ID token, Firebase uid, Google `sub`, `provider_subject`, email value, or credential values in docs, logs, commits, issues, or chat.

## Current Auth Architecture

- MVP auth path: Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase Admin SDK verification.
- Frontend gets Firebase ID token from Firebase SDK only when needed for protected SCN-001 requests.
- Backend verifies Firebase ID token and resolves internal user from `auth_provider = "firebase_google"` + `provider_subject = Firebase uid`.
- Business tables store internal `users.id`, not Firebase uid, Google `sub`, email, or raw token.
- `/api/v1/auth/me` is implemented as provider-neutral auth status endpoint.
- Direct Google OAuth + backend-managed session cookie remains Alternative/Fallback only.
- Firebase session cookie, Identity Platform OIDC, multi-provider linking, and browser local persistence remain Future/Post-MVP.

## Local Env Notes

- Backend Firebase project id is configured through `FIREBASE_PROJECT_ID`.
- Local Firebase Admin credential should use ADC or ignored credential path such as `config/secrets/firebase-admin.json`.
- Frontend Firebase Web App public config belongs in `frontend/.env.local`.
- `NEXT_PUBLIC_*` Firebase web config values are public browser config, but actual values are still not committed to repo docs.
- MVP frontend persistence is `inMemoryPersistence`; refresh/reload can require login again by design.
- `browserSessionPersistence` is not MVP default. Revisit only as a Future/Post-MVP UX tradeoff.

## SCN-004 Freeze Guard

- `/after`, `/after/result`, `/after/intake`, `/after/draft` must remain login-free.
- `POST /api/v1/answer` remains public and its request/response contract is unchanged.
- `POST /api/v1/documents/draft` remains public and its request/response contract is unchanged.
- Firebase token must not be required on SCN-004 paths.
- `SCN-004-DEMO-FREEZE` exact preset continues to use fixed answer fixture.
- `SCN-001-BRIDGE-DEMO` remains answer-only and must not open SCN-004 document draft UI.
- SCN-004 demo freeze QA and Phase 4 feature work must not be mixed in one patch.

## Phase 4 Patch Contract

- `require_current_user` dependency is available.
- `get_optional_current_user` is available for auth status / future optional linkage.
- `users` schema exists with `auth_provider`, `provider_subject`, display fields, timestamps, and unique provider subject constraint.
- `bridge_runs` schema exists with required internal `user_id` and `after_query_seed_hash`.
- `before_review_jobs.user_id` exists as nullable linkage column.
- Phase 4 bridge POST only accepts completed Before jobs whose `before_review_jobs.user_id` matches the current internal `users.id`; null orphan jobs are rejected until Phase 5 Before runtime linkage.
- Phase 4 bridge POST request body accepts only `before_review_job_id`; client-provided `source_scenario` or `preset_id` is rejected by schema validation.
- Phase 4 bridge rows are always stored with `source_scenario = "before_review"` and `preset_id = null`.
- Missing job, other-user job, and null orphan job are externally mapped to 404 not-found to reduce existence leak.
- `after_artifact_runs.user_id` and `after_artifact_runs.source_bridge_run_id` exist as nullable linkage columns.
- `BeforeHandoffDTO` and `BridgeOutputDTO` contract draft exists in `docs/planning/16_scn001_before_bridge_contract.md`.
- `/api/v1/auth/me` and frontend login capability are implemented.

## Next Steps

1. Commit the Phase 4 backend route/schema/service patch after focused smoke checks.
2. Start Phase 5 Before review runtime linkage so newly created Before jobs receive internal `users.id`.
3. Keep retroactive linking for existing null orphan jobs as Post-MVP.
4. Preserve SCN-004 public contract during Phase 5 work.

## Do Not Mix

- Do not change SCN-004 `/after` 4-route behavior in the Phase 4 patch.
- Do not change `/api/v1/answer` contract.
- Do not change `/api/v1/documents/draft` contract.
- Do not require Firebase token for SCN-004 or public answer/draft paths.
- Do not store raw OCR, raw contract, raw user_statement, raw answer/draft payload, raw Before full result, or raw `after_query_seed` in browser Web Storage.
- Do not store Firebase ID token, Firebase uid, Google `sub`, `provider_subject`, or email value in business tables or backend responses.
- Do not switch MVP persistence to `browserSessionPersistence`.
- Do not add SCN-001 document draft or SCN-004 document type expansion in the Phase 4 patch.
