import React, { useState, useEffect, Suspense, lazy } from 'react';
import { generateBotanicalArticle } from './services/botanicalAiEngine';
import { getSmartArticleImage, CURATED_GARDENING_PHOTOS, FALLBACK_BOTANICAL_PHOTOS } from './services/imageService';
import { AnimatedShortVideo } from './components/AnimatedShortVideo';
import { SmartBalconyCalculator } from './components/SmartBalconyCalculator';
import { SeasonalAdviceBar } from './components/SeasonalAdviceBar';
import { LiveTelemetryCard } from './components/LiveTelemetryCard';
import { LiveWeatherData } from './services/weatherService';
import { SocialShareBar } from './components/SocialShareBar';
import { SprayDosageCalculator } from './components/SprayDosageCalculator';
import { PlantDoctor } from './components/PlantDoctor';
import { CategoryPage } from './components/CategoryPage';
import { AuthorBioPage } from './components/AuthorBioPage';
import { PlantingCalendarPage } from './components/PlantingCalendarPage';
import { ClimateComparisonPage } from './components/ClimateComparisonPage';
import { FrostDatesPage } from './components/FrostDatesPage';
import { PlantDatabasePage } from './components/PlantDatabasePage';
import { AskAgronomistPage } from './components/AskAgronomistPage';
import { InstagramStudio } from './components/InstagramStudio';
import { ArticleToolLinks } from './components/ArticleToolLinks';
import { SoilCalculator } from './components/SoilCalculator';
import { SymptomWizard } from './components/SymptomWizard';
import { CompanionMatrix } from './components/CompanionMatrix';
import { MyBalcony } from './components/MyBalcony';
import { NewsletterSignup } from './components/NewsletterSignup';
import { FaqAccordion } from './components/FaqAccordion';
import { getFaqsForArticle } from './services/schemaService';
import { ArticleMarkdown } from './components/ArticleMarkdown';

// Admin-only tools: kept out of the main bundle so regular readers never download
// the Remotion/video-rendering and SEO-audit code paths they'll never use.
const TikTokStudio = lazy(() => import('./components/TikTokStudio').then(m => ({ default: m.TikTokStudio })));
const SeoMetadataAuditor = lazy(() => import('./components/SeoMetadataAuditor').then(m => ({ default: m.SeoMetadataAuditor })));
import { injectGlobalSiteSchema, injectArticleSchema } from './services/schemaService';
import {
  Globe,
  AlertTriangle,
  Server,
  ShieldCheck,
  ShoppingCart,
  Zap,
  Cpu,
  Mail,
  Smartphone,
  Search,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  HelpCircle,
  Terminal,
  FileCode,
  Sparkles,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Info,
  Edit3,
  Eye,
  Plus,
  Trash2,
  Download,
  Share2,
  BookOpen,
  Volume2,
  Sliders,
  Send,
  Droplets,
  Layers,
  CheckSquare,
  Clock,
  Film,
  Dices,
  Image as ImageIcon,
  Upload,
  X,
  Youtube,
  Facebook,
  Snowflake,
  Leaf,
  MessageCircleQuestion,
  Instagram
} from 'lucide-react';
import { ArticleItem } from './types';
import { WEEKLY_TRENDING_TOPICS, TrendingTopic } from './data/trendingTopics';
import { build50MasterArticles } from './data/master50Articles';
import { cleanGreekTextForSpeech } from './utils/greekSpeechSanitizer';
import { speakGreekTextWithWebSpeech, stopWebSpeech, VoiceProfile } from './utils/greekSpeechSynthesizer';

