import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { MONTH_NAMES_EL, MONTHLY_GUIDES } from './SeasonalAdviceBar';

interface PlantingCalendarPageProps {
  onBack: () => void;
}

export const PlantingCalendarPage: React.FC<PlantingCalendarPageProps> = ({ onBack }) => {
  const currentMonthIndex = new Date().getMonth();
  const [activeMonth, setActiveMonth] = useState<number>(currentMonthIndex);
  const [activeBadge, setActiveBadge] = useState<string>('all');

  useEffect(() => {
    document.title = `Ημερολόγιο Σποράς & Εργασιών Κήπου — SmartGarden.gr`;
    let meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Τι σπέρνουμε, τι κλαδεύουμε και τι λιπαίνουμε κάθε μήνα στο ελληνικό μπαλκόνι & κήπο. Πλήρες ημερολόγιο εργασιών για όλο το χρόνο.');
    }
  }, []);

  const allBadges = useMemo(() => {
    const set = new Set<string>();
    Object.values(MONTHLY_GUIDES).forEach((tasks) => tasks.forEach((t) => set.add(t.badge)));
    return Array.from(set);
  }, []);

  const tasks = (MONTHLY_GUIDES[activeMonth] || []).filter(
    (t) => activeBadge === 'all' || t.badge === activeBadge
  );

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην αρχική
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Ημερολόγιο Σποράς &amp; Εργασιών Κήπου</h1>
            <p className="text-sm text-slate-400">Τι κάνουμε κάθε μήνα στο ελληνικό μπαλκόνι &amp; κήπο</p>
          </div>
        </div>

        {/* Month selector */}
        <div className="flex flex-wrap gap-2">
          {MONTH_NAMES_EL.map((name, idx) => (
            <button
              key={name}
              onClick={() => setActiveMonth(idx)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                activeMonth === idx
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-500/40'
              }`}
            >
              {name}
              {idx === currentMonthIndex && <span className="ml-1 opacity-70">•</span>}
            </button>
          ))}
        </div>

        {/* Task-type filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveBadge('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer ${
              activeBadge === 'all' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            Όλες οι εργασίες
          </button>
          {allBadges.map((b) => (
            <button
              key={b}
              onClick={() => setActiveBadge(b)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer ${
                activeBadge === b ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task, idx) => (
            <div
              key={idx}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xl">{task.icon}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${task.tagColor}`}>
                  {task.badge}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug mb-1.5">{task.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{task.desc}</p>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-slate-400 col-span-2">Δεν υπάρχουν εργασίες αυτού του τύπου για τον {MONTH_NAMES_EL[activeMonth]}.</p>
          )}
        </div>
      </div>
    </div>
  );
};
