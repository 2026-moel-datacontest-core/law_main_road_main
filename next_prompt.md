# Next Prompt

아래 내용을 다음 새 세션의 첫 프롬프트로 사용한다.

```text
law_main_road repo root에서 작업해주세요.

기준일:
- 2026-04-27

현재 git / 제출 기준 상태:
- 2026-04-27 artifact access/retrieval policy review 시작 시점의 `git status -sb`: `## main...origin/main`.
- 2026-04-27 artifact access/retrieval policy review 시작 시점의 `git status --short`: clean.
- 문서 업데이트 후 commit 전이면 `docs/planning/22_post_phase8_scn001_extension_roadmap.md`, `next_prompt.md`, `docs/ops/README.md`도 modified일 수 있다.
- 새 세션 시작 직후 `git status -sb`, `git status --short`, `git log --oneline -12`로 origin/main 동기화와 clean/dirty 상태를 다시 확인하세요.
- 이번 문서 업데이트는 별도 add/commit/push를 하지 않는 작업 범위였다.
- 최근 중요 커밋:
  - 180d81c docs(scn-001): document Step 3 retention policy review
  - 83508dc docs(scn-001): record Step 3 MVP deletion completion
  - 50c279f feat(frontend): add SCN-001 history delete UI
  - e6f17eb feat(scn-001): add backend history soft delete
  - 591ca11 docs(scn-001): refine deletion policy candidates
  - 4073846 docs(scn-001): draft deletion cascade policy
  - e840c44 docs(scn-001): draft deletion retention policy
  - d7bc261 fix(frontend): gate main Before entry behind login
  - f2c463a feat(frontend): show read-only SCN-001 history on Before
  - facb408 feat(frontend): add SCN-001 history API client
  - d1bc27b fix(frontend): show friendly OCR quota failure message
  - 7466f2a fix(frontend): require login before actual Before analysis
  - d182ccd docs(scn-001): update post Phase 8 extension roadmap
  - 5948b43 feat(scn-001): add protected read-only history endpoints
  - 030e7ac fix(frontend): reset flow memory on logout
  - 122b8c9 docs(scn-001): outline post Phase 8 extension roadmap
  - 09b6952 docs(scn-001): record Phase 8 rehearsal status
  - e84bfe2 docs(scn-001): record Phase 8 rehearsal status
  - 2cfaff1 docs(scn-001): record Phase 7C~7E completion and local env inventory

현재 상태 요약:
- SCN-004 demo freeze 유지 완료.
- SCN-004 document draft backend 완료.
- SCN-004 After frontend 4-route flow 완료:
  - /after
  - /after/result
  - /after/intake
  - /after/draft
- rendered_text copy, browser print, print disclaimer 완료.
- SCN-004 QA 정합성 검증, content output 확인, manual browser rehearsal 통과.
- draft navigation race 수정 완료.
- free input SCN-004 document eligibility guard 완료.
- SCN-001/004 presentation-local fixed answer preset architecture 완료.
- demo preflight script와 full 60 answer evidence report 추가 완료.
- SCN-001 Firebase Auth Phase 0~3 완료.
- SCN-001 Phase 4 protected bridge-runs endpoint 완료.
- SCN-001 Phase 5 Before review job optional auth linkage 완료.
- SCN-001 Phase 6A~6D Bridge -> After answer-only handoff 완료.
- SCN-001 Phase 6E handoff blocker fixes 완료.
- SCN-001 Phase 6F live subset PASS with retry.
- SCN-001 Phase 7A AfterArtifactLinkage optional plumbing 완료.
- SCN-001 Phase 7B protected bridge answer endpoint 완료.
- SCN-001 Phase 7C frontend protected bridge answer helper 완료.
- SCN-001 Phase 7D `/after` submit routing 완료.
- SCN-001 Phase 7E live browser/network/DB smoke PASS.
- Phase 8 regression / demo preflight / SCN-004 manual rehearsal PASS.
- Phase 8 SCN-001 checked/all-unchecked browser replay는 Codex headless에서 interactive Firebase Google popup login + in-memory auth state 부재로 BLOCKED. Phase 7E가 최신 SCN-001 full browser/network/DB PASS evidence입니다.
- `bash scripts/demo_preflight.sh` PASS.
- Vertex IAM/credential issue는 runtime resolved 상태입니다.
- Phase 7E 기준 `provider_timeout`: NO.
- Phase 7E 기준 console/network error: NO.
- Post-Phase 8 Step 1 logout memory reset 완료: 로그아웃 시 SCN-001 memory flow가 남지 않도록 정리됨.
- Post-Phase 8 Step 1.5 Before actual analysis login-required UX 완료: 로그인 없이 protected Before action을 시작하면 로그인 필요 메시지를 표시함.
- OCR provider 429 frontend friendly message 완료: quota/rate failure를 사용자 친화 문구로 처리함.
- Post-Phase 8 Step 2A protected read-only history backend endpoints 완료.
- Post-Phase 8 Step 2B-1 frontend history API client/types 완료.
- Post-Phase 8 Step 2B-2 `/before` read-only history UI 완료. `git log` 기준 `f2c463a`로 확인됨.
- Post-Phase 8 Step 1.6 main page Before entry login gate 완료. `git log` 기준 `d7bc261`로 확인됨.
- Post-Phase 8 actual browser logged-in smoke PASS.
- SCN-001 protected auth state sync hardening 완료:
  - main Before CTA는 Firebase signed-in 단독이 아니라 backend `/api/v1/auth/me` verification 완료 상태(`backendUser.logged_in`) 기준으로 `/before` 진입
  - `/before` history, 분석 시작, Bridge handoff도 backend-verified 상태 기준으로 보호
  - protected endpoint 401은 frontend backend auth re-check로 연결
