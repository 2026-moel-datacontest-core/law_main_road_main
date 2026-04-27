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
- SCN-001 document draft는 아직 구현 확정이 아니라 별도 큰 phase 후보로만 둔다.

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
- Post-Phase 8 Step 2A protected read-only history backend endpoints 완료.
- Post-Phase 8 Step 2B-1 frontend history helper/types 완료.
- Post-Phase 8 Step 2B-2 `/before` read-only history UI 완료.
- Post-Phase 8 Step 1.6 main page Before entry login gate 완료.
- Post-Phase 8 actual browser logged-in smoke PASS.
- SCN-001 protected frontend auth gate hardening 완료: Firebase signed-in 단독이
  아니라 backend `/api/v1/auth/me` verification 완료 상태(`backendUser.logged_in`)를
  기준으로 main Before CTA, `/before` history, Before analysis, Bridge handoff를
  보호한다.

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
- Deletion API, retention policy, and SCN-001 document draft remain out of scope.

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

삭제는 read-only history 이후의 다음 설계 후보로 검토한다. 이 문서 업데이트는
history deletion을 코드로 열지 않고, 구현 전에 정해야 할 정책 범위를 고정한다.
DB schema, API contract, migration은 아직 확정하지 않는다.

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

이 subsection은 Step 3 deletion 개발 전 policy draft다. DB schema, migration,
API path/method, deletion endpoint response shape, batch job 구현, hard delete
window를 확정하지 않는다. MVP deletion은 soft delete / hide-first 방향을 우선
검토하고, hard delete와 artifact file purge는 별도 retention policy와 ops review
이후 후보로 둔다.

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

- Deletion API 구현이 아니다.
- DB schema/migration 확정이 아니다.
- account deletion/access-control 구현이 아니다.
- SCN-001 document draft가 아니다.
- SCN-004 freeze 변경이 아니다.
- `/api/v1/answer` public contract 변경이 아니다.
- `/api/v1/documents/draft` public contract 변경이 아니다.

Acceptance direction:

- 삭제 동작은 본인 소유 record에만 적용된다.
- 삭제 또는 hidden 처리된 record가 history list/detail과 Bridge selection에 다시
  노출되지 않는다.
- Step 4가 열린 경우에도 deleted/hidden record는 future continuity panel / future
  draft affordance에 다시 노출되지 않는다.
- 관련 artifact lifecycle / retention / visibility policy가 문서화된 뒤 구현된다.
- deletion은 아직 코드 구현으로 열지 않고 위 policy matrix와 response checkpoint
  review까지만 진행한다.

### Step 4. SCN-001 Document Draft

SCN-001 Bridge checked answer에서 문서 초안을 제공하는 후보 phase다.
현재 SCN-001 answer-only 정책을 바꾸는 별도 큰 phase로 취급한다.

- SCN-001 전용 document type, template, eligibility guard가 필요하다.
- SCN-004 document draft freeze와 같은 patch에 섞지 않는다.
- public `/api/v1/documents/draft` contract를 변경하지 않는 방향을 우선 검토한다.
- protected SCN-001 draft endpoint 또는 별도 contract가 필요한지 검토한다.

#### Bridge-as-Continuity, Not Grounding

이 정책은 Step 4만의 UI 표현이 아니라 Bridge 전반의 grounding 경계다.

- 사용자의 현재 query에 대한 answer는 기본 answer처럼 유지하고, Bridge 정보를
  answer의 숨은 문맥으로 강하게 섞지 않는다.
- future Step 4 scope에서 Bridge 정보를 노출한다면 우측 문서초안 영역 아래 또는
  별도 보조 패널에서 "이전 검토와 이번 질문이 어떻게 이어질 수 있는지"를 설명하는
  continuity / side explanation으로만 사용한다.
- Bridge와 현재 query 사이에 겹치는 issue / law / action이 있을 때만 "이어질 수
  있음"을 표시한다.
- 관련성이 약하면 Bridge 설명을 숨기거나 "이번 답변의 법적 근거로 사용하지 않은
  참고용 이전 기록" 수준으로 제한한다.
- Bridge 설명은 cited_articles / grounded_context_ids를 새로 만들지 않는다.
- Bridge checked answer의 cited_articles / grounded_context_ids / displayed safe subset
  boundary를 기준으로 draft eligibility 후보를 검토하되, Bridge 설명 자체를
  grounding source로 승격하지 않는다.
- Phase 7 displayed safe subset may still be used to build the Bridge-origin answer
  query as already implemented, but it must not create new `cited_articles`,
  `grounded_context_ids`, or legal grounding outside retrieved answer evidence.
- Bridge continuity / SCN-001 draft extension은 raw Before/Bridge payload, raw
  `after_query_seed`, token, Firebase uid, provider_subject, email의 신규 저장을
  추가하지 않는다.
- raw query, full answer body, artifact body는 docs/logs/UI/commits/issues/chat에
  기록하지 않는다. 기존 answer/draft artifact persistence는 `after_artifact_runs`
  retention / access-control 정책에서 별도로 다룬다.
