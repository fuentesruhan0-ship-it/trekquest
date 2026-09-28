import { useState, useEffect } from 'react';
import {
  ChevronLeft, Plus, Hexagon, Cloud,
  Search, MapPin, X
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

  // Reverse geocode to get local village/neighbourhood/town
  useEffect(() => {
    if (!coords) return;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords[0]}&lon=${coords[1]}&format=json&zoom=14&addressdetails=1`)
      .then(res => res.json())
      .then(d => {
        const a = d.address || {};
        const local = a.neighbourhood || a.suburb || a.village || a.quarter || a.town || a.city_district || a.city || 'Poblacion';
        setPlaceName(local);
      })
      .catch(() => setPlaceName('Poblacion'));
  }, [coords]);

  // Fetch live weather data from Open-Meteo
  useEffect(() => {
    if (!coords) return;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords[0]}&longitude=${coords[1]}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
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
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Weather values (defaulting to screenshot values if loading)
  const currentTemp = weatherData?.current?.temperature_2m ? Math.round(weatherData.current.temperature_2m) : 29;
  const highTemp = weatherData?.daily?.temperature_2m_max?.[0] ? Math.round(weatherData.daily.temperature_2m_max[0]) : 33;
  const lowTemp = weatherData?.daily?.temperature_2m_min?.[0] ? Math.round(weatherData.daily.temperature_2m_min[0]) : 22;

  // Forecast rows matching screenshot exactly: Yesterday, Today, Tomorrow
  const forecastList = [
    { day: 'Yesterday', icon: 'storm', low: 22, high: 33, barLeft: '15%', barWidth: '70%' },
    { day: 'Today', icon: 'storm', low: 22, high: 33, barLeft: '15%', barWidth: '70%' },
    { day: 'Tomorrow', icon: 'partly', low: 22, high: 32, barLeft: '15%', barWidth: '65%' },
  ];

  return (
    <div className="fixed inset-0 z-[3200] bg-[#141b2d] overflow-y-auto no-scrollbar flex flex-col text-white font-sans select-none animate-in fade-in duration-200">
      {/* Dynamic stormy frosted glass cloud background backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-20 w-96 h-96 bg-blue-900/30 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-indigo-950/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-slate-800/40 rounded-full blur-3xl" />
        {/* Soft moody cloud texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#131b2e]/90 via-[#18233c]/85 to-[#0f1524]/95 backdrop-blur-[2px]" />
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
            <button
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/90 transition cursor-pointer backdrop-blur-md"
              title="Weather Settings"
            >
              <Hexagon size={19} />
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
            Cloudy {highTemp}°/{lowTemp}°
          </p>

          {/* Air Quality Badge */}
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.12] border border-white/10 backdrop-blur-md">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
            <span className="text-xs font-semibold text-white/95">AQI 53</span>
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

          {/* Card 2: 5-Day Forecast (Matches Screenshot 4) */}
          <div className="bg-[#212b44]/75 border border-white/[0.08] backdrop-blur-xl rounded-[24px] p-4 sm:p-5 shadow-xl space-y-4">
            {/* Header: 5-day forecast & More details */}
            <div className="flex items-center justify-between">
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
                <span className="font-bold text-[15px] text-white">5-day forecast</span>
              </div>
              <button
                onClick={() => {}}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-0.5 font-medium transition"
              >
                <span>More details</span>
                <span className="text-[11px]">▸</span>
              </button>
            </div>

            {/* Daily Forecast List: Yesterday, Today, Tomorrow */}
            <div className="space-y-3.5 pt-1">
              {forecastList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[14px]">
                  {/* Day Name */}
                  <span className="w-24 text-white font-medium">
                    {item.day}
                  </span>

                  {/* Icon */}
                  <div className="w-8 flex items-center justify-center">
                    {item.icon === 'storm' ? (
                      <div className="relative">
                        <Cloud size={19} className="text-slate-200 fill-slate-300/40" />
                        <span className="absolute -bottom-1 right-0 text-[10px] text-amber-400 font-bold">⚡</span>
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
                      style={{ left: item.barLeft, width: item.barWidth }}
                    />
                    {/* Active point indicator */}
                    {item.day === 'Yesterday' && (
                      <div className="absolute top-1/2 -translate-y-1/2 left-[50%] w-2 h-2 rounded-full bg-white shadow-sm border border-orange-500" />
                    )}
                  </div>

                  {/* High Temp */}
                  <span className="w-9 text-right font-medium text-white">
                    {item.high}°
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom 5-day forecast Pill Button (Matches Screenshot 4) */}
            <div className="pt-2">
              <button
                onClick={() => {}}
                className="w-full py-3 rounded-2xl bg-[#2e3b5e]/80 hover:bg-[#37466f] active:scale-[0.99] text-white text-[13px] font-semibold transition text-center shadow-md cursor-pointer border border-white/[0.06]"
              >
                5-day forecast
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
