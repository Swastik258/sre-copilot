locals {
  secret_values = merge(
    { DATABASE_URL = var.database_url },
    var.secret_data,
  )
  managed_secret_name = try(kubernetes_secret_v1.app_secret[0].metadata[0].name, "")
  secret_name         = local.managed_secret_name != "" ? local.managed_secret_name : var.existing_secret_name
  pull_secrets        = [for name in var.image_pull_secrets : { name = name }]
}

resource "kubernetes_namespace_v1" "app" {
  metadata {
    name = var.namespace
    labels = {
      "app.kubernetes.io/part-of"    = "sre-copilot"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }
}

resource "kubernetes_secret_v1" "app_secret" {
  count = var.manage_secret ? 1 : 0

  metadata {
    name      = "${var.release_name}-secrets"
    namespace = kubernetes_namespace_v1.app.metadata[0].name
    labels = {
      "app.kubernetes.io/part-of"    = "sre-copilot"
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  type = "Opaque"
  data = local.secret_values

  lifecycle {
    precondition {
      condition     = lookup(local.secret_values, "DATABASE_URL", "") != ""
      error_message = "database_url (or secret_data.DATABASE_URL) is required when manage_secret is true."
    }
  }
}

resource "helm_release" "sre_copilot" {
  name            = var.release_name
  namespace       = kubernetes_namespace_v1.app.metadata[0].name
  chart           = "${path.module}/../../helm/sre-copilot"
  atomic          = true
  cleanup_on_fail = true
  wait            = true
  timeout         = 900

  values = [
    yamlencode({
      imagePullSecrets = local.pull_secrets
      backend = {
        replicaCount = var.backend_replicas
        image = {
          repository = var.backend_image_repository
          tag        = var.backend_image_tag
          digest     = ""
        }
        existingSecret = local.secret_name
        createSecret   = false
        env            = var.backend_env
      }
      frontend = {
        replicaCount = var.frontend_replicas
        image = {
          repository = var.frontend_image_repository
          tag        = var.frontend_image_tag
          digest     = ""
        }
      }
      ingress = {
        enabled     = var.ingress_enabled
        className   = var.ingress_class_name
        annotations = var.ingress_annotations
        host        = var.ingress_host
        tls = {
          enabled    = var.ingress_tls_secret_name != ""
          secretName = var.ingress_tls_secret_name
        }
      }
      autoscaling = {
        enabled = var.autoscaling_enabled
      }
      networkPolicy = {
        enabled = var.network_policy_enabled
      }
      migrations = {
        enabled = var.migrations_enabled
      }
    })
  ]

  depends_on = [
    kubernetes_namespace_v1.app,
    kubernetes_secret_v1.app_secret,
  ]
}
