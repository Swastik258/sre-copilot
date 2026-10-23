# syntax=docker/dockerfile:1.7
FROM python:3.12-slim AS runtime

ARG INSTALL_EXTRAS=""
ARG APP_VERSION="0.2.0"
ARG VCS_REF="unknown"

LABEL org.opencontainers.image.title="Tarn API" \
      org.opencontainers.image.description="Read-only SRE diagnosis API" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/Swastik258/sre-copilot"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONPATH=/app

WORKDIR /app

COPY pyproject.toml requirements.lock ./
COPY app ./app
COPY scripts ./scripts
COPY alembic.ini ./
COPY alembic ./alembic

# Install into the system environment so the image runs as an unprivileged
# user without a writable virtualenv or package cache. The tested lock file is
# used as a constraint so image builds do not silently resolve newer versions.
# hadolint ignore=DL3013
RUN if [ -n "$INSTALL_EXTRAS" ]; then \
        PIP_CONSTRAINT=/app/requirements.lock pip install --no-cache-dir ".[${INSTALL_EXTRAS}]"; \
    else \
        PIP_CONSTRAINT=/app/requirements.lock pip install --no-cache-dir .; \
    fi \
    && groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --no-create-home \
        --home-dir /app --shell /usr/sbin/nologin app \
    && chown -R root:root /app

USER 10001:10001

EXPOSE 8000
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
    CMD python -c "import json,urllib.request; response=urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health/ready', timeout=2); exit(0 if json.load(response).get('status') == 'ok' else 1)"

# The default single-container command migrates before serving. Kubernetes
# deployments override this with a pre-upgrade migration Job and run uvicorn
# directly so replicas do not race on schema changes.
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --no-access-log"]
