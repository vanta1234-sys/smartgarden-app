import React, { useState } from 'react';
import { HelpCircle, ChevronRight, RotateCcw, ArrowRight } from 'lucide-react';

interface WizardResult {
  problem: string;
  cause: string;
  treatment: string;
  recipeHint?: string;
}

interface WizardOption {
  label: string;
  next?: string;
  result?: WizardResult;
}

interface WizardStep {
  question: string;
  options: WizardOption[];
}

const STEPS: Record<string, WizardStep> = {
  start: {
    question: 'Τι παρατηρείτε στο φυτό σας;',
    options: [
      { label: 'Κίτρινα φύλλα', next: 'yellow' },
      { label: 'Μαύρα/καφέ στίγματα στα φύλλα', next: 'spots' },
      { label: 'Πτώση ανθέων ή καρπών', next: 'drop' },
      { label: 'Ιστούς ή κολλώδη ουσία', next: 'sticky' },
      { label: 'Μυρωδιά σαπίλας / μαλακές ρίζες', next: 'rot' },
    ],
  },
  yellow: {
    question: 'Τα νεύρα του φύλλου παραμένουν πράσινα ενώ το υπόλοιπο φύλλο κιτρινίζει;',
    options: [
      {
        label: 'Ναι, οι νευρώσεις είναι πράσινες',
        result: {
          problem: 'Τροφοπενία Σιδήρου (Χλώρωση)',
          cause: 'Το pH του υποστρώματος είναι πιθανότατα πάνω από 7.0, καθιστώντας τον σίδηρο μη διαθέσιμο για απορρόφηση από τις ρίζες.',
          treatment: 'Εφαρμόστε χηλικό σίδηρο EDDHA (όχι EDTA) απευθείας στη ρίζα, νωρίς το πρωί.',
          recipeHint: 'Δείτε τη συνταγή "Χηλικός Σίδηρος (Fe-EDDHA)" στον υπολογιστή δοσολογιών παρακάτω.',
        },
      },
      {
        label: 'Όχι, κιτρινίζει ομοιόμορφα όλο το φύλλο',
        result: {
          problem: 'Υπερβολικό Πότισμα ή Έλλειψη Αζώτου',
          cause: 'Ομοιόμορφο κιτρίνισμα συνήθως σημαίνει είτε ασφυξία ρίζας από υπερβολικό πότισμα, είτε γενική έλλειψη αζώτου.',
          treatment: 'Ελέγξτε πρώτα την αποστράγγιση και αφήστε το υπόστρωμα να στεγνώσει πριν το επόμενο πότισμα. Αν η στράγγιση είναι καλή, εφαρμόστε ισορροπημένο λίπασμα με άζωτο.',
        },
      },
    ],
  },
  spots: {
    question: 'Τα στίγματα έχουν λευκή/γκρι επίστρωση σαν σκόνη, ή είναι σκούρα/υγρά κηλίδες;',
    options: [
      {
        label: 'Λευκή/γκρι σκόνη (ωίδιο)',
        result: {
          problem: 'Ωίδιο (Ασθένεια Ασπρίλας)',
          cause: 'Μυκητολογική προσβολή που ευνοείται από υψηλή υγρασία και κακό αερισμό.',
          treatment: 'Ψεκάστε με διάλυμα μαγειρικής σόδας ή θειάφι, αφαιρέστε τα πιο προσβεβλημένα φύλλα και βελτιώστε τον αερισμό γύρω από το φυτό.',
          recipeHint: 'Δείτε τη συνταγή "Ωίδιο (Μαγειρική Σόδα)" στον υπολογιστή δοσολογιών παρακάτω.',
        },
      },
      {
        label: 'Σκούρες/υγρές κηλίδες',
        result: {
          problem: 'Βακτηριακή ή Μυκητολογική Κηλίδωση Φύλλων',
          cause: 'Συχνά προκαλείται από ψεκασμό/πότισμα στα φύλλα σε συνδυασμό με υψηλή υγρασία.',
          treatment: 'Αφαιρέστε τα προσβεβλημένα φύλλα, ποτίζετε στη ρίζα (όχι στο φύλλωμα) και βελτιώστε την κυκλοφορία αέρα.',
        },
      },
    ],
  },
  drop: {
    question: 'Το φυτό είναι εσπεριδοειδές (λεμονιά, μανταρινιά, κουμκουάτ) και η πτώση είναι μικρών καρπών τον Ιούνιο;',
    options: [
      {
        label: 'Ναι, ταιριάζει',
        result: {
          problem: 'Φυσιολογική Καρπόπτωση (June Drop)',
          cause: 'Φυσιολογική αυτορυθμιζόμενη διαδικασία — το δέντρο εξισορροπεί το φορτίο καρπών με βάση τα διαθέσιμα φωτοσυνθετικά προϊόντα.',
          treatment: 'Δεν χρειάζεται ανησυχία. Μειώστε το άζωτο και αυξήστε το κάλιο για να ενισχύσετε την προσκόλληση των υπόλοιπων καρπών.',
        },
      },
      {
        label: 'Όχι, είναι κάτι άλλο',
        result: {
          problem: 'Υδατικό Στρες ή Έλλειψη Βορίου',
          cause: 'Η πτώση ανθέων/καρπών εκτός εποχής συχνά οφείλεται σε ανομοιόμορφο πότισμα ή έλλειψη βορίου, που επηρεάζει τη γονιμοποίηση.',
          treatment: 'Σταθεροποιήστε το πρόγραμμα ποτίσματος (έλεγχος υγρασίας πριν από κάθε πότισμα) και εξετάστε διαφυλλική εφαρμογή ιχνοστοιχείων με βόριο.',
        },
      },
    ],
  },
  sticky: {
    question: 'Βλέπετε μικρά λευκά ή καφέ έντομα, ή λεπτούς ιστούς σαν αράχνης;',
    options: [
      {
        label: 'Έντομα (κοκκοειδή/αφίδες)',
        result: {
          problem: 'Προσβολή από Κοκκοειδή ή Αφίδες',
          cause: 'Τα έντομα απομυζούν τους χυμούς του φυτού και αφήνουν μελιτώδη εκκρίματα (κολλώδη ουσία), που μπορεί να προκαλέσουν και καπνιά (μαύρη μούχλα).',
          treatment: 'Ψεκάστε με σαπούνι καλίου ή έλαιο Neem, καλύπτοντας και την κάτω επιφάνεια των φύλλων. Επαναλάβετε κάθε 7 ημέρες.',
          recipeHint: 'Δείτε τη συνταγή "Έλαιο Neem & Σαπούνι Καλίου" στον υπολογιστή δοσολογιών παρακάτω.',
        },
      },
      {
        label: 'Λεπτοί ιστοί σαν αράχνης',
        result: {
          problem: 'Τετράνυχος (Κόκκινη Αράχνη)',
          cause: 'Ευνοείται από ξηρές, ζεστές συνθήκες. Οι τετράνυχοι απομυζούν τα κύτταρα των φύλλων προκαλώντας κιτρίνισμα και "στίγματα".',
          treatment: 'Αυξήστε την υγρασία γύρω από το φυτό (ψεκασμός νερού), ψεκάστε με ακαρεοκτόνο σαπούνι καλίου και απομονώστε το φυτό αν είναι δυνατόν.',
        },
      },
    ],
  },
  rot: {
    question: 'Το χώμα παραμένει συνέχεια υγρό ή έχετε ποτίσει πρόσφατα πολύ νερό;',
    options: [
      {
        label: 'Ναι',
        result: {
          problem: 'Σήψη Ρίζας (Root Rot) από Ασφυξία',
          cause: 'Η παρατεταμένη υγρασία στερεί οξυγόνο από τις ρίζες, επιτρέποντας την ανάπτυξη παθογόνων μυκήτων (π.χ. Phytophthora).',
          treatment: 'Σταματήστε αμέσως το πότισμα, βελτιώστε την αποστράγγιση (προσθήκη ελαφρόπετρας/περλίτη) και αφαιρέστε τυχόν σάπιες ρίζες αν είναι δυνατή η μεταφύτευση.',
        },
      },
      {
        label: 'Όχι',
        result: {
          problem: 'Πιθανή Μυκητολογική Προσβολή Ριζόσφαιρας',
          cause: 'Χωρίς υπερβολικό πότισμα, η μυρωδιά σαπίλας μπορεί να υποδεικνύει προϋπάρχον πρόβλημα αποστράγγισης του υποστρώματος.',
          treatment: 'Ελέγξτε τις οπές αποστράγγισης της γλάστρας για μπλοκάρισμα και εξετάστε ανανέωση του υποστρώματος με πιο αεριζόμενο μείγμα.',
        },
      },
    ],
  },
};

