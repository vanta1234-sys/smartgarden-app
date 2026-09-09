import React, { useState } from 'react';
import { 
  FlaskConical, 
  Droplets, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  Info,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  targetProblem: string;
  category: 'bio_pest' | 'fertilizer' | 'weed_control' | 'fungicide';
  categoryLabel: string;
  baseRatePerLiter: {
    primaryAmount: number;
    primaryUnit: 'ml' | 'gr';
    primaryName: string;
    secondaryAmount?: number;
    secondaryUnit?: 'ml' | 'gr';
    secondaryName?: string;
    surfactantAmount?: number; // soap
    surfactantName?: string;
  };
  phTarget: string;
  bestTime: string;
  safetyWarning: string;
  mixInstructions: string[];
  articleSlug?: string;
}

const RECIPES: Recipe[] = [
  {
    id: 'fe_eddha',
    name: 'Χηλικός Σίδηρος (Fe-EDDHA 6%)',
    targetProblem: 'Χλώρωση Σιδήρου (Κίτρινα Φύλλα με πράσινες νευρώσεις σε Λεμονιές, Γαρδένιες, Ορτανσίες)',
    category: 'fertilizer',
    categoryLabel: 'Διαφυλλική & Ριζοπότισμα',
    baseRatePerLiter: {
      primaryAmount: 2.5,
      primaryUnit: 'gr',
      primaryName: 'Χηλικός Σίδηρος EDDHA (κόκκινη σκόνη)',
      surfactantAmount: 1,
      surfactantName: 'Υγρό Βιολογικό Σαπούνι Καλίου (ως διαβρέκτης)',
    },
    phTarget: 'Ανθεκτικό σε pH 4.0 - 10.0',
    bestTime: 'Νωρίς το πρωί (06:30 - 08:00) ή αργά το απόγευμα',
    safetyWarning: 'Ο σίδηρος EDDHA λεκιάζει έντονα μάρμαρα και πλακάκια. Εφαρμόστε προσεκτικά πάνω από το χώμα.',
    mixInstructions: [
      'Διαλύστε πρώτα την κόκκινη σκόνη σε 200ml χλιαρό νερό σε ξεχωριστό δοχείο.',
      'Προσθέστε το συμπύκνωμα στον ψεκαστήρα με το υπόλοιπο νερό.',
      'Προσθέστε το βιολογικό σαπούνι τελευταίο για να μην δημιουργηθεί υπερβολικός αφρός.',
      'Ποτίστε τη ριζική ζώνη ή ψεκάστε καλά κάτω από τα φύλλα.',
    ],
    articleSlug: 'chlorosi-sidirou-eddha-esperidoeidi-lemonia-balconi',
  },
  {
    id: 'bio_vinegar_weed',
    name: 'Βιολογικό Γεωργικό Ξύδι 20% & Έλαιο Γαρίφαλου',
    targetProblem: 'Ολική Ζιζανιοκτονία Επαφής (Αγριόχορτα σε αρμούς, πλακόστρωτα, παρτέρια)',
    category: 'weed_control',
    categoryLabel: 'Βιολογική Ζιζανιοκτονία',
    baseRatePerLiter: {
      primaryAmount: 900,
      primaryUnit: 'ml',
      primaryName: 'Γεωργικό Οξικό Οξύ 20% (χωρίς αραίωση με νερό)',
      secondaryAmount: 10,
      secondaryUnit: 'ml',
      secondaryName: 'Αιθέριο Έλαιο Γαρίφαλο / Ευγενόλη',
      surfactantAmount: 20,
      surfactantName: 'Πράσινο Σαπούνι Καλίου (Διαβρέκτης)',
    },
    phTarget: 'Εξαιρετικά όξινο (pH ~2.2)',
    bestTime: 'Καταμεσήμερο με πλήρη ηλιοφάνεια (>25°C) και ξηρασία',
    safetyWarning: 'Υποχρεωτικά γάντια νιτριλίου και γυαλιά προστασίας. Μην ψεκάζετε κοντά σε επιθυμητά πράσινα φύλλα.',
    mixInstructions: [
      'Χρησιμοποιήστε το οξικό οξύ 20% ως βάση του ψεκασμού.',
      'Προσθέστε το έλαιο γαρίφαλου και το πράσινο σαπούνι.',
      'Ανακινήστε έντονα για 30 δευτερόλεπτα ώστε να ομογενοποιηθεί το γαλάκτωμα.',
      'Ψεκάστε απευθείας στα ζιζάνια μέχρι πλήρους διαβροχής.',
    ],
    articleSlug: 'viologiki-zizanioktonia-ksydi-20-corn-gluten-meal',
  },
  {
    id: 'bacillus_caterpillars',
    name: 'Βάκιλος Θουριγγίας (Bt Kurstaki)',
    targetProblem: 'Κάμπιες, Πεταλούδα Γερανιού (Cacyreus marshalli), Πιερίδα Λάχανου, Τούτα Ντομάτας',
    category: 'bio_pest',
    categoryLabel: 'Βιολογική Εντομοκτονία',
    baseRatePerLiter: {
      primaryAmount: 1.5,
      primaryUnit: 'gr',
      primaryName: 'Βάκιλος Θουριγγίας (σκόνη ή υγρό σκεύασμα)',
      surfactantAmount: 2,
      surfactantName: 'Βιολογικό Σαπούνι Καλίου',
    },
    phTarget: 'Ουδέτερο (pH 6.5 - 7.2)',
    bestTime: 'Σούρουπο (οι ακτίνες UV αδρανοποιούν τις πρωτεϊνικές κρυσταλλικές τοξίνες του βακίλου)',
    safetyWarning: '100% ασφαλές για μέλισσες, κατοικίδια και ωφέλιμα έντομα. Μηδενικές ημέρες αναμονής πριν τη συγκομιδή.',
    mixInstructions: [
      'Αναμείξτε τη σκόνη σε λίγο νερό μέχρι να μην υπάρχουν σβόλοι.',
      'Συμπληρώστε το υπόλοιπο νερό στον ψεκαστήρα.',
      'Ψεκάστε σχολαστικά την κάτω επιφάνεια των φύλλων και τα μπουμπούκια.',
      'Επαναλάβετε μετά από 7 ημέρες εάν παρατηρηθούν νέες νεαρές προνύμφες.',
    ],
    articleSlug: 'kampia-geraniou-cacyreus-marshalli-bacillus-thuringiensis',
  },
  {
    id: 'neem_potassium_soap',
    name: 'Έλαιο Neem & Άλατα Καλίου (Πράσινο Σαπούνι)',
    targetProblem: 'Μελιγκρα (Αφίδες), Θρίπες, Τετράνυχος, Αλευρώδης, Ψύλλα',
    category: 'bio_pest',
    categoryLabel: 'Βιολογική Εντομοκτονία & Ακαρεοκτονία',
    baseRatePerLiter: {
      primaryAmount: 5,
      primaryUnit: 'ml',
      primaryName: 'Καθαρό Ψυχρής Έκθλιψης Έλαιο Neem (Αζαδιραχτίνη)',
      surfactantAmount: 5,
      surfactantName: 'Υγρό Πράσινο Σαπούνι (απαραίτητο ως γαλακτωματοποιητής)',
    },
    phTarget: 'Ουδέτερο προς ελαφρώς αλκαλικό (pH 7.0 - 7.8)',
    bestTime: 'Αργά το απόγευμα (μετά τις 18:30) με θερμοκρασία κάτω των 28°C',
    safetyWarning: 'Μην ψεκάζετε υπό έντονο ήλιο γιατί τα έλαια προκαλούν φυτοτοξικό έγκαυμα στα φύλλα.',
    mixInstructions: [
      'Σε ένα ποτήρι με 100ml χλιαρό νερό, ανακατέψτε πρώτα το πράσινο σαπούνι.',
      'Προσθέστε το έλαιο Neem και ανακατέψτε μέχρι να γίνει ομοιόμορφο γαλακτώδες λευκό υγρό.',
      'Αδειάστε το στον ψεκαστήρα με το υπόλοιπο νερό και ανακινήστε καλά.',
      'Ψεκάστε μέχρι απορροής σε όλο το φύλλωμα.',
    ],
    articleSlug: 'afides-meligkra-neem-oil-prasino-sapouni-katapolemisi',
  },
  {
    id: 'seaweed_anti_stress',
    name: 'Εκχύλισμα Φυκών (Ascophyllum nodosum)',
    targetProblem: 'Αντιστρές Καύσωνα, Ενίσχυση Ανθοφορίας & Ριζοβολία',
    category: 'fertilizer',
    categoryLabel: 'Βιοδιεγέρτες & Θρέψη',
    baseRatePerLiter: {
      primaryAmount: 3,
      primaryUnit: 'ml',
      primaryName: 'Υγρό Εκχύλισμα Θαλάσσιων Φυκών',
      surfactantAmount: 1,
      surfactantName: 'Πράσινο Σαπούνι (Διαβρέκτης)',
    },
    phTarget: 'pH 6.0 - 7.5',
    bestTime: 'Νωρίς το πρωί (06:00 - 07:30) 24-48 ώρες πριν από κύμα καύσωνα',
    safetyWarning: 'Συμβατό με όλα τα βιολογικά σκευάσματα εκτός από ισχυρά όξινα διαλύματα.',
    mixInstructions: [
      'Ανακινήστε καλά το μπουκάλι του εκχυλίσματος πριν τη χρήση.',
      'Προσθέστε τη δόση στο νερό του ψεκαστήρα.',
      'Ψεκάστε διαφυλλικά μέχρι να καλυφθούν πλήρως τα φύλλα.',
      'Το υπόλοιπο μπορεί να χρησιμοποιηθεί ως ριζοπότισμα.',
    ],
    articleSlug: 'ekchilisma-fykon-antistres-kausona-lastixo-mpalkoni',
  },
  {
    id: 'baking_soda_powdery_mildew',
    name: 'Διττανθρακικό Νάτριο (Μαγειρική Σόδα) & Έλαιο',
    targetProblem: 'Ωίδιο (Μπάστρα / Σίρικα - Λευκή σκόνη σε Τριανταφυλλιές, Κολοκυθάκια, Αμπέλι)',
    category: 'fungicide',
    categoryLabel: 'Βιολογικό Μυκητοκτόνο',
    baseRatePerLiter: {
      primaryAmount: 5,
      primaryUnit: 'gr',
      primaryName: 'Μαγειρική Σόδα (Διττανθρακικό Νάτριο)',
      secondaryAmount: 5,
      secondaryUnit: 'ml',
      secondaryName: 'Ηλιέλαιο ή Έλαιο Neem',
      surfactantAmount: 3,
      surfactantName: 'Πράσινο Σαπούνι',
    },
    phTarget: 'Αλκαλικό (pH ~8.3 - εμποδίζει τη βλάστηση των σπορίων του μύκητα)',
    bestTime: 'Πρωινές ώρες με στεγνό καιρό',
    safetyWarning: 'Μην υπερβαίνετε τα 5gr/L γιατί η περίσσεια νατρίου μπορεί να κάψει τα τρυφερά άκρα των φύλλων.',
    mixInstructions: [
      'Διαλύστε τη σόδα σε 200ml χλιαρό νερό.',
      'Προσθέστε το λάδι και το σαπούνι και ανακατέψτε ζωηρά.',
      'Συμπληρώστε το νερό στον ψεκαστήρα.',
      'Ψεκάστε με την πρώτη εμφάνιση των λευκών κηλίδων.',
    ],
    articleSlug: 'oidio-mpastra-triantafyllia-viologiki-antimetopisi-soda',
  },
];