- Step 3 MVP soft-delete slice completed:
  - Backend soft-delete foundation completed in `e6f17eb`
  - Frontend `/before` delete UI/client completed in `50c279f`
  - `before_review_jobs`, `bridge_runs` soft-delete visibility fields
  - protected delete endpoints
  - hidden records filtered from history
  - hidden Before blocks Bridge creation
  - hidden Bridge / hidden-source-Before blocks protected Bridge answer before generation
  - no after_artifact deletion, no hard delete, no file purge
  - `/before` read-only history delete affordance, confirmation/cancel, success refresh/local hide
  - DELETE Authorization PRESENT for SCN-001 protected history endpoints
  - Before delete hides/removes linked Bridge from visible history/selection path
  - memory-only Bridge handoff cleared so deleted Before cannot seed `/after`
  - Step 3 full retention lifecycle is NOT opened
- Step 3 full retention lifecycle policy review is documented in
  `docs/planning/22_post_phase8_scn001_extension_roadmap.md`; this is policy
  review only, not implementation.
- Artifact access/retrieval policy review is documented in
  `docs/planning/22_post_phase8_scn001_extension_roadmap.md`; artifact retrieval
  UI/API, retrieval implementation, API path/method, DB schema/migration, signed
  URL, file streaming, inline body, hard delete, file purge, GCS lifecycle,
  audit export, undo/restore, account deletion/access-control, orphan cleanup,
  and SCN-001 document draft are NOT opened.

현재 구현 API:
- `GET /api/v1/auth/me`
- `GET /api/v1/scn001/before-review-jobs`
- `GET /api/v1/scn001/before-review-jobs/{before_review_job_id}`
- `DELETE /api/v1/scn001/before-review-jobs/{before_review_job_id}`
- `POST /api/v1/scn001/bridge-runs`
- `GET /api/v1/scn001/bridge-runs`
- `GET /api/v1/scn001/bridge-runs/{bridge_run_id}`
- `DELETE /api/v1/scn001/bridge-runs/{bridge_run_id}`
- `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`
- `POST /api/v1/retrieve`
- `POST /api/v1/answer`
- `POST /api/v1/documents/draft`

강한 freeze / contract 원칙:
- SCN-004 freeze를 흔들지 마세요.
- `/api/v1/answer` public contract unchanged.
- `/api/v1/documents/draft` contract unchanged.
- SCN-004 `/after`, `/after/result`, `/after/intake`, `/after/draft`는 로그인 없이 계속 동작해야 합니다.
- SCN-004 fixed/free input/draft flow를 SCN-001 linkage 작업과 섞지 마세요.
- SCN-001 document draft는 아직 열지 않습니다.
- Step 3 full retention lifecycle은 아직 열지 않습니다.
- hard delete, artifact physical deletion/file purge, retention lifecycle, GCS lifecycle, audit/export, undo/restore, auth persistence changes, account deletion/access-control, orphan cleanup은 후속 정책 영역입니다.
- SCN-005는 현재 frontend preset UI에서 제외되어 있고, 후속 확장 후보로만 유지합니다.
- `data/legalize-kr/` 및 `backend/data/law_chunks/`는 직접 수정하지 않습니다.

