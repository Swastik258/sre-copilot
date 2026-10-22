# Contributing

Contributions are welcome. Keep changes focused, follow the existing language
and framework conventions, and include tests for behavior changes.

## Before opening a pull request

Run the relevant checks and describe any that could not be run.

Backend:

```bash
cd backend
. .venv/bin/activate
ruff check app tests
ruff format --check app tests
mypy app
pytest --cov=app --cov-branch --cov-report=term-missing --cov-fail-under=80
bandit -q -c pyproject.toml -r app
pip-audit --progress-spinner off
```

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm audit --omit=dev --audit-level=high
npm run build
```

Install the pre-commit hooks once:

```bash
cd backend && pip install -e ".[dev]" && cd ..
pre-commit install
pre-commit run --all-files
```

See [docs/TESTING.md](docs/TESTING.md) for coverage scope, CI gates, and known
browser/network test gaps.

## Guidelines

- Read existing code before editing; prefer small, reviewable changes.
- Never silently replace a real integration with a mock.
- Do not hardcode credentials, tokens, account IDs, or production endpoints.
- Keep documentation synchronized with implementation.
- Do not weaken security checks to make tests pass.
- Do not swallow errors or return fake success responses.
- Validate untrusted data at system boundaries; treat logs, repository content,
  and annotations as untrusted.
