import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/PageHeader';
import { Droplets, Plus, Minus, Bell, Activity } from 'lucide-react';

export default function WaterReminder() {
  const [weight, setWeight] = useState(70);
  const [duration, setDuration] = useState(120);
  const [intensity, setIntensity] = useState('moderate');
  const [intake, setIntake] = useState(0); // glasses drunk (250ml each)
  const [reminderOn, setReminderOn] = useState(false);
  const [lastDrink, setLastDrink] = useState(Date.now());
  const intervalRef = useRef(null);

  // Estimate: base 35ml/kg + extra for activity
  const intensityFactor = { easy: 0.5, moderate: 0.8, hard: 1.2 }[intensity] || 0.8;
  const baseNeed = (weight * 35) / 1000; // liters base daily
  const activityNeed = (duration / 60) * 0.5 * intensityFactor; // extra liters for hike
  const totalNeed = baseNeed + activityNeed;
  const glassesNeeded = Math.round((totalNeed * 1000) / 250);
  const consumed = intake * 0.25;
  const progress = glassesNeeded ? Math.min(100, (intake / glassesNeeded) * 100) : 0;

  useEffect(() => {
    if (!reminderOn) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      const mins = Math.floor((Date.now() - lastDrink) / 60000);
      if (mins >= 20) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Time to drink water! 💧', { body: 'Stay hydrated on the trail.' });
        }
        // beep
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          osc.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.start(); osc.stop(ctx.currentTime + 0.2);
        } catch {}
      }
    }, 60000);
    return () => clearInterval(intervalRef.current);
  }, [reminderOn, lastDrink]);

  const enableReminder = async () => {
    if ('Notification' in window) await Notification.requestPermission();
    setReminderOn((r) => !r);
  };

  const drink = () => {
    setIntake((i) => i + 1);
    setLastDrink(Date.now());
  };

  return (
    <div className="min-h-full">
      <PageHeader title="Water Reminder" subtitle="Stay hydrated on the trail" icon={Droplets} accent="bg-cyan-600" />
      <div className="p-4 space-y-4">
        {/* Intake progress */}
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-3xl p-6 text-center shadow-lg">
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <circle cx="50" cy="50" r="44" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 276} 276`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Droplets size={28} />
              <span className="text-2xl font-bold mt-1">{intake}</span>
              <span className="text-[10px] opacity-80">/ {glassesNeeded} glasses</span>
            </div>
          </div>
          <p className="text-sm mt-3">{consumed.toFixed(2)} L of {totalNeed.toFixed(2)} L</p>
        </div>

        <div className="flex gap-2">
          <button onClick={drink} className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
            <Plus size={18} /> Drank a glass
          </button>
          <button onClick={() => setIntake((i) => Math.max(0, i - 1))} className="px-4 bg-muted text-muted-foreground rounded-xl active:scale-95 transition">
            <Minus size={18} />
          </button>
        </div>

        <button
          onClick={enableReminder}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition active:scale-95 ${reminderOn ? 'bg-cyan-100 text-cyan-700' : 'bg-card border border-border'}`}
        >
          <Bell size={18} /> {reminderOn ? 'Reminders ON — tap to stop' : 'Enable reminders (every 20 min)'}
        </button>

        {/* Calculator */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2"><Activity size={16} /> Water Need Calculator</h3>
          <div>
            <label className="text-xs text-muted-foreground">Body weight: {weight} kg</label>
            <input type="range" min="40" max="120" value={weight} onChange={(e) => setWeight(+e.target.value)} className="w-full accent-cyan-600" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Hike duration: {duration} min</label>
            <input type="range" min="30" max="480" step="30" value={duration} onChange={(e) => setDuration(+e.target.value)} className="w-full accent-cyan-600" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Intensity</label>
            <div className="flex gap-2 mt-1">
              {['easy', 'moderate', 'hard'].map((lvl) => (
                <button key={lvl} onClick={() => setIntensity(lvl)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize ${intensity === lvl ? 'bg-cyan-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-cyan-50 rounded-xl p-3 text-center">
            <p className="text-xs text-cyan-800">Recommended intake</p>
            <p className="text-xl font-bold text-cyan-700">{totalNeed.toFixed(2)} L ({glassesNeeded} glasses)</p>
          </div>
        </div>
      </div>
    </div>
  );
}