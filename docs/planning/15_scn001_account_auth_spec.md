# SCN-001 Account/Auth Minimal Data Spec

기준일: `2026-04-22`

이 문서는 구현 지시서가 아니라 SCN-001 Before-Bridge-After 연결 초안을 위한 최소 데이터 계약 후보를 고정하는 planning 문서다. 2026-04-22 현재 Firebase Auth Phase 0~3은 별도 커밋으로 구현 완료됐으며, 이 문서는 Phase 4 착수 전 데이터 계약과 privacy guardrail의 기준으로 유지한다.

## 1. Purpose

- 이 문서는 `SCN-001` Before-Bridge-After 연결 초안을 위한 최소 account/auth/data linkage 스펙이다.
- 목표는 Firebase Auth Google Sign-In 구현 자체가 아니라, Phase 4 전에 필요한 최소 데이터 계약과 privacy guardrail을 고정하는 것이다.
- 현재 구현된 Before / After 상태와 아직 구현되지 않은 Bridge 상태를 구분해, 후속 구현 시 SCN-004 demo freeze를 흔들지 않도록 한다.

## 2. Scope

포함 범위:

- Firebase Auth Google Sign-In + Bearer Firebase ID token 기반 최소 로그인 capability의 account linkage 기준
- Firebase uid as `provider_subject` 기반 internal user id 기준
- Before job과 user 연결 후보
- Bridge run 최소 스펙 후보
- After artifact run과 user 연결 후보
- 개인정보 / 보안 제한

제외 범위:

- 추가 Firebase Auth / OAuth 구현 지시
- 추가 DB migration 작성
- Direct Google OAuth + backend-managed session cookie 구현
- Kakao OAuth 첫 구현
- SCN-001 document draft 구현
- SCN-004 flow 변경
- Recovery 본 구현

현재 구현 기준:

| 영역 | 현재 상태 | 이 문서의 태도 |
|---|---|---|
| Before | `/before` frontend와 `/api/v1/before` backend sub-app 구현 포함 | 사용자 연결 후보만 정의 |
| Bridge | `bridge_runs` DB model/schema는 Phase 1에서 구현 완료. protected route/service는 아직 없음 | Phase 4 protected route/service의 최소 output/data contract 후보를 정의 |
| After | `/api/v1/answer`, `/api/v1/documents/draft`, SCN-004 4-route flow 구현 | contract 변경 없이 연결 후보만 정의 |
| Recovery | 본 구현 범위 아님 | 제외 |

## 3. Auth Policy

- MVP auth path는 Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase ID token verification이다.
- 첫 구현 적용 범위는 SCN-001 Before-Bridge-After 연결 초안의 protected path다.
- SCN-004 `/after` document draft flow는 로그인 없이 계속 동작해야 한다.
- 직접 회원가입은 금지한다.
- 이메일 / 전화번호 직접 입력 수집은 금지한다.
- 전화번호 OAuth scope 요청은 금지한다.
- 이메일은 primary identifier로 사용하지 않는다.
- Firebase Auth MVP path에서 `provider_subject`는 Firebase `uid`를 의미한다.
- Google `sub`는 Direct Google OAuth Alternative/Fallback path에서의 subject이며, Firebase Auth MVP path의 `provider_subject`와 혼동하지 않는다.
- `users.auth_provider` 값은 MVP path 기준 `firebase_google`로 둔다. multi-provider / Future 확장에서는 provider 값 체계가 확장될 수 있다.
- `users.auth_provider + users.provider_subject`에서 내부 `users.id`를 resolve한다.
- business table에는 Firebase uid / Google sub / email을 직접 저장하지 않고 internal `users.id`만 참조한다.
- `before_review_jobs.user_id`, `bridge_runs.user_id`, `after_artifact_runs.user_id`는 모두 internal user_id 참조다.
- access token / refresh token 장기 저장은 금지한다.
- Firebase ID token raw value는 저장하거나 로그에 남기지 않는다.
- Firebase session cookie, Identity Platform OIDC provider, multi-provider linking은 Future/Post-MVP로 둔다.
- Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback로만 둔다.
- Kakao OAuth는 후속 provider 후보로만 둔다. 첫 구현 범위로 오해하지 않게 문서화한다.

## 4. Minimal User Model 후보

| 필드 | 타입 후보 | 필수 | 설명 |
|---|---:|---:|---|
| `id` | string / uuid | Yes | 내부 user id. 외부 provider subject를 직접 노출하지 않는 내부 식별자 |
| `auth_provider` | string | Yes | Firebase Auth MVP path에서는 `firebase_google` |
| `provider_subject` | string | Yes | Firebase Auth MVP path에서는 Firebase `uid`. Google `sub`는 Direct Google OAuth Alternative/Fallback subject |
| `display_name` | string | No | 표시용 nullable 값 |
| `email` | string | No | 표시 / 연락 후보 nullable 값. primary key 아님 |
| `created_at` | timestamp | Yes | 최초 생성 시각 |
| `last_login_at` | timestamp | Yes | 마지막 로그인 시각 |

