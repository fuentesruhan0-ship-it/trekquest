import { useNavigate } from 'react-router-dom';
import { Mountain, ArrowRight, ShieldCheck, WifiOff, Compass, MapPin } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#0D2818] text-white flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Ambient background glows matching TrekQuest dark forest-green palette */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-[#f05c48]/10 blur-3xl pointer-events-none" />

      {/* Top Bar with brand icon */}
      <div className="relative z-10 flex items-center justify-between pt-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-xl overflow-hidden">
            <img 
              src="/logo-source.jpg" 
              alt="TrekQuest" 
              className="w-full h-full object-contain p-1"
            />
          </div>
          <span className="font-extrabold text-lg tracking-wider text-white">TrekQuest</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
          <WifiOff size={12} />
          <span>Offline Ready</span>
        </div>
      </div>

      {/* Center Hero Card & Tagline */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto text-center space-y-6 py-8">
        {/* Visual Brand Crest */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/30 to-[#f05c48]/25 blur-xl animate-pulse" />
          <div className="relative w-28 h-28 rounded-full bg-white border-2 border-emerald-400/40 shadow-2xl flex items-center justify-center backdrop-blur-md overflow-hidden">
            <img 
              src="/logo-source.jpg" 
              alt="TrekQuest Logo" 
              className="w-full h-full object-contain p-2"
            />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-lg">
            TrekQuest
          </h1>
          <p className="text-sm sm:text-base text-emerald-200/90 font-medium max-w-xs mx-auto leading-relaxed">
            &ldquo;Your smart hiking companion, on or off the grid&rdquo;
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Compass size={18} className="mx-auto text-emerald-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-300 block">Topo &amp; Sat</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <MapPin size={18} className="mx-auto text-[#f05c48] mb-1" />
            <span className="text-[10px] font-bold text-slate-300 block">Plan Routes</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <ShieldCheck size={18} className="mx-auto text-teal-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-300 block">100% Offline</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Section: Get Started Button & Log in Link */}
      <div className="relative z-10 max-w-md w-full mx-auto space-y-3.5 pb-4">
        {/* Coral-red Accent Primary Button */}
        <button
          onClick={() => navigate('/login?mode=signup')}
          className="w-full py-4 rounded-2xl bg-[#f05c48] hover:bg-[#e44e39] active:scale-[0.98] text-white font-extrabold text-base shadow-xl shadow-[#f05c48]/30 flex items-center justify-center gap-2 transition cursor-pointer border border-white/20"
        >
          <span>Get started</span>
          <ArrowRight size={18} />
        </button>

        {/* Already have an account? Log in Link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-xs sm:text-sm text-emerald-200/90 hover:text-white transition font-semibold cursor-pointer py-1"
          >
            Already have an account? <span className="text-white font-bold underline underline-offset-4">Log in</span>
          </button>
        </div>
      </div>
    </div>
  );
}
