/**
 * VKU Field Survey - Service Worker
 * Strategy: Cache-First for App Shell assets, Network-First for dynamic APIs
 * Lifecycle: Install -> Pre-cache -> Activate -> Clean Old Caches -> Fetch Interception
 * Background Sync: Handles 'sync-surveys' event
 */

const CACHE_NAME = 'vku-survey-cache-v1';
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-192x192-maskable.png',
  '/icons/icon-512x512-maskable.png',
];

// 1. INSTALL EVENT: Pre-cache core App Shell assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install Event: Pre-caching App Shell');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVATE EVENT: Clean up deprecated cache versions
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate Event: Cleaning old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. FETCH EVENT: Cache-First for assets with dynamic runtime caching
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or chrome-extension schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // For API or webhook requests, let network handle or fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Network unavailable. Request queued offline.' }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        );
      })
    );
    return;
  }

  // Navigation requests (HTML document) - Cache-First with fallback to index.html for SPA
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cachedIndex) => {
        return (
          cachedIndex ||
          fetch(request).then((networkResponse) => {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseClone));
            return networkResponse;
          })
        );
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static Assets (CSS, JS, Fonts, Images) - Cache-First Strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // In offline mode, if an asset fails, fallback gracefully
      if (request.destination === 'image') {
        return caches.match('/icons/icon-192x192.png');
      }
    })
  );
});

// 4. BACKGROUND SYNC EVENT: Triggered automatically upon network restoration
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background Sync event triggered:', event.tag);
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
