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
        const cached = await tileCache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            tileCache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // If offline and tile not cached, return graceful offline topographic grid tile (never break Leaflet)
          const fallbackSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
              <rect width="256" height="256" fill="#090d16" stroke="#1e293b" stroke-width="1"/>
              <path d="M0 64 H256 M0 128 H256 M0 192 H256 M64 0 V256 M128 0 V256 M192 0 V256" stroke="#172033" stroke-width="0.75" stroke-dasharray="3,3"/>
              <circle cx="128" cy="120" r="14" fill="#0f172a" stroke="#334155" stroke-width="1"/>
              <text x="128" y="124" text-anchor="middle" fill="#94a3b8" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="10" font-weight="700">MAP OFFLINE</text>
              <text x="128" y="142" text-anchor="middle" fill="#64748b" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="8">Preload in App</text>
            </svg>
          `.trim();
          return new Response(fallbackSvg, {
            status: 200,
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'no-store',
            },
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
