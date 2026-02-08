import CodeAnalyzer from '../../core/codeAnalyzer.js';
import ProjectExporter from '../../modules/projectExporter.js';

export default class ActionButtons {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.codeAnalyzer = new CodeAnalyzer();
        this.projectExporter = new ProjectExporter();
        this.currentFunction = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.stateManager.subscribe('stateChanged', (newState) => {
            this.currentFunction = newState.selectedFunction;
        });
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'action-buttons';
        
        // Only show actions if a function is selected
        if (!this.currentFunction) {
            container.innerHTML = '<div class="no-actions">Select a function to enable editing</div>';
            return container;
        }
        
        const state = this.stateManager.getState();
        
        // Edit mode actions
        if (state.viewMode === 'edit') {
            container.appendChild(this.renderEditActions());
        } else {
            container.appendChild(this.renderReadActions());
        }
        
        return container;
    }
    
    renderReadActions() {
        const container = document.createElement('div');
        container.className = 'read-actions';
        
        // Replace button
        const replaceBtn = document.createElement('button');
        replaceBtn.className = 'btn btn-primary';
        replaceBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Replace Function';
        replaceBtn.addEventListener('click', () => {
            this.startReplace();
        });
        
        // Insert Inside button
        const insertInsideBtn = document.createElement('button');
        insertInsideBtn.className = 'btn btn-secondary';
        insertInsideBtn.innerHTML = '<i class="fas fa-level-down-alt"></i> Insert Inside';
        insertInsideBtn.addEventListener('click', () => {
            this.startInsert('inside');
        });
        
        // Insert After button
        const insertAfterBtn = document.createElement('button');
        insertAfterBtn.className = 'btn btn-secondary';
        insertAfterBtn.innerHTML = '<i class="fas fa-level-down-alt"></i> Insert After';
        insertAfterBtn.addEventListener('click', () => {
            this.startInsert('after');
        });
        
        // Export button
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-outline';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Function';
        exportBtn.addEventListener('click', () => {
            this.exportFunction();
        });
        
        container.appendChild(replaceBtn);
        container.appendChild(insertInsideBtn);
        container.appendChild(insertAfterBtn);
        container.appendChild(exportBtn);
        
        return container;
    }
    
    renderEditActions() {
        const container = document.createElement('div');
        container.className = 'edit-actions';
        
        const state = this.stateManager.getState();
        
        // Validate button
        const validateBtn = document.createElement('button');
        validateBtn.className = 'btn btn-outline';
        validateBtn.innerHTML = '<i class="fas fa-check"></i> Validate';
        validateBtn.addEventListener('click', () => {
            this.validateChanges();
        });
        
        // Show Diff button
        const diffBtn = document.createElement('button');
        diffBtn.className = 'btn btn-secondary';
        diffBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Show Diff';
        diffBtn.addEventListener('click', () => {
            this.showDiff();
        });
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        saveBtn.disabled = !state.modifiedCode || state.modifiedCode === state.originalCode;
        saveBtn.addEventListener('click', () => {
            this.saveChanges();
        });
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-danger';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
        cancelBtn.addEventListener('click', () => {
            this.cancelEdit();
        });
        
        // Validation status
        const status = document.createElement('div');
        status.className = 'validation-status';
        this.statusElement = status;
        
        container.appendChild(validateBtn);
        container.appendChild(diffBtn);
        container.appendChild(saveBtn);
        container.appendChild(cancelBtn);
        container.appendChild(status);
        
        return container;
    }
    
    startReplace() {
        this.stateManager.setEditMode('replace');
    }
    
    startInsert(position) {
        const editType = position === 'inside' ? 'insertInside' : 'insertAfter';
        this.stateManager.setEditMode(editType);
    }
    
    validateChanges() {
        const state = this.stateManager.getState();
        
        if (!state.modifiedCode) {
            this.showStatus('Code cannot be empty', 'error');
            return;
        }
        
        const validation = this.codeAnalyzer.validateReplacement(
            state.originalCode,
            state.modifiedCode
        );
        
        if (validation.isValid) {
            this.showStatus('Code is valid', 'success');
        } else {
            this.showStatus(validation.errors.join(', '), 'error');
        }
    }
    
    showDiff() {
        this.stateManager.setState({ viewMode: 'diff' });
    }
    
    async saveChanges() {
        const state = this.stateManager.getState();
        
        // Validate before saving
        const validation = this.codeAnalyzer.validateReplacement(
            state.originalCode,
            state.modifiedCode
        );
        
        if (!validation.isValid) {
            alert(`Cannot save: ${validation.errors.join(', ')}`);
            return;
        }
        
        // Confirm with user
        if (!confirm('Are you sure you want to save these changes?')) {
            return;
        }
        
        try {
            // Update the file in the file system
            // This would be implemented with your file system module
            console.log('Saving changes:', {
                function: state.selectedFunction,
                editType: state.editType,
                code: state.modifiedCode
            });
            
            // Show success message
            this.showStatus('Changes saved successfully', 'success');
            
            // Return to read mode
            setTimeout(() => {
                this.stateManager.setSelectedFunction(state.selectedFunction);
            }, 1000);
            
        } catch (error) {
            this.showStatus(`Error saving: ${error.message}`, 'error');
        }
    }
    
    cancelEdit() {
        if (confirm('Discard all changes?')) {
            this.stateManager.setSelectedFunction(this.currentFunction);
        }
    }
    
    exportFunction() {
        const state = this.stateManager.getState();
        
        // Create a blob with the function code
        const blob = new Blob([state.originalCode], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentFunction.name}.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    showStatus(message, type = 'info') {
        if (!this.statusElement) return;
        
        this.statusElement.textContent = message;
        this.statusElement.className = `validation-status ${type}`;
        
        // Clear after 3 seconds
        setTimeout(() => {
            if (this.statusElement) {
                this.statusElement.textContent = '';
                this.statusElement.className = 'validation-status';
            }
        }, 3000);
    }
    
    update() {
        // Update button states based on current state
        const event = new CustomEvent('actionsUpdated');
        document.dispatchEvent(event);
    }
}
