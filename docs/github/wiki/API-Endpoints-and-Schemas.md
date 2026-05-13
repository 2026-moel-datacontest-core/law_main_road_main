# API 엔드포인트와 스키마

기준일: `2026-05-13`

현재 구현 요약이며 formal OpenAPI replacement가 아닙니다.

## 공개 상태 확인

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | service status 확인 |
| `GET` | `/health` | health check |

## 공개 RAG / 문서 초안

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/retrieve` | none | law chunks retrieval |
| `POST` | `/api/v1/answer` | none | grounded answer generation |
| `POST` | `/api/v1/documents/draft` | none | SCN-004 document draft generation |

`/api/v1/answer` request:

```json
{
  "query": "string",
  "top_k": 5,
  "ef_search": 100
}
```

`/api/v1/documents/draft`가 받는 주요 입력:

- `case_intake`
- answer-derived `legal_basis`

draft service는 retrieval이나 answer generation을 직접 실행하지 않습니다. request로
전달된 legal basis만 사용합니다.

## 인증

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/auth/me` | optional Bearer Firebase ID token | backend auth status 확인 |

Protected SCN-001 calls는 다음 header를 요구합니다.

```http
Authorization: Bearer <Firebase ID token>
```

## Before 하위 앱

`/api/v1/before`에 mounted되어 있습니다.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/before/review` | none | legacy/direct review path |
| `POST` | `/api/v1/before/review/jobs` | optional | async Before review job 생성 |
| `GET` | `/api/v1/before/review/jobs/{job_id}` | none | Before review job polling |
| `POST` | `/api/v1/before/accessibility/recommendations` | none | accessibility recommendation |
| `GET` | `/api/v1/before/health` | none | Before sub-app health 확인 |

Before job 생성 시 valid Firebase bearer token이 있으면 해당 job은 signed-in
project account에 연결됩니다. auth가 없으면 anonymous로 유지되고, invalid auth는
401을 반환합니다.

`GET /api/v1/before/review/jobs/{job_id}`의 `none` auth label은 의도된 public
polling contract입니다. signed-in user-owned Before history 조회는 보호된
`/api/v1/scn001/before-review-jobs...` 경로를 사용합니다.

## SCN-001 보호 API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/scn001/before-review-jobs` | protected Before history 목록 |
| `GET` | `/api/v1/scn001/before-review-jobs/{before_review_job_id}` | protected Before history detail 조회 |
| `DELETE` | `/api/v1/scn001/before-review-jobs/{before_review_job_id}` | Before record MVP soft-delete |
| `POST` | `/api/v1/scn001/bridge-runs` | completed Before job에서 Bridge run 생성 |
| `GET` | `/api/v1/scn001/bridge-runs` | protected Bridge history 목록 |
| `GET` | `/api/v1/scn001/bridge-runs/{bridge_run_id}` | protected Bridge run 조회 |
| `DELETE` | `/api/v1/scn001/bridge-runs/{bridge_run_id}` | Bridge record MVP soft-delete |
| `POST` | `/api/v1/scn001/bridge-runs/{bridge_run_id}/answer` | protected Bridge-origin answer 생성 |

Protected Bridge answer는 `AnswerResponse`-compatible response를 반환하고,
project-local account relationship과 one primary Bridge source reference를
저장합니다.

존재하지 않거나 소유하지 않은 Bridge records는 not found로 masked됩니다.

## 계약 경계

변경하지 않은 public contracts:

- `/api/v1/answer`
- `/api/v1/documents/draft`

미구현 / 미오픈(NOT opened):

- `/api/v1/history` unified API
- protected SCN-001 draft endpoint
- hard-delete or artifact purge API

## 스키마 메모

- Public `RetrievalRequest`와 `AnswerRequest`는 `query`, `top_k`, `ef_search`를
  사용합니다. default public answer path는 `top_k=5`, `ef_search=100`입니다.
- SCN demo paths는 `top_k=10`, `ef_search=100`을 명시합니다.
- `/api/v1/answer` response에는 answer text, key points, cautions, citations,
  grounded context ids, retrieved chunks, retrieval total, model name이 포함됩니다.
- `/api/v1/documents/draft` response에는 rendered text, missing fields, cautions,
  evidence checklist, citations, source context ids가 포함됩니다.
- 공개 docs는 schemas를 요약합니다. application code나 OpenAPI output을
  대체하지 않습니다.

## 함께 보기

- [[RAG와 법령 코퍼스|RAG-and-Law-Corpus]]
- [[데이터 모델과 개인정보 경계|Data-Model-and-Privacy]]
