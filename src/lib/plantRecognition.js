/**
 * plantRecognition.js
 * ---------------------------------------------------------------------------
 * Two-tier plant identification:
 *
 *  TIER 1 — Online: Plant.id API
 *    - Real species-trained ML model
 *    - Returns accurate species names matched to our local plantDictionary
 *    - Requires VITE_PLANT_ID_API_KEY in .env.local
 *
 *  TIER 2 — Offline: TensorFlow.js MobileNet v2 + HSV pixel analysis
 *    - MobileNet loaded once from CDN, then cached by the browser (offline-ready)
 *    - Extracts ImageNet class signals and blends with pixel color analysis
 *    - Less accurate than the API but works with zero connectivity
 *    - Confidence capped at 75% so the hiker knows it's an estimate
 */

// ─── Plant.id API config ──────────────────────────────────────────────────────
const PLANT_ID_API_KEY = import.meta.env.VITE_PLANT_ID_API_KEY || '';
const PLANT_ID_URL = 'https://api.plant.id/v3/identification?details=common_names,url,description,taxonomy';

// ─── Non-plant rejection labels (strict non-plant subjects only) ──────────────
const NON_PLANT_LABELS = [
  'person', 'people', 'man', 'woman', 'boy', 'girl', 'child', 'face',
  'head', 'hair', 'hand', 'finger', 'eye', 'nose', 'mouth', 'ear',
  'selfie', 'portrait', 'human', 'groom', 'bride',
  'suit', 'jersey', 'sweatshirt', 't-shirt', 'shirt', 'jean', 'jeans',
  'jacket', 'coat', 'dress', 'gown', 'skirt', 'sweater', 'hoodie',
  'mask', 'necklace', 'tie', 'hat', 'cap', 'helmet',
  'dog', 'cat', 'bird', 'horse', 'cow', 'pig', 'sheep',
  'monkey', 'bear', 'lion', 'tiger', 'elephant', 'rabbit',
  'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'airplane', 'boat',
  'phone', 'laptop', 'computer keyboard', 'screen', 'monitor',
];

const PLANT_LABELS = [
  'leaf', 'plant', 'flower', 'tree', 'fern', 'grass', 'herb', 'shrub',
  'moss', 'vine', 'palm', 'bamboo', 'berry', 'fruit', 'blossom',
  'petal', 'foliage', 'jungle', 'forest', 'botanic', 'green',
  'pot, flowerpot', 'pot', 'flowerpot', 'vase', 'greenhouse',
  'daisy', 'sunflower', 'rose', 'tulip', 'cactus', 'succulent',
  'mushroom', 'fungus', 'lichen', 'fig', 'strawberry', 'raspberry',
  'pineapple', 'banana', 'orange', 'lemon', 'citrus', 'pepper', 'bell pepper',
  'cucumber', 'zucchini', 'cabbage', 'broccoli', 'artichoke', 'corn',
  'acorn', 'conifer', 'pine', 'spider plant', 'croton', 'dieffenbachia',
  'pothos', 'houseplant',
];

// ─── ImageNet class → plant feature signals (for offline MobileNet path) ──────
const LABEL_TO_SIGNAL = {
  strawberry: { red_berry: 0.9 },
  raspberry: { red_berry: 0.85 },
  dandelion: { yellow_flower: 0.95 },
  sunflower: { yellow_flower: 0.8 },
  fern: { feathery_green: 0.9 },
  'bracken, brake, pasture brake': { feathery_green: 0.85 },
  banana: { broad_green: 0.65 },
  'pitcher plant': { red_green: 0.9 },
  bamboo: { light_green: 0.9, tree: 0.8 },
  pine: { dark_green: 0.85, conifer: 0.9, tree: 0.8 },
  conifer: { dark_green: 0.9, conifer: 0.95, tree: 0.8 },
  'pot, flowerpot': { houseplant: 0.8, broad_green: 0.6 },
  vase: { flower: 0.7 },
  daisy: { yellow_flower: 0.8, flower: 0.95 },
  'bell pepper': { green_fruit: 0.7, fruit: 0.85 },
  lichen: { moss_green: 0.8 },
  'coral fungus': { red_green: 0.5 },
  mushroom: { broad_green: 0.3 },
  'hip, rose hip': { red_berry: 0.7 },
  artichoke: { broad_green: 0.55 },
  broccoli: { broad_green: 0.5 },
  spinach: { broad_green: 0.6 },
  fig: { green_fruit: 0.6 },
};

