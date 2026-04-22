# Troubleshooting Log

기록 기준:
- 같은 문제 2회 이상 반복
- 재사용 가치 있음
- 원인과 해결책이 명확함

자동 기록 금지.
필요하다고 판단될 때만 추가.

## 2026-04-22 Firebase Auth / ID Token Troubleshooting

### 1. 목표 구조를 혼동함: Firebase ID token은 “등록”하는 값이 아니다

정상 흐름:

```text
Frontend Firebase SDK
  -> Google Sign-In
  -> getIdToken()
  -> Authorization: Bearer <Firebase ID token>
  -> FastAPI /api/v1/auth/me
  -> Firebase Admin SDK verifies token
  -> Firebase uid -> internal users.id resolve/upsert
```

원칙:

- Firebase ID token은 DB, 문서, `.env`, git에 저장 / 등록하지 않는다.
- ID token은 짧게 살아 있는 로그인 증명용 bearer token이다.
- frontend는 SCN-001 protected API 호출 직전에 Firebase SDK에서 token을 받아 `Authorization` header로 보낸다.
- backend는 token 검증 후 Firebase `uid`를 `provider_subject`로 보고 internal `users.id`에 매핑한다.
- business table에는 Firebase `uid`, Google `sub`, email, raw ID token을 직접 저장하지 않고 internal `user_id`만 저장한다.
- `/api/v1/auth/me` response에도 Firebase `uid`, Google `sub`, `provider_subject`를 노출하지 않는다.

수동 curl smoke:

```bash
curl -i http://127.0.0.1:8001/api/v1/auth/me \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

expected:

```json
{
  "logged_in": true,
  "user_id": "<internal-user-id>",
  "display_name": "<nullable>",
  "email": "<nullable>"
}
```

주의:

- Firebase Web API key는 web app public config다. 서버 비밀키는 아니지만, repo 문서에는 실제 값을 기록하지 않는다.
- Firebase Admin service account JSON / private key는 절대 `index.html`, frontend code, 문서 본문에 넣지 않는다.
- service account JSON을 local fallback으로 쓸 때도 ignored path 아래에 두고 git에 포함하지 않는다.
- Google OAuth access token과 Firebase ID token은 다르다. Backend `/api/v1/auth/me`에는 Firebase SDK의 `getIdToken()`으로 받은 Firebase ID token만 Bearer token으로 보낸다.
- token은 채팅, 문서, log, issue에 붙이지 않는다.

### 2. 테스트용 `index.html`로 Firebase ID token을 받을 때 표준 절차

전제:

- Firebase project: 실제 프로젝트 선택 확인
- Firebase web app: `Project settings -> General -> Your apps -> Web app config`에서 값을 복사
- Firebase Authentication: `Build -> Authentication -> Get started`
- Google provider: `Authentication -> Sign-in method -> Google -> Enable`
- Authorized domains: `Authentication -> Settings -> Authorized domains`에 `localhost` 포함

정적 테스트 페이지 실행:

```bash
cd <repo-root>
python -m http.server 5091 --bind 127.0.0.1
```

브라우저 URL:

```text
http://localhost:5091/index.html
```

중요:

- `file://.../index.html`로 열지 않는다.
- `http://127.0.0.1:5091/index.html`로 열면 Firebase authorized domain이 `localhost`만 있을 때 `auth/unauthorized-domain`이 날 수 있다.
- Firebase authorized domain에는 port를 쓰지 않는다. `localhost:5091`이 아니라 `localhost`다.
- 테스트 페이지의 `Current Page Origin`이 반드시 아래처럼 보여야 한다.

```text
http://localhost:5091
hostname: localhost
```

테스트 페이지 순서:

1. Firebase Console의 Web app config에서 `apiKey`, `authDomain`, `projectId`, `appId`를 그대로 복사한다.
2. `Firebase 초기화`를 누른다.
3. `Google 로그인 Popup`을 누른다.
4. popup이 차단되거나 바로 닫히면 `Google 로그인 Redirect`를 사용한다.
5. `Firebase ID Token` textarea에 token이 표시되는지 확인한다.
6. `Backend API Base`가 현재 backend 주소와 맞는지 확인한다.
7. `/api/v1/auth/me 호출`을 누른다.

### 3. backend auth smoke 서버와 stale backend 구분

증상:

```text
GET /api/v1/auth/me -> 404 Not Found
```

원인:

- `localhost:8000`에 오래된 uvicorn process가 떠 있고, 현재 코드의 auth router가 반영되지 않았을 수 있다.
- `backend/app/routers/auth.py`와 `api_router.include_router(auth_router)`가 현재 파일에는 있어도 실행 중인 process가 이전 상태일 수 있다.

