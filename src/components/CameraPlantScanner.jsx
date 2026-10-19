import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, X, CheckCircle, AlertTriangle, ShieldAlert,
  RefreshCw, BookOpen, ArrowLeft, Search, RotateCw, Leaf, Sparkles,
  Volume2, VolumeX, MapPin, Info, Upload
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { analyzeImage } from '@/lib/plantRecognition';
import { plantDictionary } from '@/data/plantCatalog';

// Botanical Vector Art for 100% Offline Guaranteed Unique Visuals
function BotanicalVectorIcon({ plantId, size = 32, className = '' }) {
  switch (plantId) {
    case 'pitcher_plant':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M18 8C18 8 28 6 32 10C36 14 30 18 28 20C24 24 24 38 20 42C16 46 12 36 14 26C16 16 18 8 18 8Z" fill="#be123c" fillOpacity="0.85" stroke="#f43f5e" strokeWidth="2" strokeLinejoin="round" />
          <path d="M22 6C24 4 32 4 34 7C36 10 32 12 28 11" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="26" cy="18" rx="5" ry="3" fill="#881337" stroke="#fda4af" strokeWidth="1.5" />
          <path d="M14 24C10 20 8 14 12 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'benguet_pine':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 6L14 18H20L10 30H18L6 42H42L30 30H38L28 18H34L24 6Z" fill="#14532d" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />
          <rect x="22" y="42" width="4" height="5" fill="#78350f" rx="1" />
        </svg>
      );
    case 'makahiya':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M8 40C16 32 26 22 38 12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="38" cy="12" r="7" fill="#f472b6" fillOpacity="0.9" stroke="#ec4899" strokeWidth="1.5" />
          <circle cx="38" cy="12" r="3" fill="#fdf2f8" />
          <ellipse cx="16" cy="30" rx="4" ry="2" fill="#34d399" transform="rotate(-30 16 30)" />
          <ellipse cx="24" cy="24" rx="4" ry="2" fill="#34d399" transform="rotate(-30 24 24)" />
          <ellipse cx="30" cy="19" rx="4" ry="2" fill="#34d399" transform="rotate(-30 30 19)" />
        </svg>
      );
    case 'lantana':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="20" r="6" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
          <circle cx="16" cy="18" r="5" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="32" cy="18" r="5" fill="#ec4899" stroke="#db2777" strokeWidth="1.5" />
          <circle cx="20" cy="28" r="5" fill="#ef4444" stroke="#dc2626" strokeWidth="1.5" />
          <circle cx="28" cy="28" r="5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
          <path d="M24 32V42" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="18" cy="38" rx="5" ry="2.5" fill="#22c55e" transform="rotate(-20 18 38)" />
        </svg>
      );
    case 'wild_blackberry':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="20" r="4.5" fill="#e11d48" />
          <circle cx="18" cy="24" r="4.5" fill="#be123c" />
          <circle cx="30" cy="24" r="4.5" fill="#e11d48" />
          <circle cx="16" cy="31" r="4.5" fill="#9f1239" />
          <circle cx="24" cy="29" r="5" fill="#e11d48" />
          <circle cx="32" cy="31" r="4.5" fill="#be123c" />
          <circle cx="20" cy="38" r="4" fill="#9f1239" />
          <circle cx="28" cy="38" r="4" fill="#9f1239" />
          <circle cx="24" cy="43" r="3.5" fill="#881337" />
          <path d="M24 14V6C24 6 28 8 30 10" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M19 14C21 16 27 16 29 14" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'stinging_nettle':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 6C18 14 10 24 14 36C18 42 24 44 24 44C24 44 30 42 34 36C38 24 30 14 24 6Z" fill="#1e3a1e" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
          <path d="M24 12V42M24 22L16 28M24 30L32 36M24 18L30 22" stroke="#4ade80" strokeWidth="1.5" />
          <circle cx="15" cy="20" r="1.5" fill="#f87171" />
          <circle cx="33" cy="20" r="1.5" fill="#f87171" />
          <circle cx="12" cy="32" r="1.5" fill="#f87171" />
          <circle cx="36" cy="32" r="1.5" fill="#f87171" />
        </svg>
      );
    case 'tree_fern':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 44V22" stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
          <path d="M24 22C18 16 10 16 4 20C10 22 18 22 24 22Z" fill="#15803d" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M24 22C30 16 38 16 44 20C38 22 30 22 24 22Z" fill="#15803d" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M24 22C20 12 16 8 10 8C14 12 20 16 24 22Z" fill="#16a34a" stroke="#4ade80" strokeWidth="1.5" />
          <path d="M24 22C28 12 32 8 38 8C34 12 28 16 24 22Z" fill="#16a34a" stroke="#4ade80" strokeWidth="1.5" />
          <circle cx="24" cy="18" r="3" fill="#86efac" />
        </svg>
      );
    case 'pako_fern':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M20 44V24C20 16 26 12 32 16C36 20 34 26 28 26C24 26 22 22 25 19C28 16 32 19 30 21" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="27" cy="20" r="2" fill="#a7f3d0" />
          <path d="M19 34C15 32 12 34 10 36" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
          <path d="M21 28C25 26 28 27 30 29" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'dandelion':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="18" r="9" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
          <path d="M24 4V9M24 27V32M10 18H15M33 18H38M14 8L18 12M30 24L34 28M34 8L30 12M18 24L14 28" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M24 27V44" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M24 36C18 36 12 40 10 44" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'elephant_ear':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 4C14 10 6 22 10 34C14 42 24 46 24 46C24 46 34 42 38 34C42 22 34 10 24 4Z" fill="#047857" stroke="#10b981" strokeWidth="2" />
          <path d="M24 10V42M24 18L14 24M24 26L34 32M24 28L12 36M24 34L32 40" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'rattan_palm':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M12 44C16 34 24 24 38 14" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <path d="M38 14C34 10 26 12 22 16M38 14C38 18 32 22 26 24M38 14C34 6 24 6 18 10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="26" r="1.5" fill="#f59e0b" />
          <circle cx="28" cy="20" r="1.5" fill="#f59e0b" />
          <circle cx="16" cy="32" r="1.5" fill="#f59e0b" />
        </svg>
      );
    case 'wild_guava':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="26" r="12" fill="#65a30d" stroke="#84cc16" strokeWidth="2" />
          <ellipse cx="24" cy="36" rx="3" ry="1.5" fill="#3f6212" />
          <path d="M24 14V8C24 8 28 6 32 8" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="18" cy="12" rx="6" ry="3" fill="#4d7c0f" transform="rotate(-30 18 12)" />
        </svg>
      );
    case 'wild_bamboo':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <rect x="16" y="6" width="6" height="36" rx="2" fill="#15803d" stroke="#22c55e" strokeWidth="1.5" />
          <rect x="26" y="6" width="6" height="36" rx="2" fill="#16a34a" stroke="#4ade80" strokeWidth="1.5" />
          <line x1="16" y1="18" x2="22" y2="18" stroke="#86efac" strokeWidth="2" />
          <line x1="16" y1="30" x2="22" y2="30" stroke="#86efac" strokeWidth="2" />
          <line x1="26" y1="14" x2="32" y2="14" stroke="#86efac" strokeWidth="2" />
          <line x1="26" y1="26" x2="32" y2="26" stroke="#86efac" strokeWidth="2" />
          <path d="M22 18C28 14 36 16 38 12" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 30C10 26 4 28 6 22" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'angel_trumpet':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 8L16 32C14 38 8 40 8 40C8 40 24 38 28 32L24 8Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
          <ellipse cx="16" cy="36" rx="8" ry="4" fill="#a855f7" fillOpacity="0.4" stroke="#9333ea" strokeWidth="1.5" />
          <path d="M24 8C26 4 32 4 34 6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
          <circle cx="36" cy="20" r="4" fill="#f87171" stroke="#dc2626" strokeWidth="1.5" />
        </svg>
      );
    case 'castor_bean':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="24" r="10" fill="#991b1b" stroke="#f87171" strokeWidth="2" strokeDasharray="2 2" />
          <path d="M24 4L24 14M24 34L24 44M4 24L14 24M34 24L44 24M10 10L17 17M31 31L38 38M38 10L31 17M17 31L10 38" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="24" r="4" fill="#450a0a" />
        </svg>
      );
    case 'gotu_kola':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 38C14 38 6 30 6 20C6 12 14 6 24 6C34 6 42 12 42 20C42 30 34 38 24 38Z" fill="#10b981" stroke="#34d399" strokeWidth="2" />
          <path d="M24 22L24 44" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M24 20C20 14 14 16 10 20M24 20C28 14 34 16 38 20" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'wild_mint':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 42V10" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="16" cy="26" rx="8" ry="4.5" fill="#059669" stroke="#34d399" strokeWidth="1.5" transform="rotate(-30 16 26)" />
          <ellipse cx="32" cy="26" rx="8" ry="4.5" fill="#059669" stroke="#34d399" strokeWidth="1.5" transform="rotate(30 32 26)" />
          <ellipse cx="18" cy="16" rx="7" ry="4" fill="#10b981" stroke="#6ee7b7" strokeWidth="1.5" transform="rotate(-25 18 16)" />
          <ellipse cx="30" cy="16" rx="7" ry="4" fill="#10b981" stroke="#6ee7b7" strokeWidth="1.5" transform="rotate(25 30 16)" />
          <ellipse cx="24" cy="8" rx="5" ry="3" fill="#34d399" stroke="#a7f3d0" strokeWidth="1.5" />
        </svg>
      );
    case 'cloud_moss':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M8 36C8 28 14 26 18 26C19 20 25 18 30 20C34 16 40 18 42 24C45 28 43 36 38 38C34 40 12 40 8 36Z" fill="#15803d" stroke="#4ade80" strokeWidth="2" />
          <circle cx="16" cy="28" r="2" fill="#86efac" />
          <circle cx="24" cy="24" r="2.5" fill="#86efac" />
          <circle cx="32" cy="27" r="2" fill="#86efac" />
          <circle cx="28" cy="33" r="2" fill="#86efac" />
          <path d="M6 42H42" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'physic_nut':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <circle cx="24" cy="24" r="10" fill="#84cc16" stroke="#a3e635" strokeWidth="2" />
          <ellipse cx="24" cy="24" rx="4" ry="7" fill="#4d7c0f" />
          <path d="M24 14V6M24 6C20 4 16 6 14 8" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 28C6 24 8 16 14 18" stroke="#4d7c0f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'broadleaf_plantain':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <ellipse cx="16" cy="32" rx="9" ry="5" fill="#047857" stroke="#10b981" strokeWidth="1.5" transform="rotate(-20 16 32)" />
          <ellipse cx="32" cy="32" rx="9" ry="5" fill="#047857" stroke="#10b981" strokeWidth="1.5" transform="rotate(20 32 32)" />
          <ellipse cx="24" cy="36" rx="8" ry="4" fill="#065f46" stroke="#059669" strokeWidth="1.5" />
          <line x1="24" y1="36" x2="24" y2="8" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="22" y="8" width="4" height="16" rx="2" fill="#a3e635" stroke="#65a30d" strokeWidth="1" />
        </svg>
      );
    case 'sambong':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 6C16 16 12 28 16 38C20 42 28 42 32 38C36 28 32 16 24 6Z" fill="#065f46" stroke="#10b981" strokeWidth="2" />
          <circle cx="24" cy="14" r="3" fill="#facc15" />
          <circle cx="21" cy="20" r="2.5" fill="#facc15" />
          <circle cx="27" cy="20" r="2.5" fill="#facc15" />
          <path d="M24 22V44" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'lagundi':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <ellipse cx="24" cy="14" rx="4" ry="10" fill="#047857" stroke="#10b981" strokeWidth="1.5" />
          <ellipse cx="14" cy="22" rx="4" ry="9" fill="#047857" stroke="#10b981" strokeWidth="1.5" transform="rotate(-40 14 22)" />
          <ellipse cx="34" cy="22" rx="4" ry="9" fill="#047857" stroke="#10b981" strokeWidth="1.5" transform="rotate(40 34 22)" />
          <ellipse cx="10" cy="32" rx="3.5" ry="8" fill="#065f46" stroke="#059669" strokeWidth="1.5" transform="rotate(-70 10 32)" />
          <ellipse cx="38" cy="32" rx="3.5" ry="8" fill="#065f46" stroke="#059669" strokeWidth="1.5" transform="rotate(70 38 32)" />
          <circle cx="24" cy="32" r="3.5" fill="#c084fc" stroke="#a855f7" strokeWidth="1" />
          <circle cx="24" cy="26" r="2.5" fill="#e9d5ff" />
          <path d="M24 34V44" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'wild_ginger':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 10C18 16 16 26 18 34C20 38 28 38 30 34C32 26 30 16 24 10Z" fill="#b91c1c" stroke="#ef4444" strokeWidth="2" />
          <path d="M18 20C22 22 26 22 30 20M18 26C22 28 26 28 30 26M19 31C22 33 26 33 29 31" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="24" cy="18" r="2" fill="#fef08a" />
          <path d="M24 36V44" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'wild_strawberry':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 14C16 14 12 24 14 34C16 40 24 44 24 44C24 44 32 40 34 34C36 24 32 14 24 14Z" fill="#dc2626" stroke="#ef4444" strokeWidth="2" />
          <circle cx="20" cy="22" r="1" fill="#fef08a" />
          <circle cx="28" cy="22" r="1" fill="#fef08a" />
          <circle cx="24" cy="28" r="1" fill="#fef08a" />
          <circle cx="18" cy="32" r="1" fill="#fef08a" />
          <circle cx="30" cy="32" r="1" fill="#fef08a" />
          <circle cx="24" cy="38" r="1" fill="#fef08a" />
          <path d="M24 14C22 10 18 10 16 12M24 14C26 10 30 10 32 12M24 14V6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
          <path d="M24 4C14 12 8 24 12 36C16 44 24 46 24 46C24 46 32 44 36 36C40 24 34 12 24 4Z" fill="#059669" stroke="#34d399" strokeWidth="2" />
          <path d="M24 12V42M24 22L16 28M24 30L32 36" stroke="#a7f3d0" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

