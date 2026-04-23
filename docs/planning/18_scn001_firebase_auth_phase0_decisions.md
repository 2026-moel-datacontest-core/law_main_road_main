# SCN-001 Firebase Auth Phase 0 Decisions

기준일: `2026-04-22`

## 1. Purpose

- 이 문서는 Firebase Auth + SCN-001 Before-Bridge-After 연결 구현 전 Phase 0 결정 문서다.
- `docs/planning/17_firebase_auth_scn001_implementation_plan.md`의 Open Questions를 Phase 1 구현 전에 판단 가능한 수준으로 구체화한다.
- 코드 구현 문서가 아니며, 이 문서 작성만으로 Firebase/Auth/DB/Bridge 구현이 완료된 것이 아니다.
- 2026-04-22 현재 Phase 0~3은 별도 커밋으로 완료됐다. 이 문서는 Phase 4 착수 전 결정 상태를 확인하는 baseline으로 유지한다.
- 확정 가능한 항목은 `Decision`, 구현 전 값 또는 후속 설계가 더 필요한 항목은 `TBD`로 분리한다.
- SCN-004 `/after` flow, `/api/v1/answer`, `/api/v1/documents/draft` public contract와 demo freeze 보호를 우선한다.

## 2. Decision Summary

| Topic | Decision | Status | Blocks | Notes |
|---|---|---:|---|---|
| 1. MVP auth path | Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase ID token verification | Decided | Phase 1 / Phase 2 | Direct Google OAuth + backend session cookie는 Alternative/Fallback |
| 2. auth_provider value | `auth_provider = "firebase_google"` | Decided | Phase 1 | Firebase Auth 안의 Google provider임을 명확히 함 |
| 3. provider_subject meaning | Firebase Auth MVP path에서 `provider_subject = Firebase uid` | Decided | Phase 1 / Phase 2 | Google `sub`는 Direct Google OAuth Alternative/Fallback subject |
| 4. Firebase project config env names | env var naming은 이 문서 기준으로 고정. 실제 값은 TBD | Decided / TBD | Phase 2 / Phase 3 | 값 제공은 Blocking Before Phase 2 또는 Phase 3 |
| 5. Firebase Admin SDK credential strategy | Local은 ADC 우선, ignored service account path fallback. Cloud Run은 service account identity | Decided / TBD | Phase 2 | 실제 credential provisioning은 Blocking Before Phase 2 |
| 6. Firebase Auth persistence mode | MVP는 `inMemoryPersistence` 사용 | Decided | Phase 3 | Phase 3 구현 결과와 일치. Firebase auth state / token을 browser Web Storage에 남기지 않음 |
| 7. token refresh strategy | protected SCN-001 API 호출 직전 `getIdToken()`, 401 시 forced refresh 1회 | Decided | Phase 3 | interval polling 금지, token 장기 app state 저장 금지 |
| 8. SCN-001 protected endpoints | `POST /api/v1/scn001/bridge-runs`, `GET /api/v1/scn001/bridge-runs/{bridge_run_id}` | Decided | Phase 4 | `GET /api/v1/scn001/runs`는 optional |
| 9. `/api/v1/auth/me` path and bearer policy | `GET /api/v1/auth/me`, missing token은 `{ logged_in: false }`, invalid token은 401 | Decided | Phase 2 | Firebase uid / provider_subject는 response에 노출하지 않음 |
| 10. CORS Authorization header allowlist | MVP Bearer path는 `Authorization` header 허용 필요, `allow_credentials=True` 필수 아님 | Decided | Phase 2 | SCN-004 public preflight regression check 필수 |
| 11. bridge_runs.user_id required vs nullable | MVP protected `bridge_runs.user_id`는 required | Decided | Phase 1 / Phase 4 | `SCN-001-BRIDGE-DEMO`는 bridge_runs 미생성 answer-only |
| 12. after_query_seed storage strategy | raw seed persistent 저장 금지. `after_query_seed_hash` + safe summary 중심 | Decided / TBD | Phase 1 / Phase 4 / Phase 6 | exact handoff transport는 Phase 6 전 TBD |
| 13. anonymous artifact handling | 기존 anonymous artifact는 orphan 유지 | Decided | Phase 5+ | retroactive linking은 Post-MVP |
| 14. artifact retention/deletion | raw artifact는 민감 데이터로 취급. retention duration/deletion workflow는 TBD | TBD | Phase 5+ | 최소 노출 정책은 지금 적용, 운영 삭제 정책은 후속 |
| 15. Bridge implementation location | protected flow는 backend route + service | Decided | Phase 4 | 독립 `/bridge` UI route는 후속 |
| 16. SCN-001 document draft scope | Minimum MVP는 SCN-001 answer-only | Decided | Non-blocking | SCN-001 draft는 Strong MVP / optional extension |

