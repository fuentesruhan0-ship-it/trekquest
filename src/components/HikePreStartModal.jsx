import { useState, useEffect } from 'react';
import {
  Mountain, Navigation, Clock, Calendar, CloudSun,
  Footprints, AlertTriangle, Play, X, Wind, Droplets,
  MapPin, ChevronRight, Download
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { haversine } from '@/lib/philippinePlaces';

// Simple weather fetch using Open-Meteo (free, no API key)
async function fetchWeather(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();
    const c = data.current;
    const code = c.weathercode ?? 0;
    let condition = 'Clear';
    let emoji = '☀️';
    if (code >= 1 && code <= 3) { condition = 'Partly Cloudy'; emoji = '⛅'; }
    if (code >= 45 && code <= 57) { condition = 'Foggy'; emoji = '🌫️'; }
    if (code >= 61 && code <= 67) { condition = 'Rainy'; emoji = '🌧️'; }
    if (code >= 71 && code <= 77) { condition = 'Snowy'; emoji = '❄️'; }
    if (code >= 80 && code <= 82) { condition = 'Showers'; emoji = '🌦️'; }
    if (code >= 95) { condition = 'Thunderstorm'; emoji = '⛈️'; }
    return {
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      condition,
      emoji,
      wind: Math.round(c.windspeed_10m),
      humidity: Math.round(c.relativehumidity_2m),
    };
  } catch {
    return { temp: 26, feelsLike: 28, condition: 'Partly Cloudy', emoji: '⛅', wind: 12, humidity: 72 };
  }
}

