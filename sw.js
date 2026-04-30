const CACHE_NAME = 'grow-kings-v10';
const PRECACHE = ['./','./index.html','./dino.html','./dino_app.js','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(req).then(c => {
    if (c) { fetch(req).then(r => { if (r && r.status === 200) caches.open(CACHE_NAME).then(ca => ca.put(req, r.clone())); }).catch(() => {}); return c; }
    return fetch(req).then(r => { if (r && r.status === 200) { const cl = r.clone(); caches.open(CACHE_NAME).then(ca => ca.put(req, cl)); } return r; }).catch(() => { if (req.mode === 'navigate') return caches.match('./'); });
  }));
});
