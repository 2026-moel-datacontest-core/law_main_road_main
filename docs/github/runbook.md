# Runbook

## Local Requirements

- WSL Ubuntu or compatible Linux shell
- conda
- Python and pip
- Node.js and npm
- PostgreSQL with pgvector
- GCP / Vertex credentials for live model calls
- Firebase project config for SCN-001 protected auth flow

## Setup

```bash
git submodule update --init --recursive
conda activate law_main_road
pip install -r backend/requirements.txt
cd frontend
npm install
```

Environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Do not commit real env files, service account JSON, Firebase ID tokens, provider
subjects, or raw email values.

## Database

Check PostgreSQL:

```bash
python backend/verify/ensure_postgres_ready.py
```

Apply migrations:

```bash
cd backend
alembic upgrade head
cd ..
```

Current migration line includes SCN-001 user/Bridge linkage and MVP history
visibility fields.

## Run Servers

Backend:

```bash
conda activate law_main_road
uvicorn backend.main:app --reload
```

Frontend:

```bash
cd frontend
npm run dev
```

Default URLs:

- backend: `http://localhost:8000`
- frontend: `http://localhost:5090`

## Focused Verification

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend
npm run build
```

## Demo Preflight

```bash
bash scripts/demo_preflight.sh
```

This script checks the submission-oriented path. It does not replace manual
browser rehearsal for auth-required flows.

## When to Run Full Eval

Run broad retrieval/answer eval only when one of these changes:

- retrieval service
- answer generation service
- embedding behavior
- DB corpus contents
- API response contract

For doc-only changes, focused checks are enough.

## Demo Rehearsal Notes

SCN-004 public demo:

1. Open `http://localhost:5090/after`.
2. Select `SCN-004-DEMO-FREEZE`.
3. Submit unchanged preset.
4. Verify `/after/result`.
5. Generate each supported draft type.
6. Verify copy and print.
7. Confirm the entry disclaimer is visible.

SCN-001 protected path:

1. Sign in with Google.
2. Wait for backend `/api/v1/auth/me` verification.
3. Use `/before` to create a completed review.
4. Create Bridge handoff.
5. Use `/after` checked Bridge submit.
6. Verify answer-only result.
7. Check `/history` and soft-delete behavior if needed.

Record only PASS/PRESENT/ABSENT/NO-level evidence. Do not record raw tokens,
provider ids, raw query bodies, full answers, artifact bodies, or real Bridge
ids.

For docs-only sync work, do not run build/server/browser smoke by default. Use
`git diff --check` and targeted text checks unless code or behavior changed.
