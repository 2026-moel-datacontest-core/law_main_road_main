# AGENTS.md — law_main_road

## Purpose

실행 중심 작업 가이드.  
전역 규칙은 `CLAUDE.md`, 상세 설계는 `docs/planning/*`, 영역별 규칙은 하위 `CLAUDE.md` 참조.

## Current Phase

기준일: `2026-04-27`

- RAG refinement landing 완료
- SCN-004 document draft backend 완료
- SCN-004 After frontend 4-route flow 완료
- Phase 3A/B 완료: rendered_text copy, browser print, print disclaimer
- SCN-004 QA 정합성 검증, content output 확인, manual browser rehearsal 통과
- SCN-004 draft navigation race 수정 완료
- SCN-004 free input document eligibility guard 완료
- SCN-001/004 presentation-local fixed answer preset architecture 완료
- demo preflight script와 full 60 answer evidence report 추가 완료
- SCN-001 Firebase Auth Phase 0 완료: MVP path와 Phase 0 decisions 문서화 완료
- SCN-001 Firebase Auth Phase 1 완료: `users`, `bridge_runs`, `before_review_jobs.user_id`, `after_artifact_runs.user_id`, `after_artifact_runs.source_bridge_run_id` DB model/migration 커밋 완료
- SCN-001 Firebase Auth Phase 2 완료: backend Firebase ID token verification과 `GET /api/v1/auth/me` 커밋 완료
- SCN-001 Firebase Auth Phase 3 완료: frontend Firebase Web SDK, `AuthContext`, login UI, `/api/v1/auth/me` verification UI 커밋 완료
- Phase 3 manual evidence: 실제 Google popup login E2E, `users` row upsert, repeated auth same `user_id`, `/after` login-free, frontend build 통과 확인
- SCN-001 Phase 4 완료: protected `POST/GET /api/v1/scn001/bridge-runs`와 `BeforeHandoffDTO` extraction 구현 완료
- SCN-001 Phase 5 완료: Before review job optional Firebase Bearer linkage 구현 완료
- SCN-001 Phase 6A~6D 완료, Phase 6E blocker fixes 완료, Phase 6F live subset PASS with retry
- Vertex IAM/credential issue는 runtime resolved 상태이며, residual runtime risk는 transient `provider_timeout`이다.
- SCN-001 Phase 7A~7E 완료: `AfterArtifactLinkage` optional plumbing, protected bridge answer endpoint, frontend helper, `/after` checked Bridge submit routing, live browser/network/DB smoke PASS
- Phase 8 regression / demo preflight / SCN-004 manual rehearsal PASS
- Post-Phase 8 Step 1 logout memory reset, Step 1.5 Before actual analysis login-required UX, OCR 429 friendly message, Step 2A read-only history backend endpoints, Step 2B-1 frontend history API client/types, Step 2B-2 `/before` read-only history UI, Step 1.6 main page Before entry login gate 완료
- Post-Phase 8 actual browser logged-in smoke PASS 및 auth state sync hardening 완료: protected SCN-001 frontend gates는 Firebase signed-in 단독이 아니라 backend `/api/v1/auth/me` verification 완료 상태(`backendUser.logged_in`)를 기준으로 동작한다.
- SCN-001 Step 3 MVP soft-delete slice completed: backend history soft-delete foundation(`e6f17eb`), frontend `/before` delete UI/client(`50c279f`), browser deletion smoke PASS. Step 3 full retention lifecycle is NOT opened.
- SCN-001 `/after` saved Before/Bridge history selector completed in `2ec5488`: backend-verified logged-in users can open a collapsible saved history section on `/after`, select saved Bridge records into Bridge handoff memory state using only the displayed safe subset, and soft-delete Before/Bridge records from the `/after` history list.
- `/after` saved history selector does not expose raw `after_query_seed`, raw Bridge payload, token, Firebase uid, provider_subject, email, or real bridge id in UI/query/storage. Delete success refreshes/local-cleans the history list and selected handoff state; Before delete removes the linked Bridge visible path.
- SCN-001 frontend history/After polish completed on `experiment/frontend-polish-history-after`: `/after` saved history cards clarified (`f38aea6`), SCN-001 result fixed-draft panel no longer sticky (`3822da2`), `/history` hierarchy/delete copy polished (`d8ea907`), Masthead/intake delete accessibility polished (`903ec4f`), and stale `/before` embedded-history CSS removed (`1a57601`). This was frontend-only and did not change public API contracts, auth persistence, storage policy, or SCN-004 freeze behavior.
- recent security/history cleanup: local secret/database ignore rules hardening 완료, 문서 hash 참조는 current git history 기준으로 관리
- 현재 구현 기준은 **SCN-004 demo freeze 유지와 SCN-001 protected Bridge answer/history, `/after` saved history selector, MVP soft-delete, SCN-001 fixed-preset frozen draft path까지의 public contract 보호**
- SCN-001 Step 4 document draft design은 docs-only baseline으로 유지한다.
- SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow completed: `/after -> /after/result -> /after/intake -> /after/draft`, `workplace_change_reason_summary` / 사업장 변경 사유 정리서 초안.
- SCN-001 frozen draft는 frontend fixture + deterministic template 기반이며 사용자 intake 값을 반영한다. Backend/LLM을 호출하지 않고 `/api/v1/documents/draft`도 호출하지 않는다.
- SCN-001 live/backend document draft generation, protected SCN-001 draft endpoint path/method/schema, and Step 3 full retention lifecycle remain NOT opened.
- `Bridge/query relevance guard matrix review`는 current Step 4 design baseline으로 정리됐고, SCN-001 continuity panel은 `/after/result`와 `/after/draft`에 completed 상태다.
- Continuity panel은 `Bridge-as-Continuity, Not Grounding` 정책을 유지하며 `legal_basis`, `cited_articles`, `source_context_ids`, `grounded_context_ids`, `retrieved_chunks`를 생성/수정하지 않는다.
- Before OCR stale/running job failure guard completed. OCR live upload smoke에는 provider/runtime risk가 있었으며 retry/backoff/full provider hardening은 future runtime 후보로 유지한다.
- 다음 target은 SCN-001 frozen draft + continuity panel + `/after` saved history selector + frontend polish completed 상태를 기준으로 final browser rehearsal/evidence, docs release readiness, optional logged-in saved history smoke 중에서 선택한다.
- `SCN-001-BRIDGE-DEMO` exact fixed preset은 frozen draft flow를 제공하며, Bridge-origin/live modified SCN-001 paths는 answer-only / draft disabled 정책을 유지한다.
- `SCN-004-DEMO-FREEZE`는 main demo / document draft freeze용 preset
- SCN-005는 현재 frontend preset UI에서 제외하고 후속 확장 후보로만 유지
- 실제 브라우저 logged-in/history deletion smoke는 PASS 상태이며, SCN-001 live/backend document draft generation은 NOT opened 상태다.
- 현재 source of truth는 `backend/data/law_chunks/all_chunks.json`
- current live corpus: `1722` chunks, `selected_as_of = 2026-04-11`

