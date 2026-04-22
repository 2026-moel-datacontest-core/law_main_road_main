# MVP Scope

## 목적

- 이번 MVP의 구현 범위 고정
- 포함 기능 / 제외 기능 구분
- 구현 우선순위 명확화
- 데모 기준 정리
- 구현 지시서가 아니라 MVP 범위와 완료 기준을 정리
- Firebase Auth Google Sign-In MVP path는 `docs/planning/18_scn001_firebase_auth_phase0_decisions.md` 기준으로 Firebase Auth Google Sign-In + Bearer Firebase ID token + backend verification으로 둠. 실제 Firebase project/config 값은 별도 구현 단계에서 확정
- Direct Google OAuth는 Alternative/Fallback 또는 Post-MVP 후보로만 둠

---

## MVP 목표

- 계약서 또는 노동분쟁 상황 입력
- 관련 법령 조문 검색
- 근거 기반 응답 생성
- 다음 행동 안내 제공
- 현재 freeze 기준: SCN-004 기준 문서 초안 생성 demo 안정화
- Firebase Auth 이후 Minimum MVP 목표: SCN-001 `Before -> Bridge -> After` answer-only 연결 안정화
- SCN-004 document draft demo flow는 로그인 없이 그대로 유지
- SCN-001 전용 문서 초안 생성은 Minimum MVP가 아니라 Strong MVP / optional extension으로 별도 검토
- SCN-005, Recovery, production infra는 MVP 이후 범위로 분리

---

## 포함 범위

현재 구현 기준일: `2026-04-20`
MVP 범위 업데이트 기준일: `2026-04-22`

진화 기록:

- 2026-04-17에는 SCN-004 After 4-route flow, document draft backend, copy/print, manual rehearsal 완료가 기준이었다.
- 2026-04-20에는 이 기준 위에 presentation-local preset, free-input eligibility guard, demo preflight, full 60 answer evidence report가 추가됐다.

### 현재 구현된 demo scope

- `After` 중심 SCN-004 flow
- 자유 진술 또는 preset 입력
- `/api/v1/answer` 기반 grounded answer
- 문서 타입 선택
- 선택적 case intake 입력
- `/api/v1/documents/draft` 기반 문서 초안 생성
- `rendered_text`, `missing_fields`, `cautions`, `evidence_checklist`, `cited_articles` 표시
- 초안 복사 / 인쇄
- presentation-local preset:
  - `SCN-001-BRIDGE-DEMO`: answer-only bridge handoff 설명용
  - `SCN-004-DEMO-FREEZE`: main demo / document draft freeze용
- SCN-004 free input document eligibility guard
- demo preflight script
- full 60 answer evidence report

### Firebase Auth 이후 Minimum MVP

- Firebase Auth Google Sign-In 기반 최소 로그인
- SCN-001 protected path에서 Bearer Firebase ID token 사용
- backend Firebase ID token verification으로 Firebase uid 확인
- `auth_provider = "firebase_google"`와 `provider_subject = Firebase uid`로 internal `user_id` resolve
- Firebase uid as `provider_subject` 기반 internal `user_id` 연결
- SCN-001 Before job/result의 internal reference 또는 safe summary를 internal `user_id`와 연결
- business table에는 Firebase uid / Google sub / email을 직접 저장하지 않고 internal `users.id`만 참조
- Before 결과에서 raw 계약서 / OCR 전문 / full result artifact가 아니라 안전한 summary만 Bridge로 전달
- raw `after_query_seed` persistent 저장 금지. `after_query_seed_hash`는 저장 후보/필수로 유지
- Bridge가 SCN-001용 `after_query_seed`를 만들고 기존 After answer flow로 연결
- SCN-001은 우선 answer-only로 안정화
- SCN-004 document draft flow는 로그인 없이 그대로 유지
- SCN-004 regression이 없어야 함
- Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback로만 유지

아래 Before / Bridge는 제품 구조상 MVP 범위다. 다만 현재 frontend 구현은 SCN-004 After flow에 맞춰져 있으므로, Before / Bridge frontend 확장은 팀원이 작성한 Before / Bridge 코드와 contract를 확인한 뒤 별도 단계에서 진행한다. SCN-001 연결은 `/api/v1/answer`와 `/api/v1/documents/draft` contract 변경 없이 answer-only 경로부터 고정한다.

### Before

- 계약서 텍스트 입력 또는 OCR 결과 입력
- 주요 항목 추출
- 위험 신호 분류
  - 누락
  - 불명확
  - 주의 필요
  - 위법 가능성
- 관련 법령 조문 제시
- 근거 기반 요약 응답

### After

- 자유 진술 입력
- 사건 핵심 정보 구조화
- 관련 법령 검색
- 근거 기반 설명
- 다음 행동 안내
- 필요 증빙 항목 제시
- SCN-001은 Bridge가 만든 `after_query_seed`를 기존 answer query boundary로 전달
- SCN-001 문서 초안 생성은 Minimum MVP에 포함하지 않음
- SCN-004 문서 초안 생성:
  - 고용노동청 임금체불 진정서 초안
  - 노동위원회 부당해고 구제신청 이유서 초안

