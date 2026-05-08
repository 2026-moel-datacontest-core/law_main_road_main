# Project Overview

## Project

- **Name:** 법대로(LawMainRoad)
- **Goal:** 외국인 근로자를 위한 노동권 보호 통합 AI
- **Priority:** 제출 안정성 > 기능 추가

---

## One-line Summary

- 외국인 근로자가 계약서 또는 산업재해 상황을 입력
- AI가 관련 노동법·산재법 조문 검색
- 근거 기반 위험 신호 및 다음 행동 안내 제공

---

## Problem

- 외국인 근로자의 한국 노동법 이해도 부족
- 계약서 위험 조항 판단 어려움
- 산업재해 및 노동분쟁 대응 절차 이해 어려움
- 언어 장벽으로 제도 접근성 낮음
- 정보는 있어도 실제 상황과 연결해 해석하기 어려움

---

## Core Structure

### Before
- 근로계약서 분석
- 주요 항목 추출
- 위험 신호 탐지
- 관련 법령 조문 제시

### After
- 산업재해 / 노동분쟁 상황 입력
- 사건 정보 구조화
- 관련 법령 검색
- 다음 행동 안내

### Bridge
- Before 결과 저장
- After 분석 시 이전 위험 신호 연결
- 계약 단계에서 예견 가능했던 위험 제시

### Recovery
- 회복 및 전환 지원 단계
- 현재 MVP 핵심 범위는 아님
- 이후 확장 기능

---

## Main Users

### Primary Users
- 외국인 근로자
- 한국 노동법 및 산재 절차에 익숙하지 않은 사용자
- 계약서 및 사고 상황을 한국어/영어로 설명해야 하는 사용자

### Secondary Users
- 외국인 노동 지원 활동가
- 상담 보조 인력
- 공공기관 / 지원센터 실무자

---

## MVP Direction

- 법령 retrieval이 실제로 동작하는지 검증
- 질문 → 관련 조문 검색 → 근거 포함 응답 흐름 확인
- 복잡한 인프라보다 검색 품질과 응답 구조 우선
- 현재는 Gemini API 기반 MVP 우선
- 이후 필요 시 GCP + Ollama 기반 Local LLM 구조 확장

---

## Current Status

기준일: `2026-04-29`

현재 코드 기준 최신 checkpoint는
[`23_code_based_status_2026_04_29.md`](23_code_based_status_2026_04_29.md)다.
아래 요약은 이 checkpoint와 실제 backend/frontend route surface를 기준으로
갱신했다.

- legalize-kr submodule, chunking Step 1~10, `backend/data/law_chunks/all_chunks.json`
  기준선 유지
- current live corpus: `1722` chunks, `selected_as_of = 2026-04-11`
- FastAPI parent app + mounted Before sub-app 구조 구현:
  - parent app: retrieval / auth / answer / document draft / SCN-001 protected routers
  - Before sub-app: `/api/v1/before`
- implemented public API:
  - `POST /api/v1/retrieve`
  - `POST /api/v1/answer`
  - `POST /api/v1/documents/draft`
- implemented auth/protected API:
  - `GET /api/v1/auth/me`
  - `GET/POST/DELETE /api/v1/scn001/*` Before/Bridge history and Bridge answer routes
- implemented Before API:
  - `POST /api/v1/before/review`
  - `POST /api/v1/before/review/jobs`
  - `GET /api/v1/before/review/jobs/{job_id}`
  - `POST /api/v1/before/accessibility/recommendations`
- frontend routes implemented:
  - `/`, `/before`, `/after`, `/after/result`, `/after/intake`, `/after/draft`, `/history`
- SCN-004 login-free After document draft flow remains the main public demo path.
- SCN-001 Firebase Auth protected path is implemented through backend-verified
  auth gates, Before/Bridge history, protected Bridge answer routing, `/after`
  saved history selector, `/history` record archive, and MVP soft-delete.
- exact `SCN-001-BRIDGE-DEMO` fixed preset now provides frontend-local
  deterministic `workplace_change_reason_summary` frozen draft flow.
