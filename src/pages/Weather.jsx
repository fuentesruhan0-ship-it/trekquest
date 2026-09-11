import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { CloudSun, CloudRain, Sun, Cloud, CloudSnow, Zap, Wind, Droplets, Thermometer, MapPin, AlertTriangle } from 'lucide-react';

const codeMap = {
  0: { label: 'Clear sky', icon: Sun, color: 'text-amber-500' },
  1: { label: 'Mainly clear', icon: Sun, color: 'text-amber-500' },
  2: { label: 'Partly cloudy', icon: Cloud, color: 'text-slate-400' },
  3: { label: 'Overcast', icon: Cloud, color: 'text-slate-500' },
  45: { label: 'Fog', icon: Cloud, color: 'text-slate-400' },
  48: { label: 'Rime fog', icon: Cloud, color: 'text-slate-400' },
  51: { label: 'Light drizzle', icon: CloudRain, color: 'text-sky-500' },
  53: { label: 'Drizzle', icon: CloudRain, color: 'text-sky-500' },
  55: { label: 'Heavy drizzle', icon: CloudRain, color: 'text-sky-600' },
  61: { label: 'Light rain', icon: CloudRain, color: 'text-sky-500' },
  63: { label: 'Rain', icon: CloudRain, color: 'text-sky-600' },
  65: { label: 'Heavy rain', icon: CloudRain, color: 'text-sky-700' },
  71: { label: 'Light snow', icon: CloudSnow, color: 'text-sky-300' },
  73: { label: 'Snow', icon: CloudSnow, color: 'text-sky-400' },
  75: { label: 'Heavy snow', icon: CloudSnow, color: 'text-sky-500' },
  80: { label: 'Rain showers', icon: CloudRain, color: 'text-sky-500' },
  81: { label: 'Heavy showers', icon: CloudRain, color: 'text-sky-600' },
  95: { label: 'Thunderstorm', icon: Zap, color: 'text-purple-600' },
  96: { label: 'Thunderstorm + hail', icon: Zap, color: 'text-purple-700' },
  99: { label: 'Severe thunderstorm', icon: Zap, color: 'text-purple-800' },
};

export default function Weather() {
  const [coords, setCoords] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [place, setPlace] = useState('Your location');

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords([pos.coords.latitude, pos.coords.longitude]),
      () => {
        // fallback to Manila
        setCoords([14.5995, 120.9842]);
        setPlace('Manila, PH (default)');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`
    )
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError('Unable to load weather.'); setLoading(false); });
  }, [coords]);

  if (loading) return (
    <div className="min-h-full">
      <PageHeader title="Weather Forecast" subtitle="Current conditions & 7-day outlook" icon={CloudSun} accent="bg-sky-600" />
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading weather…</div>
    </div>
  );
  if (error || !data) return (
    <div className="min-h-full">
      <PageHeader title="Weather Forecast" subtitle="Current conditions & 7-day outlook" icon={CloudSun} accent="bg-sky-600" />
      <div className="flex items-center justify-center py-20 text-red-600 text-sm">{error || 'No data.'}</div>
    </div>
  );

  const cur = data.current;
  const curInfo = codeMap[cur.weather_code] || { label: 'Unknown', icon: Cloud, color: 'text-slate-400' };
  const CurIcon = curInfo.icon;

  // alerts: heavy rain or thunderstorm in next 24h
  const hourly24 = data.hourly.weather_code.slice(0, 24);
  const hasAlert = hourly24.some((c) => [65, 75, 95, 96, 99].includes(c));

  return (
    <div className="min-h-full">
      <PageHeader title="Weather Forecast" subtitle="Current conditions & 7-day outlook" icon={CloudSun} accent="bg-sky-600" />
      <div className="p-4 space-y-4">
        {hasAlert && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-amber-900">Weather Alert</p>
              <p className="text-xs text-amber-800">Severe weather expected in the next 24 hours. Consider postponing your hike.</p>
            </div>
          </div>
        )}

        {/* Current */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-1.5 text-sm opacity-90">
            <MapPin size={14} /> {place}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-5xl font-bold">{Math.round(cur.temperature_2m)}°C</p>
              <p className="text-sm opacity-90 mt-1">{curInfo.label}</p>
              <p className="text-xs opacity-75">Feels like {Math.round(cur.apparent_temperature)}°C</p>
            </div>
            <CurIcon size={72} strokeWidth={1.5} className="opacity-90" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5">
            <Mini icon={Droplets} label="Humidity" value={`${cur.relative_humidity_2m}%`} />
            <Mini icon={Wind} label="Wind" value={`${Math.round(cur.wind_speed_10m)} km/h`} />
            <Mini icon={Thermometer} label="Apparent" value={`${Math.round(cur.apparent_temperature)}°C`} />
          </div>
        </div>

        {/* Hourly */}
        <div>
          <h3 className="text-sm font-bold mb-2">Next 12 hours</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const info = codeMap[data.hourly.weather_code[i]] || { icon: Cloud, color: 'text-slate-400' };
              const Ic = info.icon;
              const t = new Date(data.hourly.time[i]);
              return (
                <div key={i} className="flex flex-col items-center gap-1 bg-card border border-border rounded-2xl px-3 py-2 shrink-0 min-w-[58px]">
                  <span className="text-[10px] text-muted-foreground">{t.getHours()}:00</span>
                  <Ic size={22} className={info.color} />
                  <span className="text-xs font-semibold">{Math.round(data.hourly.temperature_2m[i])}°</span>
                  <span className="text-[10px] text-sky-600">{data.hourly.precipitation_probability[i]}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily */}
        <div>
          <h3 className="text-sm font-bold mb-2">7-day forecast</h3>
          <div className="space-y-2">
            {data.daily.time.map((d, i) => {
              const info = codeMap[data.daily.weather_code[i]] || { icon: Cloud, color: 'text-slate-400' };
              const Ic = info.icon;
              const day = new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
              return (
                <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
                  <span className="text-sm font-semibold w-12">{i === 0 ? 'Today' : day}</span>
                  <Ic size={22} className={info.color} />
                  <span className="text-xs text-muted-foreground flex-1 truncate">{info.label}</span>
                  <span className="text-xs text-sky-600">{data.daily.precipitation_sum[i]}mm</span>
                  <span className="text-sm font-semibold">{Math.round(data.daily.temperature_2m_max[i])}°</span>
                  <span className="text-xs text-muted-foreground">{Math.round(data.daily.temperature_2m_min[i])}°</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/15 rounded-xl py-2 text-center">
      <Icon size={16} className="mx-auto opacity-90" />
      <p className="text-[10px] opacity-80 mt-0.5">{label}</p>
      <p className="text-xs font-semibold">{value}</p>
    </div>
  );
}