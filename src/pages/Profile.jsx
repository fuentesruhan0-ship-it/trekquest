import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import UpcomingHikesModal, { getSavedUpcomingHikes } from '@/components/UpcomingHikesModal';
import PlanRouteModal from '@/components/PlanRouteModal';
import {
  UserRound, Mountain, HeartPulse, LogOut,
  Camera, Edit3, X, Check, Sparkles, Navigation,
  AlertCircle, Phone, Plus, Calendar, Clock,
  Footprints, Flame, ChevronRight, Image as ImageIcon,
  CheckCircle2, Compass
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import EditProfileModal from '@/components/EditProfileModal';

const defaultMountainImages = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
];

export default function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Profile Info & Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editPhoto, setEditPhoto] = useState(user?.photo_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // 2. Emergency Card State
  const [emergencyInfo, setEmergencyInfo] = useState(null);
  const [showEmergencyEditModal, setShowEmergencyEditModal] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    full_name: '',
    weight: '',
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

  // 3. Mountains Conquered State & Gallery
  const [conqueredHikes, setConqueredHikes] = useState([]);
  const [loadingHikes, setLoadingHikes] = useState(true);
  const [selectedDetailHike, setSelectedDetailHike] = useState(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);
  const [showLogSummitModal, setShowLogSummitModal] = useState(false);
  const [summitForm, setSummitForm] = useState({
    mountain: '',
    elevation_gain_m: '',
    distance_km: '',
    difficulty: 'moderate',
    notes: '',
    photo: '',
  });
  const [isSavingSummit, setIsSavingSummit] = useState(false);
  const detailPhotoInputRef = useRef(null);
  const summitPhotoInputRef = useRef(null);

  // Modals for Planned Routes & Upcoming Hikes
  const [showUpcomingHikesModal, setShowUpcomingHikesModal] = useState(false);
  const [showPlanRouteModal, setShowPlanRouteModal] = useState(false);
  const [upcomingInitialId, setUpcomingInitialId] = useState(null);

  // Reload conquered hikes when navigating to this page
  useEffect(() => {
    const loadConqueredHikes = async () => {
      try {
        setLoadingHikes(true);
        console.log('Loading conquered hikes from localStorage...');
        const localHikes = localStorage.getItem('Hike');
        console.log('LocalStorage Hike data:', localHikes);

        // Clear old default hikes (they start with "hike_pulag" or "hike_batulao")
        if (localHikes) {
          const parsed = JSON.parse(localHikes);
          const filtered = parsed.filter(h => !h.id.startsWith('hike_pulag') && !h.id.startsWith('hike_batulao'));
          if (filtered.length !== parsed.length) {
            console.log('Removed old default hikes');
            localStorage.setItem('Hike', JSON.stringify(filtered));
          }
        }

        const data = await base44.entities.Hike.list('-date', 50);
        console.log('Loaded conquered hikes from base44:', data);
        console.log('Number of hikes:', data?.length || 0);

        if (data && data.length > 0) {
          setConqueredHikes(data);
        } else {
          console.log('No hikes found, showing empty state');
          setConqueredHikes([]);
        }
      } catch (err) {
        console.warn('Failed to load conquered hikes:', err);
        setConqueredHikes([]);
      } finally {
        setLoadingHikes(false);
      }
    };

    loadConqueredHikes();
  }, [location.pathname]);

  // Load data on mount
  useEffect(() => {
    // Load Emergency Card
    (async () => {
      try {
        const items = await base44.entities.EmergencyInfo.list();
        if (items && items.length > 0) {
          setEmergencyInfo(items[0]);
          setEmergencyForm(items[0]);
        } else {
          const local = localStorage.getItem('trekquest_emergency_info');
          if (local) {
            const parsed = JSON.parse(local);
            setEmergencyInfo(parsed);
            setEmergencyForm(parsed);
          } else {
            const init = {
              full_name: user?.full_name || 'Hiker',
              weight: '',
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
  }, [user]);

  // Save Profile edits
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
      setEditPhoto(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: editName.trim(),
        photo_url: editPhoto,
      });
      setShowEditModal(false);
    } catch (err) {
      console.warn('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Emergency Card edits
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
    } catch {
      setEmergencyInfo(emergencyForm);
      setShowEmergencyEditModal(false);
    } finally {
      setIsSavingEmergency(false);
    }
  };

  // Log a new conquered summit
  const handleSaveSummit = async () => {
    if (!summitForm.mountain.trim()) return;
    setIsSavingSummit(true);
    try {
      const defaultImg = summitForm.photo || defaultMountainImages[conqueredHikes.length % defaultMountainImages.length];
      const newSummit = {
        mountain: summitForm.mountain.trim(),
        trail_name: `${summitForm.mountain.trim()} Trail`,
        elevation_gain_m: parseFloat(summitForm.elevation_gain_m) || 1200,
        distance_km: parseFloat(summitForm.distance_km) || 8.0,
        difficulty: summitForm.difficulty || 'moderate',
        date: new Date().toISOString().slice(0, 10),
        duration_minutes: 240,
        steps: Math.round((parseFloat(summitForm.distance_km) || 8.0) * 1330),
        calories: Math.round((parseFloat(summitForm.distance_km) || 8.0) * 65 + 180),
        notes: summitForm.notes || 'Successfully conquered the mountain summit!',
        journal_entry: `Hiked ${summitForm.mountain.trim()} with great trail conditions and stunning mountain views.`,
        photos: [defaultImg],
        status: 'completed',
      };
      const created = await base44.entities.Hike.create(newSummit);
      setConqueredHikes((prev) => [created, ...prev]);
      setShowLogSummitModal(false);
      setSummitForm({ mountain: '', elevation_gain_m: '', distance_km: '', difficulty: 'moderate', notes: '', photo: '' });
    } catch (err) {
      console.warn('Error saving summit:', err);
    } finally {
      setIsSavingSummit(false);
    }
  };

  // Add a photo to a hike's Memories
  const handleAddMemoryPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDetailHike) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result;
      const currentPhotos = selectedDetailHike.photos || [];
      const updatedPhotos = [...currentPhotos, dataUrl];
      const updatedHike = { ...selectedDetailHike, photos: updatedPhotos };
      setSelectedDetailHike(updatedHike);
      setConqueredHikes((prev) =>
        prev.map((h) => (h.id === selectedDetailHike.id ? updatedHike : h))
      );
      try {
        if (selectedDetailHike.id && !selectedDetailHike.id.startsWith('summit_')) {
          await base44.entities.Hike.update(selectedDetailHike.id, { photos: updatedPhotos });
        }
      } catch {}
    };
    reader.readAsDataURL(file);
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
    <div className="min-h-full pb-24 w-full max-w-full overflow-x-hidden bg-[#0a160f] text-white font-sans select-none">

      {/* ═══════════════════════════════════════════════════════════════════════
          1. PROFILE INFO (TOP) — avatar, name, email, "Edit profile" (picture is editable)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative px-5 pt-10 pb-8 rounded-b-[36px] bg-gradient-to-br from-[#122b1c] via-[#0d2216] to-[#0a160f] backdrop-blur-2xl border-b border-white/10 shadow-2xl overflow-hidden">
        {/* Glow ambient spots */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-36 h-36 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Tappable Profile Photo (Editable) */}
            <div
              onClick={openEdit}
              className="relative cursor-pointer group active:scale-95 transition"
              title="Edit Profile Picture & Emoji Avatar"
            >
              <UserAvatar
                photoUrl={user?.photo_url}
                name={user?.full_name || 'Hiker'}
                size="w-16 h-16"
                className="border-2 border-emerald-400/80 shadow-xl"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#f05c48] text-white flex items-center justify-center shadow-lg border-2 border-slate-900 group-hover:scale-110 transition font-bold">
                <Camera size={11} />
              </div>
            </div>

            {/* Profile Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-white truncate">{user?.full_name || 'TrekQuest Hiker'}</p>
                <button
                  onClick={openEdit}
                  className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 active:scale-90 transition cursor-pointer"
                  title="Edit profile name"
                >
                  <Edit3 size={13} />
                </button>
              </div>
              <p className="text-xs text-emerald-200/80 truncate">{user?.email || 'hiker@trekquest.app'}</p>
            </div>
          </div>

          {/* Explicit "Edit profile" Button */}
          <button
            onClick={openEdit}
            className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold active:scale-95 transition shrink-0 cursor-pointer backdrop-blur-md shadow-md"
          >
            Edit profile
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-5 max-w-lg mx-auto">
        
        {/* ═══════════════════════════════════════════════════════════════════════
            2. EMERGENCY CARD (contacts, allergies, medical info)
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <HeartPulse size={14} className="text-rose-400" />
              <span>Emergency Card</span>
            </h3>
            <button
              onClick={() => setShowEmergencyEditModal(true)}
              className="text-[11px] font-bold text-rose-300 hover:text-rose-200 underline cursor-pointer"
            >
              Edit Card
            </button>
          </div>

          {/* Frosted Glass Red-Tinted Emergency Card */}
          <div className="relative rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-red-950/60 via-slate-900/80 to-[#12080a] backdrop-blur-2xl border border-red-500/30 shadow-2xl text-white overflow-hidden space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center font-black shadow-md">
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

              <div className="flex items-center gap-1.5">
                {/* Blood Type Badge */}
                <div className="px-2.5 py-1 rounded-2xl bg-red-600/30 border border-red-400/50 text-white font-mono font-black text-xs flex items-center gap-1">
                  <span>Blood:</span>
                  <span className="text-red-300 text-sm">{emergencyInfo?.blood_type || 'O+'}</span>
                </div>

                {/* Weight Badge */}
                {emergencyInfo?.weight && (
                  <div className="px-2.5 py-1 rounded-2xl bg-red-600/30 border border-red-400/50 text-white font-mono font-black text-xs flex items-center gap-1">
                    <span>Weight:</span>
                    <span className="text-red-300 text-sm">{emergencyInfo.weight} kg</span>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Info & Allergies Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">⚠️ Allergies</span>
                <p className="text-xs font-semibold text-rose-200 mt-0.5 truncate">
                  {emergencyInfo?.allergies || 'None reported'}
                </p>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">🏥 Medical Info</span>
                <p className="text-xs font-semibold text-white mt-0.5 truncate">
                  {emergencyInfo?.medical_conditions || 'None'}
                </p>
              </div>
            </div>

            {/* Emergency Contact Info with 1-Tap Call */}
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
                  className="px-3.5 py-2 rounded-2xl bg-[#f05c48] hover:bg-[#e44e39] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition shrink-0 cursor-pointer border border-white/20"
                >
                  <Phone size={13} />
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            3. MOUNTAINS CONQUERED (AT THE BOTTOM) — gallery grid of every mountain hiked
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Mountain size={14} className="text-emerald-400" />
                <span>Mountains Conquered</span>
              </h3>
              <p className="text-[11px] text-slate-400">Tap a mountain photo to view hike details & memories</p>
            </div>
            <button
              onClick={() => setShowLogSummitModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition cursor-pointer shadow-md border border-emerald-400/30"
            >
              <Plus size={13} />
              <span>Log Peak</span>
            </button>
          </div>

          {/* Gallery Grid of Every Mountain the User Has Hiked */}
          {conqueredHikes.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white/5 border border-dashed border-white/15 text-center space-y-2">
              <Mountain size={36} className="mx-auto text-slate-500" />
              <p className="text-xs text-slate-300 font-semibold">No mountains conquered yet.</p>
              <p className="text-[11px] text-slate-500">Conquer your first summit or log your past hikes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {conqueredHikes.map((hike, idx) => {
                const photo = (hike.photos && hike.photos.length > 0)
                  ? hike.photos[0]
                  : defaultMountainImages[idx % defaultMountainImages.length];
                const memoriesCount = hike.photos?.length || 0;

                return (
                  <div
                    key={hike.id || idx}
                    onClick={() => setSelectedDetailHike(hike)}
                    className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/15 hover:border-emerald-400/60 shadow-xl group cursor-pointer active:scale-[0.98] transition flex flex-col justify-end min-h-[170px]"
                  >
                    {/* Background Mountain Photo */}
                    <img
                      src={photo}
                      alt={hike.mountain || 'Mountain'}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-600/90 text-white shadow-md backdrop-blur-md">
                        Conquered ✓
                      </span>
                      {memoriesCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-slate-200 border border-white/20 backdrop-blur-md flex items-center gap-1">
                          <Camera size={10} />
                          <span>{memoriesCount}</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Info Overlay */}
                    <div className="relative z-10 p-3 space-y-0.5">
                      <h4 className="font-extrabold text-sm text-white truncate leading-tight group-hover:text-emerald-300 transition">
                        {hike.mountain || hike.trail_name || 'Mountain Peak'}
                      </h4>
                      <p className="text-[10px] text-slate-300 font-medium">
                        {hike.date || 'Completed Hike'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── ADDITIONAL CONVENIENCE LINKS ───────────────────────────────── */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          {/* Quick link to Your Routes (Upcoming and History) */}
          <button
            onClick={() => setShowUpcomingHikesModal(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Navigation size={16} />
              </div>
              <span>Your Routes (Upcoming and History)</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-950/30 hover:bg-red-950/50 border border-red-500/30 text-red-300 py-3 rounded-2xl font-bold text-xs active:scale-95 transition shadow-lg backdrop-blur-xl cursor-pointer"
          >
            <LogOut size={16} /> Log Out of Account
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 pt-1">
          TrekQuest • &ldquo;Your smart hiking companion, on or off the grid&rdquo;
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MOUNTAIN DETAIL MODAL (tap a mountain photo):
          Date, Duration, Steps taken, Calories burned, Notes, Journal entry,
          Memories (photos taken during that hike).
          ═══════════════════════════════════════════════════════════════════════ */}
      {selectedDetailHike && (
        <div className="fixed inset-0 z-[3200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/20 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-white my-auto max-h-[92vh] flex flex-col">
            
            {/* Mountain Hero Photo Header */}
            <div className="relative aspect-video w-full bg-black shrink-0 overflow-hidden">
              <img
                src={
                  selectedDetailHike.photos?.[0] ||
                  defaultMountainImages[0]
                }
                alt={selectedDetailHike.mountain}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/60" />

              <button
                onClick={() => setSelectedDetailHike(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="absolute bottom-3 left-4 right-4">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                  CONQUERED SUMMIT
                </span>
                <h3 className="text-xl font-black text-white mt-1 leading-tight">
                  {selectedDetailHike.mountain || selectedDetailHike.trail_name}
                </h3>
              </div>
            </div>

            {/* Scrollable Details Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
              
              {/* 4 Stats Grid: Date, Duration, Steps taken, Calories burned */}
              <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                {/* 1. Date */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block flex items-center justify-center gap-0.5">
                    <Calendar size={10} className="text-emerald-400" /> Date
                  </span>
                  <p className="text-xs font-bold text-white mt-1 truncate">
                    {selectedDetailHike.date || 'Recent'}
                  </p>
                </div>

                {/* 2. Duration */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block flex items-center justify-center gap-0.5">
                    <Clock size={10} className="text-amber-400" /> Duration
                  </span>
                  <p className="text-xs font-bold text-amber-300 font-mono mt-1">
                    {selectedDetailHike.duration_minutes
                      ? `${Math.floor(selectedDetailHike.duration_minutes / 60)}h ${selectedDetailHike.duration_minutes % 60}m`
                      : '3h 30m'}
                  </p>
                </div>

                {/* 3. Steps Taken */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block flex items-center justify-center gap-0.5">
                    <Footprints size={10} className="text-sky-400" /> Steps
                  </span>
                  <p className="text-xs font-bold text-sky-300 font-mono mt-1">
                    {(selectedDetailHike.steps || 14500).toLocaleString()}
                  </p>
                </div>

                {/* 4. Calories Burned */}
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block flex items-center justify-center gap-0.5">
                    <Flame size={10} className="text-rose-400" /> Calories
                  </span>
                  <p className="text-xs font-bold text-rose-300 font-mono mt-1">
                    {selectedDetailHike.calories || 850} kcal
                  </p>
                </div>
              </div>

              {/* Elevation & Distance Ribbon */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300">
                <span className="font-semibold">Elevation Gain: <strong className="text-emerald-400">{selectedDetailHike.elevation_gain_m || 1200} m</strong></span>
                <span className="font-semibold">Distance: <strong className="text-sky-400">{selectedDetailHike.distance_km || 10.2} km</strong></span>
              </div>

              {/* Notes Section */}
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                  Notes
                </h4>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed">
                  {selectedDetailHike.notes || 'Hike completed successfully along scenic mountain trails.'}
                </div>
              </div>

              {/* Journal Entry Section */}
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                  Journal Entry
                </h4>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed italic">
                  &ldquo;{selectedDetailHike.journal_entry || selectedDetailHike.notes || 'A memorable summit experience surrounded by breathtaking ridge views.'}&rdquo;
                </div>
              </div>

              {/* Memories Section (photos taken during that hike) */}
              <div className="space-y-2 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Camera size={14} className="text-emerald-400" />
                    <span>Memories ({selectedDetailHike.photos?.length || 0} Photos)</span>
                  </h4>
                  <button
                    onClick={() => detailPhotoInputRef.current?.click()}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Photo
                  </button>
                  <input
                    ref={detailPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAddMemoryPhoto}
                  />
                </div>

                {(!selectedDetailHike.photos || selectedDetailHike.photos.length === 0) ? (
                  <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-slate-400">
                    No memories taken yet. Photos taken with the in-app camera during a hike auto-save here!
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDetailHike.photos.map((imgUrl, i) => (
                      <div
                        key={i}
                        onClick={() => setFullscreenPhoto(imgUrl)}
                        className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-white/10 cursor-pointer group"
                      >
                        <img
                          src={imgUrl}
                          alt={`Memory ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950/80">
              <button
                onClick={() => setSelectedDetailHike(null)}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Viewer */}
      {fullscreenPhoto && (
        <div
          onClick={() => setFullscreenPhoto(null)}
          className="fixed inset-0 z-[3500] bg-black/95 flex items-center justify-center p-4 cursor-pointer"
        >
          <button
            onClick={() => setFullscreenPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={20} />
          </button>
          <img
            src={fullscreenPhoto}
            alt="Fullscreen Memory"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* ── MODAL: EDIT PROFILE NAME, PHOTO & EMOJI ──────────────────── */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={user}
        updateProfile={updateProfile}
      />

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
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={emergencyForm.weight}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, weight: e.target.value })}
                    placeholder="e.g. 65"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Blood Type</label>
                  <input
                    value={emergencyForm.blood_type}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, blood_type: e.target.value })}
                    placeholder="e.g. O+, A-, B+"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                  />
                </div>
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

      {/* ── MODAL: LOG CONQUERED PEAK DIRECTLY ON PROFILE ───────────── */}
      {showLogSummitModal && (
        <div className="fixed inset-0 z-[3100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl text-white my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-black text-sm text-emerald-400 flex items-center gap-2">
                <Mountain size={16} />
                <span>Log Conquered Mountain Peak</span>
              </h3>
              <button
                onClick={() => setShowLogSummitModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Mountain Peak Name</label>
                <input
                  value={summitForm.mountain}
                  onChange={(e) => setSummitForm({ ...summitForm, mountain: e.target.value })}
                  placeholder="e.g. Mt. Pulag Summit, Mt. Apo Peak"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Elevation Gain (meters)</label>
                  <input
                    type="number"
                    value={summitForm.elevation_gain_m}
                    onChange={(e) => setSummitForm({ ...summitForm, elevation_gain_m: e.target.value })}
                    placeholder="e.g. 2928"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Trail Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={summitForm.distance_km}
                    onChange={(e) => setSummitForm({ ...summitForm, distance_km: e.target.value })}
                    placeholder="e.g. 16.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Difficulty</label>
                <select
                  value={summitForm.difficulty}
                  onChange={(e) => setSummitForm({ ...summitForm, difficulty: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs"
                >
                  <option value="easy">Easy (Minor Climb)</option>
                  <option value="moderate">Moderate Trail</option>
                  <option value="challenging">Challenging / Major Climb</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Summit Photo (Optional)</label>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => summitPhotoInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Camera size={14} />
                    <span>Upload Photo</span>
                  </button>
                  {summitForm.photo && (
                    <span className="text-emerald-400 text-[11px] font-bold">Photo attached ✓</span>
                  )}
                  <input
                    ref={summitPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setSummitForm((f) => ({ ...f, photo: ev.target.result }));
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Summit Notes & Memories</label>
                <textarea
                  value={summitForm.notes}
                  onChange={(e) => setSummitForm({ ...summitForm, notes: e.target.value })}
                  placeholder="e.g. Reached peak at sunrise, sea of clouds, cold summit wind."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogSummitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSummit}
                disabled={isSavingSummit || !summitForm.mountain.trim()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-95 transition disabled:opacity-50"
              >
                {isSavingSummit ? 'Saving…' : 'Save Conquered Peak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: UPCOMING HIKES & HISTORY ───────────────────────────── */}
      <UpcomingHikesModal
        isOpen={showUpcomingHikesModal}
        onClose={() => setShowUpcomingHikesModal(false)}
        onStartHike={(hike) => {
          setShowUpcomingHikesModal(false);
          try {
            localStorage.setItem('trekquest_active_hike_start', JSON.stringify(hike));
            localStorage.setItem('trekquest_auto_start_hike', 'true');
            if (hike.startCoords) {
              localStorage.setItem('trekquest_custom_start', JSON.stringify(hike.startCoords));
            }
          } catch {}
          navigate('/');
        }}
        onViewOnMap={(hike) => {
          setShowUpcomingHikesModal(false);
          navigate('/map');
        }}
        onPlanNewRoute={() => {
          setShowUpcomingHikesModal(false);
          setShowPlanRouteModal(true);
        }}
        initialSelectedId={upcomingInitialId}
      />

      {/* ── MODAL: PLAN A ROUTE ────────────────────────────────────────── */}
      {showPlanRouteModal && (
        <PlanRouteModal
          onClose={() => setShowPlanRouteModal(false)}
          onSaveRoute={(plannedHike) => {
            setShowPlanRouteModal(false);
            if (plannedHike?.id) setUpcomingInitialId(plannedHike.id);
            setShowUpcomingHikesModal(true);
          }}
        />
      )}

    </div>
  );
}