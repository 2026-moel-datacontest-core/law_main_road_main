# 법대로(LawMainRoad) 공개 문서

이 폴더는 GitHub에 공개할 README와 Wiki 문서의 staging source입니다.

`docs/planning/`, `docs/architecture/`, `docs/ops/`, `docs/specs/`는 개발 중
쌓아 둔 내부 설계/운영 기록입니다. 공개 문서는 그 내용을 그대로 노출하지
않고, 현재 구현 기준과 공개 가능한 범위만 선별해 이 폴더에서 다시 정리합니다.

## 공개 대상

| 대상 | 이 repo 안의 source | 용도 |
|---|---|---|
| Repository README | root [`README.md`](../../README.md) | 첫 화면용 프로젝트 요약 |
| GitHub Wiki | [`wiki/`](wiki/) | 사용자와 리뷰어를 위한 상세 공개 문서의 publish source |
| 선택형 요약 reference | `project-overview.md`, `system-architecture.md`, `user-flows.md`, `api-reference.md`, `runbook.md` | public mirror가 유지하기로 한 경우에만 포함 |

Wiki가 canonical publish source입니다. 선택형 요약 reference도 Wiki와 같은
redaction boundary를 만족하는 경우에만 public mirror에 유지할 수 있습니다.

## Wiki 원본

GitHub Wiki에 올릴 문서는 [`wiki/`](wiki/) 아래에 쌓습니다.

주요 파일:

- [`wiki/Home.md`](wiki/Home.md)
- [`wiki/_Sidebar.md`](wiki/_Sidebar.md)
- [`wiki/Project-Execution-and-Completion.md`](wiki/Project-Execution-and-Completion.md)
- [`wiki/Final-Architecture.md`](wiki/Final-Architecture.md)
- [`wiki/User-Flows.md`](wiki/User-Flows.md)
- [`wiki/API-Endpoints-and-Schemas.md`](wiki/API-Endpoints-and-Schemas.md)
- [`wiki/RAG-and-Law-Corpus.md`](wiki/RAG-and-Law-Corpus.md)
- [`wiki/UI-Screens.md`](wiki/UI-Screens.md)
- [`wiki/E2E-Demo-Verification.md`](wiki/E2E-Demo-Verification.md)
- [`wiki/Cloud-Migration-and-Public-Mirror-Policy.md`](wiki/Cloud-Migration-and-Public-Mirror-Policy.md)

## 현재 기준선

기준일: `2026-05-13`

- 메인 public demo: SCN-004 After document draft flow
- 보호 연결 흐름: SCN-001 Before -> Bridge -> After
- Auth: Firebase Auth Google Sign-In + backend Firebase Admin verification
- Data: `1722` law chunks, `selected_as_of = 2026-04-11`
- Frontend routes: `/`, `/before`, `/after`, `/after/result`,
  `/after/intake`, `/after/draft`, `/history`
- Backend: FastAPI + PostgreSQL + pgvector
- 최신 UI 기준선: 2026-04-29 integrated visual polish
- 최신 code/runtime 기준선: `b013429`
- public demo URL: `https://www.law-main-road.cloud`
- cloud posture: Phase 7A public `www` domain launch 완료, Phase 7B GCS
  artifact/observability 후보 문서화 완료(구현 미오픈)

## 공개 경계

공개 문서에서 설명할 수 있는 내용:

- 제품 목적과 지원 시나리오
- high-level architecture
- 구현된 public/protected API paths
- 로컬 실행과 검증 command
- 개인정보와 보안 원칙
- 비밀값을 제외한 cloud migration posture

공개 문서에 노출하지 않는 내용:

- credential values, local env values, infrastructure state files, cloud IAM key files
- raw user/case facts, full answer/draft payloads, raw Bridge payloads
- auth-provider subject identifiers, email values, database account identifiers, internal Bridge record identifiers
- 승인된 source/mirror policy를 넘어서는 private source repo 내부 정보
- exact private cloud resource identifiers, cloud secret values, private runbook details

## 관리자 메모

Wiki source는 검토된 내부 planning, architecture, operations, specs, product,
demo, report, presentation 문서를 바탕으로 공개 경계에 맞게 다시 정리한
문서입니다. 별도 public-boundary review 없이 내부 원문을 public mirror에 그대로
복사하지 않습니다.
