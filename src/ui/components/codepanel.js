import DiffViewer from '../../modules/diffViewer.js';

export default class CodePanel {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.diffViewer = new DiffViewer();
        this.viewMode = 'code'; // 'code' or 'diff'
        this.isEditing = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.stateManager.subscribe('stateChanged', (newState) => {
            if (newState.selectedFunction !== this.currentFunction) {
                this.currentFunction = newState.selectedFunction;
                this.isEditing = false;
                this.viewMode = 'code';
            }
            
            if (newState.viewMode === 'diff') {
                this.viewMode = 'diff';
            }
        });
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'code-panel';
        
        // Panel header
        const header = this.renderHeader();
        container.appendChild(header);
        
        // Code editor/viewer
        const content = document.createElement('div');
        content.className = 'code-content';
        
        if (this.viewMode === 'diff') {
            content.appendChild(this.renderDiffView());
        } else {
            content.appendChild(this.renderCodeView());
        }
        
        container.appendChild(content);
        
        return container;
    }
    
    renderHeader() {
        const header = document.createElement('div');
        header.className = 'code-panel-header';
        
        const title = document.createElement('h3');
        title.className = 'code-title';
        
        if (this.currentFunction) {
            title.textContent = `${this.currentFunction.name} (${this.currentFunction.filePath})`;
        } else {
            title.textContent = 'No function selected';
        }
        
        const actions = document.createElement('div');
        actions.className = 'code-actions';
        
        // View mode toggle
        if (this.currentFunction) {
            const viewToggle = document.createElement('button');
            viewToggle.className = 'btn btn-sm btn-outline';
            viewToggle.innerHTML = this.viewMode === 'diff' ? '<i class="fas fa-code"></i> Code' : '<i class="fas fa-exchange-alt"></i> Diff';
            viewToggle.addEventListener('click', () => {
                this.viewMode = this.viewMode === 'diff' ? 'code' : 'diff';
                this.update();
            });
            actions.appendChild(viewToggle);
        }
        
        header.appendChild(title);
        header.appendChild(actions);
        
        return header;
    }
    
    renderCodeView() {
        const container = document.createElement('div');
        container.className = 'code-viewer';
        
        if (!this.currentFunction) {
            container.innerHTML = '<div class="empty-code">Select a function to view its code</div>';
            return container;
        }
        
        const state = this.stateManager.getState();
        
        // Create editor/read-only view
        if (state.viewMode === 'edit' && this.isEditing) {
            // Textarea for editing
            const textarea = document.createElement('textarea');
            textarea.className = 'code-editor';
            textarea.value = state.modifiedCode || this.currentFunction.code;
            textarea.spellcheck = false;
            
            textarea.addEventListener('input', (e) => {
                this.stateManager.setState({
                    modifiedCode: e.target.value
                });
            });
            
            // Auto-resize
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
            
            container.appendChild(textarea);
        } else {
            // Read-only code display
            const pre = document.createElement('pre');
            pre.className = 'code-display';
            
            const code = document.createElement('code');
            code.className = 'language-javascript';
            code.textContent = state.modifiedCode || this.currentFunction.code;
            
            pre.appendChild(code);
            container.appendChild(pre);
        }
        
        // Line numbers
        if (this.currentFunction && state.viewMode !== 'edit') {
            const lineCount = this.currentFunction.endLine - this.currentFunction.startLine + 1;
            const lineNumbers = document.createElement('div');
            lineNumbers.className = 'line-numbers';
            
            for (let i = this.currentFunction.startLine; i <= this.currentFunction.endLine; i++) {
                const line = document.createElement('div');
                line.className = 'line-number';
                line.textContent = i;
                lineNumbers.appendChild(line);
            }
            
            container.appendChild(lineNumbers);
        }
        
        return container;
    }
    
    renderDiffView() {
        const container = document.createElement('div');
        container.className = 'diff-viewer';
        
        if (!this.currentFunction) {
            container.innerHTML = '<div class="empty-diff">No function selected for diff view</div>';
            return container;
        }
        
        const state = this.stateManager.getState();
        
        if (!state.originalCode || !state.modifiedCode) {
            container.innerHTML = '<div class="empty-diff">No changes to display</div>';
            return container;
        }
        
        // Generate diff
        const diff = this.diffViewer.generateDiff(state.originalCode, state.modifiedCode);
        
        // Render based on view mode
        let diffHtml;
        switch (this.diffViewer.viewMode) {
            case 'side-by-side':
                diffHtml = this.diffViewer.renderSideBySide();
                break;
            case 'inline':
                diffHtml = this.diffViewer.renderInline();
                break;
            default:
                diffHtml = this.diffViewer.renderUnified();
        }
        
        container.innerHTML = diffHtml;
        
        return container;
    }
    
    update() {
        // Update code panel based on current state
        const event = new CustomEvent('codePanelUpdated');
        document.dispatchEvent(event);
    }
    
    startEditing() {
        this.isEditing = true;
        this.update();
    }
    
    stopEditing() {
        this.isEditing = false;
        this.update();
    }
}
