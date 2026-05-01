# Phase 6 — Observability / Reliability

기준일: `2026-04-29`

## 1. Goal

Phase 6는 Phase 1-5로 배포 가능한 구조가 된 서비스를 운영 가능한 구조로
끌어올리는 단계다. 핵심은 Cloud Logging/Monitoring/Alerting, rollback drill,
backup verification, lifecycle cleanup, cost guardrail을 실제 운영 기준으로
정리하는 것이다.

핵심 목표는 다음과 같다.

- backend/frontend Cloud Run runtime 상태를 관찰한다.
- provider timeout, 5xx, latency, Cloud SQL saturation을 alertable signal로
  만든다.
- 민감정보가 log에 남지 않는지 sampling gate를 둔다.
- private artifact bucket lifecycle policy를 적용한다.
- Artifact Registry cleanup policy를 적용한다.
- Cloud SQL backup/PITR 상태와 restore readiness를 runbook으로 확인한다.
- Cloud Run revision rollback drill을 최소 1회 수행한다.
- alert channel, threshold, incident ownership을 관리자 승인 영역으로
  분리한다.

## 2. Phase Status

| Item | Status |
|---|---|
| Phase type | Operations, reliability, cleanup |
| Primary Terraform root | `infra/environments/{env}/ops` |
| Primary modules | `monitoring-alerts`, lifecycle/cleanup policy modules or settings |
| Required previous phase | [`phase5_cicd.md`](phase5_cicd.md) |
| Next phase | [`phase7_optional_hardening.md`](phase7_optional_hardening.md) |

## 3. Read First

Phase 6 작업자는 아래 순서로 읽는다.

