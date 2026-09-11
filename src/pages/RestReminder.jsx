import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Armchair, Clock, Mountain, Timer, Bell } from 'lucide-react';

export default function RestReminder() {
  const [distance, setDistance] = useState(8);
  const [elevation, setElevation] = useState(500);
  const [difficulty, setDifficulty] = useState('moderate');
  const [hikingTime, setHikingTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [lastRest, setLastRest] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Difficulty factor
  const diffFactor = { easy: 60, moderate: 45, hard: 30, expert: 20 }[difficulty] || 45;
  // Elevation adds strain: every 300m elevation reduces interval by 5 min
  const elevAdjust = Math.floor(elevation / 300) * 5;
  const baseInterval = Math.max(15, diffFactor - elevAdjust);
  // Distance affects total recommended rests
  const totalRests = Math.max(1, Math.ceil(distance / 2));

  const minsSinceRest = Math.floor((now - lastRest) / 60000);
  const minsSinceStart = Math.floor((now - hikingTime) / 60000);
  const dueForRest = running && hikingTime && minsSinceRest >= baseInterval;

  // tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const start = () => {
    setRunning(true);
    setHikingTime(Date.now());
    setLastRest(Date.now());
  };
  const stop = () => { setRunning(false); setHikingTime(0); };
  const takeRest = () => {
    setLastRest(Date.now());
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Rest break taken 😌', { body: 'Good job. Take 5–10 minutes to recover.' });
    }
  };

  return (
    <div className="min-h-full">
      <PageHeader title="Smart Rest Reminder" subtitle="Rest based on trail difficulty" icon={Armchair} accent="bg-indigo-600" />
      <div className="p-4 space-y-4">
        {/* Status */}
        <div className={`rounded-3xl p-6 text-center shadow-lg ${dueForRest ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' : 'bg-card border border-border'}`}>
          <Armchair size={48} className={`mx-auto ${dueForRest ? 'text-white' : 'text-indigo-500'}`} />
          {running && hikingTime ? (
            <>
              <p className="text-3xl font-bold mt-2">{minsSinceRest} min</p>
              <p className={`text-sm ${dueForRest ? 'text-white/90' : 'text-muted-foreground'}`}>since last rest</p>
              {dueForRest && <p className="mt-2 text-sm font-semibold animate-pulse">Time for a break!</p>}
              <p className={`text-xs mt-1 ${dueForRest ? 'text-white/80' : 'text-muted-foreground'}`}>Hiking for {minsSinceStart} min</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Set your trail and start hiking to get smart rest reminders.</p>
          )}
        </div>

        <div className="flex gap-2">
          {!running ? (
            <button onClick={start} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
              <Timer size={18} /> Start Hike
            </button>
          ) : (
            <>
              <button onClick={takeRest} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition">
                <Armchair size={18} /> Took a Rest
              </button>
              <button onClick={stop} className="px-4 bg-red-100 text-red-600 rounded-xl font-semibold active:scale-95 transition">Stop</button>
            </>
          )}
        </div>

        {/* Trail inputs */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2"><Mountain size={16} /> Trail Details</h3>
          <div>
            <label className="text-xs text-muted-foreground">Distance: {distance} km</label>
            <input type="range" min="1" max="40" value={distance} onChange={(e) => setDistance(+e.target.value)} className="w-full accent-indigo-600" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Elevation gain: {elevation} m</label>
            <input type="range" min="0" max="2000" step="100" value={elevation} onChange={(e) => setElevation(+e.target.value)} className="w-full accent-indigo-600" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Difficulty</label>
            <div className="flex gap-2 mt-1">
              {['easy', 'moderate', 'hard', 'expert'].map((d) => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize ${difficulty === d ? 'bg-indigo-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-indigo-900">Recommendation</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3 text-center">
              <Clock size={20} className="mx-auto text-indigo-600" />
              <p className="text-lg font-bold mt-1">Every {baseInterval} min</p>
              <p className="text-[10px] text-muted-foreground">rest interval</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center">
              <Armchair size={20} className="mx-auto text-indigo-600" />
              <p className="text-lg font-bold mt-1">{totalRests}</p>
              <p className="text-[10px] text-muted-foreground">rests for this trail</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}