// ─── Offline feature map for each plant species ───────────────────────────────
export const PLANT_FEATURE_MAP = {
  pitcher_plant:      { organ: 'leaf',   red: 0.6, green: 0.6,        edge: 'medium' },
  benguet_pine:       { organ: 'tree',   dark_green: 0.9, conifer: 0.9, edge: 'high' },
  makahiya:           { organ: 'herb',   green: 0.6, pink: 0.7,        edge: 'medium' },
  lantana:            { organ: 'flower', yellow: 0.7, red: 0.5,        edge: 'medium' },
  wild_blackberry:    { organ: 'fruit',  red: 0.9, green: 0.5,         edge: 'medium' },
  stinging_nettle:    { organ: 'leaf',   green: 0.8,                   edge: 'medium' },
  tree_fern:          { organ: 'fern',   green: 0.85, fern: 0.9,       edge: 'high'   },
  pako_fern:          { organ: 'fern',   green: 0.85, fern: 0.9,       edge: 'high'   },
  dandelion:          { organ: 'flower', yellow: 0.95, green: 0.4,     edge: 'medium' },
  elephant_ear:       { organ: 'leaf',   broad_green: 0.95,            edge: 'low'    },
  rattan_palm:        { organ: 'tree',   dark_green: 0.7,              edge: 'high'   },
  wild_guava:         { organ: 'fruit',  green: 0.6,                   edge: 'low'    },
  wild_bamboo:        { organ: 'tree',   light_green: 0.9, tree: 0.8,  edge: 'medium' },
  angel_trumpet:      { organ: 'flower', white: 0.85,                  edge: 'low'    },
  castor_bean:        { organ: 'fruit',  red: 0.5, green: 0.6,         edge: 'medium' },
  gotu_kola:          { organ: 'leaf',   broad_green: 0.8,             edge: 'low'    },
  wild_mint:          { organ: 'leaf',   green: 0.8,                   edge: 'medium' },
  cloud_moss:         { organ: 'moss',   dark_green: 0.5,              edge: 'low'    },
  physic_nut:         { organ: 'fruit',  broad_green: 0.5,             edge: 'low'    },
  broadleaf_plantain: { organ: 'leaf',   broad_green: 0.85,            edge: 'low'    },
  sambong:            { organ: 'leaf',   green: 0.8,                   edge: 'medium' },
  lagundi:            { organ: 'leaf',   green: 0.75, purple: 0.5,     edge: 'medium' },
  wild_ginger:        { organ: 'flower', red: 0.8, green: 0.5,         edge: 'medium' },
  wild_strawberry:    { organ: 'fruit',  red: 0.9, green: 0.5,         edge: 'medium' },
  aloe_vera:          { organ: 'leaf',   broad_green: 0.85,            edge: 'low'    },
  sansevieria:        { organ: 'leaf',   dark_green: 0.85, yellow: 0.4, edge: 'medium' },
  pothos:             { organ: 'leaf',   light_green: 0.85, yellow: 0.4, edge: 'low'  },
  monstera:           { organ: 'leaf',   broad_green: 0.95,            edge: 'low'    },
  hibiscus:           { organ: 'flower', red: 0.9,                     edge: 'medium' },
  bougainvillea:      { organ: 'flower', pink: 0.9, purple: 0.7,       edge: 'medium' },
  orchid:             { organ: 'flower', pink: 0.8, purple: 0.6,       edge: 'medium' },
  bird_nest_fern:     { organ: 'fern',   green: 0.9, fern: 0.9,        edge: 'low'    },
  peace_lily:         { organ: 'flower', white: 0.85, dark_green: 0.7, edge: 'low'    },
  rose:               { organ: 'flower', red: 0.85, pink: 0.7,         edge: 'medium' },
  oregano:            { organ: 'leaf',   green: 0.8,                   edge: 'medium' },
  chili_pepper:       { organ: 'fruit',  red: 0.9,                     edge: 'medium' },
};

