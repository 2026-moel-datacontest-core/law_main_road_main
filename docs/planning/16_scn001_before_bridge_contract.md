# SCN-001 Before-Bridge-After Contract Draft

기준일: `2026-04-22`

이 문서는 현재 repo 코드에 포함된 Before / Bridge / After 구현과 mock / preset / fixture를 직접 조사해, `SCN-001` Before-Bridge-After 연결을 위한 `BeforeHandoffDTO` 및 `BridgeOutputDTO` 초안을 정리한다. 구현 지시서가 아니라 구현 전 contract 고정용 draft이며, 기능 코드 수정, DB migration, OAuth 구현, 서버 실행, build, eval은 이 문서 범위가 아니다.

## 1. Purpose

- 현재 코드 기준 `SCN-001` Before-Bridge-After 연결 초안 contract를 정리한다.
- 구현 전에 `BeforeHandoffDTO`, `BridgeOutputDTO`, After handoff seed의 field boundary를 고정한다.
- `SCN-004` demo freeze를 깨지 않도록 `/api/v1/answer`와 `/api/v1/documents/draft` contract 변경 없이 연결 방식을 검토한다.
- 원문 계약서, OCR 전문, 사용자 진술 전문, raw answer/draft payload를 handoff DTO에 넣지 않는 privacy-first 기준을 명시한다.

## 2. Source Review

