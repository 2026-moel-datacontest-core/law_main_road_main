# UI 화면 구성

법대로(LawMainRoad)의 current frontend는 Next.js routes로 Before, After,
History 흐름을 제공합니다. 화면 문구는 한국어를 우선하고, English terms는
기술 label이나 보조 설명에만 사용합니다.

## Route Map / 화면 경로

| Route | 사용자-facing 역할 | 현재 상태 |
|---|---|---|
| `/` | main entry, login priority, route navigation | 구현됨 |
| `/before` | SCN-001 contract review, progress, result, Bridge CTA | 구현됨 |
| `/after` | question input, presets, saved history selector | 구현됨 |
| `/after/result` | grounded answer, draft eligibility, continuity panel | 구현됨 |
| `/after/intake` | document-specific case intake | 구현됨 |
| `/after/draft` | rendered draft, missing fields, cautions, copy, print | 구현됨 |
| `/history` | SCN-001 record archive and MVP soft-delete | 구현됨 |

## Main Page / 메인 화면

- logged-out first viewport는 protected SCN-001 paths를 위해 Google login을 우선합니다.
- backend-verified logged-in users는 `History / Before / After` entry order를 봅니다.
- SCN-004 `/after`는 login-free로 유지합니다.

## Before Screen / 계약 검토 화면

- first screen은 upload-focused입니다.
- analysis start 시 progress area로 scroll합니다.
- OCR guidance는 document quality와 length에 따라 OCR이 약 1~2분 걸릴 수 있음을 설명합니다.
- raw job ids, provider details, internal errors는 user-facing UI에 표시하지 않습니다.
- completed logged-in Before jobs는 protected Bridge runs를 만들 수 있습니다.

## After Screen / 질문 입력 화면

- saved Bridge context가 있어도 preset buttons는 계속 표시됩니다.
- exact preset submit이 우선합니다.
  - `SCN-004-DEMO-FREEZE` exact -> fixed answer -> SCN-004 draft flow
  - `SCN-001-BRIDGE-DEMO` exact -> fixed answer -> frontend-local frozen draft
- preset modified와 free input paths는 live answer generation을 사용할 수 있습니다.
- saved history selector는 backend-verified logged-in users에게만 표시됩니다.

## Result, Intake, Draft / 결과와 초안 화면

- `/after/result`는 ungrounded answers와 grounded but unsupported answers를 구분합니다.
- draft flow는 evidence와 supported document type이 맞을 때만 열립니다.
- `/after/intake`는 submit 전에 selected document type eligibility를 다시 확인합니다.
- `/after/draft`는 rendered text, missing fields, cautions, evidence checklist,
  legal basis, copy, browser print를 표시합니다.
- SCN-001 Bridge-origin/live modified paths는 exact frontend-local frozen draft
  preset을 쓰는 경우를 제외하고 answer-only로 유지됩니다.

## History Screen / 기록 보관함

- records는 separate Before/Bridge columns가 아니라 incident-centered single cards입니다.
- cards는 situation, confirmed issues, candidate legal references, recommended
  next steps, After connection을 요약합니다.
- failed/running Before jobs는 user-facing list에서 숨깁니다.
- MVP soft-delete는 visible records를 숨기고 영향을 받은 local handoff state를 정리합니다.

## Visual Design Notes / 화면 설계 메모

- UI는 token-first, neutral, dense, evidence-led 방향을 따릅니다.
- disclaimers와 uncertainty는 보이는 상태로 유지합니다.
- cards는 repeated records와 framed tools에 사용하고, decorative nested page
  sections 용도로 쓰지 않습니다.
- color accents는 unselected saved history와 selected handoff state를 구분합니다.

## 함께 보기

- [[사용자 흐름|User-Flows]]
- [[설계 원칙|Design-Principles]]
- [[E2E 데모 검증|E2E-Demo-Verification]]
