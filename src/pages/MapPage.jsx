import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Map as MapIcon, Trash2, Navigation, BookOpen, HeartPulse, Leaf, Save, Edit2,
  X, Check, LocateFixed, Menu, Music, Compass as CompassIcon, Scan, ChevronRight, Backpack,
  UserRound, Mountain, AlertCircle, LogOut, RefreshCw, Users, Search, Download, CloudOff,
  Target, ArrowUpRight, Eye, ShieldCheck
} from 'lucide-react';
import WeatherPlanDrawer from '@/components/WeatherPlanDrawer';
import WeatherModal from '@/components/WeatherModal';
import PlanRouteModal from '@/components/PlanRouteModal';
import HikeInformationCard from '@/components/HikeInformationCard';
import ActiveHikeHUD from '@/components/ActiveHikeHUD';
import HikePreStartModal from '@/components/HikePreStartModal';
import OfflineMapModal from '@/components/OfflineMapModal';
import { useAuth } from '@/lib/AuthContext';
import CameraPlantScanner from '@/components/CameraPlantScanner';
import MusicMode from '@/pages/Music';
import { base44 } from '@/api/base44Client';
import { searchBroadPlaces, calculateBearing, getCompassDirection } from '@/lib/philippinePlaces';

// Custom Map Markers with Live Orientation Compass Cone
function createAvatarMapIcon(photoUrl, initial, isPinging, heading = 0) {
  const size = isPinging ? 64 : 56;
  const half = size / 2;
  const innerSize = isPinging ? 40 : 36;
  const pulse = isPinging
    ? `animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;`
    : `animation:pulseRing 2.2s ease-out infinite;`;
  const ringColor = isPinging ? 'rgba(16,185,129,0.55)' : 'rgba(16,185,129,0.35)';
  const imgTag = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextSibling.style.display='flex';" />
       <span style="display:none;width:100%;height:100%;border-radius:50%;background:#059669;color:white;font-weight:900;font-size:${innerSize * 0.42}px;align-items:center;justify-content:center;">${initial}</span>`
    : `<span style="display:flex;width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#059669,#10b981);color:white;font-weight:900;font-size:${innerSize * 0.42}px;align-items:center;justify-content:center;">${initial}</span>`;
  
  // High-visibility directional heading cone pointing in the direction the hiker is facing
  const safeHeading = typeof heading === 'number' && !isNaN(heading) ? heading : 0;
  const coneHtml = `
    <div style="position:absolute;top:50%;left:50%;width:0;height:0;transform:translate(-50%, -50%) rotate(${safeHeading}deg);pointer-events:none;z-index:1;">
      <div style="position:absolute;bottom:14px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-bottom:28px solid rgba(16, 185, 129, 0.5);filter:drop-shadow(0 0 6px rgba(16,185,129,0.7));"></div>
      <div style="position:absolute;bottom:22px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:8px solid #ffffff;"></div>
    </div>
  `;

  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      ${coneHtml}
      <div style="position:absolute;inset:0;border-radius:50%;background:${ringColor};${pulse}"></div>
      ${isPinging ? `<div style="position:absolute;inset:8px;border-radius:50%;background:rgba(16,185,129,0.25);animation:pulseRing 2.2s ease-out infinite;"></div>` : ''}
      <div style="position:relative;width:${innerSize}px;height:${innerSize}px;border-radius:50%;overflow:hidden;border:2.5px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.55);background:#059669;display:flex;align-items:center;justify-content:center;z-index:2;">
        ${imgTag}
      </div>
      <div style="position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid white;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));z-index:2;"></div>
    </div>`,
    className: '',
    iconSize: [size, size + 7],
    iconAnchor: [half, size + 7],
  });
}

