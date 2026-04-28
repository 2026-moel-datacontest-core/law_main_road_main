# SCN-001 Auth Integration Status

기준일: `2026-04-28`

## Purpose

이 문서는 설계 문서가 아니라 SCN-001 auth/linkage status checkpoint다. 현재 repo 기준으로 Firebase Auth Phase 0~5, Phase 6A~6F Bridge -> After answer-only handoff, Phase 7A~7E after artifact linkage/protected bridge answer endpoint/frontend routing verification, Post-Phase 8 Step 3 MVP soft-delete slice, `/after` saved Before/Bridge history selector, SCN-001 fixed-preset frozen draft/continuity panel, SCN-004 freeze guard, residual runtime risk, current git history hash를 한 곳에 고정한다.

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
| Step 3 MVP soft-delete slice | completed | backend history soft-delete foundation completed in `e6f17eb`; frontend `/before` delete UI/client completed in `50c279f`; browser deletion smoke PASS with sanitized PASS/PRESENT/NO signals. Step 3 full retention lifecycle is NOT opened |
| Before OCR stale-job guard | completed | `c6c3ed0` fails stale/running OCR review jobs. This is a narrow Before runtime guard outside public `/api/v1/answer`, public `/api/v1/documents/draft`, and SCN-004 frontend flow |
| SCN-001 fixed-preset frozen draft | completed | `667a1bd` adds exact `SCN-001-BRIDGE-DEMO` frozen draft flow for `workplace_change_reason_summary` / 사업장 변경 사유 정리서 초안. It is frontend fixture/deterministic template based, reflects user intake, and does not call backend/LLM or `/api/v1/documents/draft` |
| SCN-001 continuity panel | completed | `f574e6b` adds continuity panel on `/after/result` and `/after/draft`. It preserves Bridge-as-Continuity, Not Grounding and does not create or modify legal basis, citations, source/grounded context ids, or retrieved chunks |
| `/after` saved history selector | completed | `2ec5488` shows saved Before/Bridge history on `/after` for backend-verified logged-in users. The section is collapsible, saved Bridge selection uses only the displayed safe subset for Bridge handoff memory state, Before/Bridge soft-delete uses existing protected DELETE helpers, exact preset submit keeps fixed answer priority, and SCN-004 public flow remains unchanged |
| SCN-001 history/After frontend polish | completed | `f38aea6` clarifies `/after` saved history cards, `3822da2` makes the SCN-001 fixed-draft result panel non-sticky while preserving SCN-004 selector behavior, `d8ea907` polishes `/history`, `903ec4f` improves nav/delete accessibility, `1a57601` removes stale `/before` embedded-history CSS, `8cd1ccb` polishes SCN-001 history cards, `c365ca5` clarifies SCN-001 history summaries, `6263a8e` folds SCN-001 case records, and `f15430c`/`a2d984f` fix overbroad wage/deduction summaries. `/after` saved history and `/history` now use incident-centered compact summary + details/fold cards with user-facing Korean explanations instead of separate Before/Bridge list cards or raw status/key output. Frontend-only; public API contracts, auth persistence, storage policy, `/api/v1/history` unified backend API, live/backend SCN-001 draft generation, protected SCN-001 draft endpoint, Step 3 full retention lifecycle, and SCN-004 freeze remain unchanged |
| Frontend visual redesign / progress UX / main login priority | completed | Latest main is pushed through `fdde441`. Completed visual foundation token alignment, home visual simplification, `/before`/`/after`/`/history` internal route chrome simplification, `/after/result`/`/after/intake`/`/after/draft` detail visual polish, draft print CSS specificity fix, Before analysis progress UX, masthead light surface alignment, and main page login priority. Logged-out first viewport prioritizes Google login CTA; backend-verified logged-in users keep `History / Before / After` entry order. `/before` analysis start scrolls to the progress area and shows OCR 1~2 minute guidance without exposing raw job id/status/provider/internal error. Backend OCR/provider/polling contracts, backend/API/schema, RAG/data, and SCN-004 public contracts remain unchanged |

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
- `e6f17eb` feat(scn-001): add backend history soft delete
- `50c279f` feat(frontend): add SCN-001 history delete UI
- `667a1bd` feat(frontend): add frozen SCN-001 draft flow
- `c6c3ed0` fix(before): fail stale OCR review jobs
- `f574e6b` feat(frontend): add SCN-001 continuity panel
- `2ec5488` feat(frontend): show SCN-001 history on After
- `f38aea6` feat(frontend): refine After history cards
- `3822da2` fix(frontend): adjust SCN-001 result panel scrolling
- `d8ea907` feat(frontend): polish SCN-001 history page
- `903ec4f` fix(frontend): improve navigation and delete accessibility
- `1a57601` refactor(frontend): remove stale Before history styles
- `8cd1ccb` feat(frontend): polish SCN-001 history cards
- `c365ca5` feat(frontend): clarify SCN-001 history summaries
- `2548a53` refactor(frontend): align visual foundation tokens
- `ca6f2f3` refactor(frontend): simplify home visual layout
- `9cc4a6e` refactor(frontend): simplify Before route chrome
- `c8c1e5a` refactor(frontend): simplify After entry chrome
- `7de3d9a` refactor(frontend): simplify History route chrome
- `d565c2f` refactor(frontend): simplify After result detail chrome
- `cb003ce` refactor(frontend): simplify After intake chrome
- `f9fc182` refactor(frontend): improve draft document presentation
- `aaab418` fix(frontend): preserve draft print styling
- `d843804` feat(frontend): improve Before analysis progress
- `325bb2b` refactor(frontend): align masthead visual style
- `6263a8e` refactor(frontend): fold SCN-001 case records
- `f15430c` fix(frontend): avoid overbroad case summaries
- `a2d984f` fix(frontend): separate wage and deduction summaries
- `fdde441` refactor(frontend): prioritize login on home page

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

