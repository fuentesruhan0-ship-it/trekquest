import { useState } from 'react';
import {
  Navigation, X, Flame, Footprints, Clock, ChevronUp, ChevronDown, CheckCircle2, Play
} from 'lucide-react';
import { haversine } from '@/lib/philippinePlaces';

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
  const [collapsed, setCollapsed] = useState(false);

  if (!destination) return null;

  const distKm = currentPosition
    ? haversine(currentPosition, [destination.lat, destination.lng])
    : (destination.distanceKm || 0);

  // Average hiking pace 3.5 km/h
  const estHours = Math.max(0.4, (distKm / 3.5)).toFixed(1);

  // Cadence math: ~1,330 steps per km on mountainous trails
  const calculatedSteps = Math.round(distKm * 1330);

  // Calorie math: combination of steps + trail effort (~0.045 kcal/step + duration)
  const calculatedCalories = Math.max(
    15,
    Math.round(calculatedSteps * 0.045 + (parseFloat(estHours) * 60) * 4.2)
  );

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
      {/* Semi-transparent frosted glass container so the map is clearly visible underneath */}
      <div className="bg-slate-950/50 hover:bg-slate-950/70 backdrop-blur-2xl border border-white/15 rounded-3xl p-3.5 sm:p-4 shadow-2xl text-white space-y-3 transition-colors duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Navigation size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                  Hike Information
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getBadgeColor(destination.type)}`}>
                  {destination.type || 'Destination'}
                </span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate leading-tight">
                {destination.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              title={collapsed ? 'Expand details' : 'Collapse'}
            >
              {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-red-500/30 text-slate-300 hover:text-red-400 transition cursor-pointer"
              title="Close card"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Collapsed view summary */}
        {collapsed ? (
          <div className="flex items-center justify-between text-xs py-0.5">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-400">{distKm.toFixed(2)} km</span>
              <span className="text-sky-300 flex items-center gap-1">
                <Footprints size={12} /> {calculatedSteps.toLocaleString()} steps
              </span>
              <span className="text-amber-300 flex items-center gap-1">
                <Flame size={12} /> {calculatedCalories} kcal
              </span>
            </div>
            <button
              onClick={onRecenterRoute}
              className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
            >
              View Route →
            </button>
          </div>
        ) : (
          /* Full Hike Details - Cleaned to Burned Calories & Steps Counter as requested */
          <>
            <p className="text-[11px] text-slate-300 -mt-1 truncate">
              📍 {destination.region || 'Philippines'} • Follow blue line on map
            </p>

            {/* 4 Metric Stats Grid (Burned Calories, Steps Counter, Distance, Est. Time) */}
            <div className="grid grid-cols-4 gap-2 text-center py-1">
              {/* 1. Distance */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-md">
                <span className="text-[9px] text-slate-400 block font-bold uppercase flex items-center justify-center gap-0.5">
                  <Navigation size={10} className="text-emerald-400" /> Dist.
                </span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
                  {distKm.toFixed(1)}
                </span>
                <span className="text-[9px] text-slate-400 block">km</span>
              </div>

              {/* 2. Est. Time Duration */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-md">
                <span className="text-[9px] text-slate-400 block font-bold uppercase flex items-center justify-center gap-0.5">
                  <Clock size={10} className="text-amber-400" /> Est. Time
                </span>
                <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">
                  ~{estHours}
                </span>
                <span className="text-[9px] text-slate-400 block">hours</span>
              </div>

              {/* 3. Steps Counter / Steps Taken */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-md">
                <span className="text-[9px] text-slate-400 block font-bold uppercase flex items-center justify-center gap-0.5">
                  <Footprints size={10} className="text-sky-400" /> Steps
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-sky-400 font-mono block mt-0.5">
                  {calculatedSteps.toLocaleString()}
                </span>
                <span className="text-[9px] text-slate-400 block">counter</span>
              </div>

              {/* 4. Burned Calories */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2 backdrop-blur-md">
                <span className="text-[9px] text-slate-400 block font-bold uppercase flex items-center justify-center gap-0.5">
                  <Flame size={10} className="text-rose-400" /> Calories
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-rose-400 font-mono block mt-0.5">
                  {calculatedCalories}
                </span>
                <span className="text-[9px] text-slate-400 block">kcal burn</span>
              </div>
            </div>

            {/* Action Buttons: Recenter Route & Start/End Hike */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onRecenterRoute}
                className="flex-1 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
              >
                <span>Focus Map</span>
              </button>

              <button
                onClick={onClearRoute}
                className="px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs font-bold transition flex items-center justify-center cursor-pointer border border-white/10"
                title="Clear Destination"
              >
                Clear
              </button>

              <button
                onClick={isTracking ? onStopTracking : onStartTracking}
                className={`flex-[2] py-2.5 rounded-2xl font-extrabold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  isTracking
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/30'
                }`}
              >
                {isTracking ? (
                  <>
                    <X size={14} /> Stop Active Hike
                  </>
                ) : (
                  <>
                    <Play size={14} /> Start Hiking Now →
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