// ─── Species aliases: Plant.id names → our dictionary IDs ────────────────────
const SPECIES_ALIASES = {
  'nepenthes': 'pitcher_plant',
  'pitcher plant': 'pitcher_plant',
  'pinus kesiya': 'benguet_pine',
  'benguet pine': 'benguet_pine',
  'saleng': 'benguet_pine',
  'mimosa pudica': 'makahiya',
  'makahiya': 'makahiya',
  'sensitive plant': 'makahiya',
  'touch-me-not': 'makahiya',
  'lantana camara': 'lantana',
  'lantana': 'lantana',
  'kantutay': 'lantana',
  'rubus': 'wild_blackberry',
  'sampinit': 'wild_blackberry',
  'raspberry': 'wild_blackberry',
  'blackberry': 'wild_blackberry',
  'bramble': 'wild_blackberry',
  'laportea': 'stinging_nettle',
  'dendrocnide': 'stinging_nettle',
  'stinging nettle': 'stinging_nettle',
  'lipa': 'stinging_nettle',
  'cyathea': 'tree_fern',
  'tree fern': 'tree_fern',
  'alopay': 'tree_fern',
  'diplazium': 'pako_fern',
  'pako': 'pako_fern',
  'vegetable fern': 'pako_fern',
  'taraxacum': 'dandelion',
  'dandelion': 'dandelion',
  'alocasia': 'elephant_ear',
  'elephant ear': 'elephant_ear',
  'bigaa': 'elephant_ear',
  'colocasia': 'elephant_ear',
  'taro': 'elephant_ear',
  'calamus': 'rattan_palm',
  'rattan': 'rattan_palm',
  'yantok': 'rattan_palm',
  'psidium': 'wild_guava',
  'guava': 'wild_guava',
  'bayabas': 'wild_guava',
  'schizostachyum': 'wild_bamboo',
  'phyllostachys': 'wild_bamboo',
  'bamboo': 'wild_bamboo',
  'buho': 'wild_bamboo',
  'brugmansia': 'angel_trumpet',
  'angel trumpet': 'angel_trumpet',
  'talumpunay': 'angel_trumpet',
  'datura': 'angel_trumpet',
  'ricinus': 'castor_bean',
  'castor': 'castor_bean',
  'tangan-tangan': 'castor_bean',
  'centella': 'gotu_kola',
  'gotu kola': 'gotu_kola',
  'takip-kuhol': 'gotu_kola',
  'pennywort': 'gotu_kola',
  'mentha': 'wild_mint',
  'mint': 'wild_mint',
  'yerba buena': 'wild_mint',
  'blumea': 'sambong',
  'sambong': 'sambong',
  'vitex': 'lagundi',
  'lagundi': 'lagundi',
  'zingiber': 'wild_ginger',
  'shampoo ginger': 'wild_ginger',
  'zerumbet': 'wild_ginger',
  'fragaria': 'wild_strawberry',
  'wild strawberry': 'wild_strawberry',
  'strawberry': 'wild_strawberry',
  'aloe': 'aloe_vera',
  'aloe vera': 'aloe_vera',
  'sansevieria': 'sansevieria',
  'snake plant': 'sansevieria',
  'dracaena trifasciata': 'sansevieria',
  'pothos': 'pothos',
  'epipremnum': 'pothos',
  'golden pothos': 'pothos',
  'monstera': 'monstera',
  'swiss cheese plant': 'monstera',
  'hibiscus': 'hibiscus',
  'gumamela': 'hibiscus',
  'bougainvillea': 'bougainvillea',
  'paper flower': 'bougainvillea',
  'orchid': 'orchid',
  'orchidaceae': 'orchid',
  'asplenium': 'bird_nest_fern',
  'bird nest fern': 'bird_nest_fern',
  "bird's nest fern": 'bird_nest_fern',
  'spathiphyllum': 'peace_lily',
  'peace lily': 'peace_lily',
  'rosa ': 'rose',
  ' rose': 'rose',
  'plantago': 'broadleaf_plantain',
  'broadleaf plantain': 'broadleaf_plantain',
  'origanum': 'oregano',
  'oregano': 'oregano',
  'capsicum': 'chili_pepper',
  'chili': 'chili_pepper',
  'pepper': 'chili_pepper',
};

// ─── TensorFlow.js / MobileNet singleton (offline tier) ──────────────────────
let _tfModelPromise = null;

async function loadMobileNet() {
  if (_tfModelPromise) return _tfModelPromise;
  _tfModelPromise = (async () => {
    try {
      const mobilenet = await import('@tensorflow-models/mobilenet');
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      const model = await mobilenet.load({ version: 2, alpha: 1.0 });
      console.log('[PlantRecognition] MobileNet v2 loaded (offline tier) ✓');
      return model;
    } catch (err) {
      console.warn('[PlantRecognition] MobileNet load failed:', err);
      _tfModelPromise = null;
      return null;
    }
  })();
  return _tfModelPromise;
}

// Pre-warm model so it's ready when the user opens the scanner
loadMobileNet();

// ─── Extract feature signals from MobileNet classifications ──────────────────
function classesToSignals(classifications) {
  const signals = {};
  for (const { className, probability } of classifications) {
    const lower = className.toLowerCase();
    for (const [keyword, channelMap] of Object.entries(LABEL_TO_SIGNAL)) {
      if (lower.includes(keyword)) {
        for (const [channel, weight] of Object.entries(channelMap)) {
          signals[channel] = Math.min(1, (signals[channel] || 0) + probability * weight);
        }
      }
    }
    for (const pl of PLANT_LABELS) {
      if (lower.includes(pl)) {
        signals.broad_green = Math.min(1, (signals.broad_green || 0) + probability * 0.3);
        signals.green_leaf  = Math.min(1, (signals.green_leaf  || 0) + probability * 0.25);
        break;
      }
    }
  }
  return signals;
}

