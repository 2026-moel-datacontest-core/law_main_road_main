# secret-manager

Creates Secret Manager secret resources only.

Forbidden in this module:

- `google_secret_manager_secret_version`,
- raw secret values,
- service account key JSON,
- Firebase Admin JSON.

Secret versions must be added manually or by a later approved secured CI path
outside Terraform state.

Verification:

```bash
gcloud secrets describe <secret-id> --project <project-id>
```

IAM and destructive behavior:

- This module creates secret shells only; IAM grants are owned by the env root
  so access stays explicit per phase.
- Destroying a secret shell can remove all manually added versions. Do not
  destroy after values are populated unless a separate secret rotation/cleanup
  plan is approved.
