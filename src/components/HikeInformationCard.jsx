import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Navigation, X, Flame, Footprints, Clock, ChevronUp, ChevronDown, CheckCircle2, Play, ChevronLeft, Camera, BookOpen, Mountain
} from 'lucide-react';
import { haversine } from '@/lib/philippinePlaces';

export default function HikeInformationCard({
  destination,
  currentPosition,
  isTracking,
  elapsedSeconds,
  currentElevation,
  elevationGain,
  maxElevation,
  minElevation,
  onStartTracking,
  onStopTracking,
  onRecenterRoute,
  onClearRoute,
  onClose,
  onBack,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [distanceHiked, setDistanceHiked] = useState(0);
  const [hikeDuration, setHikeDuration] = useState(0);
  const [stepsCounted, setStepsCounted] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [hikePhotos, setHikePhotos] = useState([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const prevPosRef = useRef(null);
  const timerRef = useRef(null);

  // Get user weight from emergency card for accurate calorie calculation
  const getStepsPerCalorie = (weight) => {
    if (!weight) return 50; // default middle range
    if (weight >= 10 && weight <= 20) return 65; // average of 50-80
    if (weight >= 21 && weight <= 30) return 50; // average of 40-60
    if (weight >= 31 && weight <= 40) return 42.5; // average of 35-50
    if (weight >= 41 && weight <= 50) return 34.5; // average of 29-40
    if (weight >= 51 && weight <= 60) return 30; // average of 25-35
    if (weight >= 61 && weight <= 70) return 26; // average of 22-30
    if (weight >= 71 && weight <= 80) return 23.5; // average of 20-27
    if (weight >= 81 && weight <= 90) return 21.5; // average of 18-25
    if (weight >= 91 && weight <= 100) return 19.5; // average of 16-23
    return 50; // default fallback
  };

  // Get user weight from emergency card
  const userWeight = useMemo(() => {
    try {
      const emergencyData = localStorage.getItem('trekquest_emergency_info');
      if (emergencyData) {
        const parsed = JSON.parse(emergencyData);
        return parsed.weight ? parseFloat(parsed.weight) : null;
      }
    } catch {}
    return null;
  }, []);

  // Sync hike duration with elapsedSeconds prop when tracking
  useEffect(() => {
    if (isTracking) {
      setHikeDuration(elapsedSeconds);
      setStepsCounted(0);
      setCaloriesBurned(0);
      setHikePhotos([]);
    } else {
      setHikeDuration(0);
      setStepsCounted(0);
      setCaloriesBurned(0);
      setHikePhotos([]);
    }
  }, [elapsedSeconds, isTracking]);

  // Load hike photos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trekquest_active_hike_photos');
      if (saved) {
        setHikePhotos(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      // Check if permission is already granted
      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      
      if (permissionStatus.state === 'denied') {
        setShowPermissionModal(true);
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setShowCameraModal(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setShowPermissionModal(true);
      } else {
        alert('Unable to access camera. Please allow camera permissions.');
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCameraModal(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const updated = [...hikePhotos, dataUrl];
      setHikePhotos(updated);
      try {
        localStorage.setItem('trekquest_active_hike_photos', JSON.stringify(updated));
      } catch {}
      stopCamera();
    }
  };

  // Calculate calories in real-time based on steps counted only
  useEffect(() => {
    if (!isTracking) return;
    const stepsPerCalorie = userWeight ? getStepsPerCalorie(userWeight) : 50;
    const cals = Math.round(stepsCounted / stepsPerCalorie);
    setCaloriesBurned(cals);
  }, [stepsCounted, isTracking, userWeight]);

  // Track distance hiked during active tracking
  useEffect(() => {
    if (!isTracking || !currentPosition) {
      prevPosRef.current = null;
      return;
    }
    if (!prevPosRef.current) {
      prevPosRef.current = currentPosition;
      return;
    }
    const d = haversine(prevPosRef.current, currentPosition);
    // Filter GPS jitter (< 3 meters) and jumps (> 150 meters)
    if (d > 0.003 && d < 0.15) {
      setDistanceHiked((prev) => prev + d);
      prevPosRef.current = currentPosition;
    }
  }, [currentPosition, isTracking]);

  // Hardware Accelerometer Step Detection (DeviceMotionEvent)
  useEffect(() => {
    let lastStepTime = 0;
    const motionHistory = [];
    const handleMotion = (e) => {
      if (!isTracking) return;
      const acc = e.accelerationIncludingGravity || e.acceleration;
      if (!acc) return;
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      const mag = Math.sqrt(x * x + y * y + z * z);
      const delta = Math.abs(mag - 9.81);

      const now = Date.now();
      
      // Add to motion history for pattern detection
      motionHistory.push({ time: now, delta });
      if (motionHistory.length > 10) motionHistory.shift();

      // Improved step detection: require consistent walking pattern
      // Higher threshold (2.0) and longer debounce (400ms) to reduce false positives
      // Also check for recent motion pattern consistency
      if (delta > 2.0 && now - lastStepTime > 400) {
        // Check if there were recent motions that could indicate walking
        const recentMotions = motionHistory.filter(m => now - m.time < 500);
        const significantMotions = recentMotions.filter(m => m.delta > 1.5);
        
        // Only count as a step if there's a pattern of motion (at least 2 significant motions in last 500ms)
        if (significantMotions.length >= 2) {
          lastStepTime = now;
          setStepsCounted((prev) => prev + 1);
        }
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
  }, [isTracking]);

  if (!destination) return null;

  const distKm = (currentPosition && destination?.lat != null && destination?.lng != null)
    ? haversine(currentPosition, [destination.lat, destination.lng])
    : (parseFloat(destination?.distanceKm) || 5.0);

  // Average hiking pace 3.5 km/h
  const estHours = Math.max(0.4, (distKm / 3.5)).toFixed(1);

  // Cadence math: ~1,330 steps per km on mountainous trails
  const calculatedSteps = Math.round(distKm * 1330);

  const stepsPerCalorie = getStepsPerCalorie(userWeight);

  // Estimated calories for the planned hike (based on estimated steps only)
  const estimatedCalories = Math.round(calculatedSteps / stepsPerCalorie);

  const formatTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'Barangay':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'City':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Municipality':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'Mountain Peak':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
    }
  };

  return (
    <>
      {/* Notes/Journal Selection Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <BookOpen size={32} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-amber-300">
                Add Notes or Journal Entry?
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Would you like to add quick notes for this hike, or create a full journal entry?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  // Navigate to Journal page with from=hike parameter
                  window.location.href = '/journal?from=hike';
                }}
                className="flex-1 py-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition"
              >
                Journal Entry
              </button>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  // Show quick notes input (could add another modal for this)
                  const note = prompt('Add a quick note for this hike:');
                  if (note) {
                    try {
                      const currentNotes = JSON.parse(localStorage.getItem('trekquest_hike_notes') || '[]');
                      const updated = [...currentNotes, { note, timestamp: new Date().toISOString() }];
                      localStorage.setItem('trekquest_hike_notes', JSON.stringify(updated));
                      alert('Note saved!');
                    } catch {}
                  }
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition"
              >
                Notes
              </button>
            </div>
            <button
              onClick={() => setShowNotesModal(false)}
              className="w-full py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Camera Permission Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Camera size={32} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-amber-300">
                Camera Permission Required
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                TrekQuest needs access to your camera to take photos during your hike. These photos will be saved to your Mountains Conquered gallery.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition"
              >
                Deny
              </button>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  // Try to request permission again
                  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                    .then(async (stream) => {
                      stream.getTracks().forEach(track => track.stop());
                      // After permission is granted, start camera
                      startCamera();
                    })
                    .catch(() => {
                      alert('Camera permission still denied. Please enable it in your browser settings.');
                    });
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[5000] bg-black flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 px-4">
            <button
              onClick={stopCamera}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border-2 border-white text-white font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition"
            >
              ✕
            </button>
            <button
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full bg-white border-4 border-emerald-400 flex items-center justify-center cursor-pointer hover:scale-105 transition shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500" />
            </button>
            <div className="w-16" />
          </div>
        </div>
      )}

      <div className="absolute bottom-6 inset-x-4 max-w-xl mx-auto z-[1500] pointer-events-none animate-in slide-in-from-bottom-4 duration-300">
        {/* Semi-transparent frosted glass container so the map is clearly visible underneath */}
        <div className="bg-slate-950/50 hover:bg-slate-950/70 backdrop-blur-2xl border border-white/15 rounded-3xl p-3.5 sm:p-4 shadow-2xl text-white space-y-3 transition-colors duration-200 pointer-events-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Navigation size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
                  Hike Information
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getBadgeColor(destination.type)}`}>
                  {destination.type || 'Destination'}
                </span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate leading-tight">
                {destination.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
              title={collapsed ? 'Expand details' : 'Collapse'}
            >
              {collapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-red-500/30 text-slate-300 hover:text-red-400 transition cursor-pointer"
              title="Close card"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Collapsed view summary */}
        {collapsed ? (
          <div className="flex items-center justify-between text-xs py-0.5">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-400">{distKm.toFixed(2)} km</span>
              <span className="text-sky-300 flex items-center gap-1">
                <Footprints size={12} /> {calculatedSteps.toLocaleString()} steps
              </span>
              <span className="text-amber-300 flex items-center gap-1">
                <Flame size={12} /> {calculatedCalories} kcal
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
            >
              View Details →
            </button>
          </div>
        ) : (
          /* Full Hike Details - Cleaned to Burned Calories & Steps Counter as requested */
          <>
            <p className="text-[11px] text-slate-300 -mt-1 truncate">
              📍 {destination.region || 'Philippines'} • Follow blue line on map
            </p>

            {/* 5 Metric Stats Grid (Distance, Duration, Steps, Calories, Elevation) */}
            <div className="grid grid-cols-5 gap-1.5 text-center py-1">
              {/* 1. Distance */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
                <span className="text-[8px] text-slate-400 block font-bold uppercase flex items-center justify-center gap-0.5">
                  <Navigation size={8} className="text-emerald-400" /> Dist.
                </span>
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-xs font-extrabold text-emerald-400 font-mono">
                    {isTracking ? distanceHiked.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-[8px] text-slate-400">km</span>
                </div>
                <span className="text-[7px] text-amber-400 block mt-0.5">
                  est. {distKm.toFixed(0)} km
                </span>
              </div>

              {/* 2. Duration Timer */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
                <span className="text-[8px] text-slate-400 block font-bold uppercase flex items-center justify-center gap-0.5">
                  <Clock size={8} className="text-amber-400" /> Dur.
                </span>
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-xs font-extrabold text-amber-400 font-mono">
                    {formatTimer(hikeDuration)}
                  </span>
                </div>
                <span className="text-[7px] text-amber-400 block mt-0.5">
                  est. {estHours}h
                </span>
              </div>

              {/* 3. Steps Counter */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
                <span className="text-[8px] text-slate-400 block font-bold uppercase flex items-center justify-center gap-0.5">
                  <Footprints size={8} className="text-sky-400" /> Steps
                </span>
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-xs font-extrabold text-sky-400 font-mono">
                    {stepsCounted.toLocaleString()}
                  </span>
                </div>
                <span className="text-[7px] text-amber-400 block mt-0.5">
                  est. {calculatedSteps.toLocaleString()}
                </span>
              </div>

              {/* 4. Burned Calories */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
                <span className="text-[8px] text-slate-400 block font-bold uppercase flex items-center justify-center gap-0.5">
                  <Flame size={8} className="text-rose-400" /> Cals
                </span>
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-xs font-extrabold text-rose-400 font-mono">
                    {isTracking ? caloriesBurned : '0'}
                  </span>
                </div>
                <span className="text-[7px] text-amber-400 block mt-0.5">
                  est. {estimatedCalories}
                </span>
              </div>

              {/* 5. Elevation */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
                <span className="text-[8px] text-slate-400 block font-bold uppercase flex items-center justify-center gap-0.5">
                  <Mountain size={8} className="text-purple-400" /> Elev.
                </span>
                <div className="flex items-center justify-center gap-0.5">
                  <span className="text-xs font-extrabold text-purple-400 font-mono">
                    {currentElevation > 0 ? Math.round(currentElevation) : '--'}
                  </span>
                  <span className="text-[8px] text-slate-400">m</span>
                </div>
                <span className="text-[7px] text-purple-300 block mt-0.5">
                  +{Math.round(elevationGain)}m gain
                </span>
              </div>
            </div>

            {/* Action Buttons: Back to Hike Info & Start/End Hike */}
            <div className="flex items-center gap-2 pt-1">
              {!isTracking && (
                <button
                  onClick={onBack || onClose}
                  className="flex-1 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <ChevronLeft size={14} />
                  <span>Back</span>
                </button>
              )}

              <button
                onClick={onClearRoute}
                className="px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-300 text-xs font-bold transition flex items-center justify-center cursor-pointer border border-white/10"
                title="Clear Destination"
              >
                Clear
              </button>

              <button
                onClick={() => {
                  if (isTracking) {
                    // Save hike photos to localStorage for Mountains Conquered
                    if (hikePhotos.length > 0) {
                      try {
                        localStorage.setItem('trekquest_last_hike_photos', JSON.stringify(hikePhotos));
                      } catch {}
                    }
                    onStopTracking();
                  } else {
                    onStartTracking();
                  }
                }}
                className={`flex-[2] py-2.5 rounded-2xl font-extrabold text-xs tracking-wide transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  isTracking
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/30'
                }`}
              >
                {isTracking ? (
                  <>
                    <X size={14} /> Stop Active Hike
                  </>
                ) : (
                  <>
                    <Play size={14} /> Start Hiking Now →
                  </>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
    </>
  );
}
