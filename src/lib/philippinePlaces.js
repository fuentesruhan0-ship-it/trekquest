// Comprehensive dataset of Philippine Cities, Municipalities, Barangays, Peaks, and Trails
export const philippinePlaces = [
  // ── MAJOR CITIES & MUNICIPALITIES ──────────────────────────
  { name: 'Manila City', region: 'Metro Manila', type: 'City', lat: 14.5995, lng: 120.9842 },
  { name: 'Quezon City', region: 'Metro Manila', type: 'City', lat: 14.6760, lng: 121.0437 },
  { name: 'Baguio City', region: 'Benguet, Cordillera', type: 'City', lat: 16.4023, lng: 120.5960 },
  { name: 'Tagaytay City', region: 'Cavite, Calabarzon', type: 'City', lat: 14.1153, lng: 120.9621 },
  { name: 'Cebu City', region: 'Cebu, Central Visayas', type: 'City', lat: 10.3157, lng: 123.8854 },
  { name: 'Davao City', region: 'Davao del Sur, Mindanao', type: 'City', lat: 7.1907, lng: 125.4553 },
  { name: 'Nasugbu', region: 'Batangas, Calabarzon', type: 'Municipality', lat: 14.0772, lng: 120.6337 },
  { name: 'Batangas City', region: 'Batangas, Calabarzon', type: 'City', lat: 13.7565, lng: 121.0583 },
  { name: 'Tanay', region: 'Rizal, Calabarzon', type: 'Municipality', lat: 14.4969, lng: 121.2858 },
  { name: 'Antipolo City', region: 'Rizal, Calabarzon', type: 'City', lat: 14.5842, lng: 121.1763 },
  { name: 'Rodriguez (Montalban)', region: 'Rizal, Calabarzon', type: 'Municipality', lat: 14.7308, lng: 121.1444 },
  { name: 'Kabayan', region: 'Benguet, Cordillera', type: 'Municipality', lat: 16.6219, lng: 120.8383 },
  { name: 'Itogon', region: 'Benguet, Cordillera', type: 'Municipality', lat: 16.3608, lng: 120.6750 },
  { name: 'Calamba City', region: 'Laguna, Calabarzon', type: 'City', lat: 14.2117, lng: 121.1656 },
  { name: 'Los Baños', region: 'Laguna, Calabarzon', type: 'Municipality', lat: 14.1674, lng: 121.2424 },
  { name: 'Puerto Princesa', region: 'Palawan, Mimaropa', type: 'City', lat: 9.7392, lng: 118.7353 },
  { name: 'Iloilo City', region: 'Iloilo, Western Visayas', type: 'City', lat: 10.7202, lng: 122.5621 },
  { name: 'Bacolod City', region: 'Negros Occidental', type: 'City', lat: 10.6766, lng: 122.9509 },
  { name: 'Cagayan de Oro', region: 'Misamis Oriental, Mindanao', type: 'City', lat: 8.4542, lng: 124.6319 },
  { name: 'Zamboanga City', region: 'Zamboanga Peninsula', type: 'City', lat: 6.9214, lng: 122.0790 },
  { name: 'General Santos City', region: 'South Cotabato, Mindanao', type: 'City', lat: 6.1164, lng: 125.1716 },
  { name: 'Angeles City', region: 'Pampanga, Central Luzon', type: 'City', lat: 15.1450, lng: 120.5887 },
  { name: 'San Fernando', region: 'Pampanga, Central Luzon', type: 'City', lat: 15.0298, lng: 120.6896 },
  { name: 'Olongapo City', region: 'Zambales, Central Luzon', type: 'City', lat: 14.8386, lng: 120.2842 },
  { name: 'Legazpi City', region: 'Albay, Bicol Region', type: 'City', lat: 13.1391, lng: 123.7438 },
  { name: 'Naga City', region: 'Camarines Sur, Bicol', type: 'City', lat: 13.6218, lng: 123.1948 },
  { name: 'Lucena City', region: 'Quezon Province', type: 'City', lat: 13.9372, lng: 121.6171 },
  { name: 'Sagada', region: 'Mountain Province, Cordillera', type: 'Municipality', lat: 17.0833, lng: 120.9000 },
  { name: 'Banaue', region: 'Ifugao, Cordillera', type: 'Municipality', lat: 16.9114, lng: 121.0583 },
  { name: 'Mariveles', region: 'Bataan, Central Luzon', type: 'Municipality', lat: 14.4333, lng: 120.4833 },
  { name: 'Subic', region: 'Zambales, Central Luzon', type: 'Municipality', lat: 14.8789, lng: 120.2344 },
  { name: 'Cuenca', region: 'Batangas, Calabarzon', type: 'Municipality', lat: 13.9000, lng: 121.0500 },
  { name: 'Dolores', region: 'Quezon Province', type: 'Municipality', lat: 14.0167, lng: 121.4000 },
  { name: 'Capas', region: 'Tarlac, Central Luzon', type: 'Municipality', lat: 15.3333, lng: 120.5833 },
  { name: 'Pililla', region: 'Rizal, Calabarzon', type: 'Municipality', lat: 14.4833, lng: 121.3000 },
  { name: 'San Juan', region: 'Batangas, Calabarzon', type: 'Municipality', lat: 13.7500, lng: 121.4000 },
  { name: 'Malaybalay City', region: 'Bukidnon, Mindanao', type: 'City', lat: 8.1575, lng: 125.1278 },
  { name: 'Tagum City', region: 'Davao del Norte', type: 'City', lat: 7.4478, lng: 125.8078 },
  { name: 'Kidapawan City', region: 'Cotabato, Mindanao', type: 'City', lat: 7.0086, lng: 125.0894 },

  // ── FAMOUS BARANGAYS & TRAIL JUMP-OFFS ─────────────────────
  { name: 'Barangay Daraitan', region: 'Tanay, Rizal (Mt. Daraitan Jump-off)', type: 'Barangay', lat: 14.6083, lng: 121.3980 },
  { name: 'Barangay Cuyambay', region: 'Tanay, Rizal (Mt. Nagpatong & Paliparan)', type: 'Barangay', lat: 14.5833, lng: 121.3333 },
  { name: 'Barangay Ambangeg', region: 'Kabayan, Benguet (Mt. Pulag Ranger Station)', type: 'Barangay', lat: 16.5910, lng: 120.8980 },
  { name: 'Barangay Akiki', region: 'Kabayan, Benguet (Mt. Pulag Killer Trail)', type: 'Barangay', lat: 16.5650, lng: 120.8710 },
  { name: 'Barangay Wawa', region: 'Rodriguez, Rizal (Mt. Pamitinan & Binacayan)', type: 'Barangay', lat: 14.7330, lng: 121.1910 },
  { name: 'Barangay Cayabu', region: 'Tanay, Rizal (Mt. Cayabu & Mt. Maynoba)', type: 'Barangay', lat: 14.6330, lng: 121.3170 },
  { name: 'Barangay San Andres', region: 'Tanay, Rizal (Mt. Batolusong Jump-off)', type: 'Barangay', lat: 14.6150, lng: 121.3050 },
  { name: 'Barangay Kayrupa', region: 'Nasugbu, Batangas (Mt. Batulao Jump-off)', type: 'Barangay', lat: 14.0500, lng: 120.8000 },
  { name: 'Barangay Ilanin Forest', region: 'Subic Bay Freeport, Bataan', type: 'Barangay', lat: 14.7700, lng: 120.3000 },
  { name: 'Barangay Poblacion', region: 'Nasugbu, Batangas', type: 'Barangay', lat: 14.0750, lng: 120.6300 },
  { name: 'Barangay San Jose', region: 'Antipolo City, Rizal', type: 'Barangay', lat: 14.6100, lng: 121.1900 },
  { name: 'Barangay Sta. Ines', region: 'Tanay, Rizal (Mt. Irid Jump-off)', type: 'Barangay', lat: 14.7500, lng: 121.3300 },
  { name: 'Barangay Mascap', region: 'Rodriguez, Rizal (Mt. Sipit Ulang)', type: 'Barangay', lat: 14.7550, lng: 121.1850 },
  { name: 'Barangay Sta. Juliana', region: 'Capas, Tarlac (Mt. Pinatubo Jump-off)', type: 'Barangay', lat: 15.3167, lng: 120.4167 },
  { name: 'Barangay Alas-as', region: 'Mariveles, Bataan (Tarak Ridge Entry)', type: 'Barangay', lat: 14.4833, lng: 120.4833 },
  { name: 'Barangay Ilayang San Roque', region: 'Dolores, Quezon (Mt. Cristobal)', type: 'Barangay', lat: 14.0333, lng: 121.4167 },
  { name: 'Barangay Kinabuhayan', region: 'Dolores, Quezon (Mt. Banahaw Entry)', type: 'Barangay', lat: 14.0380, lng: 121.4330 },
  { name: 'Barangay Kapatagan', region: 'Digos, Davao del Sur (Mt. Apo Trail)', type: 'Barangay', lat: 6.9167, lng: 125.2500 },
  { name: 'Barangay Ampucao', region: 'Itogon, Benguet (Mt. Ulap Jump-off)', type: 'Barangay', lat: 16.3333, lng: 120.6333 },

  // ── MOUNTAINS, PEAKS & TRAILS ─────────────────────────────
  { name: 'Mt. Pulag', region: 'Benguet, Cordillera', type: 'Mountain Peak', elevation: '2,928m', difficulty: 'Moderate', lat: 16.5975, lng: 120.8986, desc: 'Sea of clouds, dwarf bamboo grassland, cold summit climate.' },
  { name: 'Mt. Apo', region: 'Davao / Cotabato', type: 'Mountain Peak', elevation: '2,954m', difficulty: 'Hard', lat: 6.9875, lng: 125.2711, desc: 'Highest peak in the Philippines with sulfur vents and boulder face.' },
  { name: 'Mt. Batulao', region: 'Nasugbu, Batangas', type: 'Mountain Peak', elevation: '811m', difficulty: 'Moderate', lat: 14.0436, lng: 120.8031, desc: 'Spectacular knife-edge ridges with 360-degree vistas of Balayan Bay.' },
  { name: 'Mt. Ulap', region: 'Itogon, Benguet', type: 'Mountain Peak', elevation: '1,846m', difficulty: 'Moderate', lat: 16.3268, lng: 120.6481, desc: 'Eco-trail with pine ridges, hanging burial caves, and Gungal Rock.' },
  { name: 'Mt. Pinatubo', region: 'Zambales / Capas', type: 'Mountain Peak', elevation: '1,486m', difficulty: 'Easy-Mod', lat: 15.1429, lng: 120.3496, desc: 'Turquoise caldera crater lake and 4x4 canyon crossing.' },
  { name: 'Mt. Daraitan', region: 'Tanay, Rizal', type: 'Mountain Peak', elevation: '739m', difficulty: 'Moderate', lat: 14.6153, lng: 121.4361, desc: 'Limestone rock formations, caves, and scenic Tinipak River.' },
  { name: 'Mt. Guiting-Guiting', region: 'Sibuyan Island, Romblon', type: 'Mountain Peak', elevation: '2,058m', difficulty: 'Expert', lat: 12.4167, lng: 122.5694, desc: 'World-famous jagged sawtooth ridge in virgin rainforest.' },
  { name: 'Mt. Maculot', region: 'Cuenca, Batangas', type: 'Mountain Peak', elevation: '930m', difficulty: 'Moderate', lat: 13.9167, lng: 121.0500, desc: 'The Rockies overlooking the full panoramic view of Taal Lake.' },
  { name: 'Mt. Pico de Loro', region: 'Maragondon, Cavite', type: 'Mountain Peak', elevation: '664m', difficulty: 'Moderate', lat: 14.2167, lng: 120.6500, desc: 'Iconic parrot beak monolith rock pinnacle.' },
  { name: 'Mt. Talamitam', region: 'Nasugbu, Batangas', type: 'Mountain Peak', elevation: '630m', difficulty: 'Easy', lat: 14.1167, lng: 120.7500, desc: 'Rolling cogon grass plateaus, sister mountain of Batulao.' },
  { name: 'Mt. Mariveles (Tarak Ridge)', region: 'Mariveles, Bataan', type: 'Mountain Peak', elevation: '1,388m', difficulty: 'Hard', lat: 14.5000, lng: 120.5000, desc: 'Windy ridge and Papaya river with views of Corregidor.' },
  { name: 'Mt. Arayat', region: 'Arayat, Pampanga', type: 'Mountain Peak', elevation: '1,026m', difficulty: 'Moderate', lat: 15.2000, lng: 120.7500, desc: 'Solitary mountain rising out of the Central Luzon plains.' },
  { name: 'Mt. Makiling', region: 'Los Baños, Laguna', type: 'Mountain Peak', elevation: '1,090m', difficulty: 'Hard', lat: 14.1333, lng: 121.2000, desc: 'Rich biodiversity, mudsprings, and mossy Peak 2.' },
  { name: 'Mt. Banahaw', region: 'Dolores, Quezon', type: 'Mountain Peak', elevation: '2,170m', difficulty: 'Hard', lat: 14.0667, lng: 121.5000, desc: 'Mystical active volcano and watershed protected reserve.' },
  { name: 'Mt. Cristobal', region: 'Dolores, Quezon', type: 'Mountain Peak', elevation: '1,470m', difficulty: 'Hard', lat: 14.0500, lng: 121.4333, desc: 'Dense misty forest known as the Devil Mountain.' },
  { name: 'Mt. Ugo', region: 'Kayapa / Itogon', type: 'Mountain Peak', elevation: '2,150m', difficulty: 'Hard', lat: 16.3167, lng: 120.8000, desc: 'Cross-country ridge traverse through native Benguet pine trees.' },
  { name: 'Mt. Dulang-Dulang', region: 'Bukidnon, Mindanao', type: 'Mountain Peak', elevation: '2,938m', difficulty: 'Hard', lat: 8.1167, lng: 124.9333, desc: 'Second highest peak in the Philippines with magical mossy forest.' },
  { name: 'Mt. Kitanglad', region: 'Bukidnon, Mindanao', type: 'Mountain Peak', elevation: '2,899m', difficulty: 'Hard', lat: 8.1333, lng: 124.9167, desc: 'Sanctuary of the Philippine Eagle with panoramic high ridges.' },
  { name: 'Mt. Kanlaon', region: 'Negros Occidental', type: 'Mountain Peak', elevation: '2,465m', difficulty: 'Hard', lat: 10.4119, lng: 123.1319, desc: 'Active stratovolcano with grand caldera and crater.' },
  { name: 'Mt. Mayon', region: 'Albay, Bicol', type: 'Mountain Peak', elevation: '2,463m', difficulty: 'Expert', lat: 13.2567, lng: 123.6850, desc: 'World renowned symmetrical cone volcano.' },
  { name: 'Mt. Isarog', region: 'Naga, Camarines Sur', type: 'Mountain Peak', elevation: '1,966m', difficulty: 'Hard', lat: 13.6583, lng: 123.3739, desc: 'Rich mossy rainforest, Malabsay falls, and sulfur vents.' },
  { name: 'Mt. Sembrano', region: 'Pililla, Rizal', type: 'Mountain Peak', elevation: '745m', difficulty: 'Moderate', lat: 14.3833, lng: 121.3667, desc: 'Laguna de Bay vistas and Manggahan grasslands.' },
  { name: 'Mt. Batolusong', region: 'Tanay, Rizal', type: 'Mountain Peak', elevation: '645m', difficulty: 'Easy-Mod', lat: 14.6167, lng: 121.3167, desc: 'Duhat grasslands, Mapatag plateau, and sea of clouds.' },
  { name: 'Mt. Pamitinan', region: 'Rodriguez, Rizal', type: 'Mountain Peak', elevation: '426m', difficulty: 'Moderate', lat: 14.7333, lng: 121.1833, desc: 'White limestone cliffs, historical Bernardo Carpio legend.' },
  { name: 'Mt. Binacayan', region: 'Rodriguez, Rizal', type: 'Mountain Peak', elevation: '424m', difficulty: 'Moderate', lat: 14.7333, lng: 121.1900, desc: 'Sharp limestone rock scramble with sea of clouds.' },
  { name: 'Mt. Hapunang Banoi', region: 'Rodriguez, Rizal', type: 'Mountain Peak', elevation: '517m', difficulty: 'Moderate', lat: 14.7400, lng: 121.1950, desc: 'Highest of the Montalban trilogy with rugged rock crags.' },
  { name: 'Mt. Kulis', region: 'Tanay, Rizal', type: 'Mountain Peak', elevation: '620m', difficulty: 'Easy', lat: 14.6000, lng: 121.3500, desc: 'Sambong mountain, Noah Ark, and morning cloud inversion.' },
  { name: 'Mt. Daguldol', region: 'San Juan, Batangas', type: 'Mountain Peak', elevation: '670m', difficulty: 'Moderate', lat: 13.6833, lng: 121.3667, desc: 'Coastal mountain trek ending at Laiya white sand beach.' },
  { name: 'Osmeña Peak', region: 'Dalaguete, Cebu', type: 'Mountain Peak', elevation: '1,013m', difficulty: 'Easy', lat: 9.8219, lng: 123.4475, desc: 'Highest point in Cebu with unique jagged chocolate-hill formations.' },
  { name: 'Mt. Irid', region: 'Tanay, Rizal', type: 'Mountain Peak', elevation: '1,467m', difficulty: 'Hard', lat: 14.7833, lng: 121.3333, desc: 'Highest summit in Rizal province featuring multiple river crossings.' },
  { name: 'Mt. Kalawitan', region: 'Sabangan, Mountain Province', type: 'Mountain Peak', elevation: '2,714m', difficulty: 'Hard', lat: 17.0000, lng: 120.9333, desc: 'Fourth highest peak in Luzon with mossy pine forest.' },
  { name: 'Mt. Kupapey', region: 'Maligcong, Bontoc', type: 'Mountain Peak', elevation: '1,647m', difficulty: 'Easy', lat: 17.1333, lng: 120.9833, desc: 'Sunrise vantage point overlooking ancient rice terraces.' },
  { name: 'Mt. Fato', region: 'Maligcong, Bontoc', type: 'Mountain Peak', elevation: '1,500m', difficulty: 'Easy', lat: 17.1167, lng: 120.9667, desc: 'Massive boulders and pine forest ridge in Mountain Province.' },
  { name: 'Mt. Tapulao', region: 'Palauig, Zambales', type: 'Mountain Peak', elevation: '2,037m', difficulty: 'Hard', lat: 15.4833, lng: 120.1167, desc: 'High Peak with cool pine forests, rolling red soil roads, and sea of clouds.' },
  { name: 'Mt. Halcon', region: 'Baco, Oriental Mindoro', type: 'Mountain Peak', elevation: '2,586m', difficulty: 'Expert', lat: 13.2500, lng: 120.9833, desc: 'Rugged knife-edge ridges and dense pristine rainforests.' },
  { name: 'Mt. Madjaas', region: 'Culasi, Antique', type: 'Mountain Peak', elevation: '2,117m', difficulty: 'Expert', lat: 11.3833, lng: 122.1500, desc: 'Highest peak in Panay Island with bonsai mossy forests and 14 waterfalls.' },
  { name: 'Mt. Mantalingajan', region: 'Brookes Point, Palawan', type: 'Mountain Peak', elevation: '2,085m', difficulty: 'Expert', lat: 8.8167, lng: 117.6667, desc: 'Crown summit of Palawan featuring the treacherous Knife Edge ridge.' },
  { name: 'Mt. Tabayoc', region: 'Kabayan, Benguet', type: 'Mountain Peak', elevation: '2,842m', difficulty: 'Hard', lat: 16.7167, lng: 120.9000, desc: 'Second highest peak in Luzon, deep mossy monkey forest and 4 mystical lakes.' },
  { name: 'Mt. Timbak', region: 'Atok, Benguet', type: 'Mountain Peak', elevation: '2,717m', difficulty: 'Easy', lat: 16.5833, lng: 120.7667, desc: 'Third highest in Luzon with high-altitude vegetable terraces and fire mummies.' },
  { name: 'Mt. Natib', region: 'Orani, Bataan', type: 'Mountain Peak', elevation: '1,253m', difficulty: 'Hard', lat: 14.7167, lng: 120.4000, desc: 'Limatik trail and Pasukulan falls in dense Bataan National Park.' },
  { name: 'Mt. Balagbag', region: 'Rodriguez, Rizal', type: 'Mountain Peak', elevation: '777m', difficulty: 'Easy', lat: 14.8000, lng: 121.1500, desc: 'Popular beginner trail and night camp overlooking Metro Manila skyline.' },
  { name: 'Mt. Tagapo', region: 'Binangonan, Rizal', type: 'Mountain Peak', elevation: '438m', difficulty: 'Easy', lat: 14.3417, lng: 121.2250, desc: 'Center of Laguna de Bay on Talim Island with 360-degree lake panorama.' },
  { name: 'Mt. Sawi', region: 'Gabaldon, Nueva Ecija', type: 'Mountain Peak', elevation: '594m', difficulty: 'Easy-Mod', lat: 15.5333, lng: 121.3167, desc: 'Scenic rolling ridges and grass hills overlooking the Dingalan coastline.' },
  { name: 'Mt. Manabu', region: 'Sto. Tomas, Batangas', type: 'Mountain Peak', elevation: '760m', difficulty: 'Easy', lat: 14.0167, lng: 121.2333, desc: 'White cross summit and free civet/barako coffee on the trail.' },
  { name: 'Mt. Malipunyo', region: 'Lipa, Batangas', type: 'Mountain Peak', elevation: '1,005m', difficulty: 'Moderate', lat: 14.0333, lng: 121.2667, desc: 'Dense rainforest traverse connecting Batangas and Laguna.' },
  { name: 'Mt. Bulusan', region: 'Bulusan, Sorsogon', type: 'Mountain Peak', elevation: '1,565m', difficulty: 'Hard', lat: 12.7667, lng: 124.0500, desc: 'Active stratovolcano with pristine Bulusan Lake and lush rainforests.' },
  { name: 'Mt. Kabunian', region: 'Bakun, Benguet', type: 'Mountain Peak', elevation: '1,789m', difficulty: 'Hard', lat: 16.7833, lng: 120.6667, desc: 'Hanging wooden coffins on vertical stone cliffs, Bakun Trio mountain.' },
  { name: 'Mt. Tenglawan', region: 'Bakun, Benguet', type: 'Mountain Peak', elevation: '1,943m', difficulty: 'Hard', lat: 16.8500, lng: 120.6833, desc: 'The iconic carrot peak rocky pinnacle of Mountain Province.' },
  { name: 'Mt. Gulugod Baboy', region: 'Mabini, Batangas', type: 'Mountain Peak', elevation: '525m', difficulty: 'Easy', lat: 13.7333, lng: 120.9000, desc: 'Gentle grassy ridge with sweeping views of Batangas and Balayan bays.' },
  { name: 'Mt. 387 (Batong Amat)', region: 'Carranglan, Nueva Ecija', type: 'Mountain Peak', elevation: '724m', difficulty: 'Moderate', lat: 15.9667, lng: 120.9500, desc: 'The Chocolate Hills of the North with pine ridges and Aloha falls.' },
  { name: 'Kafok Peak (Mt. Kafok)', region: 'Tupi, South Cotabato, Mindanao', type: 'Mountain Peak', elevation: '1,090m', difficulty: 'Moderate', lat: 6.3606, lng: 125.0229, desc: 'Eco-cultural mountain peak in Sitio Kafok, Brgy. Acmonan, Tupi (1,090 MASL) with panoramic vistas of Mt. Matutum.' },
  { name: 'Fok Peak', region: 'Tupi, South Cotabato, Mindanao', type: 'Mountain Peak', elevation: '1,090m', difficulty: 'Moderate', lat: 6.3606, lng: 125.0229, desc: 'Fok Peak summit (1,090 MASL), popular day hike and camping destination in South Cotabato.' },
  { name: 'Mt. Matutum', region: 'Tupi, South Cotabato, Mindanao', type: 'Mountain Peak', elevation: '2,286m', difficulty: 'Hard', lat: 6.3600, lng: 125.0750, desc: 'Prominent conical stratovolcano in South Cotabato, sanctuary of the Philippine Eagle.' },
];

