import StateManager from './core/stateManager.js';
import AppLayout from './ui/layout/AppLayout.js';
import Header from './ui/layout/Header.js';
import MainContent from './ui/layout/MainContent.js';

export default class App {
    constructor() {
        this.stateManager = new StateManager();
        this.components = {};
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for state changes to re-render
        this.stateManager.subscribe('stateChanged', (newState) => {
            this.render();
        });
        
        // Listen for specific events
        document.addEventListener('functionSelected', (event) => {
            this.stateManager.setSelectedFunction(event.detail);
        });
        
        document.addEventListener('projectLoaded', (event) => {
            this.stateManager.setProjectData(event.detail);
        });
    }
    
    render() {
        // Create main app container
        const container = document.createElement('div');
        container.className = 'app-container';
        
        // Create header
        this.components.header = new Header(this.stateManager);
        container.appendChild(this.components.header.render());
        
        // Create main layout
        this.components.layout = new AppLayout(this.stateManager);
        container.appendChild(this.components.layout.render());
        
        return container;
    }
}
