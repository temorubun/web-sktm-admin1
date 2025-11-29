/**
 * Modal Handlers
 * 
 * This file contains modal-related functions that are used across the application.
 * It's designed to work with the existing modal implementation in script.js.
 */

/**
 * Show a modal dialog
 * @param {Object} options - Modal options
 * @param {string} options.icon - Icon to display (emoji)
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {Array} options.buttons - Array of button objects
 * @param {string} options.variant - Modal variant (info, success, warning, error)
 * @param {boolean} options.closable - Whether the modal can be closed
 */
function showModal({icon='ℹ️', title='Informasi', message='', buttons=[{label:'Tutup',variant:'secondary',value:true}], variant='info', closable=true}={}) {
    // Use the existing showModal implementation from script.js
    if (typeof window.showModal === 'function') {
        return window.showModal({icon, title, message, buttons, variant, closable});
    }
    
    // Fallback implementation if window.showModal is not available
    console.warn('window.showModal is not available, using fallback');
    
    const modalOverlay = document.getElementById('modalOverlay');
    const modalBox = document.getElementById('modalBox');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalActions = document.getElementById('modalActions');
    
    if (!modalOverlay || !modalBox || !modalIcon || !modalTitle || !modalMessage || !modalActions) {
        console.error('Modal elements not found');
        return Promise.resolve(null);
    }
    
    return new Promise(resolve => {
        // Set modal content
        modalIcon.textContent = icon;
        modalTitle.textContent = title;
        modalMessage.innerHTML = message;
        
        // Clear existing buttons
        modalActions.innerHTML = '';
        
        // Add buttons
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn ${btn.primary ? 'primary' : btn.danger ? 'danger' : btn.variant || 'secondary'}`;
            button.textContent = btn.label;
            button.onclick = () => {
                hide();
                resolve(btn.value);
            };
            modalActions.appendChild(button);
        });
        
        // Show the modal
        modalOverlay.style.display = 'flex';
        modalBox.className = `modal modal--${variant}`;
        
        function onEsc(e) {
            if (e.key === 'Escape' && closable) {
                hide();
                resolve(null);
            }
        }
        
        function hide() {
            modalOverlay.style.display = 'none';
            document.removeEventListener('keydown', onEsc);
        }
        
        document.addEventListener('keydown', onEsc);
        
        // Close on overlay click if closable
        if (closable) {
            modalOverlay.onclick = (e) => {
                if (e.target === modalOverlay) {
                    hide();
                    resolve(null);
                }
            };
        }
    });
}

// Export functions for testing or module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showModal,
        confirmCreateAndSend: window.confirmCreateAndSend,
        showRejectModal: window.showRejectModal
    };
}