현재 frontend presentation preset:
- Source of truth: `frontend/src/lib/scenarioPresets.ts`
- Fixed answer fixture: `frontend/src/lib/scenarioPresetAnswers.json`
- `SCN-001-BRIDGE-DEMO`
  - scenarioId: SCN-001
  - supportsDraft: false
  - Before/Bridge handoff 설명용 answer-only preset
  - fixed/live 여부와 관계없이 문서 초안 선택 UI를 열지 않음
- `SCN-004-DEMO-FREEZE`
  - scenarioId: SCN-004
  - supportsDraft: true
  - main demo / document draft freeze용 preset
  - fixed/live 여부와 관계없이 SCN-004 draft eligibility 적용
- SCN-005
  - 현재 frontend UI preset에서 제외
  - 후속 확장 후보로만 유지

중요한 구분:
- `eval/scenario_demo_question_sets_v1.json`은 scenario smoke/eval 질문 세트입니다.
- eval id와 presentation-local preset id를 혼용하지 마세요.
- presentation fixed fixture는 데모 안정성을 위한 고정 응답입니다.
- eval answer evidence report는 live retrieval/answer 품질 검증 산출물입니다.

Phase 7E live smoke 결과:
- SCN-004 exact preset:
  - `/api/v1/answer` 호출 없음
  - `/after/result` 도달
  - draft choice visible
- SCN-004 modified/free input:
  - public `/api/v1/answer`
  - Authorization ABSENT
  - `/after/result` 도달
- SCN-001 checked Bridge handoff:
  - protected `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`
  - Authorization PRESENT
  - public `/api/v1/answer` 호출 없음
  - `/after/result` 도달
  - draft CTA/document selection hidden
  - artifact linkage row has `user_id` NOT NULL and `source_bridge_run_id` NOT NULL
- SCN-001 all-unchecked Bridge handoff:
  - public `POST /api/v1/answer`
  - Authorization ABSENT
  - sticky `answer_origin = "bridge_handoff"`
  - result answer-only / draft disabled
  - public artifact linkage row has `user_id` NULL and `source_bridge_run_id` NULL
- Evidence hygiene maintained:
  - no secret value, token, real Firebase uid, real email, real provider subject, raw query, full answer body, real bridge id, or artifact body recorded in docs.

Phase 8 verification 결과:
- DB readiness: PASS.
- `bash scripts/demo_preflight.sh`: PASS.
- SCN-004 exact preset: PASS; `/api/v1/answer` call NO; result reached YES; draft choices visible YES.
- SCN-004 draft smoke: PASS; `/api/v1/documents/draft` call YES; `rendered_text` visible YES; copy button clipboard write YES; `window.print()` called YES.
- SCN-004 modified/free input: PASS; public `/api/v1/answer` call YES; Authorization ABSENT; result reached YES.
- SCN-001 checked Bridge browser replay: BLOCKED in Codex headless only because interactive Firebase Google popup login + in-memory auth state were unavailable. Do not treat this as the latest logged-in auth gate/history result; Post-Phase 8 actual browser logged-in smoke below is the newer PASS evidence for that scope.
- SCN-001 all-unchecked Bridge browser replay: BLOCKED in Codex headless for the same auth/session reason. Do not treat this as the latest logged-in auth gate/history result; Post-Phase 8 actual browser logged-in smoke below is the newer PASS evidence for that scope.
- Sanitized DB linkage inventory: protected linked rows PRESENT; public unlinked rows PRESENT; mixed linkage rows ABSENT.
- Phase 8 evidence hygiene maintained: no token, Firebase uid, email, provider_subject, raw query, full answer body, real bridge id, or artifact body recorded.

Post-Phase 8 runtime caveats:
- Codex headless 환경에서는 interactive Firebase Google popup + `inMemoryPersistence` 때문에 logged-in live smoke가 제한됩니다.
- 실제 사용자 브라우저 logged-in smoke는 PASS 확인됐습니다:
  - `/api/v1/auth/me`: HTTP 200, `logged_in=true`
  - main Before CTA -> `/before`: PASS
  - `/before` history endpoints Authorization: PRESENT, previous 401 not reproduced
  - read-only history render: PASS
  - console/network auth error: NO after fix