interface SymptomWizardProps {
  onJumpToDosageCalculator?: () => void;
}

export const SymptomWizard: React.FC<SymptomWizardProps> = ({ onJumpToDosageCalculator }) => {
  const [stepKey, setStepKey] = useState<string>('start');
  const [result, setResult] = useState<WizardResult | null>(null);
  const [path, setPath] = useState<string[]>([]);

  const step = STEPS[stepKey];

  const handleChoose = (option: WizardOption) => {
    if (option.result) {
      setResult(option.result);
    } else if (option.next) {
      setPath((p) => [...p, stepKey]);
      setStepKey(option.next);
    }
  };

  const handleReset = () => {
    setStepKey('start');
    setResult(null);
    setPath([]);
  };

  return (
    <div id="symptom-wizard" className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100 tracking-tight">Γρήγορος Διαγνώστης Συμπτωμάτων</h3>
          <p className="text-xs text-slate-400">Απαντήστε 1-2 ερωτήσεις για άμεση διάγνωση, χωρίς φωτογραφία</p>
        </div>
      </div>

      {!result && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-200">{step.question}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {step.options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => handleChoose(opt)}
                className="flex items-center justify-between gap-2 text-left bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/40 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              >
                {opt.label}
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-4">
            <h4 className="text-sm font-extrabold text-slate-100 mb-2">{result.problem}</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              <span className="font-bold text-slate-200">Αιτία: </span>{result.cause}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-200">Θεραπεία: </span>{result.treatment}
            </p>
          </div>
          {result.recipeHint && onJumpToDosageCalculator && (
            <button
              onClick={onJumpToDosageCalculator}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              {result.recipeHint}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Νέα Διάγνωση
          </button>
        </div>
      )}
    </div>
  );
};
