# Project Overview

K-Labor Shield is a labor-rights assistance MVP for foreign workers and other
vulnerable workers in Korea.

The product helps users connect workplace problems to Korean labor law sources.
It does not make a final legal judgment. It retrieves relevant law articles,
summarizes risk signals, suggests next actions, and, when supported, generates a
review draft that keeps missing facts explicit.

## What It Does

- Reviews employment contract issues in the Before flow.
- Answers labor dispute questions in the After flow using retrieved legal
  context.
- Links Before risk signals into After questions through Bridge.
- Generates deterministic SCN-004 document drafts when legal grounding exists.
- Keeps SCN-001 Bridge information as continuity/reference, not legal grounding.

## Main Scenarios

### SCN-001: Foreign Worker Contract / Dormitory / Workplace Change

Implemented:

- Before review and Bridge handoff
- protected Bridge answer endpoint
- saved history selector on `/after`
- `/history` record archive
- MVP soft-delete
- exact fixed-preset frozen draft for `workplace_change_reason_summary`

Boundary:

- live/backend SCN-001 draft generation is not implemented.
- protected SCN-001 draft endpoint is not defined.

### SCN-004: Unpaid Wages / Unfair Dismissal

Implemented:

- login-free After answer flow
- document draft eligibility guard
- wage complaint draft
- unfair dismissal brief draft
- copy and browser print
- fixed demo preset for stable rehearsal

Supported draft types:

- `labor_office_wage_complaint`
- `labor_commission_unfair_dismissal_brief`

### SCN-005 and Recovery

These remain future candidates. They are not exposed as current frontend preset
flows.

## Current User-facing Routes

- `/`: home and auth entry
- `/before`: contract review and Bridge handoff
- `/after`: dispute question input, presets, saved history selector
- `/after/result`: grounded answer and draft eligibility
- `/after/intake`: optional fact intake for supported drafts
- `/after/draft`: draft preview, copy, print
- `/history`: protected SCN-001 record archive

## Design Principles

- Korean primary, English secondary.
- Legal citations are shown only when backed by retrieved context.
- Missing facts remain visible instead of being guessed.
- Disclaimers and uncertainty stay prominent.
- UI is token-first, neutral/dense/evidence-led on work routes, with a warmer
  but still service-oriented main page.
- Sensitive raw payloads are not stored in browser storage.
- SCN-004 public demo remains login-free.
- SCN-001 protected features require backend-verified auth, not Firebase signed-in
  state alone.

Latest UI checkpoint:

- Before is upload-focused with OCR 1~2분 guidance and no hardcoded default
  accessibility legal basis.
- After entry is centered with guidance cards and restored disclaimer.
- History uses centered folded incident cards.
- Main uses cleaned H1/lead/nav typography and a compact flow strip.
- `DESIGN.md` guides the current frontend visual direction: token-first,
  neutral, dense, evidence-led, and explicit about disclaimers and uncertainty.
