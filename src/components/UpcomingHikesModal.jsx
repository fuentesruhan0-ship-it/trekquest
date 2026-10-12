import { useState, useEffect } from 'react';
import {
  Navigation, Calendar, Clock, Footprints, Flame, MapPin,
  ChevronRight, Edit3, Trash2, Play, X, Plus, Check, ArrowRight,
  Mountain, AlertCircle, Compass, History, ShieldAlert, Cloud, CloudRain, Sun, Snowflake
} from 'lucide-react';
import { haversine } from '@/lib/philippinePlaces';
import { base44 } from '@/api/base44Client';

// Helper to get steps per calorie based on weight
const getStepsPerCalorie = (weight) => {
  if (!weight) return 50; // default middle range
  if (weight >= 10 && weight <= 20) return 65; // average of 50-80
  if (weight >= 21 && weight <= 30) return 50; // average of 40-60
  if (weight >= 31 && weight <= 40) return 42.5; // average of 35-50
  if (weight >= 41 && weight <= 50) return 34.5; // average of 29-40
  if (weight >= 51 && weight <= 60) return 30; // average of 25-35
  if (weight >= 61 && weight <= 70) return 26; // average of 22-30
  if (weight >= 71 && weight <= 80) return 23.5; // average of 20-27
  if (weight >= 81 && weight <= 90) return 21.5; // average of 18-25
  if (weight >= 91 && weight <= 100) return 19.5; // average of 16-23
  return 50; // default fallback
};

// Helper to get user weight from emergency card
const getUserWeight = () => {
  try {
    const emergencyData = localStorage.getItem('trekquest_emergency_info');
    if (emergencyData) {
      const parsed = JSON.parse(emergencyData);
      return parsed.weight ? parseFloat(parsed.weight) : null;
    }
  } catch {}
  return null;
};

// Helper to get all upcoming hikes from localStorage with sample fallbacks
export function getSavedUpcomingHikes() {
  try {
    const raw = localStorage.getItem('trekquest_upcoming_hikes');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Also check legacy trekquest_saved_routes
    const legacy = localStorage.getItem('trekquest_saved_routes');
    if (legacy) {
      const parsedLegacy = JSON.parse(legacy);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        return parsedLegacy.map((r) => {
          const dist = parseFloat(r.distance || 8.5);
          const estH = Math.max(0.4, dist / 3.5).toFixed(1);
          const steps = Math.round(dist * 1330);
          const userWeight = getUserWeight();
          const stepsPerCalorie = getStepsPerCalorie(userWeight);
          const cals = Math.round(steps / stepsPerCalorie);
          const destWp = r.waypoints?.find((w) => w.isDest) || r.waypoints?.[r.waypoints.length - 1];
          return {
            id: r.id,
            name: r.name,
            title: r.name,
            date: r.date || new Date().toISOString().slice(0, 10),
            startName: 'Starting Point',
            startCoords: r.start || [14.0436, 120.8031],
            destName: destWp?.name || r.name,
            destCoords: destWp ? [destWp.lat, destWp.lng] : [14.0436, 120.8031],
            region: destWp?.region || 'Philippines',
            type: destWp?.type || 'Mountain Peak',
            distanceKm: dist.toFixed(1),
            estHours: estH,
            estSteps: steps,
            estCalories: cals,
            createdAt: r.createdAt || 'Recent',
            difficulty: 'Moderate',
            notes: 'Planned mountain trail route.',
            status: 'upcoming',
          };
        });
      }
    }
  } catch (err) {
    console.warn('Error reading upcoming hikes:', err);
  }

  // Return empty array if no hikes saved
  return [];
}

export function saveUpcomingHike(newHike) {
  try {
    const current = getSavedUpcomingHikes();
    const updated = [newHike, ...current.filter((h) => h.id !== newHike.id)];
    localStorage.setItem('trekquest_upcoming_hikes', JSON.stringify(updated));
    window.dispatchEvent(new Event('trekquest_upcoming_updated'));
    return updated;
  } catch (err) {
    console.error('Failed to save upcoming hike:', err);
    return [];
  }
}

