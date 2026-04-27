# Ops README

## 목적

이 문서는 `docs/ops` 디렉터리의 진입 문서다.

현재 운영 문서가 무엇인지, 지금 프로젝트가 어디까지 정리되었는지, 다음으로 무엇을 해야 하는지를 한 번에 확인하기 위한 용도로 사용한다.

## 현재 진행 상태

기준일: `2026-04-24`

현재 `ops` 문서 기준으로 정리된 상태는 아래와 같다.

- 로컬 실행 시작 문서 정리 완료
- 로컬 시작 자동화 스크립트 `scripts/starting.sh` 추가 완료
- 스타팅 후 자체 테스트 문서 정리 완료
- 데이터 파이프라인 문서 정리 완료
- 디렉터리/파일 역할 문서 정리 완료
- Cloud Run 데이터 저장 구조 문서 유지 중
- troubleshooting 문서 유지 중
- Firebase Auth Phase 2/3 로컬 설정 절차 정리 완료
- SCN-001 Firebase Auth Phase 0~5, Phase 6A~6F, Phase 7A~7E, Phase 8 regression/demo checks 완료 상태 반영
- Post-Phase 8 Step 1 logout memory reset, Step 1.5 Before login-required UX, OCR 429 friendly message, Step 2A read-only history backend endpoints, Step 2B-1 frontend history API client/types, Step 2B-2 `/before` read-only history UI, Step 1.6 main page Before entry login gate 반영
- local secret/database ignore rules hardening 반영

현재 코드/구조 기준으로 반영된 주요 상태:

- `before` law source: DB 기준으로 전환 완료
- `before` startup cache preload: parent app startup 기준 반영 완료
- `before` job 상태: DB 저장 전환 완료
- `after` artifact 로컬 저장 구조: 반영 완료
- frontend 실제 dev/start 포트: `5090`
- `users`, `bridge_runs`, `before_review_jobs.user_id`, `after_artifact_runs.user_id`, `after_artifact_runs.source_bridge_run_id`: Phase 1 schema 반영 완료
- `/api/v1/auth/me`: Phase 2 backend Firebase ID token verification 반영 완료
- frontend Firebase Auth Google Sign-In, `AuthContext`, Login UI, backend verification UI: Phase 3 반영 완료
- Firebase Auth persistence: MVP default는 `inMemoryPersistence`; `browserSessionPersistence`는 Future/Post-MVP tradeoff 후보
- `POST /api/v1/scn001/bridge-runs`, `GET /api/v1/scn001/bridge-runs/{bridge_run_id}`: Phase 4 반영 완료
- Before review job optional auth linkage: Phase 5 반영 완료
- Bridge -> After answer-only handoff: Phase 6A~6F 반영 완료
- `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`: protected Bridge answer 반영 완료
- `GET /api/v1/scn001/before-review-jobs`, `GET /api/v1/scn001/before-review-jobs/{before_review_job_id}`, `GET /api/v1/scn001/bridge-runs`: read-only history 반영 완료
- frontend protected Bridge answer helper, `/after` checked Bridge submit routing, `/before` read-only history UI, main Before entry login gate 반영 완료
- Phase 7E live browser/network/DB smoke PASS, Phase 8 regression / demo preflight / SCN-004 manual rehearsal PASS
- `/api/v1/answer` public contract unchanged
- `/api/v1/documents/draft` contract unchanged
- Vertex IAM/credential issue는 runtime resolved. Residual runtime risk는 transient `provider_timeout`

## Firebase Auth Phase 2/3 로컬 설정 및 확인

이 절차는 Firebase Auth Google login과 backend `/api/v1/auth/me` verification을 로컬에서 확인하기 위한 운영 메모다. Backend Firebase Admin SDK credential과 frontend Firebase Web App public config는 위치와 성격이 다르므로 섞지 않는다. Secret, token, `provider_subject`, email 전문은 문서/채팅/log/git에 남기지 않는다.

