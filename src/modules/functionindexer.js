export default class FunctionIndexer {
    constructor() {
        this.functions = [];
        this.filteredFunctions = [];
        this.searchQuery = '';
        this.groupBy = 'file'; // 'file', 'type', 'name'
        this.sortBy = 'name'; // 'name', 'file', 'type', 'lines'
    }
    
    indexFunctions(functions) {
        this.functions = functions;
        this.filteredFunctions = [...functions];
        this.sortFunctions();
        
        return this.getIndex();
    }
    
    search(query) {
        this.searchQuery = query.toLowerCase().trim();
        
        if (!this.searchQuery) {
            this.filteredFunctions = [...this.functions];
        } else {
            this.filteredFunctions = this.functions.filter(func => {
                return func.name.toLowerCase().includes(this.searchQuery) ||
                       func.filePath.toLowerCase().includes(this.searchQuery) ||
                       func.type.toLowerCase().includes(this.searchQuery);
            });
        }
        
        this.sortFunctions();
        return this.getIndex();
    }
    
    sortFunctions() {
        this.filteredFunctions.sort((a, b) => {
            switch (this.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'file':
                    return a.filePath.localeCompare(b.filePath);
                case 'type':
                    return a.type.localeCompare(b.type);
                case 'lines':
                    return (a.endLine - a.startLine) - (b.endLine - b.startLine);
                default:
                    return 0;
            }
        });
    }
    
    getIndex() {
        if (this.groupBy === 'none') {
            return {
                groupBy: 'none',
                groups: [{
                    name: 'All Functions',
                    functions: this.filteredFunctions
                }]
            };
        }
        
        const groups = {};
        
        this.filteredFunctions.forEach(func => {
            let key;
            
            switch (this.groupBy) {
                case 'file':
                    key = func.filePath;
                    break;
                case 'type':
                    key = func.type;
                    break;
                case 'name':
                    key = func.name.charAt(0).toUpperCase();
                    break;
                default:
                    key = 'Other';
            }
            
            if (!groups[key]) {
                groups[key] = [];
            }
            
            groups[key].push(func);
        });
        
        // Convert to array and sort groups
        const groupArray = Object.entries(groups).map(([name, functions]) => ({
            name,
            functions
        }));
        
        groupArray.sort((a, b) => a.name.localeCompare(b.name));
        
        return {
            groupBy: this.groupBy,
            groups: groupArray
        };
    }
    
    getFunctionById(id) {
        return this.functions.find(f => 
            `${f.filePath}-${f.name}-${f.startLine}` === id
        );
    }
    
    getFunctionsByFile(filePath) {
        return this.functions.filter(f => f.filePath === filePath);
    }
    
    updateFunction(oldFunction, newFunction) {
        const index = this.functions.findIndex(f => 
            f.filePath === oldFunction.filePath &&
            f.name === oldFunction.name &&
            f.startLine === oldFunction.startLine
        );
        
        if (index !== -1) {
            this.functions[index] = {
                ...this.functions[index],
                ...newFunction,
                modified: true,
                modifiedAt: Date.now()
            };
            
            // Update filtered functions if needed
            const filteredIndex = this.filteredFunctions.findIndex(f => 
                f.filePath === oldFunction.filePath &&
                f.name === oldFunction.name &&
                f.startLine === oldFunction.startLine
            );
            
            if (filteredIndex !== -1) {
                this.filteredFunctions[filteredIndex] = this.functions[index];
            }
            
            return this.functions[index];
        }
        
        return null;
    }
    
    addFunction(func) {
        this.functions.push(func);
        this.filteredFunctions.push(func);
        this.sortFunctions();
        return func;
    }
    
    removeFunction(func) {
        this.functions = this.functions.filter(f => 
            !(f.filePath === func.filePath &&
              f.name === func.name &&
              f.startLine === func.startLine)
        );
        
        this.filteredFunctions = this.filteredFunctions.filter(f => 
            !(f.filePath === func.filePath &&
              f.name === func.name &&
              f.startLine === func.startLine)
        );
    }
    
    getStats() {
        return {
            total: this.functions.length,
            filtered: this.filteredFunctions.length,
            byType: this.countByType(),
            byFile: this.countByFile(),
            searchQuery: this.searchQuery
        };
    }
    
    countByType() {
        const counts = {};
        this.functions.forEach(func => {
            counts[func.type] = (counts[func.type] || 0) + 1;
        });
        return counts;
    }
    
    countByFile() {
        const counts = {};
        this.functions.forEach(func => {
            counts[func.filePath] = (counts[func.filePath] || 0) + 1;
        });
        return counts;
    }
    
    setGroupBy(groupBy) {
        if (['file', 'type', 'name', 'none'].includes(groupBy)) {
            this.groupBy = groupBy;
        }
    }
    
    setSortBy(sortBy) {
        if (['name', 'file', 'type', 'lines'].includes(sortBy)) {
            this.sortBy = sortBy;
            this.sortFunctions();
        }
    }
    
    clear() {
        this.functions = [];
        this.filteredFunctions = [];
        this.searchQuery = '';
    }
}
