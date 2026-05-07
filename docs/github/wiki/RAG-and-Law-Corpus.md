# RAG와 법령 코퍼스

이 문서는 법대로(LawMainRoad)의 법령 데이터, 검색, 근거 답변 기준을 공개 가능한
수준으로 정리합니다.

## 현재 코퍼스

| 항목 | 현재 기준 |
|---|---|
| Source | `data/legalize-kr/` submodule |
| Processed source of truth | `backend/data/law_chunks/all_chunks.json` |
| Live corpus | `1722` chunks |
| Snapshot marker | `selected_as_of = 2026-04-11` |
| Embedding model | `gemini-embedding-001`, 768 dimensions |
| Vector store | PostgreSQL + pgvector |

`backend/data/law_chunks/` output은 직접 수정하지 않습니다. Corpus updates는
문서화된 pipeline 또는 명시적으로 review된 data supplementation procedure를
통해서만 진행합니다.

## 파이프라인

Chunking order는 고정되어 있습니다.

```text
Step 1 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10
```

Step 2와 Step 3은 별도로 실행하지 않습니다. current live corpus는 baseline
chunks에 작은 SCN-003 supplementation set을 더해 `1722` chunks입니다.

## 검색 경로 (Retrieval Path)

```text
user query
  -> query embedding
  -> pgvector HNSW search
  -> retrieved law chunks
  -> grounded answer generation
  -> cited_articles from grounded context only
```

기본 public answer behavior:

- general `/api/v1/answer`: `top_k=5`, `ef_search=100`
- SCN demo와 scenario smoke: `top_k=10`, `ef_search=100`
- SCN-001 demo path에는 제한적으로 query decomposition guard가 적용될 수
  있습니다. 이 guard는 demo scenario boundary 안에서만 사용하며 broad RAG
  behavior로 확장된 상태가 아닙니다.

## 근거화 규칙 (Grounding Rules)

- 법률 답변은 검색된 법령 chunk 안에서만 citation을 만듭니다.
- 검색 결과에 없는 조문을 답변의 근거처럼 추가하지 않습니다.
- `cited_articles`와 `grounded_context_ids`가 비어 있으면 draft flow는 열리지
  않습니다.
- Bridge는 사건 맥락 연결/참고용이며, 법적 근거(legal grounding)가 아닙니다.
  Bridge가 retrieved chunks, citation ids를 새로 만들거나 바꾸지 않습니다.

## 평가 기준선 (Evaluation Baseline)

현재 public-safe baseline summary:

Evaluation baseline은 60-item scenario eval set을 사용합니다. 각 item은
PASS / PARTIAL / FAIL 단위로 검토하고, legal citations가 retrieved law context로
뒷받침되는지 citation grounding check로 확인합니다.

| Check | Result |
|---|---|
| Retrieval hit@1 | `51/60` |
| Retrieval hit@3 | `59/60` |
| Retrieval hit@5 | `60/60` |
| Answered items | `60/60` |
| Citation grounding | clean in the recorded full answer eval |
| Evidence report | `PASS=44`, `PARTIAL=16`, `FAIL=0` |

이 표는 broad production benchmark가 아니라 기록된 scenario-eval evidence를
요약합니다. 목적은 current corpus와 scenario scope에서 demo readiness와
grounding discipline을 보여주는 것입니다.

남은 partial items는 answer-quality tuning candidates로 다룹니다. public demo
path가 ungrounded하다는 근거로 해석하지 않습니다.

## 데모 Freeze와의 관계

- `SCN-004-DEMO-FREEZE` exact path는 frontend fixed answer fixture를 사용하고
  live answer generation을 호출하지 않습니다.
- modified preset과 free input은 live `/api/v1/answer`를 호출할 수 있습니다.
- `SCN-001-BRIDGE-DEMO` exact path는 frontend-local frozen draft flow를 사용합니다.
- live/backend SCN-001 draft generation은 미오픈(NOT opened)입니다.

## 함께 보기

- [[최종 아키텍처|Final-Architecture]]
- [[API 엔드포인트와 스키마|API-Endpoints-and-Schemas]]
- [[테스트 전략|Testing-Strategy]]
