export default class CodeAnalyzer {
    constructor() {
        this.patterns = [
            // Standard function declaration
            {
                type: 'functionDeclaration',
                regex: /function\s+(\w+)\s*\([^)]*\)\s*\{/g,
                nameIndex: 1,
                startPattern: /function\s+\w+\s*\([^)]*\)\s*\{/,
                endPattern: /\}/
            },
            // Export function declaration
            {
                type: 'exportFunction',
                regex: /export\s+(?:default\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g,
                nameIndex: 1,
                startPattern: /export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{/,
                endPattern: /\}/
            },
            // Arrow function assignment
            {
                type: 'arrowFunction',
                regex: /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g,
                nameIndex: 1,
                startPattern: /(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/,
                endPattern: /\}/
            },
            // Async function declaration
            {
                type: 'asyncFunction',
                regex: /async\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g,
                nameIndex: 1,
                startPattern: /async\s+function\s+\w+\s*\([^)]*\)\s*\{/,
                endPattern: /\}/
            },
            // Method definition (in classes/objects)
            {
                type: 'method',
                regex: /(\w+)\s*\([^)]*\)\s*\{/g,
                nameIndex: 1,
                startPattern: /\w+\s*\([^)]*\)\s*\{/,
                endPattern: /\}/
            }
        ];
    }
    
    analyzeFile(file) {
        const functions = [];
        const content = file.content;
        const lines = content.split('\n');
        
        this.patterns.forEach(pattern => {
            const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
            let match;
            
            while ((match = regex.exec(content)) !== null) {
                const functionName = match[pattern.nameIndex];
                const startIndex = match.index;
                const startLine = this.getLineNumber(content, startIndex);
                
                // Find the matching closing brace
                const endIndex = this.findMatchingBrace(content, startIndex);
                const endLine = this.getLineNumber(content, endIndex);
                
                if (endIndex !== -1) {
                    const functionCode = content.substring(startIndex, endIndex + 1);
                    
                    functions.push({
                        name: functionName,
                        type: pattern.type,
                        filePath: file.path,
                        startIndex,
                        endIndex,
                        startLine,
                        endLine,
                        code: functionCode,
                        signature: match[0].trim()
                    });
                }
            }
        });
        
        // Sort functions by their position in the file
        functions.sort((a, b) => a.startIndex - b.startIndex);
        
        return functions;
    }
    
    analyzeProject(files) {
        const allFunctions = [];
        
        files.forEach(file => {
            // Only analyze JavaScript-like files
            if (this.isJavaScriptFile(file.path)) {
                try {
                    const fileFunctions = this.analyzeFile(file);
                    allFunctions.push(...fileFunctions);
                } catch (error) {
                    console.warn(`Error analyzing file ${file.path}:`, error);
                }
            }
        });
        
        return allFunctions;
    }
    
    findMatchingBrace(content, startIndex) {
        let braceCount = 0;
        let inString = false;
        let stringChar = null;
        let escaped = false;
        
        for (let i = startIndex; i < content.length; i++) {
            const char = content[i];
            const prevChar = i > 0 ? content[i - 1] : '';
            
            // Handle string literals
            if (!escaped && (char === '"' || char === "'" || char === '`')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
            }
            
            // Handle escape sequences
            if (char === '\\' && !escaped) {
                escaped = true;
                continue;
            }
            
            // Count braces when not in strings
            if (!inString) {
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        return i;
                    }
                }
            }
            
            escaped = false;
        }
        
        return -1; // No matching brace found
    }
    
    getLineNumber(content, index) {
        const substring = content.substring(0, index);
        return (substring.match(/\n/g) || []).length + 1;
    }
    
    isJavaScriptFile(filename) {
        const jsExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
        return jsExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }
    
    validateReplacement(originalCode, newCode) {
        const errors = [];
        
        // Check for balanced braces
        const originalBraces = this.countBraces(originalCode);
        const newBraces = this.countBraces(newCode);
        
        if (originalBraces.open !== originalBraces.close) {
            errors.push('Original code has unbalanced braces');
        }
        
        if (newBraces.open !== newBraces.close) {
            errors.push('New code has unbalanced braces');
        }
        
        // Check for empty block
        if (newCode.trim() === '{}' || newCode.trim() === '') {
            errors.push('Code block cannot be empty');
        }
        
        // Basic syntax validation (simple check for function keyword)
        if (!newCode.includes('{') || !newCode.includes('}')) {
            errors.push('Code must contain a complete block with braces');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    countBraces(code) {
        let open = 0;
        let close = 0;
        let inString = false;
        let stringChar = null;
        let escaped = false;
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const prevChar = i > 0 ? code[i - 1] : '';
            
            // Handle string literals
            if (!escaped && (char === '"' || char === "'" || char === '`')) {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                    stringChar = null;
                }
            }
            
            // Handle escape sequences
            if (char === '\\' && !escaped) {
                escaped = true;
                continue;
            }
            
            // Count braces when not in strings
            if (!inString) {
                if (char === '{') open++;
                if (char === '}') close++;
            }
            
            escaped = false;
        }
        
        return { open, close };
    }
    
    replaceFunction(fileContent, functionInfo, newCode) {
        const before = fileContent.substring(0, functionInfo.startIndex);
        const after = fileContent.substring(functionInfo.endIndex + 1);
        
        return before + newCode + after;
    }
    
    insertCodeInside(fileContent, functionInfo, codeToInsert) {
        // Find the position inside the function (after opening brace)
        const functionBodyStart = this.findFunctionBodyStart(fileContent, functionInfo.startIndex);
        
        if (functionBodyStart === -1) {
            throw new Error('Could not find function body start');
        }
        
        const before = fileContent.substring(0, functionBodyStart);
        const after = fileContent.substring(functionBodyStart);
        
        return before + codeToInsert + '\n' + after;
    }
    
    insertCodeAfter(fileContent, functionInfo, codeToInsert) {
        const before = fileContent.substring(0, functionInfo.endIndex + 1);
        const after = fileContent.substring(functionInfo.endIndex + 1);
        
        return before + '\n' + codeToInsert + after;
    }
    
    findFunctionBodyStart(content, startIndex) {
        for (let i = startIndex; i < content.length; i++) {
            if (content[i] === '{') {
                return i + 1;
            }
        }
        return -1;
    }
}
