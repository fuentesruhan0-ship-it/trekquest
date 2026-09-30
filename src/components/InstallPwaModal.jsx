import { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, Check, ShieldCheck, Sparkles } from 'lucide-react';

export default function InstallPwaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // 1. Check if already installed & running standalone
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
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-md w-full p-5 shadow-2xl relative overflow-hidden space-y-4">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-muted/80 text-muted-foreground hover:text-foreground active:scale-95 transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* App Header Preview */}
        <div className="flex items-center gap-3.5 pt-1">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-emerald-500/30 flex-shrink-0 bg-emerald-950 p-1">
            <img src="/icon-192.png" alt="TrekQuest App Icon" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-base text-foreground leading-tight">Install TrekQuest</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                App
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Philippine Trail Navigation & Offline GPS
            </p>
          </div>
        </div>

        {/* Value Highlights */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <Sparkles size={13} />
            </div>
            <span className="font-semibold text-foreground text-[11px]">Full Screen (No URL bar)</span>
          </div>
          <div className="p-2.5 rounded-xl bg-muted/50 border border-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={13} />
            </div>
            <span className="font-semibold text-foreground text-[11px]">Offline Mountain Maps</span>
          </div>
        </div>

        {/* Content based on Platform */}
        {installedSuccessfully ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-1">
              <Check size={20} />
            </div>
            <p className="font-bold text-sm text-emerald-800 dark:text-emerald-200">Installed Successfully!</p>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
              TrekQuest is now on your home screen.
            </p>
          </div>
        ) : isIos ? (
          /* iOS Safari Guide */
          <div className="space-y-3 bg-muted/60 p-3.5 rounded-2xl border border-border text-xs">
            <p className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <Smartphone size={15} className="text-emerald-600" />
              <span>How to install on iPhone & iPad:</span>
            </p>
            <ol className="space-y-2 text-muted-foreground font-medium text-[12px]">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="text-foreground">Share button</strong> (
                  <Share2 size={12} className="inline mx-0.5 text-primary" />) in Safari's bottom bar.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong> (
                  <PlusSquare size={12} className="inline mx-0.5 text-primary" />).
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  Tap <strong className="text-foreground">"Add"</strong> at the top right. Done!
                </span>
              </li>
            </ol>
          </div>
        ) : (
          /* Android / Chrome One-Click Install */
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Install TrekQuest directly to your phone for fast one-tap access, live GPS navigation, and offline trail data.
            </p>
            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt && !window.__trekquest_pwa_prompt}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
            >
              <Download size={18} />
              <span>Install to Home Screen</span>
            </button>
            {!deferredPrompt && !window.__trekquest_pwa_prompt && (
              <p className="text-[11px] text-center text-muted-foreground">
                Tip: In Chrome or your browser menu (⋮), tap <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.
              </p>
            )}
          </div>
        )}

        {/* Footer Dismiss */}
        <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
          <button
            onClick={handleDismiss}
            className="hover:text-foreground font-medium py-1 transition"
          >
            Maybe Later
          </button>
          <span className="text-[11px]">Free • No App Store Account Needed</span>
        </div>
      </div>
    </div>
  );
}
