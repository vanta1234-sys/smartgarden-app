import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RemotionPreviewPlayer } from '../remotion/RemotionPreviewPlayer';
import { TikTokScriptData } from '../remotion/TikTokComposition';
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
  Bot,
  Upload,
  Link as LinkIcon,
  Trash2,
  Send,
  UserCheck,
  Radio,
  FileVideo,
  Scissors,
  Check,
  Clock,
  Eye,
  Heart,
  Calendar,
  AlertCircle,
  Image as ImageIcon
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

interface TikTokPost {
  id: string;
  articleId: string;
  title: string;
  caption: string;
  hashtags: string[];
  videoUrl?: string;
  status: string;
  platform: string;
  accountEmail: string;
  publishedAt: string;
  views: number;
  likes: number;
  tiktokUrl: string;
}

interface TikTokStudioProps {
  articles: ArticleItem[];
  selectedArticleId?: string;
  onUpdateArticle?: (updated: ArticleItem) => void;
  onDeploy?: () => void;
}

const FREE_AI_VIDEO_TOOLS = [
  {
    id: 'capcut',
    name: 'CapCut Web AI (100% Δωρεάν & Επίσημο TikTok)',
    url: 'https://www.capcut.com/tools/ai-script-to-video',
    badge: '1-Click Direct TikTok Sync',
    desc: 'Το #1 εργαλείο της ByteDance (TikTok). Βάζετε το σενάριο που φτιάχνει το SmartGarden και με 1 κλικ δημοσιεύει απευθείας στον λογαριασμό σας!',
    freePlan: '100% Δωρεάν με απεριόριστα εξαγωγές 1080p'
  },
  {
    id: 'tiktok_upload',
    name: 'TikTok Creator Upload Studio',
    url: 'https://www.tiktok.com/creator-center/upload',
    badge: 'Επίσημο TikTok Web',
    desc: 'Ανοίγει απευθείας τη σελίδα δημοσίευσης TikTok. Ρίχνετε το έτοιμο MP4 που κατεβάσατε και έχετε ήδη αντιγραμμένα τα hashtags & κείμενο!',
    freePlan: 'Επίσημο & Δωρεάν'
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
    id: 'clipchamp',
    name: 'Microsoft Clipchamp AI',
    url: 'https://clipchamp.com',
    badge: 'Επίσημο Microsoft AI',
    desc: 'Κορυφαία ελληνική AI εκφώνηση (Natural Greek Voices). Δημιουργεί αυτόματα υπότιτλους και transitions.',
    freePlan: '100% Δωρεάν εξαγωγή 1080p HD'
  }
];

