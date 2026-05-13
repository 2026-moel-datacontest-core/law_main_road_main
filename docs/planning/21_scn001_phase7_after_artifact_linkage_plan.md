# SCN-001 Phase 7 After Artifact Linkage / Bridge Provenance Plan

기준일: `2026-04-24`

이 문서는 Phase 7 구현 전에 `after_artifact_runs` linkage와
`source_bridge_run_id` provenance 정책을 확정하기 위한 설계 문서였고,
현재는 Phase 7A~7E 구현 상태와 future scope를 함께 고정한다.
코드 수정, env 수정, DB/migration 수정, git add/commit, 서버 실행, build,
eval은 이 문서 범위가 아니다.

Implementation status:

- Phase 7 design document completed in `ab63bc3`.
- Phase 7A `AfterArtifactLinkage` optional persistence plumbing completed in `aff0a7f`.
- Phase 7B protected bridge answer endpoint completed in `27bf054`.
- Phase 7C/7D frontend helper and `/after` submit routing completed in `24e1b95`.
- Phase 7E live browser/network/DB smoke evidence recorded in `2cfaff1`.
- Public `/api/v1/answer` contract unchanged.
- Public `/api/v1/documents/draft` contract unchanged.
- SCN-004 fixed/free input/draft flow unchanged.

## 1. Purpose

- Bridge-origin After answer artifact linkage를 구현하기 전에 runtime linkage 정책을 고정한다.
- 기존 public `POST /api/v1/answer` contract를 변경하지 않는다.
- 기존 `POST /api/v1/documents/draft` contract를 변경하지 않는다.
- SCN-004 fixed/free input/draft flow를 보호한다.
- Phase 7 does not change the shipped Phase 6D frontend origin behavior; Bridge
  handoff submissions remain answer-only unless the user enters regular `/after`
  directly.
- Phase 7 MVP는 protected Bridge-origin answer endpoint와 single primary
  `source_bridge_run_id` 방식으로 설계한다.
- multi-bridge full provenance는 Post-MVP / future join table로 남긴다.

## 2. Source Review

이 문서는 아래 파일의 현재 구현 사실을 기준으로 작성한다.

| file | Phase 7 relevance |
|---|---|
| `AGENTS.md` | SCN-004 freeze, public contract, Web Storage 금지, Phase 7A~7E status |
| `CLAUDE.md` | SCN-001 protected path는 Firebase Bearer token, public answer/draft contract 유지 |
| `backend/CLAUDE.md` | Firebase uid / provider_subject 노출 금지, SCN-004 public endpoints 유지 |
| `frontend/CLAUDE.md` | Firebase session persistence, raw flow payload Web Storage 저장 금지 |
| `docs/planning/16_scn001_before_bridge_contract.md` | `BridgeOutputDTO`, raw `after_query_seed` persistence 금지, `after_artifact_runs` nullable linkage column |
| `docs/planning/17_firebase_auth_scn001_implementation_plan.md` | Phase 7 after_artifact_runs linkage phase, public endpoint guard |
| `docs/planning/18_scn001_firebase_auth_phase0_decisions.md` | Phase 7 gate, orphan artifact policy, raw seed policy |
| `docs/planning/19_scn001_auth_integration_status.md` | Phase 0~6 current status and Phase 7 open items |
| `docs/planning/20_scn001_bridge_after_handoff_plan.md` | displayed safe subset query construction and Phase 7 provenance open question |
| `docs/product/mvp_scope.md` | SCN-001 answer-only Minimum MVP and SCN-004 login-free draft flow |
| `backend/app/models/after_artifact_run.py` | nullable `user_id`, nullable `source_bridge_run_id`, indexes already exist |
| `backend/app/models/bridge_run.py` | `bridge_runs.user_id` required, `before_review_job_id` linkage exists |
| `backend/app/models/user.py` | internal `users.id` plus `auth_provider/provider_subject` unique mapping |
| `backend/app/routers/answer.py` | public answer route builds `AnswerResponse`, then calls `persist_answer_artifacts(payload, response)` |
| `backend/app/routers/scn001.py` | protected SCN-001 router has bridge-runs POST/GET and bridge-runs/{id}/answer |
| `backend/app/dependencies/auth.py` | `require_current_user` and optional auth dependency behavior |
| `backend/app/services/auth_service.py` | Firebase ID token verification and internal user upsert |
| `backend/app/schemas/answer.py` | current `AnswerRequest` / `AnswerResponse` public contract |
| `backend/app/schemas/bridge.py` | `BridgeRunResponse` includes safe Bridge fields and transient `after_query_seed` |
| `backend/app/services/answer_generation.py` | answer generation uses existing retrieval and grounded answer path |
| `backend/app/services/after_artifact_store.py` | answer/draft artifact persistence and `AfterArtifactRun` row insert |
| `backend/app/services/scn001_bridge_service.py` | ownership-checked bridge row lookup and safe Bridge response construction |
| `frontend/src/app/after/page.tsx` | current Bridge handoff submit routing and `answer_origin` assignment |
| `frontend/src/app/after/result/page.tsx` | `bridge_handoff` answers are answer-only and draft CTA is hidden |
| `frontend/src/lib/api.ts` | public `fetchAnswer` and `fetchDraft` attach no `Authorization` header |
| `frontend/src/lib/auth-api.ts` | auth/me helper attaches Bearer token only when explicitly given |
| `frontend/src/lib/bridge-api.ts` | protected bridge run helper attaches Firebase Bearer token |
| `frontend/src/lib/bridge-handoff.ts` | builds query from displayed safe subset, not raw `after_query_seed` |
| `frontend/src/types/api.ts` | frontend `AnswerRequest` / `AnswerResponse` and draft types |
| `frontend/src/types/bridge-api.ts` | current Bridge API response types |
| `frontend/src/types/bridge-handoff.ts` | memory-only Bridge handoff item shape |
| `frontend/src/context/AuthContext.tsx` | Firebase Auth uses memory-oriented flow and backend verification |
| `frontend/src/context/FlowContext.tsx` | After flow and Bridge handoff state are React memory state |

