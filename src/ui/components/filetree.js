export default class FileTree {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.expandedPaths = new Set(['src']);
        this.selectedFile = null;
        this.dragState = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'file-tree';
        
        const state = this.stateManager.getState();
        
        if (!state.files || state.files.length === 0) {
            return this.renderEmptyState();
        }

        // Create file tree header
        const header = document.createElement('div');
        header.className = 'file-tree-header';
        header.innerHTML = `
            <h3><i class="fas fa-folder-open"></i> Project Files</h3>
            <span class="file-count">${state.files.length} files</span>
        `;
        container.appendChild(header);

        // Create tree controls
        const controls = this.renderControls();
        container.appendChild(controls);

        // Create tree container
        const treeContainer = document.createElement('div');
        treeContainer.className = 'tree-container';
        
        // Build and render tree structure
        const treeData = this.buildTreeStructure(state.files);
        treeData.forEach(item => {
            treeContainer.appendChild(this.renderTreeItem(item));
        });
        
        container.appendChild(treeContainer);

        return container;
    }

    renderEmptyState() {
        const container = document.createElement('div');
        container.className = 'file-tree-empty';
        container.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-folder-open"></i>
            </div>
            <h4>No Files Loaded</h4>
            <p>Load a project to browse files</p>
            <button class="btn btn-outline load-btn">
                <i class="fas fa-folder-open"></i> Load Project
            </button>
        `;

        const loadBtn = container.querySelector('.load-btn');
        loadBtn.addEventListener('click', () => {
            const event = new CustomEvent('requestLoadProject');
            document.dispatchEvent(event);
        });

        return container;
    }

    renderControls() {
        const controls = document.createElement('div');
        controls.className = 'tree-controls';

        // Expand all button
        const expandBtn = document.createElement('button');
        expandBtn.className = 'tree-control-btn';
        expandBtn.innerHTML = '<i class="fas fa-expand-alt"></i>';
        expandBtn.title = 'Expand All';
        expandBtn.addEventListener('click', () => this.expandAll());

        // Collapse all button
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'tree-control-btn';
        collapseBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
        collapseBtn.title = 'Collapse All';
        collapseBtn.addEventListener('click', () => this.collapseAll());

        // Refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'tree-control-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshBtn.title = 'Refresh';
        refreshBtn.addEventListener('click', () => this.refresh());

        // Filter input
        const filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.className = 'tree-filter';
        filterInput.placeholder = 'Filter files...';
        filterInput.addEventListener('input', (e) => this.filterFiles(e.target.value));

        controls.appendChild(expandBtn);
        controls.appendChild(collapseBtn);
        controls.appendChild(refreshBtn);
        controls.appendChild(filterInput);

        return controls;
    }

    buildTreeStructure(files) {
        const tree = [];
        const nodeMap = {};

        files.forEach(file => {
            const pathParts = file.path.split('/');
            let currentPath = '';
            let parentNode = null;

            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                const isFile = i === pathParts.length - 1;
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!nodeMap[currentPath]) {
                    const node = {
                        id: currentPath,
                        name: part,
                        path: currentPath,
                        type: isFile ? 'file' : 'folder',
                        isFile,
                        children: [],
                        expanded: this.expandedPaths.has(currentPath),
                        selected: this.selectedFile === currentPath
                    };

                    if (isFile) {
                        node.fileData = file;
                        node.icon = this.getFileIcon(file.name);
                        node.modified = file.modified;
                    } else {
                        node.icon = 'fas fa-folder';
                    }

                    nodeMap[currentPath] = node;

                    if (parentNode) {
                        parentNode.children.push(node);
                    } else {
                        tree.push(node);
                    }
                }

                parentNode = nodeMap[currentPath];
            }
        });

        // Sort folders first, then files
        tree.sort(this.sortNodes);
        tree.forEach(node => this.sortNodeChildren(node));

        return tree;
    }

    sortNodes(a, b) {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
    }

    sortNodeChildren(node) {
        if (node.children) {
            node.children.sort(this.sortNodes);
            node.children.forEach(child => this.sortNodeChildren(child));
        }
    }

    renderTreeItem(node, depth = 0) {
        const item = document.createElement('div');
        item.className = `tree-item ${node.selected ? 'selected' : ''} ${node.modified ? 'modified' : ''}`;
        item.dataset.path = node.path;
        item.style.paddingLeft = `${depth * 20 + 10}px`;

        const content = document.createElement('div');
        content.className = 'tree-item-content';

        // Toggle icon for folders
        if (node.type === 'folder') {
            const toggle = document.createElement('i');
            toggle.className = `tree-toggle fas fa-chevron-${node.expanded ? 'down' : 'right'}`;
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFolder(node);
            });
            content.appendChild(toggle);
        } else {
            const spacer = document.createElement('span');
            spacer.className = 'tree-spacer';
            content.appendChild(spacer);
        }

        // Icon
        const icon = document.createElement('i');
        icon.className = node.icon;
        content.appendChild(icon);

        // Name
        const name = document.createElement('span');
        name.className = 'tree-item-name';
        name.textContent = node.name;
        content.appendChild(name);

        // Badges
        if (node.modified) {
            const badge = document.createElement('span');
            badge.className = 'tree-badge modified-badge';
            badge.textContent = 'M';
            badge.title = 'Modified';
            content.appendChild(badge);
        }

        if (node.isFile && node.fileData) {
            const sizeBadge = document.createElement('span');
            sizeBadge.className = 'tree-badge size-badge';
            sizeBadge.textContent = this.formatSize(node.fileData.size);
            content.appendChild(sizeBadge);
        }

        content.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectItem(node);
        });

        content.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (node.type === 'folder') {
                this.toggleFolder(node);
            } else {
                this.openFile(node);
            }
        });

        // Add drag and drop support
        content.setAttribute('draggable', 'true');
        content.addEventListener('dragstart', (e) => this.handleDragStart(e, node));
        content.addEventListener('dragover', (e) => this.handleDragOver(e, node));
        content.addEventListener('drop', (e) => this.handleDrop(e, node));

        item.appendChild(content);

        // Children
        if (node.type === 'folder' && node.expanded && node.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-children';
            
            node.children.forEach(child => {
                childrenContainer.appendChild(this.renderTreeItem(child, depth + 1));
            });
            
            item.appendChild(childrenContainer);
        }

        return item;
    }

    toggleFolder(node) {
        node.expanded = !node.expanded;
        if (node.expanded) {
            this.expandedPaths.add(node.path);
        } else {
            this.expandedPaths.delete(node.path);
        }
        this.update();
    }

    selectItem(node) {
        // Clear previous selection
        document.querySelectorAll('.tree-item.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Set new selection
        this.selectedFile = node.path;
        node.selected = true;

        // If it's a file, dispatch event
        if (node.isFile && node.fileData) {
            const event = new CustomEvent('fileSelected', {
                detail: {
                    file: node.fileData,
                    node: node
                }
            });
            document.dispatchEvent(event);
        }

        this.update();
    }

    openFile(node) {
        if (node.isFile && node.fileData) {
            const event = new CustomEvent('fileOpened', {
                detail: {
                    file: node.fileData,
                    node: node
                }
            });
            document.dispatchEvent(event);
        }
    }

    expandAll() {
        const state = this.stateManager.getState();
        state.files.forEach(file => {
            const pathParts = file.path.split('/');
            let currentPath = '';
            
            for (let i = 0; i < pathParts.length - 1; i++) {
                currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i];
                this.expandedPaths.add(currentPath);
            }
        });
        
        this.update();
    }

    collapseAll() {
        this.expandedPaths.clear();
        this.update();
    }

    refresh() {
        const event = new CustomEvent('refreshFileTree');
        document.dispatchEvent(event);
    }

    filterFiles(query) {
        const items = document.querySelectorAll('.tree-item');
        
        items.forEach(item => {
            const name = item.querySelector('.tree-item-name').textContent.toLowerCase();
            const path = item.dataset.path.toLowerCase();
            const matches = name.includes(query.toLowerCase()) || path.includes(query.toLowerCase());
            
            if (matches) {
                item.style.display = '';
                // Ensure parent folders are visible
                let parent = item.parentElement;
                while (parent && parent.classList.contains('tree-children')) {
                    parent.closest('.tree-item').style.display = '';
                    parent = parent.parentElement?.closest('.tree-children');
                }
            } else {
                item.style.display = 'none';
            }
        });
    }

    handleDragStart(e, node) {
        e.dataTransfer.setData('text/plain', node.path);
        e.dataTransfer.effectAllowed = 'move';
        this.dragState = {
            node: node,
            startX: e.clientX,
            startY: e.clientY
        };
        
        e.currentTarget.classList.add('dragging');
    }

    handleDragOver(e, node) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (node.type === 'folder' && node.path !== this.dragState?.node.path) {
            e.currentTarget.classList.add('drag-over');
        }
    }

    handleDrop(e, node) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        if (node.type === 'folder' && this.dragState) {
            const draggedPath = e.dataTransfer.getData('text/plain');
            const targetPath = node.path;
            
            if (draggedPath !== targetPath && !draggedPath.startsWith(targetPath + '/')) {
                this.moveItem(draggedPath, targetPath);
            }
        }
    }

    moveItem(sourcePath, targetPath) {
        const event = new CustomEvent('moveFile', {
            detail: {
                sourcePath,
                targetPath
            }
        });
        document.dispatchEvent(event);
    }

    getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'js': 'fas fa-file-code js-file',
            'jsx': 'fas fa-file-code react-file',
            'ts': 'fas fa-file-code typescript-file',
            'tsx': 'fas fa-file-code react-file',
            'html': 'fas fa-file-code html-file',
            'css': 'fas fa-file-code css-file',
            'json': 'fas fa-file-code json-file',
            'md': 'fas fa-file-alt md-file',
            'txt': 'fas fa-file-alt text-file',
            'zip': 'fas fa-file-archive zip-file',
            'jpg': 'fas fa-file-image image-file',
            'jpeg': 'fas fa-file-image image-file',
            'png': 'fas fa-file-image image-file',
            'gif': 'fas fa-file-image image-file',
            'svg': 'fas fa-file-image svg-file'
        };

        return iconMap[extension] || 'fas fa-file';
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    update() {
        const event = new CustomEvent('fileTreeUpdated');
        document.dispatchEvent(event);
    }
}
