# ADR 설계 결정

이 문서는 공개 가능한 design decisions를 요약합니다. 내부 phase notes는
`docs/planning/`에 유지합니다.

## ADR-001: PostgreSQL + pgvector 선택

결정: law chunk storage와 vector search에 PostgreSQL + pgvector를 사용합니다.

이유: MVP backend에는 structured records와 vector retrieval을 하나의 data layer에서
다루는 구조가 필요합니다.

## ADR-002: SCN-001 보호 경로의 Firebase Auth

결정: backend Firebase Admin verification과 함께 Firebase Google Sign-In을 사용합니다.

이유: SCN-001은 custom password collection을 피하면서 user-linked
Before/Bridge/history records가 필요합니다.

## ADR-003: Frontend auth persistence는 in-memory

결정: MVP에서는 in-memory persistence를 사용합니다.

이유: token persistence risk를 줄이기 위한 선택입니다. session persistence는
future UX tradeoff이며 current default가 아닙니다.

## ADR-004: SCN-004는 login-free 유지

결정: SCN-004 After answer/draft flow는 login-free로 유지합니다.

이유: main public demo path이므로 안정성을 유지해야 합니다.

## ADR-005: Bridge는 continuity이며 grounding이 아님

결정: Bridge context는 displayed safe subset information을 전달할 수 있지만,
legal citations나 grounded context ids를 만들 수 없습니다.

이유: legal grounding은 prior case summary만이 아니라 retrieval/answer evidence에서
나와야 합니다.

## ADR-006: SCN-001 frozen draft는 frontend-local preset

결정: exact `SCN-001-BRIDGE-DEMO` draft는 deterministic template을 바탕으로
frontend에서 생성합니다.

이유: live/backend SCN-001 draft generation과 protected draft endpoint는 current
MVP에서 미오픈(NOT opened)입니다.

## ADR-007: MVP soft-delete만 구현

결정: SCN-001 history에 user-facing soft-delete visibility를 구현합니다.

이유: full retention lifecycle, hard delete, physical file purge, restore
policy는 separate policy review가 필요합니다.

## ADR-008: Cloud migration은 dev-first

결정: first Terraform apply target은 `dev`입니다. `demo/contest`는 dev smoke
이후에 따르고, `prod`는 separate review를 요구합니다.

이유: public contest demo posture를 full production으로 표현하지 않기 위한 결정입니다.

## 함께 보기

- [[설계 원칙|Design-Principles]]
- [[범위 및 비목표|Scope-and-Non-Goals]]
- [[클라우드 전환과 공개 미러 정책|Cloud-Migration-and-Public-Mirror-Policy]]
