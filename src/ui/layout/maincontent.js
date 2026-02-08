import CodePanel from '../components/CodePanel.js';
import ActionButtons from '../components/ActionButtons.js';
import Modal from '../components/Modal.js';

export default class MainContent {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.codePanel = new CodePanel(stateManager);
        this.actionButtons = new ActionButtons(stateManager);
        this.modal = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for state changes
        this.stateManager.subscribe('stateChanged', (newState, oldState) => {
            this.update();
        });
    }
    
    render() {
        const container = document.createElement('div');
        container.className = 'main-content';
        
        // Code panel section
        const codeSection = document.createElement('section');
        codeSection.className = 'code-section';
        
        const codePanelContainer = document.createElement('div');
        codePanelContainer.className = 'code-panel-container';
        codePanelContainer.appendChild(this.codePanel.render());
        
        codeSection.appendChild(codePanelContainer);
        
        // Actions section
        const actionsSection = document.createElement('section');
        actionsSection.className = 'actions-section';
        actionsSection.appendChild(this.actionButtons.render());
        
        // Info section
        const infoSection = document.createElement('section');
        infoSection.className = 'info-section';
        this.infoContent = document.createElement('div');
        this.infoContent.className = 'info-content';
        infoSection.appendChild(this.infoContent);
        
        // Empty state
        this.emptyState = document.createElement('div');
        this.emptyState.className = 'empty-state';
        this.emptyState.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-code"></i>
            </div>
            <h3>No Function Selected</h3>
            <p>Select a function from the sidebar to view and edit its code.</p>
            <p class="hint">Load a project to get started.</p>
        `;
        
        container.appendChild(codeSection);
        container.appendChild(actionsSection);
        container.appendChild(infoSection);
        container.appendChild(this.emptyState);
        
        return container;
    }
    
    update() {
        const state = this.stateManager.getState();
        
        // Show/hide empty state
        if (state.selectedFunction) {
            this.emptyState.style.display = 'none';
        } else {
            this.emptyState.style.display = 'flex';
        }
        
        // Update info section
        this.updateInfoSection(state);
        
        // Update code panel
        if (this.codePanel.update) {
            this.codePanel.update();
        }
        
        // Update action buttons
        if (this.actionButtons.update) {
            this.actionButtons.update();
        }
    }
    
    updateInfoSection(state) {
        if (!this.infoContent) return;
        
        this.infoContent.innerHTML = '';
        
        if (state.selectedFunction) {
            const info = document.createElement('div');
            info.className = 'function-info';
            
            info.innerHTML = `
                <h4>Function Details</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${state.selectedFunction.name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">File:</span>
                        <span class="info-value">${state.selectedFunction.filePath}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Type:</span>
                        <span class="info-value">${state.selectedFunction.type}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Lines:</span>
                        <span class="info-value">${state.selectedFunction.startLine} - ${state.selectedFunction.endLine}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Size:</span>
                        <span class="info-value">${state.selectedFunction.code.length} chars</span>
                    </div>
                </div>
            `;
            
            this.infoContent.appendChild(info);
        }
    }
    
    showModal(content, options = {}) {
        if (this.modal) {
            this.modal.remove();
        }
        
        this.modal = new Modal(content, options);
        document.body.appendChild(this.modal.render());
        
        // Add close handler
        this.modal.onClose = () => {
            if (this.modal) {
                this.modal.remove();
                this.modal = null;
            }
        };
    }
}
