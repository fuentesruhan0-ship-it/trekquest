// Offline Map Manager for TrekQuest
// Provides tile calculation, background tile caching, storage estimation, and preset trail offline packs

export const TILE_CACHE_NAME = 'trekquest-tiles-v1';
export const REGIONS_STORAGE_KEY = 'trekquest_offline_regions';

// Supported Map Tile Providers
export const TILE_PROVIDERS = {
  satellite: {
    id: 'satellite',
    name: 'Esri World Satellite',
    subdomainRequired: false,
    getUrl: (z, y, x) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
  },
  topo: {
    id: 'topo',
    name: 'OpenTopoMap Contours',
    subdomainRequired: true,
    getUrl: (z, y, x) => {
      const sub = ['a', 'b', 'c'][(x + y) % 3];
      return `https://${sub}.tile.opentopomap.org/${z}/${x}/${y}.png`;
    },
  },
  streets: {
    id: 'streets',
    name: 'OpenStreetMap Outdoor',
    subdomainRequired: false,
    getUrl: (z, y, x) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
  },
};

// Curated Philippine Hiking Trails for 1-Tap Offline Caching
export const PRESET_OFFLINE_TRAILS = [
  {
    id: 'preset_pulag',
    name: 'Mt. Pulag (Ambangeg Trail)',
    region: 'Benguet, Cordillera',
    elevation: '2,928m',
    difficulty: 'Moderate',
    bounds: { south: 16.570, west: 120.880, north: 16.615, east: 120.930 },
    summit: [16.5975, 120.8986],
    desc: 'Sea of clouds, mossy forest, grassland summit trail.',
  },
  {
    id: 'preset_batulao',
    name: 'Mt. Batulao (Ridge Traverse)',
    region: 'Nasugbu, Batangas',
    elevation: '811m',
    difficulty: 'Moderate',
    bounds: { south: 14.025, west: 120.785, north: 14.060, east: 120.825 },
    summit: [14.0436, 120.8031],
    desc: 'Knife-edge ridges and 360-degree views of Balayan Bay.',
  },
  {
    id: 'preset_ulap',
    name: 'Mt. Ulap (Eco-Trail & Gungal)',
    region: 'Itogon, Benguet',
    elevation: '1,846m',
    difficulty: 'Moderate',
    bounds: { south: 16.310, west: 120.625, north: 16.350, east: 120.665 },
    summit: [16.3268, 120.6481],
    desc: 'Pine ridges, burial caves, Gungal Rock photo cliff.',
  },
  {
    id: 'preset_daraitan',
    name: 'Mt. Daraitan & Tinipak River',
    region: 'Tanay, Rizal',
    elevation: '739m',
    difficulty: 'Moderate',
    bounds: { south: 14.595, west: 121.410, north: 14.635, east: 121.455 },
    summit: [14.6153, 121.4361],
    desc: 'Limestone crags, heart of Sierra Madre, river rapids.',
  },
  {
    id: 'preset_pinatubo',
    name: 'Mt. Pinatubo (Crater Lake)',
    region: 'Zambales / Tarlac',
    elevation: '1,486m',
    difficulty: 'Easy-Mod',
    bounds: { south: 15.115, west: 120.320, north: 15.165, east: 120.370 },
    summit: [15.1429, 120.3496],
    desc: 'Grand caldera crater lake & desert canyon trail.',
  },
  {
    id: 'preset_apo',
    name: 'Mt. Apo (Boulder Face)',
    region: 'Davao del Sur',
    elevation: '2,954m',
    difficulty: 'Hard',
    bounds: { south: 6.960, west: 125.240, north: 7.015, east: 125.295 },
    summit: [6.9875, 125.2711],
    desc: 'Highest summit in the Philippines with sulfur vents.',
  },
  {
    id: 'preset_maculot',
    name: 'Mt. Maculot (Rockies Peak)',
    region: 'Cuenca, Batangas',
    elevation: '930m',
    difficulty: 'Moderate',
    bounds: { south: 13.900, west: 121.035, north: 13.935, east: 121.070 },
    summit: [13.9167, 121.0500],
    desc: 'The Rockies vantage point overlooking Taal Lake.',
  },
  {
    id: 'preset_osmena',
    name: 'Osmeña Peak (Mantalongon)',
    region: 'Dalaguete, Cebu',
    elevation: '1,013m',
    difficulty: 'Easy',
    bounds: { south: 9.805, west: 123.430, north: 9.840, east: 123.465 },
    summit: [9.8219, 123.4475],
    desc: 'Jagged conical hill peaks resembling chocolate hills.',
  },
];

// Web Mercator Math
export function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