- visual checkpoint `85d10fa` completes integrated frontend UI polish and blocker
  fixes:
  - Before first screen is upload-focused, local server/demo copy is removed,
    examples remain available, analysis loading scroll and OCR 1~2분 guidance are
    in place, result/accessibility sections are cleaner, and hardcoded default
    accessibility legal basis is removed.
  - After entry is centered, has guidance cards, keeps preset id/query stable
    while improving display labels, restores the entry disclaimer, and uses
    primary-blue unselected / success-green selected saved-history accents.
  - History is centered with readable folded incident cards and blue left accent.
  - Main page H1/lead/nav typography is cleaner and includes a compact flow
    strip.
  - `DESIGN.md` is the visual guide: token-first, neutral/dense/evidence-led,
    and explicit about keeping disclaimers and uncertainty prominent.
- live/backend SCN-001 document draft generation, protected SCN-001 draft
  endpoint, independent `/bridge`, Recovery, SCN-005 frontend expansion, and
  Step 3 full retention lifecycle remain not opened.
- 2026-05-04 current main is `e79fa68`; later workspace/draft-scope
  documentation alignment did not change backend/API/schema/Auth/Bridge/Web
  Storage boundaries.

## Historical Status Snapshot

기준일: `2026-04-24`

- legalize-kr submodule 연결 완료
- 청킹 Step 1~10 완료
- 최종 산출물: `backend/data/law_chunks/all_chunks.json`
- chunking 기준일: `2026-04-11`
- 청크 수: `1722`
- backend Task 2, 3, 4, 5 완료
- PostgreSQL + pgvector 로컬 DB 구성 완료
- Alembic migration 적용 완료 (`20260422_000006`)
- `law_chunks` 테이블 생성 완료
- `law_chunks` 1722건 ingestion 완료
- `law_chunks.embedding` 1722건 저장 완료
- HNSW vector index (`idx_law_chunks_embedding`) 생성 완료
- embedding 최종 검증 완료: `NULL 0`, sample dimension `768`
- FastAPI retrieval app skeleton 구현 완료
- query embedding service (`RETRIEVAL_QUERY`, `768`) 구현 완료
- pgvector cosine retrieval + `SET LOCAL hnsw.ef_search` 구현 완료
- `POST /api/v1/retrieve` 구현 및 live HTTP 검증 완료
- retrieval 검증 스크립트 / eval runner 구현 완료
- retrieval eval baseline:
  - `hit@1 = 51/60 (85.00%)`
  - `hit@3 = 59/60 (98.33%)`
  - `hit@5 = 60/60 (100.00%)`
- grounded answer generation MVP 구현 완료
- `POST /api/v1/answer` 구현 및 live 검증 완료
- citation grounding / fail-closed / timeout / verify/eval 안정화 완료
- default answer model: `gemini-2.5-flash`
- default embedding model: `gemini-embedding-001`
- full 60 answer eval 기준:
  - `items_answered = 60/60`
  - `JSON/schema failure = 0`
  - `timed_out_ids = []`
  - `citation_grounding_clean = 60/60`
  - `gold_citation_hit = 60/60`
  - `expected_point_strict_coverage = 137/153`
  - `failures_or_partial_coverage = 16`
- full 60 answer evidence report 기준:
  - `PASS = 44`
  - `PARTIAL = 16`
  - `FAIL = 0`
  - `expected point coverage = 135/153`
  - `citation grounding violation = 0`
  - `invalid raw / grounded context id = 0`
  - MVP 기준 acceptable, 후속 answer quality tuning 후보는 PARTIAL 16건
- scenario expansion / demo coverage 기준:
  - `SCN-001`: covered, `top_k=10` demo path stable
  - `SCN-002`: partial, extra source / structured data 필요
  - `SCN-003`: covered after minimal data addition (`+9 chunks`)
  - `SCN-004`: covered, frontend demo implemented, `SCN-004-DEMO-FREEZE` main path
  - `SCN-005`: covered for answer smoke, frontend UI preset에서는 제외하고 후속 확장 후보로 유지
