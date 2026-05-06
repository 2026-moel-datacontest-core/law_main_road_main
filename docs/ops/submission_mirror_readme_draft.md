# Repo 2 Submission Mirror README Draft

기준일: `2026-05-06`

이 문서는 `Team-msp-architect-2026/msp-team02` public mirror repo의 README 초안이다.
그대로 복사하기 전에 demo URL, screenshot, contest notice, license 문구를 최종
확인한다.

---

# Law Main Road

Law Main Road is a Korean labor-law assistance demo for document review,
case-context handoff, and evidence-led answer/draft flows.

이 저장소는 공모전 제출과 포트폴리오 공개를 위한 curated public mirror입니다.
개발 이력과 배포 기준 저장소는 별도의 private source repository에서 관리합니다.
심사 또는 검토 과정에서 commit history 확인이 필요한 경우 reviewer access를 별도로
부여할 수 있습니다.

## Demo

```text
Public demo URL: <approved frontend URL or custom domain>
Target profile: demo/contest
Production claim: no
```

이 demo는 공모전/발표용 public demo posture입니다. 실제 장기 운영 production
서비스라고 주장하지 않습니다.

## Key Features

- Korean labor-law scenario answer flow
- Before document review and Bridge handoff flow
- After answer and document draft flow
- Firebase Google Sign-In for protected SCN-001 paths
- Evidence-led UI with scenario-specific guardrails
- SCN-004 fixed demo path and SCN-001 fixed frozen draft path

## Architecture Summary

```text
Frontend: Next.js
Backend: FastAPI
Auth: Firebase Auth Google Sign-In
Database: PostgreSQL + pgvector
AI path: Vertex AI Gemini
Target cloud: Google Cloud Run + Cloud SQL + Secret Manager + Artifact Registry
```

Cloud migration is designed around a dev-first posture:

- first Terraform target: `dev`
- contest/demo: time-bounded public presentation posture
- production: separate prod-opening review required
- source/deploy repo: private
- public mirror repo: README/final snapshot only

## How To Run Locally

Backend:

```bash
conda activate law_main_road
uvicorn backend.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Required local environment files are intentionally not included in this public
mirror. Use local-only `.env` files and do not commit credentials.

## Repository Policy

This repository is a curated public submission mirror.

```text
source/deploy repository: private, reviewer access required
public mirror repository: Team-msp-architect-2026/msp-team02
deploy permission from mirror: no
GCP service account key JSON in mirror: forbidden
```

The public mirror must not contain deploy credentials, Terraform state, private
runbooks, raw user/case data, or internal cloud inventory.

## Security / Privacy Notes

Do not commit:

- `.env*`
- `backend/.env`
- `frontend/.env.local`
- `config/secrets/*`
- Firebase Admin JSON
- GCP service account key JSON
- Terraform state files
- Secret Manager values
- credential-bearing database URLs
- raw user/case facts
- Firebase uid, provider subject, or internal user identifiers
- Firebase ID tokens, Google access tokens, refresh tokens, or session tokens
- full answer/draft payloads or raw Bridge payloads

Public screenshots and docs should avoid exposing exact Cloud SQL connection
names, service account emails, private bucket names, WIF provider names, direct
backend service URLs, or private runbook content.

## Contest Notice

This repository is prepared for contest review and public demonstration. Some
operational hardening items, including full production readiness, are intentionally
tracked as future work.

## Development History

Development history is maintained in the private source/deploy repository.
Reviewer access can be granted if commit-level review is required.

```text
source/deploy repository: 2026-moel-datacontest-core/law_main_road_main
visibility: private
```

## License

TBD before final public submission.