// ─── RGB to HSV ───────────────────────────────────────────────────────────────
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, v };
}

// ─── HSV pixel color signal extraction ───────────────────────────────────────
function extractPixelSignals(canvas, ctx) {
  const w = canvas.width;
  const h = canvas.height;
  const sampleSize = Math.min(220, Math.floor(Math.min(w, h) * 0.8));
  const startX = Math.max(0, Math.floor((w - sampleSize) / 2));
  const startY = Math.max(0, Math.floor((h - sampleSize) / 2));
  const imgData = ctx.getImageData(startX, startY, sampleSize, sampleSize);
  const data = imgData.data;
  const totalPixels = data.length / 4;

  let redCount = 0, yellowCount = 0, greenCount = 0;
  let darkGreenCount = 0, lightGreenCount = 0;
  let pinkCount = 0, purpleCount = 0, whiteCount = 0;
  let edgeEnergy = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const { h: hue, s, v } = rgbToHsv(r, g, b);

    if ((hue >= 340 || hue <= 18) && s > 0.32 && v > 0.20) redCount++;
    else if (hue >= 38 && hue <= 68 && s > 0.30 && v > 0.30) yellowCount++;
    else if (hue > 295 && hue < 340 && s > 0.22 && v > 0.25) pinkCount++;
    else if (hue > 250 && hue <= 295 && s > 0.22 && v > 0.25) purpleCount++;
    else if (hue > 68 && hue < 165 && s > 0.18 && v > 0.14) {
      greenCount++;
      if (v < 0.38) darkGreenCount++;
      else if (hue < 105 && v > 0.45) lightGreenCount++;
    }
    else if (s < 0.18 && v > 0.68) whiteCount++;

    if (i > 4) {
      const prevLum = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
      const currLum = (r + g + b) / 3;
      edgeEnergy += Math.abs(currLum - prevLum);
    }
  }

  const avgEdge = edgeEnergy / totalPixels;
  return {
    red:         Math.min(1, (redCount / totalPixels) * 4),
    yellow:      Math.min(1, (yellowCount / totalPixels) * 4),
    pink:        Math.min(1, (pinkCount / totalPixels) * 4),
    purple:      Math.min(1, (purpleCount / totalPixels) * 4),
    white:       Math.min(1, (whiteCount / totalPixels) * 3),
    broad_green: Math.min(1, (greenCount / totalPixels) * 2.2),
    dark_green:  Math.min(1, (darkGreenCount / totalPixels) * 3),
    light_green: Math.min(1, (lightGreenCount / totalPixels) * 3),
    green_fruit: Math.min(1, (greenCount / totalPixels) * 1.8),
    avgEdge,
    edge_level:  avgEdge > 22 ? 'high' : avgEdge > 13 ? 'medium' : 'low',
  };
}

// ─── Non-plant detection ──────────────────────────────────────────────────────
function detectIsPlant(classifications, pixelSignals) {
  const greenRatio = (pixelSignals.broad_green || 0) + (pixelSignals.green_leaf || 0);
  const colorSignal = greenRatio
    + (pixelSignals.red || 0)
    + (pixelSignals.yellow || 0)
    + (pixelSignals.pink || 0)
    + (pixelSignals.white || 0);

  if (classifications && classifications.length > 0) {
    const top3 = classifications.slice(0, 3);
    const top5 = classifications.slice(0, 5);

    const plantMatch = top5.find(({ className, probability }) =>
      PLANT_LABELS.some((pl) => className.toLowerCase().includes(pl)) && probability > 0.02
    );
    const nonPlantMatch = top3.find(({ className, probability }) =>
      NON_PLANT_LABELS.some((label) => className.toLowerCase().includes(label)) && probability > 0.45
    );

    // Reject ONLY if a genuine non-plant subject (person, vehicle, screen) is identified with high probability AND there is no plant match
    if (nonPlantMatch && !plantMatch && colorSignal < 0.05) {
      return {
        isPlant: false,
        reason: `Detected "${nonPlantMatch.className}" (${(nonPlantMatch.probability * 100).toFixed(0)}%) — not a plant. Point the camera directly at a plant.`,
      };
    }
    if (plantMatch) return { isPlant: true, reason: null };
    if (colorSignal < 0.04) {
      return {
        isPlant: false,
        reason: `No plant or foliage detected. Please point the camera directly at a plant in good lighting.`,
      };
    }
    return { isPlant: true, reason: null };
  }

  // No classifications available — rely on pixel signals only
  if (colorSignal < 0.04) {
    return {
      isPlant: false,
      reason: 'No plant or foliage features detected. Try moving closer or adjusting the angle.',
    };
  }
  return { isPlant: true, reason: null };
}