### Bridge

- internal `user_id`와 Before job/result internal reference 또는 safe summary 연결
- `before_review_jobs.user_id`, `bridge_runs.user_id`, `after_artifact_runs.user_id`는 Firebase uid / Google sub가 아니라 internal user_id 참조
- SCN-001 protected bridge flow에서 `bridge_runs.user_id`는 required. `SCN-001-BRIDGE-DEMO` presentation preset과 SCN-004 public flow는 `bridge_runs`를 만들지 않음
- Bridge handoff에는 raw 계약서 / OCR 전문 / full result artifact가 아닌 안전한 summary, 위험 태그, 법령 label 수준 정보만 사용
- SCN-001용 `after_query_seed` 생성
- After answer 입력 시 handoff summary를 query seed로 사용
- “계약 단계에서 예견 가능했던 위험” 섹션 출력

---

## Strong MVP / Optional Extension

### Optional Extension: SCN-001 전용 문서 초안 생성

- Minimum MVP 필수 조건이 아님
- SCN-001 Before / Bridge / After answer-only 연결이 안정화된 뒤 별도 단계로 검토
- LLM prompt / schema 튜닝 필요
- 결과 품질이 안정화되면 별도 freeze 기준 수립
- SCN-004 draft contract와 섞지 않고 별도 contract / route / frontend guard로 관리
- `/api/v1/documents/draft`의 기존 SCN-004 freeze 기준을 깨지 않는 경우에만 진행

---

## 기술 범위

### 포함

- 법령 청킹 결과 사용
- PostgreSQL + pgvector
- 기본 retrieval 구현
- top-k 조문 검색
- 근거 기반 응답 생성
- Gemini API 기반 MVP
- deterministic document draft service
- Next.js SCN-004 demo frontend
- Firebase Auth Google Sign-In 기반 최소 auth capability
- Bearer Firebase ID token 기반 SCN-001 protected API 호출
- backend Firebase ID token verification
- Firebase uid as `provider_subject` 기반 user linkage
- SCN-001 `Before -> Bridge -> After` answer-only 연결
- 팀원 Before / Bridge 코드 확인 후 연결되는 route와 payload adapter

### 조건부 포함

- JSON 응답 구조 고정
- cited_articles 검증
- frontend QA에서 필요한 최소 polish
- Before / Bridge contract 확인 후 SCN-001 frontend route 확장
- 인증 관련 변경이 필요한 경우 SCN-004 regression checklist 통과

### 후순위

- vector + keyword/BM25 결합
- metadata filtering
- reranker
- query decomposition 대규모 확장
- critic LLM
- local LLM 전환
- agent loop 고도화
- 다국어 UI 확장
- 프론트엔드 polishing
- 팀원 Before / Bridge 코드 확인 전 임의 frontend 확장

### MVP 이후 인프라 / 운영

- Cloud Run 배포
- Cloud SQL 연결
- Secret Manager 적용
- GCS artifact 저장 전환
- Cloud Tasks / Pub/Sub 기반 비동기 처리
- 운영 모니터링 / logging
- artifact retention / access-control 정책 설계

---

## 제외 범위

- Kakao OAuth 첫 구현
- Direct Google OAuth + backend-managed session cookie를 MVP required path로 구현
- Firebase session cookie 발급/검증
- Identity Platform OIDC provider 적용
- multi-provider linking
- Recovery 본격 구현
- SCN-005 확장
- 완전한 Local LLM 운영
- Mini-Agent 고도화
- 복잡한 재시도 루프
- 운영용 보안 고도화
- 관리자 기능
- 완전한 모바일 UX 최적화
- sessionStorage / localStorage backup-restore
- PDF / HWP 다운로드
- 실제 제출 / 접수 기능
- SCN-004 로그인 강제
- full production infra를 MVP 필수 조건으로 보는 것
- raw 계약서 / OCR 전문 / full result artifact의 사용자 이력 기본 노출
- artifact retention / access-control 정책 확정 및 운영화
- 팀원 Before / Bridge code / schema / API contract 확인 없는 SCN-001 frontend 확장
- SCN-001 문서 타입의 독단적 확장 또는 SCN-004 draft contract와 혼합 구현
- 현재 SCN-004 demo freeze 유지 중 `/bridge` frontend 본 구현 및 `/before` 추가 기능 확장

---

## 성공 기준

### 현재 freeze 성공 기준