| file/path | role | status | contract relevance |
|---|---|---|---|
| `AGENTS.md` | repo 작업 규칙, SCN-004 freeze, SCN-001/004 preset 정책 | doc-only | `SCN-001-BRIDGE-DEMO`는 answer-only, `SCN-004-DEMO-FREEZE`는 draft freeze path임을 고정 |
| `CLAUDE.md` | 전역 프로젝트 상태와 auth/privacy guardrail | doc-only | 최소 로그인은 SCN-001 연결 초안에만 허용, SCN-004 login-free 유지 |
| `backend/CLAUDE.md` | backend API / document draft 규칙 | doc-only | `/api/v1/answer`, `/api/v1/documents/draft` contract 임의 변경 금지 |
| `frontend/CLAUDE.md` | frontend scope와 Web Storage 금지 | doc-only | raw `user_statement`, `answer_response`, `case_intake`, `draft_response` Web Storage 저장 금지 |
| `docs/planning/15_scn001_account_auth_spec.md` | account/auth 최소 linkage 후보 | doc-only | Firebase uid as `provider_subject`, `BeforeHandoffDTO`, `bridge_runs`, `after_query_seed`, account linkage의 상위 기준 |
| `docs/planning/17_google_oauth_scn001_implementation_plan.md` | Firebase Auth MVP path 기준 | doc-only | Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase ID token verification을 MVP path로 고정. Direct Google OAuth는 Alternative/Fallback |
| `docs/product/before_flow.md` | Before 제품 흐름 | doc-only | Bridge로 넘길 최소 요약 후보를 설명 |
| `docs/product/bridge_flow.md` | Bridge 제품 흐름 | doc-only | `/bridge` route 없음, Bridge는 후속 구현이라고 명시 |
| `docs/planning/12_scenario_expansion_plan.md` | SCN-001 시나리오와 corpus 커버 | doc-only | SCN-001 Bridge narrative와 핵심 조문 후보 제공 |
| `docs/planning/14_frontend_implementation_handoff.md` | SCN-004 After freeze 기준 | doc-only | fixed preset, live answer, draft eligibility guard 기준 |
| `backend/main.py` | main FastAPI app, Before sub-app mount | implemented | `/api/v1/before` mount 확인. Bridge mount 없음 |
| `backend/app/before_stack/main.py` | Before review API / job API / result aggregation | implemented | Before full `ReviewResult` top-level fields의 canonical source |
| `backend/app/before_stack/core/settings.py` | Before env/path/source 설정 | implemented | Before artifacts root, law source, provider env fallback. secret 값 출력 대상 아님 |
| `backend/app/before_stack/services/job_store.py` | Before job DB serialization | implemented | `job_id`, `status`, `run_directory`, `result` linkage source |
| `backend/app/before_stack/services/explanation_builder.py` | user-facing Before explanation builder | implemented | `user_explanation.*` field source |
| `backend/app/before_stack/services/rule_validator.py` | 수치/규칙 검증 | implemented | `rule_check` source. law_refs 추출 후보 |
| `backend/app/before_stack/services/content_checker.py` | LLM content issue classification | implemented | `content_check` source. issue/risk/law_ref 후보 |
| `backend/app/before_stack/services/law_retriever.py` | extra clause law lookup | implemented | extra clause `law_ref` 후보 |
| `backend/app/before_stack/services/law_chunk_cache.py` | Before law chunk source adapter | implemented | Before 법령 조회 source. DTO에는 chunk 전문 미포함 |
| `backend/app/before_stack/services/ocr_pipeline.py` | OCR and structured extraction | implemented | `ocr_snapshot`, OCR metadata source. DTO에는 OCR 전문 미포함 |
| `backend/app/before_stack/services/llm_client.py` | Vertex/Ollama client abstraction | implemented | Before content review provider. contract DTO 직접 노출 없음 |
| `backend/app/before_stack/services/section_comparator.py` | standard section compare | implemented | `section_check` source |
| `backend/app/before_stack/services/accessibility_*` | disability/accessibility recommendation | implemented | SCN-001 handoff에는 직접 포함하지 않음 |
| `backend/app/models/before_review_job.py` | `before_review_jobs` ORM model | implemented | `job_id`, `result JSONB`, `run_directory` linkage source. `user_id` 없음 |
| `frontend/src/app/before/page.tsx` | Before route page | implemented | job polling, mock path, frontend consumed fields 확인 |
| `frontend/src/lib/before-api.ts` | Before API adapter and fixture mapper | implemented | backend `user_explanation`을 flat frontend fields로 map |
| `frontend/src/types/before.ts` | Before frontend type | implemented | frontend-consumed `BeforeReviewResult` shape |
| `frontend/src/components/before/*` | Before rendering panels | implemented | 실제 화면 사용 field 확인 |
| `frontend/src/lib/fixtures/beforeMockReviewSen*.json` | Before demo fixture | fixture | frontend shape fixture. backend full fields 일부 없음 |
| `frontend/src/lib/scenarioPresets.ts` | After preset metadata | preset | `SCN-001-BRIDGE-DEMO`, `SCN-004-DEMO-FREEZE`, `supportsDraft`, `recommendedTopK` |
| `frontend/src/lib/scenarioPresetAnswers.json` | fixed `AnswerResponse` fixture | fixture | Bridge-like fixed answer shape is normal `AnswerResponse` |
| `backend/app/services/answer_generation.py` | grounded answer generation and postprocess | implemented | SCN-001 foreign worker query/key point/citation companion logic. Bridge service 아님 |
| `frontend/src/app/after/*` | After 4-route flow | implemented | Bridge seed가 들어갈 수 있는 textarea/query boundary |
| `frontend/src/context/FlowContext.tsx` | After memory state reducer | implemented | `user_statement`, `selected_preset_id`, answer/draft state. Web Storage 아님 |
| `frontend/src/types/flow.ts` | After flow state/action types | implemented | selected preset and answer/draft state boundary |
| `frontend/src/types/api.ts` | frontend Answer/Draft API types | implemented | frontend `/api/v1/answer`, `/api/v1/documents/draft` shape |
| `frontend/src/lib/api.ts` | After API adapter | implemented | `fetchAnswer`, `buildLegalBasis`, `buildCaseIntake`, `fetchDraft` |
| `frontend/src/lib/scn004DraftEligibility.ts` | SCN-004 draft guard | implemented | SCN-001 answer-only 유지, SCN-004 draft guard 유지 |
| `backend/app/schemas/answer.py` | backend answer schema | implemented | `/api/v1/answer` public contract |
| `backend/app/schemas/document_draft.py` | backend draft schema | implemented | `/api/v1/documents/draft` public contract. enum에는 SCN-001 후보가 있으나 frontend는 SCN-004만 전송 |
| `backend/app/services/after_artifact_store.py` | answer/draft artifact persistence | implemented | `query_hash`, local artifacts. user/bridge linkage 없음 |
| `backend/app/models/after_artifact_run.py` | `after_artifact_runs` ORM model | implemented | `run_id`, `stage`, `query_hash`, `document_type`, `artifact_root`; `user_id`/`source_bridge_run_id` 없음 |

