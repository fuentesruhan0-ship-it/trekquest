import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import { base44 } from '@/api/base44Client';
import { Backpack, Plus, Check, Trash2, Lightbulb, Calendar } from 'lucide-react';

const categories = {
  clothing: { label: 'Clothing & Footwear', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  shelter: { label: 'Shelter & Sleep', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  food: { label: 'Food & Hydration', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  safety: { label: 'Safety & Navigation', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  other: { label: 'Trail Essentials & Other', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

const tips = [
  'Pack layers, not heavy clothes — weather changes fast on the trail.',
  'Always carry more water than you think you need.',
  'Break in new boots before a long hike to avoid blisters.',
  'Keep emergency items accessible, not buried at the bottom of your pack.',
  'A headlamp with spare batteries beats a phone flashlight.',
];

const defaults = [
  { name: 'Trekking boots & extra wool socks', category: 'clothing' },
  { name: 'Moisture-wicking base layers & rain jacket', category: 'clothing' },
  { name: 'Lightweight trail tent or hammock with tarp', category: 'shelter' },
  { name: 'Sleeping bag & thermal sleeping pad', category: 'shelter' },
  { name: '3L Water bladder & purification tablets', category: 'food' },
  { name: 'High-calorie trail trail mix, energy bars & stove', category: 'food' },
  { name: 'Topographic map & magnetic compass', category: 'safety' },
  { name: 'Comprehensive mountain first-aid kit', category: 'safety' },
  { name: 'Headlamp with extra rechargeable batteries', category: 'other' },
  { name: 'Multi-tool knife & whistle', category: 'other' },
];

/**
 * Calculates tailored packing suggestions dynamically scaled by number of days.
 */
function getScaledSuggestions(daysCount) {
  const d = Math.max(1, parseInt(daysCount, 10) || 1);

  // Shirts:
  // 1 day: 2 pcs (1 trail, 1 spare)
  // 2 days: 3-4 pcs (2 trail, 1 sleep/camp, 1 spare)
  // 3 days: 4-5 pcs (3 trail, 1 sleep/camp, 1 emergency reserve)
  // d days: `${d + 1}-${d + 2} pcs`
  const shirtsQty = d === 1 ? '2 pcs' : `${d + 1}-${d + 2} pcs`;
  const underwearQty = `${d + 1} pcs`;
  const socksQty = `${d + 1} pairs`;
  const pantsQty = d === 1 ? '1-2 pcs' : `${Math.min(4, Math.ceil(d / 2) + 1)} pcs`;
  const mealsQty = d === 1 ? '2-3 meals (packed lunch & trail summit food)' : `${d * 3} meals (Breakfast, Lunch, Dinner)`;
  const snacksQty = `${d * 3}-${d * 4} packs`;

  const waterQty =
    d === 1
      ? '2L - 3L Water bladder'
      : d === 2
        ? '4L - 5L capacity (or 2.5L + water purification tablets)'
        : '5L - 6L capacity + water filter pump & tablets';

  const powerQty =
    d <= 1
      ? '10,000 mAh Power Bank'
      : d === 2
        ? '20,000 mAh Power Bank'
        : d <= 4
          ? '25,000 - 30,000 mAh Power Bank'
          : '30,000+ mAh Power Bank / Solar Charger';

  const fuelQty = d <= 2 ? '1 canister (230g isobutane/butane)' : `${Math.ceil(d / 2)} canisters (230g each)`;
  const batteryQty = d <= 1 ? '1 set extra AAA/rechargeable batteries' : `${Math.min(8, d * 2)} spare batteries`;
  const trashQty = `${Math.max(3, d * 2)} waterproof zip bags & trash liners (Leave No Trace)`;
  const wipesQty = d <= 2 ? '1 travel pack (30 sheets)' : `${Math.ceil(d / 2)} packs biodegradable wipes`;
  const firstAidQty = d <= 2 ? 'Compact blister & trail first aid kit' : 'Expedition first aid & blister prevention kit (moleskin & tape)';

  const list = [
    {
      name: `Dri-fit / Hiking Shirts (${shirtsQty})`,
      category: 'clothing',
      detail: `${shirtsQty} — 1 worn daily on trail + 1 dry sleepwear + 1 emergency spare`,
      qty: shirtsQty,
      tag: 'Clothing',
    },
    {
      name: `Moisture-wicking Underwear (${underwearQty})`,
      category: 'clothing',
      detail: `${underwearQty} — 1 fresh pair per day + 1 reserve to prevent chafing`,
      qty: underwearQty,
      tag: 'Clothing',
    },
    {
      name: `Trekking / Wool Socks (${socksQty})`,
      category: 'clothing',
      detail: `${socksQty} — dry feet prevent trail friction, blisters, and foot rot`,
      qty: socksQty,
      tag: 'Clothing',
    },
    {
      name: `Trekking Pants / Convertible Shorts (${pantsQty})`,
      category: 'clothing',
      detail: `${pantsQty} — quick-dry ripstop fabric for rough brush and river crossings`,
      qty: pantsQty,
      tag: 'Clothing',
    },
    {
      name: `Trail Meals & Rations (${mealsQty})`,
      category: 'food',
      detail: `${mealsQty} — dehydrated camp meals, ready-to-eat pouches, or easy-cook noodles`,
      qty: typeof mealsQty === 'string' && mealsQty.includes('(') ? mealsQty.split('(')[0].trim() : mealsQty,
      tag: 'Food',
    },
    {
      name: `High-Energy Trail Snacks (${snacksQty})`,
      category: 'food',
      detail: `${snacksQty} — energy bars, nuts, dried mangoes & electrolyte chews`,
      qty: snacksQty,
      tag: 'Food',
    },
    {
      name: `Hydration & Water Purification (${waterQty})`,
      category: 'food',
      detail: `${waterQty} — keep 0.5L - 1L intake per hour of steep mountain climbing`,
      qty: waterQty,
      tag: 'Hydration',
    },
    {
      name: `Power Bank & Charging Cables (${powerQty})`,
      category: 'other',
      detail: `${powerQty} — keeps offline GPS topo maps, emergency SOS, and phone powered`,
      qty: powerQty,
      tag: 'Electronics',
    },
    {
      name: `Camp Stove Fuel (${fuelQty})`,
      category: 'food',
      detail: `${fuelQty} — ensures enough gas for boiling drinking water and warm camp meals`,
      qty: fuelQty,
      tag: 'Cookware',
    },
    {
      name: `Spare Headlamp Batteries (${batteryQty})`,
      category: 'other',
      detail: `${batteryQty} — cold nighttime summit air drains battery capacity rapidly`,
      qty: batteryQty,
      tag: 'Safety',
    },
    {
      name: `Waterproof Bags & Trash Liners (${trashQty})`,
      category: 'other',
      detail: `${trashQty} — protects spare clothing and packs out all waste (Leave No Trace)`,
      qty: trashQty,
      tag: 'Essentials',
    },
    {
      name: `Biodegradable Wet Wipes & Toiletries (${wipesQty})`,
      category: 'other',
      detail: `${wipesQty} — camp hygiene, sanitation wipes, and unscented mountain soap`,
      qty: wipesQty,
      tag: 'Hygiene',
    },
    {
      name: `First Aid & Blister Prevention (${firstAidQty})`,
      category: 'safety',
      detail: `${firstAidQty} — moleskin, antiseptic, athletic tape, painkillers & personal medication`,
      qty: firstAidQty,
      tag: 'First Aid',
    },
  ];

  if (d > 1) {
    list.unshift({
      name: 'Multi-day Tent / Shelter & Thermal Sleep System',
      category: 'shelter',
      detail: 'Double-wall backpacking tent or tarp hammock + thermal sleeping bag & sleeping pad',
      qty: '1 set',
      tag: 'Shelter',
    });
  }

  return list;
}

export default function Backpacking() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('clothing');
  const [days, setDays] = useState(1);
  const [scaledChecked, setScaledChecked] = useState({});


  const parsedDays = Math.max(1, parseInt(days, 10) || 1);

  // Derived early so functions below can reference them safely
  const scaledSuggestions = useMemo(() => getScaledSuggestions(parsedDays), [parsedDays]);

  const scaledByCategory = useMemo(() => {
    if (parsedDays <= 1) return {};
    const bycat = {};
    scaledSuggestions.forEach((sug) => {
      const cat = sug.category;
      if (!bycat[cat]) bycat[cat] = [];
      bycat[cat].push(sug);
    });
    return bycat;
  }, [parsedDays, scaledSuggestions]);

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

  // Reset checked state whenever the day count changes
  useEffect(() => { setScaledChecked({}); }, [parsedDays]);

  const toggleScaled = (key) => setScaledChecked((prev) => ({ ...prev, [key]: !prev[key] }));

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

  const markAllPacked = async () => {
    const updated = items.map((i) => ({ ...i, packed: true }));
    setItems(updated);
    for (const item of items) {
      if (!item.packed) base44.entities.BackpackingItem.update(item.id, { packed: true }).catch(() => {});
    }
    setScaledChecked((prev) => {
      const next = { ...prev };
      scaledSuggestions.forEach((sug) => { next[`${parsedDays}-${sug.name}`] = true; });
      return next;
    });
  };

  const unmarkAll = async () => {
    const updated = items.map((i) => ({ ...i, packed: false }));
    setItems(updated);
    for (const item of items) {
      if (item.packed) base44.entities.BackpackingItem.update(item.id, { packed: false }).catch(() => {});
    }
    setScaledChecked({});
  };

  const remove = async (id) => {
    await base44.entities.BackpackingItem.delete(id);
    setItems((i) => i.filter((x) => x.id !== id));
  };

  const grouped = {};
  items.forEach((i) => {
    const c = categories[i.category] ? i.category : 'other';
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(i);
  });

  const allCategoryKeys = useMemo(() => {
    const keys = new Set([...Object.keys(grouped), ...Object.keys(scaledByCategory)]);
    return Object.keys(categories).filter((k) => keys.has(k));
  }, [grouped, scaledByCategory]);

  const packedCount = items.filter((i) => i.packed).length;
  const scaledPackedCount = parsedDays > 1
    ? scaledSuggestions.filter((sug) => !!scaledChecked[`${parsedDays}-${sug.name}`]).length
    : 0;
  const totalCount = parsedDays > 1 ? items.length + scaledSuggestions.length : items.length;
  const totalPacked = packedCount + scaledPackedCount;
  const progress = totalCount ? Math.round((totalPacked / totalCount) * 100) : 0;

  if (loading) return <div className="p-8 text-center text-muted-foreground text-sm">Loading checklist…</div>;



  return (
    <div className="min-h-full">
      <PageHeader title="Backpacking Guide" subtitle="Checklist & hiking tips" icon={Backpack} accent="bg-amber-600" />
      <div className="p-4 space-y-4">
        {/* Progress & Mark All as Packed Button */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="font-bold text-foreground">Packing Progress</span>
              <p className="text-xs text-muted-foreground">{totalPacked}/{totalCount} packed ({progress}%)</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={markAllPacked}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <Check size={14} />
                <span>Mark all as packed</span>
              </button>
              {totalPacked > 0 && (
                <button
                  onClick={unmarkAll}
                  className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-semibold transition active:scale-95 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* How many days? Calculator Field */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label htmlFor="how-many-days-field" className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar size={18} className="text-amber-600" />
                <span>How many days?</span>
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set trail duration to dynamically scale clothing, food rations, water & gear suggestions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDays((prev) => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center transition active:scale-90 cursor-pointer"
                aria-label="Decrease days"
              >
                -
              </button>
              <input
                id="how-many-days-field"
                name="how many days?"
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => {
                  const val = e.target.value;
                  setDays(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                }}
                placeholder="How many days?"
                className="w-24 px-3 py-2 text-center font-bold text-base rounded-xl bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setDays((prev) => (parseInt(prev, 10) || 1) + 1)}
                className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center transition active:scale-90 cursor-pointer"
                aria-label="Increase days"
              >
                +
              </button>
              <span className="text-xs font-semibold text-muted-foreground ml-1">
                {parsedDays === 1 ? 'day' : 'days'}
              </span>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">Quick Select:</span>
            {[1, 2, 3, 4, 5, 7].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setDays(num)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                  parsedDays === num
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {num === 1 ? '1 Day (Dayhike)' : num === 2 ? '2 Days (Overnight)' : `${num} Days`}
              </button>
            ))}
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
            <button onClick={addItem} className="bg-amber-600 text-white p-2 rounded-xl active:scale-90 transition cursor-pointer">
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

        {/* Items by category — real items + inline tailored suggestions when days > 1 */}
        {allCategoryKeys.map((cat) => {
          const c = categories[cat] || categories.other;
          const realItems = grouped[cat] || [];
          const sugItems = parsedDays > 1
            ? (scaledByCategory[cat] || []).filter(
                (sug) => !items.some((it) => it.name.trim().toLowerCase() === sug.name.trim().toLowerCase())
              )
            : [];

          return (
            <div key={cat}>
              <h3 className={`text-xs font-bold px-2 py-1 rounded-lg inline-block ${c.color}`}>{c.label}</h3>
              <div className="mt-2 space-y-1.5">
                {/* Real / already-added items */}
                {realItems.map((item) => (
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
                    <button onClick={() => remove(item.id)} className="p-1.5 text-red-400 hover:text-red-500 transition cursor-pointer">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {/* Tailored suggestion rows — solid checkboxes with qty badge, local checked state */}
                {sugItems.map((sug, idx) => {
                  const key = `${parsedDays}-${sug.name}`;
                  const isChecked = !!scaledChecked[key];
                  return (
                    <div key={`sug-${idx}`} className="flex items-center gap-3 bg-card border border-border rounded-xl p-2.5">
                      <button
                        onClick={() => toggleScaled(key)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-border'
                        }`}
                      >
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </button>
                      <span className={`flex-1 text-sm ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                        {sug.name}
                      </span>
                      {sug.qty && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                          {sug.qty}
                        </span>
                      )}
                    </div>
                  );
                })}

              </div>
            </div>
          );
        })}



        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-amber-600" />
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">Hiking Tips</h3>
          </div>
          <ul className="space-y-1.5">
            {tips.map((t, i) => (
              <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex gap-2">
                <span className="text-amber-500">•</span> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}