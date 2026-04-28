# CLAUDE.md — law_main_road

## Project

| Item | Value |
|---|---|
| Name | K-Labor Shield |
| One-liner | 외국인 근로자를 위한 노동권 보호 통합 AI |
| Goal | 공모전 제출 안정성 중심 MVP 완성 |
| Priority | 제출 안정성 > 기능 추가 > 리팩토링 |

## Current Phase

기준일: `2026-04-28`

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
- SCN-001 frontend history/After polish completed through latest main commits up to `fdde441`: `8cd1ccb` polished SCN-001 history cards, `c365ca5` clarified SCN-001 history summaries, `6263a8e` folded SCN-001 case records, `f15430c`/`a2d984f` fixed overbroad wage/deduction summaries, and `fdde441` prioritized login on the home page.
- SCN-001 incident cards show situation summary, confirmed issues, candidate legal references, recommended next steps, and the After question connection in one card. Summaries are user-facing Korean explanations rather than raw status/key output; `mandatory_terms_missing`, `dormitory_missing_info`, `deduction_risk`, and unknown snake_case values are rendered through Korean label/description or readable fallback. Bridge remains continuity/reference only, not legal grounding, and raw `after_query_seed` remains null and hidden from UI/query/storage.
- Latest frontend visual redesign completed through `fdde441`: visual foundation token alignment, home visual simplification, `/before`/`/after`/`/history` internal route chrome simplification, `/after/result`/`/after/intake`/`/after/draft` detail visual polish, draft print CSS specificity fix, Before analysis progress UX, masthead light surface alignment, SCN-001 case record fold, wage/deduction summary overstatement fix, and main page login priority.
- Before analysis progress UX completed: `/before` scrolls to the progress area after analysis starts, OCR guidance says document quality/length can make OCR take about 1~2 minutes, and raw job id/status/provider/internal error remains hidden. Backend OCR/provider/polling contracts were not changed.
- SCN-001 frontend visual/history/After polish remains frontend-only: public API contracts, auth persistence, Web Storage policy, SCN-004 freeze behavior, live/backend SCN-001 draft generation, protected SCN-001 draft endpoint, `/api/v1/history` unified backend API, and Step 3 full retention lifecycle were not opened.
- recent security/history cleanup: local secret/database ignore rules hardening 완료, 문서 hash 참조는 current git history 기준으로 관리
- 현재 구현 기준은 **SCN-004 demo freeze 유지와 SCN-001 protected Bridge answer/history, `/after` saved history selector, MVP soft-delete, SCN-001 fixed-preset frozen draft path까지의 public contract 보호**
- SCN-001 Step 4 document draft design은 docs-only baseline으로 유지한다.
- SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow completed: `/after -> /after/result -> /after/intake -> /after/draft`, `workplace_change_reason_summary` / 사업장 변경 사유 정리서 초안.
- SCN-001 frozen draft는 frontend fixture + deterministic template 기반이며 사용자 intake 값을 반영한다. Backend/LLM을 호출하지 않고 `/api/v1/documents/draft`도 호출하지 않는다.
- SCN-001 live/backend document draft generation, protected SCN-001 draft endpoint path/method/schema, and Step 3 full retention lifecycle remain NOT opened.
- `Bridge/query relevance guard matrix review`는 current Step 4 design baseline으로 정리됐고, SCN-001 continuity panel은 `/after/result`와 `/after/draft`에 completed 상태다.
- Continuity panel은 `Bridge-as-Continuity, Not Grounding` 정책을 유지하며 `legal_basis`, `cited_articles`, `source_context_ids`, `grounded_context_ids`, `retrieved_chunks`를 생성/수정하지 않는다.
- Before OCR stale/running job failure guard completed. OCR live upload smoke에는 provider/runtime risk가 있었으며 retry/backoff/full provider hardening은 future runtime 후보로 유지한다.
- 남은 후보는 optional frontend-only visual polish로 둔다: SCN-004 intake/draft internal component surface cleanup, Before Upload/Result/Accessibility panels deep polish, Auth/LoginButton token cleanup nit, History deep density polish, manual visual QA / print preview. SCN-004 freeze, SCN-001 frozen draft/history/continuity boundary, backend/API/schema는 건드리지 않는다.
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
- 2026-04-24 기준으로 Phase 4/5/6A~6F, Phase 7A~7E, Phase 8 regression/demo checks, Post-Phase 8 Step 1/1.5/2A/2B-1/2B-2/1.6이 완료됐다. 2026-04-27에는 실제 브라우저 logged-in smoke PASS, backend-verified auth gate sync hardening, Step 3 MVP soft-delete slice completed, Step 4 SCN-001 docs-only design baseline, SCN-001-BRIDGE-DEMO frozen draft flow, stale OCR review job guard, SCN-001 continuity panel, `/after` saved Before/Bridge history selector, frontend history/After polish completed 상태가 확인됐다. 2026-04-28 기준 최신 main은 `fdde441`까지 push 완료 상태이며 visual foundation/home/internal route chrome/after-flow detail polish, Before progress UX, masthead light alignment, `/after` + `/history` case record fold, wage/deduction summary fix, main page login priority가 완료됐다. `/api/v1/answer`와 `/api/v1/documents/draft` public contract는 변경하지 않았다.

