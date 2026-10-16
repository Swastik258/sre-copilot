# AI providers

> **Status: partially configured, not implemented.** Provider *selection* and
> status reporting exist (see `GET /api/v1/integrations`), but no request is ever
> sent to a model yet. The reasoning layer (Module H) arrives in Milestone 3.

## Intended design

- One provider-independent interface, with these adapters:
  - `mock` — deterministic, no external calls (default).
  - `openai` — OpenAI-compatible chat completions.
  - `anthropic` — Anthropic messages API.
- All model output validated against strict Pydantic schemas.
- Timeouts, retries with limits, and graceful degradation to a deterministic
  fallback.
- Provider/model metadata recorded with each diagnosis (never keys).

## Configuration

| Env var | Purpose |
|---------|---------|
| `AI_PROVIDER` | `mock` \| `openai` \| `anthropic` |
| `AI_MODEL` | Model name |
| `AI_TIMEOUT_SECONDS` | Request timeout |
| `AI_MAX_OUTPUT_TOKENS` | Output cap |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | OpenAI-compatible provider |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL` | Anthropic provider |

## Privacy mode

Set `AI_PRIVACY_MODE=true` to **prevent any external LLM transmission**. When
enabled, external providers are rejected at call time and the integration status
endpoint reports the provider as unconfigured. This is the recommended setting
when handling sensitive operational data.

## Cost & data handling

- Prefer the `mock` provider for development and tests.
- Do not send more infrastructure data than necessary.
- API keys are backend-only and must never reach the browser.
- Never trust model-generated tool names, commands, or permissions; the model
  cannot bypass backend authorization.