## Step 3 MVP Soft-delete Slice Evidence Summary

2026-04-27 Step 3 MVP soft-delete slice completed after backend `e6f17eb` and
frontend `50c279f`. This is not Step 3 full retention lifecycle completion.
Evidence was recorded only as PASS/PRESENT/NO signals; no token, Firebase uid,
Google subject, raw email, raw user id, provider subject, raw query, full answer
body, real bridge id, or artifact body was recorded.

Backend completed:

- `before_review_jobs` and `bridge_runs` soft-delete visibility fields completed.
- Protected `DELETE /api/v1/scn001/before-review-jobs/{before_review_job_id}`
  and `DELETE /api/v1/scn001/bridge-runs/{bridge_run_id}` completed.
- Hidden records are filtered from history list/detail.
- Hidden Before jobs block Bridge creation.
- Hidden Bridge runs and hidden-source-Before Bridge runs block protected Bridge
  answer before generation.
- No `after_artifact_runs` deletion, no hard delete, and no file purge were opened.

Frontend completed:

- `/before` read-only history delete affordance completed.
- Confirmation/cancel completed.
- SCN-001 protected DELETE request Authorization PRESENT.
- 204 and masked results use generic user-facing UX.
- Success path refreshes history and locally hides the item.
- Before delete hides/removes linked Bridge records from visible history and
  selection path.
- Memory-only Bridge handoff is cleared so deleted Before cannot seed `/after`.

Browser smoke:

- logged-in history load PASS.
- delete UI visible PASS.
- confirm/cancel PASS.
- DELETE request Authorization PRESENT.
- item disappears from history after confirm PASS.
- Before delete hides/removes linked Bridge visible path PASS.
- Before/Bridge count mismatch is expected because Bridge is created only after
  explicit handoff.
- Refresh logout is expected because Firebase Auth MVP uses `inMemoryPersistence`.
- Session extension was NOT changed for MVP.
- SCN-004 freeze impact: NO.

Out of scope remains:

- Step 3 full retention lifecycle is NOT opened.
- hard delete, artifact physical deletion, file purge, retention lifecycle, GCS
  lifecycle, audit/export, undo/restore, auth persistence changes, account
  deletion/access-control, orphan cleanup, live/backend SCN-001 document draft,
  protected SCN-001 draft endpoint, SCN-005, and
  provider_timeout retry/backoff hardening are not opened. Before OCR timeout
  and stale job failure guard are a narrow runtime guard, not a retry/backoff phase.

## `/after` Saved History Selector Status

2026-04-27 `/after` saved Before/Bridge history selector completed in `2ec5488`.
This is a frontend SCN-001 protected-history usability slice and does not change
public `/api/v1/answer`, public `/api/v1/documents/draft`, or SCN-004 login-free
behavior.

Implemented behavior:

- Backend-verified logged-in users can open a collapsible saved history section
  on `/after`.
- Saved Bridge selection adds only the displayed safe subset to Bridge handoff
  memory state.
- Raw `after_query_seed`, raw Bridge payload, token, Firebase uid,
  provider_subject, email, raw query, full answer body, artifact body, and real
  bridge id are not exposed in UI/query/storage/docs.
- `/after` saved history list provides Before/Bridge soft-delete affordances.
- Delete uses the existing protected DELETE helper.
- Delete success refreshes/local-cleans the history list and selected handoff
  state.
- Before delete removes linked Bridge visible path.
- Bridge context/history does not hide SCN-001/SCN-004 preset buttons.
- Exact preset submit keeps fixed answer path priority:
  `SCN-001-BRIDGE-DEMO` exact -> fixed answer -> frozen draft flow;
  `SCN-004-DEMO-FREEZE` exact -> fixed answer -> existing SCN-004 draft flow.
- Preset unselected + included Bridge context keeps the existing protected
  Bridge answer path.
- Logged-out users can still use `/after` public preset/free input flows.
- SCN-004 public flow unchanged.

## Incident-centered History UI Status

2026-04-28 latest main is pushed through `fdde441`. The SCN-001 history surfaces
are now aligned around an incident-centered compact summary + details/fold model.

Current `/after` behavior:

- Backend-verified logged-in users can select saved Before/Bridge incident
  records from `/after`.
- Records are shown as one incident card instead of separate Before/Bridge
  columns or independent cards.
- Bridge selection keeps the existing protected Bridge answer routing and memory
  handoff behavior.
- SCN-004 public `/after` preset/free input flow remains login-free.
- SCN-004 exact/free input draft behavior remains unchanged.

Current `/history` behavior:

- `/history` is the SCN-001 record archive.
- It uses an incident-centered single card flow, not a separate 2-column
  Before/Bridge layout.
- Details/fold sections keep the archive compact while still showing confirmed
  issues, candidate legal references, recommended next steps, and After
  connection.
- Existing soft-delete confirm/cancel/success UX remains in place.
- Failed/running Before jobs are hidden from the user-facing list.
- Bridge records linked to fetched non-completed Before jobs are hidden.
- Bridge-only records whose source Before is outside the fetch window remain
  visible as reference records.

Display policy:

- Incident summaries are user-facing Korean explanations, not raw status/key
  dumps.
- `mandatory_terms_missing`, `dormitory_missing_info`, `deduction_risk`, and
  unknown snake_case values are rendered through Korean label/description or
  readable fallback.
- Bridge is continuity/reference only, not legal grounding.
- Raw `after_query_seed` remains null and is not exposed in UI/query/storage.

Main page state:

- Main page login priority is completed in `fdde441`.
- Logged-out first viewport prioritizes the Google login CTA before protected
  Before/history actions.
- Backend-verified logged-in users keep `History / Before / After` entry order.
- SCN-004 `/after` preset/free input remains login-free.

Before progress UX:

- `/before` analysis start scrolls to the progress area.
- OCR guidance says document quality/length can make OCR take about 1~2 minutes.
- Raw job id/status/provider/internal error is not shown to the user.
- Backend OCR/provider/polling contract remains unchanged.

Evidence hygiene:

- Record only PASS/PRESENT/ABSENT/NO-level evidence.
- Do not record token, Firebase uid, provider_subject, email, raw query, full
  answer body, artifact body, or real bridge id.

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
- `SCN-001-BRIDGE-DEMO` exact fixed preset opens only its frontend-local frozen
  `workplace_change_reason_summary` draft flow. It must not open SCN-004
  document draft UI.
- SCN-001 frozen draft flow does not call `/api/v1/documents/draft`; SCN-004
  public draft flow continues to use `/api/v1/documents/draft` unchanged.
- SCN-004 fixed/free input/draft flow unchanged.
- `/after` saved history selector must not require login for SCN-004 public
  preset/free input users; the saved history section is an additive
  backend-verified logged-in SCN-001 surface.
- Bridge context/history must not override exact preset fixed answer priority.
- SCN-001 live/backend draft generation and protected SCN-001 draft endpoint are
  not activated.

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
- Full real Before/OCR completed E2E remains separate if needed; Phase 6F Bridge checked-live smoke used memory-only synthetic handoff state. Before OCR now has a timeout/stale-job guard so OCR provider hangs or stale/running jobs fail instead of polling indefinitely.
- IndexedDB Firebase SDK persistence policy can be revisited if needed; MVP app code still uses `inMemoryPersistence` and does not store raw flow payload in Web Storage.
- Retroactive linking for existing null orphan Before jobs is Post-MVP.
- Step 3 MVP soft-delete slice completed, but full retention lifecycle remains
  NOT opened. Hard delete, artifact physical deletion/file purge, retention
  lifecycle, GCS lifecycle, audit/export, undo/restore, auth persistence changes,
  account deletion/access-control, orphan cleanup, live/backend SCN-001 document draft,
  SCN-005, and provider_timeout retry/backoff hardening remain future/out of scope.
  SCN-001-BRIDGE-DEMO exact fixed preset frozen draft, continuity panel, and
  `/after` saved history selector are completed frontend-local/protected-history
  paths, not live/backend draft generation.
- Current remaining candidates are optional frontend-only visual polish:
  SCN-004 intake/draft internal component surface cleanup, Before
  Upload/Result/Accessibility panels deep polish, Auth/LoginButton token cleanup
  nit, History deep density polish, and manual visual QA / print preview.
  Backend/API/schema work remains closed for these candidates.

## Do Not Mix

- Do not change SCN-004 `/after` 4-route behavior in SCN-001 linkage patches.
- Do not change `/api/v1/answer` contract.
- Do not change `/api/v1/documents/draft` contract.
- Do not require Firebase token for SCN-004 or public answer/draft paths.
- Do not store raw OCR, raw contract, raw user_statement, raw answer/draft payload, raw Before full result, or raw `after_query_seed` in browser Web Storage.
- Do not store Firebase ID token, Firebase uid, Google `sub`, `provider_subject`, or email value in business tables or backend responses.
- Do not switch MVP persistence to `browserSessionPersistence`.
- Do not add live/backend SCN-001 document draft generation, protected SCN-001
  draft endpoint, or SCN-004 document type expansion in this scope.