## 3. Before Current Output Contract

`backend/app/before_stack/main.py`의 `aggregate_results()`와 `run_contract_review_pipeline()` 기준 top-level fields:

| field | type/category 추정 | frontend 사용 여부 | handoff 사용 추천 여부 | privacy risk |
|---|---|---:|---:|---|
| `review_id` | string UUID | Yes | Yes | Low. 내부 review 식별자 |
| `reviewed_at` | ISO timestamp | Yes | Yes | Low |
| `contract_info` | object: `type`, `employer`, `employee`, `start_date` | Yes | Partial | Medium. employer/employee가 실명일 수 있어 summary 수준만 권장 |
| `scenario_tags` | string[] | No | Yes | Low. `foreign_worker`, `custom_form`, `dormitory` 등 handoff routing에 적합 |
| `ocr_snapshot` | object: OCR-derived metadata and critical field snippets | No | No raw; derive only | High. evidence excerpt와 structured/raw field 포함 가능 |
| `ocr_conflicts` | array of OCR conflict objects | No | No by default | Medium. 필드 값 포함 가능 |
| `ocr_warnings` | array of warning objects | Yes | Partial | Medium. UI 경고에는 사용하되 handoff에는 count/field label 수준 권장 |
| `overall_result` | enum-like `PASS/WARNING/VIOLATION` | Yes | Yes | Low |
| `overall_severity` | enum-like `NONE/LOW/MEDIUM/HIGH/CRITICAL` | Yes | Yes | Low |
| `section_check` | object: `missing`, `extra`, `mismatches` | No | Partial-derived | Medium. extra clauses may include contract text |
| `rule_check` | object keyed by rule name | Yes fallback | Yes-derived | Medium. messages can include wage/time facts |
| `content_check` | object keyed by section number | No | Yes-derived | Medium/High. issue description and source text may expose facts |
| `risk_summary` | object keyed by risk bucket | No | Yes | Low/Medium. title/issue_type/law_ref/short description 중심으로 safe |
| `summary` | string | Yes | Yes | Low/Medium. short issue summary |
| `user_explanation` | object with user-facing summary/action/evidence/markdown | Yes via flattening | Yes-derived | Medium. `evidence.excerpt` can include contract text |
| `run_directory` | local filesystem path string | mapped, not rendered | Yes as internal ref only | Medium. internal path; external 노출 금지 |
| `uploaded_files` | array `{name,url}` | mapped, not currently rendered in result panel | No public handoff; internal artifact ref only | High. filename and URL can expose sensitive file metadata |

Notes:

- backend full result is richer than frontend mock fixture. The fixture files usually omit `scenario_tags`, `ocr_snapshot`, `ocr_conflicts`, `section_check`, `content_check`, and `risk_summary`.
- `BeforeHandoffDTO` should use backend full result as canonical input when available, but must degrade to frontend-consumed fields for mock/presentation flows.

## 4. Before Frontend Consumed Fields

`frontend/src/lib/before-api.ts` maps backend `BeforeApiReviewResult` into frontend `BeforeReviewResult`:

| frontend field | source | actual usage |
|---|---|---|
| `review_id` | `review.review_id` | type/state only, not visibly rendered in current `ResultPanel` |
| `reviewed_at` | `review.reviewed_at` | overview card as localized review time |
| `run_directory` | `review.run_directory` | preserved in type/state, not visibly rendered |
| `uploaded_files` | `review.uploaded_files ?? []` | preserved in type/state, mock path clears it; not visibly rendered |
| `contract_info.type` | `review.contract_info.type` | overview card |
| `contract_info.employer` | `review.contract_info.employer` | result info row |
| `contract_info.employee` | `review.contract_info.employee` | result info row |
| `contract_info.start_date` | `review.contract_info.start_date` | result info row |
| `overall_result` | `review.overall_result` | badge and overview |
| `overall_severity` | `review.overall_severity` | badge and overview |
| `summary` | `review.summary` | contract info row |
| `rule_check` | `review.rule_check ?? {}` | issue fallback when `important_points` is empty |
| `ocr_warnings` | `review.ocr_warnings ?? []` | warning panel |
| `headline` | `review.user_explanation.headline` | result hero title |
| `plain_language_summary` | `review.user_explanation.plain_language_summary` | result hero body |
| `overall_assessment` | `review.user_explanation.overall_assessment` | summary notes |
| `important_points` | `review.user_explanation.important_points` | primary issue cards |
| `recommended_actions` | `review.user_explanation.recommended_actions` | action list |
| `evidence` | `review.user_explanation.evidence` | evidence toggle; contains excerpts |

