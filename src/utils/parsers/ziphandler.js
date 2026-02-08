import JSZip from 'jszip';

export default class ZipHandler {
    constructor() {
        this.zip = null;
    }

    async loadZip(file) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            if (typeof JSZip === 'undefined') {
                throw new Error('JSZip library not loaded');
            }

            this.zip = await JSZip.loadAsync(file);
            return this.extractFiles();
        } catch (error) {
            console.error('Error loading ZIP file:', error);
            throw error;
        }
    }

    async extractFiles() {
        if (!this.zip) {
            throw new Error('No ZIP loaded');
        }

        const files = [];
        const promises = [];

        this.zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                const promise = zipEntry.async('text').then(content => {
                    files.push({
                        name: zipEntry.name.split('/').pop(),
                        path: relativePath,
                        content,
                        size: content.length,
                        type: this.getFileType(zipEntry.name),
                        lastModified: zipEntry.date || Date.now(),
                        isFromZip: true
                    });
                });
                promises.push(promise);
            }
        });

        await Promise.all(promises);
        return files;
    }

    async createZip(files) {
        try {
            const zip = new JSZip();

            files.forEach(file => {
                if (file.content) {
                    zip.file(file.path || file.name, file.content);
                }
            });

            const blob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 6
                }
            });

            return blob;
        } catch (error) {
            console.error('Error creating ZIP:', error);
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
            'txt': 'text/plain',
            'yml': 'text/yaml',
            'yaml': 'text/yaml',
            'xml': 'text/xml',
            'svg': 'image/svg+xml'
        };

        return typeMap[extension] || 'text/plain';
    }

    getFileInfo(zipEntry) {
        return {
            name: zipEntry.name,
            directory: zipEntry.dir,
            size: zipEntry._data.uncompressedSize,
            compressedSize: zipEntry._data.compressedSize,
            compressionRatio: zipEntry._data.compressedSize / zipEntry._data.uncompressedSize,
            lastModified: zipEntry.date,
            comment: zipEntry.comment
        };
    }

    async getFileAsBlob(relativePath, type = 'text/plain') {
        if (!this.zip) {
            throw new Error('No ZIP loaded');
        }

        const zipEntry = this.zip.file(relativePath);
        if (!zipEntry) {
            throw new Error(`File not found: ${relativePath}`);
        }

        const content = await zipEntry.async('uint8array');
        return new Blob([content], { type });
    }

    async getFileAsDataURL(relativePath) {
        const blob = await this.getFileAsBlob(relativePath);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    getFileList() {
        if (!this.zip) return [];
        
        const files = [];
        this.zip.forEach((relativePath, zipEntry) => {
            files.push({
                path: relativePath,
                name: zipEntry.name,
                isDirectory: zipEntry.dir,
                size: zipEntry.dir ? 0 : zipEntry._data.uncompressedSize,
                lastModified: zipEntry.date
            });
        });

        return files.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.path.localeCompare(b.path);
        });
    }

    getDirectoryTree() {
        if (!this.zip) return [];

        const tree = [];
        const pathMap = {};

        this.zip.forEach((relativePath, zipEntry) => {
            const pathParts = relativePath.split('/');
            let currentLevel = tree;

            pathParts.forEach((part, index) => {
                let existing = currentLevel.find(item => item.name === part);

                if (!existing) {
                    if (index === pathParts.length - 1) {
                        existing = {
                            type: zipEntry.dir ? 'folder' : 'file',
                            name: part,
                            path: relativePath,
                            isDirectory: zipEntry.dir,
                            size: zipEntry.dir ? 0 : zipEntry._data.uncompressedSize,
                            lastModified: zipEntry.date
                        };
                    } else {
                        existing = {
                            type: 'folder',
                            name: part,
                            children: []
                        };
                    }
                    currentLevel.push(existing);
                }

                if (existing.type === 'folder' && existing.children) {
                    currentLevel = existing.children;
                }
            });
        });

        return tree;
    }

    async updateFile(relativePath, content) {
        if (!this.zip) {
            throw new Error('No ZIP loaded');
        }

        this.zip.file(relativePath, content);
        return true;
    }

    async removeFile(relativePath) {
        if (!this.zip) {
            throw new Error('No ZIP loaded');
        }

        this.zip.remove(relativePath);
        return true;
    }

    async renameFile(oldPath, newPath) {
        if (!this.zip) {
            throw new Error('No ZIP loaded');
        }

        const file = this.zip.file(oldPath);
        if (!file) {
            throw new Error(`File not found: ${oldPath}`);
        }

        const content = await file.async('text');
        this.zip.file(newPath, content);
        this.zip.remove(oldPath);
        return true;
    }

    async addFile(relativePath, content) {
        if (!this.zip) {
            this.zip = new JSZip();
        }

        this.zip.file(relativePath, content);
        return true;
    }

    async addFolder(relativePath) {
        if (!this.zip) {
            this.zip = new JSZip();
        }

        if (!relativePath.endsWith('/')) {
            relativePath += '/';
        }

        this.zip.folder(relativePath);
        return true;
    }

    async downloadZip(filename = 'archive.zip') {
        if (!this.zip) {
            throw new Error('No ZIP loaded');
        }

        const blob = await this.zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    getStats() {
        if (!this.zip) return null;

        let totalFiles = 0;
        let totalSize = 0;
        let totalCompressedSize = 0;

        this.zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                totalFiles++;
                totalSize += zipEntry._data.uncompressedSize;
                totalCompressedSize += zipEntry._data.compressedSize;
            }
        });

        return {
            totalFiles,
            totalSize,
            totalCompressedSize,
            compressionRatio: totalCompressedSize / totalSize,
            folders: Object.keys(this.zip.files).filter(path => 
                this.zip.files[path].dir
            ).length
        };
    }

    clear() {
        this.zip = null;
    }
}
