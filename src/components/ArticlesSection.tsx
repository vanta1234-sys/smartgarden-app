import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Clock, 
  Heart, 
  Sparkles, 
  ArrowRight, 
  Filter, 
  BookOpen, 
  Share2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Film
} from 'lucide-react';
import { Article, ArticleCategory, Language } from '../types';
import { ARTICLES_DATA, getRelativeGreekDate } from '../data/mockData';
import { fetchWordPressPosts } from '../services/wordpress';
import { CartoonHoverPlayer } from './CartoonHoverPlayer';

interface ArticlesSectionProps {
  lang: Language;
  onSelectArticle: (article: Article) => void;
  likedArticles: Record<string, boolean>;
  onToggleLike: (id: string) => void;
  onOpenSocialStudio: () => void;
  onOpenCartoonVideo?: (article: Article) => void;
}

export const ArticlesSection: React.FC<ArticlesSectionProps> = ({
  lang,
  onSelectArticle,
  likedArticles,
  onToggleLike,
  onOpenSocialStudio,
  onOpenCartoonVideo,
}) => {
  const [articlesList, setArticlesList] = useState<Article[]>(ARTICLES_DATA);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingWP, setIsLoadingWP] = useState(false);
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);

  useEffect(() => {
    async function loadWP() {
      try {
        setIsLoadingWP(true);
        const posts = await fetchWordPressPosts();
        if (posts && posts.length > 0) {
          setArticlesList(posts);
        }
      } catch (e) {
        // keep default
      } finally {
        setIsLoadingWP(false);
      }
    }
    loadWP();
  }, []);

  const categories: { id: ArticleCategory; label: { el: string; en: string } }[] = [
    { id: 'all', label: { el: 'Όλα τα Άρθρα', en: 'All Articles' } },
    { id: 'balcony', label: { el: 'Μπαλκόνι & Γλάστρες', en: 'Balcony & Pots' } },
    { id: 'vegetable_garden', label: { el: 'Λαχανόκηπος', en: 'Vegetable Garden' } },
    { id: 'irrigation_iot', label: { el: 'Αυτόματο Πότισμα & IoT', en: 'Smart Irrigation & IoT' } },
    { id: 'robotic_mowers', label: { el: 'Ρομποτικά Mowers', en: 'Robotic Mowers' } },
    { id: 'plant_care', label: { el: 'Φροντίδα Φυτών', en: 'Plant Care' } },
  ];

  const filteredArticles = useMemo(() => {
    return articlesList.filter((article) => {
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const titleText = (article.title[lang] || article.title.el || '').toLowerCase();
      const summaryText = (article.summary[lang] || article.summary.el || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || titleText.includes(query) || summaryText.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [articlesList, selectedCategory, searchQuery, lang]);

  const featuredArticle = articlesList.find((a) => a.featured) || articlesList[0];

  // Seasonal Tips: surface articles that mention the current month, Garden-Betty style.
  // Falls back to most recent articles if nothing matches this month yet.
  const GREEK_MONTHS = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonthName = lang === 'el' ? GREEK_MONTHS[new Date().getMonth()] : EN_MONTHS[new Date().getMonth()];

  const seasonalArticles = useMemo(() => {
    const matched = articlesList.filter((a) => {
      const title = a.title[lang] || a.title.el || '';
      const sum = a.summary[lang] || a.summary.el || '';
      return title.includes(currentMonthName) || sum.includes(currentMonthName);
    });
    if (matched.length >= 3) return matched.slice(0, 6);
    return articlesList.slice(0, 6);
  }, [articlesList, lang, currentMonthName]);

  return (
    <section id="articles-section" className="py-14 sm:py-20 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-neutral-200/80 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lang === 'el' ? 'Ψηφιακό Περιοδικό' : 'Digital Magazine'}</span>
            </div>
            <h2 id="articles-heading" className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-slate-100 tracking-tight">
              {lang === 'el' ? 'Καθημερινά Άρθρα & Οδηγοί Φροντίδας' : 'Daily Articles & Care Guides'}
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl">
              {lang === 'el'
                ? 'Επιστημονικές συμβουλές προσαρμοσμένες στο μικροκλίμα της Ελλάδας, με έτοιμα scripts για social media.'
                : 'Scientific advice tailored to Mediterranean microclimates, with copyable social media creator scripts.'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="search-articles-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'el' ? 'Αναζήτηση άρθρων...' : 'Search articles...'}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-slate-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Seasonal Tips Band */}
        <div id="seasonal-tips-band" className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/60">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              {lang === 'el' ? `Εποχιακές Συμβουλές: ${currentMonthName}` : `Seasonal Tips: ${currentMonthName}`}
            </span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
            {seasonalArticles.map((article) => (
              <button
                key={`seasonal-${article.id}`}
                onClick={() => onSelectArticle(article)}
                className="shrink-0 w-56 text-left bg-white dark:bg-neutral-850 rounded-xl overflow-hidden border border-amber-200/60 dark:border-amber-800/40 hover:border-amber-500 shadow-xs hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="h-28 w-full overflow-hidden bg-neutral-900">
                  <img
                    src={article.image}
                    alt={article.title[lang] || article.title.el}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-slate-100 leading-snug line-clamp-2">
                    {article.title[lang] || article.title.el}
                  </h4>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div id="category-filter-pills" className="flex items-center gap-2 overflow-x-auto pb-3 mb-10 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 dark:bg-emerald-700 text-white shadow-sm'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500'
                }`}
              >
                {cat.label[lang]}
              </button>
            );
          })}
        </div>

        {/* Featured Big Article Banner (when no search query) */}
        {!searchQuery && selectedCategory === 'all' && featuredArticle && (
          <div 
            id="featured-article-card"
            onClick={() => onSelectArticle(featuredArticle)}
            onMouseEnter={() => setHoveredArticleId(featuredArticle.id)}
            onMouseLeave={() => setHoveredArticleId(null)}
            className="mb-12 rounded-3xl overflow-hidden bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 hover:border-emerald-500/80 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-full overflow-hidden bg-neutral-900">
                {/* Cartoon Fast-Motion Video Player on Hover */}
                {hoveredArticleId === featuredArticle.id ? (
                  <CartoonHoverPlayer
                    article={featuredArticle}
                    isHovered={true}
                    lang={lang}
                    className="w-full h-full animate-fade-in"
                  />
                ) : (
                  <img 
                    src={featuredArticle.image} 
                    alt={featuredArticle.title[lang] || featuredArticle.title.el} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-md">
                    ★ {lang === 'el' ? 'ΚΟΡΥΦΑΙΟ ΑΡΘΡΟ' : 'FEATURED GUIDE'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-slate-100 text-xs font-medium">
                    {featuredArticle.categoryLabel[lang] || featuredArticle.categoryLabel.el}
                  </span>
                </div>

                {/* Subtle Hover Cue Banner */}
                <div className="absolute bottom-3 right-3 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-md bg-neutral-900/85 backdrop-blur-md text-sky-300 text-[11px] font-bold flex items-center gap-1.5 shadow-sm border border-sky-500/30">
                    <Film className="w-3.5 h-3.5 text-sky-400" />
                    <span>{hoveredArticleId === featuredArticle.id ? (lang === 'el' ? '⚡ Αναπαραγωγή 16s Timelapse' : '⚡ Playing 16s Timelapse') : (lang === 'el' ? '🎬 Hover για 16s Cartoon Video' : '🎬 Hover for 16s Video')}</span>
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-3 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <Calendar className="w-3.5 h-3.5" />
                      {featuredArticle.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredArticle.readTime}
                    </span>
                    {featuredArticle.date === getRelativeGreekDate(0) && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-500/30">
                        {lang === 'el' ? '🔥 ΣΗΜΕΡΙΝΟ' : '🔥 TODAY'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-slate-100 tracking-tight leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {featuredArticle.title[lang] || featuredArticle.title.el}
                  </h3>

                  <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-4 line-clamp-3 leading-relaxed">
                    {featuredArticle.summary[lang] || featuredArticle.summary.el}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={featuredArticle.author.avatar} 
                      alt={featuredArticle.author.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {featuredArticle.author.name}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>{lang === 'el' ? 'Διαβάστε Περισσότερα' : 'Read Article'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div id="articles-cards-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredArticles.map((article) => {
            const isLiked = !!likedArticles[article.id];
            const isHovered = hoveredArticleId === article.id;

            return (
              <article
                key={article.id}
                id={`article-card-${article.id}`}
                onClick={() => onSelectArticle(article)}
                onMouseEnter={() => setHoveredArticleId(article.id)}
                onMouseLeave={() => setHoveredArticleId(null)}
                className="bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 rounded-2xl overflow-hidden hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col group"
              >
                {/* Card Image / Live Cartoon Hover Preview */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-neutral-900">
                  {isHovered ? (
                    <CartoonHoverPlayer
                      article={article}
                      isHovered={true}
                      lang={lang}
                      className="w-full h-full"
                    />
                  ) : (
                    <img
                      src={article.image}
                      alt={article.title[lang] || article.title.el}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5 pointer-events-none">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md text-[11px] font-bold text-neutral-800 dark:text-neutral-200 shadow-xs">
                      {article.categoryLabel[lang] || article.categoryLabel.el}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 pointer-events-none">
                    {!isHovered && (
                      <span className="px-2 py-0.5 rounded-md bg-neutral-900/80 backdrop-blur-xs text-sky-300 text-[10px] font-bold flex items-center gap-1 shadow-xs border border-sky-500/30">
                        <Film className="w-3 h-3 text-sky-400" />
                        <span>16s Video</span>
                      </span>
                    )}
                    {article.socialScriptReady && !isHovered && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        Script
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-2">
                      <span>{article.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-slate-100 tracking-tight leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {article.title[lang] || article.title.el}
                    </h3>

                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-2.5 line-clamp-2 leading-relaxed">
                      {article.summary[lang] || article.summary.el}
                    </p>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={article.author.avatar}
                        alt={article.author.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 truncate max-w-[100px]">
                        {article.author.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {onOpenCartoonVideo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCartoonVideo(article);
                          }}
                          className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        >
                          <Film className="w-3 h-3" />
                          <span>10s Video</span>
                        </button>
                      )}

                      <button
                        id={`like-btn-${article.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLike(article.id);
                        }}
                        className={`flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                          isLiked ? 'text-rose-600' : 'text-neutral-500 hover:text-rose-500'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
                        <span>{article.likes + (isLiked ? 1 : 0)}</span>
                      </button>

                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5 text-xs">
                        {lang === 'el' ? 'Οδηγός' : 'Read'} &rarr;
                      </span>
                    </div>
                  </div>

                </div>
              </article>
            );
          })}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700">
            <BookOpen className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
            <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">
              {lang === 'el' ? 'Δεν βρέθηκαν σχετικά άρθρα' : 'No matching articles found'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {lang === 'el' ? 'Δοκιμάστε διαφορετική κατηγορία ή αναζήτηση.' : 'Try a different search query or category.'}
            </p>
          </div>
        )}

      </div>
    </section>
  );
};
