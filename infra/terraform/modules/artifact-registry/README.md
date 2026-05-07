# artifact-registry

Creates one regional Docker repository for backend/frontend container images.

Phase 1 does not build or push images. Cleanup policies are deferred to Phase 6
unless a later phase explicitly opens them earlier.

Verification:

```bash
gcloud artifacts repositories describe <repo-id> \
  --location <region> \
  --project <project-id>
```

Rollback/destructive behavior:

- No image cleanup policy is configured in Phase 1.
- Delete only before images or deploy pipelines depend on the repository, or
  after a reviewed image retention/rollback plan.
