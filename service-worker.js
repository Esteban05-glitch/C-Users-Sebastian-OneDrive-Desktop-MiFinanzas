const CACHE_NAME = 'finanzas-cache-v2';
const ASSETS = ['./', './index.html', './styles.css', './script.js', './manifest.json', './icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Guardamos la nueva versión de la red en la caché
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
      // Devolvemos el caché si existe, pero en paralelo hacemos la petición de red (fetchPromise)
      return cachedResponse || fetchPromise;
    })
  );
});