### 1. Backend Firebase Admin SDK credential

권장 local credential path:

```text
config/secrets/firebase-admin.json
```

- 이 JSON은 Firebase Admin SDK service account credential이므로 secret이다.
- 절대 commit하지 않는다.
- root `.gitignore`의 `config/secrets/` 또는 credential JSON ignore rule에 의해 ignored되어야 한다.
- ignore 확인:

```bash
git check-ignore --no-index config/secrets/firebase-admin.json
```

Backend 실행 shell에서는 Firebase project와 Admin credential path를 명시한다.

```bash
FIREBASE_PROJECT_ID=<firebase-project-id>
GOOGLE_APPLICATION_CREDENTIALS=$PWD/config/secrets/firebase-admin.json
```

주의:

- `FIREBASE_ADMIN_CREDENTIALS`는 local fallback이다.
- 현재 backend 구현은 ADC / `GOOGLE_APPLICATION_CREDENTIALS`를 우선 사용할 수 있으므로, smoke shell에서는 `GOOGLE_APPLICATION_CREDENTIALS=$PWD/config/secrets/firebase-admin.json`로 Firebase Admin JSON을 명확히 지정한다.
- `GOOGLE_APPLICATION_CREDENTIALS`가 Vertex AI용 credential을 가리키고 있으면 Firebase Admin SDK도 그 ADC를 먼저 사용할 수 있다.
- Phase 6F 이후 Vertex IAM/credential issue는 runtime resolved 상태로 기록한다. 이후 answer smoke에서 남은 주된 runtime risk는 transient `provider_timeout`이며, retry/backoff hardening은 별도 runtime 작업이다.

### 2. Frontend Firebase Web App public config

Frontend local env path:

```text
frontend/.env.local
```

- 이 파일은 local env 파일이므로 commit하지 않는다.
- `NEXT_PUBLIC_*` 값은 Next.js browser bundle에 포함되는 Firebase Web App public config다.
- Public config라도 repo에는 실제 값을 commit하지 않는다.
- ignore 확인:

```bash
git check-ignore --no-index frontend/.env.local
```

Required keys:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=<firebase-web-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<firebase-auth-domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<firebase-project-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<firebase-web-app-id>
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Optional keys:

```bash
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<firebase-messaging-sender-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<firebase-storage-bucket>
```

Frontend public env를 바꾼 뒤에는 Next dev server를 재시작해야 한다.

### 3. Local secret / env inventory

새 clone이나 임시 작업 디렉터리에서 live smoke를 재현하려면 아래 파일만 맞춘다.
Secret 파일과 public frontend env는 성격이 다르므로 섞지 않는다.

| Path | Required for | Secret | Notes |
|---|---|---:|---|
| `backend/.env` | backend DB, Vertex, Firebase Admin 설정 | Yes | local env 파일. commit 금지 |
| `frontend/.env.local` | Firebase Web SDK, frontend API base URL | No, but local-only | `NEXT_PUBLIC_*` 값은 browser bundle에 포함됨. repo commit 금지 |
| `config/secrets/firebase-admin.json` 또는 `GOOGLE_APPLICATION_CREDENTIALS` 대상 JSON | Firebase Admin token verification, Vertex runtime credential | Yes | `backend/.env`가 가리키는 실제 파일이 clone에도 있어야 함 |

`backend/.env`에서 현재 local smoke에 필요한 대표 key:

```bash
DATABASE_URL
FIREBASE_PROJECT_ID
GCP_PROJECT
GCP_LOCATION
GOOGLE_APPLICATION_CREDENTIALS
VERTEX_ANSWER_MODEL
```

`VERTEX_ANSWER_MODEL`은 없으면 backend 기본값 `gemini-2.5-flash`를 사용한다.
`GOOGLE_APPLICATION_CREDENTIALS`가 Firebase Admin JSON을 가리키는 구성에서는 그
credential이 Vertex 권한도 가져야 answer / embedding live call이 통과한다.
반대로 Vertex 전용 credential을 가리키면 Firebase Admin SDK도 그 ADC를 먼저 사용할
수 있으므로 `/api/v1/auth/me` smoke가 실패할 수 있다.

