# AI providers

> **Status: implemented for `mock`, OpenAI-compatible providers including Groq,
> NVIDIA, OpenRouter, and
> Anthropic's native Messages API.** AI explanations are optional; deterministic
> diagnosis remains authoritative.

## Providers

- `mock` — deterministic, no external calls (default for development/tests).
- `openai` — OpenAI-compatible chat completions.
- `groq` — Groq's OpenAI-compatible chat completions API.
- `nvidia` — NVIDIA's OpenAI-compatible Integrate API.
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
| `AI_PROVIDER` | `mock` \| `openai` \| `openrouter` \| `anthropic` \| `groq` \| `nvidia` |
| `AI_MODEL` | Model name (NVIDIA example: `nvidia/nemotron-3.5-super-vl-120b-a12b`; Groq: `llama-3.3-70b-versatile`; OpenRouter: `openai/gpt-4o-mini`; Anthropic: e.g. `claude-3-5-sonnet-latest`) |
| `AI_TIMEOUT_SECONDS` | Request timeout |
| `AI_MAX_OUTPUT_TOKENS` | Output cap |
| `AI_PRIVACY_MODE` | Block all external providers |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | OpenAI-compatible provider |
| `GROQ_API_KEY` / `GROQ_BASE_URL` | Groq OpenAI-compatible API (`https://api.groq.com/openai/v1`) |
| `NVIDIA_API_KEY` / `NVIDIA_BASE_URL` | NVIDIA Integrate OpenAI-compatible API (`https://integrate.api.nvidia.com/v1`) |
| `OPENROUTER_API_KEY` / `OPENROUTER_BASE_URL` | OpenRouter provider |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL` | Anthropic provider |

## Groq example

Set these in `backend/.env` or the backend deployment environment. Obtain a
fresh API key from the Groq console and keep it server-side; never put it in a
frontend environment variable or commit it.

```dotenv
AI_PROVIDER=groq
AI_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=your-new-groq-key
GROQ_BASE_URL=https://api.groq.com/openai/v1
AI_PRIVACY_MODE=false
```

The backend uses its existing OpenAI-compatible HTTP adapter; no additional
Groq SDK dependency is needed. See the [Groq quickstart](https://console.groq.com/docs/quickstart).

## NVIDIA example

Set these in `backend/.env` or the backend deployment environment. Obtain an
API key from the NVIDIA API catalog and keep it server-side; never put it in a
frontend environment variable or commit it.

```dotenv
AI_PROVIDER=nvidia
AI_MODEL=nvidia/nemotron-3.5-super-vl-120b-a12b
NVIDIA_API_KEY=your-nvidia-api-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
AI_PRIVACY_MODE=false
```

NVIDIA uses the existing OpenAI-compatible HTTP adapter, so no additional SDK
dependency is required. The current AI explanation flow sends structured text
prompts and expects one JSON response; image input and streaming are not part
of that flow.

## OpenRouter example

Set these in `.env` or the backend environment. Never put the key in a
`NEXT_PUBLIC_*` variable or commit it.

```dotenv
AI_PROVIDER=openrouter
AI_MODEL=openai/gpt-4o-mini
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_HTTP_REFERER=http://localhost:3000
OPENROUTER_APP_TITLE=Tarn
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
enabled, external providers are rejected at call time. Workspace owners/admins
can also set a per-workspace privacy override in `/admin/settings`;
`AI_PRIVACY_MODE` is the environment default when no workspace override exists.

## Cost and data handling

- Prefer the `mock` provider for development and tests.
- Do not send more infrastructure data than necessary.
- API keys are backend-only and must never reach the browser.
- Rotate any key that has appeared in chat, logs, or a public artifact.
- Never trust model-generated tool names, commands, or permissions; the model
  cannot bypass backend authorization or the read-only/proposal-only boundary.
