const CACHE_NAME = 'laya-pwa-v20260420-icon1';
const CORE_ASSETS = [
  './',
  './resident-login.html',
  './manifest.webmanifest',
  './assets/images/laya-app-icon-192-v20260420.png',
  './assets/images/laya-app-icon-512-v20260420.png'
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

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      return response;
    } catch (error) {
      return cached || Response.error();
    }
  })());
});
