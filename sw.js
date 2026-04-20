const CACHE_NAME = 'laya-resident-pwa-v20260420-settings1';
const CORE_ASSETS = [
  './',
  './settings.html',
  './resident-login.html',
  './manifest.webmanifest?v=20260420settings1',
  './assets/images/laya-app-icon-192-v20260420b.png',
  './assets/images/laya-app-icon-512-v20260420b.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => undefined));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      return await fetch(event.request);
    } catch (error) {
      return cached || Response.error();
    }
  })());
});
