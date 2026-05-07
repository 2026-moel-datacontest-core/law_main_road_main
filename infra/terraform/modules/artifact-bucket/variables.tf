variable "project_id" {
  description = "GCP project id."
  type        = string
}

variable "bucket_name" {
  description = "Globally unique artifact bucket name."
  type        = string
}

variable "location" {
  description = "GCS bucket location."
  type        = string
}

variable "labels" {
  description = "Bucket labels."
  type        = map(string)
  default     = {}
}

variable "lifecycle_delete_age_days" {
  description = "Optional object TTL in days. Set null to omit the lifecycle rule."
  type        = number
  default     = 30
}
