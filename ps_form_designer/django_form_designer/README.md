# PowerShell Form Designer - Django Application

A Django-based PowerShell Form Designer that stores Forms, Code Library, and Visual Logic to a database instead of browser cache.

## Features

- **Database-backed storage**: All forms, code snippets, and visual logic are stored in a SQLite database
- **REST API**: Full CRUD operations via Django REST Framework
- **Import/Export**: Backup and restore all your designs
- **Real-time code generation**: Generate PowerShell scripts as you design

## Docker / Portainer Deployment

The repository root contains everything needed to build and run this app in a
container:

- `Dockerfile` - gunicorn image (non-root, healthcheck, WhiteNoise static files)
- `docker-compose.yml` - Portainer-ready stack with a persistent data volume
- `docker-compose.portainer-build.yml` - same stack, but Portainer **builds** it
  from this repo (no container registry involved - use if GHCR returns `denied`)
- `.github/workflows/docker-publish.yml` - publishes `ghcr.io/<user>/<repo>` on push

See **[DEPLOYMENT.md](../../DEPLOYMENT.md)** for the full walkthrough
(push to GitHub -> Actions builds the image -> deploy it as a Portainer stack).

All runtime configuration is environment driven, e.g.:

```
DJANGO_DEBUG=0
DJANGO_ALLOWED_HOSTS=*
DJANGO_SECRET_KEY=<64-char random string>
SQLITE_PATH=/data/db.sqlite3
```

## Project Structure

```
django_form_designer/
├── form_designer/          # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── designer/               # Main application
│   ├── models.py          # Database models (Form, CodeSnippet, VisualLogic)
│   ├── views.py           # API views
│   ├── serializers.py     # DRF serializers
│   ├── urls.py            # Frontend URLs
│   └── api_urls.py        # API endpoints
├── templates/
│   └── designer.html      # Main frontend template
├── static/                # Static files
├── manage.py
└── requirements.txt
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd django_form_designer
pip install -r requirements.txt
```

### 2. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser (Optional - for admin access)

```bash
python manage.py createsuperuser
```

### 4. Start Development Server

```bash
python manage.py runserver
```

The application will be available at: http://localhost:8000/
The admin interface will be available at: http://localhost:8000/admin/

## API Endpoints

### Forms
- `GET /api/forms/` - List all forms
- `POST /api/forms/` - Create a new form
- `GET /api/forms/{name}/` - Get a specific form by name
- `PUT /api/forms/{name}/` - Update a form
- `DELETE /api/forms/{name}/` - Delete a form

### Code Snippets
- `GET /api/snippets/` - List all snippets
- `POST /api/snippets/` - Create a new snippet
- `GET /api/snippets/{name}/` - Get a specific snippet
- `PUT /api/snippets/{name}/` - Update a snippet
- `DELETE /api/snippets/{name}/` - Delete a snippet

### Visual Logic
- `GET /api/visual-logic/` - List all visual logic entries
- `POST /api/visual-logic/` - Create a new visual logic entry
- `GET /api/visual-logic/{id}/` - Get a specific entry
- `PUT /api/visual-logic/{id}/` - Update an entry
- `DELETE /api/visual-logic/{id}/` - Delete an entry

### Backup/Import
- `POST /api/backup/` - Export all data as JSON
- `POST /api/import/` - Import data from JSON backup

## Database Models

### Form
- `name` - Unique form identifier
- `text` - Form title
- `size` - Form dimensions
- `location` - Form position
- `back_color` - Background color
- `fore_color` - Foreground color
- `font` - Default font
- `controls` - JSON field storing form controls
- `created_at`, `updated_at` - Timestamps

### CodeSnippet
- `name` - Unique snippet identifier
- `description` - Snippet description
- `code` - PowerShell code
- `created_at`, `updated_at` - Timestamps

### VisualLogic
- `form` - Foreign key to Form
- `control_name` - Control identifier
- `event_type` - Event type (Click, TextChanged, etc.)
- `conditions` - JSON field storing conditions
- `actions` - JSON field storing actions
- `script` - Generated PowerShell script
- `created_at`, `updated_at` - Timestamps

## Development Notes

- The application uses SQLite by default (db.sqlite3)
- CORS is enabled for all origins (development only)
- Debug mode is enabled by default
- Change `SECRET_KEY` and disable debug mode for production

## Next Steps

To complete the migration from the original HTML file:

1. **Copy the full JavaScript logic** from `simple-powershell-designer.html` to `templates/designer.html`
2. **Replace localStorage calls** with the API helper functions provided
3. **Test all functionality**:
   - Drag and drop controls
   - Save/load forms
   - Code snippets management
   - Visual logic builder
   - Import/export functionality

## License

MIT License
