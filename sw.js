const CACHE_NAME = 'serenia-vr-shell-v1';
const INDEX_URL = new URL('./index.html', self.registration.scope).href;
const APP_SHELL = [
  new URL('./', self.registration.scope).href,
  INDEX_URL,
  new URL('./manifest.json', self.registration.scope).href,
  new URL('./psychology.png', self.registration.scope).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('serenia-vr-shell-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      if (request.mode === 'navigate') {
        const cachedIndex = await cache.match(INDEX_URL);
        if (cachedIndex) {
          return cachedIndex;
        }
      }

      return new Response('Recurso no disponible sin conexion.', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
  })());
});