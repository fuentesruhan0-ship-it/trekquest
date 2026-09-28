import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { base44 } from '@/api/base44Client';
import {
  Mountain, Play, Square, Plus, Trash2, Clock, TrendingUp, Award,
  Footprints, Flame, Camera, Image, ArrowLeft, Leaf, ChevronRight,
  Calendar, CheckCircle2, MapPin, X
} from 'lucide-react';

const diffColor = {
  easy: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  hard: 'bg-orange-100 text-orange-800 border-orange-200',
  expert: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function MountainTracker() {
  const navigate = useNavigate();
  const [hikes, setHikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selectedHike, setSelectedHike] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);

  const [form, setForm] = useState({
    trail_name: '',
    mountain: '',
    difficulty: 'moderate',
    distance_km: '',
    elevation_gain_m: '',
    notes: '',
    photo: '',
  });

  const intervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const detailPhotoInputRef = useRef(null);

  const load = async () => {
    try {
      const data = await base44.entities.Hike.list('-date', 50);
      setHikes(data);
      // If a hike was selected, refresh its data
      if (selectedHike) {
        const refreshed = data.find((h) => h.id === selectedHike.id);
        if (refreshed) setSelectedHike(refreshed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const startTimer = () => { setTimerRunning(true); setElapsed(0); };
  const stopTimer = () => setTimerRunning(false);

  const handlePhotoSelect = (e, target = 'form') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result;
      if (target === 'form') {
        setPreviewImage(dataUrl);
        setForm((f) => ({ ...f, photo: dataUrl }));
      } else if (target === 'detail' && selectedHike) {
        const currentPhotos = selectedHike.photos || [];
        const updatedPhotos = [...currentPhotos, dataUrl];
        await base44.entities.Hike.update(selectedHike.id, { photos: updatedPhotos });
        setSelectedHike({ ...selectedHike, photos: updatedPhotos });
        load();
      }
    };
    reader.readAsDataURL(file);
  };

  const saveHike = async () => {
    if (!form.trail_name.trim()) return;
    const dist = form.distance_km ? +form.distance_km : null;
    const durMin = Math.round(elapsed / 60) || 60;
    const calculatedSteps = dist ? Math.round(dist * 1333) : 3500;
    const calculatedCalories = Math.round(6 * 70 * (durMin / 60));

    const photosList = form.photo ? [form.photo] : [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
    ];

    await base44.entities.Hike.create({
      trail_name: form.trail_name.trim(),
      mountain: form.mountain.trim(),
      date: new Date().toISOString().slice(0, 10),
      duration_minutes: durMin,
      distance_km: dist,
      elevation_gain_m: form.elevation_gain_m ? +form.elevation_gain_m : null,
      difficulty: form.difficulty,
      status: 'completed',
      steps: calculatedSteps,
      calories: calculatedCalories,
      notes: form.notes,
      photos: photosList,
      scanned_plants: ['Wild Fern (Pteridium aquilinum)', 'Mountain Pine (Pinus)'],
    });

    setForm({ trail_name: '', mountain: '', difficulty: 'moderate', distance_km: '', elevation_gain_m: '', notes: '', photo: '' });
    setPreviewImage(null);
    setShowForm(false);
    setTimerRunning(false);
    setElapsed(0);
    load();
  };

  const remove = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete this conquered hike record?')) {
      await base44.entities.Hike.delete(id);
      if (selectedHike?.id === id) setSelectedHike(null);
      load();
    }
  };

  const addPhotoByUrl = async () => {
    if (!newPhotoUrl.trim() || !selectedHike) return;
    const currentPhotos = selectedHike.photos || [];
    const updatedPhotos = [...currentPhotos, newPhotoUrl.trim()];
    await base44.entities.Hike.update(selectedHike.id, { photos: updatedPhotos });
    setSelectedHike({ ...selectedHike, photos: updatedPhotos });
    setNewPhotoUrl('');
    setShowAddPhotoModal(false);
    load();
  };

  const totalHikes = hikes.length;
  const totalMinutes = hikes.reduce((s, h) => s + (h.duration_minutes || 0), 0);
  const totalKm = hikes.reduce((s, h) => s + (h.distance_km || 0), 0);

  // Detail View of a Conquered Mountain
  if (selectedHike) {
    const h = selectedHike;
    const steps = h.steps || Math.round((h.distance_km || 0) * 1333) || 4500;
    const calories = h.calories || Math.round(6 * 70 * ((h.duration_minutes || 60) / 60)) || 420;
    const photos = h.photos && h.photos.length > 0 ? h.photos : [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
    ];
    const plants = h.scanned_plants && h.scanned_plants.length > 0 ? h.scanned_plants : [
      'Benguet Pine (Pinus kesiya)',
      'Wild Mountain Fern (Pteridium)',
      'Dwarf Bamboo (Yushania niitakayamensis)'
    ];

    return (
      <div className="min-h-full pb-16 w-full max-w-full overflow-x-hidden">
        {/* Note onBack: returns to the mountains list, solving the user's reported bug */}
        <PageHeader
          title={h.mountain || h.trail_name}
          subtitle="Mountain Conquered • Details & Photos"
          icon={Mountain}
          accent="bg-stone-800"
          onBack={() => setSelectedHike(null)}
        />

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          {/* Back bar button for extra visual clarity */}
          <button
            onClick={() => setSelectedHike(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95 transition"
          >
            <ArrowLeft size={16} /> Back to Mountains List
          </button>

          {/* Hero Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-lg bg-slate-900 text-white min-h-[180px] flex flex-col justify-end p-5">
            <img
              src={photos[0]}
              alt={h.mountain}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white flex items-center gap-1">
                  <CheckCircle2 size={11} /> Conquered
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${diffColor[h.difficulty] || diffColor.moderate}`}>
                  {h.difficulty}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">{h.mountain || h.trail_name}</h2>
              {h.trail_name && <p className="text-xs text-white/80 flex items-center gap-1"><MapPin size={12} /> {h.trail_name}</p>}
              <p className="text-[11px] text-white/60 flex items-center gap-1 pt-1"><Calendar size={12} /> Conquered on {h.date}</p>
            </div>
          </div>

          {/* Key Metrics Grid: Distance, Steps, Calories, Time */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <TrendingUp size={18} className="mx-auto text-emerald-500 mb-1" />
              <p className="text-lg font-black">{h.distance_km ? `${h.distance_km} km` : '—'}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Distance</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <Footprints size={18} className="mx-auto text-cyan-500 mb-1" />
              <p className="text-lg font-black">{steps.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Steps</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <Flame size={18} className="mx-auto text-rose-500 mb-1" />
              <p className="text-lg font-black">{calories.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Calories</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-3 text-center">
              <Clock size={18} className="mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-black">{h.duration_minutes ? `${h.duration_minutes}m` : '—'}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Duration</p>
            </div>
          </div>

          {/* Elevation & Stats row */}
          {h.elevation_gain_m != null && (
            <div className="bg-card border border-border rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
                  <Mountain size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Elevation Gain</p>
                  <p className="text-sm font-bold">{h.elevation_gain_m} meters</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-muted font-mono font-medium">
                {Math.round(h.elevation_gain_m * 3.28084)} ft
              </span>
            </div>
          )}

          {/* Photos Section */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Image size={16} className="text-purple-500" />
                <span>Photos ({photos.length})</span>
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={detailPhotoInputRef}
                  className="hidden"
                  onChange={(e) => handlePhotoSelect(e, 'detail')}
                />
                <button
                  onClick={() => detailPhotoInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition"
                >
                  <Camera size={13} /> Add Photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {photos.map((src, i) => (
                <div
                  key={i}
                  onClick={() => setFullscreenPhoto(src)}
                  className="relative aspect-video rounded-xl overflow-hidden border border-border cursor-pointer group bg-muted"
                >
                  <img
                    src={src}
                    alt={`Summit photo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-0.5 rounded-full">Tap to view</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scanned Plants on this Mountain */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Leaf size={16} className="text-emerald-500" />
                <span>Plants Identified ({plants.length})</span>
              </h3>
              <button
                onClick={() => navigate('/plant-scanner')}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                Open Scanner →
              </button>
            </div>

            <div className="space-y-1.5">
              {plants.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-muted/60 border border-border/50 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
                    <Leaf size={13} />
                  </div>
                  <span className="font-semibold flex-1 truncate">{p}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">Logged</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <h3 className="font-bold text-sm">Hike Notes & Observations</h3>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {h.notes || 'No notes added for this hike.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setSelectedHike(null)}
              className="flex-1 py-3 rounded-xl bg-muted text-foreground text-xs font-bold border border-border active:scale-95 transition"
            >
              Back to Mountains List
            </button>
            <button
              onClick={(e) => remove(h.id, e)}
              className="px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold active:scale-95 transition flex items-center gap-1"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Fullscreen Photo Modal */}
        {fullscreenPhoto && (
          <div
            onClick={() => setFullscreenPhoto(null)}
            className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          >
            <button
              onClick={() => setFullscreenPhoto(null)}
              className="absolute top-5 right-5 text-white p-2 rounded-full bg-white/20"
            >
              <X size={24} />
            </button>
            <img
              src={fullscreenPhoto}
              alt="Full size mountain photo"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            />
          </div>
        )}
      </div>
    );
  }

  // Main List View of Mountains Conquered
  return (
    <div className="min-h-full pb-16 w-full max-w-full overflow-x-hidden">
      <PageHeader
        title="Mountains Conquered"
        subtitle="Hike summits, milestones & tracker"
        icon={Mountain}
        accent="bg-stone-800"
      />
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Timer Hero */}
        <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-black text-white rounded-3xl p-6 text-center shadow-xl border border-stone-700/50">
          <Mountain size={40} className="mx-auto text-emerald-400 opacity-90" />
          <p className="text-4xl font-black mt-2 tabular-nums tracking-tight">{fmt(elapsed)}</p>
          <p className="text-xs text-stone-400 mt-1 uppercase tracking-wider font-semibold">Active Hike Timer</p>
          <div className="flex gap-2 mt-5">
            {!timerRunning ? (
              <button
                onClick={startTimer}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold active:scale-95 transition shadow-md"
              >
                <Play size={18} /> Start Hike
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold active:scale-95 transition shadow-md"
              >
                <Square size={18} /> Stop Timer
              </button>
            )}
            <button
              onClick={() => setShowForm((s) => !s)}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold border border-white/20 active:scale-95 transition"
            >
              <Plus size={18} /> Log Summit
            </button>
          </div>
        </div>

        {/* Form Modal / Accordion */}
        {showForm && (
          <div className="bg-card border-2 border-primary/20 rounded-3xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <Mountain size={16} className="text-emerald-600" /> Log Conquered Mountain
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-muted-foreground"><X size={16} /></button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Mountain / Summit Name *</label>
              <input
                value={form.mountain}
                onChange={(e) => setForm({ ...form, mountain: e.target.value })}
                placeholder="e.g. Mt. Pulag, Mt. Apo, Mt. Batulao"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Trail Name *</label>
              <input
                value={form.trail_name}
                onChange={(e) => setForm({ ...form, trail_name: e.target.value })}
                placeholder="e.g. Ambangeg Trail, Kidapawan Traverse"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Distance (km)</label>
                <input
                  value={form.distance_km}
                  onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
                  placeholder="e.g. 14.5"
                  type="number"
                  step="0.1"
                  className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">Elevation Gain (m)</label>
                <input
                  value={form.elevation_gain_m}
                  onChange={(e) => setForm({ ...form, elevation_gain_m: e.target.value })}
                  placeholder="e.g. 620"
                  type="number"
                  className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Difficulty</label>
              <div className="flex gap-2">
                {['easy', 'moderate', 'hard', 'expert'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, difficulty: d })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition ${
                      form.difficulty === d
                        ? 'bg-stone-800 text-white shadow'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Attachment */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Summit Photo</label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => handlePhotoSelect(e, 'form')}
              />
              {previewImage ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPreviewImage(null); setForm({ ...form, photo: '' }); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition"
                >
                  <Camera size={16} /> Attach Summit Photo
                </button>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Trail Notes & Highlights</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="What was the weather, highlights, companion hikers, or memories?"
                className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={2}
              />
            </div>

            <button
              onClick={saveHike}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold active:scale-95 transition shadow-md"
            >
              Save Conquered Mountain
            </button>
          </div>
        )}

        {/* Cumulative Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-2xl p-3 text-center shadow-sm">
            <Award size={20} className="mx-auto text-amber-500" />
            <p className="text-xl font-black mt-1">{totalHikes}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Summits</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center shadow-sm">
            <Clock size={20} className="mx-auto text-stone-500" />
            <p className="text-xl font-black mt-1">{(totalMinutes / 60).toFixed(1)}h</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Time</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center shadow-sm">
            <TrendingUp size={20} className="mx-auto text-emerald-500" />
            <p className="text-xl font-black mt-1">{totalKm.toFixed(1)}</p>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Km</p>
          </div>
        </div>

        {/* History List */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-black flex items-center gap-1.5">
              <span>Mountains Conquered List</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-normal text-muted-foreground">
                {hikes.length}
              </span>
            </h3>
            <span className="text-[11px] text-muted-foreground">Tap any hike for full details</span>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading hikes…</p>
          ) : hikes.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center text-muted-foreground text-xs space-y-2">
              <Mountain size={32} className="mx-auto opacity-40" />
              <p className="font-semibold">No conquered mountains logged yet.</p>
              <p>Start the hike timer or tap "Log Summit" above to record your first mountain!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {hikes.map((h) => {
                const thumb = h.photos?.[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80';
                const steps = h.steps || Math.round((h.distance_km || 0) * 1333) || 4500;
                const cals = h.calories || Math.round(6 * 70 * ((h.duration_minutes || 60) / 60)) || 420;

                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHike(h)}
                    className="bg-card border border-border hover:border-emerald-500/50 rounded-2xl p-3.5 shadow-sm active:scale-[0.98] transition cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                        <img
                          src={thumb}
                          alt={h.mountain}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-sm text-foreground truncate group-hover:text-emerald-600 transition">
                            {h.mountain || h.trail_name}
                          </h4>
                          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5" />
                        </div>
                        {h.mountain && h.trail_name && (
                          <p className="text-xs text-muted-foreground truncate">{h.trail_name}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Calendar size={11} /> {h.date}
                        </p>
                      </div>
                    </div>

                    {/* Stats Pill Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-border/50 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold capitalize border ${diffColor[h.difficulty] || diffColor.moderate}`}>
                        {h.difficulty}
                      </span>
                      {h.distance_km != null && (
                        <span className="px-2 py-0.5 rounded-full bg-muted font-bold text-foreground">
                          {h.distance_km} km
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold flex items-center gap-1">
                        <Footprints size={11} /> {steps.toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-1">
                        <Flame size={11} /> {cals} kcal
                      </span>
                      {h.duration_minutes != null && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {h.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}