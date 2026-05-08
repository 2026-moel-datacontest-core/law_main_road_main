# Phase 6 Observability / Reliability Runbook

기준일: `2026-05-08`

이 문서는 dev profile Phase 6 운영 점검 절차다. Public 문서나 발표 자료에는
정확한 GCP project id, service account email, bucket name, Cloud SQL connection
name, WIF provider name, direct `run.app` URL, raw log line을 복사하지 않는다.

## 1. Terraform Plan Gates

Ops root:

```bash
cd infra/terraform/envs/dev/ops
terraform init \
  -backend-config="bucket=<state-bucket-name>" \
  -backend-config="prefix=envs/dev/ops"
terraform fmt -check
terraform validate
terraform plan -detailed-exitcode -var-file=terraform.tfvars.example
```

Expected first plan:

- creates log-based metrics,
- creates Cloud Monitoring alert policies,
- optionally grants minimal ops roles to `terraform-sa`,
- has no destroy,
- has empty `notification_channels` until receiver approval.

Foundation cleanup policy gate:

```bash
cd infra/terraform/envs/dev/foundation
terraform plan -detailed-exitcode -var-file=terraform.tfvars.example
```

Expected Phase 6 plan:

- updates the foundation-owned Artifact Registry repository in place,
- keeps cleanup policy dry-run enabled,
- adds KEEP policies for recent backend/frontend images,
- adds a dry-run delete policy for old untagged backend/frontend images,
- has no destroy.

Do not apply either root until alert receiver, threshold/noise, cleanup retention,
and rollback-image retention decisions are approved.

First dev apply status on `2026-05-08`:

- receiver/owner approved: team email channel, LMR Team,
- thresholds: dev defaults,
- Artifact Registry cleanup: dry-run enabled,
- Cloud SQL restore test: deferred,
- prod: not opened.

When applying alert policies, pass the approved channel at apply time rather than
committing it to `terraform.tfvars.example`:

```bash
terraform plan -detailed-exitcode \
  -var-file=terraform.tfvars.example \
  -var='notification_channels=["<approved-channel-resource>"]' \
  -out=tfplan.phase6-ops
terraform apply tfplan.phase6-ops
```

Post-apply checks:

```bash
terraform plan -detailed-exitcode -var-file=terraform.tfvars.example
terraform plan -detailed-exitcode \
  -var-file=terraform.tfvars.example \
  -var='notification_channels=["<approved-channel-resource>"]'
```

Expected result after the first apply: both roots report no changes.

## 2. Sensitive Log Sampling

Default check is summary-only. Do not print raw `textPayload`,
`jsonPayload.message`, stack traces, request bodies, tokens, direct URLs, `gs://`
paths, service account emails, DB URLs, Firebase uid/provider subject, email,
raw OCR text, raw Bridge payload, raw `after_query_seed`, or full answer/draft
payloads.

Safe shape:

```bash
gcloud logging read '<bounded-filter>' \
  --freshness=2h \
  --limit=500 \
  --format='value(severity)' | sort | uniq -c
```

Sensitive pattern check should report only category names and counts. If a hit
appears, record the source route/window and mitigation. Do not paste the raw
matched log into docs or issues.

## 3. Backup / PITR Check

For dev, Phase 2 selected automated backups with short retention and PITR off.
Confirm the latest automated backup timestamp before destructive DB work:

```bash
gcloud sql backups list \
  --instance=<dev-sql-instance-name> \
  --limit=5 \
  --format='table(id,status,type,windowStartTime)'
```

Record:

- latest successful automated backup timestamp,
- backup retention count,
- PITR on/off,
- whether actual restore test was run or explicitly deferred.

Actual restore testing is human-only because it creates/mutates DB resources and
requires a restore target, cost, and cleanup decision.

## 4. Rollback Drill

Phase 5 already rehearsed dev rollback and restore through the manual GitHub
workflow. Phase 6 can reuse that as baseline evidence, then run a new safe drill
only after the operator approves a drill window.

Minimum safe re-check after a rollback or restore:

```bash
curl -fsS <backend-url>/health
curl -fsS <frontend-url> >/dev/null
```

Do not paste direct `run.app` URLs in public evidence. If manual traffic shift
is used, reconcile Terraform runtime state afterward.

## 5. Human-Only Gates

- notification channel receiver and incident owner,
- alert thresholds if they affect routing/noise,
- billing budget/account permissions,
- cleanup policy dry-run disablement,
- lifecycle deletion windows,
- actual Cloud SQL restore test,
- destructive cleanup or destroy,
- prod opening or public demo posture change.
