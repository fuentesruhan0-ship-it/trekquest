import { useState, useRef, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { base44 } from '@/api/base44Client';
import { Leaf, Camera, Loader2, AlertCircle, CheckCircle, XCircle, History, Trash2 } from 'lucide-react';

const safetyConfig = {
  edible: { label: 'Edible', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  medicinal: { label: 'Medicinal', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  safe: { label: 'Safe to touch', icon: CheckCircle, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
  poisonous: { label: 'Poisonous', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  unknown: { label: 'Unknown', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
};

export default function PlantScanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileRef = useRef(null);

  const loadHistory = async () => {
    try {
      const items = await base44.entities.PlantScan.list('-scanned_date', 20);
      setHistory(items);
    } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          "You are a botanist. Identify the plant in this image. Respond ONLY in JSON with fields: plant_name (common name), scientific_name, description (physical characteristics, 2-3 sentences), safety (one of: edible, medicinal, safe, poisonous, unknown), and care_note (short safety advice for a hiker).",
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            plant_name: { type: 'string' },
            scientific_name: { type: 'string' },
            description: { type: 'string' },
            safety: { type: 'string' },
            care_note: { type: 'string' },
          },
          required: ['plant_name', 'scientific_name', 'description', 'safety'],
        },
      });
      const scan = {
        plant_name: res.plant_name,
        scientific_name: res.scientific_name,
        description: res.description,
        safety: ['edible', 'medicinal', 'safe', 'poisonous', 'unknown'].includes(res.safety) ? res.safety : 'unknown',
        image_url: file_url,
        scanned_date: new Date().toISOString(),
      };
      await base44.entities.PlantScan.create(scan);
      setResult({ ...scan, care_note: res.care_note });
      loadHistory();
    } catch (e) {
      setError('Could not identify plant. Try another photo.');
    } finally {
      setLoading(false);
    }
  };

  const deleteScan = async (id) => {
    await base44.entities.PlantScan.delete(id);
    loadHistory();
  };

  const sc = result ? safetyConfig[result.safety] || safetyConfig.unknown : null;
  const ScIcon = sc?.icon;

  return (
    <div className="min-h-full">
      <PageHeader title="Plant Scanner" subtitle="Identify plants with your camera" icon={Leaf} accent="bg-green-600" />
      <div className="p-4 space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="w-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-3xl py-10 active:scale-95 transition disabled:opacity-60"
        >
          {loading ? <Loader2 size={40} className="animate-spin" /> : <Camera size={40} />}
          <span className="font-semibold">{loading ? 'Identifying…' : 'Scan a Plant'}</span>
          <span className="text-xs opacity-80">Take or upload a photo to identify</span>
        </button>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

        {result && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <img src={result.image_url} alt={result.plant_name} className="w-full h-48 object-cover" />
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-lg font-bold">{result.plant_name}</h3>
                <p className="text-xs text-muted-foreground italic">{result.scientific_name}</p>
              </div>
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${sc.bg}`}>
                <ScIcon size={18} className={sc.color} />
                <span className={`text-sm font-semibold ${sc.color}`}>{sc.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{result.description}</p>
              {result.care_note && (
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs font-semibold mb-1">Hiker's Note</p>
                  <p className="text-xs text-muted-foreground">{result.care_note}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <button onClick={() => setShowHistory((s) => !s)} className="flex items-center gap-2 text-sm font-semibold mb-2">
            <History size={16} /> Scan History ({history.length})
          </button>
          {showHistory && (
            <div className="space-y-2">
              {history.length === 0 && <p className="text-xs text-muted-foreground">No scans yet.</p>}
              {history.map((h) => {
                const hc = safetyConfig[h.safety] || safetyConfig.unknown;
                return (
                  <div key={h.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl p-2">
                    {h.image_url && <img src={h.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{h.plant_name}</p>
                      <p className={`text-xs font-medium ${hc.color}`}>{hc.label}</p>
                    </div>
                    <button onClick={() => deleteScan(h.id)} className="p-2 text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}