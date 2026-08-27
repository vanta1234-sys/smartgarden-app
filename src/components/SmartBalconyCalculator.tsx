import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  Sun, 
  Compass, 
  Wind, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Calendar, 
  Thermometer, 
  Layers, 
  Leaf, 
  Sprout,
  HelpCircle
} from 'lucide-react';

interface PlantPreset {
  id: string;
  name: string;
  category: string;
  icon: string;
  baseWaterPerLiter: number; // ml water per liter of soil
  dryingTolerance: 'low' | 'medium' | 'high'; // πόσο αντέχει να στεγνώσει
  rootDepth: 'ρηχή' | 'μέτρια' | 'βαθιά';
  tip: string;
}

const PLANT_PRESETS: PlantPreset[] = [
  {
    id: 'tomato',
    name: 'Ντοματιά / Πιπεριά σε Γλάστρα',
    category: 'Λαχανικά Μπαλκονιού',
    icon: '🍅',
    baseWaterPerLiter: 180,
    dryingTolerance: 'low',
    rootDepth: 'βαθιά',
    tip: 'Απαιτεί σταθερή υγρασία για αποφυγή ξηράς κορυφής (τάπωμα). Ποτίζετε πάντα στη ρίζα, ποτέ στα φύλλα.'
  },
  {
    id: 'olive',
    name: 'Ελιά / Καλλωπιστικά Δενδρύλλια',
    category: 'Δέντρα & Θάμνοι',
    icon: '🫒',
    baseWaterPerLiter: 110,
    dryingTolerance: 'high',
    rootDepth: 'βαθιά',
    tip: 'Αφήνετε το χώμα να στεγνώσει 3-4 cm στην επιφάνεια πριν το επόμενο πότισμα. Εξαιρετική αντοχή στον άνεμο.'
  },
  {
    id: 'basil',
    name: 'Βασιλικός / Δυόσμος / Αρωματικά',
    category: 'Αρωματικά Βότανα',
    icon: '🌿',
    baseWaterPerLiter: 160,
    dryingTolerance: 'low',
    rootDepth: 'ρηχή',
    tip: 'Ρηχό ριζικό σύστημα που διψάει γρήγορα. Πρωινό πότισμα και συχνό κορφολόγημα για φουντωτή ανάπτυξη.'
  },
  {
    id: 'bougainvillea',
    name: 'Μπουκαμβίλια / Γεράνι / Πετούνιες',
    category: 'Ανθοφόρα Μπαλκονιού',
    icon: '🌺',
    baseWaterPerLiter: 130,
    dryingTolerance: 'medium',
    rootDepth: 'μέτρια',
    tip: 'Για πλούσια ανθοφορία, η μπουκαμβίλια χρειάζεται ελαφρύ στρες δίψας ανάμεσα στα ποτίσματα.'
  },
  {
    id: 'succulent',
    name: 'Παχύφυτα / Κάκτοι / Αλόη',
    category: 'Ξηροφυτικά',
    icon: '🌵',
    baseWaterPerLiter: 60,
    dryingTolerance: 'high',
    rootDepth: 'ρηχή',
    tip: 'Ποτίζετε μόνο όταν το υπόστρωμα στεγνώσει εντελώς σε όλο το βάθος. Απαιτείται άριστη αποστράγγιση.'
  },
  {
    id: 'indoor_plants',
    name: 'Φίκος / Μονστέρα / Πόθος (Σκιά)',
    category: 'Φυλλώδη & Σκιερά',
    icon: '🪴',
    baseWaterPerLiter: 120,
    dryingTolerance: 'medium',
    rootDepth: 'μέτρια',
    tip: 'Προστατέψτε τα από τον καυτό απογευματινό ήλιο. Ψεκάστε τα φύλλα με νερό για υγρασία περιβάλλοντος.'
  }
];