- 검색/답변 결과에 없는 법령 근거를 draft에 새로 만들지 않는다.

#### Relevance/matching guard candidates

이 매트릭스는 Step 4/5 전제 조건 후보이며, 단독으로 legal grounding을 만들지
않는다.

| candidate signal | positive use | weak/no overlap behavior | citation boundary |
|---|---|---|---|
| overlap on `issue_categories` / `risk_tags` | 같은 이슈 범주가 이어지는지 판단 | hide continuity panel or show reference-only note | never use overlap alone to create legal citations |
| overlap on `law_refs` / `cited_articles` | 기존 Bridge law hint와 현재 answer evidence가 겹치는지 확인 | hide continuity panel or show reference-only note | never use overlap alone to create legal citations |
| overlap on `recommended_next_actions` | 다음 행동 흐름이 이어질 수 있는지 판단 | hide continuity panel or show reference-only note | never use overlap alone to create legal citations |

Step 4 implementation handoff checkpoint:

- A future SCN-001 draft or continuity implementation plan must explicitly state which
  fields are continuity-only and which fields come from retrieved answer evidence.
- Only the current answer evidence may populate legal basis fields, `cited_articles`,
  `grounded_context_ids`, or draft eligibility.
- Bridge displayed safe subset may shape the Bridge-origin query text, but cannot be
  described in UI, docs, or code comments as legal grounding by itself.
- If relevance/matching is weak or absent, the continuity panel and draft affordance
  should stay closed rather than showing a low-confidence bridge explanation.
- Any future draft endpoint proposal must preserve SCN-004 login-free draft behavior
  and keep public `/api/v1/documents/draft` unchanged unless a separate backend/schema
  review explicitly changes that contract.

Open design questions:

- SCN-001에서 어떤 document type이 필요한가.
- draft request는 protected SCN-001 endpoint로 분리할지, 별도 contract를 둘지.
- Bridge result와 현재 After query의 관련성/정합성은 어떤 기준으로 판단할지.
- continuity / side explanation은 어떤 field subset으로 구성하고, 관련성이 약한
  경우 어떤 UI 상태로 숨길지.
- `after_artifact_runs.source_bridge_run_id` 단일 provenance로 충분한지, draft
  provenance에는 별도 linkage가 필요한지.
- SCN-001 draft result의 quality gate와 manual rehearsal 기준은 무엇인지.

### Step 5. SCN-001 Draft Freeze

SCN-001 draft 결과가 원하는 수준으로 안정화되면 presentation-local freeze
fixture/preset 후보로 검토한다.

- `SCN-004-DEMO-FREEZE`와 분리한다.
- SCN-001 draft freeze는 별도 preset/fixture 이름과 별도 eligibility guard를 둔다.
- fixed fixture는 demo stability 목적이며 live retrieval/answer evidence와 혼용하지
  않는다.
- freeze 전에는 `Bridge-as-Continuity, Not Grounding` 정책과 Bridge-query
  relevance/matching guard가 먼저 고정되어야 한다.
- freeze 전에는 SCN-001 draft live quality, citation grounding, document output을
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
- provider_timeout/OCR retry/backoff/hard-timeout hardening을 UI polish와 섞지
  않는다.
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

실제 브라우저 logged-in smoke는 PASS 상태다. read-only history 이후 다음 후보는
Step 3 retention window and cascade policy decision draft다. 다만 deletion은 바로
구현하지 않고, soft delete / hard delete / retention / artifact lifecycle /
ownership / visibility policy를 먼저 문서로 review한다. 다음 prompt target은
deletion API/schema 구현이 아니라 retention window와 cascade policy를 중심으로
open policy question을 좁히는 decision draft로 제한한다.

Review focus:

- protected linked artifacts / public unlinked After answer artifacts / orphan artifact
  candidates 구분이 account history와 artifact lifecycle에 충분한지
- not-found / not-owned / already-deleted 외부 응답 동일 원칙이 existence leak을
  줄이기에 충분한지
- future Bridge selection은 항상 닫히고, future continuity panel과 future draft
  affordance는 Step 4가 열려도 닫히는지
- hard delete eligibility가 retention/audit/artifact lifecycle review 이후 후보로만
  남아 있는지
- retention window, audit log/status column, file purge job, orphan classification,
  cascade policy가 구현 확정 없이 review/refine 대상으로 남아 있는지
- deletion API, DB schema/migration, account deletion/access-control implementation을
  여전히 열지 않는지

Suggested prompt target:

```text
SCN-004 freeze와 `/api/v1/answer`, `/api/v1/documents/draft` public contract
unchanged 상태를 유지하면서 `docs/planning/22_post_phase8_scn001_extension_roadmap.md`
의 Step 3 retention window and cascade policy decision draft를 review/refine한다.
retention window, audit log/status column, file purge job, orphan classification,
cascade policy를 open policy question으로 좁히되, 코드 구현, DB schema/migration
확정, deletion API 구현 프롬프트 작성, account deletion/access-control
implementation, SCN-001 document draft, SCN-001 draft freeze,
provider_timeout/OCR retry hardening은 열지 않는다.
```
