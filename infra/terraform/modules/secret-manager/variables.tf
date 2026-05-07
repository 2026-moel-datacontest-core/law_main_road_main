variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "secrets" {
  description = "Secret Manager secret shells to create. Values/versions are intentionally out of scope."
  type = map(object({
    secret_id = string
    labels    = optional(map(string), {})
  }))
}

variable "labels" {
  description = "Common labels for secret resources."
  type        = map(string)
  default     = {}
}