제약 후보:

- `unique(auth_provider, provider_subject)`를 둔다.
- `email`은 표시 / 연락 후보일 뿐 primary key가 아니다.
- phone은 저장하지 않는다.
- OAuth access token / refresh token은 장기 저장하지 않는다.
- Firebase uid / Google sub / email은 business table에 직접 저장하지 않는다.
- business table은 internal `users.id`만 FK 또는 reference로 사용한다.

## 5. Before Linkage 후보

현재 구현:

- main backend가 Before sub-app을 `/api/v1/before`에 mount한다.
- 주요 endpoint:
  - `POST /api/v1/before/review`
  - `POST /api/v1/before/review/jobs`
  - `GET /api/v1/before/review/jobs/{job_id}`
  - `POST /api/v1/before/accessibility/recommendations`
  - `GET /api/v1/before/health`
- job status shape:
  - `job_id`
  - `status`
  - `created_at`
  - `updated_at`
  - `run_directory`
  - `steps`
  - `error`
  - `result`
- DB model은 `before_review_jobs(job_id, status, timestamps, run_directory, steps JSONB, error, result JSONB)`로 구현되어 있다.
- artifact는 `backend/data/before_artifacts/runs/<run_id>/` 아래에 저장된다.
  - 업로드 원본
  - `ocr_output.json`
  - `review_result.json`
  - `user_explanation.md`

연결 후보:

- `before_review_jobs.user_id` nullable column은 Phase 1에서 구현 완료됐다. 이 값은 Firebase uid나 Google sub가 아니라 internal `users.id` 참조다.
- Before review 실행 시점에 실제 user linkage를 기록하는 작업은 Phase 5 범위다.
- 기존 `job_id`는 Before job primary identifier로 유지한다.
- `result JSONB`와 artifact는 민감할 수 있으므로 account 연결 전 사용자 동의와 retention 정책이 필요하다.
- 계정 이력 화면에는 raw artifact 전문 대신 최소 summary / reference만 노출한다.
- Before에서 Bridge로 넘기는 별도 `BeforeHandoffDTO`가 필요하다.

frontend가 주로 쓰는 Before result 필드:

이 Before frontend field list는 현 frontend 코드에서 참조하는 필드 후보이며, 팀원 Before output contract 확인 전까지 확정 contract가 아닌 draft 후보로 둔다.

- `review_id`
- `reviewed_at`
- `run_directory`
- `uploaded_files`
- `contract_info`
- `overall_result`
- `overall_severity`
- `summary`
- `rule_check`
- `ocr_warnings`
- `user_explanation.headline`
- `user_explanation.plain_language_summary`
- `user_explanation.overall_assessment`
- `user_explanation.important_points`
- `user_explanation.recommended_actions`
- `user_explanation.evidence`

## 6. BeforeHandoffDTO 최소 후보

```json
{
  "before_review_job_id": "string",
  "review_id": "string",
  "scenario_id": "SCN-001",
  "summary": "string",
  "overall_result": "PASS | WARNING | VIOLATION",
  "overall_severity": "NONE | LOW | MEDIUM | HIGH | CRITICAL",
  "risk_tags": ["string"],
  "detected_issues": [
    {
      "title": "string",
      "severity": "NONE | LOW | MEDIUM | HIGH | CRITICAL",
      "law_ref": "string",
      "description": "string"
    }
  ],
  "law_refs": ["string"],
  "recommended_next_actions": ["string"],
  "evidence_items_summary": [
    {
      "title": "string",
      "summary": "string"
    }
  ],
  "artifact_refs": [
    {
      "kind": "internal_before_artifact",
      "ref": "string"
    }
  ],
  "created_at": "timestamp"
}
```

주의:

- 원본 계약서 파일 / OCR 전문은 `BeforeHandoffDTO`에 포함하지 않는다.
- `artifact_refs`는 내부 참조이며 장기 공개 URL처럼 쓰지 않는다.
- `law_refs`는 우선 label 수준으로 시작한다. 예: `근로기준법 제17조`.
- `detected_issues`는 `rule_check`, `user_explanation.important_points`, 향후 Before canonical issue field 중 확정된 source에서 생성한다.
- `evidence_items_summary`는 증거 제목과 짧은 요약까지만 허용하고 원문 발췌 전문을 기본 포함하지 않는다.

## 7. Bridge Run 최소 후보

`bridge_runs` table은 Phase 1에서 구현 완료됐다. Phase 4에서는 protected endpoint와 service가 이 table을 사용한다.

