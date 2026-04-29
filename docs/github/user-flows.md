# User Flows

## SCN-004 After Document Draft

This is the main login-free demo path.

```text
/after
  -> /after/result
  -> /after/intake
  -> /after/draft
```

Behavior:

- Users enter a dispute statement or choose `SCN-004-DEMO-FREEZE`.
- The entry screen is centered, includes guidance cards, and shows the restored
  disclaimer.
- Exact preset uses a frontend fixed answer fixture.
- Modified preset calls `/api/v1/answer` with `top_k=10`.
- Free input calls `/api/v1/answer` with `top_k=5`.
- `ef_search=100` is used for both live paths.
- Draft flow is available only when citations and grounded context ids exist.

Draft types:

- 고용노동청 임금체불 진정서 초안
- 노동위원회 부당해고 구제신청 이유서 초안

Draft screen:

- rendered text
- missing fields
- cautions
- evidence checklist
- cited articles
- source context ids
- copy
- browser print

## SCN-001 Before -> Bridge -> After

This path requires backend-verified login.

```text
/before
  -> Before review job
  -> protected bridge run
  -> /after Bridge handoff
  -> protected Bridge answer
  -> /after/result answer-only
```

Behavior:

- `/before` actual analysis requires backend-verified auth.
- A completed Before job can create a protected Bridge run.
- Bridge handoff state lives in React memory.
- Checked Bridge context calls:
  `POST /api/v1/scn001/bridge-runs/{bridge_run_id}/answer`
- All-unchecked Bridge context calls public `/api/v1/answer`, but result remains
  Bridge-origin answer-only.
- Bridge content is continuity/reference only and does not become legal
  grounding.

## Saved History

Backend-verified logged-in users can use:

- `/after` saved history selector
- `/history` record archive

History behavior:

- incident-centered cards
- centered folded layout with blue left accent
- user-facing Korean summaries
- confirmed issues
- candidate legal references
- recommended next steps
- After question connection
- MVP soft-delete for Before/Bridge records

The UI does not expose raw Bridge payloads, raw `after_query_seed`, Firebase uid,
provider subject, raw email, tokens, full answer body, artifact body, or real
bridge id.

## SCN-001 Fixed-preset Frozen Draft

Exact `SCN-001-BRIDGE-DEMO` preset supports a frontend-local frozen draft:

```text
/after
  -> /after/result
  -> /after/intake
  -> /after/draft
```

Document type:

- `workplace_change_reason_summary`
- 사업장 변경 사유 정리서 초안

Boundary:

- no backend draft endpoint call
- no LLM call
- no `/api/v1/documents/draft` call
- no live/backend SCN-001 draft generation

## Out-of-scope Flows

- independent `/bridge`
- Recovery
- SCN-005 document draft
- production retention lifecycle
- hard delete and artifact file purge
- `/api/v1/history` unified backend API
- live/backend SCN-001 draft generation and protected SCN-001 draft endpoint
