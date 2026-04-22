# Firebase Auth Google Sign-In + SCN-001 Implementation Plan

기준일: `2026-04-22`

이 문서는 **구현 지시서가 아니라 계획 문서**다.
코드 수정, DB migration 작성, OAuth/Firebase 구현, frontend 구현, git add/commit은 이 문서 범위가 아니다.
현재 구현된 것과 제안하는 것을 명확히 구분한다.

**MVP auth path:** Firebase Auth Google Sign-In + Bearer Firebase ID token + FastAPI backend Firebase ID token verification + Firebase uid -> internal user_id mapping.

관련 선행 문서:
- `docs/planning/15_scn001_account_auth_spec.md` - account/auth 최소 데이터 계약
- `docs/planning/16_scn001_before_bridge_contract.md` - BeforeHandoffDTO / BridgeOutputDTO contract 초안

---

## 1. Purpose

이 문서는 Firebase Auth 기반 Google Sign-In과 SCN-001 Before-Bridge-After 사용자 연결 구현을 위한 설계 계획이다.

- Google Cloud Identity Platform / Firebase Auth 기반 Google Sign-In을 MVP recommended path로 둔다.
- 첫 구현 적용 범위는 SCN-001 protected flow다.
- SCN-004 After demo flow는 public / login-free로 계속 동작해야 한다.
- `/api/v1/answer`, `/api/v1/documents/draft` public contract는 변경하지 않는다.
- Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback으로만 둔다.
- Firebase session cookie, Firebase Authentication with Identity Platform OIDC provider, multi-provider account linking은 Future/Post-MVP로 둔다.

---

## 2. Current State Summary

| 영역 | 현재 상태 |
|---|---|
| Auth | 구현 없음 |
| Users table | 구현 없음 |
| auth_sessions table | 구현 없음. MVP Bearer Firebase ID token 방식에서는 필수 아님 |
| Before (`/before`, `/api/v1/before`) | 구현 완료 |
| Bridge (route/model/service) | 구현 없음. preset doc-only |
| After (`/after` 4-route, `/api/v1/answer`, `/api/v1/documents/draft`) | 구현 완료 |
| SCN-001 | protected Before-Bridge-After linkage 후보 |
| SCN-004 | freeze / public / login-free 유지 |
| Account/auth spec | 문서화 완료 (docs/planning/15). 이 문서는 MVP auth path를 Firebase Auth 기준으로 구체화 |
| Before/Bridge contract | 문서화 완료 (docs/planning/16) |
| CORS `allow_credentials` | 현재 `False`. MVP Bearer token 방식에서는 `allow_credentials=True`가 필수 아님 |
| Frontend dev port | `5090` (`http://localhost:5090`, `http://127.0.0.1:5090`) |

---

## 3. Design Goals

- 사용자별 Before -> Bridge -> After 연결
- Firebase Auth Google Sign-In 기반 최소 로그인
- Bearer Firebase ID token을 SCN-001 protected endpoint 호출에만 사용
- FastAPI backend Firebase ID token verification dependency 도입
- Firebase uid -> internal user_id mapping
- 개인정보 최소 수집 원칙 준수
- SCN-004 freeze 보호 (public / login-free demo 유지)
- `/api/v1/answer`, `/api/v1/documents/draft` API contract 안정성
- 구현 patch 분리 가능성 (phase별 독립 patch)

---

## 4. Non-Goals

이번 MVP 구현 범위에서 **명시적으로 제외**하는 항목:

- 직접 회원가입
- email/password login
- phone login
- Kakao OAuth 첫 구현 (후속 provider 후보로만 문서화)
- Google access token / refresh token 장기 저장
- Direct Google OAuth authorization code exchange backend 구현
- backend-managed httpOnly session cookie를 MVP required path로 구현
- Firebase session cookie 발급/검증
- SCN-001 document draft 구현
- SCN-004 flow 변경
- `/api/v1/answer` request/response 확장
- `/api/v1/documents/draft` request/response 확장
- Recovery 본 구현
- 계정 이력 UI (artifact 전문 노출 화면)
- `/bridge` 독립 route 구현 (bridge는 service/adapter로 최소화)

---

## 5. Recommended Architecture

### 5.1 선택지 비교

| 방식 | 장점 | 단점 | 현재 환경 적합성 |
|---|---|---|---|
| Firebase Auth Google Sign-In + Bearer Firebase ID token + backend verification | frontend Google Sign-In 구현 부담 감소, backend가 Firebase Admin SDK로 검증 가능, CORS cookie 복잡도 낮음, SCN-001 protected endpoint에만 적용 가능 | XSS 방어와 token lifecycle 관리 필요, Firebase project/config와 Admin credentials 필요 | **MVP 권장** |
| Direct Google OAuth + backend-managed httpOnly session cookie | XSS에 상대적으로 강함, server-side logout/session invalidation 제어 쉬움 | Google authorization code exchange 직접 구현 필요, CORS `allow_credentials=True`, SameSite/CSRF/session table 설계 필요 | Alternative/Fallback |
| Firebase session cookie | httpOnly cookie UX와 Firebase verification 결합 가능 | session cookie minting/CSRF/CORS credentials 설계 필요 | Future/Post-MVP hardening |
| Firebase Authentication with Identity Platform OIDC provider | Cloud Identity Platform / provider 확장성 | 설정/운영 복잡도 증가 | Future extension |
| OAuth token forwarded from frontend | 초기 구현 단순 | Google access token 노출/오남용 위험, 장기 저장 정책 위반 가능 | 금지 |

### 5.2 MVP Recommended: Firebase Auth Google Sign-In + backend Firebase ID token verification

**구성 요소:**

