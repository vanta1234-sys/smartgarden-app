import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Volume2, 
  VolumeX, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Bot, 
  Film, 
  Smartphone, 
  Monitor, 
  Square,
  Wand2,
  Layers,
  Clock,
  Scissors,
  Droplets,
  Flower2,
  Check,
  AlertCircle
} from 'lucide-react';
import { Article, Language, MultiAgentVideoProject, VideoFormat, CartoonSceneStep } from '../types';
import { ARTICLES_DATA } from '../data/mockData';
import { createMultiAgentProject, soundFx } from '../services/videoAgentEngine';

interface CartoonVideoStudioProps {
  lang: Language;
  initialArticle?: Article | null;
  onClose?: () => void;
}

export const CartoonVideoStudio: React.FC<CartoonVideoStudioProps> = ({
  lang,
  initialArticle,
  onClose,
}) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(
    initialArticle ? initialArticle.id : '1'
  );
  const [format, setFormat] = useState<VideoFormat>('9:16');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Multi-Agent Pipeline state
  const currentArticle = ARTICLES_DATA.find((a) => a.id === selectedArticleId) || ARTICLES_DATA[0];
  const [project, setProject] = useState<MultiAgentVideoProject>(() =>
    createMultiAgentProject(currentArticle)
  );
  const [activeAgentTab, setActiveAgentTab] = useState<'agent1' | 'agent2' | 'agent3'>('agent1');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastSoundStepRef = useRef<string | null>(null);

  // Update project when article changes
  useEffect(() => {
    const art = ARTICLES_DATA.find((a) => a.id === selectedArticleId) || ARTICLES_DATA[0];
    setProject(createMultiAgentProject(art));
    setCurrentTime(0);
    setIsPlaying(false);
  }, [selectedArticleId]);

  // Run Multi-Agent Animation Process Simulation
  const handleRunAgentPipeline = () => {
    setIsGenerating(true);
    setCurrentTime(0);
    setIsPlaying(false);

    // Step 1: Agent 1 Storyboard
    setActiveAgentTab('agent1');
    setTimeout(() => {
      // Step 2: Agent 2 QA
      setActiveAgentTab('agent2');
      setTimeout(() => {
        // Step 3: Agent 3 Animator
        setActiveAgentTab('agent3');
        setTimeout(() => {
          setIsGenerating(false);
          setIsPlaying(true);
        }, 800);
      }, 800);
    }, 800);
  };

  // Find active scene step based on currentTime (0 to 10 seconds)
  const storyboard = project.agent1Script.storyboard;
  const activeStep: CartoonSceneStep = storyboard.find(
    (s) => currentTime >= s.timeStart && currentTime < s.timeEnd
  ) || storyboard[storyboard.length - 1];

  // Play sound effect when step changes
  useEffect(() => {
    if (isPlaying && soundEnabled && activeStep && activeStep.id !== lastSoundStepRef.current) {
      lastSoundStepRef.current = activeStep.id;
      soundFx.playEffect(activeStep.cartoonElements.audioEffect);
    }
  }, [activeStep, isPlaying, soundEnabled]);

  // Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + delta * playbackSpeed;
        if (next >= 10.0) {
          setIsPlaying(false);
          return 10.0;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Canvas 2D Cartoon Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Vibrant Animated Background (Sky + Balcony Garden Terrace)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (currentTime < 5.0) {
      bgGradient.addColorStop(0, '#bae6fd'); // Daylight sky
      bgGradient.addColorStop(0.65, '#fef08a'); // Warm sunlight
      bgGradient.addColorStop(1, '#e2e8f0'); // Terrace floor
    } else {
      bgGradient.addColorStop(0, '#7dd3fc');
      bgGradient.addColorStop(0.6, '#bbf7d0'); // Vibrant lush atmosphere
      bgGradient.addColorStop(1, '#cbd5e1');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Sun Rays / Ambient Glow
    const sunPulse = Math.sin(currentTime * 4) * 15;
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.15, 45 + sunPulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.15, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    // Terrace Railing / Balcony Shelf
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, height * 0.72, width, 14);
    for (let x = 20; x < width; x += 40) {
      ctx.fillRect(x, height * 0.72, 8, height * 0.28);
    }
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, height * 0.76, width, 8);

    // 2. Cartoon Terracotta Pot
    const potX = width / 2;
    const potY = height * 0.78;
    const potW = width * 0.38;
    const potH = height * 0.22;

    // Pot shadow
    ctx.beginPath();
    ctx.ellipse(potX, potY + potH * 0.9, potW * 0.6, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fill();

    // Pot Body
    ctx.beginPath();
    ctx.moveTo(potX - potW * 0.45, potY);
    ctx.lineTo(potX + potW * 0.45, potY);
    ctx.lineTo(potX + potW * 0.35, potY + potH * 0.85);
    ctx.lineTo(potX - potW * 0.35, potY + potH * 0.85);
    ctx.closePath();
    ctx.fillStyle = '#ea580c'; // Warm terracotta
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#9a3412';
    ctx.stroke();

    // Pot Rim
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.roundRect(potX - potW * 0.5, potY - 12, potW, 20, 8);
    ctx.fill();
    ctx.stroke();

    // Soil Top
    ctx.beginPath();
    ctx.ellipse(potX, potY - 2, potW * 0.42, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = currentTime > 5.5 ? '#292524' : '#78350f'; // Darker moist soil when watered
    ctx.fill();

    // 3. Central Plant Cartoon Animation (Morphing state from 0s to 10s)
    const plantBaseX = potX;
    const plantBaseY = potY - 5;
    const growthFactor = Math.min(1.0, 0.4 + (currentTime / 10) * 0.7);
    const sway = Math.sin(currentTime * 6) * 6;

    // Plant Main Stems
    ctx.strokeStyle = currentTime > 5.0 ? '#15803d' : '#84cc16';
    ctx.lineWidth = 8 * growthFactor;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(plantBaseX, plantBaseY);
    ctx.quadraticCurveTo(plantBaseX + sway, plantBaseY - 80 * growthFactor, plantBaseX, plantBaseY - 160 * growthFactor);
    ctx.stroke();

    // Left branch
    ctx.beginPath();
    ctx.moveTo(plantBaseX, plantBaseY - 50 * growthFactor);
    ctx.quadraticCurveTo(plantBaseX - 40 + sway * 0.5, plantBaseY - 90 * growthFactor, plantBaseX - 70, plantBaseY - 110 * growthFactor);
    ctx.stroke();

    // Right branch
    ctx.beginPath();
    ctx.moveTo(plantBaseX, plantBaseY - 70 * growthFactor);
    ctx.quadraticCurveTo(plantBaseX + 40 + sway * 0.5, plantBaseY - 110 * growthFactor, plantBaseX + 75, plantBaseY - 135 * growthFactor);
    ctx.stroke();

    // Leaves with animated color shift (Yellow/Chlorosis -> Deep Glossy Green)
    const leafColor = currentTime < 3.0 
      ? (selectedArticleId === '2' ? '#facc15' : '#84cc16') // Yellowing for iron chlorosis article
      : (currentTime < 6.0 ? '#22c55e' : '#16a34a');

    const drawLeaf = (lx: number, ly: number, angle: number, size: number) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, size * growthFactor, size * 0.5 * growthFactor, 0, 0, Math.PI * 2);
      ctx.fillStyle = leafColor;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#14532d';
      ctx.stroke();
      // Leaf vein
      ctx.beginPath();
      ctx.moveTo(-size * 0.7 * growthFactor, 0);
      ctx.lineTo(size * 0.7 * growthFactor, 0);
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    drawLeaf(plantBaseX - 70, plantBaseY - 110 * growthFactor, -0.4, 32);
    drawLeaf(plantBaseX + 75, plantBaseY - 135 * growthFactor, 0.4, 32);
    drawLeaf(plantBaseX - 35, plantBaseY - 150 * growthFactor, -0.2, 28);
    drawLeaf(plantBaseX + 35, plantBaseY - 165 * growthFactor, 0.2, 28);
    drawLeaf(plantBaseX, plantBaseY - 180 * growthFactor, 0, 36);

    // Fast-Motion Blooming & Fruiting (Step 3 & 4)
    if (currentTime > 5.0) {
      const bloomScale = Math.min(1.0, (currentTime - 5.0) / 2.5);

      if (selectedArticleId === '4') {
        // Red juicy cartoon tomatoes popping!
        const drawTomato = (tx: number, ty: number, r: number) => {
          ctx.beginPath();
          ctx.arc(tx, ty, r * bloomScale, 0, Math.PI * 2);
          ctx.fillStyle = '#dc2626'; // Vibrant tomato red
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#7f1d1d';
          ctx.stroke();
          // Tomato highlight
          ctx.beginPath();
          ctx.arc(tx - r * 0.3, ty - r * 0.3, r * 0.25 * bloomScale, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fill();
          // Calyx green star
          ctx.fillStyle = '#15803d';
          ctx.fillRect(tx - 4, ty - r * bloomScale - 4, 8, 8);
        };
        drawTomato(plantBaseX - 45, plantBaseY - 100 * growthFactor, 22);
        drawTomato(plantBaseX + 50, plantBaseY - 120 * growthFactor, 26);
        drawTomato(plantBaseX + 5, plantBaseY - 145 * growthFactor, 24);
      } else {
        // Fragrant white gardenia / purple blossoms with gold center
        const drawFlower = (fx: number, fy: number) => {
          ctx.save();
          ctx.translate(fx, fy);
          ctx.scale(bloomScale, bloomScale);
          for (let i = 0; i < 6; i++) {
            ctx.rotate((Math.PI * 2) / 6);
            ctx.beginPath();
            ctx.ellipse(18, 0, 16, 10, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.restore();
        };
        drawFlower(plantBaseX, plantBaseY - 190 * growthFactor);
        drawFlower(plantBaseX - 50, plantBaseY - 130 * growthFactor);
      }
    }

    // 4. Interactive Cartoon Tools & Actions by Phase
    if (currentTime >= 0 && currentTime < 2.5) {
      // Phase 1: Diagnosis & IoT Scanner / Hand
      const scanY = plantBaseY - 120 + Math.sin(currentTime * 8) * 40;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(plantBaseX - 90, scanY);
      ctx.lineTo(plantBaseX + 90, scanY);
      ctx.stroke();
      ctx.setLineDash([]);

      // IoT Target Ring
      ctx.beginPath();
      ctx.arc(plantBaseX, scanY, 18, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

    } else if (currentTime >= 2.5 && currentTime < 5.5) {
      // Phase 2: Action - Scissors Snipping or Red Iron Powder / Dripper Punch
      const toolX = plantBaseX + 60 + Math.sin(currentTime * 12) * 15;
      const toolY = plantBaseY - 100 + Math.cos(currentTime * 12) * 10;

      if (selectedArticleId === '2') {
        // Red Iron Chelate Powder Pouring
        for (let p = 0; p < 8; p++) {
          const px = toolX - 30 + Math.random() * 20;
          const py = toolY + ((currentTime * 150 + p * 30) % 80);
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        }
      } else {
        // Pruning Shears / Snipping Blades Animation
        ctx.save();
        ctx.translate(toolX, toolY);
        const snipAngle = Math.sin(currentTime * 20) * 0.35;
        
        // Blade 1
        ctx.save();
        ctx.rotate(-snipAngle);
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-45, -12);
        ctx.lineTo(-40, 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.stroke();
        ctx.restore();

        // Blade 2
        ctx.save();
        ctx.rotate(snipAngle);
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-45, 12);
        ctx.lineTo(-40, -4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.stroke();
        ctx.restore();

        // Shear handles (Red Grips)
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(20, -10, 10, 0, Math.PI * 2);
        ctx.arc(20, 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Cut snip sparks
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('SNIP! ✂️', toolX - 90, toolY - 20);
      }

    } else if (currentTime >= 5.5 && currentTime < 8.0) {
      // Phase 3: Fast-Motion Water Stream / Drip Flow Animation
      for (let i = 0; i < 7; i++) {
        const dropX = plantBaseX - 40 + i * 14;
        const dropY = plantBaseY - 30 + ((currentTime * 120 + i * 25) % 40);
        ctx.beginPath();
        ctx.arc(dropX, dropY, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      }
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('DRIP FLOW 💧', plantBaseX - 55, plantBaseY - 50);

    } else if (currentTime >= 8.0) {
      // Phase 4: Celebratory Golden Sparkles & Confetti
      for (let s = 0; s < 12; s++) {
        const sx = (width * 0.15 + (s * 35 + Math.sin(currentTime * 10 + s) * 20)) % width;
        const sy = (height * 0.2 + (s * 45 + Math.cos(currentTime * 10 + s) * 25)) % (height * 0.7);
        ctx.fillStyle = s % 2 === 0 ? '#fbbf24' : '#ec4899';
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. On-Screen Animated Cartoon Banner & Step Indicator
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(16, 16, width - 32, 60, 14);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#10b981';
    ctx.stroke();

    // Banner Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(activeStep.phaseName[lang], 30, 40);
    
    ctx.fillStyle = '#34d399';
    ctx.font = '12px sans-serif';
    const textMsg = activeStep.cartoonElements.onScreenBanner[lang];
    ctx.fillText(textMsg, 30, 60);

    // 6. Fast-Motion Watermark & Timer Pill (Top Right)
    const timeFormatted = `${currentTime.toFixed(1)}s / 10.0s`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(width - 120, height - 38, 105, 26, 8);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(timeFormatted, width - 110, height - 21);

  }, [currentTime, format, selectedArticleId, lang, activeStep]);

  // Export / Download Video (WebM / MP4)
  const handleExportVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecording(true);
    setCurrentTime(0);
    setIsPlaying(true);

    try {
      const stream = canvas.captureStream(60);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smartgarden_10s_${currentArticle.slug}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      };

      recorder.start();

      // Stop recorder exactly at 10.1 seconds
      setTimeout(() => {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, 10200 / playbackSpeed);

    } catch (err) {
      console.error('Video capture error:', err);
      setIsRecording(false);
    }
  };

  const canvasWidth = format === '9:16' ? 360 : format === '16:9' ? 640 : 420;
  const canvasHeight = format === '9:16' ? 640 : format === '16:9' ? 360 : 420;

  return (
    <div id="cartoon-video-studio" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xl">
      
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
            <Film className="w-3.5 h-3.5" />
            <span>{lang === 'el' ? 'Multi-Agent 10s Cartoon Video Engine' : 'Multi-Agent 10s Cartoon Video Engine'}</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            {lang === 'el' ? '🎬 Δημιουργός 10-Second Fast-Motion Video' : '🎬 10-Second Fast-Motion Cartoon Video Generator'}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {lang === 'el' 
              ? '3 εξειδικευμένοι AI Agents συνεργάζονται: Σκηνοθέτης (Script), Επιθεωρητής Γεωπόνος (Quality QA) & 2D Vector Animator σε γρήγορη κίνηση 10 δευτερολέπτων.'
              : '3 specialized AI agents collaborate: Storyboarder (Script), Botanical Inspector (QA) & 2D Vector Animator at 10-second high-speed playback.'}
          </p>
        </div>

        {/* Article Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
            {lang === 'el' ? 'Επιλογή Άρθρου:' : 'Select Article:'}
          </label>
          <select
            id="video-article-select"
            value={selectedArticleId}
            onChange={(e) => setSelectedArticleId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 max-w-[260px] truncate"
          >
            {ARTICLES_DATA.map((art) => (
              <option key={art.id} value={art.id}>
                {art.title[lang]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* Left Column: 10s Cartoon Player */}
        <div className="lg:col-span-6 flex flex-col items-center">
          
          {/* Format Selector Bar */}
          <div className="flex items-center justify-between w-full max-w-[420px] mb-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
              <button
                onClick={() => setFormat('9:16')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  format === '9:16' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>9:16 Reel</span>
              </button>
              <button
                onClick={() => setFormat('16:9')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  format === '16:9' ? 'bg-emerald-600 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3 h-3" />
                <span>16:9 HD</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-600'
                  : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-400'
              }`}
              title="Sound FX Toggle"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-neutral-900 dark:border-neutral-700 bg-black flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="w-full max-w-[340px] sm:max-w-[380px] h-auto object-contain cursor-pointer"
              onClick={() => setIsPlaying(!isPlaying)}
            />

            {/* Big Play Overlay when paused at start */}
            {!isPlaying && currentTime === 0 && (
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex flex-col items-center justify-center cursor-pointer text-white"
                onClick={() => setIsPlaying(true)}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                  <Play className="w-8 h-8 ml-1 fill-white" />
                </div>
                <p className="text-xs font-bold mt-3 px-3 py-1 rounded-full bg-black/60">
                  {lang === 'el' ? 'Έναρξη 10s Fast-Motion Video' : 'Start 10s Fast-Motion Video'}
                </p>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-lg animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>REC 10s...</span>
              </div>
            )}
          </div>

          {/* Playback Controls & Timeline Scrubber */}
          <div className="w-full max-w-[420px] mt-4 space-y-3">
            
            {/* Scrubber Bar */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 w-8">
                {currentTime.toFixed(1)}s
              </span>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={currentTime}
                onChange={(e) => {
                  setCurrentTime(parseFloat(e.target.value));
                  setIsPlaying(false);
                }}
                className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
              />
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 w-10">
                10.0s
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                
                {/* Play/Pause */}
                <button
                  id="video-play-btn"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                {/* Reset / Replay */}
                <button
                  id="video-reset-btn"
                  onClick={() => {
                    setCurrentTime(0);
                    setIsPlaying(true);
                  }}
                  className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white transition-all"
                  title="Replay from 0:00"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Speed Multiplier (1x, 1.5x, 2x) */}
                <button
                  onClick={() => {
                    setPlaybackSpeed((prev) => (prev === 1.0 ? 1.5 : prev === 1.5 ? 2.0 : 1.0));
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white flex items-center gap-1"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>{playbackSpeed}x</span>
                </button>
              </div>

              {/* Export Video Button */}
              <button
                id="export-video-btn"
                disabled={isRecording}
                onClick={handleExportVideo}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                  downloadSuccess
                    ? 'bg-emerald-700 text-white'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500'
                }`}
              >
                {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                <span>
                  {downloadSuccess 
                    ? (lang === 'el' ? 'Βίντεο Κατέβηκε!' : 'Video Downloaded!') 
                    : (isRecording ? (lang === 'el' ? 'Εγγραφή...' : 'Recording...') : (lang === 'el' ? 'Download Video (WebM)' : 'Download Video (WebM)'))}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Agent Collaboration Board */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* Multi-Agent Action Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-neutral-900 to-sky-950 text-white border border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {lang === 'el' ? 'Multi-Agent Autonomous Pipeline' : 'Multi-Agent Autonomous Pipeline'}
                </p>
                <p className="text-xs text-neutral-300">
                  {lang === 'el' ? 'Ανάλυση άρθρου & σύνθεση 10s animation' : 'Article breakdown & 10s animation synthesis'}
                </p>
              </div>
            </div>

            <button
              onClick={handleRunAgentPipeline}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs transition-transform active:scale-95 shadow-md shrink-0"
            >
              <Wand2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? (lang === 'el' ? 'Σύνθεση...' : 'Synthesizing...') : (lang === 'el' ? 'Επανεκτέλεση Agents' : 'Re-Run Agents')}</span>
            </button>
          </div>

          {/* Agent Tabs */}
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <button
              onClick={() => setActiveAgentTab('agent1')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAgentTab === 'agent1'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Agent 1: Σκηνοθέτης</span>
            </button>

            <button
              onClick={() => setActiveAgentTab('agent2')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAgentTab === 'agent2'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Agent 2: Επιθεωρητής QA</span>
            </button>

            <button
              onClick={() => setActiveAgentTab('agent3')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeAgentTab === 'agent3'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Agent 3: Animator 60fps</span>
            </button>
          </div>

          {/* Agent 1 Panel: Storyboard Breakdown */}
          {activeAgentTab === 'agent1' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {project.agent1Script.agentName}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                  {project.agent1Script.notes[lang]}
                </p>
              </div>

              {/* Storyboard 4-Phase Timeline Cards */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {project.agent1Script.storyboard.map((step, idx) => {
                  const isCurrent = currentTime >= step.timeStart && currentTime < step.timeEnd;
                  return (
                    <div
                      key={step.id}
                      onClick={() => {
                        setCurrentTime(step.timeStart);
                        setIsPlaying(false);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {step.phaseName[lang]}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                          {step.timeStart}s - {step.timeEnd}s
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                        {step.actionDescription[lang]}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                          🎯 {step.botanicalFocus[lang]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent 2 Panel: Quality & Botanical Audit */}
          {activeAgentTab === 'agent2' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                    98%
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      {lang === 'el' ? 'Βοτανική & Τεχνική Ακρίβεια' : 'Botanical & Technical Accuracy'}
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      {project.agent2Review.safetyNotice[lang]}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                  {lang === 'el' ? 'ΕΓΚΕΚΡΙΜΕΝΟ' : 'APPROVED'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'el' ? 'Διορθώσεις & Έλεγχοι Ασφαλείας Agent 2:' : 'Agent 2 Review Audit Checklist:'}</span>
                </p>
                <ul className="space-y-2">
                  {project.agent2Review.botanicalCorrections[lang].map((correction, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{correction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Agent 3 Panel: Vector Animation & Render Parameters */}
          {activeAgentTab === 'agent3' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 space-y-3">
                <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-500" />
                  <span>{project.agent3Animator.agentName}</span>
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[10px]">Render Frame Rate</span>
                    <span className="font-bold text-neutral-900 dark:text-white text-sm">60 FPS Smooth Vector</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-neutral-500 dark:text-neutral-400 block text-[10px]">Fast-Motion Scale</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">2.0x Hyper-Speed</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400 block text-[10px]">Dynamic Sound Effects</span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    Web Audio Procedural Synthesizer (Zero Latency)
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