## 3. Decisions

### D-001. MVP Auth Path

- Decision: Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase ID token verification
- Status: Decided
- Blocks: Phase 1 / Phase 2
- Rationale:
  - custom Direct Google OAuth 구현 부담을 줄인다.
  - SCN-004 login-free flow에 미치는 영향을 최소화한다.
  - Google access token / refresh token 장기 저장이 필요 없다.
  - Firebase uid 기반으로 internal user_id mapping을 만들 수 있다.
- Implementation Notes:
  - frontend는 Firebase SDK를 사용한다.
  - frontend는 SCN-001 protected API 호출 시에만 `Authorization: Bearer <Firebase ID token>`을 보낸다.
  - backend는 Firebase Admin SDK로 Firebase ID token을 검증한다.
  - SCN-001 protected endpoint에만 Bearer token을 요구한다.
  - SCN-004 `/after` flow, `/api/v1/answer`, `/api/v1/documents/draft`에는 로그인이나 token을 강제하지 않는다.

### D-002. auth_provider Value

- Decision: `auth_provider = "firebase_google"`
- Status: Decided
- Blocks: Phase 1
- Rationale:
  - 첫 provider가 Firebase Auth의 Google provider임을 명확히 한다.
  - 향후 Firebase Auth 안에서 다른 provider를 추가할 때 `firebase_google`, `firebase_apple` 같은 구분이 가능하다.
  - Direct Google OAuth Alternative/Fallback의 provider namespace와 혼동을 줄인다.
  - multi-provider linking은 Post-MVP이므로 지금은 단일 provider value를 고정해 DB unique constraint를 안정화한다.
- Risk:
  - provider 값을 바꾸면 `unique(auth_provider, provider_subject)`와 migration에 영향이 있다.
  - 기존 planning 문서 일부의 `"google"` 표현은 Direct Google OAuth 관점의 historical wording으로 보고, Firebase Auth MVP path 구현에서는 `firebase_google`을 사용한다.

### D-003. provider_subject Meaning

- Decision: Firebase Auth MVP path에서 `provider_subject = Firebase uid`
- Status: Decided
- Blocks: Phase 1 / Phase 2
- Notes:
  - Google `sub`는 Direct Google OAuth Alternative/Fallback에서의 subject다.
  - Firebase Auth MVP path에서는 backend가 Firebase Admin SDK로 ID token을 검증하고 Firebase uid를 추출한다.
  - `users.auth_provider + users.provider_subject`에서 internal `users.id`를 resolve/upsert한다.
  - business table에는 Firebase uid / Google sub / email / provider_subject를 직접 저장하지 않고 internal user_id만 저장한다.
  - backend response에도 Firebase uid, Google sub, provider_subject를 노출하지 않는다.

### D-004. Firebase Env Vars

- Decision: Firebase Auth MVP path의 env var naming은 아래 표를 기준으로 한다.
- Status: Decided for names, TBD for actual values
- Blocks: Blocking Before Phase 2 for backend values, Blocking Before Phase 3 for frontend values

Frontend web config:

