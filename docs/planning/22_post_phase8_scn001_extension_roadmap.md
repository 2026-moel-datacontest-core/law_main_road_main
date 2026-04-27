# Post-Phase 8 SCN-001 Extension Roadmap

기준일: `2026-04-27`

이 문서는 Phase 8 이후 후속 작업 후보와 현재 완료 상태를 작고 안전한
순서로 정리하는 post-Phase 8 roadmap이다.

구현 확정 설계가 아니며, API schema, DB schema, frontend route, document
template 세부사항을 확정하지 않는다. 각 step은 착수 전에 별도 코드/문서
검토와 SCN-004 freeze regression 기준을 다시 확인해야 한다.

## 1. Purpose

- Phase 8 이후 SCN-001 확장 후보를 작은 단위의 sequencing roadmap으로
  정리한다.
- SCN-004 main demo freeze를 유지하면서 후속 작업의 안전한 순서를 제안한다.
- Phase 7/8 evidence/status 문서를 다시 고치지 않고, 다음 후보의 우선순위와
  guardrail만 별도 문서로 분리한다.
- SCN-001 live/backend document draft는 Step 4 design baseline으로만 열고,
  구현 확정이나 API/schema 확정은 별도 phase 후보로 둔다.
- SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow와 continuity panel은
  frontend-local demo path로 completed 상태이며, live/backend draft generation으로
  취급하지 않는다.

## 2. Current Baseline

- SCN-004 freeze는 유지한다.
- Phase 7C~7E는 완료 상태다.
- Phase 8 regression / demo preflight / SCN-004 manual rehearsal은 완료 상태다.
- SCN-004 main demo는 정상 동작 확인된 상태다.
- SCN-001 Bridge answer는 현재 protected answer endpoint와 answer-only result까지
  완료된 상태다.
- Bridge-origin result는 현재 answer-only / draft disabled 정책을 유지한다.
- `/api/v1/answer` public contract는 unchanged 상태다.
- `/api/v1/documents/draft` public contract는 unchanged 상태다.
- `data/legalize-kr/` 및 `backend/data/law_chunks/` 직접 수정 금지는 유지한다.
- Post-Phase 8 Step 1 logout memory reset 완료.
- Post-Phase 8 Step 1.5 Before login-required UX 완료.
- OCR provider 429 frontend friendly message 완료.
- Before OCR stale/running job failure guard completed in `c6c3ed0`.
- Post-Phase 8 Step 2A protected read-only history backend endpoints 완료.
- Post-Phase 8 Step 2B-1 frontend history helper/types 완료.
- Post-Phase 8 Step 2B-2 `/before` read-only history UI 완료.
- Post-Phase 8 Step 1.6 main page Before entry login gate 완료.
- Post-Phase 8 actual browser logged-in smoke PASS.
- SCN-001 protected frontend auth gate hardening 완료: Firebase signed-in 단독이
  아니라 backend `/api/v1/auth/me` verification 완료 상태(`backendUser.logged_in`)를
  기준으로 main Before CTA, `/before` history, Before analysis, Bridge handoff를
  보호한다.
- Step 3 MVP soft-delete slice completed:
  - backend history soft-delete foundation completed in `e6f17eb`
  - frontend `/before` delete UI/client completed in `50c279f`
  - browser smoke passed with sanitized PASS/PRESENT/NO signals
  - Step 3 full retention lifecycle is NOT opened.
  - SCN-004 freeze impact: NO.
- Step 4 SCN-001 Document Draft Design remains a docs-only design baseline:
  - SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow completed in
    `667a1bd`.
  - Frozen draft document type is `workplace_change_reason_summary` / 사업장 변경
    사유 정리서 초안.
  - Frozen draft is frontend fixture + deterministic template based, reflects
    user intake, and does not call backend/LLM or `/api/v1/documents/draft`.
  - SCN-001 live/backend draft implementation is NOT opened.
  - SCN-001 live/backend document draft generation is NOT opened.
  - protected SCN-001 draft endpoint path/method/schema is NOT decided.
  - SCN-001 live draft freeze is NOT opened.
  - Bridge/query relevance guard matrix review is completed as the current design
    baseline.
  - SCN-001 continuity panel completed in `f574e6b` on `/after/result` and
    `/after/draft`.
  - SCN-001 MVP demo includes fixed-preset frozen draft continuity explanation
    and Bridge-origin answer-only continuity explanation where eligible.
  - Bridge-as-Continuity, Not Grounding is the policy boundary.
  - Current next target candidates are frozen draft + continuity panel browser
    rehearsal/evidence finalization, docs sync/release readiness, or optional live
    Bridge handoff continuity smoke using existing completed history.

## 3. Recommended Sequence

### Step 1. Logout Memory State Clear

Status (2026-04-24): completed and pushed in `030e7ac`.

- 로그아웃 시 `FlowContext`, Before local state, Bridge handoff memory state를
  초기화한다.
- Firebase Auth MVP frontend persistence는 memory-oriented policy를 유지한다.
- Web Storage에 raw flow payload, auth state, token을 저장하지 않는다.
- SCN-004 `/after` login-free path는 계속 유지한다.
- direct `/after` entry, SCN-004 exact preset, SCN-004 free input behavior를
  regression check 대상으로 둔다.

Acceptance direction:

- 로그아웃 후 이전 SCN-001 memory handoff card가 남지 않는다.
- 로그아웃 후 protected SCN-001 action은 재로그인을 요구한다.
- 로그아웃 후에도 SCN-004 `/after` public answer/draft path는 로그인 없이
  동작한다.

### Step 1.5. Before Login-required UX Message

Before action 시작 시 로그인 없이 진행하려는 사용자가 왜 진행할 수 없는지
명확히 알려주는 작은 UX polish다.

Status (2026-04-24): completed and pushed in `7466f2a`.

- protected Before action 진입 시 logged-out 상태면 "로그인이 필요합니다" 문구를
  명확히 노출하는 방향을 검토한다.
- 사용자가 Bridge 연결 또는 계정 연결이 필요한 동작을 시작했기 때문에 진행할 수
  없다는 안내를 함께 제공한다.
- SCN-004 `/after` login-free path나 public answer/draft behavior에는 영향을 주지
  않는다.
- Step 2A backend history API 변경과 같은 patch에 섞지 않는다.

Acceptance direction:

- 로그인 없이 protected Before action을 시작하면 "로그인이 필요합니다" 메시지가
  보인다.
- 사용자는 실패 원인이 입력 오류가 아니라 로그인-required 상태임을 이해할 수
  있다.
- 로그인 후 동일 action을 다시 시작할 수 있는 UX path가 유지된다.

### Step 1.6. Main Before Entry Login Gate

main page의 Before entry를 로그인 상태에 맞게 gate하는 작은 UX hardening이다.

Status (2026-04-27): completed. Initial main Before entry gate landed in
`d7bc261`; backend-verified auth state hardening and actual browser smoke passed
afterward.

- 로그인 전에는 Before 진입이 보호된 경로임을 분명히 알린다.
- backend verification 완료 후 Before CTA는 `/before`로 이동한다.
- Firebase signed-in 단독 상태는 protected SCN-001 진입 조건으로 쓰지 않는다.
- SCN-004 `/after` login-free path나 public answer/draft behavior에는 영향을 주지
  않는다.

Verified:

- 실제 브라우저에서 Google login -> backend `/api/v1/auth/me` 200
  `logged_in=true` -> main Before CTA -> `/before` 이동 PASS.
- 민감값은 presence-check만 수행하고 원문을 기록하지 않음.

Remaining polish candidates:

- semantic/a11y polish가 필요하면 별도 작은 patch로 처리.

### Step 2. Read-only History

로그인 사용자가 이전 Before review jobs / Bridge runs를 조회하는 read-only phase다.
현재는 list/detail 조회와 `/before` read-only render까지만 완료했다.

Step 2 status (2026-04-24):

- Step 2A backend read-only history API slice completed and pushed in `5948b43`.
- Step 2B-1 frontend history helper/types completed and pushed in `facb408`.
- Step 2B-2 `/before` read-only history UI completed and pushed in `f2c463a`.
- Actual browser read-only history smoke passed on 2026-04-27:
  `GET /api/v1/scn001/before-review-jobs` and
  `GET /api/v1/scn001/bridge-runs` sent Authorization headers, previous 401 was
  not reproduced, and read-only history UI rendered without auth error.
- Step 2B-3 is not open.
- Step 3 MVP soft-delete slice completed separately after Step 2. Step 3 full
  retention lifecycle, live/backend SCN-001 document draft implementation, hard delete, file purge, and
  artifact lifecycle remain out of scope.

- 삭제, 수정, artifact body 노출 없이 목록/상세 조회만 고려한다.
- internal user linkage로 ownership을 확인한다.
- Firebase uid, provider_subject, email, token은 response/UI/docs/logs에 노출하지
  않는다.
- raw Before result, raw contract/OCR, raw query, full answer body, artifact body는
  기본 노출하지 않는다.
- implemented read-only endpoints:
  - `GET /api/v1/scn001/before-review-jobs`
  - `GET /api/v1/scn001/before-review-jobs/{before_review_job_id}`
  - `GET /api/v1/scn001/bridge-runs`

Acceptance direction:

- 로그인 사용자는 본인 소유의 Before/Bridge history만 조회한다.
- 없는 항목 또는 타인 소유 항목은 existence leak이 없도록 처리한다.
- SCN-004 public answer/draft contract는 변경하지 않는다.

Current verification status:

- Codex headless 환경에서는 interactive Firebase Google popup + `inMemoryPersistence`
  때문에 logged-in live smoke가 여전히 제한된다.
