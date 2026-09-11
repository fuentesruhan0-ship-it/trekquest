import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Music, Play, Pause, SkipBack, SkipForward, Plus, X, Volume2, Download } from 'lucide-react';

export default function MusicMode() {
  const [tracks, setTracks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('trekquest_tracks') || '[]'); } catch { return []; }
  });
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const audioRef = useRef(null);

  useEffect(() => { localStorage.setItem('trekquest_tracks', JSON.stringify(tracks)); }, [tracks]);

  const addTrack = () => {
    if (!url.trim() || !name.trim()) return;
    setTracks((t) => [...t, { name: name.trim(), url: url.trim() }]);
    setUrl(''); setName('');
  };

  const removeTrack = (i) => {
    setTracks((t) => t.filter((_, idx) => idx !== i));
    if (i === current) { setPlaying(false); setCurrent(0); }
  };

  const play = (i) => {
    setCurrent(i);
    setPlaying(true);
  };

  const togglePlay = () => {
    if (tracks.length === 0) return;
    setPlaying((p) => !p);
  };

  const next = () => tracks.length && setCurrent((c) => (c + 1) % tracks.length);
  const prev = () => tracks.length && setCurrent((c) => (c - 1 + tracks.length) % tracks.length);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;
    audio.src = tracks[current]?.url;
    if (playing) audio.play().catch(() => {});
    else audio.pause();
  }, [current, playing, tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    const onEnd = () => next();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [tracks]);

  const active = tracks[current];

  return (
    <div className="min-h-full">
      <PageHeader title="Hiking Music Mode" subtitle="Listen on the trail" icon={Music} accent="bg-purple-600" />
      <div className="p-4 space-y-4">
        <audio ref={audioRef} />

        {/* Now playing */}
        {active ? (
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl p-6 text-center shadow-lg">
            <div className="w-40 h-40 mx-auto rounded-3xl bg-white/15 flex items-center justify-center mb-4">
              <Music size={64} className="opacity-80" />
            </div>
            <p className="text-lg font-bold truncate">{active.name}</p>
            <p className="text-xs opacity-70 mt-1">Track {current + 1} of {tracks.length}</p>
            <div className="h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-center gap-6 mt-5">
              <button onClick={prev} className="p-2 active:scale-90 transition"><SkipBack size={28} /></button>
              <button onClick={togglePlay} className="w-14 h-14 rounded-full bg-white text-purple-700 flex items-center justify-center active:scale-90 transition">
                {playing ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
              </button>
              <button onClick={next} className="p-2 active:scale-90 transition"><SkipForward size={28} /></button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
            No tracks yet. Add an audio URL below to build your playlist.
          </div>
        )}

        {/* Add track */}
        <div className="bg-card border border-border rounded-2xl p-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1.5"><Download size={14} /> Add audio (paste a direct MP3/audio URL)</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Track name"
            className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/song.mp3"
            className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button onClick={addTrack} className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition">
            <Plus size={16} /> Add to Playlist
          </button>
        </div>

        {/* Playlist */}
        <div>
          <h3 className="text-sm font-bold mb-2">Playlist ({tracks.length})</h3>
          <div className="space-y-1.5">
            {tracks.map((t, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl p-2.5 border ${i === current ? 'bg-purple-50 border-purple-300' : 'bg-card border-border'}`}>
                <button onClick={() => play(i)} className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 active:scale-90 transition">
                  <Play size={14} className="ml-0.5" />
                </button>
                <span className="flex-1 text-sm font-medium truncate">{t.name}</span>
                <button onClick={() => removeTrack(i)} className="p-1.5 text-red-400"><X size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}