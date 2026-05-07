# Cloud Run Service Module

Reusable Cloud Run v2 service module for the cloud migration runtime phases.

This module owns:

- `google_cloud_run_v2_service`,
- optional public `roles/run.invoker` binding,
- runtime service account attachment,
- plain env vars,
- Secret Manager env references,
- optional Cloud SQL connector volume,
- revision scaling, concurrency, timeout, and traffic to latest.

It does not create images, Secret Manager versions, service account keys,
Firebase Admin JSON, DB users/passwords, or application data.

Use immutable Artifact Registry image digests when possible. Secret env vars must
reference existing Secret Manager secrets and versions only; do not pass secret
payloads into Terraform variables.
