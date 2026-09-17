import React from 'react';
import { Leaf, Snowflake, MessageCircleQuestion, ArrowUpRight } from 'lucide-react';
import { PLANT_INDEX } from '../data/plantIndex';
import { plantsMentioned } from '../utils/plantMentions';

/**
 * This component used to carry its own plant matcher and import the full 42KB
 * plantDatabase to do it — into the main bundle, for every visitor, to render three links.
 * It now shares plantsMentioned with the server, so the links a crawler is served and the
 * links a reader sees are the same ones, and it reads the 4KB generated index instead.
 */
const MIN_TEMP = new Map(PLANT_INDEX.map((p) => [p.slug, p.minTempC]));

interface ArticleToolLinksProps {
  title: string;
  summary: string;
  /** The body as well, where there is one: most plants are named in it, not in the title. */
  content?: string;
}

const go = (path: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  window.history.pushState(null, '', path);
  window.location.reload();
};

export const ArticleToolLinks: React.FC<ArticleToolLinksProps> = ({ title, summary, content = '' }) => {
  const plants = plantsMentioned(`${title} ${summary} ${content}`, 4);

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
                <span className="text-slate-500"> · αντέχει {MIN_TEMP.get(p.slug)}°C</span>
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
