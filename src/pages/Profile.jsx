import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  UserRound, Map, BookOpen, Mountain, HeartPulse, Leaf, Backpack,
  CloudSun, Compass, Droplets, Flame, Music, Armchair, Clock, LogOut,
  ChevronRight, Camera, Edit3, X, Check, Sparkles, Navigation
} from 'lucide-react';

const avatarPresets = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
];

const links = [
  { label: 'Your Routes', sub: 'Saved hiking routes & trails', icon: Navigation, to: '/map?drawer=routes', color: 'bg-emerald-600', tag: 'Routes' },
  { label: 'Mountains Conquered', sub: 'Summits & hike milestones', icon: Mountain, to: '/mountain-tracker', color: 'bg-stone-700', tag: 'Summits' },
  { label: 'Emergency Info Card', sub: 'Your vital details & contacts', icon: HeartPulse, to: '/emergency', color: 'bg-red-600', tag: 'Vital' },
  { label: 'Travel Journal', sub: 'Hike notes & photo memories', icon: BookOpen, to: '/journal', color: 'bg-teal-600' },
  { label: 'Plant Scan History', sub: 'Botanical dictionary & scans', icon: Leaf, to: '/plant-scanner', color: 'bg-green-600' },
  { label: 'Backpacking List', sub: 'Trail gear checklist', icon: Backpack, to: '/backpacking', color: 'bg-amber-600' },
  { label: 'Activity Tracker', sub: 'Calories & daily steps', icon: Flame, to: '/activity', color: 'bg-rose-600' },
  { label: 'Weather Forecast', sub: 'Local area & cyclone alerts', icon: CloudSun, to: '/weather', color: 'bg-sky-600' },
  { label: 'Compass & Direction', sub: 'Magnetic bearing & GPS', icon: Compass, to: '/compass', color: 'bg-slate-700' },
  { label: 'Offline Music Player', sub: 'Full-screen trail playlist', icon: Music, to: '/music', color: 'bg-purple-600' },
  { label: 'Water Reminder', sub: 'Hydration schedule', icon: Droplets, to: '/water-reminder', color: 'bg-cyan-600' },
  { label: 'Rest Reminder', sub: 'Smart hiking intervals', icon: Armchair, to: '/rest-reminder', color: 'bg-indigo-600' },
  { label: 'Safe Return Timer', sub: 'Emergency overdue alert', icon: Clock, to: '/safe-return', color: 'bg-amber-700' },
];

export default function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editPhoto, setEditPhoto] = useState(user?.photo_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  const openEdit = () => {
    setEditName(user?.full_name || '');
    setEditPhoto(user?.photo_url || '');
    setShowEditModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditPhoto(ev.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (updateProfile) {
        await updateProfile({
          full_name: editName.trim() || 'Hiker',
          photo_url: editPhoto,
        });
      }
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full pb-20 w-full max-w-full overflow-x-hidden">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 text-white px-5 pt-10 pb-8 rounded-b-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Tappable Profile Photo with Camera Badge */}
            <div
              onClick={openEdit}
              className="relative w-18 h-18 rounded-full cursor-pointer group active:scale-95 transition"
              title="Change profile picture"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-emerald-400/80 shadow-md">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <UserRound size={36} className="text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-slate-900 group-hover:scale-110 transition">
                <Camera size={12} />
              </div>
            </div>

            {/* Profile Info & Edit Button */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-black truncate">{user?.full_name || 'Hiker'}</p>
                <button
                  onClick={openEdit}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 active:scale-90 transition"
                  title="Edit profile name"
                >
                  <Edit3 size={13} />
                </button>
              </div>
              <p className="text-xs text-white/70 truncate">{user?.email || 'Active Hiker Profile'}</p>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300">
                <Sparkles size={10} /> Trail Explorer
              </div>
            </div>
          </div>

          <button
            onClick={openEdit}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold active:scale-95 transition shrink-0"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Open Map Hero Button with High Visual Affordance */}
        <button
          onClick={() => navigate('/map')}
          className="w-full flex items-center gap-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-[0.98] transition cursor-pointer border border-emerald-500/30 group"
        >
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition">
            <Map size={22} />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-bold text-sm">Interactive GPS Map</p>
            <p className="text-xs text-white/80">Satellite view, route planner & live tracking</p>
          </div>
          <div className="flex items-center gap-1 text-white font-bold text-xs bg-white/20 px-2.5 py-1 rounded-xl shrink-0">
            <span>Explore</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {/* Tools Menu with Obvious Tappable Affordances */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
              Trek Quest Hiking Tools
            </h3>
            <span className="text-[11px] text-muted-foreground">Tap any card to open</span>
          </div>

          <div className="space-y-2">
            {links.map(({ label, sub, icon: Icon, to, color, tag }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 bg-card border-2 border-border/80 hover:border-emerald-500/40 rounded-2xl p-3 shadow-sm hover:shadow active:scale-[0.98] active:bg-muted/60 transition cursor-pointer group text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition ${color}`}>
                  <Icon size={19} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-foreground truncate group-hover:text-emerald-600 transition">
                      {label}
                    </p>
                    {tag && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        {tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{sub}</p>
                </div>
                <div className="p-1 rounded-lg text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition">
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Log out */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 py-3 rounded-2xl font-bold active:scale-95 transition shadow-sm"
        >
          <LogOut size={18} /> Log Out of Account
        </button>

        <p className="text-center text-xs text-muted-foreground pt-1">
          Trek Quest • v1.0.0
        </p>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                <Edit3 size={16} className="text-emerald-600" />
                <span>Edit Profile</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Photo Preview & Upload */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md cursor-pointer group"
              >
                {editPhoto ? (
                  <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                    <UserRound size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                  <Camera size={20} />
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <Camera size={13} /> Upload New Photo
              </button>
            </div>

            {/* Avatar Presets */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">Or Choose an Avatar</label>
              <div className="flex justify-between gap-1">
                {avatarPresets.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditPhoto(src)}
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 transition ${
                      editPhoto === src ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="text-[11px] font-bold text-muted-foreground block mb-1">Full Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2.5 rounded-xl bg-muted text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Save / Cancel buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1.5 shadow"
              >
                <Check size={14} /> {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}