| 컴포넌트 | 역할 | 위치 |
|---|---|---|
| Frontend Firebase SDK | Firebase app initialize, Google provider sign-in, Firebase ID token 획득 | `frontend/` (proposed) |
| `AuthContext` 또는 `useAuth` | `onAuthStateChanged`, `getIdToken`, 로그인/로그아웃 UI 상태 | `frontend/src/context` 또는 `frontend/src/hooks` (proposed) |
| Authorization header helper | SCN-001 protected API 호출 때만 `Authorization: Bearer <Firebase ID token>` 첨부 | `frontend/src/lib` (proposed) |
| Firebase Admin SDK dependency | Bearer Firebase ID token 검증, uid 추출 | `backend/app/dependencies/auth.py` (proposed) |
| `users` table | Firebase uid를 internal user_id로 매핑 | `backend/app/models/user.py` (proposed) |
| `/api/v1/auth/me` 또는 `/api/v1/auth/firebase/me` | frontend auth state 확인 endpoint | auth router (proposed) |
| SCN-001 linkage service | before_review_jobs / bridge_runs / after_artifact_runs 연결 | `backend/app/services/scn001_linkage.py` (proposed) |
| `bridge_runs` table | Bridge run 저장 및 internal user_id 연결 | `backend/app/models/bridge_run.py` (proposed) |
| Answer/Draft contracts | **변경 없음, token 강제 없음** | 기존 유지 |

**핵심 원칙:**

- Backend는 MVP path에서 Google authorization code exchange를 직접 담당하지 않는다.
- `/api/v1/auth/google/start`, `/api/v1/auth/google/callback`은 Firebase Auth MVP path의 필수 endpoint가 아니다.
- Frontend는 Firebase Auth가 발급한 Firebase ID token을 SCN-001 protected backend API에 Bearer token으로 전달한다.
- Backend는 Firebase Admin SDK로 Firebase ID token을 검증하고 Firebase `uid`를 추출한다.
- Backend는 `auth_provider = "firebase_google"` 또는 `"firebase"`와 `provider_subject = uid`로 internal `users.id`를 resolve/upsert한다.
- Business table에는 Firebase uid / Google sub / email을 직접 저장하지 않고 internal user_id만 저장한다.
- SCN-004 request path에는 Firebase token을 강제하지 않는다.

### 5.3 Alternative: Direct Google OAuth + backend-managed session cookie

Direct Google OAuth + backend-managed session cookie는 MVP recommended path가 아니라 fallback 설계다.