export default function UpcomingHikesModal({
  isOpen,
  onClose,
  onStartHike,
  onViewOnMap,
  onPlanNewRoute,
  initialSelectedId = null,
}) {
  const [hikes, setHikes] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedHike, setSelectedHike] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    startName: '',
    destName: '',
    date: '',
    notes: '',
  });
  const [hikeWeather, setHikeWeather] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedHikeIds, setSelectedHikeIds] = useState(new Set());

  // Fetch weather for selected hike's destination and date
  useEffect(() => {
    if (!selectedHike || !selectedHike.destCoords) {
      setHikeWeather(null);
      return;
    }

    const fetchHikeWeather = async () => {
      try {
        const [lat, lng] = selectedHike.destCoords;
        // Use Open-Meteo forecast API
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`
        );
        const data = await response.json();

        // Find the weather for the hike date
        const hikeDate = selectedHike.date || new Date().toISOString().slice(0, 10);
        const dateIndex = data.daily?.time?.findIndex(d => d === hikeDate);

        if (dateIndex !== -1 && dateIndex !== undefined) {
          const weatherCode = data.daily.weather_code[dateIndex];
          const maxTemp = data.daily.temperature_2m_max[dateIndex];
          const minTemp = data.daily.temperature_2m_min[dateIndex];
          const precipitation = data.daily.precipitation_sum[dateIndex];

          // Determine weather condition
          let condition = 'Clear';
          let icon = 'sunny';
          if (weatherCode >= 1 && weatherCode <= 3) { condition = 'Partly Cloudy'; icon = 'partly'; }
          else if (weatherCode >= 45 && weatherCode <= 48) { condition = 'Foggy'; icon = 'foggy'; }
          else if (weatherCode >= 51 && weatherCode <= 67) { condition = 'Rainy'; icon = 'rainy'; }
          else if (weatherCode >= 71 && weatherCode <= 77) { condition = 'Snowy'; icon = 'snowy'; }
          else if (weatherCode >= 80 && weatherCode <= 82) { condition = 'Showers'; icon = 'rainy'; }
          else if (weatherCode >= 95 && weatherCode <= 99) { condition = 'Thunderstorm'; icon = 'stormy'; }

          setHikeWeather({
            condition,
            icon,
            maxTemp: Math.round(maxTemp),
            minTemp: Math.round(minTemp),
            precipitation: precipitation.toFixed(1),
          });
        } else {
          setHikeWeather(null);
        }
      } catch (err) {
        console.warn('Failed to fetch hike weather:', err);
        setHikeWeather(null);
      }
    };

    fetchHikeWeather();
  }, [selectedHike]);

  // Listen for storage / custom updates so hikes list is always synchronized
  useEffect(() => {
    const handleUpdate = () => {
      const list = getSavedUpcomingHikes();
      setHikes(list);
    };
    window.addEventListener('trekquest_upcoming_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('trekquest_upcoming_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Load upcoming hikes and past hike history on open
  useEffect(() => {
    if (isOpen) {
      const list = getSavedUpcomingHikes();
      setHikes(list);
      if (initialSelectedId) {
        const found = list.find((h) => h.id === initialSelectedId);
        setSelectedHike(found || null);
      } else {
        setSelectedHike(null);
      }
      setIsEditing(false);
      setSelectionMode(false);
      setSelectedHikeIds(new Set());

      // Load past hike history
      (async () => {
        try {
          const pastHikes = await base44.entities.Hike.list('-date', 30);
          if (pastHikes && pastHikes.length > 0) {
            setHistory(pastHikes);
          } else {
            const rawHist = localStorage.getItem('trekquest_hike_history');
            if (rawHist) {
              setHistory(JSON.parse(rawHist));
            } else {
              const defaultHist = [
                {
                  id: 'hist_1',
                  mountain: 'Mt. Batulao Summit',
                  date: '2026-09-02',
                  duration_minutes: 180,
                  distance_km: 10.2,
                  steps: 13560,
                  calories: 760,
                },
                {
                  id: 'hist_2',
                  mountain: 'Mt. Pulag Peak',
                  date: '2026-08-15',
                  duration_minutes: 270,
                  distance_km: 16.5,
                  steps: 21900,
                  calories: 1180,
                },
              ];
              setHistory(defaultHist);
            }
          }
        } catch {
          const rawHist = localStorage.getItem('trekquest_hike_history');
          if (rawHist) setHistory(JSON.parse(rawHist));
        }
      })();
    }
  }, [isOpen, initialSelectedId]);

  if (!isOpen) return null;

  const handleSelectHike = (hike) => {
    setSelectedHike(hike);
    setIsEditing(false);
  };

  const handleStartEdit = (hike, e) => {
    if (e) e.stopPropagation();
    setSelectedHike(hike);
    setEditForm({
      name: hike.name || `${hike.startName} → ${hike.destName}`,
      startName: hike.startName || 'Starting Point',
      destName: hike.destName || hike.title || 'Destination',
      date: hike.date || new Date().toISOString().slice(0, 10),
      notes: hike.notes || '',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedHike) return;
    const updatedHike = {
      ...selectedHike,
      name: editForm.name.trim() || selectedHike.name,
      startName: editForm.startName.trim() || selectedHike.startName,
      destName: editForm.destName.trim() || selectedHike.destName,
      date: editForm.date || selectedHike.date,
      notes: editForm.notes.trim(),
    };
    const updatedList = hikes.map((h) => (h.id === selectedHike.id ? updatedHike : h));
    setHikes(updatedList);
    setSelectedHike(updatedHike);
    setIsEditing(false);
    try {
      localStorage.setItem('trekquest_upcoming_hikes', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('trekquest_upcoming_updated'));
    } catch {}
  };

  const handleDeleteHike = (hikeId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Remove this planned hike from your upcoming list?')) {
      const updatedList = hikes.filter((h) => h.id !== hikeId);
      setHikes(updatedList);
      if (selectedHike?.id === hikeId) {
        setSelectedHike(null);
        setIsEditing(false);
      }
      try {
        localStorage.setItem('trekquest_upcoming_hikes', JSON.stringify(updatedList));
        window.dispatchEvent(new Event('trekquest_upcoming_updated'));
      } catch {}
    }
  };

  const handleDeleteHistoryItem = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Permanently delete this hike history record?')) {
      const updated = history.filter((h) => h.id !== id);
      setHistory(updated);
      try {
        localStorage.setItem('trekquest_hike_history', JSON.stringify(updated));
        if (!id.startsWith('hist_')) {
          await base44.entities.Hike.delete(id);
        }
      } catch {}
    }
  };

  const handleDeleteAllHistory = async () => {
    if (window.confirm('Are you sure you want to permanently delete ALL hike history? This action cannot be undone.')) {
      setHistory([]);
      try {
        localStorage.removeItem('trekquest_hike_history');
        const all = await base44.entities.Hike.list('-date', 100);
        for (const item of all) {
          await base44.entities.Hike.delete(item.id).catch(() => {});
        }
      } catch {}
    }
  };

  const handleToggleSelection = (hikeId) => {
    const newSelection = new Set(selectedHikeIds);
    if (newSelection.has(hikeId)) {
      newSelection.delete(hikeId);
    } else {
      newSelection.add(hikeId);
    }
    setSelectedHikeIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedHikeIds.size === hikes.length) {
      setSelectedHikeIds(new Set());
    } else {
      setSelectedHikeIds(new Set(hikes.map(h => h.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedHikeIds.size === 0) return;
    if (window.confirm(`Delete ${selectedHikeIds.size} selected hike(s)?`)) {
      const updatedList = hikes.filter(h => !selectedHikeIds.has(h.id));
      setHikes(updatedList);
      setSelectedHikeIds(new Set());
      setSelectionMode(false);
      try {
        localStorage.setItem('trekquest_upcoming_hikes', JSON.stringify(updatedList));
        window.dispatchEvent(new Event('trekquest_upcoming_updated'));
      } catch {}
    }
  };

  const handleStartThisHike = (hike) => {
    onClose();
    if (onStartHike) {
      onStartHike(hike);
    }
  };

  const handleViewThisRouteOnMap = (hike) => {
    onClose();
    if (onViewOnMap) {
      onViewOnMap(hike);
    }
  };

  return (
    <div className="fixed inset-0 z-[3300] bg-black/75 backdrop-blur-xl flex flex-col justify-end sm:justify-center p-0 sm:p-4 text-white font-sans animate-in fade-in duration-200">
      <div className="bg-slate-950/90 border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-3xl max-w-lg w-full mx-auto max-h-[90vh] flex flex-col shadow-2xl backdrop-blur-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Navigation size={18} />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-white leading-tight">
                Upcoming Hike Information
              </h2>
              <p className="text-[11px] text-slate-400">Your planned hike details &amp; route information</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Content Body: Either Details View or List View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          
          {selectedHike ? (
            /* ── DETAIL / EDIT VIEW OF SELECTED HIKE ─────────────────────────── */
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
              
              {/* Back to List Button */}
              <button
                onClick={() => { setSelectedHike(null); setIsEditing(false); }}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                ← Back to Routes List
              </button>

              {isEditing ? (
                /* Edit Form */
                <div className="p-4 rounded-3xl bg-white/5 border border-white/15 space-y-3 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      <Edit3 size={15} className="text-emerald-400" />
                      <span>Edit Planned Hike</span>
                    </h3>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Hike Title / Route Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Starting Point
                      </label>
                      <input
                        type="text"
                        value={editForm.startName}
                        onChange={(e) => setEditForm({ ...editForm, startName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={editForm.destName}
                        onChange={(e) => setEditForm({ ...editForm, destName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Hike Date
                    </label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Trail Notes &amp; Preparation
                    </label>
                    <textarea
                      rows={2}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Add trail tips, packing notes, or team details..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs font-semibold focus:outline-none focus:border-emerald-400 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSaveEdit}
                    className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} /> Save Changes
                  </button>
                </div>
              ) : (
                /* Hero Card for Selected Hike */
                <div className="relative rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-emerald-950/60 via-slate-900/80 to-slate-950/90 border border-emerald-500/30 shadow-2xl space-y-3 backdrop-blur-2xl">
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          🏁 Planned Destination
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {selectedHike.type || 'Peak'}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white mt-1 leading-tight">
                        {selectedHike.destName || selectedHike.title || selectedHike.name}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} className="text-emerald-400 shrink-0" />
                        <span>Date: <strong className="text-white">{selectedHike.date || 'Today'}</strong></span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleStartEdit(selectedHike, e)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Edit Hike"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteHike(selectedHike.id, e)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-red-500/30 text-slate-400 hover:text-red-300 transition cursor-pointer"
                        title="Delete Hike"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Route Trajectory (Start → Destination) */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-emerald-400/40">
                        S
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Starting Point</span>
                        <p className="font-semibold text-white truncate text-xs">
                          {selectedHike.startName || 'Custom Start'}
                        </p>
                      </div>
                    </div>

                    <div className="border-l-2 border-dashed border-white/20 ml-2.5 h-3" />

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-red-400/40">
                        🏁
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Destination</span>
                        <p className="font-semibold text-white truncate text-xs">
                          {selectedHike.destName || selectedHike.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Title for Estimated Metrics */}
                  <h3 className="text-xs font-extrabold text-slate-300 tracking-wider uppercase flex items-center gap-1.5">
                    <Navigation size={12} className="text-emerald-400" />
                    Estimated Hike Stats
                  </h3>

                  {/* 4-Metric Grid: Distance, Est. Time, Step Counter, Burned Calories */}
                  <div className="grid grid-cols-4 gap-2 text-center py-1">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 backdrop-blur-md">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block flex items-center justify-center gap-0.5">
                        <Navigation size={10} className="text-emerald-400" /> Dist.
                      </span>
                      <p className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                        {parseFloat(selectedHike.distanceKm || 0).toFixed(1)}
                      </p>
                      <span className="text-[9px] text-slate-400">km</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 backdrop-blur-md">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block flex items-center justify-center gap-0.5">
                        <Clock size={10} className="text-amber-400" /> Duration
                      </span>
                      <p className="text-sm sm:text-base font-extrabold text-amber-400 font-mono mt-0.5">
                        ~{selectedHike.estHours || '3.5'}
                      </p>
                      <span className="text-[9px] text-slate-400">hours</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 backdrop-blur-md">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block flex items-center justify-center gap-0.5">
                        <Footprints size={10} className="text-sky-400" /> Steps
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-sky-400 font-mono mt-0.5">
                        {(selectedHike.estSteps || Math.round(parseFloat(selectedHike.distanceKm || 5) * 1330)).toLocaleString()}
                      </p>
                      <span className="text-[9px] text-slate-400">steps</span>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 backdrop-blur-md">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block flex items-center justify-center gap-0.5">
                        <Flame size={10} className="text-rose-400" /> Calories
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-rose-400 font-mono mt-0.5">
                        {(() => {
                          const savedWeight = selectedHike.userWeight || getUserWeight();
                          const stepsPerCalorie = getStepsPerCalorie(savedWeight);
                          const estCals = Math.round((selectedHike.estSteps || 5000) / stepsPerCalorie);
                          return selectedHike.estCalories || estCals;
                        })()}
                      </p>
                      <span className="text-[9px] text-slate-400">kcal</span>
                    </div>
                  </div>

                  {/* Weather Forecast for Hike Day */}
                  {hikeWeather ? (
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2 flex items-center gap-1.5">
                        <Cloud size={11} className="text-sky-400" />
                        Weather Forecast for {selectedHike.date}
                      </span>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {hikeWeather.icon === 'sunny' && <Sun size={20} className="text-amber-400" />}
                          {hikeWeather.icon === 'partly' && <Cloud size={20} className="text-slate-300" />}
                          {hikeWeather.icon === 'rainy' && <CloudRain size={20} className="text-sky-400" />}
                          {hikeWeather.icon === 'stormy' && <CloudRain size={20} className="text-purple-400" />}
                          {hikeWeather.icon === 'foggy' && <Cloud size={20} className="text-slate-400" />}
                          {hikeWeather.icon === 'snowy' && <Snowflake size={20} className="text-blue-300" />}
                          <span className="font-semibold text-white">{hikeWeather.condition}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white">{hikeWeather.maxTemp}°</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-slate-400">{hikeWeather.minTemp}°</span>
                          {parseFloat(hikeWeather.precipitation) > 0 && (
                            <span className="ml-2 text-sky-400 text-[10px]">💧 {hikeWeather.precipitation}mm</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Explicit Start Button in Detail View */}
                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => handleStartThisHike(selectedHike)}
                      className="w-full py-4 rounded-2xl bg-[#f05c48] hover:bg-[#e44e39] text-white font-extrabold text-sm shadow-xl shadow-[#f05c48]/30 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer border border-white/20"
                    >
                      <Play size={18} fill="currentColor" />
                      <span>Start This Hike Now →</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleViewThisRouteOnMap(selectedHike)}
                        className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-white/15"
                      >
                        <Compass size={14} className="text-sky-400" />
                        <span>View on Map</span>
                      </button>

                      <button
                        onClick={(e) => handleStartEdit(selectedHike, e)}
                        className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-white/15"
                      >
                        <Edit3 size={14} className="text-amber-400" />
                        <span>Edit Hike Info</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── LIST VIEW: UPCOMING (TOP) & HISTORY (BELOW) ───────────────── */
            <div className="space-y-6">
              
              {/* 1. UPCOMING HIKES SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Navigation size={13} />
                    <span>Upcoming Planned Hikes</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {!selectionMode && hikes.length > 0 && (
                      <button
                        onClick={() => setSelectionMode(true)}
                        className="text-[10px] text-slate-400 hover:text-red-400 font-bold transition cursor-pointer"
                      >
                        Select
                      </button>
                    )}
                    {selectionMode && (
                      <>
                        <button
                          onClick={handleSelectAll}
                          className="text-[10px] text-slate-400 hover:text-white font-bold transition cursor-pointer"
                        >
                          {selectedHikeIds.size === hikes.length ? 'Deselect All' : 'Select All'}
                        </button>
                        {selectedHikeIds.size > 0 && (
                          <button
                            onClick={handleDeleteSelected}
                            className="text-[10px] text-red-400 hover:text-red-300 font-bold transition cursor-pointer"
                          >
                            Delete ({selectedHikeIds.size})
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectionMode(false); setSelectedHikeIds(new Set()); }}
                          className="text-[10px] text-slate-400 hover:text-white font-bold transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <span className="text-[10px] text-slate-400">{hikes.length} planned</span>
                  </div>
                </div>

                {hikes.length === 0 ? (
                  <div className="text-center py-6 space-y-2 bg-white/5 border border-dashed border-white/15 rounded-3xl p-5">
                    <Navigation size={28} className="mx-auto text-slate-500" />
                    <p className="text-xs text-white font-semibold">No upcoming hikes planned yet.</p>
                    {onPlanNewRoute && (
                      <button
                        onClick={() => { onClose(); onPlanNewRoute(); }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={13} /> Plan a Route
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {hikes.map((hike) => {
                      const dist = parseFloat(hike.distanceKm || 0);
                      const estTime = hike.estHours ? `~${hike.estHours}h` : '3h';
                      const dateStr = hike.date || 'Upcoming';
                      const isSelected = selectedHikeIds.has(hike.id);

                      return (
                        <div
                          key={hike.id}
                          onClick={() => selectionMode ? handleToggleSelection(hike.id) : handleSelectHike(hike)}
                          className={`p-3.5 sm:p-4 rounded-3xl ${isSelected ? 'bg-red-600/20 border-red-500/40' : 'bg-slate-900/60 hover:bg-slate-900/90 border-white/10 hover:border-emerald-500/40'} border shadow-xl transition active:scale-[0.99] cursor-pointer group flex items-center justify-between gap-3 backdrop-blur-xl`}
                        >
                          {selectionMode && (
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-red-500 border-red-500' : 'border-slate-400'}`}>
                                {isSelected && <Check size={12} className="text-white" />}
                              </div>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <h4 className="font-extrabold text-sm text-white truncate group-hover:text-emerald-300 transition">
                                {hike.destName || hike.title || hike.name}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300">
                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar size={11} className="text-emerald-400" />
                                <span>{dateStr}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-amber-300 font-mono">
                                <Clock size={11} />
                                <span>{estTime}</span>
                              </span>
                              <span>•</span>
                              <span className="text-emerald-400 font-mono font-bold">
                                {dist.toFixed(1)} km
                              </span>
                            </div>
                          </div>

                          {/* Explicit START button on the right side of the row (Section 7) */}
                          {!selectionMode && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartThisHike(hike);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-[#f05c48] hover:bg-[#e44e39] text-white font-extrabold text-xs shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer border border-white/20"
                                title="Start this hike immediately"
                              >
                                <Play size={12} fill="currentColor" />
                                <span>Start</span>
                              </button>
                              <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. HISTORY (BELOW UPCOMING) */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <History size={13} className="text-slate-400" />
                    <span>Hike History</span>
                  </h3>
                  
                  {history.length > 0 && (
                    <button
                      onClick={handleDeleteAllHistory}
                      className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 size={12} />
                      <span>Delete history</span>
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-white/5 text-center text-xs text-slate-400">
                    No past hikes in history yet. Completed hikes appear here automatically.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs backdrop-blur-md"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-white truncate text-xs">
                            {item.mountain || item.trail_name || 'Mountain Hike'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span>{item.date || 'Past Hike'}</span>
                            {item.distance_km && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-mono font-bold">{item.distance_km} km</span>
                              </>
                            )}
                            {item.duration_minutes && (
                              <>
                                <span>•</span>
                                <span className="text-amber-400 font-mono">
                                  {Math.floor(item.duration_minutes / 60)}h {item.duration_minutes % 60}m
                                </span>
                              </>
                            )}
                            {item.steps && (
                              <>
                                <span>•</span>
                                <span className="text-sky-400 font-mono">{item.steps.toLocaleString()} steps</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Individual Delete Button */}
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition cursor-pointer shrink-0"
                          title="Delete this history record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer Bar: Plan Another Route Button */}
        {!selectedHike && onPlanNewRoute && (
          <div className="p-4 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
            <button
              onClick={() => { onClose(); onPlanNewRoute(); }}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <Plus size={15} />
              <span>Plan Another Route</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