## Structure

| Path | Role |
|---|---|
| `backend/` | FastAPI, retrieval / answer / document draft, LLM routing, DB |
| `frontend/` | Next.js SCN-004 After demo 웹앱 |
| `scripts/` | 데이터 전처리 / 청킹 Step 1~10 |
| `data/legalize-kr/` | 법령 원본 git submodule |
| `backend/data/law_chunks/` | 전처리 결과 저장 위치 |
| `docs/planning/` | 확정 계획 문서 |
| `docs/product/` | Before / After / Bridge / Recovery 플로우 |
| `docs/demo/` | 발표 / 시연 자료 |
| `docs/ops/` | 환경 세팅 / 실행 가이드 |
| `eval/` | 평가셋 / 지표 측정 |

## Stack

| Area | Choice |
|---|---|
| Backend | FastAPI, PostgreSQL, pgvector |
| Local LLM | Ollama + Qwen3-14B |
| External LLM | Vertex AI Gemini 2.5 Flash |
| OCR | Vertex AI Gemini 2.5 Flash |
| Embedding | Vertex AI `gemini-embedding-001` |
| Reranker | BGE-reranker-v2-m3 |
| Frontend | Next.js |
| Deploy | GCP |
| Dev Env | WSL + conda |

## Global Rules

- `data/legalize-kr/` 직접 수정 금지
- 전처리 결과는 `backend/data/law_chunks/`에만 저장
- 청킹 파이프라인 순서 고정: `1 → 4 → 5 → 6 → 7 → 8 → 9 → 10`
- Step 2, 3은 별도 실행하지 않음
- 현재 frozen output metadata 기준은 `selected_as_of = 2026-04-11`
- current live source of truth는 SCN-003 최소 보강 `+9` chunks 포함 `1722` chunks
- 초안이 아니라 **수정 확정본** 기준으로 작업
- `docs/planning/`은 기준 문서. 상세 설계는 거기서 확인
- 개인정보 최소 수집 원칙 유지
- 직접 회원가입 및 이메일/전화번호 직접 입력 수집 기능 추가 금지
- Firebase Auth Google Sign-In 기반 최소 로그인은 프로젝트 공통 인증 capability로 허용한다. 단, 다음 제약 준수 시.
- 실제 적용은 사용자별 상태 연결이 필요한 SCN-001 protected path로 제한한다. 현재 구현은 protected Bridge answer path와 read-only history UI까지 완료됐다.
- MVP auth path는 Bearer Firebase ID token + backend Firebase Admin SDK verification을 사용하고, `auth_provider = "firebase_google"`, `provider_subject = Firebase uid`에서 internal `users.id`를 resolve한다.
- Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback로만 유지한다.
- 전화번호 scope 요청 금지, 이메일 primary identifier 사용 금지, Firebase uid / Google sub / provider_subject를 business table이나 response에 직접 노출 금지
- access token / refresh token 장기 저장 금지
- Kakao OAuth는 첫 구현 범위에서 제외하고 후속 provider 후보로만 문서화
- SCN-004 freeze 기준을 깨는 신규 기능 추가 금지
- 실제 브라우저 logged-in/history deletion smoke는 SCN-004 demo freeze를 유지한 상태로 PASS 확인됐다. `/after` saved Before/Bridge history selector도 backend-verified logged-in user 대상 completed 상태이며, safe displayed subset만 Bridge handoff memory state에 넣고 raw seed/payload/internal ids/auth identifiers를 UI/query/storage에 노출하지 않는다. SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow와 continuity panel은 frontend-local로 completed 상태지만, live/backend SCN-001 draft generation, protected SCN-001 draft endpoint path/method/schema, Step 3 full retention lifecycle은 NOT opened.
- 제출 안정성 우선. 막히면 범위 축소 허용
- API contract 임의 변경 금지
- 하위 디렉토리 작업 시 해당 디렉토리 `CLAUDE.md` 우선 확인

