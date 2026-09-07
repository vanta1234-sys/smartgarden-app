import React from 'react';
import { Calendar, ShieldCheck, Sparkles, AlertTriangle, Droplets, Scissors, Sun, Award } from 'lucide-react';

const MONTH_NAMES_EL = [
  'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
  'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
];

interface MonthlyTask {
  title: string;
  desc: string;
  icon: string;
  badge: string;
  tagColor: string;
}

const MONTHLY_GUIDES: Record<number, MonthlyTask[]> = {
  // January (0)
  0: [
    {
      title: 'Προστασία από Παγετό',
      desc: 'Καλύψτε ευαίσθητα φυτά με αντιπαγετική υφασμάτινη μεμβράνη (fleece) τις κρύες νύχτες και μεταφέρετε τις πιο ευπαθείς γλάστρες (εσπεριδοειδή, δροσερά) σε προστατευμένο σημείο.',
      icon: '❄️',
      badge: 'Προστασία',
      tagColor: 'text-sky-300 bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'Κλάδεμα Φυλλοβόλων Καρποφόρων',
      desc: 'Στη φάση χειμερίας ανάπαυσης, κλαδέψτε φυλλοβόλα καρποφόρα (μηλιά, αχλαδιά, συκιά) για διαμόρφωση σχήματος πριν ξεκινήσει η άνοιξη.',
      icon: '✂️',
      badge: 'Κλάδεμα',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Ελάχιστο Πότισμα Χειμώνα',
      desc: 'Ποτίστε μόνο όταν το υπόστρωμα είναι εντελώς στεγνό σε βάθος 5cm. Η υπερβολική υγρασία σε χαμηλές θερμοκρασίες προκαλεί σήψη ριζών.',
      icon: '💧',
      badge: 'Άρδευση',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    }
  ],
  // February (1)
  1: [
    {
      title: 'Κλάδεμα Διαμόρφωσης Εσπεριδοειδών',
      desc: 'Ιδανική περίοδος για κλάδεμα διαμόρφωσης σε λεμονιά, μανταρινιά και κουμκουάτ. Αφαιρέστε λαίμαργους βλαστούς και "λαγούς" από το υποκείμενο.',
      icon: '🍋',
      badge: 'Κλάδεμα',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Κλάδεμα Τριανταφυλλιάς',
      desc: 'Κλαδέψτε τις τριανταφυλλιές πριν την έναρξη της νέας βλάστησης, αφήνοντας 3-5 υγιείς οφθαλμούς ανά κλαδί για δυνατή ανθοφορία.',
      icon: '🌹',
      badge: 'Κλάδεμα',
      tagColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    },
    {
      title: 'Προετοιμασία Υποστρώματος για Άνοιξη',
      desc: 'Ανανεώστε τα πρώτα εκατοστά χώματος στις γλάστρες με φρέσκο υπόστρωμα εμπλουτισμένο με κομπόστ, πριν την έκρηξη της ανοιξιάτικης βλάστησης.',
      icon: '🧪',
      badge: 'Θρέψη',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ],
  // March (2)
  2: [
    {
      title: 'Έναρξη Λίπανσης Ανοιξιάτικης Βλάστησης',
      desc: 'Ξεκινήστε σταδιακά τη λίπανση καθώς τα φυτά βγαίνουν από τον λήθαργο. Προτιμήστε ισορροπημένο λίπασμα με ιχνοστοιχεία.',
      icon: '🧪',
      badge: 'Θρέψη',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      title: 'Σπορά Ντομάτας & Πιπεριάς σε Δίσκους',
      desc: 'Σπείρετε ντομάτα, πιπεριά και μελιτζάνα σε δίσκους βλάστησης σε προστατευμένο, φωτεινό σημείο για μεταφύτευση τον Απρίλιο.',
      icon: '🌱',
      badge: 'Σπορά & Φύτευση',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Έλεγχος για Αφίδες σε Νέα Βλάστηση',
      desc: 'Η τρυφερή ανοιξιάτικη βλάστηση προσελκύει αφίδες. Ελέγχετε τις κορυφές των βλαστών και επέμβετε νωρίς με σαπούνι καλίου.',
      icon: '🛡️',
      badge: 'Φυτοπροστασία',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    }
  ],
  // April (3)
  3: [
    {
      title: 'Μεταφύτευση Ντομάτας & Πιπεριάς',
      desc: 'Μεταφυτεύστε τα σπορόφυτα ντομάτας, πιπεριάς και μελιτζάνας στην τελική τους γλάστρα, αφού περάσει ο κίνδυνος όψιμου παγετού.',
      icon: '🍅',
      badge: 'Σπορά & Φύτευση',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Αύξηση Συχνότητας Ποτίσματος',
      desc: 'Με την άνοδο της θερμοκρασίας, αυξήστε σταδιακά τη συχνότητα ποτίσματος, ελέγχοντας πάντα την υγρασία του υποστρώματος πριν ποτίσετε.',
      icon: '💧',
      badge: 'Άρδευση',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Προστασία Ανθοφορίας Εσπεριδοειδών',
      desc: 'Αποφύγετε υδατικό στρες κατά την ανθοφορία των εσπεριδοειδών· η ξηρασία ή το απότομο κρύο προκαλούν πτώση άνθεων και μειωμένη καρπόδεση.',
      icon: '🌸',
      badge: 'Φροντίδα',
      tagColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20'
    }
  ],
  // May (4)
  4: [
    {
      title: 'Καταπολέμηση Κοκκοειδών & Αφίδων',
      desc: 'Η πίεση εντόμων κορυφώνεται. Ψεκάστε προληπτικά με σαπούνι καλίου στην κάτω επιφάνεια των φύλλων κάθε 7-10 ημέρες.',
      icon: '🛡️',
      badge: 'Φυτοπροστασία',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Τακτικό Πρωινό Πότισμα',
      desc: 'Καθιερώστε πότισμα νωρίς το πρωί καθώς ανεβαίνει η θερμοκρασία, ώστε το φυτό να έχει διαθέσιμη υγρασία πριν την ηλιακή αιχμή.',
      icon: '💧',
      badge: 'Άρδευση',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Υποστήριξη Ντομάτας με Πασσάλους',
      desc: 'Τοποθετήστε πασσάλους ή κλωβούς στήριξης στις ντομάτες πριν αναπτυχθούν πολύ, για να αποφύγετε σπάσιμο βλαστών από τον καρπό.',
      icon: '🍅',
      badge: 'Φροντίδα',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  ],
  // June (5)
  5: [
    {
      title: 'Φυσιολογική Καρπόπτωση Εσπεριδοειδών (June Drop)',
      desc: 'Μια φυσιολογική πτώση μικρών καρπών στα εσπεριδοειδή είναι αναμενόμενη αυτή την περίοδο· μην ανησυχείτε, μειώστε απλώς το άζωτο και αυξήστε το κάλιο.',
      icon: '🍊',
      badge: 'Φροντίδα',
      tagColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    },
    {
      title: 'Πρωινό Πότισμα & Mulching',
      desc: 'Προσθέστε στρώση mulch (ξερά φύλλα, άχυρο) στην επιφάνεια της γλάστρας για συγκράτηση υγρασίας και μειωμένη εξάτμιση.',
      icon: '💧',
      badge: 'Άρδευση',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Συγκομιδή Πρώιμων Λαχανικών',
      desc: 'Συγκομίστε πρώιμες ντομάτες, κολοκυθάκια και αγγούρια τακτικά, ώστε το φυτό να συνεχίσει να παράγει νέους καρπούς.',
      icon: '🥒',
      badge: 'Συγκομιδή',
      tagColor: 'text-lime-400 bg-lime-500/10 border-lime-500/20'
    }
  ],
  // July (6)
  6: [
    {
      title: 'Εντατικό Πότισμα Καύσωνα',
      desc: 'Σε ακραίες θερμοκρασίες, ποτίστε νωρίς το πρωί (πριν τις 08:00) και ελέγξτε αν χρειάζεται δεύτερο ελαφρύ πότισμα το απόγευμα για μικρές γλάστρες.',
      icon: '🔥',
      badge: 'Άρδευση',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Σκίαση Ευαίσθητων Φυτών',
      desc: 'Τοποθετήστε δίχτυ σκίασης 30-40% σε σπορόφυτα, μπονσάι και καλλωπιστικά που δεν αντέχουν το άμεσο μεσημεριανό ηλιακό φως.',
      icon: '☀️',
      badge: 'Προστασία',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Αποφυγή Λίπανσης σε Ακραία Ζέστη',
      desc: 'Μην λιπαίνετε τις πιο καυτές ημέρες· ο συνδυασμός λιπάσματος και υδατικού στρες μπορεί να κάψει το ριζικό σύστημα.',
      icon: '🧪',
      badge: 'Θρέψη',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ],
  // August (7 in 0-indexed)
  7: [
    {
      title: 'Προστασία από Τετράνυχο & Θρίπες',
      desc: 'Οι ξηροθερμικές συνθήκες ευνοούν τον κόκκινο τετράνυχο σε ντομάτες και ανθοφόρα. Ψεκάστε τις απογευματινές ώρες με διάλυμα πράσινου σαπουνιού.',
      icon: '🛡️',
      badge: 'Φυτοπροστασία',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Στρατηγική Ποτίσματος Καύσωνα',
      desc: 'Ποτίζετε αποκλειστικά νωρίς το πρωί. Μην αφήνετε λιμνάζον νερό στα πιατάκια πάνω από 30 λεπτά για να προστατεύσετε το ριζικό σύστημα.',
      icon: '💧',
      badge: 'Άρδευση',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Κορυφολόγημα & Αφαίρεση Ξερών',
      desc: 'Αφαιρέστε τα απανθισμένα λουλούδια σε πετούνιες και γεράνια. Κορφολογήστε τον βασιλικό για να μην σποριάσει και να συνεχίσει να βγάζει φρέσκα φύλλα.',
      icon: '✂️',
      badge: 'Φροντίδα',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  ],
  // September (8)
  8: [
    {
      title: 'Φύτευση Φθινοπωρινών Λαχανικών',
      desc: 'Ξεκινήστε τη φύτευση σε ζαρντινιέρες: σπανάκι, μαρούλια, ρόκα, ραπανάκια και φρέσκα κρεμμυδάκια για συγκομιδή όλο το φθινόπωρο.',
      icon: '🌱',
      badge: 'Σπορά & Φύτευση',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Μείωση Συχνότητας Ποτίσματος',
      desc: 'Καθώς μειώνονται οι ώρες ηλιοφάνειας, μειώστε σταδιακά την ποσότητα νερού για να αποφύγετε μυκητολογικές προσβολές (ωίδιο, βοτρύτη).',
      icon: '💧',
      badge: 'Άρδευση',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Φθινοπωρινή Οργανική Λίπανση',
      desc: 'Ενισχύστε τα καλλωπιστικά φυτά και τα πολυετή με χούμο γαιοσκωλήκων ή βιολογικό κομπόστ για ανάκαμψη από το καλοκαιρινό στρες.',
      icon: '🧪',
      badge: 'Θρέψη',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ],
  // October (9)
  9: [
    {
      title: 'Φύτευση Ανοιξιάτικων Βολβών',
      desc: 'Φυτέψτε βολβούς (τουλίπες, νάρκισσους, κρόκους) σε γλάστρες βάθους 15-20cm για ανθοφορία την επόμενη άνοιξη.',
      icon: '🌷',
      badge: 'Σπορά & Φύτευση',
      tagColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      title: 'Συνέχιση Φθινοπωρινών Λαχανικών',
      desc: 'Συνεχίστε τη φύτευση σπανακιού, μαρουλιού και αρωματικών βοτάνων· οι δροσερές θερμοκρασίες ευνοούν γρήγορη ριζοβολία.',
      icon: '🌱',
      badge: 'Σπορά & Φύτευση',
      tagColor: 'text-lime-400 bg-lime-500/10 border-lime-500/20'
    },
    {
      title: 'Τελευταία Λίπανση προ Χειμώνα',
      desc: 'Εφαρμόστε μια τελευταία λίπανση πλούσια σε κάλιο στα πολυετή και τα εσπεριδοειδή για ενίσχυση αντοχής πριν το κρύο.',
      icon: '🧪',
      badge: 'Θρέψη',
      tagColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ],
  // November (10)
  10: [
    {
      title: 'Προστασία από Πρώιμο Ψύχος',
      desc: 'Παρακολουθήστε τις βραδινές θερμοκρασίες και καλύψτε ευαίσθητα φυτά (βασιλικός, καλοκαιρινά καλλωπιστικά) στα πρώτα κρύα βράδια.',
      icon: '🥶',
      badge: 'Προστασία',
      tagColor: 'text-sky-300 bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'Μείωση Ποτίσματος στο Ελάχιστο',
      desc: 'Καθώς μειώνεται η εξάτμιση, περιορίστε το πότισμα στο απολύτως απαραίτητο για να αποφύγετε σήψη ριζών με το κρύο.',
      icon: '💧',
      badge: 'Άρδευση',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    },
    {
      title: 'Συγκομιδή Ελιάς',
      desc: 'Για ελιές σε γλάστρα ή μπονσάι με καρπό, ξεκινήστε τη συγκομιδή όταν οι ελιές αποκτήσουν το επιθυμητό χρώμα ωρίμανσης.',
      icon: '🫒',
      badge: 'Συγκομιδή',
      tagColor: 'text-lime-400 bg-lime-500/10 border-lime-500/20'
    }
  ],
  // December (11)
  11: [
    {
      title: 'Χειμερινή Ανάπαυση Φυτών',
      desc: 'Τα φυλλοβόλα και πολλά πολυετή εισέρχονται σε λήθαργο· περιορίστε παρεμβάσεις (λίπανση, κλάδεμα) εκτός από αφαίρεση ξερών.',
      icon: '🍂',
      badge: 'Φροντίδα',
      tagColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      title: 'Προστασία Γλαστρών από Παγετό',
      desc: 'Τυλίξτε τις γλάστρες με φυσαλιδωτό νάιλον ή μετακινήστε τις κοντά σε τοίχο προστατευμένο από βόρειους ανέμους για μόνωση των ριζών.',
      icon: '❄️',
      badge: 'Προστασία',
      tagColor: 'text-sky-300 bg-sky-500/10 border-sky-500/20'
    },
    {
      title: 'Έλεγχος Αποστράγγισης σε Βροχερές Μέρες',
      desc: 'Βεβαιωθείτε ότι οι οπές αποστράγγισης δεν έχουν φράξει· το λιμνάζον νερό τον χειμώνα είναι η συχνότερη αιτία σήψης ριζών.',
      icon: '🕳️',
      badge: 'Φροντίδα',
      tagColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
    }
  ]
};

export const SeasonalAdviceBar: React.FC = () => {
  const currentMonthIndex = new Date().getMonth();
  const currentMonthName = MONTH_NAMES_EL[currentMonthIndex];
  
  // Fallback to August or September guide
  const tasks = MONTHLY_GUIDES[currentMonthIndex] || MONTHLY_GUIDES[7];

  return (
    <div id="seasonal-advice-bar" className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Ημερολόγιο Μπαλκονιού: <span className="text-amber-400">{currentMonthName}</span>
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Award className="w-3 h-3" />
                E-E-A-T Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Εποχιακές προτεραιότητες και γεωπονικές οδηγίες για το μεσογειακό μικροκλίμα του μήνα
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-medium">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span>Ελληνικό Μικροκλίμα & Αστικό Μπαλκόνι</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tasks.map((task, idx) => (
          <div
            key={idx}
            className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xl">{task.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${task.tagColor}`}>
                  {task.badge}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white leading-snug mb-1.5">{task.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">{task.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
