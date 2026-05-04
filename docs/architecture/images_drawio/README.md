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
