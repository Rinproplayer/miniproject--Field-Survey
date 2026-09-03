/**
 * VKU Field Survey - Service Worker (v3 - Optimized Auto-Updating)
 * Strategy: Network-First for Navigation (HTML) to always serve latest code, 
 *           Cache-First for Static Assets (CSS, JS, Fonts, Icons) for sub-second offline boot.
 * Auto-Cleanup: Purges all legacy caches on activation.
 */

const CACHE_NAME = 'vku-survey-cache-v3';
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192-maskable.png',
  '/icons/icon-512x512-maskable.png',
];

// 1. INSTALL: Pre-cache App Shell and skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    })
  );
});

// 2. ACTIVATE: Purge all legacy caches and take control of all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Purging legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Smart Network-First for HTML, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET and external non-http schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bypass APIs & Google Sheets endpoints (let network handle)
  if (url.pathname.startsWith('/api/') || url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Ngoại tuyến: Dữ liệu đã lưu hàng đợi' }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        );
      })
    );
    return;
  }

  // NAVIGATION REQUESTS (HTML): Network-First with Cache Fallback
  // This guarantees old browsers always get the latest optimized web app when online!
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline or network fails, return cached index.html
          return caches.match('/index.html');
        })
    );
    return;
  }

  // STATIC ASSETS (JS, CSS, Images, Icons): Cache-First Strategy
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return networkResponse;
      });
    }).catch(() => {
      if (request.destination === 'image') {
        return caches.match('/icons/icon-192x192.png');
      }
    })
  );
});

// 4. BACKGROUND SYNC EVENT
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-surveys') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGER' });
        });
      })
    );
  }
});