`user_explanation` 하위 field 기준:

| field | source builder | frontend role | handoff recommendation |
|---|---|---|---|
| `headline` | `_headline()` | top banner | Optional user-visible summary title |
| `plain_language_summary` | `_build_plain_summary()` | main summary | Strong candidate for `contract_summary` fallback |
| `overall_assessment` | `_build_overall_assessment()` | summary cards | Candidate for issue summary, not raw facts |
| `important_points` | rule/content points | issue cards | Strong candidate for `detected_issues` and `law_refs` |
| `recommended_actions` | `_build_actions()` | checklist | Strong candidate for `recommended_next_actions` |
| `evidence` | `_build_evidence()` | collapsed evidence excerpts | Candidate for `evidence_items_summary`; excerpt 전문은 원칙적으로 줄이거나 제외 |
| `markdown` | `_build_markdown()` | saved artifact only | Do not include in handoff DTO by default |

## 5. Bridge Current Code Status

- 독립 Bridge route/API/model: 없음. `find backend/app -... | rg 'bridge|handoff|handover'`에서 backend Bridge file은 확인되지 않았다.
- frontend route: 없음. `frontend/src/app`에는 `/before`, `/after`만 있고 `/bridge` route는 없다.
- `SCN-001-BRIDGE-DEMO` preset: 있음. `frontend/src/lib/scenarioPresets.ts`에 `scenarioId: "SCN-001"`, `recommendedTopK: 10`, `supportsDraft: false`로 정의되어 있다.
- `scenarioPresetAnswers.json` Bridge-like fixed answer: `SCN-001-BRIDGE-DEMO` key의 fixed fixture는 일반 `AnswerResponse` shape다.
  - top-level keys: `query`, `answer`, `key_points`, `cautions`, `cited_articles`, `grounded_context_ids`, `retrieved_chunks`, `retrieval_total`, `model_name`
  - `cited_articles` 8개, `grounded_context_ids` 8개, `retrieved_chunks` 9개
  - `retrieved_chunks` items include `context_id`, `chunk_id`, `citation_label`, `law_name`, `article_no`, `article_title`, `paragraph_no`, `content`, `similarity`, `tier`, `structure_path`
- `answer_generation.py`의 SCN-001 관련 보강 로직은 Bridge service가 아니다.
  - `is_foreign_worker_full_bridge_query()`는 외국인 + 계약/서면 + 기숙사/숙소 + 차별/폭언 + 사업장 변경 marker가 모두 있는 query를 감지한다.
  - `build_foreign_worker_full_bridge_key_points()`는 grounded chunks가 충분할 때 표준계약, 기숙사 정보, 차별금지, 사업장 변경 관련 key point를 보강한다.
  - postprocess는 관련 citation companion을 추가하거나 불완전 answer를 보정한다.
  - 이 로직은 `/api/v1/answer` 내부 answer quality 보강이며, `BeforeHandoffDTO`나 `BridgeOutputDTO`를 저장/반환하지 않는다.

## 6. Proposed BeforeHandoffDTO

JSON-like shape:

```json
{
  "before_review_job_id": "string | null",
  "review_id": "string",
  "source_run_directory": "string | null",
  "scenario_id": "SCN-001",
  "scenario_tags": ["string"],
  "contract_summary": "string",
  "overall_result": "PASS | WARNING | VIOLATION",
  "overall_severity": "NONE | LOW | MEDIUM | HIGH | CRITICAL",
  "risk_tags": ["string"],
  "detected_issues": [
    {
      "title": "string",
      "severity": "NONE | LOW | MEDIUM | HIGH | CRITICAL",
      "law_ref": "string | null",
      "description": "string"
    }
  ],
  "law_refs": ["string"],
  "recommended_next_actions": ["string"],
  "evidence_items_summary": [
    {
      "title": "string",
      "summary": "string"
    }
  ],
  "artifact_refs": [
    {
      "kind": "before_review_job | before_run_directory | before_review_result",
      "ref": "string"
    }
  ],
  "created_at": "timestamp"
}
```

