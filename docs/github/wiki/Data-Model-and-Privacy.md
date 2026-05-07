# 데이터 모델과 개인정보 경계

## 법령 코퍼스 (Law Corpus)

현재 source of truth:

- `backend/data/law_chunks/all_chunks.json`
- live corpus: `1722` chunks
- `selected_as_of = 2026-04-11`

Chunking output은 직접 수정하지 않습니다. Updates는 문서화된 pipeline 또는 명시적
fixture/data supplementation procedure를 거쳐야 합니다.

## 핵심 테이블 (Core Tables)

현재 database model에 포함된 tables:

- `law_chunks`
- `users`
- `before_review_jobs`
- `bridge_runs`
- `after_artifact_runs`

SCN-001 user-facing history는 MVP soft-delete를 위해 visibility fields를
사용합니다. 이는 hard delete, artifact physical deletion, file purge, full
retention lifecycle을 열지 않고 user-facing lists에서 기록을 숨깁니다.

## Browser storage 경계

frontend는 다음 항목을 Web Storage에 저장하지 않습니다.

- Firebase ID token
- OAuth bearer credentials or long-lived auth credentials
- raw user statement
- full answer payload
- full draft payload
- case intake
- raw Bridge payload
- raw `after_query_seed`
- auth-provider subject identifiers, email values, or database account identifiers

Saved-history handoff, UI display, answer query construction, Web Storage는
displayed safe subset information만 사용합니다. Immediate Bridge creation은 현재
session 동안 backend-returned handoff fields를 React memory에 둘 수 있지만, 이를
legal grounding으로 노출하지 않고 browser storage에 저장하지 않습니다.

## 공개 문서 경계

Public screenshots와 docs에는 다음 항목을 노출하지 않습니다.

- exact cloud resource identifiers
- cloud identity emails
- cloud secret names or values that reveal private architecture
- private bucket names
- private runtime endpoints
- real user/case data

## 보관/삭제 경계

SCN-001 history는 현재 MVP soft-delete visibility를 지원합니다. 이는 user-facing
lists에서 기록을 숨기고 hidden records가 protected Bridge continuations로 이어지는
것을 막습니다. Full retention lifecycle, hard delete, artifact file purge,
restore, export, account deletion, orphan cleanup은 current MVP 범위 밖입니다.

## 함께 보기

- [[보안 모델|Security-Model]]
- [[설계 원칙|Design-Principles]]
- [[클라우드 전환과 공개 미러 정책|Cloud-Migration-and-Public-Mirror-Policy]]
