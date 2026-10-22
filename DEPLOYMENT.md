# Deploy: GitHub -> GitHub Actions -> Docker / Portainer

This repository is set up so that:

1. you push to GitHub,
2. GitHub Actions builds a Linux AMD64 **and** ARM64 image and publishes it to
   **GitHub Container Registry (GHCR)**,
3. Portainer (or plain Docker) just pulls `ghcr.io/<user>/<repo>:latest`.

```
GitHub push ──► .github/workflows/docker-publish.yml ──► ghcr.io/<user>/<repo>:latest
                                                              │
                                            Portainer stack ──┘ (docker-compose.yml)
```

## What is in the repo

| File | Purpose |
| --- | --- |
| `Dockerfile` | Builds the Django app into a gunicorn image (non-root, healthcheck). |
| `docker/entrypoint.sh` | Migrates the DB, collects static files, optional superuser, starts gunicorn. |
| `docker-compose.yml` | **Portainer-ready** stack: pulls the published image, keeps data on a named volume. |
| `docker-compose.build.yml` | Local override that builds the image from source instead of pulling. |
| `.env.example` | Every configurable environment variable with defaults. |
| `.github/workflows/docker-publish.yml` | CI: smoke-test build + publish to GHCR (amd64/arm64). |
| `.dockerignore` / `.gitignore` / `.gitattributes` | Keeps the image small, secrets out of git, shell scripts LF. |

The Django project itself lives in `ps_form_designer/django_form_designer/`
and is now fully driven by environment variables (`form_designer/settings.py`),
so the same image runs locally, in Docker and in Portainer.

---

## 1. Push the project to GitHub

The repository root is this folder (the one containing `Dockerfile` and
`docker-compose.yml`).

```powershell
cd "C:\Users\Jason\Documents\Application Projects\Powershell Form Designer"

git init -b main
git add .
git commit -m "PowerShell Form Designer with Docker / Portainer deployment"

# create an empty repo on github.com first (no README, no .gitignore), then:
git remote add origin https://github.com/<your-user>/<repo>.git
git push -u origin main
```