## 3. Phase 7 Scope

Phase 7 includes:

- Bridge-origin After answer artifact linkage.
- Protected Bridge-origin answer endpoint.
- Runtime population of `after_artifact_runs.user_id`.
- Runtime population of `after_artifact_runs.source_bridge_run_id`.
- Single primary `source_bridge_run_id` provenance policy.
- Frontend submit routing from included Bridge context to the new protected endpoint.

Phase 7 excludes:

- Changing public `POST /api/v1/answer`.
- Changing public `POST /api/v1/documents/draft`.
- Changing SCN-004 fixed/free input/draft behavior.
- Changing the shipped Phase 6D frontend origin behavior; Bridge handoff
  submissions remain answer-only unless the user enters regular `/after`
  directly.
- SCN-001 document draft.
- Draft artifact linkage for SCN-001.
- DB migration or schema expansion.
- `source_bridge_run_ids` JSON/list.
- multi-bridge join table implementation.
- artifact retrieval UI/API, retention, deletion, or account history.

Phase 7 is answer-only linkage. Existing nullable DB columns are enough for MVP:

- `after_artifact_runs.user_id`
- `after_artifact_runs.source_bridge_run_id`

## 4. Current Implementation Facts to Preserve

- Public `POST /api/v1/answer` currently validates/strips `AnswerRequest.query`,
  calls `answer_question(query, top_k, ef_search)`, builds `AnswerResponse`, and then
  calls `persist_answer_artifacts(payload, response_payload)`.
- `persist_answer_artifacts` currently writes:
  - `user_statement.txt`
  - `answer_request.json`
  - `answer_response.json`
  - one `after_artifact_runs` row
- Public `persist_answer_artifacts` calls insert `after_artifact_runs` rows with
  nullable `user_id` and nullable `source_bridge_run_id` left `null`.
- Phase 7A added optional `AfterArtifactLinkage` so protected bridge answer can
  populate `user_id` and `source_bridge_run_id`.
- `AfterArtifactRun` already has nullable `user_id` and `source_bridge_run_id`
  columns plus indexes.
- `BridgeRun` already has required `user_id` and `before_review_job_id` linkage for
  protected Bridge flow.
- Existing public answer artifacts should continue to be written with
  `user_id = null` and `source_bridge_run_id = null`.
- Phase 7A added linkage through optional persistence metadata, not by changing
  public `AnswerRequest` or public `AnswerResponse`.
- The protected bridge answer endpoint returns the same `AnswerResponse` shape
  without exposing artifact run id in MVP.

## 5. Recommended Endpoint Design

Phase 7B MVP endpoint:

```text
POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer
```

Request body is `AnswerRequest`-compatible:

```json
{
  "query": "string",
  "top_k": 10,
  "ef_search": 100
}
```

