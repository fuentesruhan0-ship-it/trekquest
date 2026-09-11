import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { base44 } from '@/api/base44Client';
import { Backpack, Plus, Check, Trash2, Lightbulb } from 'lucide-react';

const categories = {
  essential: { label: 'Essentials', color: 'bg-red-100 text-red-700' },
  navigation: { label: 'Navigation', color: 'bg-emerald-100 text-emerald-700' },
  clothing: { label: 'Clothing', color: 'bg-blue-100 text-blue-700' },
  safety: { label: 'Safety', color: 'bg-amber-100 text-amber-700' },
  food: { label: 'Food & Water', color: 'bg-orange-100 text-orange-700' },
  shelter: { label: 'Shelter', color: 'bg-purple-100 text-purple-700' },
  other: { label: 'Other', color: 'bg-slate-100 text-slate-700' },
};

const tips = [
  'Pack layers, not heavy clothes — weather changes fast on the trail.',
  'Always carry more water than you think you need.',
  'Break in new boots before a long hike to avoid blisters.',
  'Keep emergency items accessible, not buried at the bottom of your pack.',
  'A headlamp with spare batteries beats a phone flashlight.',
];

const defaults = [
  { name: 'Map & compass', category: 'navigation' },
  { name: 'Extra water', category: 'food' },
  { name: 'Extra food', category: 'food' },
  { name: 'First aid kit', category: 'safety' },
  { name: 'Rain jacket', category: 'clothing' },
  { name: 'Headlamp', category: 'essential' },
  { name: 'Sun protection', category: 'essential' },
  { name: 'Emergency shelter', category: 'shelter' },
];

export default function Backpacking() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('essential');

  const load = async () => {
    try {
      const data = await base44.entities.BackpackingItem.list();
      setItems(data);
      if (data.length === 0) {
        await base44.entities.BackpackingItem.bulkCreate(defaults);
        const seeded = await base44.entities.BackpackingItem.list();
        setItems(seeded);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const addItem = async () => {
    if (!newName.trim()) return;
    const created = await base44.entities.BackpackingItem.create({ name: newName.trim(), category: newCat, packed: false });
    setItems((i) => [...i, created]);
    setNewName('');
  };

  const toggle = async (item) => {
    await base44.entities.BackpackingItem.update(item.id, { packed: !item.packed });
    setItems((i) => i.map((x) => (x.id === item.id ? { ...x, packed: !x.packed } : x)));
  };

  const remove = async (id) => {
    await base44.entities.BackpackingItem.delete(id);
    setItems((i) => i.filter((x) => x.id !== id));
  };

  const packedCount = items.filter((i) => i.packed).length;
  const progress = items.length ? Math.round((packedCount / items.length) * 100) : 0;

  const grouped = {};
  items.forEach((i) => {
    if (!grouped[i.category]) grouped[i.category] = [];
    grouped[i.category].push(i);
  });

  return (
    <div className="min-h-full">
      <PageHeader title="Backpacking Guide" subtitle="Checklist & hiking tips" icon={Backpack} accent="bg-amber-600" />
      <div className="p-4 space-y-4">
        {/* Progress */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold">Packed</span>
            <span className="text-muted-foreground">{packedCount}/{items.length} ({progress}%)</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Add item */}
        <div className="bg-card border border-border rounded-2xl p-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="Add an item…"
              className="flex-1 px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button onClick={addItem} className="bg-amber-600 text-white p-2 rounded-xl active:scale-90 transition">
              <Plus size={18} />
            </button>
          </div>
          <select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-muted text-sm focus:outline-none"
          >
            {Object.entries(categories).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Items by category */}
        {Object.entries(grouped).map(([cat, list]) => {
          const c = categories[cat] || categories.other;
          return (
            <div key={cat}>
              <h3 className={`text-xs font-bold px-2 py-1 rounded-lg inline-block ${c.color}`}>{c.label}</h3>
              <div className="mt-2 space-y-1.5">
                {list.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-2.5">
                    <button
                      onClick={() => toggle(item)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                        item.packed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border'
                      }`}
                    >
                      {item.packed && <Check size={14} strokeWidth={3} />}
                    </button>
                    <span className={`flex-1 text-sm ${item.packed ? 'line-through text-muted-foreground' : ''}`}>{item.name}</span>
                    <button onClick={() => remove(item.id)} className="p-1.5 text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900">Hiking Tips</h3>
          </div>
          <ul className="space-y-1.5">
            {tips.map((t, i) => (
              <li key={i} className="text-xs text-amber-800 flex gap-2">
                <span className="text-amber-500">•</span> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}