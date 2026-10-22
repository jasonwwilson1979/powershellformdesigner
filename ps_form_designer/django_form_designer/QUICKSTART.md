# Quick Start Guide

## Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

## Installation Steps

### 1. Navigate to the project directory
```bash
cd "c:\Users\Jason\Documents\Application Projects\Powershell Form Designer\django_form_designer"
```

### 2. Create a virtual environment (recommended)
```bash
python -m venv venv
```

### 3. Activate the virtual environment
**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Create the database
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. (Optional) Create an admin user
```bash
python manage.py createsuperuser
```
Follow the prompts to set a username, email, and password.

### 7. Start the development server
```bash
python manage.py runserver
```

The application will be available at:
- **Main Application**: http://localhost:8000/
- **Admin Interface**: http://localhost:8000/admin/

## First Steps

1. **Create a Form**: Drag components from the left panel onto the canvas
2. **Edit Properties**: Select a control and modify its properties in the right panel
3. **Add Logic**: Double-click a control to open the Logic Builder and add PowerShell scripts
4. **Save**: Click the Save icon (floppy disk) to save your form to the database
5. **Load**: Click the Load icon (folder) to load a previously saved form
6. **Code Library**: Click the Code icon to manage reusable PowerShell code snippets
7. **Backup**: Click the Download icon to export all your data as JSON
8. **Import**: Click the Upload icon to import data from a JSON backup file

## API Endpoints

Once the server is running, you can access the REST API:

- **Forms**: http://localhost:8000/api/forms/
- **Code Snippets**: http://localhost:8000/api/snippets/
- **Visual Logic**: http://localhost:8000/api/visual-logic/
- **Backup**: http://localhost:8000/api/backup/
- **Import**: http://localhost:8000/api/import/

## Troubleshooting

### Port already in use
If port 8000 is already in use, run:
```bash
python manage.py runserver 8001
```
Then access http://localhost:8001/

### Database errors
If you encounter database errors, try:
```bash
python manage.py migrate --run-syncdb
```

### Static files not loading
Run:
```bash
python manage.py collectstatic
```

## Stopping the Server

Press `Ctrl+C` in the terminal to stop the development server.

## Deactivating the Virtual Environment

When you're done working:
```bash
deactivate
```
