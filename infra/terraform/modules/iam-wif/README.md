# iam-wif

Phase 1 uses this module name only for the service-account foundation slice.

Creates:

- runtime service accounts,
- later deploy/Terraform service accounts,
- optional non-Owner/Editor project IAM grants for the Terraform service account.

Does not create in Phase 1:

- Workload Identity Federation pool/provider,
- GitHub OIDC trust,
- GitHub Actions permissions,
- service account keys.

Those stay in Phase 5.

Verification:

```bash
gcloud iam service-accounts describe <service-account-email> --project <project-id>
```

IAM and destructive behavior:

- Uses additive IAM member resources, not authoritative project IAM policy.
- Rejects Owner, Editor, service-account-key admin, and Firebase service-agent
  roles through variable validation.
- Does not create service account keys.
- Deleting a service account can break later phases; destroy only before
  dependent resources exist or after a reviewed cleanup plan.