- 실제 사용자 브라우저에서는 `/before` logged-in history endpoints Authorization
  PRESENT와 history records read-only render가 PASS 확인됐다.
- 기록이 없을 때는 empty state가 정상 render되는 것도 PASS 범위로 본다.

### Step 3. History Deletion

Status (2026-04-27): Step 3 MVP soft-delete slice completed. Step 3 full
retention lifecycle remains NOT opened.

Completed backend slice:

- `before_review_jobs`, `bridge_runs` soft-delete visibility fields completed.
- Protected delete endpoints completed:
  - `DELETE /api/v1/scn001/before-review-jobs/{before_review_job_id}`
  - `DELETE /api/v1/scn001/bridge-runs/{bridge_run_id}`
- Hidden records are filtered from history list/detail.
- Hidden Before jobs block Bridge creation.
- Hidden Bridge runs and hidden-source-Before Bridge runs block protected Bridge
  answer before generation.
- Missing, other-user, and already-hidden records are masked through the
  protected deletion path.
- No `after_artifact_runs` deletion was opened.
- No hard delete was opened.
- No artifact physical deletion or file purge was opened.

Completed frontend slice:

- `/before` read-only history includes delete affordances for Before and Bridge
  records.
- Delete flow includes browser confirmation and cancel.
- SCN-001 protected DELETE requests send Authorization; browser smoke confirmed
  Authorization PRESENT.
- 204 and masked results use generic user-facing UX.
- Successful delete refreshes history and locally hides the item.
- Before delete hides/removes linked Bridge records from visible history and
  selection path.
- Memory-only Bridge handoff is cleared so a deleted Before cannot seed `/after`.

Browser smoke result:

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

Remaining boundary:

- Step 3 full retention lifecycle is NOT opened.
- hard delete remains out of scope.
- artifact physical deletion and file purge remain out of scope.
- retention lifecycle and GCS lifecycle remain out of scope.
- audit/export remains out of scope.
- undo/restore remains out of scope.
- auth persistence changes remain out of scope.
- account deletion/access-control remains out of scope.
- orphan cleanup remains out of scope.
- live/backend SCN-001 document draft implementation remains out of scope.
- SCN-005 remains out of scope.
- provider_timeout retry/backoff hardening remains out of scope. Before OCR
  timeout/stale-job failure guard is treated as a narrow runtime guard.

#### Full retention lifecycle policy review

Scope boundary:

- Step 3 MVP soft-delete slice completed 상태를 유지한다.
- Full retention lifecycle is NOT opened for implementation.
- This review only identifies future policy decisions.
- 이 subsection은 API/schema/migration/path/status code를 확정하지 않는다.
- Auth persistence changes are explicitly out of scope and are not part of the
  deletion lifecycle.

Full lifecycle areas for future policy review:

- hard delete eligibility
- artifact physical deletion / file purge
- GCS lifecycle / cloud storage retention
- audit/export policy
- undo/restore
- account deletion/access-control
- orphan cleanup
- auth persistence changes: explicitly out of scope, not a deletion lifecycle area

Lifecycle decision table:

| area | current MVP status | future decision needed | dependency | recommended timing | explicit non-goal now |
|---|---|---|---|---|---|
| hard delete | no automatic hard delete; user-facing history hides soft-deleted records | eligibility rules, retention window, and evidence required before irreversible removal | artifact lifecycle, audit/status policy, ownership masking policy | after artifact access/retrieval policy and audit/status policy are reviewed | hard delete implementation |
| artifact physical deletion / file purge | no artifact physical deletion or file purge; files remain under current local/dev storage policy | whether physical purge is manual ops, scheduled cleanup, or deferred indefinitely | artifact access/retrieval policy, storage inventory, audit/status policy | after cloud storage/GCS lifecycle policy is reviewed | file purge job |
| GCS lifecycle | not opened; local/dev artifact retention remains the safe default | cloud storage retention classes, lifecycle ownership, and deletion evidence | cloud migration/storage policy, ops ownership, artifact classification | before any production cloud storage cleanup policy | GCS lifecycle job |
| audit/export | no user-facing audit/export surface; evidence remains sanitized PASS/PRESENT/NO level | whether internal status is enough or separate audit/export policy is needed | minimal status policy, evidence hygiene, sensitive value non-exposure rules | before hard delete/file purge decisions | audit export endpoint |
| undo/restore | not opened; hidden records stay inaccessible in user-facing history/Bridge/draft affordance | whether product needs a restore window or whether hide-first is final for MVP history UX | product need, audit/status policy, masking policy | only if a clear user-facing recovery need appears | restore endpoint |
| account deletion/access-control | separate from history item deletion; not opened in Step 3 | account-level lifecycle, ownership model, and access-control policy | auth/account policy, history/artifact visibility policy, legal/ops review | separate phase after history item policy stabilizes | account deletion UX/API |
| orphan cleanup | not opened; orphan candidates remain inaccessible/classification candidates | classification criteria, quarantine rules, cleanup evidence, and manual review need | artifact linkage review, storage inventory, audit/status policy | after artifact access/retrieval and cloud storage policy are reviewed | orphan cleanup job |

#### Artifact access / retrieval policy review

This is policy review only. Artifact retrieval UI/API is NOT opened.
This subsection does not decide API path/method, DB schema/migration, storage
transport, response shape, status code, or implementation prompt.

Scope boundary:

- Artifact retrieval UI/API is NOT opened.
- Hard delete, file purge, GCS lifecycle, audit export, undo/restore, account
  deletion/access-control, and orphan cleanup are NOT opened.
- live/backend SCN-001 document draft implementation is NOT opened.
- SCN-004 freeze remains unchanged.
- `/api/v1/answer` public contract remains unchanged.
- `/api/v1/documents/draft` public contract remains unchanged.

Artifact categories:

- protected linked Before artifacts, if/when exposed
- protected linked Bridge-derived After answer artifacts
- public unlinked After answer artifacts
- orphan artifact candidates
- already-hidden/deleted record artifacts

Access principles:

- Protected linked artifacts require backend-verified user ownership.
- Public unlinked artifacts are not account-history retrievable by default.
- Orphan artifacts are not user-retrievable until classification policy exists.
- Already-hidden/deleted record artifacts are not user-facing retrievable.
- Source Bridge/Before hidden state must block future user-facing artifact
  retrieval.
- Retrieval response, UI, and logs must not expose raw token material, Firebase
  identifiers, provider subjects, contact fields, raw query, full answer body,
  artifact body, artifact storage path, or real Bridge database identifier.

Retrieval response policy candidates:

- metadata-only first candidate.
- No raw artifact body by default.
- Signed URL, file streaming, and inline body are future choices, not decided.
- Redact or mask sensitive internal identifiers.
- Avoid exposing real Bridge database identifier or artifact storage path.
- Distinguish internal retrieval from user-facing retrieval. Internal ops review
  may need storage inventory/status checks, while user-facing retrieval should
  remain ownership-checked, minimal, and sanitized.

Relationship to deletion policy:

- Soft-deleted history rows remain hidden from future artifact access UI.
- Before hide affects linked Bridge visibility; artifact access depends on
  future policy.
- Bridge hide excludes linked After artifact from continuity/draft affordance
  and future user-facing retrieval candidate.
- Public unlinked artifacts remain global retention cleanup candidates, not
  account retrieval candidates.
- Orphan cleanup remains a separate ops/policy task.

Relationship to Bridge-as-Continuity:

- Artifact retrieval must not make Bridge a grounding source.
- Displayed safe subset may support continuity explanation, but retrieved
  artifact files/bodies must not create new `cited_articles`,
  `grounded_context_ids`, or legal grounding.
- Do not expose raw Before/Bridge payload as continuity context.

Decision table:

| artifact category | current MVP access | future access candidate | ownership basis | hidden/deleted behavior | response body candidate | unresolved question | non-goal now |
|---|---|---|---|---|---|---|---|
| Protected linked Before artifacts, if/when exposed | no artifact retrieval surface; Before history is list/detail metadata only | account history artifact metadata candidate only after policy approval | backend-verified internal user ownership on Before review job | hidden Before blocks history/detail, Bridge creation, Bridge selection, and future artifact retrieval candidate | metadata-only first; no raw artifact body by default | If Before artifacts become exposed, which metadata is enough without raw OCR/contract/result body? | Before artifact retrieval UI/API, raw body exposure, file streaming, signed URL, inline body |
| Protected linked Bridge-derived After answer artifacts | protected checked Bridge answer persists linked After artifact, but no retrieval surface is opened | owner-checked metadata candidate tied to source Bridge visibility | backend-verified internal user ownership plus source Bridge linkage | hidden Bridge or hidden-source-Before blocks continuity/draft affordance and future user-facing retrieval candidate | metadata-only first; no raw answer/artifact body by default | Should linked After artifact visibility be controlled by artifact row status, source Bridge/Before visibility, or both? | exposing real Bridge id, artifact storage path, full answer body, artifact body |
| Public unlinked After answer artifacts | public `/api/v1/answer` artifacts are not account-history retrievable | global retention cleanup inventory candidate, not account retrieval | no account ownership basis by default | not shown in account history and not confirmed/denied by account UX | no user-facing body candidate until a separate public artifact policy exists | What global retention window and cleanup evidence are enough for public unlinked artifacts? | retroactive account ownership inference, account deletion cascade |
| Orphan artifact candidates | not visible and not user-retrievable | quarantine/classification metadata candidate after orphan policy | ownership/context uncertain until classification policy exists | remain inaccessible; hidden parent state alone does not prove orphan status | metadata-only internal classification candidate; no user-facing body | What automated/manual checks can classify an artifact without irreversible assumptions? | orphan cleanup job, user-triggered purge, account history disclosure |
| Already-hidden/deleted record artifacts | hidden from history/detail/Bridge selection; no artifact access | idempotent internal status candidate only | internal linkage if inspectable internally, never provider identifiers | remain not user-facing retrievable; repeated access should look absent/hidden | no user-facing body; minimal internal status only | What status granularity supports idempotency without exposing state transitions? | restore/undo, hard delete, file purge triggered by repeated access |