| 필드 | 필수 후보 | 설명 |
|---|---:|---|
| `id` 또는 `bridge_run_id` | Yes | Bridge run 식별자 |
| `user_id` | Yes | internal `users.id` 참조. SCN-001 protected bridge flow에서는 required. `SCN-001-BRIDGE-DEMO` presentation preset과 SCN-004 public flow는 `bridge_runs`를 만들지 않음 |
| `before_review_job_id` | Yes | Before job 연결 |
| `scenario_id` | Yes | 우선 `SCN-001` |
| `preset_id` 또는 `source_scenario` | No | `SCN-001-BRIDGE-DEMO` 같은 preset / source 구분 |
| `user_visible_summary` | Yes | 사용자에게 보여줄 안전 요약 |
| `risk_tags` | No | 위험 태그 후보 |
| `issue_categories` | No | 이슈 분류 후보 |
| `detected_issues` | No | 안전 요약된 이슈 목록 |
| `law_refs` | No | label 수준 법령 근거 |
| `recommended_next_actions` | No | 다음 행동 후보 |
| `after_query_seed` | No | raw seed persistent 저장 금지. 필요한 경우 nullable/future-only column 또는 short-lived transport로만 별도 검토 |
| `after_query_seed_hash` | Yes | 원문 seed를 저장하지 않고 중복 / 추적용 최소 식별자로 사용 |
| `artifact_refs` | No | 내부 artifact reference |
| `created_at` | Yes | 생성 시각 |
| `updated_at` | Yes | 갱신 시각 |

설명:

- Bridge는 현재 구현되어 있지 않다.
- 첫 구현은 backend route + service 기준으로 최소화한다. 독립 `/bridge` 화면 또는 frontend context adapter만으로 대체하는 방식은 후속 범위다.
- Bridge output은 After answer input seed를 만들 뿐, retrieval 결과를 대신하지 않는다.
- Bridge가 `grounded_context_ids` 또는 `retrieved_chunks`를 만들지 않는다. After answer retrieval이 새로 생성해야 한다.
- `after_query_seed`에는 Before 원문 전체가 아니라 안전 요약, risk tag, 법령 label, 사용자 질문 후보만 포함한다. raw seed는 DB에 persistent 저장하지 않는다.

## 8. Bridge -> After Linkage

- `/api/v1/answer` contract는 변경하지 않는다.
- Bridge output의 `after_query_seed`를 `/after` 초기 입력 또는 answer request `query`로 넘기는 방식을 우선한다.
- SCN-001은 우선 answer-only로 연결한다. Bridge route + service가 생성한 `after_query_seed`를 기존 After query boundary에 전달한다.
- document draft flow는 SCN-004 guard를 유지한다.
- `/api/v1/documents/draft` contract도 변경하지 않는다.
- `after_artifact_runs.user_id`와 `after_artifact_runs.source_bridge_run_id` nullable column은 Phase 1에서 구현 완료됐다. 이 값은 internal `users.id`와 `bridge_runs.bridge_run_id` 참조다.
- After artifact linkage를 실제로 기록하는 작업은 Phase 7 범위다.

현재 After artifact 기준:

| 대상 | 현재 구현 |
|---|---|
| table | `after_artifact_runs` |
| field | `run_id`, `user_id`, `source_bridge_run_id`, `stage`, `status`, `query_hash`, `document_type`, `artifact_root`, `error`, timestamps |
| answer artifact | 로컬 파일 저장 |
| draft artifact | 로컬 파일 저장 |

연결 원칙:

- `after_query_seed`가 넘어오더라도 `/api/v1/answer`는 기존처럼 `{ query, top_k, ef_search }`만 받는다.
- SCN-001 preset 또는 Bridge seed는 `top_k=10`, `ef_search=100` demo path와 호환해야 한다.
- `SCN-001-BRIDGE-DEMO`는 fixed/live 여부와 관계없이 answer-only다.
- `SCN-004-DEMO-FREEZE`와 SCN-004 free input만 document eligibility guard 통과 시 draft flow로 갈 수 있다.

## 9. Proposed Minimal Data Flow

아래 flow는 Firebase Auth MVP path의 로그인 전제 예시다. `bridge_runs.user_id`는 SCN-001 protected bridge flow에서 required이며, SCN-004 login-free flow는 기존처럼 로그인 없이 동작하고 `bridge_runs`를 만들지 않는다.

1. User logs in with Firebase Auth Google Sign-In.
2. Frontend calls SCN-001 protected endpoint with `Authorization: Bearer <Firebase ID token>`.
3. Backend verifies Firebase ID token and extracts Firebase `uid`.
4. Internal user id is resolved from `auth_provider + provider_subject`, where `provider_subject` is Firebase uid.
5. User runs Before review.
6. `before_review_jobs` row linked to internal `user_id`.
7. `BeforeHandoffDTO` generated from safe summary fields.
8. Bridge run generated and stored in `bridge_runs` with internal `user_id`.
9. Bridge `after_query_seed` passed to After answer flow.
10. After answer runs existing `/api/v1/answer`.
11. `after_artifact_runs` row optionally linked to internal `user_id` and `bridge_run_id`.

