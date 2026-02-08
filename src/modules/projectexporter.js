import JSZip from 'jszip';

export default class ProjectExporter {
    constructor() {
        this.zip = new JSZip();
        this.fileSystem = null;
    }
    
    setFileSystem(fileSystem) {
        this.fileSystem = fileSystem;
    }
    
    async exportFile(filePath) {
        if (!this.fileSystem) {
            throw new Error('File system not initialized');
        }
        
        const file = this.fileSystem.getFile(filePath);
        if (!file) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        this.saveFile(file);
        return file;
    }
    
    async exportAllFiles() {
        if (!this.fileSystem) {
            throw new Error('File system not initialized');
        }
        
        const files = this.fileSystem.getAllFiles();
        const modifiedFiles = files.filter(f => f.modified);
        
        if (modifiedFiles.length === 0) {
            throw new Error('No modified files to export');
        }
        
        // Create ZIP
        const zip = new JSZip();
        
        modifiedFiles.forEach(file => {
            zip.file(file.path, file.content);
        });
        
        // Generate ZIP file
        const content = await zip.generateAsync({ type: 'blob' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `modified-files-${timestamp}.zip`;
        
        this.downloadBlob(content, filename);
        
        return {
            success: true,
            fileCount: modifiedFiles.length,
            filename
        };
    }
    
    async exportProject() {
        if (!this.fileSystem) {
            throw new Error('File system not initialized');
        }
        
        const files = this.fileSystem.getAllFiles();
        
        if (files.length === 0) {
            throw new Error('No files in project');
        }
        
        // Create ZIP
        const zip = new JSZip();
        
        files.forEach(file => {
            zip.file(file.path, file.content);
        });
        
        // Add metadata
        const metadata = {
            exportedAt: new Date().toISOString(),
            totalFiles: files.length,
            modifiedFiles: files.filter(f => f.modified).length
        };
        
        zip.file('_metadata.json', JSON.stringify(metadata, null, 2));
        
        // Generate ZIP file
        const content = await zip.generateAsync({ type: 'blob' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `project-export-${timestamp}.zip`;
        
        this.downloadBlob(content, filename);
        
        return {
            success: true,
            fileCount: files.length,
            modifiedCount: metadata.modifiedFiles,
            filename
        };
    }
    
    async exportFunction(functionInfo, newCode) {
        if (!this.fileSystem) {
            throw new Error('File system not initialized');
        }
        
        const file = this.fileSystem.getFile(functionInfo.filePath);
        if (!file) {
            throw new Error(`File not found: ${functionInfo.filePath}`);
        }
        
        // Create a copy with the modified function
        const modifiedFile = {
            ...file,
            content: this.replaceFunctionInFile(file.content, functionInfo, newCode),
            modified: true,
            lastModified: Date.now()
        };
        
        this.saveFile(modifiedFile, `${file.name}-modified`);
        
        return modifiedFile;
    }
    
    replaceFunctionInFile(fileContent, functionInfo, newCode) {
        const before = fileContent.substring(0, functionInfo.startIndex);
        const after = fileContent.substring(functionInfo.endIndex + 1);
        return before + newCode + after;
    }
    
    saveFile(file, customName = null) {
        const content = file.content;
        const filename = customName || file.name;
        
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
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    getExportSummary() {
        if (!this.fileSystem) {
            return null;
        }
        
        const files = this.fileSystem.getAllFiles();
        const modifiedFiles = files.filter(f => f.modified);
        
        return {
            totalFiles: files.length,
            modifiedFiles: modifiedFiles.length,
            totalSize: files.reduce((sum, f) => sum + (f.content?.length || 0), 0),
            modifiedSize: modifiedFiles.reduce((sum, f) => sum + (f.content?.length || 0), 0)
        };
    }
    
    canExport() {
        if (!this.fileSystem) return false;
        
        const files = this.fileSystem.getAllFiles();
        return files.some(f => f.modified);
    }
}
