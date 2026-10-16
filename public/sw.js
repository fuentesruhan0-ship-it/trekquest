// TrekQuest Progressive Web App Service Worker
const CACHE_NAME = 'trekquest-app-v2';
const TILE_CACHE_NAME = 'trekquest-tiles-v1';

const STATIC_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE_URLS).catch((err) => {
        console.warn('SW Pre-cache partial fail:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== TILE_CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Smart offline-first routing
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Handle Map Tile requests (OpenStreetMap / OpenTopoMap / Esri Satellite / Carto)
  const isMapTile =
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('opentopomap.org') ||
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('cartocdn.com') ||
    url.pathname.includes('/MapServer/tile/') ||
    (url.pathname.match(/\.(png|jpg|jpeg|webp)$/i) && (url.pathname.includes('/tile') || /\/\d+\/\d+\/\d+/.test(url.pathname)));

  if (isMapTile) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(async (tileCache) => {
        let cached = await tileCache.match(request);
        if (!cached && (url.hostname.includes('tile.opentopomap.org') || url.hostname.includes('tile.openstreetmap.org'))) {
          // Check alternative subdomains (a, b, c) in cache
          for (const sub of ['a', 'b', 'c']) {
            const altUrl = request.url.replace(/:\/\/[abc]\.tile\./, `://${sub}.tile.`);
            cached = await tileCache.match(altUrl);
            if (cached) break;
          }
        }
        if (cached) return cached;

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            tileCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // If offline and tile not in cache, return 404 so Leaflet's zoom engine
          // keeps the parent/child zoom tiles rendered and smoothly stretched with CSS
          // instead of wiping them out with an opaque black box!
          return new Response('', {
            status: 404,
            statusText: 'Tile Not Cached',
          });
        }
      })
    );
    return;
  }

  // 2. Handle HTML navigation requests (Single Page App routing offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        return cachedIndex || new Response('Offline - TrekQuest will load when cached', {
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // 3. Static assets (JS, CSS, fonts, images) - Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, return cached if exists
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for messages from client (Skip waiting, Cache maintenance)
self.addEventListener('message', async (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CLEAR_TILE_CACHE') {
    try {
      await caches.delete(TILE_CACHE_NAME);
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ success: true });
    } catch (e) {
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ success: false, error: e.message });
    }
  }
});
