# Bridge Flow

기준일: `2026-04-22`

## 현재 상태

Bridge는 제품 구조상 `Before -> After`를 연결하는 단계다. 현재 SCN-004 frontend demo에서는 구현하지 않는다.

현재 기준:

- `/bridge` route 없음
- `bridge_runs` DB schema는 Phase 1에서 구현 완료
- protected bridge-runs route/service는 Phase 4 next
- Before 결과 runtime user linkage는 Phase 5
- SCN-004 demo freeze 유지 중에는 Bridge 확장 금지
- 발표에서는 제품 확장 구조로 설명 가능

## 제품상 목표

- Before 단계에서 발견된 위험 태그와 요약을 보관
- After 분석 시 이전 위험 신호를 함께 보여줌
- “계약 단계에서 예견 가능했던 위험” 섹션 제공
- 상담자나 사용자가 계약 전/후 맥락을 한 번에 볼 수 있게 정리

## 저장 원칙

MVP에서는 개인정보 최소 수집 원칙을 우선한다.

저장 후보:

- 분석 시각
- 문서 유형
- 핵심 요약
- 위험 태그
- 주요 추출 항목
- cited_articles
- scenario_id
- source_scenario 또는 preset_id

`scenario_id`, `source_scenario`, `preset_id`는 `SCN-001-BRIDGE-DEMO` 같은 presentation preset과 Before output을 After에서 연결하기 위한 후보 필드다. 실제 API/DB 스펙 확정 전까지는 계획 수준 후보로만 둔다.

Firebase Auth Google Sign-In 기반 최소 로그인은 프로젝트 공통 인증 capability로 허용한다. 단, 실제 적용은 사용자별 상태 연결이 필요한 SCN-001 protected path로 제한한다. Phase 0~3은 완료됐고, 다음 구현은 Phase 4 protected bridge-runs endpoint + `BeforeHandoffDTO` extraction이다. 이 capability는 SCN-004 demo freeze를 변경하지 않는다.

계정 최소 필드 후보:

- internal user id
- auth_provider = "firebase_google"
- provider_subject = Firebase uid
- display_name nullable
- email nullable
- created_at
- last_login_at

직접 회원가입, 이메일/전화번호 직접 입력 수집, 전화번호 scope 요청, 이메일 primary identifier 사용, access token / refresh token 장기 저장은 계속 금지한다. Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback로만 유지한다. Kakao OAuth는 한국 생활 밀착 UX나 KakaoTalk 기반 알림/상담 연계가 필요해질 때 검토할 후속 provider 후보이며, 첫 구현 범위에서는 제외한다.

저장 금지 또는 후순위:

- 계약서 원문 전체
- 연락처, 계좌번호, 주민등록번호, 외국인등록번호
- raw OCR image / file body
- After raw statement

## 후속 조건

Bridge는 Phase 4에서 backend protected endpoint + service로 먼저 구현한다. 다음 단계는 독립 `/bridge` UI가 아니라 SCN-004 demo freeze를 유지한 `POST /api/v1/scn001/bridge-runs`, `GET /api/v1/scn001/bridge-runs/{bridge_run_id}`와 `BeforeHandoffDTO` extraction이다.
