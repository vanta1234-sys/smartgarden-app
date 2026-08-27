import React, { useState, useMemo, useRef } from 'react';
import {
  Film,
  Sparkles,
  Video,
  Copy,
  CheckCircle2,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Smartphone,
  Layers,
  Wand2,
  Download,
  Flame,
  Zap,
  ExternalLink,
  MessageSquare,
  Bot,
  Scissors,
  Upload,
  Link as LinkIcon,
  Check,
  Trash2,
  Eye
} from 'lucide-react';

export interface ArticleItem {
  id: string;
  slug: string;
  title: { el: string; en: string };
  category: string;
  categoryLabel: { el: string; en: string };
  readTime: string;
  difficulty: string;
  difficultyLabel: { el: string; en: string };
  date: string;
  author: {
    name: string;
    role: { el: string; en: string };
    avatar: string;
  };
  image: string;
  videoUrl?: string;
  summary: { el: string; en: string };
  content: { el: string; en: string };
  keyTakeaways: { el: string[]; en: string[] };
  socialScriptReady?: boolean;
  likes?: number;
  featured?: boolean;
}

interface TikTokStudioProps {
  articles: ArticleItem[];
  selectedArticleId?: string;
  onUpdateArticle?: (updated: ArticleItem) => void;
  onDeploy?: () => void;
}

const FREE_AI_VIDEO_TOOLS = [
  {
    id: 'lumen5',
    name: 'Lumen5 (Article to Video AI)',
    url: 'https://lumen5.com',
    badge: 'Κορυφαίο για Άρθρα & Blogs',
    desc: 'Κάνετε επικόλληση το άρθρο ή το link και δημιουργεί αυτόματα σκηνές, video πλάνα, υπότιτλους και μουσική!',
    freePlan: '100% Δωρεάν εγγραφή & export βίντεο'
  },
  {
    id: 'invideo',
    name: 'InVideo AI (Text-to-Video)',
    url: 'https://ai.invideo.io',
    badge: 'Πλήρης Αυτοματισμός & Φωνή',
    desc: 'Γράφετε απλά το θέμα ή το script και συνθέτει αυτόματα voiceover, b-roll πλάνα φυτών και animated captions.',
    freePlan: 'Δωρεάν δοκιμή με export'
  },
  {
    id: 'capcut',
    name: 'CapCut Web AI (100% Δωρεάν & #1 TikTok)',
    url: 'https://www.capcut.com/tools/ai-script-to-video',
    badge: 'Επίσημο TikTok Tool',
    desc: 'Το κορυφαίο εργαλείο για 9:16 vertical shorts. Script-to-Video, ελληνική/αγγλική AI φωνή, αυτόματοι υπότιτλοι.',
    freePlan: '100% Δωρεάν με απεριόριστα εξαγωγές 1080p χωρίς watermark'
  },
  {
    id: 'clipchamp',
    name: 'Microsoft Clipchamp AI',
    url: 'https://clipchamp.com',
    badge: 'Επίσημο Microsoft AI',
    desc: 'Κορυφαία ελληνική AI εκφώνηση (Natural Greek Voices). Δημιουργεί αυτόματα υπότιτλους και transitions.',
    freePlan: '100% Δωρεάν εξαγωγή 1080p HD'
  },
  {
    id: 'fliki',
    name: 'Fliki AI (Greek Voiceover to Video)',
    url: 'https://fliki.ai',
    badge: 'Ρεαλιστική Ελληνική Φωνή',
    desc: 'Μετατρέπει κείμενο σε βίντεο με ρεαλιστικές ελληνικές φωνές AI και stock footage κηπουρικής.',
    freePlan: 'Δωρεάν μηνιαία credits'
  },
  {
    id: 'canva',
    name: 'Canva Magic Video',
    url: 'https://www.canva.com/create/tiktok-videos/',
    badge: 'Templates & Design',
    desc: 'Έτοιμα animations 9:16 για φυτά, animated graphics και auto-captions με drag and drop.',
    freePlan: 'Δωρεάν βασικό πλάνο'
  }
];

