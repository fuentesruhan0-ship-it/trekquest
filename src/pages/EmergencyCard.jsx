import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { base44 } from '@/api/base44Client';
import { UserRound, Phone, Save, Droplet, Pill, AlertCircle, Heart } from 'lucide-react';

export default function EmergencyCard() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const empty = {
    full_name: '', blood_type: '', date_of_birth: '', allergies: '',
    medical_conditions: '', medications: '', emergency_contact_name: '',
    emergency_contact_phone: '', emergency_contact_relation: '', notes: '',
  };

  useEffect(() => {
    (async () => {
      try {
        const items = await base44.entities.EmergencyInfo.list();
        if (items.length) setInfo(items[0]);
        else setInfo(empty);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const set = (k, v) => { setInfo((i) => ({ ...i, [k]: v })); setSaved(false); };

  const save = async () => {
    if (!info.full_name.trim()) return;
    setSaving(true);
    try {
      if (info.id) await base44.entities.EmergencyInfo.update(info.id, info);
      else {
        const created = await base44.entities.EmergencyInfo.create(info);
        setInfo(created);
      }
      setSaved(true);
    } catch {} finally { setSaving(false); }
  };

  if (loading || !info) return (
    <div className="min-h-full">
      <PageHeader title="Emergency Info Card" subtitle="Your vital details" icon={UserRound} accent="bg-red-700" />
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading…</div>
    </div>
  );

  return (
    <div className="min-h-full">
      <PageHeader title="Emergency Info Card" subtitle="Your vital details" icon={UserRound} accent="bg-red-700" />
      <div className="p-4 space-y-4">
        {/* Emergency card preview */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 text-white rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="text-xs uppercase tracking-widest font-bold opacity-90">Emergency</span>
            </div>
            <Heart size={20} className="opacity-80" />
          </div>
          <p className="text-2xl font-bold mt-3">{info.full_name || 'Your Name'}</p>
          {info.blood_type && <p className="text-sm opacity-90">Blood type: {info.blood_type}</p>}
          {info.allergies && <p className="text-sm opacity-90 mt-1">⚠️ Allergies: {info.allergies}</p>}
          {info.emergency_contact_name && (
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs opacity-80">In case of emergency, contact:</p>
              <p className="font-semibold">{info.emergency_contact_name}</p>
              <p className="text-sm">{info.emergency_contact_phone}</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold">Personal Information</h3>
          <Field label="Full name" value={info.full_name} onChange={(v) => set('full_name', v)} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Blood type" value={info.blood_type} onChange={(v) => set('blood_type', v)} placeholder="O+" />
            <Field label="Date of birth" value={info.date_of_birth} onChange={(v) => set('date_of_birth', v)} type="date" />
          </div>
          <Field label="Allergies" value={info.allergies} onChange={(v) => set('allergies', v)} icon={Droplet} />
          <Field label="Medical conditions" value={info.medical_conditions} onChange={(v) => set('medical_conditions', v)} icon={Heart} />
          <Field label="Medications" value={info.medications} onChange={(v) => set('medications', v)} icon={Pill} />

          <h3 className="text-sm font-bold pt-2">Emergency Contact</h3>
          <Field label="Contact name" value={info.emergency_contact_name} onChange={(v) => set('emergency_contact_name', v)} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Phone" value={info.emergency_contact_phone} onChange={(v) => set('emergency_contact_phone', v)} icon={Phone} />
            <Field label="Relation" value={info.emergency_contact_relation} onChange={(v) => set('emergency_contact_relation', v)} placeholder="Spouse" />
          </div>
          <Field label="Additional notes" value={info.notes} onChange={(v) => set('notes', v)} />

          <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-red-700 text-white py-3 rounded-xl font-semibold active:scale-95 transition disabled:opacity-60">
            <Save size={18} /> {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Emergency Card'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', icon: Icon }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${Icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}