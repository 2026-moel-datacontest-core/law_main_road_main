# SCN-001 Phase 6 Bridge -> After Answer-only Handoff Plan

기준일: `2026-04-23`

이 문서는 Phase 6 구현 전에 Bridge -> After handoff 방식을 확정하기 위한 설계 문서다. 코드 수정, env 수정, DB/migration 수정, git add/commit, 서버 실행, build, eval은 이 문서 범위가 아니다.

## 1. Purpose

- SCN-001 Bridge -> After answer-only handoff를 구현하기 전에 UX와 data boundary를 고정한다.
- 사용자가 Bridge/Before 문맥을 이번 After 질문에 포함할지 직접 선택하는 consent-based bridge context inclusion 모델을 채택한다.
- 단일 Bridge뿐 아니라 향후 여러 Before 문서 / 여러 Bridge context가 들어오는 multiple bridge contexts 모델과 호환되게 설계한다.
- `/api/v1/answer` contract를 변경하지 않는다.
- `/api/v1/documents/draft` contract를 변경하지 않는다.
- SCN-004 demo freeze와 public answer/draft contract를 보호한다.

## 2. Source Review

이 문서는 아래 파일의 현재 상태를 기준으로 작성한다.

| file | relevance |
|---|---|
| `AGENTS.md` | SCN-004 freeze, public contract, Web Storage 금지, preferred task flow |
| `CLAUDE.md` | project-wide SCN-001/SCN-004 scope, auth/privacy guard |
| `frontend/CLAUDE.md` | frontend memory state, SCN-004 login-free, preset policy |
| `backend/CLAUDE.md` | backend public API contract, document draft guard, raw seed persistence 금지 |
| `docs/planning/16_scn001_before_bridge_contract.md` | `BeforeHandoffDTO`, `BridgeOutputDTO`, `after_query_seed` boundary |
| `docs/planning/17_firebase_auth_scn001_implementation_plan.md` | Phase 6 location, auth path, public endpoint guard |
| `docs/planning/18_scn001_firebase_auth_phase0_decisions.md` | raw seed persistence decision, phase gates |
| `docs/planning/19_scn001_auth_integration_status.md` | Phase 0~5 current status and Phase 6 next step |
| `docs/product/bridge_flow.md` | Bridge product role and storage principles |
| `docs/product/before_flow.md` | Before output and minimum handoff summary goal |
| `docs/product/mvp_scope.md` | Minimum MVP answer-only SCN-001 linkage and SCN-004 freeze |
| `frontend/src/context/FlowContext.tsx` | current React memory-only After flow state |
| `frontend/src/app/after/page.tsx` | current After query form, preset, `fetchAnswer` call |
| `frontend/src/app/after/result/page.tsx` | current `supportsDraft` / SCN-004 draft guard behavior |
| `frontend/src/lib/api.ts` | current `fetchAnswer`, `fetchDraft`, case intake/legal basis builders |
| `frontend/src/lib/scenarioPresets.ts` | `SCN-001-BRIDGE-DEMO`, `SCN-004-DEMO-FREEZE`, `recommendedTopK`, `supportsDraft` |
| `frontend/src/types/flow.ts` | current `KLaborShieldFlowState` and reducer actions |
| `frontend/src/types/api.ts` | current `/api/v1/answer` and `/api/v1/documents/draft` frontend types |
| `backend/app/routers/scn001.py` | implemented protected bridge-runs POST/GET |
| `backend/app/schemas/bridge.py` | implemented `BridgeOutputDTO` including transient `after_query_seed` |
| `backend/app/services/scn001_bridge_service.py` | POST returns transient seed, GET returns `after_query_seed=None` |
| `backend/app/routers/answer.py` | public answer endpoint and artifact persistence boundary |
| `backend/app/schemas/answer.py` | current `AnswerRequest` / `AnswerResponse` contract |

## 3. Current Baseline

