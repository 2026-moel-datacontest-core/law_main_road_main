# 사용자 흐름

## SCN-004 After Document Draft

SCN-004는 현재 법대로(LawMainRoad)의 main login-free demo path입니다.

```text
/after
  -> /after/result
  -> /after/intake
  -> /after/draft
```

동작:

- 사용자는 직접 질문을 입력하거나 `SCN-004-DEMO-FREEZE` preset을 선택합니다.
- exact preset은 frontend fixed answer fixture를 사용합니다.
- modified preset은 `/api/v1/answer`를 `top_k=10`, `ef_search=100`으로 호출합니다.
- free input은 `/api/v1/answer`를 `top_k=5`, `ef_search=100`으로 호출합니다.
- draft flow는 citations와 grounded context ids가 있을 때만 열립니다.

지원 draft types:

- 고용노동청 임금체불 진정서 초안
- 노동위원회 부당해고 구제신청 이유서 초안

Draft screen에 표시되는 항목:

- rendered text
- missing fields
- cautions
- evidence checklist
- cited articles
- source context ids
- copy
- browser print

## SCN-001 Before -> Bridge -> After

이 흐름은 backend-verified login이 필요합니다.

```text
/before
  -> Before review job
  -> protected Bridge run
  -> /after Bridge handoff
  -> protected Bridge answer
  -> /after/result answer-only
```

동작:

- `/before` 화면의 actual analysis UX는 backend-verified auth를 요구합니다.
  Mounted Before API endpoints에는 public과 optional-auth paths가 그대로 포함됩니다.
  이 Wiki는 frontend UX gating과 raw API auth labels를 구분합니다.
- completed Before job은 protected Bridge run을 생성할 수 있습니다.
- Bridge handoff state는 React memory state에만 있습니다.
- checked Bridge context는 protected Bridge answer endpoint를 호출합니다.
- all-unchecked Bridge context는 public `/api/v1/answer`를 호출하지만,
  결과는 Bridge-origin answer-only로 유지됩니다.
- Bridge는 사건 맥락 연결/참고용이며, 법적 근거(legal grounding)가 아닙니다.

## Saved History

Backend-verified logged-in users는 다음 기능을 사용할 수 있습니다.

- `/after` saved history selector
- `/history` record archive

History UI:

- incident-centered card
- folded detail sections
- Korean user-facing summaries
- confirmed issues
- candidate legal references
- recommended next steps
- After question connection
- MVP soft-delete

UI는 raw Bridge payloads, raw `after_query_seed`, auth-provider subject
identifiers, email values, credential values, full answer body, artifact body,
internal Bridge record identifiers를 노출하지 않습니다.

## SCN-001 Fixed-preset Frozen Draft

exact `SCN-001-BRIDGE-DEMO` preset은 frontend-local frozen draft를 지원합니다.

```text
/after
  -> /after/result
  -> /after/intake
  -> /after/draft
```

Document type / 문서 유형:

- `workplace_change_reason_summary`
- 사업장 변경 사유 정리서 초안

경계:

- backend draft endpoint call 없음
- LLM call 없음
- `/api/v1/documents/draft` call 없음
- live/backend SCN-001 draft generation은 미오픈(NOT opened)

## Out-of-scope Flows / 범위 밖 흐름

- independent `/bridge`
- Recovery
- SCN-005 document draft
- production retention lifecycle
- hard delete and artifact file purge
- `/api/v1/history` unified backend API
- live/backend SCN-001 draft generation과 protected SCN-001 draft endpoint

## 함께 보기

- [[UI 화면 구성|UI-Screens]]
- [[API 엔드포인트와 스키마|API-Endpoints-and-Schemas]]
- [[E2E 데모 검증|E2E-Demo-Verification]]
