# Frontend App Plan

## 목적

- MVP 앱 구현 범위 고정
- 웹앱 기준 화면/상태/API 전제 정리
- 데모 우선 구현 순서 명확화
- 2026-04-24 기준 실제 frontend 구현 상태와 다음 QA 범위 정리
- 2026-04-17 상태는 evolution note로 남겨 구현 발전 흐름을 보존

---

## 앱 방향

- MVP 앱은 **Next.js 기반 웹앱**
- 네이티브 Android / iOS 앱은 이번 범위 아님
- 한국어 메인, 영어 보조
- 데스크톱 데모 우선
- 모바일은 기본 반응형만 지원
- SCN-004 After demo flow는 로그인 없이 사용 가능해야 함
- 개인정보 최소 수집 원칙 유지

## 계정 / Firebase Auth 정책

- 직접 회원가입, 이메일 직접 입력 가입/로그인, 전화번호 직접 입력 수집은 계속 금지한다.
- Firebase Auth Google Sign-In 기반 최소 로그인은 프로젝트 공통 인증 capability로 허용한다. 단, 다음 제약 준수 시.
- 실제 적용은 사용자별 상태 연결이 필요한 SCN-001 protected path로 제한한다.
- MVP auth path는 Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase Admin SDK verification이다.
- `auth_provider = "firebase_google"`, `provider_subject = Firebase uid`에서 internal `users.id`를 resolve한다.
- Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback로만 유지한다.
- 전화번호 scope 요청은 금지한다.
- 이메일은 nullable 표시 정보로만 다루며 primary identifier로 사용하지 않는다.
- access token / refresh token 장기 저장은 금지한다.
- Firebase Auth MVP frontend persistence는 `inMemoryPersistence`다. token/auth state를 `localStorage`나 `sessionStorage`에 저장하지 않는다.
- `browserSessionPersistence`는 MVP default가 아니라 Future/Post-MVP UX tradeoff 후보로만 둔다.
- 저장 가능한 최소 사용자 필드는 `internal user id`, `auth_provider="firebase_google"`, `provider_subject = Firebase uid`, `display_name nullable`, `email nullable`, `created_at`, `last_login_at` 수준으로 제한한다.
- Firebase Auth Google Sign-In을 1차 provider로 둔다. 외국인 근로자 대상 접근성이 Kakao보다 넓고, 현재 GCP/Vertex 기반 인프라와 운영 친화적이기 때문이다.
- Kakao OAuth는 한국 생활 밀착 UX나 KakaoTalk 기반 알림/상담 연계가 필요해질 때 검토할 후속 provider 후보이며, 첫 구현 범위에서는 제외한다.
- 이 capability는 SCN-004 demo freeze를 변경하지 않으며, SCN-004 After demo flow는 계속 로그인 없이 동작해야 한다.

## Current Status

- frontend는 SCN-004 After document draft demo 기준으로 구현 완료 상태다.
- 구현 stack:
  - Next.js `16.2.4`
  - React `19.2.5`
  - TypeScript
  - CSS Modules + `--kl-*` design tokens
- 구현 route:
  - `/`
  - `/before`
  - `/after`
  - `/after/result`
  - `/after/intake`
  - `/after/draft`
- 실제 API 연동:
  - `POST /api/v1/answer`
  - `POST /api/v1/documents/draft`
- 구현 완료 범위:
  - Phase 1 API-connected happy path
  - Phase 2 error / loading / a11y / route guard
  - Phase 3 A/B: copy, print, evidence checklist local status
  - SCN-004 draft navigation race fix
  - SCN-004 free input document eligibility guard
  - presentation-local preset architecture:
    - `SCN-001-BRIDGE-DEMO`: answer-only
    - `SCN-004-DEMO-FREEZE`: main demo / document draft freeze
- 보류 범위:
  - Phase 3C 이후 확장 작업
  - sessionStorage backup/restore
  - transition animation
  - `/bridge`, Recovery 본 구현 및 `/before` 추가 기능 확장
- SCN-004 QA 정합성 검증, content display 확인, manual browser rehearsal은 통과 상태다.
- 2026-04-20 기준 demo preflight와 browser dry-run도 통과 상태다.
- SCN-001 Firebase Auth Phase 3 frontend integration은 구현 완료 상태다.
  - Firebase Web SDK
  - `AuthContext`
  - Login UI
  - `/api/v1/auth/me` backend verification UI
  - Firebase Auth `inMemoryPersistence`
  - actual Google popup login E2E, `users` row upsert, repeated auth same `user_id`, `/after` login-free, frontend build 통과 확인