이 path를 선택할 때만 다음 endpoint가 필요하다:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/auth/google/start` | Google OAuth consent redirect 시작 |
| GET | `/api/v1/auth/google/callback` | authorization code exchange, id_token 검증, session cookie 생성 |

Alternative path에서는 다음도 함께 설계해야 한다:

- `auth_sessions` table 또는 signed session cookie
- httpOnly / Secure / SameSite cookie 설정
- CSRF state, mutation endpoint CSRF token 또는 double submit cookie
- CORS `allow_credentials=True`와 명시적 `allow_origins`
- session logout / invalidation / expiry

이 내용은 MVP Firebase Auth Bearer token path의 필수 요구사항이 아니다.

### 5.4 Future / Post-MVP

Post-MVP hardening 또는 확장 후보:

- Firebase session cookie
- Google Cloud Identity Platform / Firebase OIDC provider
- Firebase Authentication with Identity Platform OIDC provider
- multi-provider account linking
- GCS artifact access-control hardening
- Cloud Tasks / Pub/Sub worker hardening
- account history UI와 artifact retention/deletion policy

---

## 6. Firebase Auth Flow

### 6.1 단계별 Flow

```text
1. Frontend Firebase SDK initializes Firebase app.
2. User clicks Google Sign-In.
3. Firebase Auth handles Google provider sign-in.
4. Frontend receives Firebase ID token via getIdToken().
5. Frontend calls SCN-001 protected backend API with Authorization: Bearer <Firebase ID token>.
6. FastAPI dependency verifies Firebase ID token via Firebase Admin SDK.
7. Backend extracts Firebase uid.
8. Backend upserts internal user using auth_provider = "firebase_google" or "firebase" and provider_subject = uid.
9. Backend uses internal users.id for before_review_jobs / bridge_runs / after_artifact_runs linkage.
```

### 6.2 필수 제약

- Firebase Auth Google provider 사용.
- 전화번호 scope 요청 금지.
- email은 nullable 표시/연락 후보일 뿐 primary key가 아니다.
- Firebase `uid`는 provider_subject로만 사용하고 business table에는 직접 저장하지 않는다.
- Google access token / refresh token 장기 저장 금지.
- Firebase ID token raw value는 로그에 남기지 않는다.
- Backend response에 Firebase uid, Google sub, provider_subject를 노출하지 않는다.

---

## 7. Proposed Backend API

### 7.1 MVP 후보 endpoint

| Method | Path | Auth Required | Purpose |
|---|---|---|---|
| GET | `/api/v1/auth/me` 또는 `/api/v1/auth/firebase/me` | Optional 또는 Required TBD | Bearer Firebase ID token 기반 현재 사용자 확인. Phase 0에서 optional/required 결정 |
| POST | `/api/v1/scn001/bridge-runs` | **Yes - Bearer Firebase ID token required** | BeforeHandoffDTO -> BridgeOutputDTO 생성 + 저장 |
| GET | `/api/v1/scn001/bridge-runs/{bridge_run_id}` | **Yes - Bearer Firebase ID token required** | Bridge run 조회, internal user_id ownership 확인 |
| GET | `/api/v1/scn001/runs` | Yes - Bearer Firebase ID token required (optional endpoint) | 사용자 SCN-001 이력 목록 후보 |

`GET /api/v1/auth/me` 선택지:

- Optional Bearer token: token 없으면 `{ "logged_in": false }`, 유효하면 user info 반환.
- Required Bearer token: token 없으면 401, frontend는 Firebase Auth state를 primary source로 사용.

Phase 0에서 둘 중 하나를 결정한다.

### 7.2 MVP에서 public 유지되는 기존 endpoint

| Method | Path | Firebase token 강제 여부 | 비고 |
|---|---|---|---|
| POST | `/api/v1/answer` | No | public contract 변경 없음 |
| POST | `/api/v1/documents/draft` | No | public contract 변경 없음 |
| GET | `/api/v1/before/health` | No | health endpoint |
| `/after`, `/after/result`, `/after/intake`, `/after/draft` | No | SCN-004 login-free browser flow 유지 |

### 7.3 Endpoint 상세

**GET `/api/v1/auth/me` 또는 `/api/v1/auth/firebase/me`**

- purpose: frontend가 Firebase Auth 로그인 상태와 backend internal user mapping을 확인.
- auth: Optional 또는 Required TBD.
- MVP recommended: Bearer Firebase ID token을 받으면 검증 후 user upsert/resolve.
- response shape (proposed):
  ```json
  {
    "logged_in": true,
    "user_id": "internal-uuid",
    "display_name": "string | null",
    "email": "string | null"
  }
  ```
  또는 `{ "logged_in": false }` (optional token path 선택 시).
- privacy: Firebase uid, Google sub, provider_subject 노출 금지. email nullable.

**POST `/api/v1/scn001/bridge-runs`**

- purpose: BeforeHandoffDTO를 받아 BridgeOutputDTO 생성 및 bridge_runs row 저장.
- auth: Bearer Firebase ID token required.
- backend auth dependency:
  - `Authorization` header에서 Bearer token 추출.
  - Firebase Admin SDK로 Firebase ID token 검증.
  - Firebase `uid` 추출.
  - `users` upsert/resolve 후 internal user_id 사용.
- request shape (proposed):
  ```json
  {
    "before_handoff": { "...BeforeHandoffDTO fields..." },
    "source_scenario": "before_review | preset | mock"
  }
  ```
- response: BridgeOutputDTO (docs/planning/16 참조).
- privacy: raw OCR, raw contract, raw user_statement 포함 금지.

**GET `/api/v1/scn001/bridge-runs/{bridge_run_id}`**

- purpose: 저장된 Bridge run 조회.
- auth: Bearer Firebase ID token required.
- ownership: Firebase uid -> internal user_id resolve 후 bridge_runs.user_id와 일치하는지 확인.
- response: BridgeOutputDTO.

### 7.4 Direct Google OAuth endpoint proposal status

다음 endpoint는 Firebase Auth MVP path에서는 필수 endpoint가 아니다.

- `/api/v1/auth/google/start`
- `/api/v1/auth/google/callback`

MVP에서는 backend가 Google authorization code exchange를 직접 담당하지 않는다.
위 endpoint는 Alternative direct OAuth + backend-managed httpOnly session cookie path를 선택할 때만 검토한다.

---

## 8. Proposed DB Models

### 8.1 users (proposed)

| 필드 | 타입 | 필수 | 제약 | Privacy Note |
|---|---|---|---|---|
| `id` | UUID / String | Yes | PK | internal user_id |
| `auth_provider` | String(32) | Yes | unique(auth_provider, provider_subject) | `"firebase_google"` 또는 `"firebase"` |
| `provider_subject` | String(128) | Yes | unique(auth_provider, provider_subject) | Firebase uid. 외부 노출 금지 |
| `display_name` | String(128) | No | nullable | optional |
| `email` | String(254) | No | nullable, not unique | 표시용만. primary key 아님 |
| `created_at` | DateTime(tz) | Yes | server_default | |
| `last_login_at` | DateTime(tz) | Yes | | |

Note: Firebase Auth MVP path에서 `provider_subject`는 Firebase `uid`를 의미한다. Google `sub`는 Direct Google OAuth Alternative/Fallback subject이며, `docs/planning/15_scn001_account_auth_spec.md`와 `docs/planning/16_scn001_before_bridge_contract.md`도 같은 의미로 정렬되어 있다.

제약:

- `UniqueConstraint('auth_provider', 'provider_subject')`
- phone 없음.
- Google access token / refresh token 장기 저장 없음.
- Firebase uid / Google sub / email을 business table에 직접 저장하지 않음.
- `before_review_jobs`, `bridge_runs`, `after_artifact_runs`는 internal `users.id`를 참조한다.

### 8.2 auth_sessions

MVP Bearer Firebase ID token 방식에서는 `auth_sessions` table이 필수 아님.

`auth_sessions`는 Firebase session cookie 또는 Direct Google OAuth + backend-managed session cookie future path에서 검토한다.
그 경우에만 다음을 설계한다:

- `session_id`
- `user_id`
- `created_at`
- `expires_at`
- `invalidated_at`
- httpOnly / Secure / SameSite cookie policy
- CSRF policy
- logout / expiry / invalidation behavior

### 8.3 bridge_runs (proposed)

| 필드 | 타입 | 필수 | 제약 | Privacy Note |
|---|---|---|---|---|
| `bridge_run_id` | String(32) | Yes | PK | |
| `user_id` | FK -> users.id | TBD | nullable or required | Phase 0에서 required vs nullable 결정. protected route에서는 internal user_id 연결 |
| `before_review_job_id` | String(32) | No | nullable, FK 후보 | mock/preset path fallback 허용 여부 TBD |
| `scenario_id` | String(20) | Yes | | `SCN-001` |
| `source_scenario` | String(20) | Yes | | `before_review`, `preset`, `mock` |
| `preset_id` | String(50) | No | nullable | `SCN-001-BRIDGE-DEMO` 후보 |
| `user_visible_summary` | Text | Yes | | raw facts 과다 포함 금지 |
| `issue_categories` | JSONB | No | | |
| `risk_tags` | JSONB | No | | label-level only |
| `detected_issues` | JSONB | No | | summarized only |
| `law_refs` | JSONB | No | | label-level only |
| `recommended_next_actions` | JSONB | No | | |
| `after_query_seed` | Text | TBD | nullable | 원문 저장 여부 TBD (raw / short-lived / hash-only) |
| `after_query_seed_hash` | String(TBD) | Yes | | raw 미저장 path에도 사용 |
| `artifact_refs` | JSONB | No | | internal only |
| `created_at` | DateTime(tz) | Yes | | |
| `updated_at` | DateTime(tz) | Yes | | |

### 8.4 before_review_jobs / after_artifact_runs linkage

| Table | 추가 후보 | 필수 여부 | 비고 |
|---|---|---|---|
| `before_review_jobs` | `user_id` FK -> users.id | nullable 후보 | 기존 anonymous Before review와 호환 |
| `after_artifact_runs` | `user_id` FK -> users.id | nullable 후보 | SCN-004 public flow와 호환 |
| `after_artifact_runs` | `source_bridge_run_id` FK -> bridge_runs.bridge_run_id | nullable 후보 | SCN-001 Bridge -> After linkage |

---

## 9. BeforeHandoffDTO and BridgeOutputDTO Integration

docs/planning/16 기준 요약 (구현 전 계획용):

### BeforeHandoffDTO (proposed)

출처: Before review 완료 후 backend full result에서 추출.

포함 필드:
- `before_review_job_id`, `review_id`, `scenario_id`, `scenario_tags`
- `contract_summary` (short text, raw 이름 최소화)
- `overall_result`, `overall_severity`
- `risk_tags`, `detected_issues` (summarized)
- `law_refs` (label-level)
- `recommended_next_actions`
- `evidence_items_summary` (title + short paraphrase only)
- `artifact_refs` (internal only)
- `created_at`

제외 필드 (raw 포함 금지):
- `contract_info.employer`, `contract_info.employee` (실명 위험)
- `ocr_snapshot`, `ocr_conflicts` (OCR 전문)
- `uploaded_files.url` (공개 URL 금지)
- `user_explanation.evidence.excerpt` (원문 발췌 전문)
- `user_explanation.markdown` (artifact only)

### BridgeOutputDTO (proposed)

출처: BeforeHandoffDTO에서 Bridge adapter/service가 생성.

주요 필드:
- `bridge_run_id`, `user_id` (internal user_id), `before_review_job_id` (nullable)
- `scenario_id`, `source_scenario`, `preset_id` (nullable)
- `user_visible_summary` (raw facts 과다 포함 금지)
- `issue_categories`, `risk_tags`, `detected_issues`, `law_refs`
- `recommended_next_actions`
- `after_query_seed` (TBD: raw vs short-lived vs hash-only)
- `after_query_seed_hash` (항상 포함)
- `artifact_refs` (internal only)
- `created_at`

Bridge가 생성하지 않는 것:

- `grounded_context_ids`, `retrieved_chunks` -> After `/api/v1/answer`가 새로 생성.
- `legal_basis` -> After answer 결과에서 생성.

### after_query_seed handling

- real Before review path: `preset_id = null` -> After live answer path (`/api/v1/answer` 호출).
- presentation path: `SCN-001-BRIDGE-DEMO` -> fixed answer fixture 사용, `/api/v1/answer` 미호출.
- seed는 After `/after` textarea initial value로 전달 (query seed만).
- `/api/v1/answer` request는 `{ query, top_k, ef_search }`만 받음 - contract 변경 없음.

---

## 10. Frontend Auth State Plan

### 10.1 Auth state

- Firebase SDK 기반 `AuthContext` 또는 `useAuth`를 추가한다.
- Frontend Firebase SDK initializes Firebase app with env-provided public web config.
- `onAuthStateChanged`를 기본 auth state source로 사용하거나, on-mount `getIdToken()` 방식으로 최소 구현한다.
- SCN-001 protected API 호출 직전에 `currentUser.getIdToken()`으로 최신 Firebase ID token을 얻는다.
- SCN-001 protected API 호출 때만 `Authorization: Bearer <Firebase ID token>` header를 첨부한다.
- SCN-004 `/after` flow에는 token을 강제하지 않는다.
- `FlowContext`와 auth state는 분리한다.

### 10.2 Firebase persistence strategy

Phase 0에서 Firebase Auth persistence mode를 결정한다.

| 방식 | 장점 | 단점 | 비고 |
|---|---|---|---|
| in-memory persistence | 브라우저 저장소 token footprint 최소화 | 새로고침/탭 종료 시 재로그인 가능성 증가 | 보안 우선 |
| browser local persistence | UX 좋음, 새로고침 후 로그인 유지 | XSS 방어 중요, local persistence 정책 검토 필요 | Firebase Auth 자체 persistence와 app payload storage를 구분해야 함 |

주의:

- raw `user_statement`, `answer_response`, `case_intake`, `draft_response`는 Web Storage에 저장하지 않는다.
- Firebase Auth persistence는 Firebase SDK의 auth session persistence 문제이고, 민감한 app payload 저장 금지 원칙과 별개로 검토한다.
- Firebase ID token은 장기 직접 저장하지 않고 SDK에서 필요한 시점에 가져오는 방향을 우선한다.

### 10.3 Route 계획

| 경로 | 이번 범위 | 설명 |
|---|---|---|
| `/before` | 기존 유지 + 로그인 옵션 추가 후보 | Before review 진입. 로그인 시 user_id 연결 |
| `/bridge` 또는 `/scn001/bridge` | 후속 범위 | 독립 Bridge 화면은 이번 구현 범위 아님 |
| `/after` | 기존 유지 (login-free) | SCN-004 public flow 유지. Bridge seed 수신 후보 |
| `/after/result` | 기존 유지 (login-free) | |
| `/after/intake` | 기존 유지 (login-free) | |
| `/after/draft` | 기존 유지 (login-free) | |

### 10.4 Bridge handoff to After

- Bridge run 생성 후 `after_query_seed`를 `/after` textarea initial value로 전달.
- URL query param 또는 서버사이드 handoff context 사용 (Web Storage 금지).
- seed는 query text만 전달. raw BeforeHandoffDTO / BridgeOutputDTO 전체는 Web Storage 저장 금지.

---

## 11. CORS / Cookie / CSRF Plan

### 11.1 MVP Bearer Firebase ID token 기준

- MVP Bearer token 방식에서는 `allow_credentials=True`가 필수 아님.
- CORS에서 중요한 것은 SCN-001 protected API에 필요한 `Authorization` header 허용이다.
- `Access-Control-Allow-Headers` 또는 FastAPI CORS config에 `Authorization`이 포함되어야 한다.
- local origin allowlist에는 실제 frontend dev origin (`http://localhost:5090`, `http://127.0.0.1:5090`) 포함 여부를 확인한다.
- `/api/v1/answer`, `/api/v1/documents/draft`, `/api/v1/before/health`는 public endpoint로 남기며 Firebase token을 강제하지 않는다.