const TANK_SIZES = [
  { size: 1, label: '1 L (Μικρός Χειρός)' },
  { size: 2, label: '2 L (Προπίεσης Μπαλκονιού)' },
  { size: 5, label: '5 L (Ώμου Κήπου)' },
  { size: 8, label: '8 L (Μεσαίος Κήπου)' },
  { size: 12, label: '12 L (Πλάτης)' },
  { size: 16, label: '16 L (Επαγγελματικός Πλάτης)' },
];

interface SprayDosageCalculatorProps {
  onOpenArticle?: (slug: string) => void;
}

export const SprayDosageCalculator: React.FC<SprayDosageCalculatorProps> = ({ onOpenArticle }) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('fe_eddha');
  const [tankSize, setTankSize] = useState<number>(2);

  const recipe = RECIPES.find(r => r.id === selectedRecipeId) || RECIPES[0];

  const primaryTotal = Math.round(recipe.baseRatePerLiter.primaryAmount * tankSize * 10) / 10;
  const secondaryTotal = recipe.baseRatePerLiter.secondaryAmount 
    ? Math.round(recipe.baseRatePerLiter.secondaryAmount * tankSize * 10) / 10 
    : null;
  const surfactantTotal = recipe.baseRatePerLiter.surfactantAmount 
    ? Math.round(recipe.baseRatePerLiter.surfactantAmount * tankSize * 10) / 10 
    : null;

  return (
    <div id="spray-dosage-calculator" className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <FlaskConical className="w-4 h-4" />
            <span>Επιστημονικός Υπολογιστής Δοσολογιών Ψεκαστήρα</span>
          </div>
          <h3 className="text-xl font-bold text-slate-100 mt-1">
            Υπολογισμός Βιολογικών Σκευασμάτων & Λιπασμάτων
          </h3>
        </div>
        <div className="text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start sm:self-auto font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Αυτόματος Υπολογισμός ανά Ψεκαστήρα</span>
        </div>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Treatment Recipe Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            Επιλέξτε Σκεύασμα & Πρόβλημα Φυτού:
          </label>
          <select
            value={selectedRecipeId}
            onChange={(e) => setSelectedRecipeId(e.target.value)}
            aria-label="Επιλέξτε Σκεύασμα & Πρόβλημα Φυτού"
            className="w-full bg-slate-900 text-slate-100 text-sm font-semibold rounded-xl p-3 border border-slate-700 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {RECIPES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} — {r.targetProblem.slice(0, 45)}...
              </option>
            ))}
          </select>
          <p className="text-[11px] text-emerald-400/90 font-medium pl-1">
            🎯 Στόχος: {recipe.targetProblem}
          </p>
        </div>

        {/* Tank Size Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            Χωρητικότητα Ψεκαστήρα (Λίτρα Νερού):
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {TANK_SIZES.map((t) => (
              <button
                key={t.size}
                type="button"
                onClick={() => setTankSize(t.size)}
                className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer ${
                  tankSize === t.size
                    ? 'bg-emerald-700 text-white border-emerald-400 shadow-lg shadow-emerald-950 scale-105'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:bg-slate-850'
                }`}
              >
                <div className="text-sm">{t.size} L</div>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 pl-1">
            Επιλεγμένο δοχείο: <strong className="text-slate-100">{tankSize} Λίτρα</strong> ({TANK_SIZES.find(t => t.size === tankSize)?.label})
          </p>
        </div>
      </div>

      {/* Computed Dosage Output Cards */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Ακριβής Δοσολογία για {tankSize} Λίτρα ({recipe.name})
          </h4>
          <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
            {recipe.phTarget}
          </span>
        </div>

        {/* Big Calculated Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Primary */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 flex flex-col justify-between shadow-inner">
            <div className="text-[11px] text-slate-400 font-medium">Βασικό Δραστικό</div>
            <div className="my-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {primaryTotal}
              </span>
              <span className="text-sm font-bold text-slate-300 ml-1">
                {recipe.baseRatePerLiter.primaryUnit}
              </span>
            </div>
            <div className="text-xs text-slate-300 font-medium">
              {recipe.baseRatePerLiter.primaryName}
            </div>
          </div>

          {/* Secondary if exists */}
          {recipe.baseRatePerLiter.secondaryName && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/30 flex flex-col justify-between shadow-inner">
              <div className="text-[11px] text-slate-400 font-medium">Συνεργιστικό Έλαιο / Πρόσθετο</div>
              <div className="my-1">
                <span className="text-2xl sm:text-3xl font-black text-cyan-400 tracking-tight">
                  {secondaryTotal}
                </span>
                <span className="text-sm font-bold text-slate-300 ml-1">
                  {recipe.baseRatePerLiter.secondaryUnit}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                {recipe.baseRatePerLiter.secondaryName}
              </div>
            </div>
          )}

          {/* Surfactant / Soap */}
          {recipe.baseRatePerLiter.surfactantName && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 flex flex-col justify-between shadow-inner">
              <div className="text-[11px] text-slate-400 font-medium">Διαβρέκτης (Σαπούνι Καλίου)</div>
              <div className="my-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                  {surfactantTotal}
                </span>
                <span className="text-sm font-bold text-slate-300 ml-1">
                  ml / gr
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                {recipe.baseRatePerLiter.surfactantName}
              </div>
            </div>
          )}
        </div>

        {/* Step by Step Mix Instructions */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            Οδηγίες Ανάμειξης Βήμα-Βήμα:
          </div>
          <ol className="space-y-1.5 pl-5 list-decimal text-xs text-slate-300 leading-relaxed">
            {recipe.mixInstructions.map((step, idx) => (
              <li key={idx}>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Timing & Warning Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
          <div className="bg-sky-950/40 border border-sky-800/60 p-3 rounded-lg flex items-start gap-2 text-sky-200">
            <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sky-300 block mb-0.5">Ιδανική Ώρα Εφαρμογής:</strong>
              {recipe.bestTime}
            </div>
          </div>

          <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-lg flex items-start gap-2 text-rose-200">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-300 block mb-0.5">Κανόνας Ασφαλείας:</strong>
              {recipe.safetyWarning}
            </div>
          </div>
        </div>
      </div>

      {/* Link to Full Article if Available */}
      {recipe.articleSlug && onOpenArticle && (
        <div className="flex justify-end">
          <button
            onClick={() => onOpenArticle(recipe.articleSlug!)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-700 border border-emerald-500/40 text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Διαβάστε τον Πλήρη Τεχνικό Οδηγό για αυτό το Σκεύασμα</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