// Calculate Haversine Great-Circle distance in Kilometers
export function haversine(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Calculate Compass Bearing in Degrees (0 - 360)
export function calculateBearing(start, dest) {
  if (!start || !dest) return 0;
  const lat1 = (start[0] * Math.PI) / 180;
  const lon1 = (start[1] * Math.PI) / 180;
  const lat2 = (dest[0] * Math.PI) / 180;
  const lon2 = (dest[1] * Math.PI) / 180;
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  return Math.round(brng);
}

// Convert degrees to cardinal compass direction
export function getCompassDirection(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const ix = Math.round(deg / 22.5) % 16;
  return dirs[ix];
}

// Parse elevation string or number to clean integer in meters ("2,928m" -> 2928, 811 -> 811)
export function parseElevation(val) {
  if (val == null) return null;
  if (typeof val === 'number') return isNaN(val) || val <= 0 ? null : Math.round(val);
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) || num <= 0 ? null : Math.round(num);
  }
  return null;
}

// Get realistic destination elevation in meters by checking elevation property, mountain name, or nearest peak proximity
export function getDestinationElevation(destination, coords = null) {
  // 1. Direct elevation or elevation_gain_m property
  const direct = parseElevation(destination?.elevation) ||
                 parseElevation(destination?.elevation_gain_m) ||
                 parseElevation(destination?.masl) ||
                 parseElevation(destination?.ele);
  if (direct) return direct;

  const lat = destination?.lat != null ? destination.lat : (coords ? coords[0] : null);
  const lng = destination?.lng != null ? destination.lng : (coords ? coords[1] : null);

  const rawName = (destination?.name || destination?.destName || destination?.mountain || destination?.label || destination?.desc || '').toLowerCase().trim();

  // 1.5 Extract embedded elevation from name, label, or description (e.g. "Fok Peak 1090 m", "Kafok (1090 MASL)", "1090m")
  const embeddedEleMatch = rawName.match(/(\d{3,4}(?:,\d{3})?)\s*(?:m\b|masl|meters)/i);
  if (embeddedEleMatch) {
    const extracted = parseElevation(embeddedEleMatch[1]);
    if (extracted && extracted >= 100) return extracted;
  }

  // 1.6 Dedicated verified match for Kafok / Fok Peak (1,090 MASL in Tupi, South Cotabato)
  if (rawName.includes('kafok') || rawName.includes('fok peak') || rawName.includes('mt. fok') || rawName.includes('mt fok')) {
    return 1090;
  }

  // 2. Exact or substring match in mountain dataset by name
  if (rawName) {
    const cleanRaw = rawName.replace(/^(mt\.?|mount)\s*/i, '').trim();
    const match = philippinePlaces.find((p) => {
      if (!p.elevation) return false;
      const pName = p.name.toLowerCase().trim();
      const pClean = pName.replace(/^(mt\.?|mount)\s*/i, '').trim();
      return pName === rawName || rawName.includes(pClean) || pClean.includes(cleanRaw) ||
             (cleanRaw.length >= 3 && pClean.includes(cleanRaw));
    });
    if (match) {
      const matchEle = parseElevation(match.elevation);
      if (matchEle) return matchEle;
    }
  }

  // 3. Proximity search: find closest mountain peak in dataset within 45 km
  if (lat != null && lng != null) {
    const mountainPeaks = philippinePlaces.filter((p) => p.type === 'Mountain Peak' && p.elevation);
    let closestPeak = null;
    let minDistance = Infinity;

    for (const peak of mountainPeaks) {
      const dist = haversine([lat, lng], [peak.lat, peak.lng]);
      if (dist < minDistance) {
        minDistance = dist;
        closestPeak = peak;
      }
    }

    if (closestPeak && minDistance <= 45) {
      const closestEle = parseElevation(closestPeak.elevation);
      if (closestEle) return closestEle;
    }
  }

  // 4. Default realistic trail elevation
  return 650;
}

