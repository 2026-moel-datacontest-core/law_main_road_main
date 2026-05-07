variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "services" {
  description = "Project services to enable."
  type        = set(string)
}
