# Log-Based Metrics Module

Creates project-scoped Cloud Logging counter metrics for Phase 6 operations.

The module intentionally creates only counter metrics:

- `DELTA`
- `INT64`
- unit `1`

Filters should specify a single monitored resource type where possible, for
example `resource.type="cloud_run_revision"`, so Cloud Monitoring charts and
alerts can resolve the metric cleanly.

Do not use this module to extract raw payload fields, Firebase identifiers,
tokens, Secret Manager values, Cloud SQL connection names, object paths, or raw
case facts into metric labels.
