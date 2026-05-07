# Cloud Migration Draw.io Sources

Status: active visual source files

This folder contains draw.io source files for the cloud migration architecture
presentation and implementation handoff.

Decision authority remains in
[`../cloud_migration_architecture.md`](../cloud_migration_architecture.md) and
[`../cloud_migration_phase_plan.md`](../cloud_migration_phase_plan.md). The
draw.io files are visual sources; PNG files are generated previews. If a diagram
conflicts with the markdown architecture or phase plan, update the diagram or
treat the preview as stale.

| File | Purpose |
|---|---|
| `final_architecture_overview.drawio` | 16:9 executive overview diagram. Use this for issue/README/presentation-level explanation. |
| `final_architecture_overview.drawio.png` | Rendered overview preview; regenerate after every overview draw.io edit. |
| `final_architecture_detail.drawio` | Detailed implementation-oriented handoff diagram. Use this for Terraform authoring and phase handoff context. |
| `final_architecture_detail.drawio.png` | Rendered detail preview; regenerate after every detail draw.io edit. |

These files visualize the target GCP migration architecture only. They do not
change runtime contracts, Terraform ownership, cloud resource names, or phase
decisions.

If the draw.io files are edited later, re-export or regenerate the PNG previews
so the source and image do not drift. Required visual semantics:

- overview is an executive one-screen diagram, not a full implementation map;
- detail is an implementation handoff diagram with clear ownership, runtime, ops,
  blocker, forbidden, and deferred sections;
- color means domain and line pattern means status;
- solid lines are active/owned flows or resources in the target architecture;
- dashed red `secrets` means runtime dependency on Secret Manager, not secret
  values in Terraform or GitHub logs;
- dashed orange `image digest` means deploy-time image reference passed from
  CI/scripts into Terraform-owned Cloud Run service updates;
- dashed gray `same layout` / deferred edge means parity or optional future
  structure, not a created resource in the current phase;
- dashed green `target after adapter` means future durable artifact path after
  the GCS adapter, not an active Cloud Run filesystem replacement today;
- CORS is browser-origin control only; public Vertex-calling paths need
  server-side rate/cost guardrails or dev/demo-only marking;
- Terraform-owned Cloud Run revisions are created by Terraform service updates
  from an image digest/tag, while CI/scripts build/push images and run smoke.

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
| Google Material Symbols / Material Design Icons, `https://github.com/google/material-design-icons` | Local bootstrap state file and Terraform environment folder icons |

`example_images/10_architecture_overview.png`,
`example_images/12_observability_fix_final.drawio.png`, and
`example_images/observability_fix_final.drawio` were used only as layout and
line-style references. `example_images/argocd이미지_정사각형비율.png` was reviewed
only to avoid carrying Argo CD into this cloud migration target; Argo CD is not
included as a target component.
