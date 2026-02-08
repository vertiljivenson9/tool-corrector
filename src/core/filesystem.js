export default class FileSystem {
    constructor() {
        this.files = new Map();
        this.projectHandle = null;
        this.directoryHandle = null;
    }
    
    async loadFile(fileHandle) {
        try {
            const file = await fileHandle.getFile();
            const content = await file.text();
            
            return {
                name: file.name,
                path: file.name,
                content,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                handle: fileHandle
            };
        } catch (error) {
            console.error('Error loading file:', error);
            throw error;
        }
    }
    
    async loadDirectory(directoryHandle, basePath = '') {
        const files = [];
        
        for await (const [name, handle] of directoryHandle.entries()) {
            const path = basePath ? `${basePath}/${name}` : name;
            
            if (handle.kind === 'file') {
                try {
                    const file = await this.loadFile(handle, path);
                    files.push(file);
                } catch (error) {
                    console.warn(`Could not load file ${path}:`, error);
                }
            } else if (handle.kind === 'directory') {
                const subFiles = await this.loadDirectory(handle, path);
                files.push(...subFiles);
            }
        }
        
        return files;
    }
    
    async openFile() {
        try {
            if (!window.showOpenFilePicker) {
                throw new Error('File System Access API not supported');
            }
            
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'JavaScript Files',
                        accept: {
                            'text/javascript': ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
                        }
                    },
                    {
                        description: 'Text Files',
                        accept: {
                            'text/plain': ['.txt', '.json', '.md', '.html', '.css']
                        }
                    },
                    {
                        description: 'All Files',
                        accept: {
                            '*/*': ['.*']
                        }
                    }
                ],
                multiple: false
            });
            
            const file = await this.loadFile(fileHandle);
            this.files.set(file.path, file);
            
            return [file];
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error opening file:', error);
                throw error;
            }
            return [];
        }
    }
    
    async openDirectory() {
        try {
            if (!window.showDirectoryPicker) {
                throw new Error('Directory Access API not supported');
            }
            
            this.directoryHandle = await window.showDirectoryPicker();
            const files = await this.loadDirectory(this.directoryHandle);
            
            files.forEach(file => {
                this.files.set(file.path, file);
            });
            
            this.projectHandle = this.directoryHandle;
            return files;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error opening directory:', error);
                throw error;
            }
            return [];
        }
    }
    
    async loadZipFile(file) {
        try {
            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip library not loaded');
            }
            
            const zip = await JSZip.loadAsync(file);
            const files = [];
            
            const promises = [];
            
            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir) {
                    const promise = zipEntry.async('text').then(content => {
                        files.push({
                            name: zipEntry.name.split('/').pop(),
                            path: relativePath,
                            content,
                            size: content.length,
                            type: this.getFileType(relativePath),
                            lastModified: zipEntry.date || Date.now()
                        });
                    });
                    promises.push(promise);
                }
            });
            
            await Promise.all(promises);
            
            files.forEach(file => {
                this.files.set(file.path, file);
            });
            
            return files;
        } catch (error) {
            console.error('Error loading ZIP file:', error);
            throw error;
        }
    }
    
    getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const typeMap = {
            'js': 'text/javascript',
            'jsx': 'text/javascript',
            'ts': 'text/typescript',
            'tsx': 'text/typescript',
            'json': 'application/json',
            'md': 'text/markdown',
            'html': 'text/html',
            'css': 'text/css',
            'txt': 'text/plain'
        };
        
        return typeMap[extension] || 'text/plain';
    }
    
    getFile(path) {
        return this.files.get(path);
    }
    
    getAllFiles() {
        return Array.from(this.files.values());
    }
    
    updateFile(path, content) {
        const file = this.files.get(path);
        if (file) {
            const updatedFile = {
                ...file,
                content,
                lastModified: Date.now(),
                modified: true
            };
            this.files.set(path, updatedFile);
            return updatedFile;
        }
        return null;
    }
    
    saveFile(file, newName = null) {
        const content = file.content;
        const filename = newName || file.name;
        
        const blob = new Blob([content], { type: file.type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    clear() {
        this.files.clear();
        this.projectHandle = null;
        this.directoryHandle = null;
    }
}
