import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/PageHeader';
import { base44 } from '@/api/base44Client';
import { Mountain, Play, Square, Plus, Trash2, Clock, TrendingUp, Award } from 'lucide-react';

const diffColor = {
  easy: 'bg-green-100 text-green-700',
  moderate: 'bg-amber-100 text-amber-700',
  hard: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
};

export default function MountainTracker() {
  const [hikes, setHikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ trail_name: '', mountain: '', difficulty: 'moderate', distance_km: '', elevation_gain_m: '', notes: '' });
  const intervalRef = useRef(null);

  const load = async () => {
    try {
      const data = await base44.entities.Hike.list('-date', 50);
      setHikes(data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

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

  const saveHike = async () => {
    if (!form.trail_name.trim()) return;
    await base44.entities.Hike.create({
      trail_name: form.trail_name.trim(),
      mountain: form.mountain.trim(),
      date: new Date().toISOString().slice(0, 10),
      duration_minutes: Math.round(elapsed / 60),
      distance_km: form.distance_km ? +form.distance_km : null,
      elevation_gain_m: form.elevation_gain_m ? +form.elevation_gain_m : null,
      difficulty: form.difficulty,
      status: 'completed',
      notes: form.notes,
    });
    setForm({ trail_name: '', mountain: '', difficulty: 'moderate', distance_km: '', elevation_gain_m: '', notes: '' });
    setShowForm(false);
    setTimerRunning(false);
    setElapsed(0);
    load();
  };

  const remove = async (id) => {
    await base44.entities.Hike.delete(id);
    load();
  };

  const totalHikes = hikes.length;
  const totalMinutes = hikes.reduce((s, h) => s + (h.duration_minutes || 0), 0);
  const totalKm = hikes.reduce((s, h) => s + (h.distance_km || 0), 0);

  return (
    <div className="min-h-full">
      <PageHeader title="Mountain Tracker" subtitle="Hike timer & completion log" icon={Mountain} accent="bg-stone-700" />
      <div className="p-4 space-y-4">
        {/* Timer */}
        <div className="bg-gradient-to-br from-stone-700 to-stone-900 text-white rounded-3xl p-6 text-center shadow-lg">
          <Mountain size={40} className="mx-auto opacity-80" />
          <p className="text-4xl font-bold mt-2 tabular-nums">{fmt(elapsed)}</p>
          <p className="text-xs opacity-70 mt-1">hiking timer</p>
          <div className="flex gap-2 mt-4">
            {!timerRunning ? (
              <button onClick={startTimer} className="flex-1 flex items-center justify-center gap-2 bg-white text-stone-800 py-2.5 rounded-xl font-semibold active:scale-95 transition">
                <Play size={18} /> Start
              </button>
            ) : (
              <button onClick={stopTimer} className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl font-semibold active:scale-95 transition">
                <Square size={18} /> Stop
              </button>
            )}
            <button onClick={() => setShowForm((s) => !s)} className="flex-1 flex items-center justify-center gap-2 bg-stone-600 text-white py-2.5 rounded-xl font-semibold active:scale-95 transition">
              <Plus size={18} /> Log Hike
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <input value={form.trail_name} onChange={(e) => setForm({ ...form, trail_name: e.target.value })} placeholder="Trail name" className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-stone-500" />
            <input value={form.mountain} onChange={(e) => setForm({ ...form, mountain: e.target.value })} placeholder="Mountain / location" className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-stone-500" />
            <div className="flex gap-2">
              <input value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} placeholder="Distance (km)" type="number" className="flex-1 px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-stone-500" />
              <input value={form.elevation_gain_m} onChange={(e) => setForm({ ...form, elevation_gain_m: e.target.value })} placeholder="Elev. gain (m)" type="number" className="flex-1 px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-stone-500" />
            </div>
            <div className="flex gap-2">
              {['easy', 'moderate', 'hard', 'expert'].map((d) => (
                <button key={d} onClick={() => setForm({ ...form, difficulty: d })}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize ${form.difficulty === d ? 'bg-stone-700 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {d}
                </button>
              ))}
            </div>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none" rows={2} />
            <button onClick={saveHike} className="w-full bg-stone-700 text-white py-2.5 rounded-xl font-semibold active:scale-95 transition">Save Completed Hike</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Award size={18} className="mx-auto text-amber-500" />
            <p className="text-xl font-bold mt-1">{totalHikes}</p>
            <p className="text-[10px] text-muted-foreground">hikes done</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Clock size={18} className="mx-auto text-stone-500" />
            <p className="text-xl font-bold mt-1">{Math.round(totalMinutes / 60)}h</p>
            <p className="text-[10px] text-muted-foreground">total time</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <TrendingUp size={18} className="mx-auto text-emerald-500" />
            <p className="text-xl font-bold mt-1">{totalKm.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">total km</p>
          </div>
        </div>

        {/* History */}
        <div>
          <h3 className="text-sm font-bold mb-2">Completed Hikes</h3>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
            hikes.length === 0 ? <p className="text-sm text-muted-foreground">No hikes logged yet.</p> :
            <div className="space-y-2">
              {hikes.map((h) => (
                <div key={h.id} className="bg-card border border-border rounded-2xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{h.trail_name}</p>
                      {h.mountain && <p className="text-xs text-muted-foreground truncate">{h.mountain}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{h.date}</p>
                    </div>
                    <button onClick={() => remove(h.id)} className="p-1.5 text-red-400 shrink-0"><Trash2 size={15} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${diffColor[h.difficulty] || diffColor.moderate}`}>{h.difficulty}</span>
                    {h.duration_minutes != null && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{h.duration_minutes} min</span>}
                    {h.distance_km != null && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{h.distance_km} km</span>}
                    {h.elevation_gain_m != null && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{h.elevation_gain_m} m↑</span>}
                  </div>
                  {h.notes && <p className="text-xs text-muted-foreground mt-2">{h.notes}</p>}
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}