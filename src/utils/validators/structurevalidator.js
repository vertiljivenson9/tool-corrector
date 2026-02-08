export default class StructureValidator {
    constructor() {
        this.maxNestingLevel = 5;
        this.maxFunctionLength = 100;
        this.maxParams = 5;
    }
    
    validateStructure(code) {
        const issues = [];
        
        // Verificar niveles de anidamiento
        const nestingLevel = this.getNestingLevel(code);
        if (nestingLevel > this.maxNestingLevel) {
            issues.push({
                type: 'warning',
                message: `Nivel de anidamiento alto (${nestingLevel}). Considere refactorizar.`,
                level: nestingLevel
            });
        }
        
        // Verificar longitud de función
        const lineCount = code.split('\n').length;
        if (lineCount > this.maxFunctionLength) {
            issues.push({
                type: 'warning',
                message: `Función muy larga (${lineCount} líneas). Considere dividirla.`,
                lineCount
            });
        }
        
        // Verificar parámetros
        const paramCount = this.getParameterCount(code);
        if (paramCount > this.maxParams) {
            issues.push({
                type: 'warning',
                message: `Demasiados parámetros (${paramCount}). Considere usar un objeto.`,
                paramCount
            });
        }
        
        // Verificar complejidad ciclomática básica
        const complexity = this.calculateComplexity(code);
        if (complexity > 10) {
            issues.push({
                type: 'warning',
                message: `Complejidad alta (${complexity}). Considere simplificar.`,
                complexity
            });
        }
        
        return {
            issues,
            summary: {
                nestingLevel,
                lineCount,
                paramCount,
                complexity,
                isValid: issues.filter(i => i.type === 'error').length === 0
            }
        };
    }
    
    getNestingLevel(code) {
        let maxDepth = 0;
        let currentDepth = 0;
        
        for (let i = 0; i < code.length; i++) {
            if (code[i] === '{') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            } else if (code[i] === '}') {
                currentDepth--;
            }
        }
        
        return maxDepth;
    }
    
    getParameterCount(code) {
        // Extraer parámetros de función
        const paramMatch = code.match(/\(([^)]*)\)/);
        if (!paramMatch) return 0;
        
        const params = paramMatch[1]
            .split(',')
            .map(p => p.trim())
            .filter(p => p && p !== '');
        
        return params.length;
    }
    
    calculateComplexity(code) {
        let complexity = 1; // Base complexity
        
        // Contar estructuras de control
        const controlPatterns = [
            /\bif\s*\(/g,
            /\belse\s*if\s*\(/g,
            /\belse\b/g,
            /\bfor\s*\(/g,
            /\bwhile\s*\(/g,
            /\bdo\b/g,
            /\bcase\b/g,
            /\bcatch\s*\(/g,
            /\b&&|\|\|/g,
            /\?\s*:/g
        ];
        
        controlPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });
        
        return complexity;
    }
    
    validateFileStructure(files) {
        const structureIssues = [];
        
        files.forEach(file => {
            // Verificar nombres de archivo
            if (!this.isValidFileName(file.name)) {
                structureIssues.push({
                    type: 'warning',
                    file: file.name,
                    message: 'Nombre de archivo podría no seguir convenciones'
                });
            }
            
            // Verificar que no haya archivos vacíos
            if (!file.content.trim()) {
                structureIssues.push({
                    type: 'error',
                    file: file.name,
                    message: 'Archivo vacío'
                });
            }
            
            // Verificar encoding
            if (!this.hasValidEncoding(file.content)) {
                structureIssues.push({
                    type: 'warning',
                    file: file.name,
                    message: 'Posibles problemas de encoding'
                });
            }
        });
        
        return structureIssues;
    }
    
    isValidFileName(filename) {
        // Validar nombres de archivo según convenciones comunes
        const invalidPatterns = [
            /^\d/,
            /\s+/,
            /[<>:"|?*]/,
            /\.\./,
            /^\./
        ];
        
        return !invalidPatterns.some(pattern => pattern.test(filename));
    }
    
    hasValidEncoding(content) {
        // Verificar caracteres no válidos
        for (let i = 0; i < content.length; i++) {
            const charCode = content.charCodeAt(i);
            // Caracteres de control no imprimibles (excepto tab, newline, carriage return)
            if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
                return false;
            }
        }
        return true;
    }
}
