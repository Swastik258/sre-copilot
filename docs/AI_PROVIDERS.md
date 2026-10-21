# AI providers

> **Status: implemented for `mock`, OpenAI-compatible providers, OpenRouter, and
> Anthropic's native Messages API.** AI explanations are optional; deterministic
> diagnosis remains authoritative.

## Providers

- `mock` — deterministic, no external calls (default for development/tests).
- `openai` — OpenAI-compatible chat completions.
- `openrouter` — OpenRouter's OpenAI-compatible chat completions; model IDs must
  be namespaced.
- `anthropic` — native Anthropic Messages API (`system` prompt, `messages`, and
  content-block response handling).

All model output is validated against strict Pydantic schemas. Timeouts and
provider failures return explicit errors; the deterministic diagnosis remains
available. Provider/model metadata is recorded, never keys.

## Configuration

| Env var | Purpose |
|---------|---------|
| `AI_PROVIDER` | `mock` \| `openai` \| `openrouter` \| `anthropic` |
| `AI_MODEL` | Model name (OpenRouter: `openai/gpt-4o-mini`; Anthropic: e.g. `claude-3-5-sonnet-latest`) |
| `AI_TIMEOUT_SECONDS` | Request timeout |
| `AI_MAX_OUTPUT_TOKENS` | Output cap |
| `AI_PRIVACY_MODE` | Block all external providers |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | OpenAI-compatible provider |
| `OPENROUTER_API_KEY` / `OPENROUTER_BASE_URL` | OpenRouter provider |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL` | Anthropic provider |

## OpenRouter example

Set these in `.env` or the backend environment. Never put the key in a
`NEXT_PUBLIC_*` variable or commit it.

```dotenv
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_APP_TITLE=SRE Copilot
```

## Anthropic example

```dotenv
AI_PROVIDER=anthropic
AI_MODEL=claude-3-5-sonnet-latest
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com
```

## Data minimisation

The endpoint sends only redacted evidence **summaries** plus the question. It
does not send evidence payloads, credentials, or raw logs. The deterministic
diagnosis remains authoritative, and the response is labelled
`model_generated: true` (except the mock provider).

## Privacy mode

Set `AI_PRIVACY_MODE=true` to **prevent any external LLM transmission**. When
enabled, external providers are rejected at call time. Admins can also set a
per-tenant privacy override in `/settings`; `AI_PRIVACY_MODE` is the environment
default when no tenant override exists.

## Cost and data handling

- Prefer the `mock` provider for development and tests.
- Do not send more infrastructure data than necessary.
- API keys are backend-only and must never reach the browser.
- Rotate any key that has appeared in chat, logs, or a public artifact.
- Never trust model-generated tool names, commands, or permissions; the model
  cannot bypass backend authorization or the read-only/proposal-only boundary.
