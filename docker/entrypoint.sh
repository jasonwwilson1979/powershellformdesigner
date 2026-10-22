#!/bin/sh
# ---------------------------------------------------------------------------
# PowerShell Form Designer - container entrypoint
# Runs migrations + collectstatic, then hands over to gunicorn.
# ---------------------------------------------------------------------------
set -e

APP_HOME="${APP_HOME:-/app}"
DATA_DIR="${DATA_DIR:-/data}"
PORT="${PORT:-8000}"
GUNICORN_WORKERS="${GUNICORN_WORKERS:-3}"
GUNICORN_TIMEOUT="${GUNICORN_TIMEOUT:-120}"
GUNICORN_LOG_LEVEL="${GUNICORN_LOG_LEVEL:-info}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"
COLLECT_STATIC="${COLLECT_STATIC:-1}"

cd "$APP_HOME"

# --- Secret key ------------------------------------------------------------
# When DJANGO_SECRET_KEY is empty we generate one once and persist it on the
# data volume, so sessions survive container restarts without extra setup.
if [ -z "${DJANGO_SECRET_KEY:-}" ]; then
    SECRET_FILE="${DATA_DIR}/secret_key"
    if [ ! -s "$SECRET_FILE" ]; then
        echo "==> DJANGO_SECRET_KEY not set - generating one at ${SECRET_FILE}"
        mkdir -p "$DATA_DIR"
        python -c "import secrets; print(secrets.token_urlsafe(64))" > "$SECRET_FILE"
        chmod 600 "$SECRET_FILE" 2>/dev/null || true
    fi
    DJANGO_SECRET_KEY="$(tr -d '\r\n' < "$SECRET_FILE")"
    export DJANGO_SECRET_KEY
    echo "==> Using persisted secret key from ${SECRET_FILE}"
fi

# --- Database --------------------------------------------------------------
if [ "$RUN_MIGRATIONS" = "1" ]; then
    echo "==> Applying database migrations (${SQLITE_PATH:-default database})"
    python manage.py migrate --noinput
fi

# --- Static files ----------------------------------------------------------
if [ "$COLLECT_STATIC" = "1" ]; then
    echo "==> Collecting static files into ${APP_HOME}/staticfiles"
    python manage.py collectstatic --noinput --clear >/dev/null
fi

# --- Optional admin user ---------------------------------------------------
# Set DJANGO_SUPERUSER_USERNAME / _PASSWORD / _EMAIL to create it on first boot.
if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
    export DJANGO_SUPERUSER_CHECK="${DJANGO_SUPERUSER_USERNAME}"
    if python manage.py shell -c "import os; from django.contrib.auth import get_user_model; raise SystemExit(0 if get_user_model().objects.filter(username=os.environ['DJANGO_SUPERUSER_CHECK']).exists() else 1)" >/dev/null 2>&1; then
        echo "==> Superuser '${DJANGO_SUPERUSER_USERNAME}' already exists"
    else
        echo "==> Creating superuser '${DJANGO_SUPERUSER_USERNAME}'"
        python manage.py createsuperuser --noinput
    fi
    unset DJANGO_SUPERUSER_CHECK
fi

# --- Web server ------------------------------------------------------------
echo "==> Starting gunicorn on 0.0.0.0:${PORT} (workers=${GUNICORN_WORKERS})"
exec gunicorn form_designer.wsgi:application \
    --bind "0.0.0.0:${PORT}" \
    --workers "${GUNICORN_WORKERS}" \
    --timeout "${GUNICORN_TIMEOUT}" \
    --log-level "${GUNICORN_LOG_LEVEL}" \
    --access-logfile - \
    --error-logfile -
