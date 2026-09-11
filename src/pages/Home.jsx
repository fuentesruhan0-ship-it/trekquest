import { useNavigate } from 'react-router-dom';
import {
  Map, Backpack, CloudSun, Leaf, HeartPulse, Tent,
  Music, Droplets, BookOpen, Armchair, Flame, Mountain,
  Compass, UserRound, Clock
} from 'lucide-react';

const features = [
  { title: 'Offline Map', sub: 'Route planner & GPS', icon: Map, to: '/map', color: 'bg-emerald-600' },
  { title: 'Backpacking', sub: 'Guide & checklist', icon: Backpack, to: '/backpacking', color: 'bg-amber-600' },
  { title: 'Weather', sub: 'Forecast & alerts', icon: CloudSun, to: '/weather', color: 'bg-sky-600' },
  { title: 'Plant Scanner', sub: 'Identify plants', icon: Leaf, to: '/plant-scanner', color: 'bg-green-600' },
  { title: 'First Aid', sub: 'Emergency guide', icon: HeartPulse, to: '/first-aid', color: 'bg-red-600' },
  { title: 'Survival Manual', sub: 'Wilderness skills', icon: Tent, to: '/survival', color: 'bg-orange-700' },
  { title: 'Music Mode', sub: 'Hiking playlist', icon: Music, to: '/music', color: 'bg-purple-600' },
  { title: 'Water Reminder', sub: 'Stay hydrated', icon: Droplets, to: '/water-reminder', color: 'bg-cyan-600' },
  { title: 'Travel Journal', sub: 'Save memories', icon: BookOpen, to: '/journal', color: 'bg-teal-600' },
  { title: 'Rest Reminder', sub: 'Smart breaks', icon: Armchair, to: '/rest-reminder', color: 'bg-indigo-600' },
  { title: 'Calorie & Steps', sub: 'Activity tracker', icon: Flame, to: '/activity', color: 'bg-rose-600' },
  { title: 'Mountain Tracker', sub: 'Hike timer & log', icon: Mountain, to: '/mountain-tracker', color: 'bg-stone-700' },
  { title: 'Compass', sub: 'Find direction', icon: Compass, to: '/compass', color: 'bg-slate-700' },
  { title: 'Emergency Card', sub: 'Your info', icon: UserRound, to: '/emergency', color: 'bg-red-700' },
  { title: 'Safe Return', sub: 'Return reminder', icon: Clock, to: '/safe-return', color: 'bg-amber-700' },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-emerald-800 text-primary-foreground px-5 pt-10 pb-8 rounded-b-3xl">
        <div className="absolute -right-8 -top-8 opacity-20">
          <Mountain size={160} strokeWidth={1} />
        </div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80 font-semibold">Welcome to</p>
          <h1 className="text-3xl font-bold mt-1 leading-tight">Trek Quest</h1>
          <p className="text-sm opacity-85 mt-1 max-w-[15rem]">Your smart hiking companion for every trail.</p>
          <button
            onClick={() => navigate('/map')}
            className="mt-5 inline-flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg active:scale-95 transition-transform"
          >
            <Map size={16} /> Start Navigation
          </button>
        </div>
      </div>

      {/* Features grid */}
      <div className="px-4 pt-6">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">All Features</h2>
        <div className="grid grid-cols-3 gap-3">
          {features.map(({ title, sub, icon: Icon, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl bg-card border border-border hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm ${color}`}>
                <Icon size={22} />
              </div>
              <span className="text-xs font-semibold leading-tight">{title}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="rounded-2xl bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shrink-0">
            <Flame size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Stay safe out there</p>
            <p className="text-xs text-amber-800/80">Always tell someone your trail plan before you go.</p>
          </div>
        </div>
      </div>
    </div>
  );
}