## Branch Rules

| Branch | Purpose |
|---|---|
| `main` | 안정 버전 / 제출 기준 |
| `dev` | 통합 개발 |
| `feature/*` | 기능 단위 작업 |

## Work Rules

- 작은 단위로 수정
- 불필요한 전역 리팩토링 금지
- 문서와 코드 정합성 유지
- 계획 변경 시 기존 기준 문서를 덮어쓰지 말고 새 문서 추가
- 작업 전 관련 문서 먼저 확인
- SCN-001 auth/linkage 작업 전에는 `docs/planning/19_scn001_auth_integration_status.md`를 먼저 확인

## Read Order

1. `docs/planning/00_project_overview.md`
2. `docs/planning/02_rag_strategy.md`
3. `docs/planning/03_chunking_pipeline.md`
4. `docs/planning/04_architecture.md`
5. `docs/planning/05_eval_plan.md`
6. current directory `CLAUDE.md`
7. existing code

## Directory Notes

### `scripts/`
- 청킹/전처리 민감 구간
- Step 1/4/7 수정본 기준
- pipeline 재실행 command는 `--as-of 2026-04-10` 기준으로 재현성 우선
- 현재 frozen output metadata 기준은 `selected_as_of = 2026-04-11`
- current live source of truth는 `1722` chunks
- `article_ordinal` 충돌 방지 중요
- Step 9 실패 시 다음 단계 진행 금지

