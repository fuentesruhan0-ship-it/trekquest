import { useState, useEffect, useRef } from 'react';
import {
  Download, CloudOff, CheckCircle2, Trash2, Mountain, Layers,
  Compass, AlertTriangle, RefreshCw, X, ShieldCheck, HardDrive,
  Eye, Zap, MapPin
} from 'lucide-react';
import {
  PRESET_OFFLINE_TRAILS,
  generateTileUrls,
  downloadTiles,
  getCachedTileStats,
  clearOfflineMapTiles,
  getSavedOfflineRegions,
  saveOfflineRegion,
  deleteOfflineRegion,
  getRouteCorridorBounds,
} from '@/lib/offlineMapManager';

export default function OfflineMapModal({
  isOpen,
  onClose,
  currentBounds,
  routePoints = [],
  destination = null,
  onJumpToBounds = () => {},
}) {
  const [activeTab, setActiveTab] = useState('download'); // 'download', 'presets', 'saved'
  const [downloadTarget, setDownloadTarget] = useState('current'); // 'current', 'route'
  const [selectedLayers, setSelectedLayers] = useState(['satellite', 'topo']);
  const [zoomDetail, setZoomDetail] = useState('standard'); // 'standard' (13-15), 'deep' (13-16)
  
  // Download progress state
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percent: 0, failed: 0 });
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [customName, setCustomName] = useState('');
  const abortControllerRef = useRef(null);

  // Cache stats & Saved regions
  const [cacheStats, setCacheStats] = useState({ count: 0, estimatedMb: 0 });
  const [savedRegions, setSavedRegions] = useState([]);
  const [presetStatus, setPresetStatus] = useState({}); // { [presetId]: 'idle' | 'downloading' | 'cached' }

  // Online / Offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshStats = async () => {
    const stats = await getCachedTileStats();
    setCacheStats(stats);
    setSavedRegions(getSavedOfflineRegions());
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
      if (destination || (routePoints && routePoints.length >= 2)) {
        setDownloadTarget('route');
        setCustomName(destination ? `Trail to ${destination.name}` : 'Planned Trail Route');
      } else {
        setDownloadTarget('current');
        setCustomName('Visible Trail Area');
      }
    }
  }, [isOpen, destination, routePoints]);

  if (!isOpen) return null;

  // Compute bounding box for download
  const computedBounds = downloadTarget === 'route' && routePoints.length > 0
    ? getRouteCorridorBounds(routePoints, 0.02)
    : currentBounds;

  const minZ = 13;
  const maxZ = zoomDetail === 'deep' ? 16 : 15;
  const calculatedUrls = computedBounds
    ? generateTileUrls(computedBounds, minZ, maxZ, selectedLayers)
    : [];
  const estimatedMb = ((calculatedUrls.length * 22) / 1024).toFixed(1);

  // Toggle selected map layer
  const toggleLayer = (layerKey) => {
    setSelectedLayers((prev) => {
      if (prev.includes(layerKey)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((l) => l !== layerKey);
      }
      return [...prev, layerKey];
    });
  };

  // Start Downloading Active Selection
  const handleStartDownload = async () => {
    if (!calculatedUrls.length || isDownloading) return;
    setIsDownloading(true);
    setDownloadSuccess(null);
    setProgress({ completed: 0, total: calculatedUrls.length, percent: 0, failed: 0 });

    abortControllerRef.current = new AbortController();

    try {
      const result = await downloadTiles(
        calculatedUrls,
        (p) => setProgress(p),
        abortControllerRef.current.signal
      );

      // Save region metadata
      const regName = customName.trim() || (downloadTarget === 'route' ? 'Trail Corridor' : 'Visible Trail Area');
      saveOfflineRegion({
        name: regName,
        tileCount: result.completed,
        estimatedMb: parseFloat(estimatedMb),
        bounds: computedBounds,
        zoomLevels: `${minZ}-${maxZ}`,
        layers: selectedLayers,
      });

      setDownloadSuccess(`🎉 ${result.completed} tiles saved! 100% ready for offline hiking.`);
      await refreshStats();
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Download error:', err);
      }
    } finally {
      setIsDownloading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Download a Preset Philippine Mountain Trail
  const handleDownloadPreset = async (preset) => {
    if (isDownloading) return;
    setPresetStatus((prev) => ({ ...prev, [preset.id]: 'downloading' }));
    const urls = generateTileUrls(preset.bounds, 13, 16, ['satellite', 'topo']);

    abortControllerRef.current = new AbortController();
    try {
      const result = await downloadTiles(
        urls,
        (p) => {
          setProgress(p);
        },
        abortControllerRef.current.signal
      );

      saveOfflineRegion({
        id: preset.id,
        name: preset.name,
        tileCount: result.completed,
        estimatedMb: parseFloat(((result.completed * 22) / 1024).toFixed(1)),
        bounds: preset.bounds,
        zoomLevels: '13-16',
        layers: ['satellite', 'topo'],
      });

      setPresetStatus((prev) => ({ ...prev, [preset.id]: 'cached' }));
      await refreshStats();
    } catch (err) {
      setPresetStatus((prev) => ({ ...prev, [preset.id]: 'idle' }));
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleDeleteRegion = (id) => {
    deleteOfflineRegion(id);
    refreshStats();
  };

  const handleClearAll = async () => {
    if (window.confirm('Delete all offline cached map tiles? You will need internet to download them again.')) {
      await clearOfflineMapTiles();
      await refreshStats();
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-slate-950 border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Offline Trail Maps</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isOnline ? 'Online Sync' : 'Offline Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hike safely with GPS and follow the route line without cellular signal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Storage Bar Indicator */}
        <div className="bg-slate-900/80 px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
            <HardDrive size={13} className="text-emerald-400" />
            <span>Cached Storage:</span>
            <span className="font-bold text-white">{cacheStats.estimatedMb} MB</span>
            <span className="text-slate-500">({cacheStats.count.toLocaleString()} tiles)</span>
          </div>
          {cacheStats.count > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={11} /> Clear All
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 p-1.5 bg-slate-900/50 border-b border-white/5 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'download'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download size={14} /> Download Area
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mountain size={14} /> Peak Packs
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === 'saved'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} /> Saved Maps
            {savedRegions.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] rounded-full bg-white/20 font-bold">
                {savedRegions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* ── TAB 1: DOWNLOAD ACTIVE AREA OR ROUTE ───────────────────────── */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              {/* Target Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Coverage Area
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setDownloadTarget('current');
                      setCustomName('Visible Trail Area');
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                      downloadTarget === 'current'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm'
                        : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Current View</span>
                      <Eye size={14} className={downloadTarget === 'current' ? 'text-emerald-400' : 'text-slate-500'} />
                    </div>
                    <span className="text-[10px] text-slate-400">Everything on your map right now</span>
                  </button>

                  <button
                    disabled={!routePoints || routePoints.length === 0}
                    onClick={() => {
                      setDownloadTarget('route');
                      setCustomName(destination ? `Trail to ${destination.name}` : 'Planned Trail Route');
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                      !routePoints || routePoints.length === 0
                        ? 'opacity-40 cursor-not-allowed border-white/5 bg-slate-900/50'
                        : downloadTarget === 'route'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm cursor-pointer'
                        : 'border-white/10 bg-slate-900 text-slate-400 hover:text-white cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Active Route Line</span>
                      <Compass size={14} className={downloadTarget === 'route' ? 'text-emerald-400' : 'text-slate-500'} />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {destination ? `Corridor to ${destination.name}` : 'Corridor along your line'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Name input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Region Label
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Mt. Pulag Camp 2 Corridor"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Layers to Include */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Map Layers to Pre-cache
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleLayer('satellite')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                      selectedLayers.includes('satellite')
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-white/10 bg-slate-900 text-slate-500'
                    }`}
                  >
                    <span>🛰️ Satellite View (Esri)</span>
                    {selectedLayers.includes('satellite') && <CheckCircle2 size={14} className="text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => toggleLayer('topo')}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition cursor-pointer ${
                      selectedLayers.includes('topo')
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                        : 'border-white/10 bg-slate-900 text-slate-500'
                    }`}
                  >
                    <span>⛰️ Topographic (Contours)</span>
                    {selectedLayers.includes('topo') && <CheckCircle2 size={14} className="text-emerald-400" />}
                  </button>
                </div>
              </div>

              {/* Detail Zoom Level */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Zoom Resolution
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => setZoomDetail('standard')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      zoomDetail === 'standard'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-white/10 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <p className="font-bold text-white">Standard Trail (Z13-15)</p>
                    <p className="text-[10px] text-slate-400">Fastest download • ~1-3 MB</p>
                  </button>

                  <button
                    onClick={() => setZoomDetail('deep')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      zoomDetail === 'deep'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-white/10 bg-slate-900 text-slate-400'
                    }`}
                  >
                    <p className="font-bold text-white">High Detail (Z13-16)</p>
                    <p className="text-[10px] text-slate-400">Crisp footpath zoom • ~3-8 MB</p>
                  </button>
                </div>
              </div>

              {/* Estimate Summary Box */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Estimated Tiles & Size</p>
                  <p className="text-[11px] text-slate-400">
                    {calculatedUrls.length} map tiles across {selectedLayers.length} layer{selectedLayers.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">~{estimatedMb} MB</span>
                  <p className="text-[10px] text-slate-400">Zero phone signal needed</p>
                </div>
              </div>

              {/* Download Progress Bar */}
              {isDownloading && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <RefreshCw size={13} className="animate-spin text-emerald-400" />
                      Downloading offline tiles…
                    </span>
                    <span className="font-mono text-white font-bold">{progress.percent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {progress.completed} of {progress.total} tiles
                    </span>
                    <button
                      onClick={handleCancelDownload}
                      className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {downloadSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>{downloadSuccess}</span>
                </div>
              )}

              {/* Main Download Button */}
              {!isDownloading && (
                <button
                  onClick={handleStartDownload}
                  disabled={!calculatedUrls.length}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs tracking-wide uppercase shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download size={16} /> Download Map for Offline Hike
                </button>
              )}
            </div>
          )}

          {/* ── TAB 2: POPULAR PHILIPPINE PEAK PACKS ───────────────────────── */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                1-tap offline packs for popular Philippine mountains with pre-cached satellite & contour maps:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_OFFLINE_TRAILS.map((preset) => {
                  const isCached = savedRegions.some((r) => r.id === preset.id || r.name.includes(preset.name));
                  const isPresetDownloading = presetStatus[preset.id] === 'downloading';

                  return (
                    <div
                      key={preset.id}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 hover:border-emerald-500/40 transition flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-white">{preset.name}</h4>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/5 text-emerald-400">
                            {preset.elevation}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{preset.region}</p>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{preset.desc}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-white/5">
                        <span className="text-[10px] text-slate-400 font-semibold">{preset.difficulty}</span>
                        {isCached ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Ready Offline
                          </span>
                        ) : (
                          <button
                            disabled={isDownloading || isPresetDownloading}
                            onClick={() => handleDownloadPreset(preset)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isPresetDownloading ? (
                              <>
                                <RefreshCw size={11} className="animate-spin" /> Caching…
                              </>
                            ) : (
                              <>
                                <Download size={11} /> Pre-cache (~3 MB)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB 3: SAVED OFFLINE REGIONS ──────────────────────────────── */}
          {activeTab === 'saved' && (
            <div className="space-y-3">
              {savedRegions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <CloudOff size={32} className="mx-auto text-slate-600" />
                  <p className="text-xs font-semibold">No offline maps saved yet</p>
                  <p className="text-[11px] text-slate-500">
                    Download your current area or pick from popular Philippine peaks so you never lose your route line in the wild.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedRegions.map((region) => (
                    <div
                      key={region.id}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Mountain size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{region.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {region.tileCount} tiles • ~{region.estimatedMb} MB • Zooms {region.zoomLevels}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {region.bounds && (
                          <button
                            onClick={() => {
                              onJumpToBounds(region.bounds);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[10px] font-semibold transition"
                            title="Jump to region on map"
                          >
                            View
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRegion(region.id)}
                          className="w-7 h-7 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition cursor-pointer"
                          title="Delete saved region"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Offline GPS Note */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Zap size={13} /> Offline Satellite GPS Guarantee
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Your phone's hardware GPS receiver connects directly to orbital satellites (GNSS/GLONASS) with 0 phone signal or cellular load needed. As long as your offline map tiles are downloaded, you will see your live dot following the trail line anywhere in the mountains.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