// In-memory elevation cache to eliminate redundant network requests
const elevationCache = new Map();

// High-Accuracy Elevation: Queries Open-Meteo Digital Elevation Model (Copernicus 90m DEM)
// for any exact geographic coordinate, with instant fallback to local mountain database
export async function fetchAccurateElevation(lat, lng, destination = null) {
  if (lat == null || lng == null) {
    return getDestinationElevation(destination);
  }

  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    return getDestinationElevation(destination);
  }

  const cacheKey = `${numLat.toFixed(3)},${numLng.toFixed(3)}`;
  if (elevationCache.has(cacheKey)) {
    return elevationCache.get(cacheKey);
  }

  // Baseline elevation from verified mountain database
  const fallbackEle = getDestinationElevation(destination, [numLat, numLng]);

  // Query live satellite Digital Elevation Model (DEM)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${numLat.toFixed(4)}&longitude=${numLng.toFixed(4)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const val = data?.elevation?.[0];
      if (val != null && !isNaN(val) && val > 0) {
        const demEle = Math.round(val);
        const destNameLower = (destination?.name || destination?.destName || destination?.mountain || '').toLowerCase();
        const isPeak = destination?.type === 'Mountain Peak' ||
          destNameLower.includes('mt') ||
          destNameLower.includes('peak') ||
          destNameLower.includes('fok') ||
          destNameLower.includes('kafok');
        const finalEle = isPeak ? Math.max(fallbackEle, demEle) : demEle;
        elevationCache.set(cacheKey, finalEle);
        return finalEle;
      }
    }
  } catch {}

  elevationCache.set(cacheKey, fallbackEle);
  return fallbackEle;
}

