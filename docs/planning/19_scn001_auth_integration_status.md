# SCN-001 Auth Integration Status

기준일: `2026-04-23`

## Purpose

이 문서는 설계 문서가 아니라 SCN-001 auth/linkage status checkpoint다. 현재 patch 기준으로 SCN-001 Firebase Auth Phase 0~5 완료 상태, Phase 6A~6D Bridge -> After answer-only handoff 구현 상태, SCN-004 freeze guard, protected bridge-runs / Before review linkage 정책, 다음 작업 순서를 한 곳에 고정한다.

## Current Status by Phase

| Phase | Status | Current patch 기준 |
|---|---|---|
| Phase 0 | 완료 | Firebase Auth MVP path와 Phase 0 decisions 문서화 완료 |
| Phase 1 | 완료 | DB model/migration 완료: `users`, `bridge_runs`, `before_review_jobs.user_id`, `after_artifact_runs.user_id`, `after_artifact_runs.source_bridge_run_id` |
| Phase 2 | 완료 | backend Firebase ID token verification, `GET /api/v1/auth/me`, optional/required current user dependency 완료 |
| Phase 3 | 완료 | frontend Firebase Web SDK, `AuthContext`, Login UI, `/api/v1/auth/me` backend verification UI 완료 |
| Phase 4 | 완료 | SCN-001 protected bridge-runs endpoint + `BeforeHandoffDTO` extraction implemented |
| Phase 5 | 완료 | Before review job optional auth linkage: valid Bearer token stores internal `users.id`; missing token keeps `user_id = null`; invalid token returns 401 |
| Phase 6 | 부분 완료 | 6A~6D implemented through commit `43d47f4`; remaining E2E / 6F verification pending |
| Phase 7 | pending | `after_artifact_runs` linkage and `source_bridge_run_id` provenance policy |
| Phase 8 | pending | broader regression / demo preflight / manual rehearsal after Phase 6 verification |

## Completed Commits / Evidence

Recent relevant commits:

- `a575b2e` docs(scn-001): add Firebase Auth Phase 0 decisions for MVP auth
- `6e02c7f` docs(auth): propagate scn-001 firebase auth phase 0 decisions
- `5e94d2d` feat(db): add user and bridge run linkage for scn-001 phase 1
- `0c6a41c` feat(auth): add Firebase ID token verification and auth status endpoint
- `eea42d2` docs(ops): document Firebase Auth local setup and smoke checks
- `ec46e67` feat(frontend): add Firebase Google auth integration
- `9cb6891` docs(auth): align Firebase persistence docs with in-memory frontend state
- `f9ab46b` feat(scn-001): add protected bridge runs endpoint
- `4bdac90` feat(scn-001): link Before review jobs to logged-in users
- `51846fe` docs(scn-001): plan Phase 6 consent-based Bridge handoff to After
- `823216c` feat(scn-001): add Phase 6A bridge handoff state and query builder
- `2245061` feat(frontend): add SCN-001 bridge run client helper
- `2ca2bbe` feat(scn-001): add Phase 6C Before result bridge handoff CTA
- `43d47f4` feat(scn-001): add Phase 6D Bridge handoff cards to After

Manual / local evidence recorded for Phase 3:

- actual Google popup login E2E 통과
- `users` row upsert 확인
- repeated auth same `user_id` 확인
- `/after` login-free 확인
- frontend build 통과

Phase 6 status evidence:

- Phase 6 design doc completed in `51846fe`.
- Phase 6A implemented Bridge handoff memory state and `buildBridgeContextQuery`.
- Phase 6B implemented the SCN-001 protected bridge run frontend client helper.
- Phase 6C implemented the Before result Bridge handoff CTA.
- Phase 6D implemented Bridge handoff cards on `/after`.
- Phase 6 is not fully closed: logged-in browser E2E and interaction regression verification remain pending.

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
- Bridge-origin answer state uses `answer_origin = "bridge_handoff"` and remains answer-only.
- Bridge-origin `/after/result` and `/after/draft` paths must keep `supportsDraft=false`; SCN-001 document draft is not activated.
- SCN-004 demo freeze QA and Phase 6 feature work must not be mixed in one patch.

## Phase 4 / 5 Patch Contract