확인:

```bash
curl -sS http://localhost:8000/openapi.json | python -m json.tool | rg -n 'auth|/api/v1'
```

`/api/v1/auth/me`가 없으면 현재 코드 서버가 아니다.

충돌 회피용 test backend:

```bash
FIREBASE_PROJECT_ID=<firebase-project-id> \
GOOGLE_APPLICATION_CREDENTIALS=$PWD/config/secrets/firebase-admin.json \
BACKEND_CORS_ORIGIN_REGEX='https?://(localhost|127\.0\.0\.1):(30[0-9]{2}|5090|5091)' \
uvicorn backend.main:app --host 127.0.0.1 --port 8001
```

missing-token smoke:

```bash
curl -i http://127.0.0.1:8001/api/v1/auth/me
```

expected:

```json
{"logged_in":false,"user_id":null,"display_name":null,"email":null}
```

CORS preflight smoke:

```bash
curl -i -X OPTIONS http://127.0.0.1:8001/api/v1/auth/me \
  -H 'Origin: http://localhost:5091' \
  -H 'Access-Control-Request-Method: GET' \
  -H 'Access-Control-Request-Headers: Authorization'
```

expected:

```text
HTTP/1.1 200 OK
access-control-allow-origin: http://localhost:5091
access-control-allow-headers: ... Authorization ...
```

SCN-004 freeze 주의:

- Firebase token은 SCN-001 protected endpoint에만 요구한다.
- `/api/v1/answer`, `/api/v1/documents/draft`, `/api/v1/before/health`, SCN-004 `/after` browser flow에는 로그인 강제를 넣지 않는다.
- CORS `Authorization` header 허용 후에도 public endpoints preflight와 SCN-004 manual path를 확인한다.

### 4. Firebase frontend error code별 원인과 해결

#### Login button이 `Firebase 설정 필요` 상태로 disabled

원인:

- `frontend/.env.local`이 없거나 required `NEXT_PUBLIC_FIREBASE_*` 값이 비어 있다.
- `frontend/.env.local`을 수정한 뒤 Next dev server를 재시작하지 않았다.
- Firebase Web App public config와 backend `FIREBASE_PROJECT_ID`가 서로 다른 project를 가리킨다.

해결:

1. `frontend/.env.local`에 required public config가 있는지 확인한다.
2. `git check-ignore --no-index frontend/.env.local`로 local env file이 ignored되는지 확인한다.
3. Next dev server를 재시작한다.

```bash
cd frontend && npm run dev
```

주의:

- `NEXT_PUBLIC_*` 값은 browser bundle에 포함되는 public config다.
- Public config라도 repo에는 실제 값을 commit하지 않는다.
- Firebase Admin service account JSON은 frontend env에 넣지 않는다.

#### `auth/api-key-not-valid.-please-pass-a-valid-api-key.`

증상:

```json
{
  "code": "auth/api-key-not-valid.-please-pass-a-valid-api-key."
}
```

원인:

- Web app config의 `apiKey`를 잘못 복사했거나 수동 입력 중 오타가 났다.
- Firebase project와 다른 project의 `apiKey`를 넣었다.
- Google Cloud API key 화면의 임의 key를 Firebase Web app config와 혼동했다.

해결:

1. Firebase Console에서 정확한 project를 선택한다.
2. `Project settings -> General -> Your apps -> Web app config`를 연다.
3. `firebaseConfig.apiKey`를 다시 복사한다.
4. 직접 타이핑하지 않는다. 한 글자 차이도 SDK 초기화 후 로그인 시작 전에 실패한다.
5. 테스트 페이지를 새로고침하고 `Firebase 초기화`부터 다시 한다.

예방:

- 실제 key 값을 문서에 박제하지 말고, Console 위치와 복사 절차를 기록한다.
- key를 수정한 뒤 이미 초기화한 Firebase app을 그대로 재사용하지 말고 page refresh 후 재초기화한다.

#### `auth/configuration-not-found`

증상:

```json
{
  "code": "auth/configuration-not-found"
}
```

원인:

- Firebase Web app config는 만들었지만 Firebase Authentication 제품을 아직 시작하지 않았다.
- `Authentication -> Sign-in method -> Google` provider가 disabled 상태다.
- `apiKey`, `authDomain`, `projectId`, `appId`가 서로 다른 Firebase project 값으로 섞였다.

해결:

