import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  User, 
  Heart, 
  Share2, 
  Bookmark, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  Tag, 
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { Article, Language } from '../types';
import { CartoonHoverPlayer } from './CartoonHoverPlayer';

interface ArticleModalProps {
  article: Article | null;
  lang: Language;
  onClose: () => void;
  onLike: (id: string) => void;
  isLiked: boolean;
  onOpenSocialStudio: () => void;
  onOpenCartoonVideo?: (article: Article) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  lang,
  onClose,
  onLike,
  isLiked,
  onOpenSocialStudio,
  onOpenCartoonVideo,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeMediaView, setActiveMediaView] = useState<'cartoon' | 'image'>('cartoon');

  if (!article) return null;

  const handleCopyScript = () => {
    if (!article.socialScriptPreview) return;
    const textToCopy = `${article.socialScriptPreview.hook}\n\n${article.socialScriptPreview.caption}\n\n${article.socialScriptPreview.hashtags.join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div 
      id="article-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="article-modal-content"
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl my-auto text-neutral-900 dark:text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Media Header */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-neutral-900">
          {activeMediaView === 'cartoon' ? (
            <CartoonHoverPlayer
              article={article}
              isHovered={true}
              forcePlay={true}
              lang={lang}
              className="w-full h-full"
            />
          ) : (
            <img 
              src={article.image} 
              alt={article.title[lang]} 
              className="w-full h-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />
          
          {/* Close button */}
          <button
            id="close-article-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-slate-100 backdrop-blur-md transition-all shadow-md z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Media Switcher Tab (10s Fast-Motion Cartoon vs Photo) */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
            <button
              onClick={() => setActiveMediaView('cartoon')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                activeMediaView === 'cartoon'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-black/50 text-neutral-200 backdrop-blur-md hover:bg-black/70'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>16s Fast-Motion</span>
            </button>
            <button
              onClick={() => setActiveMediaView('image')}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                activeMediaView === 'image'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-black/50 text-neutral-200 backdrop-blur-md hover:bg-black/70'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{lang === 'el' ? 'Φωτογραφία' : 'Photo'}</span>
            </button>
          </div>

          {/* Title on Image bottom */}
          <div className="absolute bottom-4 left-4 right-4 text-slate-100 pointer-events-none">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold tracking-wide uppercase shadow-sm">
                {article.categoryLabel[lang]}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-neutral-200 text-xs font-medium">
                {article.readTime}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
              {article.title[lang]}
            </h2>
          </div>
        </div>

        {/* Article Meta Bar */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4 bg-neutral-50/50 dark:bg-neutral-850/50">
          
          {/* Author */}
          <div className="flex items-center gap-3">
            <img 
              src={article.author.avatar} 
              alt={article.author.name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
            />
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-slate-100">
                {article.author.name}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {article.author.role[lang]} • {article.date}
              </p>
            </div>
          </div>

          {/* Interactive Actions (Audio, Like, Share) */}
          <div className="flex items-center gap-2">
            
            {/* Audio Reader Toggle */}
            <button
              id="article-audio-toggle"
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isPlayingAudio
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-emerald-500'
              }`}
            >
              {isPlayingAudio ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isPlayingAudio ? (lang === 'el' ? 'Αναπαραγωγή...' : 'Playing...') : (lang === 'el' ? 'Άκουσε το' : 'Audio')}</span>
            </button>

            {/* Like button */}
            <button
              id="article-like-btn"
              onClick={() => onLike(article.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isLiked
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:text-rose-600'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-600' : ''}`} />
              <span>{article.likes + (isLiked ? 1 : 0)}</span>
            </button>
          </div>
        </div>

        {/* Audio Player notification banner */}
        {isPlayingAudio && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {lang === 'el' ? 'AI Voice Reader: Διαβάζει το άρθρο με φυσική ελληνική φωνή' : 'AI Voice Reader: Narration active'}
            </span>
            <button 
              onClick={() => setIsPlayingAudio(false)}
              className="text-neutral-500 hover:text-neutral-800 dark:hover:text-slate-100"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Article Summary Quote */}
        <div className="px-6 sm:px-8 pt-6">
          <p className="text-base sm:text-lg font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed italic border-l-4 border-emerald-500 pl-4 py-1">
            "{article.summary[lang]}"
          </p>
        </div>

        {/* Main Content Body */}
        <div className="px-6 sm:px-8 py-6 prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
          {article.content[lang]}
        </div>

        {/* Key Takeaways Section */}
        {article.keyTakeaways && (
          <div className="mx-6 sm:mx-8 mb-6 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-3">
              <CheckCircle2 className="w-4 h-4" />
              {lang === 'el' ? 'Βασικά Συμπεράσματα & Οδηγίες' : 'Key Takeaways & Guidelines'}
            </h4>
            <ul className="space-y-2">
              {article.keyTakeaways[lang].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Social Media Ready Snippet Box */}
        {article.socialScriptPreview && (
          <div className="mx-6 sm:mx-8 mb-8 p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === 'el' ? 'Έτοιμο Social Media Script για Reels / TikTok' : 'Ready Social Media Script'}
              </span>
              <button
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-neutral-800 text-xs font-semibold text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700 hover:bg-teal-100 transition-colors"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? (lang === 'el' ? 'Αντιγράφηκε!' : 'Copied!') : (lang === 'el' ? 'Αντιγραφή' : 'Copy')}</span>
              </button>
            </div>
            <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              <strong>Hook:</strong> {article.socialScriptPreview.hook}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              <strong>Caption:</strong> {article.socialScriptPreview.caption}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {article.socialScriptPreview.hashtags.map((tag, i) => (
                <span key={i} className="text-[11px] text-teal-700 dark:text-teal-400 font-mono bg-teal-100/60 dark:bg-teal-900/40 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-850/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {lang === 'el' ? 'Κλείσιμο' : 'Close'}
          </button>

          <div className="flex items-center gap-2">
            {onOpenCartoonVideo && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCartoonVideo(article);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white text-xs font-black shadow-sm transition-transform active:scale-95"
              >
                <Film className="w-3.5 h-3.5" />
                <span>{lang === 'el' ? '🎬 10s Cartoon Video' : '🎬 10s Cartoon Video'}</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenSocialStudio();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-slate-100 text-xs font-bold shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'el' ? 'Social Studio' : 'Social Studio'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
