# Code-based Status Checkpoint

기준일: `2026-05-04`

이 문서는 planning 문서 전반에 흩어진 상태 기록을 현재 코드 기준으로 다시
정리한 checkpoint다. 오래된 planning 문서의 phase/next-step 표현이 이 문서와
충돌하면 이 문서를 우선한다.

## 확인한 코드 표면

- backend app entry:
  - `backend/main.py`
  - parent FastAPI app은 `/api/v1` router를 include하고, Before sub-app을
    `/api/v1/before`에 mount한다.
  - startup lifespan에서 Before runtime cache를 preload한다.
- backend routers:
  - `backend/app/routers/retrieval.py`
  - `backend/app/routers/auth.py`
  - `backend/app/routers/answer.py`
  - `backend/app/routers/document_draft.py`
  - `backend/app/routers/scn001.py`
- frontend routes:
  - `/`
  - `/before`
  - `/after`
  - `/after/result`
  - `/after/intake`
  - `/after/draft`
  - `/history`
- frontend state/helpers:
  - `AuthContext` uses Firebase Auth + backend `/api/v1/auth/me` verification.
  - `FlowContext` stores After/Bridge/draft state in React memory only.
  - `bridge-api.ts` has protected Bridge creation and protected Bridge answer.
  - `scn001-history-api.ts` has protected history read/delete helpers.
  - `scenarioPresetDrafts.ts` implements SCN-001 fixed-preset frozen draft
    locally.
- latest main checkpoint:
  - `e79fa68`
  - visual checkpoint `85d10fa` completed integrated frontend UI polish without
    backend/API/schema changes.
  - later `56d71e7` through `e79fa68` workspace/draft-scope documentation and
    architecture/status alignment did not change backend/API/schema/Auth/Bridge
    data boundary or Web Storage policy.
  - `DESIGN.md` is the current frontend visual guide.

## 현재 구현 API

Public:

- `GET /health`
- `POST /api/v1/retrieve`
- `POST /api/v1/answer`
- `POST /api/v1/documents/draft`

Auth:

- `GET /api/v1/auth/me`

Before mounted sub-app:

- `POST /api/v1/before/review`
- `POST /api/v1/before/review/jobs`
- `GET /api/v1/before/review/jobs/{job_id}`
- `POST /api/v1/before/accessibility/recommendations`
- `GET /api/v1/before/health`

SCN-001 protected:

- `GET /api/v1/scn001/before-review-jobs`
- `GET /api/v1/scn001/before-review-jobs/{before_review_job_id}`
- `DELETE /api/v1/scn001/before-review-jobs/{before_review_job_id}`
- `POST /api/v1/scn001/bridge-runs`
- `GET /api/v1/scn001/bridge-runs`
- `GET /api/v1/scn001/bridge-runs/{bridge_run_id}`
- `DELETE /api/v1/scn001/bridge-runs/{bridge_run_id}`
- `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`

## 현재 구현된 제품 흐름

### SCN-004 After 문서 초안

- 로그인 없이 동작한다.
- `/after -> /after/result -> /after/intake -> /after/draft` 4-route flow가
  유지된다.
- exact `SCN-004-DEMO-FREEZE` preset은 frontend fixed answer fixture를
  사용하고 `/api/v1/answer`를 호출하지 않는다.
- modified preset은 `top_k=10`, free input은 `top_k=5`, 공통으로
  `ef_search=100`을 사용한다.
- document draft는 public `/api/v1/documents/draft`를 사용한다.
- draft service는 request의 `legal_basis` 안에 있는 근거만 사용한다.

### SCN-001 Before / Bridge / After

- Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase
  Admin verification path가 구현되어 있다.
- protected frontend gate는 Firebase signed-in 단독이 아니라 backend
  `/api/v1/auth/me` 검증 완료 상태(`backendUser.logged_in`)를 기준으로 한다.
- `/before` actual analysis, history, Bridge handoff는 backend-verified
  로그인 상태를 요구한다.
- Before review job은 optional auth linkage를 지원한다.
- logged-in completed Before job은 protected `bridge_runs` 생성으로 연결된다.
- checked Bridge handoff submit은 protected Bridge answer endpoint를 호출한다.
- all-unchecked Bridge handoff submit은 public `/api/v1/answer`를 호출하지만
  `answer_origin="bridge_handoff"`를 유지하고 result는 answer-only / draft
  disabled다.
