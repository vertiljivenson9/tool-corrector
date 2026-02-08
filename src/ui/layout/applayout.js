import Sidebar from '../components/Sidebar.js';
import MainContent from '../layout/MainContent.js';

export default class AppLayout {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.sidebar = new Sidebar(stateManager);
        this.mainContent = new MainContent(stateManager);
        this.sidebarCollapsed = false;
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'app-layout';
        
        // Create sidebar
        const sidebarContainer = document.createElement('div');
        sidebarContainer.className = `sidebar-container ${this.sidebarCollapsed ? 'collapsed' : ''}`;
        sidebarContainer.appendChild(this.sidebar.render());
        container.appendChild(sidebarContainer);
        
        // Create main content
        const mainContainer = document.createElement('div');
        mainContainer.className = 'main-container';
        mainContainer.appendChild(this.mainContent.render());
        container.appendChild(mainContainer);
        
        // Add toggle button for sidebar
        const toggleButton = document.createElement('button');
        toggleButton.className = 'sidebar-toggle';
        toggleButton.innerHTML = this.sidebarCollapsed ? '›' : '‹';
        toggleButton.addEventListener('click', () => {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            this.render();
        });
        container.appendChild(toggleButton);
        
        return container;
    }
    
    update() {
        this.sidebar.update();
        this.mainContent.update();
    }
}
