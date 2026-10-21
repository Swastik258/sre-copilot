# Terraform plan review

> **Status: implemented.** `POST /api/v1/terraform/review` parses a plan JSON
> document and the `/terraform` console renders the result. It never runs
> Terraform, reads cloud credentials, or applies changes.

## Input

Generate JSON from a saved plan or a plan file:

```bash
terraform show -json tfplan > plan.json
```

The request body is the parsed JSON object:

```json
{
  "plan": {
    "format_version": "1.2",
    "terraform_version": "1.9.0",
    "resource_changes": []
  }
}
```

A plan file can be uploaded or pasted into the `/terraform` console. The console
parses it locally, then sends the object to the API.

## What it reports

- Counts for create, update, replace, destroy, read, no-op, and unknown actions.
- A blast-radius classification: `none`, `low`, `medium`, `high`, or `critical`.
- Replacement and destroy actions, including whether Terraform will destroy
  before create or create before destroy.
- Replacement paths and attribute-name changes.
- Unknown values that will not be known until apply.
- Stateful-resource warnings for databases, buckets, volumes, clusters, secrets,
  and similar resources.
- Findings with severity, detail, and an evidence ID.
- Evidence records with provenance, redaction, and integrity fingerprints.

**Attribute values are deliberately omitted.** Plan JSON can contain secrets and
customer data, so only attribute names and change metadata are returned. The
plan-level evidence contains counts and versions only.

## Blast radius

| Level | Meaning |
|-------|---------|
| `none` | No resource changes |
| `low` | Creates or non-stateful updates only |
| `medium` | Stateful updates, unknown values, or unrecognized actions |
| `high` | Replacements or destroys of non-stateful resources |
| `critical` | Replacement or deletion of a stateful resource |

Stateful detection is conservative and heuristic. It is a warning to review the
plan, not a guarantee of data loss. Always inspect the plan in Terraform and
follow your change-management process.

## Safety

- No Terraform binary, provider, state file, or cloud credential is read.
- The service only parses the supplied JSON.
- Values are not returned, so the response is safer to log and display.
- Findings are deterministic; no model call is made.

## Errors

- `422 validation_error` when the request is missing `plan`, `plan` is not an
  object, or `resource_changes`/`actions` have the wrong shape.
- `413 payload_too_large` when the JSON exceeds the API body limit.

## Limits

- Findings and per-change evidence are capped at 50; the full change list is
  still returned.
- Changed-attribute paths are capped at 100 per resource.
- Nested values are compared for equality but never returned.
- The API does not fetch remote state or resolve provider schemas.
