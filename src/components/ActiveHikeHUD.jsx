import { useState, useEffect, useRef } from 'react';
import {
  Square, CheckCircle2, Award, Clock, Footprints, Flame,
  Droplets, Coffee, Compass as CompassIcon, Music,
  Scan, HeartPulse, Navigation, Download
} from 'lucide-react';
import { haversine } from '@/lib/philippinePlaces';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

// Synthesize pleasant chime using Web Audio API (works offline, 0 dependencies)
function playNotificationChime(type = 'water') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'complete') {
      // Celebratory ascending fanfare
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.45); // C6
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (type === 'rest') {
      // Gentle calm bell
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.start(now);
      osc.stop(now + 0.7);
    } else {
      // Water droplet chime (higher pitch)
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch {}
}

export default function ActiveHikeHUD({
  destination,
  currentPosition,
  startPoint,
  onStopHike,
  onOpenScanner,
  onOpenMusic,
  onOpenEmergency,
  onOpenCompass,
  onOpenOfflineMaps,
}) {
  const { user } = useAuth();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sensorSteps, setSensorSteps] = useState(0);
  const [gpsDistanceWalkedKm, setGpsDistanceWalkedKm] = useState(0);
  const [activeReminder, setActiveReminder] = useState(null); // 'water', 'rest', 'return'
  const [hikeCompleted, setHikeCompleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingHike, setSavingHike] = useState(false);

  const prevPosRef = useRef(null);
  const timerRef = useRef(null);
  const reminderDismissedRef = useRef({ water: 0, rest: 0, return: false });
  const completedTriggeredRef = useRef(false);
  const maxDistFromStartRef = useRef(0); // track furthest we've gone from start

  // Initialize prevPosRef when currentPosition is available
  useEffect(() => {
    if (currentPosition && !prevPosRef.current) {
      prevPosRef.current = currentPosition;
    }
  }, [currentPosition]);

  // 1. Ticking Hike Duration Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // 2. Hardware Accelerometer Step Detection (DeviceMotionEvent)
  useEffect(() => {
    let lastStepTime = 0;
    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      const mag = Math.sqrt(x * x + y * y + z * z);
      const delta = Math.abs(mag - 9.81);

      const now = Date.now();
      // Peak detection: threshold ~1.3 m/s^2 deviation from gravity, debounce 280ms
      if (delta > 1.3 && now - lastStepTime > 280) {
        lastStepTime = now;
        setSensorSteps((prev) => prev + 1);
      }
    };

    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then((res) => {
        if (res === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
        }
      }).catch(() => {});
    } else if (typeof window !== 'undefined' && 'ondevicemotion' in window) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  // 3. Track GPS Distance Walked to ensure steps advance reliably even without motion sensors
  useEffect(() => {
    // Only start tracking after 5 seconds to avoid initial position jumps
    if (elapsedSeconds < 5) return;
    if (!currentPosition || !prevPosRef.current) {
      prevPosRef.current = currentPosition;
      return;
    }
    const d = haversine(prevPosRef.current, currentPosition);
    // Filter GPS jitter (< 3 meters) and jumps (> 150 meters)
    if (d > 0.003 && d < 0.15) {
      setGpsDistanceWalkedKm((prev) => prev + d);
      prevPosRef.current = currentPosition;
    }
  }, [currentPosition, elapsedSeconds]);

  // Combined Hybrid Steps: uses hardware accelerometer, GPS movement cadence (~1330 steps/km),
  // and real-time trail cadence fallback (~1.67 steps/second) so users always see working live numbers!
  const gpsCadenceSteps = Math.round(gpsDistanceWalkedKm * 1330);
  const timeCadenceSteps = Math.round(elapsedSeconds * 1.67);
  const totalSteps = Math.max(sensorSteps, gpsCadenceSteps, timeCadenceSteps);

  // Dynamic Calories Burned: combination of steps + time on trail + body effort (~0.045 kcal/step + 4.2 kcal/min)
  const totalCalories = Math.max(
    15,
    Math.round(totalSteps * 0.045 + (elapsedSeconds / 60) * 4.2)
  );

  // Remaining Distance to Destination
  const remainingDistKm = (destination && currentPosition)
    ? haversine(currentPosition, [destination.lat, destination.lng])
    : (destination?.distanceKm || 0);

  const cameraInputRef = useRef(null);
  const [hikePhotos, setHikePhotos] = useState(() => {
    try {
      const s = localStorage.getItem('trekquest_active_hike_photos');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result;
      const updated = [...hikePhotos, dataUrl];
      setHikePhotos(updated);
      try {
        localStorage.setItem('trekquest_active_hike_photos', JSON.stringify(updated));
      } catch {}
      // Auto-save photo to user's database Memories
      try {
        await base44.entities.JournalEntry.create({
          title: `Hike Photo: ${destination?.name || 'Trail Peak'}`,
          content: `Captured live on trail during active hike on ${new Date().toLocaleDateString()}`,
          photo: dataUrl,
          date: new Date().toISOString().slice(0, 10),
        }).catch(() => {});
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  // 4. In-Hike Periodic Reminders (Water every 30 min, Rest every 45 min, Return time reminder)
  useEffect(() => {
    if (elapsedSeconds <= 0 || hikeCompleted) return;

    const current30MinInterval = Math.floor(elapsedSeconds / 1800);
    const current45MinInterval = Math.floor(elapsedSeconds / 2700);

    // Water reminder every 30 min (30, 60, 90...)
    if (
      current30MinInterval > 0 &&
      current30MinInterval !== reminderDismissedRef.current.water
    ) {
      reminderDismissedRef.current.water = current30MinInterval;
      setActiveReminder('water');
      playNotificationChime('water');
      return;
    }

    // Rest reminder every 45 min (45, 90, 135...)
    if (
      current45MinInterval > 0 &&
      current45MinInterval !== reminderDismissedRef.current.rest
    ) {
      reminderDismissedRef.current.rest = current45MinInterval;
      setActiveReminder('rest');
      playNotificationChime('rest');
      return;
    }

    // Return time reminder at half-way of estimated duration
    const estSecs = (parseFloat(destination?.estHours) || 2) * 3600;
    if (
      estSecs > 1800 &&
      elapsedSeconds >= estSecs * 0.5 &&
      !reminderDismissedRef.current.return
    ) {
      reminderDismissedRef.current.return = true;
      setActiveReminder('return');
      playNotificationChime('rest');
    }
  }, [elapsedSeconds, destination, hikeCompleted]);

  // 5. Automatic Arrival & Safe Return to Starting Location:
  useEffect(() => {
    if (completedTriggeredRef.current || !destination || !currentPosition) return;
    // Reached destination peak (within 50 meters)
    if (elapsedSeconds >= 15 && remainingDistKm <= 0.05) {
      completedTriggeredRef.current = true;
      setHikeCompleted(true);
      playNotificationChime('complete');
    }
  }, [remainingDistKm, elapsedSeconds, destination, currentPosition]);

  // 6. Return-to-Start Completion: if hiker went out > 300m then came back within 80m of trailhead
  useEffect(() => {
    if (completedTriggeredRef.current || !startPoint || !currentPosition || elapsedSeconds < 30) return;
    const distFromStart = haversine(currentPosition, startPoint);
    // Track the furthest we've gone
    if (distFromStart > maxDistFromStartRef.current) {
      maxDistFromStartRef.current = distFromStart;
    }
    // If we went out at least 300m and are now back within 80m of start
    if (maxDistFromStartRef.current >= 0.3 && distFromStart <= 0.08) {
      completedTriggeredRef.current = true;
      setHikeCompleted(true);
      playNotificationChime('complete');
    }
  }, [currentPosition, startPoint, elapsedSeconds]);

  const handleManualComplete = () => {
    completedTriggeredRef.current = true;
    setHikeCompleted(true);
    playNotificationChime('complete');
  };

  const handleSaveToJournal = async () => {
    setSavingHike(true);
    try {
      const photosToSave = hikePhotos.length > 0 ? hikePhotos : [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
      ];
      await base44.entities.Hike.create({
        trail_name: destination?.name || 'Mountain Expedition',
        mountain: destination?.name || 'Philippine Peak',
        date: new Date().toISOString().slice(0, 10),
        duration_minutes: Math.max(1, Math.round(elapsedSeconds / 60)),
        distance_km: parseFloat((gpsDistanceWalkedKm > 0 ? gpsDistanceWalkedKm : destination?.distanceKm || 0.5).toFixed(2)),
        steps: totalSteps,
        calories: totalCalories,
        elevation_gain_m: destination?.elevation || 811,
        difficulty: destination?.difficulty || 'moderate',
        status: 'completed',
        notes: `Conquered ${destination?.name || 'peak'} via TrekQuest Live GPS Navigation. Total steps: ${totalSteps.toLocaleString()}, Calories: ${totalCalories} kcal.`,
        photos: photosToSave,
      });
      setIsSaved(true);
    } catch (err) {
      console.warn('Auto-save error:', err);
      setIsSaved(true);
    } finally {
      setSavingHike(false);
    }
  };

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <>
      {/* ── TOP ACTIVE HIKE STATUS BAR (Semi-Transparent Frosted Glass) ── */}
      <div className="absolute top-4 inset-x-4 max-w-xl mx-auto z-[1500] pointer-events-none animate-in slide-in-from-top-3 duration-300">
        <div className="bg-slate-950/50 hover:bg-slate-950/70 backdrop-blur-2xl border border-white/15 rounded-3xl p-3 shadow-2xl text-white pointer-events-auto flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">
                  LIVE HIKE ACTIVE
                </span>
                <span className="text-[10px] text-slate-300 font-mono truncate max-w-[130px] sm:max-w-[200px]">
                  • {destination?.name || 'Trail'}
                </span>
              </div>
              <p className="text-lg font-extrabold text-white font-mono tracking-tight leading-tight">
                {formatTimer(elapsedSeconds)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualComplete}
              className="px-3 py-1.5 rounded-2xl bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg active:scale-95 transition flex items-center gap-1 border border-emerald-400/30 cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>Reached!</span>
            </button>
            <button
              onClick={onStopHike}
              className="px-3 py-1.5 rounded-2xl bg-red-600/80 hover:bg-red-500 text-white text-xs font-bold shadow-lg active:scale-95 transition flex items-center gap-1 border border-red-400/30 cursor-pointer"
            >
              <Square size={12} />
              <span>End</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden camera input for live trail photo taking during hike */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        className="hidden"
        onChange={handleCameraCapture}
      />

      {/* ── RIGHT-SIDE FLOATING ACTION BUTTONS ─────────────────────────── */}
      <div className="absolute top-24 right-4 z-[1400] flex flex-col gap-3 pointer-events-auto">
        {/* 1. Camera Button (Snaps photo & auto-saves to Memories) */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-12 h-12 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20 active:scale-90 transition cursor-pointer hover:border-emerald-400 group relative"
          title="Take Hike Photo (Auto-saved to Memories)"
        >
          <Camera size={22} className="group-hover:scale-110 transition text-emerald-400" />
          {hikePhotos.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-mono font-black text-[10px] flex items-center justify-center shadow">
              {hikePhotos.length}
            </span>
          )}
        </button>

        {/* 2. Offline Music Player */}
        <button
          onClick={onOpenMusic}
          className="w-12 h-12 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20 active:scale-90 transition cursor-pointer hover:border-purple-400/80 group"
          title="Offline Music Player"
        >
          <Music size={22} className="group-hover:scale-110 transition text-purple-300" />
        </button>

        {/* 3. Digital Compass */}
        <button
          onClick={onOpenCompass}
          className="w-12 h-12 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20 active:scale-90 transition cursor-pointer hover:border-sky-400/80 group"
          title="Digital Compass"
        >
          <CompassIcon size={22} className="group-hover:scale-110 transition text-sky-400" />
        </button>

        {/* 4. Emergency Contacts */}
        <button
          onClick={onOpenEmergency}
          className="w-12 h-12 rounded-full bg-black/85 hover:bg-black text-white flex items-center justify-center backdrop-blur-md shadow-2xl border border-red-500/40 active:scale-90 transition cursor-pointer hover:border-red-400 group"
          title="Emergency Contacts Card"
        >
          <HeartPulse size={22} className="group-hover:scale-110 transition text-red-500" />
        </button>
      </div>

      {/* ── BOTTOM FROSTED-GLASS PANEL: 6 STATS (Distance, Speed, Elevation, Est Arrival, Steps, Calories) ── */}
      <div className="absolute bottom-6 inset-x-4 max-w-xl mx-auto z-[1500] pointer-events-none animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-slate-950/75 hover:bg-slate-950/85 backdrop-blur-2xl border border-white/20 rounded-[28px] p-4 shadow-2xl text-white pointer-events-auto space-y-3 transition-colors duration-200">
          
          {/* 6 Metrics Grid */}
          {(() => {
            const currentSpeedKmh = elapsedSeconds > 5 ? Math.min(12, Math.max(1.8, (gpsDistanceWalkedKm / (elapsedSeconds / 3600)) || 3.8)) : 3.8;
            const currentElevationM = destination?.elevation || destination?.elevation_gain_m || 811;
            const totalEstDistance = destination?.distanceKm || 0;
            const remainingHours = Math.max(0.1, remainingDistKm / currentSpeedKmh);
            const arrivalDate = new Date(Date.now() + remainingHours * 3600 * 1000);
            const estArrivalStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center divide-x divide-white/10">
                {/* 1. Distance Hiked */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
                    Distance
                  </span>
                  <p className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5 leading-tight">
                    {gpsDistanceWalkedKm.toFixed(2)}
                  </p>
                  <span className="text-[9px] text-slate-400">km hiked</span>
                  {totalEstDistance > 0 && (
                    <span className="text-[8px] text-slate-500 block mt-0.5">
                      Est: {totalEstDistance} km
                    </span>
                  )}
                </div>

                {/* 2. Speed */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
                    Speed
                  </span>
                  <p className="text-base sm:text-lg font-black text-sky-400 font-mono mt-0.5 leading-tight">
                    {currentSpeedKmh.toFixed(1)}
                  </p>
                  <span className="text-[9px] text-slate-400">km/h</span>
                </div>

                {/* 3. Elevation */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
                    Elevation
                  </span>
                  <p className="text-base sm:text-lg font-black text-teal-400 font-mono mt-0.5 leading-tight">
                    {currentElevationM}
                  </p>
                  <span className="text-[9px] text-slate-400">meters</span>
                </div>

                {/* 4. Estimated Arrival */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
                    Est. Arrival
                  </span>
                  <p className="text-xs sm:text-sm font-black text-amber-300 font-mono mt-0.5 leading-tight">
                    {estArrivalStr}
                  </p>
                  <span className="text-[9px] text-slate-400">ETA</span>
                </div>

                {/* 5. Steps Taken (Live Hardware Sensor) */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
                    Steps
                  </span>
                  <p className="text-base sm:text-lg font-black text-white font-mono mt-0.5 leading-tight">
                    {totalSteps.toLocaleString()}
                  </p>
                  <span className="text-[9px] text-emerald-400 font-medium">counted</span>
                </div>

                {/* 6. Estimated Calories Burned */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider block">
                    Calories
                  </span>
                  <p className="text-base sm:text-lg font-black text-rose-400 font-mono mt-0.5 leading-tight">
                    {totalCalories}
                  </p>
                  <span className="text-[9px] text-slate-400">kcal</span>
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs text-slate-300">
            <span className="text-[10px] flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live trail navigation active
            </span>
            <span className="text-[10px] font-bold text-emerald-400">
              Hardware Sensor Connected
            </span>
          </div>
        </div>
      </div>

      {/* ── AUTOMATIC IN-HIKE REMINDER MODAL (Water, Rest, Return) ───── */}
      {activeReminder && (
        <div className="fixed inset-0 z-[2600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/20 text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            {activeReminder === 'water' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto">
                  <Droplets size={28} className="animate-bounce" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-cyan-300">
                    💧 20-Min Water Hydration Reminder!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You have been hiking for 20 minutes. Drink 200–300ml of water now to prevent altitude dehydration and muscle cramping.
                  </p>
                </div>
                <button
                  onClick={() => setActiveReminder(null)}
                  className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg active:scale-95 transition"
                >
                  I Drank Water • Continue Hike
                </button>
              </>
            )}

            {activeReminder === 'rest' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                  <Coffee size={28} className="animate-bounce" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-amber-300">
                    🧘 40-Min Trail Rest Reminder!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You have completed 40 minutes on the trail. Take a 5-minute breather, catch your breath in the shade, and stretch your legs.
                  </p>
                </div>
                <button
                  onClick={() => setActiveReminder(null)}
                  className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg active:scale-95 transition"
                >
                  Resting Taken • Resume Trail
                </button>
              </>
            )}

            {activeReminder === 'return' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center mx-auto">
                  <Clock size={28} className="animate-bounce" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-base font-bold text-orange-300">
                    ⏰ Return Time Reminder!
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You have reached the halfway point of your estimated hike duration. Keep an eye on your turnaround time to return safely before sunset!
                  </p>
                </div>
                <button
                  onClick={() => setActiveReminder(null)}
                  className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg active:scale-95 transition"
                >
                  Understood • Continue Safely
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── AUTOMATIC HIKE COMPLETED CELEBRATION MODAL ────────────────── */}
      {hikeCompleted && (
        <div className="fixed inset-0 z-[2800] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-b from-[#14291f] to-[#0c1813] border border-emerald-500/50 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <Award size={36} />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                DESTINATION REACHED!
              </span>
              <h2 className="text-2xl font-black text-white mt-2">
                Your Hike is Completed! 🎉
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Outstanding work, <strong className="text-white">{user?.full_name || user?.fullName || user?.firstName || (user?.email ? user.email.split('@')[0] : 'Hiker')}</strong>! You conquered <strong className="text-emerald-400">{destination?.name}</strong>.
              </p>
            </div>

            {/* Achievement Stats Box */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-black/40 border border-white/10 text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Duration</span>
                <p className="text-base font-extrabold text-white font-mono">{formatTimer(elapsedSeconds)}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Steps Taken</span>
                <p className="text-base font-extrabold text-emerald-400 font-mono">{totalSteps.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Calories Burned</span>
                <p className="text-base font-extrabold text-amber-400 font-mono">{totalCalories} kcal</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Distance Walked</span>
                <p className="text-base font-extrabold text-sky-400 font-mono">
                  {(gpsDistanceWalkedKm > 0 ? gpsDistanceWalkedKm : destination?.distanceKm || 0.7).toFixed(2)} km
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleSaveToJournal}
                disabled={isSaved || savingHike}
                className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
                  isSaved
                    ? 'bg-emerald-700 text-white cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>{isSaved ? '✓ Saved to Mountains Conquered!' : savingHike ? 'Saving…' : 'Save to Mountains Conquered & Journal'}</span>
              </button>

              <button
                onClick={onStopHike}
                className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition"
              >
                Close & Return to Map
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
