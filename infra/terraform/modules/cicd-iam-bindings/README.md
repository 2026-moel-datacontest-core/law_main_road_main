# cicd-iam-bindings

Phase 5 deploy IAM module for keyless GitHub Actions.

Creates additive IAM bindings only:

- `github-actions-sa` Artifact Registry writer on the dev Docker repository,
- `github-actions-sa` token creator on `terraform-sa`,
- reviewed project roles for `terraform-sa`,
- Terraform state bucket access for `terraform-sa`,
- `terraform-sa` `roles/iam.serviceAccountUser` on runtime service accounts.

Does not create service account keys, GitHub secrets, runtime service accounts,
Cloud Run services, secret versions, databases, or prod resources.

Keep runtime service accounts out of deploy/Terraform admin roles. They should
remain Cloud Run runtime identities only.
