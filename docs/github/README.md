# K-Labor Shield Docs

이 폴더는 GitHub에 보여주기 위한 읽기용 문서입니다.

`docs/planning/`은 개발 과정에서 phase, QA, 의사결정, freeze 정책을 계속
쌓아 둔 내부 작업 기록입니다. 공개 README에서 바로 읽기에는 길고 중복이
많기 때문에, 현재 코드 기준의 핵심 설명은 이 폴더에 별도로 정리합니다.

## Documents

- [Project Overview](project-overview.md)
- [System Architecture](system-architecture.md)
- [User Flows](user-flows.md)
- [API Reference](api-reference.md)
- [Runbook](runbook.md)

## Current Baseline

기준일: `2026-04-29`

- Main public demo: SCN-004 After document draft flow
- Protected connected flow: SCN-001 Before -> Bridge -> After
- Auth: Firebase Auth Google Sign-In + backend Firebase Admin verification
- Data: `1722` law chunks, `selected_as_of = 2026-04-11`
- Frontend routes: `/`, `/before`, `/after`, `/after/result`,
  `/after/intake`, `/after/draft`, `/history`
- Backend: FastAPI + PostgreSQL + pgvector
- Latest UI checkpoint: `85d10fa` integrated Before/After/History/Main polish,
  DESIGN.md visual guide, contrast/disclaimer/accessibility blocker fixes
- Latest main checkpoint: `85d10fa`

## Scope Boundary

Implemented:

- Law retrieval and grounded answer generation
- Deterministic SCN-004 document draft generation
- Firebase-authenticated SCN-001 Bridge answer path
- SCN-001 read-only history, saved history selector, and MVP soft-delete
- Frontend-local SCN-001 fixed-preset frozen draft demo
- Token-first frontend visual polish with neutral/dense/evidence-led work routes
  and prominent disclaimers/uncertainty
- Integrated frontend UI polish through `85d10fa`

Not implemented:

- live/backend SCN-001 draft generation
- protected SCN-001 draft endpoint
- independent `/bridge` route
- Recovery flow
- SCN-005 frontend/document draft expansion
- full retention lifecycle and hard delete

## Internal References

For maintainers, the current internal checkpoint is:

- [../planning/23_code_based_status_2026_04_29.md](../planning/23_code_based_status_2026_04_29.md)

Long-form internal phase records:

- [../planning/19_scn001_auth_integration_status.md](../planning/19_scn001_auth_integration_status.md)
- [../planning/22_post_phase8_scn001_extension_roadmap.md](../planning/22_post_phase8_scn001_extension_roadmap.md)
