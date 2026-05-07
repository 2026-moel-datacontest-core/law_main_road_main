# artifact-bucket

Creates the private runtime artifact bucket used later by the backend GCS
adapter.

Security defaults:

- public access prevention enforced,
- uniform bucket-level access enabled,
- no public IAM bindings,
- `force_destroy = false`,
- optional lifecycle delete rule, default 30 days.

This bucket is not a public frontend static/media bucket and does not open
artifact retrieval, signed URLs, or an auth proxy.

Verification:

```bash
gcloud storage buckets describe gs://<bucket-name>
```

Rollback/destructive behavior:

- `force_destroy = false` prevents Terraform from deleting non-empty buckets.
- No public IAM binding is created by this module.
- Destroy only before runtime artifacts exist or after reviewed export/deletion
  approval.