- RAG refinement landing 완료:
  - Step 1 phrasing normalization 적용
  - Step 2 answer-side deterministic hardening 적용
  - Step 3 rerank 미적용
  - Step 4 selective decomposition은 `SCN-001 Full` demo path에 한해 `top_k >= 8` 조건부 적용
- document draft MVP 완료:
  - `POST /api/v1/documents/draft`
  - `SCN-004` 노동청 임금체불 진정서 초안
  - `SCN-004` 노동위원회 부당해고 구제신청 이유서 초안
  - answer-derived legal basis fixture smoke 완료
- frontend MVP 완료:
  - Next.js `16.2.4`, React `19.2.5`
  - `/after`, `/after/result`, `/after/intake`, `/after/draft`
  - 실제 `/api/v1/answer`, `/api/v1/documents/draft` 연동
  - loading/error/a11y/route guard 및 copy/print 구현
  - Phase 3C 이후 확장 작업은 보류
- SCN-001 Firebase Auth Phase 0~3 완료:
  - Phase 0: Firebase Auth MVP path / Phase 0 decisions 문서화 완료
  - Phase 1: `users`, `bridge_runs`, `before_review_jobs.user_id`, `after_artifact_runs.user_id`, `after_artifact_runs.source_bridge_run_id` DB model/migration 완료
  - Phase 2: backend Firebase ID token verification, `GET /api/v1/auth/me`, `require_current_user` / optional user dependency 완료
  - Phase 3: frontend Firebase Web SDK, `AuthContext`, Login UI, `/api/v1/auth/me` verification UI 완료
  - evidence: actual Google popup login E2E, `users` row upsert, repeated auth same `user_id`, SCN-004 `/after` login-free, frontend build 통과 확인
- SCN-001 Phase 4 완료:
  - protected `POST /api/v1/scn001/bridge-runs`
  - protected `GET /api/v1/scn001/bridge-runs/{bridge_run_id}`
  - `BeforeHandoffDTO` extraction
- SCN-001 Phase 5 완료:
  - Before review job optional Firebase Bearer linkage
  - no `Authorization` -> `before_review_jobs.user_id = null`
  - valid token -> internal `users.id`
  - invalid token -> 401
- SCN-001 Phase 6A~6D 구현 완료, Phase 6E blocker fixes 완료, Phase 6F live subset PASS with retry
- Phase 6F 기준 Vertex IAM/credential issue는 runtime resolved 상태이며 residual runtime risk는 transient `provider_timeout`이다.
- SCN-001 Phase 7 설계 문서 완료
- SCN-001 Phase 7A 완료: `AfterArtifactLinkage` optional persistence plumbing
- SCN-001 Phase 7B 완료:
  - protected `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`
  - Firebase Bearer auth required
  - missing/unowned bridge_run -> 404 masking
  - `AnswerResponse`-compatible response
  - `after_artifact_runs.user_id` / `after_artifact_runs.source_bridge_run_id` linkage
- Firebase Auth MVP persistence는 `inMemoryPersistence`다. token/auth state를 `localStorage`나 `sessionStorage`에 저장하지 않으며, `browserSessionPersistence`는 Future/Post-MVP UX tradeoff 후보로만 둔다.
- presentation-local preset 완료:
  - `SCN-001-BRIDGE-DEMO`: exact fixed path만 frontend-local
    `workplace_change_reason_summary` frozen draft flow를 제공하며,
    modified/live and Bridge-origin paths는 answer-only
  - `SCN-004-DEMO-FREEZE`: main demo / document draft freeze용
