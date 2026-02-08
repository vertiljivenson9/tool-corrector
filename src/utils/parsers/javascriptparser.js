export default class JavaScriptParser {
    constructor() {
        this.patterns = {
            functionDeclaration: /function\s+(\w+)\s*\([^)]*\)\s*\{/g,
            exportFunction: /export\s+(?:default\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g,
            arrowFunction: /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/g,
            asyncFunction: /async\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g,
            methodDefinition: /(\w+)\s*\([^)]*\)\s*\{/g
        };
    }

    parse(content) {
        const functions = [];
        
        Object.entries(this.patterns).forEach(([type, pattern]) => {
            const regex = new RegExp(pattern.source, 'g');
            let match;
            
            while ((match = regex.exec(content)) !== null) {
                const startIndex = match.index;
                const endIndex = this.findMatchingBrace(content, startIndex);
                
                if (endIndex !== -1) {
                    functions.push({
                        type,
                        name: match[1] || 'anonymous',
                        startIndex,
                        endIndex,
                        signature: match[0],
                        code: content.substring(startIndex, endIndex + 1)
                    });
                }
            }
        });
        
        return functions;
    }
    
    findMatchingBrace(content, startIndex) {
        let depth = 1;
        for (let i = startIndex + 1; i < content.length; i++) {
            if (content[i] === '{') depth++;
            else if (content[i] === '}') {
                depth--;
                if (depth === 0) return i;
            }
        }
        return -1;
    }
    
    isJavaScriptFile(filename) {
        return /\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(filename);
    }
}
