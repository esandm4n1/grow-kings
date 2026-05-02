const CACHE_NAME = 'grow-kings-v12';
const PRECACHE = ['./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())  // 新SWを即座にアクティブにする
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())  // 既存タブも新SWで制御
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  const url = new URL(req.url);
  const isHTML = url.pathname.endsWith('.html') || url.pathname.endsWith('/') || req.mode === 'navigate';
  const isJS = url.pathname.endsWith('.js');

  // HTML と JS は network-first（常に最新を取りに行く）
  if (isHTML || isJS) {
    e.respondWith(
      fetch(req).then(r => {
        if (r && r.status === 200) {
          const clone = r.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return r;
      }).catch(() => caches.match(req).then(cached => cached || (req.mode === 'navigate' ? caches.match('./') : undefined)))
    );
    return;
  }

  // 画像など静的ファイルは cache-first
  e.respondWith(
    caches.match(req).then(c => {
      if (c) return c;
      return fetch(req).then(r => {
        if (r && r.status === 200) {
          const cl = r.clone();
          caches.open(CACHE_NAME).then(ca => ca.put(req, cl));
        }
        return r;
      }).catch(() => undefined);
    })
  );
});
