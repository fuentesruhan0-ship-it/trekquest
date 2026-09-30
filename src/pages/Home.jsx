import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '@/lib/AuthContext';
import CameraPlantScanner from '@/components/CameraPlantScanner';
import MusicMode from '@/pages/Music';
import {
  Menu, Search, Music, Compass as CompassIcon, Scan,
  X, ChevronRight, Backpack, Navigation, HeartPulse, BookOpen, UserRound,
  Mountain, AlertCircle, LogOut, LocateFixed, RefreshCw
} from 'lucide-react';
import WeatherPlanDrawer from '@/components/WeatherPlanDrawer';
import WeatherModal from '@/components/WeatherModal';
import PlanRouteModal from '@/components/PlanRouteModal';
import HikeInformationCard from '@/components/HikeInformationCard';
import {
  searchBroadPlaces,
  haversine
} from '@/lib/philippinePlaces';

// Custom Map Markers
function createAvatarMapIcon(photoUrl, initial, isPinging) {
  const size = isPinging ? 60 : 52;
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
  return L.divIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${ringColor};${pulse}"></div>
      ${isPinging ? `<div style="position:absolute;inset:8px;border-radius:50%;background:rgba(16,185,129,0.25);animation:pulseRing 2.2s ease-out infinite;"></div>` : ''}
      <div style="position:relative;width:${innerSize}px;height:${innerSize}px;border-radius:50%;overflow:hidden;border:2.5px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.55);background:#059669;display:flex;align-items:center;justify-content:center;">
        ${imgTag}
      </div>
      <div style="position:absolute;bottom:-3px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid white;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));"></div>
    </div>`,
    className: '',
    iconSize: [size, size + 7],
    iconAnchor: [half, size + 7],
  });
}

const destPinIcon = (name) =>
  L.divIcon({
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      <div style="padding:4px 8px;background:#e11d48;border:2.5px solid white;border-radius:12px;color:white;font-weight:bold;font-size:11px;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.55);display:flex;align-items:center;gap:4px;">
        <span>🏁</span>
        <span style="max-width:130px;overflow:hidden;text-overflow:ellipsis;">${name}</span>
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #e11d48;margin-top:-1px;"></div>
    </div>`,
    className: '',
    iconSize: [120, 32],
    iconAnchor: [60, 32],
  });

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function Home() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();

  // Location & Map State
  const defaultCoords = [14.0436, 120.8031]; // Batulao / Batangas area
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('trekquest_current_coords');
      return saved ? JSON.parse(saved) : defaultCoords;
    } catch {
      return defaultCoords;
    }
  });

  const [mapCenter, setMapCenter] = useState(position);
  const [mapZoom, setMapZoom] = useState(13);

  // ── 3 FULLY WORKING MAP CHOICES: Satellite / Topo / Outdoor ───────────
  const [mapStyle, setMapStyle] = useState(() => {
    try {
      return localStorage.getItem('trekquest_map_style') || 'satellite';
    } catch {
      return 'satellite';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('trekquest_map_style', mapStyle);
    } catch {}
  }, [mapStyle]);

  // Destination & Planned Route
  const [destination, setDestination] = useState(null);
  const [showHikeInfo, setShowHikeInfo] = useState(false);

  // Active Hike GPS Tracking
  const [isTrackingHike, setIsTrackingHike] = useState(false);
  const [hikeTrack, setHikeTrack] = useState([]);
  const [hikeElapsedSeconds, setHikeElapsedSeconds] = useState(0);

  // UI Drawer & Modals State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showCompassModal, setShowCompassModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showWeatherDrawer, setShowWeatherDrawer] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showPlanRouteModal, setShowPlanRouteModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locatePing, setLocatePing] = useState(false);
  const [locationToast, setLocationToast] = useState('');

  // Broad Search State (Letter-by-letter broad location / city / barangay search)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Compass state
  const [compassHeading, setCompassHeading] = useState(42);

  // Edit Profile Form
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editPhoto, setEditPhoto] = useState(user?.photo_url || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Save profile changes to AuthContext + localStorage
  const saveProfileChanges = async () => {
    if (!editName.trim()) return;
    setIsSavingProfile(true);
    try {
      await updateProfile({ full_name: editName.trim(), photo_url: editPhoto });
      setProfileSaved(true);
      setTimeout(() => {
        setProfileSaved(false);
        setShowEditProfileModal(false);
      }, 1200);
    } catch (e) {
      console.warn('Profile save error:', e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const openEditProfile = () => {
    setEditName(user?.full_name || '');
    setEditPhoto(user?.photo_url || '');
    setProfileSaved(false);
    setShowEditProfileModal(true);
  };

  // Dynamic user avatar map icon
  const userMapIcon = useMemo(() => {
    const photo = user?.photo_url || '';
    const initial = (user?.full_name || 'H').charAt(0).toUpperCase();
    return createAvatarMapIcon(photo, initial, locatePing);
  }, [user?.photo_url, user?.full_name, locatePing]);

  // Live Continuous GPS Tracking & Location Sync
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = [pos.coords.latitude, pos.coords.longitude];
        const hasCustom = localStorage.getItem('trekquest_custom_location');
        if (!hasCustom) {
          setPosition(newCoords);
          localStorage.setItem('trekquest_current_coords', JSON.stringify(newCoords));
        }
        if (isTrackingHike) {
          setHikeTrack((prev) => [...prev, newCoords]);
        }
      },
      (err) => console.log('GPS tracking status:', err.message),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTrackingHike]);

  // Active Hike Timer
  useEffect(() => {
    if (!isTrackingHike) return;
    const interval = setInterval(() => {
      setHikeElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTrackingHike]);

  // Listen to custom location changes
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('trekquest_current_coords');
        if (saved) {
          const coords = JSON.parse(saved);
          setPosition(coords);
          setMapCenter(coords);
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── BROAD SEARCH: Immediate letter-matching + Nominatim places ─────
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Immediate instant results for first keystrokes
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

  // Compass Sensor Listeners
  useEffect(() => {
    const handleOrientation = (e) => {
      let h = null;
      if (e.webkitCompassHeading != null) h = e.webkitCompassHeading;
      else if (e.alpha != null) h = 360 - e.alpha;
      if (h != null) setCompassHeading(Math.round(h));
    };
    if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  // Handle destination selection (via Search, Plan Route Modal, or Peak Marker)
  const handleSelectDestination = (dest) => {
    setDestination(dest);
    setShowHikeInfo(true);
    setSearchQuery('');
    setSearchResults([]);
    setShowPlanRouteModal(false);

    if (position && dest.lat && dest.lng) {
      const midLat = (position[0] + dest.lat) / 2;
      const midLng = (position[1] + dest.lng) / 2;
      setMapCenter([midLat, midLng]);
      const dist = haversine(position, [dest.lat, dest.lng]);
      setMapZoom(dist > 50 ? 9 : dist > 20 ? 11 : dist > 8 ? 12 : 14);
    } else if (dest.lat && dest.lng) {
      setMapCenter([dest.lat, dest.lng]);
      setMapZoom(14);
    }
  };

  const locateUserPosition = () => {
    if (!('geolocation' in navigator)) {
      setLocationToast('⚠️ Geolocation not supported by your browser');
      setTimeout(() => setLocationToast(''), 3000);
      return;
    }

    setIsLocating(true);
    setLocationToast('🔍 Locating your GPS position…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newCoords);
        setMapCenter(newCoords);
        setMapZoom(16);
        localStorage.setItem('trekquest_current_coords', JSON.stringify(newCoords));
        localStorage.removeItem('trekquest_custom_location');

        setLocatePing(true);
        setTimeout(() => setLocatePing(false), 4500);

        setLocationToast(`📍 Located: ${newCoords[0].toFixed(4)}°, ${newCoords[1].toFixed(4)}°`);
        setTimeout(() => setLocationToast(''), 3500);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation notice:', err.message);
        setMapCenter(position);
        setMapZoom(16);
        setLocatePing(true);
        setTimeout(() => setLocatePing(false), 3500);
        setLocationToast(`📍 Pointed to coordinates: ${position[0].toFixed(4)}°, ${position[1].toFixed(4)}°`);
        setTimeout(() => setLocationToast(''), 3500);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const displayName = user?.full_name || 'Hiker';
  const displayEmail = user?.email || '';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'H';

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden select-none bg-slate-950">
      {/* ── MAP CONTAINER ──────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={position}
          zoom={13}
          zoomControl={false}
          className="w-full h-full"
        >
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* ── THREE FULLY WORKING MAP LAYERS ───────────────────────── */}
          {/* Layer 1: Realistic Satellite View (Esri World Imagery) */}
          {mapStyle === 'satellite' && (
            <TileLayer
              key="satellite"
              attribution="Tiles &copy; Esri World Imagery"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}

          {/* Layer 2: Mountain Topographic Contours (OpenTopoMap) */}
          {mapStyle === 'topo' && (
            <TileLayer
              key="topo"
              attribution="&copy; OpenTopoMap"
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              maxZoom={17}
            />
          )}

          {/* Layer 3: Outdoor Street & Trail View (OpenStreetMap) */}
          {mapStyle === 'streets' && (
            <TileLayer
              key="streets"
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* User's Live Avatar Location Marker */}
          <Marker position={position} icon={userMapIcon}>
            <Popup className="text-xs font-semibold">
              <div className="text-center p-2 min-w-[140px]">
                <p className="font-bold text-emerald-700">{user?.full_name || 'You'}</p>
                <p className="text-[10px] text-muted-foreground mb-2">
                  {position[0].toFixed(4)}°, {position[1].toFixed(4)}°
                </p>
                <button
                  onClick={openEditProfile}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 transition"
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </Popup>
          </Marker>

          {/* Destination Pin Marker */}
          {destination && (
            <Marker
              position={[destination.lat, destination.lng]}
              icon={destPinIcon(destination.name)}
            >
              <Popup>
                <div className="p-2 min-w-[150px] text-xs">
                  <p className="font-bold text-rose-600 text-sm">{destination.name}</p>
                  <p className="text-slate-500">{destination.region}</p>
                  <p className="text-emerald-600 font-bold mt-1">
                    {haversine(position, [destination.lat, destination.lng]).toFixed(2)} km away
                  </p>
                  <button
                    onClick={() => setShowHikeInfo(true)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
                  >
                    View Hike Information →
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          {/* CONNECTING ROUTE LINE (Between Current Location and Destination) */}
          {destination && position && (
            <Polyline
              positions={[position, [destination.lat, destination.lng]]}
              pathOptions={{
                color: mapStyle === 'satellite' ? '#38bdf8' : '#0284c7',
                weight: 4,
                dashArray: '8, 8',
                opacity: 0.95,
              }}
            />
          )}

          {/* Active Hike Walked Track (Breadcrumb Path) */}
          {isTrackingHike && hikeTrack.length >= 2 && (
            <Polyline
              positions={hikeTrack}
              pathOptions={{
                color: '#ef4444',
                weight: 5,
                opacity: 0.95,
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* ── TOP CONTROLS: Hamburger + Broad Search Bar ─────────────────── */}
      <div className="absolute top-4 inset-x-4 z-[1000] flex items-center gap-2 max-w-xl mx-auto pointer-events-none">
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="w-12 h-12 rounded-full bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20 active:scale-90 transition cursor-pointer shrink-0 pointer-events-auto"
          title="Open Menu"
        >
          <Menu size={22} />
        </button>

        {/* Broad Location Search Bar */}
        <div className="relative flex-1 pointer-events-auto">
          <div className="w-full bg-black/85 hover:bg-black/95 backdrop-blur-md text-white rounded-full px-5 py-3 flex items-center justify-between border border-white/20 shadow-2xl transition">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search place, city, barangay, or trail…"
              className="bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none w-full pr-3"
            />
            {isSearching ? (
              <RefreshCw size={18} className="text-slate-400 animate-spin shrink-0" />
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white shrink-0"
              >
                <X size={18} />
              </button>
            ) : (
              <Search size={18} className="text-slate-400 shrink-0" />
            )}
          </div>

          {/* Broad Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-2 inset-x-0 bg-slate-900/95 border border-white/20 rounded-3xl p-2.5 shadow-2xl backdrop-blur-2xl max-h-80 overflow-y-auto space-y-1.5 z-[1500]">
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
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-[0.99] transition cursor-pointer flex items-center justify-between text-white group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-sm text-white group-hover:text-emerald-400 transition truncate">
                          {m.name}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getBadge(m.type)}`}>
                          {m.type || 'Location'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{m.region}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {dist > 0 ? `${dist.toFixed(1)} km` : (m.elevation || 'Place')}
                      </span>
                      <span className="block text-[10px] text-sky-400 font-bold">Plan Route →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Avatar Button */}
        <button
          onClick={openEditProfile}
          title="Edit Profile"
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-400/80 shadow-2xl active:scale-90 transition cursor-pointer hover:border-emerald-300 hover:scale-105 shrink-0 pointer-events-auto"
        >
          {user?.photo_url ? (
            <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-black text-xl">
              {initialLetter}
            </div>
          )}
        </button>
      </div>

      {/* ── THREE MAP CHOICES SWITCHER (Satellite, Topo, Outdoor) ───────── */}
      <div className="absolute top-20 left-4 z-[1000] flex bg-black/80 backdrop-blur-md rounded-2xl p-1 border border-white/20 shadow-2xl pointer-events-auto">
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

      {/* Location Toast Notification */}
      {locationToast && (
        <div className="absolute top-28 inset-x-0 mx-auto w-fit z-[1500] px-4 py-2 rounded-full bg-black/90 text-white border border-emerald-400/60 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 animate-bounce">
          <LocateFixed size={14} className="text-emerald-400" />
          <span>{locationToast}</span>
        </div>
      )}

      {/* ── RIGHT-SIDE FLOATING ACTION BUTTONS ─────────────────────────── */}
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

      {/* ── HIKE INFORMATION & ROUTE GUIDE CARD ───────────────────────── */}
      {showHikeInfo && destination && (
        <HikeInformationCard
          destination={destination}
          currentPosition={position}
          isTracking={isTrackingHike}
          elapsedSeconds={hikeElapsedSeconds}
          onStartTracking={() => {
            setIsTrackingHike(true);
            setHikeTrack(position ? [position] : []);
            setLocationToast('🟢 Trail GPS tracking started — breadcrumbs recording');
            setTimeout(() => setLocationToast(''), 3000);
          }}
          onStopTracking={() => {
            setIsTrackingHike(false);
            setLocationToast('⏹️ Hike tracking stopped');
            setTimeout(() => setLocationToast(''), 3000);
          }}
          onRecenterRoute={() => {
            if (position && destination) {
              setMapCenter([(position[0] + destination.lat) / 2, (position[1] + destination.lng) / 2]);
              const dist = haversine(position, [destination.lat, destination.lng]);
              setMapZoom(dist > 50 ? 9 : dist > 20 ? 11 : dist > 8 ? 12 : 14);
            }
          }}
          onClearRoute={() => {
            setDestination(null);
            setShowHikeInfo(false);
            setIsTrackingHike(false);
            setHikeTrack([]);
          }}
          onClose={() => setShowHikeInfo(false)}
        />
      )}

      {/* ── BOTTOM WEATHER & PLAN A ROUTE DRAWER ─────────────────────── */}
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
          locationName={destination?.name || 'Current location'}
        />
      )}

      {/* ── LEFT SIDEBAR MENU ────────────────────────────────────────── */}
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
          <div className="flex justify-end pb-1">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 active:scale-90 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-xl text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#182a20] text-white text-3xl font-bold flex items-center justify-center overflow-hidden border-2 border-[#243f30] shadow-md mb-3">
              {user?.photo_url ? (
                <img src={user.photo_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{initialLetter}</span>
              )}
            </div>
            <h3 className="font-bold text-base leading-tight text-slate-900">{displayName}</h3>
            <p className="text-[11px] text-slate-500 mt-1 break-all">{displayEmail}</p>
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

          {/* Navigation Cards */}
          <div className="space-y-2 pt-1">
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
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 transition" />
            </button>

            <button
              onClick={() => { setSidebarOpen(false); navigate('/map?drawer=routes'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-emerald-400 flex items-center justify-center shrink-0">
                  <Navigation size={20} />
                </div>
                <span className="font-bold text-sm">Your Routes</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 transition" />
            </button>

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
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 transition" />
            </button>

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
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 transition" />
            </button>

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
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 transition" />
            </button>

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
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 transition" />
            </button>

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
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 transition" />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 mt-4">
          <button
            onClick={() => { setSidebarOpen(false); logout(); }}
            className="w-full py-3 rounded-2xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition cursor-pointer"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────── */}
      {/* 1. Weather Modal */}
      {showWeatherModal && (
        <WeatherModal onClose={() => setShowWeatherModal(false)} />
      )}

      {/* 2. Plan a Route Modal (Directs straight to Hike Information!) */}
      {showPlanRouteModal && (
        <PlanRouteModal
          onClose={() => setShowPlanRouteModal(false)}
          onStartRoute={handleSelectDestination}
        />
      )}

      {/* 3. Music Player Modal */}
      {showMusicModal && (
        <div className="fixed inset-0 z-[3000]">
          <MusicMode onClose={() => setShowMusicModal(false)} />
        </div>
      )}

      {/* 4. Digital Compass Modal */}
      {showCompassModal && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCompassModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
            >
              <X size={18} />
            </button>

            <div className="flex items-center justify-center gap-2 text-sky-400 font-bold text-sm">
              <CompassIcon size={20} />
              <span>Trail Digital Compass</span>
            </div>

            <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="absolute top-2 text-red-500 font-black text-lg">N</span>
                <span className="absolute bottom-2 text-slate-400 font-bold text-lg">S</span>
                <span className="absolute left-2 text-slate-400 font-bold text-lg">W</span>
                <span className="absolute right-2 text-slate-400 font-bold text-lg">E</span>
              </div>

              <div
                className="w-56 h-56 rounded-full border-4 border-slate-700 bg-slate-800/80 flex items-center justify-center shadow-inner transition-transform duration-200"
                style={{ transform: `rotate(${-compassHeading}deg)` }}
              >
                <div className="w-1 h-24 bg-gradient-to-t from-transparent to-red-500 rounded-full" />
                <div className="w-1 h-24 bg-gradient-to-b from-transparent to-slate-400 rounded-full" />
              </div>
            </div>

            <p className="text-3xl font-extrabold font-mono text-emerald-400">
              {compassHeading}°
            </p>
          </div>
        </div>
      )}

      {/* 5. Camera Plant Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-[3000]">
          <CameraPlantScanner onClose={() => setShowScannerModal(false)} />
        </div>
      )}

      {/* 6. Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[3500] bg-black/75 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0f1a13] border border-white/10 text-white rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.06]">
              <h2 className="font-bold text-base tracking-wide">Edit Profile</h2>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 active:scale-90 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-[#182a20] border-2 border-emerald-500/40 shadow-xl overflow-hidden flex items-center justify-center text-white text-3xl font-black">
                  {editPhoto ? (
                    <img src={editPhoto} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(editName || 'H').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow active:scale-95 transition">
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                  {editPhoto && (
                    <button
                      onClick={() => setEditPhoto('')}
                      className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:bg-white/10 active:scale-95 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Display Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={user?.full_name || 'Your name'}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-slate-300 font-bold text-sm hover:bg-white/10 active:scale-95 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfileChanges}
                  disabled={isSavingProfile || !editName.trim()}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm active:scale-95 transition ${
                    profileSaved
                      ? 'bg-emerald-400 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50'
                  }`}
                >
                  {profileSaved ? '✓ Saved!' : isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}