### `backend/`
- `POST /api/v1/retrieve`, `POST /api/v1/answer`, `POST /api/v1/documents/draft` 구현 완료
- `GET /api/v1/auth/me` 구현 완료
- `POST /api/v1/scn001/bridge-runs`, `GET /api/v1/scn001/bridge-runs`, `GET /api/v1/scn001/bridge-runs/{bridge_run_id}` 구현 완료
- `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer` 구현 완료. Firebase Bearer auth, missing/unowned bridge_run 404 masking, `AnswerResponse`-compatible response, `after_artifact_runs.user_id/source_bridge_run_id` linkage를 사용한다.
- `GET /api/v1/scn001/before-review-jobs`, `GET /api/v1/scn001/before-review-jobs/{before_review_job_id}` 구현 완료
- `DELETE /api/v1/scn001/before-review-jobs/{before_review_job_id}`, `DELETE /api/v1/scn001/bridge-runs/{bridge_run_id}` 구현 완료. Firebase Bearer auth, 204/masked generic UX, `before_review_jobs`/`bridge_runs` MVP soft-delete visibility fields를 사용한다.
- 일반 `/api/v1/retrieve`와 `/api/v1/answer` 기본값은 `top_k=5`, `ef_search=100`
- SCN demo / scenario smoke는 `top_k=10`, `ef_search=100` 명시
- HIGH/MEDIUM 민감 작업은 local LLM 우선
- 현재 implemented answer / embedding path는 Vertex AI Gemini 기준
- 환각 방지 규칙 유지
- cited_articles 없는 법률 답변 금지
- `/api/v1/documents/draft`는 `/api/v1/answer` legal basis 안의 근거만 사용. SCN-001-BRIDGE-DEMO exact fixed frozen draft path는 frontend-local deterministic draft이며 이 endpoint를 호출하지 않는다.
- draft service는 retrieval / answer_generation service를 직접 호출하지 않음
- 사용자가 입력하지 않은 사실은 단정하지 않고 placeholder 또는 `missing_fields`로 남김
- SCN-005 After 문서 타입 확장은 SCN-004 freeze 기준을 유지한 별도 패치에서 진행 가능
- SCN-001 Phase 4/5/6/7A~7E, Step 2A read-only history endpoints, Step 3 MVP soft-delete slice는 `/api/v1/answer`와 `/api/v1/documents/draft` public contract를 변경하지 않고 구현됨
- `/api/v1/answer` public contract unchanged
- `/api/v1/documents/draft` contract unchanged
- raw `after_query_seed`는 `/api/v1/answer.query` 또는 protected bridge answer query에 넣지 않음
- `after_artifact_runs.source_bridge_run_id`는 MVP에서 single primary `bridge_run_id`만 저장하며, multi-bridge full provenance는 Post-MVP join table 후보
- SCN-001 Step 4 document draft design은 docs-only baseline이다. SCN-001-BRIDGE-DEMO exact fixed preset frozen draft flow는 frontend fixture/deterministic template로 completed 상태지만, live/backend SCN-001 draft generation과 protected SCN-001 draft endpoint path/method/schema는 NOT opened.
- `Bridge/query relevance guard matrix review`는 current Step 4 design baseline으로 정리됐다. SCN-001 continuity panel은 `/after/result`와 `/after/draft`에 completed 상태이며, Bridge는 legal grounding이 아니라 continuity 설명으로만 다룬다.

