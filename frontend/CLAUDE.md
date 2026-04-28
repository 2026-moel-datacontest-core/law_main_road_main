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
- `/history`
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
  - `SCN-001-BRIDGE-DEMO`: exact fixed preset은 frozen draft flow 제공, modified/live and Bridge-origin paths는 answer-only
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
- Post-Phase 8 actual browser logged-in smoke PASS 및 auth state sync hardening 완료:
  - main Before CTA는 Firebase signed-in 단독이 아니라 backend `/api/v1/auth/me` verification 완료 상태(`backendUser.logged_in`) 기준으로 `/before` 진입
  - `/before` history, 분석 시작, Bridge handoff도 backend-verified 상태 기준으로 보호
  - protected endpoint 401은 frontend backend auth re-check로 연결
- SCN-001 Step 3 MVP soft-delete slice frontend 완료:
  - `/before` read-only history delete affordance
  - confirmation/cancel
  - SCN-001 protected DELETE Authorization PRESENT
  - 204/masked result generic UX
  - success refresh / local hide
  - Before delete hides/removes linked Bridge visible path
  - memory-only Bridge handoff clear so deleted Before cannot seed `/after`
  - Step 3 full retention lifecycle is NOT opened
- SCN-001 `/after` saved Before/Bridge history selector 완료:
  - completed in `2ec5488`
  - backend-verified logged-in user는 `/after`에서 collapsible saved history section을 열 수 있음
  - saved Bridge 선택은 displayed safe subset만 Bridge handoff memory state에 추가
  - raw `after_query_seed`, raw Bridge payload, token, Firebase uid, provider_subject, email, real bridge id는 UI/query/storage에 노출하지 않음
  - `/after` history list에서 Before/Bridge soft-delete affordance 제공
  - 기존 protected DELETE helper 사용, success 시 local list와 selected handoff state 정리
  - Before delete 시 linked Bridge visible path 제거
  - Bridge context/history가 있어도 SCN-001/SCN-004 preset buttons는 계속 표시
  - exact preset submit은 fixed answer path가 우선
- SCN-001 frontend history/After polish 완료:
  - latest main is pushed through `fdde441`
  - `8cd1ccb` polished SCN-001 history cards and `c365ca5` clarified SCN-001 history summaries on latest main
  - `6263a8e` folded SCN-001 case records, `f15430c`/`a2d984f` fixed overbroad wage/deduction summaries, and `fdde441` prioritized login on the home page
  - `/after` saved history and `/history` now use an incident-centered single card flow instead of separate Before/Bridge list or 2-column cards
  - one card shows situation summary, confirmed issues, candidate legal references, recommended next steps, and the After question connection
  - situation summaries are user-facing Korean explanations rather than raw status/key text
  - `mandatory_terms_missing`, `dormitory_missing_info`, `deduction_risk`, and unknown snake_case values are rendered through Korean label/description or readable fallback
  - Bridge remains continuity/reference only, not legal grounding; raw `after_query_seed` remains null and is not exposed in UI/query/storage
  - `/history` remains a record archive with compact details/fold sections and existing delete confirm/cancel/success soft-delete UX
  - failed/running Before jobs are hidden from the user-facing list; Bridge records linked to fetched non-completed Before jobs are hidden; Bridge-only records whose source Before is outside the fetch window remain visible
  - main page login priority is completed: logged-out first viewport prioritizes Google login CTA, and backend-verified logged-in users keep `History / Before / After` entry order
  - frontend-only; no backend contract, auth persistence, Web Storage, `/api/v1/history` unified backend API, live/backend SCN-001 draft generation, protected SCN-001 draft endpoint, Step 3 full retention lifecycle, or SCN-004 freeze change
- Latest frontend visual redesign 완료:
  - visual foundation token alignment
  - home visual simplification
  - `/before`, `/after`, `/history` internal route chrome simplification
  - `/after/result`, `/after/intake`, `/after/draft` after-flow detail visual polish
  - draft print CSS specificity fix
  - masthead light surface alignment; stale masthead wording should not be used for current UI
- Before analysis progress UX 완료:
  - `/before` 분석 시작 후 진행 상태 영역으로 scrollIntoView
  - OCR은 문서 품질/분량에 따라 1~2분 정도 걸릴 수 있다는 안내 표시
  - raw job id/status/provider/internal error 노출 없음
  - backend OCR/provider/polling contract 변경 없음
- SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow 완료:
  - `/after -> /after/result -> /after/intake -> /after/draft`
  - document type: `workplace_change_reason_summary` / 사업장 변경 사유 정리서 초안
  - SCN-001 intake는 SCN-004와 유사한 입력 form UX를 사용
  - frozen draft는 frontend fixture + deterministic template 기반이며 사용자 intake 값을 반영
  - backend/LLM 호출 없음, `/api/v1/documents/draft` 호출 없음