- Phase 0~5 are complete in the current status checkpoint.
- Phase 4 protected bridge-runs endpoint exists:
  - `POST /api/v1/scn001/bridge-runs` requires Bearer Firebase ID token.
  - Request body accepts only `before_review_job_id`.
  - Server stores `source_scenario = "before_review"` and `preset_id = null`.
  - POST response returns safe `BridgeRunResponse` with transient `after_query_seed`.
  - GET `/api/v1/scn001/bridge-runs/{bridge_run_id}` keeps `after_query_seed=None`.
- Phase 5 Before job optional auth linkage exists:
  - valid Bearer token links new Before jobs to internal `users.id`;
  - missing token keeps anonymous `user_id = null`;
  - invalid token returns 401.
- `/api/v1/answer` currently accepts only:
  ```ts
  {
    query: string;
    top_k: number;
    ef_search: number;
  }
  ```
- `/api/v1/documents/draft` remains SCN-004-oriented and receives only `case_intake` plus answer-derived `legal_basis`.
- Current frontend After flow uses React Context + `useReducer` memory state only.
- `SCN-001-BRIDGE-DEMO` is a presentation-only answer preset with `supportsDraft=false`; it is not a real Bridge handoff.
- `SCN-004-DEMO-FREEZE` is the main demo/document draft freeze path and must stay unchanged.

## 4. Phase 6 Scope

Phase 6 includes:

- Bridge -> After answer-only handoff.
- `/after` UI for Bridge handoff entry.
- User consent control for including Bridge context in the current After query.
- Frontend query construction using safe Bridge handoff fields and the user's additional question.
- Existing `fetchAnswer` live answer path integration.
- One-card implementation is acceptable for the first patch, but type/state/query builder naming must support multiple cards.

Phase 6 excludes:

- SCN-001 document draft.
- `after_artifact_runs` runtime linkage.
- `after_artifact_runs.source_bridge_run_id` assignment.
- independent `/bridge` route.
- `/api/v1/answer` request/response changes.
- `/api/v1/documents/draft` request/response changes.
- DB columns or migrations.
- new backend endpoints by default.
- artifact retention, deletion, or access-control policy implementation.
- retroactive linking of anonymous/orphan Before jobs.

## 5. Recommended UX

### Bridge handoff entry to `/after`

When the user enters `/after` from a real Bridge handoff:

- Show read-only Before/Bridge summary card(s).
- Show an include checkbox on each card: `이 검토 요약을 이번 질문에 포함`.
- Default checkbox state: checked.
- Show an additional question textarea.
- Submit button text: `이 내용으로 조문 찾기`.
- Allow a card-level action such as `이번 질문에서 제외`.

The summary card must be safe-field only:

- `user_visible_summary`
- `issue_categories`
- `risk_tags`
- `law_refs`
- `recommended_next_actions`
- a user-visible indication that this is a Before/Bridge summary

The summary card must not expose:

- raw contract
- raw OCR
- full Before result
- full `BeforeHandoffDTO`
- full `BridgeOutputDTO`
- Firebase uid, Google `sub`, `provider_subject`, token, or email

### Regular direct `/after`

When the user enters `/after` directly:

- no Bridge summary card
- no include checkbox
- existing free input behavior unchanged
- existing preset row behavior unchanged
- existing submit button may remain `법 조문 찾기`

### SCN-004 path

SCN-004 behavior remains unchanged:

- no Bridge summary card
- `SCN-004-DEMO-FREEZE` exact preset fixed answer path unchanged
- SCN-004 free input behavior unchanged
- SCN-004 document draft guard unchanged
- `supportsDraft` behavior unchanged
- `/after/result`, `/after/intake`, `/after/draft` login-free behavior unchanged

## 6. Consent-based Context Inclusion

Phase 6 adopts consent-based bridge context inclusion.

If the checkbox is checked:

- Frontend combines safe Bridge context and user additional question.
- Frontend sends the combined text as the existing `/api/v1/answer` `query`.
- Empty additional question behavior follows the Phase 6 open behavior in Section 9 and Open Questions in Section 17.
  - Recommended default candidate: allow a summary-only query when at least one checked item exists.
  - Recommended default candidate: disable submit when no checked item exists and the additional question is empty.

If the checkbox is unchecked:

- Frontend sends only the user additional question as the existing `/api/v1/answer` `query`.

Checked is the recommended default because:

- Bridge handoff entry strongly implies the user wants to ask based on the prior Before/Bridge review.
- The summary card makes the included context visible before submission.
- The user can still uncheck the box before sending.

Consent requirements:

- The user must be able to see that Bridge context may be included.
- The include checkbox must be directly associated with the visible summary card.
- Context inclusion uses only user-visible safe summary fields displayed on the card.
- `after_query_seed` remains a Phase 4 transient response field, but Phase 6D must not place it in `/api/v1/answer.query` because the answer artifact path can persist the query.
- raw contract, OCR full text, full Before result, full DTO payloads, and internal auth identifiers are not used.

## 7. Frontend Memory State

Use React memory state only. Web Storage is forbidden for the handoff payload.

Recommended shape:

```ts
type BridgeHandoffItem = {
  bridge_run_id: string;
  scenario_id: "SCN-001";
  user_visible_summary: string;
  issue_categories: string[];
  risk_tags: string[];
  law_refs: string[];
  recommended_next_actions: string[];
  after_query_seed: string | null;
  include_in_query: boolean;
};

type BridgeHandoffState = {
  items: BridgeHandoffItem[];
};
```

Rules:

- `BridgeHandoffState` is kept in frontend memory only.
- `localStorage` must not store `BridgeHandoffState`.
- `sessionStorage` must not store `BridgeHandoffState`.
- URL query params must not contain raw `after_query_seed`.
- DB must not persist raw `after_query_seed`.
- Browser storage must not store raw `user_statement`, `answer_response`, `case_intake`, or `draft_response`.
- Browser storage must not store raw Before review result, OCR output, raw contract, full `BeforeHandoffDTO`, or full `BridgeOutputDTO`.
- Handoff state/query/card must not contain token, Firebase uid, Google `sub`, `provider_subject`, or email.
- Refresh/reload losing handoff state is acceptable for MVP.
- Missing handoff state degrades to regular `/after` free input.

Existing FlowContext note:

- Current `FlowContext` memory state already holds `user_statement`, `answer_response`, `case_intake`, and `draft_response` for the existing After flow.
- That is allowed because it is memory-only.
- The restriction is against Web Storage, URL params, persistent storage, and logs containing raw payloads.

Open implementation choice:

- Put `BridgeHandoffState` in existing `FlowContext` or create a dedicated `Scn001HandoffContext`.
- Either option must preserve existing SCN-004 reducer actions and behavior.

## 8. Multi-bridge / Multi-document Handling

The design treats each Bridge context as one safe Bridge handoff item.

Rules for multiple items:

- `/after` can render multiple read-only summary cards.
- Each card owns its own `include_in_query` checkbox.
- Each card can have `이번 질문에서 제외` action.
- `이번 질문에서 제외` removes the card only from current frontend memory handoff state.
- This exclude action does not delete uploaded documents.
- This exclude action does not delete OCR artifacts.
- This exclude action does not delete `before_review_jobs`.
- This exclude action does not delete Before result artifacts.
- This exclude action does not delete `bridge_runs` rows.
- Actual retention, deletion, access-control, and artifact lifecycle policy is outside Phase 6.
- If no cards are checked, the query builder sends only the user additional question.
- If multiple cards are checked, checked safe bridge contexts are combined in stable order, then the user additional question is appended.
- Stable order should be current `items` array order, defined as frontend handoff insertion order.
- Future work may revisit `created_at` or user-controlled ordering.
- Phase 6 may start with one-card rendering, but names like `BridgeHandoffItem[]`, `items`, and `buildBridgeContextQuery()` must not block multiple cards later.

Phase 7 open question:

- If multiple Bridge contexts are included in one After answer, provenance must be designed separately.
- Options include primary `source_bridge_run_id`, `source_bridge_run_ids` list/JSON, or an `after_artifact_run_bridge_runs` join table.

## 9. Query Construction

Candidate function:

```ts
function buildBridgeContextQuery(
  bridgeHandoffItems: BridgeHandoffItem[],
  userAdditionalQuestion: string,
): string;
```

Checked item output shape:

```text
[Before 검토 요약 1]
...

[주요 쟁점]
- ...

[관련 법령 후보]
- ...

[Before 검토 요약 2]
...

[주요 쟁점]
- ...

[관련 법령 후보]
- ...

[사용자 추가 질문]
...
```

Unchecked or no checked cards:

```text
사용자 추가 질문만 보낸다.
```

Construction rules:

- Build Bridge context only from displayed safe fields:
  - `user_visible_summary`
  - `issue_categories`
  - `risk_tags`
  - `law_refs`
  - `recommended_next_actions`
- Phase 6D query builder uses the same displayed subset as the summary card: issue labels max 4, law refs max 5, next actions max 3; `risk_tags` are only used as issue fallback when `issue_categories` is empty.
- Do not include `after_query_seed` in the query text, even when it is present in memory.
- Reason: `/api/v1/answer.query` can be saved as a persistent answer artifact, so raw transient seed text must not enter that path.
- Do not include `bridge_run_id` in the query text.
- Do not include `artifact_refs` in the query text.
- Do not include internal ids in the query text.
- Do not include token, Firebase uid, Google `sub`, `provider_subject`, or email in the query text.
- Keep Bridge context safe-summary centered.
- Apply a max length guard before calling `fetchAnswer`.
- Initial guard recommendation:
  - clip each card context section to about 900 characters;
  - clip total Bridge context to about 2500 characters;
  - clip final combined query to about 3500 characters.
- Exact clipping policy and user-visible warning are open questions, but clipping must happen before request submission.

Open behavior:

- Whether to allow a summary-only query when `userAdditionalQuestion` is empty and at least one checked card exists remains open.
- Recommended default candidate: allow summary-only query when at least one checked item exists.
- Recommended default candidate: disable submit when no checked item exists and the additional question is empty.
- Until decided, the safer UI copy should encourage the user to add a short question, even if checked context exists.

## 10. API Call Policy

Phase 6 uses existing `fetchAnswer` only.

Request shape unchanged:

```ts
fetchAnswer({
  query,
  top_k,
  ef_search: 100,
});
```

Recommended retrieval params:

| path | `top_k` | `ef_search` | note |
|---|---:|---:|---|
| Bridge handoff live path | 10 | 100 | SCN-001 Bridge context can include multiple issues |
| regular free input | 5 | 100 | existing default |
| SCN-004 preset path | unchanged | unchanged | `SCN-004-DEMO-FREEZE` exact path remains fixed answer |

Rules:

- Real Bridge handoff uses live answer path.
- Real Bridge handoff must use `selected_preset_id = null`.
- Real Bridge handoff must not set `selected_preset_id` to `SCN-001-BRIDGE-DEMO`.
- `SCN-001-BRIDGE-DEMO` is presentation-only, answer-only, and not a real Bridge handoff.
- `top_k=10` is the recommended Phase 6 Bridge handoff default because SCN-001 Bridge context may contain multiple legal issues.
- Revisit `top_k=10` after answer quality smoke if retrieval quality or noise becomes a problem.
- `/api/v1/answer` contract remains unchanged.

## 11. Backend Impact

Phase 6 does not add backend endpoints by default.

Current backend baseline:

- `POST /api/v1/scn001/bridge-runs` returns transient `after_query_seed`.
- `GET /api/v1/scn001/bridge-runs/{bridge_run_id}` returns `after_query_seed=None`.
- `bridge_runs` stores safe summary fields and `after_query_seed_hash`, not raw seed.
- `/api/v1/answer` remains public and unchanged.
- `/api/v1/documents/draft` remains public and unchanged.

Phase 6 backend non-goals:

- no new DB columns
- no migrations
- no raw `after_query_seed` persistent storage
- no `/api/v1/answer` schema expansion
- no `/api/v1/documents/draft` schema expansion
- no SCN-001 document draft activation
- no `after_artifact_runs.source_bridge_run_id` runtime linkage

Phase 7 must decide how answer artifacts receive source Bridge provenance:

- single primary `source_bridge_run_id`;
- `source_bridge_run_ids` JSON/list;
- join table such as `after_artifact_run_bridge_runs`.

## 12. UI Flow

Recommended flow:

1. Logged-in user creates a linked Before review job.
2. Frontend creates a protected bridge run via `POST /api/v1/scn001/bridge-runs`.
3. Frontend receives safe `BridgeOutputDTO` with transient `after_query_seed`.
4. Frontend maps the response into minimal `BridgeHandoffState` in memory.
5. User clicks `After에서 조문 찾기`.
6. `/after` shows summary card(s), include checkbox(es), and additional question textarea.
7. User can uncheck context inclusion.
8. User can choose `이번 질문에서 제외` for a card.
9. User submits.
10. Frontend builds query based on checked cards.
11. Frontend calls `/api/v1/answer` through existing `fetchAnswer`.
12. `/after/result` treats the answer as Bridge-origin answer-only state.
13. Draft remains disabled for SCN-001 unless a future scope explicitly enables it.

The Phase 6D query builder uses only displayed safe fields. It must not pass transient `after_query_seed` into `/api/v1/answer.query`.

## 13. Privacy / Security Guard

- No Web Storage for handoff payload.
- No `localStorage` for handoff payload.
- No `sessionStorage` for handoff payload.
- No raw seed in URL.
- No raw seed persistent storage.
- No full DTO in browser storage.
- No token, Firebase uid, Google `sub`, `provider_subject`, or email in handoff card/query/state.
- No raw OCR.
- No raw contract.
- No raw full Before result.
- User can uncheck inclusion.
- Summary card is read-only and safe-field only.
- `이번 질문에서 제외` is not deletion.
- Actual retention, deletion, and access-control are outside Phase 6.
- Logs should use hashes or internal operational ids, not raw query seed or personal identifiers.

## 14. SCN-004 Freeze Guard

Phase 6 must preserve:

- direct `/after` entry unchanged
- `SCN-004-DEMO-FREEZE` exact preset fixed answer path unchanged
- SCN-004 free input behavior unchanged
- SCN-004 document draft guard unchanged
- `supportsDraft` behavior unchanged
- Bridge-origin answers are answer-only and force draft flow disabled.
- `/api/v1/answer` request/response unchanged
- `/api/v1/documents/draft` request/response unchanged
- SCN-004 public/login-free behavior unchanged
- `SCN-001-BRIDGE-DEMO` answer-only behavior unchanged
- `SCN-001-BRIDGE-DEMO` must not open SCN-004 document draft UI
- FlowContext changes, if any, must not alter existing SCN-004 actions/behavior

Risk controls:

- Real Bridge handoff uses `selected_preset_id = null`.
- Existing presentation presets remain presentation-local.
- Bridge summary cards render only when memory handoff state exists.
- Missing handoff state degrades to regular `/after`.
- Draft flow remains guarded by existing answer grounding and SCN-004 document eligibility, plus Bridge-origin answer-only scope.

## 15. Implementation Slices

Keep Phase 6 in small patches.

### 6A. Frontend type/state

- Add `BridgeHandoffItem` and `BridgeHandoffState`.
- Decide FlowContext extension vs dedicated `Scn001HandoffContext`.
- Keep state memory-only.

### 6B. Bridge run client helper

- Add frontend helper for `POST /api/v1/scn001/bridge-runs`.
- Attach Bearer Firebase ID token only for this protected SCN-001 API.
- Do not alter `fetchAnswer`.

### 6C. Before result UI action

- Add action to create bridge run and navigate to `/after`.
- Exact button location remains open; default candidate is a bottom CTA in the Before result/summary area.
- On success, store minimal `BridgeHandoffState` in memory.

### 6D. `/after` summary card and query builder

- Render summary card(s) only when handoff state exists.
- Add include checkbox(es), default checked.
- Add `이번 질문에서 제외`.
- Implement `buildBridgeContextQuery()`.
- Use `top_k=10`, `ef_search=100` for Bridge handoff live answer path.

### 6E. Answer-only result integration

- Call existing `fetchAnswer`.
- Store answer in existing memory state.
- Route to `/after/result`.
- Keep SCN-001 draft disabled.

### 6F. E2E smoke

