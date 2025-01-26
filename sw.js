// Service Worker
const CACHE_NAME = 'flashcards-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/css/style.css',
                '/css/responsive.css',
                '/js/api.js',
                '/js/app.js',
                '/js/cardManager.js',
                '/js/fileHandler.js',
                '/js/ui.js'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
}); 