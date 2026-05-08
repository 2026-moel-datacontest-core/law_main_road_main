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

- Phase 6 can pass cleanup policies to this module. Keep
  `cleanup_policy_dry_run = true` until image retention and rollback impact is
  approved.
- Do not configure a delete policy that can remove current or previous stable
  rollback images before smoke evidence is recorded.
