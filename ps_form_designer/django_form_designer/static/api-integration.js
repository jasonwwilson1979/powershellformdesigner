/*
PowerShell Form Designer - Django Backend API Integration

This JavaScript file provides API functions to replace localStorage calls
with Django backend API calls.
*/

// API Configuration
const API_BASE_URL = '/api';

// Flag to use database instead of localStorage
const USE_DATABASE = true;

// ============== API Helper Functions ==============

async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return response.json();
    } catch (error) {
        console.error(`API ${method} ${endpoint}:`, error);
        throw error;
    }
}

function showToast(message, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        // Create toast if it doesn't exist
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 50px;
            right: 20px;
            background-color: #2c3e50;
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            z-index: 2000;
            display: none;
        `;
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ============== Form Storage Functions ==============

async function saveFormToDatabase(formData) {
    try {
        // Prepare form data for API
        const controls = [];
        const formContainer = document.getElementById('formContainer');
        
        if (formContainer) {
            const formControls = formContainer.querySelectorAll('.form-control');
            formControls.forEach(control => {
                controls.push({
                    id: control.id,
                    type: control.getAttribute('data-type'),
                    style: control.getAttribute('style'),
                    innerHTML: control.innerHTML,
                    className: control.className
                });
            });
        }
        
        const data = {
            name: formData.fileName,
            text: formData.formStructure.text,
            size: formData.formStructure.size,
            location: formData.formStructure.location,
            back_color: formData.formStructure.backColor,
            fore_color: formData.formStructure.foreColor,
            font: formData.formStructure.font,
            controls: controls
        };
        
        // Try to update existing form first, otherwise create new
        try {
            await apiCall(`/forms/${formData.fileName}/`, 'PUT', data);
            showToast('Form updated successfully!', 'success');
        } catch (error) {
            // Form doesn't exist, create it
            await apiCall('/forms/', 'POST', data);
            showToast('Form saved successfully!', 'success');
        }
        
        return true;
    } catch (error) {
        console.error('Error saving form:', error);
        showToast('Error saving form: ' + error.message, 'error');
        return false;
    }
}

async function loadFormFromDatabase(formName) {
    try {
        const form = await apiCall(`/forms/${formName}/`);
        return form;
    } catch (error) {
        console.error('Error loading form:', error);
        showToast('Error loading form: ' + error.message, 'error');
        return null;
    }
}

async function getAllFormsFromDatabase() {
    try {
        return await apiCall('/forms/');
    } catch (error) {
        console.error('Error getting forms:', error);
        return [];
    }
}

async function deleteFormFromDatabase(formName) {
    try {
        await apiCall(`/forms/${formName}/`, 'DELETE');
        showToast('Form deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting form:', error);
        showToast('Error deleting form: ' + error.message, 'error');
        return false;
    }
}

// ============== Code Snippet Functions ==============

async function saveCodeSnippetToDatabase(name, description, code) {
    try {
        await apiCall('/snippets/', 'POST', {
            name: name,
            description: description,
            code: code
        });
        showToast('Code snippet saved!', 'success');
        return true;
    } catch (error) {
        console.error('Error saving snippet:', error);
        showToast('Error saving snippet: ' + error.message, 'error');
        return false;
    }
}

async function getAllCodeSnippetsFromDatabase(search = '') {
    try {
        const endpoint = search ? `/snippets/?search=${encodeURIComponent(search)}` : '/snippets/';
        return await apiCall(endpoint);
    } catch (error) {
        console.error('Error getting snippets:', error);
        return [];
    }
}

async function deleteCodeSnippetFromDatabase(name) {
    try {
        await apiCall(`/snippets/${name}/`, 'DELETE');
        showToast('Code snippet deleted!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting snippet:', error);
        showToast('Error deleting snippet: ' + error.message, 'error');
        return false;
    }
}

// ============== Visual Logic Functions ==============

async function saveVisualLogicToDatabase(formId, controlName, eventType, conditions, actions, script) {
    try {
        await apiCall('/visual-logic/', 'POST', {
            form: formId,
            control_name: controlName,
            event_type: eventType,
            conditions: conditions,
            actions: actions,
            script: script
        });
        return true;
    } catch (error) {
        console.error('Error saving visual logic:', error);
        return false;
    }
}

async function getVisualLogicByFormFromDatabase(formId) {
    try {
        return await apiCall(`/visual-logic/?form_id=${formId}`);
    } catch (error) {
        console.error('Error getting visual logic:', error);
        return [];
    }
}

// ============== Backup and Import Functions ==============

async function backupAllDataFromDatabase() {
    try {
        const response = await fetch(`${API_BASE_URL}/backup/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error('Backup failed');
        }
        
        return response.json();
    } catch (error) {
        console.error('Error backing up data:', error);
        throw error;
    }
}

async function importDataFromDatabase(backupData) {
    try {
        const response = await fetch(`${API_BASE_URL}/import/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(backupData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Import failed');
        }
        
        return response.json();
    } catch (error) {
        console.error('Error importing data:', error);
        throw error;
    }
}

// ============== Helper Functions ==============

async function getCurrentFormId() {
    const formName = document.getElementById('propName')?.value || 'Form1';
    try {
        const forms = await getAllFormsFromDatabase();
        const form = forms.find(f => f.name === formName);
        return form ? form.id : null;
    } catch (error) {
        return null;
    }
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.apiCall = apiCall;
    window.saveFormToDatabase = saveFormToDatabase;
    window.loadFormFromDatabase = loadFormFromDatabase;
    window.getAllFormsFromDatabase = getAllFormsFromDatabase;
    window.deleteFormFromDatabase = deleteFormFromDatabase;
    window.saveCodeSnippetToDatabase = saveCodeSnippetToDatabase;
    window.getAllCodeSnippetsFromDatabase = getAllCodeSnippetsFromDatabase;
    window.deleteCodeSnippetFromDatabase = deleteCodeSnippetFromDatabase;
    window.saveVisualLogicToDatabase = saveVisualLogicToDatabase;
    window.getVisualLogicByFormFromDatabase = getVisualLogicByFormFromDatabase;
    window.backupAllDataFromDatabase = backupAllDataFromDatabase;
    window.importDataFromDatabase = importDataFromDatabase;
    window.getCurrentFormId = getCurrentFormId;
    window.showToast = showToast;
}
