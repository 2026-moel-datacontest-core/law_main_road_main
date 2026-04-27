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

삭제는 read-only history 이후 별도 phase로 검토한다.

- soft delete를 우선 검토한다.
- hard delete는 retention, audit, artifact file lifecycle 검토 후에만 고려한다.
- `before_review_jobs`, `bridge_runs`, `after_artifact_runs`, artifact files 사이의
  관계 정책이 먼저 필요하다.
- orphan artifact, linked artifact, public unlinked artifact의 삭제/보관 정책을
  구분해야 한다.
- 삭제 UI/API는 account history access control과 같은 patch에 섞지 않는다.

Acceptance direction:

- 삭제 동작은 본인 소유 record에만 적용된다.
- 삭제된 record가 history list/detail에 다시 노출되지 않는다.
- 관련 artifact file 처리 정책이 문서화된 뒤 구현된다.

### Step 4. SCN-001 Document Draft

SCN-001 Bridge checked answer에서 문서 초안을 제공하는 후보 phase다.
현재 SCN-001 answer-only 정책을 바꾸는 별도 큰 phase로 취급한다.

- SCN-001 전용 document type, template, eligibility guard가 필요하다.
- SCN-004 document draft freeze와 같은 patch에 섞지 않는다.
- public `/api/v1/documents/draft` contract를 변경하지 않는 방향을 우선 검토한다.
- protected SCN-001 draft endpoint 또는 별도 contract가 필요한지 검토한다.
- Bridge result ↔ After query relevance/matching guard를 둔 뒤에만 오른쪽 추가
  설명 또는 문서 초안 affordance를 여는 방향을 후보로 검토한다.
- Bridge checked answer의 cited_articles / grounded_context_ids / displayed safe subset
  boundary를 기준으로 draft eligibility를 검토한다.
- raw Before/Bridge payload, after_query_seed, token을 저장하지 않는다.
- 검색/답변 결과에 없는 법령 근거를 draft에 새로 만들지 않는다.

Open design questions:

- SCN-001에서 어떤 document type이 필요한가.
- draft request는 protected SCN-001 endpoint로 분리할지, 별도 contract를 둘지.
- Bridge result와 현재 After query의 관련성/정합성은 어떤 기준으로 판단할지.
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
- freeze 전에는 SCN-001 draft live quality, citation grounding, document output을
  별도 evidence로 확인한다.

## 4. Do Not Mix

- logout clear와 history API를 한 patch에 섞지 않는다.
- Before login-required UX polish와 Step 2A history API 구현을 한 patch에 섞지
  않는다.
- history deletion과 artifact retention/access-control 정책 확정을 한 patch에서
  무리하게 닫지 않는다.
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
- `data/legalize-kr/` 직접 수정 금지.
- `backend/data/law_chunks/` 직접 수정 금지.
- RAG / answer / retrieval behavior 또는 API response contract 변경이 없으면 broad
  full eval을 실행하지 않는다.

## 6. Suggested Next Prompt Target

실제 브라우저 logged-in smoke는 PASS 상태다. Step 2B-3 또는 Step 3는 아직 열지
않는다.

Suggested prompt target:

```text
SCN-004 freeze를 유지하면서 Post-Phase 8 logged-in smoke PASS 상태를 보존한다.
다음 작업이 필요하면 read-only history status/semantic polish 또는 제출 전
preflight를 별도 작은 범위로 수행한다. Step 2B-3, history deletion/retention,
SCN-001 document draft, provider_timeout/OCR retry hardening은 열지 않는다.
```