Response body is `AnswerResponse`-compatible:

```json
{
  "query": "string",
  "answer": "string",
  "key_points": ["string"],
  "cautions": ["string"],
  "cited_articles": ["string"],
  "grounded_context_ids": [1],
  "retrieved_chunks": [],
  "retrieval_total": 0,
  "model_name": "string"
}
```

Behavior:

- Firebase auth required.
- Use `require_current_user`.
- Resolve current internal `users.id` from Firebase ID token.
- Load `bridge_run_id`.
- Confirm `bridge_run.user_id == current_user.id`.
- Return 404 for not found or not owned.
- Reuse the existing answer generation path.
- Persist `after_artifact_runs.user_id = current_user.id`.
- Persist `after_artifact_runs.source_bridge_run_id = bridge_run_id`.
- Do not expose artifact run id in MVP.
- Do not expose `provider_subject`, Firebase uid, Google `sub`, email, or token.
- Do not require session cookies.
- Do not alter `/api/v1/answer`.
- Do not alter `/api/v1/documents/draft`.
- Do not enable SCN-001 document draft.

## 6. Why Not Extend `/api/v1/answer`

`POST /api/v1/answer` is the public/free answer contract.

Do not add `bridge_run_id`, auth semantics, optional bearer behavior, or provenance
fields to that public endpoint because:

- It would mix SCN-001 protected metadata into the public After contract.
- It would increase SCN-004 regression risk.
- It would make `fetchAnswer` auth behavior ambiguous.
- It would blur whether public answer calls should carry `Authorization`.
- It would make fixed/free SCN-004 paths harder to reason about.

Therefore Bridge-origin linked answer uses a separate protected SCN-001 endpoint.

## 7. Single Primary `source_bridge_run_id` Policy

MVP decision:

- Store exactly one primary bridge id in `after_artifact_runs.source_bridge_run_id`.
- The primary bridge id is the path parameter `bridge_run_id` used by:

```text
POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer
```

Primary `bridge_run_id` means the first included `BridgeHandoffItem` in frontend
insertion order, used only because the Phase 7 MVP stores a single FK.

Frontend multiple-card policy:

- Phase 7 MVP can send the first included `BridgeHandoffItem` in frontend insertion
  order as the primary bridge path parameter.
- The query may include displayed safe subset fields from multiple checked Bridge
  cards.
- DB provenance records only the primary bridge id.
- This is explicitly partial provenance.
- Full multi-bridge provenance requires a future join table.
- Phase 7 should not add `source_bridge_run_ids` JSON/list in MVP.
- Phase 7 should not add a join table in MVP.

Recommended MVP default:

- Allow multiple checked cards.
- Use the first included card as the primary bridge.
- Document partial provenance clearly.
- Preserve `answer_origin = "bridge_handoff"` for Bridge handoff screen
  submissions. Phase 7 attaches provenance only when included Bridge context uses
  the protected bridge answer endpoint.

Stricter alternative if implementation risk becomes high:

- Protected bridge answer endpoint can be called only when exactly one included
  Bridge context exists.
- Multiple included cards can either fall back to public `/api/v1/answer` without
  linkage or be blocked until Post-MVP provenance exists.
- If a fallback public answer is used from the Bridge handoff screen,
  `answer_origin` still remains `bridge_handoff`.
- This is not the recommended default for MVP because it weakens the Phase 6
  multiple-card UX, but it remains an acceptable risk-reduction fallback.

## 8. `after_query_seed` Preservation Rule

Phase 7 must preserve the Phase 6 decision:

- `after_query_seed` is a transient Bridge response field.
- `after_query_seed` must not be placed into `/api/v1/answer.query`.
- `after_query_seed` must not be placed into the protected bridge answer query.
- `after_query_seed` must not be persisted in answer artifacts.
- `after_query_seed` must not be stored in Web Storage.
- Bridge-origin answer query uses only the displayed safe subset plus user
  additional question.

Allowed displayed safe subset:

- `user_visible_summary`
- `issue_categories`
- `risk_tags`
- `law_refs`
- `recommended_next_actions`
- other already-visible safe fields added later after review

Forbidden in query:

- `after_query_seed`
- `bridge_run_id`
- `artifact_refs`
- internal ids
- `provider_subject`
- Firebase uid
- Google `sub`
- token
- raw OCR
- raw contract
- full Before result
- full `BeforeHandoffDTO`
- full `BridgeOutputDTO`

