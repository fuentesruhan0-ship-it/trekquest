import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { Tent, ChevronDown, Search } from 'lucide-react';

const topics = [
  {
    title: 'Navigation Without a Map',
    icon: '🧭',
    steps: [
      'Use the sun: it rises in the east, sets in the west, and is due south at midday (Northern Hemisphere).',
      'Find the North Star (Polaris) at night — follow the two pointer stars of the Big Dipper.',
      'Moss tends to grow on the north side of trees in the Northern Hemisphere, but is not fully reliable.',
      'Follow water downstream — streams usually lead to larger rivers and human settlements.',
      'Mark your trail so you do not walk in circles, and travel in a straight line using a landmark.',
    ],
  },
  {
    title: 'Building a Shelter',
    icon: '🏕️',
    steps: [
      'Choose a flat, dry spot protected from wind and away from hazards like dead branches.',
      'Find a ridge pole and rest one end on a tree or rock, the other on the ground.',
      'Lean branches against both sides to form an A-frame rib structure.',
      'Pile leaves, ferns, and debris thickly over the frame for insulation.',
      'Add a layer of debris inside to insulate you from the cold ground.',
    ],
  },
  {
    title: 'Starting a Fire',
    icon: '🔥',
    steps: [
      'Gather dry tinder (birch bark, dry grass, pine needles), kindling, and fuel wood.',
      'Build a small teepee of kindling with tinder in the center.',
      'Use a spark, magnifying glass, or bow drill to ignite the tinder.',
      'Shield the flame from wind and add kindling gradually as it catches.',
      'Feed larger fuel wood once the fire is stable; keep it small to conserve wood.',
    ],
  },
  {
    title: 'Finding & Purifying Water',
    icon: '💧',
    steps: [
      'Look in valleys, low areas, and at the base of cliffs for seeps and streams.',
      'Collect rainwater with a tarp or broad leaves — it is the safest source.',
      'Boil water for at least 1 minute (3 at high altitude) to kill pathogens.',
      'Filter cloudy water through cloth before boiling or purifying.',
      'Use purification tablets or a filter if boiling is not possible.',
    ],
  },
  {
    title: 'Signaling for Help',
    icon: '🆘',
    steps: [
      'The universal distress signal is three of anything: three fires, three whistle blasts, three flashes.',
      'Build a signal fire with green branches to create white smoke during the day.',
      'Use a mirror or shiny object to flash sunlight toward searchers or aircraft.',
      'Lay out a large "X" or "SOS" in an open area using rocks or bright items.',
      'Stay in one place once you signal — moving makes you harder to find.',
    ],
  },
  {
    title: 'Foraging for Food',
    icon: '🌿',
    steps: [
      'Never eat a plant you cannot positively identify — use the Plant Scanner first.',
      'Avoid plants with milky sap, white berries, or a bitter almond smell.',
      'Insects like grasshoppers and grubs are a safe protein source when cooked.',
      'Bird eggs and fish are reliable food sources if you can catch them.',
      'Conserve energy — finding food is lower priority than water and shelter.',
    ],
  },
  {
    title: 'Treating Exposure',
    icon: '❄️',
    steps: [
      'Cold: add layers, get out of wind, insulate from the ground, drink warm fluids.',
      'Heat: rest in shade, wet your clothing, sip water slowly, avoid midday sun.',
      'Wet clothing can cause rapid heat loss — change into dry layers quickly.',
      'Cover head, hands, and feet — most heat is lost from extremities.',
      'Share body heat by huddling with companions in a shelter.',
    ],
  },
  {
    title: 'Crossing Water Safely',
    icon: '🏞️',
    steps: [
      'Never cross water deeper than your knees in fast current.',
      'Unfasten your pack so you can release it if you fall.',
      'Face upstream and side-step, using a walking stick for support.',
      'Cross at the widest, shallowest part of the stream.',
      'If swept away, keep feet up and float on your back to avoid foot entrapment.',
    ],
  },
];

export default function Survival() {
  const [open, setOpen] = useState(null);
  const [query, setQuery] = useState('');

  const filtered = topics.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-full">
      <PageHeader title="Survival Manual" subtitle="Offline wilderness guide" icon={Tent} accent="bg-orange-700" />
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search survival skills…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((t, i) => {
            const idx = topics.indexOf(t);
            const isOpen = open === idx;
            return (
              <div key={t.title} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full flex items-center gap-3 p-3 text-left active:bg-muted/50"
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="flex-1 font-semibold text-sm">{t.title}</span>
                  <ChevronDown size={18} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <ol className="px-4 pb-4 space-y-2">
                    {t.steps.map((s, si) => (
                      <li key={si} className="flex gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{si + 1}</span>
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