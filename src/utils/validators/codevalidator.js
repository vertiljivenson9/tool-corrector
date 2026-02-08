export default class CodeValidator {
    validate(code) {
        const errors = [];
        const warnings = [];
        
        // Validaciones básicas
        if (!code.trim()) {
            errors.push('El código no puede estar vacío');
        }
        
        // Validar llaves balanceadas
        if (!this.hasBalancedBraces(code)) {
            errors.push('Las llaves no están balanceadas');
        }
        
        // Validar paréntesis balanceados
        if (!this.hasBalancedParentheses(code)) {
            errors.push('Los paréntesis no están balanceados');
        }
        
        // Validar que termine con punto y coma (opcional, pero recomendado)
        const lines = code.split('\n');
        const lastLine = lines[lines.length - 1].trim();
        if (lastLine && !lastLine.endsWith(';') && !lastLine.endsWith('}') && !lastLine.startsWith('//')) {
            warnings.push('La última línea no termina con punto y coma');
        }
        
        // Validar sintaxis básica de función
        if (!this.isValidFunctionSyntax(code)) {
            warnings.push('La sintaxis de función podría no ser válida');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    hasBalancedBraces(code) {
        let count = 0;
        let inString = false;
        let stringChar = null;
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const prevChar = i > 0 ? code[i - 1] : '';
            
            // Manejar strings
            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar && prevChar !== '\\') {
                inString = false;
                stringChar = null;
            }
            
            // Contar llaves fuera de strings
            if (!inString) {
                if (char === '{') count++;
                if (char === '}') count--;
            }
            
            // Si las llaves se desbalancean negativamente, error
            if (count < 0) return false;
        }
        
        return count === 0;
    }
    
    hasBalancedParentheses(code) {
        let count = 0;
        let inString = false;
        let stringChar = null;
        
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const prevChar = i > 0 ? code[i - 1] : '';
            
            // Manejar strings
            if (!inString && (char === '"' || char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar && prevChar !== '\\') {
                inString = false;
                stringChar = null;
            }
            
            // Contar paréntesis fuera de strings
            if (!inString) {
                if (char === '(') count++;
                if (char === ')') count--;
            }
            
            // Si los paréntesis se desbalancean negativamente, error
            if (count < 0) return false;
        }
        
        return count === 0;
    }
    
    isValidFunctionSyntax(code) {
        // Verificar patrones básicos de función
        const functionPatterns = [
            /^function\s+\w+\s*\([^)]*\)\s*\{/,
            /^const\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/,
            /^let\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/,
            /^var\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/,
            /^async\s+function\s+\w+\s*\([^)]*\)\s*\{/,
            /^export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{/
        ];
        
        return functionPatterns.some(pattern => pattern.test(code.trim()));
    }
    
    validateReplacement(original, replacement) {
        const originalValidation = this.validate(original);
        const replacementValidation = this.validate(replacement);
        
        return {
            original: originalValidation,
            replacement: replacementValidation,
            isValid: originalValidation.isValid && replacementValidation.isValid,
            canReplace: originalValidation.isValid && replacementValidation.isValid
        };
    }
}