## 9. `after_artifact_store` / Persistence Design

Current implemented state:

- `after_artifact_store` already persists answer artifacts.
- `AfterArtifactRun` already has nullable `user_id` and nullable
  `source_bridge_run_id`.
- `_insert_run_row` accepts `user_id` and `source_bridge_run_id`.
- `persist_answer_artifacts` accepts optional `AfterArtifactLinkage`.
- Public `/api/v1/answer` calls `persist_answer_artifacts` without linkage.
- Protected bridge answer calls `persist_answer_artifacts` with current user and
  primary bridge id linkage.

Original design candidates:

| Option | Approach | Risk |
|---|---|---|
| A | Add optional linkage/context parameter to existing artifact persistence service | Recommended. Smallest change and preserves public null behavior |
| B | Add protected endpoint wrapper that calls answer generation then persistence with linkage | Recommended only with shared helper, not duplicated logic |
| C | Duplicate persistence logic in `scn001` router | Not recommended. Increases drift and SCN-004 regression risk |

Implemented design:

- Do not duplicate persistence logic.
- Optional linkage metadata parameter was added to the existing after artifact
  persistence path.
- Existing `/api/v1/answer` calls persistence with no linkage metadata.
- Protected bridge answer endpoint calls persistence with:
  - `user_id = current_user.id`
  - `source_bridge_run_id = bridge_run_id`
- Preserve existing artifact file shape unless necessary.
- Do not store raw `after_query_seed`.
- Answer artifact may store `request.query` as existing behavior; Phase 6 already
  ensures Bridge query uses displayed safe subset and excludes raw `after_query_seed`.
- Do not store token, `provider_subject`, Firebase uid, Google `sub`, or email in
  artifact metadata.

Possible service shape:

```python
@dataclass(frozen=True)
class AfterArtifactLinkage:
    user_id: str | None = None
    source_bridge_run_id: str | None = None

def persist_answer_artifacts(
    payload: AnswerRequest,
    response: AnswerResponse,
    *,
    linkage: AfterArtifactLinkage | None = None,
) -> str:
    ...
```

Implemented shared backend helper:

- validates `AnswerRequest.query`
- calls `answer_question()`
- builds `AnswerResponse`
- persists artifacts with optional linkage metadata
- centralizes answer error mapping

Both public `/api/v1/answer` and protected
`POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer` reuse
`generate_answer_response()` to avoid duplicating answer router logic.

Protected endpoint persistence policy:

- If answer generation fails, return the same answer error style as existing answer path.
- If ownership validation fails, do not generate answer and do not persist artifacts.
- If linked artifact persistence fails, the protected endpoint should return a
  503-style error rather than claiming provenance succeeded.
- Public `/api/v1/answer` should preserve its current behavior and contract.

## 10. Frontend Phase 7 Impact

Phase 7C/7D frontend protected helper and submit routing are implemented.
Checked Bridge handoff calls the protected endpoint, while all-unchecked Bridge
handoff keeps the public answer fallback.

Rules:

- Body remains `AnswerRequest`-compatible.
- Attach Firebase Bearer token only for the protected bridge answer endpoint.
- Do not change `fetchAnswer`.
- Do not change `fetchDraft`.
- Do not auto-attach `Authorization` to public `fetchAnswer`.
- Do not auto-attach `Authorization` to public `fetchDraft`.
- Direct `/after` remains public.
- SCN-004 fixed/free input remains unchanged.
- Bridge-origin result remains answer-only and draft disabled.
- Phase 7 does not change the Phase 6D frontend origin behavior:
  `answer_origin = "bridge_handoff"` stays sticky for Bridge handoff screen
  submissions.

Submit routing:

- If `answer_origin` is `bridge_handoff` and at least one primary included
  Bridge item exists, call:

```text
POST /api/v1/scn001/bridge-runs/{primary_bridge_run_id}/answer
```

- Use first included item in frontend insertion order as `primary_bridge_run_id`.
- Build `query` from checked Bridge cards using `buildBridgeContextQuery()`.
- Use `top_k=10`, `ef_search=100` for included Bridge context.
- Keep `answer_origin = "bridge_handoff"` for this protected linked path.

All-unchecked Bridge cards behavior:

- Option A, sticky Bridge origin, is the Phase 7 decision.
- If the user unchecks all Bridge cards, the query is the user additional
  question only.
- Phase 7 reuses the Phase 6D submit-disable guard: no included bridge context
  and empty/too-short user question cannot submit.