| Env var | Required | Local / Prod | Secret? | `.env.example` 반영 필요 | Notes |
|---|---:|---|---:|---:|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | local / prod | No | Yes | Firebase web API key. public config지만 Firebase console 제한 설정 필요 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | local / prod | No | Yes | 예: `<project>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | local / prod | No | Yes | backend `FIREBASE_PROJECT_ID`와 같은 Firebase project |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | local / prod | No | Yes | Firebase web app id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | No | local / prod | No | Optional | MVP Auth만으로는 필수 아님 |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No | local / prod | No | Optional | Firebase config 생성 방식에 따라 보조값 |

Backend config:

| Env var | Required | Local / Prod | Secret? | `.env.example` 반영 필요 | Notes |
|---|---:|---|---:|---:|---|
| `FIREBASE_PROJECT_ID` | Yes | local / prod | No | Yes | Firebase Admin SDK token verification 대상 project |
| `FIREBASE_ADMIN_CREDENTIALS` | No | local only fallback | Path itself: No / JSON contents: Yes | Yes, commented placeholder | ignored `config/secrets/...` JSON path fallback |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | local fallback | Path itself: No / JSON contents: Yes | Already present | ADC/service account path fallback로 허용 |
| `FIREBASE_AUTH_EMULATOR_HOST` | No | local only | No | Yes, commented placeholder | local emulator 사용 시에만 |

- Implementation Notes:
  - 실제 Firebase project id, web app config 값, service account credential source는 이 문서에 적지 않는다.
  - secret 값과 credential JSON 내용은 출력하거나 git에 포함하지 않는다.
  - Cloud Run에서는 checked-in key 없이 service account identity / ADC 기반으로 검증하는 방식을 우선한다.
  - 기존 `NEXT_PUBLIC_API_BASE_URL`은 backend API base URL용이며 Firebase config와 별개다.

### D-005. Firebase Admin Credential Strategy

- Decision: Local은 ADC 우선, ignored service account JSON path fallback. Cloud Run은 attached service account identity를 사용하고 checked-in key를 만들지 않는다.
- Status: Decided for strategy, TBD for actual credential provisioning
- Blocks: Blocking Before Phase 2

| Environment | Recommended strategy | Notes |
|---|---|---|
| Local primary | Application Default Credentials | `gcloud auth application-default login` 또는 개발자별 ADC. secret 출력 금지 |
| Local fallback | ignored service account JSON path | 예: `config/secrets/...` 아래 git ignored 파일. env에는 path placeholder만 |
| Cloud Run | service account identity / Workload Identity style default credentials | key file 배포 금지. Secret Manager는 불가피할 때만 |
| Firebase emulator | `FIREBASE_AUTH_EMULATOR_HOST` | local-only optional |

- Implementation Notes:
  - backend log에는 Firebase ID token, credential path 상세, service account JSON 내용, Firebase uid, email을 남기지 않는다.
  - `FIREBASE_ADMIN_CREDENTIALS`가 있으면 local fallback으로 사용하고, 없으면 ADC를 사용한다.
  - Cloud Run production에서는 `FIREBASE_ADMIN_CREDENTIALS` 없이 runtime service account 권한으로 동작하는 것을 목표로 한다.

### D-006. Firebase Auth Persistence Mode

- Decision: MVP frontend는 Firebase Auth `inMemoryPersistence`를 기본으로 사용한다.
- Status: Decided
- Blocks: Phase 3
- Rationale:
  - Phase 3 frontend 구현은 Firebase SDK `setPersistence(auth, inMemoryPersistence)`로 확정됐다.
  - Firebase auth state / token을 `localStorage` 또는 `sessionStorage`에 남기지 않는 token memory-only 정책을 우선한다.
  - SCN-001 protected API 호출은 현재 memory auth state가 있을 때 `getIdToken()`으로 Firebase ID token을 받아 수행한다.
  - refresh / reload / browser close 후 로그인 유지가 약해지고 재로그인이 필요할 수 있지만, MVP에서는 보안 우선 tradeoff로 수용한다.
- Implementation Notes:
  - Firebase Auth persistence는 Firebase SDK의 auth session persistence 문제이며, MVP에서는 browser Web Storage 잔존을 만들지 않는 방향을 우선한다.
  - raw `user_statement`, `answer_response`, `case_intake`, `draft_response`, raw Before review result를 Web Storage에 저장하지 않는 원칙은 그대로 유지한다.
  - `browserSessionPersistence`는 refresh 복원성이 필요할 때 Future/Post-MVP UX tradeoff 후보로 재검토한다.
  - `browserLocalPersistence`는 Post-MVP UX hardening에서 별도로 재검토한다.

### D-007. Token Refresh Strategy

- Decision: frontend는 SCN-001 protected API 호출 직전에 `getIdToken()`으로 Firebase ID token을 가져온다.
- Status: Decided
- Blocks: Phase 3
- Implementation Notes:
  - interval polling으로 token을 주기 갱신하지 않는다.
  - protected request마다 현재 `currentUser.getIdToken()`을 호출한다.
  - backend가 401을 반환하면 `getIdToken(true)` forced refresh를 1회 시도한 뒤 같은 요청을 1회만 retry한다.
  - retry 후에도 401이면 로그인 재요청 또는 signed-out 상태로 전환한다.
  - Firebase ID token raw value는 app state, Web Storage, logs에 장기 저장하지 않는다.
  - `/api/v1/answer`, `/api/v1/documents/draft`, SCN-004 `/after` public path에는 token을 자동 첨부하지 않는다.

### D-008. SCN-001 Protected Endpoints

- Decision: MVP protected endpoint는 Bridge run 생성/조회로 시작한다.
- Status: Decided
- Blocks: Phase 4

MVP protected:

| Method | Path | Auth policy | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/scn001/bridge-runs` | Bearer Firebase ID token required | `BeforeHandoffDTO`에서 `BridgeOutputDTO` 생성 및 저장 |
| `GET` | `/api/v1/scn001/bridge-runs/{bridge_run_id}` | Bearer Firebase ID token required | bridge run 조회, internal user_id ownership 확인 |

