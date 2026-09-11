import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  UserRound, Map, BookOpen, Mountain, HeartPulse, Leaf, Backpack,
  CloudSun, Compass, Droplets, Flame, Music, Armchair, Clock, LogOut, ChevronRight
} from 'lucide-react';

const links = [
  { label: 'Emergency Info Card', sub: 'Your vital details', icon: HeartPulse, to: '/emergency', color: 'bg-red-600' },
  { label: 'Mountain Tracker', sub: 'Hike history & timer', icon: Mountain, to: '/mountain-tracker', color: 'bg-stone-700' },
  { label: 'Travel Journal', sub: 'Your memories', icon: BookOpen, to: '/journal', color: 'bg-teal-600' },
  { label: 'Plant Scan History', sub: 'Identified plants', icon: Leaf, to: '/plant-scanner', color: 'bg-green-600' },
  { label: 'Backpacking List', sub: 'Your checklist', icon: Backpack, to: '/backpacking', color: 'bg-amber-600' },
  { label: 'Activity Tracker', sub: 'Calories & steps', icon: Flame, to: '/activity', color: 'bg-rose-600' },
  { label: 'Water Reminder', sub: 'Hydration', icon: Droplets, to: '/water-reminder', color: 'bg-cyan-600' },
  { label: 'Rest Reminder', sub: 'Smart breaks', icon: Armchair, to: '/rest-reminder', color: 'bg-indigo-600' },
  { label: 'Safe Return', sub: 'Return timer', icon: Clock, to: '/safe-return', color: 'bg-amber-700' },
  { label: 'Weather', sub: 'Forecast', icon: CloudSun, to: '/weather', color: 'bg-sky-600' },
  { label: 'Compass', sub: 'Direction', icon: Compass, to: '/compass', color: 'bg-slate-700' },
  { label: 'Music Mode', sub: 'Playlist', icon: Music, to: '/music', color: 'bg-purple-600' },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const logout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-br from-primary to-emerald-800 text-primary-foreground px-5 pt-10 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <UserRound size={36} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold truncate">{user?.full_name || 'Hiker'}</p>
            <p className="text-sm opacity-80 truncate">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <button
          onClick={() => navigate('/map')}
          className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:scale-95 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white"><Map size={20} /></div>
          <div className="text-left flex-1">
            <p className="font-semibold text-sm">Open Map</p>
            <p className="text-xs text-muted-foreground">Navigate & plan routes</p>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>

        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">My Tools</h3>
          <div className="space-y-1.5">
            {links.map(({ label, sub, icon: Icon, to, color }) => (
              <button key={to} onClick={() => navigate(to)} className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-3 active:scale-95 transition">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{sub}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 py-3 rounded-xl font-semibold active:scale-95 transition">
          <LogOut size={18} /> Log Out
        </button>

        <p className="text-center text-xs text-muted-foreground">Trek Quest v1.0 • Smart Hiking Companion</p>
      </div>
    </div>
  );
}