- Step 3 MVP soft-delete browser smoke도 PASS 확인됐습니다:
  - logged-in history load: PASS
  - delete UI visible: PASS
  - confirm/cancel: PASS
  - DELETE request Authorization: PRESENT
  - item disappears from history after confirm: PASS
  - Before delete hides/removes linked Bridge visible path: PASS
  - Before/Bridge count mismatch: expected because Bridge is created only after explicit handoff
  - refresh logout: expected because Firebase Auth MVP uses `inMemoryPersistence`
  - session extension: NOT changed for MVP
  - SCN-004 freeze impact: NO
- 민감값 기록 없이 presence/PASS/PRESENT 수준으로만 evidence를 남깁니다.
- OCR provider 429는 frontend friendly message로 처리됐지만, backend retry/backoff/hard-timeout은 아직 별도 runtime hardening 후보입니다.

SCN-004 freeze 기준:
- `SCN-004-DEMO-FREEZE` exact preset path는 `/api/v1/answer`를 호출하지 않고 fixed `AnswerResponse` fixture를 사용합니다.
- fixed answer:
  - cited_articles=6
  - grounded_context_ids=[1, 2, 3, 5, 10, 4]
  - retrieval_total=10
  - model_name=gemini-2.5-flash
- wage complaint draft:
  - document_type=labor_office_wage_complaint
  - cited_articles=2
  - source_context_ids=[5, 10]
  - missing_legal_basis=[]
- unfair dismissal brief draft:
  - document_type=labor_commission_unfair_dismissal_brief
  - cited_articles=4
  - source_context_ids=[1, 2, 3, 4]
  - missing_legal_basis=[]
- frontend flow:
  - `/after -> /after/result -> /after/intake -> /after/draft` 통과
  - copy 통과
  - print는 headless에서 `window.print()` 호출 검증, 실제 OS dialog는 발표 브라우저에서 육안 확인 권장
  - direct URL guard 통과:
    - `/after/result` state 없음 -> `/after`
    - `/after/intake` state 없음 -> `/after`
    - `/after/draft` state 없음 -> `/after`

SCN-001 protected Bridge answer routing 기준:
- Checked Bridge handoff submit은 primary Bridge item의 protected answer endpoint를 호출합니다.
- Protected Bridge answer request는 Firebase auth가 필요한 SCN-001 endpoint에만 auth header를 붙입니다.
- Public `fetchAnswer`와 `fetchDraft`에는 auth header를 자동 첨부하지 않습니다.
- All-unchecked Bridge handoff는 public `/api/v1/answer`를 사용하고, auth header를 붙이지 않습니다.
- Bridge handoff screen submission은 all unchecked라도 sticky `answer_origin = "bridge_handoff"`를 유지합니다.
- Bridge-origin result는 항상 answer-only / draft disabled입니다.
- Regular draft behavior는 direct `/after` 진입 또는 reset/re-entry가 필요합니다.
- raw `after_query_seed`는 public answer query 또는 protected bridge answer query에 넣지 않습니다.
- Bridge-origin answer query는 displayed safe subset plus user question만 사용합니다.
- MVP provenance는 single primary `source_bridge_run_id`입니다.
- Multi-bridge full provenance는 Post-MVP join table 후보입니다.

Free input 정책:
- preset 없음 + 직접 입력:
  - live `/api/v1/answer`
  - top_k=5
  - ef_search=100
- preset 버튼 클릭 후 문장 수정:
  - live `/api/v1/answer`
  - preset recommendedTopK 사용, 현재 top_k=10
  - ef_search=100
- SCN-004 관련 free input:
  - answer의 cited_articles / grounded chunks 기반 eligibility guard로 문서 타입 표시
  - wage-only -> 임금체불 진정서만
  - dismissal-only -> 부당해고 이유서만
  - combined -> 두 문서 타입
- SCN-001/SCN-005/범위 밖 free input:
  - answer-only
  - SCN-004 문서 선택 UI 미표시

Data / eval / QA 상태:
- Current source of truth: `backend/data/law_chunks/all_chunks.json`
- selected_as_of=2026-04-11
- current live chunk count=1722
- full 60 answer evidence report는 2026-04-20 산출물이며 현재도 MVP acceptable 참고 자료입니다.
- full 60 answer evidence report:
  - summary: `eval/reports/answer_evidence_2026-04-20.summary.md`
  - JSONL: `eval/reports/answer_evidence_2026-04-20.jsonl`
  - PASS: 44
  - PARTIAL: 16
  - FAIL: 0
  - expected point coverage: 135/153
  - citation grounding violation: 0
  - invalid raw/grounded context id: 0
  - timeout/provider/schema error: 0