- SCN-004 free input document eligibility guard 완료
- SCN-004 fixed/free input/draft flow unchanged
- `/api/v1/answer` public contract unchanged
- `/api/v1/documents/draft` contract unchanged
- Bridge handoff screen submission은 all unchecked라도 sticky `answer_origin = "bridge_handoff"`를 유지한다.
- Result는 answer-only / draft disabled다.
- raw `after_query_seed`는 `/api/v1/answer.query` 또는 protected bridge answer query에 넣지 않는다.
- `after_artifact_runs.source_bridge_run_id`는 MVP에서 single primary bridge_run_id만 저장한다. multi-bridge full provenance는 Post-MVP join table 후보로 둔다.
- demo preflight script 추가 및 final pass 확인 완료
- SCN-004 QA/content/frontend rehearsal 완료:
  - preset answer `cited_articles=6`, `grounded_context_ids=[1, 2, 3, 5, 10, 4]`
  - answer key points에 노동위원회와 3개월 이내 구제신청 표시
  - answer-derived document draft 2종 모두 `missing_legal_basis=[]`
  - manual browser rehearsal에서 `/after -> /after/result -> /after/intake -> /after/draft`, copy, print, direct URL guard 확인

Evolution note:

- 2026-04-17 기준으로 RAG refinement, SCN-004 document draft backend, SCN-004 After frontend Phase 3A/B, content QA, manual browser rehearsal까지 완료됐다.
- 2026-04-20 기준으로 위 demo freeze를 유지하면서 fixed preset, free-input guard, preflight, item-level eval evidence가 추가됐다.
- 2026-04-22 기준으로 SCN-001 Firebase Auth Phase 0~3이 완료됐다.
- 2026-04-24 기준으로 SCN-001 Phase 4/5/6A~6F와 Phase 7A~7B가 완료됐다. public answer/draft contract와 SCN-004 freeze는 변경하지 않았다.

---

## Next Step

현재 구현 기준의 다음 작업은 기능 확장보다 문서 정리, demo freeze 보호,
선택적 frontend-only polish다.

### Step 0. Baseline freeze 유지

- public `/api/v1/answer` contract unchanged
- public `/api/v1/documents/draft` contract unchanged
- SCN-004 login-free After draft flow 유지
- SCN-001 protected Bridge answer/history/frozen draft boundary 유지
- Firebase Auth frontend persistence는 `inMemoryPersistence` 유지

### Step 1. GitHub-facing 문서 정리

- `docs/planning/*`는 작업 기준/phase 기록으로 유지한다.
- GitHub에 보여줄 문서는 `docs/github/` 아래에 별도 정리한다.
- 공개 문서에는 token, Firebase uid, provider_subject, raw email, raw query,
  full answer/draft body, real bridge id, artifact body를 기록하지 않는다.

### Step 2. Verification

문서-only 변경에서는 broad full eval을 기본 실행하지 않는다.

Focused checks:

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend
npm run build
```

Demo preflight:

```bash
bash scripts/demo_preflight.sh
```

### Step 3. Residual visual QA

- manual visual QA / print preview
- small token/a11y nits only if they preserve the current route behavior

위 항목은 SCN-004 freeze, SCN-001 frozen draft/history/continuity boundary,
backend/API/schema를 건드리지 않는 경우에만 진행한다.

### Step 4. Still not opened

- SCN-001 live/backend document draft generation
- protected SCN-001 draft endpoint path/method/schema
- Step 3 full retention lifecycle
- independent `/bridge`
- Recovery 본 구현
- SCN-005 frontend preset / document draft 확장
- auth persistence 변경
- provider_timeout retry/backoff full hardening

---

## Related Docs

### Planning
- `docs/planning/01_model_strategy.md`
- `docs/planning/02_rag_strategy.md`
- `docs/planning/03_chunking_pipeline.md`
- `docs/planning/04_architecture.md`
- `docs/planning/05_eval_plan.md`
- `docs/planning/06_backend_db_foundation.md`
- `docs/planning/07_backend_ingestion.md`
- `docs/planning/08_frontend_app_plan.md`
- `docs/planning/19_scn001_auth_integration_status.md`
- `docs/ops/README.md`

### Product
- `docs/product/before_flow.md`
- `docs/product/after_flow.md`
- `docs/product/bridge_flow.md`
- `docs/product/recovery_flow.md`
- `docs/product/mvp_scope.md`
