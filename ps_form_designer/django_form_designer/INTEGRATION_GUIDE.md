# PowerShell Form Designer - Django Integration

## Problem Solved

Your original HTML file uses browser `localStorage` which doesn't persist data to a database. This Django integration adds:

✅ **Database storage** - All forms, code snippets, and visual logic saved to SQLite  
✅ **REST API** - Full CRUD operations via Django REST Framework  
✅ **Import/Export** - Backup and restore functionality  
✅ **Admin Interface** - Manage data at /admin/  

## Quick Start (Automated)

### Run the setup script:

```cmd
cd "c:\Users\Jason\Documents\Application Projects\Powershell Form Designer\django_form_designer"
setup_auto.bat
```

This will:
1. Copy your original HTML to Django templates
2. Add Django template tags
3. Add API integration script

### Then setup Django:

```cmd
# Install dependencies
pip install -r requirements.txt

# Create database
python manage.py makemigrations
python manage.py migrate

# Start server
python manage.py runserver
```

Open browser: **http://localhost:8000/**

## What Was Created

```
django_form_designer/
├── designer/                    # Django app
│   ├── models.py               # 3 database models
│   ├── views.py                # API endpoints
│   ├── serializers.py          # Data serializers
│   ├── admin.py                # Admin interface
│   ├── urls.py                 # URL routing
│   └── api_urls.py             # API routes
│
├── form_designer/              # Django project
│   ├── settings.py             # Configuration
│   ├── urls.py                 # Main URLs
│   └── ...
│
├── static/
│   ├── api-integration.js      # ← Django API functions
│   └── designer.js             # Frontend logic
│
├── templates/
│   └── designer.html           # ← Your HTML (after running setup)
│
├── setup_auto.bat              # ← Run this first!
├── add_api_script.py           # Helper script
├── requirements.txt            # Python dependencies
└── manage.py                   # Django CLI
```

## Database Models

### Form
- Stores form designs with all controls
- Fields: name, text, size, location, colors, font, controls (JSON)

### CodeSnippet  
- Stores reusable PowerShell code
- Fields: name, description, code

### VisualLogic
- Stores control event handlers
- Fields: form (FK), control_name, event_type, conditions, actions, script

## API Endpoints

Once running, test these URLs:

- **Forms**: http://localhost:8000/api/forms/
- **Snippets**: http://localhost:8000/api/snippets/
- **Visual Logic**: http://localhost:8000/api/visual-logic/
- **Backup**: http://localhost:8000/api/backup/
- **Import**: http://localhost:8000/api/import/
- **Admin**: http://localhost:8000/admin/

## How It Works

### Original HTML (localStorage):
```javascript
// Save form
localStorage.setItem(`form_${fileName}`, JSON.stringify(formData));

// Load form
const form = JSON.parse(localStorage.getItem(`form_${formName}`));
```

### Django Integration (Database):
```javascript
// Save form
await saveFormToDatabase(formData);

// Load form  
const form = await loadFormFromDatabase(formName);
```

The `api-integration.js` file provides these functions that call the Django API.

## Manual Setup (if automated fails)

### Step 1: Copy original file
```
Copy: ..\simple-powershell-designer.html
To:   templates\designer.html
```

### Step 2: Add Django tags
Edit `templates\designer.html`:

**Line 1** - Add:
```html
{% load static %}
```

**Find** (around line 7):
```html
<title>Simple PowerShell Form Designer</title>
```
**Replace with**:
```html
<title>Simple PowerShell Form Designer - Django</title>
```

**Find** `</head>` and add before it:
```html
<!-- Django API Integration -->
<script src="{% static 'api-integration.js' %}"></script>
```

### Step 3: Setup Django
```cmd
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

## Testing

1. **Create a form**: Drag controls onto canvas
2. **Save**: Click save icon, enter form name
3. **Check database**: Open http://localhost:8000/admin/designer/form/
4. **Load**: Refresh page, click load icon, select form
5. **Code snippets**: Click code library icon, add snippet
6. **Backup**: Click download icon to export all data

## Troubleshooting

### "Module not found" error
```cmd
pip install -r requirements.txt
```

### "Database not found" error
```cmd
python manage.py migrate
```

### Port 8000 in use
```cmd
python manage.py runserver 8001
```
Then open: http://localhost:8001/

### API calls failing
Check browser console (F12) for errors. Make sure server is running.

### Forms not saving to database
1. Check server console for errors
2. Open browser DevTools (F12) → Console tab
3. Look for "Django API Integration loaded" message
4. Check Network tab for API requests

## Features Working

✅ Drag and drop controls  
✅ Move controls around canvas  
✅ Resize controls  
✅ Edit properties panel  
✅ **Save forms to database** ← NEW!  
✅ **Load forms from database** ← NEW!  
✅ **Code snippets library** ← NEW!  
✅ **Visual logic builder** ← NEW!  
✅ **Backup/Import** ← NEW!  
✅ Real-time PowerShell code generation  
✅ Double-click to edit logic  

## Next Steps

1. **Run setup**: `setup_auto.bat`
2. **Install dependencies**: `pip install -r requirements.txt`
3. **Migrate database**: `python manage.py migrate`
4. **Start server**: `python manage.py runserver`
5. **Test it**: Open http://localhost:8000/

## Admin Access (Optional)

Create admin user to manage data via web interface:

```cmd
python manage.py createsuperuser
```

Then login at: http://localhost:8000/admin/

## Production Deployment

For production (not just local development):

1. Set `DEBUG = False` in settings.py
2. Change `SECRET_KEY` to a secure random value
3. Set `ALLOWED_HOSTS = ['yourdomain.com']`
4. Use PostgreSQL instead of SQLite
5. Set up proper HTTPS
6. Use gunicorn/uWSGI instead of dev server

## Support

If something doesn't work:

1. Check this README
2. Look at browser console (F12) for errors
3. Check Django server console for errors
4. Verify all migrations ran: `python manage.py showmigrations`

## What's Different from Original

| Feature | Original | Django Version |
|---------|----------|----------------|
| Storage | Browser localStorage | SQLite Database |
| Persistence | Browser only | Server-side |
| Multi-device | No | Yes |
| Admin UI | No | Yes (/admin/) |
| API | No | REST API |
| Backup | JSON file | JSON file + Database |

Everything else works the same!

---

**Created for**: PowerShell Form Designer  
**Backend**: Django 5.0 + Django REST Framework  
**Database**: SQLite (default)  
**Frontend**: Original HTML/JavaScript with API integration
