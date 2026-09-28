import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChevronLeft, Crosshair, MapPin, ChevronDown, Navigation } from 'lucide-react';

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

const mountainOptions = [
  { name: 'Mt. Batulao Ridge', region: 'Nasugbu, Batangas', lat: 14.0436, lng: 120.8031, distanceKm: 10.2, estHours: 3.5 },
  { name: 'Mt. Pulag Ambangeg Trail', region: 'Kabayan, Benguet', lat: 16.5975, lng: 120.8986, distanceKm: 16.5, estHours: 6.0 },
  { name: 'Mt. Apo Kidapawan Trail', region: 'Davao / Cotabato', lat: 6.9875, lng: 125.2711, distanceKm: 24.0, estHours: 9.5 },
  { name: 'Mt. Ulap Eco-Trail', region: 'Itogon, Benguet', lat: 16.3268, lng: 120.6481, distanceKm: 9.3, estHours: 4.0 },
  { name: 'Mt. Daraitan & Tinipak River', region: 'Tanay, Rizal', lat: 14.6153, lng: 121.4361, distanceKm: 8.5, estHours: 4.5 },
  { name: 'Mt. Pinatubo Crater Lake', region: 'Zambales / Capas', lat: 15.1429, lng: 120.3496, distanceKm: 12.0, estHours: 4.0 },
];

export default function PlanRouteModal({ onClose, onStartRoute }) {
  const [startPointMode, setStartPointMode] = useState('current'); // 'current' or 'choose_map'
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customDestinationCoords, setCustomDestinationCoords] = useState(null);

  const [currentCoords, setCurrentCoords] = useState(() => {
    try {
      const saved = localStorage.getItem('trekquest_current_coords');
      return saved ? JSON.parse(saved) : [14.0436, 120.8031];
    } catch {
      return [14.0436, 120.8031];
    }
  });

  const handleMapClick = (coords) => {
    setCustomDestinationCoords(coords);
    setSelectedDestination({
      name: `Custom Destination (${coords[0].toFixed(3)}°, ${coords[1].toFixed(3)}°)`,
      region: 'Custom Pinned Location',
      lat: coords[0],
      lng: coords[1],
      distanceKm: 7.8,
      estHours: 2.8,
    });
  };

  const handleSelectOption = (opt) => {
    setSelectedDestination(opt);
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
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col px-5 pt-4 pb-8 space-y-5">
        {/* Top Header (Matches Picture 3) */}
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

        {/* Map Preview Container (Matches Picture 3) */}
        <div className="space-y-2">
          <div className="relative w-full h-64 sm:h-72 rounded-[28px] overflow-hidden border border-white/[0.08] shadow-2xl bg-[#14261d]">
            <MapContainer
              center={customDestinationCoords || currentCoords}
              zoom={13}
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
            </MapContainer>
          </div>
          <p className="text-center text-[13px] text-slate-400 font-medium">
            Tap the map to drop a custom destination
          </p>
        </div>

        {/* STARTING POINT Section (Matches Picture 3) */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            STARTING POINT
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* 1. Current Location (Active Coral Border) */}
            <button
              onClick={() => setStartPointMode('current')}
              className={`py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer ${
                startPointMode === 'current'
                  ? 'border border-[#e75a4d] bg-[#e75a4d]/10 text-white shadow-sm'
                  : 'border border-[#1f382a] bg-[#14261d] text-slate-300 hover:text-white'
              }`}
            >
              <Crosshair size={16} className="text-[#e75a4d]" />
              <span>Current location</span>
            </button>

            {/* 2. Choose on Map */}
            <button
              onClick={() => setStartPointMode('choose_map')}
              className={`py-3.5 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer ${
                startPointMode === 'choose_map'
                  ? 'border border-[#e75a4d] bg-[#e75a4d]/10 text-white shadow-sm'
                  : 'border border-[#1f382a] bg-[#14261d] text-slate-300 hover:text-white'
              }`}
            >
              <MapPin size={16} className="text-slate-400" />
              <span>Choose on map</span>
            </button>
          </div>
        </div>

        {/* DESTINATION Section (Matches Picture 3) */}
        <div className="space-y-2 relative">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            DESTINATION
          </p>

          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full bg-[#14261d] border border-[#1f382a] hover:border-emerald-600/40 rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer transition text-slate-200"
          >
            <span className={`text-sm ${selectedDestination ? 'text-white font-medium' : 'text-slate-400'}`}>
              {selectedDestination ? selectedDestination.name : 'Select destination'}
            </span>
            <ChevronDown size={18} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {/* Destination Dropdown Options */}
          {dropdownOpen && (
            <div className="absolute top-full mt-2 inset-x-0 bg-[#162a20] border border-[#244231] rounded-2xl p-2 shadow-2xl z-50 max-h-56 overflow-y-auto space-y-1 backdrop-blur-xl animate-in fade-in-50 duration-150">
              {mountainOptions.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer text-xs transition ${
                    selectedDestination?.name === opt.name
                      ? 'bg-emerald-600/20 text-emerald-300 font-bold'
                      : 'hover:bg-white/5 text-slate-200'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-white">{opt.name}</p>
                    <p className="text-[11px] text-slate-400">{opt.region}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-400">{opt.distanceKm} km</span>
                    <span className="block text-[10px] text-slate-400">~{opt.estHours}h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button Section (Matches Picture 3) */}
        <div className="pt-3 mt-auto">
          {!selectedDestination ? (
            <button
              disabled
              className="w-full py-4 rounded-full bg-[#14261d] border border-[#1f382a] text-[#738a71] text-xs sm:text-[13px] font-medium text-center shadow-md cursor-not-allowed"
            >
              Select a destination to calculate your estimated hike time
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
                <span>Start Hike Route Navigation</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