| field | source field | required | 저장 가능 여부 | 개인정보 주의점 | fallback |
|---|---|---:|---:|---|---|
| `before_review_job_id` | job API `job_id` | No | Yes | internal id only | `null` for direct `/review` or mock |
| `review_id` | `review_id` | Yes | Yes | internal id only | generate adapter id only if fixture lacks it |
| `source_run_directory` | `run_directory` | No | Internal only | local path 노출 금지 | `null` |
| `scenario_id` | adapter constant | Yes | Yes | Low | `SCN-001` |
| `scenario_tags` | `scenario_tags` | No | Yes | Low | infer from `contract_info.type`, `risk_summary`, `important_points` |
| `contract_summary` | `summary` or `user_explanation.plain_language_summary` | Yes | Yes, short text only | 실명/회사명 포함 가능성 | redact/minimize or use generic summary |
| `overall_result` | `overall_result` | Yes | Yes | Low | `WARNING` if unknown |
| `overall_severity` | `overall_severity` | Yes | Yes | Low | `MEDIUM` if unknown |
| `risk_tags` | `scenario_tags`, `risk_summary`, `rule_check[*].severity` | No | Yes | Low/Medium | issue_type/risk_bucket labels |
| `detected_issues` | `user_explanation.important_points`, `risk_summary`, `rule_check`, `content_check` | No | Yes, summarized | descriptions can expose facts | title/severity/law_ref only if needed |
| `law_refs` | `law_ref` fields and normalized labels | No | Yes | Low | empty array |
| `recommended_next_actions` | `user_explanation.recommended_actions` | No | Yes | Medium if facts included | generic actions from issue types |
| `evidence_items_summary` | `user_explanation.evidence` | No | Minimal only | excerpt may include raw contract text | title only or short paraphrase |
| `artifact_refs` | `job_id`, `run_directory`, `review_id` | No | Internal only | no public URL, no filename by default | review id ref |
| `created_at` | adapter creation time or `reviewed_at` | Yes | Yes | Low | current timestamp |

Notes:

- raw `contract_info.employer`, raw `contract_info.employee`는 의도적으로 `BeforeHandoffDTO`에서 제외하고, 필요 시 개인정보를 최소화한 `contract_summary`로 대체한다.

## 7. Field Extraction Rules

Draft extraction order:

1. `contract_summary`
   - Prefer `summary` when it is short and does not expose unnecessary names.
   - Else use `user_explanation.plain_language_summary`.
   - If both are missing, synthesize from `overall_result`, `overall_severity`, and top `detected_issues`.
2. `risk_tags`
   - Start with `scenario_tags`.
   - Add `risk_summary` bucket names when non-empty: `immediate_illegal`, `mandatory_missing`, `deduction_risk`, `enforceability_risk`.
   - Add `issue_type` labels from `risk_summary`, `content_check.issues`, and `user_explanation.important_points`.
   - Add severity-derived tags for `rule_check` entries with `HIGH` or `CRITICAL`.
3. `detected_issues`
   - Prefer `user_explanation.important_points` because it is already user-facing and compact.
   - Add `risk_summary` items not already covered by `title + law_ref`.
   - Use `rule_check` and `content_check` only as fallback/source enrichment, summarized to title/severity/law_ref/description.
4. `law_refs`
   - Normalize from `detected_issues[*].law_ref`, `risk_summary[*].law_ref`, `rule_check[*].law_ref`, `content_check[*].issues[*].law_ref`, and `user_explanation.important_points[*].law_ref`.
   - Keep label-level values such as `근로기준법 제17조` or `외국인근로자의 고용 등에 관한 법률 제25조`.
   - Do not include retrieved chunk full text.
5. `recommended_next_actions`
   - Prefer `user_explanation.recommended_actions`.
   - If missing, derive generic actions from risk tags, such as standard form check, dormitory written disclosure request, or legal review.