- The existing public `/api/v1/answer` path can be used through unchanged
  `fetchAnswer`.
- Do not attach `Authorization`.
- Do not attach `AfterArtifactLinkage`.
- `after_artifact_runs.user_id` and `after_artifact_runs.source_bridge_run_id`
  remain `null`, or follow existing public answer behavior.
- Keep `answer_origin = "bridge_handoff"` because the submission came from the
  Bridge handoff screen.
- The result remains answer-only and the draft CTA remains hidden per the Phase
  6D guard.
- Users who want regular After/draft behavior must enter direct `/after` or
  reset and re-enter the After flow.
- This matches `docs/planning/19_scn001_auth_integration_status.md` Phase 6D
  status and the D-016 SCN-001 answer-only MVP principle.
- Phase 7 does not change this frontend origin behavior.

## 11. Ownership / Error Handling

Endpoint errors:

| Case | Recommended status | Notes |
|---|---:|---|
| Missing Firebase token | 401 | `WWW-Authenticate: Bearer` through existing auth dependency |
| Malformed `Authorization` header | 401 | Do not treat invalid auth as anonymous |
| Invalid/expired Firebase ID token | 401 | No raw token detail in response |
| `bridge_run_id` not found | 404 | Avoid existence leak |
| `bridge_run_id` owned by another user | 404 | Avoid existence leak |
| Bridge row incomplete/non-ready flow state | 409 | Valid row exists but the flow state is not ready for linked answer generation |
| Bridge row corrupt/invalid stored payload | 422 | Stored Bridge state cannot support linked answer generation |
| Blank answer query | 422 | Same validation semantics as public answer |
| Answer provider timeout | 503 | Existing retryable provider timeout style |
| Retrieval / answer DB unavailable | 503 | Existing answer service unavailable style |
| Linked artifact persistence failure | 503 | Protected linkage cannot be claimed if persistence failed |

Raw backend detail should not leak sensitive information.

## 12. Privacy / Security Guard

Phase 7 must preserve:

- No `provider_subject` in response.
- No Firebase uid in response.
- No Google `sub` in response.
- No email in Bridge answer response.
- No token in response, logs, artifacts, or Web Storage.
- No `Authorization` on public `fetchAnswer`.
- No `Authorization` on public `fetchDraft`.
- No Web Storage for Bridge handoff or raw flow payloads.
- No URL query handoff for raw seed or Bridge payload.
- No raw `after_query_seed` in answer query.
- No raw `after_query_seed` persistent storage.
- No raw OCR.
- No raw contract.
- No full Before result.
- Only displayed safe subset enters query.
- `source_bridge_run_id` is internal DB provenance, not user-visible UI text.
- `이번 질문에서 제외` remains memory-only and does not delete rows or artifacts.
- Protected endpoint verifies Bridge ownership before answer generation and artifact linkage.

## 13. SCN-004 Freeze Guard

Phase 7 must preserve:

- `/api/v1/answer` unchanged.
- `/api/v1/documents/draft` unchanged.
- `SCN-004-DEMO-FREEZE` exact fixed answer path unchanged.
- SCN-004 modified/free input unchanged.
- SCN-004 draft eligibility unchanged.
- No Firebase auth required for public SCN-004 routes.
- No `Authorization` auto-attach to `fetchAnswer`.
- No `Authorization` auto-attach to `fetchDraft`.
- Presentation preset exact path still uses fixed answer fixture and does not call
  `/api/v1/answer`.
- Public answer artifacts continue to write `user_id = null` and
  `source_bridge_run_id = null`.

## 14. Implementation Slices

### Phase 7A. Backend shared answer execution / persistence plumbing

Status: 완료 (`aff0a7f`)

- Add optional linkage metadata to after artifact persistence path.
- If needed, extract shared answer execution helper to avoid duplicating answer
  router logic.
- Keep existing `/api/v1/answer` behavior unchanged with null linkage.
- Do not change `AnswerRequest` or `AnswerResponse`.

### Phase 7B. Protected bridge answer endpoint

Status: 완료 (`27bf054`)

- Add `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`.
- Require Firebase auth.
- Check bridge ownership.
- Reuse answer generation/persistence helper.
- Return `AnswerResponse`.
- Persist `after_artifact_runs.user_id`.
- Persist `after_artifact_runs.source_bridge_run_id`.

### Phase 7C. Frontend client helper

Status: 완료

