import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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


// Custom Map Markers
// Avatar icon is now created dynamically inside the component (see createAvatarMapIcon helper below)
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

const summitIcon = L.divIcon({
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
    <div style="width:30px;height:30px;background:#10b981;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);color:white;font-weight:bold;font-size:14px;">⛰️</div>
    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #10b981;margin-top:-1px;"></div>
  </div>`,
  className: '',
  iconSize: [30, 36],
  iconAnchor: [15, 36],
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

const popularMountains = [
  { name: 'Mt. Pulag', region: 'Benguet, Philippines', elevation: '2,928m', difficulty: 'Moderate', lat: 16.5975, lng: 120.8986, desc: 'Famous for the breathtaking sea of clouds, dwarf bamboo grasslands, and cool summit climate.' },
  { name: 'Mt. Apo', region: 'Davao / Cotabato, Philippines', elevation: '2,954m', difficulty: 'Hard', lat: 6.9875, lng: 125.2711, desc: 'Highest peak in the Philippines featuring active sulfur vents and primeval rainforest.' },
  { name: 'Mt. Batulao', region: 'Nasugbu, Batangas, Philippines', elevation: '811m', difficulty: 'Moderate', lat: 14.0436, lng: 120.8031, desc: 'Spectacular knife-edge ridges with 360-degree vistas of Balayan Bay and Batangas.' },
  { name: 'Mt. Ulap', region: 'Itogon, Benguet, Philippines', elevation: '1,846m', difficulty: 'Moderate', lat: 16.3268, lng: 120.6481, desc: 'Beloved eco-trail with pine tree ridges, hanging burial caves, and Gungal Rock.' },
  { name: 'Mt. Pinatubo', region: 'Zambales / Pampanga', elevation: '1,486m', difficulty: 'Easy', lat: 15.1429, lng: 120.3496, desc: 'Iconic turquoise crater lake and dramatic canyon 4x4 trail.' },
  { name: 'Mt. Guiting-Guiting', region: 'Sibuyan Island, Romblon', elevation: '2,058m', difficulty: 'Expert', lat: 12.4167, lng: 122.5694, desc: 'Renowned jagged knife-edge sawtooth ridge trek in pristine biodiversity.' },
  { name: 'Mt. Daraitan', region: 'Tanay, Rizal, Philippines', elevation: '739m', difficulty: 'Moderate', lat: 14.6153, lng: 121.4361, desc: 'Limestone rock formations, caves, and scenic Tinipak River.' },
  { name: 'Mt. Fuji', region: 'Honshu, Japan', elevation: '3,776m', difficulty: 'Moderate', lat: 35.3606, lng: 138.7274, desc: 'Iconic UNESCO World Heritage volcano.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();

  // Location & Map State
  const defaultCoords = [14.0436, 120.8031]; // Batulao / Batangas area matching realistic imagery
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
  const [selectedPeak, setSelectedPeak] = useState(null);

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

  // Search State
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
  const photoInputRef = useRef(null);

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

  // Handle photo file selection (from camera or gallery)
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Open edit profile modal and sync latest values
  const openEditProfile = () => {
    setEditName(user?.full_name || '');
    setEditPhoto(user?.photo_url || '');
    setProfileSaved(false);
    setShowEditProfileModal(true);
  };

  // Dynamic user avatar map icon — updates whenever photo or locatePing changes
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
        // Only update if not overridden by custom location
        const hasCustom = localStorage.getItem('trekquest_custom_location');
        if (!hasCustom) {
          setPosition(newCoords);
          localStorage.setItem('trekquest_current_coords', JSON.stringify(newCoords));
        }
      },
      (err) => console.log('GPS tracking status:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Listen to custom location changes (e.g. from Weather page or settings)
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

  // Mountain Search (Curated + OpenStreetMap Nominatim for lesser-known peaks)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const localMatches = popularMountains.filter(
      (m) => m.name.toLowerCase().includes(q) || m.region.toLowerCase().includes(q)
    );
    setSearchResults(localMatches);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ' mountain')}&format=json&limit=5&addressdetails=1`
        );
        if (res.ok) {
          const data = await res.json();
          const nominatimResults = data.map((item) => ({
            name: item.name || item.display_name.split(',')[0],
            region: item.display_name.split(',').slice(1, 3).join(', ').trim(),
            elevation: item.extratags?.ele ? `${item.extratags.ele}m` : 'Peak',
            difficulty: 'Trail',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            desc: item.display_name,
            source: 'OpenStreetMap',
          }));

          const seen = new Set(localMatches.map((m) => m.name.toLowerCase()));
          const combined = [...localMatches];
          for (const item of nominatimResults) {
            if (!seen.has(item.name.toLowerCase())) {
              seen.add(item.name.toLowerCase());
              combined.push(item);
            }
          }
          setSearchResults(combined);
        }
      } catch (e) {
        console.warn('Online mountain search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 450);

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

  const handleSelectMountain = (m) => {
    setSelectedPeak(m);
    setMapCenter([m.lat, m.lng]);
    setMapZoom(14);
    setSearchQuery('');
    setSearchResults([]);
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

  // User display name & email (defaulting to the user from the screenshot)
  const displayName = user?.full_name || 'Reiljee Shearl Calayco Fuentes';
  const displayEmail = user?.email || 'reiljeeshearlcalaycofuentes@gmail.com';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'R';

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden select-none bg-slate-950">
      {/* 1. Realistic Satellite Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={position}
          zoom={13}
          zoomControl={false}
          className="w-full h-full"
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />

          {/* User's Avatar Location Marker */}
          <Marker position={position} icon={userMapIcon}>
            <Popup className="text-xs font-semibold">
              <div className="text-center p-2 min-w-[140px]">
                <p className="font-bold text-emerald-700">{user?.full_name || 'You'}</p>
                <p className="text-[10px] text-muted-foreground mb-2">{position[0].toFixed(4)}°, {position[1].toFixed(4)}°</p>
                <button
                  onClick={openEditProfile}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 transition"
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </Popup>
          </Marker>

          {/* Selected Mountain Peak Marker */}
          {selectedPeak && (
            <Marker position={[selectedPeak.lat, selectedPeak.lng]} icon={summitIcon}>
              <Popup>
                <div className="p-1 min-w-[140px]">
                  <p className="font-black text-sm text-emerald-700">{selectedPeak.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPeak.region}</p>
                  <p className="text-xs font-bold text-stone-700 mt-1">{selectedPeak.elevation}</p>
                  <button
                    onClick={() => navigate(`/map?lat=${selectedPeak.lat}&lng=${selectedPeak.lng}&destName=${encodeURIComponent(selectedPeak.name)}`)}
                    className="mt-2 w-full py-1 rounded bg-emerald-600 text-white text-[11px] font-bold"
                  >
                    Plan Route Here →
                  </button>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* 2. Top Bar: Hamburger Menu & Mountain Search Bar */}
      <div className="absolute top-4 inset-x-4 z-[1000] flex items-center gap-2 max-w-xl mx-auto">
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="w-12 h-12 rounded-full bg-black/80 hover:bg-black/95 text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/15 active:scale-90 transition cursor-pointer shrink-0"
          title="Open Menu"
        >
          <Menu size={22} />
        </button>

        {/* Search Bar: 'Search any mountain or peak' */}
        <div className="relative flex-1">
          <div className="w-full bg-black/80 hover:bg-black/90 backdrop-blur-md text-white rounded-full px-5 py-3 flex items-center justify-between border border-white/15 shadow-2xl transition">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any mountain or peak"
              className="bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none w-full pr-3"
            />
            {isSearching ? (
              <RefreshCw size={18} className="text-slate-400 animate-spin shrink-0" />
            ) : searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white shrink-0">
                <X size={18} />
              </button>
            ) : (
              <Search size={18} className="text-slate-400 shrink-0" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-2 inset-x-0 bg-slate-900/95 border border-white/15 rounded-3xl p-2.5 shadow-2xl backdrop-blur-xl max-h-72 overflow-y-auto space-y-1 z-[1200]">
              {searchResults.map((m, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectMountain(m)}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 active:scale-[0.99] transition cursor-pointer flex items-center justify-between text-white"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-sm text-emerald-400 truncate">{m.name}</p>
                    <p className="text-xs text-slate-300 truncate">{m.region}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-200">{m.elevation}</span>
                    <span className="block text-[10px] text-emerald-500 font-bold">Fly to Peak →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Button — tapping opens Edit Profile */}
      <button
        onClick={openEditProfile}
        title="Edit Profile"
        className="absolute top-4 right-4 z-[1100] w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-400/80 shadow-2xl active:scale-90 transition cursor-pointer hover:border-emerald-300 hover:scale-105 ring-2 ring-black/30 backdrop-blur-sm"
      >
        {user?.photo_url ? (
          <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-black text-xl">
            {(user?.full_name || 'H').charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Location Toast Notification */}
      {locationToast && (
        <div className="absolute top-20 inset-x-0 mx-auto w-fit z-[1500] px-4 py-2 rounded-full bg-black/90 text-white border border-emerald-400/60 shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2 animate-bounce">
          <LocateFixed size={14} className="text-emerald-400" />
          <span>{locationToast}</span>
        </div>
      )}

      {/* 3. Right-Side Floating Action Buttons (Locate GPS, Music, Compass, Camera) */}
      <div className="absolute top-24 right-4 z-[1000] flex flex-col gap-3.5">
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

      {/* 4. Bottom Weather & Plan a Route Drawer (Matches Picture 1 & 2) */}
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
        locationName={selectedPeak?.name || 'Current location'}
      />


      {/* 5. Left Sidebar Menu (Matches User Screenshot Exactly) */}
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
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 active:scale-90 transition"
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
              className="text-xs text-red-500 font-semibold mt-3 hover:underline flex items-center gap-0.5 active:scale-95 transition"
            >
              Edit profile &gt;
            </button>
          </div>

          {/* White Pill Action Cards (From User Screenshot) */}
          <div className="space-y-2 pt-1">
            {/* 1. Backpacking Guide */}
            <button
              onClick={() => { setSidebarOpen(false); navigate('/backpacking'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left"
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
              onClick={() => { setSidebarOpen(false); navigate('/map?drawer=routes'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#182a20] text-emerald-400 flex items-center justify-center shrink-0">
                  <Navigation size={20} />
                </div>
                <span className="font-bold text-sm">Your Routes</span>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>

            {/* 3. First Aid Guide */}
            <button
              onClick={() => { setSidebarOpen(false); navigate('/first-aid'); }}
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left"
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
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left"
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
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left"
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
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left"
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
              className="w-full bg-white text-slate-900 rounded-2xl p-3.5 shadow-sm hover:shadow-md flex items-center justify-between active:scale-[0.98] transition group text-left"
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
            className="w-full py-3 rounded-2xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/30 text-red-300 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition"
          >
            <LogOut size={16} /> Sign Out of Clerk
          </button>
        </div>
      </div>

      {/* 6. Weather Screen Modal (Matches Picture 4) */}
      {showWeatherModal && (
        <WeatherModal onClose={() => setShowWeatherModal(false)} />
      )}

      {/* 7. Plan a Route Screen Modal (Matches Picture 3) */}
      {showPlanRouteModal && (
        <PlanRouteModal
          onClose={() => setShowPlanRouteModal(false)}
          onStartRoute={(dest) => {
            setSelectedPeak(dest);
            setMapCenter([dest.lat, dest.lng]);
            setMapZoom(14);
            navigate(`/map?lat=${dest.lat}&lng=${dest.lng}&destName=${encodeURIComponent(dest.name)}`);
          }}
        />
      )}

      {/* 7. Music Player Modal (Fullscreen Takeover) */}
      {showMusicModal && (
        <div className="fixed inset-0 z-[3000]">
          <MusicMode onClose={() => setShowMusicModal(false)} />
        </div>
      )}

      {/* 8. Digital Compass Modal */}
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
              GPS: {position[0].toFixed(4)}°N, {position[1].toFixed(4)}°E
            </div>
          </div>
        </div>
      )}

      {/* 9. Camera Plant Scanner Modal (100% Offline Real Device Camera) */}
      {showScannerModal && (
        <CameraPlantScanner onClose={() => setShowScannerModal(false)} />
      )}

      {/* 11. Weather Modal - Blue Frosted Glass Design */}
      {showWeatherModal && (
        <WeatherModal onClose={() => setShowWeatherModal(false)} />
      )}

      {/* 12. Plan Route Modal */}
      {showPlanRouteModal && (
        <PlanRouteModal onClose={() => setShowPlanRouteModal(false)} />
      )}

      {/* 10. Edit Profile Modal — Premium version connected to map avatar */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[3500] bg-black/75 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0f1a13] border border-white/10 text-white rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-sm shadow-2xl overflow-hidden">

            {/* Header */}
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
              {/* Photo Section */}
              <div className="flex flex-col items-center gap-3">
                {/* Avatar Preview */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-emerald-500/60 shadow-xl ring-4 ring-black/30">
                    {editPhoto ? (
                      <img src={editPhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center text-white font-black text-4xl">
                        {(editName || user?.full_name || 'H').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Camera overlay button */}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 border-2 border-[#0f1a13] flex items-center justify-center shadow-lg active:scale-90 transition"
                    title="Change photo"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="px-4 py-1.5 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 active:scale-95 transition"
                  >
                    📷 Change Photo
                  </button>
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

              {/* Name Field */}
              <div>
                <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                  Display Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={user?.full_name || 'Your name'}
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 transition"
                />
              </div>

              {/* Info: this updates your map avatar */}
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Your name and photo update the avatar shown on the map 🗺️
              </p>

              {/* Action Buttons */}
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
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
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