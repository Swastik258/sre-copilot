"""Deterministic infrastructure-code generation.

The output is a proposal. Nothing is applied, committed, or written outside the
response. Templates deliberately include baseline reliability and security
defaults so the first review starts from a safer shape.
"""

from __future__ import annotations

from app.schemas.evidence import EvidenceSource, Severity
from app.schemas.infra import (
    GeneratedFile,
    InfraGenerateRequest,
    InfraGenerateResponse,
    InfraPolicyFinding,
)
from app.services.evidence import build_evidence


def _labels(request: InfraGenerateRequest) -> str:
    return (
        f"    app.kubernetes.io/name: {request.name}\n"
        f"    app.kubernetes.io/instance: {request.name}\n"
        "    app.kubernetes.io/managed-by: sre-copilot\n"
        f"    app.kubernetes.io/environment: {request.environment}"
    )


def _deployment(request: InfraGenerateRequest) -> str:
    return f"""apiVersion: apps/v1
kind: Deployment
metadata:
  name: {request.name}
  namespace: {request.namespace}
  labels:
{_labels(request)}
spec:
  replicas: {request.replicas}
  selector:
    matchLabels:
      app.kubernetes.io/name: {request.name}
      app.kubernetes.io/instance: {request.name}
  template:
    metadata:
      labels:
{_labels(request)}
    spec:
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: {request.name}
          image: {request.image}
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: {request.port}
              protocol: TCP
          resources:
            requests:
              cpu: {request.cpu_request or "100m"}
              memory: {request.memory_request or "128Mi"}
            limits:
              cpu: {request.cpu_limit or "500m"}
              memory: {request.memory_limit or "512Mi"}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          readinessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 2
            failureThreshold: 3
          livenessProbe:
            httpGet:
              path: /healthz
              port: http
            initialDelaySeconds: 15
            periodSeconds: 20
            timeoutSeconds: 2
            failureThreshold: 3
"""


def _service(request: InfraGenerateRequest) -> str:
    return f"""apiVersion: v1
kind: Service
metadata:
  name: {request.name}
  namespace: {request.namespace}
  labels:
{_labels(request)}
spec:
  type: ClusterIP
  selector:
    app.kubernetes.io/name: {request.name}
    app.kubernetes.io/instance: {request.name}
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
"""


def _tf_name(name: str) -> str:
    return name.replace("-", "_")


def _terraform_files(request: InfraGenerateRequest) -> list[GeneratedFile]:
    resource = _tf_name(request.name)
    return [
        GeneratedFile(
            path="versions.tf",
            language="hcl",
            content="""terraform {
  required_version = ">= 1.6.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.30, < 3.0"
    }
  }
}
""",
        ),
        GeneratedFile(
            path="variables.tf",
            language="hcl",
            content=f"""variable "namespace" {{
  description = "Target Kubernetes namespace."
  type        = string
  default     = "{request.namespace}"
}}

variable "image" {{
  description = "Container image reference with an explicit tag or digest."
  type        = string
  default     = "{request.image}"
}}

variable "replicas" {{
  description = "Desired replica count."
  type        = number
  default     = {request.replicas}
}}

variable "port" {{
  description = "Container HTTP port."
  type        = number
  default     = {request.port}
}}

variable "environment" {{
  description = "Environment label."
  type        = string
  default     = "{request.environment}"
}}
""",
        ),
        GeneratedFile(
            path="main.tf",
            language="hcl",
            content=f"""resource "kubernetes_deployment_v1" "{resource}" {{
  metadata {{
    name      = "{request.name}"
    namespace = var.namespace
    labels = {{
      "app.kubernetes.io/name"        = "{request.name}"
      "app.kubernetes.io/instance"    = "{request.name}"
      "app.kubernetes.io/managed-by"  = "sre-copilot"
      "app.kubernetes.io/environment" = var.environment
    }}
  }}

  spec {{
    replicas = var.replicas
    selector {{
      match_labels = {{
        "app.kubernetes.io/name"     = "{request.name}"
        "app.kubernetes.io/instance" = "{request.name}"
      }}
    }}
    template {{
      metadata {{
        labels = {{
          "app.kubernetes.io/name"     = "{request.name}"
          "app.kubernetes.io/instance" = "{request.name}"
        }}
      }}
      spec {{
        security_context {{
          run_as_non_root = true
          seccomp_profile {{
            type = "RuntimeDefault"
          }}
        }}
        container {{
          name  = "{request.name}"
          image = var.image
          port {{
            name           = "http"
            container_port = var.port
          }}
          resources {{
            requests = {{
              cpu    = "{request.cpu_request or "100m"}"
              memory = "{request.memory_request or "128Mi"}"
            }}
            limits = {{
              cpu    = "{request.cpu_limit or "500m"}"
              memory = "{request.memory_limit or "512Mi"}"
            }}
          }}
          security_context {{
            allow_privilege_escalation = false
            read_only_root_filesystem  = true
            capabilities {{
              drop = ["ALL"]
            }}
          }}
          readiness_probe {{
            http_get {{
              path = "/healthz"
              port = "http"
            }}
            initial_delay_seconds = 5
            period_seconds        = 10
          }}
          liveness_probe {{
            http_get {{
              path = "/healthz"
              port = "http"
            }}
            initial_delay_seconds = 15
            period_seconds        = 20
          }}
        }}
      }}
    }}
  }}
}}

resource "kubernetes_service_v1" "{resource}_service" {{
  metadata {{
    name      = "{request.name}"
    namespace = var.namespace
    labels = {{
      "app.kubernetes.io/name"        = "{request.name}"
      "app.kubernetes.io/instance"    = "{request.name}"
      "app.kubernetes.io/managed-by"  = "sre-copilot"
      "app.kubernetes.io/environment" = var.environment
    }}
  }}
  spec {{
    selector = {{
      "app.kubernetes.io/name"     = "{request.name}"
      "app.kubernetes.io/instance" = "{request.name}"
    }}
    port {{
      name        = "http"
      port        = 80
      target_port = "http"
    }}
  }}
}}
""",
        ),
        GeneratedFile(
            path="outputs.tf",
            language="hcl",
            content=f"""output "deployment_name" {{
  description = "Generated Deployment name."
  value       = kubernetes_deployment_v1.{resource}.metadata[0].name
}}

output "service_name" {{
  description = "Generated Service name."
  value       = kubernetes_service_v1.{resource}_service.metadata[0].name
}}
""",
        ),
    ]


