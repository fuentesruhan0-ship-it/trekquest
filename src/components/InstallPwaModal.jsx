import { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, Check, ShieldCheck, Sparkles } from 'lucide-react';

export default function InstallPwaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // 1. Check if already running inside standalone installed app
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standaloneMode);

    // 2. Detect iOS
    const iosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIos(iosDevice);

    // 3. Listen for Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__trekquest_pwa_prompt = e;

      // Auto-show banner once if never dismissed
      const dismissed = localStorage.getItem('trekquest_pwa_dismissed');
      if (!dismissed && !standaloneMode) {
        setIsOpen(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Custom event to trigger modal from Profile or Header buttons
    const handleOpenModal = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-install-pwa-modal', handleOpenModal);

    // 5. Track appinstalled
    const handleAppInstalled = () => {
      setInstalledSuccessfully(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-install-pwa-modal', handleOpenModal);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__trekquest_pwa_prompt;
    if (promptEvent) {
      promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccessfully(true);
        setTimeout(() => setIsOpen(false), 2500);
      }
      setDeferredPrompt(null);
      window.__trekquest_pwa_prompt = null;
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('trekquest_pwa_dismissed', 'true');
    setIsOpen(false);
  };

  // If already running inside standalone installed app, don't show
  if (isStandalone) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950/85 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-md w-full p-5 shadow-2xl relative overflow-hidden space-y-4 text-white">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-slate-300 hover:text-white active:scale-95 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* App Header Preview */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-xl border border-emerald-400/40 flex-shrink-0 bg-slate-900 p-1">
            <img src="/icon-192.png" alt="TrekQuest App Icon" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-base text-white leading-tight">Install TrekQuest</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Native App
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Philippine Trail Navigation & Offline GPS
            </p>
          </div>
        </div>

        {/* Value Highlights (Frosted Glass badges) */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 backdrop-blur-md">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={13} />
            </div>
            <span className="font-semibold text-slate-200 text-[11px]">Full Screen App</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 backdrop-blur-md">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={13} />
            </div>
            <span className="font-semibold text-slate-200 text-[11px]">Offline GPS Trails</span>
          </div>
        </div>

        {/* Content based on Platform */}
        {installedSuccessfully ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-center space-y-1 backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto mb-1 font-bold">
              <Check size={20} />
            </div>
            <p className="font-bold text-sm text-white">Installed Successfully!</p>
            <p className="text-xs text-emerald-200">
              TrekQuest is now on your phone home screen as a standalone application.
            </p>
          </div>
        ) : isIos ? (
          /* iOS Safari Guide */
          <div className="space-y-3 bg-white/5 p-3.5 rounded-2xl border border-white/10 text-xs backdrop-blur-md">
            <p className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Smartphone size={15} className="text-emerald-400" />
              <span>How to install on iPhone & iPad:</span>
            </p>
            <ol className="space-y-2 text-slate-300 font-medium text-[12px]">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="text-white">Share button</strong> (
                  <Share2 size={12} className="inline mx-0.5 text-emerald-400" />) in Safari's bottom bar.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> (
                  <PlusSquare size={12} className="inline mx-0.5 text-emerald-400" />).
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  Tap <strong className="text-white">"Add"</strong> at the top right. Done!
                </span>
              </li>
            </ol>
          </div>
        ) : (
          /* Android / Chrome One-Click Install */
          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Install TrekQuest directly from Chrome to your Android device for 1-tap app launch, zero browser URL bar, and 100% offline satellite trail navigation.
            </p>

            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt && !window.__trekquest_pwa_prompt}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer border border-white/20 disabled:opacity-60"
            >
              <Download size={18} />
              <span>Install to Android Home Screen</span>
            </button>

            {/* Android Chrome manual instructions if prompt wasn't triggered automatically yet */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-300 space-y-1 backdrop-blur-md">
              <p className="font-bold text-emerald-400 flex items-center gap-1">
                <span>📱 Android Chrome Instructions:</span>
              </p>
              <p className="text-slate-400 leading-relaxed">
                In Chrome, tap the <strong className="text-white">three dots menu (⋮)</strong> at the top right, then select <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Footer Dismiss */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-white/10">
          <button
            onClick={handleDismiss}
            className="hover:text-white font-medium py-1 transition cursor-pointer"
          >
            Maybe Later
          </button>
          <span className="text-[11px] text-slate-500">Android PWA • 0 App Store Needed</span>
        </div>
      </div>
    </div>
  );
}