- logged-in Before job -> bridge run -> `/after` checked query -> answer result
- unchecked query sends user question only
- multiple checked cards combine in stable order
- excluded card is removed only from current handoff state
- direct `/after` unchanged
- `SCN-004-DEMO-FREEZE` unchanged
- `SCN-001-BRIDGE-DEMO` remains answer-only

## 16. Acceptance Criteria

- Real Bridge handoff can reach `/after` without using Web Storage.
- The user sees safe Bridge summary before submission.
- The include checkbox is checked by default for Bridge handoff entry.
- Unchecking the checkbox sends only the user additional question.
- Checked context sends displayed safe Bridge context plus user additional question as `/api/v1/answer.query`.
- Checked context does not send `after_query_seed`, `bridge_run_id`, `artifact_refs`, or internal ids as `/api/v1/answer.query`.
- Multiple checked cards can be combined in stable order.
- `이번 질문에서 제외` affects only current memory handoff state.
- Existing direct `/after` free input works unchanged.
- `SCN-004-DEMO-FREEZE` exact preset path works unchanged.
- `SCN-004` document draft guard works unchanged.
- `SCN-001-BRIDGE-DEMO` remains presentation-only and answer-only.
- No `/api/v1/answer` contract change.
- No `/api/v1/documents/draft` contract change.
- No DB/migration change.

## 17. Open Questions

- Before result UI에서 handoff button 위치.
- `BridgeHandoffState`를 `FlowContext`에 둘지 dedicated `Scn001HandoffContext`에 둘지.
- `after_query_seed`를 navigation 직후 한 번 consume할지, back navigation에서는 유지할지.
- user additional question이 empty일 때 checked summary-only query를 허용할지. Recommended default candidate: checked item이 1개 이상이면 summary-only query 허용, checked item이 0개이고 추가 질문도 비었으면 submit disabled.
- failed bridge creation UX.
- Phase 7에서 `source_bridge_run_id`를 answer artifact에 어떻게 전달할지.
- multiple bridge contexts가 하나의 After answer에 포함될 때 provenance 표현 방식:
  - primary `source_bridge_run_id`
  - `source_bridge_run_ids` list/JSON
  - `after_artifact_run_bridge_runs` join table
- answer result 화면에 `Bridge context included` 표시 여부.
- multiple cards의 default checked 정책:
  - all checked by default
  - most recent checked only
  - user must explicitly check
- max number of bridge cards allowed in one answer query.
- clipping policy and user-visible warning when bridge context is clipped.

## 18. Do Not

- Do not extend `/api/v1/answer` contract.
- Do not extend `/api/v1/documents/draft` contract.
- Do not activate SCN-001 document draft.
- Do not change SCN-004 flow.
- Do not store handoff payload in Web Storage.
- Do not store handoff payload in `localStorage`.
- Do not store handoff payload in `sessionStorage`.
- Do not put raw seed in URL query params.
- Do not persist raw seed in DB.
- Do not force an independent `/bridge` route.
- Do not implement retroactive linking.
- Do not use `selected_preset_id = "SCN-001-BRIDGE-DEMO"` for real handoff.
- Do not treat `SCN-001-BRIDGE-DEMO` as a real bridge run.
- Do not implement `이번 질문에서 제외` as source document, Before result, or `bridge_runs` deletion.
- Do not implement artifact retention, deletion, or access-control policy in Phase 6.

## 19. Verification Plan for Phase 6 Implementation

For this doc-only planning task:

- inspect this file with `rg`;
- inspect the diff;
- inspect git status.

For future Phase 6 implementation, focused smoke should cover:

- checked Bridge handoff sends combined query with `top_k=10`, `ef_search=100`;
- checked Bridge handoff query includes displayed safe fields and excludes `after_query_seed`;
- unchecked Bridge handoff sends user question only;
- Bridge-origin answer state disables `/after/result` document type selection and draft navigation;
- direct `/after` sends regular free input with `top_k=5`, `ef_search=100`;
- `SCN-004-DEMO-FREEZE` exact preset still uses fixed answer fixture;
- `SCN-001-BRIDGE-DEMO` remains answer-only with `supportsDraft=false`;
- `/api/v1/answer` and `/api/v1/documents/draft` schemas remain unchanged;
- SCN-004 document draft guard remains unchanged.
