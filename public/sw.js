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
        if (!cached && url.hostname.includes('opentopomap.org')) {
          for (const sub of ['a', 'b', 'c']) {
            const altUrl = request.url.replace(/[abc]\.tile\.opentopomap\.org/, `${sub}.tile.opentopomap.org`);
            cached = await tileCache.match(altUrl);
            if (cached) break;
          }
        }
        if (!cached && url.hostname.includes('tile.openstreetmap.org')) {
          for (const sub of ['a', 'b', 'c']) {
            const altUrl = request.url.replace(/[abc]\.tile\.openstreetmap\.org/, `${sub}.tile.openstreetmap.org`);
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
          // If offline and tile not cached, return graceful layer-aware offline vector tile (never breaks Leaflet)
          const isSatellite = url.hostname.includes('arcgisonline.com');
          const isTopo = url.hostname.includes('opentopomap.org');

          let bgFill = '#0a1410';
          let gridStroke = '#16281e';
          let layerTag = 'OUTDOOR MAP';
          let accentColor = '#38bdf8';

          if (isSatellite) {
            bgFill = '#070f0b';
            gridStroke = '#132319';
            layerTag = 'SATELLITE';
            accentColor = '#10b981';
          } else if (isTopo) {
            bgFill = '#0d1811';
            gridStroke = '#1a3324';
            layerTag = 'TOPO CONTOURS';
            accentColor = '#34d399';
          }

          const fallbackSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
              <rect width="256" height="256" fill="${bgFill}"/>
              <path d="M0 64 H256 M0 128 H256 M0 192 H256 M64 0 V256 M128 0 V256 M192 0 V256" stroke="${gridStroke}" stroke-width="0.75" stroke-dasharray="3,3"/>
              ${isTopo ? '<path d="M20 180 Q80 120 140 170 T240 130 M0 90 Q70 40 160 80 T256 50" fill="none" stroke="#224230" stroke-width="1.2" stroke-dasharray="5,3"/>' : ''}
              <circle cx="128" cy="116" r="16" fill="${bgFill}" stroke="${gridStroke}" stroke-width="1.5"/>
              <text x="128" y="120" text-anchor="middle" fill="${accentColor}" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="9" font-weight="800" letter-spacing="1">OFFLINE</text>
              <text x="128" y="140" text-anchor="middle" fill="#64748b" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="7.5" font-weight="600">${layerTag}</text>
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
