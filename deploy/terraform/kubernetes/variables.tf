variable "kubeconfig_path" {
  description = "Path to the kubeconfig used by the Kubernetes and Helm providers. Null uses provider defaults."
  type        = string
  default     = null
}

variable "kube_context" {
  description = "Optional kubeconfig context."
  type        = string
  default     = null
}

variable "namespace" {
  description = "Kubernetes namespace to create and deploy into."
  type        = string
  default     = "sre-copilot"

  validation {
    condition     = can(regex("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$", var.namespace))
    error_message = "namespace must be a valid DNS label."
  }
}

variable "release_name" {
  description = "Helm release name."
  type        = string
  default     = "sre-copilot"
}

variable "backend_image_repository" {
  description = "Backend image repository."
  type        = string
  default     = "ghcr.io/swastik258/sre-copilot-backend"
}

variable "backend_image_tag" {
  description = "Backend image tag. Prefer pinning the release workflow output."
  type        = string
  default     = "0.2.0"
}

variable "frontend_image_repository" {
  description = "Frontend image repository."
  type        = string
  default     = "ghcr.io/swastik258/sre-copilot-frontend"
}

variable "frontend_image_tag" {
  description = "Frontend image tag."
  type        = string
  default     = "0.2.0"
}

variable "image_pull_secrets" {
  description = "Names of existing image pull secrets."
  type        = list(string)
  default     = []
}

variable "backend_replicas" {
  description = "Backend replica count when autoscaling is disabled."
  type        = number
  default     = 2
}

variable "frontend_replicas" {
  description = "Frontend replica count when autoscaling is disabled."
  type        = number
  default     = 2
}

variable "manage_secret" {
  description = "Create the application Kubernetes Secret from Terraform. Set false to use an externally managed secret."
  type        = bool
  default     = true
}

variable "existing_secret_name" {
  description = "Existing Secret name when manage_secret is false."
  type        = string
  default     = "sre-copilot-secrets"
}

variable "database_url" {
  description = "PostgreSQL DSN stored in the managed application Secret. Required when manage_secret is true."
  type        = string
  sensitive   = true
  default     = ""
}

variable "secret_data" {
  description = "Additional Secret keys (for example CREDENTIAL_ENCRYPTION_KEY or METRICS_BEARER_TOKEN)."
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "backend_env" {
  description = "Non-secret backend environment overrides applied to the Helm chart."
  type        = map(string)
  default = {
    CORS_ORIGINS = "https://app.example.com"
    APP_BASE_URL = "https://app.example.com"
  }
}

variable "ingress_enabled" {
  description = "Expose the application through an Ingress."
  type        = bool
  default     = false
}

variable "ingress_class_name" {
  description = "Ingress class name."
  type        = string
  default     = "nginx"
}

variable "ingress_host" {
  description = "Application hostname."
  type        = string
  default     = "app.example.com"
}

variable "ingress_tls_secret_name" {
  description = "TLS Secret name. Leave empty to disable TLS."
  type        = string
  default     = ""
}

variable "ingress_annotations" {
  description = "Ingress annotations."
  type        = map(string)
  default     = {}
}

variable "autoscaling_enabled" {
  description = "Enable CPU-based autoscaling for both deployments."
  type        = bool
  default     = false
}

variable "network_policy_enabled" {
  description = "Enable the in-cluster NetworkPolicies. Verify that probes and ingress traffic are allowed by your CNI."
  type        = bool
  default     = false
}

variable "migrations_enabled" {
  description = "Run Alembic migrations as a Helm pre-install/pre-upgrade Job."
  type        = bool
  default     = true
}