const startIcon = L.divIcon({
  html: `<div style="width:28px;height:28px;background:#10b981;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.4)">S</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const waypointIcon = (label, isDest) => L.divIcon({
  html: `<div style="padding:4px 8px;background:${isDest ? '#dc2626' : '#d97706'};border:2px solid white;border-radius:12px;color:white;font-weight:bold;font-size:11px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;items-center;gap:4px;">
    <span>${isDest ? '🏁' : '📍'}</span>
    <span>${label}</span>
  </div>`,
  className: '',
  iconSize: [80, 26],
  iconAnchor: [40, 13],
});

const defaultCenter = [14.5995, 120.9842]; // Manila fallback

function haversine(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function routeDistance(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversine(pts[i - 1], pts[i]);
  return d;
}

function RecenterMap({ position, followUser }) {
  const map = useMap();
  useEffect(() => {
    if (position && followUser) {
      map.panTo(position, { animate: true, duration: 0.5 });
    }
  }, [position, followUser, map]);
  return null;
}

function MapControllerInstance({ mapRef, onBoundsChange, onDragStart }) {
  const map = useMap();
  useEffect(() => {
    if (mapRef) mapRef.current = map;
  }, [map, mapRef]);

  useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const b = map.getBounds();
        onBoundsChange({
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        });
      }
    },
    dragstart: () => {
      if (onDragStart) onDragStart();
    },
  });

  useEffect(() => {
    if (onBoundsChange) {
      const b = map.getBounds();
      onBoundsChange({
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      });
    }
  }, [map, onBoundsChange]);

  return null;
}

function FitRouteBounds({ destination, startPoint }) {
  const map = useMap();
  useEffect(() => {
    if (destination && startPoint) {
      try {
        const bounds = L.latLngBounds([startPoint, [destination.lat, destination.lng]]);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
      } catch {}
    }
  }, [destination?.lat, destination?.lng, map]);
  return null;
}

function MapClickHandler({ onClick }) {
  useMapEvents({ click: onClick });
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, updateProfile } = useAuth();

  const displayName = user?.full_name || 'Hiker';
  const displayEmail = user?.email || '';
  const initialLetter = displayName.charAt(0).toUpperCase();

  // Position state (Red dot)
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('trekquest_current_coords');
      return saved ? JSON.parse(saved) : defaultCenter;
    } catch {
      return defaultCenter;
    }
  });

  // Map layer styles (Realistic Satellite as primary default)
  const [mapStyle, setMapStyle] = useState('satellite'); // 'satellite', 'topo', 'streets'

  // Route points: Start + Waypoints + Destination
  const [customStart, setCustomStart] = useState(null);
  const [startMode, setStartMode] = useState('gps'); // 'gps' or 'custom'
  const [waypoints, setWaypoints] = useState([]); // [{ id, name, lat, lng, isDest }]
  const [editingWaypoint, setEditingWaypoint] = useState(null);

  // Active Hike Tracking
  const [tracking, setTracking] = useState(false);
  const [activeHikeDestination, setActiveHikeDestination] = useState(null); // destination passed to ActiveHikeHUD
  const [trackPath, setTrackPath] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [trailNoteText, setTrailNoteText] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  // UI Drawer & Modals State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showCompassModal, setShowCompassModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locatePing, setLocatePing] = useState(false);
  const [locationToast, setLocationToast] = useState('');

  // Weather & Route bottom drawer
  const [showWeatherDrawer, setShowWeatherDrawer] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showPlanRouteModal, setShowPlanRouteModal] = useState(false);

  // Broad Search & Hike Information Guide
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [showHikeInfo, setShowHikeInfo] = useState(false);
  const [showHikePreStart, setShowHikePreStart] = useState(false); // NEW: cinematic info screen before hike
  const searchTimeoutRef = useRef(null);

  // Compass state
  const [compassHeading, setCompassHeading] = useState(42);

  // Offline maps & auto-follow tracking state
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const [currentMapBounds, setCurrentMapBounds] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setLocationToast('⚡ Offline Mode: Using Cached Satellite & Topo Maps (Satellite GPS active)');
      setTimeout(() => setLocationToast(''), 4000);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Edit Profile Form
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editPhoto, setEditPhoto] = useState(user?.photo_url || '');

  // Dynamic user avatar map icon — updates whenever photo, locatePing, or compass heading changes
  const userMapIcon = useMemo(() => {
    const photo = user?.photo_url || '';
    const initial = (user?.full_name || 'H').charAt(0).toUpperCase();
    return createAvatarMapIcon(photo, initial, locatePing, compassHeading);
  }, [user?.photo_url, user?.full_name, locatePing, compassHeading]);

  const defaultSavedRoutes = [
    {
      id: 'route_pulag_ambangeg',
      name: 'Mt. Pulag Ambangeg Trail',
      start: [16.591, 120.898],
      waypoints: [
        { id: 'wp_camp1', name: 'Camp 1 Ranger Station', lat: 16.594, lng: 120.902 },
        { id: 'wp_camp2', name: 'Camp 2 Mossy Forest', lat: 16.598, lng: 120.909 },
        { id: 'wp_summit', name: 'Grassland Summit', lat: 16.5985, lng: 120.912, isDest: true },
      ],
      distance: '16.5',
      createdAt: '2026-09-20',
    },
    {
      id: 'route_batulao_ridge',
      name: 'Mt. Batulao Ridge Traverse',
      start: [14.041, 120.801],
      waypoints: [
        { id: 'wp_fork', name: 'Old-New Trail Fork', lat: 14.043, lng: 120.803 },
        { id: 'wp_peak8', name: 'Camp 8 Knife Edge', lat: 14.047, lng: 120.805 },
        { id: 'wp_batulao_summit', name: 'Batulao Summit Peak', lat: 14.051, lng: 120.807, isDest: true },
      ],
      distance: '10.2',
      createdAt: '2026-09-18',
    },
  ];

  // Saved routes
  const [savedRoutes, setSavedRoutes] = useState(() => {
    try {
      const stored = localStorage.getItem('trekquest_saved_routes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) return parsed;
      }
      localStorage.setItem('trekquest_saved_routes', JSON.stringify(defaultSavedRoutes));
      return defaultSavedRoutes;
    } catch {
      return defaultSavedRoutes;
    }
  });
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const [routeNameInput, setRouteNameInput] = useState('');
  const [showSaveRouteModal, setShowSaveRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [editRouteName, setEditRouteName] = useState('');

  const watchIdRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const cameraInputRef = useRef(null);
  const locationShareIntervalRef = useRef(null);

  // ── MULTI-USER MAP SHARING (fully offline via shared localStorage) ──────────
  // Each user writes their position to the shared pool every 5 seconds.
  // All connected devices on the same browser/device session can see each other.
  // Format: { [userId]: { id, name, photo_url, lat, lng, updated_at } }
  const SHARED_KEY = 'trekquest_user_locations';

  const getSharedLocations = () => {
    try {
      return JSON.parse(localStorage.getItem(SHARED_KEY) || '{}');
    } catch {
      return {};
    }
  };

  const [otherUsers, setOtherUsers] = useState([]);
  const [showOtherUsers, setShowOtherUsers] = useState(true);

  // Publish this user's location to the shared pool
  const publishMyLocation = (coords) => {
    if (!user?.id || !coords) return;
    const pool = getSharedLocations();
    pool[user.id] = {
      id: user.id,
      name: user.full_name || 'Hiker',
      photo_url: user.photo_url || '',
      lat: coords[0],
      lng: coords[1],
      updated_at: Date.now(),
    };
    try {
      localStorage.setItem(SHARED_KEY, JSON.stringify(pool));
    } catch {}
  };

  // Read all OTHER users from the shared pool (exclude self, exclude stale >5 min)
  const readOtherUsers = () => {
    const pool = getSharedLocations();
    const now = Date.now();
    const STALE_MS = 5 * 60 * 1000; // 5 minutes
    const others = Object.values(pool).filter(
      (u) => u.id !== user?.id && (now - (u.updated_at || 0)) < STALE_MS
    );
    setOtherUsers(others);
  };

  // Publish my position whenever GPS updates
  useEffect(() => {
    if (position && user?.id) {
      publishMyLocation(position);
    }
  }, [position, user?.id]);

  // Poll for other users every 5 seconds + listen for instant cross-tab storage events
  useEffect(() => {
    readOtherUsers();
    locationShareIntervalRef.current = setInterval(readOtherUsers, 5000);

    const handleStorageChange = (e) => {
      if (e.key === SHARED_KEY) {
        readOtherUsers();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (locationShareIntervalRef.current) clearInterval(locationShareIntervalRef.current);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user?.id]);

  // Remove my entry from the pool when component unmounts (user leaves map)
  useEffect(() => {
    return () => {
      if (!user?.id) return;
      try {
        const pool = getSharedLocations();
        delete pool[user.id];
        localStorage.setItem(SHARED_KEY, JSON.stringify(pool));
      } catch {}
    };
  }, [user?.id]);

  // Create avatar icon for other users
  const createOtherUserIcon = (userData) => {
    const { name, photo_url } = userData;
    const initial = (name || '?').charAt(0).toUpperCase();
    const size = 46;
    const half = size / 2;
    const innerSize = 32;
    const imgTag = photo_url
      ? `<img src="${photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.style.display='none';this.nextSibling.style.display='flex';" />
         <span style="display:none;width:100%;height:100%;border-radius:50%;background:#7c3aed;color:white;font-weight:900;font-size:${innerSize * 0.42}px;align-items:center;justify-content:center;">${initial}</span>`
      : `<span style="display:flex;width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:white;font-weight:900;font-size:${innerSize * 0.42}px;align-items:center;justify-content:center;">${initial}</span>`;
    return L.divIcon({
      html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(124,58,237,0.35);animation:pulseRing 2.2s ease-out infinite;"></div>
        <div style="position:relative;width:${innerSize}px;height:${innerSize}px;border-radius:50%;overflow:hidden;border:2.5px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.55);background:#7c3aed;display:flex;align-items:center;justify-content:center;">
          ${imgTag}
        </div>
        <div style="position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid white;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));"></div>
      </div>`,
      className: '',
      iconSize: [size, size + 7],
      iconAnchor: [half, size + 7],
    });
  };

  // Check URL parameters if arrived with ?drawer=routes or from mountain search
  useEffect(() => {
    if (searchParams.get('drawer') === 'routes') {
      setShowSavedRoutes(true);
    }
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const destName = searchParams.get('destName');
    if (!isNaN(lat) && !isNaN(lng)) {
      const destObj = {
        id: 'dest_peak',
        name: destName || 'Summit Peak',
        lat,
        lng,
        isDest: true,
        type: 'Mountain Peak',
        region: 'Philippines',
      };
      setWaypoints([destObj]);
      setSelectedDestination(destObj);
      setShowHikeInfo(true);
    }
  }, [searchParams]);

  // ── BROAD SEARCH: Immediate letter-matching + Nominatim places ─────
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    searchBroadPlaces(q).then((instant) => {
      setSearchResults(instant);
    });

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const fullResults = await searchBroadPlaces(q);
        setSearchResults(fullResults);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Destination selection (via Search, Plan Route Modal, or Peak Marker)
  // Accepts destination AND optional user-chosen starting point!
  const handleSelectDestination = (dest, customStart = null) => {
    if (customStart && Array.isArray(customStart)) {
      setCustomStart(customStart);
      setStartMode('custom');
      setPosition(customStart);
    }

    const origin = customStart || (startMode === 'custom' && customStart ? customStart : position);
    const distKm = origin
      ? haversine(origin, [dest.lat, dest.lng])
      : parseFloat(dest.distanceKm || 5);
    const estHours = Math.max(0.4, distKm / 3.5).toFixed(1);
    const fullDest = { ...dest, distanceKm: distKm.toFixed(2), estHours };

    setSelectedDestination(fullDest);
    const newWp = {
      id: `dest_${Date.now()}`,
      name: dest.name,
      lat: dest.lat,
      lng: dest.lng,
      isDest: true,
      type: dest.type,
      region: dest.region,
    };
    setWaypoints((prev) => [...prev.filter((w) => !w.isDest), newWp]);
    setSearchQuery('');
    setSearchResults([]);
    setShowPlanRouteModal(false);
    setShowHikeInfo(false);
    setShowHikePreStart(true); // Show the cinematic info screen FIRST
    setLocationToast(customStart ? `📍 Route planned: Custom Start → ${dest.name}` : `📍 Destination set: ${dest.name}`);
    setTimeout(() => setLocationToast(''), 3500);
  };

  // Called from HikePreStartModal START button — launches the ActiveHikeHUD
  const handleStartHikeFromPreStart = (dest) => {
    setShowHikePreStart(false);
    setActiveHikeDestination(dest);
    setTracking(true);
    setTrackPath(position ? [position] : []);
    setShowHikeInfo(false);
    setLocationToast('🚶 Live Hike Started! Follow the blue dashed line.');
    setTimeout(() => setLocationToast(''), 4000);
  };

  // Live Continuous High-Accuracy GPS Tracking
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newCoords);
        localStorage.setItem('trekquest_current_coords', JSON.stringify(newCoords));

        if (tracking) {
          setTrackPath((prev) => [...prev, newCoords]);
        }
      },
      (err) => console.warn('GPS watch error:', err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [tracking]);

  // Hike Timer
  useEffect(() => {
    if (!tracking) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [tracking]);

  // Device Orientation for Digital Compass
  useEffect(() => {
    const handleOrientation = (e) => {
      if (e.webkitCompassHeading) {
        setCompassHeading(Math.round(e.webkitCompassHeading));
      } else if (e.alpha !== null) {
        setCompassHeading(Math.round(360 - e.alpha));
      }
    };
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const locateUserPosition = () => {
    if (!('geolocation' in navigator)) {
      setLocationToast('Geolocation is not supported by your browser');
      setTimeout(() => setLocationToast(''), 3000);
      return;
    }
    setIsLocating(true);
    setLocationToast('Locating your position…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        localStorage.setItem('trekquest_current_coords', JSON.stringify(coords));
        localStorage.removeItem('trekquest_custom_location');
        setIsLocating(false);
        setLocatePing(true);
        setTimeout(() => setLocatePing(false), 6000);
        setLocationToast(`🛰️ GPS Fix: ${coords[0].toFixed(4)}°, ${coords[1].toFixed(4)}° (Satellite • 0 Load Needed)`);
        setTimeout(() => setLocationToast(''), 4000);
      },
      (err) => {
        setIsLocating(false);
        setLocationToast('⚠️ GPS Note: Ensure Location/GPS is ON in your phone settings (0 load needed)');
        setTimeout(() => setLocationToast(''), 4000);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };


  const saveProfileChanges = async () => {
    try {
      if (updateProfile) {
        await updateProfile({ full_name: editName, photo_url: editPhoto });
      }
    } catch {}
    setShowEditProfileModal(false);
  };

  const handleMapClick = (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (startMode === 'custom' && !customStart) {
      setCustomStart([lat, lng]);
      return;
    }

    // Add new waypoint or destination
    const isFirst = waypoints.length === 0;
    const newWp = {
      id: `wp_${Date.now()}`,
      name: isFirst ? 'Destination' : `Waypoint ${waypoints.length + 1}`,
      lat,
      lng,
      isDest: isFirst,
    };
    setWaypoints((prev) => [...prev, newWp]);
  };

  const startPoint = startMode === 'custom' && customStart ? customStart : position;
  const activeDest = activeHikeDestination || selectedDestination || waypoints.find((w) => w.isDest);

  // Live real-time distance and compass bearing from hiker's live position to destination
  const distToDest = (position && activeDest)
    ? haversine(position, [activeDest.lat, activeDest.lng])
    : 0;
  const bearingToDest = (position && activeDest)
    ? calculateBearing(position, [activeDest.lat, activeDest.lng])
    : 0;
  const cardinalDirection = getCompassDirection(bearingToDest);

  // Continuous trail line: Hiker's Live GPS Coordinates -> Intermediate Waypoints -> Specific Destination
  const routePoints = useMemo(() => {
    if (!startPoint) return [];
    const pts = [startPoint];
    const intermediates = waypoints.filter((w) => !w.isDest);
    for (const w of intermediates) {
      pts.push([w.lat, w.lng]);
    }
    if (activeDest) {
      pts.push([activeDest.lat, activeDest.lng]);
    } else {
      const destWp = waypoints.find((w) => w.isDest);
      if (destWp) pts.push([destWp.lat, destWp.lng]);
    }
    return pts.filter(Boolean);
  }, [startPoint, waypoints, activeDest]);

  const totalDistanceKm = routeDistance(tracking ? trackPath : routePoints);

  const saveCurrentRoute = () => {
    if (!routeNameInput.trim()) return;
    const newRoute = {
      id: `route_${Date.now()}`,
      name: routeNameInput.trim(),
      start: startPoint,
      waypoints: [...waypoints],
      distance: totalDistanceKm.toFixed(2),
      createdAt: new Date().toLocaleDateString(),
    };
    const updated = [newRoute, ...savedRoutes];
    setSavedRoutes(updated);
    localStorage.setItem('trekquest_saved_routes', JSON.stringify(updated));
    setShowSaveRouteModal(false);
    setRouteNameInput('');
  };

  const loadSavedRoute = (route) => {
    setWaypoints(route.waypoints || []);
    if (route.start) {
      setCustomStart(route.start);
      setStartMode('custom');
    }
    if (route.waypoints?.[0]) {
      setPosition([route.waypoints[0].lat, route.waypoints[0].lng]);
    } else if (route.start) {
      setPosition(route.start);
    }
    setShowSavedRoutes(false);
  };

  const deleteSavedRoute = (id) => {
    if (window.confirm('Delete this saved route?')) {
      const updated = savedRoutes.filter((r) => r.id !== id);
      setSavedRoutes(updated);
      localStorage.setItem('trekquest_saved_routes', JSON.stringify(updated));
    }
  };

  const openEditRouteModal = (route, e) => {
    if (e) e.stopPropagation();
    setEditingRoute(route);
    setEditRouteName(route.name);
  };

  const saveEditedRouteName = () => {
    if (!editingRoute || !editRouteName.trim()) return;
    const updated = savedRoutes.map((r) =>
      r.id === editingRoute.id ? { ...r, name: editRouteName.trim() } : r
    );
    setSavedRoutes(updated);
    localStorage.setItem('trekquest_saved_routes', JSON.stringify(updated));
    setEditingRoute(null);
  };

  const editRouteOnMap = (route) => {
    loadSavedRoute(route);
    setEditingRoute(null);
    setShowSavedRoutes(false);
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setCapturedPhoto({
        url: dataUrl,
        lat: position?.[0],
        lng: position?.[1],
        time: new Date().toLocaleTimeString(),
      });
    };
    reader.readAsDataURL(file);
  };

  const saveTrailNote = async () => {
    if (!trailNoteText.trim()) return;
    try {
      await base44.entities.JournalEntry.create({
        title: `Trail Note @ ${new Date().toLocaleTimeString()}`,
        location: `GPS: ${position?.[0]?.toFixed(4)}, ${position?.[1]?.toFixed(4)}`,
        notes: trailNoteText,
        photo_url: capturedPhoto?.url || null,
        date: new Date().toISOString().slice(0, 10),
      });
    } catch {}
    setShowNoteModal(false);
    setTrailNoteText('');
  };

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col bg-slate-950 overflow-hidden">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoCapture}
      />

      {/* Realistic Map Component */}
      <div className="relative flex-1 w-full h-full">
        <MapContainer
          center={position || defaultCenter}
          zoom={14}
          zoomControl={false}
          className="w-full h-full"
        >
          {/* Layer 1: Realistic Satellite View (Esri World Imagery) */}
          {mapStyle === 'satellite' && (
            <TileLayer
              key="satellite"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri World Imagery"
              maxZoom={19}
            />
          )}

          {/* Layer 2: Mountain Topographic (OpenTopoMap) */}
          {mapStyle === 'topo' && (
            <TileLayer
              key="topo"
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenTopoMap"
              maxZoom={17}
            />
          )}

          {/* Layer 3: Outdoor Street/Trail (OpenStreetMap) */}
          {mapStyle === 'streets' && (
            <TileLayer
              key="streets"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
              maxZoom={19}
            />
          )}

          <MapClickHandler onClick={handleMapClick} />
          <MapControllerInstance
            mapRef={mapInstanceRef}
            onBoundsChange={setCurrentMapBounds}
            onDragStart={() => setFollowUser(false)}
          />
          {position && <RecenterMap position={position} followUser={followUser} />}
          <FitRouteBounds destination={selectedDestination} startPoint={startPoint} />

          {/* User Live GPS Marker (Avatar with Orientation Compass Cone) */}
          {position && (
            <Marker position={position} icon={userMapIcon}>
              <Popup>
                <div className="text-xs font-semibold">
                  <p className="text-emerald-500 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    You are here
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {position[0].toFixed(5)}, {position[1].toFixed(5)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Heading: {compassHeading}° • Satellite GPS Active
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Custom Starting Point Marker */}
          {startMode === 'custom' && customStart && (
            <Marker position={customStart} icon={startIcon}>
              <Popup>
                <div className="text-xs font-bold text-emerald-700">Custom Starting Point</div>
              </Popup>
            </Marker>
          )}

          {/* Waypoints & Destination (Tappable & Editable) */}
          {waypoints.map((wp) => (
            <Marker
              key={wp.id}
              position={[wp.lat, wp.lng]}
              icon={waypointIcon(wp.name, wp.isDest)}
              eventHandlers={{
                click: () => {
                  if (wp.isDest) {
                    setSelectedDestination(wp);
                    setShowHikeInfo(true);
                  } else {
                    setEditingWaypoint(wp);
                  }
                },
              }}
            />
          ))}

          {/* High-Visibility Dual-Layer Trail Guidance Line to Specific Destination */}
          {routePoints.length >= 2 && (
            <>
              {/* Layer 1: Wide neon halo for mountain and terrain contrast */}
              <Polyline
                positions={routePoints}
                pathOptions={{
                  color: mapStyle === 'satellite' ? '#0284c7' : '#047857',
                  weight: 10,
                  opacity: 0.5,
                }}
              />
              {/* Layer 2: High-contrast dashed line connecting hiker directly to destination */}
              <Polyline
                positions={routePoints}
                pathOptions={{
                  color: mapStyle === 'satellite' ? '#38bdf8' : '#10b981',
                  weight: 5,
                  dashArray: '10, 10',
                  opacity: 0.98,
                }}
              />
            </>
          )}

          {/* Other Users' Live GPS Markers */}
          {showOtherUsers && otherUsers.map((u) => (
            <Marker
              key={u.id}
              position={[u.lat, u.lng]}
              icon={createOtherUserIcon(u)}
            >
              <Popup>
                <div className="text-xs font-semibold space-y-1">
                  <p className="text-violet-600 font-bold">{u.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {u.lat.toFixed(5)}, {u.lng.toFixed(5)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Last seen: {Math.round((Date.now() - u.updated_at) / 1000)}s ago
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Active Hike Walked Track */}
          {trackPath.length >= 2 && (
            <Polyline
              positions={trackPath}
              pathOptions={{
                color: '#ef4444',
                weight: 5,
                opacity: 0.95,
              }}
            />
          )}
        </MapContainer>

        {/* Top Controls: Hamburger Menu, Broad Location Search Bar & Other Hikers / Routes */}
        <div className="absolute top-4 inset-x-4 z-[1000] flex items-center gap-2 pointer-events-none">
          {/* Left side: Hamburger button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-11 h-11 rounded-2xl bg-black/80 hover:bg-black text-white border border-white/20 shadow-xl backdrop-blur-md cursor-pointer active:scale-90 transition flex items-center justify-center shrink-0 pointer-events-auto"
            title="Open Menu"
          >
            <Menu size={20} />
          </button>

          {/* Broad Location Search Bar (Places, Cities, Barangays, Trails) */}
          <div className="relative flex-1 pointer-events-auto">
            <div className="w-full bg-black/85 hover:bg-black/95 backdrop-blur-md text-white rounded-full px-4 py-2.5 flex items-center justify-between border border-white/20 shadow-2xl transition">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place, city, barangay, or trail…"
                className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full pr-2"
              />
              {isSearching ? (
                <RefreshCw size={16} className="text-slate-400 animate-spin shrink-0" />
              ) : searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white shrink-0"
                >
                  <X size={16} />
                </button>
              ) : (
                <Search size={16} className="text-slate-400 shrink-0" />
              )}
            </div>

            {/* Broad Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 inset-x-0 bg-slate-900/95 border border-white/20 rounded-3xl p-2.5 shadow-2xl backdrop-blur-2xl max-h-72 overflow-y-auto space-y-1.5 z-[1500]">
                <div className="px-3 py-1 flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-white/10 pb-1">
                  <span>PLACES &amp; DESTINATIONS</span>
                  <span>{searchResults.length} matching</span>
                </div>
                {searchResults.map((m, i) => {
                  const dist = position ? haversine(position, [m.lat, m.lng]) : 0;
                  const getBadge = (t) => {
                    if (t === 'Barangay') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    if (t === 'City') return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                    if (t === 'Municipality') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
                    if (t === 'Mountain Peak') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                    return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                  };
                  return (
                    <div
                      key={i}
                      onClick={() => handleSelectDestination(m)}
                      className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-[0.99] transition cursor-pointer flex items-center justify-between text-white group"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-xs text-white group-hover:text-emerald-400 transition truncate">
                            {m.name}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getBadge(m.type)}`}>
                            {m.type || 'Location'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{m.region}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          {dist > 0 ? `${dist.toFixed(1)} km` : 'Local'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
            {/* Offline Maps Download & Management Button */}
            <button
              onClick={() => setShowOfflineModal(true)}
              className={`h-10 px-2.5 sm:px-3 rounded-2xl flex items-center gap-1.5 text-xs font-bold border shadow-xl backdrop-blur-md active:scale-95 transition cursor-pointer ${
                !isOnline
                  ? 'bg-amber-600/90 hover:bg-amber-600 border-amber-400 text-white shadow-amber-900/50'
                  : 'bg-black/80 hover:bg-black border-white/20 text-emerald-400 hover:text-white'
              }`}
              title="Download & Manage Offline Maps"
            >
              {!isOnline ? <CloudOff size={14} className="text-white animate-pulse" /> : <Download size={14} />}
              <span className="hidden sm:inline">Offline</span>
            </button>

            {/* Other Users Toggle Button with count badge */}
            <div className="relative">
              <button
                onClick={() => setShowOtherUsers((v) => !v)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-2xl border transition cursor-pointer active:scale-90 ${
                  showOtherUsers
                    ? 'bg-violet-600/90 border-violet-400 text-white'
                    : 'bg-black/80 border-white/20 text-slate-400 hover:text-white'
                }`}
                title={showOtherUsers ? 'Hide other hikers on map' : 'Show other hikers on map'}
              >
                <Users size={16} />
              </button>
              {otherUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center border border-black shadow">
                  {otherUsers.length}
                </span>
              )}
            </div>

            <button
              onClick={() => setShowSavedRoutes(true)}
              className="h-10 px-3 rounded-2xl bg-black/80 hover:bg-black text-white text-xs font-bold border border-white/20 shadow-xl backdrop-blur-md flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <Navigation size={13} className="text-emerald-400" />
              <span className="hidden sm:inline">Routes</span> ({savedRoutes.length})
            </button>
          </div>
        </div>

        {/* ── THREE FULLY WORKING MAP CHOICES SWITCHER & STATUS ───────────────────────── */}
        <div className="absolute top-18 left-4 z-[990] flex items-center gap-2 pointer-events-auto">
          <div className="flex bg-black/80 backdrop-blur-md rounded-2xl p-1 border border-white/20 shadow-2xl">
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mapStyle === 'satellite'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Realistic Satellite Imagery"
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setMapStyle('topo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mapStyle === 'topo'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Mountain Topographic Contours"
            >
              🏔️ Topo
            </button>
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                mapStyle === 'streets'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Outdoor Street & Trail View"
            >
              🗺️ Outdoor
            </button>
          </div>

          {/* Online / Offline Status Badge */}
          <div
            onClick={() => setShowOfflineModal(true)}
            className="flex items-center gap-1.5 bg-black/80 hover:bg-black/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-white/20 text-[11px] font-bold shadow-xl transition cursor-pointer"
            title="Map Sync Status (Tap to open Offline Maps)"
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            <span className={isOnline ? 'text-slate-300' : 'text-amber-300 font-extrabold'}>
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>
          </div>
        </div>

        {/* ── FLOATING DESTINATION GUIDANCE BANNER (Shows destination name, distance & bearing along the line) ── */}
        {activeDest && !tracking && (
          <div className="absolute top-30 inset-x-4 max-w-lg mx-auto z-[995] bg-slate-950/90 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3 shadow-2xl text-white pointer-events-auto flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Mountain size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-xs text-white truncate max-w-[150px] sm:max-w-[210px]">
                    {activeDest.name}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {distToDest.toFixed(2)} km
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 flex items-center gap-1">
                  <Navigation size={10} className="text-emerald-400 rotate-45" />
                  <span>Bearing {bearingToDest}° {cardinalDirection} • Follow line to summit</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setShowOfflineModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Download route map for offline hiking"
              >
                <Download size={11} /> Cache
              </button>
              <button
                onClick={() => {
                  if (mapInstanceRef.current && position && activeDest) {
                    const b = L.latLngBounds([position, [activeDest.lat, activeDest.lng]]);
                    mapInstanceRef.current.fitBounds(b, { padding: [80, 80], maxZoom: 16 });
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                title="Zoom to see full line from you to destination"
              >
                <Eye size={11} /> Focus
              </button>
            </div>
          </div>
        )}

        {/* ── FLOATING RECENTER ON ME PILL (Appears when hiker panned the map away) ── */}
        {!followUser && position && (
          <button
            onClick={() => {
              setFollowUser(true);
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(position, Math.max(mapInstanceRef.current.getZoom(), 15), { duration: 0.8 });
              }
            }}
            className="absolute bottom-24 right-4 z-[1000] px-3.5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xl border border-white/20 flex items-center gap-1.5 active:scale-95 transition pointer-events-auto cursor-pointer animate-in fade-in slide-in-from-bottom-2"
          >
            <Target size={15} />
            <span>Recenter on Me</span>
          </button>
        )}

        {/* Location Toast Notification */}
        {locationToast && (
          <div className="absolute top-20 inset-x-0 mx-auto w-fit z-[1500] px-4 py-2 rounded-full bg-black/90 text-white border border-emerald-400/60 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 animate-bounce">
            <LocateFixed size={14} className="text-emerald-400" />
            <span>{locationToast}</span>
          </div>
        )}

        {/* Other Hikers Online Notification (shown when others are visible) */}
        {showOtherUsers && otherUsers.length > 0 && !locationToast && (
          <div className="absolute top-20 inset-x-0 mx-auto w-fit z-[1400] px-4 py-2 rounded-full bg-violet-900/90 text-white border border-violet-400/60 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2">
            <Users size={13} className="text-violet-300" />
            <span>{otherUsers.length} hiker{otherUsers.length > 1 ? 's' : ''} visible on map — tap icon to track</span>
          </div>
        )}

        {/* Right-Side Floating Action Buttons (Locate GPS, Music, Compass, Camera) */}
        <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-3">
          {/* GPS Locate Me Button */}
          <button
            onClick={locateUserPosition}
            disabled={isLocating}
            className={`w-12 h-12 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20 active:scale-90 transition cursor-pointer hover:border-emerald-400 group ${
              isLocating ? 'animate-pulse border-emerald-400' : ''
            }`}
            title="Locate My Position"
          >
            {isLocating ? (
              <RefreshCw size={22} className="text-emerald-400 animate-spin" />
            ) : (
              <LocateFixed size={22} className="text-emerald-400 group-hover:scale-110 transition" />
            )}
          </button>

          {/* Music Player Button */}
          <button
            onClick={() => setShowMusicModal(true)}
            className="w-12 h-12 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20 active:scale-90 transition cursor-pointer hover:border-purple-400/80 group"
            title="Offline Music Player"
          >
            <Music size={22} className="group-hover:scale-110 transition" />
          </button>

          {/* Compass Button */}
          <button
            onClick={() => setShowCompassModal(true)}
            className="w-12 h-12 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20 active:scale-90 transition cursor-pointer hover:border-sky-400/80 group"
            title="Digital Compass"
          >
            <CompassIcon size={22} className="group-hover:scale-110 transition" />
          </button>

          {/* Camera / Plant Scanner Button */}
          <button
            onClick={() => setShowScannerModal(true)}
            className="w-12 h-12 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20 active:scale-90 transition cursor-pointer hover:border-emerald-400/80 group"
            title="Camera Plant Scanner"
          >
            <Scan size={22} className="group-hover:scale-110 transition" />
          </button>
        </div>

        {/* Starting Point Mode Toggle Bar */}
        <div className="absolute top-32 left-4 right-20 sm:right-auto sm:max-w-md z-[990] flex items-center justify-between bg-black/75 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-2 shadow-lg text-white">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-300">Start from:</span>
            <button
              onClick={() => {
                setStartMode('gps');
                setCustomStart(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                startMode === 'gps' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-300'
              }`}
            >
              📍 My GPS
            </button>
            <button
              onClick={() => setStartMode('custom')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                startMode === 'custom' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-300'
              }`}
            >
              🎯 Tap Map
            </button>
          </div>

          {waypoints.length > 0 && (
            <button
              onClick={() => setShowSaveRouteModal(true)}
              className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 hover:underline"
            >
              <Save size={12} /> Save
            </button>
          )}
        </div>

        {/* ── ACTIVE HIKE HUD OVERLAY (Full Featured — replaces old basic panel) ── */}
        {tracking && activeHikeDestination && (
          <ActiveHikeHUD
            destination={activeHikeDestination}
            currentPosition={position}
            onStopHike={() => {
              setTracking(false);
              setActiveHikeDestination(null);
              setTrackPath([]);
              setElapsedSeconds(0);
              setLocationToast('⏹️ Hike ended');
              setTimeout(() => setLocationToast(''), 3000);
            }}
            onOpenScanner={() => setShowScannerModal(true)}
            onOpenMusic={() => setShowMusicModal(true)}
            onOpenCompass={() => setShowCompassModal(true)}
            onOpenEmergency={() => { setSidebarOpen(false); navigate('/emergency'); }}
            onOpenOfflineMaps={() => setShowOfflineModal(true)}
          />
        )}

        {/* ── HIKE INFORMATION GUIDE CARD ───────────────────────────────── */}
        {selectedDestination && showHikeInfo && !tracking && (
          <HikeInformationCard
            destination={selectedDestination}
            currentPosition={startPoint}
            isTracking={tracking}
            elapsedSeconds={elapsedSeconds}
            onStartTracking={() => {
              // Show the cinematic HikePreStartModal before actually starting
              setShowHikeInfo(false);
              setShowHikePreStart(true);
            }}
            onStopTracking={() => {
              setTracking(false);
              setActiveHikeDestination(null);
              setLocationToast('⏹️ Hike Tracking Stopped');
              setTimeout(() => setLocationToast(''), 3000);
            }}
            onRecenterRoute={() => {
              if (startPoint && selectedDestination) {
                setPosition(startPoint);
              }
            }}
            onClearRoute={() => {
              setSelectedDestination(null);
              setWaypoints((prev) => prev.filter((w) => !w.isDest));
              setShowHikeInfo(false);
              setTracking(false);
              setActiveHikeDestination(null);
              setTrackPath([]);
              setLocationToast('Route cleared');
              setTimeout(() => setLocationToast(''), 2000);
            }}
            onClose={() => setShowHikeInfo(false)}
          />
        )}

        {/* 4. Bottom Weather & Plan a Route Drawer (Shown when hike info card is closed) */}
        {!showHikeInfo && (
          <WeatherPlanDrawer
            isOpen={showWeatherDrawer}
            onOpen={() => setShowWeatherDrawer(true)}
            onClose={() => setShowWeatherDrawer(false)}
            onOpenWeather={() => setShowWeatherModal(true)}
            onOpenPlanRoute={() => setShowPlanRouteModal(true)}
            temp={24}
            condition="Partly cloudy"
            high={31}
            low={22}
            locationName={selectedDestination?.name || 'Current location'}
          />
        )}
      </div>

      {/* Weather Screen Modal (Matches Picture 4) */}
      {showWeatherModal && (
        <WeatherModal onClose={() => setShowWeatherModal(false)} />
      )}

      {/* Plan a Route Screen Modal */}
      {showPlanRouteModal && (
        <PlanRouteModal
          onClose={() => setShowPlanRouteModal(false)}
          onStartRoute={handleSelectDestination}
        />
      )}

      {/* ── CINEMATIC HIKE PRE-START INFO SCREEN ──────────────────────── */}
      {showHikePreStart && selectedDestination && (
        <HikePreStartModal
          destination={selectedDestination}
          currentPosition={position}
          onClose={() => {
            setShowHikePreStart(false);
            setShowHikeInfo(true); // Fall back to bottom card if user closes
          }}
          onStartHike={handleStartHikeFromPreStart}
          onOpenOfflineMaps={() => setShowOfflineModal(true)}
        />
      )}

      {/* Photo Capture Modal / Action Confirmation */}
      {capturedPhoto && (
        <div className="fixed inset-0 z-[2600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check size={14} /> Photo Tagged to GPS Waypoint!
              </span>
              <button onClick={() => setCapturedPhoto(null)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <img
              src={capturedPhoto.url}
              alt="Trail Capture"
              className="w-full h-44 object-cover rounded-2xl border border-white/10"
            />

            <p className="text-[11px] text-slate-400 font-mono">
              Captured at {capturedPhoto.time} • ({capturedPhoto.lat?.toFixed(4)}, {capturedPhoto.lng?.toFixed(4)})
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const photoUrl = capturedPhoto.url;
                  setCapturedPhoto(null);
                  navigate('/plant-scanner', { state: { photoUrl } });
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs flex items-center justify-center gap-1"
              >
                <Leaf size={14} /> Identify Plant
              </button>
              <button
                onClick={() => {
                  setTrailNoteText('Captured photo on summit ascent.');
                  setShowNoteModal(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs flex items-center justify-center gap-1"
              >
                <BookOpen size={14} /> Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Trail Note / Journal Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[2600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <BookOpen size={16} className="text-amber-400" />
                <span>Trail Note & Journal Entry</span>
              </h3>
              <button onClick={() => setShowNoteModal(false)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <textarea
              value={trailNoteText}
              onChange={(e) => setTrailNoteText(e.target.value)}
              placeholder="Jot down notes (e.g. water source spotted, steep rock scramble, resting at base camp)…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            <button
              onClick={saveTrailNote}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs active:scale-95 transition"
            >
              Save to Travel Journal
            </button>
          </div>
        </div>
      )}

      {/* Waypoint Rename & Edit Modal */}
      {editingWaypoint && (
        <div className="fixed inset-0 z-[2600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit Pin / Destination</h3>
              <button onClick={() => setEditingWaypoint(null)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-400">Waypoint Name / Label</label>
              <input
                type="text"
                value={editingWaypoint.name}
                onChange={(e) =>
                  setEditingWaypoint({ ...editingWaypoint, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white mt-1 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setWaypoints((prev) => prev.filter((w) => w.id !== editingWaypoint.id));
                  setEditingWaypoint(null);
                }}
                className="flex-1 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-red-200 font-semibold text-xs flex items-center justify-center gap-1"
              >
                <Trash2 size={14} /> Remove Pin
              </button>
              <button
                onClick={() => {
                  setWaypoints((prev) =>
                    prev.map((w) => (w.id === editingWaypoint.id ? editingWaypoint : w))
                  );
                  setEditingWaypoint(null);
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Route Modal */}
      {showSaveRouteModal && (
        <div className="fixed inset-0 z-[2600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-sm">Save This Planned Route</h3>
            <input
              type="text"
              value={routeNameInput}
              onChange={(e) => setRouteNameInput(e.target.value)}
              placeholder="e.g. Mt. Batulao Day Hike"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveRouteModal(false)}
                className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentRoute}
                className="flex-1 py-2 rounded-xl bg-emerald-600 font-bold text-xs"
              >
                Save Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Your Routes Drawer */}
      {showSavedRoutes && (
        <div className="fixed inset-0 z-[2700] bg-black/80 backdrop-blur-md flex flex-col justify-end p-0 sm:p-4">
          <div className="bg-slate-900 border-t sm:border border-slate-700 text-white rounded-t-3xl sm:rounded-3xl max-w-md w-full mx-auto p-5 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Navigation size={16} className="text-emerald-400" />
                <span>Your Saved Routes ({savedRoutes.length})</span>
              </h3>
              <button onClick={() => setShowSavedRoutes(false)} className="p-1.5 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Tap any route to view on map, or use Edit to rename or modify trail waypoints.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-0.5">
              {savedRoutes.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Navigation size={28} className="mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400">
                    No saved routes yet. Pin destinations & waypoints on the map, then tap Save Route.
                  </p>
                </div>
              ) : (
                savedRoutes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => loadSavedRoute(r)}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 hover:bg-white/10 active:scale-[0.99] transition cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-white truncate group-hover:text-emerald-400 transition">{r.name}</h4>
                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                        {r.distance} km • {r.waypoints?.length || 0} waypoints • {r.createdAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => loadSavedRoute(r)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold active:scale-95 transition"
                        title="View on Map"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => openEditRouteModal(r, e)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition active:scale-95"
                        title="Edit Route"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteSavedRoute(r.id)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition active:scale-95"
                        title="Delete Route"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {editingRoute && (
        <div className="fixed inset-0 z-[2800] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 size={16} className="text-emerald-400" />
                <span>Edit Route</span>
              </h3>
              <button onClick={() => setEditingRoute(null)} className="p-1 text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-bold">Route Name</label>
              <input
                value={editRouteName}
                onChange={(e) => setEditRouteName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={saveEditedRouteName}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-95 transition"
              >
                Save Name
              </button>
              <button
                onClick={() => editRouteOnMap(editingRoute)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <MapIcon size={14} className="text-emerald-400" />
                Edit Waypoints on Live Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar Menu (Matches User Screenshot Exactly) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 z-[2600] w-[340px] max-w-[85vw] bg-[#12261c] text-white p-4 overflow-y-auto no-scrollbar sidebar-drawer [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] transition-transform duration-300 ease-out shadow-2xl flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="space-y-3">
          {/* Top Close Button on Mobile */}
          <div className="flex justify-end pb-1">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 active:scale-90 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Profile Card (White Card with Dark Avatar & 'Edit profile >') */}
          <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-xl text-center flex flex-col items-center">
            {/* Circular Dark Avatar with Letter */}
            <div className="w-20 h-20 rounded-full bg-[#182a20] text-white text-3xl font-bold flex items-center justify-center overflow-hidden border-2 border-[#243f30] shadow-md mb-3">
              {user?.photo_url ? (
                <img src={user.photo_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>

            {/* User Full Name */}
            <h3 className="font-bold text-base leading-tight text-slate-900">
              {displayName}
            </h3>

            {/* Email */}
            <p className="text-[11px] text-slate-500 mt-1 break-all">
              {displayEmail}
            </p>

            {/* Red / Coral 'Edit profile >' Link */}
            <button
              onClick={() => {
                setEditName(displayName);
                setEditPhoto(user?.photo_url || '');
                setShowEditProfileModal(true);
              }}
              className="text-xs text-red-500 font-semibold mt-3 hover:underline flex items-center gap-0.5 active:scale-95 transition cursor-pointer"
            >
              Edit profile &gt;
            </button>
          </div>

          {/* White Pill Action Cards (From User Screenshot) */}
          <div className="space-y-2 pt-1">
            {/* 1. Backpacking Guide */}
            <button
              onClick={() => { setSidebarOpen(false); navigate('/backpacking'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-emerald-400 flex items-center justify-center shrink-0">
                  <Backpack size={20} />
                </div>
                <span className="font-bold text-sm">Backpacking Guide</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>

            {/* 2. Your Routes */}
            <button
              onClick={() => {
                setSidebarOpen(false);
                setShowSavedRoutes(true);
              }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-emerald-400 flex items-center justify-center shrink-0">
                  <Navigation size={20} />
                </div>
                <span className="font-bold text-sm">Your Routes</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>

            {/* Offline Trail Maps & Caches */}
            <button
              onClick={() => {
                setSidebarOpen(false);
                setShowOfflineModal(true);
              }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-emerald-400 flex items-center justify-center shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <span className="font-bold text-sm block">Offline Trail Maps</span>
                  <span className="text-[10px] text-slate-500">Download for 0-signal hiking</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>

            {/* 3. First Aid Guide */}
            <button
              onClick={() => { setSidebarOpen(false); navigate('/first-aid'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-rose-400 flex items-center justify-center shrink-0">
                  <HeartPulse size={20} />
                </div>
                <span className="font-bold text-sm">First Aid Guide</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>

            {/* 4. Survival Manual */}
            <button
              onClick={() => { setSidebarOpen(false); navigate('/survival'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-amber-400 flex items-center justify-center shrink-0">
                  <BookOpen size={20} />
                </div>
                <span className="font-bold text-sm">Survival Manual</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>

            {/* 5. My Profile */}
            <button
              onClick={() => { setSidebarOpen(false); navigate('/profile'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-cyan-400 flex items-center justify-center shrink-0">
                  <UserRound size={20} />
                </div>
                <span className="font-bold text-sm">My Profile</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>

            {/* 6. Mountains Conquered */}
            <button
              onClick={() => { setSidebarOpen(false); navigate('/mountain-tracker'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-stone-300 flex items-center justify-center shrink-0">
                  <Mountain size={20} />
                </div>
                <span className="font-bold text-sm">Mountains Conquered</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>

            {/* 7. Emergency Info Card */}
            <button
              onClick={() => { setSidebarOpen(false); navigate('/emergency'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-red-500 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <span className="font-bold text-sm">Emergency Info Card</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t border-white/10 mt-4">
          <button
            onClick={() => { setSidebarOpen(false); logout(); }}
            className="w-full py-3 rounded-2xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition cursor-pointer"
          >
            <LogOut size={16} /> Sign Out of Clerk
          </button>
        </div>
      </div>

      {/* Music Player Modal */}
      {showMusicModal && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-xl flex flex-col">
          <MusicMode onClose={() => setShowMusicModal(false)} />
        </div>
      )}

      {/* Digital Compass Modal */}
      {showCompassModal && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCompassModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-center gap-2 text-sky-400 font-bold text-sm">
              <CompassIcon size={20} />
              <span>Trail Digital Compass</span>
            </div>

            {/* Compass Rose */}
            <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
              {/* Fixed Cardinal Markings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="absolute top-2 text-red-500 font-black text-lg">N</span>
                <span className="absolute bottom-2 text-slate-400 font-bold text-lg">S</span>
                <span className="absolute left-2 text-slate-400 font-bold text-lg">W</span>
                <span className="absolute right-2 text-slate-400 font-bold text-lg">E</span>
              </div>

              {/* Rotating Dial */}
              <div
                className="w-52 h-52 rounded-full border-4 border-slate-700 relative transition-transform duration-200"
                style={{ transform: `rotate(${-compassHeading}deg)` }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-6 bg-red-600 rounded-full" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-4 bg-slate-500 rounded-full" />
              </div>

              {/* Center Pointer */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Navigation size={32} className="text-emerald-400" style={{ transform: `rotate(${compassHeading}deg)` }} />
                <p className="text-2xl font-black mt-2 font-mono">{compassHeading}°</p>
                <p className="text-xs text-slate-400 font-bold">
                  {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(compassHeading / 45) % 8]}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
              GPS: {position ? `${position[0].toFixed(4)}°N, ${position[1].toFixed(4)}°E` : 'Locating…'}
            </div>
          </div>
        </div>
      )}

      {/* Camera Plant Scanner Modal (100% Offline Real Device Camera) */}
      {showScannerModal && (
        <CameraPlantScanner onClose={() => setShowScannerModal(false)} />
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm">Edit Profile</h3>
              <button onClick={() => setShowEditProfileModal(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-bold">Full Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveProfileChanges}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-95 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Map Downloader & Cache Manager Modal */}
      <OfflineMapModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        currentBounds={currentMapBounds}
        routePoints={routePoints}
        destination={activeDest}
        onJumpToBounds={(b) => {
          if (mapInstanceRef.current && b) {
            mapInstanceRef.current.fitBounds([[b.south, b.west], [b.north, b.east]], { padding: [40, 40] });
          }
        }}
      />
    </div>
  );
}