def _findings(request: InfraGenerateRequest) -> list[InfraPolicyFinding]:
    findings: list[InfraPolicyFinding] = []
    image = request.image.rsplit("@", 1)[0]
    if image.endswith(":latest") or ":" not in image.rsplit("/", 1)[-1]:
        findings.append(
            InfraPolicyFinding(
                severity=Severity.medium,
                rule="image-tag",
                message=(
                    "Use an explicit immutable tag or digest instead of latest or an implicit tag."
                ),
                path="deployment.yaml" if request.kind != "terraform_module" else "variables.tf",
            )
        )
    if request.namespace == "default":
        findings.append(
            InfraPolicyFinding(
                severity=Severity.low,
                rule="namespace",
                message="The default namespace is not a strong isolation boundary.",
            )
        )
    if not request.cpu_limit or not request.memory_limit:
        findings.append(
            InfraPolicyFinding(
                severity=Severity.medium,
                rule="resource-limits",
                message="Set CPU and memory limits to bound noisy-neighbour risk.",
            )
        )
    if not request.cpu_request or not request.memory_request:
        findings.append(
            InfraPolicyFinding(
                severity=Severity.low,
                rule="resource-requests",
                message="Set requests so the scheduler can place the workload.",
            )
        )
    return findings


def generate_infra_code(request: InfraGenerateRequest) -> InfraGenerateResponse:
    findings = _findings(request)
    if request.kind == "kubernetes_deployment":
        files = [
            GeneratedFile(
                path="deployment.yaml",
                language="yaml",
                content=_deployment(request),
            )
        ]
    elif request.kind == "kubernetes_service":
        files = [
            GeneratedFile(
                path="service.yaml",
                language="yaml",
                content=_service(request),
            )
        ]
    else:
        files = _terraform_files(request)

    summary = (
        f"Generated {len(files)} proposed file(s) for {request.kind} "
        f"'{request.name}' in {request.namespace}; {len(findings)} policy note(s). "
        "Nothing was applied or written."
    )
    evidence = build_evidence(
        source_type=EvidenceSource.system,
        summary=summary,
        payload={
            "kind": request.kind,
            "name": request.name,
            "namespace": request.namespace,
            "image": request.image,
            "replicas": request.replicas,
            "port": request.port,
            "files": [file.path for file in files],
            "findings": [finding.model_dump(mode="json") for finding in findings],
        },
        source_resource=f"{request.kind}/{request.name}",
        environment=request.environment,
        severity=(
            Severity.medium
            if any(finding.severity in {Severity.high, Severity.critical} for finding in findings)
            else Severity.info
        ),
        provenance="infra.generate",
    )
    return InfraGenerateResponse(
        kind=request.kind,
        files=files,
        findings=findings,
        summary=summary,
        evidence=[evidence],
        demo=False,
    )
