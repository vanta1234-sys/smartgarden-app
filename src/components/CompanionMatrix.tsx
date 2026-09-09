import React, { useState } from 'react';
import { Sprout, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Companion {
  plant: string;
  reason: string;
}

interface PlantEntry {
  emoji: string;
  friends: Companion[];
  enemies: Companion[];
}

const PLANTS: Record<string, PlantEntry> = {
  'Ντομάτα': {
    emoji: '🍅',
    friends: [
      { plant: 'Βασιλικός', reason: 'Απωθεί έντομα (θρίπες, λευκό σκουλήκι) και βελτιώνει τη γεύση.' },
      { plant: 'Κατιφές (Tagetes)', reason: 'Απωθεί νηματώδεις ρίζας και αλευρώδη.' },
      { plant: 'Καρότο', reason: 'Χαλαρώνει το χώμα γύρω από τη ρίζα της ντομάτας.' },
      { plant: 'Κρεμμύδι', reason: 'Απωθεί αφίδες και άλλα έντομα.' },
    ],
    enemies: [
      { plant: 'Πατάτα', reason: 'Κοινή ευαισθησία στην περονόσπορο (late blight) — αυξάνει τον κίνδυνο μετάδοσης.' },
      { plant: 'Μάραθος', reason: 'Αναστέλλει την ανάπτυξη της ντομάτας μέσω αλληλοπάθειας.' },
    ],
  },
  'Πιπεριά': {
    emoji: '🌶️',
    friends: [
      { plant: 'Βασιλικός', reason: 'Βελτιώνει τη γεύση και απωθεί έντομα.' },
      { plant: 'Κρεμμύδι', reason: 'Απωθεί κοινά παράσιτα.' },
      { plant: 'Καρότο', reason: 'Δεν ανταγωνίζονται για θρεπτικά, καλός γείτονας.' },
    ],
    enemies: [
      { plant: 'Φασολάκια', reason: 'Ανταγωνισμός για θρεπτικά στοιχεία.' },
      { plant: 'Μάραθος', reason: 'Αναστέλλει την ανάπτυξη γειτονικών φυτών.' },
    ],
  },
  'Αγγούρι': {
    emoji: '🥒',
    friends: [
      { plant: 'Φασολάκια', reason: 'Δεσμεύουν άζωτο στο έδαφος, ωφέλιμο για το αγγούρι.' },
      { plant: 'Καλαμπόκι', reason: 'Παρέχει φυσική στήριξη/σκίαση.' },
      { plant: 'Ραδίκι', reason: 'Καλή συνύπαρξη χωρίς ανταγωνισμό.' },
    ],
    enemies: [
      { plant: 'Πατάτα', reason: 'Αυξάνει τον κίνδυνο περονόσπορου.' },
      { plant: 'Αρωματικά βότανα (φασκόμηλο)', reason: 'Η έντονη μυρωδιά επηρεάζει αρνητικά την ανάπτυξη.' },
    ],
  },
  'Κολοκυθάκι': {
    emoji: '🥒',
    friends: [
      { plant: 'Καλαμπόκι', reason: 'Κλασικός συνδυασμός "Τριών Αδερφών" — αμοιβαία στήριξη.' },
      { plant: 'Φασολάκια', reason: 'Εμπλουτίζουν το έδαφος με άζωτο.' },
      { plant: 'Κατιφές', reason: 'Απωθεί σκαθάρια κολοκυθιάς.' },
    ],
    enemies: [
      { plant: 'Πατάτα', reason: 'Ανταγωνισμός για χώρο και θρεπτικά, κοινά παράσιτα.' },
    ],
  },
  'Μαρούλι': {
    emoji: '🥬',
    friends: [
      { plant: 'Καρότο', reason: 'Διαφορετικό βάθος ριζικού συστήματος, δεν ανταγωνίζονται.' },
      { plant: 'Ραπανάκι', reason: 'Γρήγορη συγκομιδή, χαλαρώνει το χώμα για το μαρούλι.' },
      { plant: 'Φράουλα', reason: 'Καλή εδαφοκάλυψη, αμοιβαία ωφέλιμα.' },
    ],
    enemies: [
      { plant: 'Σέλινο', reason: 'Ανταγωνισμός για υγρασία και θρεπτικά.' },
      { plant: 'Λάχανο/Μπρόκολο', reason: 'Μεγάλα φυτά που σκιάζουν υπερβολικά το μαρούλι.' },
    ],
  },
  'Βασιλικός': {
    emoji: '🌿',
    friends: [
      { plant: 'Ντομάτα', reason: 'Κλασικός συνδυασμός — βελτιώνει γεύση, απωθεί έντομα.' },
      { plant: 'Πιπεριά', reason: 'Απωθεί αφίδες και θρίπες.' },
    ],
    enemies: [
      { plant: 'Ρίγανη/Δυόσμος', reason: 'Έντονης μυρωδιάς βότανα ανταγωνίζονται σε κοντινή απόσταση.' },
    ],
  },
  'Κρεμμύδι': {
    emoji: '🧅',
    friends: [
      { plant: 'Ντομάτα', reason: 'Απωθεί αφίδες.' },
      { plant: 'Καρότο', reason: 'Το κρεμμύδι απωθεί τη μύγα του καρότου, το καρότο απωθεί τη μύγα του κρεμμυδιού.' },
      { plant: 'Μαρούλι', reason: 'Καλή συνύπαρξη, διαφορετικό ριζικό σύστημα.' },
    ],
    enemies: [
      { plant: 'Φασολάκια / Μπιζέλια', reason: 'Το κρεμμύδι αναστέλλει τη δέσμευση αζώτου των οσπρίων.' },
    ],
  },
  'Καρότο': {
    emoji: '🥕',
    friends: [
      { plant: 'Ντομάτα', reason: 'Η ντομάτα σκιάζει ελαφρά, ωφέλιμο το καλοκαίρι.' },
      { plant: 'Κρεμμύδι', reason: 'Αμοιβαία απώθηση παρασίτων (βλ. παραπάνω).' },
      { plant: 'Φασολάκια', reason: 'Εμπλουτίζουν το έδαφος με άζωτο.' },
    ],
    enemies: [
      { plant: 'Άνηθος', reason: 'Μπορεί να αναστείλει την ανάπτυξη του καρότου και να προσελκύσει κοινά παράσιτα.' },
    ],
  },
  'Φασολάκια': {
    emoji: '🫘',
    friends: [
      { plant: 'Αγγούρι', reason: 'Το αγγούρι επωφελείται από το άζωτο που δεσμεύουν τα φασολάκια.' },
      { plant: 'Καλαμπόκι', reason: 'Το καλαμπόκι δίνει φυσική στήριξη αναρρίχησης.' },
      { plant: 'Πατάτα', reason: 'Αμοιβαία απώθηση παρασίτων (κολεόπτερα).' },
    ],
    enemies: [
      { plant: 'Κρεμμύδι/Σκόρδο', reason: 'Αναστέλλουν τη δέσμευση αζώτου από τα φασολάκια.' },
    ],
  },
  'Πατάτα': {
    emoji: '🥔',
    friends: [
      { plant: 'Φασολάκια', reason: 'Αμοιβαία απώθηση παρασίτων.' },
      { plant: 'Καλαμπόκι', reason: 'Καλή συνύπαρξη χωρίς ανταγωνισμό.' },
    ],
    enemies: [
      { plant: 'Ντομάτα', reason: 'Κοινή ευαισθησία στην περονόσπορο.' },
      { plant: 'Αγγούρι/Κολοκυθάκι', reason: 'Ανταγωνισμός για χώρο και θρεπτικά.' },
    ],
  },
  'Φράουλα': {
    emoji: '🍓',
    friends: [
      { plant: 'Μαρούλι', reason: 'Καλή εδαφοκάλυψη χωρίς ανταγωνισμό.' },
      { plant: 'Σκόρδο', reason: 'Βοηθά στην προστασία από μυκητολογικές ασθένειες.' },
    ],
    enemies: [
      { plant: 'Λάχανο/Μπρόκολο', reason: 'Ανταγωνισμός για θρεπτικά στοιχεία.' },
    ],
  },
  'Κατιφές (Tagetes)': {
    emoji: '🌼',
    friends: [
      { plant: 'Ντομάτα', reason: 'Απωθεί νηματώδεις ρίζας.' },
      { plant: 'Κολοκυθάκι', reason: 'Απωθεί σκαθάρια κολοκυθιάς.' },
      { plant: 'Πατάτα', reason: 'Γενικός απωθητικός βοηθός για πολλά παράσιτα.' },
    ],
    enemies: [
      { plant: 'Φασολάκια', reason: 'Ορισμένες ποικιλίες tagetes μπορούν να αναστείλουν ελαφρά την ανάπτυξη.' },
    ],
  },
};

const PLANT_NAMES = Object.keys(PLANTS);

export const CompanionMatrix: React.FC = () => {
  const [selected, setSelected] = useState<string>(PLANT_NAMES[0]);
  const entry = PLANTS[selected];

  return (
    <div id="companion-matrix" className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
          <Sprout className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100 tracking-tight">Πίνακας Συγκαλλιέργειας</h3>
          <p className="text-xs text-slate-400">Ποια φυτά ταιριάζουν μαζί στον λαχανόκηπο και ποια όχι</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PLANT_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => setSelected(name)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              selected === name
                ? 'bg-lime-500 text-slate-100 border-lime-500'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-lime-500/40'
            }`}
          >
            <span>{PLANTS[name].emoji}</span>
            {name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-950/30 border border-emerald-500/25 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wide">
            <ThumbsUp className="w-4 h-4" />
            Καλοί Γείτονες
          </div>
          {entry.friends.map((f) => (
            <div key={f.plant} className="text-xs">
              <span className="font-bold text-slate-100">{f.plant}: </span>
              <span className="text-slate-400">{f.reason}</span>
            </div>
          ))}
        </div>

        <div className="bg-rose-950/30 border border-rose-500/25 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wide">
            <ThumbsDown className="w-4 h-4" />
            Αποφύγετε Κοντά
          </div>
          {entry.enemies.map((e) => (
            <div key={e.plant} className="text-xs">
              <span className="font-bold text-slate-100">{e.plant}: </span>
              <span className="text-slate-400">{e.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