#### Audit / status policy review

This is policy review only. Audit log table, status columns, and transition
metadata schema are NOT opened for implementation. This subsection does not
decide DB migration, API path/method/response shape/status code, export endpoint,
admin UI, or implementation prompt.

Scope boundary:

- Audit/status policy review is documentation only.
- Audit log table implementation is NOT opened.
- Status column names/schema are NOT opened.
- Transition metadata schema is NOT opened.
- No DB migration is decided or implied.
- No API path/method/response shape/status code is decided or implied.
- No user-facing audit export endpoint is opened.
- Artifact access policy remains a metadata-only candidate, and user-facing
  retrieval is NOT opened.
- live/backend SCN-001 document draft implementation is NOT opened.
- SCN-004 freeze remains unchanged.
- `/api/v1/answer` public contract remains unchanged.
- `/api/v1/documents/draft` public contract remains unchanged.

Audit/status purposes:

- support internal visibility and debug review without exposing raw artifacts.
- support idempotent delete behavior.
- support ownership masking for not-found / not-owned / already-hidden cases.
- support future retention lifecycle review before hard delete or file purge.
- not support user-facing audit/export in MVP.

Candidate approaches:

- Status fields only: simple visibility/status flags on relevant rows.
- Separate audit log table: richer append-only internal trail, higher complexity.
- Status fields plus minimal transition metadata: enough internal state for
  idempotency/debug while keeping MVP complexity bounded.
- Recommended MVP candidate: status fields plus minimal transition metadata, but
  names, tables, columns, and schema are not decided.

Minimal transition metadata candidate:

- `hidden_at` / `hidden_by` internal user id already exists for the Before/Bridge
  MVP soft-delete slice.
- Possible future status marker may be needed for artifact access lifecycle, but
  marker names/schema are not decided.
- Do not store provider identifiers, contact fields, or credential material in
  audit/status metadata.
- Do not store raw query text, full answer body, or artifact body in
  audit/status metadata.
- Keep internal user linkage only.

Audit/export non-goals:

- No user-facing audit export.
- No admin audit UI.
- No raw artifact body export.
- No secret, credential, provider identifier, or contact-field export.
- No live/backend SCN-001 document draft implementation or linkage changes.

Relationship to artifact access policy:

- Metadata-only artifact retrieval candidate must not expose audit internals.
- Audit/status should help decide visibility, not expose raw artifact content.
- Hidden/deleted source Before/Bridge state should block future user-facing
  artifact retrieval.
- Public unlinked artifacts and orphan candidates remain outside account-history
  retrieval.
- Artifact access status remains a future policy candidate; no retrieval UI/API is
  opened here.

Relationship to deletion masking:

- not-found / not-owned / already-hidden remain externally indistinguishable.
- Audit/status may internally preserve state transition, but response must remain
  a generic response.
- No response body should expose deletion state.
- Repeated delete/access attempts should not reveal whether a row exists, belongs
  to another user, or was already hidden.

Decision table:

| topic | candidate options | recommended MVP candidate | rationale | non-decision now | future trigger |
|---|---|---|---|---|---|
| status fields only | row-level visible/hidden/status markers only; no separate audit log table | not the preferred standalone candidate | simple, but may be too thin for retention lifecycle/debug decisions | column names, status values, table coverage, migration | if implementation risk requires the smallest possible state model |
| separate audit log table | append-only internal audit log; event table; richer transition history | defer as Post-MVP candidate | useful for operations, but adds schema, retention, and access-control complexity | audit log table, event names, payload shape, retention of audit rows | if legal/ops review requires durable internal audit history |
| status + transition metadata | row status plus minimal transition metadata such as existing `hidden_at` / `hidden_by` internal user linkage | recommended MVP candidate, without fixing names/schema | supports idempotent delete, internal visibility, and ownership masking with bounded complexity | exact columns, marker values, artifact status fields, migration | before hard delete/file purge or artifact retrieval implementation is considered |
| user-facing audit/export | export endpoint, account audit download, admin-facing export surface | not opened for MVP | user-facing audit/export risks exposing sensitive state and raw artifact context | endpoint, response shape, file format, UI, status code | only after explicit legal/product need and redaction policy |
| internal retention lifecycle audit | internal-only lifecycle review metadata/status; sanitized PASS/PRESENT/NO evidence style | candidate input to future retention review, not a shipped feature | helps decide when hard delete/file purge is safe without exposing deletion state | audit row/table choice, retention window, cleanup evidence format | before cloud/GCS lifecycle, orphan cleanup, hard delete, or file purge policy |
| artifact access status | source visibility status, linked artifact visibility candidate, orphan/public-unlinked classification marker | metadata-only policy candidate; no user-facing retrieval | helps future artifact access decide visibility while blocking hidden/deleted sources | artifact status marker, retrieval API behavior, storage path exposure | if artifact retrieval or cloud storage lifecycle policy is reopened |

Retention-stream future policy target after this review:

- Cloud storage / GCS lifecycle policy review or orphan classification/cleanup
  policy review remains a later policy candidate for the Step 3 retention stream.
- The current global next prompt target candidates are SCN-001 frozen draft +
  continuity panel browser rehearsal/evidence finalization, docs sync/release
  readiness, or optional live Bridge handoff continuity smoke using existing
  completed history, not this retention-stream policy work.

Recommended sequencing:

1. artifact access/retrieval policy review
2. audit/status policy review
3. cloud storage/GCS lifecycle policy
4. orphan classification/cleanup policy
5. hard delete/file purge implementation
6. undo/restore only if product need is clear

Do not jump from MVP soft-delete directly to hard delete. Account
deletion/access-control should be separate from history item deletion.

Current safe default:

- Keep no automatic hard delete/file purge.
- Keep hidden records inaccessible in user-facing history/Bridge/draft affordance.
- Keep artifact files retained under current local/dev storage until separate ops
  policy.
- Keep SCN-004 freeze unchanged.
- Keep `/api/v1/answer` public contract unchanged.
- Keep `/api/v1/documents/draft` public contract unchanged.

Do-not-open checklist:

- artifact retrieval UI/API implementation
- raw artifact body exposure
- hard delete implementation
- file purge job
- GCS lifecycle job
- audit export endpoint
- restore endpoint
- account deletion UX/API
- orphan cleanup job
- auth persistence change
- live/backend SCN-001 document draft implementation

Retention-stream note:

- If the work later returns to Step 3 retention policy, cloud storage / GCS
  lifecycle policy review or orphan classification/cleanup policy review remains
  the next retention-stream candidate.
- The active next target candidates for this roadmap are frozen draft + continuity
  panel browser rehearsal/evidence finalization, docs sync/release readiness, or
  optional live Bridge handoff continuity smoke. They should not open live/backend
  SCN-001 draft generation or protected SCN-001 draft endpoint work.

The policy notes below remain guardrails for future lifecycle work; they are not
new implementation instructions for this completed MVP soft-delete slice.

- soft delete 우선으로 설계한다.
- hard delete는 Post-MVP 또는 별도 retention / artifact lifecycle / audit 정책
  확정 이후에만 후보로 둔다.
- `before_review_jobs`, `bridge_runs`, `after_artifact_runs`, artifact files 사이의
  ownership, visibility, retention, artifact lifecycle 정책이 먼저 필요하다.
- deleted/hidden record는 history list/detail과 future Bridge selection에서 항상
  숨긴다.
- Step 4가 열린 경우에도 future continuity panel / future draft affordance에
  노출하지 않는다.
- deletion ownership check는 internal user linkage 기준으로 유지한다.
- deletion 후보 조회는 existence leak 방지를 기본 원칙으로 둔다. not-found /
  not-owned / already-deleted는 외부 응답에서 구분하지 않는 방향을 우선 검토한다.
- deletion event/status를 남기는 경우에도 Firebase uid, provider_subject, email이
  아니라 internal user linkage 기준만 사용한다.
- artifact files는 바로 삭제하지 않고 retention / artifact lifecycle 정책 전까지
  보존 또는 inaccessible 처리 후보로 둔다.
- 삭제/보관/접근 정책은 최소한 protected linked artifacts, public unlinked After
  answer artifacts, orphan artifact candidates를 구분해야 한다.
- 삭제 UI/API는 account history access control과 같은 patch에 섞지 않는다.

Artifact category definitions:

| category | definition / policy question |
|---|---|
| protected linked records/artifacts | internal user linkage로 owner를 확인할 수 있는 `before_review_jobs`, `bridge_runs`, 또는 linked `after_artifact_runs` 후보 |
| public unlinked After answer artifacts | public `/api/v1/answer` 경로처럼 account owner를 확정할 linkage가 없는 after artifact 후보 |
| orphan artifact candidates | artifact 관점의 분류다. linkage가 끊겼거나 관련 job/run row가 삭제/비가시 처리되어 owner/context를 확정하기 어려운 artifact 후보 |
| already-deleted records | record/state 관점의 idempotent deletion 분류다. soft delete 또는 hidden 처리 후보 상태가 이미 적용되어 user-facing history에서 제외된 record 후보 |

Boundary clarifications:

- Source Bridge가 hidden 처리된 linked After answer artifact는 자동으로 orphan으로 단정하지
  않는다. Linkage/context 확인 정책이 정해질 때까지 protected linked artifact 또는
  orphan candidate 중 어디로 분류할지 open question으로 남긴다.
- Already-deleted generic rule은 protected linked categories(Protected linked
  Before review job, Protected linked Bridge run, Protected linked After answer
  artifact)에 재삭제 요청이 들어올 때의 공통 적용 후보이며, public
  unlinked/orphan cleanup과 섞지 않는다.

#### Soft delete policy matrix

이 매트릭스는 구현 지시가 아니라 삭제/보관 정책 review의 기준안이다. `deleted`,
`hidden`, `retained`, `inaccessible` 같은 상태 이름, DB column, migration, API
response shape은 아직 확정하지 않는다. Step 4/5를 여는 결정도 아니며,
`Bridge-as-Continuity, Not Grounding` 정책을 그대로 유지한다. Bridge continuity
설명은 legal grounding/citation source가 아니고, deleted/hidden record는 future
Bridge selection, continuity panel, draft affordance에 쓰지 않는다.

| category | ownership / identity basis | visibility in history list/detail | visibility in future Bridge selection | visibility in future continuity panel / future draft affordance | soft delete behavior | hard delete eligibility | retention / audit note | artifact file lifecycle | external response / masking rule | open implementation question |
|---|---|---|---|---|---|---|---|---|---|---|
| Protected linked Before review job | internal user linkage on the protected Before review job; provider identifiers and contact fields are not response/UI material | hidden after soft delete; detail also hidden | hidden; deleted/hidden Before jobs cannot seed Bridge handoff | hidden if Step 4 opens; cannot unlock SCN-001 draft affordance | mark as user-hidden/deleted candidate while preserving enough internal linkage for idempotency and audit review | not eligible until retention, audit, and related Bridge/artifact lifecycle policy are approved | minimal internal status only; no raw OCR/contract/result payload copied into deletion metadata | no direct after artifact file lifecycle action from this row alone; linked downstream artifacts need their own policy | not-found, not-owned, and already-deleted should be indistinguishable externally | Should hiding a Before job also hide every derived Bridge run by policy, or only block future selection? |
| Protected linked Bridge run | internal user linkage on `bridge_runs` plus its Before linkage; primary provenance may later connect to answer artifacts | hidden after soft delete; detail also hidden | hidden; cannot be selected for future Bridge handoff | hidden if Step 4 opens; continuity panel and draft affordance cannot use it | mark as user-hidden/deleted candidate while preserving internal provenance needed to avoid orphan ambiguity | not eligible until linked artifact, provenance, retention, and audit policy are approved | preserve minimal internal linkage/status for ownership checks and audit review; no provider identifiers in user-facing surfaces | no immediate file delete by this row alone; linked answer artifact lifecycle decides files | not-found, not-owned, and already-deleted should be indistinguishable externally | If a Bridge run is hidden, should linked After answer artifacts be hidden automatically or only made inaccessible from Bridge-derived surfaces? |
| Protected linked After answer artifact | internal `after_artifact_runs.user_id` and primary `source_bridge_run_id` linkage; owner is resolved through internal user identity only | hidden from any account history/artifact detail surface after soft delete or linked source hiding | hidden from Bridge reuse/selection | hidden if Step 4 opens; cannot populate continuity panel, draft eligibility, `cited_articles`, or `grounded_context_ids` | make user-facing artifact inaccessible/hidden while preserving linkage until retention policy is approved | not eligible until artifact retention, audit, and linked row lifecycle policy are approved | retain minimal internal status/provenance only; deletion metadata must not duplicate answer body or request body | retain files or make inaccessible until lifecycle policy approves delete; no immediate file removal | not-found, not-owned, and already-deleted should be indistinguishable externally | Should artifact hiding be controlled by the artifact row itself, by source Bridge/Before visibility, or by both? |
| Public unlinked After answer artifact | no account owner is established because protected linkage is absent; do not retroactively infer ownership | not visible in account history by default; not an account history deletion target | not selectable | not eligible even if Step 4 opens; cannot drive continuity panel or draft affordance | no account-scoped deletion action unless a future ownership/access model is designed | separate global retention cleanup candidate only, not user account deletion behavior | retention policy must treat this as public/unlinked artifact inventory, not user-owned history | retain or cleanup only under global public artifact retention policy; inaccessible handling is a separate ops candidate | user account deletion flow should not confirm or deny existence of public unlinked artifacts | What global retention window and cleanup evidence are required for public unlinked artifacts? |
| Orphan artifact candidate | owner/context is uncertain because linkage is missing, broken, or points to deleted/hidden related rows | not visible | not selectable | not eligible even if Step 4 opens; cannot drive continuity panel or draft affordance | do not expose as user-owned; quarantine/inaccessible candidate until lifecycle review | only after orphan classification, retention, and audit criteria are explicit | orphan means uncertain context, not proven ownerless; avoid irreversible assumptions | retain or make inaccessible first; hard delete only after explicit orphan lifecycle criteria | account history deletion should not disclose orphan existence or classification | What automated or manual checks are enough to classify an artifact as orphaned? |
| Already-deleted record | prior soft delete/hidden candidate state; ownership checks still use internal linkage if the row is inspectable internally | not visible; repeated detail attempts behave like absent/hidden | not selectable | not eligible even if Step 4 opens; cannot drive continuity panel or draft affordance | idempotent no-op or status refresh candidate; do not restore visibility | not eligible merely because it is already hidden; hard delete still waits for retention/audit/artifact lifecycle policy | keep only minimal status needed for idempotency and audit review | do not delete files solely because a repeated delete request arrives | not-found, not-owned, and already-deleted should be indistinguishable externally | What internal status granularity is needed for idempotency without exposing state transitions? |

Deletion response checkpoint:

- Missing record, other-user record, and already-hidden/deleted record should remain
  indistinguishable to the caller on the protected deletion path.
- The response should not reveal whether a `before_review_job_id`, `bridge_run_id`,
  or artifact row exists.
- User-facing history refresh can show the absence of the item, but should not expose
  a different message for not-found, not-owned, or already-deleted cases.
- Any future deletion endpoint must verify ownership before changing visibility, and
  must not generate or persist new answer/draft artifacts as part of deletion.

#### Retention / audit / artifact lifecycle policy draft

이 subsection은 Step 3 MVP soft-delete slice 완료 이후의 full retention lifecycle
policy review draft다. DB schema, migration, 추가 API path/method, deletion
endpoint response shape 확장, batch job 구현, hard delete window를 확정하지
않는다. 완료된 MVP deletion은 soft-delete / hide-first 범위로 제한하고, hard
delete와 artifact file purge는 별도 retention policy와 ops review 이후 후보로
둔다.

Retention tiers:

| tier | draft retention direction |
|---|---|
| protected linked records/artifacts | internal user linkage로 owner를 확인할 수 있는 Before / Bridge / linked After record 후보는 account history에서 hide-first 처리하고, retention / audit / artifact lifecycle policy가 확정될 때까지 최소 내부 상태와 linkage 후보만 유지한다. |
| public unlinked After answer artifacts | protected linkage가 없는 public After answer artifact 후보는 account-scoped deletion 대상이 아니라 global retention cleanup 후보로 둔다. 계정 history UX에서 존재 여부를 확인하거나 부정하지 않는다. |
| orphan artifact candidates | owner/context 확인이 어려운 artifact 후보이며 account deletion UX와 섞지 않는다. orphan cleanup은 별도 classification, retention, audit 기준이 정해진 뒤 background/ops task 후보로만 둔다. |
| already-deleted records | already-deleted records는 user-visible history에서 계속 숨기고, repeat action은 idempotent no-op 또는 내부 status refresh 후보로만 검토한다. external response에서는 not-found / not-owned / already-deleted를 구분하지 않는 방향을 우선 검토한다. |

Audit principle:

- MVP에서는 최소 내부 상태 추적 후보만 문서화한다. 예: visible/hidden/deleted
  candidate 같은 상태 분류가 필요한지 검토하되, 상태 이름이나 column은 확정하지
  않는다.
- 사용자-visible response, UI, history state에는 deletion state transition을 노출하지
  않는다.
- Firebase uid, provider_subject, email, token은 audit 문서, response, UI, log에
  노출하지 않는다.
- Audit 후보 metadata는 internal user linkage와 idempotency 판단에 필요한 최소
  상태로 제한하고, raw query, full answer body, artifact body를 deletion metadata로
  복제하지 않는다.

Artifact lifecycle:

- Soft delete는 DB visibility/status 중심으로 검토한다. 파일 삭제 자체를 soft delete
  성공 조건으로 두지 않는다.
- Artifact files는 즉시 삭제하지 않는다. 숨김 또는 inaccessible 처리 후보를 먼저
  검토한다.
- Hard delete / file purge는 Post-MVP 또는 별도 retention policy 이후에만 후보로
  둔다.
- Protected linked artifact lifecycle과 public unlinked artifact lifecycle을 구분한다.
  protected linked artifact는 internal user linkage와 source linkage를 기준으로
  visibility를 결정하고, public unlinked artifact는 account-scoped deletion이 아니라
  global retention cleanup 후보로 다룬다.
- Orphan cleanup은 account deletion UX와 분리한다. orphan artifact candidates는
  owner/context 확인이 어려운 후보일 뿐이며, 사용자 삭제 action의 직접 결과로
  분류하거나 purge하지 않는다.

Visibility after soft delete:

- History list/detail에서는 soft-deleted 또는 hidden record를 숨긴다.
- Future Bridge selection에서는 Step 4 개방 여부와 관계없이 deleted/hidden record를
  숨긴다.
- Step 4가 열린 경우에도 future continuity panel과 future draft affordance에서는
  deleted/hidden record를 숨긴다.
- External response에서는 not-found / not-owned / already-deleted를 구분하지 않는
  방향을 우선 검토해 existence leak을 줄인다.
- `Bridge-as-Continuity, Not Grounding` 정책은 유지한다. Deleted/hidden record는
  future continuity panel이나 draft affordance에 사용하지 않는다.
- Phase 7 displayed safe subset이 query 구성에 쓰일 수 있어도, deleted/hidden record나
  Bridge 설명 자체는 새 `cited_articles`, `grounded_context_ids`, legal grounding을
  만들 수 없다.

Open policy questions:

- Retention window를 며칠 또는 얼마나 둘지는 미정이다.
- Audit log table을 둘지, 기존/후보 status column만 둘지는 미정이다.
- Artifact file purge를 batch/job으로 둘지, 수동 ops cleanup으로 둘지는 미정이다.
- Orphan classification job 또는 manual review 절차가 필요한지는 미정이다.
- Cascade policy는 미정이다. Before hide가 Bridge visibility와 linked After artifact
  visibility에 미치는 영향을 아직 확정하지 않는다.

Non-goals:

- Additional deletion API 또는 full retention lifecycle 구현이 아니다.
- DB schema/migration 확정이 아니다.
- account deletion/access-control 구현이 아니다.
- live/backend SCN-001 document draft implementation이 아니다.
- SCN-004 freeze 변경이 아니다.
- `/api/v1/answer` public contract 변경이 아니다.
- `/api/v1/documents/draft` public contract 변경이 아니다.

#### Retention window / cascade policy decision draft

이 subsection은 retention window와 cascade policy를 구현 전 decision draft로
좁히기 위한 문서다. Soft delete 이후 사용자-visible history에서 숨기는 방향은
유지하되, physical hard delete / artifact file purge / background purge 구현은
확정하지 않는다.

Retention window draft:

- MVP에서는 user-visible soft-deleted records를 즉시 history list/detail에서 숨긴다.
- Physical hard delete / artifact file purge는 retention window 이후 별도 ops task
  후보로만 둔다.
- Retention window 기간은 아직 숫자로 확정하지 않는다.
- 후보 window와 trade-off:
  - 7~30 days: short local/demo retention 후보이며, cleanup 범위는 작지만
    audit/debug 여지는 줄어든다.
  - 30~90 days: safer audit retention 후보이며, audit/debug 여지는 넓지만
    artifact lifecycle 미확정 상태에서 보관 기간이 길어진다.
  - Indefinite local retention: implementation 전 MVP local default 후보이며,
    demo 안정성과 debugging을 우선하지만 automatic cleanup을 제공하지 않는다.
- Recommended MVP default candidate는 구현 전까지 `no automatic hard delete / file purge` 또는
  `indefinite local retention`이다.
- 이유: MVP demo 안정성, audit/debug 필요성, artifact lifecycle 미확정.

Cascade policy draft:

- Before review job soft delete:
  - history list/detail에서 숨긴다.
  - linked Bridge runs는 기본적으로 history/selection에서 같이 숨기는 후보로 둔다.
  - linked After artifacts는 직접 삭제하지 않고 visibility/linkage policy question으로
    남긴다.
- Bridge run soft delete:
  - history list/detail과 future Bridge selection에서 숨긴다.
  - linked protected After answer artifacts는 직접 삭제하지 않고 continuity/draft
    affordance에서만 제외하는 후보로 둔다.
- Protected linked After answer artifact soft delete:
  - future artifact access UI가 생기면 숨긴다.
  - source Bridge run 자체를 역방향으로 삭제하지 않는다.
- Public unlinked After answer artifact:
  - account-scoped deletion cascade 대상이 아니다.
  - global retention cleanup 후보로만 둔다.
- Orphan artifact candidate:
  - account deletion UX와 분리한다.
  - orphan classification/cleanup job 후보로만 둔다.
- Already-deleted repeat action:
  - idempotent no-op 후보로 둔다.
  - external response는 not-found / not-owned / already-deleted와 구분하지 않는
    방향을 유지한다.

Decision table:

| trigger | affected records | visibility effect | artifact file effect | reverse cascade allowed? | open question | recommended MVP default candidate |
|---|---|---|---|---|---|---|
| Before review job soft delete | Before review job, linked Bridge runs, linked protected After answer artifacts as visibility/linkage policy question only | Before hidden from history; linked Bridge hidden from history/selection candidate; linked After visibility remains policy question | no immediate file deletion | no | Should linked After artifacts hide because source Before/Bridge is hidden, or only lose continuity/draft affordance? | hide Before and linked Bridge surfaces; retain linked After artifacts pending policy candidate |
| Bridge run soft delete | Bridge run and linked protected After answer artifacts | Bridge hidden from history and future Bridge selection; linked protected After excluded from continuity/draft affordance candidate | no immediate file deletion | no | Should linked protected After artifact row become hidden or only inaccessible from Bridge-derived surfaces? | hide Bridge surfaces; do not delete linked artifact files candidate |
| Protected linked After answer artifact soft delete | protected linked After answer artifact | hidden from future artifact access UI if such UI exists; not usable for continuity/draft affordance | no automatic file purge | no | What artifact access UI/API policy is required before user-facing artifact deletion exists? | hide/inaccessible candidate only; retain files until retention policy candidate |
| Public unlinked After answer artifact cleanup | public unlinked After answer artifact inventory | not visible in account history and not confirmed/denied by account UX | global cleanup only after retention policy | no | What global retention window and cleanup evidence are required? | no account-scoped cascade; global retention cleanup candidate |
| Orphan artifact candidate cleanup | orphan artifact candidates | not visible in account history/selection/continuity/draft affordance | no purge until orphan classification is explicit | no | What automated or manual orphan classification checks are enough? | quarantine/inaccessible candidate; no user-triggered purge candidate |
| Already-deleted repeat action | already hidden/deleted candidate record | no user-visible state transition; remains absent from history/detail | no file deletion from repeat action | no | What internal status granularity is needed for idempotency without exposing state transitions? | idempotent no-op or internal status refresh candidate |

#### Remaining open policy questions decision draft

이 subsection은 Step 3 retention/cascade policy의 remaining open policy questions를
구현 전 decision candidate로 좁히는 문서다. 아래 표는 implementation handoff가
아니며, DB schema, migration, API method/path, response shape, status code, actual
retention day count, hard delete, file purge, account deletion/access-control 구현을
확정하지 않는다. SCN-004 freeze, `/api/v1/answer` public contract,
`/api/v1/documents/draft` public contract, `Bridge-as-Continuity, Not Grounding`
정책은 그대로 유지한다.

| question | candidate options | recommended MVP default candidate | rationale | still not decided | implementation guardrail |
|---|---|---|---|---|---|
| exact retention window | indefinite local retention until explicit ops policy; 30~90 day audit retention; 7~30 day demo/local cleanup | indefinite local retention / no automatic hard delete or file purge 후보 | SCN-004/SCN-001 demo 안정성, audit/debug 가능성, artifact lifecycle 미확정 상태를 우선한다. | Cloud/production 전환 시 실제 retention window와 ops ownership을 재검토한다. Actual day count는 확정하지 않는다. | 즉시 history hide만 후보로 둔다. Automatic hard delete, scheduled file purge, background cleanup 구현은 열지 않는다. |
| audit log vs status column | status column only; separate audit log table; status column + minimal transition metadata | status column + minimal transition metadata 후보 | idempotency와 내부 audit/debug에 필요한 최소 상태는 남기되, full audit log table은 MVP 복잡도를 키운다. | column/table 이름, metadata field, audit table 여부, retention 대상은 확정하지 않는다. | external provider identifiers, contact fields, credentials, expanded case/input/output payloads, file contents를 deletion metadata에 저장하지 않는다. Internal user linkage만 후보로 둔다. |
| file purge job | no purge job in MVP; manual/ops cleanup only; scheduled purge after retention window | no automatic purge job in MVP 후보 | Soft delete 성공 조건을 파일 삭제에 묶지 않아 demo 안정성과 artifact lifecycle 검토 여지를 유지한다. | manual/ops cleanup 절차, scheduled purge 필요성, cleanup evidence format은 Post-MVP ops policy로 남긴다. | artifact file은 soft delete 때 즉시 삭제하지 않는다. File purge는 retention/audit/artifact lifecycle review 이후 별도 작업으로만 검토한다. |
| orphan classification | classify only by explicit missing linkage; classify by inaccessible/hidden parent record; defer classification until cleanup job exists | defer orphan cleanup/classification; do not expose in account history 후보 | linkage가 숨김 처리된 것과 실제 orphan은 다르므로 irreversible cleanup 전 classification 기준이 필요하다. | automated/manual orphan classification checks, quarantine 기준, cleanup trigger는 확정하지 않는다. | hidden source Bridge가 있는 linked After answer artifact를 자동 orphan으로 단정하지 않는다. Account history UX에서 orphan 존재 여부를 확인하거나 부정하지 않는다. |
| cascade linkage behavior | shallow hide only selected record; forward visibility hide linked descendants; hard cascade delete | forward visibility hide for user-facing history/selection only; no hard cascade 후보 | user-facing history와 future Bridge selection에서 숨김 일관성을 확보하되, protected linked After artifact lifecycle은 별도 policy로 남긴다. | linked After answer artifact row visibility, artifact access UI/API policy, future draft affordance linkage는 확정하지 않는다. | Before hide는 linked Bridge visibility를 숨기는 후보로 둔다. Bridge hide는 future Bridge selection/continuity/draft affordance에서 제외한다. Linked After answer artifacts는 직접 삭제하지 않는다. reverse cascade는 하지 않으며 no hard cascade를 유지한다. |