Evolution note:

- 2026-04-17 기준 상태는 RAG refinement, SCN-004 document draft backend, SCN-004 After frontend Phase 3A/B, content QA, manual browser rehearsal 완료였다.
- 2026-04-20에는 위 상태를 흔들지 않고 presentation-local preset, preflight, free-input guard, eval evidence report를 추가해 MVP 제출 기준을 보강했다.
- 2026-04-22에는 SCN-001 Firebase Auth Phase 0~3이 완료됐다. MVP auth path는 Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase Admin SDK verification이며, frontend persistence는 `inMemoryPersistence`다.
- 2026-04-24 기준으로 Phase 4/5/6A~6F, Phase 7A~7E, Phase 8 regression/demo checks, Post-Phase 8 Step 1/1.5/2A/2B-1/2B-2/1.6이 완료됐다. 2026-04-27에는 실제 브라우저 logged-in smoke PASS, backend-verified auth gate sync hardening, Step 3 MVP soft-delete slice completed, Step 4 SCN-001 docs-only design baseline, SCN-001-BRIDGE-DEMO frozen draft flow, stale OCR review job guard, SCN-001 continuity panel, `/after` saved Before/Bridge history selector, frontend history/After polish completed 상태가 확인됐다. `/api/v1/answer`와 `/api/v1/documents/draft` public contract는 변경하지 않았다.

## Read Order

1. `CLAUDE.md`
2. related file under `docs/planning/`
3. local `CLAUDE.md` in current directory
4. existing code
5. this file

## Repo Layout

| Path | Use |
|---|---|
| `backend/` | FastAPI, retrieval / answer / document draft, LLM routing, DB |
| `frontend/` | Next.js SCN-004 After demo UI |
| `scripts/` | preprocessing / chunking pipeline |
| `data/legalize-kr/` | source submodule |
| `backend/data/law_chunks/` | preprocessing outputs |
| `docs/` | planning / product / demo / ops |
| `eval/` | eval set / metrics |

## Environment

