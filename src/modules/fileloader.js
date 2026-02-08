import FileSystem from '../core/fileSystem.js';
import CodeAnalyzer from '../core/codeAnalyzer.js';

export default class FileLoader {
    constructor() {
        this.fileSystem = new FileSystem();
        this.codeAnalyzer = new CodeAnalyzer();
        this.loading = false;
    }
    
    async loadFile() {
        try {
            this.setLoading(true);
            const files = await this.fileSystem.openFile();
            
            if (files.length === 0) {
                return { success: false, error: 'No file selected' };
            }
            
            const projectData = await this.createProjectData(files);
            return { success: true, data: projectData };
        } catch (error) {
            console.error('Error loading file:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to load file' 
            };
        } finally {
            this.setLoading(false);
        }
    }
    
    async loadDirectory() {
        try {
            this.setLoading(true);
            const files = await this.fileSystem.openDirectory();
            
            if (files.length === 0) {
                return { success: false, error: 'No files found in directory' };
            }
            
            const projectData = await this.createProjectData(files);
            return { success: true, data: projectData };
        } catch (error) {
            console.error('Error loading directory:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to load directory' 
            };
        } finally {
            this.setLoading(false);
        }
    }
    
    async loadZip(file) {
        try {
            if (!file) {
                return { success: false, error: 'No file provided' };
            }
            
            this.setLoading(true);
            const files = await this.fileSystem.loadZipFile(file);
            
            if (files.length === 0) {
                return { success: false, error: 'No files found in ZIP' };
            }
            
            const projectData = await this.createProjectData(files);
            return { success: true, data: projectData };
        } catch (error) {
            console.error('Error loading ZIP:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to load ZIP file' 
            };
        } finally {
            this.setLoading(false);
        }
    }
    
    async loadFromInput(inputElement) {
        try {
            if (!inputElement.files || inputElement.files.length === 0) {
                return { success: false, error: 'No files selected' };
            }
            
            this.setLoading(true);
            
            // Check if it's a ZIP file
            const file = inputElement.files[0];
            let files;
            
            if (file.name.toLowerCase().endsWith('.zip')) {
                files = await this.fileSystem.loadZipFile(file);
            } else {
                // Handle single file upload
                const fileData = {
                    name: file.name,
                    path: file.name,
                    content: await this.readFileAsText(file),
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified
                };
                
                this.fileSystem.files.set(fileData.path, fileData);
                files = [fileData];
            }
            
            if (files.length === 0) {
                return { success: false, error: 'No files could be loaded' };
            }
            
            const projectData = await this.createProjectData(files);
            return { success: true, data: projectData };
        } catch (error) {
            console.error('Error loading from input:', error);
            return { 
                success: false, 
                error: error.message || 'Failed to load files' 
            };
        } finally {
            this.setLoading(false);
        }
    }
    
    async createProjectData(files) {
        const functions = this.codeAnalyzer.analyzeProject(files);
        
        return {
            name: this.extractProjectName(files),
            files: files.map(file => ({
                path: file.path,
                name: file.name,
                content: file.content,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            })),
            functions,
            totalFiles: files.length,
            totalFunctions: functions.length
        };
    }
    
    extractProjectName(files) {
        if (files.length === 0) return 'Untitled Project';
        
        // Try to get from directory structure
        const paths = files.map(f => f.path);
        const commonPath = this.findCommonPath(paths);
        
        if (commonPath) {
            const parts = commonPath.split('/').filter(p => p);
            return parts[parts.length - 1] || 'Project';
        }
        
        // Fallback to first file name without extension
        const firstFile = files[0];
        const nameWithoutExt = firstFile.name.replace(/\.[^/.]+$/, '');
        return nameWithoutExt || 'Project';
    }
    
    findCommonPath(paths) {
        if (paths.length === 0) return '';
        
        const splitPaths = paths.map(p => p.split('/'));
        const minLength = Math.min(...splitPaths.map(p => p.length));
        
        let commonParts = [];
        
        for (let i = 0; i < minLength; i++) {
            const part = splitPaths[0][i];
            if (splitPaths.every(p => p[i] === part)) {
                commonParts.push(part);
            } else {
                break;
            }
        }
        
        return commonParts.join('/');
    }
    
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }
    
    setLoading(loading) {
        this.loading = loading;
        
        // Dispatch loading event
        const event = new CustomEvent('loaderLoading', {
            detail: { loading }
        });
        document.dispatchEvent(event);
    }
    
    getFileSystem() {
        return this.fileSystem;
    }
    
    clear() {
        this.fileSystem.clear();
    }
}
