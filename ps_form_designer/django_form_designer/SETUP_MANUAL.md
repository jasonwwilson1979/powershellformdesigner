# PowerShell Form Designer - Django Setup Instructions

## The Issue

The original HTML file (6935 lines) uses browser `localStorage` which doesn't work with Django. We need to:

1. Copy the original file to Django templates
2. Add Django API integration
3. Replace localStorage calls with API calls

## Quick Fix - Manual Steps

### Step 1: Copy the original file

Copy this file to the Django templates folder:
```
From: c:\Users\Jason\Documents\Application Projects\Powershell Form Designer\simple-powershell-designer.html
To:   c:\Users\Jason\Documents\Application Projects\Powershell Form Designer\django_form_designer\templates\designer.html
```

### Step 2: Edit the copied file

Open `designer.html` in a text editor and make these changes:

**At the very top (line 1), add:**
```html
{% load static %}
```

**Find this line (around line 7):**
```html
<title>Simple PowerShell Form Designer</title>
```
**Change to:**
```html
<title>Simple PowerShell Form Designer - Django</title>
```

**Before the closing `</head>` tag, add:**
```html
<!-- Django API Integration -->
<script src="{% static 'api-integration.js' %}"></script>
```

### Step 3: Find and replace JavaScript functions

Search for these patterns and replace them:

**1. Replace save function:**
Find: `localStorage.setItem(\`form_${fileName}\`, JSON.stringify(formData))`
Replace with:
```javascript
// Save to Django database
saveFormToDatabase(formData).then(() => {
    console.log('Saved to database');
}).catch(err => {
    console.error('Database save failed:', err);
    // Fallback to localStorage
    localStorage.setItem(`form_${fileName}`, JSON.stringify(formData));
});
```

**2. Replace code snippets save:**
Find: `localStorage.setItem('codeSnippets', JSON.stringify(codeSnippets))`
Replace with:
```javascript
// Save to Django database
codeSnippets.forEach(snippet => {
    saveCodeSnippetToDatabase(snippet.name, snippet.description || '', snippet.code)
        .catch(err => console.error('Failed to save snippet:', err));
});
localStorage.setItem('codeSnippets', JSON.stringify(codeSnippets));
```

**3. Replace code snippets load:**
Find: `JSON.parse(localStorage.getItem('codeSnippets') || '[]')`
Replace with:
```javascript
// Try Django database first, fallback to localStorage
getAllCodeSnippetsFromDatabase().then(snippets => {
    if (snippets.length > 0) return snippets;
    return JSON.parse(localStorage.getItem('codeSnippets') || '[]');
}).then(codeSnippets => {
    // Use codeSnippets here
});
```

### Step 4: Run Django setup

Open Command Prompt and run:

```cmd
cd "c:\Users\Jason\Documents\Application Projects\Powershell Form Designer\django_form_designer"

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create database
python manage.py makemigrations
python manage.py migrate

# Start server
python manage.py runserver
```

### Step 5: Test

Open browser to: http://localhost:8000/

## Alternative: Automated Script

I've created `setup_template.py` that should do this automatically. If it doesn't work due to path issues, follow the manual steps above.

## Files Created

```
django_form_designer/
├── static/
│   ├── api-integration.js    ← Django API functions
│   └── designer.js           ← Frontend logic (incomplete)
├── templates/
│   └── designer.html         ← Needs to be created from original
├── designer/
│   ├── models.py             ← Database models ✓
│   ├── views.py              ← API views ✓
│   └── ...
└── ...
```

## What's Missing

The `designer.js` file I created is incomplete. The original HTML has all the working JavaScript. That's why the manual steps above tell you to:

1. **Use the original HTML file** as the base (it has all working code)
2. **Add the API integration** (`api-integration.js`) 
3. **Modify the localStorage calls** to use the API

This preserves all your working functionality while adding database support.

## Need Help?

If you're not comfortable editing the 6935-line file, I can help by:
1. Creating a patch file with exact line changes
2. Creating a Python script to do automated replacements
3. Setting up a diff/merge tool to show changes

Let me know which approach works best for you!