1. Firebase Console -> project 선택
2. `Build -> Authentication`
3. `Get started`가 보이면 먼저 클릭
4. `Sign-in method -> Google`
5. `Enable` 켜기
6. project support email 선택
7. 저장
8. 테스트 페이지 새로고침
9. `Firebase 초기화` 후 다시 로그인

#### `auth/unauthorized-domain`

증상:

```json
{
  "code": "auth/unauthorized-domain"
}
```

원인:

- Firebase Authentication의 authorized domain 목록에 현재 브라우저 origin의 host가 없다.
- `localhost`를 승인했지만 실제 페이지는 `127.0.0.1`, WSL IP, LAN IP, 또는 `file://`로 열었다.
- authorized domain에 port까지 넣으려고 했다.

해결:

1. 브라우저 주소창을 확인한다.
2. local test 기준으로 반드시 아래 URL을 쓴다.

```text
http://localhost:5091/index.html
```

3. Firebase Console -> `Authentication -> Settings -> Authorized domains`
4. `localhost`가 있는지 확인한다.
5. `127.0.0.1`로 테스트해야 하는 경우에만 `127.0.0.1` 추가를 시도한다.
6. port는 넣지 않는다. `localhost:5091`이 아니라 `localhost`다.
7. browser hard refresh 또는 시크릿 창으로 다시 시도한다.

예방:

- Firebase Auth 테스트 URL은 `localhost`로 통일한다.
- backend API base는 `http://127.0.0.1:8001`이어도 되지만, Firebase authorized domain 판정은 `index.html`을 띄운 page origin 기준이다.

#### `auth/popup-blocked` 또는 `auth/popup-closed-by-user`

원인:

- 브라우저 팝업 차단, 확장 프로그램, 보안 설정, 또는 popup auth flow 실패.

해결:

- 테스트 페이지의 `Google 로그인 Redirect`를 사용한다.
- 또는 popup blocker를 해제하고 다시 `Google 로그인 Popup`을 누른다.

#### `/api/v1/auth/me`가 200인데 `logged_in=false`

원인:

- `Authorization` header를 보내지 않았다.
- header format이 `Bearer <token>`이 아니다.
- 테스트 페이지에서 Firebase ID token이 비어 있다.

해결:

```bash
curl -i http://127.0.0.1:8001/api/v1/auth/me \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

#### `/api/v1/auth/me`가 401

원인:

- token이 malformed / expired 상태다.
- `Bearer` prefix가 틀렸다.
- 다른 Firebase project에서 발급된 token이다.
- backend가 현재 MVP에서 허용하지 않는 sign-in provider를 거부했다.

해결:

1. 테스트 페이지에서 `토큰 새로고침`을 누른다.
2. 새 token으로 다시 호출한다.
3. frontend Firebase config의 `projectId`와 backend `FIREBASE_PROJECT_ID`가 같은지 확인한다.
4. Google provider로 로그인했는지 확인한다.

#### `/api/v1/auth/me`가 503

가능한 원인:

- `FIREBASE_PROJECT_ID`가 설정되지 않았다.
- `firebase-admin` package가 설치되지 않았다.
- local ADC 또는 `FIREBASE_ADMIN_CREDENTIALS` fallback이 준비되지 않았다.
- service account credential이 잘못되었거나 접근 권한이 없다.

해결:

```bash
export FIREBASE_PROJECT_ID=<firebase-project-id>
export GOOGLE_APPLICATION_CREDENTIALS=$PWD/config/secrets/firebase-admin.json
python -c "import firebase_admin; print('firebase_admin_ok')"
```

ADC / `GOOGLE_APPLICATION_CREDENTIALS` 주의:

- 현재 backend 구현은 ADC / `GOOGLE_APPLICATION_CREDENTIALS`를 우선 사용할 수 있다.
- `GOOGLE_APPLICATION_CREDENTIALS`가 Vertex AI용 credential을 가리키고 있으면 Firebase Admin SDK도 그 ADC를 먼저 사용할 수 있다.
- Firebase Auth smoke shell에서는 Firebase Admin JSON path를 `GOOGLE_APPLICATION_CREDENTIALS=$PWD/config/secrets/firebase-admin.json`로 명확히 지정한다.

`FIREBASE_ADMIN_CREDENTIALS` fallback 사용 시:

```bash
export FIREBASE_ADMIN_CREDENTIALS=config/secrets/firebase-admin.json
```

주의:

- `config/secrets/firebase-admin.json` 같은 credential file은 git에 포함하지 않는다.
- backend log에 service account JSON 내용, Firebase ID token, Firebase uid, email을 출력하지 않는다.

#### CORS preflight가 400 `Disallowed CORS origin`

원인:

- test page origin이 `BACKEND_CORS_ORIGIN_REGEX`에 없다.
- `Authorization` header가 CORS allow headers에 없다.

해결:

```bash
BACKEND_CORS_ORIGIN_REGEX='https?://(localhost|127\.0\.0\.1):(30[0-9]{2}|5090|5091)' \
uvicorn backend.main:app --host 127.0.0.1 --port 8001
```

backend code 기준:

- `allow_headers`에 `Authorization` 포함 필요
- MVP Bearer token path에서는 `allow_credentials=True`가 필수 아님

### 5. Firebase Auth 관련 절대 금지

- Firebase Admin service account JSON/private key를 `index.html`에 넣지 않는다.
- Firebase ID token을 문서, git, log, DB에 저장하지 않는다.
- Firebase `uid`, Google `sub`, email을 business table FK로 직접 쓰지 않는다.
- SCN-004 public flow에 Firebase login required를 걸지 않는다.
- Cloud Tasks / Pub/Sub worker에 Firebase end-user token을 전달하지 않는다.
- GCS artifact가 Firebase Auth만으로 자동 보호된다고 가정하지 않는다. artifact 접근은 backend에서 internal `user_id` ownership을 확인해야 한다.

## 2026-04-20 Demo / QA Troubleshooting

### 1. Non-interactive shell에서 `conda activate` 실패

증상:

```text
CondaError: Run 'conda init' before 'conda activate'
```

발생 맥락:

- AI agent가 비대화형 shell에서 backend import smoke 또는 verify script를 실행할 때 발생할 수 있다.
- 사용자의 일반 WSL 터미널에서는 `conda activate law_main_road`가 동작해도, automation shell에서는 conda hook이 로드되지 않을 수 있다.

해결:

```bash
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate law_main_road
python -c "from backend.main import app; print('import_ok')"
```

예방:

- `scripts/demo_preflight.sh`는 conda profile script를 먼저 source한 뒤 `conda activate law_main_road`를 실행한다.
- 새 automation script를 만들 때도 plain `conda activate`만 쓰지 말고 hook source를 포함한다.

### 2. `npm run build` 또는 Next dev 후 `frontend/next-env.d.ts`가 dirty로 남음

증상:

```diff
-import "./.next/types/routes.d.ts";
+import "./.next/dev/types/routes.d.ts";
```

발생 맥락:

- Next.js dev/build 과정에서 generated type import path가 바뀌며 git dirty가 생길 수 있다.
- 실제 코드 변경이 아니라 local generated state인 경우가 많다.

해결:

```bash
git diff -- frontend/next-env.d.ts
git checkout -- frontend/next-env.d.ts
git status -sb
```

예방:

- `npm run build` 후에는 항상 `git status -sb`를 확인한다.
- 의도한 변경이 아니라면 커밋에 포함하지 않는다.

### 3. `localhost:5090`에 stale Next dev server가 이미 떠 있음

증상:

- 새로 `npm run dev`를 실행하지 않았는데 `http://localhost:5090/after`가 응답한다.
- browser QA가 예상과 다르게 보이거나 이전 코드 상태를 보는 것처럼 느껴진다.

확인:

```bash
curl -I http://localhost:5090/after
```

대응:

- 이미 떠 있는 dev server가 같은 repo / 같은 frontend cwd에서 실행 중인지 확인한다.
- 발표 전에는 stale server가 남아 있지 않은 상태에서 backend/frontend를 깨끗하게 재시작하는 편이 안전하다.
- `scripts/demo_preflight.sh`는 dev server를 start/stop하지 않는다. preflight 통과 후 별도 터미널에서 수동 실행한다.

### 4. `127.0.0.1:5090`에서 Next dev HMR cross-origin warning 또는 route guard 재현 차이

증상:

- `http://127.0.0.1:5090` 접근 시 Next dev HMR cross-origin warning이 보인다.
- direct URL guard 또는 browser runtime QA가 `localhost` 기준과 다르게 재현될 수 있다.

해결:

- demo / browser QA 기준 URL은 `http://localhost:5090`으로 고정한다.
- `http://127.0.0.1:5090`은 QA 기준 URL로 쓰지 않는다.

### 5. WSL Playwright Chromium 실행 실패 또는 Windows Chrome CDP 우회로 시간 소모

증상:

- WSL에서 Playwright Chromium 실행 시 `libnss3`, `libasound2` 같은 system dependency 오류가 난다.
- AI agent가 Windows Chrome CDP / PowerShell 우회로 시간을 많이 쓰게 된다.

