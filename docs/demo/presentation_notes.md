# Presentation Notes

기준일: `2026-04-29`

## 현재 구현 설명

현재 저장소는 SCN-004 After 문서 초안 demo와 SCN-001 protected
Before/Bridge/History 연결이 함께 구현되어 있다.

완료된 것:

- 법령 chunking / DB / embedding / HNSW index
- retrieval API
- grounded answer API
- RAG refinement
- SCN-004 document draft API
- SCN-004 After frontend demo flow
- SCN-004 QA/content/frontend rehearsal
- SCN-001/004 presentation-local After preset fixture architecture
- SCN-004 free-input document eligibility guard
- SCN-001 Firebase Auth protected path
- `/before` actual analysis login gate and Bridge handoff CTA
- protected Bridge answer endpoint and frontend routing
- `/after` saved Before/Bridge history selector
- `/history` SCN-001 record archive
- Before/Bridge MVP soft-delete
- exact `SCN-001-BRIDGE-DEMO` frontend-local frozen draft flow
- integrated Before/After/History/Main UI polish through `85d10fa`
- DESIGN.md visual guide, contrast/disclaimer fixes, and accessibility
  legal-basis blocker fix

다음 단계:

- demo freeze 유지
- 제출 전 재현성 확인
- GitHub-facing docs는 `docs/github/`를 우선 사용

## 발표에서 강조할 점

- 단순 챗봇이 아니라 검색된 법령 근거 안에서만 답변한다.
- `cited_articles`와 `grounded_context_ids`가 없으면 문서 초안으로 진행하지 않는다.
- 문서 초안은 법률 판단 확정이 아니라 제출 전 검토용 보조 문서다.
- 사용자가 입력하지 않은 사실은 생성하지 않고 `확인 필요` 또는 `missing_fields`로 남긴다.
- 개인정보 저장을 피하기 위해 raw statement와 draft state를 Web Storage에 저장하지 않는다.
- SCN-001 protected action은 Firebase signed-in 단독이 아니라 backend
  `/api/v1/auth/me` verification 상태를 기준으로 한다.
- UI polish는 token-first, neutral/dense/evidence-led 기준이며, disclaimer와
  uncertainty를 숨기지 않는다.

## 현재 범위 설명

이번 main demo는 `SCN-004-DEMO-FREEZE` After document draft flow에 집중한다.

- 해고
- 서면통지
- 해고예고
- 임금체불
- 퇴직금
- 노동청 진정서 초안
- 노동위원회 이유서 초안

발표용 preset 구조:

- Main demo: `SCN-004-DEMO-FREEZE`. exact preset은 fixed answer path를 사용하므로 `/api/v1/answer`를 호출하지 않는다. document draft 2종이 가능하며 fixed answer 기준은 `cited_articles=6`, `grounded_context_ids=[1, 2, 3, 5, 10, 4]`다.
- Bridge handoff / frozen draft 설명: `SCN-001-BRIDGE-DEMO`. exact fixed
  preset은 frontend-local 사업장 변경 사유 정리서 초안으로 이어지고,
  modified/live and Bridge-origin paths는 answer-only로 유지한다.
- `SCN-005`는 현재 UI preset에서 제외하고 후속 확장 후보로만 설명한다.
- preset 문장을 수정하면 live answer path로 전환하고 `top_k=10`, `ef_search=100`을 사용한다.
- 자유 입력은 live answer path로 `top_k=5`, `ef_search=100`을 사용한다. SCN-004 문서 초안 지원 범위 밖이면 answer-only로 처리한다.
- latest UI status: Before first screen is upload-focused with OCR 1~2분
  guidance; After entry is centered with guidance cards and restored disclaimer;
  History uses centered folded cards with blue accent; Main has cleaned H1/lead/
  nav typography and a compact flow strip.

Before / Bridge / History는 SCN-001 protected path로 구현되어 있다.
독립 `/bridge`, Recovery, live/backend SCN-001 draft generation, SCN-005
frontend 확장은 현재 demo 범위 밖이다.

## 리스크 대응 문구

- API 응답이 늦을 때: “LLM과 retrieval을 거치는 구간이라 loading과 retry UI를 따로 두었습니다.”
- 빈 필드가 많을 때: “초안 생성을 막지 않고 확인 필요 항목으로 따로 표시합니다.”
- 조문이 부족할 때: “검색된 근거가 부족하면 문서 초안으로 넘어가지 않도록 guard했습니다.”
- 문서 저장 질문이 나올 때: “개인 사건 진술이 포함되므로 현재 demo에서는 새로고침 복구보다 저장하지 않는 쪽을 선택했습니다.”

## 발표용 한 줄

“K-Labor Shield는 사용자의 노동분쟁 상황을 법령 근거와 연결하고, 검색된 조문 안에서만 설명과 제출 전 검토용 문서 초안을 만드는 grounded 노동권 보호 MVP입니다.”
