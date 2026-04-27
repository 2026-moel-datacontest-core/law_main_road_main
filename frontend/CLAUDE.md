# CLAUDE.md — frontend/

## 역할

- Next.js 기반 SCN-004 After demo 웹앱 담당
- 한국어 메인, 영어 보조
- demo stability first

## 우선 문서

1. `../docs/planning/08_frontend_app_plan.md`
2. `../docs/planning/14_frontend_implementation_handoff.md`
3. `../docs/planning/13_document_draft_plan.md`
4. `../docs/product/*.md`
5. `../CLAUDE.md`
6. existing code

## 현재 범위

- `/`
- `/before`
- `/after`
- `/after/result`
- `/after/intake`
- `/after/draft`
- 독립 `/bridge` / `Recovery`는 현재 frontend 구현 범위에서 제외

## 현재 구현 상태

- Next.js `16.2.4`, React `19.2.5`, App Router, TypeScript, CSS Modules
- Phase 1 API-connected happy path 완료
- Phase 2 error / loading / a11y / route guard 완료
- Phase 3 A/B 완료:
  - rendered_text clipboard copy
  - browser print + print disclaimer
  - 증거 체크리스트 화면 내 로컬 상태
- SCN-004 draft navigation race 수정 완료
- SCN-004 free input document eligibility guard 완료
- SCN-001/004 presentation-local preset architecture 완료:
  - `SCN-001-BRIDGE-DEMO`: fixed/live 여부와 관계없이 answer-only
  - `SCN-004-DEMO-FREEZE`: main demo / document draft freeze path
  - SCN-005는 현재 UI preset에서 제외하고 후속 확장 후보로 유지
- Phase 3C 이후 확장 작업은 보류:
  - sessionStorage backup/restore
  - page transition animation
  - 현재 SCN-004 demo freeze 유지 작업과 SCN-005 문서 타입 확장을 한 패치에 혼합
  - 팀원 Before / Bridge contract 확인 없는 SCN-001 문서 타입 확장
- SCN-004 manual browser rehearsal과 content display 확인 완료
- SCN-005 After frontend / 문서 타입 확장은 SCN-004 freeze 기준을 유지한 별도 패치에서 진행 가능
- SCN-001 Firebase Auth Phase 3 frontend integration 완료:
  - Firebase Web SDK
  - Firebase Auth `inMemoryPersistence`
  - `AuthContext`
  - Login UI
  - `/api/v1/auth/me` backend verification UI
  - actual Google popup login E2E, repeated auth same `user_id`, `/after` login-free, frontend build 통과 확인
- SCN-001 Phase 4/5/6A~6F 구현 반영:
  - `/before` result에서 logged-in completed Before job을 protected `bridge_runs`로 연결
  - Bridge handoff item은 React memory state에만 저장
  - `/after` Bridge summary cards, include checkbox, displayed safe subset query builder 구현
  - Bridge-origin result는 answer-only / draft disabled
  - Phase 6F live subset PASS with retry; Vertex IAM resolved, residual runtime risk는 transient `provider_timeout`
- SCN-001 Phase 7A~7E 완료:
  - backend linkage plumbing
  - protected bridge answer endpoint
  - frontend protected answer helper
  - `/after` checked Bridge submit routing
  - live browser/network/DB smoke PASS
- Post-Phase 8 Step 1 logout memory reset, Step 1.5 Before actual analysis login-required UX, OCR 429 friendly message, Step 2B-1 history API client/types, Step 2B-2 `/before` read-only history UI, Step 1.6 main page Before entry login gate 완료

## 핵심 원칙

- 앱은 네이티브가 아니라 웹앱 기준
- 데스크톱 데모 우선
- 모바일은 기본 반응형만 맞춤
- 긴 설명보다 구조화된 결과 카드 우선
- 인용 조문 표시가 핵심
- 입력 실패율 낮추는 UX 우선
- 문서 초안은 제출 전 검토용 보조이며 법률 판단 확정 UI로 보이지 않게 유지

## 상태 관리

- MVP는 복잡한 전역 상태 관리 도입 금지
- 현재 SCN-004 flow는 React Context + useReducer 메모리 상태만 사용
- raw `user_statement`, `answer_response`, `case_intake`, `draft_response`를 sessionStorage/localStorage에 저장하지 않음
- raw `after_query_seed`는 `/api/v1/answer.query` 또는 protected bridge answer query에 넣지 않음
- 증거 체크리스트 상태는 화면 내 로컬 상태만 허용