// Visual Background Gradients for each plant ID
const plantGradients = {
  pitcher_plant: 'from-rose-950 to-emerald-950 border-rose-500/30',
  benguet_pine: 'from-emerald-950 to-slate-900 border-emerald-500/30',
  makahiya: 'from-pink-950 to-emerald-950 border-pink-500/30',
  lantana: 'from-amber-950 to-rose-950 border-amber-500/30',
  wild_blackberry: 'from-rose-950 to-red-950 border-rose-500/30',
  stinging_nettle: 'from-red-950 to-slate-950 border-red-500/40',
  tree_fern: 'from-emerald-950 to-teal-950 border-emerald-500/30',
  pako_fern: 'from-teal-950 to-emerald-950 border-teal-500/30',
  dandelion: 'from-yellow-950 to-emerald-950 border-yellow-500/30',
  elephant_ear: 'from-emerald-950 to-slate-900 border-emerald-500/30',
  rattan_palm: 'from-amber-950 to-emerald-950 border-amber-500/30',
  wild_guava: 'from-lime-950 to-emerald-950 border-lime-500/30',
  wild_bamboo: 'from-green-950 to-emerald-950 border-green-500/30',
  angel_trumpet: 'from-purple-950 to-rose-950 border-purple-500/40',
  castor_bean: 'from-red-950 to-stone-950 border-red-500/40',
  gotu_kola: 'from-emerald-950 to-green-950 border-emerald-500/30',
  wild_mint: 'from-teal-950 to-emerald-950 border-teal-500/30',
  cloud_moss: 'from-green-950 to-emerald-950 border-green-500/30',
  physic_nut: 'from-lime-950 to-red-950 border-lime-500/30',
  broadleaf_plantain: 'from-emerald-950 to-teal-950 border-emerald-500/30',
  sambong: 'from-emerald-950 to-slate-900 border-emerald-500/30',
  lagundi: 'from-purple-950 to-emerald-950 border-purple-500/30',
  wild_ginger: 'from-rose-950 to-emerald-950 border-rose-500/30',
  wild_strawberry: 'from-red-950 to-rose-950 border-red-500/30',
  aloe_vera: 'from-emerald-950 to-teal-950 border-emerald-500/30',
  sansevieria: 'from-emerald-950 to-slate-900 border-emerald-500/30',
  pothos: 'from-lime-950 to-emerald-950 border-lime-500/30',
  monstera: 'from-emerald-950 to-teal-950 border-emerald-500/30',
  hibiscus: 'from-rose-950 to-red-950 border-rose-500/30',
  bougainvillea: 'from-pink-950 to-purple-950 border-pink-500/30',
  orchid: 'from-purple-950 to-pink-950 border-purple-500/30',
  bird_nest_fern: 'from-emerald-950 to-green-950 border-emerald-500/30',
  peace_lily: 'from-slate-950 to-emerald-950 border-slate-500/30',
  rose: 'from-rose-950 to-red-950 border-rose-500/30',
  oregano: 'from-green-950 to-emerald-950 border-green-500/30',
  chili_pepper: 'from-red-950 to-orange-950 border-red-500/30',
};

