output "namespace" {
  description = "Namespace containing the release."
  value       = kubernetes_namespace_v1.app.metadata[0].name
}

output "release_name" {
  description = "Helm release name."
  value       = helm_release.sre_copilot.name
}

output "release_status" {
  description = "Last observed Helm release status."
  value       = helm_release.sre_copilot.status
}

output "secret_name" {
  description = "Secret referenced by the workloads."
  value       = local.secret_name
}