const POT_SIZES = [
  { id: 'small', label: 'Μικρή Γλάστρα (3 - 5 Λίτρα)', volumeLiters: 4, desc: 'Διάμετρος ~18-22cm (Αρωματικά)' },
  { id: 'medium', label: 'Μεσαία Γλάστρα (8 - 12 Λίτρα)', volumeLiters: 10, desc: 'Διάμετρος ~25-30cm (Ανθοφόρα, μικρές πιπεριές)' },
  { id: 'large', label: 'Μεγάλη Γλάστρα (18 - 25 Λίτρα)', volumeLiters: 20, desc: 'Διάμετρος ~35-40cm (Ντομάτα, μικρά δέντρα)' },
  { id: 'jumbo', label: 'Ζαρντινιέρα / Πιθάρι (35 - 50 Λίτρα)', volumeLiters: 40, desc: 'Μήκος 80cm+ ή μεγάλα πιθάρια (Ελιά, εσπεριδοειδή)' }
];

const POT_MATERIALS = [
  { id: 'terracotta', name: 'Πήλινη / Τερακότα', multiplier: 1.25, desc: 'Διαπνέει έντονα • Εξατμίζει γρηγορότερα το νερό' },
  { id: 'plastic', name: 'Πλαστική / Ρητίνης', multiplier: 1.0, desc: 'Συγκρατεί περισσότερη υγρασία στα τοιχώματα' },
  { id: 'concrete', name: 'Τσιμεντένια / Πέτρινη', multiplier: 1.1, desc: 'Καλή μόνωση θερμοκρασίας • Μέτρια διαπνοή' },
  { id: 'fabric', name: 'Υφασμάτινη (Smart Pot)', multiplier: 1.35, desc: 'Κορυφαίος αερισμός ριζών • Απαιτεί συχνότερο πότισμα' }
];

const EXPOSURES = [
  { id: 'south', name: 'Νότιο (Πλήρης Ήλιος 7-9h)', factor: 1.4, desc: 'Μέγιστη ηλιοφάνεια & θερμικό φορτίο' },
  { id: 'west', name: 'Δυτικό (Καυτός Ήλιος 4-6h)', factor: 1.3, desc: 'Έντονη απογευματινή ζέστη & εξάτμιση' },
  { id: 'east', name: 'Ανατολικό (Ήπιος Ήλιος 3-5h)', factor: 1.0, desc: 'Ιδανικό για τα περισσότερα φυτά' },
  { id: 'north', name: 'Βόρειο (Σκιά & Δροσιά)', factor: 0.7, desc: 'Χαμηλή εξάτμιση • Προσοχή στην υπερβολική υγρασία' }
];

const SEASONS = [
  { id: 'heatwave', name: '☀️ Καύσωνας (> 35°C)', factor: 1.5, freqDays: 1, freqDesc: 'Κάθε πρωί (πριν τις 08:30) ή βράδυ' },
  { id: 'summer', name: '🌤️ Καλοκαίρι (28 - 34°C)', factor: 1.2, freqDays: 1.5, freqDesc: 'Κάθε 1-2 ημέρες νωρίς το πρωί' },
  { id: 'spring_autumn', name: '🌱 Άνοιξη / Φθινόπωρο (18 - 26°C)', factor: 0.9, freqDays: 3, freqDesc: 'Κάθε 2-3 ημέρες' },
  { id: 'winter', name: '❄️ Χειμώνας (< 15°C)', factor: 0.5, freqDays: 6, freqDesc: 'Κάθε 5-7 ημέρες (μετά από έλεγχο χώματος)' }
];

const WIND_LEVELS = [
  { id: 'low', name: 'Ισόγειο / Προστατευμένο', factor: 1.0 },
  { id: 'med', name: 'Μεσαίος Όροφος (2ος - 4ος)', factor: 1.1 },
  { id: 'high', name: 'Ρετιρέ / Υψηλός Άνεμος (5ος+)', factor: 1.25 }
];

