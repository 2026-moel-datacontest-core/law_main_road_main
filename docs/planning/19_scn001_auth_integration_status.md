# SCN-001 Auth Integration Status

기준일: `2026-04-27`

## Purpose

이 문서는 설계 문서가 아니라 SCN-001 auth/linkage status checkpoint다. 현재 repo 기준으로 Firebase Auth Phase 0~5, Phase 6A~6F Bridge -> After answer-only handoff, Phase 7A~7E after artifact linkage/protected bridge answer endpoint/frontend routing verification, SCN-004 freeze guard, residual runtime risk, current git history hash를 한 곳에 고정한다.

## Current Status by Phase

| Phase | Status | Current repo 기준 |
|---|---|---|
| Phase 0 | 완료 | Firebase Auth MVP path와 Phase 0 decisions 문서화 완료 |
| Phase 1 | 완료 | DB model/migration 완료: `users`, `bridge_runs`, `before_review_jobs.user_id`, `after_artifact_runs.user_id`, `after_artifact_runs.source_bridge_run_id` |
| Phase 2 | 완료 | backend Firebase ID token verification, `GET /api/v1/auth/me`, optional/required current user dependency 완료 |
| Phase 3 | 완료 | frontend Firebase Web SDK, `AuthContext`, Login UI, `/api/v1/auth/me` backend verification UI 완료 |
| Phase 4 | 완료 | SCN-001 protected bridge-runs endpoint + `BeforeHandoffDTO` extraction implemented |
| Phase 5 | 완료 | Before review job optional auth linkage: valid Bearer token stores internal `users.id`; missing token keeps `user_id = null`; invalid token returns 401 |
| Phase 6A~6D | 완료 | Bridge handoff memory state/query builder, bridge run client helper, Before result CTA, `/after` Bridge cards implemented |
| Phase 6E | 완료 | handoff blocker fixes: Before optional Bearer token, Bridge response public `user_id` removal, Bridge-origin draft CTA/button hiding |
| Phase 6F | PASS with retry | live subset passed with retry. Vertex IAM/credential issue runtime resolved. Residual runtime risk is transient `provider_timeout` |
| Phase 7 design | 완료 | protected Bridge-origin answer endpoint + single primary `source_bridge_run_id` policy documented |
| Phase 7A | 완료 | `AfterArtifactLinkage` optional answer artifact persistence plumbing implemented |
| Phase 7B | 완료 | `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer` implemented |
| Phase 7C~7D | 완료 | frontend `fetchBridgeAnswer` helper and checked/all-unchecked `/after` submit routing implemented while preserving SCN-004 public behavior |
| Phase 7E | PASS | live browser/network/DB smoke passed: SCN-004 freeze paths, checked protected Bridge answer, all-unchecked public answer, and artifact linkage verified |
| Phase 8 | PARTIAL | regression / demo preflight / SCN-004 manual rehearsal PASS. SCN-001 browser replay BLOCKED in Codex headless because interactive Firebase Google popup login and in-memory auth state were not available |
| Post-Phase 8 logged-in smoke | PASS | actual browser Google login, backend `/api/v1/auth/me` verification, main Before CTA, history endpoints Authorization, and read-only history render passed with sanitized evidence. Frontend protected SCN-001 gates now require backend-verified `backendUser.logged_in`, not Firebase signed-in alone |

## Current Git History References

Recent relevant commits after history rewrite:

- `5557f97` docs(scn-001): add Firebase Auth Phase 0 decisions for MVP auth
- `fa22438` docs(auth): propagate scn-001 firebase auth phase 0 decisions
- `4a59b47` feat(db): add user and bridge run linkage for scn-001 phase 1
- `61a2bc6` feat(auth): add Firebase ID token verification and auth status endpoint
- `3369238` docs(ops): document Firebase Auth local setup and smoke checks
- `1e4df77` feat(frontend): add Firebase Google auth integration
- `9eed711` docs(auth): align Firebase persistence docs with in-memory frontend state
- `5ee820d` feat(scn-001): add protected bridge runs endpoint
- `d3a44bc` feat(scn-001): link Before review jobs to logged-in users
- `f0bb0d3` docs(scn-001): plan Phase 6 consent-based Bridge handoff to After
- `21ea687` feat(scn-001): add Phase 6A bridge handoff state and query builder
- `3c7fce3` feat(frontend): add SCN-001 bridge run client helper
- `b04ac45` feat(scn-001): add Phase 6C Before result bridge handoff CTA
- `0da93c2` feat(scn-001): add Phase 6D Bridge handoff cards to After
- `3fd36da` docs(scn-001): update Phase 6D handoff integration status
- `82e86ec` fix(scn-001): complete Phase 6E handoff blockers
- `8f07a98` docs(scn-001): record Phase 6F live handoff smoke evidence
- `ab63bc3` docs(scn-001): plan Phase 7 after artifact provenance linkage
- `aff0a7f` feat(scn-001): add Phase 7A answer artifact linkage plumbing
- `27bf054` feat(scn-001): add protected bridge answer endpoint
- `9287281` chore(gitignore): harden local secret and database ignore rules

## Phase 6F Evidence Summary

- Vertex IAM/credential issue is considered resolved at runtime: embedding-only smoke succeeded, and `embed_query("해고예고수당")` returned vector length `768`.
- Backend `/api/v1/answer` direct live path: first attempt hit `provider_timeout`; one retry succeeded with HTTP 200 and answer artifact row delta was observed.
- Frontend direct `/after` live path: PASS; Bridge card/checkbox absent; `Authorization` absent; `top_k=5`, `ef_search=100`; `/after/result` reached.
- SCN-004 modified/live path: PASS; public `/api/v1/answer` called without `Authorization`; `top_k=10`, `ef_search=100`; document draft POST was not run.
- SCN-004 fixed exact path: PASS; exact preset path did not call `/api/v1/answer`; fixed answer result reached; eligible draft choices/button visible; document draft POST was not run.
- Bridge handoff checked-live path: PASS on retry; first attempt hit `provider_timeout`; retry succeeded with HTTP 200; query included displayed safe subset plus user question; query excluded raw `after_query_seed`, Bridge id, and token-like sentinel.
- Bridge answer-only guard: Bridge answer-only notice visible; draft choices absent; `사건 정보 입력하기` button absent; document draft POST was not run.
- Privacy / artifact guard: `fetchAnswer` and `fetchDraft` did not auto-attach `Authorization`; raw flow payload was not stored in Web Storage.

Do not record Firebase ID token, Firebase uid, Google `sub`, `provider_subject`, email value, credential values, full answer bodies, raw query text, or artifact file contents in docs, logs, commits, issues, or chat.

## Phase 7E Live Smoke Evidence Summary

2026-04-24 manual live smoke passed in WSL terminal + browser DevTools + DB.

- Preflight: `ensure_postgres_ready` PASS; `bash scripts/demo_preflight.sh` PASS.
- SCN-004 exact preset: `/api/v1/answer` call NO; `/after/result` reached YES; draft choices visible YES.
- SCN-004 modified/free input: `/api/v1/answer` call YES; `Authorization` header ABSENT; `/after/result` reached YES.
- SCN-001 checked Bridge handoff: logged in YES; Bridge card checked YES; endpoint `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`; `Authorization` header PRESENT; public `/api/v1/answer` call NO; `/after/result` reached YES; draft CTA/document selection UI hidden YES.
- SCN-001 all-unchecked Bridge handoff: Bridge card unchecked YES; endpoint `POST /api/v1/answer`; `Authorization` header ABSENT; `/after/result` reached YES; draft CTA/document selection UI hidden YES.
- Artifact linkage: protected checked Bridge answer latest row has `user_id = NOT NULL` and `source_bridge_run_id = NOT NULL`; public answer latest row has `user_id = NULL` and `source_bridge_run_id = NULL`.
- Errors: `provider_timeout` NO; console/network error NO.
- Privacy note: final evidence records no token, Firebase uid, email, provider_subject, raw query, full answer body, real bridge id, or artifact body.

## Phase 8 Regression / Demo Preflight Evidence Summary

2026-04-24 Phase 8 verification was run from the repo root with existing local
backend/frontend servers available on `localhost:8000` and `localhost:5090`.

