export default class FileTree {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.expandedPaths = new Set();
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'file-tree';
        
        const state = this.stateManager.getState();
        
        if (state.files.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'tree-empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-folder-open"></i>
                <p>No files loaded</p>
                <small>Load a project to browse files</small>
            `;
            container.appendChild(emptyState);
            return container;
        }
        
        // Render file tree
        this.renderTreeItems(state.fileTree, container);
        
        return container;
    }
    
    renderTreeItems(items, container, level = 0) {
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'tree-item';
            itemElement.style.paddingLeft = `${level * 20}px`;
            
            const itemContent = document.createElement('div');
            itemContent.className = 'tree-item-content';
            
            const icon = document.createElement('i');
            const name = document.createElement('span');
            name.className = 'tree-item-name';
            name.textContent = item.name;
            
            if (item.type === 'folder') {
                icon.className = this.expandedPaths.has(item.name) ? 'fas fa-folder-open' : 'fas fa-folder';
                itemContent.appendChild(icon);
                itemContent.appendChild(name);
                
                // Toggle expansion on click
                itemContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleFolder(item.name);
                });
                
                itemElement.appendChild(itemContent);
                container.appendChild(itemElement);
                
                // Render children if expanded
                if (this.expandedPaths.has(item.name)) {
                    const childrenContainer = document.createElement('div');
                    childrenContainer.className = 'tree-children';
                    this.renderTreeItems(item.children, childrenContainer, level + 1);
                    itemElement.appendChild(childrenContainer);
                }
            } else {
                icon.className = this.getFileIcon(item.name);
                itemContent.appendChild(icon);
                itemContent.appendChild(name);
                
                // Select file on click
                itemContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectFile(item);
                });
                
                itemElement.appendChild(itemContent);
                container.appendChild(itemElement);
            }
        });
    }
    
    getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'js': 'fas fa-file-code',
            'jsx': 'fas fa-file-code',
            'ts': 'fas fa-file-code',
            'tsx': 'fas fa-file-code',
            'html': 'fas fa-file-code',
            'css': 'fas fa-file-code',
            'json': 'fas fa-file-code',
            'md': 'fas fa-file-alt',
            'txt': 'fas fa-file-alt',
            'zip': 'fas fa-file-archive'
        };
        
        return iconMap[extension] || 'fas fa-file';
    }
    
    toggleFolder(folderName) {
        if (this.expandedPaths.has(folderName)) {
            this.expandedPaths.delete(folderName);
        } else {
            this.expandedPaths.add(folderName);
        }
        
        // Trigger re-render
        const event = new CustomEvent('treeUpdated');
        document.dispatchEvent(event);
    }
    
    selectFile(file) {
        // Load file content and functions
        const state = this.stateManager.getState();
        const functions = state.functions.filter(f => f.filePath === file.path);
        
        // Dispatch file selected event
        const event = new CustomEvent('fileSelected', {
            detail: {
                file,
                functions
            }
        });
        document.dispatchEvent(event);
    }
    
    update() {
        // Update tree view if needed
        const event = new CustomEvent('treeUpdated');
        document.dispatchEvent(event);
    }
}