### 11.2 CSRF 기준

- Bearer Firebase ID token은 `Authorization` header 기반이므로 cookie session보다 CSRF 공격면이 작다.
- 브라우저가 자동으로 Bearer token을 붙이지 않으므로 CSRF 부담은 session cookie 방식보다 낮다.
- 대신 XSS 방어, token in-memory 관리, 민감 payload Web Storage 저장 금지가 중요하다.
- raw Firebase ID token, email, Firebase uid, Google sub는 logs에 남기지 않는다.

### 11.3 Future session-cookie hardening

Firebase session cookie 또는 Direct Google OAuth + backend-managed httpOnly session cookie를 선택할 때만 다음을 Post-MVP로 설계한다:

- `allow_credentials=True`
- 명시적 `allow_origins`
- httpOnly / Secure / SameSite cookie 설정
- CSRF state, CSRF token, double submit cookie
- `auth_sessions` table 또는 signed cookie
- logout / expiry / invalidation

---

## 12. GCP Infrastructure Relation

Firebase Auth는 Cloud Run + Cloud SQL + GCS 구조와 충돌하지 않는다. 다만 Firebase end-user auth와 GCP service auth를 혼동하지 않는다.

### 12.1 Cloud Run IAM auth vs Firebase end-user auth

| 구분 | 용도 | 검증 위치 |
|---|---|---|
| Browser user auth | 사용자가 SCN-001 protected API를 호출할 권한 확인 | FastAPI app-layer에서 Firebase ID token 검증 |
| Service-to-service auth | backend, worker, GCP service 간 호출 권한 | Cloud Run IAM / service account |