- Add `fetchBridgeAnswer` or equivalent.
- Attach Firebase ID token only for this protected endpoint.
- Request body remains `AnswerRequest`-compatible.
- Preserve `fetchAnswer` and `fetchDraft` public behavior.

### Phase 7D. `/after` submit routing

Status: 완료

- Checked Bridge context -> protected bridge answer endpoint with primary bridge id.
- No included Bridge context -> public `fetchAnswer`, no linkage metadata, and
  sticky `answer_origin = "bridge_handoff"`.
- Preserve Bridge-origin answer-only behavior for all Bridge handoff screen
  submissions.
- Preserve SCN-004 fixed/free input behavior.

### Phase 7E. Verification

Status: PASS

2026-04-24 live browser/network/DB smoke passed. Sanitized evidence is recorded in
`docs/planning/19_scn001_auth_integration_status.md`.

- Public `/api/v1/answer` still works without auth.
- Public `/api/v1/answer` artifact rows keep `user_id = null` and
  `source_bridge_run_id = null`.
- SCN-004 exact fixed path still makes no `/api/v1/answer` call.
- SCN-004 modified/free input still calls public `/api/v1/answer`.
- Protected Bridge answer writes `after_artifact_runs.user_id` and
  `source_bridge_run_id`.
- Unauthorized/missing token returns 401.
- Other-user `bridge_run_id` returns 404.
- multi-bridge primary behavior works as documented.
- all-unchecked handoff uses public answer without linkage while preserving
  sticky `bridge_handoff` origin as documented.
- raw seed is not persisted.

## 15. Verification Plan

Phase 7E verification covered:

- Backend route smoke for `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`.
- Missing token -> 401.
- Invalid token -> 401.
- Other-user bridge -> 404.
- Public `/api/v1/answer` no auth still succeeds.
- Public `/api/v1/documents/draft` no auth still succeeds.
- Public answer artifact row has null `user_id` and null `source_bridge_run_id`.
- Protected Bridge answer artifact row has current internal `user_id` and primary
  `source_bridge_run_id`.
- `fetchAnswer` request has no `Authorization`.
- `fetchDraft` request has no `Authorization`.
- Protected Bridge answer request has `Authorization`.
- Checked multiple cards use first included item as primary bridge.
- All unchecked cards reuse the Phase 6D submit-disable guard for empty/too-short
  user question, call public `fetchAnswer` when a valid user question exists, and
  keep `answer_origin = "bridge_handoff"`.
- Query contains displayed safe subset only.
- Query excludes `after_query_seed`, Bridge ids, artifact refs, raw OCR, raw contract,
  provider identifiers, and token-like values.
- `bash scripts/demo_preflight.sh` PASS was recorded with Phase 7E evidence.

For this doc-only task:

- Do not run server.
- Do not run build.
- Do not run eval.
- Check this file with `rg`.
- Check diff with `git diff -- docs/planning/21_scn001_phase7_after_artifact_linkage_plan.md`.
- Check status with `git status --short`.
- Check whitespace with `git diff --check`.

## 16. Open Questions

- Should `AnswerResponse` expose artifact/run id in future?
- Should `after_artifact_runs` support many-to-many provenance later via join table?
- Should provider_timeout retry/backoff be handled as separate runtime hardening?
- If multiple checked cards are included, should the result page display partial
  provenance warning?
- Should `source_bridge_run_id` ever be shown in UI?
  - Recommended: no.
- How should artifact access control work when artifact retrieval UI/API is added
  later?

Related but out of Phase 7:

- Firebase SDK persistence/browser internal storage documentation.
- stuck `before_review_jobs` cleanup/timeout policy.
- artifact retention/deletion policy.
- SCN-001 document draft support.

## 17. Do Not

- Do not extend `/api/v1/answer` request with `bridge_run_id`.
- Do not add `source_bridge_run_ids` JSON/list in MVP.
- Do not add join table in MVP.
- Do not enable SCN-001 document draft.
- Do not change SCN-004 draft behavior.
- Do not store raw `after_query_seed`.
- Do not put Firebase uid, `provider_subject`, Google `sub`, email, or token in
  artifacts.
- Do not use Web Storage.
- Do not put `bridge_run_id` in URL query.
- Do not make `이번 질문에서 제외` delete anything.
- Do not auto-attach `Authorization` to public `fetchAnswer`.
- Do not auto-attach `Authorization` to public `fetchDraft`.
- Do not duplicate answer generation/persistence logic across routers if a shared
  helper can avoid it.
