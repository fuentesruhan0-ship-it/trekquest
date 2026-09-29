import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navigation, X, Compass, Mountain, Clock, Route,
  Play, Square, ChevronUp, ChevronDown, Backpack, Check,
  AlertTriangle, CloudSun
} from 'lucide-react';
import { haversine, calculateBearing, getCompassDirection } from '@/lib/philippinePlaces';

export default function HikeInformationCard({
  destination,
  currentPosition,
  isTracking,
  elapsedSeconds,
  onStartTracking,
  onStopTracking,
  onRecenterRoute,
  onClearRoute,
  onClose,
}) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!destination) return null;

  const distKm = currentPosition
    ? haversine(currentPosition, [destination.lat, destination.lng])
    : (destination.distanceKm || 0);

  // Average hiking pace 3.5 km/h + terrain elevation factor
  const estHours = Math.max(0.4, (distKm / 3.5)).toFixed(1);
  const bearing = currentPosition
    ? calculateBearing(currentPosition, [destination.lat, destination.lng])
    : 45;
  const compassDir = getCompassDirection(bearing);

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'Barangay':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'City':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Municipality':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Mountain Peak':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
  };

  return (
    <div className="absolute bottom-5 inset-x-4 max-w-xl mx-auto z-[1500] pointer-events-auto animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-3.5">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Navigation size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Hike Information &amp; Route Guide
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getBadgeColor(destination.type)}`}>
                  {destination.type || 'Location'}
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white truncate leading-tight">
                {destination.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
              title={collapsed ? 'Expand details' : 'Collapse'}
            >
              {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-red-500/30 text-slate-300 hover:text-red-400 transition"
              title="Close card"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Collapsed view summary */}
        {collapsed ? (
          <div className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-400">{distKm.toFixed(2)} km</span>
              <span className="text-slate-400">~{estHours}h hike</span>
              <span className="text-slate-400">Heading {bearing}° {compassDir}</span>
            </div>
            <button
              onClick={onRecenterRoute}
              className="text-[11px] font-bold text-emerald-400 hover:underline"
            >
              View Route →
            </button>
          </div>
        ) : (
          /* Full Hike Details */
          <>
            <p className="text-xs text-slate-300 -mt-1 truncate">
              📍 {destination.region || 'Philippines'}
            </p>

            {/* 4 Metric Stats Grid */}
            <div className="grid grid-cols-4 gap-2 text-center py-1">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Distance</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
                  {distKm.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-400 block">km</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Est. Hike</span>
                <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">
                  ~{estHours}
                </span>
                <span className="text-[10px] text-slate-400 block">hours</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Difficulty</span>
                <span className="text-xs sm:text-sm font-bold text-sky-400 truncate block mt-0.5">
                  {destination.difficulty || 'Moderate'}
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                  {destination.elevation || 'Elevation'}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Bearing</span>
                <span className="text-xs sm:text-sm font-bold text-violet-400 font-mono block mt-0.5">
                  {bearing}°
                </span>
                <span className="text-[10px] text-slate-300 block font-bold">{compassDir}</span>
              </div>
            </div>

            {/* Live GPS Active Tracker Status (if tracking) */}
            {isTracking && (
              <div className="p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-bold text-emerald-300">Live Trail Tracking Active</span>
                </div>
                <span className="font-mono font-bold text-white text-sm">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
              {!isTracking ? (
                <button
                  onClick={onStartTracking}
                  className="flex-1 py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/40 transition cursor-pointer"
                >
                  <Play size={15} />
                  <span>Start Hike Tracking</span>
                </button>
              ) : (
                <button
                  onClick={onStopTracking}
                  className="flex-1 py-3 px-3 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/40 transition cursor-pointer"
                >
                  <Square size={15} />
                  <span>Stop Tracking</span>
                </button>
              )}

              <button
                onClick={onRecenterRoute}
                className="py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Center both current position and destination on map"
              >
                <Route size={15} className="text-sky-400" />
                <span>Focus Route</span>
              </button>

              <button
                onClick={() => navigate('/backpacking')}
                className="py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Gear checklist"
              >
                <Backpack size={15} className="text-amber-400" />
                <span>Gear</span>
              </button>

              <button
                onClick={onClearRoute}
                className="py-3 px-3 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 active:scale-95 text-red-300 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                title="Clear route"
              >
                <X size={15} />
                <span>Clear</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
