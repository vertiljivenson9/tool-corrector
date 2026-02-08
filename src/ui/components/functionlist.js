export default class FunctionList {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.groupBy = 'file';
        this.sortBy = 'name';
        this.expandedGroups = new Set();
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'function-list';
        
        const state = this.stateManager.getState();
        const functions = state.filteredFunctions?.length > 0 ? state.filteredFunctions : state.functions;
        
        if (functions.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'list-empty-state';
            
            if (state.files.length === 0) {
                emptyState.innerHTML = `
                    <i class="fas fa-code"></i>
                    <p>No functions found</p>
                    <small>Load a project to analyze functions</small>
                `;
            } else if (state.searchQuery) {
                emptyState.innerHTML = `
                    <i class="fas fa-search"></i>
                    <p>No matching functions</p>
                    <small>Try a different search term</small>
                `;
            } else {
                emptyState.innerHTML = `
                    <i class="fas fa-code"></i>
                    <p>No functions found</p>
                    <small>The project doesn't contain any detectable functions</small>
                `;
            }
            
            container.appendChild(emptyState);
            return container;
        }
        
        // Group functions
        const groups = this.groupFunctions(functions);
        
        // Render groups
        groups.forEach(group => {
            const groupElement = this.renderGroup(group);
            container.appendChild(groupElement);
        });
        
        return container;
    }
    
    groupFunctions(functions) {
        const groups = {};
        
        functions.forEach(func => {
            let key;
            
            switch (this.groupBy) {
                case 'file':
                    key = func.filePath;
                    break;
                case 'type':
                    key = func.type;
                    break;
                case 'name':
                    key = func.name.charAt(0).toUpperCase();
                    break;
                default:
                    key = 'All';
            }
            
            if (!groups[key]) {
                groups[key] = {
                    name: key,
                    functions: []
                };
            }
            
            groups[key].functions.push(func);
        });
        
        // Convert to array and sort
        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    }
    
    renderGroup(group) {
        const groupElement = document.createElement('div');
        groupElement.className = 'function-group';
        
        const header = document.createElement('div');
        header.className = 'group-header';
        
        const toggleIcon = document.createElement('i');
        toggleIcon.className = this.expandedGroups.has(group.name) ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
        
        const name = document.createElement('span');
        name.className = 'group-name';
        name.textContent = group.name;
        
        const count = document.createElement('span');
        count.className = 'group-count';
        count.textContent = `(${group.functions.length})`;
        
        header.appendChild(toggleIcon);
        header.appendChild(name);
        header.appendChild(count);
        
        header.addEventListener('click', () => {
            this.toggleGroup(group.name);
        });
        
        groupElement.appendChild(header);
        
        // Render functions if expanded
        if (this.expandedGroups.has(group.name)) {
            const list = document.createElement('div');
            list.className = 'group-functions';
            
            group.functions.sort((a, b) => {
                switch (this.sortBy) {
                    case 'name': return a.name.localeCompare(b.name);
                    case 'lines': return (a.endLine - a.startLine) - (b.endLine - b.startLine);
                    default: return 0;
                }
            }).forEach(func => {
                list.appendChild(this.renderFunctionItem(func));
            });
            
            groupElement.appendChild(list);
        }
        
        return groupElement;
    }
    
    renderFunctionItem(func) {
        const item = document.createElement('div');
        item.className = 'function-item';
        
        const icon = document.createElement('i');
        icon.className = this.getFunctionIcon(func.type);
        
        const name = document.createElement('span');
        name.className = 'function-name';
        name.textContent = func.name;
        
        const details = document.createElement('span');
        details.className = 'function-details';
        details.textContent = `Lines ${func.startLine}-${func.endLine}`;
        
        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(details);
        
        item.addEventListener('click', () => {
            this.selectFunction(func);
        });
        
        return item;
    }
    
    getFunctionIcon(type) {
        const iconMap = {
            'functionDeclaration': 'fas fa-function',
            'exportFunction': 'fas fa-file-export',
            'arrowFunction': 'fas fa-arrow-right',
            'asyncFunction': 'fas fa-bolt',
            'method': 'fas fa-cog'
        };
        
        return iconMap[type] || 'fas fa-code';
    }
    
    toggleGroup(groupName) {
        if (this.expandedGroups.has(groupName)) {
            this.expandedGroups.delete(groupName);
        } else {
            this.expandedGroups.add(groupName);
        }
        
        // Trigger re-render
        this.update();
    }
    
    selectFunction(func) {
        // Dispatch function selected event
        const event = new CustomEvent('functionSelected', {
            detail: func
        });
        document.dispatchEvent(event);
    }
    
    search(query) {
        this.stateManager.setSearchQuery(query);
    }
    
    update() {
        // Re-render the list
        const event = new CustomEvent('listUpdated');
        document.dispatchEvent(event);
    }
}