Your existing `db.sqlite3` is intentionally **not** committed (see
`.gitignore`). If you want your current forms inside the container, export them
with `POST /api/backup/` and re-import with `POST /api/import/` afterwards, or
copy the file into the volume (see [Data & backups](#6-data--backups)).

## 2. Let GitHub Actions publish the image

Nothing to configure - the workflow uses the built-in `GITHUB_TOKEN`.

- Push to `main` (or `master`) - a build starts automatically.
- Watch it under **Actions -> Build and publish container image**.
- The image lands in **Packages** on your profile/repo:
  `ghcr.io/<user>/<repo>:latest` (lower-cased automatically).

Tags published:

| Trigger | Tags |
| --- | --- |
| push to `main` | `latest`, `main`, `sha-<commit>` |
| tag `v1.2.3` | `1.2.3`, `1.2`, `v1.2.3`, `sha-<commit>` |
| pull request | none (build + health-check only) |

### Make the package public (one-time)

GHCR packages are **private by default**, even when the repo is public.
Either:

- **Public image** - GitHub -> your profile -> **Packages** ->
  `ps-form-designer` -> **Package settings** -> **Danger Zone** ->
  *Change visibility* -> **Public**, or
- **Private image** - add the registry to Portainer once:
  **Registries -> Add registry -> Custom registry**
  - Registry URL: `ghcr.io`
  - Username: your GitHub username
  - Password: a Personal Access Token (classic) with the `read:packages` scope

## 3. Deploy in Portainer

### Option A - Web editor (fastest)

1. Portainer -> **Stacks** -> **Add stack** -> name it `ps-form-designer`.
2. **Web editor** -> paste the contents of `docker-compose.yml`.
3. Under **Environment variables** add (or edit them inline):
   - `APP_IMAGE` = `ghcr.io/<user>/<repo>:latest`
   - `APP_PORT` = `8000` (or any free host port)
   - `DJANGO_ALLOWED_HOSTS` = `*` (or e.g. `192.168.1.50,designer.example.com`)
   - `DJANGO_SUPERUSER_USERNAME` / `DJANGO_SUPERUSER_PASSWORD` (optional, admin user)
4. **Deploy the stack**.
5. Open `http://<docker-host>:8000/`.

### Option B - Git repository (redeploy from GitHub)

1. Portainer -> **Stacks** -> **Add stack** -> **Repository**.
2. Repository URL: `https://github.com/<user>/<repo>` (add credentials if private).
3. Compose path: `docker-compose.yml`.
4. Set the same environment variables as above.
5. **Deploy the stack**. Use **Pull and redeploy** after new commits.

### Option C - plain Docker / CLI

```bash
docker run -d --name ps-form-designer \
  -p 8000:8000 \
  -e DJANGO_SECRET_KEY="$(python -c 'import secrets;print(secrets.token_urlsafe(64))')" \
  -e DJANGO_ALLOWED_HOSTS='*' \
  -v ps-form-designer-data:/data \
  --restart unless-stopped \
  ghcr.io/<user>/<repo>:latest
```

### Behind a reverse proxy / HTTPS

Terminate TLS in Portainer/Traefik/nginx and set:

```
DJANGO_BEHIND_PROXY=1
DJANGO_CSRF_TRUSTED_ORIGINS=https://designer.example.com
DJANGO_ALLOWED_HOSTS=designer.example.com
```

## 4. Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `APP_IMAGE` | `ghcr.io/change-me/ps-form-designer:latest` | Image Portainer pulls. |
| `APP_PORT` | `8000` | Host port mapping. |
| `DJANGO_SECRET_KEY` | *auto-generated* | Left empty, a key is generated once and stored in `/data/secret_key` on the volume. |
| `DJANGO_DEBUG` | `0` | Keep `0` in containers. |
| `DJANGO_ALLOWED_HOSTS` | `*` (compose) | Comma separated hostnames/IPs. |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | *(empty)* | Required for HTTPS admin logins behind a proxy. |
| `DJANGO_BEHIND_PROXY` | `0` | Trust `X-Forwarded-Proto` / `X-Forwarded-Host`. |
| `DJANGO_CORS_ALLOW_ALL` | `1` | Set `0` + `DJANGO_CORS_ALLOWED_ORIGINS` to lock down CORS. |
| `SQLITE_PATH` | `/data/db.sqlite3` | Database location (inside the image). |
| `GUNICORN_WORKERS` | `3` | Web workers. |
| `GUNICORN_TIMEOUT` | `120` | Worker timeout (seconds). |
| `DJANGO_SUPERUSER_USERNAME` / `_PASSWORD` / `_EMAIL` | *(empty)* | Creates the `/admin/` user on first boot. |
| `TZ` | `UTC` | Container timezone. |

Static files are served by WhiteNoise from inside the container - no separate
nginx needed, and `collectstatic` runs automatically on every start.

## 5. Updating after a code change

```powershell
git add .
git commit -m "Update designer"
git push
```

Then in Portainer: **Stacks -> ps-form-designer -> Update the stack** and tick
**Re-pull image** (or **Pull and redeploy** for the Git stack). The container
restarts with the new image; migrations run automatically and the database on
the volume is untouched.

For fully automatic updates, point Watchtower at the `latest` tag - but note it
will restart the container whenever a new image is published.

## 6. Data & backups

Everything persistent lives in the `ps-form-designer-data` volume:

| Path | Content |
| --- | --- |
| `/data/db.sqlite3` | Forms, code snippets, visual logic |
| `/data/secret_key` | Auto-generated Django secret (if you didn't set one) |

Backup (from a shell on the Docker host):

```bash
docker run --rm -v ps-form-designer-data:/data -v "$PWD":/backup \
  alpine tar czf /backup/ps-form-designer-backup.tar.gz -C /data .
```

Application-level backup (JSON, portable between versions):

```bash
curl -X POST http://<docker-host>:8000/api/backup/ -o backup.json
curl -X POST -H "Content-Type: application/json" \
     --data-binary @backup.json http://<docker-host>:8000/api/import/
```

## 7. Local development / testing the image

Plain Django (unchanged workflow):

```powershell
cd ps_form_designer\django_form_designer
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Build and run the container locally:

```bash
cp .env.example .env          # then edit APP_IMAGE etc. (optional)
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build
```

Or straight from the Dockerfile:

```bash
docker build -t ps-form-designer:local .
docker run --rm -p 8000:8000 \
  -e DJANGO_SECRET_KEY=dev-key -e DJANGO_ALLOWED_HOSTS='*' \
  ps-form-designer:local
```

Health endpoint used by Docker/Portainer: `GET /healthz/` -> `{"status": "ok"}`.

## 8. Troubleshooting

| Symptom | Fix |
| --- | --- |
| Portainer: `pull access denied` / `unauthorized` | Package is private - make it public or add `ghcr.io` credentials with a `read:packages` PAT. |
| Action fails pushing to GHCR | Repo **Settings -> Actions -> General -> Workflow permissions** must allow read/write (the workflow already requests `packages: write`). |
| `DisallowedHost` in the logs | Add the host/IP you browse with to `DJANGO_ALLOWED_HOSTS`. |
| 403 CSRF on `/admin/` behind HTTPS | Set `DJANGO_BEHIND_PROXY=1` and `DJANGO_CSRF_TRUSTED_ORIGINS=https://your.domain`. |
| Page loads but styles/JS missing | Check `collectstatic` output in the logs; `static/` must exist in the image (it is no longer git-ignored). |
| `exec .../entrypoint.sh: no such file` | The script was committed with CRLF - `.gitattributes` enforces LF; re-checkout the repo. |
| Data lost after redeploy | The stack must keep the `ps-form-designer-data` volume - don't delete volumes in Portainer. |