6. `evidence_items_summary`
   - Prefer `user_explanation.evidence`.
   - Store `title` and a short paraphrased `summary`; avoid storing full `excerpt` by default.
   - Do not include OCR image, uploaded file body, or raw contract clause text.
7. `artifact_refs`
   - Use only internal references: `before_review_job_id`, `review_id`, and internal `source_run_directory` when server-side access control exists.
   - Do not use `uploaded_files.url` as a user-visible durable handoff value.

Exclusion rule:

- `ocr_conflicts`는 field value와 OCR-derived snippet을 포함할 수 있는 medium privacy risk field이므로 `BeforeHandoffDTO`에서 제외한다. 필요한 경우에도 conflict count 또는 field label 수준의 요약만 별도 검토한다.

## 8. Proposed BridgeOutputDTO

JSON-like shape:

```json
{
  "bridge_run_id": "string",
  "user_id": "string",
  "before_review_job_id": "string | null",
  "scenario_id": "SCN-001",
  "source_scenario": "before_review | preset | mock",
  "preset_id": "SCN-001-BRIDGE-DEMO | null",
  "user_visible_summary": "string",
  "issue_categories": ["string"],
  "risk_tags": ["string"],
  "detected_issues": [
    {
      "title": "string",
      "severity": "NONE | LOW | MEDIUM | HIGH | CRITICAL",
      "law_ref": "string | null",
      "description": "string"
    }
  ],
  "law_refs": ["string"],
  "recommended_next_actions": ["string"],
  "after_query_seed": "string | null",
  "after_query_seed_hash": "string",
  "artifact_refs": [
    {
      "kind": "before_review_job | bridge_run | after_answer",
      "ref": "string"
    }
  ],
  "created_at": "timestamp"
}
```

| field | source | required | note |
|---|---|---:|---|
| `bridge_run_id` | new bridge adapter/service | Yes | DB row id or generated in-memory id |
| `user_id` | auth linkage | Yes for SCN-001 protected bridge flow | Firebase uid as `provider_subject`에서 resolve한 internal `users.id`. Firebase uid / Google sub가 아님 |
| `before_review_job_id` | `BeforeHandoffDTO.before_review_job_id` | No | mock/direct review fallback 허용 |
| `scenario_id` | `BeforeHandoffDTO.scenario_id` | Yes | first target `SCN-001` |
| `source_scenario` | adapter | Yes | `before_review`, `preset`, `mock` 중 하나 |
| `preset_id` | preset metadata | No | presentation path는 `SCN-001-BRIDGE-DEMO` 후보 |
| `user_visible_summary` | `contract_summary` + issue summary | Yes | raw facts 과다 포함 금지 |
| `issue_categories` | normalized issue types | No | UI grouping 후보 |
| `risk_tags` | `BeforeHandoffDTO.risk_tags` | No | short labels only |
| `detected_issues` | `BeforeHandoffDTO.detected_issues` | No | summarized only |
| `law_refs` | `BeforeHandoffDTO.law_refs` | No | label-level only |
| `recommended_next_actions` | `BeforeHandoffDTO.recommended_next_actions` | No | next-step guide |
| `after_query_seed` | bridge adapter generated | Transport TBD | raw value는 persistent 저장 금지. Phase 5/6 전에 response direct handoff 또는 short-lived server-side handoff 방식 결정 |
| `after_query_seed_hash` | hash of seed | Yes | raw seed를 저장하지 않는 path의 추적 / 중복 확인용 |
| `artifact_refs` | Before/Bridge internal ids | No | internal only |
| `created_at` | adapter/service time | Yes | timestamp |

주의:

- Bridge는 retrieval 결과를 만들지 않는다.
- `grounded_context_ids`와 `retrieved_chunks`는 Bridge output에 넣지 않는다. After answer에서 `/api/v1/answer`가 새로 생성한다.
- raw `after_query_seed` persistent 저장은 MVP에서 금지한다. exact handoff transport는 Phase 5/6 전에 결정하며, 우선 short-lived handoff 또는 response direct handoff를 검토한다.
- `SCN-001`은 우선 answer-only로 둔다. SCN-001 document draft는 별도 후속 결정 전까지 열지 않는다.