// ─── Offline species scoring ──────────────────────────────────────────────────
function scoreOffline(plantDictionary, combinedSignals, organFilter = 'all') {
  return plantDictionary.map((plant) => {
    let f = PLANT_FEATURE_MAP[plant.id];
    if (!f) {
      const col = plant.color_category || '';
      const isFruit = plant.safety === 'edible' && (col.includes('fruit') || col.includes('berry') || col.includes('pod'));
      const isFlower = col.includes('flower');
      const isFern = (plant.leaf_pattern || '').includes('frond') || (plant.leaf_pattern || '').includes('fern') || plant.id.includes('fern');
      f = {
        organ: isFruit ? 'fruit' : isFlower ? 'flower' : isFern ? 'fern' : 'leaf',
        edge: 'medium',
      };
      if (col.includes('red')) f.red = 0.8;
      if (col.includes('yellow')) f.yellow = 0.8;
      if (col.includes('green') || col.includes('broad_green')) f.broad_green = 0.75;
      if (col.includes('dark_green')) f.dark_green = 0.8;
      if (col.includes('light_green')) f.light_green = 0.8;
      if (col.includes('purple')) f.purple = 0.7;
      if (col.includes('white')) f.white = 0.7;
      if (col.includes('pink')) f.pink = 0.7;
      if (isFern) f.fern = 0.85;
    }

    let score = 40;

    if (organFilter && organFilter !== 'all') {
      score += f.organ === organFilter ? 30 : -20;
    }

    if (f.red        && combinedSignals.red)         score += f.red        * combinedSignals.red        * 40;
    if (f.yellow     && combinedSignals.yellow)      score += f.yellow     * combinedSignals.yellow     * 45;
    if (f.pink       && combinedSignals.pink)        score += f.pink       * combinedSignals.pink       * 45;
    if (f.purple     && combinedSignals.purple)      score += f.purple     * combinedSignals.purple     * 40;
    if (f.white      && combinedSignals.white)       score += f.white      * combinedSignals.white      * 35;
    if (f.broad_green && combinedSignals.broad_green) score += f.broad_green * combinedSignals.broad_green * 30;
    if (f.dark_green  && combinedSignals.dark_green)  score += f.dark_green  * combinedSignals.dark_green  * 35;
    if (f.light_green && combinedSignals.light_green) score += f.light_green * combinedSignals.light_green * 35;
    if (f.green      && combinedSignals.broad_green) score += f.green      * combinedSignals.broad_green * 25;
    if (f.fern       && combinedSignals.feathery_green) score += f.fern    * combinedSignals.feathery_green * 35;
    if (f.conifer    && combinedSignals.conifer)     score += f.conifer    * combinedSignals.conifer    * 40;
    if (f.edge && f.edge === combinedSignals.edge_level) score += 12;

    // Offline confidence: capped at 75% — honest about uncertainty
    const confidence = Math.min(75, Math.max(45, Number((45 + score * 0.22).toFixed(1))));
    return { plant, rawScore: score, confidence };
  });
}

