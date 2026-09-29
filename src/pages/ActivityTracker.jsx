import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/PageHeader';
import { Flame, Footprints, Play, Square, Weight, Ruler } from 'lucide-react';

export default function ActivityTracker() {
  const [weight, setWeight] = useState(70);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [usingSensor, setUsingSensor] = useState(false);
  const intervalRef = useRef(null);
  const accelRef = useRef(null);
  const lastPeak = useRef(0);

  // Calorie estimate: MET-based. Hiking ~6 METs. Calories = MET * weight(kg) * hours
  const hours = elapsed / 3600;
  const calories = Math.round(6 * weight * hours);
  // stride ~0.75m
  const distKm = (steps * 0.75) / 1000;

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Step detection via accelerometer
  useEffect(() => {
    if (!running || !('DeviceMotionEvent' in window)) return;
    setUsingSensor(true);
    const handler = (e) => {
      const mag = Math.sqrt(
        (e.accelerationIncludingGravity?.x || 0) ** 2 +
        (e.accelerationIncludingGravity?.y || 0) ** 2 +
        (e.accelerationIncludingGravity?.z || 0) ** 2
      );
      const now = Date.now();
      if (mag > 12 && now - lastPeak.current > 300) {
        lastPeak.current = now;
        setSteps((s) => s + 1);
      }
    };
    window.addEventListener('devicemotion', handler);
    accelRef.current = handler;

    return () => {
      if (accelRef.current) window.removeEventListener('devicemotion', accelRef.current);
      setUsingSensor(false);
    };
  }, [running]);

  const start = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        await DeviceMotionEvent.requestPermission();
      } catch (err) {
        console.warn('Motion permission notice:', err);
      }
    }
    setRunning(true);
    setSteps(0);
    setElapsed(0);
  };
  const stop = () => setRunning(false);
  const addSteps = (n) => setSteps((s) => Math.max(0, s + n));

  const fmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-full">
      <PageHeader title="Calorie & Step Counter" subtitle="Track your hiking activity" icon={Flame} accent="bg-rose-600" />
      <div className="p-4 space-y-4">
        {/* Big stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-rose-500 to-red-600 text-white rounded-2xl p-4 text-center">
            <Flame size={28} className="mx-auto" />
            <p className="text-3xl font-bold mt-1">{calories}</p>
            <p className="text-xs opacity-90">calories burned</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4 text-center">
            <Footprints size={28} className="mx-auto" />
            <p className="text-3xl font-bold mt-1">{steps}</p>
            <p className="text-xs opacity-90">steps taken</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-lg font-bold">{fmt(elapsed)}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <p className="text-xs text-muted-foreground">Distance</p>
            <p className="text-lg font-bold">{distKm.toFixed(2)} km</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!running ? (
            <button onClick={start} className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
              <Play size={18} /> Start Tracking
            </button>
          ) : (
            <button onClick={stop} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
              <Square size={18} /> Stop
            </button>
          )}
        </div>

        {running && !usingSensor && (
          <div className="flex gap-2">
            <button onClick={() => addSteps(1)} className="flex-1 bg-muted py-2 rounded-xl text-sm font-semibold active:scale-95 transition">+1 step</button>
            <button onClick={() => addSteps(50)} className="flex-1 bg-muted py-2 rounded-xl text-sm font-semibold active:scale-95 transition">+50</button>
            <button onClick={() => addSteps(-50)} className="flex-1 bg-muted py-2 rounded-xl text-sm font-semibold active:scale-95 transition">−50</button>
          </div>
        )}

        {/* Settings */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2"><Weight size={16} /> Your Weight</h3>
          <div className="flex items-center gap-3">
            <Ruler size={16} className="text-muted-foreground" />
            <input type="range" min="40" max="120" value={weight} onChange={(e) => setWeight(+e.target.value)} className="flex-1 accent-rose-600" />
            <span className="text-sm font-semibold w-16 text-right">{weight} kg</span>
          </div>
          <p className="text-xs text-muted-foreground">Calories are estimated using a hiking MET value of 6.0 and your body weight.</p>
        </div>
      </div>
    </div>
  );
}