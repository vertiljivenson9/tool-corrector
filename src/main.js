import App from './App.js';

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    try {
        const appContainer = document.getElementById('app');
        
        if (!appContainer) {
            throw new Error('No se encontró el contenedor de la aplicación');
        }
        
        // Mostrar estado de carga
        appContainer.innerHTML = '';
        
        // Inicializar y renderizar la aplicación
        const app = new App();
        appContainer.appendChild(app.render());
        
        console.log('✅ Code Editor Tool inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
        
        // Mostrar mensaje de error amigable
        const errorContainer = document.getElementById('app') || document.body;
        errorContainer.innerHTML = `
            <div style="
                padding: 40px;
                text-align: center;
                font-family: 'Inter', sans-serif;
                max-width: 600px;
                margin: 100px auto;
                background: #f8fafc;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            ">
                <div style="color: #ef4444; font-size: 48px; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2 style="color: #1f2937; margin-bottom: 16px;">
                    Error al cargar la aplicación
                </h2>
                <p style="color: #4b5563; margin-bottom: 24px;">
                    ${error.message}
                </p>
                <div style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">
                    Revisa la consola del navegador para más detalles.
                </div>
                <button onclick="location.reload()" style="
                    padding: 12px 24px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                " onmouseover="this.style.background='#2563eb'" 
                  onmouseout="this.style.background='#3b82f6'">
                    <i class="fas fa-redo"></i> Recargar página
                </button>
            </div>
        `;
    }
});

// Manejar errores globales
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no manejada:', event.reason);
});