## 9. Bridge -> After Mapping

| BridgeOutputDTO field | After target | mapping rule |
|---|---|---|
| `after_query_seed` | `/after` textarea initial value or `/api/v1/answer` `query` | query seed로만 전달 |
| `preset_id` | `selected_preset_id` | presentation path는 `SCN-001-BRIDGE-DEMO` 후보 |
| `scenario_id` | preset metadata / analytics 후보 | current frontend `CaseIntake.scenario_id`에는 반영하지 않음 |
| `law_refs` | query seed text enrichment | label-level 법령명만 사용 |
| `risk_tags`, `detected_issues` | query seed text enrichment | short user-visible summary로 변환 |
| `artifact_refs` | server-side linkage only | frontend Web Storage 저장 금지 |

Mapping note:

- presentation/demo Bridge path는 `SCN-001-BRIDGE-DEMO` preset 후보를 사용할 수 있지만, real Before review에서 온 handoff는 `preset_id = null`로 두고 After에서 live answer path를 사용해야 한다.

Fixed answer path:

- 사용자가 `/after`에서 `SCN-001-BRIDGE-DEMO` preset exact query를 그대로 제출하면 `frontend/src/lib/scenarioPresetAnswers.json`의 fixed `AnswerResponse`를 사용한다.
- 이 path는 `/api/v1/answer`를 호출하지 않는다.
- `supportsDraft=false`이므로 `/after/result`에서 SCN-004 document type selector가 열리지 않는다.

Live answer path:

- Bridge seed가 preset query와 달라진 경우 또는 non-preset seed로 전달되는 경우, `/api/v1/answer`에 `{ query, top_k, ef_search }`만 보낸다.
- preset modified path는 `top_k=10`, `ef_search=100`을 사용한다.
- free input path는 `top_k=5`, `ef_search=100`을 사용한다.

Contract boundaries:

- `/api/v1/answer` contract 변경 없음.
- `/api/v1/documents/draft` contract 변경 없음.
- `BridgeOutputDTO`는 `/api/v1/documents/draft`의 `legal_basis`를 직접 만들지 않는다.
- SCN-004 draft guard는 유지한다.
- `SCN-004-DEMO-FREEZE`와 SCN-004 eligible free input만 draft flow로 간다.

## 10. Storage / Account Linkage Notes

- users / `provider_subject` 연계는 `docs/planning/15_scn001_account_auth_spec.md`와 `docs/planning/18_scn001_firebase_auth_phase0_decisions.md`를 따른다.
- MVP auth path는 Firebase Auth Google Sign-In + Bearer Firebase ID token + backend Firebase ID token verification이다.
- Firebase Auth MVP path에서 `provider_subject`는 Firebase `uid`를 의미한다.
- Google `sub`는 Direct Google OAuth Alternative/Fallback path에서의 subject로 분리한다.
- MVP path의 `users.auth_provider` 값은 `firebase_google`이다. multi-provider / Future 확장에서는 provider 값 체계가 확장될 수 있다.
- business table에는 Firebase uid / Google sub / email을 직접 저장하지 않고 internal `users.id`만 참조한다.
- `before_review_jobs.user_id`는 nullable 후보이며 현재 model에는 없다. 추가 시 internal `users.id` 참조다.
- `bridge_runs`는 신규 후보이며 현재 구현되어 있지 않다. SCN-001 protected bridge flow에서 `bridge_runs.user_id`는 required internal `users.id` 참조다.
- `SCN-001-BRIDGE-DEMO` presentation preset은 `bridge_runs`를 만들지 않는 answer-only path다. SCN-004 public/login-free flow도 `bridge_runs`를 만들지 않는다.
- `after_artifact_runs.user_id`와 `after_artifact_runs.source_bridge_run_id`는 nullable 후보이며 현재 model에는 없다. `after_artifact_runs.user_id`는 internal `users.id` 참조다.
- 현재 `after_artifact_runs` implemented fields는 `run_id`, `stage`, `status`, `query_hash`, `document_type`, `artifact_root`, `error`, timestamps다.
- 현재 `after_artifact_store.py`는 answer/draft artifact에 raw `user_statement.txt`와 request/response JSON을 저장한다. 계정 이력 UI에 raw artifact를 기본 노출하면 안 된다.
- raw artifact 계정 이력은 기본 노출 금지이며, short summary / `query_hash` / internal artifact refs 중심으로 설계해야 한다.
- Firebase Auth 도입 전 생성된 anonymous artifact는 MVP에서 orphan 상태로 유지한다. retroactive linking은 Post-MVP다.
- Firebase session cookie, Identity Platform OIDC provider, multi-provider linking은 Future/Post-MVP로 둔다.
- Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback로만 둔다.