- Cloud Run IAM auth는 browser end-user 로그인 대체물이 아니다.
- Firebase ID token verification은 application-layer authorization이다.

### 12.2 Cloud SQL

- Cloud SQL에는 external uid가 아니라 internal user_id를 저장한다.
- Firebase uid / Google sub / email은 business table에 직접 저장하지 않는다.
- `users.auth_provider + users.provider_subject`에서 internal `users.id`를 resolve한다.

### 12.3 GCS artifact access-control

Firebase Auth만으로 GCS artifact가 자동 보호되지는 않는다.

MVP/Future 기준:

- private bucket 사용.
- backend가 internal user_id ownership 확인.
- artifact table에는 `user_id`, `job_id`, `artifact_ref` 같은 내부 참조 저장.
- signed URL 또는 auth proxy는 future/post-MVP 보안 단계에서 설계.
- raw OCR, 계약서 전문, answer/draft full payload를 public URL로 장기 노출하지 않음.

### 12.4 Cloud Tasks / Pub/Sub worker

- Cloud Tasks / Pub/Sub worker에는 Firebase token을 넘기지 않는다.
- DB에 `user_id`, `job_id`, `artifact_ref`를 저장한다.
- worker는 service account 권한으로 처리한다.
- worker는 DB의 internal user_id ownership/context를 기준으로 artifact를 처리한다.

### 12.5 Logging

Logs에는 다음을 남기지 않는다:

- Firebase ID token
- Google access token / refresh token
- email
- Google sub
- Firebase uid
- provider_subject
- raw OCR
- 계약서 전문
- raw user statement
- full answer/draft payload

필요 시 internal user_id, job_id, bridge_run_id, timestamp, status 중심으로 최소 기록한다.

---

## 13. SCN-004 Freeze Protection Plan

### 회귀 방지 Checklist

- [ ] `/after`, `/after/result`, `/after/intake`, `/after/draft` login 없이 접근 가능.
- [ ] `SCN-004-DEMO-FREEZE` exact preset fixed answer path 유지.
- [ ] `SCN-001-BRIDGE-DEMO` answer-only (supportsDraft=false) 유지.
- [ ] document eligibility guard (`frontend/src/lib/scn004DraftEligibility.ts`) 변경 없음.
- [ ] `/api/v1/answer` request/response shape 변경 없음.
- [ ] `/api/v1/documents/draft` request/response shape 변경 없음.
- [ ] `FlowContext` reducer action 변경 없음 (AuthContext는 별도).
- [ ] Firebase token은 SCN-001 protected endpoint에만 요구.
- [ ] SCN-004 request path에 token 강제하지 않음.
- [ ] CORS Authorization header 허용 후에도 public endpoints preflight/manual check 통과 확인.
- [ ] `bash scripts/demo_preflight.sh` 실행 후 FAIL=0 확인.
- [ ] manual browser rehearsal: SCN-004 exact preset path 재현 확인.