export function tile2lon(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

export function tile2lat(y, z) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

// Generate tile coordinates for a bounding box
export function getTileCoordinates(bounds, minZoom = 13, maxZoom = 15) {
  const { south, west, north, east } = bounds;
  const tiles = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    const xMin = Math.max(0, lon2tile(west, z));
    const xMax = Math.min(Math.pow(2, z) - 1, lon2tile(east, z));
    const yMin = Math.max(0, lat2tile(north, z));
    const yMax = Math.min(Math.pow(2, z) - 1, lat2tile(south, z));

    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        tiles.push({ x, y, z });
      }
    }
  }
  return tiles;
}

// Generate full URLs for all desired layers
export function generateTileUrls(bounds, minZoom = 13, maxZoom = 15, layerTypes = ['satellite', 'topo']) {
  const coords = getTileCoordinates(bounds, minZoom, maxZoom);
  const urls = [];

  for (const { x, y, z } of coords) {
    for (const layerKey of layerTypes) {
      const provider = TILE_PROVIDERS[layerKey];
      if (provider) {
        urls.push({
          url: provider.getUrl(z, y, x),
          layer: layerKey,
          z,
          x,
          y,
        });
      }
    }
  }
  return urls;
}

// Calculate bounding box along a route corridor
export function getRouteCorridorBounds(points, marginDeg = 0.02) {
  if (!points || points.length === 0) return null;
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

  for (const pt of points) {
    if (!pt) continue;
    const lat = Array.isArray(pt) ? pt[0] : pt.lat;
    const lng = Array.isArray(pt) ? pt[1] : pt.lng;
    if (typeof lat === 'number' && typeof lng === 'number') {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  }

  return {
    south: minLat - marginDeg,
    north: maxLat + marginDeg,
    west: minLng - marginDeg,
    east: maxLng + marginDeg,
  };
}

// Download list of tiles with concurrency limit and progress updates
export async function downloadTiles(tileItems, onProgress = () => {}, signal = null) {
  if (!('caches' in window)) {
    throw new Error('Cache API is not supported in this browser.');
  }

  const cache = await caches.open(TILE_CACHE_NAME);
  const total = tileItems.length;
  let completed = 0;
  let failed = 0;
  const concurrency = 6; // Balance speed vs rate limits

  const queue = [...tileItems];

  const worker = async () => {
    while (queue.length > 0) {
      if (signal && signal.aborted) {
        throw new Error('Download aborted by user.');
      }

      const item = queue.shift();
      if (!item) break;

      try {
        // Check if already in cache to avoid re-downloading
        const already = await cache.match(item.url);
        if (!already) {
          const res = await fetch(item.url, {
            mode: 'cors',
            cache: 'no-cache',
            signal,
          });
          if (res && res.status === 200) {
            await cache.put(item.url, res);
          } else {
            failed++;
          }
        }
      } catch (err) {
        if (signal && signal.aborted) throw err;
        failed++;
      } finally {
        completed++;
        const percent = Math.round((completed / total) * 100);
        onProgress({
          completed,
          total,
          percent,
          failed,
          currentLayer: item.layer,
          currentZoom: item.z,
        });
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);

  return { total, completed, failed };
}

// Inspect current cached tiles stats
export async function getCachedTileStats() {
  if (!('caches' in window)) return { count: 0, estimatedMb: 0 };
  try {
    const cache = await caches.open(TILE_CACHE_NAME);
    const keys = await cache.keys();
    const count = keys.length;
    // Average tile size is ~22KB
    const estimatedMb = parseFloat(((count * 22) / 1024).toFixed(1));
    return { count, estimatedMb };
  } catch (err) {
    console.warn('Failed to get cache stats:', err);
    return { count: 0, estimatedMb: 0 };
  }
}

// Clear all offline map tiles
export async function clearOfflineMapTiles() {
  if (!('caches' in window)) return;
  try {
    await caches.delete(TILE_CACHE_NAME);
    localStorage.removeItem(REGIONS_STORAGE_KEY);
    // Tell SW if active
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_TILE_CACHE' });
    }
    return true;
  } catch (err) {
    console.warn('Error clearing tiles:', err);
    return false;
  }
}

// Storage helpers for saved regions metadata
export function getSavedOfflineRegions() {
  try {
    const data = localStorage.getItem(REGIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveOfflineRegion(region) {
  const existing = getSavedOfflineRegions();
  const updated = [
    {
      ...region,
      id: region.id || `offline_reg_${Date.now()}`,
      savedAt: new Date().toISOString(),
    },
    ...existing.filter((r) => r.id !== region.id),
  ];
  localStorage.setItem(REGIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteOfflineRegion(id) {
  const existing = getSavedOfflineRegions();
  const updated = existing.filter((r) => r.id !== id);
  localStorage.setItem(REGIONS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