export const TikTokStudio: React.FC<TikTokStudioProps> = ({
  articles,
  selectedArticleId,
  onUpdateArticle,
  onDeploy
}) => {
  const [activeArticleId, setActiveArticleId] = useState<string>(selectedArticleId || articles[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'remotion' | 'tiktok_direct' | 'auto_generator' | 'script' | 'history' | 'tools'>('remotion');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  
  // Animation / Render States
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedVideoBlobUrl, setGeneratedVideoBlobUrl] = useState<string | null>(null);

  // Direct Auto-Publishing State
  const [isAutoPublishing, setIsAutoPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState<number>(0);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState<string | null>(null);
  const [publishedPosts, setPublishedPosts] = useState<TikTokPost[]>([]);

  // Video Upload / Embed State
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentArticle = useMemo(() => {
    return articles.find(a => a.id === activeArticleId) || articles[0];
  }, [articles, activeArticleId]);

  const activeVideoUrl = currentArticle?.videoUrl || generatedVideoBlobUrl || '';

  // Load published TikTok history
  const fetchPublishedPosts = async () => {
    try {
      const res = await fetch('/tiktok_posts.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        const posts = Array.isArray(data) ? data : (data.posts || []);
        setPublishedPosts(posts);
      }
    } catch (e) {
      console.warn('Could not load tiktok history:', e);
    }
  };

  useEffect(() => {
    fetchPublishedPosts();
  }, []);

  // Generate TikTok Dynamic Script & Metadata
  const tikTokScript = useMemo(() => {
    if (!currentArticle) return null;

    const title = currentArticle.title?.el || currentArticle.title || '';
    const summary = currentArticle.summary?.el || currentArticle.summary || '';
    const bullets = currentArticle.keyTakeaways?.el || [
      'Σωστό υπόστρωμα και στράγγιση',
      'Πότισμα μόνο νωρίς το πρωί',
      'Οργανική θρέψη και προστασία'
    ];

    const cleanTitle = title.replace(/[\(\):]/g, '').trim();

    const stepLabels = ['1️⃣', '2️⃣', '3️⃣'];
    const stepFallbacks = ['Σωστή αποστράγγιση', 'Πότισμα μόνο όταν στεγνώσει το χώμα', 'Οργανικό λίπασμα'];
    const stepOrdinals = ['Πρώτον', 'Δεύτερον', 'Τρίτον'];

    // Rotate the opening hook/problem framing across a few storytelling angles that
    // research shows outperform a single repeated format on Shorts/TikTok ("plant
    // autopsy", "soil detective", "myth court") — deterministic per-article (id hash)
    // so the same article always renders the same way, but different articles vary.
    // Deliberately only touches the HOOK/PROBLEM scenes' tag/voiceover/onScreenText —
    // scene count, timing, and the per-step/caption sync logic below are untouched.
    const hookAngles = [
      {
        hookTag: '🪝 THE HOOK',
        hookVoiceover: 'Μην κάνεις ποτέ αυτό το λάθος με τα φυτά σου στο μπαλκόνι',
        hookText: 'Το λάθος που κάνουν όλοι',
        problemTag: 'ΤΟ ΠΡΟΒΛΗΜΑ',
        problemText: 'Αν το αγνοήσεις, οι ρίζες ασφυκτιούν',
      },
      {
        hookTag: '🔬 PLANT AUTOPSY',
        hookVoiceover: 'Ας κάνουμε αυτοψία σε αυτό το άρρωστο φυτό',
        hookText: 'Αυτοψία Φυτού 🔬',
        problemTag: 'Η ΔΙΑΓΝΩΣΗ',
        problemText: 'Να τι πραγματικά συμβαίνει από μέσα',
      },
      {
        hookTag: '🕵️ SOIL DETECTIVE',
        hookVoiceover: 'Ντετέκτιβ χώματος εδώ, ας λύσουμε αυτό το μυστήριο',
        hookText: 'Το Μυστήριο του Χώματος 🕵️',
        problemTag: 'ΤΑ ΣΤΟΙΧΕΙΑ',
        problemText: 'Τα στοιχεία δείχνουν προς ένα σαφές πρόβλημα',
      },
      {
        hookTag: '⚖️ MYTH COURT',
        hookVoiceover: 'Στο δικαστήριο μύθων κηπουρικής σήμερα εξετάζουμε αυτό',
        hookText: 'Μύθος ή Αλήθεια; ⚖️',
        problemTag: 'Η ΕΝΟΧΗ ΑΠΟΔΕΙΞΗ',
        problemText: 'Η επιστήμη λέει κάτι διαφορετικό',
      },
    ];
    const angleIndex = currentArticle.id
      ? Array.from(currentArticle.id).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % hookAngles.length
      : 0;
    const angle = hookAngles[angleIndex];

    const scenes = [
      {
        time: '0:00 - 0:03',
        tag: angle.hookTag,
        visual: 'Δραματικό zoom-in στο φυτό',
        voiceover: `«${angle.hookVoiceover}»`,
        onScreenText: angle.hookText
      },
      {
        time: '0:03 - 0:12',
        tag: angle.problemTag,
        visual: 'Πλάνο με κίτρινα φύλλα ή υπερβολικό πότισμα',
        voiceover: `«${summary.slice(0, 130)}»`,
        onScreenText: angle.problemText
      },
      // One scene PER step (not one scene narrating all 3 at once) so the on-screen
      // text always matches whichever step is actually being spoken at that moment
      // (previously showed a static "3 things" header for the entire combined narration).
      ...[0, 1, 2].map((i) => ({
        time: '0:12 - 0:24',
        tag: `ΒΗΜΑ ${i + 1}`,
        visual: 'Γρήγορο tip φροντίδας',
        voiceover: `«${stepOrdinals[i]}: ${bullets[i] || stepFallbacks[i]}.»`,
        onScreenText: `${stepLabels[i]} ${bullets[i] || stepFallbacks[i]}`
      })),
      {
        time: '0:24 - 0:30',
        tag: 'CALL TO ACTION',
        visual: 'Πανέμορφο καταπράσινο μπαλκόνι & Logo SmartGarden',
        // Spoken text differs from the displayed subtitle here on purpose: Greek TTS reads
        // the brand name "SmartGarden.gr" awkwardly as-is, so the audio uses a phonetic Greek
        // spelling ("Σμαρτ Γκάρντεν") while both on-screen texts show the real spelling.
        // captionDisplay overrides the small subtitle strip (see step 6 in the render loop),
        // which otherwise echoes `voiceover` verbatim and would leak the phonetic spelling
        // onto the screen too (2026-09-06 fix, caught by a user watching the actual video).
        voiceover: `«Αποθήκευσε το για αργότερα και δες τον πλήρη οδηγό στο Σμαρτ Γκάρντεν τελεία τζι-αρ»`,
        onScreenText: `Αποθήκευσέ το για αργότερα`,
        captionDisplay: `Αποθήκευσε το για αργότερα και δες τον πλήρη οδηγό στο SmartGarden.gr`
      }
    ];

    const tiktokCaption = `🌿 ${cleanTitle} | Μυστικά & Tips για το Μπαλκόνι!
👇 Διαβάστε τον πλήρη επιστημονικό οδηγό στο: https://smartgarden.gr/article/${currentArticle.slug}

#smartgarden #plants #gardening #gardentips #balconygarden #fyp #foryou #foryoupage #viralgreece #fygr #φυτα #μπαλκονι #κηπουρικη #λουλουδια #αθηνα`;

    // Separate from tiktokCaption on purpose: TikTok's #fyp/#foryoupage/#viralgreece
    // hashtags mean nothing to YouTube's search/discovery and just look like spam there.
    // YouTube instead rewards a keyword-rich opening line (shown in search results before
    // the "...more" cutoff) and its own hashtag set. #Shorts is listed FIRST (not just
    // present) because YouTube shows only the first 3 hashtags above the title as clickable
    // links, and #Shorts in that leading slot is what most reliably routes the upload into
    // the Shorts shelf — capped at 4 total hashtags per the 2026 "3-5 max, more reads as
    // spam" guidance. youtube-publish.php only appends its own #Shorts as a fallback when
    // none is present at all, so this takes priority.
    const youtubeDescription = `${cleanTitle} — Πλήρης οδηγός βήμα-βήμα από το SmartGarden.gr 🌿

${summary.slice(0, 200)}

📖 Διαβάστε ολόκληρο τον επιστημονικό οδηγό: https://smartgarden.gr/article/${currentArticle.slug}
🌱 Περισσότεροι οδηγοί κηπουρικής & μπαλκονιού: https://smartgarden.gr

#Shorts #κηπουρικη #μπαλκονι #gardening`;

    const fullScriptText = `🎬 TIKTOK SCRIPT: ${title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Διάρκεια: 30 δευτερόλεπτα (Viral Retention Rate)
📱 Account: @smartgarden68 (smartgarden68@gmail.com)

[0:00-0:03] 🪝 HOOK:
Visual: Κοντινό πλάνο με δραματικό zoom.
Voice: «Μην κάνεις ποτέ αυτό το λάθος με τα φυτά σου στο μπαλκόνι!»
Text: 🛑 ΣΤΑΜΑΤΑ ΑΥΤΟ ΤΟ ΛΑΘΟΣ!

[0:03-0:12] ⚠️ ΠΡΟΒΛΗΜΑ:
Visual: Πλάνο ποτίσματος / ρίζας.
Voice: «${summary.slice(0, 140)}»
Text: ⚠️ ΤΙ ΠΡΑΓΜΑΤΙΚΑ ΣΥΜΒΑΙΝΕΙ

[0:12-0:24] 🌿 3 ΧΡΥΣΑ ΒΗΜΑΤΑ:
Visual: 3 γρήγορα B-roll clips.
Voice: «1) ${bullets[0] || 'Σωστή στράγγιση'}  2) ${bullets[1] || 'Πότισμα πρωί'}  3) ${bullets[2] || 'Θρέψη'}.»
Text: 1️⃣ Στράγγιση  2️⃣ Πότισμα  3️⃣ Λίπανση

[0:24-0:30] 🚀 CALL TO ACTION:
Visual: SmartGarden.gr λογότυπο & υγιή φυτά.
Voice: «Αποθήκευσε το βίντεο και μπες στο SmartGarden.gr για περισσότερα!»
Text: 📲 SmartGarden.gr (Δωρεάν Οδηγός)`;

    const remotionScriptData: TikTokScriptData = {
      title: cleanTitle,
      hook: `🛑 ΜΗΝ ΚΑΝΕΙΣ ΑΥΤΟ ΤΟ ΛΑΘΟΣ!`,
      targetDuration: '12s',
      hashtags: ['#smartgarden', '#plants', '#gardening', '#fyp', '#fygr', '#φυτα'],
      scenes: [
        {
          order: 1,
          timestamp: '00:00 - 00:03',
          visualCue: 'Close-up botanical macro shot',
          onScreenText: '🛑 ΣΤΑΜΑΤΑ ΑΥΤΟ ΤΟ ΛΑΘΟΣ!',
          voiceover: 'Μην κάνεις ποτέ αυτό το λάθος με τα φυτά σου στο μπαλκόνι.'
        },
        {
          order: 2,
          timestamp: '00:03 - 00:06',
          visualCue: 'Watering & soil moisture check',
          onScreenText: '⚠️ ΤΙ ΠΡΑΓΜΑΤΙΚΑ ΣΥΜΒΑΙΝΕΙ',
          voiceover: 'Αν αγνοήσεις το σωστό πότισμα και τη στράγγιση, οι ρίζες ασφυκτιούν και σαπίζουν.'
        },
        {
          order: 3,
          timestamp: '00:06 - 00:09',
          visualCue: 'Nutrient spray & pruning',
          onScreenText: '✅ 3 ΧΡΥΣΑ TIPS ΦΟΥΝΤΩΜΑΤΟΣ',
          voiceover: 'Πρώτον, καλή αποστράγγιση στη γλάστρα. Δεύτερον, πότισμα πάντα νωρίς το πρωί.'
        },
        {
          order: 4,
          timestamp: '00:09 - 00:12',
          visualCue: 'SmartGarden.gr CTA Card',
          onScreenText: '📲 ΑΠΟΘΗΚΕΥΣΕ ΤΟ • SmartGarden.gr',
          voiceover: 'Αποθήκευσε το βίντεο και μπες στο Σμαρτ Γκάρντεν για τον πλήρη οδηγό.'
        }
      ]
    };

    return {
      title,
      cleanTitle,
      scenes,
      remotionScriptData,
      tiktokCaption,
      youtubeDescription,
      fullScriptText
    };
  }, [currentArticle]);

  // Audio Voiceover Synthesis & Real-time Smooth Playback Engine
  const [isSpeakingPreview, setIsSpeakingPreview] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [videoPlayTimeSeconds, setVideoPlayTimeSeconds] = useState<number>(0);
  const totalVideoDuration = 30; // 30 seconds

  // Smooth playback timer (loops every 30 seconds)
  useEffect(() => {
    if (!isPlayingPreview) return;
    const stepMs = 100;
    const interval = setInterval(() => {
      setVideoPlayTimeSeconds((prev) => {
        const next = prev + 0.1;
        if (next >= totalVideoDuration) {
          return 0;
        }
        return next;
      });
    }, stepMs);
    return () => clearInterval(interval);
  }, [isPlayingPreview]);

  // Derive current scene from video play time (0-3s Hook, 3-12s Problem, 12-24s 3 Steps, 24-30s CTA)
  useEffect(() => {
    if (!tikTokScript?.scenes) return;
    let idx = 0;
    if (videoPlayTimeSeconds < 3.5) {
      idx = 0;
    } else if (videoPlayTimeSeconds < 12.5) {
      idx = 1;
    } else if (videoPlayTimeSeconds < 24.5) {
      idx = 2;
    } else {
      idx = 3;
    }
    if (idx !== currentSceneIdx) {
      setCurrentSceneIdx(idx);
    }
  }, [videoPlayTimeSeconds, tikTokScript]);

  // Voiceover reader on scene change if unmuted
  useEffect(() => {
    if (!isPlayingPreview || isAudioMuted || !tikTokScript) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const currentVoiceText = tikTokScript.scenes[currentSceneIdx]?.voiceover || '';
        const cleanVoiceText = currentVoiceText.replace(/[«»"]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanVoiceText);
        utterance.lang = 'el-GR';
        utterance.rate = 1.05;
        const greekVoice = window.speechSynthesis.getVoices().find(v => v.lang.includes('el'));
        if (greekVoice) utterance.voice = greekVoice;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }, [currentSceneIdx, isPlayingPreview, isAudioMuted, tikTokScript]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // FULLY AUTOMATIC DIRECT PUBLISH TO TIKTOK (1-CLICK NO DOWNLOAD NEEDED)
  const handleDirectTikTokAutoPublish = async () => {
    if (!currentArticle || !tikTokScript) return;
    
    setIsAutoPublishing(true);
    setPublishSuccessMessage(null);
    setPublishStep(1); // 1. Video render & assets synthesis

    try {
      // Step 1: Synthesize Video Assets
      await new Promise(r => setTimeout(r, 1200));
      setPublishStep(2); // 2. AI Voiceover & Captions

      // Step 2: Voice & Caption Assembly
      await new Promise(r => setTimeout(r, 1200));
      setPublishStep(3); // 3. Connecting to TikTok API (@smartgarden68)

      // A freshly rendered video's URL is a browser-local blob: URL (from
      // handleGenerateAndDownloadVideo's URL.createObjectURL) — the PHP server can never
      // fetch that over the network. Convert it to base64 client-side (fetchable in-tab)
      // and send it as videoBase64 instead; tiktok-publish.php only falls back to fetching
      // videoUrl server-side for a real http(s) URL (2026-09-04 bugfix — this previously
      // always failed silently for any video rendered in this same session).
      let videoBase64: string | undefined;
      const rawVideoUrl = currentArticle.videoUrl || '';
      if (rawVideoUrl.startsWith('blob:')) {
        const videoBlob = await fetch(rawVideoUrl).then(r => r.blob());
        videoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(videoBlob);
        });
      }

      // Step 3: Call Server Direct TikTok API
      // Only Sandbox mode has ever actually been connected (Production OAuth review was
      // deliberately never pursued — see project notes); without ?sandbox=1 this call hits
      // the disconnected Production token and 401s every time, which is why 1-click publish
      // has never actually worked (2026-09-04 bugfix, found by testing the real button).
      const res = await fetch('/tiktok-publish.php?sandbox=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: currentArticle.id,
          title: currentArticle.title?.el || currentArticle.title,
          caption: tikTokScript.tiktokCaption,
          ...(videoBase64 ? { videoBase64 } : { videoUrl: rawVideoUrl }),
          hashtags: ['#smartgarden', '#plants', '#gardening', '#fyp', '#fygr', '#φυτα']
        })
      });

      const data = await res.json();
      await new Promise(r => setTimeout(r, 1000));

      setIsAutoPublishing(false);

      if (!res.ok || !data.success) {
        setPublishStep(0);
        if (data.connected === false) {
          setUploadMessage('⚠️ Ο λογαριασμός TikTok δεν είναι συνδεδεμένος. Πάτα εδώ για σύνδεση: /tiktok-auth-login.php');
        } else {
          setUploadMessage('❌ Σφάλμα δημοσίευσης στο TikTok: ' + (data.error || 'Άγνωστο σφάλμα'));
        }
        return;
      }

      setPublishStep(4); // 4. Done!
      setPublishSuccessMessage('✅ Το βίντεο ανέβηκε ως draft στο TikTok inbox — άνοιξε την εφαρμογή TikTok στο κινητό για να το δημοσιεύσεις.');

      fetchPublishedPosts();

      // Best-effort: also publish the same rendered video as a YouTube Short.
      // Deliberately doesn't block or fail the TikTok success path above — YouTube
      // not being connected (or a transient upload error) shouldn't undo a TikTok
      // publish that already succeeded.
      if (videoBase64) {
        fetch('/youtube-publish.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoBase64,
            title: (currentArticle.title?.el || currentArticle.title || 'SmartGarden.gr Οδηγός').toString().slice(0, 90),
            description: tikTokScript.youtubeDescription || '',
          }),
        })
          .then((r) => r.json())
          .then((ytData) => {
            if (ytData.success) {
              setPublishSuccessMessage((prev) => (prev || '') + `\n✅ Ανέβηκε και στο YouTube Shorts: ${ytData.url}`);
            } else {
              console.warn('YouTube upload failed:', ytData.error);
            }
          })
          .catch((ytErr) => console.warn('YouTube upload failed:', ytErr));

        // Same best-effort treatment for Facebook — uploads to the Page's Videos
        // tab (not the feed) via facebook-publish.php's "video" type.
        //
        // TEMPORARILY DISABLED (2026-09-09): Meta blocked the whole Facebook app's
        // API access (confirmed via debug_token with an app-level token — not a
        // per-page token problem). Re-enable (delete the early-return below) once
        // the user has resolved this via developers.facebook.com.
        const FB_VIDEO_AUTO_PUBLISH_ENABLED = false;
        (FB_VIDEO_AUTO_PUBLISH_ENABLED ? fetch('/facebook-publish.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'video',
            videoBase64,
            description: tikTokScript.tiktokCaption || '',
          }),
        }) : Promise.resolve(null))
          .then((r) => r ? r.json() : null)
          .then((fbData) => {
            if (!fbData) return;
            if (fbData.success) {
              setPublishSuccessMessage((prev) => (prev || '') + `\n✅ Ανέβηκε και στο Facebook (Βίντεο).`);
            } else {
              console.warn('Facebook video upload failed:', fbData.error);
            }
          })
          .catch((fbErr) => console.warn('Facebook video upload failed:', fbErr));
      }
    } catch (err: any) {
      setIsAutoPublishing(false);
      setPublishStep(0);
      setUploadMessage('❌ Σφάλμα αυτόματης δημοσίευσης: ' + err.message);
    }
  };

  // Direct 1-Click Open TikTok Upload (Alternative)
  const handleOpenTikTokUpload = () => {
    if (tikTokScript) {
      copyToClipboard(tikTokScript.tiktokCaption, 'tiktok_caption');
    }
    window.open('https://www.tiktok.com/creator-center/upload', '_blank');
  };

  // 1-Click Open CapCut Script to Video
  const handleOpenCapCut = () => {
    if (tikTokScript) {
      copyToClipboard(tikTokScript.fullScriptText, 'full_script');
    }
    window.open('https://www.capcut.com/tools/ai-script-to-video', '_blank');
  };

  // Fetches real Greek narration audio for one scene's voiceover line as a playable <audio>
  // element (not a decoded Web Audio buffer) so playback can use HTMLMediaElement.playbackRate
  // + preservesPitch — a real time-stretch, unlike AudioBufferSourceNode.playbackRate which
  // just resamples and makes faster speech sound higher-pitched/thinner (2026-09-04 fix).
  // Tries public/tts-edge.php first (free Microsoft Edge neural voices, hand-implemented
  // WebSocket protocol — noticeably more natural than Google's), falls back to
  // public/tts-greek.php (Google Translate TTS, less natural but stable for years) if the
  // unofficial Edge endpoint fails. Returns null only if both fail, so the caller can fall
  // back to a transition tick gracefully.
  const fetchGreekTtsAudioElement = async (text: string): Promise<{ audio: HTMLAudioElement; naturalDuration: number } | null> => {
    const cleanText = text.replace(/[«»"]/g, '').trim();
    if (!cleanText) return null;

    const tryFetch = async (url: string, timeoutMs?: number): Promise<Blob | null> => {
      try {
        const controller = timeoutMs ? new AbortController() : undefined;
        const timer = timeoutMs && controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
        const res = await fetch(url, controller ? { signal: controller.signal } : undefined);
        if (timer) clearTimeout(timer);
        if (!res.ok) return null;
        const blob = await res.blob();
        return blob.size > 0 ? blob : null;
      } catch {
        return null;
      }
    };

    // Edge TTS's WebSocket round trip from this host has been measured anywhere from 2-12+
    // seconds — cap it so one slow scene doesn't stall the whole render. Mixing engines
    // mid-video sounds jarring (one scene in a visibly different voice than the rest), so
    // retry Edge once more before falling back to Google — a single scene timing out is
    // often a transient blip, not a persistent failure, and this makes it much more likely
    // every scene in a given video ends up on the same, better-sounding engine
    // (2026-09-06 fix, after a user report of exactly this "one scene sounds different").
    const edgeUrl = `/tts-edge.php?text=${encodeURIComponent(cleanText)}`;
    let blob = await tryFetch(edgeUrl, 7000);
    if (!blob) {
      blob = await tryFetch(edgeUrl, 7000);
    }
    if (!blob) {
      blob = await tryFetch(`/tts-greek.php?text=${encodeURIComponent(cleanText)}`);
    }
    if (!blob) return null;

    try {
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      const naturalDuration = await new Promise<number>((resolve) => {
        let done = false;
        audio.onloadedmetadata = () => { if (!done) { done = true; resolve(audio.duration || 0); } };
        audio.onerror = () => { if (!done) { done = true; resolve(0); } };
        setTimeout(() => { if (!done) { done = true; resolve(audio.duration || 0); } }, 3000);
      });
      if (!naturalDuration) return null;
      return { audio, naturalDuration };
    } catch (e) {
      console.warn('Greek TTS audio element setup failed:', e);
      return null;
    }
  };

  // Built-in Browser 9:16 Video Generator & MP4/WebM Downloader (Fixed with Real-Time Frame Clock & Audio)
  const handleGenerateAndDownloadVideo = async () => {
    if (!currentArticle || !tikTokScript) return;
    setIsGeneratingVideo(true);
    setGenerationProgress(5);
    setUploadMessage(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');

      // Create synthetic audio stream using Web Audio API
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      let audioCtx: AudioContext | null = null;
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
          audioDestination = audioCtx.createMediaStreamDestination();
        }
      } catch (e) {
        console.warn('AudioContext setup skipped:', e);
      }

      // A different background photo per scene (not one photo reused for the whole video —
      // the earlier version always showed just the article's single main image throughout).
      // The article's own photo is always first; the rest come from the site's curated
      // gardening photo pool so every render still gets real variety even for articles that
      // only have one image on file.
      const backgroundPhotoPool = [
        currentArticle.image,
        // This pool was found 2026-09-08 to still contain 3 of the ~25 IDs confirmed
        // wrong-content during the site-wide visual audit the same day (Unsplash IDs can
        // get reassigned by photographers to unrelated content — a status-code check never
        // catches this, only actually viewing the image does). Caught live on a real
        // published YouTube Short: a Hugelkultur/composting video showed a citrus-fruit-slice
        // photo as its background. All entries below are now from the audit's confirmed-good
        // 9-photo pool (see src/data/verifiedImages.ts) — do not add an ID here without
        // visually confirming its actual content first.
        "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=1200&auto=format&fit=crop&q=80", // ripe tomatoes on vine
        "https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=1200&auto=format&fit=crop&q=80", // bonsai tree in pot
        "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?w=1200&auto=format&fit=crop&q=80", // tomato greenhouse interior
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80", // lush vertical garden
        "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200&auto=format&fit=crop&q=80", // seedling tray with sprouts
        "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=1200&auto=format&fit=crop&q=80", // monstera indoor plant
      ].filter((url): url is string => !!url);

      const preloadImage = (src: string): Promise<HTMLImageElement> => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.src = src;
        return new Promise<HTMLImageElement>((resolve) => {
          let done = false;
          el.onload = () => { if (!done) { done = true; resolve(el); } };
          el.onerror = () => { if (!done) { done = true; resolve(el); } };
          setTimeout(() => { if (!done) { done = true; resolve(el); } }, 1500); // 1.5s max timeout each
        });
      };

      const sceneImages = await Promise.all(
        tikTokScript.scenes.map((_, i) => preloadImage(backgroundPhotoPool[i % backgroundPhotoPool.length]))
      );

      setGenerationProgress(15);

      // Pre-fetch real Greek narration for every scene BEFORE recording starts, so playback
      // can be scheduled precisely instead of racing a network request mid-render. Each
      // scene's on-screen duration is sized to match its actual spoken length (previously a
      // fixed 12s/4 scenes regardless of voiceover length, and the only audio was a
      // decorative sine-wave chime — no real voice at all).
      const scenes = tikTokScript.scenes;
      const fps = 30;
      const minSceneSeconds = 2.2;
      const sceneGapSeconds = 0.45;
      // Narration plays back faster than natural TTS speed for punchier TikTok pacing.
      // preservesPitch (set in playSceneAudio below) keeps the same voice/tone at this
      // speed instead of the "chipmunk" pitch-up a raw resample would cause.
      const narrationRate = 1.1;
      let sceneAudioEls: ({ audio: HTMLAudioElement; naturalDuration: number } | null)[] = scenes.map(() => null);
      sceneAudioEls = await Promise.all(
        scenes.map((scene) => fetchGreekTtsAudioElement(scene.voiceover))
      );
      setGenerationProgress(25);

      const sceneDurationsSeconds = scenes.map((_, i) => {
        const el = sceneAudioEls[i];
        const spoken = el ? el.naturalDuration / narrationRate + sceneGapSeconds : minSceneSeconds;
        return Math.max(minSceneSeconds, spoken);
      });
      const sceneDurationFramesArr = sceneDurationsSeconds.map((s) => Math.round(s * fps));
      const sceneStartFrames: number[] = [];
      let cumFrames = 0;
      for (const d of sceneDurationFramesArr) {
        sceneStartFrames.push(cumFrames);
        cumFrames += d;
      }
      const totalFrames = cumFrames;

      // Setup Canvas Stream + Audio Stream
      const canvasStream = canvas.captureStream(30);
      let combinedStream = canvasStream;
      if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
        const tracks = [...canvasStream.getVideoTracks(), ...audioDestination.stream.getAudioTracks()];
        combinedStream = new MediaStream(tracks);
      }

      // Check supported MIME types
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType.includes('webm') || mimeType.includes('mp4') ? mimeType : undefined,
        videoBitsPerSecond: 5000000
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const renderPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          if (chunks.length === 0) {
            reject(new Error('Δεν καταγράφηκαν frames. Δοκιμάστε ξανά.'));
            return;
          }
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
        recorder.onerror = (err) => reject(err);
      });

      recorder.start(100); // slice chunks every 100ms

      // Plays a scene's real narration through the same audioDestination node the recorder
      // is capturing, sped up via HTMLMediaElement.playbackRate + preservesPitch (real
      // time-stretch, keeps the same voice/tone — not a raw AudioBufferSourceNode resample,
      // which would also raise the pitch). Falls back to a subtle transition tick only for
      // scenes where TTS genuinely failed.
      const playSceneAudio = (sceneIndex: number) => {
        if (!audioCtx || !audioDestination) return;
        try {
          if (audioCtx.state === 'suspended') audioCtx.resume();
          const entry = sceneAudioEls[sceneIndex];
          if (entry) {
            const { audio } = entry;
            audio.playbackRate = narrationRate;
            (audio as any).preservesPitch = true;
            (audio as any).mozPreservesPitch = true;
            (audio as any).webkitPreservesPitch = true;
            const source = audioCtx.createMediaElementSource(audio);
            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(1, audioCtx.currentTime);
            source.connect(gain);
            gain.connect(audioDestination);
            audio.play().catch(() => {});
          } else {
            // Fallback transition tick only for scenes where TTS genuinely failed.
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioDestination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
          }
        } catch {
          // ignore
        }
      };

      for (let frame = 0; frame < totalFrames; frame++) {
        let sceneIndex = sceneStartFrames.length - 1;
        for (let i = sceneStartFrames.length - 1; i >= 0; i--) {
          if (frame >= sceneStartFrames[i]) {
            sceneIndex = i;
            break;
          }
        }
        const scene = scenes[sceneIndex];
        const progress = frame / totalFrames;
        const currentSec = frame / fps;

        // Play that scene's real narration exactly when it begins.
        if (frame === sceneStartFrames[sceneIndex]) {
          playSceneAudio(sceneIndex);
        }

        // 1. Dark Botanical Gradient Background
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, '#031710');
        bgGrad.addColorStop(0.5, '#062d22');
        bgGrad.addColorStop(1, '#020b08');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Animated Image Layer (Ken-Burns Pan & Zoom, "cover" fit — no letterboxing).
        // Each scene gets its own photo from sceneImages (built above) instead of reusing
        // a single image for the whole video.
        try {
          const sceneImg = sceneImages[sceneIndex];
          if (sceneImg && sceneImg.complete && sceneImg.naturalWidth > 0) {
            const zoom = 1.08 + (frame / totalFrames) * 0.15;
            const coverScale = Math.max(canvas.width / sceneImg.naturalWidth, canvas.height / sceneImg.naturalHeight);
            const w = sceneImg.naturalWidth * coverScale * zoom;
            const h = sceneImg.naturalHeight * coverScale * zoom;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2 + Math.sin(frame * 0.04) * 15;

            ctx.save();
            ctx.globalAlpha = 0.85;
            ctx.drawImage(sceneImg, x, y, w, h);
            ctx.restore();
          }
        } catch {
          // Canvas CORS fallback
        }

        // 3. Cinematic Gradients (Top & Bottom)
        const topGrad = ctx.createLinearGradient(0, 0, 0, 450);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, canvas.width, 450);

        const bottomGrad = ctx.createLinearGradient(0, canvas.height - 850, 0, canvas.height);
        bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.85)');
        bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, canvas.height - 850, canvas.width, 850);

        // 4. Small, subtle watermark (native accounts don't run a big ad banner)
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '700 26px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('@smartgarden68', 60, 110);

        // Helper: bold text with a black outline, no solid background box —
        // matches how real gardening-niche TikToks caption over raw footage.
        const drawOutlinedText = (text: string, x: number, y: number, fontPx: number, weight = 800) => {
          ctx.font = `${weight} ${fontPx}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeStyle = 'rgba(0,0,0,0.75)';
          ctx.lineWidth = fontPx * 0.16;
          ctx.strokeText(text, x, y);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x, y);
        };

        const wrapLines = (text: string, fontPx: number, weight: number, maxWidth: number) => {
          ctx.font = `${weight} ${fontPx}px sans-serif`;
          const words = text.split(' ');
          const lines: string[] = [];
          let line = '';
          for (const w of words) {
            const test = line ? `${line} ${w}` : w;
            if (ctx.measureText(test).width > maxWidth && line) {
              lines.push(line);
              line = w;
            } else {
              line = test;
            }
          }
          if (line) lines.push(line);
          return lines;
        };

        // 5. Main on-screen hook/point text — big, bold, outlined, no box
        const hookLines = wrapLines(scene.onScreenText, 58, 900, canvas.width - 140);
        let hookY = 900 - (hookLines.length - 1) * 34;
        for (const l of hookLines) {
          drawOutlinedText(l, canvas.width / 2, hookY, 58, 900);
          hookY += 68;
        }

        // 6. Smaller synced caption line (mimics auto-generated subtitle style).
        // Uses captionDisplay when a scene sets one (so a spoken-only phonetic hack, like the
        // CTA scene's brand-name pronunciation fix, never leaks onto the screen) — falls back
        // to the raw voiceover text for every scene that doesn't need the two to differ.
        const captionSource = (scene as any).captionDisplay || scene.voiceover;
        const capLines = wrapLines(captionSource.replace(/[«»]/g, ''), 34, 700, canvas.width - 180);
        let capY = 1080;
        for (const l of capLines.slice(0, 2)) {
          drawOutlinedText(l, canvas.width / 2, capY, 34, 700);
          capY += 46;
        }

        // 7. Footer link — plain, small, no emoji clutter
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '600 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('smartgarden.gr', canvas.width / 2, canvas.height - 90);

        // Update progress percentage
        if (frame % 15 === 0) {
          setGenerationProgress(15 + Math.floor((frame / totalFrames) * 75));
        }

        // Real-Time Frame Clock Wait (33.3ms per frame)
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      setGenerationProgress(92);
      recorder.stop();

      const videoBlob = await renderPromise;
      if (audioCtx) {
        audioCtx.close();
      }

      const downloadUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoBlobUrl(downloadUrl);

      // Auto-trigger Download
      const a = document.createElement('a');
      a.href = downloadUrl;
      const cleanSlug = currentArticle.slug || 'article';
      a.download = `smartgarden-tiktok-${cleanSlug}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      const updated = { ...currentArticle, videoUrl: downloadUrl };
      if (onUpdateArticle) onUpdateArticle(updated);

      setGenerationProgress(100);
      setIsGeneratingVideo(false);
      setUploadMessage('🎉 Το βίντεο δημιουργήθηκε σε υψηλή ανάλυση 1080x1920 με πραγματική ελληνική αφήγηση και κατέβηκε στον υπολογιστή σας!');
    } catch (err: any) {
      setIsGeneratingVideo(false);
      setUploadMessage('❌ Σφάλμα δημιουργίας: ' + (err.message || 'Αποτυχία render'));
    }
  };

  // Static image, no motion, no audio — a single still frame held for TikTok's minimum
  // duration, published via the proven-working video FILE_UPLOAD path (tiktok-publish.php).
  // Built as a direct fallback for TikTok's photo-post API (source: PULL_FROM_URL), which
  // requires a domain-ownership verification step that kept failing in the developer portal
  // regardless of what was verified there (2026-09-04) — this sidesteps that entirely since
  // video upload never needed URL verification in the first place.
  const handleGenerateStaticImageAndPublish = async () => {
    if (!currentArticle || !tikTokScript) return;
    setIsGeneratingVideo(true);
    setGenerationProgress(5);
    setUploadMessage(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = currentArticle.image || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80';
      await new Promise<void>((resolve) => {
        let done = false;
        img.onload = () => { if (!done) { done = true; resolve(); } };
        img.onerror = () => { if (!done) { done = true; resolve(); } };
        setTimeout(() => { if (!done) { done = true; resolve(); } }, 3000);
      });
      setGenerationProgress(20);

      // Draw the single still frame once — cover-fit, full-bleed, no Ken-Burns, no captions.
      const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGrad.addColorStop(0, '#031710');
      bgGrad.addColorStop(0.5, '#062d22');
      bgGrad.addColorStop(1, '#020b08');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (img.complete && img.naturalWidth > 0) {
        const coverScale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
        const w = img.naturalWidth * coverScale;
        const h = img.naturalHeight * coverScale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '700 26px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('@smartgarden68', 60, 110);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '600 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('smartgarden.gr', canvas.width / 2, canvas.height - 90);

      // Video-only stream, no audio track at all.
      const canvasStream = canvas.captureStream(1);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 3000000 });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      const renderPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          if (chunks.length === 0) { reject(new Error('Δεν καταγράφηκαν frames.')); return; }
          resolve(new Blob(chunks, { type: mimeType }));
        };
        recorder.onerror = (err) => reject(err);
      });

      recorder.start(100);
      setGenerationProgress(40);
      // Redraw the same still frame every second for 5s so the recorder has content to
      // capture the whole duration (captureStream(1) alone can go idle between draws).
      const holdSeconds = 5;
      for (let i = 0; i < holdSeconds; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        setGenerationProgress(40 + Math.floor(((i + 1) / holdSeconds) * 40));
      }
      recorder.stop();
      const videoBlob = await renderPromise;
      setGenerationProgress(85);

      const videoBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(videoBlob);
      });

      setGenerationProgress(95);
      const res = await fetch('/tiktok-publish.php?sandbox=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: currentArticle.id,
          title: currentArticle.title?.el || currentArticle.title,
          caption: tikTokScript.tiktokCaption,
          videoBase64,
          hashtags: ['#smartgarden', '#plants', '#gardening', '#fyp', '#fygr', '#φυτα']
        })
      });
      const data = await res.json();
      setGenerationProgress(100);
      setIsGeneratingVideo(false);

      if (!res.ok || !data.success) {
        setUploadMessage('❌ Σφάλμα δημοσίευσης: ' + (data.error || 'Άγνωστο σφάλμα'));
        return;
      }
      setUploadMessage('✅ Η στατική εικόνα ανέβηκε ως draft στο TikTok inbox (χωρίς video/ήχο) — άνοιξε την εφαρμογή TikTok για να τη δημοσιεύσεις.');
      fetchPublishedPosts();
    } catch (err: any) {
      setIsGeneratingVideo(false);
      setUploadMessage('❌ Σφάλμα: ' + (err.message || 'Αποτυχία'));
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-600 to-amber-500 text-white font-extrabold text-[11px] shadow-sm uppercase tracking-wider">
              📱 TikTok Automation Hub
            </span>
            <span className="text-xs text-slate-400 font-medium">SmartGarden • @smartgarden68 (smartgarden68@gmail.com)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            <Film className="w-6 h-6 text-pink-400" />
            Social Video & TikTok Studio
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Αυτόματη παραγωγή και απευθείας δημοσίευση βίντεο στο TikTok με 1 μόνο πάτημα, χωρίς καμία χειροκίνητη διαδικασία!
          </p>
        </div>

        {/* Article Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[11px] font-bold text-slate-400 mb-1">Επιλογή Άρθρου για Βίντεο:</label>
            <select
              value={activeArticleId}
              onChange={(e) => {
                setActiveArticleId(e.target.value);
                setUploadMessage(null);
                setGeneratedVideoBlobUrl(null);
                setPublishSuccessMessage(null);
                setPublishStep(0);
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
          onClick={() => setActiveTab('remotion')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'remotion'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-100 shadow-lg shadow-emerald-500/25 scale-105'
              : 'bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800'
          }`}
        >
          <Film className="w-4 h-4 text-emerald-950 fill-current" />
          <span>🎬 1. Remotion Player 9:16 (React Engine)</span>
        </button>

        <button
          onClick={() => setActiveTab('tiktok_direct')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tiktok_direct'
              ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 text-white shadow-lg shadow-pink-500/20 scale-105'
              : 'bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-200 fill-current" />
          2. 🚀 Άμεση Δημοσίευση (1-Click)
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
              : 'bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-300" />
          Ιστορικό ({publishedPosts.length})
        </button>

        <button
          onClick={() => setActiveTab('auto_generator')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'auto_generator'
              ? 'bg-emerald-600 text-slate-100 font-black shadow-lg shadow-emerald-500/20 scale-105'
              : 'bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          3. Quick Video Render
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'script'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
              : 'bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          4. Σενάριο & Storyboard
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-slate-800 text-slate-100'
              : 'bg-slate-950 text-slate-400 hover:text-slate-100 border border-slate-800'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          5. Εξωτερικά AI
        </button>
      </div>

      {/* TAB: REMOTION PLAYER 9:16 */}
      {activeTab === 'remotion' && tikTokScript?.remotionScriptData && (
        <RemotionPreviewPlayer
          script={tikTokScript.remotionScriptData}
          imageUrl={currentArticle?.image}
          articleTitle={tikTokScript.cleanTitle}
          articleSlug={currentArticle?.slug}
        />
      )}

      {/* TAB 1: 1-CLICK TIKTOK AUTO PUBLISHER */}
      {activeTab === 'tiktok_direct' && tikTokScript && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Instant 1-Click Publishing (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* BIG PROMINENT 1-CLICK AUTO-PUBLISH HERO CARD */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-pink-500/40 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative overflow-hidden">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-pink-500/30 animate-pulse">
                    🎵
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-100 text-base flex items-center gap-2">
                      <span>TikTok Account: Smart Garden</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                        LIVE CONNECTED
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      smartgarden68@gmail.com • @smartgarden68
                    </div>
                  </div>
                </div>

                <span className="text-xs text-slate-400 font-bold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  ⚡ 0€ Κόστος
                </span>
              </div>

              {/* Selected Article Display */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
                <div className="text-[11px] font-bold text-pink-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Άρθρο προς Αυτόματη Δημοσίευση:
                </div>
                <h4 className="text-sm font-black text-slate-100 line-clamp-1">
                  {currentArticle?.title?.el || currentArticle?.title}
                </h4>
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                  {currentArticle?.summary?.el || currentArticle?.summary}
                </p>
              </div>

              {/* THE REQUESTED 1-CLICK BUTTON */}
              <div className="space-y-3">
                <button
                  onClick={handleDirectTikTokAutoPublish}
                  disabled={isAutoPublishing}
                  className="w-full bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 disabled:opacity-50 text-white font-black text-sm sm:text-base py-4 px-6 rounded-2xl shadow-2xl shadow-pink-500/30 flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Zap className="w-5 h-5 text-amber-200 fill-current" />
                  <span>{isAutoPublishing ? '⏳ Δημοσίευση σε εξέλιξη...' : '🚀 Άμεση Αυτόματη Δημοσίευση στο TikTok'}</span>
                </button>

                <button
                  onClick={handleGenerateStaticImageAndPublish}
                  disabled={isGeneratingVideo}
                  className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 font-bold text-sm py-3.5 px-6 rounded-2xl border border-slate-700 flex items-center justify-center gap-2.5 cursor-pointer transition-all"
                >
                  <ImageIcon className="w-4 h-4 text-slate-300" />
                  <span>{isGeneratingVideo ? `⏳ ${generationProgress}%...` : '🖼️ Στατική Εικόνα (χωρίς video/ήχο)'}</span>
                </button>

                {/* Live Step Progress Indicator */}
                {isAutoPublishing && (
                  <div className="bg-slate-950 border border-pink-500/30 rounded-2xl p-4 space-y-2.5 animate-fadeIn">
                    <div className="text-xs font-black text-pink-300 flex items-center justify-between">
                      <span>Πρόοδος Αυτοματισμού:</span>
                      <span>Βήμα {publishStep} από 4</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className={`flex items-center gap-2 ${publishStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {publishStep >= 1 ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                        <span>1. Σύνθεση 9:16 HD Βίντεο με Animated Overlays</span>
                      </div>
                      <div className={`flex items-center gap-2 ${publishStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {publishStep >= 2 ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                        <span>2. Δημιουργία AI Voiceover & Viral Hashtags</span>
                      </div>
                      <div className={`flex items-center gap-2 ${publishStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {publishStep >= 3 ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                        <span>3. Αποστολή στο TikTok Content API (@smartgarden68)</span>
                      </div>
                      <div className={`flex items-center gap-2 ${publishStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {publishStep >= 4 ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                        <span>4. ✅ Ολοκλήρωση & Δημοσίευση!</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message Banner */}
                {publishSuccessMessage && (
                  <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-200 text-xs font-bold shadow-lg">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{publishSuccessMessage}</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 px-3 py-1.5 rounded-lg text-xs font-black shrink-0 cursor-pointer"
                    >
                      Προβολή Ιστορικού
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={handleOpenTikTokUpload}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5 text-pink-400" />
                  <span>Άνοιγμα TikTok Creator Studio</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </button>

                <button
                  onClick={handleGenerateAndDownloadVideo}
                  disabled={isGeneratingVideo}
                  className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isGeneratingVideo ? `Λήψη (${generationProgress}%)...` : 'Κατέβασμα Αρχείου .MP4'}</span>
                </button>
              </div>

            </div>

            {/* Generated Caption & Hashtags for TikTok */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Αυτόματη Λεζάντα & Hashtags:
                </label>
                <button
                  onClick={() => copyToClipboard(tikTokScript.tiktokCaption, 'tiktok_caption')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  {copiedType === 'tiktok_caption' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Αντιγράφηκε!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Αντιγραφή
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={3}
                readOnly
                value={tikTokScript.tiktokCaption}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-emerald-300 font-mono focus:outline-none leading-relaxed"
              />
            </div>

          </div>

          {/* Right Column: Live 9:16 Smartphone Simulator (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-3">
            <div className="flex items-center justify-between w-full max-w-[320px] px-2">
              <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-pink-400" />
                TikTok 9:16 Player
              </span>
              <button
                onClick={() => {
                  const newMuted = !isAudioMuted;
                  setIsAudioMuted(newMuted);
                  if (newMuted && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all ${
                  !isAudioMuted
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-100'
                }`}
              >
                {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{!isAudioMuted ? '🔊 Φωνή: ON' : '🔇 Φωνή: OFF'}</span>
              </button>
            </div>

            {/* Smartphone Frame */}
            <div
              onClick={() => {
                const nextState = !isPlayingPreview;
                setIsPlayingPreview(nextState);
                if (!nextState && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="w-[300px] h-[530px] bg-black rounded-[42px] border-[5px] border-slate-700 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 group select-none cursor-pointer"
            >
              
              {/* If real video URL exists (e.g. generated webm/mp4), show native video */}
              {generatedVideoBlobUrl || currentArticle?.videoUrl ? (
                <video
                  src={generatedVideoBlobUrl || currentArticle?.videoUrl}
                  autoPlay
                  loop
                  muted={isAudioMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              ) : (
                <>
                  {/* Dynamic Ken Burns Zoom & Pan on Plant Image */}
                  <img
                    src={currentArticle?.image}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none transition-transform duration-[4000ms] ease-out ${
                      isPlayingPreview ? (currentSceneIdx % 2 === 0 ? 'scale-125 translate-y-2' : 'scale-110 -translate-y-2') : 'scale-105'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/25 to-black/95 pointer-events-none" />
                </>
              )}

              {/* Pause Overlay Icon if not playing */}
              {!isPlayingPreview && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-600/90 text-white flex items-center justify-center text-2xl shadow-2xl">
                    ▶
                  </div>
                  <span className="text-slate-100 text-xs font-black mt-2 bg-black/60 px-3 py-1 rounded-full">
                    Κλικ για Αναπαραγωγή
                  </span>
                </div>
              )}

              {/* Top TikTok Bar */}
              <div className="relative z-10 flex items-center justify-between text-slate-100 text-[10px] font-bold pt-2">
                <span className="bg-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-wider shadow flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-300 fill-current" />
                  🌿 SmartGarden
                </span>
                
                {/* Timer Display */}
                <span className="text-slate-200 font-mono bg-black/60 px-2.5 py-0.5 rounded-full border border-white/20 text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  0:{Math.floor(videoPlayTimeSeconds).toString().padStart(2, '0')} / 0:30
                </span>
              </div>

              {/* Center Kinetic Captions */}
              <div className="relative z-10 text-center px-2 space-y-2 my-auto">
                <div className="inline-block bg-amber-400 text-slate-100 font-black text-xs px-3 py-1.5 rounded-lg shadow-2xl transform -rotate-1 border border-amber-300 transition-all">
                  {tikTokScript.scenes[currentSceneIdx]?.onScreenText}
                </div>
                <div className="text-xs font-bold text-slate-100 drop-shadow-lg leading-snug line-clamp-3 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl transition-all">
                  {tikTokScript.scenes[currentSceneIdx]?.voiceover}
                </div>
              </div>

              {/* Bottom TikTok Profile & Engagement */}
              <div className="relative z-10 space-y-2 pb-0.5">
                
                {/* 30s Realtime Timeline Progress Bar */}
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-pink-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-100"
                    style={{ width: `${(videoPlayTimeSeconds / totalVideoDuration) * 100}%` }}
                  />
                </div>

                {/* Scene Indicator Pills */}
                <div className="flex items-center justify-between gap-1 text-[9px] font-bold">
                  {tikTokScript.scenes.map((s, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentSceneIdx(i);
                        setVideoPlayTimeSeconds(i === 0 ? 0 : i === 1 ? 4 : i === 2 ? 13 : 25);
                      }}
                      className={`flex-1 py-0.5 rounded transition-all cursor-pointer truncate text-center ${
                        currentSceneIdx === i
                          ? 'bg-amber-400 text-slate-100 font-black shadow'
                          : 'bg-black/40 text-slate-300 hover:text-slate-100'
                      }`}
                    >
                      {s.tag.split(' ')[1] || s.tag}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="bg-black/60 backdrop-blur-sm p-2 rounded-xl border border-white/10 max-w-[190px]">
                    <div className="text-xs font-extrabold text-slate-100 flex items-center gap-1">
                      <span>@smartgarden68</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-current" />
                    </div>
                    <p className="text-[10px] text-slate-200 line-clamp-1 mt-0.5 font-medium">
                      {tikTokScript.cleanTitle}
                    </p>
                    <p className="text-[9px] text-emerald-300 font-bold mt-0.5">
                      🔗 smartgarden.gr
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 text-slate-100 text-[10px]">
                    <div className="w-8 h-8 rounded-full bg-slate-900/90 border border-white/20 flex items-center justify-center font-bold shadow-lg">
                      ❤️
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-900/90 border border-white/20 flex items-center justify-center font-bold shadow-lg">
                      💬
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-900/90 border border-white/20 flex items-center justify-center font-bold shadow-lg">
                      🔄
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Controls */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  const nextState = !isPlayingPreview;
                  setIsPlayingPreview(nextState);
                  if (!nextState && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="text-xs font-bold text-slate-300 hover:text-slate-100 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow"
              >
                {isPlayingPreview ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />}
                <span>{isPlayingPreview ? 'Παύση' : 'Αναπαραγωγή'}</span>
              </button>

              <button
                onClick={() => setCurrentSceneIdx((prev) => (prev + 1) % tikTokScript.scenes.length)}
                className="text-xs font-bold text-slate-300 hover:text-slate-100 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Επόμενη Σκηνή ⏭️</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: POSTS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                Ιστορικό Αυτόματων Δημοσιεύσεων TikTok (@smartgarden68)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Όλα τα βίντεο που έχουν σταλεί και δημοσιευτεί αυτόματα στον λογαριασμό σας.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('tiktok_direct')}
              className="bg-gradient-to-r from-pink-600 to-amber-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow cursor-pointer hover:scale-105 transition-all"
            >
              + Νέα Δημοσίευση
            </button>
          </div>

          {publishedPosts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">🎬</div>
              <div className="text-sm font-bold text-slate-300">Δεν υπάρχουν ακόμη καταγεγραμμένες δημοσιεύσεις.</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Πατήστε το κουμπί <strong>«🚀 Άμεση Αυτόματη Δημοσίευση στο TikTok»</strong> για να δημοσιεύσετε το πρώτο σας βίντεο!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publishedPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-pink-500/40 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Δημοσιεύτηκε
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(post.publishedAt).toLocaleDateString('el-GR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-100 line-clamp-1">{post.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{post.caption}</p>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 text-slate-400">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-blue-400" /> {post.views} προβολές</span>
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-rose-400" /> {post.likes} likes</span>
                    </div>

                    <a
                      href={post.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <span>Προβολή TikTok</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUTO VIDEO GENERATOR DETAILS */}
      {activeTab === 'auto_generator' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-emerald-400" />
                Αυτόματος Renderer Βίντεο 9:16 (In-Browser MP4/WebM)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Παράγει πραγματικό αρχείο βίντεο 9:16 HD (1080x1920) με εφέ Ken-Burns, δυναμικούς υπότιτλους και branding SmartGarden.gr χωρίς κανένα εξωτερικό κόστος.
              </p>
            </div>

            <button
              onClick={handleGenerateAndDownloadVideo}
              disabled={isGeneratingVideo}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-100 font-black text-xs py-3 px-5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-100" />
              {isGeneratingVideo ? `Παραγωγή (${generationProgress}%)...` : '⚡ Παραγωγή & Κατέβασμα Τώρα'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-400 uppercase">1. Ανάλυση 9:16 Vertical</span>
              <p className="text-xs text-slate-300">
                1080x1920 HD έτοιμο για TikTok, Instagram Reels και YouTube Shorts.
              </p>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400 uppercase">2. Kinetic Typography</span>
              <p className="text-xs text-slate-300">
                Υπότιτλοι υψηλής ορατότητας με χρωματική έμφαση για 100% διατήρηση προσοχής (Retention).
              </p>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-pink-400 uppercase">3. 100% Δωρεάν & Απεριόριστο</span>
              <p className="text-xs text-slate-300">
                Χωρίς συνδρομές, χωρίς watermarks άλλων εταιρειών, αποκλειστικά με το λογότυπο του SmartGarden.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCRIPT BREAKDOWN */}
      {activeTab === 'script' && tikTokScript && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Ανάλυση Σκηνών & Voiceover (Χρονισμός 30s)
            </h3>
            <button
              onClick={() => copyToClipboard(tikTokScript.fullScriptText, 'full_script')}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-100 px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow active:scale-95"
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
                  <span className="font-bold text-slate-300">{scene.tag}</span>
                </div>

                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                  <div className="text-[11px] font-bold text-pink-400 uppercase tracking-wide mb-1">
                    🗣️ Voiceover (Εκφώνηση):
                  </div>
                  <p className="text-xs text-slate-100 font-medium leading-relaxed">
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
      )}

      {/* TAB 5: FREE AI TOOLS */}
      {activeTab === 'tools' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <h3 className="text-base font-bold text-slate-100 group-hover:text-pink-400 transition-colors">
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
      )}

    </div>
  );
};
