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

## ADR-009: Public demo domain routing은 Firebase Hosting으로 시작

결정: Cloud Run managed HTTPS URL은 smoke/rollback path로 유지하고, public
contest/portfolio용 custom domain은 Phase 7A에서 Firebase Hosting custom domain
방식으로 시작했습니다. 첫 public demo host는 `https://www.law-main-road.cloud`입니다.
별도 `demo` Terraform environment를 만들지 않고, 기존 `dev` resources에
`demo/contest` posture를 얹습니다.

검토한 선택지:

- Cloud Run managed HTTPS URL만 사용: 가장 단순하고 Phase 1-6 migration proof에는
  충분하지만, public portfolio URL로는 덜 정돈되어 보입니다.
- Gabia URL forwarding: 가장 쉽게 연결할 수 있지만, 진짜 custom domain hosting이
  아니며 주소창이 Cloud Run URL로 바뀌거나 masking 방식이 auth/routing 문제를 만들 수
  있습니다.
- Cloud Run direct domain mapping: 단순해 보이지만 target region과 feature support
  제약 때문에 기본 선택지로 두지 않습니다.
- Firebase Hosting custom domain: Firebase를 이미 Auth에 사용하고 있어 가장
  가벼운 public domain edge 후보입니다. Phase 7A의 첫 선택지로 사용했고 `www`
  host 연결을 완료했습니다.
- HTTPS Load Balancer + serverless NEG: 가장 확장성이 좋고 Cloud Armor/API domain으로
  이어질 수 있지만, 비용과 Terraform/DNS/certificate 복잡도가 커서 defer합니다.

이유: Phase 1-6의 목표는 dev-first Cloud Run 배포와 운영 baseline 검증입니다. Domain은
배포 필수조건이 아니라 public demo polish와 edge routing hardening에 가깝습니다. 따라서
`law-main-road.cloud`, Gabia DNS, Firebase Authorized Domains, CORS, frontend API
base, custom API domain 여부는 Phase 7A에서 통제된 범위로 다룹니다. 첫 pass는
frontend custom domain과 작은 backend CORS 확장까지만 완료했습니다.

현재 기본값:

- Cloud Run managed HTTPS frontend URL은 smoke/demo rollback path로 유지합니다.
- direct backend Cloud Run URL은 public docs/screenshots에 노출하지 않습니다.
- custom domain이 붙어도 `prod`는 열리지 않습니다.
- `www.law-main-road.cloud`는 첫 public frontend host로 연결 완료됐습니다.
- Firebase Auth Authorized Domains includes `www.law-main-road.cloud`.
- Frontend API base는 직접 backend URL을 유지합니다. Same-origin `/api/**`
  rewrite와 frontend rebuild는 하지 않았습니다.
- Backend CORS는 `www` custom origin과 기존 frontend rollback/debug origin만
  허용하며 wildcard는 사용하지 않습니다.
- `api.law-main-road.cloud`, root apex, HTTPS Load Balancer, Cloud Armor는 명시
  승인 전까지 defer합니다.

## 함께 보기

- [[설계 원칙|Design-Principles]]
- [[범위 및 비목표|Scope-and-Non-Goals]]
- [[클라우드 전환과 공개 미러 정책|Cloud-Migration-and-Public-Mirror-Policy]]
