import React, { useEffect } from 'react';
import { pageTitle } from '../utils/seoTitle';
import { BookOpen, ArrowLeft, Clock } from 'lucide-react';
import { ArticleItem } from '../types';

interface CategoryPageProps {
  articles: ArticleItem[];
  categorySlug: string;
  onOpenArticle: (article: ArticleItem) => void;
  onBack: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ articles, categorySlug, onOpenArticle, onBack }) => {
  const matches = articles.filter((a) => a.category === categorySlug);
  const label = matches[0]?.categoryLabel?.el || categorySlug;

  // Two categories hold one article each. static-meta.php fills those pages out for a
  // crawler, but Google indexes what React renders — and React was rendering a single
  // card, so the page came back down to ~400 characters the moment the app mounted. The
  // same articles the server offers are offered here.
  const others = matches.length < 4
    ? articles.filter((a) => a.category !== categorySlug).slice(0, 12)
    : [];

  useEffect(() => {
    document.title = pageTitle(`${label} — Οδηγοί & Άρθρα | SmartGarden.gr`);
    let meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', `Όλοι οι οδηγοί SmartGarden.gr για ${label}: ${matches.length} επιστημονικά άρθρα κηπουρικής για το ελληνικό κλίμα.`);
    }
  }, [label, matches.length]);

  return (
    <div role="main" className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην αρχική
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">{label}</h1>
            <p className="text-sm text-slate-400">{matches.length} άρθρα &amp; οδηγοί</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((article) => (
            <button
              key={article.id}
              onClick={() => onOpenArticle(article)}
              className="text-left bg-slate-950/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl overflow-hidden transition-colors cursor-pointer group"
            >
              <div className="aspect-video overflow-hidden bg-slate-900">
                <img
                  src={article.image}
                  alt={article.title.el}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 space-y-2">
                <h2 className="text-sm font-bold text-slate-100 leading-snug line-clamp-2">{article.title.el}</h2>
                <p className="text-xs text-slate-400 line-clamp-2">{article.summary.el}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{article.readTime}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {matches.length === 0 && (
          <p className="text-sm text-slate-400">Δεν βρέθηκαν άρθρα σε αυτή την κατηγορία προς το παρόν.</p>
        )}

        {others.length > 0 && (
          <section className="pt-4 border-t border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-slate-100">Πρόσφατα από τις υπόλοιπες κατηγορίες</h2>
            <ul className="space-y-3">
              {others.map((article) => (
                <li key={article.id}>
                  <button
                    onClick={() => onOpenArticle(article)}
                    className="text-left w-full group cursor-pointer"
                  >
                    <span className="block text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {article.title.el}
                    </span>
                    <span className="block text-xs text-slate-400 mt-0.5 line-clamp-2">{article.summary.el}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};
