# Django PowerShell Form Designer - Project Summary

## Overview

This Django application converts the original browser-based PowerShell Form Designer from using localStorage to a database-backed solution. All forms, code snippets, and visual logic are now persisted in a SQLite database.

## Project Structure

```
django_form_designer/
├── form_designer/              # Django project configuration
│   ├── __init__.py
│   ├── settings.py             # Django settings
│   ├── urls.py                 # Main URL routing
│   ├── wsgi.py                 # WSGI configuration
│   └── asgi.py                 # ASGI configuration
│
├── designer/                   # Main application
│   ├── __init__.py
│   ├── models.py               # Database models
│   ├── views.py                # API views
│   ├── serializers.py          # DRF serializers
│   ├── admin.py                # Admin interface
│   ├── urls.py                 # Frontend URLs
│   └── api_urls.py             # API endpoints
│
├── templates/
│   └── designer.html           # Main frontend template
│
├── static/
│   └── designer.js             # Frontend JavaScript
│
├── manage.py                   # Django management script
├── requirements.txt            # Python dependencies
├── README.md                   # Full documentation
├── QUICKSTART.md               # Quick start guide
└── db.sqlite3                  # SQLite database (created after migration)
```

## Database Models

### Form Model
Stores PowerShell form designs:
- `name` - Unique form identifier
- `text` - Form title
- `size` - Form dimensions (e.g., "800, 600")
- `location` - Form position (e.g., "100, 100")
- `back_color` - Background color
- `fore_color` - Foreground color
- `font` - Default font
- `controls` - JSON field storing form controls structure
- `created_at`, `updated_at` - Automatic timestamps

### CodeSnippet Model
Stores reusable PowerShell code:
- `name` - Unique snippet identifier
- `description` - Snippet description
- `code` - PowerShell code content
- `created_at`, `updated_at` - Automatic timestamps

### VisualLogic Model
Stores visual logic entries for controls:
- `form` - Foreign key to Form
- `control_name` - Control identifier
- `event_type` - Event type (Click, TextChanged, etc.)
- `conditions` - JSON field storing conditions
- `actions` - JSON field storing actions
- `script` - Generated PowerShell script
- `created_at`, `updated_at` - Automatic timestamps

## API Endpoints

### Forms API
```
GET    /api/forms/           - List all forms
POST   /api/forms/           - Create a new form
GET    /api/forms/{name}/    - Get a specific form
PUT    /api/forms/{name}/    - Update a form
DELETE /api/forms/{name}/    - Delete a form
```

### Code Snippets API
```
GET    /api/snippets/           - List all snippets
POST   /api/snippets/           - Create a new snippet
GET    /api/snippets/{name}/    - Get a specific snippet
PUT    /api/snippets/{name}/    - Update a snippet
DELETE /api/snippets/{name}/    - Delete a snippet
```

### Visual Logic API
```
GET    /api/visual-logic/              - List all visual logic
POST   /api/visual-logic/              - Create visual logic entry
GET    /api/visual-logic/?form_id={id} - Filter by form
PUT    /api/visual-logic/{id}/         - Update entry
DELETE /api/visual-logic/{id}/         - Delete entry
```

### Backup/Import API
```
POST /api/backup/  - Export all data as JSON
POST /api/import/  - Import data from JSON backup
```

## Key Features

### 1. Database Persistence
- All data is stored in SQLite database
- No reliance on browser localStorage
- Data persists across browser sessions and devices

### 2. REST API
- Full CRUD operations for all entities
- JSON-based requests and responses
- CORS enabled for frontend integration

### 3. Admin Interface
- Django admin for manual data management
- Search and filter capabilities
- Accessible at /admin/

### 4. Import/Export
- Backup all data to JSON file
- Import data from backup files
- Merge imported data with existing data

### 5. Real-time Code Generation
- PowerShell code generated as you design
- Copy code to clipboard with one click
- Event handlers integrated into generated code

## Frontend Integration

The frontend JavaScript (`designer.js`) provides API helper functions:

```javascript
// Save form to database
await saveFormToDatabase(formData);

// Load form from database
const form = await loadFormFromDatabase(formName);

// Get all forms
const forms = await getAllForms();

// Save code snippet
await saveCodeSnippet(name, description, code);

// Get all snippets
const snippets = await getAllCodeSnippets(search);

// Backup all data
const backupData = await backupAllData();

// Import data
await importData(backupData);
```

## Differences from Original

| Feature | Original (localStorage) | Django Version |
|---------|------------------------|----------------|
| Storage | Browser localStorage | SQLite Database |
| Persistence | Browser-specific | Server-side |
| API | None | REST API |
| Admin Interface | None | Django Admin |
| Multi-user | No | Yes (with auth) |
| Backup Format | JSON file | JSON file |
| Search | Limited | Full-text search |

## Setup Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Create database tables
python manage.py makemigrations
python manage.py migrate

# Create admin user (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

## Next Steps for Full Feature Parity

To achieve complete feature parity with the original HTML application, you may want to:

1. **Copy remaining JavaScript logic** from `simple-powershell-designer.html`:
   - Visual logic builder UI
   - Drag-and-drop reordering
   - Context menus
   - Panel resizing
   - Control copy/paste

2. **Enhance the UI**:
   - Add visual logic entry modal
   - Implement tab-based logic builder (Script/Visual/Code Library)
   - Add condition/action builders

3. **Add more API features**:
   - Bulk operations
   - Advanced search
   - Form versioning

4. **Add authentication** (for production):
   - User-specific forms
   - Permissions
   - API token authentication

## Production Deployment

For production deployment:

1. Change `DEBUG = False` in settings.py
2. Set a secure `SECRET_KEY`
3. Configure `ALLOWED_HOSTS`
4. Use a production database (PostgreSQL recommended)
5. Set up static file serving
6. Use a production WSGI server (Gunicorn/uWSGI)
7. Add HTTPS
8. Disable `CORS_ALLOW_ALL_ORIGINS`

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review QUICKSTART.md for setup instructions
3. Check Django documentation: https://docs.djangoproject.com/
4. Check Django REST Framework documentation: https://www.django-rest-framework.org/