- SCN-001 Phase 4/5/6A~6F 구현이 frontend에 반영됐다.
  - `/before` result에서 logged-in completed Before job을 protected `bridge_runs`로 연결
  - Bridge handoff item은 React memory state에만 저장
  - `/after` Bridge summary cards, include checkbox, displayed safe subset query builder 구현
  - Bridge-origin result는 answer-only / draft disabled
  - Phase 6F live subset PASS with retry; Vertex IAM resolved, residual runtime risk는 transient `provider_timeout`
- SCN-001 Phase 7 설계 문서 완료, Phase 7A backend linkage plumbing과 Phase 7B protected bridge answer endpoint 완료.
- protected bridge answer endpoint frontend helper/routing은 별도 후보 작업이다.
- SCN-005 After frontend / 문서 타입 확장은 SCN-004 freeze 기준을 유지한 별도 패치에서 진행한다.

SCN-001 연결 초안의 phase 정렬:

1. Phase 0 완료: Firebase Auth MVP path / Phase 0 decisions 문서화
2. Phase 1 완료: DB model/migration
3. Phase 2 완료: backend Firebase ID token verification + `/api/v1/auth/me`
4. Phase 3 완료: frontend Firebase Auth Google Sign-In integration
5. Phase 4 완료: SCN-001 protected bridge-runs endpoint + `BeforeHandoffDTO` extraction
6. Phase 5 완료: Before review user linkage
7. Phase 6A~6F 완료: Bridge -> After answer-only handoff and live subset PASS with retry
8. Phase 7A~7B 완료: `after_artifact_runs` optional linkage plumbing and protected bridge answer endpoint
9. Remaining 후보: protected bridge answer frontend routing / verification

Evolution note:

- 2026-04-17에는 SCN-004 After flow, copy/print, manual rehearsal 완료가 기준이었다.
- 2026-04-20에는 fixed preset, free-input guard, WSL Playwright QA, preflight script가 추가됐다.

---

## 핵심 사용자 흐름

### Home

- 현재는 frontend foundation placeholder다.
- 제출 전 QA에서 `/after`로 redirect할지, 안내 placeholder로 둘지 결정한다.

### Before

- `/before` route는 구현되어 있고 계약서 업로드/검토 결과, optional auth Before job linkage, Bridge handoff CTA를 제공한다.
- 다만 SCN-004 제출/메인 demo freeze 중에는 `/before` 추가 기능 확장을 섞지 않는다.

### After

- 사고 / 분쟁 자유 진술 입력
- 사건 정보 구조화
- 관련 조문 검색
- 다음 행동 안내
- 필요 증빙 항목 제시
- 문서 타입 선택
- 선택적 case intake 입력
- 노동청 진정서 또는 노동위원회 이유서 초안 생성
- rendered_text, missing_fields, cautions, evidence_checklist, cited_articles 표시
- 복사 / 인쇄 제공

### Bridge

- 독립 `/bridge` route는 구현 범위 밖이다.
- 현재 구현된 Bridge 연결은 `/before` result CTA -> protected `bridge_runs` 생성 -> React memory handoff item -> `/after` summary card 흐름이다.
- Bridge handoff screen submission은 all unchecked라도 sticky `answer_origin = "bridge_handoff"`를 유지한다.
- Bridge-origin result는 answer-only / draft disabled이며, regular draft behavior는 direct `/after` 진입 또는 reset/re-entry가 필요하다.

### Recovery

- 이번 MVP 본 구현 범위 아님
- placeholder 또는 `추후 지원` 문구만 허용

---

## 화면 제안

- `/`
- `/after`
- `/after/result`
- `/after/intake`
- `/after/draft`

필수 공통 UI:

- 입력 안내 문구
- 인용 조문 카드
- 주의 문구
- 다시 분석 버튼
- masthead
- skip link
- loading/error notification
- route guard fallback

---

## 입력 원칙

- 계약서 원문 업로드보다 텍스트 입력을 우선
- OCR 업로드는 backend OCR API 준비 시 연결
- After는 긴 자유 서술 입력을 기본으로 함
- 예시 입력 문구를 제공해 데모 실패율을 낮춤

---

## 결과 화면 원칙

- 긴 문단보다 카드형 요약 우선
- `무엇이 문제인지`
- `관련 조문`
- `왜 주의가 필요한지`
- `다음에 무엇을 해야 하는지`

법률 응답 공통:

- `cited_articles`가 없으면 법률 답변으로 표시하지 않음
- 검색되지 않은 조문은 화면에 노출하지 않음
- `위법 확정` 표현보다 `위법 가능성`, `주의 필요` 표현 우선

---

## Bridge 저장 / 연계 원칙

