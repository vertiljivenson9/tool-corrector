import FileLoader from '../../modules/fileLoader.js';

export default class Header {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.fileLoader = new FileLoader();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for file loader events
        document.addEventListener('loaderLoading', (event) => {
            this.updateLoadingState(event.detail.loading);
        });
    }
    
    render() {
        const header = document.createElement('header');
        header.className = 'app-header';
        
        // Logo and title
        const logoSection = document.createElement('div');
        logoSection.className = 'logo-section';
        
        const logo = document.createElement('div');
        logo.className = 'logo';
        logo.innerHTML = '<i class="fas fa-code"></i>';
        
        const title = document.createElement('h1');
        title.className = 'app-title';
        title.textContent = 'Code Editor Tool';
        
        const subtitle = document.createElement('span');
        subtitle.className = 'app-subtitle';
        subtitle.textContent = 'Local-First Secure Code Editing';
        
        logoSection.appendChild(logo);
        logoSection.appendChild(title);
        logoSection.appendChild(subtitle);
        
        // Project info
        const projectInfo = document.createElement('div');
        projectInfo.className = 'project-info';
        
        this.projectName = document.createElement('span');
        this.projectName.className = 'project-name';
        this.projectName.textContent = 'No project loaded';
        
        this.fileCount = document.createElement('span');
        this.fileCount.className = 'file-count';
        this.fileCount.textContent = '0 files';
        
        this.functionCount = document.createElement('span');
        this.functionCount.className = 'function-count';
        this.functionCount.textContent = '0 functions';
        
        projectInfo.appendChild(this.projectName);
        projectInfo.appendChild(this.fileCount);
        projectInfo.appendChild(this.functionCount);
        
        // Actions
        const actions = document.createElement('div');
        actions.className = 'header-actions';
        
        // Load buttons
        const loadMenu = document.createElement('div');
        loadMenu.className = 'dropdown';
        
        const loadButton = document.createElement('button');
        loadButton.className = 'btn btn-primary';
        loadButton.innerHTML = '<i class="fas fa-folder-open"></i> Load Project';
        
        const loadDropdown = document.createElement('div');
        loadDropdown.className = 'dropdown-content';
        
        const loadFileOption = document.createElement('a');
        loadFileOption.href = '#';
        loadFileOption.innerHTML = '<i class="fas fa-file"></i> Load File';
        loadFileOption.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadFile();
        });
        
        const loadFolderOption = document.createElement('a');
        loadFolderOption.href = '#';
        loadFolderOption.innerHTML = '<i class="fas fa-folder"></i> Load Folder';
        loadFolderOption.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadFolder();
        });
        
        const loadZipOption = document.createElement('a');
        loadZipOption.href = '#';
        loadZipOption.innerHTML = '<i class="fas fa-file-archive"></i> Load ZIP';
        loadZipOption.addEventListener('click', (e) => {
            e.preventDefault();
            this.loadZip();
        });
        
        loadDropdown.appendChild(loadFileOption);
        loadDropdown.appendChild(loadFolderOption);
        loadDropdown.appendChild(loadZipOption);
        
        loadMenu.appendChild(loadButton);
        loadMenu.appendChild(loadDropdown);
        
        // Export button
        const exportButton = document.createElement('button');
        exportButton.className = 'btn btn-secondary';
        exportButton.innerHTML = '<i class="fas fa-download"></i> Export';
        exportButton.disabled = true;
        exportButton.addEventListener('click', () => this.exportProject());
        this.exportButton = exportButton;
        
        // Clear button
        const clearButton = document.createElement('button');
        clearButton.className = 'btn btn-outline';
        clearButton.innerHTML = '<i class="fas fa-trash"></i> Clear';
        clearButton.addEventListener('click', () => this.clearProject());
        
        actions.appendChild(loadMenu);
        actions.appendChild(exportButton);
        actions.appendChild(clearButton);
        
        // Loading indicator
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'loading-indicator hidden';
        this.loadingIndicator.innerHTML = '<div class="spinner"></div> Loading...';
        
        header.appendChild(logoSection);
        header.appendChild(projectInfo);
        header.appendChild(actions);
        header.appendChild(this.loadingIndicator);
        
        return header;
    }
    
    async loadFile() {
        const result = await this.fileLoader.loadFile();
        this.handleLoadResult(result);
    }
    
    async loadFolder() {
        const result = await this.fileLoader.loadDirectory();
        this.handleLoadResult(result);
    }
    
    async loadZip() {
        // Create file input for ZIP
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        
        input.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const result = await this.fileLoader.loadZip(e.target.files[0]);
                this.handleLoadResult(result);
            }
        });
        
        input.click();
    }
    
    handleLoadResult(result) {
        if (result.success) {
            // Update project info
            this.updateProjectInfo(result.data);
            
            // Dispatch project loaded event
            const event = new CustomEvent('projectLoaded', {
                detail: result.data
            });
            document.dispatchEvent(event);
            
            // Enable export button
            if (this.exportButton) {
                this.exportButton.disabled = false;
            }
        } else {
            alert(`Error loading project: ${result.error}`);
        }
    }
    
    updateProjectInfo(projectData) {
        if (this.projectName) {
            this.projectName.textContent = projectData.name;
        }
        
        if (this.fileCount) {
            this.fileCount.textContent = `${projectData.totalFiles} files`;
        }
        
        if (this.functionCount) {
            this.functionCount.textContent = `${projectData.totalFunctions} functions`;
        }
    }
    
    updateLoadingState(loading) {
        if (this.loadingIndicator) {
            if (loading) {
                this.loadingIndicator.classList.remove('hidden');
            } else {
                this.loadingIndicator.classList.add('hidden');
            }
        }
    }
    
    async exportProject() {
        // This would trigger the export process
        // Implementation depends on your export module
        console.log('Export project triggered');
    }
    
    clearProject() {
        if (confirm('Are you sure you want to clear the current project? All unsaved changes will be lost.')) {
            this.fileLoader.clear();
            
            // Reset project info
            if (this.projectName) {
                this.projectName.textContent = 'No project loaded';
            }
            
            if (this.fileCount) {
                this.fileCount.textContent = '0 files';
            }
            
            if (this.functionCount) {
                this.functionCount.textContent = '0 functions';
            }
            
            // Disable export button
            if (this.exportButton) {
                this.exportButton.disabled = true;
            }
            
            // Dispatch clear event
            const event = new CustomEvent('projectCleared');
            document.dispatchEvent(event);
        }
    }
    
    update() {
        // Update header based on current state
        const state = this.stateManager.getState();
        
        if (state.project) {
            this.updateProjectInfo({
                name: state.project,
                totalFiles: state.files.length,
                totalFunctions: state.functions.length
            });
            
            if (this.exportButton) {
                this.exportButton.disabled = false;
            }
        }
    }
}