- `require_current_user` dependency is available.
- `get_optional_current_user` is available for auth status / future optional linkage.
- `users` schema exists with `auth_provider`, `provider_subject`, display fields, timestamps, and unique provider subject constraint.
- `bridge_runs` schema exists with required internal `user_id` and `after_query_seed_hash`.
- `before_review_jobs.user_id` exists as nullable linkage column.
- Phase 4 bridge POST only accepts completed Before jobs whose `before_review_jobs.user_id` matches the current internal `users.id`; null orphan jobs are rejected until Phase 5 Before runtime linkage.
- Phase 4 bridge POST request body accepts only `before_review_job_id`; client-provided `source_scenario` or `preset_id` is rejected by schema validation.
- Phase 4 bridge rows are always stored with `source_scenario = "before_review"` and `preset_id = null`.
- Missing job, other-user job, and null orphan job are externally mapped to 404 not-found to reduce existence leak.
- Phase 5 Before job creation keeps anonymous Before reviews allowed: no `Authorization` header stores `before_review_jobs.user_id = null`.
- Phase 5 Before job creation links only reviews created after login: valid `Authorization: Bearer <Firebase ID token>` stores the resolved internal `users.id`.
- Phase 5 invalid or malformed `Authorization` on Before job creation returns 401 and is not silently treated as anonymous.
- Non-login Bridge save/link remains disallowed because `/api/v1/scn001/bridge-runs` requires Firebase Bearer auth.
- Only logged-in-created Before jobs can be converted into Bridge runs. Anonymous/orphan Before jobs continue to return 404 at Bridge.
- Retroactive linking of `user_id = null` Before jobs is Post-MVP and not implemented.
- `after_artifact_runs.user_id` and `after_artifact_runs.source_bridge_run_id` exist as nullable linkage columns.
- `BeforeHandoffDTO` and `BridgeOutputDTO` contract draft exists in `docs/planning/16_scn001_before_bridge_contract.md`.
- `/api/v1/auth/me` and frontend login capability are implemented.

## Phase 6A~6D Implemented Contract

- Phase 6A~6D are implemented through commit `43d47f4`; Phase 6 remaining browser E2E / 6F verification is still pending.
- `/after` reads `FlowContext` `bridge_handoff.items` and renders Bridge handoff summary card(s) only when memory handoff state exists.
- Each Bridge handoff card exposes an include checkbox and dispatches `SET_BRIDGE_HANDOFF_ITEM_INCLUDED`.
- `이번 질문에서 제외` dispatches only `REMOVE_BRIDGE_HANDOFF_ITEM`.
- `이번 질문에서 제외` is not deletion, retention policy, source document deletion, Before result deletion, or `bridge_runs` deletion.
- When at least one Bridge handoff item is checked, `/after` builds the existing `/api/v1/answer` `query` with `buildBridgeContextQuery`.
- Bridge handoff live answer uses `top_k=10`, `ef_search=100`, and `selected_preset_id = null`.
- When all Bridge handoff items are unchecked, excluded, or missing, `/after` sends only the user's question.
- `buildBridgeContextQuery` uses only the displayed safe subset:
  - `user_visible_summary`
  - `issue_categories` first, or `risk_tags` fallback when `issue_categories` is empty, max 4 labels
  - `law_refs` max 5
  - `recommended_next_actions` max 3
- `after_query_seed` is not placed into `/api/v1/answer.query`.
- Raw Before result, raw contract/OCR, full DTO payloads, internal auth identifiers, and `bridge_run_id` are not placed into `/api/v1/answer.query`.
- Bridge-origin answer state is marked with `answer_origin = "bridge_handoff"`.
- Bridge-origin answer result/draft flow is answer-only: `supportsDraft=false`, no SCN-001 document draft activation.
- `SCN-004-DEMO-FREEZE`, SCN-004 free input, `fetchAnswer`, and `fetchDraft` contracts are unchanged.
- `POST /api/v1/answer` request/response contract remains unchanged.
- `POST /api/v1/documents/draft` request/response contract remains unchanged.

## Next Steps

1. Run actual logged-in Before -> Bridge -> `/after` -> answer browser E2E smoke.
2. Verify checked / unchecked / `이번 질문에서 제외` Bridge handoff interactions.
3. Verify Bridge-origin answer result does not show document draft choices and cannot enter SCN-004 draft flow.
4. Verify direct `/after`, `SCN-004-DEMO-FREEZE`, and SCN-004 free input regression.
5. Keep retroactive linking for existing null orphan jobs as Post-MVP.
6. Preserve SCN-004 public contract during remaining Phase 6 verification.

## Phase 7 Open Items

- Define how `after_artifact_runs` records linkage to Bridge-origin answers.
- Decide runtime assignment policy for nullable `after_artifact_runs.source_bridge_run_id`.
- Decide multiple Bridge contexts provenance before enabling persisted After artifact linkage:
  - one primary `source_bridge_run_id`
  - `source_bridge_run_ids` list/JSON
  - join table such as `after_artifact_run_bridge_runs`
- Do not infer Phase 7 provenance from Phase 6 `bridge_handoff.items`; Phase 6 only builds an answer query through the existing public answer contract.

## Do Not Mix

- Do not change SCN-004 `/after` 4-route behavior in Phase 6 remaining verification patches.
- Do not change `/api/v1/answer` contract.
- Do not change `/api/v1/documents/draft` contract.
- Do not require Firebase token for SCN-004 or public answer/draft paths.
- Do not store raw OCR, raw contract, raw user_statement, raw answer/draft payload, raw Before full result, or raw `after_query_seed` in browser Web Storage.
- Do not store Firebase ID token, Firebase uid, Google `sub`, `provider_subject`, or email value in business tables or backend responses.
- Do not switch MVP persistence to `browserSessionPersistence`.
- Do not add SCN-001 document draft or SCN-004 document type expansion in Phase 6 remaining verification patches.