값을 출력하지 않고 설정 여부만 확인:

```bash
grep -E '^(DATABASE_URL|GCP_PROJECT|GCP_PROJECT_ID|GCP_LOCATION|FIREBASE_PROJECT_ID|FIREBASE_ADMIN_CREDENTIALS|GOOGLE_APPLICATION_CREDENTIALS|VERTEX_ANSWER_MODEL)=' backend/.env | cut -d= -f1 | sed 's/$/=set/'
grep -E '^(NEXT_PUBLIC_API_BASE_URL|NEXT_PUBLIC_FIREBASE_API_KEY|NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN|NEXT_PUBLIC_FIREBASE_PROJECT_ID|NEXT_PUBLIC_FIREBASE_APP_ID|NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID|NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)=' frontend/.env.local | cut -d= -f1 | sed 's/$/=set/'
```

`GOOGLE_APPLICATION_CREDENTIALS` 대상 파일 존재 확인:

```bash
python -c 'from pathlib import Path; from dotenv import dotenv_values; p=dotenv_values("backend/.env").get("GOOGLE_APPLICATION_CREDENTIALS"); q=Path(p) if p else None; q=(Path.cwd()/q) if q and not q.is_absolute() else q; print("google_credentials_present" if q and q.is_file() else "google_credentials_missing_file")'
```

ignore 확인:

```bash
git check-ignore --no-index backend/.env
git check-ignore --no-index frontend/.env.local
git check-ignore --no-index config/secrets/firebase-admin.json
```

Vertex credential smoke:

```bash
python -c 'from backend.app.services.embedding import embed_query; v=embed_query("해고예고수당"); print("embedding_ok", len(v))'
```

Expected: `embedding_ok 768`.

Do not:

- `firebase-admin.json`, service account JSON, token, Firebase uid, `provider_subject`, email 값을 채팅/문서/log/git에 남기지 않는다.
- backend secret JSON을 `frontend/`로 옮기지 않는다.
- `NEXT_PUBLIC_*` 값을 secret처럼 backend credential 대체 용도로 쓰지 않는다.
- `.env` 또는 `config/secrets/*`를 commit하지 않는다.

### 4. Local smoke flow

1. Backend를 재시작한다.

```bash
uvicorn backend.main:app --reload
```

2. Frontend를 재시작한다.

```bash
cd frontend && npm run dev
```

3. Backend OpenAPI에 auth endpoint가 있는지 확인한다.

```bash
curl -sS http://localhost:8000/openapi.json | python -m json.tool | rg -n '/api/v1/auth/me'
```

4. Browser에서 `http://localhost:5090`을 열고 Google login을 진행한다.

Expected:

- backend auth status가 `logged_in=true`로 표시된다.
- internal `user_id`가 있다.
- 같은 Google account로 반복 인증하면 같은 internal `user_id`가 유지된다.
- provider subject, Firebase uid, token은 화면/로그에 표시하지 않는다.
- DB를 확인해야 할 때도 `provider_subject`는 masking된 형태로만 확인한다.
- SCN-004 `/after` path는 로그인 없이 계속 동작해야 한다.

### 5. Common pitfalls

- `/api/v1/auth/me`가 404면 오래된 backend server일 가능성이 높다. backend를 재시작하고 `/openapi.json`을 다시 확인한다.
- Login button이 `Firebase 설정 필요` 상태로 disabled이면 `frontend/.env.local`이 없거나, public env 변경 후 Next dev server를 재시작하지 않은 경우가 많다.
- `GOOGLE_APPLICATION_CREDENTIALS`가 Vertex AI용 credential을 가리키면 Firebase Admin SDK도 그 ADC를 우선 사용할 수 있다. Firebase Auth smoke shell에서는 Firebase Admin JSON path를 명확히 지정한다.
- Google OAuth access token과 Firebase ID token을 혼동하지 않는다. Backend `/api/v1/auth/me`에는 Firebase ID token을 Bearer token으로 보낸다.
- token을 채팅, 문서, log, issue에 붙이지 않는다.

