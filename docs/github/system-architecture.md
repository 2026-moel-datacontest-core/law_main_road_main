# System Architecture

기준일: `2026-04-29`

## Stack

| Layer | Choice |
|---|---|
| Backend | FastAPI |
| Database | PostgreSQL + pgvector |
| Auth | Firebase Auth Google Sign-In + Firebase Admin SDK verification |
| LLM | Vertex AI Gemini |
| Embedding | `gemini-embedding-001`, 768 dimensions |
| Frontend | Next.js App Router, React, TypeScript |
| Local environment | WSL Ubuntu + conda |

Latest main checkpoint: `85d10fa`

## High-level Flow

```text
Legal source submodule
  -> preprocessing / chunking scripts
  -> backend/data/law_chunks/all_chunks.json
  -> PostgreSQL law_chunks + pgvector embeddings
  -> retrieval
  -> grounded answer
  -> optional document draft
  -> Next.js frontend
```

## Backend

Entry point:

- `backend/main.py`

The parent FastAPI app includes the main API router and mounts the Before
sub-application at `/api/v1/before`.

Core routers:

- `backend/app/routers/retrieval.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/answer.py`
- `backend/app/routers/document_draft.py`
- `backend/app/routers/scn001.py`

Important services:

- `backend/app/services/retrieval.py`
- `backend/app/services/answer_generation.py`
- `backend/app/services/document_draft.py`
- `backend/app/services/auth_service.py`
- `backend/app/services/scn001_bridge_service.py`
- `backend/app/services/scn001_history_service.py`
- `backend/app/services/scn001_deletion_service.py`

## Database Model

Current tables include:

- `law_chunks`
- `before_review_jobs`
- `after_artifact_runs`
- `users`
- `bridge_runs`

SCN-001 history uses user visibility fields for MVP soft-delete. This hides
records from the user-facing list without opening hard delete or file purge.

## Frontend

Implemented routes:

- `frontend/src/app/page.tsx`
- `frontend/src/app/before/page.tsx`
- `frontend/src/app/after/page.tsx`
- `frontend/src/app/after/result/page.tsx`
- `frontend/src/app/after/intake/page.tsx`
- `frontend/src/app/after/draft/page.tsx`
- `frontend/src/app/history/page.tsx`

Important client modules:

- `frontend/src/context/AuthContext.tsx`
- `frontend/src/context/FlowContext.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/bridge-api.ts`
- `frontend/src/lib/scn001-history-api.ts`
- `frontend/src/lib/scenarioPresets.ts`
- `frontend/src/lib/scenarioPresetDrafts.ts`

Current visual baseline:

- `DESIGN.md` is the visual guide.
- Components use the local `--kl-*` token surface.
- Current polish through `85d10fa` is frontend-only and does not alter backend
  schema, auth persistence, Web Storage policy, or public API contracts.
- `DESIGN.md`

Visual/UI state:

- Before is upload-focused on the first screen.
- After entry keeps guidance/disclaimer visible and has cleaned preset labels.
- History uses centered folded incident cards.
- Accessibility recommendation UI no longer uses hardcoded default legal basis.

## Auth Boundary

SCN-001 protected paths use:

```text
Firebase Web SDK
  -> Firebase ID token
  -> Authorization: Bearer <id token>
  -> backend Firebase Admin verification
  -> internal users.id
```

Frontend gates use backend-verified `backendUser.logged_in`. Firebase signed-in
state alone is not treated as enough for protected SCN-001 actions.

## Privacy Boundary

The app avoids storing sensitive raw payloads in Web Storage:

- raw user statement
- full answer payload
- full draft payload
- case intake
- raw Bridge payload
- raw `after_query_seed`
- auth tokens or provider ids

SCN-001 Bridge context is displayed and used as a safe summary only. It does not
create or modify legal citations, grounded context ids, or retrieved chunks.
