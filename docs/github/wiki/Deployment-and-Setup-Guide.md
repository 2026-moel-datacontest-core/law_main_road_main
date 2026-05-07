# 배포와 실행 가이드

이 문서는 공개 가능한 실행 가이드입니다. 비밀값, 실제 cloud resource id,
infrastructure state file, cloud IAM key file은 포함하지 않습니다.

## Local Requirements / 로컬 요구사항

- WSL Ubuntu
- conda
- Python environment: `law_main_road`
- frontend용 Node.js
- PostgreSQL + pgvector
- local `.env` files

## Backend 실행

```bash
conda activate law_main_road
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

기본 backend URL:

```text
http://localhost:8000
```

## Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

기본 frontend URL:

```text
http://localhost:5090
```

`NEXT_PUBLIC_API_BASE_URL` defaults to:

```text
http://localhost:8000
```

## Environment Files / 환경 파일

local-only env files를 사용합니다. credentials는 commit하지 않습니다.

- `backend/.env.example`
- `frontend/.env.example`

## Cloud Posture / 클라우드 운영 자세

Cloud migration은 dev-first입니다.

- first Terraform apply target: `dev`
- `demo/contest`는 time-bounded presentation posture입니다.
- `prod`는 separate production-opening review 없이는 미오픈(NOT opened)입니다.

See [[클라우드 전환과 공개 미러 정책|Cloud-Migration-and-Public-Mirror-Policy]].

## Quick Verification / 빠른 확인

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend
npm run build
```

## Demo Preflight / 데모 사전 점검

```bash
bash scripts/demo_preflight.sh
```

broad retrieval/answer eval은 retrieval, answer generation, embedding behavior,
DB contents, API response contracts가 바뀐 경우에만 실행합니다.

## Public Setup Boundary / 공개 setup 경계

이 가이드는 로컬 실행과 공개 가능한 smoke command만 설명합니다. 실제 cloud
inventory, credential provisioning, private rollback 절차, 비용 계정 세부값은
공개 Wiki에 싣지 않습니다.

## 함께 보기

- [[클라우드 전환과 공개 미러 정책|Cloud-Migration-and-Public-Mirror-Policy]]
- [[트러블슈팅 런북|Runbook-Troubleshooting]]
- [[E2E 데모 검증|E2E-Demo-Verification]]