---

## 14. Privacy / Security Plan

### Personal Data Minimization

- 전화번호 직접 입력 수집 금지.
- phone OAuth scope 요청 금지.
- email nullable, primary key 아님.
- Firebase uid / Google sub / provider_subject 외부 노출 금지.
- Google access token / refresh token 장기 저장 금지.
- 원본 계약서, OCR 전문, 사용자 진술 전문 handoff DTO 포함 금지.
- raw `user_statement`, `answer_response`, `case_intake`, `draft_response` Web Storage 저장 금지.
- Kakao OAuth는 후속 provider 후보로만 문서화. 이번 구현 범위 아님.

### Token Handling

- Frontend는 Firebase SDK에서 Firebase ID token을 필요한 시점에 가져온다.
- Firebase ID token은 API 호출용 Bearer token으로만 사용한다.
- Backend는 Firebase ID token 검증 후 payload에서 uid를 추출하고 raw token을 저장하지 않는다.
- access token / refresh token 장기 저장 금지.

### Logs Masking

- backend log에 Firebase ID token, Firebase uid, Google sub, provider_subject, email, session id 전문 출력 금지.
- audit log 필요 시 internal user_id와 timestamp만 기록.

### Artifact Retention

- `after_artifact_store.py`가 저장하는 `user_statement.txt`, request/response JSON은 민감 데이터 포함 가능.
- account linkage 전에 retention/deletion 정책 확정 필요.
- 계정 이력 UI에 raw artifact 기본 노출 금지.

### Anonymous Artifact Migration

- Firebase Auth 도입 전 생성된 `before_review_jobs`, `after_artifact_runs`는 `user_id = null` orphan 상태.
- 사용자 동의 후 user linkage, 또는 orphan 유지, 또는 만료 후 삭제 선택지 필요.
- 정책 확정 전까지 기존 row는 orphan 유지.

---

## 15. Implementation Phases

### Phase 0: Auth Path Final Decision

**목적:** 구현 전 MVP auth path와 open questions 결정.

files likely touched: docs/planning/15, 16, 17 (doc-only)

acceptance criteria:
- MVP auth path가 Firebase Auth Google Sign-In + backend Firebase ID token verification인지 최종 확인.
- Firebase project / web app config / env naming 결정.
- Firebase Admin SDK credentials strategy 결정 (local vs Cloud Run).
- token verification strategy 결정.
- Firebase persistence mode 결정 (in-memory vs browser local persistence).
- `after_query_seed` 저장 전략 결정 (raw / short-lived / hash-only).
- `bridge_runs.user_id` required vs nullable 결정.
- CORS `Authorization` header allowlist 확인.
- `/api/v1/auth/me` optional vs required Bearer token 결정.
- `auth_provider` value (`"firebase"` vs `"firebase_google"`) 결정.

SCN-004 freeze risk: 없음 (doc-only)

---

### Phase 1: DB Models + Migrations

**목적:** users, bridge_runs 테이블 생성 + 기존 테이블 nullable user linkage 추가.

files likely touched:
- `backend/app/models/user.py` (new)
- `backend/app/models/bridge_run.py` (new)
- `backend/app/models/__init__.py`
- `backend/app/models/before_review_job.py` (nullable user_id 추가)
- `backend/app/models/after_artifact_run.py` (nullable user_id, source_bridge_run_id 추가)
- `backend/alembic/versions/` (new migration)

acceptance criteria:
- `users` includes `auth_provider`, `provider_subject`, `display_name`, `email`, `created_at`, `last_login_at`.
- `unique(auth_provider, provider_subject)` 적용.
- `bridge_runs`는 internal `user_id` 참조 가능.
- 기존 `before_review_jobs`, `after_artifact_runs` row 영향 없음 (nullable column 추가).
- `auth_sessions`는 session-cookie path를 선택하지 않는 한 MVP migration에서 제외.

tests/checks:
- `alembic current` 확인.
- `alembic upgrade head` 실행.
- `alembic downgrade -1` rollback 확인.

rollback risk: 낮음 (nullable column 추가)
SCN-004 freeze risk: 없음 (schema 추가만, contract 변경 없음)

---

### Phase 2: Firebase Admin Backend Token Verification + Auth Me

**목적:** Firebase Admin SDK 기반 Bearer Firebase ID token verification dependency와 auth/me endpoint 구현.

files likely touched:
- `backend/app/dependencies/auth.py` (new)
- `backend/app/routers/auth.py` (new)
- `backend/app/services/auth_service.py` (new)
- `backend/app/schemas/auth.py` (new)
- `backend/app/routers/__init__.py`
- `backend/main.py` (auth_router include, CORS Authorization header 확인)
- `.env.example` (Firebase project/config/credentials env naming만. secret 값은 기록하지 않음)

acceptance criteria:
- 유효한 Firebase ID token -> internal user_id resolve/upsert.
- invalid/expired token -> 401.
- missing token on required protected route -> 401.
- `/api/v1/auth/me` 또는 `/api/v1/auth/firebase/me` behavior가 Phase 0 결정과 일치.
- `/api/v1/answer`, `/api/v1/documents/draft`에는 Firebase token 강제 없음.
- CORS preflight에서 `Authorization` header 허용.

