
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const MAIN_CONTENT_SELECTOR = 'main, .main-content, [role="main"]'; 

if (window.loadingInitialized) {
    console.warn('Loading module already initialized');
    throw new Error('Loading module already initialized');
}

window.loadingInitialized = true;

function showLoadingOverlay(show = true) {
    const defaultMessage = 'Memuat data… Mohon menunggu.';
    if (loadingOverlay && loadingText) {
        if (show) {
            loadingText.textContent = defaultMessage;
            loadingOverlay.style.display = 'flex';
            loadingOverlay.setAttribute('aria-busy', 'true');
        } else {
            loadingOverlay.style.display = 'none';
            loadingOverlay.setAttribute('aria-busy', 'false');
        }
    }
}

window.showLoadingOverlay = showLoadingOverlay;

const newLoadEvent = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });

document.removeEventListener('DOMContentLoaded', newLoadEvent);

document.addEventListener('DOMContentLoaded', async function loadingHandler() {
    try {
        showLoadingOverlay(true, 'Memuat data...');
        
        if (typeof loadOnce === 'function') {
            await loadOnce();
        } else if (typeof fetchData === 'function') {
            await fetchData();
        }
        
        await waitForContent();
        
    } catch (error) {
        console.error('Error during initial load:', error);
        showLoadingOverlay(true, 'Gagal memuat data. Silakan muat ulang halaman.');
        return;
    } finally {
        setTimeout(() => showLoadingOverlay(false), 300);
        document.removeEventListener('DOMContentLoaded', loadingHandler);
    }
});

async function waitForContent() {
    const maxAttempts = 10;
    const delay = 300;
    
    for (let i = 0; i < maxAttempts; i++) {
        const mainContent = document.querySelector(MAIN_CONTENT_SELECTOR);
        if (mainContent && mainContent.textContent.trim() !== '') {
            const hasContent = Array.from(mainContent.children).some(el => {
                return el.textContent.trim().length > 0 && 
                       !el.hidden && 
                       window.getComputedStyle(el).display !== 'none';
            });
            
            if (hasContent) {
                return true;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error('Timeout waiting for content to load');
}

if (typeof showLoading === 'function') {
    const originalShowLoading = showLoading;
    window.showLoading = function(show, text) {
        showLoadingOverlay(show, text);
        return originalShowLoading(show, text);
    };
}
