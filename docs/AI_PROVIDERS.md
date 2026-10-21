# AI providers

> **Status: implemented for `mock` and OpenAI-compatible providers, including
> OpenRouter.** The Kubernetes console can request an optional model-generated
> explanation of the deterministic evidence via
> `POST /api/v1/ai/diagnose`. Anthropic's native Messages API is still planned;
> selecting `anthropic` returns a clear `not_configured` response.

## Intended design

- One provider-independent interface, with these adapters:
  - `mock` — deterministic, no external calls (default).
  - `openai` — OpenAI-compatible chat completions.
  - `openrouter` — OpenRouter's OpenAI-compatible chat completions.
  - `anthropic` — Anthropic messages API (planned).
- All model output validated against strict Pydantic schemas.
- Timeouts and explicit provider errors; deterministic findings remain available
  even when the model call fails.
- Provider/model metadata recorded with each diagnosis (never keys).

## Configuration

| Env var | Purpose |
|---------|---------|
| `AI_PROVIDER` | `mock` \| `openai` \| `openrouter` \| `anthropic` |
| `AI_MODEL` | Model name (OpenRouter: `openai/gpt-4o-mini`) |
| `AI_TIMEOUT_SECONDS` | Request timeout |
| `AI_MAX_OUTPUT_TOKENS` | Output cap |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | OpenAI-compatible provider |
| `OPENROUTER_API_KEY` / `OPENROUTER_BASE_URL` | OpenRouter provider |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL` | Anthropic provider (planned) |

## OpenRouter example

Set these in `.env` or the backend environment. Never put the key in a
`NEXT_PUBLIC_*` variable or commit it.

```dotenv
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

The endpoint sends only the redacted evidence **summaries** plus the question.
It does not send evidence payloads or credentials. The deterministic diagnosis
remains authoritative, and the response is labelled `model_generated: true`.

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
