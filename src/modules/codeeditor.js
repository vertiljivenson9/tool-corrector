export default class CodeEditor {
    constructor() {
        this.editorElement = null;
        this.currentFile = null;
        this.currentFunction = null;
        this.originalContent = '';
        this.modifiedContent = '';
        this.isEditing = false;
        this.editType = null; // 'replace', 'insertInside', 'insertAfter'
        this.validationErrors = [];
        this.undoStack = [];
        this.redoStack = [];
        this.cursorPosition = { line: 0, column: 0 };
        this.selectionRange = null;
    }

    initialize(container) {
        this.editorElement = document.createElement('div');
        this.editorElement.className = 'code-editor-container';
        
        // Create toolbar
        const toolbar = this.createToolbar();
        this.editorElement.appendChild(toolbar);

        // Create editor area
        const editorArea = document.createElement('div');
        editorArea.className = 'editor-area';
        
        // Line numbers
        this.lineNumbers = document.createElement('div');
        this.lineNumbers.className = 'line-numbers';
        editorArea.appendChild(this.lineNumbers);

        // Text editor
        this.textEditor = document.createElement('textarea');
        this.textEditor.className = 'text-editor';
        this.textEditor.spellcheck = false;
        this.textEditor.addEventListener('input', (e) => this.handleInput(e));
        this.textEditor.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.textEditor.addEventListener('scroll', () => this.syncScroll());
        this.textEditor.addEventListener('click', () => this.updateCursorPosition());
        this.textEditor.addEventListener('select', () => this.updateSelection());
        
        editorArea.appendChild(this.textEditor);

        // Code preview (read-only view)
        this.codePreview = document.createElement('pre');
        this.codePreview.className = 'code-preview';
        this.codePreview.innerHTML = '<code></code>';
        editorArea.appendChild(this.codePreview);

        this.editorElement.appendChild(editorArea);

        // Create status bar
        const statusBar = this.createStatusBar();
        this.editorElement.appendChild(statusBar);

        container.appendChild(this.editorElement);
        
        // Set up syntax highlighting
        this.setupSyntaxHighlighting();
        
        return this.editorElement;
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';

        // File actions
        const saveBtn = this.createToolbarButton('fas fa-save', 'Save', () => this.save(), 'save-btn');
        const undoBtn = this.createToolbarButton('fas fa-undo', 'Undo', () => this.undo(), 'undo-btn');
        const redoBtn = this.createToolbarButton('fas fa-redo', 'Redo', () => this.redo(), 'redo-btn');
        
        toolbar.appendChild(saveBtn);
        toolbar.appendChild(undoBtn);
        toolbar.appendChild(redoBtn);

        toolbar.appendChild(document.createElement('div')).className = 'toolbar-separator';

        // Edit actions
        const findBtn = this.createToolbarButton('fas fa-search', 'Find', () => this.find(), 'find-btn');
        const replaceBtn = this.createToolbarButton('fas fa-exchange-alt', 'Replace', () => this.replace(), 'replace-btn');
        const formatBtn = this.createToolbarButton('fas fa-code', 'Format', () => this.format(), 'format-btn');
        
        toolbar.appendChild(findBtn);
        toolbar.appendChild(replaceBtn);
        toolbar.appendChild(formatBtn);

        toolbar.appendChild(document.createElement('div')).className = 'toolbar-separator';

        // View actions
        const zoomInBtn = this.createToolbarButton('fas fa-search-plus', 'Zoom In', () => this.zoomIn(), 'zoom-in-btn');
        const zoomOutBtn = this.createToolbarButton('fas fa-search-minus', 'Zoom Out', () => this.zoomOut(), 'zoom-out-btn');
        const wordWrapBtn = this.createToolbarButton('fas fa-text-width', 'Toggle Word Wrap', () => this.toggleWordWrap(), 'wordwrap-btn');
        
        toolbar.appendChild(zoomInBtn);
        toolbar.appendChild(zoomOutBtn);
        toolbar.appendChild(wordWrapBtn);

        return toolbar;
    }

    createToolbarButton(iconClass, title, onClick, className = '') {
        const button = document.createElement('button');
        button.className = `toolbar-btn ${className}`;
        button.innerHTML = `<i class="${iconClass}"></i>`;
        button.title = title;
        button.addEventListener('click', onClick);
        return button;
    }

    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'editor-status-bar';

        this.cursorPositionEl = document.createElement('span');
        this.cursorPositionEl.className = 'cursor-position';
        this.cursorPositionEl.textContent = 'Ln 1, Col 1';

        this.fileInfoEl = document.createElement('span');
        this.fileInfoEl.className = 'file-info';
        
        this.editModeEl = document.createElement('span');
        this.editModeEl.className = 'edit-mode';
        
        this.validationStatusEl = document.createElement('span');
        this.validationStatusEl.className = 'validation-status';

        statusBar.appendChild(this.cursorPositionEl);
        statusBar.appendChild(this.fileInfoEl);
        statusBar.appendChild(this.editModeEl);
        statusBar.appendChild(this.validationStatusEl);

        return statusBar;
    }

    setupSyntaxHighlighting() {
        // This is a basic syntax highlighter
        // In production, you might want to use a library like Prism.js or Monaco Editor
        this.highlightKeywords = [
            // JavaScript keywords
            'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
            'return', 'async', 'await', 'export', 'import', 'default', 'class',
            'new', 'this', 'typeof', 'instanceof', 'try', 'catch', 'finally',
            'throw', 'switch', 'case', 'break', 'continue', 'do', 'in', 'of'
        ];
    }

    setFile(file) {
        this.currentFile = file;
        this.originalContent = file.content;
        this.modifiedContent = file.content;
        this.isEditing = false;
        this.editType = null;
        this.validationErrors = [];
        this.undoStack = [];
        this.redoStack = [];
        
        this.updateEditorContent();
        this.updateStatusBar();
    }

    setFunction(func, editType = null) {
        this.currentFunction = func;
        this.editType = editType;
        
        if (editType) {
            this.isEditing = true;
            this.setEditMode(editType);
        } else {
            this.isEditing = false;
            this.highlightFunction(func);
        }
        
        this.updateStatusBar();
    }

    setEditMode(editType) {
        this.editType = editType;
        this.isEditing = true;
        
        if (!this.currentFunction) return;

        let content = '';
        switch (editType) {
            case 'replace':
                content = this.currentFunction.code;
                break;
            case 'insertInside':
                content = this.getInsertTemplate('inside');
                break;
            case 'insertAfter':
                content = this.getInsertTemplate('after');
                break;
        }

        this.modifiedContent = content;
        this.updateEditorContent();
        this.textEditor.focus();
    }

    getInsertTemplate(position) {
        const templates = {
            inside: `// Insert code inside function
// Your code will be placed at the beginning of the function body
// Example:
// console.log('Code inserted at: ' + new Date().toISOString());
// const newVariable = 'Hello World';`,
            after: `// Insert code after function
// Your code will be placed after the closing brace
// Example:
// console.log('Function ${this.currentFunction?.name || 'unnamed'} executed');
// Helper functions or additional logic can go here`
        };
        return templates[position] || '';
    }

    updateEditorContent() {
        if (!this.textEditor) return;

        this.textEditor.value = this.modifiedContent;
        this.updateLineNumbers();
        this.syntaxHighlight();
        this.updateCursorPosition();
    }

    updateLineNumbers() {
        if (!this.lineNumbers) return;

        const lines = this.modifiedContent.split('\n');
        this.lineNumbers.innerHTML = '';
        
        lines.forEach((_, index) => {
            const lineNumber = document.createElement('div');
            lineNumber.className = 'line-number';
            lineNumber.textContent = index + 1;
            this.lineNumbers.appendChild(lineNumber);
        });
    }

    syntaxHighlight() {
        if (!this.codePreview) return;

        let highlighted = this.escapeHtml(this.modifiedContent);
        
        // Highlight keywords
        this.highlightKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
            highlighted = highlighted.replace(regex, '<span class="keyword">$1</span>');
        });
        
        // Highlight strings
        highlighted = highlighted.replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/g, 
            '<span class="string">$&</span>');
        
        // Highlight comments
        highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="comment">$&</span>');
        highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
        
        // Highlight numbers
        highlighted = highlighted.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="number">$1</span>');
        
        // Highlight function names
        if (this.currentFunction) {
            highlighted = highlighted.replace(
                new RegExp(`\\b(${this.currentFunction.name})\\b`, 'g'),
                '<span class="function-name">$1</span>'
            );
        }

        this.codePreview.querySelector('code').innerHTML = highlighted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    syncScroll() {
        if (this.codePreview && this.textEditor) {
            this.codePreview.scrollTop = this.textEditor.scrollTop;
            this.codePreview.scrollLeft = this.textEditor.scrollLeft;
            this.lineNumbers.scrollTop = this.textEditor.scrollTop;
        }
    }

    handleInput(e) {
        const newContent = e.target.value;
        
        // Save to undo stack
        if (newContent !== this.modifiedContent) {
            this.undoStack.push(this.modifiedContent);
            this.redoStack = [];
            this.modifiedContent = newContent;
            this.updateLineNumbers();
            this.syntaxHighlight();
            this.validateContent();
        }
    }

    handleKeyDown(e) {
        // Handle tab key
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.textEditor.selectionStart;
            const end = this.textEditor.selectionEnd;
            
            if (e.shiftKey) {
                // Unindent
                const before = this.textEditor.value.substring(0, start);
                const after = this.textEditor.value.substring(end);
                
                // Find line start
                const lineStart = before.lastIndexOf('\n') + 1;
                const lineContent = this.textEditor.value.substring(lineStart, start);
                
                if (lineContent.startsWith('  ')) {
                    this.textEditor.value = before.substring(0, lineStart) + 
                                          lineContent.substring(2) + after;
                    this.textEditor.selectionStart = start - 2;
                    this.textEditor.selectionEnd = end - 2;
                } else if (lineContent.startsWith('\t')) {
                    this.textEditor.value = before.substring(0, lineStart) + 
                                          lineContent.substring(1) + after;
                    this.textEditor.selectionStart = start - 1;
                    this.textEditor.selectionEnd = end - 1;
                }
            } else {
                // Indent
                this.textEditor.value = this.textEditor.value.substring(0, start) + 
                                      '  ' + 
                                      this.textEditor.value.substring(end);
                this.textEditor.selectionStart = start + 2;
                this.textEditor.selectionEnd = end + 2;
            }
            
            this.handleInput({ target: this.textEditor });
            return;
        }

        // Handle undo/redo with Ctrl+Z/Ctrl+Y
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            } else if (e.key === 'z' && e.shiftKey) {
                e.preventDefault();
                this.redo();
            } else if (e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        }
    }

    updateCursorPosition() {
        if (!this.textEditor || !this.cursorPositionEl) return;

        const value = this.textEditor.value;
        const cursorPos = this.textEditor.selectionStart;
        
        // Calculate line and column
        const textBeforeCursor = value.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        this.cursorPosition = { line, column };
        this.cursorPositionEl.textContent = `Ln ${line}, Col ${column}`;
    }

    updateSelection() {
        if (!this.textEditor) return;

        const start = this.textEditor.selectionStart;
        const end = this.textEditor.selectionEnd;
        
        if (start !== end) {
            this.selectionRange = { start, end };
        } else {
            this.selectionRange = null;
        }
    }

    validateContent() {
        this.validationErrors = [];
        
        if (!this.modifiedContent.trim()) {
            this.validationErrors.push('Content cannot be empty');
        }
        
        // Check for balanced braces
        const braceCount = this.countBraces(this.modifiedContent);
        if (braceCount.open !== braceCount.close) {
            this.validationErrors.push('Unbalanced braces');
        }
        
        // Check for balanced parentheses
        const parenCount = this.countParentheses(this.modifiedContent);
        if (parenCount.open !== parenCount.close) {
            this.validationErrors.push('Unbalanced parentheses');
        }
        
        this.updateValidationStatus();
    }

    countBraces(code) {
        let open = 0;
        let close = 0;
        
        for (let i = 0; i < code.length; i++) {
            if (code[i] === '{') open++;
            if (code[i] === '}') close++;
        }
        
        return { open, close };
    }

    countParentheses(code) {
        let open = 0;
        let close = 0;
        
        for (let i = 0; i < code.length; i++) {
            if (code[i] === '(') open++;
            if (code[i] === ')') close++;
        }
        
        return { open, close };
    }

    updateValidationStatus() {
        if (!this.validationStatusEl) return;

        if (this.validationErrors.length === 0) {
            this.validationStatusEl.textContent = '✓ Valid';
            this.validationStatusEl.className = 'validation-status valid';
        } else {
            this.validationStatusEl.textContent = `✗ ${this.validationErrors[0]}`;
            this.validationStatusEl.className = 'validation-status error';
        }
    }

    updateStatusBar() {
        if (!this.fileInfoEl || !this.editModeEl) return;

        if (this.currentFile) {
            this.fileInfoEl.textContent = `${this.currentFile.name} • ${this.modifiedContent.length} chars`;
        } else {
            this.fileInfoEl.textContent = 'No file open';
        }

        if (this.isEditing && this.editType) {
            this.editModeEl.textContent = `Editing: ${this.editType}`;
            this.editModeEl.className = 'edit-mode editing';
        } else if (this.currentFunction) {
            this.editModeEl.textContent = `Viewing: ${this.currentFunction.name}`;
            this.editModeEl.className = 'edit-mode viewing';
        } else {
            this.editModeEl.textContent = 'Ready';
            this.editModeEl.className = 'edit-mode ready';
        }
    }

    save() {
        if (!this.currentFile) return;

        const event = new CustomEvent('saveFile', {
            detail: {
                file: this.currentFile,
                content: this.modifiedContent,
                originalContent: this.originalContent
            }
        });
        document.dispatchEvent(event);
    }

    undo() {
        if (this.undoStack.length > 0) {
            const previousState = this.undoStack.pop();
            this.redoStack.push(this.modifiedContent);
            this.modifiedContent = previousState;
            this.updateEditorContent();
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.undoStack.push(this.modifiedContent);
            this.modifiedContent = nextState;
            this.updateEditorContent();
        }
    }

    find() {
        const searchTerm = prompt('Enter search term:');
        if (!searchTerm) return;

        const content = this.textEditor.value;
        const index = content.indexOf(searchTerm);
        
        if (index !== -1) {
            this.textEditor.focus();
            this.textEditor.setSelectionRange(index, index + searchTerm.length);
            this.scrollToPosition(index);
        } else {
            alert('Text not found');
        }
    }

    replace() {
        const searchTerm = prompt('Enter text to replace:');
        if (!searchTerm) return;

        const replaceTerm = prompt('Enter replacement text:');
        if (replaceTerm === null) return;

        const newContent = this.textEditor.value.replace(
            new RegExp(searchTerm, 'g'), 
            replaceTerm
        );
        
        this.textEditor.value = newContent;
        this.handleInput({ target: this.textEditor });
    }

    format() {
        // Basic formatting - in production, use a proper formatter like Prettier
        let formatted = this.modifiedContent;
        
        // Add spacing around operators
        formatted = formatted.replace(/([=+\-*/%&|^<>!])=?/g, ' $1 ');
        
        // Fix multiple spaces
        formatted = formatted.replace(/\s+/g, ' ');
        
        // Fix indentation (basic)
        const lines = formatted.split('\n');
        let indentLevel = 0;
        
        const formattedLines = lines.map(line => {
            const trimmed = line.trim();
            
            if (trimmed.endsWith('{')) {
                const result = '  '.repeat(indentLevel) + trimmed;
                indentLevel++;
                return result;
            } else if (trimmed.startsWith('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
                return '  '.repeat(indentLevel) + trimmed;
            } else {
                return '  '.repeat(indentLevel) + trimmed;
            }
        });
        
        this.modifiedContent = formattedLines.join('\n');
        this.updateEditorContent();
    }

    zoomIn() {
        const currentSize = parseFloat(getComputedStyle(this.textEditor).fontSize);
        this.textEditor.style.fontSize = `${currentSize + 1}px`;
        this.codePreview.style.fontSize = `${currentSize + 1}px`;
    }

    zoomOut() {
        const currentSize = parseFloat(getComputedStyle(this.textEditor).fontSize);
        const newSize = Math.max(10, currentSize - 1);
        this.textEditor.style.fontSize = `${newSize}px`;
        this.codePreview.style.fontSize = `${newSize}px`;
    }

    toggleWordWrap() {
        this.textEditor.style.whiteSpace = 
            this.textEditor.style.whiteSpace === 'nowrap' ? 'pre-wrap' : 'nowrap';
    }

    highlightFunction(func) {
        if (!func || !this.codePreview) return;

        // Highlight the function in the code preview
        const codeElement = this.codePreview.querySelector('code');
        let html = codeElement.innerHTML;
        
        // Clear previous highlights
        html = html.replace(/<span class="function-highlight">/g, '');
        html = html.replace(/<\/span>/g, '');
        
        // Add highlight to the function
        const lines = html.split('\n');
        if (func.startLine <= lines.length && func.endLine <= lines.length) {
            for (let i = func.startLine - 1; i < func.endLine; i++) {
                lines[i] = `<span class="function-highlight">${lines[i]}</span>`;
            }
        }
        
        codeElement.innerHTML = lines.join('\n');
        
        // Scroll to the function
        this.scrollToLine(func.startLine);
    }

    scrollToLine(lineNumber) {
        if (!this.textEditor) return;

        const lineHeight = 20; // Approximate line height
        const scrollTop = (lineNumber - 1) * lineHeight;
        this.textEditor.scrollTop = scrollTop;
        this.syncScroll();
    }

    scrollToPosition(position) {
        if (!this.textEditor) return;

        const content = this.textEditor.value;
        const lines = content.substring(0, position).split('\n');
        const lineNumber = lines.length;
        this.scrollToLine(lineNumber);
    }

    getContent() {
        return this.modifiedContent;
    }

    hasChanges() {
        return this.modifiedContent !== this.originalContent;
    }

    getChanges() {
        return {
            original: this.originalContent,
            modified: this.modifiedContent,
            hasChanges: this.hasChanges(),
            validationErrors: this.validationErrors
        };
    }

    reset() {
        this.modifiedContent = this.originalContent;
        this.isEditing = false;
        this.editType = null;
        this.validationErrors = [];
        this.updateEditorContent();
    }

    destroy() {
        if (this.editorElement && this.editorElement.parentNode) {
            this.editorElement.parentNode.removeChild(this.editorElement);
        }
    }
}