- 현재 SCN-004 frontend demo flow 자체는 Bridge 저장을 요구하지 않는다.
- SCN-001 protected flow에서는 `/before` 결과에서 `bridge_runs`를 생성하고 React memory handoff item으로 `/after`에 전달하는 answer-only 연결이 구현되어 있다.
- protected bridge answer frontend routing, 독립 `/bridge` route, 계정 이력 UI 같은 추가 확장은 SCN-004 freeze를 유지한 별도 단계에서 검토한다.
- `docs/product/bridge_flow.md`의 개인정보 최소 수집 원칙과 저장 금지 원칙을 우선한다.
- 저장 대상은 최소 필드만 허용
- 원문 전체 저장은 기본 비활성
- Before / Bridge / After 결과를 사용자 계정에 연결 저장하는 것은 Firebase Auth 공통 인증 capability의 적용 범위로 검토한다.

저장 후보:

- 분석 시각
- 문서 유형
- 핵심 요약
- 위험 태그
- 주요 추출 항목
- cited_articles
- scenario_id
- source_scenario 또는 preset_id

이유:

- Before / Bridge / After 연결에 필요한 최소 정보만 전달 가능
- 개인정보 저장 범위 최소화 가능
- presentation-local preset과 실제 Before output을 구분 가능

---

## Backend 연동 전제

- frontend는 backend schema 확정 전 임의 필드 가정 금지
- 현재 frontend는 mock data가 아니라 실제 backend API contract에 연결되어 있음
- `NEXT_PUBLIC_API_BASE_URL` 기본값은 `http://localhost:8000`
- `cited_articles.length === 0` 또는 `grounded_context_ids.length === 0`이면 문서 초안 flow로 진행하지 않음
- raw `user_statement`, `answer_response`, `case_intake`, `draft_response`는 Web Storage에 저장하지 않음
- raw `after_query_seed`는 Web Storage에 저장하지 않고 `/api/v1/answer.query` 또는 protected bridge answer query에 넣지 않음

MVP 최소 필요 API:

- `POST /api/v1/answer`
- `POST /api/v1/documents/draft`
- `POST /api/v1/scn001/bridge-runs` for protected SCN-001 Bridge handoff
- `GET /api/v1/scn001/bridge-runs/{bridge_run_id}` for protected SCN-001 Bridge lookup
- `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer` for protected Bridge-origin linked answer artifact persistence

응답 최소 요구:

- answer / key_points / cautions
- cited_articles
- grounded_context_ids
- retrieved_chunks
- rendered_text
- missing_fields
- evidence_checklist

---

## 구현 상태

1. 공통 layout / typography / design tokens: 완료
2. API types / FlowContext / API helper: 완료
3. `/after` answer input: 완료
4. `/after/result` answer result + document type selection: 완료
5. `/after/intake` case intake form: 완료
6. `/after/draft` document draft result: 완료
7. API error / route guard / focus / skip link: 완료
8. copy / print: 완료
9. sessionStorage backup/restore: 보류
10. `/before` + Bridge handoff CTA/cards: 완료
11. 독립 `/bridge` / Recovery: 보류

우선순위 기준:

- 현재는 `SCN-004 After > QA pass > demo freeze`

---

## 제외 범위

- 네이티브 앱 개발
- 완전한 모바일 UX 최적화
- 직접 회원가입 / 이메일·전화번호 기반 로그인
- SCN-004 demo flow의 사용자별 서버 저장소. SCN-004 After demo flow는 로그인 없이 유지한다.
- 관리자 페이지
- 복잡한 멀티스텝 폼 엔진
- 채팅형 agent loop UI 고도화
- sessionStorage / localStorage backup-restore
- 현재 SCN-004 freeze 작업 중 SCN-005 문서 타입 frontend 확장
- SCN-004 freeze 기준을 흔드는 SCN-001 추가 frontend 확장 또는 protected bridge answer frontend routing

다음 단계 범위: Firebase Auth Phase 0~5, Phase 6A~6F, Phase 7A~7B는 완료됐다. 다음 후보 구현은 SCN-004 demo freeze를 유지하면서 protected bridge answer frontend routing / verification으로 별도 진행한다.

---

## 완료 기준

- `/after` 4-route flow가 backend API와 연결되어 동작
- cited_articles와 grounded context가 없으면 법률 답변 / 문서 초안 flow를 guard
- 문서 초안 결과에 rendered_text / missing_fields / cautions / evidence_checklist / cited_articles 표시
- copy / print 동작 확인
- direct URL guard 확인
- 모바일 폭에서도 SCN-004 demo path 레이아웃이 깨지지 않음
- `npm run build` 통과

---

## 메모

- 이번 문서의 `앱`은 네이티브 앱이 아니라 웹앱 의미
- 프론트엔드 구현은 demo stability first
- 세부 UI copy와 시각 스타일은 별도 문서로 분리 가능
- 현재 구현 상세 기준은 `docs/planning/14_frontend_implementation_handoff.md`
- 다음 작업 상세 기준은 demo freeze 유지와 제출 전 재현성 확인