- DB readiness: PASS; PostgreSQL accepting connections YES; probe result YES.
- Demo preflight: PASS; `main == origin/main` YES; local-only dirty file allowed YES; PostgreSQL readiness PASS; conda env activation PASS; backend import PASS; document draft smoke PASS; frontend build PASS; WSL Playwright Chromium smoke PASS.
- SCN-004 exact preset: PASS; `/api/v1/answer` call NO; `/after/result` reached YES; draft choice visible YES; draft flow enterable YES.
- SCN-004 draft smoke: PASS; `/api/v1/documents/draft` call YES; `rendered_text` visible YES; copy button clipboard write YES; `window.print()` called YES.
- SCN-004 modified/free input: PASS; public `/api/v1/answer` call YES; `Authorization` header ABSENT; `/after/result` reached YES.
- SCN-001 checked Bridge handoff browser replay: BLOCKED in Codex headless; interactive Firebase Google popup login and in-memory auth state were not available. Latest full browser/network/DB evidence remains Phase 7E PASS. Sanitized DB inventory still showed protected linked rows PRESENT and mixed linkage rows ABSENT.
- SCN-001 all-unchecked Bridge handoff browser replay: BLOCKED in Codex headless for the same auth/session reason. Latest full browser/network/DB evidence remains Phase 7E PASS. Sanitized DB inventory still showed public unlinked rows PRESENT and mixed linkage rows ABSENT.
- SCN-004 browser console/network error: NO.
- Privacy note: Phase 8 evidence records no token, Firebase uid, email, provider_subject, raw query, full answer body, real bridge id, or artifact body.

## Post-Phase 8 Logged-in Browser Smoke Evidence Summary

2026-04-27 actual browser smoke passed after SCN-001 frontend auth state sync
hardening. Evidence was recorded only as PASS/PRESENT/NO signals; no token,
Firebase uid, Google subject, raw email, raw user id, provider subject, raw
query, full answer body, real bridge id, or artifact body was recorded.

- Google login: PASS. `/api/v1/auth/me` returned HTTP 200 with `logged_in=true`;
  `user_id`, `display_name`, and `email` were presence-checked only.
- Backend auth state sync: PASS. The previous mismatch where Firebase showed
  signed-in while backend verification returned 401 was resolved.
- Main Before CTA -> `/before`: PASS. The main Before gate uses backend-verified
  auth state, not Firebase signed-in alone.
- History endpoints Authorization: PASS. `GET /api/v1/scn001/before-review-jobs`
  and `GET /api/v1/scn001/bridge-runs` included Authorization headers and the
  previous 401 was not reproduced.
- Read-only history render: PASS. `/before` history UI rendered without auth
  error; existing records show as list and no-record state shows as expected.
- Console/network error: NO for the previous auth 401 path after the fix.
- Verification: `frontend npm run build` PASS; `git diff --check` PASS.

Implementation note:

- Protected SCN-001 frontend gates now require backend `/api/v1/auth/me`
  verification via `backendUser.logged_in`.
- Main Before CTA, `/before` history, Before analysis start, and Bridge handoff
  no longer treat Firebase signed-in alone as sufficient.
- Protected endpoint 401 failures trigger a backend auth re-check.

## Current Auth / Linkage Architecture

- MVP auth path: Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase Admin SDK verification.
- Frontend gets Firebase ID token from Firebase SDK only when needed for protected SCN-001 requests.
- Frontend protected SCN-001 gates use backend-verified `backendUser.logged_in`
  state; Firebase signed-in alone is not sufficient for main Before entry,
  `/before` history, Before analysis, or Bridge handoff.
- Backend verifies Firebase ID token and resolves internal user from `auth_provider = "firebase_google"` + `provider_subject = Firebase uid`.
- Business tables store internal `users.id`, not Firebase uid, Google `sub`, email, or raw token.
- `/api/v1/auth/me` is implemented as provider-neutral auth status endpoint.
- Direct Google OAuth + backend-managed session cookie remains Alternative/Fallback only.
- Firebase session cookie, Identity Platform OIDC, multi-provider linking, and browser local persistence remain Future/Post-MVP.

## SCN-004 Freeze Guard