Optional:

| Method | Path | Status | Notes |
|---|---|---:|---|
| `GET` | `/api/v1/scn001/runs` | TBD | 계정 이력 목록은 Minimum MVP 필수 아님 |

Public 유지:

- `POST /api/v1/answer`
- `POST /api/v1/documents/draft`
- `GET /api/v1/before/health`
- SCN-004 `/after`, `/after/result`, `/after/intake`, `/after/draft`
- presentation preset `SCN-001-BRIDGE-DEMO` answer-only fixed/live path

### D-009. `/api/v1/auth/me`

- Decision: path는 `GET /api/v1/auth/me`로 고정한다.
- Status: Decided
- Blocks: Phase 2
- Bearer policy:
  - missing token: `200 { "logged_in": false }`
  - valid token: `200 { "logged_in": true, "user_id": "<internal user_id>", "display_name": string | null, "email": string | null }`
  - invalid / expired / malformed token: `401`
- Rationale:
  - `/api/v1/auth/me`는 provider-neutral path라서 Firebase implementation detail을 URL에 고정하지 않는다.
  - missing token은 정상적인 logged-out browser 상태로 처리한다.
  - invalid token은 silent logged-out 처리하지 않고 frontend token refresh/re-login 경로를 타게 한다.
  - invalid token을 401로 두면 CORS/auth regression을 발견하기 쉽다.
- Privacy Notes:
  - response에 Firebase uid, Google sub, provider_subject를 포함하지 않는다.
  - email은 nullable display/contact 후보이며 primary identifier가 아니다.

### D-010. CORS Authorization Header

- Decision: MVP Bearer Firebase ID token 방식에서는 CORS `Authorization` header 허용이 필요하다.
- Status: Decided
- Blocks: Phase 2 implementation and regression check
- Current State:
  - 현재 `backend/main.py`의 기본 CORS origin regex는 `http://localhost:5090`, `http://127.0.0.1:5090`을 포함한다.
  - 현재 CORS `allow_credentials=False`다. MVP Bearer token path에서는 `allow_credentials=True`가 필수 아니다.
  - 현재 `allow_headers`는 `Content-Type` 중심이므로 Phase 2에서 `Authorization` 허용을 추가해야 한다.
- Implementation Notes:
  - `Authorization` header allowlist 변경은 SCN-001 protected endpoint를 위해 필요하다.
  - existing `BACKEND_CORS_ORIGIN_REGEX` override가 있으면 local dev origins와 충돌하지 않는지 확인한다.
  - local frontend dev origins:
    - `http://localhost:5090`
    - `http://127.0.0.1:5090`
  - CORS 변경 후 `/api/v1/answer`, `/api/v1/documents/draft`, `/api/v1/before/health` public preflight와 SCN-004 browser flow를 재확인한다.

