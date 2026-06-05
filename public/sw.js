// Service Worker for caching and offline functionality
const CACHE_NAME = 'ticdia-v3';
const STATIC_CACHE = 'ticdia-static-v3';
const ASSET_CACHE = 'ticdia-assets-v3';

// Files to cache immediately
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.ico',
];

// API endpoints to cache with stale-while-revalidate strategy
const API_CACHE_PATTERNS = [
  /\/api\/rss/,
  /\/api\/tts/,
  /wikipedia\.org/,
  /nytimes\.com/,
  /newsapi\.org/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![CACHE_NAME, STATIC_CACHE, ASSET_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Vite-built, content-hashed assets — cache-first forever (the hash changes on rebuild)
  if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(cache =>
        cache.match(request).then(hit => hit || fetch(request).then(res => {
          if (res.status === 200) cache.put(request, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  // Static one-off files
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then(response => response || fetch(request))
    );
    return;
  }

  // API requests - stale while revalidate
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Everything else - network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
