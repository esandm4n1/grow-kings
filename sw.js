/**
 * GROW Service Worker
 * Cache-first strategy for offline support.
 * Version bump = change CACHE_NAME to force update.
 */

const CACHE_NAME = 'grow-kings-v6';
const OFFLINE_FALLBACK = './';

// Core assets to precache (populated at install)
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only cache same-origin GET
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // Background update
        fetch(req).then(resp => {
          if (resp && resp.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()));
          }
        }).catch(() => {});
        return cached;
      }

      return fetch(req)
        .then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return resp;
        })
        .catch(() => {
          // Offline fallback for navigation
          if (req.mode === 'navigate') {
            return caches.match(OFFLINE_FALLBACK);
          }
        });
    })
  );
});
