# Dev Frontend Runtime

Phase 4 dev-only frontend runtime root.

This root plans the Next.js frontend Cloud Run service using a pre-built
Artifact Registry image. The image must be built outside Terraform with
`NEXT_PUBLIC_API_BASE_URL` set to the Phase 3 backend URL and Firebase public web
config passed as build args.

Creates or manages:

- frontend Cloud Run service `lmr-dev-frontend`,
- frontend runtime service account attachment from Phase 1,
- conservative Cloud Run scaling,
- public `roles/run.invoker` for controlled dev smoke,
- frontend URL output used by the Firebase Authorized Domains gate.

Does not create:

- Docker images or pushes,
- Firebase Authorized Domains,
- Firebase Admin JSON or service account key JSON,
- backend Cloud Run or backend API changes,
- backend CORS re-apply,
- WIF/GitHub workflow,
- prod resources,
- raw flow payload storage.

Local syntax validation before remote backend initialization:

```bash
terraform init -backend=false
terraform validate
```

Remote backend plan gate:

```bash
terraform init \
  -backend-config="bucket=lmr-dev-law-main-road-tfstate" \
  -backend-config="prefix=envs/dev/runtime/frontend"
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars.example
```

Do not run `terraform apply` until the Phase 4 apply prompt is approved.

Prerequisites before apply:

- Phase 3 backend runtime smoke is passing.
- Frontend image has been built and pushed to Artifact Registry.
- `frontend_image` is an immutable Artifact Registry digest, not a mutable tag.
- The frontend image was built with the Phase 3 backend URL as
  `NEXT_PUBLIC_API_BASE_URL`.
- Firebase public web config was provided as build args:
  `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID`.
  `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` and
  `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` are optional but should be passed when
  available.

After apply:

1. Add the `firebase_authorized_domain_host` output to Firebase Authentication
   Authorized Domains.
2. Re-apply the backend runtime root with `BACKEND_CORS_ORIGIN_REGEX` set to the
   `backend_cors_origin_regex_candidate` output.
3. Run route, CORS, Google Sign-In, SCN-004 freeze, and SCN-001 boundary smoke.