// ─── Match Plant.id suggestion to our local dictionary ───────────────────────
function matchSuggestionToDictionary(suggestion, plantDictionary) {
  const name = (
    suggestion.name ||
    suggestion.plant_name ||
    suggestion.taxon?.name ||
    ''
  ).toLowerCase().trim();

  const rawCommon = (
    suggestion.details?.common_names ||
    suggestion.plant_details?.common_names ||
    []
  );
  const commonNames = Array.isArray(rawCommon)
    ? rawCommon.map((n) => String(n).toLowerCase().trim())
    : [String(rawCommon).toLowerCase().trim()];

  const taxonomy = suggestion.details?.taxonomy || suggestion.plant_details?.taxonomy || {};
  const genus = (taxonomy.genus || suggestion.taxon?.genus || name.split(' ')[0] || '').toLowerCase().trim();
  const species = `${genus} ${(taxonomy.species || suggestion.taxon?.species || (name.split(' ')[1] || '')).toLowerCase()}`.trim();

  const candidates = [name, species, ...commonNames, genus].filter(Boolean);

  // 1. Check explicit alias map
  for (const candidate of candidates) {
    for (const [alias, dictId] of Object.entries(SPECIES_ALIASES)) {
      if (candidate === alias || candidate.includes(alias) || alias.includes(candidate)) {
        const plant = plantDictionary.find((p) => p.id === dictId);
        if (plant) return plant;
      }
    }
  }

  // 2. Exact or prefix match on scientific name
  if (name.length > 2) {
    const exactSci = plantDictionary.find((p) => {
      const pSci = (p.scientific_name || '').toLowerCase().trim();
      return pSci === name || pSci.startsWith(name) || name.startsWith(pSci);
    });
    if (exactSci) return exactSci;
  }

  // 3. Match against species or common names in dictionary
  for (const candidate of candidates) {
    if (candidate.length < 3) continue;
    const match = plantDictionary.find((p) => {
      const pSci = (p.scientific_name || '').toLowerCase();
      const pName = (p.plant_name || '').toLowerCase();
      const pLocal = (p.local_name || '').toLowerCase();
      return (
        pSci.includes(candidate) || candidate.includes(pSci) ||
        pName.includes(candidate) || candidate.includes(pName) ||
        pLocal.includes(candidate) || candidate.includes(pLocal)
      );
    });
    if (match) return match;
  }

  // 4. Genus match fallback
  if (genus.length > 3) {
    const genusMatch = plantDictionary.find((p) => {
      const pSci = (p.scientific_name || '').toLowerCase();
      return pSci.startsWith(genus + ' ') || pSci === genus;
    });
    if (genusMatch) return genusMatch;
  }

  return null;
}

// ─── Construct a rich, full plant card directly from Plant.id response ────────
function createPlantFromSuggestion(sug) {
  const sciName = sug.name || sug.plant_name || 'Botanical Specimen';
  const rawCommon = sug.details?.common_names || sug.plant_details?.common_names || [];
  const commonNames = Array.isArray(rawCommon)
    ? rawCommon.map((c) => String(c).trim()).filter(Boolean)
    : (typeof rawCommon === 'string' && rawCommon.trim() ? [rawCommon.trim()] : []);

  const primaryCommon = commonNames[0] || sciName;
  const secondaryCommon = commonNames.slice(1, 3).join(' / ') || primaryCommon;

  const rawDesc = sug.details?.description?.value || sug.details?.description || '';
  const desc = typeof rawDesc === 'string' ? rawDesc : (rawDesc.value || '');

  const photo = sug.similar_images?.[0]?.url || sug.similar_images?.[0]?.url_small || '';
  const taxonomy = sug.details?.taxonomy || sug.plant_details?.taxonomy || {};
  const family = taxonomy.family || 'Plantae';

  // Analyze text for safety status
  const textCorpus = `${desc} ${sciName} ${primaryCommon}`.toLowerCase();
  let safety = 'safe';
  let danger_level = 'Verified Specimen (AI Identified)';
  let edibility_details = 'Foliage and botanical traits identified via machine learning.';
  let first_aid = 'Harmless to touch.';

  if (/toxic|poison|deadly|lethal|irritan|rash|harmful|blister/.test(textCorpus)) {
    safety = 'poisonous';
    danger_level = 'Hazardous / Toxic (Avoid Ingestion)';
    edibility_details = 'Contains toxic compounds. Do NOT eat or chew.';
    first_aid = 'If ingested, seek immediate medical attention. Wash skin with clean water if irritation occurs.';
  } else if (/edible|fruit|vegetable|culinary|berry|nut|tuber|grain/.test(textCorpus)) {
    safety = 'edible';
    danger_level = 'Edible / Foraging Species';
    edibility_details = 'Documented as edible in botanical records. Verify positive identity before consuming in the wild.';
    first_aid = 'Safe. Clean with fresh water before eating.';
  } else if (/medicinal|therapeutic|remedy|folk medicine|tonic|herbal/.test(textCorpus)) {
    safety = 'medicinal';
    danger_level = 'Traditional Medicinal Herb';
    edibility_details = 'Used in traditional herbalism. Consult a professional before medicinal use.';
    first_aid = 'Non-toxic in normal contact.';
  }

  return {
    id: `ai_${sciName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    plant_name: primaryCommon,
    local_name: secondaryCommon,
    scientific_name: sciName,
    family,
    safety,
    danger_level,
    description: desc || `Identified as ${sciName} (${primaryCommon}), belonging to the family ${family}.`,
    care_note: 'Verified species identified via Plant.id botanical neural network.',
    edibility_details,
    first_aid,
    habitat: 'Tropical, Highland & Trail Flora',
    image_url: photo,
    photo_url: photo,
    svg_icon: safety === 'edible' ? '🍓' : safety === 'medicinal' ? '🌿' : safety === 'poisonous' ? '⚠️' : '🌱',
  };
}

// ─── Canvas → base64 JPEG (Optimized to max 1280px for crisp AI identification) ───
function canvasToBase64(canvas) {
  const maxDim = 1280;
  if (canvas.width > maxDim || canvas.height > maxDim) {
    const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height);
    const scaled = document.createElement('canvas');
    scaled.width = Math.max(1, Math.round(canvas.width * scale));
    scaled.height = Math.max(1, Math.round(canvas.height * scale));
    const sCtx = scaled.getContext('2d');
    if (sCtx) {
      sCtx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
      return scaled.toDataURL('image/jpeg', 0.90);
    }
  }
  return canvas.toDataURL('image/jpeg', 0.90);
}

// ─── Plant.id API call ────────────────────────────────────────────────────────
async function identifyWithPlantId(canvas) {
  const res = await fetch(PLANT_ID_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': PLANT_ID_API_KEY,
    },
    body: JSON.stringify({
      images: [canvasToBase64(canvas)],
      similar_images: true,
      classification_level: 'species',
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Plant.id API ${res.status}: ${errText}`);
  }
  return res.json();
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * analyzeImage(canvas, ctx, plantDictionary, organFilter)
 *
 * Returns: { isPlant, reason, top, confidence, alternatives, metrics, modelUsed }
 *
 * Tier 1 — Plant.id API (online, VITE_PLANT_ID_API_KEY set)
 * Tier 2 — TensorFlow.js MobileNet v2 + pixel analysis (offline fallback)
 */
