# syntax=docker/dockerfile:1
###############################################################################
# PowerShell Form Designer - Django production image
#
# Build from the repository root:
#   docker build -t ps-form-designer:local .
#
# The Django project lives in ps_form_designer/django_form_designer - override
# APP_PATH with --build-arg if you ever move it.
###############################################################################

FROM python:3.12-slim AS runtime

ARG APP_PATH=ps_form_designer/django_form_designer

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DJANGO_SETTINGS_MODULE=form_designer.settings \
    DJANGO_DEBUG=0 \
    APP_HOME=/app \
    DATA_DIR=/data \
    PORT=8000 \
    GUNICORN_WORKERS=3 \
    GUNICORN_TIMEOUT=120 \
    RUN_MIGRATIONS=1 \
    COLLECT_STATIC=1

# tini  -> correct PID 1 / signal handling so gunicorn shuts down gracefully
# curl  -> used by the container healthcheck
RUN apt-get update \
    && apt-get install -y --no-install-recommends tini curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR ${APP_HOME}

# Dependencies first so the layer is cached between source changes
COPY ${APP_PATH}/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Application source (templates/, static/, all Django apps)
COPY ${APP_PATH}/ ./

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh \
    && groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid 1000 --create-home --shell /usr/sbin/nologin appuser \
    && mkdir -p "${DATA_DIR}" "${APP_HOME}/staticfiles" \
    && chown -R appuser:appuser "${APP_HOME}" "${DATA_DIR}"

# Keep the SQLite database on the mounted volume by default
ENV SQLITE_PATH=${DATA_DIR}/db.sqlite3

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-8000}/healthz/" || exit 1

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