| Item | Value |
|---|---|
| OS | WSL Ubuntu |
| Python env | conda |
| Main env | project-specific env, not `base` |
| Package manager | `pip` inside conda env |
| Node | frontend only |
| Backend DB | PostgreSQL + pgvector |
| Frontend API base | `NEXT_PUBLIC_API_BASE_URL`, default `http://localhost:8000` |

## Setup

### Python / repo
```bash
conda activate law_main_road
git status
```

### if repo is not initialized

```bash
git init
mkdir -p data scripts backend/data/law_chunks
git submodule add https://github.com/legalize-kr/legalize-kr.git data/legalize-kr
git submodule update --init --recursive
pip install python-frontmatter
```

## Core Commands

### QA quick checks

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend
npm run build
```

### chunking pipeline

```bash
python scripts/step1_select_effective_snapshots.py --as-of 2026-04-10
python scripts/step4_chunk_articles.py
python scripts/step5_normalize.py
python scripts/step6_split_long_articles.py
python scripts/step7_finalize_metadata.py
python scripts/step8_dedupe_and_validate.py
python scripts/step9_quality_check.py
python scripts/step10_finalize.py
```

### backend

```bash
uvicorn backend.main:app --reload
```

### frontend

```bash
cd frontend
npm install
npm run dev
```

## Current Implemented API

| Method | Path | Status |
|---|---|---|
| `POST` | `/api/v1/retrieve` | implemented |
| `GET` | `/api/v1/auth/me` | implemented |
| `POST` | `/api/v1/scn001/bridge-runs` | implemented, Firebase Bearer auth required |
| `GET` | `/api/v1/scn001/bridge-runs` | implemented, Firebase Bearer auth required |
| `GET` | `/api/v1/scn001/bridge-runs/{bridge_run_id}` | implemented, Firebase Bearer auth required |
| `POST` | `/api/v1/scn001/bridge-runs/{bridge_run_id}/answer` | implemented, Firebase Bearer auth required |
| `GET` | `/api/v1/scn001/before-review-jobs` | implemented, Firebase Bearer auth required |
| `GET` | `/api/v1/scn001/before-review-jobs/{before_review_job_id}` | implemented, Firebase Bearer auth required |
| `DELETE` | `/api/v1/scn001/before-review-jobs/{before_review_job_id}` | implemented, Firebase Bearer auth required, MVP soft-delete |
| `DELETE` | `/api/v1/scn001/bridge-runs/{bridge_run_id}` | implemented, Firebase Bearer auth required, MVP soft-delete |
| `POST` | `/api/v1/answer` | implemented |
| `POST` | `/api/v1/documents/draft` | implemented |

Runtime defaults:

* general `/api/v1/retrieve` and `/api/v1/answer`: `top_k=5`, `ef_search=100`
* SCN demo / scenario smoke: explicitly send `top_k=10`, `ef_search=100`
* answer model default: `gemini-2.5-flash`
* embedding model default: `gemini-embedding-001`, `768` dimensions
* `SCN-001 Full` selective decomposition only triggers on the demo path when `top_k >= 8` and marker rules match

## Current Frontend Scope

Implemented routes:

* `/`
* `/before`
* `/after`
* `/after/result`
* `/after/intake`
* `/after/draft`

Implemented integration:

* `/after` uses fixed `AnswerResponse` fixture for unchanged presentation preset path, otherwise calls `POST /api/v1/answer`
* `/after/result` guards draft flow when `cited_articles` or `grounded_context_ids` is empty and filters SCN-004 document types by answer evidence
* `/after/intake` sends only `buildCaseIntake()` and `buildLegalBasis()` output to `POST /api/v1/documents/draft` for SCN-004 public draft flow. SCN-001-BRIDGE-DEMO exact fixed frozen draft path builds a frontend-local deterministic draft and bypasses `/api/v1/documents/draft`.
* `/after/draft` displays `rendered_text`, `missing_fields`, `cautions`, `evidence_checklist`, `cited_articles`, source context ids, copy, and print
* `/after` shows a collapsible saved Before/Bridge history selector for backend-verified logged-in users. Selecting a saved Bridge adds only the displayed safe subset to Bridge handoff memory state; raw seeds/payloads/internal ids/auth identifiers are not exposed in UI/query/storage.
* `/after` saved history list supports Before/Bridge MVP soft-delete with the existing protected DELETE helpers. Delete success refreshes/local-cleans the list and selected handoff state; Before delete removes linked Bridge visible path.
* `/before` can create protected `bridge_runs` from backend-verified logged-in completed Before jobs and add memory-only Bridge handoff items for `/after`
* `/before` shows SCN-001 history for backend-verified logged-in users and includes MVP soft-delete affordances with confirmation/cancel, protected DELETE Authorization, success refresh/local hide, linked Bridge visible-path removal, and memory-only Bridge handoff clearing
* main page Before entry is backend-verified login-gated while SCN-004 `/after` remains login-free
* checked Bridge handoff answers call the protected Bridge answer endpoint; all-unchecked handoff keeps sticky `answer_origin = "bridge_handoff"` and uses public answer without auth; result remains answer-only and draft disabled
* state is React Context + `useReducer` memory state only

## Working Rules

* 작은 단위로 수정
* 관련 문서 먼저 읽고 작업
* 기존 구조 존중
* 불필요한 전역 리팩토링 금지
* 스키마 변경은 최소화
* 문서와 코드 정합성 유지
* 불확실하면 TODO 또는 note 남기기

## Chunking Rules

* Step order fixed: `1 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10`
* Step 2, 3 do not run separately
* Step 1 / 4 / 7 are patched versions
* pipeline 재실행 command는 `--as-of 2026-04-10` 기준으로 재현성 우선
* 현재 frozen output metadata 기준은 `selected_as_of = 2026-04-11`
* Step 1~10 baseline output은 `1713` chunks
* current live source of truth는 SCN-003 최소 보강 `+9` chunks 포함 `1722` chunks
* Step 9 실패 시 다음 단계 진행 금지
* `article_ordinal` 보존
* `data/legalize-kr/` 직접 수정 금지
* `backend/data/law_chunks/` 직접 수정 금지. 필요한 경우 pipeline 또는 명시된 fixture/data 보강 절차로만 갱신

## Backend Rules

* HIGH / MEDIUM 민감 작업: local LLM 우선
* 현재 implemented answer / embedding path는 Vertex AI Gemini 기준
* 법률 답변에는 `cited_articles` 필요
* 검색 결과에 없는 조문 인용 금지
* API contract 임의 변경 금지
* `/api/v1/answer` contract를 문서 초안 용도로 확장하지 않음
* `/api/v1/documents/draft`는 request의 `legal_basis` 안에 있는 근거만 사용
* draft service는 retrieval / answer_generation service를 직접 호출하지 않음
* 사용자가 입력하지 않은 사실은 단정하지 않고 placeholder 또는 `missing_fields`로 남김
* SCN-005 After 문서 타입 확장은 SCN-004 freeze 기준을 유지한 별도 패치에서 진행 가능
* SCN-001 protected path는 Firebase Auth Bearer ID token을 사용하고, `auth_provider = "firebase_google"`, `provider_subject = Firebase uid`에서 internal `users.id`를 resolve
* Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback로만 유지
* Phase 4/5/6/7A~7E, Step 2A read-only history endpoints, Step 3 MVP soft-delete slice는 SCN-004 public answer/draft contract를 바꾸지 않고 구현됨
* Protected bridge answer endpoint는 `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`이며 Firebase Bearer auth, missing/unowned bridge_run 404 masking, `AnswerResponse`-compatible response, `after_artifact_runs.user_id/source_bridge_run_id` linkage를 사용한다.
* `/api/v1/answer` public contract unchanged
* `/api/v1/documents/draft` contract unchanged
* raw `after_query_seed`는 `/api/v1/answer.query` 또는 protected bridge answer query에 넣지 않는다. Bridge-origin answer query는 displayed safe subset plus user question만 사용한다.
* `after_artifact_runs.source_bridge_run_id`는 MVP에서 single primary `bridge_run_id`만 저장한다. multi-bridge full provenance는 Post-MVP join table 후보로 둔다.
* SCN-001 Step 4 document draft design은 docs-only baseline이다. SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow는 frontend fixture/deterministic template로 completed 상태지만, live/backend SCN-001 draft generation과 protected SCN-001 draft endpoint path/method/schema는 NOT opened.
* `Bridge/query relevance guard matrix review`는 current Step 4 design baseline으로 정리됐다. SCN-001 continuity panel은 `/after/result`와 `/after/draft`에 completed 상태이며, Bridge는 legal grounding이 아니라 continuity 설명으로만 다룬다.
* Step 3 full retention lifecycle은 NOT opened. Hard delete, artifact physical deletion/file purge, retention lifecycle, GCS lifecycle, audit/export, undo/restore, auth persistence changes, account deletion/access-control, orphan cleanup은 후속 정책 영역으로 둔다.

## Frontend Rules

* Korean primary, English secondary
* demo stability first
* backend schema 확인 없이 응답 필드 가정 금지
* 현재 제출/메인 demo 범위는 SCN-004 After 4-route flow다. repo에는 `/before`와 SCN-001 Bridge handoff CTA/cards도 포함되어 있다.
* `/bridge`, Recovery 본 구현은 현재 freeze 범위에서 진행하지 않음
* 현재 SCN-004 demo freeze 유지 작업과 SCN-005 문서 타입 frontend 확장을 한 패치에 섞지 않음
* SCN-005 After frontend / 문서 타입 확장은 SCN-004 freeze 기준을 유지한 별도 패치에서 진행 가능
* SCN-001 `Before -> Bridge -> After` answer-only handoff는 checked Bridge submit의 protected answer path와 all-unchecked public answer fallback까지 구현되어 있다. 추가 확장은 SCN-004 freeze를 유지한 별도 단계에서만 검토
* Firebase Auth MVP frontend persistence는 `inMemoryPersistence`; token/auth state와 raw flow payload를 Web Storage에 저장하지 않음
* `browserSessionPersistence`는 MVP default가 아니라 Future/Post-MVP UX tradeoff 후보
* raw `user_statement`, `answer_response`, `case_intake`, `draft_response`는 Web Storage에 저장하지 않음
* presentation preset exact path는 fixed answer fixture를 사용하고 `/api/v1/answer`를 호출하지 않음
* `/after`에 saved Bridge context가 있어도 SCN-001/SCN-004 preset buttons는 계속 표시한다.
* Exact preset submit은 fixed answer path가 우선된다: `SCN-001-BRIDGE-DEMO` exact는 fixed answer -> frozen draft flow, `SCN-004-DEMO-FREEZE` exact는 fixed answer -> existing SCN-004 draft flow.
* Preset 미선택 + included Bridge context는 기존 protected Bridge answer path를 유지한다.
* presentation preset modified path는 `top_k=10`, 자유 입력은 `top_k=5`, 항상 `ef_search=100`
* `SCN-001-BRIDGE-DEMO` exact fixed preset은 `workplace_change_reason_summary` frozen draft flow를 제공한다. modified/live SCN-001 and Bridge-origin paths는 answer-only / draft disabled를 유지한다.
* `SCN-004-DEMO-FREEZE`와 SCN-004 free input만 document eligibility guard 통과 시 draft flow 허용
* Bridge handoff screen submission은 all unchecked라도 `answer_origin = "bridge_handoff"`를 유지한다.
* Result는 answer-only / draft disabled이며, regular draft behavior는 direct `/after` 진입 또는 reset/re-entry가 필요하다.

## Git Rules

| Branch      | Use                 |
| ----------- | ------------------- |
| `main`      | stable / submission |
| `dev`       | integration         |
| `feature/*` | focused task branch |

### commit style

* small commits
* prefix with phase when relevant
* use: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Do Not

* edit `data/legalize-kr/`
* revive deprecated draft scripts
* mix SCN-004 freeze QA changes with feature expansion in one patch
* collect personal identity info
* change planning docs in-place without reason
* mix unrelated changes in one patch
* change API contracts to make frontend easier without backend/schema review
* run broad full eval for doc-only changes unless RAG / answer / retrieval behavior changed
* store raw case facts or full answer/draft payloads in browser storage

## Preferred 3-Pass Task Flow

1. code inspector pass: read relevant planning docs, local `CLAUDE.md`, and actual code paths before deciding status
2. doc updater pass: update the smallest valid document scope to match current code and freeze policy
3. verifier pass: check diff, run relevant smoke/build command, and report any command that was skipped or blocked

For current QA/doc tasks, prefer:

```bash
bash scripts/demo_preflight.sh
```

For focused checks, use:

```bash
python backend/verify/check_document_draft.py
cd frontend && npm run build
```

Run retrieval / answer full 60 only when `backend/app/services/retrieval.py`, `backend/app/services/answer_generation.py`, embedding behavior, DB contents, or API response contract changed. Use `eval/run_answer_evidence_report.py` when item-level PASS / PARTIAL / FAIL evidence is needed; do not add it to `scripts/demo_preflight.sh`.

## References

* `docs/planning/00_project_overview.md`
* `docs/planning/02_rag_strategy.md`
* `docs/planning/03_chunking_pipeline.md`
* `docs/planning/04_architecture.md`
* `docs/planning/05_eval_plan.md`
* `docs/planning/08_frontend_app_plan.md`
* `docs/planning/09_backend_embedding_plan.md`
* `docs/planning/10_backend_retrieval_plan.md`
* `docs/planning/12_scenario_expansion_plan.md`
* `docs/planning/13_document_draft_plan.md`
* `docs/planning/14_frontend_implementation_handoff.md`
* `docs/planning/19_scn001_auth_integration_status.md`
* `docs/ops/README.md`
