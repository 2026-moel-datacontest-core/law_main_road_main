variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "location" {
  description = "Artifact Registry location."
  type        = string
}

variable "repository_id" {
  description = "Artifact Registry repository id."
  type        = string
}

variable "description" {
  description = "Repository description."
  type        = string
  default     = "Docker images for law-main-road cloud migration."
}

variable "labels" {
  description = "Repository labels."
  type        = map(string)
  default     = {}
}
