import React from 'react';
import { Leaf, Snowflake, MessageCircleQuestion, ArrowUpRight } from 'lucide-react';
import { PLANTS } from '../data/plantDatabase';

/** Lowercase and strip Greek accents so "Ντομάτας" still matches "Ντομάτα". */
function normalise(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * Finds plants the article is actually about, by matching a stem of each plant's name
 * against the title and summary. Stem matching catches inflected Greek forms
 * (ντομάτα / ντομάτας / ντομάτες) that an exact match would miss. Names shorter than
 * 5 characters are matched in full instead, since a 3-4 letter stem produces
 * false positives.
 */
function matchPlants(title: string, summary: string) {
  const haystack = normalise(title + ' ' + summary);
  return PLANTS.filter((p) => {
    const name = normalise(p.name.split(/[\s/(]/)[0]);
    if (name.length < 5) return haystack.includes(name);
    return haystack.includes(name.slice(0, Math.max(5, name.length - 1)));
  }).slice(0, 3);
}

interface ArticleToolLinksProps {
  title: string;
  summary: string;
}

const go = (path: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  window.history.pushState(null, '', path);
  window.location.reload();
};

export const ArticleToolLinks: React.FC<ArticleToolLinksProps> = ({ title, summary }) => {
  const plants = matchPlants(title, summary);

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-3">
      <div className="font-bold text-slate-300 text-xs uppercase tracking-wider">
        Εργαλεία & δεδομένα για αυτό το άρθρο
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {plants.map((p) => (
          <a
            key={p.slug}
            href={`/fyta/${p.slug}`}
            onClick={go(`/fyta/${p.slug}`)}
            className="flex items-center justify-between gap-2 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl px-3.5 py-2.5 transition-colors group"
          >
            <span className="flex items-center gap-2 text-xs text-slate-200">
              <Leaf className="w-3.5 h-3.5 text-lime-400 shrink-0" />
              <span>
                <strong className="font-semibold">{p.name}</strong>
                <span className="text-slate-500"> · αντέχει {p.minTempC}°C</span>
              </span>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 shrink-0" />
          </a>
        ))}

        <a
          href="/pagetos"
          onClick={go('/pagetos')}
          className="flex items-center justify-between gap-2 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl px-3.5 py-2.5 transition-colors group"
        >
          <span className="flex items-center gap-2 text-xs text-slate-200">
            <Snowflake className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            Πότε περνά ο παγετός στην περιοχή σας
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-sky-400 shrink-0" />
        </a>

        <a
          href="/rotiste"
          onClick={go('/rotiste')}
          className="flex items-center justify-between gap-2 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl px-3.5 py-2.5 transition-colors group"
        >
          <span className="flex items-center gap-2 text-xs text-slate-200">
            <MessageCircleQuestion className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            Έχετε ερώτηση; Ρωτήστε τον γεωπόνο
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 shrink-0" />
        </a>
      </div>
    </div>
  );
};
