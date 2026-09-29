import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, Crosshair, MapPin, ChevronDown, Navigation, Search, X } from 'lucide-react';
import { philippinePlaces, searchBroadPlaces, haversine } from '@/lib/philippinePlaces';

// Custom Map Markers
const redLocationIcon = L.divIcon({
  html: `<div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.3);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
    <div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const destPinIcon = L.divIcon({
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
    <div style="width:28px;height:28px;background:#e75a4d;border:2.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.5);color:white;font-size:13px;">📍</div>
    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #e75a4d;margin-top:-1px;"></div>
  </div>`,
  className: '',
  iconSize: [28, 34],
  iconAnchor: [14, 34],
});

function MapPreviewClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function PlanRouteModal({ onClose, onStartRoute }) {
  const [startPointMode, setStartPointMode] = useState('current'); // 'current' or 'choose_map'
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [customDestinationCoords, setCustomDestinationCoords] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const searchTimerRef = useRef(null);

  const [currentCoords, setCurrentCoords] = useState(() => {
    try {
      const saved = localStorage.getItem('trekquest_current_coords');
      return saved ? JSON.parse(saved) : [14.0436, 120.8031];
    } catch {
      return [14.0436, 120.8031];
    }
  });

  // Dynamic search inside modal
  useEffect(() => {
    if (!searchFilter.trim()) {
      setSearchResults(philippinePlaces.slice(0, 15));
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchBroadPlaces(searchFilter);
      setSearchResults(results);
    }, 250);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchFilter]);

  const handleMapClick = (coords) => {
    setCustomDestinationCoords(coords);
    const dist = haversine(currentCoords, coords);
    const est = Math.max(0.4, (dist / 3.5)).toFixed(1);
    setSelectedDestination({
      name: `Custom Destination (${coords[0].toFixed(3)}°, ${coords[1].toFixed(3)}°)`,
      region: 'Custom Pinned Map Location',
      type: 'Location',
      lat: coords[0],
      lng: coords[1],
      distanceKm: dist.toFixed(2),
      estHours: est,
      difficulty: 'Trail Area',
    });
  };

  const handleSelectOption = (opt) => {
    const dist = haversine(currentCoords, [opt.lat, opt.lng]);
    const est = Math.max(0.4, (dist / 3.5)).toFixed(1);
    const fullDest = {
      ...opt,
      distanceKm: dist.toFixed(2),
      estHours: est,
    };
    setSelectedDestination(fullDest);
    setCustomDestinationCoords([opt.lat, opt.lng]);
    setDropdownOpen(false);
  };

  const handleStartNavigation = () => {
    if (onStartRoute && selectedDestination) {
      onStartRoute(selectedDestination);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[3200] bg-[#0c1813] overflow-y-auto no-scrollbar flex flex-col text-white font-sans select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-5 pt-4 pb-8 space-y-4">
        {/* Top Header */}
        <div className="flex items-center gap-3.5 pt-1">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#182a20] hover:bg-[#203629] active:scale-90 flex items-center justify-center text-white/90 transition cursor-pointer border border-white/[0.08]"
            title="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-wide">
            Plan a Route
          </h1>
        </div>

        {/* Map Preview Container with Connecting Line */}
        <div className="space-y-1.5">
          <div className="relative w-full h-56 sm:h-64 rounded-[28px] overflow-hidden border border-white/[0.08] shadow-2xl bg-[#14261d]">
            <MapContainer
              center={customDestinationCoords || currentCoords}
              zoom={customDestinationCoords ? 12 : 13}
              zoomControl={false}
              className="w-full h-full"
            >
              <TileLayer
                attribution="Tiles &copy; Esri World Imagery"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
              <MapPreviewClickHandler onMapClick={handleMapClick} />
              
              {/* User starting point */}
              <Marker position={currentCoords} icon={redLocationIcon} />

              {/* Destination Pin if selected */}
              {customDestinationCoords && (
                <Marker position={customDestinationCoords} icon={destPinIcon} />
              )}

              {/* Connecting Route Line on Preview */}
              {customDestinationCoords && (
                <Polyline
                  positions={[currentCoords, customDestinationCoords]}
                  pathOptions={{
                    color: '#38bdf8',
                    weight: 4,
                    dashArray: '8, 8',
                    opacity: 0.95,
                  }}
                />
              )}
            </MapContainer>
          </div>
          <p className="text-center text-[12px] text-slate-400 font-medium">
            Tap map to drop a pin, or search any city, barangay, or peak below
          </p>
        </div>

        {/* STARTING POINT Section */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            STARTING POINT
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStartPointMode('current')}
              className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer ${
                startPointMode === 'current'
                  ? 'border border-[#e75a4d] bg-[#e75a4d]/10 text-white shadow-sm'
                  : 'border border-[#1f382a] bg-[#14261d] text-slate-300 hover:text-white'
              }`}
            >
              <Crosshair size={16} className="text-[#e75a4d]" />
              <span>Current GPS location</span>
            </button>

            <button
              onClick={() => setStartPointMode('choose_map')}
              className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer ${
                startPointMode === 'choose_map'
                  ? 'border border-[#e75a4d] bg-[#e75a4d]/10 text-white shadow-sm'
                  : 'border border-[#1f382a] bg-[#14261d] text-slate-300 hover:text-white'
              }`}
            >
              <MapPin size={16} className="text-slate-400" />
              <span>Tap on map</span>
            </button>
          </div>
        </div>

        {/* DESTINATION Section (with Search & Full Place Dropdown) */}
        <div className="space-y-1.5 relative">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            DESTINATION (CITY, BARANGAY, OR PEAK)
          </p>

          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-[#14261d] border border-[#1f382a] hover:border-emerald-600/40 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer transition text-slate-200"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <MapPin size={16} className="text-[#e75a4d] shrink-0" />
              <span className={`text-sm truncate ${selectedDestination ? 'text-white font-bold' : 'text-slate-400'}`}>
                {selectedDestination ? `${selectedDestination.name} (${selectedDestination.type || 'Destination'})` : 'Select or search destination…'}
              </span>
            </div>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''} shrink-0`} />
          </div>

          {/* Destination Dropdown Options with Search Bar */}
          {dropdownOpen && (
            <div className="absolute top-full mt-2 inset-x-0 bg-[#162a20] border border-[#244231] rounded-2xl p-2.5 shadow-2xl z-50 max-h-64 overflow-y-auto space-y-2 backdrop-blur-xl animate-in fade-in-50 duration-150">
              {/* Filter Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Type any city, barangay, or peak…"
                  className="w-full px-3 py-2 pl-8 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                {searchFilter && (
                  <button onClick={() => setSearchFilter('')} className="absolute right-2.5 top-2.5 text-slate-400">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* List */}
              <div className="space-y-1">
                {searchResults.map((opt, i) => {
                  const dist = haversine(currentCoords, [opt.lat, opt.lng]);
                  return (
                    <div
                      key={i}
                      onClick={() => handleSelectOption(opt)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs transition ${
                        selectedDestination?.name === opt.name
                          ? 'bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/40'
                          : 'hover:bg-white/5 text-slate-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-white truncate">{opt.name}</p>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-emerald-300 font-bold shrink-0">
                            {opt.type || 'Place'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{opt.region}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-emerald-400 font-bold">{dist.toFixed(1)} km</span>
                        <span className="block text-[10px] text-slate-400">~{Math.max(0.4, dist / 3.5).toFixed(1)}h</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Button Section */}
        <div className="pt-2 mt-auto">
          {!selectedDestination ? (
            <button
              disabled
              className="w-full py-4 rounded-full bg-[#14261d] border border-[#1f382a] text-[#738a71] text-xs sm:text-[13px] font-medium text-center shadow-md cursor-not-allowed"
            >
              Select a destination above to calculate your hike route
            </button>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
              <div className="p-3.5 rounded-2xl bg-[#14261d] border border-[#1f382a] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Estimated Hike:</span>
                  <p className="text-white font-bold text-sm">~{selectedDestination.estHours} hours</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Total Trail Distance:</span>
                  <p className="text-emerald-400 font-bold font-mono text-sm">{selectedDestination.distanceKm} km</p>
                </div>
              </div>

              <button
                onClick={handleStartNavigation}
                className="w-full py-4 rounded-full bg-[#e75a4d] hover:bg-[#d94a3d] active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Navigation size={18} />
                <span>View Route on Live Map &amp; Hike Info →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
