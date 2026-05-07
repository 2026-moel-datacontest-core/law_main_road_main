# 범위 및 비목표

이 문서는 현재 공개 가능한 MVP 범위와 의도적으로 열지 않은 영역을 구분합니다.

## 현재 범위 (In Scope)

- Korean labor-law retrieval과 grounded answer generation
- SCN-004 login-free After document draft flow
- SCN-001 backend-verified Before -> Bridge -> After answer linkage
- protected SCN-001 paths용 Firebase Google Sign-In
- protected SCN-001 history archive와 MVP soft-delete
- stable demo rehearsal을 위한 frontend-local fixed preset path
- frontend에서 생성하는 SCN-001 exact fixed-preset frozen draft
- local development와 demo verification guide
- dev-first cloud migration documentation

## 비목표 (Non-Goals)

- final legal judgment 또는 attorney replacement
- production-grade legal consultation service claim
- live/backend SCN-001 document draft generation 미오픈(NOT opened)
- protected SCN-001 draft API 미오픈(NOT opened)
- independent `/bridge` route
- Recovery implementation
- SCN-005 frontend or document draft expansion
- full retention lifecycle, hard delete, artifact physical purge, account deletion
- browser storage 또는 public docs에 raw user/case data 노출
- public mirror repository에서 deploy 수행
- contest/demo posture를 long-running production service로 표현

## 경계가 필요한 이유

프로젝트는 demo reliability, legal grounding, privacy를 우선합니다. public API
contracts를 바꾸거나 retention policy를 확장하거나 새 access-control review가
필요한 기능은 current MVP 범위 밖에 둡니다.

## 시나리오 경계

SCN-004는 main login-free public demo입니다. SCN-001은 logged-in users를 위한
protected connected flow입니다. Bridge는 사용자의 이전 사건 맥락을 After question에
연결하지만, 사건 맥락 연결/참고용이며 법적 근거(legal grounding)가 아닙니다.
legal citations를 만들거나 retrieval evidence를 대체하지 않습니다.

## 함께 보기

- [[설계 원칙|Design-Principles]]
- [[보안 모델|Security-Model]]
- [[클라우드 전환과 공개 미러 정책|Cloud-Migration-and-Public-Mirror-Policy]]