- PARTIAL 16건은 citation/retrieval/grounding failure가 아니라 expected point 일부 누락입니다.
- full 60 eval은 RAG / answer / retrieval behavior 또는 API response contract 변경이 있을 때만 실행하세요.

발표 전 기본 preflight:
```bash
bash scripts/demo_preflight.sh
```

preflight script는 다음을 확인합니다:
- main == origin/main
- PostgreSQL readiness
- conda env activation
- backend import
- `backend/verify/check_document_draft.py`
- frontend `npm run build`
- WSL Playwright Chromium smoke

preflight script는 하지 않는 일:
- DB start/stop
- backend/frontend dev server start
- process/port kill
- git add/commit/restore
- full 60 eval 실행

수동 서버 실행:
```bash
conda activate law_main_road
uvicorn backend.main:app --reload
```

```bash
cd frontend
npm run dev
```

브라우저 기준 URL:
- http://localhost:5090
- http://127.0.0.1:5090은 Next dev HMR cross-origin warning 이력이 있어 QA 기준 URL로 쓰지 않음

새 세션에서 먼저 해야 할 일:
1. `git status -sb`, `git status --short`, `git log --oneline -12`로 origin/main과 clean/dirty 상태를 확인하세요.
2. `AGENTS.md`, `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`를 읽고 freeze/금지 범위를 확인하세요.
3. `docs/planning/19_scn001_auth_integration_status.md`를 읽고 Phase 7C~7E 완료와 sanitized live smoke evidence를 확인하세요.
4. `docs/planning/22_post_phase8_scn001_extension_roadmap.md`를 읽고 Post-Phase 8 완료/pending step을 확인하세요.
5. `docs/planning/21_scn001_phase7_after_artifact_linkage_plan.md`를 읽고 Phase 7A~7E contract와 future scope를 확인하세요.
6. `docs/ops/README.md`를 읽고 local env inventory, smoke, secret hygiene, residual runtime risk를 확인하세요.
7. 발표/제출 전이면 `README.md`, `docs/demo/demo_scenario.md`, `docs/demo/presentation_notes.md`, `eval/README.md`, `eval/reports/answer_evidence_2026-04-20.summary.md`도 확인하세요.

절대 하지 말 것:
- SCN-004 freeze 기준을 흔드는 변경 금지.
- SCN-001 document draft를 열지 마세요.
- SCN-005를 바로 구현하지 마세요. 사용자가 명시적으로 요청하면 별도 패치로만 진행하세요.
- `/bridge`, Recovery 본 구현 금지.
- Step 2B-3 또는 Step 3 full retention lifecycle implementation을 현재 상태에서 바로 열지 마세요.
- Step 3 MVP soft-delete slice는 completed 상태입니다. 추가 deletion/history retention 구현은 열지 마세요.
- full retention lifecycle은 policy review 수준으로만 허용합니다.
- artifact retrieval UI/API, artifact body retrieval, signed URL, file streaming, inline body는 아직 열지 마세요.
- provider_timeout/OCR retry hardening을 UI polish와 섞지 마세요.
- backend API contract 임의 변경 금지.
- `/api/v1/answer` public contract 변경 금지.
- `/api/v1/documents/draft` contract 변경 금지.
- hard delete/file purge 구현 금지.
- artifact physical deletion 구현 금지.
- undo/restore 구현 금지.
- auth persistence 변경 금지.
- account deletion/access-control 구현 금지.
- orphan cleanup 구현 금지.
- retrieval/answer behavior 변경은 regression/evidence 계획 없이 금지.
- `scripts/demo_preflight.sh`에 full 60 eval 추가 금지.
- `data/legalize-kr/` 수정 금지.
- `backend/data/law_chunks/` 직접 수정 금지.
- raw user_statement, answer_response, case_intake, draft_response, raw flow payload, auth state, token을 Web Storage에 저장 금지.
- Firebase uid, provider_subject, email, token을 business table, backend response, UI, docs, logs, commits, issues, chat에 노출 금지.
- secret 값, real Firebase uid, real email, real bridge id, raw query, full answer body, artifact body를 문서에 쓰지 마세요.
- 문제가 발견되면 코드 수정 전에 실패 지점, 재현 절차, 원인을 먼저 보고하세요.
- 파일 수정이 필요하면 먼저 수정 범위를 보고하세요.

