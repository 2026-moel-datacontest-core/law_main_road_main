# Post-Phase 8 SCN-001 Extension Roadmap

기준일: `2026-04-24`

이 문서는 Phase 8 이후 후속 작업 후보를 작고 안전한 순서로 정리하는
post-Phase 8 candidate roadmap이다.

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

## 3. Recommended Sequence

### Step 1. Logout Memory State Clear

다음 구현 후보로 가장 작고 안전하다.

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

### Step 2. Read-only History

로그인 사용자가 이전 Before review jobs / Bridge runs를 조회하는 후보 phase다.
먼저 read-only list/detail만 검토한다.

- 삭제, 수정, artifact body 노출 없이 목록/상세 조회만 고려한다.
- internal user linkage로 ownership을 확인한다.
- Firebase uid, provider_subject, email, token은 response/UI/docs/logs에 노출하지
  않는다.
- raw Before result, raw contract/OCR, raw query, full answer body, artifact body는
  기본 노출하지 않는다.
- optional `GET /api/v1/scn001/runs` 또는 별도 read-only endpoint는 착수 전
  contract review가 필요하다.

Acceptance direction:

- 로그인 사용자는 본인 소유의 Before/Bridge history만 조회한다.
- 없는 항목 또는 타인 소유 항목은 existence leak이 없도록 처리한다.
- SCN-004 public answer/draft contract는 변경하지 않는다.

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
- Bridge checked answer의 cited_articles / grounded_context_ids / displayed safe subset
  boundary를 기준으로 draft eligibility를 검토한다.
- raw Before/Bridge payload, after_query_seed, token을 저장하지 않는다.
- 검색/답변 결과에 없는 법령 근거를 draft에 새로 만들지 않는다.

Open design questions:

- SCN-001에서 어떤 document type이 필요한가.
- draft request는 protected SCN-001 endpoint로 분리할지, 별도 contract를 둘지.
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
- read-only history와 history deletion을 한 patch에 섞지 않는다.
- history deletion과 artifact retention/access-control 정책 확정을 한 patch에서
  무리하게 닫지 않는다.
- SCN-001 draft와 SCN-004 freeze QA를 한 patch에 섞지 않는다.
- SCN-001 draft와 provider_timeout retry/backoff hardening을 섞지 않는다.
- SCN-001 draft와 SCN-005 document type 확장을 섞지 않는다.
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
- `data/legalize-kr/` 직접 수정 금지.
- `backend/data/law_chunks/` 직접 수정 금지.
- RAG / answer / retrieval behavior 또는 API response contract 변경이 없으면 broad
  full eval을 실행하지 않는다.

## 6. Suggested First Implementation Prompt Target

다음 구현 후보는 Step 1 logout memory state clear다.

Suggested prompt target:

```text
SCN-004 freeze를 유지하면서 로그아웃 시 FlowContext, Before local state,
Bridge handoff memory state를 초기화한다. Web Storage는 사용하지 않고,
SCN-004 login-free /after path와 public answer/draft contract는 그대로 유지한다.
```
