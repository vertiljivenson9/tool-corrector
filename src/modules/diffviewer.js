export default class DiffViewer {
    constructor() {
        this.diff = null;
        this.viewMode = 'side-by-side'; // 'side-by-side', 'inline', 'unified'
        this.highlightSyntax = true;
        this.showLineNumbers = true;
        this.onlyShowChanges = false;
    }
    
    generateDiff(original, modified) {
        // Simple line-by-line diff for demonstration
        // In production, you might want to use a more sophisticated algorithm
        
        const originalLines = original.split('\n');
        const modifiedLines = modified.split('\n');
        
        const diff = [];
        let i = 0, j = 0;
        
        while (i < originalLines.length || j < modifiedLines.length) {
            if (i < originalLines.length && j < modifiedLines.length) {
                if (originalLines[i] === modifiedLines[j]) {
                    diff.push({
                        type: 'unchanged',
                        original: originalLines[i],
                        modified: modifiedLines[j],
                        originalLine: i + 1,
                        modifiedLine: j + 1
                    });
                    i++;
                    j++;
                } else {
                    // Check if this is a deletion or addition
                    const nextOriginal = i + 1 < originalLines.length ? originalLines[i + 1] : null;
                    const nextModified = j + 1 < modifiedLines.length ? modifiedLines[j + 1] : null;
                    
                    if (nextOriginal === modifiedLines[j]) {
                        // Deletion
                        diff.push({
                            type: 'deleted',
                            original: originalLines[i],
                            modified: '',
                            originalLine: i + 1,
                            modifiedLine: null
                        });
                        i++;
                    } else if (originalLines[i] === nextModified) {
                        // Addition
                        diff.push({
                            type: 'added',
                            original: '',
                            modified: modifiedLines[j],
                            originalLine: null,
                            modifiedLine: j + 1
                        });
                        j++;
                    } else {
                        // Change
                        diff.push({
                            type: 'changed',
                            original: originalLines[i],
                            modified: modifiedLines[j],
                            originalLine: i + 1,
                            modifiedLine: j + 1
                        });
                        i++;
                        j++;
                    }
                }
            } else if (i < originalLines.length) {
                // Deletion at end
                diff.push({
                    type: 'deleted',
                    original: originalLines[i],
                    modified: '',
                    originalLine: i + 1,
                    modifiedLine: null
                });
                i++;
            } else if (j < modifiedLines.length) {
                // Addition at end
                diff.push({
                    type: 'added',
                    original: '',
                    modified: modifiedLines[j],
                    originalLine: null,
                    modifiedLine: j + 1
                });
                j++;
            }
        }
        
        this.diff = diff;
        return diff;
    }
    
    renderSideBySide() {
        if (!this.diff) return '';
        
        let html = '<div class="diff-container side-by-side">';
        html += '<div class="diff-header">';
        html += '<div class="original-title">Original</div>';
        html += '<div class="modified-title">Modified</div>';
        html += '</div>';
        html += '<div class="diff-content">';
        
        let originalLineNum = 1;
        let modifiedLineNum = 1;
        
        this.diff.forEach(change => {
            const originalLineNumDisplay = change.originalLine || '';
            const modifiedLineNumDisplay = change.modifiedLine || '';
            
            html += '<div class="diff-line">';
            
            // Original side
            html += `<div class="diff-side original ${change.type}">`;
            if (this.showLineNumbers && originalLineNumDisplay) {
                html += `<span class="line-number">${originalLineNumDisplay}</span>`;
            }
            html += `<pre><code>${this.escapeHtml(change.original)}</code></pre>`;
            html += '</div>';
            
            // Modified side
            html += `<div class="diff-side modified ${change.type}">`;
            if (this.showLineNumbers && modifiedLineNumDisplay) {
                html += `<span class="line-number">${modifiedLineNumDisplay}</span>`;
            }
            html += `<pre><code>${this.escapeHtml(change.modified)}</code></pre>`;
            html += '</div>';
            
            html += '</div>';
            
            if (change.originalLine) originalLineNum++;
            if (change.modifiedLine) modifiedLineNum++;
        });
        
        html += '</div></div>';
        return html;
    }
    
    renderInline() {
        if (!this.diff) return '';
        
        let html = '<div class="diff-container inline">';
        
        this.diff.forEach(change => {
            const lineNum = change.originalLine || change.modifiedLine || '';
            
            html += `<div class="diff-line ${change.type}">`;
            
            if (this.showLineNumbers && lineNum) {
                html += `<span class="line-number">${lineNum}</span>`;
            }
            
            if (change.type === 'unchanged') {
                html += `<pre><code>${this.escapeHtml(change.original)}</code></pre>`;
            } else if (change.type === 'deleted') {
                html += `<pre><code class="deleted">- ${this.escapeHtml(change.original)}</code></pre>`;
            } else if (change.type === 'added') {
                html += `<pre><code class="added">+ ${this.escapeHtml(change.modified)}</code></pre>`;
            } else if (change.type === 'changed') {
                html += `<pre><code class="deleted">- ${this.escapeHtml(change.original)}</code></pre>`;
                html += `<pre><code class="added">+ ${this.escapeHtml(change.modified)}</code></pre>`;
            }
            
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    }
    
    renderUnified() {
        if (!this.diff) return '';
        
        let html = '<div class="diff-container unified">';
        
        this.diff.forEach(change => {
            const lineNum = change.originalLine || change.modifiedLine || '';
            
            html += `<div class="diff-line ${change.type}">`;
            
            if (this.showLineNumbers && lineNum) {
                html += `<span class="line-number">${lineNum}</span>`;
            }
            
            if (change.type === 'unchanged') {
                html += `<pre><code>  ${this.escapeHtml(change.original)}</code></pre>`;
            } else if (change.type === 'deleted') {
                html += `<pre><code class="deleted">- ${this.escapeHtml(change.original)}</code></pre>`;
            } else if (change.type === 'added') {
                html += `<pre><code class="added">+ ${this.escapeHtml(change.modified)}</code></pre>`;
            } else if (change.type === 'changed') {
                html += `<pre><code class="deleted">- ${this.escapeHtml(change.original)}</code></pre>`;
                html += `<pre><code class="added">+ ${this.escapeHtml(change.modified)}</code></pre>`;
            }
            
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    }
    
    getStats() {
        if (!this.diff) return null;
        
        let added = 0;
        let deleted = 0;
        let changed = 0;
        let unchanged = 0;
        
        this.diff.forEach(change => {
            switch (change.type) {
                case 'added': added++; break;
                case 'deleted': deleted++; break;
                case 'changed': changed++; break;
                case 'unchanged': unchanged++; break;
            }
        });
        
        return {
            totalLines: this.diff.length,
            added,
            deleted,
            changed,
            unchanged,
            changePercentage: ((added + deleted + changed) / this.diff.length * 100).toFixed(1)
        };
    }
    
    highlightCode(code, language = 'javascript') {
        if (!this.highlightSyntax) return this.escapeHtml(code);
        
        // Simple syntax highlighting for demonstration
        // In production, use a proper syntax highlighter like Prism.js
        let highlighted = this.escapeHtml(code);
        
        // Highlight keywords
        const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'async', 'await', 'export', 'import', 'default', 'class', 'new', 'this', 'typeof', 'instanceof'];
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
            highlighted = highlighted.replace(regex, '<span class="keyword">$1</span>');
        });
        
        // Highlight strings
        highlighted = highlighted.replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, '<span class="string">$1</span>');
        
        // Highlight comments
        highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="comment">$&</span>');
        highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
        
        // Highlight numbers
        highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
        
        return highlighted;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    setViewMode(mode) {
        if (['side-by-side', 'inline', 'unified'].includes(mode)) {
            this.viewMode = mode;
        }
    }
    
    toggleHighlight() {
        this.highlightSyntax = !this.highlightSyntax;
    }
    
    toggleLineNumbers() {
        this.showLineNumbers = !this.showLineNumbers;
    }
    
    toggleOnlyChanges() {
        this.onlyShowChanges = !this.onlyShowChanges;
    }
    
    getFilteredDiff() {
        if (!this.diff || !this.onlyShowChanges) return this.diff;
        
        return this.diff.filter(change => change.type !== 'unchanged');
    }
}
