import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Moon, Sprout, Scissors, Info, ArrowUpRight } from 'lucide-react';
import { getLunarInfo, getLunarGuidance, LunarInfo } from '../services/lunarService';

const MONTHS = ['Ιανουαρίου','Φεβρουαρίου','Μαρτίου','Απριλίου','Μαΐου','Ιουνίου','Ιουλίου','Αυγούστου','Σεπτεμβρίου','Οκτωβρίου','Νοεμβρίου','Δεκεμβρίου'];
const DAYS = ['Κυριακή','Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο'];

function fmt(d: Date) {
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Compact badge for the homepage — the daily-return hook, not the search asset. */
export const LunarBadge: React.FC = () => {
  const info = useMemo(() => getLunarInfo(), []);
  const guidance = useMemo(() => getLunarGuidance(info), [info]);

  return (
    <a
      href="/selini"
      onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/selini'); window.location.reload(); }}
      className="block bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl leading-none shrink-0" aria-hidden="true">{info.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-100">{info.phaseName}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600/15 text-emerald-700 border border-emerald-600/25">
              {info.periodLabel}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{guidance.headline}</p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 shrink-0" />
      </div>
    </a>
  );
};

export const LunarCalendarPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [offset, setOffset] = useState(0);

  const date = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);

  const info: LunarInfo = useMemo(() => getLunarInfo(date), [date]);
  const guidance = useMemo(() => getLunarGuidance(info), [info]);

  useEffect(() => {
    document.title = 'Σεληνιακό Ημερολόγιο Κηπουρικής: Τι Φυτεύουμε στη Χάση & στη Γέμιση — SmartGarden.gr';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Φάση σελήνης σήμερα και τι λέει η ελληνική παράδοση για σπορά, φύτευση και κλάδεμα στη χάση και στη γέμιση — μαζί με το τι δείχνουν πραγματικά τα γεωπονικά δεδομένα.'
      );
    }
  }, []);

  const upcoming = useMemo(() => {
    const out: { date: Date; info: LunarInfo }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push({ date: d, info: getLunarInfo(d) });
    }
    return out;
  }, []);

  return (
    <div role="main" className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην αρχική
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <Moon className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Σεληνιακό Ημερολόγιο Κηπουρικής
            </h1>
            <p className="text-sm text-slate-400">Τι λέει η παράδοση για τη χάση και τη γέμιση — και τι λέει η γεωπονία</p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => setOffset((o) => o - 1)}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-600 cursor-pointer px-2 py-1"
            >
              ← Χθες
            </button>
            <span className="text-sm font-bold text-slate-200">{offset === 0 ? 'Σήμερα' : fmt(date)}</span>
            <button
              onClick={() => setOffset((o) => o + 1)}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-600 cursor-pointer px-2 py-1"
            >
              Αύριο →
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <span className="text-7xl leading-none" aria-hidden="true">{info.emoji}</span>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h2 className="text-2xl font-extrabold text-slate-100">{info.phaseName}</h2>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-600/15 text-emerald-700 border border-emerald-600/25">
                  {info.periodLabel}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Φωτισμός {Math.round(info.illumination * 100)}% · ηλικία {info.ageDays.toFixed(1)} ημερών
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Επόμενη νέα σελήνη σε {Math.round(info.daysToNextNewMoon)} ημέρες · πανσέληνος σε {Math.round(info.daysToNextFullMoon)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-2 mb-3">
              <Sprout className="w-4 h-4" />
              {guidance.headline}
            </h3>
            <ul className="space-y-2">
              {guidance.traditional.map((t) => (
                <li key={t} className="text-sm text-slate-200 flex items-start gap-2 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-rose-950/40 border border-rose-800/40 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-3">
              <Scissors className="w-4 h-4" />
              Η παράδοση αποφεύγει
            </h3>
            <ul className="space-y-2">
              {guidance.avoid.map((t) => (
                <li key={t} className="text-sm text-slate-200 flex items-start gap-2 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-sky-300" />
            Τι λέει η γεωπονία
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">{guidance.agronomyNote}</p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-3">Οι επόμενες 14 ημέρες</h3>
          <div className="grid grid-cols-7 gap-1.5">
            {upcoming.map(({ date: d, info: li }, i) => (
              <div
                key={i}
                title={`${fmt(d)} — ${li.phaseName}`}
                className={`rounded-lg py-2 text-center border ${
                  i === 0 ? 'bg-emerald-600/15 border-emerald-600/30' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="text-base leading-none" aria-hidden="true">{li.emoji}</div>
                <div className="text-[10px] text-slate-400 mt-1">{d.getDate()}/{d.getMonth() + 1}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Η φάση υπολογίζεται από τον μέσο συνοδικό μήνα (29,53 ημέρες). Επαληθεύτηκε σε πραγματικές
            εκλείψεις με απόκλιση κάτω από μισή ημέρα.
          </p>
        </div>
      </div>
    </div>
  );
};
