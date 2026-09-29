// Offline-first Local Storage Repository Adapter for Native/Standalone Execution
const createLocalEntityStore = (storageKey, defaultItems = []) => {
  const getItems = () => {
    try {
      const data = localStorage.getItem(storageKey);
      if (!data) {
        if (defaultItems.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(defaultItems));
          return [...defaultItems];
        }
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn(`Error reading ${storageKey}:`, e);
      return [];
    }
  };

  const saveItems = (items) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.warn(`Error saving ${storageKey}:`, e);
    }
  };

  return {
    async list(sortField, limit) {
      let items = getItems();
      if (sortField) {
        const isDesc = sortField.startsWith('-');
        const field = isDesc ? sortField.slice(1) : sortField;
        items.sort((a, b) => {
          const valA = a[field] ?? '';
          const valB = b[field] ?? '';
          if (valA < valB) return isDesc ? 1 : -1;
          if (valA > valB) return isDesc ? -1 : 1;
          return 0;
        });
      }
      if (limit) items = items.slice(0, limit);
      return items;
    },

    async create(data) {
      const items = getItems();
      const newItem = {
        ...data,
        id: data.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString(),
      };
      items.unshift(newItem);
      saveItems(items);
      return newItem;
    },

    async bulkCreate(dataList) {
      const items = getItems();
      const baseTs = Date.now();
      const newItems = dataList.map((data, idx) => ({
        ...data,
        id: data.id || `local_${baseTs}_${idx}_${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString(),
      }));
      items.push(...newItems);
      saveItems(items);
      return newItems;
    },

    async update(id, patch) {
      const items = getItems();
      const idx = items.findIndex((x) => x.id === id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...patch, updated_at: new Date().toISOString() };
        saveItems(items);
        return items[idx];
      }
      return { id, ...patch };
    },

    async delete(id) {
      let items = getItems();
      items = items.filter((x) => x.id !== id);
      saveItems(items);
      return { success: true };
    },
  };
};

// Common mountain plants for offline botanical plant identification
const offlinePlants = [
  {
    plant_name: 'Wild Blackberry',
    scientific_name: 'Rubus fruticosus',
    description: 'Thorny bramble with aggregate dark purple berries and serrated trifoliate leaves.',
    safety: 'edible',
    care_note: 'Berries are delicious and rich in vitamin C. Watch for thorns while picking.',
  },
  {
    plant_name: 'Western Bracken Fern',
    scientific_name: 'Pteridium aquilinum',
    description: 'Large triangular fronds divided into pinnules, common in forest clearings and mountain trails.',
    safety: 'safe',
    care_note: 'Safe to touch and photograph. Avoid eating mature fronds.',
  },
  {
    plant_name: 'Stinging Nettle',
    scientific_name: 'Urtica dioica',
    description: 'Erect perennial plant with opposite serrated leaves covered in tiny silica stinging hairs.',
    safety: 'medicinal',
    care_note: 'Stings upon skin contact causing minor itching. Makes excellent survival tea when dried or boiled.',
  },
  {
    plant_name: 'Eastern White Pine',
    scientific_name: 'Pinus strobus',
    description: 'Evergreen coniferous tree with soft needles arranged in bundles of 5 and long slender cones.',
    safety: 'safe',
    care_note: 'Fresh green needles can be steeped in hot water for a vitamin C-rich trail infusion.',
  },
  {
    plant_name: 'Common Dandelion',
    scientific_name: 'Taraxacum officinale',
    description: 'Vibrant yellow composite flowers on hollow stems with deeply-toothed basal leaf rosettes.',
    safety: 'edible',
    care_note: 'Every part of this plant is non-toxic and nutritious for wilderness foraging.',
  },
  {
    plant_name: 'Poison Ivy',
    scientific_name: 'Toxicodendron radicans',
    description: 'Trailing vine or low shrub with groups of three leaflets, reddish stems, and subtle pointed edges.',
    safety: 'poisonous',
    care_note: 'DANGER: Contains urushiol which triggers severe allergic skin rash. Do not touch or burn.',
  },
];

// Offline file storage (uses Data URL so photos work offline in native apps)
const uploadLocalFile = async ({ file }) => {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ file_url: '' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({ file_url: e.target ? String(e.target.result) : '' });
    };
    reader.onerror = () => {
      resolve({ file_url: URL.createObjectURL(file) });
    };
    reader.readAsDataURL(file);
  });
};

const defaultHikes = [
  {
    id: 'hike_pulag_01',
    trail_name: 'Ambangeg Trail to Grassland Summit',
    mountain: 'Mt. Pulag (2,928m)',
    date: '2026-09-15',
    duration_minutes: 270,
    distance_km: 16.5,
    elevation_gain_m: 650,
    difficulty: 'moderate',
    status: 'completed',
    steps: 21950,
    calories: 1890,
    notes: 'Witnessed the famous sea of clouds at sunrise. Cool temperature around 9°C. Observed dwarf bamboo and mountain orchids along the mossy trail.',
    photos: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    ],
    scanned_plants: ['Dwarf Bamboo (Yushania niitakayamensis)', 'Benguet Pine (Pinus kesiya)', 'Mountain Pitcher Plant (Nepenthes alata)'],
  },
  {
    id: 'hike_batulao_02',
    trail_name: 'Old-to-New Trail Traverse',
    mountain: 'Mt. Batulao (811m)',
    date: '2026-09-02',
    duration_minutes: 210,
    distance_km: 10.2,
    elevation_gain_m: 480,
    difficulty: 'moderate',
    status: 'completed',
    steps: 13600,
    calories: 1470,
    notes: 'Steep scenic ridge walk with 360-degree views of Batangas and Balayan Bay. Breezy weather, dry footing.',
    photos: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    ],
    scanned_plants: ['Cogon Grass (Imperata cylindrica)', 'Wild Bracken Fern (Pteridium aquilinum)'],
  },
];

export const base44 = {
  app: {
    getPublicSettings: async () => ({ id: 'trek-quest', public_settings: {} }),
  },
  auth: {
    me: async () => {
      return { id: 'hiker_user', full_name: 'Hiker' };
    },
    logout: async () => {
      window.location.href = '/login';
    },
    redirectToLogin: () => {
      window.location.href = '/login';
    },
  },
  entities: {
    BackpackingItem: createLocalEntityStore('BackpackingItem'),
    EmergencyInfo: createLocalEntityStore('EmergencyInfo'),
    Hike: createLocalEntityStore('Hike', defaultHikes),
    JournalEntry: createLocalEntityStore('JournalEntry'),
    PlantScan: createLocalEntityStore('PlantScan'),
  },
  integrations: {
    Core: {
      UploadPublicFile: async ({ file }) => {
        return await uploadLocalFile({ file });
      },
      InvokeLLM: async (_params) => {
        const randomIdx = Math.floor(Math.random() * offlinePlants.length);
        return offlinePlants[randomIdx];
      },
    },
  },
};