- `/after`, `/after/result`, `/after/intake`, `/after/draft` must remain login-free.
- `/api/v1/answer` public contract unchanged.
- `/api/v1/documents/draft` contract unchanged.
- Firebase token must not be required on SCN-004 paths.
- `SCN-004-DEMO-FREEZE` exact preset continues to use fixed answer fixture.
- `SCN-001-BRIDGE-DEMO` remains answer-only and must not open SCN-004 document draft UI.
- SCN-004 fixed/free input/draft flow unchanged.
- SCN-001 document draft is not activated.

## Phase 6 Sticky Bridge Origin Policy

- Bridge-origin answer state uses sticky `answer_origin = "bridge_handoff"`.
- If at least one Bridge card is checked, query uses displayed safe subset plus user question.
- If all Bridge cards are unchecked, excluded, or missing, query can be user question only, but `answer_origin` still remains `bridge_handoff`.
- Bridge-origin `/after/result` remains answer-only and draft disabled.
- regular draft behavior requires direct `/after` entry or reset/re-entry into regular After flow.
- raw `after_query_seed` is not placed into `/api/v1/answer.query`.
- raw Before result, raw contract/OCR, full DTO payloads, internal auth identifiers, and `bridge_run_id` are not placed into answer query.

Displayed safe subset:

- `user_visible_summary`
- `issue_categories` first, or `risk_tags` fallback when `issue_categories` is empty, max 4 labels
- `law_refs` max 5
- `recommended_next_actions` max 3

## Phase 7A / 7B / 7E Contract

- Phase 7A adds optional `AfterArtifactLinkage` plumbing to answer artifact persistence.
- Public `/api/v1/answer` calls persistence with no linkage metadata, so public answer rows keep `user_id = null` and `source_bridge_run_id = null`.
- Phase 7B endpoint: `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`.
- Phase 7B requires Firebase Bearer auth.
- Missing or unowned `bridge_run_id` returns 404 to reduce existence leaks.
- Request body is `AnswerRequest`-compatible.
- Response body is `AnswerResponse`-compatible.
- Protected bridge answer persists `after_artifact_runs.user_id = current_user.id`.
- Protected bridge answer persists `after_artifact_runs.source_bridge_run_id = bridge_run_id`.
- Frontend checked Bridge handoff calls the protected Bridge answer endpoint with Firebase Bearer auth.
- Frontend all-unchecked Bridge handoff calls public `/api/v1/answer` without `Authorization` while keeping sticky `answer_origin = "bridge_handoff"`.
- raw `after_query_seed` is not placed into the protected bridge answer query.
- MVP provenance is single primary `source_bridge_run_id`.
- Multi-bridge full provenance remains a Post-MVP join table candidate, not a `source_bridge_run_ids` JSON/list in MVP.

## Current Open / Future Items

- Additional negative auth smoke for missing token / other-user `bridge_run_id` masking can be run as needed; positive Phase 7E browser/network/DB route smoke and Post-Phase 8 actual logged-in browser smoke passed.
- Phase 6F passed with retry, but transient `provider_timeout` remains residual runtime risk. Retry/backoff hardening is separate runtime work.
- Full real Before/OCR completed E2E remains separate if needed; Phase 6F Bridge checked-live smoke used memory-only synthetic handoff state.
- IndexedDB Firebase SDK persistence policy can be revisited if needed; MVP app code still uses `inMemoryPersistence` and does not store raw flow payload in Web Storage.
- Retroactive linking for existing null orphan Before jobs is Post-MVP.
- Artifact retention/deletion/account history access control remains Post-MVP.

## Do Not Mix

- Do not change SCN-004 `/after` 4-route behavior in SCN-001 linkage patches.
- Do not change `/api/v1/answer` contract.
- Do not change `/api/v1/documents/draft` contract.
- Do not require Firebase token for SCN-004 or public answer/draft paths.
- Do not store raw OCR, raw contract, raw user_statement, raw answer/draft payload, raw Before full result, or raw `after_query_seed` in browser Web Storage.
- Do not store Firebase ID token, Firebase uid, Google `sub`, `provider_subject`, or email value in business tables or backend responses.
- Do not switch MVP persistence to `browserSessionPersistence`.
- Do not add SCN-001 document draft or SCN-004 document type expansion in this scope.