export const TikTokStudio: React.FC<TikTokStudioProps> = ({
  articles,
  selectedArticleId,
  onUpdateArticle,
  onDeploy
}) => {
  const [activeArticleId, setActiveArticleId] = useState<string>(selectedArticleId || articles[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'upload_video' | 'script' | 'prompt' | 'tools'>('upload_video');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [previewScene, setPreviewScene] = useState(0);

  // Video Upload / Embed State
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  const currentArticle = useMemo(() => {
    return articles.find(a => a.id === activeArticleId) || articles[0];
  }, [articles, activeArticleId]);

  // Sync current article video if exists
  const activeVideoUrl = currentArticle?.videoUrl || '';

  // Generate TikTok Dynamic Script
  const tikTokScript = useMemo(() => {
    if (!currentArticle) return null;

    const title = currentArticle.title?.el || currentArticle.title || '';
    const summary = currentArticle.summary?.el || currentArticle.summary || '';
    const bullets = currentArticle.keyTakeaways?.el || [];

    const hook = `🌿 Μην κάνεις ΠΟΤΕ αυτό το λάθος! ${title.replace(/[\(\)]/g, '')}...`;
    
    const scenes = [
      {
        time: '0:00 - 0:03',
        type: '🪝 THE HOOK (Πρώτα 3 δευτερόλεπτα)',
        visual: 'Κοντινό πλάνο (close-up) σε κιτρινισμένο φύλλο ή στεγνό χώμα γλάστρας. Γρήγορο zoom in.',
        voiceover: `«Αν έχεις φυτά στο μπαλκόνι, σταμάτα να κάνεις αυτό το κλασικό λάθος που τα καταστρέφει!»`,
        onScreenText: '🛑 ΣΤΑΜΑΤΑ ΝΑ ΤΟ ΚΑΝΕΙΣ ΑΥΤΟ!'
      },
      {
        time: '0:03 - 0:12',
        type: '🧠 ΤΟ ΠΡΟΒΛΗΜΑ & Η ΑΛΗΘΕΙΑ',
        visual: 'Πλάνο ποτίσματος μεσημέρι ή με πιατάκι γεμάτο λιμνάζον νερό. Εφέ κόκκινου θαυμαστικού.',
        voiceover: `«${summary.slice(0, 140)}... Οι περισσότεροι νομίζουν ότι θέλει απλά νερό, αλλά η πραγματικότητα είναι διαφορετική.»`,
        onScreenText: '⚠️ ΤΙ ΠΡΑΓΜΑΤΙΚΑ ΣΥΜΒΑΙΝΕΙ'
      },
      {
        time: '0:12 - 0:22',
        type: '💡 ΤΑ 3 ΧΡΥΣΑ TIPS ΓΙΑ ΦΟΥΝΤΩΜΑ',
        visual: '3 γρήγορα B-roll clips: 1) Έλεγχος ρίζας/χώματος 2) Πρωινό πότισμα 3) Σωστή λίπανση.',
        voiceover: `«1ον: ${bullets[0] || 'Ελέγχουμε 3cm βάθος στο χώμα πριν ποτίσουμε'}. 2ον: ${bullets[1] || 'Ποτίζουμε μόνο νωρίς το πρωί'}. 3ον: ${bullets[2] || 'Αδειάζουμε πάντα το πιατάκι μετά από 20 λεπτά'}.»`,
        onScreenText: '✅ 3 ΒΗΜΑΤΑ ΓΙΑ ΕΠΙΤΥΧΙΑ'
      },
      {
        time: '0:22 - 0:30',
        type: '🚀 CALL TO ACTION (CTA)',
        visual: 'Πλάνο υγιούς φυτού γεμάτου καρπούς/λουλούδια. Εμφάνιση του λογότυπου SmartGarden.gr.',
        voiceover: `«Αποθήκευσε αυτό το βίντεο για να μην το χάσεις και μπες στο SmartGarden.gr για τον πλήρη δωρεάν οδηγό!»`,
        onScreenText: '📲 ΑΠΟΘΗΚΕΥΣΕ ΤΟ • SmartGarden.gr'
      }
    ];

    const fullScriptText = `🎬 TIKTOK SCRIPT: ${title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Διάρκεια: 30-45 δευτερόλεπτα (High Viral Retention)
🎯 Θέμα: ${currentArticle.categoryLabel?.el || currentArticle.category}

[0:00-0:03] 🪝 HOOK:
Visual: Κοντινό πλάνο σε φυτό μπαλκονιού με δραματικό zoom.
Voiceover: «Αν έχεις φυτά στο μπαλκόνι, σταμάτα να κάνεις αυτό το κλασικό λάθος!»
Text on Screen: 🛑 ΣΤΑΜΑΤΑ ΑΥΤΟ ΤΟ ΛΑΘΟΣ!

[0:03-0:12] ⚠️ ΕΠΕΞΗΓΗΣΗ:
Visual: Πλάνο με λάθος πότισμα ή καυτό ήλιο.
Voiceover: «${summary.slice(0, 150)}»
Text on Screen: ⚠️ ΤΙ ΠΡΑΓΜΑΤΙΚΑ ΣΥΜΒΑΙΝΕΙ

[0:12-0:22] 🌿 ΤΑ 3 ΒΑΣΙΚΑ ΒΗΜΑΤΑ:
Visual: 3 γρήγορα tutorials / B-roll clips.
Voiceover: «1) ${bullets[0] || 'Σωστό υπόστρωμα και pH'}. 2) ${bullets[1] || 'Στάγδην άρδευση'}. 3) ${bullets[2] || 'Οργανική λίπανση'}.»
Text on Screen: 1️⃣ Υπόστρωμα  2️⃣ Πότισμα  3️⃣ Λίπανση

[0:22-0:30] 🚀 CALL TO ACTION:
Visual: Υγιή καταπράσινα φυτά & λογότυπο smartgarden.gr.
Voiceover: «Αποθήκευσε το βίντεο και δες τον αναλυτικό οδηγό 2.200 λέξεων στο SmartGarden.gr!»
Text on Screen: 📲 SmartGarden.gr (Δωρεάν Οδηγός)`;

    const aiPromptForGenerator = `Create a viral 9:16 vertical TikTok/Short video in Greek (or with English/Greek subtitles).
Topic: "${title}"
Visual Style: Professional 4K organic gardening cinematography, healthy green foliage, close-ups of balcony pots, drip irrigation water droplets, warm Mediterranean sunlight.
Narration Script:
"${scenes.map(s => s.voiceover).join(' ')}"
Format: 9:16 vertical aspect ratio, bold animated captions centered on screen, upbeat acoustic botanical background music.`;

    return {
      hook,
      scenes,
      fullScriptText,
      aiPromptForGenerator
    };
  }, [currentArticle]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Handle local video file upload (.mp4, .webm, .mov)
  const handleFileUpload = async (file: File) => {
    if (!currentArticle) return;
    setIsUploading(true);
    setUploadMessage('⏳ Μεταφόρτωση και επεξεργασία βίντεο...');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        // 1. Send to server endpoint
        try {
          const res = await fetch('/api/upload-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              articleId: currentArticle.id,
              videoBase64: base64Data,
              filename: file.name
            })
          });

          if (res.ok) {
            const data = await res.json();
            const savedUrl = data.videoUrl || URL.createObjectURL(file);
            const updated = { ...currentArticle, videoUrl: savedUrl };
            if (onUpdateArticle) onUpdateArticle(updated);
            setUploadMessage('🎉 Το βίντεο αποθηκεύτηκε επιτυχώς και συνδέθηκε με το άρθρο!');
          } else {
            // Local fallback
            const localUrl = URL.createObjectURL(file);
            const updated = { ...currentArticle, videoUrl: localUrl };
            if (onUpdateArticle) onUpdateArticle(updated);
            setUploadMessage('✅ Το βίντεο φορτώθηκε τοπικά (Object URL)!');
          }
        } catch {
          const localUrl = URL.createObjectURL(file);
          const updated = { ...currentArticle, videoUrl: localUrl };
          if (onUpdateArticle) onUpdateArticle(updated);
          setUploadMessage('✅ Το βίντεο φορτώθηκε τοπικά!');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsUploading(false);
      setUploadMessage('❌ Σφάλμα: ' + err.message);
    }
  };

  // Handle manual video URL (e.g. YouTube embed, cloud URL, direct MP4 link)
  const handleSaveVideoUrl = async (urlToSave: string) => {
    if (!currentArticle || !urlToSave.trim()) return;
    setIsUploading(true);
    setUploadMessage('⏳ Σύνδεση Video URL με το άρθρο...');

    try {
      await fetch('/api/upload-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: currentArticle.id,
          videoUrl: urlToSave.trim()
        })
      });

      const updated = { ...currentArticle, videoUrl: urlToSave.trim() };
      if (onUpdateArticle) onUpdateArticle(updated);
      setUploadMessage('🎉 Το Video URL συνδέθηκε επιτυχώς με το άρθρο!');
    } catch {
      const updated = { ...currentArticle, videoUrl: urlToSave.trim() };
      if (onUpdateArticle) onUpdateArticle(updated);
      setUploadMessage('✅ Το Video URL αποθηκεύτηκε τοπικά!');
    }
    setIsUploading(false);
  };

  const handleRemoveVideo = async () => {
    if (!currentArticle) return;
    const updated = { ...currentArticle, videoUrl: undefined };
    if (onUpdateArticle) onUpdateArticle(updated);
    setVideoUrlInput('');
    setUploadMessage('🗑️ Το βίντεο αφαιρέθηκε από το άρθρο.');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-extrabold text-[11px] shadow-sm uppercase tracking-wider">
              🎬 Smart Video Studio 9:16
            </span>
            <span className="text-xs text-slate-400 font-medium">Lumen5 • CapCut • Clipchamp • InVideo</span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Film className="w-6 h-6 text-pink-400" />
            Social Video & TikTok Studio
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Ανέβασε το έτοιμο βίντεο (MP4/WebM) ή αντέγραψε το αυτόματο AI Script για να το δημιουργήσεις σε 60 δευτερόλεπτα.
          </p>
        </div>

        {/* Article Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-slate-400 mb-1">Επιλογή Άρθρου:</label>
            <select
              value={activeArticleId}
              onChange={(e) => {
                setActiveArticleId(e.target.value);
                setUploadMessage(null);
              }}
              className="bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold px-4 py-2.5 rounded-xl focus:outline-none focus:border-pink-500 max-w-xs truncate cursor-pointer"
            >
              {articles.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.videoUrl ? '🎬 ' : ''}{art.title?.el || art.title} ({art.categoryLabel?.el || art.category})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-4">
        <button
          onClick={() => setActiveTab('upload_video')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'upload_video'
              ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 text-white shadow-lg shadow-pink-500/20 scale-105'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Upload className="w-4 h-4 text-pink-300" />
          1. 🚀 Ανέβασμα & Σύνδεση Έτοιμου Βίντεο {activeVideoUrl ? '(✅ Έχει Βίντεο)' : ''}
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'script'
              ? 'bg-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20 scale-105'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          2. Script & Storyboard (30s)
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          3. Δωρεάν AI Video Tools
        </button>

        <button
          onClick={() => setActiveTab('prompt')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'prompt'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          4. AI Prompt Generator
        </button>
      </div>

      {/* TAB 1 (MAIN): UPLOAD & LIVE VIDEO PLAYER */}
      {activeTab === 'upload_video' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload Controls & Video Connect (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Upload className="w-5 h-5 text-pink-400" />
                    Ανέβασμα Αρχείου Βίντεο (.MP4 / .WebM / .MOV)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Επίλεξε το βίντεο που μόλις έφτιαξες (π.χ. από Lumen5, CapCut, InVideo) για να ενσωματωθεί στο άρθρο:
                  </p>
                </div>
                {activeVideoUrl && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ΣΥΝΔΕΔΕΜΕΝΟ
                  </span>
                )}
              </div>

              {/* Drag & Drop File Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-pink-500/40 hover:border-pink-400 bg-pink-950/10 hover:bg-pink-950/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="video/mp4,video/webm,video/quicktime,video/ogg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                    Κάντε κλικ για επιλογή αρχείου ή σύρετε το βίντεο εδώ
                  </div>
                  <div className="text-xs text-slate-400">
                    Υποστηρίζονται αρχεία <strong>.MP4, .WebM, .MOV</strong> (Lumen5, TikTok, CapCut, Clips)
                  </div>
                </div>
              </div>

              {/* Or Direct Video URL Input */}
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <label className="block text-xs font-bold text-slate-300">
                  Ή επικόλληση απευθείας Video URL / Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="π.χ. /videos/tomatoes.mp4 ή https://example.com/video.mp4"
                    value={videoUrlInput || activeVideoUrl}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-pink-500"
                  />
                  <button
                    onClick={() => handleSaveVideoUrl(videoUrlInput)}
                    disabled={isUploading || !videoUrlInput.trim()}
                    className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Σύνδεση URL
                  </button>
                </div>
              </div>

              {/* Status notification */}
              {uploadMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  uploadMessage.includes('❌') ? 'bg-rose-950/40 text-rose-300 border border-rose-500/30' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                }`}>
                  <span>{uploadMessage}</span>
                  {activeVideoUrl && (
                    <button
                      onClick={handleRemoveVideo}
                      className="text-slate-400 hover:text-rose-400 text-[11px] underline ml-2 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Αφαίρεση Βίντεο
                    </button>
                  )}
                </div>
              )}

              {/* Article Meta Banner */}
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-xs space-y-2">
                <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wide">
                  Συνδεδεμένο Άρθρο:
                </div>
                <div className="font-bold text-white text-sm leading-snug">
                  {currentArticle?.title?.el || currentArticle?.title}
                </div>
                <div className="text-slate-400 text-[11px] line-clamp-2">
                  {currentArticle?.summary?.el || currentArticle?.summary}
                </div>
              </div>

              {/* Deploy Action */}
              {onDeploy && (
                <div className="pt-2">
                  <button
                    onClick={onDeploy}
                    className="w-full bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 hover:from-amber-300 hover:to-teal-300 text-slate-950 text-xs font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Zap className="w-4 h-4 text-slate-950 fill-current" />
                    🚀 1-CLICK DEPLOY ΣΤΟ SMARTGARDEN.GR ΜΕ ΤΟ ΝΕΟ ΒΙΝΤΕΟ
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Live 9:16 Video Player Preview Phone (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-3">
            <div className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-pink-400" />
              Ζωντανή Προεπισκόπηση Βίντεο (9:16 Player)
            </div>

            {/* Smartphone Frame */}
            <div className="w-72 h-[510px] bg-black rounded-[36px] border-4 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 group">
              
              {/* If Video URL is attached, render REAL HTML5 video player */}
              {activeVideoUrl ? (
                <>
                  <video
                    ref={videoPlayerRef}
                    src={activeVideoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    muted={isMuted}
                    className="absolute inset-0 w-full h-full object-cover z-10"
                  />
                  {/* Floating Sound Toggle */}
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/70 backdrop-blur text-white flex items-center justify-center border border-white/20 cursor-pointer shadow hover:scale-110 transition-transform"
                    title={isMuted ? "Άνοιγμα ήχου" : "Σίγαση"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  </button>
                </>
              ) : (
                /* Fallback Image with Overlays */
                <>
                  <img
                    src={currentArticle?.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

                  {/* Top Bar */}
                  <div className="relative z-10 flex items-center justify-between text-white text-[10px] font-bold">
                    <span className="bg-pink-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ● VIDEO READY
                    </span>
                    <span className="text-slate-300">SmartGarden.gr</span>
                  </div>

                  {/* Center Captions Banner */}
                  <div className="relative z-10 text-center px-2 space-y-2">
                    <span className="inline-block bg-yellow-400 text-black font-black text-xs px-3 py-1 rounded-md shadow-lg transform -rotate-1">
                      {tikTokScript?.scenes[previewScene]?.onScreenText || '🛑 ΣΤΑΜΑΤΑ ΑΥΤΟ ΤΟ ΛΑΘΟΣ!'}
                    </span>
                    <p className="text-xs font-bold text-white drop-shadow-md leading-snug line-clamp-3">
                      {tikTokScript?.scenes[previewScene]?.voiceover}
                    </p>
                  </div>

                  {/* Bottom Meta & Icons */}
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-extrabold text-white flex items-center gap-1">
                          <span>@smartgarden.gr</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-current" />
                        </div>
                        <p className="text-[10px] text-slate-300 line-clamp-1 mt-0.5">
                          #κηπουρικη #μπαλκονι #φυτα #tips
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-1 text-white text-[10px]">
                        <div className="w-8 h-8 rounded-full bg-slate-800/80 flex items-center justify-center font-bold">
                          ❤️
                        </div>
                        <span>18.5K</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>

            <p className="text-[11px] text-slate-400 text-center max-w-xs">
              {activeVideoUrl ? '✅ Το βίντεο θα εμφανίζεται κανονικά σε όλους τους επισκέπτες του SmartGarden.gr!' : '💡 Ανέβασε το MP4 από αριστερά για να παίξει εδώ ζωντανά.'}
            </p>
          </div>

        </div>
      )}

      {/* TAB 2: SCRIPT BREAKDOWN & STORYBOARD */}
      {activeTab === 'script' && tikTokScript && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-12 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Σκηνές & Voiceover (Χρονισμός 30s)
              </h3>
              <button
                onClick={() => copyToClipboard(tikTokScript.fullScriptText, 'full_script')}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow active:scale-95"
              >
                {copiedType === 'full_script' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Αντιγράφηκε Όλο!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Αντιγραφή Πλήρους Script
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tikTokScript.scenes.map((scene, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                      {scene.time}
                    </span>
                    <span className="font-bold text-slate-300">{scene.type}</span>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                    <div className="text-[11px] font-bold text-pink-400 uppercase tracking-wide mb-1">
                      🗣️ Voiceover (Εκφώνηση):
                    </div>
                    <p className="text-xs text-white font-medium leading-relaxed">
                      {scene.voiceover}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 font-bold block mb-0.5">🎬 Visual (Πλάνο):</span>
                      <span className="text-slate-300">{scene.visual}</span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-amber-400 font-bold block mb-0.5">💬 Text Overlay:</span>
                      <span className="text-amber-200 font-extrabold">{scene.onScreenText}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FREE AI VIDEO TOOLS */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          <div className="bg-pink-950/30 border border-pink-500/30 rounded-2xl p-5 flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-pink-400 shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-extrabold text-pink-300">
                Πώς να φτιάξετε το Βίντεο σε 3 απλά βήματα:
              </h4>
              <ol className="text-xs text-slate-300 space-y-1.5 mt-2 list-decimal list-inside">
                <li>Αντιγράψτε το <strong>AI Prompt</strong> ή το <strong>Script</strong> από τις διπλανές καρτέλες.</li>
                <li>Ανοίξτε το <strong>Lumen5</strong>, <strong>CapCut Web</strong> ή <strong>InVideo AI</strong>.</li>
                <li>Κάντε Paste, κατεβάστε το αρχείο <strong>.MP4</strong> και ανεβάστε το στο Tab 1!</li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FREE_AI_VIDEO_TOOLS.map((tool) => (
              <div
                key={tool.id}
                className="bg-slate-950 border border-slate-800 hover:border-pink-500/50 rounded-2xl p-5 space-y-3 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      {tool.badge}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">100% Free</span>
                  </div>
                  
                  <h3 className="text-base font-bold text-white group-hover:text-pink-400 transition-colors">
                    {tool.name}
                  </h3>
                  
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {tool.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {tool.freePlan}
                  </span>

                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-800 hover:bg-pink-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
                  >
                    <span>Άνοιγμα Tool</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AI PROMPT COPY */}
      {activeTab === 'prompt' && tikTokScript && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              Έτοιμο Prompt για InVideo AI / Lumen5 / CapCut
            </h3>
            <button
              onClick={() => copyToClipboard(tikTokScript.aiPromptForGenerator, 'ai_prompt')}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              {copiedType === 'ai_prompt' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Αντιγράφηκε!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Αντιγραφή AI Prompt
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-purple-200 leading-relaxed whitespace-pre-wrap">
            {tikTokScript.aiPromptForGenerator}
          </div>

          <p className="text-xs text-slate-400">
            💡 <strong>Οδηγία:</strong> Κάντε αντιγραφή αυτού του prompt και επικολλήστε το απευθείας στο <strong>Lumen5</strong> ή <strong>InVideo AI</strong> για να δημιουργήσει αυτόματα όλο το βίντεο με φωνή, b-roll πλάνα φυτών και υπότιτλους!
          </p>
        </div>
      )}

    </div>
  );
};