// Broad Place Search: Matches every letter typed across local database + live Nominatim
export async function searchBroadPlaces(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];

  // 1. Instant local matching across all letters
  const localMatches = philippinePlaces.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.region && p.region.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q))
  );

  // If query is short (1-2 characters), return local instantly to be blazing fast
  if (q.length < 3) {
    return localMatches.slice(0, 10);
  }

  // 2. Query Nominatim for any place, city, barangay, or landmark
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=12&addressdetails=1&extratags=1`
    );
    if (res.ok) {
      const data = await res.json();
      const onlineMatches = data
        .filter((item) => {
          const cls = item.class || '';
          const type = item.type || '';
          // Strictly keep places, boundaries, cities, barangays, mountains, trails
          return (
            cls === 'place' ||
            cls === 'boundary' ||
            cls === 'natural' ||
            cls === 'tourism' ||
            cls === 'highway' ||
            cls === 'landuse' ||
            type === 'city' ||
            type === 'town' ||
            type === 'village' ||
            type === 'hamlet' ||
            type === 'suburb' ||
            type === 'neighbourhood' ||
            type === 'administrative' ||
            type === 'peak' ||
            type === 'volcano'
          );
        })
        .map((item) => {
          const addr = item.address || {};
          let placeType = 'Location';
          if (addr.village || addr.suburb || addr.neighbourhood) {
            placeType = 'Barangay';
          } else if (addr.city || item.type === 'city') {
            placeType = 'City';
          } else if (addr.town || addr.municipality) {
            placeType = 'Municipality';
          } else if (addr.province || addr.state) {
            placeType = 'Province';
          } else if (item.type === 'peak' || item.type === 'volcano') {
            placeType = 'Mountain Peak';
          }

          const rawName = item.name || item.display_name.split(',')[0];
          const formattedName =
            placeType === 'Barangay' && !rawName.toLowerCase().startsWith('barangay')
              ? `Barangay ${rawName}`
              : rawName;

          return {
            name: formattedName,
            region: item.display_name.split(',').slice(1, 4).join(', ').trim(),
            type: placeType,
            elevation: item.extratags?.ele
              ? `${item.extratags.ele}m`
              : `${getDestinationElevation({ name: formattedName, lat: parseFloat(item.lat), lng: parseFloat(item.lon) })}m`,
            difficulty: placeType === 'Mountain Peak' ? 'Moderate' : 'Accessible',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            desc: item.display_name,
            source: 'OpenStreetMap',
          };
        });

      // Merge and deduplicate
      const seen = new Set(localMatches.map((m) => m.name.toLowerCase()));
      const combined = [...localMatches];
      for (const item of onlineMatches) {
        if (!seen.has(item.name.toLowerCase())) {
          seen.add(item.name.toLowerCase());
          combined.push(item);
        }
      }
      return combined.slice(0, 15);
    }
  } catch (err) {
    console.warn('Online place search error:', err);
  }

  return localMatches.slice(0, 15);
}
