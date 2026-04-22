# SCN-001 Account/Auth Minimal Data Spec

기준일: `2026-04-22`

이 문서는 구현 지시서가 아니라 SCN-001 Before-Bridge-After 연결 초안을 위한 최소 데이터 계약 후보를 고정하는 planning 문서다. OAuth, DB migration, schema 구현, frontend route 확장은 이 문서 범위에 포함하지 않는다.

## 1. Purpose

- 이 문서는 `SCN-001` Before-Bridge-After 연결 초안을 위한 최소 account/auth/data linkage 스펙이다.
- 목표는 Google OAuth 구현 자체가 아니라, 구현 전에 필요한 최소 데이터 계약과 privacy guardrail을 고정하는 것이다.
- 현재 구현된 Before / After 상태와 아직 구현되지 않은 Bridge 상태를 구분해, 후속 구현 시 SCN-004 demo freeze를 흔들지 않도록 한다.

## 2. Scope

포함 범위:

- Google OAuth 기반 최소 로그인 capability의 account linkage 기준
- `provider_subject` 기반 internal user id 후보
- Before job과 user 연결 후보
- Bridge run 최소 스펙 후보
- After artifact run과 user 연결 후보
- 개인정보 / 보안 제한

제외 범위:

- OAuth 실제 구현
- DB migration 작성
- Kakao OAuth 첫 구현
- SCN-001 document draft 구현
- SCN-004 flow 변경
- Recovery 본 구현

현재 구현 기준:

| 영역 | 현재 상태 | 이 문서의 태도 |
|---|---|---|
| Before | `/before` frontend와 `/api/v1/before` backend sub-app 구현 포함 | 사용자 연결 후보만 정의 |
| Bridge | 독립 `/bridge` route, backend route/schema/model 없음 | 최소 output/data contract 후보만 정의 |
| After | `/api/v1/answer`, `/api/v1/documents/draft`, SCN-004 4-route flow 구현 | contract 변경 없이 연결 후보만 정의 |
| Recovery | 본 구현 범위 아님 | 제외 |

## 3. Auth Policy

- Google OAuth는 프로젝트 공통 최소 auth capability로 허용한다.
- 첫 구현 적용 범위는 SCN-001 Before-Bridge-After 연결 초안이다.
- 직접 회원가입은 금지한다.
- 이메일 / 전화번호 직접 입력 수집은 금지한다.
- 전화번호 OAuth scope 요청은 금지한다.
- 이메일은 primary identifier로 사용하지 않는다.
- OAuth provider의 stable subject id를 user 연결 key로 사용한다.
- `provider_subject`에서 내부 `user.id`를 resolve한다.
- access token / refresh token 장기 저장은 금지한다.
- Kakao OAuth는 후속 provider 후보로만 둔다. 첫 구현 범위로 오해하지 않게 문서화한다.

## 4. Minimal User Model 후보

| 필드 | 타입 후보 | 필수 | 설명 |
|---|---:|---:|---|
| `id` | string / uuid | Yes | 내부 user id. 외부 provider subject를 직접 노출하지 않는 내부 식별자 |
| `auth_provider` | string | Yes | 첫 provider는 `google` |
| `provider_subject` | string | Yes | Google `sub` 같은 OAuth provider stable subject id |
| `display_name` | string | No | 표시용 nullable 값 |
| `email` | string | No | 표시 / 연락 후보 nullable 값. primary key 아님 |
| `created_at` | timestamp | Yes | 최초 생성 시각 |
| `last_login_at` | timestamp | Yes | 마지막 로그인 시각 |

제약 후보:

- `unique(auth_provider, provider_subject)`를 둔다.
- `email`은 표시 / 연락 후보일 뿐 primary key가 아니다.
- phone은 저장하지 않는다.
- OAuth access token / refresh token은 장기 저장하지 않는다.

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

- `before_review_jobs`에 nullable `user_id` 추가를 검토한다.
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

신규 table 후보: `bridge_runs`

| 필드 | 필수 후보 | 설명 |
|---|---:|---|
| `id` 또는 `bridge_run_id` | Yes | Bridge run 식별자 |
| `user_id` | TBD | 로그인 필수 flow인지, 비로그인 demo-compatible flow인지 결정 필요 |
| `before_review_job_id` | Yes | Before job 연결 |
| `scenario_id` | Yes | 우선 `SCN-001` |
| `preset_id` 또는 `source_scenario` | No | `SCN-001-BRIDGE-DEMO` 같은 preset / source 구분 |
| `user_visible_summary` | Yes | 사용자에게 보여줄 안전 요약 |
| `risk_tags` | No | 위험 태그 후보 |
| `issue_categories` | No | 이슈 분류 후보 |
| `detected_issues` | No | 안전 요약된 이슈 목록 |
| `law_refs` | No | label 수준 법령 근거 |
| `recommended_next_actions` | No | 다음 행동 후보 |
| `after_query_seed` | TBD | After answer input으로 넘길 query seed 후보. 원문 seed 저장 여부는 개인정보 / retention 정책 확정 전까지 미결정. 가능하면 short-lived handoff 또는 hash-only를 우선 검토 |
| `after_query_seed_hash` | 권장 | 원문 seed를 저장하지 않는 경우에도 중복 / 추적용 최소 식별자로 사용 가능 |
| `artifact_refs` | No | 내부 artifact reference |
| `created_at` | Yes | 생성 시각 |
| `updated_at` | Yes | 갱신 시각 |

