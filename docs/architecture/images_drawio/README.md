# Cloud Migration Draw.io Sources

Status: draft visual source files

This folder contains draw.io source files for the cloud migration architecture
presentation and implementation handoff.

| File | Purpose |
|---|---|
| `cloud_migration_overview.drawio` | Executive overview diagram. Use this for issue/README/presentation-level explanation. |
| `cloud_migration_overview.png` | Rendered overview image preview. |
| `cloud_migration_detail.drawio` | Detailed implementation-oriented diagram. Use this for Terraform authoring and phase handoff context. |
| `cloud_migration_detail.png` | Rendered detail image preview. |

These files visualize the target GCP migration architecture only. They do not
change runtime contracts, Terraform ownership, cloud resource names, or phase
decisions.

If the draw.io files are edited later, re-export or regenerate the PNG previews
so the source and image do not drift.

## Icon Sources

The refreshed diagrams use repo-local copies under `assets/` and embed the
service icons into the draw.io files as base64 image data so they can be opened
without external network access.

| Source | Used for |
|---|---|
| Google Cloud official icon library, `https://cloud.google.com/icons` | Cloud Run, Cloud SQL, Cloud Storage, Secret Manager, Artifact Registry, Cloud Logging, Cloud Monitoring, IAM, Workload Identity, Cloud Load Balancing, Billing/Budget icons |
| Firebase brand guidelines, `https://firebase.google.com/brand-guidelines` | Firebase Auth logomark |
| GitHub Brand Toolkit, `https://brand.github.com/foundations/logo` | GitHub repository icon |
| Repo example image `example_images/github action.png` | GitHub Actions icon, per local allowed reference |
| HashiCorp product logo guidelines, `https://www.hashicorp.com/en/brand/hcp-product-logos` | Terraform logo/logomark |

`example_images/10_architecture_overview.png`,
`example_images/12_observability_fix_final.drawio.png`, and
`example_images/observability_fix_final.drawio` were used only as layout and
line-style references. `example_images/argocd이미지_정사각형비율.png` was reviewed
only to avoid carrying Argo CD into this cloud migration target; Argo CD is not
included as a target component.