### D-011. bridge_runs.user_id Required

- Decision: MVP protected SCN-001 `bridge_runs.user_id`는 required다.
- Status: Decided
- Blocks: Phase 1 / Phase 4
- Rationale:
  - `POST /api/v1/scn001/bridge-runs`가 protected endpoint라면 bridge run ownership은 항상 internal user_id로 확인해야 한다.
  - business table에는 Firebase uid / Google sub / email이 아니라 internal `users.id`만 저장한다.
  - 비로그인 demo-compatible path는 DB `bridge_runs`를 만들지 않는 presentation preset으로 분리한다.
- Implementation Notes:
  - `SCN-001-BRIDGE-DEMO`는 bridge_runs를 만들지 않고 기존 answer-only preset으로 유지한다.
  - 기존 SCN-004 `/after` flow도 bridge_runs를 만들지 않는다.
  - 신규 `bridge_runs` table은 protected flow 전용으로 설계한다.

### D-012. after_query_seed Storage Strategy

- Decision: MVP에서는 raw `after_query_seed`를 DB에 persistent 저장하지 않는다.
- Status: Decided for persistence, TBD for exact handoff transport
- Blocks: Phase 1 / Phase 4 / Phase 6
- Rationale:
  - `after_query_seed`는 사용자 사실관계와 Before 결과 요약을 포함할 수 있어 민감 데이터로 취급해야 한다.
  - Bridge DB row에는 safe summary, normalized risk tags, label-level `law_refs`, `after_query_seed_hash` 중심으로 저장한다.
  - 중복 추적이나 debugging에는 hash와 internal ids를 우선 사용한다.
- Implementation Notes:
  - `bridge_runs`에는 `after_query_seed_hash`를 저장한다.
  - raw seed 전달은 short-lived response payload 또는 server-side temporary handoff 중 하나로 Phase 6 전에 결정한다.
  - frontend Web Storage에 raw seed, BeforeHandoffDTO, BridgeOutputDTO 전체를 저장하지 않는다.
  - `/api/v1/answer` request는 기존 `{ query, top_k, ef_search }` contract를 유지한다.
- Remaining TBD:
  - `/after` initial textarea로 seed를 전달할 구체 방식: response payload direct handoff, short-lived server-side handoff id, URL param 일부 사용 금지/허용 범위.

### D-013. Anonymous Artifact Handling

- Decision: Firebase Auth 도입 전 생성된 anonymous artifact는 MVP에서 orphan 상태로 유지한다.
- Status: Decided
- Blocks: Phase 5+
- Rationale:
  - 기존 artifact를 사용자에게 retroactive linking하려면 동의, ownership proof, 삭제 정책이 필요하다.
  - Minimum MVP의 목표는 새 protected SCN-001 flow의 internal user_id 연결이다.
  - 과거 익명 artifact 연결은 scope creep와 privacy risk가 크다.
- Implementation Notes:
  - OAuth 도입 후 새로 생성되는 protected flow artifact만 internal user_id와 연결한다.
  - 기존 `before_review_jobs`, `after_artifact_runs`의 anonymous row는 `user_id = null` orphan로 유지한다.
  - user consent 후 retroactive linking, orphan delete 선택지, migration UI는 Post-MVP로 둔다.

### D-014. Artifact Retention / Deletion

- Decision: MVP에서는 raw artifact 기본 노출 금지와 account-linked artifact 접근 제어 원칙만 최소 확정한다.
- Status: TBD for retention duration and deletion workflow
- Blocks: Phase 5+ for account-linked artifact exposure, Non-blocking for Phase 1~4 auth/bridge skeleton
- Minimum MVP Policy:
  - raw contract file, raw OCR, raw user_statement, full answer/draft payload는 민감 데이터로 취급한다.
  - 계정 이력이나 Bridge DTO에는 raw artifact 전문을 기본 노출하지 않는다.
  - account-linked artifact는 internal user_id ownership 확인 없이는 조회하지 않는다.
  - artifact_refs는 공개 URL이 아니라 internal reference로만 사용한다.
  - deletion UI / retention expiry job / GCS signed URL 정책은 Post-MVP일 수 있다.