설명:

- Bridge는 현재 구현되어 있지 않다.
- 첫 구현은 별도 `/bridge` 화면보다 backend service 또는 frontend context adapter로 최소화할 수 있다.
- Bridge output은 After answer input seed를 만들 뿐, retrieval 결과를 대신하지 않는다.
- Bridge가 `grounded_context_ids` 또는 `retrieved_chunks`를 만들지 않는다. After answer retrieval이 새로 생성해야 한다.
- `after_query_seed`에는 Before 원문 전체가 아니라 안전 요약, risk tag, 법령 label, 사용자 질문 후보만 포함한다.

## 8. Bridge -> After Linkage

- `/api/v1/answer` contract는 변경하지 않는다.
- Bridge output의 `after_query_seed`를 `/after` 초기 입력 또는 answer request `query`로 넘기는 방식을 우선한다.
- SCN-001은 우선 answer-only/context adapter 방식으로 연결한다.
- document draft flow는 SCN-004 guard를 유지한다.
- `/api/v1/documents/draft` contract도 변경하지 않는다.
- `after_artifact_runs`에는 nullable `user_id` 추가 후보를 둔다.
- `after_artifact_runs`에는 `bridge_run_id` 또는 `source_bridge_run_id` 연결 후보를 둔다.

현재 After artifact 기준:

| 대상 | 현재 구현 |
|---|---|
| table | `after_artifact_runs` |
| field | `run_id`, `stage`, `status`, `query_hash`, `document_type`, `artifact_root`, `error`, timestamps |
| answer artifact | 로컬 파일 저장 |
| draft artifact | 로컬 파일 저장 |

연결 원칙:

- `after_query_seed`가 넘어오더라도 `/api/v1/answer`는 기존처럼 `{ query, top_k, ef_search }`만 받는다.
- SCN-001 preset 또는 Bridge seed는 `top_k=10`, `ef_search=100` demo path와 호환해야 한다.
- `SCN-001-BRIDGE-DEMO`는 fixed/live 여부와 관계없이 answer-only다.
- `SCN-004-DEMO-FREEZE`와 SCN-004 free input만 document eligibility guard 통과 시 draft flow로 갈 수 있다.

## 9. Proposed Minimal Data Flow

아래 flow는 로그인 전제 경로의 예시이며, `bridge_runs.user_id` required 여부가 확정되기 전까지 최종 구현 flow가 아니다. SCN-004 login-free flow는 기존처럼 로그인 없이 동작해야 하며, 이 예시와 혼동하지 않는다.

1. User logs in with Google OAuth.
2. Internal user id resolved from `provider_subject`.
3. User runs Before review.
4. `before_review_jobs` row linked to `user_id`.
5. `BeforeHandoffDTO` generated from safe summary fields.
6. Bridge run generated and stored in `bridge_runs`.
7. Bridge `after_query_seed` passed to After answer flow.
8. After answer runs existing `/api/v1/answer`.
9. `after_artifact_runs` row optionally linked to `user_id` and `bridge_run_id`.

## 10. Privacy / Security Rules

- raw `user_statement`, `answer_response`, `case_intake`, `draft_response`를 Web Storage에 저장하지 않는다.
- OAuth access token / refresh token을 장기 저장하지 않는다.
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

## 12. Gaps / Decisions Before Implementation

- 팀원 Before / Bridge output contract 확인
- Before canonical field 선택: `risk_summary` / `scenario_tags` vs `user_explanation.important_points`
- `law_refs` normalization 방식
- Bridge가 backend route인지 service / context adapter인지 결정
- `bridge_runs.user_id` required 여부
- `bridge_runs.after_query_seed`를 원문 저장할지, short-lived handoff로만 쓸지, hash-only로 둘지 결정 필요
- artifact retention / deletion policy
- 계정 연결 동의 시점
- SCN-001 document draft가 후속 범위인지 확인
- `before_review_jobs.user_id`, `bridge_runs.user_id`, `after_artifact_runs.user_id`의 FK / nullable / indexing 정책
- `artifact_refs`가 로컬 파일, GCS object key, DB row ref 중 무엇을 가리킬지 결정

## 13. Recommended Next Steps

1. 팀원 Before / Bridge output contract 확인
2. `BeforeHandoffDTO` 필드 확정
3. `bridge_runs` 최소 schema 확정
4. Google OAuth session strategy 설계
5. `provider_subject` 기반 user model 설계
6. `before_review_jobs` / `bridge_runs` / `after_artifact_runs` linkage migration 설계
7. SCN-004 login-free regression checklist 작성
8. 구현 착수