tests/checks:
- backend import smoke.
- Firebase ID token verification smoke.
- invalid/expired token -> 401.
- missing token on SCN-001 protected route -> 401.
- public `/api/v1/answer` without token works.
- public `/api/v1/documents/draft` without token works.
- CORS Authorization header preflight check.

rollback risk: 낮음-중간 (신규 dependency/router)
SCN-004 freeze risk: 낮음. public endpoints에 auth dependency를 걸지 않아야 함.

---

### Phase 3: Frontend Firebase SDK Setup + AuthContext/useAuth + Google Sign-In UI

**목적:** Firebase SDK 초기화, AuthContext/useAuth, Google sign-in UI 추가.

files likely touched:
- `frontend/src/lib/firebase.ts` (new)
- `frontend/src/context/AuthContext.tsx` (new)
- `frontend/src/hooks/useAuth.ts` (new)
- `frontend/src/app/layout.tsx` (AuthContext provider 추가)
- `frontend/src/components/auth/LoginButton.tsx` (new)
- `frontend/src/lib/auth-api.ts` (new)

acceptance criteria:
- Firebase SDK initializes Firebase app.
- Google Sign-In UI 동작.
- `onAuthStateChanged` 또는 on-mount `getIdToken()` 방식이 Phase 0 결정과 일치.
- SCN-001 protected API 호출 시에만 Authorization Bearer token 첨부.
- SCN-004 `/after` flow: 로그인 없이 계속 동작.
- FlowContext 변경 없음.

tests/checks:
- frontend build.
- browser: `/after` login 없이 answer 제출 가능 확인.
- browser: Google sign-in 후 auth state 표시 확인.

rollback risk: 낮음 (UI/AuthContext 추가)
SCN-004 freeze risk: FlowContext 분리 유지 시 낮음

---

### Phase 4: SCN-001 Protected Bridge-runs Endpoint + BeforeHandoffDTO Extraction

**목적:** `POST /api/v1/scn001/bridge-runs` protected endpoint와 BeforeHandoffDTO extraction 구현.

files likely touched:
- `backend/app/services/scn001_linkage.py` (new)
- `backend/app/schemas/bridge.py` (new)
- `backend/app/routers/scn001.py` (new)
- `backend/app/routers/__init__.py`

acceptance criteria:
- `POST /api/v1/scn001/bridge-runs` requires Bearer Firebase ID token.
- `GET /api/v1/scn001/bridge-runs/{bridge_run_id}` requires Bearer Firebase ID token.
- Backend verifies Firebase ID token, resolves internal user_id, and stores bridge_runs.user_id.
- raw OCR / raw contract / raw user_statement DTO 포함 금지 확인.
- BridgeOutputDTO는 docs/planning/16과 호환.

tests/checks:
- bridge-runs create/get smoke with valid token.
- missing token -> 401.
- invalid token -> 401.
- ownership mismatch -> 403 or 404 (Phase 0/implementation decision).
- BeforeHandoffDTO field validation.

rollback risk: 낮음 (신규 endpoint 추가)
SCN-004 freeze risk: 없음 (신규 router, 기존 router 변경 없음)

---

### Phase 5: Before Review User Linkage

**목적:** Before review 완료 시 internal user_id 연결.

files likely touched:
- `backend/app/before_stack/services/job_store.py`
- `backend/app/before_stack/main.py`
- auth dependency/service files if shared

acceptance criteria:
- 로그인 사용자가 Before review 실행 시 `before_review_jobs.user_id` 기록.
- 비로그인 Before review 허용 여부는 Phase 0 결정에 따른다. 기존 public health는 유지.
- raw review result / OCR / contract payload를 auth logs에 남기지 않음.

tests/checks:
- Before review API smoke.
- DB row user_id 확인.
- public `/api/v1/before/health` without token works.

rollback risk: 낮음 (nullable column 활용)
SCN-004 freeze risk: 없음 (Before와 After는 독립)

---

### Phase 6: Bridge -> After Answer-only Handoff

**목적:** BridgeOutputDTO.after_query_seed -> After textarea initial value 연결.

files likely touched:
- `frontend/src/app/after/page.tsx` (seed initial value 수신 로직)
- `frontend/src/lib/api.ts` (optional: seed 파라미터 처리)

acceptance criteria:
- Bridge seed 전달 후 `/after` textarea에 seed text 반영.
- `FlowContext.user_statement` 설정 방식 유지.
- Web Storage 저장 없음.
- `/api/v1/answer` request shape 변경 없음.
- `SCN-001-BRIDGE-DEMO` answer-only 유지.

tests/checks:
- browser: Bridge seed -> `/after` textarea initial value 확인.
- browser: SCN-004 exact preset path 변경 없음 확인.
- `fetchAnswer` 호출 shape 확인 (contract 변경 없음).

rollback risk: 낮음
SCN-004 freeze risk: textarea 초기값 처리 분기 추가 시 SCN-004 preset path 영향 없어야 함

---

### Phase 7: after_artifact_runs Linkage

**목적:** After answer/draft artifact 저장 시 internal user_id, source_bridge_run_id 연결.

files likely touched:
- `backend/app/services/after_artifact_store.py`
- `backend/app/routers/answer.py` (optional user_id extraction only if token present)
- `backend/app/routers/document_draft.py` (optional user_id extraction only if token present)

acceptance criteria:
- 로그인 사용자 SCN-001 After answer -> `after_artifact_runs.user_id` 기록 후보.
- 비로그인 SCN-004 answer/draft -> `user_id = null` 유지.
- `/api/v1/answer` request/response shape 변경 없음.
- `/api/v1/documents/draft` request/response shape 변경 없음.
- SCN-004 request path에 token 강제하지 않음.

