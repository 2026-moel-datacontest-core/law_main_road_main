# Ops README

## 목적

이 문서는 `docs/ops` 디렉터리의 진입 문서다.

현재 운영 문서가 무엇인지, 지금 프로젝트가 어디까지 정리되었는지, 다음으로 무엇을 해야 하는지를 한 번에 확인하기 위한 용도로 사용한다.

## 현재 진행 상태

기준일: `2026-04-22`

현재 `ops` 문서 기준으로 정리된 상태는 아래와 같다.

- 로컬 실행 시작 문서 정리 완료
- 로컬 시작 자동화 스크립트 `scripts/starting.sh` 추가 완료
- 스타팅 후 자체 테스트 문서 정리 완료
- 데이터 파이프라인 문서 정리 완료
- 디렉터리/파일 역할 문서 정리 완료
- Cloud Run 데이터 저장 구조 문서 유지 중
- troubleshooting 문서 유지 중
- Firebase Auth Phase 2/3 로컬 설정 절차 정리 완료

현재 코드/구조 기준으로 반영된 주요 상태:

- `before` law source: DB 기준으로 전환 완료
- `before` startup cache preload: parent app startup 기준 반영 완료
- `before` job 상태: DB 저장 전환 완료
- `after` artifact 로컬 저장 구조: 반영 완료
- frontend 실제 dev/start 포트: `5090`

## Firebase Auth Phase 2/3 로컬 설정

이 절차는 Firebase Auth Google login을 로컬에서 확인하기 위한 운영 메모다. Backend Firebase Admin SDK credential과 frontend Firebase Web App public config는 위치와 성격이 다르므로 섞지 않는다. Secret, token, `provider_subject`, email 전문은 문서/채팅/log/git에 남기지 않는다.

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

### 3. Local smoke flow

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
- provider subject, Firebase uid, token은 화면/로그에 표시하지 않는다.
- DB를 확인해야 할 때도 `provider_subject`는 masking된 형태로만 확인한다.

### 4. Common pitfalls

- `/api/v1/auth/me`가 404면 오래된 backend server일 가능성이 높다. backend를 재시작하고 `/openapi.json`을 다시 확인한다.
- Login button이 `Firebase 설정 필요` 상태로 disabled이면 `frontend/.env.local`이 없거나, public env 변경 후 Next dev server를 재시작하지 않은 경우가 많다.
- `GOOGLE_APPLICATION_CREDENTIALS`가 Vertex AI용 credential을 가리키면 Firebase Admin SDK도 그 ADC를 우선 사용할 수 있다. Firebase Auth smoke shell에서는 Firebase Admin JSON path를 명확히 지정한다.
- Google OAuth access token과 Firebase ID token을 혼동하지 않는다. Backend `/api/v1/auth/me`에는 Firebase ID token을 Bearer token으로 보낸다.
- token을 채팅, 문서, log, issue에 붙이지 않는다.

## 이 디렉터리에서 먼저 볼 문서

### 1. 로컬 실행 시작

- [quick_start.md](/home/minsoo/after_pipeline/law_main_road/docs/ops/quick_start.md:1)

새 환경에서 프로젝트를 처음 실행할 때 가장 먼저 보는 문서다.

### 2. 스타팅 후 검증

- [스타팅_후_자체_테스트.md](/home/minsoo/after_pipeline/law_main_road/docs/ops/스타팅_후_자체_테스트.md:1)

서버가 뜬 뒤 현재 상태가 정상인지 점검하는 체크 문서다.

### 3. 데이터 흐름

- [데이터_파이프라인.md](/home/minsoo/after_pipeline/law_main_road/docs/ops/데이터_파이프라인.md:1)

법령 데이터, DB 적재, embedding, `before` supplement, 클라우드 마이그레이션 시 주의점까지 포함한 문서다.

### 4. 저장소 구조

- [각_디렉터리_및_파일의_역할.md](/home/minsoo/after_pipeline/law_main_road/docs/ops/각_디렉터리_및_파일의_역할.md:1)

repo 전체 구조와 핵심 파일 역할을 설명하는 저장소 지도 문서다.

### 5. 클라우드 전환

- [클라우드런_데이터_저장_구조.md](/home/minsoo/after_pipeline/law_main_road/docs/ops/클라우드런_데이터_저장_구조.md:1)

Cloud Run / Cloud SQL / GCS 구조 전환을 염두에 둔 운영 설계 문서다.

### 6. 트러블슈팅

- [troubleshooting.md](/home/minsoo/after_pipeline/law_main_road/docs/ops/troubleshooting.md:1)

반복되는 문제와 해결책을 기록하는 운영 로그 문서다.

## 관련 실행 파일

- [starting.sh](/home/minsoo/after_pipeline/law_main_road/scripts/starting.sh:1)
- [demo_preflight.sh](/home/minsoo/after_pipeline/law_main_road/scripts/demo_preflight.sh:1)

역할:

- `starting.sh`
  - 로컬 개발 시작 자동화
  - DB readiness, migration, `before` supplement sync, backend/frontend 실행
- `demo_preflight.sh`
  - 발표 전 smoke / build / readiness 점검

## 앞으로의 우선 작업

현재 문서 정리 이후 다음 단계는 아래 순서가 적절하다.

1. `ops` 문서를 `README.md` 또는 상위 문서에서 바로 찾을 수 있도록 링크 정리
2. `starting.sh` 기준 실제 실행 예시/출력 예시를 `quick_start.md`에 보강
3. `before` artifact의 GCS 전환 설계 구체화
4. `after` artifact의 향후 GCS 전환 기준 정리
5. Cloud Run 마이그레이션 시 필요한 환경 변수/시크릿 목록 별도 문서화

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
