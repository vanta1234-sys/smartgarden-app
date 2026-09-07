import React, { useEffect } from 'react';
import { ArrowLeft, GraduationCap, BookOpen, Award } from 'lucide-react';
import { ArticleItem } from '../types';

interface AuthorBioPageProps {
  articles: ArticleItem[];
  onOpenArticle: (article: ArticleItem) => void;
  onBack: () => void;
}

const AUTHOR_NAME = 'Κώστας Αναστασιάδης';
const AUTHOR_ROLE = 'Γεωπόνος M.Sc. & Smart Farming Specialist';
const AUTHOR_BIO = `Ο Κώστας Αναστασιάδης είναι γεωπόνος με μεταπτυχιακό (M.Sc.) στην εφαρμοσμένη βοτανική φυσιολογία και ειδίκευση σε τεχνολογίες ακριβείας γεωργίας (Smart Farming) για αστικές και οικιακές καλλιέργειες. Στο SmartGarden.gr γράφει επιστημονικά τεκμηριωμένους οδηγούς κηπουρικής προσαρμοσμένους στο ελληνικό μεσογειακό κλίμα — από τη χλώρωση σιδήρου σε εσπεριδοειδή μέχρι τον σχεδιασμό αυτόματου ποτίσματος με δεδομένα εξατμισοδιαπνοής (ET₀) σε πραγματικό χρόνο.`;

export const AuthorBioPage: React.FC<AuthorBioPageProps> = ({ articles, onOpenArticle, onBack }) => {
  const byAuthor = articles.filter((a) => a.author?.name === AUTHOR_NAME);

  useEffect(() => {
    document.title = `${AUTHOR_NAME} — ${AUTHOR_ROLE} | SmartGarden.gr`;
    let meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', `Βιογραφικό & άρθρα του ${AUTHOR_NAME}, ${AUTHOR_ROLE} στο SmartGarden.gr.`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην αρχική
        </button>

        <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-2xl shrink-0">
              {AUTHOR_NAME.split(' ').map((w) => w[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{AUTHOR_NAME}</h1>
              <p className="text-emerald-400 font-semibold text-sm">{AUTHOR_ROLE}</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">{AUTHOR_BIO}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-300">Γεωπονία, M.Sc.</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-300">Smart Farming Specialist</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-slate-300">{byAuthor.length} δημοσιευμένοι οδηγοί</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Άρθρα του {AUTHOR_NAME.split(' ')[0]}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {byAuthor.slice(0, 20).map((article) => (
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
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{article.title.el}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
