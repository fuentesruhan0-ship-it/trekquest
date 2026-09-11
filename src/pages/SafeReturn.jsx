import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/PageHeader';
import { Clock, Play, Square, Bell, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SafeReturn() {
  const [plannedHours, setPlannedHours] = useState(4);
  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [notified, setNotified] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const plannedMs = plannedHours * 3600 * 1000;
  const elapsed = startTime ? now - startTime : 0;
  const remaining = Math.max(0, plannedMs - elapsed);
  const progress = startTime ? Math.min(100, (elapsed / plannedMs) * 100) : 0;
  const isOverdue = startTime && elapsed >= plannedMs;
  const isWarning = startTime && remaining <= 30 * 60 * 1000 && remaining > 0; // last 30 min

  // notify
  useEffect(() => {
    if (!startTime || notified) return;
    if (remaining <= 30 * 60 * 1000) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Safe Return Reminder ⏰', { body: '30 minutes until your planned return time. Start heading back!' });
      }
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 660;
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } catch {}
      setNotified(true);
    }
  }, [remaining, startTime, notified]);

  const start = async () => {
    if ('Notification' in window) await Notification.requestPermission();
    setStartTime(Date.now());
    setNotified(false);
  };
  const stop = () => { setStartTime(null); setNotified(false); };

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-full">
      <PageHeader title="Safe Return Reminder" subtitle="Never overstay on the trail" icon={Clock} accent="bg-amber-700" />
      <div className="p-4 space-y-4">
        {/* Timer display */}
        <div className={`rounded-3xl p-6 text-center shadow-lg transition-colors ${
          isOverdue ? 'bg-gradient-to-br from-red-600 to-red-800 text-white' :
          isWarning ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' :
          'bg-card border border-border'
        }`}>
          <Clock size={40} className={`mx-auto ${isOverdue || isWarning ? 'text-white' : 'text-amber-700'}`} />
          {startTime ? (
            <>
              <p className="text-4xl font-bold mt-2 tabular-nums">
                {isOverdue ? 'OVERDUE' : fmt(remaining)}
              </p>
              <p className={`text-sm mt-1 ${isOverdue || isWarning ? 'text-white/90' : 'text-muted-foreground'}`}>
                {isOverdue ? 'past your planned return' : 'until return time'}
              </p>
              <div className="h-2 bg-white/20 rounded-full mt-4 overflow-hidden">
                <div className={`h-full rounded-full ${isOverdue ? 'bg-white' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
              </div>
              <p className={`text-xs mt-2 ${isOverdue || isWarning ? 'text-white/80' : 'text-muted-foreground'}`}>
                Elapsed: {fmt(elapsed)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Set your planned hike duration and start the timer.</p>
          )}
        </div>

        <div className="flex gap-2">
          {!startTime ? (
            <button onClick={start} className="flex-1 flex items-center justify-center gap-2 bg-amber-700 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
              <Play size={18} /> Start Hike Timer
            </button>
          ) : (
            <button onClick={stop} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
              <Square size={18} /> End Hike
            </button>
          )}
        </div>

        {/* Planner */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2"><Bell size={16} /> Planned Duration</h3>
          <div>
            <label className="text-xs text-muted-foreground">{plannedHours} hour{plannedHours !== 1 ? 's' : ''}</label>
            <input type="range" min="1" max="12" value={plannedHours} onChange={(e) => setPlannedHours(+e.target.value)} className="w-full accent-amber-700" />
          </div>
          <p className="text-xs text-muted-foreground">You'll get a reminder 30 minutes before your planned return time.</p>
        </div>

        {/* Tips */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-3">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Always share your planned return time with someone who is not hiking with you.</p>
          </div>
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
            <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800">If you're overdue, they'll know to alert search and rescue.</p>
          </div>
        </div>
      </div>
    </div>
  );
}