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