- Remaining TBD:
  - retention 기간.
  - 사용자 삭제 요청 처리 방식.
  - orphan artifact 만료 삭제 여부.
  - GCS 전환 시 signed URL vs backend auth proxy.

### D-015. Bridge Implementation Location

- Decision: MVP protected flow에서는 backend route + service로 `bridge_runs`를 생성한다.
- Status: Decided
- Blocks: Phase 4
- Rationale:
  - Bridge run은 internal user_id ownership과 DB persistence가 필요하므로 backend route가 자연스럽다.
  - service layer가 `BeforeHandoffDTO`를 safe summary / risk tag / `after_query_seed_hash` 중심으로 변환한다.
  - frontend context adapter만으로는 account-linked bridge_runs ownership을 보장하기 어렵다.
- Implementation Notes:
  - route: `POST /api/v1/scn001/bridge-runs`, `GET /api/v1/scn001/bridge-runs/{bridge_run_id}`.
  - service: Bridge DTO validation, safe summary generation, hash generation, DB persistence.
  - 독립 `/bridge` UI route는 Minimum MVP 후속이다.
  - SCN-004 flow와 분리하고 `/api/v1/answer`, `/api/v1/documents/draft` contract를 변경하지 않는다.

### D-016. SCN-001 Document Draft Scope

- Decision: Minimum MVP에서는 SCN-001 answer-only로 유지한다.
- Status: Decided
- Blocks: Non-blocking
- Rationale:
  - SCN-001 Before-Bridge-After 연결의 첫 성공 기준은 answer-only handoff 안정화다.
  - SCN-001 전용 document draft는 prompt/schema 품질과 별도 guard가 필요하다.
  - SCN-004 document draft freeze와 섞으면 regression risk가 커진다.
- Implementation Notes:
  - SCN-001 document draft는 Strong MVP / optional extension이다.
  - `/api/v1/documents/draft` public contract는 변경하지 않는다.
  - `SCN-001-BRIDGE-DEMO`는 fixed/live 여부와 관계없이 answer-only다.
  - `SCN-004-DEMO-FREEZE`와 SCN-004 eligible free input만 draft flow를 통과한다.

## 4. Phase Gates

| Phase | Required Decisions | Can Start? | Notes |
|---|---|---:|---|
| Phase 1 DB models | D-002, D-003, D-011, D-012 | Completed | `users`, `bridge_runs`, `before_review_jobs.user_id`, `after_artifact_runs.user_id`, `after_artifact_runs.source_bridge_run_id` implemented |
| Phase 2 Backend Firebase verification | D-004, D-005, D-008, D-009, D-010 | Completed | Firebase Admin SDK verification, `/api/v1/auth/me`, CORS `Authorization` header implemented |
| Phase 3 Frontend auth | D-004, D-006, D-007 | Completed | Firebase Web SDK, `AuthContext`, Login UI, backend verification UI, `inMemoryPersistence` implemented |
| Phase 4 Protected bridge-runs endpoint + `BeforeHandoffDTO` extraction | D-008, D-011, D-012, D-015 | Yes, next | `require_current_user`, users/bridge_runs schema, `/api/v1/auth/me`, frontend login capability are ready |
| Phase 5 Before review user linkage | D-013, D-014 plus consent timing | Later | nullable `before_review_jobs.user_id` exists; runtime linkage and consent timing remain |
| Phase 6 Bridge -> After answer-only handoff | D-012 | Later | raw seed persistent 저장 금지. exact handoff transport TBD |
| Phase 7 `after_artifact_runs` linkage | D-013, D-014 | Later | nullable `user_id` / `source_bridge_run_id` exists; runtime linkage remains |
| Phase 8 Regression / demo preflight / manual rehearsal | all SCN-004 guards | Later | no code change phase |
| Phase 5+ Artifact/account history | D-013, D-014 | No for raw artifact exposure | orphan 유지 결정은 완료. retention/deletion/access-control 상세는 TBD |
| Strong MVP SCN-001 draft | D-016 | No | Minimum MVP 범위 밖. SCN-001 answer-only 안정화 후 별도 review |

## 5. SCN-004 Regression Guard

