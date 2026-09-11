import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { HeartPulse, ChevronDown, Search } from 'lucide-react';

const guides = [
  {
    title: 'Cuts & Bleeding',
    icon: '🩸',
    steps: [
      'Wash your hands or wear gloves before treating the wound.',
      'Apply direct, firm pressure with a clean cloth or gauze.',
      'Elevate the wounded area above heart level if possible.',
      'Clean the wound with clean water once bleeding slows.',
      'Apply antibiotic ointment and cover with a sterile bandage.',
      'Seek help if bleeding does not stop after 10 minutes of pressure.',
    ],
  },
  {
    title: 'Sprains & Strains',
    icon: '🦵',
    steps: [
      'Rest the injured area and stop activity immediately.',
      'Apply ice wrapped in cloth for 15–20 minutes every 2 hours.',
      'Compress with an elastic bandage, not too tight.',
      'Elevate the injured limb above heart level.',
      'Avoid putting weight on the injury.',
    ],
  },
  {
    title: 'Heat Exhaustion',
    icon: '🌡️',
    steps: [
      'Move the person to a cool, shaded area immediately.',
      'Loosen tight clothing and lay them down with legs elevated.',
      'Give cool water to sip slowly if conscious.',
      'Fan the person and apply cool, wet cloths to skin.',
      'Monitor for confusion or fainting — heatstroke is an emergency.',
    ],
  },
  {
    title: 'Hypothermia',
    icon: '🥶',
    steps: [
      'Move to shelter and out of wind and wet clothing.',
      'Replace wet clothes with dry, warm layers.',
      'Insulate from the ground using a sleeping pad or pack.',
      'Offer warm, sweet drinks if the person is conscious.',
      'Use body heat or warm packs to the neck, armpits, and groin.',
    ],
  },
  {
    title: 'Insect Stings',
    icon: '🐝',
    steps: [
      'Move away from the area to avoid more stings.',
      'Scrape the stinger out with a card edge — do not pinch.',
      'Wash the area with soap and water.',
      'Apply a cold compress to reduce swelling.',
      'Watch for allergic reaction: swelling, difficulty breathing.',
    ],
  },
  {
    title: 'Snake Bite',
    icon: '🐍',
    steps: [
      'Move away from the snake and stay calm to slow venom spread.',
      'Keep the bitten limb still and below heart level.',
      'Remove rings, watches, and tight clothing near the bite.',
      'Do NOT cut the wound, suck venom, or apply a tourniquet.',
      'Get to medical help as quickly and calmly as possible.',
    ],
  },
  {
    title: 'Fractures',
    icon: '🦴',
    steps: [
      'Do not move the suspected broken bone.',
      'Immobilize the area with a splint using sticks and bandages.',
      'Apply cold packs to reduce swelling, not directly on skin.',
      'Treat for shock: keep the person warm and lying down.',
      'Seek emergency help; do not try to realign the bone.',
    ],
  },
  {
    title: 'Burns',
    icon: '🔥',
    steps: [
      'Cool the burn with clean, cool water for 10–20 minutes.',
      'Remove jewelry or tight items before swelling starts.',
      'Cover loosely with a clean, non-stick dressing.',
      'Do not apply ice, butter, or ointments to severe burns.',
      'Seek medical help for burns larger than your palm.',
    ],
  },
];

export default function FirstAid() {
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState('');

  const filtered = guides.filter((g) => g.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-full">
      <PageHeader title="First Aid Guide" subtitle="Essential emergency procedures" icon={HeartPulse} accent="bg-red-600" />
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search first aid…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2">
          <HeartPulse size={18} className="text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">In a life-threatening emergency, get to safety and call for help first.</p>
        </div>

        <div className="space-y-2">
          {filtered.map((g, i) => {
            const idx = guides.indexOf(g);
            const isOpen = open === idx;
            return (
              <div key={g.title} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full flex items-center gap-3 p-3 text-left active:bg-muted/50"
                >
                  <span className="text-2xl">{g.icon}</span>
                  <span className="flex-1 font-semibold text-sm">{g.title}</span>
                  <ChevronDown size={18} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <ol className="px-4 pb-4 space-y-2">
                    {g.steps.map((s, si) => (
                      <li key={si} className="flex gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
                        <span className="text-muted-foreground">{s}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}