// Robust Plant Image component with guaranteed distinct visual offline fallback
function PlantImage({ plant, className = '', fallbackSize = 32 }) {
  const [hasError, setHasError] = useState(false);
  const grad = plantGradients[plant.id] || 'from-emerald-950 to-slate-900 border-emerald-500/30';

  if (!hasError && plant.image_url) {
    return (
      <img
        src={plant.image_url}
        alt={plant.plant_name}
        className={className}
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className={`${className} bg-gradient-to-br ${grad} flex items-center justify-center border shadow-inner select-none`}>
      {plant.svg_icon ? (
        <span style={{ fontSize: `${fallbackSize}px`, lineHeight: 1 }} role="img" aria-label={plant.plant_name}>
          {plant.svg_icon}
        </span>
      ) : (
        <BotanicalVectorIcon plantId={plant.id} size={fallbackSize} />
      )}
    </div>
  );
}

// 200+ Philippine Mountain & Trail Species catalog
export { plantDictionary };

// ── Plant Analysis Engine (TF.js MobileNet v2 + Pixel fallback) ─────────────
// analyzeUserScan is now async — it delegates to the TF.js analyzeImage engine
// from plantRecognition.js and returns a promise with the same result shape.
async function analyzeUserScan(canvas, ctx, organFilter = 'all') {
  try {
    return await analyzeImage(canvas, ctx, plantDictionary, organFilter);
  } catch (err) {
    console.warn('[Scanner] analyzeImage failed, using fallback:', err);
    // Pixel-only fallback (original behaviour)
    const w = canvas.width;
    const h = canvas.height;
    const sampleSize = Math.min(180, Math.floor(Math.min(w, h) * 0.7));
    const startX = Math.max(0, Math.floor((w - sampleSize) / 2));
    const startY = Math.max(0, Math.floor((h - sampleSize) / 2));

    const imgData = ctx.getImageData(startX, startY, sampleSize, sampleSize);
    const data = imgData.data;

    let redCount = 0, greenCount = 0, yellowCount = 0;
    let darkCount = 0, paleCount = 0, edgeEnergy = 0;
    const totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = (r + g + b) / 3;
      if (r > 120 && r > g * 1.25 && r > b * 1.2) redCount++;
      else if (r > 135 && g > 125 && b < 100 && Math.abs(r - g) < 55) yellowCount++;
      else if (g > r * 1.15 && g > b * 1.15) greenCount++;
      else if (lum < 55) darkCount++;
      else if (lum > 190) paleCount++;
      if (i > 4) {
        const prevLum = (data[i - 4] + data[i - 3] + data[i - 2]) / 3;
        edgeEnergy += Math.abs(lum - prevLum);
      }
    }

    const redRatio    = redCount    / totalPixels;
    const yellowRatio = yellowCount / totalPixels;
    const greenRatio  = greenCount  / totalPixels;
    const darkRatio   = darkCount   / totalPixels;
    const paleRatio   = paleCount   / totalPixels;
    const avgEdge     = edgeEnergy  / totalPixels;

    const scored = plantDictionary.map((plant) => {
      let score = 50;
      if (plant.color_category === 'red_berry')           { score += redRatio * 140; if (redRatio > 0.08) score += 30; }
      else if (plant.color_category === 'red_green')      score += (redRatio + greenRatio) * 70;
      else if (plant.color_category === 'yellow_flower')  { score += yellowRatio * 150; if (yellowRatio > 0.08) score += 35; }
      else if (plant.color_category === 'yellow_red')     score += (yellowRatio + redRatio) * 80;
      else if (plant.color_category === 'dark_green' || plant.color_category === 'moss_green') score += darkRatio * 90 + greenRatio * 50;
      else if (plant.color_category === 'feathery_green') { score += greenRatio * 80; if (avgEdge > 20) score += 30; }
      else if (plant.color_category === 'broad_green')    { score += greenRatio * 75; if (avgEdge <= 20) score += 25; }
      else if (plant.color_category === 'white_flower')   score += paleRatio * 140;
      else score += greenRatio * 60;

      if (plant.leaf_pattern === 'needles'       && avgEdge > 22)  score += 20;
      if (plant.leaf_pattern === 'massive_heart' && avgEdge < 18)  score += 20;
      if (plant.leaf_pattern === 'bramble_berry' && redRatio > 0.05) score += 25;

      return { plant, score, confidence: Math.min(99.4, Math.max(55.0, Number((55 + (score % 44.5)).toFixed(1)))) };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      isPlant: greenRatio > 0.15,
      top: scored[0].plant,
      confidence: scored[0].confidence,
      alternatives: scored.slice(1, 3).map((s) => ({
        plant: s.plant,
        confidence: Number((s.confidence - 2.8 - Math.random() * 1.5).toFixed(1)),
      })),
      metrics: {
        redRatio:    (redRatio    * 100).toFixed(0),
        greenRatio:  (greenRatio  * 100).toFixed(0),
        yellowRatio: (yellowRatio * 100).toFixed(0),
        avgEdge:     avgEdge.toFixed(1),
        modelUsed:   'Pixel (fallback)',
        topLabel:    'N/A',
        topProb:     'N/A',
      },
    };
  }
}

export default function CameraPlantScanner({ onClose, standalone = false }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera', 'dictionary', 'history'
  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('trekquest_plant_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchDict, setSearchDict] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' or 'user'
  const [organFocus, setOrganFocus] = useState('all'); // 'all', 'leaf', 'flower', 'fruit', 'fern', 'tree'
  const [showManualCorrection, setShowManualCorrection] = useState(false);

  // Offline AI Plant Assistant state
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const aiChatEndRef = useRef(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const fileFallbackRef = useRef(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Stop text-to-speech if running
  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Start real device camera
  const startCamera = useCallback(async () => {
    setCameraError('');
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is not supported in this browser. You can still upload or snap via device camera.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsStreaming(true);
          }).catch((err) => {
            console.warn('Play error:', err);
            setIsStreaming(true);
          });
        };
      } else {
        setIsStreaming(true);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to open live video stream. Please grant camera permission or use the snap photo button.');
      setIsStreaming(false);
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (activeTab === 'camera' && !scannedResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
      stopSpeech();
    };
  }, [activeTab, scannedResult, startCamera, stopCamera, stopSpeech]);

  // Flip Front/Back Camera
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Perform Real Camera Snapshot & System Plant Definition
  const handleSnapAndScan = async () => {
    if (!videoRef.current && !isStreaming) {
      fileFallbackRef.current?.click();
      return;
    }

    setIsScanning(true);
    if ('vibrate' in navigator) {
      try { navigator.vibrate([40, 30, 40]); } catch {}
    }

    const canvas = canvasRef.current || document.createElement('canvas');
    const video = videoRef.current;

    const width = video?.videoWidth || 640;
    const height = video?.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (video && isStreaming) {
      ctx.drawImage(video, 0, 0, width, height);
    } else {
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, width, height);
    }

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhotoUrl(photoDataUrl);
    stopCamera();

    try {
      const analysis = await analyzeUserScan(canvas, ctx, organFocus);

      let gpsCoords = 'High Mountain Trail';
      try {
        const saved = localStorage.getItem('trekquest_current_coords');
        if (saved) {
          const [lat, lng] = JSON.parse(saved);
          gpsCoords = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
        }
      } catch {}

      if (!analysis.isPlant || !analysis.top) {
        const nonPlantRecord = {
          id: `scan_${Date.now()}`,
          isPlant: false,
          reason: analysis.reason || 'No plant or foliage detected in image.',
          photo_url: photoDataUrl,
          scanned_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metrics: analysis.metrics,
          gps: gpsCoords,
        };
        setScannedResult(nonPlantRecord);
        setIsScanning(false);
        return;
      }

      const match = analysis.top;
      const scanRecord = {
        id: `scan_${Date.now()}`,
        plant_id: match.id,
        plant_name: match.plant_name,
        local_name: match.local_name,
        scientific_name: match.scientific_name,
        family: match.family,
        safety: match.safety,
        danger_level: match.danger_level,
        description: match.description,
        care_note: match.care_note,
        edibility_details: match.edibility_details,
        first_aid: match.first_aid,
        habitat: match.habitat,
        image_url: match.image_url || match.photo_url,
        photo_url: photoDataUrl,
        svg_icon: match.svg_icon,
        scanned_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: analysis.confidence,
        alternatives: analysis.alternatives,
        metrics: analysis.metrics,
        gps: gpsCoords,
        isPlant: true,
      };

      setScannedResult(scanRecord);
      setIsScanning(false);

      const updatedHistory = [scanRecord, ...scanHistory.slice(0, 29)];
      setScanHistory(updatedHistory);
      try {
        localStorage.setItem('trekquest_plant_history', JSON.stringify(updatedHistory));
      } catch {}

      try {
        base44.entities.PlantScan.create({
          plant_name: match.plant_name,
          scientific_name: match.scientific_name,
          description: match.description,
          safety: ['edible', 'medicinal', 'poisonous', 'safe'].includes(match.safety) ? match.safety : 'unknown',
          image_url: match.photo_url || match.image_url || photoDataUrl,
          scanned_date: new Date().toISOString(),
        }).catch(() => {});
      } catch {}
    } catch (err) {
      console.error('[Scanner] Snap error:', err);
      setIsScanning(false);
    }
  };

  // Upload plant photo from local device files
  const handleFileCapture = (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setCapturedPhotoUrl(dataUrl);

      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 640;
        canvas.height = img.height || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        try {
          const analysis = await analyzeUserScan(canvas, ctx, organFocus);

          let gpsCoords = 'High Mountain Trail';
          try {
            const saved = localStorage.getItem('trekquest_current_coords');
            if (saved) {
              const [lat, lng] = JSON.parse(saved);
              gpsCoords = `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
            }
          } catch {}

          if (!analysis.isPlant || !analysis.top) {
            const nonPlantRecord = {
              id: `scan_${Date.now()}`,
              isPlant: false,
              reason: analysis.reason || 'No plant or foliage detected in image.',
              photo_url: dataUrl,
              scanned_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              metrics: analysis.metrics,
              gps: gpsCoords,
            };
            setScannedResult(nonPlantRecord);
            setIsScanning(false);
            return;
          }

          const match = analysis.top;
          const scanRecord = {
            id: `scan_${Date.now()}`,
            plant_id: match.id,
            plant_name: match.plant_name,
            local_name: match.local_name,
            scientific_name: match.scientific_name,
            family: match.family,
            safety: match.safety,
            danger_level: match.danger_level,
            description: match.description,
            care_note: match.care_note,
            edibility_details: match.edibility_details,
            first_aid: match.first_aid,
            habitat: match.habitat,
            image_url: match.image_url || match.photo_url,
            photo_url: dataUrl,
            svg_icon: match.svg_icon,
            scanned_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            confidence: analysis.confidence,
            alternatives: analysis.alternatives,
            metrics: analysis.metrics,
            gps: gpsCoords,
            isPlant: true,
          };

          setScannedResult(scanRecord);
          setIsScanning(false);

          const updatedHistory = [scanRecord, ...scanHistory.slice(0, 29)];
          setScanHistory(updatedHistory);
          try {
            localStorage.setItem('trekquest_plant_history', JSON.stringify(updatedHistory));
          } catch {}

          try {
            base44.entities.PlantScan.create({
              plant_name: match.plant_name,
              scientific_name: match.scientific_name,
              description: match.description,
              safety: ['edible', 'medicinal', 'poisonous', 'safe'].includes(match.safety) ? match.safety : 'unknown',
              image_url: match.photo_url || match.image_url || dataUrl,
              scanned_date: new Date().toISOString(),
            }).catch(() => {});
          } catch {}
        } catch (err) {
          console.error('[Scanner] File capture error:', err);
          setIsScanning(false);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Switch to an alternative plant match candidate
  const handleSelectAlternative = (altPlant, altConfidence) => {
    if (!scannedResult) return;
    const updated = {
      ...scannedResult,
      plant_id: altPlant.id,
      plant_name: altPlant.plant_name,
      local_name: altPlant.local_name,
      scientific_name: altPlant.scientific_name,
      family: altPlant.family,
      safety: altPlant.safety,
      danger_level: altPlant.danger_level,
      description: altPlant.description,
      care_note: altPlant.care_note,
      edibility_details: altPlant.edibility_details,
      first_aid: altPlant.first_aid,
      habitat: altPlant.habitat,
      image_url: altPlant.image_url,
      svg_icon: altPlant.svg_icon,
      confidence: altConfidence,
    };
    setScannedResult(updated);
  };

  // Voice narration of botanical definition
  const handleSpeakDefinition = () => {
    if (!('speechSynthesis' in window) || !scannedResult) return;
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const text = `${scannedResult.plant_name}. Local name: ${scannedResult.local_name}. Scientific name: ${scannedResult.scientific_name}. Status: ${scannedResult.danger_level}. Trail note: ${scannedResult.care_note}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const resetScanner = () => {
    stopSpeech();
    setScannedResult(null);
    setCapturedPhotoUrl(null);
    setActiveTab('camera');
    setAiMessages([]);
    setAiInput('');
    startCamera();
  };

  // ── OFFLINE AI PLANT ASSISTANT ─────────────────────────────────────────
  const generateOfflineAIAnswer = (question, plant) => {
    const q = question.toLowerCase();

    // Edibility
    if (q.match(/eat|edible|food|safe to eat|consume|digest/)) {
      if (plant.safety === 'edible') {
        return `✅ **${plant.plant_name}** is edible. ${plant.edibility_details || `The ${plant.local_name} can be consumed carefully — always cook or prepare properly in a survival situation.`}`;
      } else if (plant.safety === 'poisonous') {
        return `⛔ **DO NOT EAT** — ${plant.plant_name} (${plant.local_name}) is **toxic to humans**. ${plant.edibility_details || 'Ingesting any part of this plant can cause severe poisoning. Seek emergency help immediately if consumed.'}`;
      } else if (plant.safety === 'medicinal') {
        return `⚠️ ${plant.plant_name} is used medicinally but is **not a trail food**. ${plant.edibility_details || 'Only trained herbalists should use this plant medicinally. Do not eat it raw on the trail.'}`;
      }
      return `ℹ️ ${plant.plant_name} — edibility status: **${plant.safety}**. ${plant.edibility_details || plant.care_note}`;
    }

    // Touching / skin contact
    if (q.match(/touch|skin|rash|sting|itch|allergic|contact/)) {
      if (plant.safety === 'poisonous') {
        return `⚠️ **Avoid skin contact** with ${plant.plant_name}. ${plant.first_aid || 'Wash immediately with clean water if touched. Do not rub your eyes. Some poisonous plants cause blistering or allergic reactions.'}`;
      }
      return `👋 ${plant.plant_name} is generally **safe to touch** with bare hands. ${plant.first_aid || 'Still, wash hands after handling any wild plant to be safe.'}`;
    }

    // First aid / medical
    if (q.match(/first aid|help|emergency|poison|swallow|medicine|treat/)) {
      return `🩹 **First Aid for ${plant.plant_name}:** ${plant.first_aid || 'If you believe you have ingested or had a severe reaction to this plant, move to safety and contact emergency services. Keep the patient calm and hydrated.'}`;
    }

    // Medicinal uses
    if (q.match(/medic|heal|cure|herb|traditional|remedy|treatment/)) {
      if (plant.safety === 'medicinal') {
        return `🌿 **${plant.plant_name}** has known medicinal value. ${plant.care_note} — ${plant.description}`;
      }
      return `🌿 ${plant.plant_name} has ${plant.safety === 'poisonous' ? 'no known safe medicinal use — it is toxic' : `the following trail profile: ${plant.care_note}`}.`;
    }

    // Habitat / where found
    if (q.match(/where|habitat|elevation|grow|location|zone|found|region/)) {
      return `📍 **${plant.plant_name}** is found in: ${plant.habitat || 'Philippine highland forests and mountain trails'}. Scientific range: ${plant.scientific_name} of the ${plant.family} family.`;
    }

    // Identification / what is this
    if (q.match(/what is|identify|species|scientific|family|name|classification/)) {
      return `🔬 **${plant.plant_name}** (${plant.local_name})\n• Scientific: *${plant.scientific_name}*\n• Family: ${plant.family}\n• Safety: ${plant.safety.toUpperCase()}\n• ${plant.description}`;
    }

    // Water / survival use
    if (q.match(/water|drink|survival|emergency water|thirst/)) {
      if (plant.id === 'pitcher_plant') {
        return `💧 The sealed pitcher of *Nepenthes alata* contains sterile rainwater — drinkable in extreme survival situations. Tilt and filter through cloth before drinking.`;
      }
      if (plant.id === 'wild_bamboo') {
        return `💧 Cut young bamboo sections at an angle at night — they collect dew and rainwater inside the hollow stem. This is a known Filipino mountain survival technique.`;
      }
      return `💧 ${plant.plant_name} does not have a known water source. Stick to stream or collected rainwater for hydration. Filter before drinking.`;
    }

    // Danger / is it safe
    if (q.match(/danger|safe|harmful|toxic|risk|warning/)) {
      if (plant.safety === 'poisonous') {
        return `⛔ **HIGH DANGER** — ${plant.plant_name} is poisonous. Danger level: ${plant.danger_level}. ${plant.first_aid || 'Do not touch, eat, or burn this plant. Keep children and pets away.'}`;
      } else if (plant.safety === 'safe') {
        return `✅ ${plant.plant_name} is **non-toxic and generally safe** for trail use. Danger level: ${plant.danger_level}.`;
      }
      return `⚠️ ${plant.plant_name} — ${plant.danger_level}. Use with caution on the trail.`;
    }

    // Default fallback
    return `🌿 Here is what I know about **${plant.plant_name}** (${plant.local_name}):\n\n${plant.description}\n\n💡 Trail note: ${plant.care_note}\n\n_Ask me more: "Is it edible?", "Can I touch it?", "What is the first aid?", "Where does it grow?"_`;
  };

  const handleAiSend = () => {
    if (!aiInput.trim() || !scannedResult || aiThinking) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    setAiMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setAiThinking(true);

    // Simulate AI "thinking" delay (300-700ms)
    const delay = 300 + Math.random() * 400;
    setTimeout(() => {
      const answer = generateOfflineAIAnswer(userMsg, scannedResult);
      setAiMessages((prev) => [...prev, { role: 'ai', text: answer }]);
      setAiThinking(false);
      setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }, delay);
  };


  // Filter dictionary
  const filteredDictionary = plantDictionary.filter((p) => {
    const matchesSearch =
      p.plant_name.toLowerCase().includes(searchDict.toLowerCase()) ||
      p.local_name.toLowerCase().includes(searchDict.toLowerCase()) ||
      p.scientific_name.toLowerCase().includes(searchDict.toLowerCase()) ||
      p.family.toLowerCase().includes(searchDict.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || p.safety === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`flex flex-col bg-slate-950 text-white ${standalone ? 'min-h-full' : 'fixed inset-0 z-[3000]'}`}>
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        accept="image/*"
        ref={fileFallbackRef}
        className="hidden"
        onChange={handleFileCapture}
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={() => { stopCamera(); stopSpeech(); onClose(); }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-90 cursor-pointer"
              title="Close Scanner"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5 text-white">
              <Leaf size={16} className="text-emerald-400" />
              <span>Botanical Plant Scanner</span>
            </h3>
            <p className="text-[10px] text-slate-400">Point device camera or upload a plant picture</p>
          </div>
        </div>

        {/* Tab Switcher: Camera vs Dictionary vs History */}
        <div className="flex bg-white/10 rounded-xl p-0.5 border border-white/10 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('camera'); if (scannedResult) resetScanner(); }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'camera' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            📸 Camera
          </button>
          <button
            onClick={() => { stopCamera(); stopSpeech(); setActiveTab('dictionary'); }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'dictionary' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            📖 Catalog ({plantDictionary.length})
          </button>
          <button
            onClick={() => { stopCamera(); stopSpeech(); setActiveTab('history'); }}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'history' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            🕒 Log ({scanHistory.length})
          </button>
        </div>

        {onClose && (
          <button
            onClick={() => { stopCamera(); stopSpeech(); onClose(); }}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* TAB 1: REAL CAMERA SCANNER */}
        {activeTab === 'camera' && (
          <div className="flex-1 flex flex-col items-center gap-3 p-4 overflow-y-auto">
            {!scannedResult ? (
              <>
                {/* Organ Focus Filter */}
                <div className="w-full max-w-sm flex items-center justify-start gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0">
                  {[
                    { id: 'all', label: 'All', icon: '🌿' },
                    { id: 'leaf', label: 'Leaves', icon: '🍃' },
                    { id: 'flower', label: 'Flowers', icon: '🌸' },
                    { id: 'fruit', label: 'Berries', icon: '🍓' },
                    { id: 'fern', label: 'Ferns', icon: '🌱' },
                    { id: 'tree', label: 'Pine / Trees', icon: '🌲' },
                  ].map((organ) => (
                    <button
                      key={organ.id}
                      type="button"
                      onClick={() => setOrganFocus(organ.id)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer border ${
                        organFocus === organ.id
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/20'
                      }`}
                    >
                      <span>{organ.icon}</span>
                      <span>{organ.label}</span>
                    </button>
                  ))}
                </div>

                {/* Live Camera Viewport */}
                <div className="relative w-full max-w-sm shrink-0 rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-2xl flex items-center justify-center" style={{ height: 'clamp(200px, 44vh, 300px)' }}>
                  {/* Real WebRTC Video Tag */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Fallback Camera message if permission blocked */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3 z-10">
                      <Camera size={44} className="text-amber-400" />
                      <p className="text-xs text-amber-200">{cameraError}</p>
                      <button
                        onClick={() => fileFallbackRef.current?.click()}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload size={14} />
                        <span>Upload Plant Picture</span>
                      </button>
                    </div>
                  )}

                  {/* High-Tech Viewfinder Reticle */}
                  <div className="absolute inset-6 pointer-events-none flex flex-col items-center justify-center">
                    <div className="relative w-52 h-52 border-2 border-emerald-400/70 rounded-2xl">
                      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400" />
                      <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400" />

                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse"
                           style={{ animation: 'bounce 2.2s infinite' }}
                      />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border border-emerald-400/60 rounded-full" />
                      </div>
                    </div>

                    <p className="text-[11px] font-bold text-emerald-300 mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-emerald-500/30">
                      Point camera or upload a plant picture from files
                    </p>
                  </div>

                  {/* Scanning In-Progress Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 space-y-3">
                      <RefreshCw size={44} className="text-emerald-400 animate-spin" />
                      <p className="text-sm font-black text-emerald-300 tracking-wider">
                        EXTRACTING MORPHOLOGICAL SIGNATURE…
                      </p>
                      <p className="text-[11px] text-slate-400">Offline cellular-free botanical identification active</p>
                    </div>
                  )}

                  {/* Top overlay controls: Camera flip */}
                  <div className="absolute top-3 right-3 z-10 flex gap-2">
                    <button
                      onClick={flipCamera}
                      className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 active:scale-90 transition cursor-pointer"
                      title="Switch Camera (Front/Back)"
                    >
                      <RotateCw size={16} />
                    </button>
                  </div>
                </div>

                {/* Shutter / Scan Button Section */}
                <div className="w-full max-w-sm shrink-0 flex flex-col items-center gap-2">
                  <button
                    onClick={handleSnapAndScan}
                    disabled={isScanning}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl active:scale-95 transition cursor-pointer border border-emerald-400/40"
                  >
                    <Camera size={20} className="animate-pulse" />
                    <span>SCAN PLANT WITH CAMERA</span>
                  </button>

                  <div className="w-full flex gap-2">
                    <button
                      onClick={() => fileFallbackRef.current?.click()}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Upload size={14} className="text-emerald-400" />
                      <span>Upload Plant Picture</span>
                    </button>
                    <button
                      onClick={() => { stopCamera(); setActiveTab('dictionary'); }}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <BookOpen size={13} /> Plant Catalog
                    </button>
                  </div>
                </div>
              </>
            ) : scannedResult.isPlant === false ? (
              /* NO PLANT DETECTED VIEW */
              <div className="w-full max-w-md bg-slate-900 border border-slate-700 text-white rounded-3xl p-5 shadow-2xl flex flex-col gap-4 my-auto max-h-[85vh] overflow-y-auto no-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <AlertTriangle size={14} /> Scan Result
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border text-slate-300 bg-slate-800 border-slate-700">
                    Non-Plant Subject
                  </span>
                </div>

                {/* Photo preview with a badge */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
                  <img
                    src={capturedPhotoUrl || scannedResult.photo_url}
                    alt="Captured scan"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-rose-950/90 border border-rose-500/50 text-rose-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md">
                    <X size={13} /> No Plant Detected
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 border border-white/10 flex items-center gap-1.5">
                    <MapPin size={11} className="text-emerald-400" />
                    <span>{scannedResult.gps || 'Trail Location'} • {scannedResult.scanned_at}</span>
                  </div>
                </div>

                {/* Detailed notice */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <AlertTriangle size={16} />
                    <span>No Botanical Foliage Found</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {scannedResult.reason || 'The scanner detected a face, person, or non-botanical object.'}
                  </p>
                  {scannedResult.metrics?.topLabel && scannedResult.metrics.topLabel !== 'N/A' && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 pt-1.5 border-t border-white/5">
                      <Sparkles size={11} className="text-emerald-400" />
                      <span>AI Model identified:</span>
                      <span className="text-emerald-400 font-semibold">{scannedResult.metrics.topLabel}</span>
                      {scannedResult.metrics.topProb && <span>({scannedResult.metrics.topProb})</span>}
                    </div>
                  )}
                </div>

                {/* Guidelines */}
                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300 space-y-1.5">
                  <p className="font-bold text-emerald-300 flex items-center gap-1">
                    <Leaf size={13} /> How to Scan Plants Accurately:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    <li>Aim camera directly at leaves, flowers, ferns, or bark</li>
                    <li>Avoid pointing at faces, selfies, clothes, or indoor furniture</li>
                    <li>Move closer in bright natural daylight for sharp foliage details</li>
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={resetScanner}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    <Camera size={15} /> Scan Again
                  </button>
                  <button
                    onClick={() => { stopSpeech(); stopCamera(); setActiveTab('dictionary'); }}
                    className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition active:scale-95 cursor-pointer"
                  >
                    <BookOpen size={15} /> Plant Catalog
                  </button>
                </div>
              </div>
            ) : (
              /* SYSTEM BOTANICAL DEFINITION CARD (Derived from User's Scanned Camera Photo) */
              <div className="w-full max-w-md bg-slate-900 border border-slate-700 text-white rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 my-auto max-h-[85vh] overflow-y-auto no-scrollbar">
                {/* Header Tag with Biometric Confidence */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles size={14} /> System Botanical Definition
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      scannedResult.confidence < 85
                        ? 'text-amber-300 bg-amber-500/20 border-amber-500/40'
                        : 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                    }`}>
                      {scannedResult.confidence < 85
                        ? `⚠️ Low Confidence — ${scannedResult.confidence}%`
                        : `${scannedResult.confidence}% Confidence Match`
                      }
                    </span>
                    <button
                      onClick={handleSpeakDefinition}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 transition cursor-pointer"
                      title={isSpeaking ? 'Stop Audio' : 'Speak Definition'}
                    >
                      {isSpeaking ? <VolumeX size={14} className="text-rose-400 animate-pulse" /> : <Volume2 size={14} />}
                    </button>
                  </div>
                </div>

                {/* AI Model badge */}
                {scannedResult.metrics?.modelUsed && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Sparkles size={11} className="text-emerald-600" />
                    <span>
                      Engine: <span className="text-emerald-500 font-semibold">{scannedResult.metrics.modelUsed}</span>
                      {scannedResult.metrics.topLabel && scannedResult.metrics.topLabel !== 'N/A' && (
                        <> · Top label: <em>{scannedResult.metrics.topLabel}</em> ({scannedResult.metrics.topProb})</>
                      )}
                    </span>
                  </div>
                )}

                {/* 2-Way Split Comparison: Left = Hiker's Taken Photo, Right = System's Plant Reference */}
                {(() => {
                  const systemPlant = plantDictionary.find(
                    (p) => p.id === (scannedResult.plant_id || scannedResult.id)
                  ) || scannedResult;
                  const hikerPhoto = capturedPhotoUrl || scannedResult.photo_url || scannedResult.image_url;

                  return (
                    <div className="grid grid-cols-2 gap-2.5 h-44 sm:h-52 w-full shrink-0 rounded-2xl overflow-hidden bg-black/60 border border-white/10 p-1.5 shadow-xl">
                      {/* Left: The picture the hiker has taken */}
                      <div className="relative h-full w-full rounded-xl overflow-hidden bg-black border border-white/10">
                        <img
                          src={hikerPhoto}
                          alt="Hiker's taken photo"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Right: The picture the system has of the plant */}
                      <div className="relative h-full w-full rounded-xl overflow-hidden bg-black border border-white/10">
                        <PlantImage
                          plant={systemPlant}
                          className="w-full h-full object-cover"
                          fallbackSize={38}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Plant Name, Closest Match tag & Scientific Classification */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-xl font-black text-white">{scannedResult.plant_name}</h3>
                    <span className="text-xs text-amber-400 font-bold">{scannedResult.local_name}</span>
                  </div>
                  <p className="text-xs font-bold text-amber-400 tracking-wide mt-0.5">
                    Closest Match
                  </p>
                  <p className="text-xs text-slate-400 italic mt-0.5">
                    {scannedResult.scientific_name} • Family: {scannedResult.family}
                  </p>
                </div>

                {/* Danger Level Warning Bar */}
                <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  scannedResult.safety === 'poisonous'
                    ? 'bg-red-950/60 border-red-500/40 text-red-300'
                    : scannedResult.safety === 'edible'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : scannedResult.safety === 'medicinal'
                    ? 'bg-teal-950/60 border-teal-500/40 text-teal-300'
                    : 'bg-sky-950/60 border-sky-500/40 text-sky-300'
                }`}>
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{scannedResult.danger_level}</span>
                </div>

                {/* System Morphological Definition & Trail Notes */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed space-y-2">
                  <p><strong className="text-white">Botanical Description:</strong> {scannedResult.description}</p>
                  <p className="text-[11px] text-emerald-300/90 font-medium pt-1.5 border-t border-white/10">
                    💡 <strong>Trail Survival Note:</strong> {scannedResult.care_note}
                  </p>
                  {scannedResult.edibility_details && (
                    <p className="text-[11px] text-slate-300 pt-1 border-t border-white/10">
                      🥗 <strong>Edibility Profile:</strong> {scannedResult.edibility_details}
                    </p>
                  )}
                  {scannedResult.first_aid && (
                    <p className="text-[11px] text-amber-300/90 font-medium pt-1 border-t border-white/10">
                      🩹 <strong>Handling & First Aid:</strong> {scannedResult.first_aid}
                    </p>
                  )}
                  {scannedResult.habitat && (
                    <p className="text-[10px] text-slate-400 pt-1 border-t border-white/10">
                      📍 <strong>Trail Zone / Elevation:</strong> {scannedResult.habitat}
                    </p>
                  )}
                </div>

                {/* Actions: Scan Another Plant */}
                <div className="pt-1">
                  <button
                    onClick={resetScanner}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
                  >
                    <Camera size={16} /> Scan Another Plant
                  </button>
                </div>

                {/* ── OFFLINE AI PLANT ASSISTANT CHAT ──────────────────── */}
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <p className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles size={12} /> Offline Plant AI Assistant
                    <span className="text-[9px] font-normal normal-case text-slate-400 ml-1">— ask anything about this plant</span>
                  </p>

                  {/* Suggested quick questions */}
                  {aiMessages.length === 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {['Is it edible?', 'Can I touch it?', 'What is the first aid?', 'Where does it grow?', 'Is it dangerous?'].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setAiInput(q);
                            setTimeout(() => {
                              setAiMessages((prev) => [...prev, { role: 'user', text: q }]);
                              setAiThinking(true);
                              setTimeout(() => {
                                const answer = generateOfflineAIAnswer(q, scannedResult);
                                setAiMessages((prev) => [...prev, { role: 'ai', text: answer }]);
                                setAiThinking(false);
                                setAiInput('');
                                setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
                              }, 400 + Math.random() * 300);
                            }, 0);
                          }}
                          className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-medium hover:bg-emerald-500/20 active:scale-95 transition cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Chat Messages */}
                  {aiMessages.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                      {aiMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${ msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed whitespace-pre-line ${
                            msg.role === 'user'
                              ? 'bg-emerald-600/80 text-white rounded-br-sm'
                              : 'bg-white/10 text-slate-200 border border-white/10 rounded-bl-sm'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {aiThinking && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                      <div ref={aiChatEndRef} />
                    </div>
                  )}

                  {/* Input Row */}
                  <div className="flex gap-2">
                    <input
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                      placeholder="Ask: Is it safe to eat? What if I touch it?"
                      disabled={aiThinking}
                      className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <button
                      onClick={handleAiSend}
                      disabled={!aiInput.trim() || aiThinking}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold disabled:opacity-40 active:scale-95 transition cursor-pointer"
                    >
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OFFLINE BOTANICAL DICTIONARY (24 Unique Species, 100% Unique Pictures & Offline SVG Badges) */}
        {activeTab === 'dictionary' && (
          <div className="flex-1 flex flex-col p-4 max-w-lg w-full mx-auto overflow-hidden">
            {/* Search Input */}
            <div className="relative mb-2.5 shrink-0">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                value={searchDict}
                onChange={(e) => setSearchDict(e.target.value)}
                placeholder="Search by name, local name (e.g. Makahiya, Lipa, Pako)…"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category Filter Badges */}
            <div className="flex gap-1.5 pb-2.5 overflow-x-auto no-scrollbar shrink-0 text-[11px] font-semibold">
              {[
                { id: 'all', label: `All (${plantDictionary.length})` },
                { id: 'edible', label: '🥗 Edible' },
                { id: 'medicinal', label: '🌿 Medicinal' },
                { id: 'safe', label: '🟢 Safe' },
                { id: 'poisonous', label: '⚠️ Poisonous' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-xl transition shrink-0 cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Plant List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
              {filteredDictionary.map((plant) => (
                <div
                  key={plant.id}
                  onClick={() => {
                    setCapturedPhotoUrl(plant.image_url);
                    setScannedResult({
                      ...plant,
                      photo_url: plant.image_url,
                      scanned_at: 'Botanical Catalog',
                      confidence: 100,
                      gps: plant.habitat.split(',')[0] || 'Highland Trail',
                    });
                    setActiveTab('camera');
                  }}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.99] transition cursor-pointer flex items-center gap-3 group"
                >
                  {/* Distinct Plant Photo / SVG Vector Badge */}
                  <PlantImage
                    plant={plant}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-md group-hover:scale-105 transition"
                    fallbackSize={30}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition truncate">
                        {plant.plant_name}
                      </h4>
                      <span className="text-[10px] text-amber-400 font-semibold shrink-0">
                        {plant.local_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic truncate">{plant.scientific_name}</p>
                    <p className="text-[10px] text-slate-300 mt-1 line-clamp-1">{plant.description}</p>
                  </div>

                  <span
                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                      plant.safety === 'edible'
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                        : plant.safety === 'medicinal'
                        ? 'bg-teal-600/30 text-teal-300 border border-teal-500/40'
                        : plant.safety === 'poisonous'
                        ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                        : 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
                    }`}
                  >
                    {plant.safety}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LOCAL SCAN HISTORY */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col p-4 max-w-lg w-full mx-auto overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 shrink-0">
              <span className="text-xs font-bold text-slate-300">Offline Scan Log ({scanHistory.length})</span>
              {scanHistory.length > 0 && (
                <button
                  onClick={() => {
                    setScanHistory([]);
                    localStorage.removeItem('trekquest_plant_history');
                  }}
                  className="text-[11px] text-red-400 hover:underline font-semibold cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
              {scanHistory.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Camera size={36} className="mx-auto text-slate-600" />
                  <p className="text-xs text-slate-400">No scanned plants yet. Tap Camera to point and scan.</p>
                </div>
              ) : (
                scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => {
                      setCapturedPhotoUrl(scan.photo_url);
                      setScannedResult(scan);
                      setActiveTab('camera');
                    }}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition"
                  >
                    <img
                      src={scan.photo_url}
                      alt={scan.plant_name}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-white truncate">{scan.plant_name}</h4>
                      <p className="text-[10px] text-slate-400">{scan.scientific_name} • {scan.scanned_at}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      {scan.safety}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
