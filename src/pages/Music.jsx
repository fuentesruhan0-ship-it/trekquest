import { useState, useRef, useEffect } from 'react';
import {
  Music, Play, Pause, SkipBack, SkipForward, Plus, X, Upload, ListMusic, Radio, ArrowLeft
} from 'lucide-react';

const defaultTrailTracks = [
  {
    name: 'Mountain Ridge Ambient.mp3',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    duration: '2:45',
    category: 'Relaxing'
  },
  {
    name: 'Pine Forest Stream & Birds.mp3',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3',
    duration: '3:12',
    category: 'Nature Sounds'
  },
  {
    name: 'Summit Ascent Energy.mp3',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=inspiring-cinematic-ambient-116199.mp3',
    duration: '2:18',
    category: 'Hiking Focus'
  }
];

export default function MusicMode({ onClose }) {
  const [tracks, setTracks] = useState(() => {
    try {
      const saved = localStorage.getItem('trekquest_tracks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return defaultTrailTracks;
    } catch {
      return defaultTrailTracks;
    }
  });

  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('0:00');
  const [durationStr, setDurationStr] = useState('0:00');
  const [isMuted, setIsMuted] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Take over the whole screen and lock body scroll completely to prevent conflicts
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('trekquest_tracks', JSON.stringify(tracks));
    } catch {}
  }, [tracks]);

  const active = tracks[current] || tracks[0];

  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const play = (idx) => {
    setCurrent(idx);
    setPlaying(true);
  };

  const togglePlay = () => {
    if (tracks.length === 0) return;
    setPlaying((p) => !p);
  };

  const next = () => {
    if (tracks.length === 0) return;
    setCurrent((c) => (c + 1) % tracks.length);
  };

  const prev = () => {
    if (tracks.length === 0) return;
    setCurrent((c) => (c - 1 + tracks.length) % tracks.length);
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Keep exact original file name - no renaming allowed!
      const originalFileName = file.name;
      const objectUrl = URL.createObjectURL(file);
      newTracks.push({
        name: originalFileName,
        url: objectUrl,
        category: 'Local Audio',
      });
    }

    setTracks((prev) => [...prev, ...newTracks]);
    if (!playing) {
      setCurrent(tracks.length);
      setPlaying(true);
    }
  };

  const removeTrack = (e, idx) => {
    e.stopPropagation();
    setTracks((t) => t.filter((_, i) => i !== idx));
    if (idx === current) {
      setPlaying(false);
      setCurrent(0);
    } else if (idx < current) {
      setCurrent((c) => c - 1);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active) return;
    audio.src = active.url;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [current, active]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTimeStr(formatTime(audio.currentTime));
        setDurationStr(formatTime(audio.duration));
      }
    };
    const onEnd = () => next();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [tracks, current]);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
    setProgress(pos * 100);
  };

  return (
    // Full screen takeover view: locks entire viewport, no background scrolling
    <div className="fixed inset-0 z-[2500] bg-gradient-to-b from-purple-950 via-slate-950 to-black text-white flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
      <audio ref={audioRef} />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div className="px-5 pt-10 pb-4 flex items-center justify-between">
        <button
          onClick={onClose ? onClose : () => window.history.back()}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center">
          <span className="text-[11px] font-bold tracking-widest text-purple-300 uppercase">Offline Trail Audio</span>
          <p className="text-xs text-slate-400 font-medium">Now Playing</p>
        </div>

        <button
          onClick={() => setShowPlaylist((p) => !p)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90 cursor-pointer ${
            showPlaylist ? 'bg-purple-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <ListMusic size={20} />
        </button>
      </div>

      {/* Main Player Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Animated Vinyl Disc Cover */}
        <div className="relative my-4 flex items-center justify-center">
          <div
            className={`w-64 h-64 rounded-full bg-gradient-to-br from-purple-600 via-indigo-900 to-black p-3 shadow-2xl border-4 border-purple-500/20 flex items-center justify-center ${
              playing ? 'animate-[spin_10s_linear_infinite]' : ''
            }`}
          >
            <div className="w-full h-full rounded-full border border-white/20 flex items-center justify-center bg-black/60 relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg border-2 border-white/40">
                <Music size={32} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Track Title (Keeps Original File Name, Never Renamed) */}
        <div className="text-center mt-6 w-full max-w-xs">
          <h2 className="text-lg font-extrabold text-white truncate drop-shadow">
            {active ? active.name : 'No track loaded'}
          </h2>
          <p className="text-xs text-purple-300 mt-1 flex items-center justify-center gap-1.5 font-medium">
            <Radio size={12} className={playing ? 'animate-pulse text-emerald-400' : 'text-slate-400'} />
            {active?.category || 'Trail Audio'} • Track {current + 1} of {tracks.length}
          </p>
        </div>

        {/* Progress Bar & Scrubber */}
        <div className="w-full max-w-xs mt-6">
          <div
            onClick={handleSeek}
            className="w-full h-2 bg-white/20 rounded-full relative cursor-pointer overflow-hidden group"
          >
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-indigo-300 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>{currentTimeStr}</span>
            <span>{durationStr}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-7 mt-6">
          <button
            onClick={prev}
            className="p-3 text-slate-300 hover:text-white active:scale-90 transition cursor-pointer"
          >
            <SkipBack size={32} />
          </button>

          <button
            onClick={togglePlay}
            className="w-18 h-18 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer border-2 border-white/30"
          >
            {playing ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>

          <button
            onClick={next}
            className="p-3 text-slate-300 hover:text-white active:scale-90 transition cursor-pointer"
          >
            <SkipForward size={32} />
          </button>
        </div>
      </div>

      {/* Upload Button */}
      <div className="px-6 py-4 flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white active:scale-95 transition cursor-pointer"
        >
          <Upload size={16} className="text-purple-300" />
          <span>Add Local Audio (Keeps File Name)</span>
        </button>
      </div>

      {/* Slide-over Playlist Drawer */}
      {showPlaylist && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl z-30 p-5 flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-base font-bold flex items-center gap-2">
              <ListMusic size={18} className="text-purple-400" />
              <span>Trail Playlist ({tracks.length})</span>
            </h3>
            <button
              onClick={() => setShowPlaylist(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300 active:scale-90"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-1">
            {tracks.map((t, idx) => (
              <div
                key={idx}
                onClick={() => {
                  play(idx);
                  setShowPlaylist(false);
                }}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                  idx === current
                    ? 'bg-purple-600/30 border-purple-500 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      idx === current ? 'bg-purple-500 text-white' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {idx === current && playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.category || 'Trail Audio'}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => removeTrack(e, idx)}
                  className="p-1.5 text-slate-400 hover:text-red-400 active:scale-90 shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 mt-4 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <Plus size={16} /> Add Songs From Phone
          </button>
        </div>
      )}
    </div>
  );
}