export async function analyzeImage(canvas, ctx, plantDictionary, organFilter = 'all') {
  const pixelSignals = extractPixelSignals(canvas, ctx);

  // ════════════════════════════════════════════════════════════
  // TIER 1 — Plant.id API (online)
  // ════════════════════════════════════════════════════════════
  if (PLANT_ID_API_KEY) {
    try {
      const raw = await Promise.race([
        identifyWithPlantId(canvas),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 20000)),
      ]);

      // Support v3 (raw.result.classification.suggestions) and v2 (raw.suggestions)
      const suggestions = raw?.result?.classification?.suggestions || raw?.suggestions || [];
      const isPlantObj = raw?.result?.is_plant || raw?.is_plant || null;

      if (suggestions.length > 0) {
        const modelUsed = 'Plant.id AI';
        const isPlantProb = typeof isPlantObj?.probability === 'number'
          ? isPlantObj.probability
          : (isPlantObj?.binary ? 1 : 0.5);

        const topSug = suggestions[0];
        const topSugProb = typeof topSug?.probability === 'number' ? topSug.probability : 0.5;

        // Strict rejection ONLY if explicitly not a plant with near certainty (< 0.08) AND top suggestion probability is tiny (< 0.05)
        if (isPlantObj && isPlantProb < 0.08 && topSugProb < 0.05) {
          return {
            isPlant: false,
            reason: 'No plant detected. Please point the camera directly at a plant or leaf.',
            modelUsed,
            top: null, confidence: 0, alternatives: [],
            metrics: {
              greenRatio: (pixelSignals.broad_green * 100).toFixed(0),
              modelUsed,
              topLabel: topSug?.name || 'N/A',
              isPlantProb: (isPlantProb * 100).toFixed(1) + '%',
            },
          };
        }

        // Match suggestions to our curated dictionary
        const matched = [];
        const used = new Set();
        for (const sug of suggestions.slice(0, 10)) {
          const plant = matchSuggestionToDictionary(sug, plantDictionary);
          if (plant && !used.has(plant.id)) {
            used.add(plant.id);
            const prob = typeof sug.probability === 'number' ? sug.probability : 0.8;
            const confidence = Math.min(99, Math.max(65, Math.round(60 + prob * 39)));
            matched.push({ plant, confidence, probability: prob });
          }
        }

        // Apply organ filter if requested
        let ranked = matched;
        if (organFilter && organFilter !== 'all' && matched.length > 1) {
          ranked = matched
            .map((m) => {
              const f = PLANT_FEATURE_MAP[m.plant.id] || {};
              const bonus = f.organ === organFilter ? 8 : -6;
              return { ...m, confidence: Math.min(99, Math.max(50, m.confidence + bonus)) };
            })
            .sort((a, b) => b.confidence - a.confidence);
        }

        // Case A: Found match in our curated 207-plant catalog
        if (ranked.length > 0) {
          const top = ranked[0];
          const topName = suggestions[0]?.name || suggestions[0]?.plant_name || top.plant.plant_name;
          const topProbVal = suggestions[0]?.probability;
          return {
            isPlant: true,
            reason: null,
            modelUsed,
            top: top.plant,
            confidence: top.confidence,
            alternatives: ranked.slice(1, 4).map((m, i) => ({
              plant: m.plant,
              confidence: Math.max(40, m.confidence - (i + 1) * 3),
            })),
            metrics: {
              greenRatio: (pixelSignals.broad_green * 100).toFixed(0),
              modelUsed,
              topLabel: topName,
              topProb: typeof topProbVal === 'number' ? (topProbVal * 100).toFixed(1) + '%' : 'N/A',
            },
          };
        }

        // Case B: Plant.id identified a plant that wasn't in our curated catalog.
        // Instead of falling back to pixel guessing or failing, construct a verified botanical card!
        if (topSug && (topSugProb > 0.05 || isPlantProb > 0.15)) {
          const dynamicPlant = createPlantFromSuggestion(topSug);
          const altPlants = suggestions.slice(1, 4).map((s) => ({
            plant: matchSuggestionToDictionary(s, plantDictionary) || createPlantFromSuggestion(s),
            confidence: Math.max(45, Math.round(55 + (s.probability || 0.5) * 38)),
          }));

          return {
            isPlant: true,
            reason: null,
            modelUsed: `${modelUsed} (Global Species)`,
            top: dynamicPlant,
            confidence: Math.min(99, Math.max(68, Math.round(62 + topSugProb * 36))),
            alternatives: altPlants,
            metrics: {
              greenRatio: (pixelSignals.broad_green * 100).toFixed(0),
              modelUsed,
              topLabel: topSug.name || dynamicPlant.plant_name,
              topProb: (topSugProb * 100).toFixed(1) + '%',
            },
          };
        }
      }
    } catch (err) {
      console.warn('[PlantRecognition] Plant.id unavailable, switching to offline tier:', err.message);
    }
  }

  // ════════════════════════════════════════════════════════════
  // TIER 2 — TensorFlow.js MobileNet v2 + pixel analysis (offline)
  // ════════════════════════════════════════════════════════════
  let classifications = [];
  let tfAvailable = false;

  try {
    const model = await Promise.race([
      loadMobileNet(),
      new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (model) {
      classifications = await model.classify(canvas, 10);
      tfAvailable = true;
    }
  } catch (err) {
    console.warn('[PlantRecognition] TensorFlow.js error:', err);
  }

  const modelUsed = tfAvailable ? 'TensorFlow.js MobileNet v2 (Offline)' : 'Pixel Analysis (Offline)';

  // Non-plant check
  const plantCheck = detectIsPlant(classifications, pixelSignals);
  if (!plantCheck.isPlant) {
    return {
      isPlant: false,
      reason: plantCheck.reason,
      modelUsed,
      top: null, confidence: 0, alternatives: [],
      metrics: {
        greenRatio:  (pixelSignals.broad_green * 100).toFixed(0),
        redRatio:    (pixelSignals.red * 100).toFixed(0),
        modelUsed,
        topLabel:    classifications[0]?.className ?? 'N/A',
        topProb:     classifications[0]?.probability
                       ? (classifications[0].probability * 100).toFixed(1) + '%' : 'N/A',
      },
    };
  }

  // Blend pixel (40%) + MobileNet signals (60% when available)
  const mlSignals = tfAvailable ? classesToSignals(classifications) : {};
  const combinedSignals = {};
  const allChannels = new Set([...Object.keys(pixelSignals), ...Object.keys(mlSignals)]);
  for (const ch of allChannels) {
    const px = pixelSignals[ch] || 0;
    const ml = mlSignals[ch]    || 0;
    combinedSignals[ch] = tfAvailable ? px * 0.40 + ml * 0.60 : px;
  }

  const scored = scoreOffline(plantDictionary, combinedSignals, organFilter);
  scored.sort((a, b) => b.rawScore - a.rawScore);

  const top = scored[0];
  return {
    isPlant: true,
    reason: null,
    modelUsed,
    top: top.plant,
    confidence: top.confidence, // already capped at 75%
    alternatives: scored.slice(1, 4).map((s, i) => ({
      plant: s.plant,
      confidence: Math.max(35, Number((Math.min(68, s.confidence) - (i + 1) * 4).toFixed(1))),
    })),
    metrics: {
      greenRatio:  (combinedSignals.broad_green * 100).toFixed(0),
      redRatio:    (combinedSignals.red * 100).toFixed(0),
      yellowRatio: (combinedSignals.yellow * 100).toFixed(0),
      modelUsed,
      topLabel:    classifications[0]?.className ?? 'N/A',
      topProb:     classifications[0]?.probability
                     ? (classifications[0].probability * 100).toFixed(1) + '%' : 'N/A',
    },
  };
}

export { loadMobileNet };
