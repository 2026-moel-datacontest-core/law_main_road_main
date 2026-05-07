# project-services

Enables required Google APIs for a phase root.

Phase 1 split:

- `bootstrap/remote-state` owns `storage.googleapis.com`,
  `serviceusage.googleapis.com`, and `cloudresourcemanager.googleapis.com`
  because those are needed before the remote state bucket exists.
- `envs/dev/foundation` owns the remaining Phase 1-6 APIs needed after
  bootstrap.

This module sets `disable_on_destroy = false` so destroying the Terraform root
does not unexpectedly disable shared project APIs.

Verification:

```bash
gcloud services list --enabled --project <project-id>
```

Rollback/destructive behavior:

- Terraform removal does not disable APIs because `disable_on_destroy = false`.
- If an API must be disabled, do it through a separate reviewed cleanup step
  after dependency checks.
