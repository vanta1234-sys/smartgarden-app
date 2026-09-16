import React, { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getLunarInfo, getLunarGuidance } from '../services/lunarService';

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
