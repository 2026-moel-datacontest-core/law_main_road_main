# Bridge Flow

기준일: `2026-04-29`

## 현재 상태

Bridge는 제품 구조상 `Before -> After`를 연결하는 단계다. 현재 SCN-004 frontend demo에서는 구현하지 않는다.

현재 기준:

- `/bridge` route 없음
- `bridge_runs` DB schema는 Phase 1에서 구현 완료
- protected bridge-runs route/service는 Phase 4에서 구현 완료
- Before 결과 runtime user linkage는 Phase 5에서 구현 완료
- Bridge -> After answer-only handoff는 Phase 6A~6F에서 구현 완료
- Phase 6F live subset PASS with retry. Vertex IAM/credential issue는 runtime resolved이며 residual runtime risk는 transient `provider_timeout`이다.
- Phase 7A `AfterArtifactLinkage` optional persistence plumbing 완료
- Phase 7B protected bridge answer endpoint 완료: `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`
- Phase 7C~7E protected bridge answer frontend helper/routing and live smoke 완료
- `/after` saved Before/Bridge history selector 완료
- `/history` record archive 완료
- MVP soft-delete 완료
- exact `SCN-001-BRIDGE-DEMO` frontend-local frozen draft flow 완료
- latest main `85d10fa` 기준 `/after` saved history 연결점은 unselected primary
  blue, selected success green accent를 사용한다. Bridge는 계속
  continuity/reference일 뿐 legal grounding이 아니다.
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

`scenario_id`, `source_scenario`, `preset_id`는 `SCN-001-BRIDGE-DEMO` 같은 presentation preset과 Before output을 After에서 연결하기 위한 구분 필드다. 현재 protected Bridge run은 Before output 기반으로 생성하고, presentation preset exact path는 bridge_runs를 만들지 않는 frontend-local demo path로 유지한다.

Firebase Auth Google Sign-In 기반 최소 로그인은 프로젝트 공통 인증 capability로 허용한다. 단, 실제 적용은 사용자별 상태 연결이 필요한 SCN-001 protected path로 제한한다. Phase 0~7E, read-only history, `/after` saved selector, `/history` archive, MVP soft-delete는 완료됐다. 이 capability는 SCN-004 demo freeze를 변경하지 않는다.

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
- raw `after_query_seed` persistent storage
- raw `after_query_seed` in `/api/v1/answer.query` or protected bridge answer query

## 후속 조건

Bridge backend protected endpoint + service는 Phase 4에서 구현됐다. 현재 구현은 독립 `/bridge` UI가 아니라 SCN-004 demo freeze를 유지한 `POST /api/v1/scn001/bridge-runs`, `GET /api/v1/scn001/bridge-runs/{bridge_run_id}`, `/before` CTA, `/after` Bridge handoff cards, `/after` saved history selector, `/history` archive다.

Bridge handoff screen submission은 all unchecked라도 sticky `answer_origin = "bridge_handoff"`를 유지한다. query는 user question only로 갈 수 있다.

Result는 answer-only / draft disabled를 유지한다. regular draft behavior는 direct `/after` 진입 또는 reset/re-entry가 필요하다.

Phase 7B protected bridge answer endpoint는 별도 public contract를 만들지 않고 `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`를 사용한다. `after_artifact_runs.source_bridge_run_id`는 MVP에서 single primary bridge_run_id이며 multi-bridge full provenance는 Post-MVP join table 후보로 둔다.

SCN-001 fixed-preset frozen draft는 Bridge product story를 보여주는
presentation-local path다. Backend/LLM을 호출하지 않고
`/api/v1/documents/draft`도 호출하지 않는다. live/backend SCN-001 draft
generation, protected SCN-001 draft endpoint, Step 3 full retention lifecycle은
현재 열지 않는다.
