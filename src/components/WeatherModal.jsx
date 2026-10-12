import { useState, useEffect } from 'react';
import {
  ChevronLeft, Plus, Cloud,
  Search, MapPin, X, Droplets, Wind, CloudRain
} from 'lucide-react';

export default function WeatherModal({ onClose }) {
  const [coords, setCoords] = useState(() => {
    try {
      const saved = localStorage.getItem('trekquest_current_coords');
      return saved ? JSON.parse(saved) : [14.0436, 120.8031];
    } catch {
      return [14.0436, 120.8031];
    }
  });

  const [placeName, setPlaceName] = useState('Poblacion');
  const [weatherData, setWeatherData] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [isManualLocation, setIsManualLocation] = useState(false);

  // Reverse geocode to get local village/neighbourhood/town (only when NOT from manual search)
  useEffect(() => {
    if (!coords || isManualLocation) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords[0]}&lon=${coords[1]}&format=json&zoom=14&addressdetails=1`)
      .then(res => res.json())
      .then(d => {
        const a = d.address || {};
        const local = a.city || a.town || a.city_district || a.municipality || a.neighbourhood || a.suburb || a.village || a.quarter || 'Poblacion';
        setPlaceName(local);
      })
      .catch(() => setPlaceName('Poblacion'));
  }, [coords, isManualLocation]);

  // Fetch live weather data from Open-Meteo
  useEffect(() => {
    if (!coords) return;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
    )
      .then(r => r.json())
      .then(data => setWeatherData(data))
      .catch(err => console.warn('Weather fetch error:', err));
  }, [coords]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`);
      if (res.ok) {
        const list = await res.json();
        setSearchResults(list);
      }
    } catch {} finally {
      setSearching(false);
    }
  };

  const selectPlace = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setCoords([lat, lon]);
    setPlaceName(item.display_name.split(',')[0].trim());
    setIsManualLocation(true);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Weather values (defaulting to screenshot values if loading)
  const currentTemp = weatherData?.current?.temperature_2m ? Math.round(weatherData.current.temperature_2m) : 29;
  const highTemp = weatherData?.daily?.temperature_2m_max?.[0] ? Math.round(weatherData.daily.temperature_2m_max[0]) : 33;
  const lowTemp = weatherData?.daily?.temperature_2m_min?.[0] ? Math.round(weatherData.daily.temperature_2m_min[0]) : 22;
  const weatherCode = weatherData?.current?.weather_code || 0;

  // Determine weather type for dynamic background
  const getWeatherType = (code) => {
    if (code === 0) return 'sunny';
    if (code >= 1 && code <= 3) return 'partly-cloudy';
    if (code >= 45 && code <= 48) return 'foggy';
    if (code >= 51 && code <= 67) return 'rainy';
    if (code >= 71 && code <= 77) return 'snowy';
    if (code >= 80 && code <= 82) return 'rainy';
    if (code >= 95 && code <= 99) return 'stormy';
    return 'cloudy';
  };

  const weatherType = getWeatherType(weatherCode);

  // Generate forecast list from actual weather data
  const getForecastList = () => {
    if (!weatherData?.daily) {
      return [
        { day: 'Today', icon: 'cloudy', low: lowTemp, high: highTemp },
        { day: 'Tomorrow', icon: 'partly', low: lowTemp - 1, high: highTemp - 1 },
        { day: 'Wednesday', icon: 'sunny', low: lowTemp - 2, high: highTemp - 2 },
      ];
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    const tomorrow = (today + 1) % 7;
    const dayAfter = (today + 2) % 7;

    const getIcon = (code) => {
      if (code === 0) return 'sunny';
      if (code >= 1 && code <= 3) return 'partly';
      if (code >= 45 && code <= 48) return 'foggy';
      if (code >= 51 && code <= 67) return 'rainy';
      if (code >= 71 && code <= 77) return 'snowy';
      if (code >= 80 && code <= 82) return 'rainy';
      if (code >= 95 && code <= 99) return 'stormy';
      return 'cloudy';
    };

    return [
      {
        day: 'Today',
        icon: getIcon(weatherData.daily.weather_code[0]),
        low: Math.round(weatherData.daily.temperature_2m_min[0]),
        high: Math.round(weatherData.daily.temperature_2m_max[0]),
      },
      {
        day: 'Tomorrow',
        icon: getIcon(weatherData.daily.weather_code[1]),
        low: Math.round(weatherData.daily.temperature_2m_min[1]),
        high: Math.round(weatherData.daily.temperature_2m_max[1]),
      },
      {
        day: days[dayAfter],
        icon: getIcon(weatherData.daily.weather_code[2]),
        low: Math.round(weatherData.daily.temperature_2m_min[2]),
        high: Math.round(weatherData.daily.temperature_2m_max[2]),
      },
    ];
  };

  const forecastList = getForecastList();

  // Dynamic background styles based on weather
  const getBackgroundStyles = (type) => {
    switch (type) {
      case 'sunny':
        return {
          bgGradient: 'from-amber-500/20 via-orange-400/15 to-yellow-300/10',
          orbs: [
            { color: 'bg-amber-400/40', position: '-top-32 -right-32', size: 'w-[500px] h-[500px]' },
            { color: 'bg-orange-300/30', position: 'bottom-10 -left-20', size: 'w-[400px] h-[400px]' },
            { color: 'bg-yellow-200/20', position: 'top-1/3 left-1/4', size: 'w-[300px] h-[300px]' },
          ],
          overlay: 'from-[#fef3c7]/95 via-[#fde68a]/90 to-[#fcd34d]/95'
        };
      case 'rainy':
        return {
          bgGradient: 'from-slate-700/30 via-blue-900/25 to-slate-800/35',
          orbs: [
            { color: 'bg-blue-600/30', position: '-top-24 -left-20', size: 'w-96 h-96' },
            { color: 'bg-slate-500/25', position: 'top-1/4 -right-20', size: 'w-96 h-96' },
            { color: 'bg-blue-800/20', position: 'bottom-10 left-1/3', size: 'w-80 h-80' },
          ],
          overlay: 'from-[#1e293b]/95 via-[#334155]/90 to-[#0f172a]/95'
        };
      case 'stormy':
        return {
          bgGradient: 'from-slate-800/40 via-gray-900/35 to-slate-900/45',
          orbs: [
            { color: 'bg-purple-700/25', position: '-top-24 -left-20', size: 'w-96 h-96' },
            { color: 'bg-indigo-800/30', position: 'top-1/4 -right-20', size: 'w-96 h-96' },
            { color: 'bg-slate-600/25', position: 'bottom-10 left-1/3', size: 'w-80 h-80' },
          ],
          overlay: 'from-[#0f172a]/95 via-[#1e293b]/90 to-[#020617]/95'
        };
      case 'partly-cloudy':
        return {
          bgGradient: 'from-sky-400/20 via-blue-300/15 to-slate-200/10',
          orbs: [
            { color: 'bg-sky-300/35', position: '-top-24 -left-20', size: 'w-96 h-96' },
            { color: 'bg-blue-200/25', position: 'top-1/4 -right-20', size: 'w-96 h-96' },
            { color: 'bg-slate-300/20', position: 'bottom-10 left-1/3', size: 'w-80 h-80' },
          ],
          overlay: 'from-[#e0f2fe]/95 via-[#bae6fd]/90 to-[#f1f5f9]/95'
        };
      case 'foggy':
        return {
          bgGradient: 'from-slate-400/30 via-gray-300/25 to-slate-500/35',
          orbs: [
            { color: 'bg-slate-400/25', position: '-top-24 -left-20', size: 'w-96 h-96' },
            { color: 'bg-gray-300/20', position: 'top-1/4 -right-20', size: 'w-96 h-96' },
            { color: 'bg-slate-500/20', position: 'bottom-10 left-1/3', size: 'w-80 h-80' },
          ],
          overlay: 'from-[#94a3b8]/95 via-[#cbd5e1]/90 to-[#64748b]/95'
        };
      case 'snowy':
        return {
          bgGradient: 'from-blue-100/30 via-slate-200/25 to-gray-100/35',
          orbs: [
            { color: 'bg-blue-100/25', position: '-top-24 -left-20', size: 'w-96 h-96' },
            { color: 'bg-slate-200/20', position: 'top-1/4 -right-20', size: 'w-96 h-96' },
            { color: 'bg-gray-100/20', position: 'bottom-10 left-1/3', size: 'w-80 h-80' },
          ],
          overlay: 'from-[#f1f5f9]/95 via-[#e2e8f0]/90 to-[#cbd5e1]/95'
        };
      default: // cloudy
        return {
          bgGradient: 'from-blue-900/30 via-indigo-950/40 to-slate-800/35',
          orbs: [
            { color: 'bg-blue-900/30', position: '-top-24 -left-20', size: 'w-96 h-96' },
            { color: 'bg-indigo-950/40', position: 'top-1/4 -right-20', size: 'w-96 h-96' },
            { color: 'bg-slate-800/40', position: 'bottom-10 left-1/3', size: 'w-80 h-80' },
          ],
          overlay: 'from-[#131b2e]/90 via-[#18233c]/85 to-[#0f1524]/95'
        };
    }
  };

  const bgStyles = getBackgroundStyles(weatherType);

  return (
    <div className={`fixed inset-0 z-[3200] bg-gradient-to-br ${bgStyles.bgGradient} overflow-y-auto no-scrollbar flex flex-col text-white font-sans select-none animate-in fade-in duration-200`}>
      {/* Dynamic weather background backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {bgStyles.orbs.map((orb, idx) => (
          <div
            key={idx}
            className={`absolute ${orb.position} ${orb.size} ${orb.color} rounded-full blur-3xl`}
          />
        ))}
        {/* Weather-specific overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b ${bgStyles.overlay} backdrop-blur-[2px]`} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col px-5 pt-4 pb-8">
        {/* Top Status Bar & Action Header (Matches Screenshot) */}
        <div className="flex items-center justify-between pt-1 pb-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/90 transition cursor-pointer backdrop-blur-md"
            title="Back to Map"
          >
            <ChevronLeft size={22} />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/90 transition cursor-pointer backdrop-blur-md"
              title="Add / Search City"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Search Bar Overlay */}
        {showSearch && (
          <div className="mb-4 bg-[#1f2942]/95 border border-white/15 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-150">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, trail, mountain..."
                className="flex-1 bg-white/10 text-white placeholder-slate-400 text-xs px-3.5 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-400"
                autoFocus
              />
              <button
                type="submit"
                disabled={searching}
                className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-bold transition active:scale-95"
              >
                {searching ? '...' : <Search size={14} />}
              </button>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </form>
            {searchResults.length > 0 && (
              <div className="mt-2 divide-y divide-white/10 max-h-48 overflow-y-auto">
                {searchResults.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => selectPlace(item)}
                    className="w-full text-left py-2 px-1 text-xs hover:text-sky-300 flex items-center gap-2 truncate"
                  >
                    <MapPin size={12} className="text-sky-400 shrink-0" />
                    <span className="truncate">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Weather Hero Section (Matches Screenshot 4) */}
        <div className="pt-6 pb-6">
          {/* Location Name */}
          <h1 className="text-[28px] font-semibold text-white tracking-wide">
            {placeName}
          </h1>

          {/* Giant Temperature */}
          <div className="flex items-start my-1">
            <span className="text-[88px] font-light leading-none tracking-tight text-white">
              {currentTemp}
            </span>
            <span className="text-[52px] font-light text-white/90 leading-none ml-1">
              °
            </span>
          </div>

          {/* Condition and High / Low */}
          <p className="text-[17px] font-normal text-slate-200">
            {weatherType.charAt(0).toUpperCase() + weatherType.slice(1).replace('-', ' ')} {highTemp}°/{lowTemp}°
          </p>

          {/* Air Quality & Weather Metrics Grid */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.12] border border-white/10 backdrop-blur-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
              <span className="text-xs font-semibold text-white/95">AQI 53</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.12] border border-white/10 backdrop-blur-md text-xs font-semibold text-sky-200">
              <CloudRain size={13} className="text-sky-400" />
              <span>Rain: {weatherData?.current?.rain ? `${weatherData.current.rain} mm` : '0 mm'}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.12] border border-white/10 backdrop-blur-md text-xs font-semibold text-teal-200">
              <Wind size={13} className="text-teal-400" />
              <span>Wind: {weatherData?.current?.wind_speed_10m ? `${Math.round(weatherData.current.wind_speed_10m)} km/h` : '18 km/h'}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.12] border border-white/10 backdrop-blur-md text-xs font-semibold text-cyan-200">
              <Droplets size={13} className="text-cyan-400" />
              <span>Humidity: {weatherData?.current?.relative_humidity_2m ? `${weatherData.current.relative_humidity_2m}%` : '78%'}</span>
            </div>
          </div>
        </div>

        {/* Frosted Glass Cards Container */}
        <div className="space-y-4 mt-auto">
          {/* Card 1: Tropical Cyclone Alert (Matches Screenshot 4) */}
          <div className="bg-[#212b44]/75 border border-white/[0.08] backdrop-blur-xl rounded-[24px] p-4 sm:p-5 shadow-xl space-y-1">
            <h3 className="font-bold text-[15px] text-white tracking-wide">
              Tropical Cyclone Alert
            </h3>
            <p className="text-[13px] text-slate-300 leading-relaxed line-clamp-2">
              Tropical Cyclone Alert in effect until 6:14 PM PHT....
            </p>
          </div>

          {/* Card 2: Forecast (Today & Tomorrow) */}
          <div className="bg-[#212b44]/75 border border-white/[0.08] backdrop-blur-xl rounded-[24px] p-4 sm:p-5 shadow-xl space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-white/90">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
                <line x1="8" x2="8" y1="14" y2="14"/>
                <line x1="12" x2="12" y1="14" y2="14"/>
                <line x1="16" x2="16" y1="14" y2="14"/>
              </svg>
              <span className="font-bold text-[15px] text-white">Forecast</span>
            </div>

            {/* Daily Forecast List: Today, Tomorrow */}
            <div className="space-y-3.5 pt-1">
              {forecastList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[14px]">
                  {/* Day Name */}
                  <span className="w-24 text-white font-medium">
                    {item.day}
                  </span>

                  {/* Icon */}
                  <div className="w-8 flex items-center justify-center">
                    {item.icon === 'stormy' ? (
                      <div className="relative">
                        <Cloud size={19} className="text-slate-200 fill-slate-300/40" />
                        <span className="absolute -bottom-1 right-0 text-[10px] text-amber-400 font-bold">⚡</span>
                      </div>
                    ) : item.icon === 'sunny' ? (
                      <div className="relative">
                        <Cloud size={19} className="text-slate-200 fill-slate-300/40" />
                        <span className="absolute -top-1 -right-1 text-[10px] text-amber-400">☀️</span>
                      </div>
                    ) : item.icon === 'rainy' ? (
                      <div className="relative">
                        <Cloud size={19} className="text-slate-200 fill-slate-300/40" />
                        <span className="absolute -bottom-1 right-0 text-[10px] text-sky-400 font-bold">💧</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <Cloud size={19} className="text-slate-200 fill-slate-300/40" />
                        <span className="absolute -top-1 -right-1 text-[10px] text-amber-400">☀️</span>
                      </div>
                    )}
                  </div>

                  {/* Low Temp */}
                  <span className="w-9 text-right font-medium text-slate-300">
                    {item.low}°
                  </span>

                  {/* Temperature Range Gradient Bar */}
                  <div className="flex-1 mx-3 h-[5px] bg-slate-700/60 rounded-full relative overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-[#e76f51] to-[#e63946]"
                      style={{ left: '15%', width: '70%' }}
                    />
                  </div>

                  {/* High Temp */}
                  <span className="w-9 text-right font-medium text-white">
                    {item.high}°
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