tests/checks:
- answer/draft smoke (login-free 포함).
- DB row user_id 확인.
- `bash scripts/demo_preflight.sh` 실행.

rollback risk: 낮음 (nullable column 활용)
SCN-004 freeze risk: public endpoint auth dependency 강제 시 높음. optional linkage로 제한해야 함.

---

### Phase 8: Regression / Demo Preflight / Manual Rehearsal

**목적:** 전체 regression 확인, SCN-004 demo freeze 검증.

files likely touched: 없음 (검증만)

acceptance criteria:
- Firebase ID token verification smoke 통과.
- invalid/expired token -> 401.
- missing token on SCN-001 protected route -> 401.
- public `/api/v1/answer` still works without token.
- public `/api/v1/documents/draft` still works without token.
- SCN-004 `/after` login-free browser test 통과.
- CORS Authorization header preflight check 통과.
- `bash scripts/demo_preflight.sh` FAIL=0.
- manual browser rehearsal: SCN-004 exact preset path.
- manual browser rehearsal: SCN-001 answer-only path.

---

## 16. Testing / Verification Plan

| 항목 | 방법 |
|---|---|
| backend import smoke | `python -c "from backend.main import app; print('import_ok')"` |
| alembic migration | `alembic upgrade head` -> `alembic downgrade -1` |
| Firebase ID token verification smoke | valid Firebase ID token으로 protected dependency 통과 확인 |
| invalid/expired token | SCN-001 protected route가 401 반환 |
| missing token | SCN-001 protected route가 401 반환 |
| auth/me smoke | `/api/v1/auth/me` 또는 `/api/v1/auth/firebase/me`가 Phase 0 결정대로 optional/required 동작 |
| CORS Authorization header | preflight에서 `Authorization` header 허용 확인 |
| bridge run smoke | `POST /api/v1/scn001/bridge-runs` -> DB row 확인 |
| bridge run ownership | 다른 user_id의 bridge_run 조회 차단 |
| Before job linkage smoke | Before review API 호출 후 DB row user_id 확인 |
| public answer unchanged | `/api/v1/answer` without token works, request/response shape 변경 없음 |
| public draft unchanged | `/api/v1/documents/draft` without token works, shape 변경 없음 |
| SCN-004 browser regression | `/after` login-free exact preset -> fixed answer -> draft flow |
| frontend build | `npm run build` |
| demo_preflight | `bash scripts/demo_preflight.sh` FAIL=0 확인 |
| manual SCN-001 rehearsal | browser: answer-only, supportsDraft=false 확인 |

**주의:** retrieval / answer behavior 변경이 없는 phase에서는 broad full eval 실행 금지.
`eval/run_answer_evidence_report.py`는 item-level PASS / PARTIAL / FAIL evidence가 필요할 때만 실행하고 `scripts/demo_preflight.sh`에 추가하지 않는다.

---

## 17. Open Questions

Phase 0에서 결정해야 할 항목:

| # | Question | 현재 상태 | Priority |
|---|---|---|---|
| 1 | Firebase project / web app config env names | 미결 | High |
| 2 | Firebase Admin SDK credentials strategy on local vs Cloud Run | 미결 | High |
| 3 | `auth_provider` value: `"firebase"` vs `"firebase_google"` | 미결 | High |
| 4 | Firebase Auth persistence mode: in-memory vs browser local persistence | 미결 | High |
| 5 | token refresh strategy on frontend (`getIdToken()` timing, forced refresh 조건) | 미결 | High |
| 6 | SCN-001 protected endpoints list | `bridge-runs` 우선, 세부 확정 필요 | High |
| 7 | `/api/v1/auth/me` accepts Bearer token optional vs required | 미결 | Medium |
| 8 | session cookie future path 채택 여부와 시점 | Future/Post-MVP | Medium |
| 9 | `bridge_runs.user_id` required vs nullable | TBD. protected endpoint에서는 internal user_id 연결 | High |
| 10 | `before_review_jobs.user_id` required vs nullable | nullable 권장 | Medium |
| 11 | `after_query_seed` raw / short-lived / hash-only | TBD | High |
| 12 | anonymous artifact handling (orphan 유지 / user linkage / 삭제) | TBD | Medium |
| 13 | artifact retention/deletion 정책 | TBD | Medium |
| 14 | Bridge 구현: backend route vs service adapter vs frontend context | TBD | Medium |
| 15 | SCN-001 document draft 후속 여부 (현재 answer-only 유지) | answer-only 유지 | Low |
| 16 | Before canonical field source (backend full vs frontend consumed) | TBD | Medium |
| 17 | CORS Authorization header allowlist and local origins (`5090`, `127.0.0.1:5090`) | 미결 | High |
| 18 | GCS artifact access-control future: signed URL vs auth proxy | Future/Post-MVP | Medium |
| 19 | Cloud Tasks / Pub/Sub worker hardening and service account boundaries | Future/Post-MVP | Medium |

---

## 18. Recommended Next Step

이 계획 문서 작성 완료 후 **바로 구현하지 않는다.**

1. 이 문서 리뷰 - 팀원과 Firebase Auth MVP path, open questions 확인.
2. Phase 0 결정 - Firebase project/config/env naming, Admin credentials, token verification, persistence, CORS Authorization header.
3. Phase 1부터 작은 patch로 착수 - DB model 추가 -> migration -> auth dependency 순서로 분리된 PR.
4. 각 phase마다 SCN-004 regression 확인 - `bash scripts/demo_preflight.sh` + manual rehearsal.
5. Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback 문서 범위로 유지하고 MVP 필수 구현으로 착수하지 않는다.

개인정보 최소 수집 원칙과 SCN-004 freeze 보호 원칙은 모든 phase에서 유지한다.