- SCN-004 `/after` login-free flow는 유지한다.
- `/api/v1/answer`는 public endpoint로 유지하고 request/response contract를 변경하지 않는다.
- `/api/v1/documents/draft`는 public endpoint로 유지하고 request/response contract를 변경하지 않는다.
- `SCN-004-DEMO-FREEZE` exact preset fixed answer path는 unchanged로 유지한다.
- `SCN-001-BRIDGE-DEMO`는 answer-only이며 document draft UI를 열지 않는다.
- Firebase ID token은 SCN-001 protected endpoint에만 요구한다.
- CORS `Authorization` header 변경은 public paths를 깨면 안 된다.
- Phase 4 이후 회귀 확인 항목:
  - `bash scripts/demo_preflight.sh`
  - manual browser rehearsal: SCN-004 exact preset path
  - manual browser rehearsal: SCN-001 answer-only path
  - public `/api/v1/answer` without token
  - public `/api/v1/documents/draft` without token
  - CORS preflight with `Authorization` header
- 이 문서 작업에서는 서버 실행, build, eval, preflight를 수행하지 않는다.

## 6. Remaining TBDs

| TBD | why unresolved | owner/source of decision | required before phase |
|---|---|---|---|
| 실제 Firebase project id와 web app config 값 | local env/secret으로만 관리. 실제 값은 문서에 기록하지 않음 | Firebase/GCP project owner | ongoing local/prod setup |
| local Firebase Admin credential provisioning detail | D-005 strategy는 결정됨. 개발자별 실제 ADC 또는 ignored credential path는 ops 문서 기준 | Backend owner / GCP project owner | ongoing local/prod setup |
| `BeforeHandoffDTO` extraction source | backend full result vs frontend consumed fields의 안정 contract 확정 필요 | Before/Bridge contract owner | Phase 4 |
| `after_query_seed` exact handoff transport | raw persistent 저장 금지는 결정됐지만 response payload vs temporary handoff id 방식은 UX/route 설계 필요 | Frontend + Backend | Phase 6 |
| artifact retention duration | 민감 raw artifact 보관 기간 정책은 제품/운영 결정 필요 | Product / Ops / Backend | Phase 5+ |
| deletion workflow | 계정 삭제, artifact 삭제, orphan 만료 삭제 구현 범위 미확정 | Product / Ops | Post-MVP or before account history |
| account linkage consent timing | Before review 전, Bridge 생성 전, After 저장 전 중 UX 결정 필요 | Product / UX | Phase 5 |
| `law_refs` normalization rule | full citation label vs 법령명+조문번호 축약 기준 필요 | Backend / Legal content owner | Phase 4 / Phase 5 |
| optional `GET /api/v1/scn001/runs` | account history가 Minimum MVP인지 미확정 | Product / Backend | Non-blocking |
| GCS artifact access-control | signed URL vs backend auth proxy는 production storage 전환 설계 필요 | Ops / Backend | Post-MVP |
| Cloud Tasks / Pub/Sub worker hardening | Firebase end-user token과 service account boundary 세부화 필요 | Ops / Backend | Post-MVP |

- GCP infra boundary는 `docs/planning/17_firebase_auth_scn001_implementation_plan.md` §12를 따른다: Firebase end-user auth와 Cloud Run IAM은 별개이며, GCS artifact는 Firebase Auth만으로 자동 보호되지 않고, worker에는 Firebase token을 전달하지 않는다.

## 7. Recommended Next Step

1. `docs/planning/19_scn001_auth_integration_status.md`를 Phase 4 handoff checkpoint로 읽는다.
2. Phase 4에서 `POST /api/v1/scn001/bridge-runs`와 `GET /api/v1/scn001/bridge-runs/{bridge_run_id}` protected endpoint를 구현한다.
3. `BeforeHandoffDTO` extraction은 raw OCR / raw contract / raw user_statement / raw `after_query_seed` persistent 저장 없이 구현한다.
4. SCN-004 `/after`, `/api/v1/answer`, `/api/v1/documents/draft` login-free/public contract를 유지한다.
5. Phase 5는 Before review user linkage, Phase 6은 Bridge -> After answer-only handoff, Phase 7은 `after_artifact_runs` linkage로 유지한다.