Recommended MVP default candidates:

- exact retention window candidate: indefinite local retention / no automatic hard
  delete or file purge.
- audit log vs status column: status column + minimal transition metadata 후보,
  without fixing names or table shape.
- file purge job candidate: no automatic purge job in MVP.
- orphan classification candidate: defer cleanup/classification and keep orphan
  candidates out of account history.
- cascade linkage behavior candidate: forward visibility hide for user-facing
  history/selection only, no hard cascade, no reverse cascade.

Strong non-decisions:

- DB schema/migration은 확정하지 않는다.
- API method/path/response shape/status code는 확정하지 않는다.
- actual retention day count는 확정하지 않는다.
- hard delete/file purge 실행은 확정하지 않는다.
- account deletion/access-control 구현은 확정하지 않는다.
- live/backend SCN-001 document draft implementation은 열지 않는다.

Bridge policy retained:

- deleted/hidden record는 future Bridge selection / continuity panel / draft
  affordance에 사용하지 않는다.
- `Bridge-as-Continuity, Not Grounding` 정책은 유지한다.
- displayed safe subset이 query 구성에 쓰일 수 있어도 새 `cited_articles`,
  `grounded_context_ids`, legal grounding을 만들 수 없다.

Implementation non-decisions:

- schema column 이름을 확정하지 않는다.
- API method/path를 확정하지 않는다.
- migration을 확정하지 않는다.
- audit log table과 status column 중 어느 쪽을 쓸지 확정하지 않는다.
- response shape/status code를 확정하지 않는다.
- background purge job을 확정하지 않는다.

Bridge policy checkpoint:

- deleted/hidden record는 future Bridge selection / continuity panel / draft affordance에
  사용하지 않는다.
- `Bridge-as-Continuity, Not Grounding` 정책은 유지한다.
- displayed safe subset이 query 구성에 쓰일 수 있어도 새 `cited_articles`,
  `grounded_context_ids`, legal grounding을 만들 수 없다.

Acceptance direction:

- 삭제 동작은 본인 소유 record에만 적용된다.
- 삭제 또는 hidden 처리된 record가 history list/detail과 Bridge selection에 다시
  노출되지 않는다.
- Step 4가 열린 경우에도 deleted/hidden record는 future continuity panel / future
  draft affordance에 다시 노출되지 않는다.
- 관련 artifact lifecycle / retention / visibility policy가 문서화된 뒤 구현된다.
- 추가 deletion API와 full retention lifecycle 구현은 아직 열지 않고 위 policy
  matrix와 response checkpoint review까지만 진행한다.

### Step 4. SCN-001 MVP Continuity Panel / Document Draft Boundary

Step 4는 live/backend SCN-001 document draft generation 착수가 아니다.
Bridge/query relevance guard matrix review는 completed/current design baseline이다.
이 baseline 위에서 frontend-local SCN-001-BRIDGE-DEMO exact fixed preset frozen
draft flow와 continuity panel이 completed 상태가 됐다.

현재 산출물은 SCN-001 live/backend document draft boundary +
Bridge/query relevance guard + completed frontend-local frozen draft/continuity
panel scope sync다. Protected SCN-001 draft endpoint, live draft generation, live
draft freeze는 열지 않는다.

#### SCN-001 Document Draft Design

##### 1. Scope boundary

- Step 4 live/backend draft design baseline only.
- SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow is completed:
  `workplace_change_reason_summary` / 사업장 변경 사유 정리서 초안.
- The frozen draft is frontend fixture + deterministic template based, reflects
  user intake, and does not call backend/LLM or `/api/v1/documents/draft`.
- SCN-001 continuity panel is completed on `/after/result` and `/after/draft`.
- SCN-001 live/backend draft implementation is NOT opened.
- SCN-004 `/api/v1/documents/draft` public contract unchanged.
- SCN-004 `/api/v1/answer` public contract unchanged.
- SCN-004 `/after` login-free draft flow unchanged.
- SCN-004 fixed/free input/draft behavior remains separated from this design.
- No SCN-005.
- No independent `/bridge` route or Recovery implementation.
- No live/backend DB schema/migration, protected endpoint path/method/schema, live
  document template, or live QA fixture is finalized here.
- Current next target candidates are frozen draft + continuity panel browser
  rehearsal/evidence finalization, docs sync/release readiness, or optional live
  Bridge handoff continuity smoke using existing completed history.

##### 2. Bridge usage policy

Bridge policy: **Bridge-as-Continuity, Not Grounding**.

- The current query answer stays primary and should behave like the existing
  answer flow.
- Answer remains primary.
- Bridge information remains supplementary.
- Bridge cards must not be treated as hidden grounding/source material for the
  answer.
- Bridge cards may become supplemental continuity context only.
- If shown, the Bridge continuity panel appears as additional explanation, not
  legal basis.
- Candidate placement remains the result screen right-side document
  draft/support area below the current document draft/auxiliary panel.
- Bridge continuity should explain only "이전 검토와 이번 질문이 이어질 수 있는
  지점".
- Bridge information must not create `cited_articles`, `grounded_context_ids`, or
  legal grounding.
- Bridge information must not be used to cite law that the current answer did not
  retrieve or cite.
- Deleted/hidden Before/Bridge history must not appear in Bridge selection,
  continuity panel, or draft affordance.
- Raw Before/Bridge payload, raw `after_query_seed`, token, Firebase uid,
  provider_subject, email, raw query, full answer body, and artifact body must not
  be written into docs, UI, logs, commits, issues, chat, or a future continuity
  payload.

##### 3. Frontend-local continuity panel scope

Status: completed in `f574e6b`.

The continuity panel is frontend-local and does not open live/backend SCN-001
document draft generation or a protected SCN-001 draft endpoint.

- Placement is `/after/result` and `/after/draft`.
- Fixed SCN-001 frozen draft path shows the panel to explain the connection
  between the prior contract review and the current question/draft.
- Bridge-origin result shows the answer-only continuity panel only when a Bridge
  handoff exists and at least one included/checked Bridge context is available.
- Strong overlap may show continuity explanation.
- Weak overlap may show a reference-only note or hide the panel.
- No overlap hides the panel.
- Deleted/hidden Bridge or hidden source Before hides the panel.
- All-unchecked Bridge handoff hides the panel while preserving sticky
  `answer_origin = "bridge_handoff"` answer-only behavior.
- Missing answer evidence, including missing `cited_articles` or
  `grounded_context_ids`, hides the panel and keeps the existing answer evidence
  guard primary.
- Draft CTA/button remains hidden for Bridge-origin result.
- Answer remains primary.
- Bridge information remains supplementary.
- Bridge information creates no legal grounding, `cited_articles`, or
  `grounded_context_ids`.
- Continuity panel does not create or modify `legal_basis`, `cited_articles`,
  `source_context_ids`, `grounded_context_ids`, or `retrieved_chunks`.

##### 4. Bridge/query relevance guard matrix review

Status: completed/current design baseline.

This review defines the design boundary for a future Bridge/query relevance
guard. It is not an implementation plan and does not define a numeric score,
ranking algorithm, endpoint path/method/schema, DB schema/migration, document
type, document template, or draft generation flow.

###### Scope boundary

- Design baseline review. Frontend continuity panel implementation is completed,
  but this guard review still does not define a numeric score or backend API.
- No endpoint/schema/document type finalization.
- No live/backend draft generation/freeze.
- No public contract changes.
- `/api/v1/answer` public contract remains unchanged.
- `/api/v1/documents/draft` public contract remains unchanged.
- SCN-004 fixed/free input/draft behavior remains unchanged and login-free.
- Bridge cards remain supplemental continuity context only. They are not hidden
  answer grounding/source material.
- Overlap between Bridge and the current answer cannot create legal basis,
  `cited_articles`, `grounded_context_ids`, or answer evidence.

###### Guard input signals

Candidate signals only:

- `issue_categories` overlap.
- `risk_tags` overlap.
- `law_refs` overlap with current answer `cited_articles` or current retrieved
  law references.
- `recommended_next_actions` overlap.
- `user_visible_summary` similarity as weak signal only.
- explicit user question terms overlap as weak support only.

Excluded signals:

- raw `after_query_seed`.
- raw Before/Bridge payload.
- internal ids.
- artifact refs.
- token/auth/provider identifiers.
- raw OCR/contract.
- full answer/draft/artifact body.

Input interpretation rules:

- `issue_categories`, `risk_tags`, `law_refs`, `recommended_next_actions`, and
  `user_visible_summary` are continuity candidates, not legal basis fields.
- `law_refs` can support continuity only when they align with the current answer
  evidence. They do not add new citations.
- Summary similarity and explicit user question term overlap are weak support
  signals. They cannot open legal grounding or draft affordance by themselves.
- Deleted/hidden Bridge records or hidden source Before jobs are treated as
  unsafe for user-facing continuity surfaces.

###### Scoring / decision matrix

The matrix below is a qualitative review tool. It intentionally avoids numeric
weights or implementation thresholds.

