# API Reference

기준일: `2026-05-04`

This is a current implementation summary, not a formal OpenAPI replacement.

## Public Health

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | service status |
| `GET` | `/health` | health check |

## Public RAG / Draft

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/retrieve` | none | retrieve law chunks |
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

`/api/v1/documents/draft` receives:

- `case_intake`
- answer-derived `legal_basis`

The draft service does not run retrieval or answer generation itself. It uses
only legal basis passed in the request.

## Auth

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/auth/me` | optional Bearer Firebase ID token | backend auth status |

Protected SCN-001 calls require:

```http
Authorization: Bearer <Firebase ID token>
```

## Before Sub-app

Mounted at `/api/v1/before`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/before/review` | optional | legacy/direct review path |
| `POST` | `/api/v1/before/review/jobs` | optional | create async Before review job |
| `GET` | `/api/v1/before/review/jobs/{job_id}` | none | poll Before review job |
| `POST` | `/api/v1/before/accessibility/recommendations` | none | accessibility recommendation |
| `GET` | `/api/v1/before/health` | none | Before sub-app health |

If a valid Firebase bearer token is present when a Before job is created, the job
is linked to the internal user id. Missing token keeps it anonymous. Invalid
token returns 401.

## SCN-001 Protected APIs

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/v1/scn001/before-review-jobs` | list protected Before history |
| `GET` | `/api/v1/scn001/before-review-jobs/{before_review_job_id}` | read protected Before history detail |
| `DELETE` | `/api/v1/scn001/before-review-jobs/{before_review_job_id}` | MVP soft-delete Before record |
| `POST` | `/api/v1/scn001/bridge-runs` | create Bridge run from completed Before job |
| `GET` | `/api/v1/scn001/bridge-runs` | list protected Bridge history |
| `GET` | `/api/v1/scn001/bridge-runs/{bridge_run_id}` | read protected Bridge run |
| `DELETE` | `/api/v1/scn001/bridge-runs/{bridge_run_id}` | MVP soft-delete Bridge record |
| `POST` | `/api/v1/scn001/bridge-runs/{bridge_run_id}/answer` | generate protected Bridge-origin answer |

Protected Bridge answer returns an `AnswerResponse`-compatible response and
persists artifact linkage with:

- internal `user_id`
- single primary `source_bridge_run_id`

Missing or unowned Bridge records are masked as not found.

## Contract Boundaries

Unchanged public contracts:

- `/api/v1/answer`
- `/api/v1/documents/draft`

Not implemented:

- `/api/v1/history` unified API
- protected SCN-001 draft endpoint
- hard-delete or artifact purge API
