# Architecture

기준일: `2026-04-29`

이 문서는 현재 코드 기준의 아키텍처 요약이다. 세부 phase 기록은
`docs/planning/19_scn001_auth_integration_status.md`,
`docs/planning/22_post_phase8_scn001_extension_roadmap.md`, 최신 checkpoint는
`docs/planning/23_code_based_status_2026_04_29.md`를 참조한다.

## Current MVP Architecture

- data source: `data/legalize-kr/` git submodule
- processed law corpus: `backend/data/law_chunks/all_chunks.json`
- current corpus: `1722` chunks, `selected_as_of = 2026-04-11`
- backend: FastAPI
- before sub-app: mounted at `/api/v1/before`
- database: PostgreSQL + pgvector
- frontend: Next.js App Router
- auth: Firebase Auth Google Sign-In + Bearer Firebase ID token + backend
  Firebase Admin verification
- answer model default: `gemini-2.5-flash`
- embedding model default: `gemini-embedding-001`, `768` dimensions

## Backend Components

Core routers:

- `POST /api/v1/retrieve`
- `GET /api/v1/auth/me`
- `POST /api/v1/answer`
- `POST /api/v1/documents/draft`
- `GET/POST/DELETE /api/v1/scn001/*`

Mounted Before sub-app:

- `POST /api/v1/before/review`
- `POST /api/v1/before/review/jobs`
- `GET /api/v1/before/review/jobs/{job_id}`
- `POST /api/v1/before/accessibility/recommendations`
- `GET /api/v1/before/health`

Database-backed capabilities:

- `law_chunks` retrieval + HNSW vector index
- `before_review_jobs`
- `after_artifact_runs`
- `users`
- `bridge_runs`
- SCN-001 MVP soft-delete visibility fields on Before/Bridge history records

## Frontend Components

Implemented routes:

- `/`
- `/before`
- `/after`
- `/after/result`
- `/after/intake`
- `/after/draft`
- `/history`

State and privacy model:

- React Context + reducer memory state only for After/Bridge/draft flow state.
- Firebase Auth uses `inMemoryPersistence`.
- Protected SCN-001 gates use backend-verified `backendUser.logged_in`.
- Raw flow payloads, auth state, tokens, raw Bridge payloads, and raw
  `after_query_seed` are not stored in Web Storage.

Visual/UI state as of latest main `85d10fa`:

- `DESIGN.md` is the frontend visual guide: token-first,
  neutral/dense/evidence-led, with disclaimers and uncertainty prominent.
- Before is upload-first on the first screen, removes local server/demo copy,
  preserves examples, scrolls to analysis progress, shows OCR 1~2분 guidance,
  cleans result/accessibility sections, and no longer hardcodes default
  accessibility legal basis.
- After entry is centered, includes guidance cards, keeps preset ids/queries
  stable while improving display labels, restores the entry disclaimer, and uses
  primary-blue unselected / success-green selected saved-history accents.
- History is centered with readable folded incident cards and a blue left accent.
- Main page H1/lead/nav typography is cleaned up and includes a compact flow
  strip.

## Implemented Flows

### Public SCN-004 After Draft Flow

```text
/after
  -> fixed preset fixture or public /api/v1/answer
  -> /after/result
  -> /after/intake
  -> public /api/v1/documents/draft
  -> /after/draft
```

Guardrails:

- exact `SCN-004-DEMO-FREEZE` uses a frontend fixed answer fixture.
- draft flow requires cited articles and grounded context ids.
- document draft uses only request-provided legal basis.
- SCN-004 remains login-free.

### Protected SCN-001 Bridge Answer Flow

```text
/before
  -> /api/v1/before/review/jobs
  -> protected /api/v1/scn001/bridge-runs
  -> /after memory handoff
  -> protected /api/v1/scn001/bridge-runs/{bridge_run_id}/answer
  -> /after/result answer-only
```

Guardrails:

- checked Bridge handoff calls the protected Bridge answer endpoint.
- all-unchecked Bridge handoff falls back to public `/api/v1/answer`, but keeps
  `answer_origin = "bridge_handoff"` and draft disabled.
- Bridge context is continuity/reference only, not legal grounding.
- raw `after_query_seed` is never used in answer query.

### SCN-001 History / Frozen Draft Flow

- `/history` is the protected SCN-001 record archive.
- `/after` includes a collapsible saved history selector for backend-verified
  logged-in users.
- Before/Bridge records support MVP soft-delete.
- exact `SCN-001-BRIDGE-DEMO` preset provides a frontend-local deterministic
  `workplace_change_reason_summary` draft flow.
- live/backend SCN-001 draft generation and protected SCN-001 draft endpoint are
  not implemented.

## Not Opened

- public API contract changes for `/api/v1/answer` or `/api/v1/documents/draft`
- independent `/bridge` route
- Recovery implementation
- SCN-005 frontend/document draft expansion
- `/api/v1/history` unified backend API
- Step 3 full retention lifecycle
- hard delete, artifact physical deletion, GCS lifecycle, account deletion
- auth persistence changes
- broad RAG/reranker/decomposition changes outside the frozen demo path

## Verification

Focused checks:

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend
npm run build
```

Demo bundle:

```bash
bash scripts/demo_preflight.sh
```