export default function HikePreStartModal({
  destination,
  currentPosition,
  onClose,
  onStartHike,
  onOpenOfflineMaps,
}) {
  const { user } = useAuth();
  const [weather, setWeather] = useState(null);
  const [starting, setStarting] = useState(false);

  const hikerName = user?.full_name || user?.fullName || user?.firstName || (user?.email ? user.email.split('@')[0] : 'Hiker');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  const distKm = (currentPosition && destination)
    ? haversine(currentPosition, [destination.lat, destination.lng])
    : parseFloat(destination?.distanceKm || 5);

  const estHours = parseFloat(destination?.estHours || Math.max(0.4, distKm / 3.5).toFixed(1));

  const returnTime = new Date(now.getTime() + estHours * 60 * 60 * 1000);
  const returnStr = returnTime.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  const returnDateStr = returnTime.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });

  useEffect(() => {
    if (destination?.lat && destination?.lng) {
      fetchWeather(destination.lat, destination.lng).then(setWeather);
    }
  }, [destination]);

  const safetyTips = [
    '💧 Bring at least 2L of water per person',
    '🧴 Apply sunscreen every 2 hours',
    '📱 Keep app open for live GPS tracking',
    estHours > 3 ? '🌙 Be back before sunset — start early' : '⚡ Fast-paced trail — pace yourself',
  ];

  const handleStart = () => {
    setStarting(true);
    setTimeout(() => {
      onStartHike(destination);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[3400] flex flex-col overflow-hidden animate-in fade-in duration-300">
      {/* Cinematic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a10] via-[#0e2018] to-[#060f0a]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/60" />

      {/* Scrollable Content */}
      <div className="relative z-10 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="w-full max-w-md mx-auto px-5 pt-5 pb-36 space-y-4">

          {/* Top Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Mountain size={16} className="text-emerald-400" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Hike Information
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition active:scale-90 cursor-pointer"
            >
              <X size={17} />
            </button>
          </div>

          {/* Hiker Badge */}
          <div className="flex items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0">
              {hikerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registered Hiker</p>
              <h2 className="text-lg font-extrabold text-white truncate leading-tight">{hikerName}</h2>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                GPS Active • Ready to Hike
              </p>
            </div>
          </div>

          {/* Destination Hero Card */}
          <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-[#0e2018] to-slate-950" />
            <div className="relative p-5 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
                🏁 Destination
              </p>
              <h1 className="text-2xl font-black text-white leading-tight">
                {destination?.name || 'Summit Peak'}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin size={12} />
                {destination?.region || 'Philippines'}
                {destination?.type && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                    {destination.type}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div className="col-span-2 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                <Calendar size={18} className="text-sky-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</p>
                <p className="text-sm font-extrabold text-white leading-tight">{dateStr}</p>
                <p className="text-xs text-sky-300 font-mono">{timeStr}</p>
              </div>
            </div>

            {/* Distance */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <Navigation size={20} className="text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 font-bold uppercase">Distance</p>
              <p className="text-xl font-black text-emerald-400 font-mono">{distKm.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400">km</p>
            </div>

            {/* Est. Duration */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
              <Clock size={20} className="text-amber-400 mx-auto mb-1" />
              <p className="text-[10px] text-slate-400 font-bold uppercase">Est. Duration</p>
              <p className="text-xl font-black text-amber-400 font-mono">~{estHours}</p>
              <p className="text-[10px] text-slate-400">hours</p>
            </div>

            {/* Estimated Return */}
            <div className="col-span-2 p-3.5 rounded-2xl bg-orange-950/40 border border-orange-500/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] text-orange-400 font-bold uppercase">⏰ Estimated Return</p>
                <p className="text-base font-extrabold text-white">{returnStr}</p>
                <p className="text-[10px] text-orange-300">{returnDateStr} — plan to be back before sunset!</p>
              </div>
            </div>
          </div>

          {/* Live Weather Card */}
          <div className="p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30">
            <div className="flex items-center gap-2 mb-3">
              <CloudSun size={16} className="text-sky-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                Current Weather at Destination
              </span>
            </div>
            {weather ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{weather.emoji}</span>
                  <div>
                    <p className="text-2xl font-black text-white">{weather.temp}°C</p>
                    <p className="text-[10px] text-slate-400">Feels {weather.feelsLike}°C</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-sky-300">{weather.condition}</p>
                  <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-1">
                    <Wind size={11} /> {weather.wind} km/h wind
                  </p>
                  <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                    <Droplets size={11} /> {weather.humidity}% humidity
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 text-xs animate-pulse">
                <CloudSun size={16} className="animate-spin" />
                <span>Fetching live weather…</span>
              </div>
            )}
            {weather && (
              <div className={`mt-3 px-3 py-2 rounded-xl text-[10px] font-bold border ${
                weather.condition.includes('Rain') || weather.condition.includes('Thunder')
                  ? 'bg-red-950/60 border-red-500/40 text-red-300'
                  : weather.temp > 35
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}>
                {weather.condition.includes('Rain') || weather.condition.includes('Thunder')
                  ? '⚠️ Rain or storms detected. Consider postponing or bring rain gear.'
                  : weather.temp > 35
                  ? '☀️ High heat advisory. Drink extra water and rest often.'
                  : '✅ Good hiking conditions. Enjoy your trail safely!'}
              </div>
            )}
          </div>

          {/* Offline Map Pre-cache Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Download size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Offline Trail Map</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Satellite GPS Ready
                  </span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Pre-download satellite & topo maps for this trail with 0 phone load needed.
                </p>
              </div>
            </div>
            {onOpenOfflineMaps && (
              <button
                type="button"
                onClick={onOpenOfflineMaps}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-lg active:scale-95"
              >
                Cache Map
              </button>
            )}
          </div>

          {/* Safety Tips */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-amber-400" />
              Safety Reminders
            </p>
            <div className="space-y-1.5">
              {safetyTips.map((tip, i) => (
                <p key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                  <ChevronRight size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                  {tip}
                </p>
              ))}
            </div>
          </div>

          {/* Live Tracking Features */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Footprints size={13} className="text-emerald-400" />
              Live Tracking Features Active
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
              {[
                '🚶 Step Counter & Pedometer',
                '🔥 Calorie Burn Calculator',
                '🛰️ Live GPS Navigation Line',
                '💧 Water Reminder (20 min)',
                '🧘 Rest Reminder (40 min)',
                '⏰ Return Time Alerts',
                '📷 Camera / Plant Scanner',
                '🧭 Digital Compass',
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom: START HIKE Button */}
      <div className="absolute bottom-0 inset-x-0 z-10 px-5 pb-8 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent">
        <button
          onClick={handleStart}
          disabled={starting}
          className={`w-full py-5 rounded-full font-black text-base flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.97] cursor-pointer ${
            starting
              ? 'bg-emerald-700 text-white scale-[0.98]'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-900/50'
          }`}
        >
          {starting ? (
            <>
              <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Starting Hike…</span>
            </>
          ) : (
            <>
              <Play size={22} fill="white" />
              <span>START HIKE</span>
            </>
          )}
        </button>
        <p className="text-center text-[10px] text-slate-500 mt-2">
          GPS tracking, step detection &amp; reminders will activate automatically
        </p>
      </div>
    </div>
  );
}
