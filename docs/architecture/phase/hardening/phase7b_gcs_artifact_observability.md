# Phase 7B — Private GCS Artifact Storage And Observability

기준일: `2026-05-13`

## Status

Phase 7B는 Cloud Run 기반 MVP를 더 cloud-native하게 보강하기 위한 optional
hardening 후보이다. 이 문서는 구현 완료 기록이 아니라 opening gate와 후보 설계를
정리한다.

Current state:

- Terraform foundation already provisions a private artifact bucket and grants
  backend artifact bucket IAM.
- Runtime Before/After artifact writers still write to local Cloud Run
  filesystem paths.
- Cloud SQL already stores structured job/history/metadata rows.
- Phase 6 log-based metrics and alert policies exist for backend/frontend 5xx,
  provider/runtime/database/internal errors, artifact persistence failures, and
  Cloud SQL saturation candidates.
- A custom Cloud Monitoring dashboard for Cloud Run / Cloud SQL / Vertex OCR /
  GCS artifact health is not yet implemented.

## Goal

Move runtime artifact storage away from Cloud Run local filesystem and make the
cloud operations surface visible.

Primary cloud portfolio message:

```text
Cloud Run stays stateless.
Cloud SQL stores searchable metadata and history.
Private GCS stores original files and raw runtime artifacts.
Cloud Monitoring shows service, database, AI provider, and artifact health.
```

## Target Profile

```text
dev first
demo/contest after smoke
prod not opened
```

This candidate does not make the deployment production-ready by itself. It is a
durability and observability improvement for the existing dev/demo Cloud Run
architecture.

## Problem

Current Cloud Run deployment can serve the MVP, but artifact durability is weak:

- Before upload originals, OCR output, review result, and user explanation can
  be written to `backend/data/before_artifacts/runs/...`.
- After answer/draft request and response artifacts can be written to
  `backend/data/after_artifacts/runs/...`.
- Cloud Run local filesystem is not durable across instance shutdown, revision
  replacement, scale-to-zero, or rescheduling.

Cloud SQL retains structured history and summary rows, but the raw file/artifact
payloads can disappear if they remain local. This makes the architecture look
like a web app deployed on Cloud Run rather than a fully cloud-backed runtime
storage design.

## Decision

Selected candidate direction:

```text
Cloud Run backend
-> private GCS artifact bucket
-> Cloud SQL metadata/artifact refs
-> Cloud Monitoring dashboard + existing alert policies
```

Data split:

| Data | Target | Reason |
|---|---|---|
| `users`, job status, history cards, Bridge summaries, query hashes | Cloud SQL | Structured query, ownership check, filtering, history listing |
| uploaded contract PDFs/images | Private GCS | File/object durability, avoid DB blobs |
| OCR raw output and review raw JSON/markdown | Private GCS | Large/sensitive runtime artifacts |
| answer/draft request/response artifacts | Private GCS | Raw artifact durability without bloating SQL rows |
| artifact paths, object hashes, stage/status, created/updated times | Cloud SQL | Searchable metadata and traceability |

## Candidate Object Layout

Use the existing private artifact bucket boundary. Exact bucket name remains
internal cloud inventory and must not be copied into public docs.

```text
gs://<private-artifact-bucket>/before-runs/{job_id}/
  originals/{safe_file_name}
  ocr_output.json
  review_result.json
  user_explanation.md
  error.txt

gs://<private-artifact-bucket>/after-runs/{run_id}/
  user_statement.txt
  answer_request.json
  answer_response.json
  draft_request.json
  case_intake.json
  legal_basis.json
  draft_response.json
```

Do not make objects public. Retrieval UI, signed URLs, and authenticated artifact
download endpoints remain separate approval gates.

## Runtime Contract

Candidate backend env:

```text
ARTIFACT_BUCKET_NAME=<private artifact bucket name>
```

Rules:

- Do not wire this env var until the GCS adapter is implemented and smoke-tested.
- Do not change public `/api/v1/answer` or `/api/v1/documents/draft` contracts.
- Do not change protected SCN-001 Bridge/history contracts.
- Do not store raw contract text, Firebase uid, provider subject, email, tokens,
  raw Bridge payload, or full artifact bodies in logs.
- Store `gs://...` paths only in DB/internal logs as needed. Treat exact paths as
  internal inventory in public evidence.

## Implementation Scope

In scope:

- Add a backend artifact storage adapter with local/GCS target selection.
- Activate GCS writes for Before uploaded originals and OCR/review artifacts.
- Activate GCS writes for After answer/draft artifacts.
- Store only metadata and artifact refs in Cloud SQL.
- Preserve existing history UI behavior.
- Add or refine log-based metrics for GCS artifact write success/failure and
  upload/write latency.