초기 설치:

```bash
cd frontend
npm install
npm install -D @playwright/test
npx playwright install-deps
npx playwright install chromium
```

주의:

- `npx playwright install-deps`는 `sudo` 권한이 필요할 수 있으므로 사용자가 직접 실행한다.
- `npx playwright install chromium` 전에 project dependencies가 설치되어 있지 않으면 Playwright가 warning을 띄울 수 있다. 먼저 `npm install`을 실행한다.

확인:

```bash
cd frontend
node -e "const { chromium } = require('@playwright/test'); (async () => { const browser = await chromium.launch({ headless: true }); const page = await browser.newPage(); await page.goto('data:text/html,<h1>ok</h1>'); console.log(await page.textContent('h1')); await browser.close(); })().catch((error) => { console.error(error); process.exit(1); });"
```

expected:

```text
ok
```

예방:

- WSL Playwright가 실패하면 Windows CDP / PowerShell 우회 전에 실패 원인과 필요한 사용자 조치를 먼저 보고한다.

### 6. `check_document_draft.py` 숫자와 browser fixed preset draft 숫자가 다름

증상:

- `python backend/verify/check_document_draft.py` 출력:
  - answer-derived wage fixture가 `cited_articles=3`
  - answer-derived unfair fixture가 `cited_articles=5`
- browser `SCN-004-DEMO-FREEZE` fixed path:
  - wage draft `cited_articles=2`, `source_context_ids=[5, 10]`
  - unfair draft `cited_articles=4`, `source_context_ids=[1, 2, 3, 4]`

원인:

- `check_document_draft.py`는 backend verify fixture 기준 smoke다.
- 발표용 `SCN-004-DEMO-FREEZE` browser path는 frontend fixed answer fixture 기준이다.

판정:

- 이 차이는 정상이다.
- backend draft contract smoke는 `check_document_draft.py`로 확인한다.
- 발표 demo freeze 기준은 browser dry-run fixed preset path 값으로 확인한다.

### 7. `scripts/demo_preflight.sh`가 `main != origin/main`에서 실패

증상:

- 로컬 commit이 `origin/main`보다 앞서 있을 때 preflight가 실패한다.

원인:

- preflight는 제출/발표 직전 재현성을 확인하기 위해 `main == origin/main`을 요구한다.

해결:

```bash
git status -sb
git log --oneline origin/main..HEAD
git push origin main
bash scripts/demo_preflight.sh
```

주의:

- push 전 상태에서 preflight가 실패하는 것은 정상이다.

### 8. Headless browser print 검증과 실제 OS print dialog 차이

증상:

- Playwright headless QA에서는 print dialog가 실제로 보이지 않는다.

원인:

- headless browser에서는 실제 OS print dialog가 아니라 `window.print()` 호출 여부만 검증한다.

대응:

- 자동 QA에서는 `window.print()` 호출을 확인한다.
- 발표 직전 실제 브라우저에서 print 버튼을 한 번 눌러 OS print dialog가 뜨는지 육안 확인한다.

### 9. Full 60 answer evidence에서 `PARTIAL`이 남음

증상:

- `eval/run_answer_evidence_report.py` full 60 결과:
  - `PASS=44`
  - `PARTIAL=16`
  - `FAIL=0`
  - expected point coverage `135/153`

판정:

- MVP 기준 acceptable이다.
- `PARTIAL` 16건은 citation miss, retrieval failure, grounding violation, context id invalid가 아니다.
- 주된 원인은 expected point 일부 누락이며, 법정 예외, 숫자/기간/상한, 보조 절차 의무, 복수 쟁점 답변 누락 유형이다.

후속:

- answer prompt / answer planning tuning 후보로 분리한다.
- SCN-004 demo freeze나 presentation fixed fixture의 blocker로 보지 않는다.
- 개선 시에는 full 60 evidence report를 다시 실행해 `FAIL=0` 유지와 `PARTIAL` 감소 여부를 비교한다.

### 10. Root `.gitignore`를 frontend 하위에서 stage하려고 할 때 경로 혼동

증상:

- `frontend/` 디렉터리에서 `git add .gitignore`를 실행했는데 root `.gitignore`가 stage되지 않는다.

원인:

- 현재 작업 디렉터리가 `frontend/`라서 `.gitignore` 경로가 root가 아니라 `frontend/.gitignore`로 해석된다.

해결:

```bash
cd <repo-root>
git add .gitignore
```

또는:

```bash
cd frontend
git add ../.gitignore
```

예방:

- repo-root 파일을 stage / commit할 때는 repo root에서 실행한다.