- `/after` saved history selector는 backend-verified logged-in user에게
  collapsible history section을 보여준다.
- `/history`는 SCN-001 record archive로 구현되어 있다.
- Before/Bridge MVP soft-delete가 구현되어 있고, full retention lifecycle은
  열지 않았다.

### SCN-001 fixed-preset frozen draft

- exact `SCN-001-BRIDGE-DEMO` fixed preset은 answer 이후
  `workplace_change_reason_summary` / 사업장 변경 사유 정리서 초안 flow를
  제공한다.
- 이 flow는 frontend fixture + deterministic template 기반이다.
- 사용자 intake 값을 반영한다.
- backend/LLM을 호출하지 않고 `/api/v1/documents/draft`도 호출하지 않는다.
- live/backend SCN-001 document draft generation과 protected SCN-001 draft
  endpoint path/method/schema는 구현되지 않았다.

### Integrated UI polish

Visual checkpoint `85d10fa` includes the completed frontend-only UI polish pass,
and current main `e79fa68` preserves these frontend/backend boundaries:

- `DESIGN.md` is the current visual guide: token-first,
  neutral/dense/evidence-led, with disclaimers and uncertainty prominent.
- Before first screen is upload-focused. Local server/demo copy was removed,
  examples remain functional, analysis start scrolls to progress, OCR guidance
  says 1~2분 may be needed, result/accessibility sections were cleaned up, and
  hardcoded default accessibility legal basis was removed.
- After entry is centered, includes guidance cards, keeps preset id/query stable
  while improving display labels, restores the entry disclaimer, and uses
  primary-blue unselected / success-green selected saved-history accents.
- History is centered with readable folded incident cards and a blue left accent.
- Main page H1/lead/nav typography is cleaned up and the compact flow strip is
  present.
- The polish did not change backend/API/schema, SCN-004 exact/free input flow,
  Firebase `inMemoryPersistence`, Web Storage policy, `/api/v1/history` unified
  backend API status, live/backend SCN-001 draft generation, protected SCN-001
  draft endpoint, or Step 3 full retention lifecycle.

### Integrated frontend UI polish

- Before first screen stays upload-focused.
- Local server/demo copy was removed from user-facing surfaces.
- Before examples remain available.
- Before loading/progress and OCR guidance are clearer.
- Before result/accessibility layout is cleaner and no longer uses hardcoded
  default accessibility legal basis.
- After entry is centered and keeps the disclaimer visible.
- After preset display labels are cleaned up without changing preset id/query.
- `/after` saved-history connection states use clearer primary/success accents.
- `/history` uses centered, readable folded incident cards.
- Main page H1/lead/nav hierarchy and compact flow strip are cleaned up.

## 데이터 / 저장 경계

- 법령 source of truth는 `backend/data/law_chunks/all_chunks.json`이다.
- current live corpus는 `1722` chunks, `selected_as_of = 2026-04-11`이다.
- `data/legalize-kr/`와 `backend/data/law_chunks/`는 직접 수정하지 않는다.
- raw `user_statement`, full answer/draft payload, case intake, Firebase token,
  Firebase uid, provider subject, raw email, raw Bridge payload, raw
  `after_query_seed`는 Web Storage/UI/query/docs/logs에 노출하지 않는다.
- `after_artifact_runs.source_bridge_run_id`는 MVP에서 single primary
  `bridge_run_id`만 저장한다.
- multi-bridge full provenance, hard delete, artifact file purge, retention
  lifecycle, account deletion/access-control은 Post-MVP 정책 후보로 둔다.

## 현재 열지 않은 범위

- public `/api/v1/answer` contract 변경
- public `/api/v1/documents/draft` contract 변경
- `/api/v1/history` unified backend API
- independent `/bridge` route
- Recovery 본 구현
- SCN-005 frontend preset / document draft 확장
- live/backend SCN-001 draft generation
- protected SCN-001 draft endpoint path/method/schema
- Step 3 full retention lifecycle
- auth persistence 변경(`browserSessionPersistence` 등)
- provider timeout retry/backoff full hardening

## 검증 기준

문서-only 변경에서는 broad full eval을 기본 실행하지 않는다.

권장 focused checks:

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend
npm run build
```

현재 demo regression 묶음은 아래 script를 우선한다.

```bash
bash scripts/demo_preflight.sh
```