| signal pattern | examples | outcome | UI behavior | draft affordance implication | legal grounding rule | notes |
|---|---|---|---|---|---|---|
| strong issue + law overlap | `issue_categories` or `risk_tags` match the current question, and Bridge `law_refs` also overlap current answer `cited_articles` or retrieved law references | show continuity explanation | Show a Korean continuity panel framed as "이전 검토와 이번 질문이 이어질 수 있는 지점". | Relevance guard may pass, but draft affordance still needs quality gate, document type confirmation, and separate review. | Current answer evidence only supplies legal basis, `cited_articles`, and `grounded_context_ids`. | Strong does not mean Bridge grounded the answer. |
| issue overlap only | prior and current issue labels both point to the same broad topic, but law/action overlap is absent | show reference-only note or hide continuity panel | If shown, say the prior review appears related but was not used as legal basis. | Keep answer-only unless a separate quality gate later approves more. | No new legal basis from Bridge. | Treat as weak unless answer evidence independently supports the same issue. |
| law overlap only | Bridge `law_refs` mention a law also found in current answer evidence, but issue/action context differs | show reference-only note | Prefer a short note; avoid implying the same legal problem. | Keep answer-only. | Existing answer citations remain unchanged. | Same law can apply to different issues, so do not infer continuity too strongly. |
| action overlap only | both mention consultation, document collection, workplace-change preparation, or complaint preparation, but issue/law overlap is absent | show reference-only note or hide continuity panel | Use action-continuity wording only if not misleading. | Keep answer-only. | Action overlap is not legal grounding. | Helpful for UX continuity, not for legal reasoning. |
| summary similarity only | `user_visible_summary` text is similar, or explicit user question terms overlap, but no safe label/law/action match exists | hide continuity panel or show minimal reference-only note | If shown, explicitly state Bridge is not used as legal basis for the current answer. | Block draft affordance. | No citations or context ids from Bridge. | Similar wording can be accidental; treat as weak. |
| no overlap | no safe displayed subset overlap across issue/risk, law, action, summary, or current question terms | hide continuity panel | Result remains normal answer view. | Block draft affordance. | Bridge contributes no legal basis. | Do not explain sensitive mismatch details. |
| conflicting/unsafe signal | Bridge suggests a different issue, law, or next action than current answer; or continuity would depend on hidden/raw/internal data | hide continuity panel | Prefer silent hiding over mismatch explanation. | Block draft affordance and require separate quality gate review before any future reopening. | Never use Bridge to repair or replace missing answer evidence. | Treat hidden/raw/internal dependency as unsafe even if labels look related. |
| missing answer evidence | current answer has no `cited_articles` or no `grounded_context_ids` | hide continuity panel and keep answer-only guard active | Existing "근거 확인 필요" / draft-blocking behavior remains primary. | Block draft affordance. | Bridge cannot create missing citations or grounded context ids. | Current answer quality gate comes before Bridge continuity. |
| all Bridge cards unchecked | user excludes all cards from the current query | keep answer-only | Sticky `answer_origin = "bridge_handoff"` behavior remains; no continuity panel from unchecked cards. | Block draft affordance. | Unchecked Bridge cards provide no grounding or continuity input. | User question may still receive a public answer, but not a Bridge-derived draft path. |
| deleted/hidden Bridge or source Before | Bridge run is hidden, source Before is hidden, or visible history no longer exposes the item | hide continuity panel | Do not show the record or explain hidden/deleted state details. | Block draft affordance. | Hidden/deleted records cannot create legal basis, `cited_articles`, or `grounded_context_ids`. | Preserve existence-leak masking and Step 3 soft-delete policy. |

###### Strong / weak / no / conflicting definitions

- Strong: at least issue/risk overlap plus law or action overlap, with current
  answer evidence present.
- Weak: one signal only, or no direct match to current answer evidence.
- No overlap: no overlap in the safe displayed subset.
- Conflicting/unsafe: Bridge suggests a different issue, law, or action than the
  current answer, or continuity depends on hidden, deleted, raw, or internal
  data.

Definition guardrails:

- Strong is a UI/design classification, not a legal conclusion.
- Weak is not enough to open draft affordance.
- No overlap should keep the Bridge panel hidden.
- Conflicting/unsafe should hide rather than explain sensitive mismatch details.

###### UI copy policy

- Korean primary, English secondary only if needed.
- Avoid claiming legal causation.
- Preferred framing: "이전 검토와 이번 질문이 이어질 수 있는 지점".
- Reference-only note should say Bridge is not used as legal basis for the
  current answer.
- Hide the panel when unsafe rather than explaining sensitive mismatch details.
- Avoid wording such as "이전 검토 때문에 이 조문이 적용됩니다" or "Bridge가 근거를
  보강했습니다".
- Keep citations and grounded context display tied to the current answer only.

Candidate copy direction:

- Continuity explanation: "이전 검토의 쟁점과 이번 질문의 답변 근거가 일부 이어질
  수 있습니다. 아래 내용은 연결 지점 설명이며, 현재 답변의 법적 근거는 인용 조문
  영역에서 확인하세요."
- Reference-only note: "이전 검토와 일부 표현이 비슷하지만, 이 Bridge 정보는 이번
  답변의 법적 근거로 사용되지 않았습니다."

###### Draft affordance gate

- Relevance guard pass alone does not open draft.
- Draft affordance remains subject to quality gate, document type confirmation,
  and separate review.
- No live/backend SCN-001 draft generation now.
- No protected SCN-001 draft endpoint now.
- No protected SCN-001 draft endpoint path/method/schema is decided here.
- Bridge overlap must not add answer evidence, legal basis, or user-confirmed
  facts.
- If the current answer lacks `cited_articles` or `grounded_context_ids`, Bridge
  continuity cannot make the answer draft-eligible.
- User-confirmed facts, answer evidence, and continuity explanation must remain
  separate in any future design.

###### Verification / QA candidate

This is a candidate checklist for a later design or implementation review. It is
not a request to run broad eval now.

- Manual examples for strong, weak, no-overlap, and conflicting/unsafe cases.
- Check no new citations or grounded context ids are created from Bridge.
- Check hidden/deleted Bridge or source Before does not appear.
- Check all-unchecked Bridge cards do not open continuity or draft affordance.
- Check current-answer missing evidence blocks continuity/draft affordance.
- Check SCN-004 direct `/after` remains unaffected and login-free.
- Check `/api/v1/answer` and `/api/v1/documents/draft` public contracts remain
  unchanged.
- No broad eval unless retrieval/answer behavior or API response contract
  changes.

###### Next target

The previous frontend-only continuity panel target is completed. Current next
target candidates are SCN-001 frozen draft + continuity panel browser
rehearsal/evidence finalization, docs sync/release readiness, or optional live
Bridge handoff continuity smoke using existing completed history. These targets
do not finalize protected SCN-001 draft endpoint path/method/schema, open
live/backend SCN-001 draft generation, or open SCN-001 live draft freeze.

##### 5. Draft affordance policy

- Live/backend SCN-001 draft affordance must not open before the Bridge/query
  relevance guard, quality gate, document type confirmation, and separate review
  pass.
- SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow is the completed
  frontend-local exception and must stay separate from the SCN-004 document draft
  path.
- Draft must not use raw Before/Bridge payload.
- Draft must not use raw `after_query_seed`.
- Draft must use answer evidence and user-confirmed facts only.
- Answer evidence means current answer `cited_articles`, `grounded_context_ids`,
  and answer-linked retrieved chunks; Bridge overlap does not add legal basis.
- If Bridge is used, it is a continuity note / context summary, not legal basis.
- User-confirmed facts must remain distinct from inferred continuity. Missing
  facts stay placeholders or `missing_fields`.
- Existing SCN-004 `/after/result -> /after/intake -> /after/draft` behavior stays
  unchanged, login-free, and backed by public `/api/v1/documents/draft`.

##### 6. Endpoint/contract candidate review

This review compares candidates only. It does not decide path, method, schema,
status codes, DB columns, migrations, or implementation prompts.

| candidate | review | current recommendation |
|---|---|---|
| Reuse public `/api/v1/documents/draft` | Not recommended for SCN-001 protected draft because it risks the SCN-004 public contract/freeze and mixes protected Bridge continuity into a public draft surface. | Do not reuse as the first SCN-001 protected draft path. |
| Add protected SCN-001 draft endpoint | Candidate only, not implementation. It may be needed later if live SCN-001 draft requires auth, ownership, artifact linkage, or separate templates. | Defer until live document type, template, QA criteria, and relevance guard are defined. |
| Frontend-only continuity panel without draft endpoint | Completed in `f574e6b`; validates Bridge-as-Continuity without opening live/backend draft generation. | Keep as completed frontend-local demo capability and evidence target. |
| Frontend fixed-preset frozen draft without backend endpoint | Completed in `667a1bd`; exact SCN-001-BRIDGE-DEMO path uses deterministic frontend template and does not call `/api/v1/documents/draft`. | Keep separate from live/backend draft generation and SCN-004 public draft flow. |

Recommendation candidate:

- Treat the completed SCN-001 continuity panel and exact fixed frozen draft flow
  as completed frontend-local paths under the relevance guard baseline.
- Defer protected SCN-001 draft endpoint until document type/template/QA criteria
  are defined.
- Do not finalize any SCN-001 draft endpoint path/method/schema in this Step 4
  design.
- Keep `/api/v1/answer` and `/api/v1/documents/draft` public contracts unchanged.

##### 7. SCN-001 document type candidates

These are live/backend document type candidates only. Do not claim a live/backend
SCN-001 draft type is implemented. The frontend-local exact fixed preset already
uses `workplace_change_reason_summary` / 사업장 변경 사유 정리서 초안 for the frozen
demo path.

- workplace_change_reason_summary / 사업장 변경 사유 정리서 초안 (frontend-local
  frozen demo type only)
