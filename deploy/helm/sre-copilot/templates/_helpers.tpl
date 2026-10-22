{{- define "sre-copilot.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "sre-copilot.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "sre-copilot.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "sre-copilot.labels" -}}
helm.sh/chart: {{ include "sre-copilot.chart" . }}
app.kubernetes.io/name: {{ include "sre-copilot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "sre-copilot.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "sre-copilot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: backend
{{- end }}

{{- define "sre-copilot.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "sre-copilot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: frontend
{{- end }}

{{- define "sre-copilot.backend.fullname" -}}
{{- printf "%s-backend" (include "sre-copilot.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "sre-copilot.frontend.fullname" -}}
{{- printf "%s-frontend" (include "sre-copilot.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "sre-copilot.configMapName" -}}
{{- printf "%s-config" (include "sre-copilot.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "sre-copilot.secretName" -}}
{{- if .Values.backend.createSecret }}
{{- printf "%s-secrets" (include "sre-copilot.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- required "backend.existingSecret is required when createSecret is false" .Values.backend.existingSecret }}
{{- end }}
{{- end }}

{{- define "sre-copilot.serviceAccountName" -}}
{{- if .Values.backend.serviceAccount.create }}
{{- default (include "sre-copilot.fullname" .) .Values.backend.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.backend.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "sre-copilot.image" -}}
{{- if .image.digest }}
{{- printf "%s@%s" .image.repository .image.digest }}
{{- else }}
{{- printf "%s:%s" .image.repository (.image.tag | default .appVersion) }}
{{- end }}
{{- end }}

{{- define "sre-copilot.imagePullSecrets" -}}
{{- with .Values.imagePullSecrets }}
imagePullSecrets:
{{- toYaml . | nindent 2 }}
{{- end }}
{{- end }}