## 11. Privacy / Security Notes

- 원문 계약서, OCR 전문, 사용자 진술 전문은 `BeforeHandoffDTO` 또는 `BridgeOutputDTO`에 넣지 않는다.
- `artifact_refs`는 내부 참조이며 공개 URL 또는 장기 사용자 식별자로 쓰지 않는다.
- Web Storage에 raw payload 저장 금지:
  - raw `user_statement`
  - raw `answer_response`
  - raw `case_intake`
  - raw `draft_response`
  - raw Before review result / OCR output
- email, phone, token 저장 금지 원칙을 재확인한다.
  - 전화번호 직접 입력 수집 금지
  - email은 primary identifier 금지
  - email은 nullable display/contact 후보일 뿐 primary key가 아님
  - OAuth access token / refresh token 장기 저장 금지
- Firebase ID token raw value는 장기 저장하거나 로그에 남기지 않는다.
- Firebase uid / Google sub / provider_subject / email은 DTO, backend response, business table에 직접 노출하지 않는다.
- `contract_info.employee`, `contract_info.employer`, `uploaded_files.name`, `ocr_snapshot.*.evidence`, `user_explanation.evidence.excerpt`는 개인정보 또는 민감 사업장 정보를 포함할 수 있으므로 DTO에는 최소화/요약/내부 참조만 허용한다.

## 12. Open Questions / Decisions

- Before canonical source: backend full result를 canonical로 할지, frontend consumed fields만을 stable contract로 볼지 결정 필요.
- mock/preset path에서 backend full fields가 없을 때 `scenario_tags`, `risk_summary`, `law_refs`를 어느 수준까지 infer할지 결정 필요.
- `law_refs` 정규화 방식: full citation label 유지 vs 법령명+조문번호 label로 축약.
- SCN-001 protected Bridge는 backend route + service 기준으로 구현한다. 독립 `/bridge` UI 또는 frontend context adapter는 후속 범위로 둔다.
- `after_query_seed` exact handoff transport: response payload direct handoff, short-lived server-side handoff id, URL param 사용 금지/허용 범위. raw persistent 저장은 금지.
- SCN-001 document draft 후속 여부: 현재는 answer-only. `workplace_change_reason_summary` 등 draft type 활성화는 별도 review 필요.
- 계정 연결 동의 시점: Before review 전, Bridge 생성 전, After 결과 저장 전 중 어디에서 받을지 결정 필요.
- `bridge_runs.user_id` required, `auth_provider = "firebase_google"`, raw `after_query_seed` persistent 저장 금지는 `docs/planning/18_scn001_firebase_auth_phase0_decisions.md`에서 결정 완료.
- artifact retention / deletion / access-control 정책 필요.
- Firebase Auth 활성화 전 기존 익명 artifact는 MVP에서 orphan 상태로 유지한다. 삭제 workflow와 retention duration은 후속 정책으로 둔다.
- Direct Google OAuth + backend-managed session cookie는 Alternative/Fallback로만 유지한다.
- Firebase session cookie, Identity Platform OIDC provider, multi-provider linking은 Future/Post-MVP로 유지한다.

## 13. Recommended Next Steps

1. `BeforeHandoffDTO` 필드 review
2. `BridgeOutputDTO` 필드 review
3. `bridge_runs` 최소 schema 설계: `user_id` required, `after_query_seed_hash` 저장, raw `after_query_seed` persistent 저장 금지
4. `docs/planning/18_scn001_firebase_auth_phase0_decisions.md` 기준 Firebase Auth Bearer token boundary와 protected endpoint 구현 detail review
5. `SCN-004` login-free regression checklist 작성
6. 구현 착수