## 이 디렉터리에서 먼저 볼 문서

### 1. 로컬 실행 시작

- [quick_start.md](./quick_start.md)

새 환경에서 프로젝트를 처음 실행할 때 가장 먼저 보는 문서다.

### 2. 스타팅 후 검증

- [스타팅_후_자체_테스트.md](./스타팅_후_자체_테스트.md)

서버가 뜬 뒤 현재 상태가 정상인지 점검하는 체크 문서다.

### 3. 데이터 흐름

- [데이터_파이프라인.md](./데이터_파이프라인.md)

법령 데이터, DB 적재, embedding, `before` supplement, 클라우드 마이그레이션 시 주의점까지 포함한 문서다.

### 4. 저장소 구조

- [각_디렉터리_및_파일의_역할.md](./각_디렉터리_및_파일의_역할.md)

repo 전체 구조와 핵심 파일 역할을 설명하는 저장소 지도 문서다.

### 5. 클라우드 전환

- [클라우드런_데이터_저장_구조.md](./클라우드런_데이터_저장_구조.md)

Cloud Run / Cloud SQL / GCS 구조 전환을 염두에 둔 운영 설계 문서다.

### 6. 트러블슈팅

- [troubleshooting.md](./troubleshooting.md)

반복되는 문제와 해결책을 기록하는 운영 로그 문서다.

## 관련 실행 파일

- [starting.sh](../../scripts/starting.sh)
- [demo_preflight.sh](../../scripts/demo_preflight.sh)

역할:

- `starting.sh`
  - 로컬 개발 시작 자동화
  - DB readiness, migration, `before` supplement sync, backend/frontend 실행
- `demo_preflight.sh`
  - 발표 전 smoke / build / readiness 점검

## 앞으로의 우선 작업

현재 문서 정리 이후 다음 단계는 아래 순서가 적절하다.

1. 실제 브라우저 logged-in smoke: main page 로그인 후 Before CTA -> `/before`, `/before` history endpoints Authorization PRESENT, history records read-only render 확인
2. read-only history status pill color polish가 필요하면 별도 작은 patch로 처리
3. main Before gate semantic/a11y polish가 필요하면 SCN-004 `/after` login-free path를 건드리지 않고 처리
4. `starting.sh` 기준 실제 실행 예시/출력 예시를 `quick_start.md`에 보강
5. `provider_timeout` retry/backoff hardening이 필요하면 runtime troubleshooting에 분리 기록
6. `before` / `after` artifact의 향후 GCS 전환 기준 정리
7. Cloud Run 마이그레이션 시 필요한 환경 변수/시크릿 목록 별도 문서화

Step 2B-3, history deletion/retention, SCN-001 document draft는 아직 열지 않는다.

## 현재 남아 있는 큰 기술 작업

문서 작업과 별개로, 구조상 남아 있는 큰 전환 포인트는 아래다.

- `before` artifact 저장을 로컬 디스크에서 GCS로 전환
- `after` artifact 저장을 로컬 디스크에서 GCS로 전환
- Cloud Run 배포 시 signed URL 또는 인증 프록시 방식 결정
- 필요 시 `before` / `after` 운영 메타데이터 조회 문서 추가

## 문서 사용 원칙

- 실행 전: `quick_start.md`
- 실행 후 점검: `스타팅_후_자체_테스트.md`
- 구조 파악: `각_디렉터리_및_파일의_역할.md`
- 데이터 파악: `데이터_파이프라인.md`
- 클라우드 전환 검토: `클라우드런_데이터_저장_구조.md`
- 문제 발생 시: `troubleshooting.md`
