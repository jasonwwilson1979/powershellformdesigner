// PowerShell Form Designer - Django Backend Integration
// This file contains all the JavaScript logic for the form designer

// API Configuration
const API_BASE_URL = '/api';

// Application State
let selectedControl = null;
let currentTool = 'select';
let controlEventHandlers = {};
let controlVisualLogic = {};
let currentFormName = 'Form1';
let draggedElement = null;
let clipboardControl = null;

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
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
    }
    
    return response.json();
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ============== Form Management ==============

async function saveFormToDatabase(formData) {
    try {
        const data = {
            name: formData.fileName,
            text: formData.formStructure.text,
            size: formData.formStructure.size,
            location: formData.formStructure.location,
            back_color: formData.formStructure.backColor,
            fore_color: formData.formStructure.foreColor,
            font: formData.formStructure.font,
            controls: formData.controls
        };
        
        await apiCall('/forms/', 'POST', data);
        showToast('Form saved successfully!', 'success');
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

async function getAllForms() {
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

// ============== Code Snippet Management ==============

async function saveCodeSnippet(name, description, code) {
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

async function getAllCodeSnippets(search = '') {
    try {
        const endpoint = search ? `/snippets/?search=${encodeURIComponent(search)}` : '/snippets/';
        return await apiCall(endpoint);
    } catch (error) {
        console.error('Error getting snippets:', error);
        return [];
    }
}

async function deleteCodeSnippet(name) {
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

// ============== Visual Logic Management ==============

async function saveVisualLogic(formId, controlName, eventType, conditions, actions, script) {
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

async function getVisualLogicByForm(formId) {
    try {
        return await apiCall(`/visual-logic/?form_id=${formId}`);
    } catch (error) {
        console.error('Error getting visual logic:', error);
        return [];
    }
}

// ============== Backup and Import ==============

async function backupAllData() {
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

async function importData(backupData) {
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

// ============== Drag and Drop Functions ==============

function dragStart(e) {
    draggedElement = this;
    e.dataTransfer.setData('text/plain', this.getAttribute('data-type'));
    e.dataTransfer.effectAllowed = 'copy';
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    const targetElement = e.target.closest('.form-control');
    if (targetElement && (targetElement.getAttribute('data-type') === 'panel' ||
                          targetElement.getAttribute('data-type') === 'groupbox' ||
                          targetElement.getAttribute('data-type') === 'toolwindow')) {
        targetElement.style.outline = '2px dashed #3498db';
        targetElement.style.outlineOffset = '0px';
    }
}

function drop(e) {
    e.preventDefault();
    
    const allContainers = document.querySelectorAll('.form-control[data-type="panel"], .form-control[data-type="groupbox"], .form-control[data-type="toolwindow"]');
    allContainers.forEach(container => {
        container.style.outline = '';
        container.style.outlineOffset = '';
    });
    
    const controlType = e.dataTransfer.getData('text/plain');
    if (!controlType) return;
    
    const formContainer = document.getElementById('formContainer');
    const rect = formContainer.getBoundingClientRect();
    const x = e.clientX - rect.left + formContainer.scrollLeft;
    const y = e.clientY - rect.top + formContainer.scrollTop;
    
    createFormControl(controlType, x, y);
}

function createFormControl(type, x, y) {
    const formContainer = document.getElementById('formContainer');
    const controlId = `${type}${Date.now()}`;
    
    const control = document.createElement('div');
    control.className = 'form-control';
    control.id = controlId;
    control.setAttribute('data-type', type);
    control.style.left = `${x}px`;
    control.style.top = `${y}px`;
    
    switch(type) {
        case 'label':
            control.style.width = '100px';
            control.style.height = '20px';
            control.innerHTML = `<label>Label</label>`;
            break;
        case 'textbox':
            control.style.width = '150px';
            control.style.height = '25px';
            control.innerHTML = `<input type="text" value="" />`;
            break;
        case 'button':
            control.style.width = '100px';
            control.style.height = '30px';
            control.innerHTML = `<button>Button</button>`;
            break;
        case 'checkbox':
            control.style.width = '150px';
            control.style.height = '20px';
            control.innerHTML = `<label><input type="checkbox" /> CheckBox</label>`;
            break;
        case 'radiobutton':
            control.style.width = '150px';
            control.style.height = '20px';
            control.innerHTML = `<label><input type="radio" /> RadioButton</label>`;
            break;
        case 'combobox':
            control.style.width = '150px';
            control.style.height = '25px';
            control.innerHTML = `<select><option>Item 1</option><option>Item 2</option></select>`;
            break;
        case 'listbox':
            control.style.width = '150px';
            control.style.height = '100px';
            control.innerHTML = `<select multiple><option>Item 1</option><option>Item 2</option><option>Item 3</option></select>`;
            break;
        case 'panel':
            control.style.width = '200px';
            control.style.height = '150px';
            control.style.backgroundColor = '#f5f5f5';
            break;
        case 'groupbox':
            control.style.width = '200px';
            control.style.height = '150px';
            control.style.backgroundColor = '#f0f0f0';
            control.innerHTML = `<div style="padding: 5px; border: 1px solid #ccc; height: 100%;">GroupBox</div>`;
            break;
        case 'toolwindow':
            control.style.width = '200px';
            control.style.height = '150px';
            control.style.backgroundColor = '#e0e0e0';
            break;
        case 'menustrip':
            control.style.width = '100%';
            control.style.height = '30px';
            control.style.top = '0';
            control.innerHTML = `<div style="padding: 5px;">MenuStrip</div>`;
            break;
    }
    
    addControlEvents(control);
    formContainer.appendChild(control);
    selectControl({ target: control });
}

function addControlEvents(control) {
    control.addEventListener('click', selectControl);
    control.addEventListener('dblclick', openLogicBuilder);
    
    const resizeHandleE = document.createElement('div');
    resizeHandleE.className = 'resize-handle-e';
    control.appendChild(resizeHandleE);
    
    const resizeHandleSE = document.createElement('div');
    resizeHandleSE.className = 'resize-handle-se';
    control.appendChild(resizeHandleSE);
}

function selectControl(e) {
    e.stopPropagation();
    
    if (selectedControl) {
        selectedControl.classList.remove('selected');
    }
    
    selectedControl = e.target.closest('.form-control');
    if (selectedControl) {
        selectedControl.classList.add('selected');
        loadControlProperties(selectedControl);
    }
}

function loadControlProperties(control) {
    const type = control.getAttribute('data-type');
    
    document.getElementById('propName').value = control.id;
    
    if (type === 'label') {
        const label = control.querySelector('label');
        if (label) {
            document.getElementById('propText').value = label.textContent;
        }
    } else if (type === 'textbox') {
        const input = control.querySelector('input');
        if (input) {
            document.getElementById('propText').value = input.value;
        }
    } else if (type === 'button') {
        const button = control.querySelector('button');
        if (button) {
            document.getElementById('propText').value = button.textContent;
        }
    }
    
    const size = `${control.offsetWidth}, ${control.offsetHeight}`;
    document.getElementById('propSize').value = size;
    
    const location = `${control.offsetLeft}, ${control.offsetTop}`;
    document.getElementById('propLocation').value = location;
}

function openLogicBuilder(e) {
    e.stopPropagation();
    if (!selectedControl) return;
    
    const logicBuilderModal = document.getElementById('logicBuilderModal');
    if (logicBuilderModal) {
        logicBuilderModal.style.display = 'flex';
    }
}

// ============== Property Updates ==============

function updateControlProperty(property, value) {
    if (!selectedControl) return;
    
    const type = selectedControl.getAttribute('data-type');
    
    if (property === 'name') {
        selectedControl.id = value;
    } else if (property === 'text') {
        if (type === 'label') {
            const label = selectedControl.querySelector('label');
            if (label) label.textContent = value;
        } else if (type === 'textbox') {
            const input = selectedControl.querySelector('input');
            if (input) input.value = value;
        } else if (type === 'button') {
            const button = selectedControl.querySelector('button');
            if (button) button.textContent = value;
        }
    } else if (property === 'size') {
        const [width, height] = value.split(',').map(s => s.trim());
        selectedControl.style.width = `${width}px`;
        selectedControl.style.height = `${height}px`;
    } else if (property === 'location') {
        const [left, top] = value.split(',').map(s => s.trim());
        selectedControl.style.left = `${left}px`;
        selectedControl.style.top = `${top}px`;
    } else if (property === 'backColor') {
        selectedControl.style.backgroundColor = value;
    }
}

// ============== Code Generation ==============

function generateRealTimeCode() {
    const formContainer = document.getElementById('formContainer');
    const formName = document.getElementById('propName').value;
    const formText = document.getElementById('propText').value;
    const formSize = document.getElementById('propSize').value;
    const formLocation = document.getElementById('propLocation').value;
    const formBackColor = document.getElementById('propBackColor').value;
    
    let code = `# PowerShell Form: ${formName}\n`;
    code += `# Generated by PowerShell Form Designer\n\n`;
    code += `Add-Type -AssemblyName System.Windows.Forms\n`;
    code += `Add-Type -AssemblyName System.Drawing\n\n`;
    code += `# Create Form\n`;
    code += `$${formName} = New-Object System.Windows.Forms.Form\n`;
    code += `$${formName}.Text = "${formText}"\n`;
    code += `$${formName}.Size = New-Object System.Drawing.Size(${formSize})\n`;
    code += `$${formName}.StartPosition = 'Manual'\n`;
    code += `$${formName}.Location = New-Object System.Drawing.Point(${formLocation})\n`;
    code += `$${formName}.BackColor = "${formBackColor}"\n\n`;
    
    const controls = formContainer.querySelectorAll('.form-control');
    controls.forEach(control => {
        const type = control.getAttribute('data-type');
        const controlId = control.id;
        
        code += `# Create ${type}\n`;
        code += `$${controlId} = New-Object System.Windows.Forms.${capitalize(type)}\n`;
        
        if (type === 'label') {
            const label = control.querySelector('label');
            if (label) {
                code += `$${controlId}.Text = "${label.textContent}"\n`;
            }
        } else if (type === 'textbox') {
            const input = control.querySelector('input');
            if (input) {
                code += `$${controlId}.Text = "${input.value}"\n`;
            }
        } else if (type === 'button') {
            const button = control.querySelector('button');
            if (button) {
                code += `$${controlId}.Text = "${button.textContent}"\n`;
            }
        }
        
        code += `$${controlId}.Location = New-Object System.Drawing.Point(${control.offsetLeft}, ${control.offsetTop})\n`;
        code += `$${controlId}.Size = New-Object System.Drawing.Size(${control.offsetWidth}, ${control.offsetHeight})\n`;
        code += `$${formName}.Controls.Add($${controlId})\n\n`;
        
        if (controlEventHandlers[controlId]) {
            for (const [eventType, script] of Object.entries(controlEventHandlers[controlId])) {
                code += `# ${controlId} ${eventType} Event\n`;
                code += `$${controlId}.add_${eventType}({\n`;
                code += `    ${script.replace(/\n/g, '\n    ')}\n`;
                code += `})\n\n`;
            }
        }
    });
    
    code += `# Show Form\n`;
    code += `$${formName}.Add_Shown({ $${formName}.Activate() })\n`;
    code += `$${formName}.ShowDialog()\n`;
    
    const codePreview = document.getElementById('codePreviewContent');
    if (codePreview) {
        codePreview.textContent = code;
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============== Modal Functions ==============

function showSavedFormsList() {
    getAllForms().then(forms => {
        if (forms.length === 0) {
            showToast('No saved forms found', 'info');
            return;
        }
        
        const formList = forms.map(f => `- ${f.name}`).join('\n');
        alert(`Saved Forms:\n\n${formList}\n\nSelect a form name to load:`);
        
        const formName = prompt('Enter form name to load:');
        if (formName) {
            loadFormFromDatabase(formName).then(form => {
                if (form) {
                    loadFormIntoDesigner(form);
                }
            });
        }
    });
}

function loadFormIntoDesigner(form) {
    const formContainer = document.getElementById('formContainer');
    formContainer.innerHTML = '';
    
    document.getElementById('propName').value = form.name;
    document.getElementById('propText').value = form.text;
    document.getElementById('propSize').value = form.size;
    document.getElementById('propLocation').value = form.location;
    document.getElementById('propBackColor').value = form.back_color;
    document.getElementById('propForeColor').value = form.fore_color;
    document.getElementById('propFont').value = form.font;
    
    form.controls.forEach(controlData => {
        const control = document.createElement('div');
        control.className = 'form-control';
        control.id = controlData.id;
        control.setAttribute('data-type', controlData.type);
        control.setAttribute('style', controlData.style);
        control.innerHTML = controlData.innerHTML;
        
        addControlEvents(control);
        formContainer.appendChild(control);
    });
    
    controlEventHandlers = form.eventHandlers || {};
    generateRealTimeCode();
    showToast('Form loaded successfully!', 'success');
}

// ============== Modal Event Handlers ==============

function setupModalHandlers() {
    // Save Modal
    const saveBtn = document.getElementById('saveBtn');
    const saveFormModal = document.getElementById('saveFormModal');
    const confirmSaveBtn = document.getElementById('confirmSaveBtn');
    const cancelSaveBtn = document.getElementById('cancelSaveBtn');
    const fileNameInput = document.getElementById('fileNameInput');
    
    if (saveBtn && saveFormModal) {
        saveBtn.addEventListener('click', () => {
            saveFormModal.style.display = 'flex';
            fileNameInput.value = currentFormName;
        });
    }
    
    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', async () => {
            const fileName = fileNameInput.value.trim();
            if (!fileName) {
                showToast('Please enter a form name', 'error');
                return;
            }
            
            currentFormName = fileName;
            const formData = collectFormData();
            const success = await saveFormToDatabase(formData);
            
            if (success) {
                saveFormModal.style.display = 'none';
            }
        });
    }
    
    if (cancelSaveBtn && saveFormModal) {
        cancelSaveBtn.addEventListener('click', () => {
            saveFormModal.style.display = 'none';
        });
    }
    
    // Load Modal
    const loadBtn = document.getElementById('loadBtn');
    const loadFormModal = document.getElementById('loadFormModal');
    const confirmLoadBtn = document.getElementById('confirmLoadBtn');
    const cancelLoadBtn = document.getElementById('cancelLoadBtn');
    const loadFormSelect = document.getElementById('loadFormSelect');
    
    if (loadBtn && loadFormModal) {
        loadBtn.addEventListener('click', async () => {
            loadFormModal.style.display = 'flex';
            loadFormSelect.innerHTML = '<option value="">-- Select a form --</option>';
            
            const forms = await getAllForms();
            forms.forEach(form => {
                const option = document.createElement('option');
                option.value = form.name;
                option.textContent = form.name;
                loadFormSelect.appendChild(option);
            });
        });
    }
    
    if (confirmLoadBtn) {
        confirmLoadBtn.addEventListener('click', async () => {
            const formName = loadFormSelect.value;
            if (!formName) {
                showToast('Please select a form', 'error');
                return;
            }
            
            const form = await loadFormFromDatabase(formName);
            if (form) {
                loadFormIntoDesigner(form);
                loadFormModal.style.display = 'none';
            }
        });
    }
    
    if (cancelLoadBtn && loadFormModal) {
        cancelLoadBtn.addEventListener('click', () => {
            loadFormModal.style.display = 'none';
        });
    }
    
    // Code Library Modal
    const codeLibraryBtn = document.getElementById('codeLibraryBtn');
    const codeLibraryModal = document.getElementById('codeLibraryModal');
    const closeCodeLibrary = document.getElementById('closeCodeLibrary');
    const closeCodeLibraryBtn = document.getElementById('closeCodeLibraryBtn');
    const addCodeSnippetModalBtn = document.getElementById('addCodeSnippetModalBtn');
    const codeLibraryModalName = document.getElementById('codeLibraryModalName');
    const codeLibraryModalDescription = document.getElementById('codeLibraryModalDescription');
    const codeLibraryModalSnippet = document.getElementById('codeLibraryModalSnippet');
    const codeLibraryModalSearch = document.getElementById('codeLibraryModalSearch');
    const codeLibraryModalList = document.getElementById('codeLibraryModalList');
    const codeLibraryModalEmptyMessage = document.getElementById('codeLibraryModalEmptyMessage');
    
    if (codeLibraryBtn && codeLibraryModal) {
        codeLibraryBtn.addEventListener('click', () => {
            codeLibraryModal.style.display = 'flex';
            loadCodeSnippetsModal();
        });
    }
    
    if (closeCodeLibrary && codeLibraryModal) {
        closeCodeLibrary.addEventListener('click', () => {
            codeLibraryModal.style.display = 'none';
        });
    }
    
    if (closeCodeLibraryBtn && codeLibraryModal) {
        closeCodeLibraryBtn.addEventListener('click', () => {
            codeLibraryModal.style.display = 'none';
        });
    }
    
    if (addCodeSnippetModalBtn) {
        addCodeSnippetModalBtn.addEventListener('click', async () => {
            const name = codeLibraryModalName.value.trim();
            const description = codeLibraryModalDescription.value.trim();
            const code = codeLibraryModalSnippet.value.trim();
            
            if (!name || !code) {
                showToast('Please enter both a name and code for the snippet', 'error');
                return;
            }
            
            const success = await saveCodeSnippet(name, description, code);
            if (success) {
                codeLibraryModalName.value = '';
                codeLibraryModalDescription.value = '';
                codeLibraryModalSnippet.value = '';
                loadCodeSnippetsModal();
            }
        });
    }
    
    if (codeLibraryModalSearch) {
        codeLibraryModalSearch.addEventListener('input', () => {
            loadCodeSnippetsModal(codeLibraryModalSearch.value);
        });
    }
    
    // Logic Builder Modal
    const logicBuilderModal = document.getElementById('logicBuilderModal');
    const closeLogicBuilder = document.getElementById('closeLogicBuilder');
    const cancelLogicBtn = document.getElementById('cancelLogicBtn');
    const saveLogicBtn = document.getElementById('saveLogicBtn');
    const eventScript = document.getElementById('eventScript');
    const logicBuilderControlName = document.getElementById('logicBuilderControlName');
    
    if (closeLogicBuilder && logicBuilderModal) {
        closeLogicBuilder.addEventListener('click', () => {
            logicBuilderModal.style.display = 'none';
        });
    }
    
    if (cancelLogicBtn && logicBuilderModal) {
        cancelLogicBtn.addEventListener('click', () => {
            logicBuilderModal.style.display = 'none';
        });
    }
    
    if (saveLogicBtn && logicBuilderModal) {
        saveLogicBtn.addEventListener('click', async () => {
            if (!selectedControl) {
                showToast('No control selected', 'error');
                return;
            }
            
            const controlId = selectedControl.id;
            const eventType = document.getElementById('eventSelector').value;
            const script = eventScript.value;
            
            if (!controlEventHandlers[controlId]) {
                controlEventHandlers[controlId] = {};
            }
            controlEventHandlers[controlId][eventType] = script;
            
            // Save to database if form exists
            const form = await getFormByName(currentFormName);
            if (form && form.id) {
                await saveVisualLogic(
                    form.id,
                    controlId,
                    eventType,
                    [],
                    [],
                    script
                );
            }
            
            logicBuilderModal.style.display = 'none';
            generateRealTimeCode();
            showToast('Logic saved!', 'success');
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === saveFormModal) {
            saveFormModal.style.display = 'none';
        }
        if (event.target === loadFormModal) {
            loadFormModal.style.display = 'none';
        }
        if (event.target === codeLibraryModal) {
            codeLibraryModal.style.display = 'none';
        }
        if (event.target === logicBuilderModal) {
            logicBuilderModal.style.display = 'none';
        }
    });
}

async function loadCodeSnippetsModal(searchTerm = '') {
    const codeLibraryModalList = document.getElementById('codeLibraryModalList');
    const codeLibraryModalEmptyMessage = document.getElementById('codeLibraryModalEmptyMessage');
    
    if (!codeLibraryModalList || !codeLibraryModalEmptyMessage) {
        return;
    }
    
    const snippets = await getAllCodeSnippets(searchTerm);
    
    if (snippets.length === 0) {
        codeLibraryModalEmptyMessage.style.display = 'block';
        codeLibraryModalList.innerHTML = '';
        codeLibraryModalList.appendChild(codeLibraryModalEmptyMessage);
        return;
    }
    
    codeLibraryModalEmptyMessage.style.display = 'none';
    codeLibraryModalList.innerHTML = '';
    
    snippets.forEach(snippet => {
        const snippetElement = document.createElement('div');
        snippetElement.style.cssText = `
            background-color: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
        `;
        
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        `;
        
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = `
            font-weight: 600;
            color: #2c3e50;
            font-size: 14px;
        `;
        titleDiv.textContent = snippet.name;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.style.cssText = `
            display: flex;
            gap: 5px;
        `;
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-secondary';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        copyBtn.style.cssText = `
            padding: 4px 8px;
            font-size: 12px;
        `;
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(snippet.code);
            showToast('Code copied to clipboard!', 'success');
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-secondary';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
        deleteBtn.style.cssText = `
            padding: 4px 8px;
            font-size: 12px;
            background-color: #e74c3c;
        `;
        deleteBtn.onclick = async () => {
            if (confirm(`Are you sure you want to delete "${snippet.name}"?`)) {
                await deleteCodeSnippet(snippet.name);
                loadCodeSnippetsModal(searchTerm);
            }
        };
        
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(deleteBtn);
        headerDiv.appendChild(titleDiv);
        headerDiv.appendChild(actionsDiv);
        
        const descDiv = document.createElement('div');
        if (snippet.description) {
            descDiv.style.cssText = `
                color: #7f8c8d;
                font-size: 12px;
                margin-bottom: 8px;
                font-style: italic;
            `;
            descDiv.textContent = snippet.description;
        }
        
        const codeDiv = document.createElement('pre');
        codeDiv.style.cssText = `
            background-color: #1e1e1e;
            color: #dcdcdc;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 12px;
            white-space: pre-wrap;
            word-wrap: break-word;
        `;
        codeDiv.textContent = snippet.code;
        
        snippetElement.appendChild(headerDiv);
        if (snippet.description) {
            snippetElement.appendChild(descDiv);
        }
        snippetElement.appendChild(codeDiv);
        codeLibraryModalList.appendChild(snippetElement);
    });
}

async function getFormByName(name) {
    const forms = await getAllForms();
    return forms.find(f => f.name === name);
}

// ============== Initialization ==============

document.addEventListener('DOMContentLoaded', function() {
    console.log('PowerShell Form Designer initialized with Django backend');
    
    const formContainer = document.getElementById('formContainer');
    const components = document.querySelectorAll('.component-item');
    
    components.forEach(component => {
        component.addEventListener('dragstart', dragStart);
    });
    
    formContainer.addEventListener('dragover', dragOver);
    formContainer.addEventListener('drop', drop);
    formContainer.addEventListener('click', (e) => {
        if (e.target === formContainer) {
            if (selectedControl) {
                selectedControl.classList.remove('selected');
                selectedControl = null;
            }
        }
    });
    
    // Setup property change listeners
    const propInputs = ['propName', 'propText', 'propSize', 'propLocation', 'propBackColor', 'propForeColor', 'propFont'];
    propInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', () => {
                const propMap = {
                    'propName': 'name',
                    'propText': 'text',
                    'propSize': 'size',
                    'propLocation': 'location',
                    'propBackColor': 'backColor',
                    'propForeColor': 'foreColor',
                    'propFont': 'font'
                };
                updateControlProperty(propMap[id], element.value);
                generateRealTimeCode();
            });
        }
    });
    
    // Setup modal handlers
    setupModalHandlers();
    
    generateRealTimeCode();
    loadAllForms();
    loadAllCodeSnippets();
});

async function loadAllForms() {
    const forms = await getAllForms();
    console.log('Loaded forms:', forms);
}

async function loadAllCodeSnippets() {
    const snippets = await getAllCodeSnippets();
    console.log('Loaded code snippets:', snippets);
}

function collectFormData() {
    const formContainer = document.getElementById('formContainer');
    const controls = [];
    
    formContainer.querySelectorAll('.form-control').forEach(control => {
        controls.push({
            id: control.id,
            type: control.getAttribute('data-type'),
            style: control.getAttribute('style'),
            innerHTML: control.innerHTML
        });
    });
    
    return {
        fileName: currentFormName,
        formStructure: {
            name: document.getElementById('propName').value,
            text: document.getElementById('propText').value,
            size: document.getElementById('propSize').value,
            location: document.getElementById('propLocation').value,
            backColor: document.getElementById('propBackColor').value,
            foreColor: document.getElementById('propForeColor').value,
            font: document.getElementById('propFont').value
        },
        controls: controls,
        eventHandlers: controlEventHandlers,
        visualLogic: controlVisualLogic
    };
}
