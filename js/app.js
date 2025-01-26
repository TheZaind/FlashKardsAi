// This file serves as the main entry point and coordinates between modules
import aiHandler from './api.js';
import fileHandler from './fileHandler.js';
import cardManager from './cardManager.js';

// Global error handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    alert('An error occurred: ' + event.reason.message);
});

// Service Worker Registration for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}

// Handle offline functionality
window.addEventListener('online', function() {
    document.body.classList.remove('offline');
});

window.addEventListener('offline', function() {
    document.body.classList.add('offline');
});

// Handle mobile keyboard adjustments
const viewport = document.querySelector('meta[name=viewport]');
if (viewport) {
    const originalContent = viewport.content;
    
    window.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            viewport.content = originalContent + ', height=' + window.innerHeight;
        }
    });
    
    window.addEventListener('focusout', () => {
        viewport.content = originalContent;
    });
}

// Prevent zooming on double tap (mobile)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Export modules for potential external use
export {
    aiHandler,
    fileHandler,
    cardManager
}; 