- labor office complaint supplement
- evidence summary / issue chronology
- consultation memo

Avoid finalizing a legal filing template until a quality gate exists. A future
document type decision must define user-confirmed fact requirements, answer
evidence requirements, missing-field handling, and manual rehearsal criteria
before any endpoint or UI implementation starts.

##### 8. Quality gate / QA criteria

Candidate quality gate for a future design review:

- citations only from answer evidence.
- no generated facts not provided by the user.
- missing facts remain placeholders or `missing_fields`.
- Bridge continuity note is separated from legal basis.
- Bridge continuity note does not create `cited_articles` or
  `grounded_context_ids`.
- Bridge/query relevance guard matrix is documented and remains a prerequisite
  before any draft affordance.
- manual browser rehearsal is required before treating the SCN-001 frozen draft +
  continuity panel path as final evidence.
- no broad eval unless retrieval/answer behavior or API response contract changes.
- SCN-004 exact preset, SCN-004 free input, and SCN-004 login-free draft flow must
  remain regression checkpoints.
- Sensitive-data hygiene must be verified with no raw Before/Bridge payload, raw
  `after_query_seed`, token, Firebase uid, provider_subject, email, raw query,
  full answer body, or artifact body recorded.

##### 9. Current next target

Current next target candidates:

1. SCN-001 frozen draft + continuity panel browser rehearsal/evidence finalization.
2. docs sync/release readiness.
3. optional live Bridge handoff continuity smoke using existing completed history.

These targets should not code a backend endpoint, finalize schema/migration, open
live/backend SCN-001 draft generation, open protected SCN-001 draft endpoint
path/method/schema, open SCN-001 live draft freeze, open SCN-005, or change
SCN-004 public answer/draft behavior.

Later SCN-001 draft/freeze sequence:

1. Finalize SCN-001 frozen draft + continuity panel browser evidence.
2. Document SCN-001 MVP demo rehearsal evidence.
3. Revisit live/backend SCN-001 document draft design, document type, and quality gate.
4. Open live SCN-001 draft implementation only after the above review.
5. Open SCN-001 live draft freeze only after output quality is stable, and keep it
   separate from `SCN-004-DEMO-FREEZE`.

### Step 5. SCN-001 Live Draft Freeze

Live/backend SCN-001 draft 결과가 원하는 수준으로 안정화되면 presentation-local
freeze fixture/preset 후보로 검토한다.

- `SCN-004-DEMO-FREEZE`와 분리한다.
- SCN-001 live draft freeze는 별도 preset/fixture 이름과 별도 eligibility guard를 둔다.
- fixed fixture는 demo stability 목적이며 live retrieval/answer evidence와 혼용하지
  않는다.
- freeze 전에는 `Bridge-as-Continuity, Not Grounding` 정책과 Bridge-query
  relevance/matching guard가 먼저 고정되어야 한다.
- freeze 전에는 SCN-001 live draft quality, citation grounding, document output을
  별도 evidence로 확인한다.

## 4. Do Not Mix

- logout clear와 history API를 한 patch에 섞지 않는다.
- Before login-required UX polish와 Step 2A history API 구현을 한 patch에 섞지
  않는다.
- history deletion과 artifact retention/access-control 정책 확정을 한 patch에서
  무리하게 닫지 않는다.
- history deletion 설계와 deletion API/code implementation을 한 patch에 섞지 않는다.
- SCN-001 draft와 SCN-004 freeze QA를 한 patch에 섞지 않는다.
- SCN-001 draft와 provider_timeout retry/backoff hardening을 섞지 않는다.
- provider_timeout/OCR retry/backoff hardening을 UI polish와 섞지 않는다.
- SCN-001 draft와 SCN-005 document type 확장을 섞지 않는다.
- read-only history와 deletion/history retention을 한 patch에 섞지 않는다.
- `/api/v1/answer` public contract 변경과 SCN-001 protected extension을 섞지 않는다.
- `/api/v1/documents/draft` public contract 변경을 SCN-001 draft 편의를 위해
  끼워 넣지 않는다.

## 5. Guardrails

- `/api/v1/answer` public contract unchanged.
- `/api/v1/documents/draft` public contract unchanged.
- SCN-004 freeze 유지.
- SCN-004 `/after`, `/after/result`, `/after/intake`, `/after/draft`는 login-free 유지.
- Web Storage에 raw payload, raw answer/draft body, raw flow data, auth state, token
  저장 금지.
- Firebase uid, provider_subject, email, token 노출 금지.
- raw Before/Bridge payload, raw `after_query_seed`, raw query, full answer body,
  artifact body를 docs/logs/UI/commits/issues/chat에 기록하지 않는다.
- Business table과 response는 Firebase uid/provider_subject/email이 아니라 internal
  user linkage만 사용한다.
- SCN-001 draft affordance는 Bridge result와 After query의 relevance/matching guard
  없이 열지 않는다.
- `Bridge-as-Continuity, Not Grounding`은 Bridge 전반 정책이다. Bridge displayed
  safe subset은 query 구성에는 쓰일 수 있지만, 검색/답변 evidence 밖의
  `cited_articles` 또는 `grounded_context_ids`를 만들 수 없다.
- Bridge는 answer/query/draft의 grounding source가 아니라 continuity 설명으로만
  사용한다.
- Bridge continuity 설명은 cited_articles / grounded_context_ids를 새로 만들지
  않는다.
- 검색/답변 결과에 없는 법령 근거를 Bridge 설명이나 draft에 새로 만들지 않는다.
- deleted/hidden history는 history list/detail, Bridge selection, continuity panel,
  draft affordance에 노출하지 않는다.
- `data/legalize-kr/` 직접 수정 금지.
- `backend/data/law_chunks/` 직접 수정 금지.
- RAG / answer / retrieval behavior 또는 API response contract 변경이 없으면 broad
  full eval을 실행하지 않는다.

## 6. Suggested Next Prompt Target

실제 브라우저 logged-in history deletion smoke는 PASS 상태다. Step 3 MVP
soft-delete slice completed 상태이며, full retention lifecycle implementation은
NOT opened 상태를 유지한다. Full retention lifecycle policy review, artifact
access/retrieval policy review, audit/status policy review는 Step 3 아래에
문서화되어 있다.

Step 4는 live/backend SCN-001 Document Draft Design baseline으로 유지한다.
Bridge/query relevance guard matrix review는 completed/current design baseline으로
문서화됐다. SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow와 continuity
panel은 completed 상태다. 다음 target 후보는 SCN-001 frozen draft + continuity
panel browser rehearsal/evidence finalization, docs sync/release readiness, optional
live Bridge handoff continuity smoke using existing completed history다.

Review focus:

- continuity panel이 `/after/result`와 `/after/draft`에서 "이전 검토와 이번 질문이
  이어질 수 있는 지점"만 설명하는지
- fixed SCN-001 frozen draft path가 `workplace_change_reason_summary` / 사업장 변경
  사유 정리서 초안만 제공하고 backend/LLM 또는 `/api/v1/documents/draft`를 호출하지
  않는지
- Bridge handoff가 있고 included/checked Bridge context가 있을 때만 표시하는지
- strong/weak/no/conflicting matrix outcome을 UI copy와 panel visibility로만
  연결하고 구현 scoring으로 고정하지 않는지
- strong overlap이면 continuity explanation, weak overlap이면 reference-only note
  또는 hidden, no overlap/deleted/hidden/all-unchecked/missing answer evidence면
  hidden으로 정렬하는지
- reference-only note가 Bridge를 현재 답변의 legal basis로 사용하지 않았다고
  분명히 말하는지
- unsafe/conflicting/deleted/hidden source는 설명보다 panel hiding을 우선하는지
- answer remains primary이고 Bridge info remains supplementary인지
- draft CTA/button이 Bridge-origin result에서 계속 hidden인지
- live/backend SCN-001 draft affordance가 relevance guard와 별도 quality gate,
  document type confirmation, separate review 전 열리지 않는지
- `/api/v1/answer`와 `/api/v1/documents/draft` public contract unchanged, SCN-004
  login-free draft flow unchanged 상태를 유지하는지
- raw Before/Bridge payload, raw `after_query_seed`, token, Firebase uid,
  provider_subject, email, raw query, full answer body, artifact body를 문서/코드/UI에
  쓰거나 노출하지 않는지
- Step 3 full retention lifecycle implementation, hard delete, file purge, GCS
  lifecycle, audit/export, undo/restore, account deletion/access-control, orphan
  cleanup, SCN-005, provider_timeout retry/backoff hardening을 여전히 열지 않는지

Current prompt target summary:

- SCN-004 freeze와 `/api/v1/answer`, `/api/v1/documents/draft` public contract
  unchanged 상태를 유지한다.
- Bridge/query relevance guard matrix review는 completed/current design
  baseline이다.
- SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow와 continuity panel은
  completed 상태다.
- 다음 target 후보는 frozen draft + continuity panel browser rehearsal/evidence
  finalization, docs sync/release readiness, optional live Bridge handoff continuity
  smoke다.
- Continuity panel은 Bridge -> After answer-only continuity explanation과 fixed
  frozen draft continuity explanation이며, Bridge-as-Continuity, Not Grounding
  정책을 유지한다.
- 코드 구현 프롬프트, DB schema/migration 확정, protected SCN-001 draft endpoint
  path/method/schema 확정, API 구현 프롬프트, live/backend SCN-001 document draft
  generation, SCN-001 live draft freeze, SCN-005, Step 3 full retention lifecycle implementation,
  hard delete/file purge, GCS lifecycle job, orphan cleanup job,
  provider_timeout retry/backoff hardening은 열지 않는다.
