export default class Modal {
    constructor(content, options = {}) {
        this.content = content;
        this.options = {
            title: options.title || 'Modal',
            width: options.width || '600px',
            height: options.height || 'auto',
            closable: options.closable !== false,
            onClose: options.onClose || null,
            onConfirm: options.onConfirm || null,
            confirmText: options.confirmText || 'Confirm',
            cancelText: options.cancelText || 'Cancel',
            showConfirm: options.showConfirm !== false,
            showCancel: options.showCancel !== false
        };
    }
    
    render() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';
        dialog.style.width = this.options.width;
        dialog.style.height = this.options.height;
        
        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const title = document.createElement('h3');
        title.textContent = this.options.title;
        
        if (this.options.closable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '×';
            closeBtn.addEventListener('click', () => this.close());
            header.appendChild(closeBtn);
        }
        
        header.appendChild(title);
        
        // Content
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        if (typeof this.content === 'string') {
            content.innerHTML = this.content;
        } else if (this.content instanceof HTMLElement) {
            content.appendChild(this.content);
        } else {
            content.textContent = 'No content provided';
        }
        
        // Footer
        const footer = document.createElement('div');
        footer.className = 'modal-footer';
        
        if (this.options.showCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-outline';
            cancelBtn.textContent = this.options.cancelText;
            cancelBtn.addEventListener('click', () => this.close());
            footer.appendChild(cancelBtn);
        }
        
        if (this.options.showConfirm) {
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn btn-primary';
            confirmBtn.textContent = this.options.confirmText;
            confirmBtn.addEventListener('click', () => {
                if (this.options.onConfirm) {
                    this.options.onConfirm();
                }
                this.close();
            });
            footer.appendChild(confirmBtn);
        }
        
        dialog.appendChild(header);
        dialog.appendChild(content);
        dialog.appendChild(footer);
        
        modal.appendChild(dialog);
        
        // Close on overlay click
        if (this.options.closable) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        }
        
        // Prevent closing on dialog click
        dialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Add to DOM
        this.element = modal;
        
        // Add escape key listener
        document.addEventListener('keydown', this.handleEscape.bind(this));
        
        return modal;
    }
    
    close() {
        if (this.options.onClose) {
            this.options.onClose();
        }
        
        document.removeEventListener('keydown', this.handleEscape.bind(this));
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
    
    handleEscape(e) {
        if (e.key === 'Escape' && this.options.closable) {
            this.close();
        }
    }
    
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
