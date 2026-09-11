import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/PageHeader';
import { base44 } from '@/api/base44Client';
import { BookOpen, Plus, Camera, Trash2, MapPin, X } from 'lucide-react';
import { Image } from '@/components/ui/image';

const moodConfig = {
  amazing: { label: 'Amazing', emoji: '🤩', color: 'bg-emerald-100' },
  good: { label: 'Good', emoji: '😊', color: 'bg-sky-100' },
  okay: { label: 'Okay', emoji: '😐', color: 'bg-amber-100' },
  tough: { label: 'Tough', emoji: '😣', color: 'bg-red-100' },
};

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', location: '', mood: 'good', notes: '' });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const data = await base44.entities.JournalEntry.list('-date', 50);
      setEntries(data);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const pickPhoto = (e) => {
    const f = e.target.files?.[0];
    if (f) setPhoto(f);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    let photo_url = null;
    if (photo) {
      try {
        const res = await base44.integrations.Core.UploadPublicFile({ file: photo });
        photo_url = res.file_url;
      } catch {}
    }
    await base44.entities.JournalEntry.create({
      title: form.title.trim(),
      location: form.location.trim(),
      mood: form.mood,
      notes: form.notes,
      date: new Date().toISOString().slice(0, 10),
      photo_url,
    });
    setForm({ title: '', location: '', mood: 'good', notes: '' });
    setPhoto(null);
    setShowForm(false);
    setSaving(false);
    load();
  };

  const remove = async (id) => {
    await base44.entities.JournalEntry.delete(id);
    load();
  };

  return (
    <div className="min-h-full">
      <PageHeader title="Travel Journal" subtitle="Save your hiking memories" icon={BookOpen} accent="bg-teal-600" />
      <div className="p-4 space-y-4">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition"
        >
          <Plus size={18} /> New Journal Entry
        </button>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Entry title" className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location / trail" className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mood</p>
              <div className="flex gap-2">
                {Object.entries(moodConfig).map(([k, v]) => (
                  <button key={k} onClick={() => setForm({ ...form, mood: k })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium ${form.mood === k ? 'bg-teal-600 text-white' : 'bg-muted'}`}>
                    {v.emoji}
                  </button>
                ))}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pickPhoto} />
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-muted py-2.5 rounded-xl text-sm font-medium active:scale-95 transition">
              <Camera size={16} /> {photo ? photo.name : 'Add photo'}
            </button>
            {photo && (
              <div className="relative">
                <img src={URL.createObjectURL(photo)} alt="preview" className="w-full h-40 object-cover rounded-xl" />
                <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"><X size={14} /></button>
              </div>
            )}
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What happened on the trail?" className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" rows={3} />
            <button onClick={save} disabled={saving} className="w-full bg-teal-700 text-white py-2.5 rounded-xl font-semibold active:scale-95 transition disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        )}

        <div>
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
            entries.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BookOpen size={40} className="mx-auto opacity-40" />
                <p className="text-sm mt-2">No journal entries yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((e) => {
                  const mc = moodConfig[e.mood] || moodConfig.good;
                  return (
                    <div key={e.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                      {e.photo_url && <Image src={e.photo_url} alt={e.title} className="w-full h-44 object-cover" fittingType="fill" />}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{e.title}</p>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <span>{mc.emoji}</span>
                              {e.location && <><span>•</span><span className="flex items-center gap-0.5"><MapPin size={10} />{e.location}</span></>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{e.date}</p>
                          </div>
                          <button onClick={() => remove(e.id)} className="p-1.5 text-red-400 shrink-0"><Trash2 size={15} /></button>
                        </div>
                        {e.notes && <p className="text-sm text-muted-foreground mt-2">{e.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}