- Add a custom Cloud Monitoring dashboard covering:
  - Cloud Run frontend/backend request count, 4xx/5xx, p95 latency, instance count,
  - Cloud SQL CPU, memory, disk, connections,
  - Vertex/OCR 429, provider timeout, OCR success/failure, OCR latency,
  - GCS artifact persist success/failure and object/storage growth.

Out of scope:

- public artifact download UI,
- signed URL or authenticated proxy retrieval,
- hard delete / physical purge lifecycle,
- account deletion,
- full PIPA/legal retention policy,
- public API contract changes,
- SCN-004 freeze changes,
- SCN-001 live/backend draft generation,
- GKE migration,
- Cloud Armor / HTTPS Load Balancer / API Gateway.

## Opening Gates

Open implementation only after these are answered:

| Gate | Required Answer |
|---|---|
| Target profile | `dev` first; `demo/contest` only after smoke |
| Storage owner | private artifact bucket from Phase 1 foundation or explicitly approved replacement |
| Runtime env | `ARTIFACT_BUCKET_NAME` source and rollback value approved |
| DB metadata shape | existing `artifact_root` reuse vs new `artifact_refs`/GCS path fields decided |
| Privacy | no raw artifact payloads in logs/docs/screenshots |
| Retention posture | short demo retention accepted, full retention lifecycle deferred |
| Rollback | backend can return to local artifact writer without DB/API contract break |
| Monitoring owner | dashboard owner and alert receiver confirmed |
| Cost | GCS storage/object operation cost accepted for demo volume |

## Suggested Implementation Plan

1. Add artifact storage interface:

```text
put_text(key, text, content_type)
put_json(key, payload)
put_bytes(key, bytes, content_type)
```

2. Implement local adapter and GCS adapter behind the same interface.
3. Route Before upload/OCR/review writes through the adapter.
4. Route After answer/draft artifact writes through the adapter.
5. Store artifact references in Cloud SQL while preserving current user-facing
   API responses.
6. Add safe structured log signals:

```text
artifact.persist.success stage=before|after target=gcs latency_ms=...
artifact.persist.failed stage=before|after target=gcs reason=...
ocr.provider.429 count signal
ocr.provider.timeout count signal
```

7. Add dashboard panels using existing Cloud Monitoring metrics plus log-based
   metrics.
8. Run dev smoke and rollback check.

## Verification

Required checks:

- Before upload succeeds and writes original/OCR/review artifacts to private GCS.
- After answer/draft artifacts write to private GCS.
- Cloud SQL history still shows Before/Bridge/After metadata.
- SCN-004 exact/free-input flow remains unchanged.
- SCN-001 protected Bridge/history flow remains unchanged.
- Refresh/revision/cold-start does not lose metadata; artifact objects remain in
  GCS.
- Log sampling shows no raw contract text, token, Firebase uid, provider subject,
  email, raw Bridge payload, or full answer/draft body.
- Dashboard shows Cloud Run, Cloud SQL, Vertex/OCR, and GCS artifact panels.
- Existing alert policies remain enabled; artifact persist failure alert still
  fires from the new GCS writer failure signal.

Suggested smoke:

```bash
python -c "from backend.main import app; print('import_ok')"
python backend/verify/check_document_draft.py
cd frontend && npm run build
```

For deployed smoke, use redacted evidence only. Do not paste exact bucket names,
`gs://` paths, direct backend URLs, token values, raw OCR text, or full
answer/draft payloads into public docs.

## Estimated Effort

| Scope | Estimate | Notes |
|---|---:|---|
| Store Before upload originals only | 0.5-1 day | Useful but incomplete |
| Store Before + After runtime artifacts and metadata | 1.5-3 days | Recommended Phase 7B MVP |
| Add dashboard and metric cleanup | 0.5-1.5 days | Depends on existing log signal quality |
| Add retrieval UI/signed URL/hard delete lifecycle | 1+ week | Separate governance/security scope |

## Rollback

Rollback path:

1. Disable GCS adapter env/config and return to local writer.
2. Keep Cloud SQL metadata rows readable; do not delete GCS objects during
   emergency rollback.
3. Re-run Before/After smoke on local writer.
4. Keep dashboard panels but mark GCS artifact panels as inactive or remove them
   in a later ops patch.

Rollback must not:

- destroy the private artifact bucket,
- delete user artifacts without a retention/deletion decision,
- change API contracts,
- expose raw artifacts in public evidence.