- SCN-004 `/after` 4-route flow가 backend API와 연결되어 동작
- cited_articles와 grounded_context_ids가 없으면 법률 답변 / 문서 초안 flow를 guard
- 문서 초안 결과에 rendered_text / missing_fields / cautions / evidence_checklist / cited_articles 표시
- copy / print 동작 확인
- direct URL guard 확인
- QA에서 backend/frontend schema mismatch 없음
- SCN-004-DEMO-FREEZE fixed answer가 기대 조문 6개와 `grounded_context_ids=[1, 2, 3, 5, 10, 4]`를 유지
- answer-derived document draft 2종이 `missing_legal_basis=[]` 유지
- 데모 중단 없이 SCN-004 시연 가능
- `SCN-004-DEMO-FREEZE` exact preset path는 fixed answer fixture를 사용해 `/api/v1/answer` 호출 없이 재현 가능
- `SCN-001-BRIDGE-DEMO`는 answer-only로 동작하며 SCN-004 문서 초안 UI를 열지 않음
- full 60 answer evidence 기준 `FAIL=0`, citation grounding / context id clean

### Firebase Auth 이후 Minimum MVP 성공 기준

#### Before

- 계약서 입력 가능
- 주요 항목 구조화 가능
- 관련 법령 검색 가능
- 위험 신호 + 근거 제시 가능
- backend Firebase ID token verification으로 resolve된 internal `user_id`와 Before job/result internal reference 또는 safe summary 연결 가능
- Bridge로 넘기는 값은 raw 계약서 / OCR 전문 / full result artifact가 아닌 안전한 summary와 label 수준 근거로 제한

#### After

- 자유 진술 입력 가능
- 사건 정보 구조화 가능
- 관련 법령 검색 가능
- 다음 행동 안내 가능
- SCN-001은 answer-only로 동작
- Bridge가 만든 `after_query_seed`가 기존 `/api/v1/answer` query boundary로 전달 가능
- SCN-004 문서 초안 생성 가능하며 로그인 없이 유지
- 검색된 legal basis 밖 조문을 초안에 새로 만들지 않음

#### Bridge

- Before job/result internal reference 또는 safe summary 연결 가능
- After answer 입력에서 handoff summary / seed 사용 가능
- 최소 연결 메시지 출력 가능
- SCN-001용 `after_query_seed` 생성 가능
- SCN-001에서 `Before -> Bridge -> After` 연결 demo 가능

#### 공통

- Firebase Auth Google Sign-In은 최소 로그인 capability로 동작
- SCN-001 protected path는 Bearer Firebase ID token을 사용하고 backend Firebase ID token verification을 통과
- `auth_provider = "firebase_google"`로 internal user mapping 가능
- Firebase uid as `provider_subject`에서 internal `user_id` resolve 가능
- Google `sub`는 Direct Google OAuth Alternative/Fallback subject로만 분리
- business table에는 Firebase uid / Google sub / email을 직접 저장하지 않고 internal user_id만 참조
- SCN-001 protected bridge flow에서 `bridge_runs.user_id`는 required
- raw `after_query_seed`는 persistent 저장하지 않고 `after_query_seed_hash`를 저장 후보/필수로 유지
- email은 nullable display/contact 후보이며 primary key가 아님
- 이메일은 primary identifier로 사용하지 않으며 phone scope를 요청하지 않음
- OAuth access token / refresh token 장기 저장 없음
- 검색된 법령 근거 포함
- retrieval 실제 동작
- SCN-001 확장 시 팀원 Before / Bridge 코드와 frontend adapter contract 정합성 확보
- `/api/v1/answer`와 `/api/v1/documents/draft` public contract 변경 없음
- SCN-004 login-free document draft flow regression 없음
- SCN-001 문서 초안 생성은 성공 기준에 포함하지 않음
- raw 계약서 / OCR 전문 / full result artifact는 사용자 이력에 기본 노출하지 않음
- artifact retention / access-control은 Minimum MVP 완료 조건이 아니라 별도 보안 / 운영 설계로 둠

### Strong MVP / Optional Extension 성공 기준

- SCN-001 전용 문서 초안 생성이 별도 contract로 동작
- LLM prompt / schema 튜닝 결과가 재현 가능
- 품질 기준 충족 후 별도 freeze 가능
- SCN-004 draft contract, guard, fixed preset path와 충돌 없음

---

## 우선순위

1. 법령 retrieval MVP
2. After MVP
3. grounded answer 품질 개선
4. SCN-004 document draft MVP
5. SCN-004 frontend demo
6. QA 정합성 검증 완료 상태 유지
7. 데모 freeze 유지
8. Firebase Auth Google Sign-In 기반 최소 로그인
9. Bearer Firebase ID token + backend Firebase ID token verification
10. Firebase uid as `provider_subject` 기반 internal `user_id` 연결
11. 팀원 Before / Bridge 코드와 contract 확인
12. SCN-001 Before job/result internal reference 또는 safe summary 사용자 연결
13. 안전한 Before summary 기반 Bridge `after_query_seed` 생성
14. SCN-001 `Before -> Bridge -> After` answer-only 연결
15. SCN-004 regression preflight / manual rehearsal 유지
16. SCN-001 전용 문서 초안 생성 여부를 Strong MVP / optional extension으로 별도 결정