다음 실질 후보 작업 우선순위:
1. audit/status policy review
   - Step 3 full retention lifecycle policy review와 artifact access/retrieval policy review 다음의 문서-only target
   - 구현이 아니라 `docs/planning/22_post_phase8_scn001_extension_roadmap.md`의 audit/status 정책만 정리
   - Step 3 MVP soft-delete slice completed 상태를 유지
   - DB schema/migration 확정, 추가 deletion API 구현 프롬프트 작성, account history access-control 구현은 열지 않음
   - hard delete/file purge implementation, GCS lifecycle job, audit export endpoint, restore endpoint, account deletion UX/API, orphan cleanup job은 열지 않음
2. history status pill color polish
   - read-only history UI의 status pill 색상/상태 표시만 작은 patch로 다룸
   - deletion, retention, artifact body 노출과 섞지 않음
3. main Before gate semantic/a11y polish
   - Step 1.6 구현을 유지하면서 semantic/a11y만 필요한 경우 최소 보강
   - SCN-004 `/after` login-free path는 건드리지 않음
4. submission/final demo preflight 재실행 및 presentation rehearsal
   - `bash scripts/demo_preflight.sh`
   - 필요 시 backend/frontend 수동 실행 후 `http://localhost:5090/after`에서 SCN-004-DEMO-FREEZE dry-run
   - SCN-004 exact preset no public answer call, result, draft choices 확인
   - SCN-004 modified/free input public answer without auth 확인
   - SCN-001 checked Bridge protected answer routing 확인
   - SCN-001 all-unchecked Bridge public answer + sticky bridge_handoff 확인
5. optional Phase 8 regression/manual evidence polish
   - 이미 PASS한 Phase 7E evidence를 깨지 않는 범위에서만 보강
   - 필요한 경우 negative auth smoke나 sanitized checklist를 추가
6. provider_timeout / OCR retry/backoff/hard-timeout hardening
   - 별도 runtime hardening 후보
   - SCN-004 freeze와 public contract 보호를 전제로 분리 작업
7. Step 2B-3 또는 full retention lifecycle implementation
   - Step 2B-3와 Step 3 full retention lifecycle implementation은 아직 열지 않음
   - Step 3 MVP soft-delete slice completed 상태를 유지하고, 위 1번의 policy/design doc review 수준으로만 허용
   - hard delete, file purge, artifact physical deletion, auth persistence changes, undo/restore, account deletion/access-control, orphan cleanup을 열지 않음
8. artifact retention/deletion/account history access control
   - Post-MVP
   - artifact retrieval UI/API, retention policy, account history access control은 별도 설계 후 진행
9. SCN-001 document draft
   - 아직 열지 않음
   - Bridge/query matching guard 설계 후 별도 큰 phase로만 검토
   - SCN-004 freeze 기준을 유지한 별도 설계/패치가 필요

마지막 보고 형식:
- git 상태
- 읽은 문서
- 실행한 검증과 결과
- SCN-004 freeze 영향 여부
- 수정한 파일
- 커밋/푸시 여부
- sensitive-pattern scan 결과
- 남은 리스크 또는 다음 권장 작업
```

## 참고

이 프롬프트는 현재 main 기준 새 세션을 빠르게 시작하기 위한 복원 메모다.
MVP 제출 기준으로는 SCN-004 freeze, SCN-001 protected Bridge answer routing,
Phase 7E live smoke PASS, Phase 8 regression/preflight/SCN-004 rehearsal PASS,
sanitized evidence hygiene, full 60 eval evidence, demo preflight PASS가 정리된 상태다.
Post-Phase 8 Step 1, 1.5, OCR 429 friendly message, Step 2A, Step 2B-1,
Step 2B-2, Step 1.6까지 `git log` 기준 완료 상태다. 2026-04-27 기준 실제
브라우저 logged-in smoke PASS와 backend-verified auth gate sync hardening도
확인됐다. Step 3 MVP soft-delete slice completed 상태이며, Step 3 full retention
lifecycle policy review와 artifact access/retrieval policy review는 문서화됐지만
implementation은 NOT opened 상태다. 다음 target은 audit/status policy review다.
SCN-001 document draft도 아직 열지 않는다.
