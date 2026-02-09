import StateManager from './core/stateManager.js';
import AppLayout from './ui/layout/AppLayout.js';
import Header from './ui/layout/Header.js';

export default class App {
    constructor() {
        this.stateManager = new StateManager();
        this.components = {};
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Escuchar cambios de estado
        this.stateManager.subscribe('stateChanged', () => {
            this.render();
        });
    }
    
    render() {
        // Crear contenedor principal
        const container = document.createElement('div');
        container.className = 'app-container';
        
        // Crear header
        this.components.header = new Header(this.stateManager);
        container.appendChild(this.components.header.render());
        
        // Crear layout principal
        this.components.layout = new AppLayout(this.stateManager);
        container.appendChild(this.components.layout.render());
        
        return container;
    }
}
