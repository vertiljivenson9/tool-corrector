export default class StateManager {
    constructor() {
        this.state = {
            // Project state
            project: null,
            files: [],
            fileTree: [],
            
            // Analysis state
            functions: [],
            selectedFunction: null,
            selectedFile: null,
            
            // UI state
            loading: false,
            error: null,
            viewMode: 'read', // 'read', 'edit', 'diff'
            
            // Edit state
            originalCode: '',
            modifiedCode: '',
            editType: null, // 'replace', 'insertInside', 'insertAfter'
            
            // Search state
            searchQuery: '',
            filteredFunctions: []
        };
        
        this.listeners = new Map();
    }
    
    // Get current state
    getState() {
        return { ...this.state };
    }
    
    // Update state with partial update
    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.notifyListeners('stateChanged', this.state, oldState);
    }
    
    // Specific state setters
    setProjectData(projectData) {
        this.setState({
            project: projectData.name,
            files: projectData.files,
            fileTree: this.buildFileTree(projectData.files),
            functions: projectData.functions || []
        });
    }
    
    setSelectedFunction(func) {
        this.setState({
            selectedFunction: func,
            selectedFile: func ? func.filePath : null,
            viewMode: 'read',
            originalCode: func ? func.code : '',
            modifiedCode: func ? func.code : ''
        });
    }
    
    setLoading(loading) {
        this.setState({ loading });
    }
    
    setError(error) {
        this.setState({ error });
    }
    
    setEditMode(type, code = '') {
        this.setState({
            viewMode: 'edit',
            editType: type,
            modifiedCode: code || this.state.originalCode
        });
    }
    
    setSearchQuery(query) {
        const filteredFunctions = query 
            ? this.state.functions.filter(func => 
                func.name.toLowerCase().includes(query.toLowerCase()) ||
                func.filePath.toLowerCase().includes(query.toLowerCase())
              )
            : this.state.functions;
        
        this.setState({
            searchQuery: query,
            filteredFunctions
        });
    }
    
    // Helper methods
    buildFileTree(files) {
        const tree = [];
        const pathMap = {};
        
        files.forEach(file => {
            const pathParts = file.path.split('/');
            let currentLevel = tree;
            
            pathParts.forEach((part, index) => {
                let existing = currentLevel.find(item => item.name === part);
                
                if (!existing) {
                    if (index === pathParts.length - 1) {
                        // It's a file
                        existing = {
                            type: 'file',
                            name: part,
                            path: file.path,
                            content: file.content
                        };
                    } else {
                        // It's a folder
                        existing = {
                            type: 'folder',
                            name: part,
                            children: []
                        };
                    }
                    currentLevel.push(existing);
                }
                
                if (existing.type === 'folder') {
                    currentLevel = existing.children;
                }
            });
        });
        
        return tree;
    }
    
    // Event subscription
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }
    
    notifyListeners(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }
}