- SCN-001 continuity panel 완료:
  - `/after/result`와 `/after/draft`에 표시
  - `Bridge-as-Continuity, Not Grounding` 유지
  - legal basis, citations, source context ids, grounded context ids, retrieved chunks를 생성/수정하지 않음
- SCN-001 live/backend draft generation and protected SCN-001 draft endpoint path/method/schema remain NOT opened:
  - SCN-004 `/after` draft behavior unchanged
  - SCN-004 public `/api/v1/documents/draft` flow unchanged
  - remaining candidates are optional frontend-only visual polish: SCN-004 intake/draft internal component surface cleanup, Before Upload/Result/Accessibility panels deep polish, Auth/LoginButton token cleanup nit, History deep density polish, and manual visual QA / print preview without touching SCN-004 freeze or SCN-001 frozen draft/history/continuity boundaries

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
- `/after` saved history selector도 raw Bridge payload, internal ids, token, Firebase uid, provider_subject, email, raw query를 Web Storage, UI, answer query에 넣지 않음
- SCN-001 history summary와 Bridge issue display는 raw status/key 중심 표시를 피한다. `mandatory_terms_missing`, `dormitory_missing_info`, `deduction_risk` 같은 key와 unknown snake_case는 한국어 label/description 또는 readable fallback으로 표시한다.
- 증거 체크리스트 상태는 화면 내 로컬 상태만 허용

## 계정 / OAuth 정책

- SCN-004 After demo 4-route flow는 로그인 없이 계속 동작해야 한다.
- 직접 회원가입, 이메일 직접 입력 가입/로그인, 전화번호 직접 입력 수집은 계속 금지한다.
- Firebase Auth Google Sign-In 기반 최소 로그인은 프로젝트 공통 인증 capability로 허용한다. 단, 다음 제약 준수 시.
- 실제 적용은 사용자별 상태 연결이 필요한 SCN-001 protected path로 제한한다.
- MVP auth path는 Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase Admin SDK verification이다.
- SCN-001 protected frontend gate는 Firebase signed-in 단독이 아니라 backend-verified `backendUser.logged_in` 상태를 기준으로 한다.
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
- Bridge context/history가 있어도 SCN-001/SCN-004 preset buttons는 계속 표시한다.
- Exact preset submit은 fixed answer path가 우선된다: `SCN-001-BRIDGE-DEMO` exact는 fixed answer -> frozen draft flow, `SCN-004-DEMO-FREEZE` exact는 fixed answer -> existing SCN-004 draft flow.
- Preset 미선택 + included Bridge context는 기존 protected Bridge answer path를 유지한다.
- SCN-004 범위 밖 자유 입력은 answer-only로 처리하고 document draft UI를 열지 않음
- `/api/v1/documents/draft`에는 SCN-004 public draft flow에서만 `buildCaseIntake()`와 `buildLegalBasis()` 결과를 보냄. SCN-001-BRIDGE-DEMO exact fixed frozen draft path는 frontend-local deterministic draft를 만들고 이 endpoint를 호출하지 않음
- `/api/v1/answer` public contract unchanged
- `/api/v1/documents/draft` contract unchanged
- SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow is frontend-local; it does not call `/api/v1/documents/draft`.
- SCN-001 live/backend draft generation and protected SCN-001 draft endpoint path/method/schema remain NOT opened.
- Bridge/query relevance guard matrix review is the current design baseline. Continuity panel is completed on `/after/result` and `/after/draft`, and Bridge는 legal grounding이 아니라 continuity 설명으로만 다룬다.
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
- SCN-004 freeze 기준을 흔드는 SCN-001 추가 frontend 확장. SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow와 continuity panel은 completed 상태지만, live/backend draft generation, protected SCN-001 draft endpoint path/method/schema, Step 3 full retention lifecycle, 독립 `/bridge` 확장은 NOT opened.

## Do Not

- backend contract 임의 변경 전제 UI 작성
- 근거 없는 법률 문구 하드코딩
- 직접 식별정보 수집 기능 추가. Firebase Auth Google Sign-In은 위 계정 / OAuth 정책의 공통 capability와 제약 안에서만 사용
- SCN-004 freeze 기준을 깨는 신규 대형 기능 추가
- 문서 범위를 넘는 독단적 화면 확장
- Step 3 full retention lifecycle, hard delete, artifact physical deletion/file purge, undo/restore, auth persistence changes, account deletion/access-control, orphan cleanup은 후속 정책 영역으로만 유지
