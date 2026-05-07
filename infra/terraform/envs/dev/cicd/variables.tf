variable "project_id" {
  description = "Existing GCP project id."
  type        = string
}

variable "env" {
  description = "Environment name. Phase 5 first apply-ready CI/CD root is dev only."
  type        = string
  default     = "dev"

  validation {
    condition     = var.env == "dev"
    error_message = "Only dev is apply-ready in this Phase 5 CI/CD root."
  }
}

variable "region" {
  description = "Primary GCP region."
  type        = string
  default     = "asia-northeast3"
}

variable "prefix" {
  description = "Short resource prefix."
  type        = string
  default     = "lmr"
}

variable "owner" {
  description = "Owner label value."
  type        = string
  default     = "portfolio"
}

variable "labels" {
  description = "Additional labels merged into managed resources."
  type        = map(string)
  default     = {}
}

variable "foundation_state_bucket" {
  description = "Phase 1 Terraform state bucket that contains envs/dev/foundation outputs."
  type        = string
  default     = "lmr-dev-law-main-road-tfstate"
}

variable "foundation_state_prefix" {
  description = "Remote-state prefix for Phase 1 dev foundation outputs."
  type        = string
  default     = "envs/dev/foundation"
}

variable "github_repository_owner" {
  description = "Private GitHub organization/user owner allowed for deploy WIF."
  type        = string
  default     = "2026-moel-datacontest-core"

  validation {
    condition     = var.github_repository_owner == "2026-moel-datacontest-core"
    error_message = "Phase 5 dev WIF must stay bound to the private deploy/source owner only."
  }
}

variable "github_repository" {
  description = "Private GitHub source repository allowed for deploy WIF, formatted as OWNER/REPO."
  type        = string
  default     = "2026-moel-datacontest-core/law_main_road_main"

  validation {
    condition     = var.github_repository == "2026-moel-datacontest-core/law_main_road_main"
    error_message = "Phase 5 dev WIF must stay bound to the private source repository only."
  }
}

variable "allowed_github_environments" {
  description = "GitHub environments allowed to mint WIF credentials."
  type        = set(string)
  default     = ["dev"]

  validation {
    condition     = length(setsubtract(var.allowed_github_environments, toset(["dev"]))) == 0
    error_message = "This dev-only CI/CD root may allow only the GitHub dev environment."
  }
}

variable "allowed_github_refs" {
  description = "Git refs allowed to mint WIF credentials for dev deploys."
  type        = set(string)
  default = [
    "refs/heads/cloud_migration",
    "refs/heads/main",
  ]

  validation {
    condition = length(setsubtract(var.allowed_github_refs, toset([
      "refs/heads/cloud_migration",
      "refs/heads/main",
    ]))) == 0
    error_message = "This dev-only CI/CD root may allow only main and cloud_migration refs."
  }
}

variable "allowed_github_workflow_refs" {
  description = "GitHub workflow_ref values allowed to mint WIF credentials for dev deploys."
  type        = set(string)
  default = [
    "2026-moel-datacontest-core/law_main_road_main/.github/workflows/deploy-dev.yml@refs/heads/cloud_migration",
    "2026-moel-datacontest-core/law_main_road_main/.github/workflows/deploy-dev.yml@refs/heads/main",
    "2026-moel-datacontest-core/law_main_road_main/.github/workflows/rollback-dev.yml@refs/heads/cloud_migration",
    "2026-moel-datacontest-core/law_main_road_main/.github/workflows/rollback-dev.yml@refs/heads/main",
  ]

  validation {
    condition = length(setsubtract(var.allowed_github_workflow_refs, toset([
      "2026-moel-datacontest-core/law_main_road_main/.github/workflows/deploy-dev.yml@refs/heads/cloud_migration",
      "2026-moel-datacontest-core/law_main_road_main/.github/workflows/deploy-dev.yml@refs/heads/main",
      "2026-moel-datacontest-core/law_main_road_main/.github/workflows/rollback-dev.yml@refs/heads/cloud_migration",
      "2026-moel-datacontest-core/law_main_road_main/.github/workflows/rollback-dev.yml@refs/heads/main",
    ]))) == 0
    error_message = "This dev-only CI/CD root may allow only deploy-dev.yml and rollback-dev.yml on main/cloud_migration."
  }
}

variable "terraform_service_account_project_roles" {
  description = "Additional non-Owner/Editor roles for terraform-sa to manage approved Phase 5 and runtime deploy roots."
  type        = set(string)
  default = [
    "roles/iam.workloadIdentityPoolAdmin",
    "roles/resourcemanager.projectIamAdmin",
    "roles/run.admin",
  ]

  validation {
    condition = length(setintersection(var.terraform_service_account_project_roles, toset([
      "roles/editor",
      "roles/firebase.sdkAdminServiceAgent",
      "roles/iam.serviceAccountKeyAdmin",
      "roles/owner",
    ]))) == 0
    error_message = "Terraform service account roles must not include Owner, Editor, service account key admin, or Firebase service-agent roles."
  }
}
