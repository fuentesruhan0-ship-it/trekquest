import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ChevronLeft, Crosshair, MapPin, ChevronDown, Navigation, Search, X,
  Compass, Flame, Footprints, Clock, Check
} from 'lucide-react';
import { philippinePlaces, searchBroadPlaces, haversine } from '@/lib/philippinePlaces';

// Custom Map Markers with high contrast frosted glass aesthetic
const startPinIcon = L.divIcon({
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
    <div style="width:30px;height:30px;background:#10b981;border:2.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.5);color:white;font-weight:900;font-size:12px;">S</div>
    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #10b981;margin-top:-1px;"></div>
  </div>`,
  className: '',
  iconSize: [30, 36],
  iconAnchor: [15, 36],
});

const destPinIcon = L.divIcon({
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
    <div style="width:30px;height:30px;background:#ef4444;border:2.5px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(239,68,68,0.5);color:white;font-size:14px;">🏁</div>
    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #ef4444;margin-top:-1px;"></div>
  </div>`,
  className: '',
  iconSize: [30, 36],
  iconAnchor: [15, 36],
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
  // Active tapping mode: 'start' or 'dest'
  const [pickMode, setPickMode] = useState('dest'); // default to picking destination, or user can toggle start

  // Stored GPS location as fallback default start
  const defaultGps = (() => {
    try {
      const saved = localStorage.getItem('trekquest_current_coords');
      return saved ? JSON.parse(saved) : [14.0436, 120.8031];
    } catch {
      return [14.0436, 120.8031];
    }
  })();

  // User-decided Starting Point
  const [startCoords, setStartCoords] = useState(defaultGps);
  const [startName, setStartName] = useState('Starting Point');
  const [startDropdownOpen, setStartDropdownOpen] = useState(false);
  const [startSearchFilter, setStartSearchFilter] = useState('');
  const [startSearchResults, setStartSearchResults] = useState([]);

  // User-decided Destination Point
  const [destCoords, setDestCoords] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const [destSearchFilter, setDestSearchFilter] = useState('');
  const [destSearchResults, setDestSearchResults] = useState([]);

  const searchTimerRef = useRef(null);

  // Search filter for Starting Point
  useEffect(() => {
    if (!startSearchFilter.trim()) {
      setStartSearchResults(philippinePlaces.slice(0, 12));
      return;
    }
    const t = setTimeout(async () => {
      const res = await searchBroadPlaces(startSearchFilter);
      setStartSearchResults(res);
    }, 200);
    return () => clearTimeout(t);
  }, [startSearchFilter]);

  // Search filter for Destination
  useEffect(() => {
    if (!destSearchFilter.trim()) {
      setDestSearchResults(philippinePlaces.slice(0, 15));
      return;
    }
    const t = setTimeout(async () => {
      const res = await searchBroadPlaces(destSearchFilter);
      setDestSearchResults(res);
    }, 200);
    return () => clearTimeout(t);
  }, [destSearchFilter]);

  // Map tap handler: sets either start or destination based on user's active pickMode!
  const handleMapClick = (coords) => {
    if (pickMode === 'start') {
      setStartCoords(coords);
      setStartName(`Custom Start (${coords[0].toFixed(3)}°, ${coords[1].toFixed(3)}°)`);
      // Auto-switch to destination picking next for smooth flow
      if (!destCoords) setPickMode('dest');
    } else {
      setDestCoords(coords);
      const dist = haversine(startCoords, coords);
      const est = Math.max(0.4, (dist / 3.5)).toFixed(1);
      setSelectedDestination({
        name: `Custom Destination (${coords[0].toFixed(3)}°, ${coords[1].toFixed(3)}°)`,
        region: 'Custom Pinned Map Location',
        type: 'Location',
        lat: coords[0],
        lng: coords[1],
        distanceKm: dist.toFixed(2),
        estHours: est,
      });
    }
  };

  const handleSelectStartOption = (opt) => {
    setStartCoords([opt.lat, opt.lng]);
    setStartName(opt.name);
    setStartDropdownOpen(false);
    // If destination already chosen, recalculate distance
    if (destCoords) {
      const dist = haversine([opt.lat, opt.lng], destCoords);
      const est = Math.max(0.4, (dist / 3.5)).toFixed(1);
      setSelectedDestination((prev) => prev ? { ...prev, distanceKm: dist.toFixed(2), estHours: est } : null);
    }
  };

  const handleSelectDestOption = (opt) => {
    const dist = haversine(startCoords, [opt.lat, opt.lng]);
    const est = Math.max(0.4, (dist / 3.5)).toFixed(1);
    const fullDest = {
      ...opt,
      distanceKm: dist.toFixed(2),
      estHours: est,
    };
    setSelectedDestination(fullDest);
    setDestCoords([opt.lat, opt.lng]);
    setDestDropdownOpen(false);
  };

  const handleStartNavigation = () => {
    if (onStartRoute && selectedDestination) {
      // Pass BOTH destination and user-chosen starting point!
      onStartRoute(selectedDestination, startCoords);
    }
    onClose();
  };

  const distKm = (startCoords && destCoords)
    ? haversine(startCoords, destCoords)
    : (selectedDestination?.distanceKm ? parseFloat(selectedDestination.distanceKm) : 0);
  const estHours = Math.max(0.4, distKm / 3.5).toFixed(1);
  const estSteps = Math.round(distKm * 1330);
  const estCalories = Math.round(estSteps * 0.045 + (parseFloat(estHours) * 60) * 4.2);

  return (
    <div className="fixed inset-0 z-[3200] bg-black/70 backdrop-blur-xl overflow-y-auto no-scrollbar flex flex-col text-white font-sans select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col px-4 sm:px-6 pt-4 pb-8 space-y-3.5">
        
        {/* Top Header - Frosted Glass Bar */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition cursor-pointer border border-white/15 backdrop-blur-md shadow-lg"
              title="Back"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>Plan a Route</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Custom Planner
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Choose your start & destination freely</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Map Preview Container with Connecting Line */}
        <div className="space-y-1.5">
          <div className="relative w-full h-56 sm:h-64 rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-slate-950/80 backdrop-blur-md">
            <MapContainer
              center={destCoords || startCoords}
              zoom={destCoords ? 12 : 13}
              zoomControl={false}
              className="w-full h-full"
            >
              <TileLayer
                attribution="Tiles &copy; Esri World Imagery"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />
              <MapPreviewClickHandler onMapClick={handleMapClick} />
              
              {/* User-selected starting point (Green Pin) */}
              {startCoords && (
                <Marker position={startCoords} icon={startPinIcon} />
              )}

              {/* User-selected destination point (Red Pin) */}
              {destCoords && (
                <Marker position={destCoords} icon={destPinIcon} />
              )}

              {/* Connecting High-Contrast Trail Line on Preview */}
              {startCoords && destCoords && (
                <Polyline
                  positions={[startCoords, destCoords]}
                  pathOptions={{
                    color: '#38bdf8',
                    weight: 4,
                    dashArray: '8, 8',
                    opacity: 0.95,
                  }}
                />
              )}
            </MapContainer>

            {/* Active Tapping Target Floating Indicator */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-[1000]">
              <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[11px] font-bold text-white shadow-xl flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${pickMode === 'start' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                <span>Tap map to set {pickMode === 'start' ? 'Start (S)' : 'Destination (🏁)'}</span>
              </div>
            </div>
          </div>

          {/* Quick Mode Switcher for Map Tap */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setPickMode('start')}
              className={`py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 font-bold transition cursor-pointer backdrop-blur-md border ${
                pickMode === 'start'
                  ? 'bg-emerald-600/40 border-emerald-400 text-white shadow-lg shadow-emerald-950/40'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Tap to Set Start</span>
            </button>

            <button
              onClick={() => setPickMode('dest')}
              className={`py-2 px-3 rounded-2xl flex items-center justify-center gap-1.5 font-bold transition cursor-pointer backdrop-blur-md border ${
                pickMode === 'dest'
                  ? 'bg-red-600/40 border-red-400 text-white shadow-lg shadow-red-950/40'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span>Tap to Set Destination</span>
            </button>
          </div>
        </div>

        {/* ── 1. STARTING POINT SECTION (User is the decider) ──────────────── */}
        <div className="space-y-1.5 relative">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold text-emerald-400 tracking-wider uppercase flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              STARTING POINT (WHERE YOU BEGIN)
            </p>
            <button
              onClick={() => {
                setStartCoords(defaultGps);
                setStartName('Current GPS Location');
              }}
              className="text-[10px] text-slate-400 hover:text-emerald-400 font-bold flex items-center gap-1 transition"
            >
              <Crosshair size={11} /> Use My GPS
            </button>
          </div>

          <div
            onClick={() => {
              setStartDropdownOpen(!startDropdownOpen);
              setDestDropdownOpen(false);
            }}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition text-slate-200 backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-black text-[11px]">
                S
              </div>
              <span className="text-xs truncate text-white font-bold">
                {startName}
              </span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${startDropdownOpen ? 'rotate-180' : ''} shrink-0`} />
          </div>

          {/* Starting Point Search Dropdown */}
          {startDropdownOpen && (
            <div className="absolute top-full mt-1.5 inset-x-0 bg-slate-950/95 border border-white/20 rounded-2xl p-2.5 shadow-2xl z-[1500] max-h-60 overflow-y-auto space-y-2 backdrop-blur-2xl animate-in fade-in-50 duration-150">
              <div className="relative">
                <input
                  type="text"
                  value={startSearchFilter}
                  onChange={(e) => setStartSearchFilter(e.target.value)}
                  placeholder="Search starting city, trail, or place…"
                  className="w-full px-3 py-2 pl-8 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                {startSearchFilter && (
                  <button onClick={() => setStartSearchFilter('')} className="absolute right-2.5 top-2.5 text-slate-400">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {startSearchResults.map((opt, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectStartOption(opt)}
                    className="p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs hover:bg-white/10 text-slate-200 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-white truncate">{opt.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{opt.region}</p>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-bold shrink-0">
                      {opt.type || 'Place'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 2. DESTINATION SECTION (User selects destination) ────────────── */}
        <div className="space-y-1.5 relative">
          <p className="text-[10px] font-extrabold text-red-400 tracking-wider uppercase flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            DESTINATION (WHERE YOU WANT TO REACH)
          </p>

          <div
            onClick={() => {
              setDestDropdownOpen(!destDropdownOpen);
              setStartDropdownOpen(false);
            }}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition text-slate-200 backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center gap-2 truncate pr-2">
              <MapPin size={16} className="text-red-400 shrink-0" />
              <span className={`text-xs truncate ${selectedDestination ? 'text-white font-bold' : 'text-slate-400'}`}>
                {selectedDestination ? `${selectedDestination.name}` : 'Select or tap destination…'}
              </span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${destDropdownOpen ? 'rotate-180' : ''} shrink-0`} />
          </div>

          {/* Destination Search Dropdown */}
          {destDropdownOpen && (
            <div className="absolute top-full mt-1.5 inset-x-0 bg-slate-950/95 border border-white/20 rounded-2xl p-2.5 shadow-2xl z-[1500] max-h-60 overflow-y-auto space-y-2 backdrop-blur-2xl animate-in fade-in-50 duration-150">
              <div className="relative">
                <input
                  type="text"
                  value={destSearchFilter}
                  onChange={(e) => setDestSearchFilter(e.target.value)}
                  placeholder="Type any city, barangay, or peak…"
                  className="w-full px-3 py-2 pl-8 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                  autoFocus
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                {destSearchFilter && (
                  <button onClick={() => setDestSearchFilter('')} className="absolute right-2.5 top-2.5 text-slate-400">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {destSearchResults.map((opt, i) => {
                  const d = haversine(startCoords, [opt.lat, opt.lng]);
                  return (
                    <div
                      key={i}
                      onClick={() => handleSelectDestOption(opt)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs transition ${
                        selectedDestination?.name === opt.name
                          ? 'bg-red-600/30 text-red-200 font-bold border border-red-500/40'
                          : 'hover:bg-white/10 text-slate-200'
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
                        <span className="font-mono text-emerald-400 font-bold">{d.toFixed(1)} km</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 3. ESTIMATED METRICS & ACTION BUTTON ─────────────────────────── */}
        <div className="pt-2 mt-auto">
          {!selectedDestination ? (
            <div className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs font-medium text-center backdrop-blur-md shadow-md">
              Tap the map or pick a destination above to see the route line
            </div>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
              {/* Frosted Glass Metrics Grid (Steps counter & Burned calories as requested) */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/15 backdrop-blur-xl shadow-xl grid grid-cols-4 gap-2 text-center divide-x divide-white/10">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block flex items-center justify-center gap-0.5">
                    <Navigation size={10} className="text-emerald-400" /> Dist.
                  </span>
                  <p className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">
                    {distKm.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">km</span>
                  </p>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block flex items-center justify-center gap-0.5">
                    <Clock size={10} className="text-amber-400" /> Time
                  </span>
                  <p className="text-sm font-extrabold text-amber-400 font-mono mt-0.5">
                    ~{estHours} <span className="text-[9px] font-normal text-slate-400">h</span>
                  </p>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block flex items-center justify-center gap-0.5">
                    <Footprints size={10} className="text-sky-400" /> Steps
                  </span>
                  <p className="text-sm font-extrabold text-sky-400 font-mono mt-0.5">
                    {estSteps.toLocaleString()}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block flex items-center justify-center gap-0.5">
                    <Flame size={10} className="text-rose-400" /> Calories
                  </span>
                  <p className="text-sm font-extrabold text-rose-400 font-mono mt-0.5">
                    {estCalories} <span className="text-[9px] font-normal text-slate-400">kcal</span>
                  </p>
                </div>
              </div>

              {/* Start Hike Button */}
              <button
                onClick={handleStartNavigation}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition cursor-pointer border border-white/20"
              >
                <Navigation size={18} />
                <span>Start Route from Chosen Starting Point →</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