### `frontend/`
- 한국어 메인 / 영어 보조
- 발표 데모 안정성 우선
- backend schema 확인 없이 응답 필드 가정 금지
- 현재 제출/메인 demo 범위는 SCN-004 After 4-route flow: `/after`, `/after/result`, `/after/intake`, `/after/draft`
- repo에는 `/before`, `/history`, SCN-001 Bridge handoff CTA/cards도 포함되어 있다. 다만 `/bridge`, Recovery 확장은 현재 freeze 범위에서 진행하지 않음
- 현재 SCN-004 demo freeze 유지 작업과 SCN-005 문서 타입 frontend 확장을 한 패치에 섞지 않음
- SCN-005 After frontend / 문서 타입 확장은 SCN-004 freeze 기준을 유지한 별도 패치에서 진행 가능
- SCN-001 `Before -> Bridge -> After` answer-only handoff는 checked Bridge submit의 protected answer path와 all-unchecked public answer fallback까지 구현되어 있다.
- Firebase Auth Google Sign-In 기반 최소 로그인의 현재 구현 적용 범위는 SCN-001 protected path다. Phase 4/5/6A~6F, Phase 7A~7E, read-only history UI, backend-verified main Before login gate, Step 3 MVP soft-delete UI/API까지 완료됐다.
- `/after` saved Before/Bridge history selector는 backend-verified logged-in user에게만 보이는 collapsible UI다. Saved Bridge 선택은 displayed safe subset만 Bridge handoff memory state에 추가하고, SCN-001/SCN-004 preset buttons를 숨기지 않는다.
- `/after` saved history와 `/history`는 사건 중심 단일 카드 UI다. Before와 Bridge를 별도 2-column/list로 나누지 않고 상황 설명, 확인된 쟁점, 참고할 법 조항 후보, 권장 다음 단계, After 질문과 연결점을 한 카드에서 설명한다.
- `/history`는 SCN-001 기록 보관함이며 failed/running Before는 user-facing list에서 숨기고, fetched non-completed Before에 연결된 Bridge도 숨긴다. Source Before가 fetch window 밖인 Bridge-only record는 표시 유지한다.
- `/after` saved history delete는 기존 protected DELETE helper를 사용한다. Success 시 local list와 selected handoff state를 정리하며, Before delete는 linked Bridge visible path도 제거한다.
- Firebase Auth MVP frontend persistence는 `inMemoryPersistence`; token/auth state와 raw flow payload는 Web Storage에 저장하지 않는다.
- `browserSessionPersistence`는 MVP default가 아니라 Future/Post-MVP UX tradeoff 후보로만 둔다.
- raw `user_statement`, `answer_response`, `case_intake`, `draft_response`는 Web Storage에 저장하지 않음
- SCN-001 history summary와 Bridge issue display는 raw status/key 중심 표시를 피한다. `mandatory_terms_missing`, `dormitory_missing_info`, `deduction_risk` 같은 key와 unknown snake_case는 한국어 label/description 또는 readable fallback으로 표시한다.
- presentation preset exact path는 fixed answer fixture를 사용하고 `/api/v1/answer`를 호출하지 않음
- Bridge context/history가 있어도 exact preset submit은 fixed answer path가 우선된다: `SCN-001-BRIDGE-DEMO` exact는 fixed answer -> frozen draft flow, `SCN-004-DEMO-FREEZE` exact는 fixed answer -> existing SCN-004 draft flow.
- Preset 미선택 + included Bridge context는 기존 protected Bridge answer path를 유지한다.
- presentation preset modified path는 `top_k=10`, 자유 입력은 `top_k=5`, 항상 `ef_search=100`
- `SCN-001-BRIDGE-DEMO` exact fixed preset은 `workplace_change_reason_summary` frozen draft flow를 제공한다. modified/live SCN-001 and Bridge-origin paths는 answer-only / draft disabled를 유지한다.
- `SCN-004-DEMO-FREEZE`와 SCN-004 free input만 document eligibility guard 통과 시 draft flow 허용
- Bridge handoff screen submission은 all unchecked라도 sticky `answer_origin = "bridge_handoff"`를 유지한다.
- Result는 answer-only / draft disabled이며, regular draft behavior는 direct `/after` 진입 또는 reset/re-entry가 필요하다.

## Do Not

- `data/legalize-kr/` 수정
- 초안 코드 재사용
- 계획 문서와 다른 방향으로 독단 수정
- 과도한 구조 변경
- 여러 feature 브랜치 동시 작업 전제 코드 작성
- API contract를 frontend 편의만으로 변경
- RAG / answer / retrieval behavior 변경 없는 doc-only 작업에서 broad full eval 실행
- raw case facts 또는 full answer/draft payload를 browser storage에 저장

## Reminder

- root `CLAUDE.md`는 전역 요약본
- 상세 규칙은 하위 `CLAUDE.md`와 `docs/planning/*` 참조
- 현재 목표는 “완벽한 구조”가 아니라 “안정적으로 제출 가능한 결과물”
- 2026-04-17 기준 RAG refinement, SCN-004 document draft backend, SCN-004 After frontend Phase 3A/B, SCN-004 content QA, manual browser rehearsal까지 완료됨.
- 2026-04-20 기준 presentation-local preset, SCN-004 free-input guard, demo preflight, full 60 answer evidence report까지 완료됨.
- 2026-04-22 기준 SCN-001 Firebase Auth Phase 0~3 완료.
- 2026-04-24 기준 Phase 4/5/6A~6F, Phase 7A~7E, Phase 8 regression/demo checks, Post-Phase 8 Step 1/1.5/2A/2B-1/2B-2/1.6 완료. 2026-04-27 기준 실제 브라우저 logged-in smoke PASS 및 backend-verified auth gate sync hardening 확인. 2026-04-28 기준 `/after`와 `/history`는 사건 중심 단일 카드와 사용자 설명형 요약으로 정리됨.