## 10. Privacy / Security Rules

- raw `user_statement`, `answer_response`, `case_intake`, `draft_response`를 Web Storage에 저장하지 않는다.
- OAuth access token / refresh token을 장기 저장하지 않는다.
- Firebase ID token raw value를 장기 저장하거나 로그에 남기지 않는다.
- Firebase uid / Google sub / provider_subject / email을 backend response나 business table에 노출하지 않는다.
- phone은 저장하지 않는다.
- email을 primary identifier로 사용하지 않는다.
- original contract file은 계정 이력에서 기본 노출하지 않는다.
- artifact URL을 사용자에게 장기 노출 가능한 식별자로 사용하지 않는다.
- 저장 / 표시 데이터는 `query_hash`, `scenario_id`, `preset_id`, `risk_tags`, `law_refs`, short summary, internal artifact reference 중심으로 최소화한다.
- server artifact retention / access-control은 별도 설계가 필요하다.
- Before artifact와 After artifact는 사용자의 민감한 사실관계를 포함할 수 있으므로 account linkage 전에 동의 시점, 삭제 정책, 접근 제어 정책을 먼저 정한다.
- 계정 이력 UI를 만들 경우 원문 파일, raw OCR, full answer/draft payload를 기본 펼침 상태로 보여주지 않는다.

## 11. SCN-004 Freeze Protection

- `/after`, `/after/result`, `/after/intake`, `/after/draft` 기존 flow는 로그인 없이 계속 동작해야 한다.
- `/api/v1/answer` contract는 변경하지 않는다.
- `/api/v1/documents/draft` contract는 변경하지 않는다.
- SCN-004 demo preset / fixed answer path는 변경하지 않는다.
- `SCN-004-DEMO-FREEZE` exact preset path는 fixed answer fixture 기준을 유지한다.
- `SCN-001-BRIDGE-DEMO`는 answer-only preset으로 유지한다.
- SCN-001 연결 작업과 SCN-004 freeze QA를 한 patch에 섞지 않는다.
- SCN-001 document draft, `/bridge` route, Recovery 본 구현은 이 스펙의 직접 구현 범위가 아니다.

## 12. Open Items / Resolved Decisions Before Phase 4

Open implementation details:

- Phase 4에서 사용할 `BeforeHandoffDTO` extraction source 확정
- 팀원 Before / Bridge output contract 최종 확인
- Before canonical field 선택: `risk_summary` / `scenario_tags` vs `user_explanation.important_points`
- `law_refs` normalization 방식
- Phase 6 전 `after_query_seed` exact handoff transport 결정: response payload direct handoff, short-lived server-side handoff id, URL param 사용 금지/허용 범위. raw seed persistent 저장은 MVP에서 금지.
- artifact retention / deletion policy
- 계정 연결 동의 시점
- `artifact_refs`가 로컬 파일, GCS object key, DB row ref 중 무엇을 가리킬지 결정

Resolved decisions from `docs/planning/18_scn001_firebase_auth_phase0_decisions.md`:

- `users.auth_provider = "firebase_google"`와 `provider_subject = Firebase uid`는 결정 완료
- Phase 1 DB schema는 구현 완료: `users`, `bridge_runs`, `before_review_jobs.user_id`, `after_artifact_runs.user_id`, `after_artifact_runs.source_bridge_run_id`
- Phase 2 backend `/api/v1/auth/me`와 Firebase ID token verification은 구현 완료
- Phase 3 frontend Firebase Auth Google Sign-In integration은 구현 완료
- `bridge_runs.user_id`는 SCN-001 protected bridge flow에서 required internal `users.id`로 결정 완료
- raw `after_query_seed` persistent 저장 금지는 결정 완료
- SCN-001 protected Bridge는 backend route + service 기준으로 구현한다. 독립 `/bridge` UI 또는 presentation context adapter는 후속 범위로 둔다.
- SCN-001 document draft는 Minimum MVP 밖 Strong MVP / optional extension으로 둔다.

## 13. Recommended Next Steps

1. Phase 4: `POST /api/v1/scn001/bridge-runs`와 `GET /api/v1/scn001/bridge-runs/{bridge_run_id}` protected endpoint 구현
2. `BeforeHandoffDTO` extraction source와 validation 확정
3. `bridge_runs` 저장은 existing schema를 사용하고 raw `after_query_seed` persistent 저장 금지 유지
4. SCN-004 login-free regression checklist 유지
5. Phase 5: Before review user linkage
