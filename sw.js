// A simple, no-frills service worker.
const CACHE_NAME = 'sanu-transcribe-cache-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  // Note: The main script (index.tsx) and dynamically imported modules are handled by the browser's importmap.
  // Caching them explicitly can be complex. The browser cache + this service worker for the shell is a good start.
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Fira+Code&family=Inter:wght@400;500;600&family=Poppins:wght@700;800&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});