## 계정 / OAuth 정책

- SCN-004 After demo 4-route flow는 로그인 없이 계속 동작해야 한다.
- 직접 회원가입, 이메일 직접 입력 가입/로그인, 전화번호 직접 입력 수집은 계속 금지한다.
- Firebase Auth Google Sign-In 기반 최소 로그인은 프로젝트 공통 인증 capability로 허용한다. 단, 다음 제약 준수 시.
- 실제 적용은 사용자별 상태 연결이 필요한 SCN-001 protected path로 제한한다.
- MVP auth path는 Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase Admin SDK verification이다.
- `auth_provider = "firebase_google"`, `provider_subject = Firebase uid`에서 internal `users.id`를 resolve한다.
- Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback로만 유지한다.
- 전화번호 scope 요청은 금지하고, 이메일은 nullable 표시 정보로만 다루며 primary identifier로 사용하지 않는다.
- access token / refresh token 장기 저장은 금지한다.
- Firebase Auth MVP frontend persistence는 `inMemoryPersistence`다. token/auth state를 `localStorage`나 `sessionStorage`에 저장하지 않는다.
- `browserSessionPersistence`는 MVP default가 아니라 Future/Post-MVP UX tradeoff 후보로만 둔다.
- Kakao OAuth는 첫 구현 범위에서 제외하고, 한국 생활 밀착 UX나 KakaoTalk 알림/상담 연계가 필요해질 때 후속 provider 후보로 검토한다.

## Backend 연동 규칙

- backend schema 확인 없이 응답 필드 가정 금지
- 실제 연동은 확정 API 기준으로 연결
- `cited_articles` 없는 법률 답변은 결과 화면에 노출 금지
- 검색되지 않은 조문 인용 금지
- presentation preset exact path는 fixed answer fixture를 사용하므로 `/api/v1/answer`를 호출하지 않음
- presentation preset modified path는 `top_k=10`, 일반 자유 입력은 `top_k=5`, 항상 `ef_search=100`
- SCN-004 범위 밖 자유 입력은 answer-only로 처리하고 document draft UI를 열지 않음
- `/api/v1/documents/draft`에는 `buildCaseIntake()`와 `buildLegalBasis()` 결과만 보냄
- `/api/v1/answer` public contract unchanged
- `/api/v1/documents/draft` contract unchanged
- Bridge handoff screen submission은 all unchecked라도 sticky `answer_origin = "bridge_handoff"`를 유지한다.
- Bridge-origin result는 answer-only / draft disabled다. regular draft behavior는 direct `/after` 진입 또는 reset/re-entry가 필요하다.

## 구현 우선순위

1. SCN-004 `/after` 4-route flow freeze 유지
2. 제출 전 backend schema / frontend type 재확인
3. direct URL guard / API error / citation 없음 상태 재확인
4. desktop/mobile smoke 재확인
5. demo polish는 regression 없이 가능한 범위만

## 제외 범위

- Android / iOS 네이티브 앱
- 완전한 모바일 UX 최적화
- 직접 회원가입 / 이메일·전화번호 직접 입력 로그인
- SCN-004 demo flow의 사용자별 서버 저장. Firebase Auth 최소 로그인의 적용 범위는 SCN-001 protected path로 둔다.
- 관리자 페이지
- 과도한 UI polishing
- 독립 `/bridge` / Recovery 본 구현
- sessionStorage backup/restore
- PDF 다운로드 / 실제 제출 기능
- 현재 SCN-004 demo freeze 유지 작업과 SCN-005 문서 타입 확장을 한 패치에 혼합
- SCN-005 API / schema 검토 없는 독단적 문서 타입 확장
- SCN-004 freeze 기준을 흔드는 SCN-001 추가 frontend 확장. SCN-001 document draft, history deletion, 독립 `/bridge` 확장은 별도 범위에서만 검토

## Do Not

- backend contract 임의 변경 전제 UI 작성
- 근거 없는 법률 문구 하드코딩
- 직접 식별정보 수집 기능 추가. Firebase Auth Google Sign-In은 위 계정 / OAuth 정책의 공통 capability와 제약 안에서만 사용
- SCN-004 freeze 기준을 깨는 신규 대형 기능 추가
- 문서 범위를 넘는 독단적 화면 확장
