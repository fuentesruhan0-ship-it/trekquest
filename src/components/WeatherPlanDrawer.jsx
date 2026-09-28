import { useRef } from 'react';
import { ChevronUp, ChevronDown, ArrowUpRight, CloudSun, MapPin } from 'lucide-react';

export default function WeatherPlanDrawer({
  isOpen,
  onOpen,
  onClose,
  onOpenWeather,
  onOpenPlanRoute,
  temp = 24,
  condition = 'Partly cloudy',
  high = 31,
  low = 22,
  locationName = 'Current location',
}) {
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    // Swiped up by more than 40px
    if (!isOpen && diff > 40) {
      onOpen();
    }
    // Swiped down by more than 40px
    if (isOpen && diff < -40) {
      onClose();
    }
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="absolute bottom-4 inset-x-4 z-[1000] flex justify-center pointer-events-none select-none"
    >
      {!isOpen ? (
        /* ── Collapsed Pill (Matches Picture 2) ───────────────────────── */
        <button
          onClick={onOpen}
          className="pointer-events-auto bg-black/85 hover:bg-black/95 text-white rounded-full px-6 py-3.5 flex flex-col items-center gap-1.5 shadow-2xl border border-white/20 backdrop-blur-md active:scale-95 transition cursor-pointer max-w-sm w-full animate-in slide-in-from-bottom-2 duration-200"
        >
          {/* Grab handle bar */}
          <div className="w-12 h-1 bg-white/40 rounded-full" />
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
            <ChevronUp size={16} className="text-emerald-400 animate-bounce" />
            <span>Swipe up for Weather &amp; Plan a Route</span>
          </div>
        </button>
      ) : (
        /* ── Expanded Frosted Glass Bottom Sheet (Matches Picture 1) ──── */
        <div className="pointer-events-auto bg-black/60 backdrop-blur-2xl border border-white/15 rounded-[36px] p-5 shadow-2xl max-w-xl w-full text-white animate-in slide-in-from-bottom duration-300">
          {/* Header Handle: 'Swipe down to see the map' */}
          <button
            onClick={onClose}
            className="w-full flex flex-col items-center gap-1.5 pb-4 cursor-pointer text-white/80 hover:text-white transition group"
          >
            <div className="w-12 h-1 bg-white/40 group-hover:bg-white/70 rounded-full transition" />
            <div className="flex items-center gap-1 text-xs font-medium text-white/90">
              <ChevronDown size={15} className="group-hover:translate-y-0.5 transition" />
              <span>Swipe down to see the map</span>
            </div>
          </button>

          {/* Cards Grid: THE ONLY THING users see is the Weather and Plan Route */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Card 1: Weather Card (Matches Picture 1 Left Card) */}
            <div
              onClick={onOpenWeather}
              className="bg-black/60 hover:bg-black/75 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-[28px] p-4 sm:p-5 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition group shadow-lg min-h-[160px]"
            >
              <div>
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider block">
                  WEATHER
                </span>

                <div className="flex items-center gap-2.5 mt-2.5">
                  <div className="relative">
                    <CloudSun size={32} className="text-amber-400 fill-amber-400/20" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {temp}°C
                  </span>
                </div>

                <p className="text-[13px] font-semibold text-white/90 mt-1.5">
                  {condition}
                </p>
                <p className="text-[11px] text-white/60">
                  H {high}° · L {low}°
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-white/75 font-medium mt-3 pt-2 border-t border-white/[0.08]">
                <MapPin size={12} className="text-white/60 shrink-0" />
                <span className="truncate">{locationName}</span>
              </div>
            </div>

            {/* Card 2: Plan a Route Card (Matches Picture 1 Right Card) */}
            <div
              onClick={onOpenPlanRoute}
              className="bg-[#f05c48] hover:bg-[#ea523d] rounded-[28px] p-4 sm:p-5 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition group shadow-xl relative overflow-hidden text-white min-h-[160px]"
            >
              {/* Top row: NAVIGATE and top-right arrow */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                  NAVIGATE
                </span>
                <ArrowUpRight size={17} className="text-white/90 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>

              {/* Pin Icon in White Circle */}
              <div className="my-1.5">
                <div className="w-10 h-10 rounded-full bg-white text-[#f05c48] flex items-center justify-center shadow-md">
                  <MapPin size={20} className="fill-[#f05c48]" />
                </div>
              </div>

              {/* Title & subtitle */}
              <div>
                <h3 className="text-base sm:text-lg font-bold leading-tight text-white">
                  Plan a Route
                </h3>
                <p className="text-[11px] text-white/90 leading-snug mt-0.5 line-clamp-2">
                  Pick a destination &amp; get your hike time
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
