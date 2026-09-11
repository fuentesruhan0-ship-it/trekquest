import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PageHeader from '@/components/PageHeader';
import { Map as MapIcon, Locate, Route, Play, Square, Trash2, Navigation, Mountain } from 'lucide-react';

// Fix default marker icons
const userIcon = L.divIcon({
  html: `<div style="width:20px;height:20px;background:#0d9488;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(13,148,136,.3)"></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
const wpIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:#f59e0b;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

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

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [position, map]);
  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: onClick });
}

export default function MapPage() {
  const [position, setPosition] = useState(null);
  const [heading, setHeading] = useState(0);
  const [waypoints, setWaypoints] = useState([]);
  const [tracking, setTracking] = useState(false);
  const [track, setTrack] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const watchId = useRef(null);
  const trackRef = useRef([]);

  // Default center: Mount Pulag, Philippines
  const defaultCenter = [16.5878, 120.872];

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setError('Unable to get your location. Enable GPS or tap the map to plan a route.'),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setError('Geolocation not supported. Tap the map to plan a route.');
    }
    return () => stopTracking();
  }, []);

  useEffect(() => {
    if (!tracking) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [tracking, startTime]);

  const startTracking = () => {
    setTracking(true);
    setStartTime(Date.now());
    setElapsed(0);
    setTrack([]);
    trackRef.current = [];
    if ('geolocation' in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const p = [pos.coords.latitude, pos.coords.longitude];
          setPosition(p);
          trackRef.current = [...trackRef.current, p];
          setTrack([...trackRef.current]);
          if (pos.coords.heading != null && !isNaN(pos.coords.heading)) setHeading(pos.coords.heading);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 2000 }
      );
    }
  };

  const stopTracking = useCallback(() => {
    setTracking(false);
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  }, []);

  const locateMe = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setError('Unable to get your location.'),
        { enableHighAccuracy: true }
      );
    }
  };

  const addWaypoint = (latlng) => {
    setWaypoints((w) => [...w, [latlng.lat, latlng.lng]]);
  };

  const routePts = position && waypoints.length ? [position, ...waypoints] : waypoints;
  const totalDist = routeDistance(routePts);
  const trackDist = routeDistance(track);
  const activeDist = tracking ? trackDist : totalDist;
  const speed = tracking && elapsed > 0 ? (trackDist / (elapsed / 3600)) : 0;
  const pace = speed > 0 ? 60 / speed : 0; // min per km
  // ETA: assume avg hiking speed 4 km/h if not tracking
  const etaSpeed = tracking && speed > 0 ? speed : 4;
  const etaHours = activeDist > 0 && etaSpeed > 0 ? activeDist / etaSpeed : 0;
  const etaMin = Math.ceil(etaHours * 60);
  const fmtTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader title="Offline Map & Route Planner" subtitle="GPS tracking • Route planning" icon={MapIcon} accent="bg-emerald-600" />
      <div className="relative flex-1" style={{ minHeight: '55vh' }}>
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="absolute inset-0 z-0"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenTopoMap'
          />
          <ClickHandler onClick={(e) => addWaypoint(e.latlng)} />
          {position && (
            <>
              <Marker position={position} icon={userIcon}>
                <Popup>You are here</Popup>
              </Marker>
              <Recenter position={position} />
            </>
          )}
          {waypoints.map((w, i) => (
            <Marker key={i} position={w} icon={wpIcon}>
              <Popup>Waypoint {i + 1}</Popup>
            </Marker>
          ))}
          {routePts.length > 1 && (
            <Polyline positions={routePts} pathOptions={{ color: '#f59e0b', weight: 4, opacity: 0.8, dashArray: '8 6' }} />
          )}
          {track.length > 1 && (
            <Polyline positions={track} pathOptions={{ color: '#0d9488', weight: 4, opacity: 0.9 }} />
          )}
        </MapContainer>

        {/* Top-right controls */}
        <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
          <button onClick={locateMe} className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-emerald-700 active:scale-90 transition" aria-label="Locate me">
            <Locate size={18} />
          </button>
          <button onClick={() => setWaypoints([])} className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-red-600 active:scale-90 transition" aria-label="Clear route">
            <Trash2 size={18} />
          </button>
        </div>

        {/* Hint */}
        <div className="absolute top-3 left-3 z-[500] bg-black/70 text-white text-xs px-3 py-1.5 rounded-full max-w-[60%]">
          Tap map to add waypoints
        </div>
      </div>

      {/* Stats panel */}
      <div className="bg-card border-t border-border p-4 space-y-3">
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}

        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Distance" value={activeDist.toFixed(2)} unit="km" />
          <Stat label={tracking ? 'Speed' : 'Pace'} value={tracking ? speed.toFixed(1) : pace.toFixed(1)} unit={tracking ? 'km/h' : 'min/km'} />
          <Stat label="ETA" value={etaMin.toString()} unit="min" />
          <Stat label="Time" value={tracking ? fmtTime(elapsed) : '—'} unit={tracking ? '' : ''} />
        </div>

        <div className="flex gap-2">
          {!tracking ? (
            <button onClick={startTracking} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
              <Play size={18} /> Start GPS Tracking
            </button>
          ) : (
            <button onClick={stopTracking} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
              <Square size={18} /> Stop Tracking
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-50 rounded-xl p-2.5">
          <Navigation size={14} className="text-emerald-700 shrink-0" />
          <span>{waypoints.length} waypoints planned • {totalDist.toFixed(2)} km route</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-50 rounded-xl p-2.5">
          <Mountain size={14} className="text-amber-700 shrink-0" />
          <span>Topographic overlay shows elevation & terrain. Pan and zoom to explore.</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div className="bg-muted/50 rounded-xl py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground">{unit}</p>
    </div>
  );
}