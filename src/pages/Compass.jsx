import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { Compass as CompassIcon, Navigation } from 'lucide-react';

export default function Compass() {
  const [heading, setHeading] = useState(null);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const handler = (e) => {
      let h = null;
      if (e.webkitCompassHeading != null) h = e.webkitCompassHeading;
      else if (e.alpha != null) h = 360 - e.alpha;
      if (h != null) setHeading(h);
    };

    const start = () => {
      if (typeof DeviceOrientationEvent !== 'undefined') {
        setSupported(true);
        window.addEventListener('deviceorientationabsolute', handler, true);
        window.addEventListener('deviceorientation', handler, true);
      } else {
        setSupported(false);
        setError('Compass not supported on this device.');
      }
    };

    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // permission requested on button
    } else {
      start();
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handler, true);
      window.removeEventListener('deviceorientation', handler, true);
    };
  }, []);

  const requestPermission = async () => {
    try {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res === 'granted') {
        const handler = (e) => {
          let h = null;
          if (e.webkitCompassHeading != null) h = e.webkitCompassHeading;
          else if (e.alpha != null) h = 360 - e.alpha;
          if (h != null) setHeading(h);
        };
        window.addEventListener('deviceorientation', handler, true);
        setError(null);
      } else {
        setError('Permission denied. Enable motion sensors.');
      }
    } catch {
      setError('Unable to request sensor permission.');
    }
  };

  const h = heading ?? 0;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const dirIdx = Math.round(h / 45) % 8;
  const cardinal = directions[dirIdx];

  return (
    <div className="min-h-full">
      <PageHeader title="Digital Compass" subtitle="Find your direction" icon={CompassIcon} accent="bg-slate-700" />
      <div className="p-4 flex flex-col items-center gap-6 pt-8">
        {heading === null && supported && !error && (
          <button onClick={requestPermission} className="bg-slate-700 text-white px-6 py-3 rounded-xl font-semibold active:scale-95 transition">
            Enable Compass
          </button>
        )}
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 text-center">{error}</p>}

        {/* Compass rose */}
        <div className="relative w-64 h-64">
          {/* fixed markings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="absolute top-2 text-red-600 font-bold text-lg">N</span>
            <span className="absolute bottom-2 text-muted-foreground font-bold text-lg">S</span>
            <span className="absolute left-2 text-muted-foreground font-bold text-lg">W</span>
            <span className="absolute right-2 text-muted-foreground font-bold text-lg">E</span>
          </div>
          {/* rotating dial */}
          <div
            className="absolute inset-4 rounded-full border-4 border-slate-200 transition-transform duration-200"
            style={{ transform: `rotate(${-h}deg)` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-6 bg-red-600 rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-4 bg-slate-400 rounded-full" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-1 bg-slate-400 rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-1 bg-slate-400 rounded-full" />
          </div>
          {/* center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Navigation size={28} className="text-primary" style={{ transform: `rotate(${h}deg)` }} />
          </div>
        </div>

        <div className="text-center">
          <p className="text-5xl font-bold">{Math.round(h)}°</p>
          <p className="text-lg font-semibold text-primary mt-1">{cardinal}</p>
        </div>

        <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
          {directions.map((d, i) => (
            <div key={d} className={`text-center py-2 rounded-xl text-sm font-semibold ${i === dirIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {d}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Hold your phone flat and away from metal objects for an accurate reading.
        </p>
      </div>
    </div>
  );
}