1. repo root `AGENTS.md`
2. repo root `CLAUDE.md`
3. [`../CLAUDE.md`](../CLAUDE.md)
4. [`../cloud_migration_architecture.md`](../cloud_migration_architecture.md)
5. [`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md)
6. [`phase3_backend_runtime.md`](phase3_backend_runtime.md)
7. [`phase4_frontend_runtime.md`](phase4_frontend_runtime.md)
8. [`phase5_cicd.md`](phase5_cicd.md)
9. this file
10. `docs/ops/README.md`
11. `docs/ops/클라우드런_데이터_저장_구조.md`
12. `docs/ops/troubleshooting.md`

## 4. Preconditions

Phase 6를 시작하기 전에 확인한다.

| Precondition | Required State |
|---|---|
| Phase 3 backend | deployed with service/revision outputs |
| Phase 4 frontend | deployed with service/revision outputs |
| Phase 5 CI/CD | keyless deploy and rollback workflow/runbook exist |
| Cloud SQL | instance name and backup/PITR decision available |
| Artifact bucket | private bucket exists and stores or will store sensitive artifacts |
| Artifact Registry | backend/frontend image repository exists |
| Cloud Logging/Monitoring APIs | enabled from foundation |
| Notification channel | admin-approved channel selected or manual placeholder documented |
| Incident owner | person/team responsible for alerts identified |

If the app is not deployed yet, Phase 6 can still draft alert modules, but it
cannot claim production readiness until alerts and rollback drill are applied and
rehearsed against real resources.

## 5. Scope

### In Scope

- `ops` Terraform root.
- Cloud Monitoring alert policies.
- Log-based metrics from current backend logs.
- Cloud Run service health alerts.
- Cloud SQL saturation alerts.
- Provider timeout/OCR failure alerts.
- Alert notification channel wiring if approved.
- Cloud Storage lifecycle policy for artifact bucket.
- Artifact Registry cleanup policy for old images.
- Cloud Logging retention/exclusion policy.
- Rollback drill documentation and execution evidence.
- Backup verification runbook.
- Sensitive log sampling checklist.
- Cost guardrail verification.

### Out Of Scope

- Backend/frontend feature changes.
- Runtime API contract changes.
- New structured logging code.
- New audit export pipeline.
- Full Step 3 retention lifecycle implementation.
- Physical artifact purge endpoint.
- Account deletion/access-control workflows.
- API Gateway, Cloud Armor, private VPC.
- SCN-001 live/backend document draft generation.
- Changing Firebase Auth persistence.

## 6. Terraform Layout

Create or maintain this layout.

```text
infra/
  modules/
    monitoring-alerts/
      main.tf
      variables.tf
      outputs.tf
      README.md
    log-based-metrics/
      main.tf
      variables.tf
      outputs.tf
      README.md
  environments/
    dev/
      ops/
        main.tf
        variables.tf
        outputs.tf
        versions.tf
        terraform.tfvars.example
    prod/
      ops/
        main.tf
        variables.tf
        outputs.tf
        versions.tf
        terraform.tfvars.example
```

Lifecycle and cleanup settings can live in either:

- dedicated ops modules, or
- existing resource modules such as `artifact-bucket` and `artifact-registry`
  with lifecycle/cleanup variables.

Prefer keeping the Terraform owner obvious. If lifecycle settings are implemented
inside `artifact-bucket`, document that Phase 6 enables those module variables
rather than creating a second bucket policy module.

## 7. Terraform Owns

Terraform owns operational resource configuration.

| Area | Terraform Responsibility |
|---|---|
| Log-based metrics | provider timeout, app errors, optional auth failures |
| Alert policies | 5xx, provider timeout, Cloud SQL saturation, backup verification signal if available |
| Notification channel binding | only after admin-approved channel exists |
| Storage lifecycle | artifact object TTL and noncurrent version policy |
| Artifact Registry cleanup | old untagged/old SHA image cleanup |
| Logging retention/exclusion | noisy non-audit log retention/cost policy |
| Outputs | alert policy ids, metric names, lifecycle policy summary |

Terraform should not create fake alert channels. If a notification channel needs
manual verification, create it manually or mark it as an admin prerequisite, then
reference it from Terraform.

## 8. CI / Script Owns

CI/scripts own repeatable verification.

| Area | Responsibility |
|---|---|
| Alert test | generate or simulate alert signal in dev where safe |
| Rollback drill | run manual or workflow-dispatch rollback command |
| Cleanup dry-run | list objects/images that would be deleted |
| Log sampling | query recent Cloud Logging entries for sensitive fields |
| Backup check | query backup status or run manual checklist |
| Smoke after rollback | verify backend/frontend still respond |

The first implementation can use documented commands rather than fully automated
scripts, but the command sequence must be reproducible.

## 9. Admin / Manual Owns

Some operations require human approval.

| Area | Admin Responsibility |
|---|---|
| Alert channel | choose email/Slack/PagerDuty/etc. and approve receiver |
| Thresholds | tune thresholds to avoid noisy alerts |
| Incident owner | decide who responds and who can rollback |
| Retention | approve artifact/log/image retention windows |
| Cost | approve Cloud Logging retention and Cloud SQL/PITR cost |
| Rollback drill | approve drill window and confirm result |
| Backup restore | decide whether to run actual restore test or documented verification only |

Admin actions should be recorded in the Phase 6 status note.

## 10. Current Log Reality

Current backend logs are mostly plain text with key-value fragments, not a full
JSON structured logging system.

Examples already emitted by backend routes:

```text
retrieval.failed ... reason=provider_timeout
retrieval.completed ... query_hash=... latency_ms=...
answer.failed ... reason=provider_timeout
answer.completed ... query_hash=... latency_ms=...
answer.artifact_persist_failed ...
document_draft.artifact_persist_failed
```

Phase 6 can start with Cloud Logging text filters and log-based metrics. Do not
claim full structured logging unless backend code is later changed to emit
structured JSON logs.

Recommended future improvement, outside this docs-only change:

- add consistent `request_id`
- emit JSON structured logs
- hash user/internal ids before logging
- standardize `route`, `status`, `latency_ms`, `reason`, `provider`

## 11. Log-Based Metrics

Initial log-based metrics can be built from current signals.

| Metric | Source Signal | Purpose |
|---|---|---|
| `backend_provider_timeout_count` | `reason=provider_timeout` | Vertex/provider instability |
| `backend_provider_runtime_error_count` | `reason=provider_runtime` or `reason=vertex_runtime` | provider runtime failure |
| `backend_database_error_count` | `reason=database` | DB availability/saturation symptom |
| `backend_internal_error_count` | `reason=internal` | unexpected server failure |
| `artifact_persist_failure_count` | `artifact_persist_failed` | local/GCS artifact persistence issue |
| `auth_401_count` | protected route 401 logs if available | auth integration signal |

Cloud Run request logs can provide status code, latency, and request count even
when application logs are not fully structured.

## 12. Minimum Alerts

Minimum prod alert set:

| Alert | Signal | Initial Threshold Direction |
|---|---|---|
| backend 5xx rate | Cloud Run request 5xx ratio | sustained non-zero or above small threshold |
| provider timeout | `provider_timeout` log metric | repeated events over short window |
| Cloud SQL saturation | CPU, memory, or connection usage | sustained high utilization |
| backend unavailable | `/health` or Cloud Run request failures | repeated failures |
| artifact persistence failure | `artifact_persist_failed` log metric | any repeated occurrence |

Optional but useful:

| Alert | Signal |
|---|---|
| frontend 5xx rate | Cloud Run frontend request logs |
| answer latency | Cloud Run/backend request latency for `/api/v1/answer` |
| OCR timeout | Before OCR timeout/stale job failure logs if filterable |
| auth failure spike | 401/403 spike after deploy |
| Cloud SQL disk growth | disk utilization or storage growth |

Do not overfit exact thresholds before observing real traffic. Start conservative
and tune after smoke/demo runs.

## 13. Cloud SQL Reliability Checks

Cloud SQL operations to cover:

| Area | Check |
|---|---|
| Automated backups | enabled for prod |
| PITR | enabled if cost decision allows |
| Backup retention | documented and approved |
| Connection saturation | alert on connection usage |
| CPU/memory | alert on sustained saturation |
| Disk | alert on high utilization or uncontrolled growth |
| Migration safety | backup/runbook before destructive migration |

Backup failure alerts can be difficult depending on available metrics and
provider support. If direct alerting is not implemented in the first Phase 6
pass, document a manual backup verification runbook and treat automated backup
failure alerting as a follow-up task.

Minimum backup verification runbook:

```text
1. Confirm latest automated backup timestamp.
2. Confirm retention/PITR policy.
3. Confirm deletion protection for prod instance.
4. Record whether restore test was run or deferred.
5. Before destructive migration, take/confirm backup and record rollback note.
```

## 14. Artifact Lifecycle Policy

The private artifact bucket can contain sensitive Before upload, OCR, and review
outputs. Phase 6 must make retention explicit.

Recommended initial policy:

| Artifact Type | Suggested Retention |
|---|---|
| raw uploaded contract images | 7 or 30 days after policy decision |
| OCR output | same or shorter than raw upload |
| review result JSON | same or policy-approved longer retention |
| temporary processing files | delete as soon as practical |

Terraform should enforce lifecycle rules where artifacts live in Cloud Storage.
If Phase 3 is still marked "limited smoke only" because artifacts are local and
non-durable, Phase 6 cannot claim artifact lifecycle completion. It can only
record the target policy.

Do not implement Step 3 full retention lifecycle, user-initiated physical purge,
or account deletion in this phase.

## 15. Artifact Registry Cleanup

Artifact Registry cleanup prevents image cost growth while preserving rollback
ability.

Recommended first policy:

- keep recent SHA-tagged images for backend and frontend
- keep images currently referenced by active/stable Cloud Run revisions
- delete old untagged images after an approved age
- do not delete images needed for rollback

Cleanup acceptance requires either:

- Terraform cleanup policy configured, or
- documented manual cleanup runbook if provider support is not sufficient yet

Do not use a cleanup policy that can delete the previous stable image before a
newer revision is smoke-verified.

## 16. Cloud Logging Retention And Exclusion

Logging guardrail:

- keep enough logs to debug deployment and provider issues
- avoid excessive noisy logs that increase cost
- never retain raw sensitive payloads intentionally

Possible policies:

| Log Type | Policy |
|---|---|
| audit/security-relevant logs | retain according to project policy |
| request logs | normal retention, sampled if cost requires |
| noisy debug logs | exclusion or shorter retention |
| raw sensitive payloads | should not be logged; if found, redact/exclude and fix source |

Cloud Logging exclusion filters are a mitigation, not a substitute for not
logging sensitive data.

## 17. Sensitive Log Sampling

After deployed smoke, sample logs for:

- `/api/v1/retrieve`
- `/api/v1/answer`
- `/api/v1/documents/draft`
- `/api/v1/auth/me`
- `/api/v1/scn001/*`
- `/api/v1/before/*` if Before upload smoke is run
- frontend route requests

Logs must not include:

- raw contract text
- raw OCR text
- Firebase uid
- provider subject
- email
- tokens
- raw Bridge payload
- raw `after_query_seed`
- raw full answer/draft payload
- service account JSON
- DB credentials

Acceptable:

- route/method/status/latency
- bounded error reason
- `query_hash`
- non-sensitive counts
- revision/service name

## 18. Rollback Drill

Phase 6 requires one rehearsed rollback drill.

Recommended drill in dev or low-risk prod window:

```text
1. Record current stable backend/frontend revisions.
2. Deploy or select a newer revision.
3. Shift traffic back to previous stable revision.
4. Run /health and frontend route smoke.
5. Reconcile Terraform state/variables if manual traffic shift was used.
6. Record commands, timestamps, revisions, and result.
```

Rollback options:

| Option | Use |
|---|---|
| Terraform rollback | preferred steady-state; re-apply previous image digest/revision config |
| Cloud Run traffic rollback | acceptable urgent recovery; reconcile Terraform afterward |

DB rollback is not part of a normal app rollback drill. DB rollback remains
manual/runbook-driven and requires backup/migration context.

## 19. Incident Response Runbook

Minimum incident fields:

| Field | Meaning |
|---|---|
| incident id | simple timestamp or ticket id |
| detected by | alert, smoke, user report, manual check |
| affected service | backend, frontend, Cloud SQL, Vertex/OCR, Firebase |
| severity | demo-blocking, degraded, informational |
| first action | rollback, retry, disable deploy, investigate |
| owner | named responder |
| user impact | what stopped working |
| rollback target | previous stable revision or DB backup/runbook |
| follow-up | code fix, threshold tuning, docs update |

This can start as a markdown runbook entry. A full incident platform is not
required for the portfolio phase.

## 20. Cost Guardrail Checks

Phase 6 should verify cost controls created in earlier phases.

| Service | Check |
|---|---|
| Cloud Run | min instances and max instances match env policy |
| Cloud SQL | small tier, backup/PITR retention, disk growth policy |
| Vertex AI | provider timeout/request count visible through logs/metrics |
| Cloud Storage | lifecycle deletion active |
| Artifact Registry | cleanup policy active |
| Cloud Logging | retention/exclusion policy reviewed |

If exact billing budgets are configured outside this repo, link or record the
manual budget policy in the status note.

## 21. Verification Procedure

Suggested verification commands/checks for later implementation:

```bash
cd infra/environments/{env}/ops
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
```

Console/API checks:

```text
Cloud Monitoring -> Alerting -> policies exist and are enabled
Cloud Logging -> Logs Explorer -> provider_timeout filter returns expected sample or zero count
Cloud SQL -> latest backup timestamp visible
Cloud Storage -> artifact bucket lifecycle rule visible
Artifact Registry -> cleanup policy visible
Cloud Run -> previous stable revision still available
```

Rollback drill check:

```text
previous stable revision recorded
traffic shifted or Terraform rollback rehearsed
backend /health passes
frontend route smoke passes
Terraform state reconciled if manual traffic shift was used
```

## 22. Acceptance Criteria

Phase 6 is complete when:

- `infra/environments/{env}/ops` can run `terraform fmt -check`,
  `terraform validate`, `terraform plan`, and `terraform apply`.
- Alert policies exist for prod.
- Alert channel is configured or manual notification limitation is documented.
- Backend 5xx alert exists.
- Provider timeout alert exists.
- Cloud SQL saturation alert exists.
- Artifact persistence failure alert exists or is explicitly deferred with reason.
- Sensitive log sampling has been performed after deployed smoke.
- Logs do not expose raw contract text, raw OCR text, Firebase uid, provider
  subject, email, tokens, raw Bridge payload, or raw answer/draft payload.
- Artifact bucket lifecycle policy is enabled for sensitive artifacts.
- Artifact Registry cleanup policy exists or manual cleanup runbook is approved.
- Cloud SQL backup/PITR verification is recorded.
- Rollback drill is documented and rehearsed once.
- Cost guardrail settings are recorded.

## 23. Rollback

Ops changes should be reversible independently from runtime.

Rollback guidance:

- Alert thresholds can be tuned without app redeploy.
- Faulty alert policies can be disabled or rolled back through Terraform.
- Logging exclusions should be reviewed carefully before rollback because they
  affect forensic visibility.
- Storage lifecycle policy rollback should not restore already-deleted objects.
- Artifact Registry cleanup rollback should preserve current active/stable images.
- Do not rollback application revisions just because alert thresholds are noisy.

## 24. Blocks Production-Readiness Claim If

Do not claim production-oriented readiness if any of these are true.

- Alerts are only described in docs but not configured.
- No rollback drill exists.
- Storage lifecycle is missing for sensitive artifacts.
- Artifact Registry cleanup is missing and no manual policy exists.
- Cloud SQL backup/PITR state is unknown.
- Logs expose sensitive raw payloads.
- No alert owner or notification channel is identified.
- Provider timeout is not observable.
- Cloud SQL saturation is not observable.
- Manual Cloud Run rollback would leave Terraform permanently out of sync.

## 25. Status Note Template

When Phase 6 is executed, record a short status note.

```markdown
## Phase 6 Status — Observability / Reliability

- Environment:
- GCP project:
- Ops Terraform root:
- Backend service:
- Frontend service:
- Cloud SQL instance:
- Artifact bucket:
- Artifact Registry repo:
- Alert policies:
- Notification channel:
- Log-based metrics:
- Sensitive log sample result:
- Backup/PITR verification:
- Storage lifecycle policy:
- Artifact Registry cleanup policy:
- Rollback drill:
- Cost guardrail review:
- Admin actions performed:
- Commands run:
- Skipped checks:
- Blockers:
```

## 26. Do Not

- Do not modify backend/frontend code in Phase 6 just to satisfy this docs task.
- Do not claim structured logging until code emits structured logs.
- Do not log raw contract text, OCR text, tokens, Firebase uid, provider subject,
  email, raw Bridge payload, or raw answer/draft payload.
- Do not use Logging exclusions as the only sensitive-data protection.
- Do not delete rollback images from Artifact Registry.
- Do not enable lifecycle rules that delete artifacts before the approved
  retention window.
- Do not implement Step 3 full retention lifecycle in this phase.
- Do not change API contracts.
- Do not open SCN-001 live/backend document draft generation.
- Do not treat alert existence as incident response readiness without an owner.

## 27. Suggested Agent Prompt

Use this prompt when asking an implementation agent to work on Phase 6.

```text
Read docs/architecture/CLAUDE.md, docs/architecture/cloud_migration_architecture.md,
docs/architecture/cloud_migration_phase_plan.md,
docs/architecture/phase/phase5_cicd.md, and
docs/architecture/phase/phase6_observability_reliability.md first.

Implement Phase 6 only.

Add the ops Terraform root and monitoring/lifecycle modules for Cloud Monitoring
alert policies, log-based metrics, artifact bucket lifecycle rules, Artifact
Registry cleanup, and backup/rollback verification outputs. Start from the
current backend log reality: provider timeout and error signals are plain-text
key-value logs such as reason=provider_timeout, not full JSON structured logs.
Do not modify backend/frontend code unless separately requested.

Create alerts for backend 5xx, provider timeout, Cloud SQL saturation, and
artifact persistence failure where possible. Add sensitive log sampling steps,
backup/PITR verification notes, and a rollback drill record. Do not delete
rollback images, do not change API contracts, and do not open SCN-001 live/backend
document draft generation.
```
