# iam-wif

Phase 1 uses this module for the service-account foundation slice. Phase 5 can
also enable the GitHub Actions Workload Identity Federation slice without
creating new service account keys.

Creates:

- runtime service accounts,
- later deploy/Terraform service accounts,
- optional non-Owner/Editor project IAM grants for the Terraform service account.
- optional GitHub Actions Workload Identity Pool/Provider,
- optional `roles/iam.workloadIdentityUser` binding on the existing
  GitHub Actions service account.

Does not create:

- service account keys.

Phase 5 WIF must be enabled only from a dedicated `cicd` root with the real
private deploy repository. Do not grant the public/submission mirror repository
access to the provider or service account.

Verification:

```bash
gcloud iam service-accounts describe <service-account-email> --project <project-id>
```

IAM and destructive behavior:

- Uses additive IAM member resources, not authoritative project IAM policy.
- Rejects Owner, Editor, service-account-key admin, and Firebase service-agent
  roles through variable validation.
- Does not create service account keys.
- The GitHub WIF provider can require repository owner/name, environment, ref,
  and workflow path claims through its CEL attribute condition.
- Deleting a service account can break later phases; destroy only before
  dependent resources exist or after a reviewed cleanup plan.