export const SmartBalconyCalculator: React.FC = () => {
  const [selectedPlantId, setSelectedPlantId] = useState<string>('tomato');
  const [selectedPotSize, setSelectedPotSize] = useState<string>('large');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('plastic');
  const [selectedExposure, setSelectedExposure] = useState<string>('south');
  const [selectedSeason, setSelectedSeason] = useState<string>('summer');
  const [selectedWind, setSelectedWind] = useState<string>('med');
  const [copied, setCopied] = useState<boolean>(false);

  const plant = useMemo(() => PLANT_PRESETS.find(p => p.id === selectedPlantId) || PLANT_PRESETS[0], [selectedPlantId]);
  const potSize = useMemo(() => POT_SIZES.find(p => p.id === selectedPotSize) || POT_SIZES[2], [selectedPotSize]);
  const material = useMemo(() => POT_MATERIALS.find(m => m.id === selectedMaterial) || POT_MATERIALS[1], [selectedMaterial]);
  const exposure = useMemo(() => EXPOSURES.find(e => e.id === selectedExposure) || EXPOSURES[0], [selectedExposure]);
  const season = useMemo(() => SEASONS.find(s => s.id === selectedSeason) || SEASONS[1], [selectedSeason]);
  const wind = useMemo(() => WIND_LEVELS.find(w => w.id === selectedWind) || WIND_LEVELS[1], [selectedWind]);

  // Calculation Math
  const calculation = useMemo(() => {
    // Base amount in ml = soil volume in liters * base water per liter
    const baseMl = potSize.volumeLiters * plant.baseWaterPerLiter;
    
    // Environmental multiplier
    const envMultiplier = material.multiplier * exposure.factor * season.factor * wind.factor;
    const finalWaterMl = Math.round((baseMl * envMultiplier) / 50) * 50; // Round to nearest 50ml
    
    const waterLiters = (finalWaterMl / 1000).toFixed(1);
    
    // Calculated Evapotranspiration score (1 - 10)
    const etScore = Math.min(10, Math.max(2, Math.round(envMultiplier * 4.5)));
    
    // Drainage check
    const drainageRunoff = Math.round(finalWaterMl * 0.15); // ~15% should gently drain

    return {
      finalWaterMl,
      waterLiters,
      etScore,
      drainageRunoff,
      frequency: season.freqDesc
    };
  }, [plant, potSize, material, exposure, season, wind]);

  const copyRecipe = () => {
    const text = `🌿 ΣΥΝΤΑΓΗ ΠΟΤΙΣΜΑΤΟΣ SMARTGARDEN.GR
• Φυτό: ${plant.name}
• Γλάστρα: ${potSize.label} (${material.name})
• Έκθεση: ${exposure.name}
• Καιρός: ${season.name}
----------------------------------------
💧 Ποσότητα: ${calculation.finalWaterMl} ml (${calculation.waterLiters} Λίτρα) ανά πότισμα
⏱️ Συχνότητα: ${calculation.frequency}
🎯 Συμβουλή: ${plant.tip}
🔗 Υπολογίστηκε στο: https://smartgarden.gr`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div id="smart-balcony-calculator-section" className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Διαδραστικό Εργαλείο Μπαλκονιού
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>Υπολογιστής Ποτίσματος & Γλάστρας</span>
            <span className="text-emerald-400 text-xl font-normal hidden sm:inline">| Smart Balcony AI</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Υπολογίστε ακριβώς πόσα ml νερό και κάθε πότε χρειάζονται οι γλάστρες του μπαλκονιού σας με βάση το μέγεθος, τον προσανατολισμό και τον καιρό.
          </p>
        </div>

        <button
          onClick={copyRecipe}
          className="bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Αντιγράφηκε!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Αντιγραφή Συνταγής</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: Controls Left, Real-Time Result Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Plant Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-400" />
              1. Επιλέξτε Είδος Φυτού
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PLANT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlantId(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedPlantId === p.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500 shadow-md shadow-emerald-950'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-2xl mb-1.5">{p.icon}</span>
                  <div>
                    <div className="text-xs font-bold leading-snug">{p.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Pot Size & Material */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                2. Χωρητικότητα Γλάστρας
              </label>
              <select
                value={selectedPotSize}
                onChange={(e) => setSelectedPotSize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {POT_SIZES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">{potSize.desc}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-400" />
                3. Υλικό Γλάστρας
              </label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {POT_MATERIALS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">{material.desc}</p>
            </div>
          </div>

          {/* 3. Orientation & Season */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                4. Προσανατολισμός Μπαλκονιού
              </label>
              <select
                value={selectedExposure}
                onChange={(e) => setSelectedExposure(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {EXPOSURES.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">{exposure.desc}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-emerald-400" />
                5. Εποχή / Θερμοκρασία
              </label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {SEASONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">Επίδραση στην ταχύτητα απώλειας υγρασίας</p>
            </div>
          </div>

          {/* 4. Wind & Floor Level */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-400" />
              6. Έκθεση σε Άνεμο & Όροφος
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {WIND_LEVELS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setSelectedWind(w.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    selectedWind === w.id
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Real-Time Results Card (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 space-y-6 shadow-xl relative">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-emerald-400 animate-bounce" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Συνταγή Ποτίσματος</span>
            </div>
            <span className="text-[11px] bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-semibold">
              Live Υπολογισμός
            </span>
          </div>

          {/* Main Numbers */}
          <div className="bg-gradient-to-br from-emerald-950/50 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 text-center">
            <div className="text-xs font-semibold text-slate-400 mb-1">Προτεινόμενη Ποσότητα ανά Πότισμα</div>
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-baseline justify-center gap-2">
              <span>{calculation.finalWaterMl.toLocaleString('el-GR')}</span>
              <span className="text-emerald-400 text-xl font-bold">ml</span>
            </div>
            <div className="text-xs text-emerald-300/80 font-medium mt-1">
              (Ισοδυναμεί με περίπου <strong>{calculation.waterLiters} Liters</strong> νερού)
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Συχνότητα
              </div>
              <div className="text-xs font-bold text-white leading-tight">
                {calculation.frequency}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mb-1">
                <Sun className="w-3.5 h-3.5 text-cyan-400" />
                Δείκτης Εξάτμισης (ET)
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span className={calculation.etScore > 7 ? 'text-rose-400 font-extrabold' : 'text-emerald-400 font-bold'}>
                  {calculation.etScore}/10
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {calculation.etScore > 7 ? '(Πολύ υψηλή)' : '(Μέτρια)'}
                </span>
              </div>
            </div>
          </div>

          {/* Expert Tip Box */}
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Συμβουλή Γεωπόνου SmartGarden:</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pl-6">
              {plant.tip}
            </p>
          </div>

          {/* Drainage Alert */}
          <div className="flex items-start gap-2.5 text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Χρυσός Κανόνας Αποστράγγισης:</strong> Περίπου ~{calculation.drainageRunoff}ml θα πρέπει να βγαίνουν ελαφρώς στο πιατάκι. Αδειάζετε το πιατάκι μετά από 20 λεπτά για να μην σαπίσουν οι ρίζες.
            </p>
          </div>

        </div>

      </div>

      {/* Seasonal Monthly Advice strip */}
      <div className="mt-8 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-sm">
            ☀️
          </div>
          <div>
            <div className="text-xs font-bold text-white">Ώρα Ποτίσματος</div>
            <div className="text-[11px] text-slate-400">06:30 - 08:30 π.μ. (Αποφυγή εγκαυμάτων)</div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm">
            🧪
          </div>
          <div>
            <div className="text-xs font-bold text-white">Καλοκαιρινή Λίπανση</div>
            <div className="text-[11px] text-slate-400">Αποφεύγετε άζωτο σε καύσωνα • Προτιμήστε Κάλιο</div>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm">
            📡
          </div>
          <div>
            <div className="text-xs font-bold text-white">Τεστ Υγρασίας</div>
            <div className="text-[11px] text-slate-400">Βυθίστε το δάκτυλο 3cm πριν ανοίξετε το νερό</div>
          </div>
        </div>
      </div>

    </div>
  );
};