const INITIAL_ARTICLES: ArticleItem[] = build50MasterArticles();

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname;
    const search = window.location.search;
    // Visible in local dev, cloud preview, or explicit ?admin=true / ?studio=true / ?edit=true
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.includes('run.app') ||
      host.includes('googleusercontent.com') ||
      search.includes('admin') ||
      search.includes('studio') ||
      search.includes('edit')
    );
  });

  const [viewMode, setViewMode] = useState<'live_preview' | 'article_editor' | 'tiktok_studio' | 'json_export'>('live_preview');
  const [currentWeather, setCurrentWeather] = useState<LiveWeatherData | null>(null);
  const [articles, setArticles] = useState<ArticleItem[]>(INITIAL_ARTICLES);
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem>(INITIAL_ARTICLES[0]);
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [showCustomTopicModal, setShowCustomTopicModal] = useState(false);
  const [showCronScheduleModal, setShowCronScheduleModal] = useState(false);
  const [cronTriggerLoading, setCronTriggerLoading] = useState(false);
  const [cronTriggerResult, setCronTriggerResult] = useState<string | null>(null);
  const [isGoogleIndexingLoading, setIsGoogleIndexingLoading] = useState(false);
  const [googleIndexingResults, setGoogleIndexingResults] = useState<{
    total?: number;
    successCount?: number;
    failCount?: number;
    results?: Array<{ url: string; success: boolean; data?: any; error?: string }>;
    rawError?: string;
  } | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<ArticleItem | null>(null);
  const [hoveredArticleId, setHoveredArticleId] = useState<string | null>(null);
  // Homepage article grid renders this many cards initially (each card ships a
  // hidden <canvas> + real DOM/CSS weight); "Load More" reveals the rest instead of
  // mounting all of them on first paint — found via a local Lighthouse trace
  // (2026-09-09) that flagged "Style & Layout" as the single biggest main-thread
  // cost bucket delaying the homepage's real LCP element (the hero H1 text).
  const ARTICLES_PAGE_SIZE = 12;
  const [visibleArticleCount, setVisibleArticleCount] = useState<number>(ARTICLES_PAGE_SIZE);
  const [isModalImageHovered, setIsModalImageHovered] = useState<boolean>(false);
  const [isArticleReadingAudioActive, setIsArticleReadingAudioActive] = useState<boolean>(false);
  const [readingVoiceProfile, setReadingVoiceProfile] = useState<VoiceProfile>('deep_male');
  const [readingSpeed, setReadingSpeed] = useState<number>(1.0);
  const [showReadingVoiceSettings, setShowReadingVoiceSettings] = useState<boolean>(false);

  const handleToggleArticleSpeech = (
    textToRead: string,
    overrideProfile?: VoiceProfile,
    overrideRate?: number
  ) => {
    if (isArticleReadingAudioActive && !overrideProfile && !overrideRate) {
      stopWebSpeech();
      setIsArticleReadingAudioActive(false);
      return;
    }

    stopWebSpeech();

    const profile = overrideProfile || readingVoiceProfile;
    const rate = overrideRate || readingSpeed;

    const started = speakGreekTextWithWebSpeech(
      textToRead,
      () => setIsArticleReadingAudioActive(false),
      rate,
      1.0,
      profile
    );

    setIsArticleReadingAudioActive(started);
  };

  // Custom Topic Form state
  const [customTopicTitle, setCustomTopicTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('plant_care');
  const [customDifficulty, setCustomDifficulty] = useState('Μέτριο');
  const [customReadTime, setCustomReadTime] = useState('11 min');
  const [customDetails, setCustomDetails] = useState('');
  const [customAiLoading, setCustomAiLoading] = useState(false);

  // Trends modal filter & live search state
  const [trendsSearchFilter, setTrendsSearchFilter] = useState('');
  const [trendsCategoryFilter, setTrendsCategoryFilter] = useState('all');
  const [trendsList, setTrendsList] = useState<TrendingTopic[]>(WEEKLY_TRENDING_TOPICS);
  const [trendsLiveLoading, setTrendsLiveLoading] = useState(false);

  const handleLiveTrendsSearch = async () => {
    setTrendsLiveLoading(true);
    try {
      const res = await fetch('/api/search-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trendsSearchFilter,
          category: trendsCategoryFilter === 'all' ? undefined : trendsCategoryFilter
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.trends) && data.trends.length > 0) {
          setTrendsList(data.trends);
        }
      }
    } catch (e) {
      console.warn('Live trends search failed, using local trends', e);
    } finally {
      setTrendsLiveLoading(false);
    }
  };

  // Static, non-article routes (category hubs, author bio, planting calendar) manage
  // their own <title>/meta tags — the article-schema injection below must not clobber
  // them, since this effect still runs even when the JSX render short-circuits to one
  // of those pages (hooks always fire; only the returned tree changes).
  // IMPORTANT: keep this prefix list in sync with the routing dispatch further down
  // (search "Lightweight client-side routing") — adding a new static page there
  // without adding it here silently breaks that page's <title>/meta tags, since this
  // effect still runs and overwrites them regardless of what JSX actually renders.
  const isStaticPageRoute = typeof window !== 'undefined'
    && /^\/(kategoria\/|syntaktis|imerologio-sporas|klima-kipoy|pagetos|fyta|rotiste|instagram-studio)/.test(window.location.pathname);

  // Auto-fetch live articles from latest_articles.json on mount & inject SEO Schema
  useEffect(() => {
    injectGlobalSiteSchema();
    fetch(`/latest_articles.json?t=${Date.now()}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Local fetch failed');
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setArticles(data);
          // Respect a direct /article/<slug> link (Google, Pinterest, social shares) —
          // without this, every inbound article visit silently landed on the homepage
          // instead of the article the visitor actually clicked through for.
          const pathMatch = typeof window !== 'undefined' ? window.location.pathname.match(/^\/article\/([^/]+)\/?$/) : null;
          const slugFromUrl = pathMatch ? decodeURIComponent(pathMatch[1]) : null;
          const linkedArticle = slugFromUrl ? data.find((a: ArticleItem) => a.slug === slugFromUrl) : null;
          if (linkedArticle) {
            setSelectedArticle(linkedArticle);
            setIsReadingModalOpen(true);
            if (!isStaticPageRoute) injectArticleSchema(linkedArticle);
          } else {
            setSelectedArticle(data[0]);
            if (!isStaticPageRoute) injectArticleSchema(data[0]);
          }
        }
      })
      .catch(() => {
        // Use default initial articles if offline
        if (!isStaticPageRoute) injectArticleSchema(INITIAL_ARTICLES[0]);
      });
  }, []);

  useEffect(() => {
    if (selectedArticle && !isStaticPageRoute) {
      injectArticleSchema(selectedArticle);
    }
  }, [selectedArticle]);

  // Edit Form State
  const [editTitle, setEditTitle] = useState(selectedArticle.title.el);
  const [editCategory, setEditCategory] = useState(selectedArticle.categoryLabel.el);
  const [editSummary, setEditSummary] = useState(selectedArticle.summary.el);
  const [editContent, setEditContent] = useState(selectedArticle.content.el);
  const [editImage, setEditImage] = useState(selectedArticle.image);
  const [editVideoUrl, setEditVideoUrl] = useState(selectedArticle.videoUrl || '');
  const [editReadTime, setEditReadTime] = useState(selectedArticle.readTime);

  // Delete Article Trigger
  const handleRequestDelete = (art: ArticleItem) => {
    if (articles.length <= 1) {
      alert('⚠️ Πρέπει να υπάρχει τουλάχιστον 1 άρθρο στη λίστα.');
      return;
    }
    setArticleToDelete(art);
    setShowDeleteConfirmModal(true);
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = () => {
    if (!articleToDelete) return;
    const filtered = articles.filter((a) => a.id !== articleToDelete.id);
    setArticles(filtered);
    if (selectedArticle.id === articleToDelete.id) {
      const nextArticle = filtered[0];
      setSelectedArticle(nextArticle);
    }
    setShowDeleteConfirmModal(false);
    setArticleToDelete(null);
  };

  // Generate Article with REAL Gemini AI Topic Engine + Botanical Agronomy Engine
  const handleGenerateCustomTopicArticle = async () => {
    if (!customTopicTitle.trim()) {
      alert('Παρακαλώ εισάγετε ένα θέμα ή τίτλο για το νέο άρθρο!');
      return;
    }

    setCustomAiLoading(true);

    try {
      let aiData: any = null;

      // 1. Attempt to Call REAL Gemini API Endpoint on backend with a 60s timeout for 2200+ words
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const res = await fetch('/api/generate-article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: customTopicTitle,
            category: customCategory,
            difficulty: customDifficulty,
            details: customDetails,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            aiData = json.data;
          }
        } else {
          console.warn('Backend API returned non-200, activating specialized botanical AI generator...');
        }
      } catch (networkErr) {
        console.warn('Backend API unavailable or slow, activating specialized botanical AI generator...', networkErr);
      }

      // 2. If Gemini API was not configured or timed out, use the specialized botanical agronomy engine
      if (!aiData) {
        aiData = generateBotanicalArticle(
          customTopicTitle,
          customCategory,
          customDifficulty,
          customDetails
        );
      }

      const newId = String(Date.now());
      const cleanSlug = customTopicTitle
        .toLowerCase()
        .replace(/[^a-z0-9\u0370-\u03ff]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Categories map
      const categoryLabels: Record<string, { el: string; en: string }> = {
        plant_care: { el: "Φροντίδα Φυτών", en: "Plant Care" },
        balcony: { el: "Μπαλκόνι & Γλάστρες", en: "Balcony & Pots" },
        irrigation_iot: { el: "Αυτόματο Πότισμα & IoT", en: "Smart Irrigation & IoT" },
        vegetable_garden: { el: "Λαχανόκηπος", en: "Vegetable Garden" },
        robotic_mowers: { el: "Ρομποτικά Mowers", en: "Robotic Mowers" },
        urban_ecology: { el: "Αστική Οικολογία", en: "Urban Ecology" }
      };

      const catLabel = categoryLabels[customCategory] || { el: "Φροντίδα Φυτών", en: "Plant Care" };

      // Curated images based on smart botanical photo library
      const selectedImg = getSmartArticleImage(
        customTopicTitle + " " + (aiData.searchKeywordImage || ""),
        customCategory,
        Date.now()
      );


      const newArt: ArticleItem = {
        id: newId,
        slug: cleanSlug || `custom-topic-${newId}`,
        title: {
          el: aiData.title || customTopicTitle,
          en: aiData.title || customTopicTitle
        },
        category: customCategory,
        categoryLabel: catLabel,
        readTime: aiData.readTime || customReadTime || "12 min",
        difficulty: customDifficulty === "Εύκολο" ? "easy" : customDifficulty === "Προχωρημένο" ? "hard" : "medium",
        difficultyLabel: {
          el: customDifficulty,
          en: customDifficulty === "Εύκολο" ? "Easy" : customDifficulty === "Προχωρημένο" ? "Advanced" : "Medium"
        },
        date: "20 Αυγούστου 2026",
        author: {
          name: "Κώστας Αναστασιάδης",
          role: {
            el: "Γεωπόνος & IoT Specialist",
            en: "Agronomist & IoT Specialist"
          },
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
        },
        image: selectedImg,
        summary: {
          el: aiData.summary || `Εξειδικευμένος επιστημονικός οδηγός για ${customTopicTitle}.`,
          en: aiData.summary || `Specialized agronomy guide for ${customTopicTitle}.`
        },
        content: {
          el: aiData.content || `## ${customTopicTitle}\n\nΠεριεχόμενο άρθρου.`,
          en: aiData.content || `## ${customTopicTitle}\n\nArticle content.`
        },
        keyTakeaways: {
          el: aiData.keyTakeaways || [
            `Ολοκληρωμένη επιστημονική διαχείριση για ${customTopicTitle}`,
            "Ακριβής χρονισμός ποτίσματος και έλεγχος υγρασίας",
            "Εποχιακό πρόγραμμα θρέψης και προστασία"
          ],
          en: aiData.keyTakeaways || [
            `Comprehensive management for ${customTopicTitle}`,
            "Precision smart irrigation and moisture management",
            "Seasonal plant nutrition and protection"
          ]
        },
        socialScriptReady: true,
        likes: 340,
        featured: true
      };

      const updated = [newArt, ...articles];
      setArticles(updated);
      setSelectedArticle(newArt);
      setShowCustomTopicModal(false);
      setCustomTopicTitle('');
      setCustomDetails('');
      setViewMode('article_editor');
    } catch (err: any) {
      console.error(err);
      alert('⚠️ Σφάλμα: ' + (err?.message || 'Δοκιμάστε ξανά'));
    } finally {
      setCustomAiLoading(false);
    }
  };

  // Select a researched trending topic
  const handleSelectTrendingTopic = (trend: TrendingTopic) => {
    const newId = String(Date.now());
    
    // Ensure full in-depth 2.200+ words article for the selected trend topic
    let fullContent = trend.fullDraft;
    let keyPoints = trend.keyPoints;
    if (!fullContent || fullContent.length < 1500) {
      const generated = generateBotanicalArticle(
        trend.title,
        trend.category,
        "Μέτριο",
        trend.summary
      );
      fullContent = generated.content;
      if (generated.keyTakeaways && generated.keyTakeaways.length > 0) {
        keyPoints = generated.keyTakeaways;
      }
    }

    const newArt: ArticleItem = {
      id: newId,
      slug: `trend-${trend.id}-${newId}`,
      title: {
        el: trend.title,
        en: trend.title
      },
      category: trend.category,
      categoryLabel: {
        el: trend.categoryLabel,
        en: trend.categoryLabel
      },
      readTime: trend.readTime || "12 min",
      difficulty: "medium",
      difficultyLabel: {
        el: "Μέτριο",
        en: "Medium"
      },
      date: "21 Αυγούστου 2026",
      author: {
        name: "Κώστας Αναστασιάδης",
        role: {
          el: "Γεωπόνος & IoT Specialist",
          en: "Agronomist & IoT Specialist"
        },
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
      },
      image: trend.suggestedImage,
      summary: {
        el: trend.summary,
        en: trend.summary
      },
      content: {
        el: fullContent,
        en: fullContent
      },
      keyTakeaways: {
        el: keyPoints,
        en: keyPoints
      },
      socialScriptReady: true,
      likes: 240,
      featured: true
    };

    const updated = [newArt, ...articles];
    setArticles(updated);
    setSelectedArticle(newArt);
    setShowTrendsModal(false);
    setViewMode('article_editor');
  };

  // Sync edit fields when article changes
  useEffect(() => {
    if (selectedArticle) {
      setEditTitle(selectedArticle.title?.el || '');
      setEditCategory(selectedArticle.categoryLabel?.el || '');
      setEditSummary(selectedArticle.summary?.el || '');
      setEditContent(selectedArticle.content?.el || '');
      setEditImage(selectedArticle.image || '');
      setEditVideoUrl(selectedArticle.videoUrl || '');
      setEditReadTime(selectedArticle.readTime || '10 min');
    } else if (articles.length > 0) {
      setSelectedArticle(articles[0]);
    }
  }, [selectedArticle, articles]);

  // Save current edits
  const handleSaveArticle = () => {
    const updated = articles.map((a) => {
      if (a.id === selectedArticle.id) {
        return {
          ...a,
          title: { el: editTitle, en: editTitle },
          categoryLabel: { el: editCategory, en: editCategory },
          summary: { el: editSummary, en: editSummary },
          content: { el: editContent, en: editContent },
          image: editImage,
          videoUrl: editVideoUrl.trim() ? editVideoUrl.trim() : undefined,
          readTime: editReadTime
        };
      }
      return a;
    });
    setArticles(updated);
    const updatedSelected = updated.find((a) => a.id === selectedArticle.id) || updated[0];
    setSelectedArticle(updatedSelected);
    alert('✅ Το άρθρο αποθηκεύτηκε επιτυχώς!');
  };

  // Deploy Now: writes JSON + builds + FTP uploads, all from one click
  const [deployStatus, setDeployStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [deployLog, setDeployLog] = useState('');

  const handleDeployNow = async () => {
    setDeployStatus('running');
    setDeployLog('');
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articles),
      });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullLog = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullLog += decoder.decode(value, { stream: true });
          setDeployLog(fullLog);
        }
      }
      setDeployStatus(response.ok ? 'success' : 'error');
    } catch (err: any) {
      setDeployLog((prev) => prev + `\n❌ ${err.message}`);
      setDeployStatus('error');
    }
  };

  // Google Instant Indexing via Service Account
  const handleGoogleIndexAll = async () => {
    setIsGoogleIndexingLoading(true);
    setGoogleIndexingResults(null);
    try {
      const res = await fetch('/api/google-index-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setGoogleIndexingResults(data);
      } else {
        setGoogleIndexingResults({ rawError: data.error || 'Σφάλμα κατά το Google Indexing' });
      }
    } catch (err: any) {
      setGoogleIndexingResults({ rawError: err?.message || 'Σφάλμα επικοινωνίας με το backend' });
    } finally {
      setIsGoogleIndexingLoading(false);
    }
  };
  const handleAddNewArticle = () => {
    const newId = String(Date.now());
    const newArt: ArticleItem = {
      id: newId,
      slug: `neo-arthro-${newId}`,
      title: {
        el: "Νέο Άρθρο Κηπουρικής & IoT 2026",
        en: "New Smart Garden & IoT Article 2026"
      },
      category: "plant_care",
      categoryLabel: {
        el: "ΦΡΟΝΤΙΔΑ ΦΥΤΩΝ",
        en: "PLANT CARE"
      },
      readTime: "10 min",
      difficulty: "easy",
      difficultyLabel: {
        el: "Εύκολο",
        en: "Easy"
      },
      date: "20 Αυγούστου 2026",
      author: {
        name: "Κώστας Αναστασιάδης",
        role: {
          el: "Γεωπόνος & IoT Specialist",
          en: "Agronomist & IoT Specialist"
        },
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
      },
      image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&auto=format&fit=crop&q=80",
      summary: {
        el: "Πλήρης οδηγός με επιστημονικές συμβουλές και πρακτικές οδηγίες για τον κήπο και το μπαλκόνι.",
        en: "Complete guide with agronomist tips for your urban garden."
      },
      content: {
        el: `## Εισαγωγή
Γράψτε εδώ την εισαγωγή του άρθρου σας...

### 1. Βασική Ενότητα
Ανάλυση θέματος με bullet points και οδηγίες:
* Σημείο 1
* Σημείο 2

### 2. Πρακτικός Οδηγός Βήμα-Βήμα
1. Πρώτο βήμα
2. Δεύτερο βήμα

### 3. Τελικό Συμπέρασμα
Σύνοψη και συμπεράσματα.`,
        en: `New article content...`
      },
      keyTakeaways: {
        el: [
          "Σωστός χρονισμός ποτίσματος",
          "Βιολογική λίπανση και προστασία",
          "Αξιοποίηση σύγχρονων εργαλείων IoT"
        ],
        en: ["Smart irrigation", "Organic care", "IoT tools"]
      },
      socialScriptReady: true,
      likes: 120,
      featured: false
    };

    const updated = [newArt, ...articles];
    setArticles(updated);
    setSelectedArticle(newArt);
    setViewMode('article_editor');
  };

  // AI Instant Expansion to 2200+ words with REAL Gemini AI + Botanical Engine
  const handleAiExpand = async () => {
    setAiGenerating(true);
    try {
      let expanded = '';
      let newSummary = '';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const res = await fetch('/api/expand-article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editTitle,
            currentContent: editContent,
            category: editCategory,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            expanded = json.data.expandedContent;
            newSummary = json.data.summary;
          }
        }
      } catch (e) {
        console.warn('Backend expand timed out, generating via botanical engine...', e);
      }

      if (!expanded) {
        const botData = generateBotanicalArticle(editTitle, editCategory, selectedArticle.difficulty);
        expanded = botData.content;
        newSummary = botData.summary;
      }

      setEditContent(expanded);
      if (newSummary) {
        setEditSummary(newSummary);
      }

      // Auto update in articles list as well
      setArticles((prev) =>
        prev.map((a) =>
          a.id === selectedArticle.id
            ? {
                ...a,
                content: { el: expanded, en: expanded },
                summary: newSummary ? { el: newSummary, en: newSummary } : a.summary,
              }
            : a
        )
      );
    } catch (err: any) {
      console.error(err);
      alert('⚠️ Σφάλμα: ' + (err?.message || 'Δοκιμάστε ξανά'));
    } finally {
      setAiGenerating(false);
    }
  };

  // Copy JSON for latest_articles.json
  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(articles, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Download JSON file directly
  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(articles, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'latest_articles.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download 1-Click BAT that matches original 1click pipeline & auto-extracts/updates JSON
  const handleDownloadAutoSyncBat = () => {
    const rawJson = JSON.stringify(articles, null, 2);
    const base64Data = btoa(unescape(encodeURIComponent(rawJson)));
    
    const batContent = `@echo off
chcp 65001 >nul
title SmartGarden.gr - 1-Click Update, Build & Diagnostics
color 0A

echo ======================================================================
echo    SMARTGARDEN.GR - 1-CLICK AUTOMATED PIPELINE & LIVE DIAGNOSTICS
echo ======================================================================
echo.

set "DESKTOP_DIR=%~dp0"
set "DOWNLOADS_DIR=%USERPROFILE%\\Downloads"
set "JSON_FILE=%DESKTOP_DIR%public\\latest_articles.json"

echo [STEP 1/5] Checking for latest ZIP from AI Studio in Downloads...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$zip = Get-ChildItem -Path '%DOWNLOADS_DIR%\\*.zip' | Sort-Object LastWriteTime -Descending | Select-Object -First 1; if ($zip) { Write-Host '>>> Found latest download:' $zip.Name; Expand-Archive -Path $zip.FullName -DestinationPath '%DESKTOP_DIR%' -Force; Write-Host '>>> Successfully extracted and replaced files in project!' } else { Write-Host '>>> No new ZIP in Downloads, using existing workspace files.' }"

echo.
echo [STEP 2/5] Updating public\\latest_articles.json with current studio articles...
powershell -NoProfile -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${base64Data}')) | Out-File -FilePath '%JSON_FILE%' -Encoding utf8"

cd /d "%DESKTOP_DIR%"
echo Current working folder: %CD%

echo.
echo [STEP 3/5] Verifying project dependencies...
if not exist node_modules\\basic-ftp (
    echo Installing required dependencies (including basic-ftp)...
    call npm install basic-ftp --no-audit --no-fund
) else (
    echo Dependencies verified.
)

echo.
echo [STEP 4/5] Running production build (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Build failed! Check the errors above.
    pause
    exit /b %errorlevel%
)
echo Build completed successfully! Folder 'dist' is ready.

echo.
echo [STEP 5/5] Running detailed FTP deployment and connection diagnostics...
node deploy.js

echo.
echo ======================================================================
echo   SUCCESS! Site updated: https://smartgarden.gr
echo ======================================================================
pause
`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '1click.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download 1clicknnn.bat - Fast Direct Mode (WITHOUT ZIP Extraction step)
  const handleDownloadDirectBat = () => {
    const rawJson = JSON.stringify(articles, null, 2);
    const base64Data = btoa(unescape(encodeURIComponent(rawJson)));
    
    const batContent = `@echo off
chcp 65001 >nul
title SmartGarden.gr - 1-Click Fast Sync & Deploy (No ZIP)
color 0A

echo ======================================================================
echo    SMARTGARDEN.GR - 1-CLICK FAST SYNC ^& DEPLOY (NO ZIP)
echo ======================================================================
echo.

set "DESKTOP_DIR=%~dp0"
set "JSON_FILE=%DESKTOP_DIR%public\\latest_articles.json"

echo [STEP 1/4] Updating public\\latest_articles.json with current studio articles...
powershell -NoProfile -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${base64Data}')) | Out-File -FilePath '%JSON_FILE%' -Encoding utf8"

cd /d "%DESKTOP_DIR%"
echo Current working folder: %CD%

echo.
echo [STEP 2/4] Verifying project dependencies...
if not exist node_modules\\basic-ftp (
    echo Installing required dependencies (including basic-ftp)...
    call npm install basic-ftp --no-audit --no-fund
) else (
    echo Dependencies verified.
)

echo.
echo [STEP 3/4] Running production build (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Build failed! Check the errors above.
    pause
    exit /b %errorlevel%
)
echo Build completed successfully! Folder 'dist' is ready.

echo.
echo [STEP 4/4] Running FTP deployment to smartgarden.gr...
node deploy.js

echo.
echo ======================================================================
echo   SUCCESS! Site updated: https://smartgarden.gr
echo ======================================================================
pause
`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '1clicknnn.bat';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lightweight client-side routing for the new static-ish pages (category hubs, author
  // bio, planting calendar). No router library — the app is otherwise a single-page
  // modal-over-homepage experience, so these are rendered as full-page takeovers based on
  // the URL the visitor actually landed on, then handed back to the normal app on "back".
  // IMPORTANT: any new route added here must also be added to `isStaticPageRoute`'s
  // regex above, or that page's <title>/meta tags get silently overwritten.
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const handleOpenArticleFromStaticPage = (article: ArticleItem) => {
    window.history.pushState(null, '', `/article/${article.slug}`);
    setSelectedArticle(article);
    setIsReadingModalOpen(true);
  };
  const handleBackToHome = () => {
    window.history.pushState(null, '', '/');
    window.location.reload();
  };
  const categoryMatch = pathname.match(/^\/kategoria\/([^/]+)\/?$/);
  if (categoryMatch) {
    return (
      <CategoryPage
        articles={articles}
        categorySlug={decodeURIComponent(categoryMatch[1])}
        onOpenArticle={handleOpenArticleFromStaticPage}
        onBack={handleBackToHome}
      />
    );
  }
  if (pathname.match(/^\/syntaktis\/?/)) {
    return <AuthorBioPage articles={articles} onOpenArticle={handleOpenArticleFromStaticPage} onBack={handleBackToHome} />;
  }
  if (pathname.match(/^\/imerologio-sporas\/?/)) {
    return <PlantingCalendarPage onBack={handleBackToHome} />;
  }
  if (pathname.match(/^\/klima-kipoy\/?/)) {
    return <ClimateComparisonPage onBack={handleBackToHome} />;
  }
  if (pathname.match(/^\/pagetos\/?/)) {
    return <FrostDatesPage onBack={handleBackToHome} />;
  }
  if (pathname.match(/^\/rotiste\/?/)) {
    return <AskAgronomistPage onBack={handleBackToHome} />;
  }
  // Internal content tool — reachable by URL but deliberately kept out of the sitemap,
  // the footer and llms.txt, since it is for producing posts, not for readers.
  if (pathname.match(/^\/instagram-studio\/?/)) {
    return <InstagramStudio onBack={handleBackToHome} />;
  }
  const plantMatch = pathname.match(/^\/fyta(?:\/([^/]+))?\/?$/);
  if (plantMatch) {
    return <PlantDatabasePage onBack={handleBackToHome} initialSlug={plantMatch[1] ? decodeURIComponent(plantMatch[1]) : undefined} />;
  }

  return (
    <div id="smartgarden-app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Control Bar: Visible ONLY in Studio / Admin / Dev Environment */}
      {isAdmin ? (
        <header id="top-control-bar" className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Globe className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-tight text-base">SmartGarden.gr</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Visual Studio & Live Site
                  </span>
                </div>
                <p className="text-xs text-slate-400">Διαδραστικό Περιβάλλον Σελίδας • Αλλαγές με Κουμπιά & Άμεσο Preview</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                id="btn-view-live"
                onClick={() => setViewMode('live_preview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'live_preview'
                    ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                1. Live Προβολή Σελίδας
              </button>

              <button
                id="btn-view-editor"
                onClick={() => setViewMode('article_editor')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'article_editor'
                    ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                2. Επεξεργαστής Άρθρων
              </button>

              <button
                id="btn-view-tiktok"
                onClick={() => setViewMode('tiktok_studio')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'tiktok_studio'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow font-bold'
                    : 'text-pink-300 hover:text-white hover:bg-pink-950/40 border border-pink-500/20'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-pink-400" />
                🎬 3. TikTok & Shorts AI
              </button>

              <button
                id="btn-view-json"
                onClick={() => setViewMode('json_export')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'json_export'
                    ? 'bg-emerald-500 text-slate-950 shadow font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                4. Εξαγωγή JSON & Deploy
              </button>

              <button
                id="btn-top-quick-deploy"
                onClick={() => {
                  setViewMode('json_export');
                  handleDeployNow();
                }}
                disabled={deployStatus === 'running'}
                className="bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Απευθείας Build και FTP Upload στο smartgarden.gr με 1 κλικ"
              >
                <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
                {deployStatus === 'running' ? 'Deploying...' : '🚀 1-Click Deploy'}
              </button>
            </div>
          </div>
        </header>
      ) : (
        /* Clean, Luxury Public Navbar for Website Visitors on smartgarden.gr */
        <header id="public-header" className="bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur px-4 py-3.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Globe className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <span className="font-extrabold text-white tracking-tight text-lg">SmartGarden.gr</span>
                <p className="text-[11px] text-emerald-400 font-medium hidden sm:block">Ψηφιακό Περιοδικό Κηπουρικής, Μπαλκονιού & IoT</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>
                  {currentWeather ? (
                    <>
                      {currentWeather.weatherIcon} {currentWeather.cityName}: <strong>{currentWeather.temperature}°C</strong> • ET₀: <strong>{currentWeather.evapotranspiration}mm</strong>
                    </>
                  ) : (
                    <>☀️ Ζωντανή Τηλεμετρία & Καιρός</>
                  )}
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* VIEW 1: LIVE SITE PREVIEW WITH INTERACTIVE MODAL */}
      {viewMode === 'live_preview' && (
        <div id="live-site-view" role="main" className="flex-1 bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Hero Simulation */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-7 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    SmartGarden Digital Magazine & Media Hub
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    Οδηγοί για <span className="text-emerald-400">Μπαλκόνι & Κήπο</span> με Τεχνητή Νοημοσύνη.
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Ψηφιακό περιοδικό για το ελληνικό μπαλκόνι, τις γλάστρες, τον λαχανόκηπο και τον κήπο. Καθημερινή ανάλυση καιρού, reviews κορυφαίου εξοπλισμού και έτοιμο περιεχόμενο.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      id="btn-read-today"
                      onClick={() => setIsReadingModalOpen(true)}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      Διαβάστε τα Σημερινά Άρθρα ({articles.length})
                    </button>
                    <button
                      id="btn-jump-calculator"
                      onClick={() => {
                        const el = document.getElementById('smart-balcony-calculator-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 hover:from-emerald-800/80 hover:to-teal-800/80 text-emerald-300 font-bold px-5 py-3 rounded-xl border border-emerald-500/30 flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Υπολογιστής Ποτίσματος & Γλάστρας
                    </button>
                    <button
                      id="btn-jump-spray-calc"
                      onClick={() => {
                        const el = document.getElementById('spray-dosage-calculator');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 font-bold px-5 py-3 rounded-xl border border-cyan-500/30 flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg"
                    >
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      Υπολογιστής Δοσολογιών Ψεκαστήρα
                    </button>
                    <button
                      id="btn-jump-plant-doctor"
                      onClick={() => {
                        const el = document.getElementById('plant-doctor');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-gradient-to-r from-rose-950/80 to-amber-950/80 hover:from-rose-900 hover:to-amber-900 text-amber-300 font-bold px-5 py-3 rounded-xl border border-amber-500/30 flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      AI Διάγνωση Φυτού από Φωτογραφία
                    </button>
                    <button
                      id="btn-jump-calendar"
                      onClick={() => { window.location.href = '/imerologio-sporas'; }}
                      className="bg-gradient-to-r from-lime-950/80 to-emerald-950/80 hover:from-lime-900 hover:to-emerald-900 text-lime-300 font-bold px-5 py-3 rounded-xl border border-lime-500/30 flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-lime-400" />
                      Ημερολόγιο Σποράς &amp; Εργασιών
                    </button>
                    <button
                      id="btn-jump-frost"
                      onClick={() => { window.location.href = '/pagetos'; }}
                      className="bg-gradient-to-r from-sky-950/80 to-indigo-950/80 hover:from-sky-900 hover:to-indigo-900 text-sky-300 font-bold px-5 py-3 rounded-xl border border-sky-500/30 flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg"
                    >
                      <Snowflake className="w-4 h-4 text-sky-400" />
                      Ημερομηνίες Παγετού ανά Περιοχή
                    </button>
                    <button
                      id="btn-jump-plants"
                      onClick={() => { window.location.href = '/fyta'; }}
                      className="bg-gradient-to-r from-green-950/80 to-lime-950/80 hover:from-green-900 hover:to-lime-900 text-green-300 font-bold px-5 py-3 rounded-xl border border-green-500/30 flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg"
                    >
                      <Leaf className="w-4 h-4 text-green-400" />
                      Βάση Δεδομένων Φυτών
                    </button>
                    <button
                      id="btn-jump-qa"
                      onClick={() => { window.location.href = '/rotiste'; }}
                      className="bg-gradient-to-r from-amber-950/80 to-orange-950/80 hover:from-amber-900 hover:to-orange-900 text-amber-300 font-bold px-5 py-3 rounded-xl border border-amber-500/30 flex items-center gap-2 text-sm transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg"
                    >
                      <MessageCircleQuestion className="w-4 h-4 text-amber-400" />
                      Ρωτήστε τον Γεωπόνο
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setViewMode('article_editor')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-3 rounded-xl border border-slate-700 flex items-center gap-2 text-sm transition-all cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4 text-emerald-400" />
                        Επεξεργασία Περιεχομένου
                      </button>
                    )}
                  </div>
                </div>

                {/* Telemetry Card */}
                <div className="lg:col-span-5">
                  <LiveTelemetryCard onWeatherUpdate={setCurrentWeather} />
                </div>
              </div>
            </div>

            {/* Seasonal Advice Strip (Garden Calendar) */}
            <SeasonalAdviceBar />

            {/* Interactive Smart Balcony Pot & Irrigation Calculator */}
            <SmartBalconyCalculator />

            {/* Interactive Spray & Dosage Fertilizer Calculator */}
            <SprayDosageCalculator
              onOpenArticle={(slug) => {
                const target = articles.find(a => a.slug === slug);
                if (target) {
                  setSelectedArticle(target);
                  setIsReadingModalOpen(true);
                } else {
                  setIsReadingModalOpen(true);
                }
              }}
            />

            {/* AI Plant Health Diagnosis from Photo */}
            <PlantDoctor />

            {/* Quick symptom decision-tree diagnosis (no photo needed) */}
            <SymptomWizard
              onJumpToDosageCalculator={() => {
                const el = document.getElementById('spray-dosage-calculator');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Personal balcony/garden tracker — localStorage only, no login */}
            <MyBalcony currentWeather={currentWeather} />

            {/* Companion planting matrix */}
            <CompanionMatrix />

            {/* Soil / pot size calculator */}
            <SoilCalculator />

            {/* Email newsletter capture */}
            <NewsletterSignup />

            {/* Articles Grid Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  Δημοσιευμένα Άρθρα & Οδηγοί
                </h3>
                <span className="text-xs text-slate-400">{articles.length} άρθρα διαθέσιμα</span>
              </div>

              {/* Category hub links — real crawlable landing pages per topic */}
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(articles.map((a) => a.category))).map((cat) => {
                  const catLabel = articles.find((a) => a.category === cat)?.categoryLabel?.el || cat;
                  return (
                    <a
                      key={cat}
                      href={`/kategoria/${cat}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState(null, '', `/kategoria/${cat}`);
                        window.location.reload();
                      }}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {catLabel}
                    </a>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {articles.slice(0, visibleArticleCount).map((art, articleIdx) => (
                  <div
                    key={art.id}
                    onClick={() => {
                      setSelectedArticle(art);
                      setIsReadingModalOpen(true);
                    }}
                    // Pointer-only affordance on purpose: the "Ανάγνωση" button below stays
                    // the real focusable control, so keyboard and screen-reader users get one
                    // clear target instead of a duplicate tab stop, and there is no
                    // interactive element nested inside another one.
                    className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 hover:-translate-y-0.5 transition-all flex flex-col justify-between group shadow-lg cursor-pointer"
                  >
                    <div>
                      <div
                        className="h-52 relative overflow-hidden bg-slate-900 cursor-pointer"
                        onMouseEnter={() => setHoveredArticleId(art.id)}
                        onMouseLeave={() => setHoveredArticleId(null)}
                      >
                        <AnimatedShortVideo
                          title={art.title.el}
                          category={art.category}
                          summary={art.summary.el}
                          staticImage={art.image}
                          isHovered={hoveredArticleId === art.id}
                          priority={articleIdx === 0}
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none z-10">
                          <span className="px-2.5 py-1 rounded-md bg-emerald-600/90 text-white font-bold text-[10px] tracking-wider uppercase backdrop-blur shadow">
                            {art.categoryLabel.el}
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-slate-950/80 text-slate-200 text-[10px] font-semibold backdrop-blur">
                            ⏱️ {art.readTime}
                          </span>
                          {art.videoUrl && (
                            <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black text-[10px] tracking-wider uppercase backdrop-blur shadow flex items-center gap-1 animate-pulse">
                              <Film className="w-3 h-3" />
                              VIDEO GUIDE
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                          {art.title.el}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {art.summary.el}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-900 mt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <img
                          src={art.author.avatar}
                          alt={art.author.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
                          }}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span>{art.author.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedArticle(art);
                          setIsReadingModalOpen(true);
                        }}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        Ανάγνωση (2.200 λέξεις)
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {visibleArticleCount < articles.length && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setVisibleArticleCount((c) => c + ARTICLES_PAGE_SIZE)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-6 py-3 rounded-xl border border-slate-700 flex items-center gap-2 text-sm transition-all cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Φόρτωση Περισσότερων ({articles.length - visibleArticleCount} ακόμα)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: VISUAL ARTICLE EDITOR WITH CUSTOM TOPIC & DELETE CAPABILITIES */}
      {viewMode === 'article_editor' && (
        <div id="article-editor-view" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                Επεξεργαστής Άρθρων & Περιεχομένου 2.200 Λέξεων
              </h2>
              <p className="text-xs text-slate-400">Επίλεξε, επεξεργάσου ή δημιούργησε νέο άρθρο με έτοιμο AI Generator</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-open-cron"
                onClick={() => {
                  setShowCronScheduleModal(true);
                  setCronTriggerResult(null);
                }}
                className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-purple-500/40 flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/5 transition-all"
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                ⏰ Auto Schedule & Webhook
              </button>
              <button
                id="btn-custom-topic"
                onClick={() => setShowCustomTopicModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                ✨ AI Άρθρο με Δικό μου Θέμα
              </button>
              <button
                id="btn-open-trends"
                onClick={() => setShowTrendsModal(true)}
                className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-amber-500/40 flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/5 transition-all"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                🔥 Top 20 Hot Trends (Έτοιμα Άρθρα)
              </button>
              <button
                id="btn-add-new"
                onClick={handleAddNewArticle}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                + Κενό
              </button>
              <button
                id="btn-delete-article"
                onClick={() => handleRequestDelete(selectedArticle)}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Διαγραφή του επιλεγμένου άρθρου"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                Διαγραφή
              </button>
              <button
                id="btn-save-article"
                onClick={handleSaveArticle}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Αποθήκευση
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Article Selector List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Λίστα Άρθρων ({articles.length})</h3>
                <span className="text-[10px] text-slate-500">Κλικ για επιλογή ή 🗑️ για διαγραφή</span>
              </div>
              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 relative group ${
                      selectedArticle?.id === art.id
                        ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/30 shadow-md shadow-emerald-500/5'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedArticle(art)}
                      className="flex-1 flex items-start gap-3 text-left cursor-pointer min-w-0"
                    >
                      <img
                        src={art.image || "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80"}
                        alt={art.title?.el || art.title || ''}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80";
                        }}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase">{art.categoryLabel.el}</div>
                        <div className="text-xs font-bold text-white truncate">{art.title.el}</div>
                        <div className="text-[10px] text-slate-500 mt-1">📅 {art.date} • ⏱️ {art.readTime}</div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestDelete(art);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                      title="Διαγραφή άρθρου"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Editor Form */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-300 truncate max-w-xs">
                  Φόρμα Επεξεργασίας: {selectedArticle?.title?.el || 'Νέο Άρθρο'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-save-article-header"
                    onClick={handleSaveArticle}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Αποθήκευση
                  </button>
                  <button
                    id="btn-ai-expand"
                    onClick={handleAiExpand}
                    disabled={aiGenerating}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    {aiGenerating ? '⚡ Gemini AI: Συγγραφή 2.200+ λέξεων...' : '⚡ Gemini AI Εμπλουτισμός (2.200+ Λέξεις)'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Τίτλος Άρθρου:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Κατηγορία (Label):</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Χρόνος Ανάγνωσης:</label>
                    <input
                      type="text"
                      value={editReadTime}
                      onChange={(e) => setEditReadTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">URL Εικόνας & 15s Animated Video:</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const autoImg = getSmartArticleImage(editTitle, editCategory, Date.now());
                          setEditImage(autoImg);
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Αυτόματη επιλογή κατάλληλης φωτογραφίας από τον τίτλο"
                      >
                        <Sparkles className="w-3 h-3" />
                        ✨ Αυτόματο Ταίριασμα
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const randomPhoto = FALLBACK_BOTANICAL_PHOTOS[Math.floor(Math.random() * FALLBACK_BOTANICAL_PHOTOS.length)];
                          setEditImage(randomPhoto);
                        }}
                        className="text-[11px] text-teal-300 hover:text-teal-200 bg-teal-950/40 border border-teal-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        title="Επιλογή τυχαίας φωτογραφίας υψηλής ανάλυσης"
                      >
                        <Dices className="w-3 h-3" />
                        🎲 Τυχαία Φωτογραφία
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono text-[11px] mb-2"
                  />

                  {/* Quick Photo Palette */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2">
                    <span className="text-[10px] text-slate-500 shrink-0 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-slate-500" />
                      Έτοιμες HD:
                    </span>
                    {CURATED_GARDENING_PHOTOS.slice(0, 10).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditImage(p.url)}
                        className={`w-9 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                          editImage === p.url ? 'border-emerald-400 ring-2 ring-emerald-400/30 scale-105' : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                        }`}
                        title={p.alt}
                      >
                        <img src={p.url} alt={p.alt} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Live Mini Preview with Animated Video or Real Video */}
                  <div
                    className="h-44 rounded-xl overflow-hidden border border-slate-800 relative cursor-pointer"
                    onMouseEnter={() => setIsModalImageHovered(true)}
                    onMouseLeave={() => setIsModalImageHovered(false)}
                  >
                    {editVideoUrl ? (
                      <video
                        src={editVideoUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AnimatedShortVideo
                        title={editTitle}
                        category={editCategory}
                        summary={editSummary}
                        staticImage={editImage}
                        isHovered={isModalImageHovered}
                      />
                    )}
                  </div>
                </div>

                {/* Video Guide / Upload MP4 Attachment */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-pink-400" />
                      🎬 Βίντεο Οδηγός Άρθρου (MP4 / WebM / Link):
                    </label>
                    {editVideoUrl ? (
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                        ✅ Συνδεδεμένο Βίντεο
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Προαιρετικό</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="π.χ. /videos/my_video.mp4 ή https://example.com/video.mp4"
                      value={editVideoUrl}
                      onChange={(e) => setEditVideoUrl(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono text-[11px]"
                    />
                    <label className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-pink-500/20">
                      <Upload className="w-3.5 h-3.5" />
                      Ανέβασμα MP4
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = async (evt) => {
                              const base64 = evt.target?.result as string;
                              try {
                                const res = await fetch('/api/upload-video', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    articleId: selectedArticle.id,
                                    videoBase64: base64,
                                    filename: file.name
                                  })
                                });
                                if (res.ok) {
                                  const d = await res.json();
                                  setEditVideoUrl(d.videoUrl);
                                  alert('🎉 Το βίντεο αποθηκεύτηκε επιτυχώς και συνδέθηκε με το άρθρο!');
                                } else {
                                  setEditVideoUrl(URL.createObjectURL(file));
                                }
                              } catch {
                                setEditVideoUrl(URL.createObjectURL(file));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {editVideoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditVideoUrl('')}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 transition-colors"
                        title="Αφαίρεση βίντεο"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>


                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Περίληψη (Summary):</label>
                  <textarea
                    rows={2}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                  ></textarea>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">Κυρίως Κείμενο Άρθρου (Markdown):</label>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                        {editContent.trim() ? editContent.trim().split(/\s+/).length : 0} λέξεις
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({editContent.length} χαρακτήρες)
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={12}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
                  ></textarea>
                </div>

                {/* SEO METADATA AUDITOR SECTION */}
                <div className="pt-2">
                  <Suspense fallback={<div className="text-xs text-slate-500 py-4">Φόρτωση εργαλείου SEO...</div>}>
                    <SeoMetadataAuditor
                      article={selectedArticle}
                      title={editTitle}
                      summary={editSummary}
                      content={editContent}
                      category={editCategory}
                      image={editImage}
                      slug={selectedArticle.slug}
                      onUpdateTitle={(newTitle) => setEditTitle(newTitle)}
                      onUpdateSummary={(newSummary) => setEditSummary(newSummary)}
                      onUpdateContent={(newContent) => setEditContent(newContent)}
                      onSave={handleSaveArticle}
                    />
                  </Suspense>
                </div>

                {/* Bottom Save & Preview Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Επεξεργασία άρθρου ID: <span className="font-mono text-slate-300">{selectedArticle.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('live_preview')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      Ζωντανή Προεπισκόπηση
                    </button>
                    <button
                      id="btn-save-article-bottom"
                      type="button"
                      onClick={handleSaveArticle}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      Αποθήκευση Αλλαγών Άρθρου
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: EXPORT JSON & DIRECT DEPLOY GUIDE */}
      {viewMode === 'json_export' && (
        <div id="json-export-view" className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-400" />
                  Εξαγωγή & Ενημέρωση του smartgarden.gr
                </h3>
                <p className="text-xs text-slate-400">Κατέβασε το αρχείο ή αντέγραψε το JSON για να ενημερώσεις άμεσα το site</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-copy-json"
                  onClick={handleCopyJson}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copiedNotification ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Αντιγράφηκε!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Αντιγραφή JSON
                    </>
                  )}
                </button>
                <button
                  id="btn-deploy-now"
                  onClick={handleDeployNow}
                  disabled={deployStatus === 'running'}
                  className="bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 hover:from-amber-300 hover:to-teal-300 text-slate-950 text-xs font-black px-6 py-2.5 rounded-xl shadow-xl shadow-emerald-500/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
                >
                  <Zap className="w-4 h-4 text-slate-950 fill-current" />
                  {deployStatus === 'running' ? '⏳ Γίνεται Deploy...' : '🚀 1-CLICK DEPLOY NOW'}
                </button>
                <button
                  id="btn-download-json"
                  onClick={handleDownloadJson}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Download JSON
                </button>
                <button
                  id="btn-download-bat"
                  onClick={handleDownloadAutoSyncBat}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Κατεβάζει το 1clicknnn.bat αν χρειαστείς ξανά το script"
                >
                  <Sparkles className="w-3 h-3 text-slate-400" />
                  Λήψη 1clicknnn.bat
                </button>
              </div>
            </div>

            {/* GOOGLE INSTANT INDEXING API SUITE */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-sky-500/30 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-white">Google Instant Indexing API</h3>
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                        DIRECT CRAWL BOT
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Απευθείας ειδοποίηση των Google Bots για άμεσο crawling όλων των {articles.length} άρθρων.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGoogleIndexAll}
                  disabled={isGoogleIndexingLoading}
                  className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGoogleIndexingLoading ? 'Αποστολή στη Google...' : `⚡ Google Index All (${articles.length + 1} URLs)`}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">Συνδεδεμένο Service Account:</span>
                  <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800 break-all select-all">
                    smartgarden-indexer@zippy-facility-507018-f6.iam.gserviceaccount.com
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Προσθέστε το παραπάνω email στο <strong>Search Console ➡️ Ρυθμίσεις ➡️ Χρήστες (Owner)</strong> για πλήρη αυτοματοποίηση.
                  </span>
                </div>

                <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Αυτοματισμός Cron Publish:</span>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Κάθε φορά που δημιουργείται αυτόματα νέο άρθρο μέσω του <code>cron-publish.php</code>, καλείται αυτόματα το Google Indexing API χωρίς καμία δική σας ενέργεια.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ενεργό & Ενσωματωμένο
                  </span>
                </div>
              </div>

              {/* Indexing Results Panel */}
              {googleIndexingResults && (
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 mt-3">
                  {googleIndexingResults.rawError ? (
                    <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                      <span className="text-base">⚠️</span>
                      <div>
                        <strong>Σημείωση Google API:</strong> {googleIndexingResults.rawError}
                        <p className="text-[11px] text-slate-400 mt-1">
                          Βεβαιωθείτε ότι προσθέσατε το email <code>smartgarden-indexer@zippy-facility-507018-f6.iam.gserviceaccount.com</code> ως <strong>Owner</strong> στο Google Search Console.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white">Αποτελέσματα Google Indexing:</span>
                        <span className="text-emerald-400">
                          ✅ Επιτυχία: {googleIndexingResults.successCount} / {googleIndexingResults.total}
                        </span>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
                        {googleIndexingResults.results?.slice(0, 10).map((res, i) => (
                          <div key={i} className={`p-1.5 rounded flex items-center justify-between ${res.success ? 'bg-emerald-950/40 text-emerald-300' : 'bg-rose-950/40 text-rose-300'}`}>
                            <span className="truncate max-w-md">{res.url}</span>
                            <span>{res.success ? 'OK 200' : res.error || 'Failed'}</span>
                          </div>
                        ))}
                        {(googleIndexingResults.results?.length || 0) > 10 && (
                          <div className="text-center text-slate-500 text-[10px] pt-1">
                            + άλλα {(googleIndexingResults.results?.length || 0) - 10} URLs υποβλήθηκαν
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {deployStatus !== 'idle' && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/50 shadow-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Live Deploy Terminal Output (smartgarden.gr)
                  </span>
                  <span>{deployStatus === 'running' ? '⏳ Σε εξέλιξη...' : deployStatus === 'success' ? '✅ Επιτυχία!' : '❌ Σφάλμα'}</span>
                </div>
                <pre className="bg-black text-emerald-400 text-[11px] p-3 rounded-xl overflow-auto max-h-64 whitespace-pre-wrap font-mono leading-relaxed border border-slate-800">
                  {deployLog || '🚀 Εκκίνηση διαδικασίας Deploy στο smartgarden.gr...'}
                </pre>
              </div>
            )}

            <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 text-xs text-slate-300 space-y-3 shadow-xl">
              <div className="font-extrabold text-emerald-400 text-sm flex items-center gap-2">
                <span>🚀 Η απλή διαδικασία σε 2 κλικ:</span>
              </div>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed text-slate-300">
                <li>
                  Πατάς το πράσινο κουμπί <strong>«Download latest_articles.json»</strong> (αποθηκεύεται αυτόματα στα Downloads).
                </li>
                <li>
                  Κάνεις <strong>διπλό κλικ στο `1clicknnn.bat`</strong> στον φάκελό σου.
                </li>
                <li>
                  <strong className="text-emerald-300">Έτοιμο!</strong> Το script παίρνει το νέο JSON, κάνει build και το ανεβάζει αμέσως στο <strong>https://smartgarden.gr</strong> χωρίς κανένα σφάλμα.
                </li>
              </ol>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-400 mb-2">Προεπισκόπηση JSON ({articles.length} άρθρα):</span>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] text-emerald-300 font-mono max-h-96 overflow-y-auto leading-relaxed">
                {JSON.stringify(articles, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: TIKTOK & SHORTS AI STUDIO (ADMIN ONLY) */}
      {viewMode === 'tiktok_studio' && (
        <div id="tiktok-studio-view" className="flex-1 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Suspense fallback={<div className="text-sm text-slate-400 py-12 text-center">Φόρτωση TikTok Studio...</div>}>
              <TikTokStudio
                articles={articles}
                selectedArticleId={selectedArticle?.id}
                onUpdateArticle={(updatedArt) => {
                  const updatedList = articles.map(a => a.id === updatedArt.id ? updatedArt : a);
                  setArticles(updatedList);
                  if (selectedArticle.id === updatedArt.id) {
                    setSelectedArticle(updatedArt);
                  }
                }}
                onDeploy={handleDeployNow}
              />
            </Suspense>
          </div>
        </div>
      )}

      {/* READING MODAL FOR 2200-WORD ARTICLES */}
      {isReadingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div
              className="relative h-64 bg-slate-950 shrink-0 cursor-pointer"
              onMouseEnter={() => setIsModalImageHovered(true)}
              onMouseLeave={() => setIsModalImageHovered(false)}
            >
              <AnimatedShortVideo
                title={selectedArticle.title.el}
                category={selectedArticle.category}
                summary={selectedArticle.summary.el}
                staticImage={selectedArticle.image}
                isHovered={isModalImageHovered}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none"></div>
              <div className="absolute top-4 left-4 flex gap-2 pointer-events-none z-10">
                <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow">
                  {selectedArticle.categoryLabel.el}
                </span>
                <span className="px-3 py-1 rounded-lg bg-slate-950/80 text-slate-200 text-xs font-semibold backdrop-blur">
                  ⏱️ {selectedArticle.readTime}
                </span>
              </div>
              <button
                onClick={() => {
                  stopWebSpeech();
                  setIsArticleReadingAudioActive(false);
                  setIsReadingModalOpen(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-950/80 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold border border-slate-700 cursor-pointer z-20"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">{selectedArticle.title.el}</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 text-sm leading-relaxed">
              {/* Author & Audio Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedArticle.author.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
                    }}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <a
                      href="/syntaktis"
                      onClick={(e) => {
                        e.preventDefault();
                        window.history.pushState(null, '', '/syntaktis');
                        window.location.reload();
                      }}
                      className="font-bold text-white text-xs hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {selectedArticle.author.name}
                    </a>
                    <div className="text-[11px] text-slate-400">{selectedArticle.author.role.el} • {selectedArticle.date}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleToggleArticleSpeech(`${selectedArticle.title.el}. ${selectedArticle.summary.el}`)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isArticleReadingAudioActive
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold animate-pulse shadow-md shadow-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                    title={isArticleReadingAudioActive ? 'Διακοπή εκφώνησης' : 'Άκουσε το άρθρο με AI φωνή'}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isArticleReadingAudioActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                    {isArticleReadingAudioActive ? 'Παύση Ήχου' : 'Άκουσε το'}
                  </button>

                  <button
                    onClick={() => setShowReadingVoiceSettings(!showReadingVoiceSettings)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      showReadingVoiceSettings
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/80'
                    }`}
                    title="Ρυθμίσεις Φωνής & Ταχύτητας"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Ρυθμίσεις Φωνής</span>
                  </button>

                  <span className="text-xs text-rose-400 font-semibold flex items-center gap-1 bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20">
                    ❤️ {selectedArticle.likes}
                  </span>
                </div>
              </div>

              {/* Voice & Speed Settings Box */}
              {showReadingVoiceSettings && (
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    {/* Voice Profile Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        🎙️ Φωνή:
                      </span>
                      <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setReadingVoiceProfile('deep_male');
                            if (isArticleReadingAudioActive) {
                              handleToggleArticleSpeech(
                                `${selectedArticle.title.el}. ${selectedArticle.summary.el}`,
                                'deep_male',
                                readingSpeed
                              );
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer ${
                            readingVoiceProfile === 'deep_male'
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          🧔 Ανδρική Βαθιά
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReadingVoiceProfile('light_female');
                            if (isArticleReadingAudioActive) {
                              handleToggleArticleSpeech(
                                `${selectedArticle.title.el}. ${selectedArticle.summary.el}`,
                                'light_female',
                                readingSpeed
                              );
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer ${
                            readingVoiceProfile === 'light_female'
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          👩 Γυναικεία Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReadingVoiceProfile('warm_female');
                            if (isArticleReadingAudioActive) {
                              handleToggleArticleSpeech(
                                `${selectedArticle.title.el}. ${selectedArticle.summary.el}`,
                                'warm_female',
                                readingSpeed
                              );
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all cursor-pointer ${
                            readingVoiceProfile === 'warm_female'
                              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          🎙️ Γυναικεία Ζεστή
                        </button>
                      </div>
                    </div>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        ⚡ Ταχύτητα:
                      </span>
                      <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 gap-0.5">
                        {[0.8, 1.0, 1.2, 1.5].map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => {
                              setReadingSpeed(speed);
                              if (isArticleReadingAudioActive) {
                                handleToggleArticleSpeech(
                                  `${selectedArticle.title.el}. ${selectedArticle.summary.el}`,
                                  readingVoiceProfile,
                                  speed
                                );
                              }
                            }}
                            className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                              readingSpeed === speed
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Connected Video Guide (if available) */}
              {selectedArticle.videoUrl && (
                <div className="bg-black/90 border border-pink-500/40 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 px-4 py-2 flex items-center justify-between text-white text-xs font-bold">
                    <span className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-white animate-pulse" />
                      🎬 Επίσημο Βίντεο Οδηγός (Smart Garden Video)
                    </span>
                    <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] uppercase font-mono">
                      MP4 HD
                    </span>
                  </div>
                  <div className="p-3 flex justify-center bg-slate-950">
                    <video
                      src={selectedArticle.videoUrl}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="max-h-80 w-auto rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              )}

              {/* Summary Blockquote */}
              <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-slate-300 text-sm bg-emerald-950/10 py-2 rounded-r-lg">
                "{selectedArticle.summary.el}"
              </blockquote>

              {/* Full Content */}
              <ArticleMarkdown content={selectedArticle.content.el} />

              {/* Key Takeaways Card */}
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                <div className="font-bold text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ΒΑΣΙΚΑ ΣΥΜΠΕΡΑΣΜΑΤΑ & ΟΔΗΓΙΕΣ
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  {selectedArticle.keyTakeaways.el.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 1-Click Social Sharing Bar */}
              <SocialShareBar
                title={selectedArticle.title.el}
                summary={selectedArticle.summary.el}
                image={selectedArticle.image}
                url={typeof window !== 'undefined' ? `${window.location.origin}/article/${selectedArticle.slug}` : `https://smartgarden.gr/article/${selectedArticle.slug}`}
              />

              <ArticleToolLinks title={selectedArticle.title.el} summary={selectedArticle.summary.el} />

              <FaqAccordion faqs={getFaqsForArticle(selectedArticle)} />

              {/* Related Articles: keeps readers on-site longer + spreads internal link equity */}
              {(() => {
                const related = articles
                  .filter(a => a.id !== selectedArticle.id && a.category === selectedArticle.category)
                  .slice(0, 3);
                if (related.length === 0) return null;
                return (
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      ΣΧΕΤΙΚΑ ΑΡΘΡΑ
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {related.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedArticle(r)}
                          className="text-left bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl overflow-hidden transition-colors group"
                        >
                          <img
                            src={r.image || "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&auto=format&fit=crop&q=80"}
                            alt={r.title?.el || ''}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="p-2.5">
                            <div className="text-xs font-semibold text-slate-200 line-clamp-2">{r.title?.el}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  stopWebSpeech();
                  setIsArticleReadingAudioActive(false);
                  setIsReadingModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Κλείσιμο
              </button>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsReadingModalOpen(false);
                      setViewMode('tiktok_studio');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-pink-500/20 cursor-pointer transition-all hover:scale-105"
                  >
                    <Film className="w-3.5 h-3.5" />
                    Δημιουργία TikTok Video
                  </button>
                  <button
                    onClick={() => {
                      setIsReadingModalOpen(false);
                      setViewMode('article_editor');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Επεξεργασία αυτού του άρθρου
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM USER TOPIC AI GENERATOR */}
      {showCustomTopicModal && (
        <div id="custom-topic-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    ⚡ REAL GEMINI AI ENGINE
                  </span>
                  <span className="text-xs text-slate-400">Πραγματική Εξειδικευμένη Σύνταξη</span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1.5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Δημιουργία Άρθρου με Δικό σας Θέμα
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Πληκτρολογήστε οποιοδήποτε φυτό ή θέμα (π.χ. <strong>Καλλιέργεια Ακτινιδίου</strong>) και το Gemini AI θα γράψει πραγματικό, εξειδικευμένο άρθρο!
                </p>
              </div>
              <button
                onClick={() => setShowCustomTopicModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 bg-slate-900/90">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Τίτλος ή Θέμα Άρθρου (π.χ. φυτό, τεχνολογία, πρόβλημα):
                </label>
                <input
                  type="text"
                  placeholder="π.χ. Καλλιέργεια Ακτινιδίου (Actinidia deliciosa) & πότισμα"
                  value={customTopicTitle}
                  onChange={(e) => setCustomTopicTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Κατηγορία:</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="plant_care">Φροντίδα Φυτών</option>
                    <option value="balcony">Μπαλκόνι & Γλάστρες</option>
                    <option value="irrigation_iot">Αυτόματο Πότισμα & IoT</option>
                    <option value="vegetable_garden">Λαχανόκηπος</option>
                    <option value="robotic_mowers">Ρομποτικά Mowers</option>
                    <option value="urban_ecology">Αστική Οικολογία</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Δυσκολία:</label>
                  <select
                    value={customDifficulty}
                    onChange={(e) => setCustomDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Εύκολο">Εύκολο</option>
                    <option value="Μέτριο">Μέτριο</option>
                    <option value="Προχωρημένο">Προχωρημένο</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Χρόνος Ανάγνωσης:</label>
                  <input
                    type="text"
                    value={customReadTime}
                    onChange={(e) => setCustomReadTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ειδικές Σημειώσεις / Περίληψη (Προαιρετικό):
                </label>
                <textarea
                  rows={2}
                  placeholder="π.χ. Δώσε έμφαση στην προστασία από τον καύσωνα και στο υπόστρωμα τύρφης..."
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                ></textarea>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowCustomTopicModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleGenerateCustomTopicArticle}
                disabled={customAiLoading || !customTopicTitle.trim()}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                {customAiLoading ? 'Δημιουργία 2.200 λέξεων...' : '🚀 AI Δημιουργία Πλήρους Οδηγού'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {showDeleteConfirmModal && articleToDelete && (
        <div id="delete-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Διαγραφή Άρθρου</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Είστε σίγουροι ότι θέλετε να διαγράψετε το άρθρο:
                </p>
                <div className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-rose-300">
                  «{articleToDelete.title.el}»
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 text-xs text-slate-400">
              ⚠️ Το άρθρο θα αφαιρεθεί από τη λίστα και το νέο JSON αρχείο.
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setArticleToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Οριστική Διαγραφή
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GOOGLE TRENDS & TOP WEEKLY SEARCHES SELECTOR */}
      {showTrendsModal && (
        <div id="trends-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                    LIVE GOOGLE & WEB RESEARCH
                  </span>
                  <span className="text-xs text-slate-400">Εβδομάδα Αυγούστου 2026</span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1.5 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Top 20 Προτεινόμενα Θέματα (Hot Trends Κηπουρικής & IoT)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Επίλεξε ένα από τα 20 πιο περιζήτητα θέματα αναζητήσεων για να δημιουργηθεί άμεσα έτοιμο άρθρο 2.200 λέξεων!
                </p>
              </div>
              <button
                onClick={() => setShowTrendsModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Αναζήτηση στα 20 trends (π.χ. ντομάτα, γκαζόν, πότισμα, φράουλα)..."
                    value={trendsSearchFilter}
                    onChange={(e) => setTrendsSearchFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {trendsSearchFilter && (
                    <button
                      onClick={() => setTrendsSearchFilter('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={handleLiveTrendsSearch}
                  disabled={trendsLiveLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50 whitespace-nowrap transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {trendsLiveLoading ? '🔍 Ερευνητής AI...' : '⚡ Live AI Web Research'}
                </button>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                {[
                  { id: 'all', label: '🔥 Όλα τα Trends (20)' },
                  { id: 'plant_care', label: '🌿 Φροντίδα Φυτών' },
                  { id: 'balcony', label: '🪴 Μπαλκόνι & Βότανα' },
                  { id: 'vegetable_garden', label: '🍅 Λαχανόκηπος' },
                  { id: 'irrigation_iot', label: '💧 Αυτόματο Πότισμα & IoT' },
                  { id: 'robotic_mowers', label: '🤖 Ρομποτικά Mowers' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setTrendsCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      trendsCategoryFilter === cat.id
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics List */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[58vh] bg-slate-900/60">
              {trendsList
                .filter((trend) => {
                  const matchCat = trendsCategoryFilter === 'all' || trend.category === trendsCategoryFilter;
                  const matchQuery =
                    !trendsSearchFilter.trim() ||
                    trend.title.toLowerCase().includes(trendsSearchFilter.toLowerCase()) ||
                    trend.summary.toLowerCase().includes(trendsSearchFilter.toLowerCase()) ||
                    trend.searchIntent.toLowerCase().includes(trendsSearchFilter.toLowerCase());
                  return matchCat && matchQuery;
                })
                .map((trend) => (
                  <div
                    key={trend.id}
                    className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition-all group flex flex-col md:flex-row items-start gap-5 shadow-lg"
                  >
                    <img
                      src={trend.suggestedImage || "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&auto=format&fit=crop&q=80"}
                      alt={trend.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&auto=format&fit=crop&q=80";
                      }}
                      className="w-full md:w-36 h-28 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-extrabold tracking-wider border border-amber-500/20">
                          {trend.growth}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 text-[10px] font-bold border border-emerald-500/20">
                          {trend.searchVolume}
                        </span>
                        <span className="text-[10px] text-slate-400">⏱️ {trend.readTime}</span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                          ✨ 2.200+ λέξεις
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                        {trend.title}
                      </h4>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {trend.summary}
                      </p>

                      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>Search Intent:</strong> {trend.searchIntent}</span>
                      </div>
                    </div>

                    <div className="shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleSelectTrendingTopic(trend)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all hover:scale-105"
                      >
                        <Plus className="w-4 h-4" />
                        Επιλογή & Δημιουργία
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                💡 Τα θέματα ανανεώνονται βάσει των πραγματικών keywords και τάσεων αναζήτησης
              </span>
              <button
                onClick={() => setShowTrendsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUTOMATED CRON & SCHEDULE WEBHOOK MANAGER */}
      {showCronScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border-b border-purple-500/20 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[11px] font-extrabold uppercase">
                  <Clock className="w-3.5 h-3.5" />
                  Αυτοματοποιημένος Χρονοπρογραμματισμός (No-Odin)
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1.5 flex items-center gap-2">
                  ⏰ Auto-Publish Webhook Endpoint
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ρύθμισε αυτόματη συγγραφή 2.200+ λέξεων και 1-click FTP deploy χωρίς να ανοίξεις καν browser!
                </p>
              </div>
              <button
                onClick={() => setShowCronScheduleModal(false)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-2xl space-y-3">
                <div>
                  <h4 className="font-bold text-purple-300 flex items-center gap-2 text-xs">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    1. Direct Live Cron Endpoint (PHP Hosting / Plesk / cron-job.org):
                  </h4>
                  <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/20 font-mono text-xs text-purple-200 break-all select-all flex items-center justify-between gap-2 mt-1.5">
                    <span>https://smartgarden.gr/cron.php?key=smartgarden_cron_secret_2026</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("https://smartgarden.gr/cron.php?key=smartgarden_cron_secret_2026");
                        setCopiedNotification(true);
                        setTimeout(() => setCopiedNotification(false), 2000);
                      }}
                      className="shrink-0 p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-bold cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-400 mt-1">
                    ✨ Περιλαμβάνει την αναβαθμισμένη μηχανή ταυτοποίησης μοναδικών φωτογραφιών βοτανικής & 50 Master άρθρων.
                  </p>
                </div>

                <div className="pt-2 border-t border-purple-500/20">
                  <h4 className="font-bold text-purple-300 flex items-center gap-2 text-xs">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    2. Node.js Dynamic AI Publisher Webhook (Gemini 2.200+ Words + Auto Deploy):
                  </h4>
                  <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/20 font-mono text-xs text-purple-200 break-all select-all flex items-center justify-between gap-2 mt-1.5">
                    <span>{typeof window !== 'undefined' ? `${window.location.origin}/api/cron-publish?key=smartgarden_cron_secret_2026` : '/api/cron-publish?key=smartgarden_cron_secret_2026'}</span>
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(`${window.location.origin}/api/cron-publish?key=smartgarden_cron_secret_2026`);
                          setCopiedNotification(true);
                          setTimeout(() => setCopiedNotification(false), 2000);
                        }
                      }}
                      className="shrink-0 p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-bold cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-300">
                  📋 Πώς να το ρυθμίσετε δωρεάν σε 1 λεπτό (π.χ. στο cron-job.org ή Zapier / Make / Plesk):
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <li>Μπείτε στο δωρεάν <strong>cron-job.org</strong> ή στο Plesk Crontab.</li>
                  <li>Δημιουργήστε νέο Cronjob και επικολλήστε το παραπάνω URL: <code>https://smartgarden.gr/cron.php?key=smartgarden_cron_secret_2026</code></li>
                  <li>Ορίστε συχνότητα: π.χ. <strong>Κάθε μέρα στις 09:00 π.μ.</strong> (ή 1 φορά την εβδομάδα).</li>
                  <li><strong>Αυτό ήταν!</strong> Κάθε φορά που καλείται:
                    <ul className="list-disc list-inside ml-4 mt-1 text-slate-400 space-y-0.5">
                      <li>Επιλέγει το επόμενο άρθρο και του αποδίδει μοναδική, σχετική φωτογραφία υψηλής ανάλυσης.</li>
                      <li>Δημοσιεύει αμέσως στην κορυφή του <code>smartgarden.gr</code> χωρίς καμία χειροκίνητη ενέργεια.</li>
                    </ul>
                  </li>
                </ol>
              </div>

              {/* Test Now Button */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-white text-xs">Δοκιμαστική Εκτέλεση Τώρα (Live Test)</h5>
                    <p className="text-[11px] text-slate-400">Εκτέλεση ενός αυτόματου κύκλου άρθρου 2.200 λέξεων και deploy</p>
                  </div>
                  <button
                    disabled={cronTriggerLoading}
                    onClick={async () => {
                      setCronTriggerLoading(true);
                      setCronTriggerResult(null);
                      try {
                        const res = await fetch('/api/cron-publish?key=smartgarden_cron_secret_2026', { method: 'POST' });
                        const data = await res.json();
                        if (data.success) {
                          setCronTriggerResult(`✅ ΕΠΙΤΥΧΙΑ: ${data.message}`);
                          // Reload articles
                          const artRes = await fetch(`/latest_articles.json?t=${Date.now()}`);
                          if (artRes.ok) {
                            const newArticles = await artRes.json();
                            setArticles(newArticles);
                            setSelectedArticle(newArticles[0]);
                          }
                        } else {
                          setCronTriggerResult(`❌ Σφάλμα: ${data.error || 'Αποτυχία cron'}`);
                        }
                      } catch (err: any) {
                        setCronTriggerResult(`❌ Σφάλμα δικτύου: ${err?.message}`);
                      } finally {
                        setCronTriggerLoading(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {cronTriggerLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Συγγραφή & Deploy...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Εκτέλεση Τώρα (Test)
                      </>
                    )}
                  </button>
                </div>

                {cronTriggerResult && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${cronTriggerResult.startsWith('✅') ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'}`}>
                    {cronTriggerResult}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-purple-400/80">
                🔒 Προστατευμένο με μυστικό κλειδί ασφαλείας
              </span>
              <button
                onClick={() => setShowCronScheduleModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Κλείσιμο
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 text-xs text-slate-400 max-w-6xl mx-auto w-full space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">SmartGarden.gr</span>
            <span>•</span>
            <span>© 2026 Επιστημονική Γεωπονία, Αστική Κηπουρική & Τηλεμετρία</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px]">
            <a
              href="https://www.youtube.com/@Smartgarden-h4f"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors py-1.5"
              title="SmartGarden.gr στο YouTube"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>YouTube</span>
            </a>

            <a
              href="https://www.facebook.com/people/SmartGardengr/61594241310349/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors py-1.5"
              title="SmartGarden.gr στο Facebook"
            >
              <Facebook className="w-3.5 h-3.5 text-blue-500" />
              <span>Facebook</span>
            </a>

            <a
              href="https://www.instagram.com/smartgarden.gr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-pink-400 flex items-center gap-1 transition-colors py-1.5"
              title="SmartGarden.gr στο Instagram"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-500" />
              <span>Instagram</span>
            </a>

            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
              title="Google Search Console XML Sitemap"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sitemap XML (58+ Άρθρα)</span>
            </a>

            <a
              href="/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              title="Google News & Feedly RSS Feed"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
              <span>RSS Feed</span>
            </a>

            <a
              href="/imerologio-sporas"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/imerologio-sporas'); window.location.reload(); }}
              className="text-slate-400 hover:text-emerald-400 transition-colors py-1.5"
            >
              Ημερολόγιο Σποράς
            </a>

            <a
              href="/syntaktis"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/syntaktis'); window.location.reload(); }}
              className="text-slate-400 hover:text-emerald-400 transition-colors py-1.5"
            >
              Ο Συντάκτης
            </a>

            <a
              href="/klima-kipoy"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/klima-kipoy'); window.location.reload(); }}
              className="text-slate-400 hover:text-emerald-400 transition-colors py-1.5"
            >
              Κλίμα &amp; ET₀ Πόλεων
            </a>

            <a
              href="/pagetos"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/pagetos'); window.location.reload(); }}
              className="text-slate-400 hover:text-emerald-400 transition-colors py-1.5"
            >
              Ημερομηνίες Παγετού
            </a>

            <a
              href="/fyta"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/fyta'); window.location.reload(); }}
              className="text-slate-400 hover:text-emerald-400 transition-colors py-1.5"
            >
              Βάση Φυτών
            </a>

            <a
              href="/rotiste"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/rotiste'); window.location.reload(); }}
              className="text-slate-400 hover:text-emerald-400 transition-colors py-1.5"
            >
              Ρωτήστε τον Γεωπόνο
            </a>

            <a href="/about.html" className="text-slate-400 hover:text-emerald-400 transition-colors py-1.5">
              Σχετικά & Επικοινωνία
            </a>

            <a href="/privacy-policy.html" className="text-slate-400 hover:text-emerald-400 transition-colors py-1.5">
              Πολιτική Απορρήτου
            </a>

            <a href="/terms-of-service.html" className="text-slate-400 hover:text-emerald-400 transition-colors py-1.5">
              Όροι Χρήσης
            </a>

            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className="text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer border-l border-slate-800 pl-3 py-1.5"
              title="Εναλλαγή προβολής διαχειριστή / επισκέπτη"
            >
              {isAdmin ? '🔒 Λειτουργία Επισκέπτη' : '⚙️ Visual Studio Admin'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

