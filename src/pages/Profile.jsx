import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  UserRound, Map, BookOpen, Mountain, HeartPulse, Leaf, Backpack,
  CloudSun, Compass, Droplets, Flame, Music, Armchair, Clock, LogOut,
  ChevronRight, Camera, Edit3, X, Check, Sparkles, Navigation,
  Smartphone, Download, AlertCircle, Heart, Phone, Award, Plus,
  ShieldCheck, ShieldAlert
} from 'lucide-react';

const links = [
  { label: 'Your Saved Routes', sub: 'Saved hiking routes & trails', icon: Navigation, to: '/map?drawer=routes', color: 'bg-emerald-600', tag: 'Routes' },
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

  // Profile Edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editPhoto, setEditPhoto] = useState(user?.photo_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Emergency Info Card State (Directly on Profile)
  const [emergencyInfo, setEmergencyInfo] = useState(null);
  const [showEmergencyEditModal, setShowEmergencyEditModal] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    full_name: '',
    blood_type: 'O+',
    allergies: 'None',
    medical_conditions: 'None',
    medications: 'None',
    emergency_contact_name: 'Trail Guardian',
    emergency_contact_phone: '+63 912 345 6789',
    emergency_contact_relation: 'Family',
    notes: 'In case of mountain rescue, notify emergency contact immediately.',
  });
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);

  // Mountains Conquered State (Directly on Profile)
  const [conqueredHikes, setConqueredHikes] = useState([]);
  const [loadingHikes, setLoadingHikes] = useState(true);

  // Fetch Emergency Info & Mountains Conquered on mount
  useEffect(() => {
    // 1. Emergency Info
    (async () => {
      try {
        const items = await base44.entities.EmergencyInfo.list();
        if (items && items.length > 0) {
          setEmergencyInfo(items[0]);
          setEmergencyForm(items[0]);
        } else {
          // Check localStorage fallback
          const local = localStorage.getItem('trekquest_emergency_info');
          if (local) {
            const parsed = JSON.parse(local);
            setEmergencyInfo(parsed);
            setEmergencyForm(parsed);
          } else {
            const init = {
              full_name: user?.full_name || 'Hiker',
              blood_type: 'O+',
              allergies: 'None known',
              medical_conditions: 'None',
              medications: 'None',
              emergency_contact_name: 'Emergency Contact',
              emergency_contact_phone: '+63 912 345 6789',
              emergency_contact_relation: 'Family / Friend',
              notes: 'TrekQuest hiker offline medical card',
            };
            setEmergencyInfo(init);
            setEmergencyForm(init);
          }
        }
      } catch (err) {
        console.warn('Failed to load emergency info:', err);
      }
    })();

    // 2. Mountains Conquered
    (async () => {
      try {
        const data = await base44.entities.Hike.list('-date', 15);
        if (data && data.length > 0) {
          setConqueredHikes(data);
        } else {
          // Check local storage or provide popular sample summits
          const defaultSummits = [
            { id: 'summit_1', mountain: 'Mt. Pulag Summit', elevation_gain_m: 2928, distance_km: 16.5, date: '2026-09-15', difficulty: 'moderate' },
            { id: 'summit_2', mountain: 'Mt. Batulao Peak', elevation_gain_m: 811, distance_km: 10.2, date: '2026-09-02', difficulty: 'moderate' },
          ];
          setConqueredHikes(defaultSummits);
        }
      } catch (err) {
        console.warn('Failed to load conquered hikes:', err);
      } finally {
        setLoadingHikes(false);
      }
    })();
  }, [user]);

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

  const handleSaveEmergency = async () => {
    setIsSavingEmergency(true);
    try {
      localStorage.setItem('trekquest_emergency_info', JSON.stringify(emergencyForm));
      if (emergencyInfo?.id) {
        const updated = await base44.entities.EmergencyInfo.update(emergencyInfo.id, emergencyForm);
        setEmergencyInfo(updated);
      } else {
        const created = await base44.entities.EmergencyInfo.create(emergencyForm);
        setEmergencyInfo(created);
      }
      setShowEmergencyEditModal(false);
    } catch (err) {
      setEmergencyInfo(emergencyForm);
      setShowEmergencyEditModal(false);
    } finally {
      setIsSavingEmergency(false);
    }
  };

  const totalElevationGained = conqueredHikes.reduce(
    (sum, h) => sum + (parseFloat(h.elevation_gain_m) || 0),
    0
  );
  const totalKmHiked = conqueredHikes.reduce(
    (sum, h) => sum + (parseFloat(h.distance_km) || 0),
    0
  );

  return (
    <div className="min-h-full pb-24 w-full max-w-full overflow-x-hidden bg-slate-950 text-white font-sans">
      
      {/* ── PROFILE HEADER (Frosted Glass with Emerald Accents) ────────── */}
      <div className="relative px-5 pt-10 pb-8 rounded-b-[36px] bg-gradient-to-br from-emerald-950/70 via-slate-900/80 to-slate-950 backdrop-blur-2xl border-b border-white/10 shadow-2xl overflow-hidden">
        {/* Glow ambient spots */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-36 h-36 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Tappable Profile Photo */}
            <div
              onClick={openEdit}
              className="relative w-18 h-18 rounded-full cursor-pointer group active:scale-95 transition"
              title="Change profile picture"
            >
              <div className="w-16 h-16 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center overflow-hidden border-2 border-emerald-400/80 shadow-xl">
                {user?.photo_url ? (
                  <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <UserRound size={34} className="text-emerald-300" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-900 group-hover:scale-110 transition font-bold">
                <Camera size={11} />
              </div>
            </div>

            {/* Profile Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-white truncate">{user?.full_name || 'Hiker'}</p>
                <button
                  onClick={openEdit}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 active:scale-90 transition cursor-pointer"
                  title="Edit profile name"
                >
                  <Edit3 size={13} />
                </button>
              </div>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'Active Hiker Profile'}</p>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-extrabold text-emerald-300 backdrop-blur-md">
                <Sparkles size={10} /> Mountain Trail Master
              </div>
            </div>
          </div>

          <button
            onClick={openEdit}
            className="px-3.5 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold active:scale-95 transition shrink-0 cursor-pointer backdrop-blur-md"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 max-w-lg mx-auto">
        
        {/* ── 1. EMERGENCY INFO CARD (FEATURED DIRECTLY ON PROFILE) ─────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <HeartPulse size={14} className="text-rose-400" />
              <span>Emergency Medical Info Card</span>
            </h3>
            <button
              onClick={() => setShowEmergencyEditModal(true)}
              className="text-[11px] font-bold text-rose-300 hover:text-rose-200 underline cursor-pointer"
            >
              Edit Card
            </button>
          </div>

          {/* Frosted Glass Red-Tinted Emergency Card */}
          <div className="relative rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-red-950/60 via-slate-900/70 to-slate-950/80 backdrop-blur-2xl border border-red-500/30 shadow-2xl text-white overflow-hidden space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center font-black">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block">
                    VITAL EMERGENCY CARD
                  </span>
                  <p className="text-sm font-extrabold text-white">
                    {emergencyInfo?.full_name || user?.full_name || 'Hiker'}
                  </p>
                </div>
              </div>

              {/* Blood Type Badge */}
              <div className="px-3 py-1 rounded-2xl bg-red-600/30 border border-red-400/50 text-white font-mono font-black text-xs flex items-center gap-1">
                <span>Blood:</span>
                <span className="text-red-300 text-sm">{emergencyInfo?.blood_type || 'O+'}</span>
              </div>
            </div>

            {/* Quick Medical Facts Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">⚠️ Allergies</span>
                <p className="text-xs font-semibold text-rose-200 mt-0.5 truncate">
                  {emergencyInfo?.allergies || 'None reported'}
                </p>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">🏥 Medical Conditions</span>
                <p className="text-xs font-semibold text-white mt-0.5 truncate">
                  {emergencyInfo?.medical_conditions || 'None'}
                </p>
              </div>
            </div>

            {/* Emergency Contact Bar with 1-Tap Call Link */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">In case of emergency, contact:</span>
                <p className="font-bold text-white text-xs truncate">
                  {emergencyInfo?.emergency_contact_name || 'Emergency Contact'}{' '}
                  <span className="text-slate-400 font-normal">
                    ({emergencyInfo?.emergency_contact_relation || 'Family'})
                  </span>
                </p>
                <p className="text-xs text-red-300 font-mono font-bold">
                  {emergencyInfo?.emergency_contact_phone || '+63 912 345 6789'}
                </p>
              </div>

              {emergencyInfo?.emergency_contact_phone && (
                <a
                  href={`tel:${emergencyInfo.emergency_contact_phone.replace(/\s+/g, '')}`}
                  className="px-3 py-2 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition shrink-0 cursor-pointer"
                >
                  <Phone size={13} />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. MOUNTAINS CONQUERED (FEATURED DIRECTLY ON PROFILE) ─────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Mountain size={14} className="text-emerald-400" />
              <span>Mountains Conquered & Summits</span>
            </h3>
            <button
              onClick={() => navigate('/mountain-tracker')}
              className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
            >
              View Full Tracker →
            </button>
          </div>

          {/* Frosted Glass Summits Summary Card */}
          <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-emerald-950/50 via-slate-900/70 to-slate-950/80 backdrop-blur-2xl border border-emerald-500/30 shadow-2xl space-y-3">
            {/* 3 Metric Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-white/10 py-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Summits</span>
                <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  {conqueredHikes.length}
                </p>
                <span className="text-[9px] text-slate-400">Peaks logged</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Elevation</span>
                <p className="text-xl font-black text-amber-400 font-mono mt-0.5">
                  {totalElevationGained.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">m</span>
                </p>
                <span className="text-[9px] text-slate-400">Total climb</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Distance</span>
                <p className="text-xl font-black text-sky-400 font-mono mt-0.5">
                  {totalKmHiked.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">km</span>
                </p>
                <span className="text-[9px] text-slate-400">On mountain trail</span>
              </div>
            </div>

            {/* Recent Conquered Mountains Badges */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Recent Conquered Summits:
              </p>
              <div className="space-y-1.5">
                {conqueredHikes.slice(0, 3).map((hike, idx) => (
                  <div
                    key={hike.id || idx}
                    onClick={() => navigate('/mountain-tracker')}
                    className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                        ⛰️
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate text-xs">
                          {hike.mountain || hike.trail_name || 'Philippine Peak'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {hike.elevation_gain_m ? `${hike.elevation_gain_m}m elevation` : 'Summit'} • {hike.distance_km ? `${hike.distance_km} km` : 'Trail'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                      Conquered ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Log Button */}
            <button
              onClick={() => navigate('/mountain-tracker')}
              className="w-full py-2.5 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Log Another Summit in Mountain Tracker</span>
            </button>
          </div>
        </div>

        {/* ── 3. INSTALL APP ON PHONE (PWA - NATIVE FEEL ON ANDROID / CHROME) ─ */}
        <div className="space-y-1.5">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-install-pwa-modal'))}
            className="w-full flex items-center gap-3.5 bg-gradient-to-r from-emerald-950/70 via-teal-950/60 to-slate-900/80 border border-emerald-500/40 hover:border-emerald-400 text-white rounded-3xl p-4 shadow-xl active:scale-[0.98] transition cursor-pointer group text-left relative overflow-hidden backdrop-blur-2xl"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition">
              <Smartphone size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-sm text-white">Install App on Phone (Native)</p>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                  Android & Chrome
                </span>
              </div>
              <p className="text-xs text-emerald-200/70 truncate mt-0.5">
                Home screen icon • Fullscreen • Satellite GPS offline
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs bg-emerald-500/20 border border-emerald-400/30 px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
              <Download size={13} />
              <span>Install</span>
            </div>
          </button>
        </div>

        {/* ── 4. OPEN LIVE MAP HERO BUTTON ──────────────────────────────── */}
        <button
          onClick={() => navigate('/map')}
          className="w-full flex items-center gap-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-3xl p-4 shadow-xl active:scale-[0.98] transition cursor-pointer border border-white/20 group backdrop-blur-2xl"
        >
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition">
            <Map size={22} />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-bold text-sm">Interactive GPS Map</p>
            <p className="text-xs text-white/80">Satellite view, custom route planner & live tracking</p>
          </div>
          <div className="flex items-center gap-1 text-white font-bold text-xs bg-white/20 px-2.5 py-1.5 rounded-xl shrink-0">
            <span>Explore</span>
            <ChevronRight size={14} />
          </div>
        </button>

        {/* ── 5. ALL HIKING TOOLS IN FROSTED GLASS LIST ─────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              TrekQuest Hiking Tools
            </h3>
            <span className="text-[11px] text-slate-500">Tap to open</span>
          </div>

          <div className="space-y-2">
            {links.map(({ label, sub, icon: Icon, to, color, tag }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 bg-slate-900/50 hover:bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-3 shadow-md active:scale-[0.98] transition cursor-pointer group text-left backdrop-blur-xl"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-white truncate group-hover:text-emerald-400 transition">
                      {label}
                    </p>
                    {tag && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        {tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{sub}</p>
                </div>
                <div className="p-1 rounded-lg text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition">
                  <ChevronRight size={18} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Log out */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 text-red-300 py-3 rounded-2xl font-bold active:scale-95 transition shadow-lg backdrop-blur-xl cursor-pointer"
        >
          <LogOut size={16} /> Log Out of Account
        </button>

        <p className="text-center text-xs text-slate-500 pt-1">
          TrekQuest • Philippine Mountain Trail Companion
        </p>
      </div>

      {/* ── MODAL: EDIT PROFILE NAME & PHOTO ──────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <Edit3 size={16} className="text-emerald-400" />
                <span>Edit Profile</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Photo Preview & Upload */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-400 shadow-md cursor-pointer group"
              >
                {editPhoto ? (
                  <img src={editPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <UserRound size={40} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                  <Camera size={20} />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="text-[11px] text-slate-400">Tap avatar to upload photo</span>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-95 transition"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT EMERGENCY INFO CARD ───────────────────────────── */}
      {showEmergencyEditModal && (
        <div className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-black text-sm text-red-400 flex items-center gap-2">
                <HeartPulse size={16} />
                <span>Edit Emergency Medical Card</span>
              </h3>
              <button
                onClick={() => setShowEmergencyEditModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Full Name</label>
                <input
                  value={emergencyForm.full_name}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, full_name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Blood Type</label>
                  <input
                    value={emergencyForm.blood_type}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, blood_type: e.target.value })}
                    placeholder="e.g. O+, A-, B+"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Allergies</label>
                  <input
                    value={emergencyForm.allergies}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, allergies: e.target.value })}
                    placeholder="e.g. Penicillin, Peanuts"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Medical Conditions</label>
                <input
                  value={emergencyForm.medical_conditions}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, medical_conditions: e.target.value })}
                  placeholder="e.g. Asthma, Hypertension, Diabetes"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Current Medications</label>
                <input
                  value={emergencyForm.medications}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, medications: e.target.value })}
                  placeholder="e.g. Inhaler, Antihistamines"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="pt-2 border-t border-white/10">
                <span className="text-[11px] font-black uppercase text-red-400 block mb-1">Emergency Contact</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Contact Name</label>
                    <input
                      value={emergencyForm.emergency_contact_name}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_name: e.target.value })}
                      placeholder="e.g. Maria Santos"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Relation</label>
                    <input
                      value={emergencyForm.emergency_contact_relation}
                      onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_relation: e.target.value })}
                      placeholder="e.g. Spouse / Sibling"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <label className="text-[10px] text-slate-400 block mb-0.5">Emergency Phone Number</label>
                  <input
                    value={emergencyForm.emergency_contact_phone}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, emergency_contact_phone: e.target.value })}
                    placeholder="+63 912 345 6789"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowEmergencyEditModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmergency}
                disabled={isSavingEmergency}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs active:scale-95 transition"
              >
                {isSavingEmergency ? 'Saving…' : 'Save Emergency Card'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}