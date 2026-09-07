import React, { useRef, useState, useEffect } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { TikTokComposition, TikTokScriptData } from './TikTokComposition';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Sparkles, Sliders, Smartphone, Copy, Check, Music, UserCheck, Mic } from 'lucide-react';
import {
  speakGreekTextWithWebSpeech,
  stopWebSpeech,
  fetchGreekAudioUrl,
  createDeepMaleAudioChain,
  createLightFemaleAudioChain,
  createWarmFemaleAudioChain,
  getAudioChainForProfile,
  VoiceProfile,
} from '../utils/greekSpeechSynthesizer';

interface RemotionPreviewPlayerProps {
  script: TikTokScriptData;
  imageUrl?: string;
  articleTitle?: string;
  articleSlug?: string;
}

export const RemotionPreviewPlayer: React.FC<RemotionPreviewPlayerProps> = ({
  script,
  imageUrl,
  articleTitle,
  articleSlug,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState<boolean>(false);
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<VoiceProfile>('deep_male');
  const [selectedVoiceSpeed, setSelectedVoiceSpeed] = useState<number>(1.0);

  const fps = 30;
  const durationInSeconds = 12;
  const durationInFrames = fps * durationInSeconds;

  // Speak voiceover using Greek Web Speech API when playing in browser
  const speakGreekScript = (profile?: VoiceProfile, speed?: number) => {
    if (!isSoundEnabled) return;
    
    stopWebSpeech();
    
    // Combine scenes for clear, continuous Greek narration
    const fullText = script.scenes
      .map((s) => s.voiceover)
      .join('. ');

    const started = speakGreekTextWithWebSpeech(
      fullText,
      () => setSpeechSynthesisActive(false),
      speed || selectedVoiceSpeed,
      1.0,
      profile || selectedVoiceProfile
    );

    setSpeechSynthesisActive(started);
  };

  const stopGreekSpeech = () => {
    stopWebSpeech();
    setSpeechSynthesisActive(false);
  };

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    if (playerRef.current.isPlaying()) {
      playerRef.current.pause();
      setIsPlaying(false);
      stopGreekSpeech();
    } else {
      playerRef.current.play();
      setIsPlaying(true);
      if (isSoundEnabled) {
        speakGreekScript();
      }
    }
  };

  const handleRestart = () => {
    if (!playerRef.current) return;
    stopGreekSpeech();
    playerRef.current.seekTo(0);
    playerRef.current.play();
    setIsPlaying(true);
    if (isSoundEnabled) {
      speakGreekScript();
    }
  };

  const toggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    if (!next) {
      stopGreekSpeech();
    } else if (isPlaying) {
      speakGreekScript();
    }
  };

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopGreekSpeech();
    };
  }, []);

  const copyRemotionCli = () => {
    const code = `npx remotion render src/remotion/index.ts TikTokComposition out/${articleSlug || 'video'}.mp4 --props='${JSON.stringify({
      script,
      imageUrl,
      brandName: 'SmartGarden.gr',
      brandHandle: '@smartgarden'
    })}'`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Direct Browser High-Res MP4/WebM Export matching the Remotion Composition
  const handleExportRemotionVideo = async () => {
    setIsExporting(true);
    setRenderProgress(5);
    setExportMessage(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context not available');

      // Audio setup
      let audioCtx: AudioContext | null = null;
      let audioDest: MediaStreamAudioDestinationNode | null = null;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtx = new AudioCtx();
          audioDest = audioCtx.createMediaStreamDestination();
        }
      } catch (e) {
        console.warn('Web Audio error:', e);
      }

      // Preload image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80';
      await new Promise<void>((resolve) => {
        let done = false;
        img.onload = () => { if (!done) { done = true; resolve(); } };
        img.onerror = () => { if (!done) { done = true; resolve(); } };
        setTimeout(() => { if (!done) { done = true; resolve(); } }, 1500);
      });

      const canvasStream = canvas.captureStream(fps);
      let combinedStream = canvasStream;

      // Bake Studio Quality Greek Voice into Export
      if (audioCtx && audioDest) {
        try {
          if (audioCtx.state === 'suspended') await audioCtx.resume();
          const fullVoiceoverText = script.scenes.map((s) => s.voiceover).join('. ');
          const audioUrl = await fetchGreekAudioUrl(fullVoiceoverText);
          if (audioUrl) {
            const resp = await fetch(audioUrl);
            const arrayBuf = await resp.arrayBuffer();
            const decoded = await audioCtx.decodeAudioData(arrayBuf);
            const audioSrc = audioCtx.createBufferSource();
            audioSrc.buffer = decoded;
            
            let baseRate = 1.0;
            if (selectedVoiceProfile === 'deep_male') baseRate = 0.89;
            else if (selectedVoiceProfile === 'light_female') baseRate = 1.06;
            else if (selectedVoiceProfile === 'warm_female') baseRate = 0.98;

            audioSrc.playbackRate.value = baseRate * selectedVoiceSpeed;

            const chainInput = getAudioChainForProfile(selectedVoiceProfile, audioCtx, audioDest);

            audioSrc.connect(chainInput);
            audioSrc.start(0);
          }
        } catch (err) {
          console.warn('Could not bake Greek audio stream into video:', err);
        }

        if (audioDest.stream.getAudioTracks().length > 0) {
          combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioDest.stream.getAudioTracks()]);
        }
      }

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType.includes('webm') || mimeType.includes('mp4') ? mimeType : undefined,
        videoBitsPerSecond: 6000000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          if (chunks.length === 0) return reject(new Error('Δεν παρήχθησαν δεδομένα βίντεο'));
          resolve(new Blob(chunks, { type: mimeType }));
        };
        recorder.onerror = reject;
      });

      recorder.start(100);

      const scenes = script.scenes;
      const totalFrames = durationInFrames;
      const sceneDurationFrames = Math.floor(totalFrames / Math.max(1, scenes.length));

      for (let frame = 0; frame < totalFrames; frame++) {
        const sceneIndex = Math.min(scenes.length - 1, Math.floor(frame / sceneDurationFrames));
        const scene = scenes[sceneIndex];
        const sceneFrame = frame % sceneDurationFrames;
        const progress = frame / totalFrames;

        // Sound chime on scene change
        if (frame % sceneDurationFrames === 0 && audioCtx && audioDest) {
          try {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const freqs = [523.25, 659.25, 783.99, 1046.5];
            osc.frequency.setValueAtTime(freqs[sceneIndex % freqs.length], audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(audioDest);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
          } catch {}
        }

        // Draw Canvas Frame
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, '#021811');
        bgGrad.addColorStop(0.5, '#06382b');
        bgGrad.addColorStop(1, '#020b08');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ken-Burns image pan
        try {
          if (img.complete && img.naturalWidth > 0) {
            const zoom = 1.06 + (frame / totalFrames) * 0.16;
            const w = canvas.width * zoom;
            const h = (canvas.width * (img.naturalHeight / img.naturalWidth || 1)) * zoom;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2 + Math.sin(frame * 0.04) * 25;
            ctx.save();
            ctx.globalAlpha = 0.82;
            ctx.drawImage(img, x, y, w, h);
            ctx.restore();
          }
        } catch {}

        // Vignette Gradients
        const topGrad = ctx.createLinearGradient(0, 0, 0, 480);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, canvas.width, 480);

        const bottomGrad = ctx.createLinearGradient(0, canvas.height - 850, 0, canvas.height);
        bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0.8)');
        bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0.97)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, canvas.height - 850, canvas.width, 850);

        // Header Branding
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(60, 90, 430, 74, 37);
        else ctx.rect(60, 90, 430, 74);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌿 SmartGarden.gr', 275, 140);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('@smartgarden', canvas.width - 70, 140);

        // Kinetic Scene Card with Spring bounce
        const springT = Math.min(1, sceneFrame / 10);
        const cardScale = 0.9 + 0.1 * Math.sin(springT * Math.PI * 0.5);
        const boxY = 820;

        ctx.save();
        ctx.translate(canvas.width / 2, boxY + 85);
        ctx.scale(cardScale, cardScale);
        ctx.translate(-canvas.width / 2, -(boxY + 85));

        const colors = ['#ef4444', '#f59e0b', '#10b981', '#059669', '#3b82f6'];
        ctx.fillStyle = colors[sceneIndex % colors.length];
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(70, boxY, canvas.width - 140, 170, 28);
        else ctx.rect(70, boxY, canvas.width - 140, 170);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 46px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(scene.onScreenText, canvas.width / 2, boxY + 105);
        ctx.restore();

        // Subtitles / Voiceover with dynamic word highlight
        const words = scene.voiceover.split(' ');
        const activeWordIdx = Math.floor((sceneFrame / sceneDurationFrames) * words.length);

        ctx.font = 'bold 42px sans-serif';
        ctx.textAlign = 'center';

        let line = '';
        let lineY = boxY + 280;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - 200 && n > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText(line, canvas.width / 2, lineY);
            line = words[n] + ' ';
            lineY += 62;
          } else {
            line = testLine;
          }
        }
        ctx.fillStyle = '#fef08a';
        ctx.fillText(line, canvas.width / 2, lineY);

        // Footer Call To Action
        ctx.fillStyle = '#6ee7b7';
        ctx.font = '800 32px sans-serif';
        ctx.fillText('📲 Διαβάστε τον πλήρη οδηγό στο www.smartgarden.gr', canvas.width / 2, canvas.height - 180);

        // Progress Bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(60, canvas.height - 100, canvas.width - 120, 16);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(60, canvas.height - 100, (canvas.width - 120) * progress, 16);

        if (frame % 15 === 0) {
          setRenderProgress(10 + Math.floor((frame / totalFrames) * 80));
        }

        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      setRenderProgress(95);
      recorder.stop();
      const videoBlob = await recordPromise;
      if (audioCtx) audioCtx.close();

      const blobUrl = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `smartgarden-remotion-${articleSlug || 'video'}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setRenderProgress(100);
      setIsExporting(false);
      setExportMessage('🎉 Το βίντεο Remotion δημιουργήθηκε και κατέβηκε με επιτυχία!');
    } catch (err: any) {
      setIsExporting(false);
      setExportMessage('❌ Σφάλμα: ' + err.message);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col lg:flex-row items-center gap-8">
        
        {/* 1. Left Side: The Interactive Remotion Player (9:16 vertical mockup) */}
        <div className="flex flex-col items-center">
          <div className="relative w-[300px] sm:w-[340px] h-[533px] sm:h-[604px] rounded-[36px] overflow-hidden border-4 border-slate-700 shadow-2xl bg-black group">
            <Player
              ref={playerRef}
              component={TikTokComposition}
              durationInFrames={durationInFrames}
              compositionWidth={1080}
              compositionHeight={1920}
              fps={fps}
              style={{
                width: '100%',
                height: '100%',
              }}
              inputProps={{
                script,
                imageUrl,
                brandName: 'SmartGarden.gr',
                brandHandle: '@smartgarden',
                primaryColor: '#10b981',
              }}
              loop
              autoPlay={false}
              controls={false}
            />

            {/* Overlay quick controls */}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between bg-black/70 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/15 opacity-90 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                  title={isPlaying ? 'Παύση' : 'Αναπαραγωγή'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={handleRestart}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-transform active:scale-95 cursor-pointer"
                  title="Επανεκκίνηση"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleSound}
                  className={`p-2 rounded-xl font-bold transition-all active:scale-95 cursor-pointer ${
                    isSoundEnabled
                      ? 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                  title={isSoundEnabled ? 'Ήχος Ενεργός (Ελληνική AI Φωνή)' : 'Ήχος Σε Σίγαση'}
                >
                  {isSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                {speechSynthesisActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Φωνή
                  </span>
                )}
                <span className="text-slate-400 font-bold">12s / 30fps</span>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Remotion 9:16 Canvas Resolution: 1080x1920</span>
          </p>
        </div>

        {/* 2. Right Side: Controls, Script Breakdown & Render Actions */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Remotion 2D Animated Video Engine</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                <span>🎨 2D Κινούμενα Σχέδια (Cartoons)</span>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {script.title || 'Αυτόματο Βίντεο Remotion'}
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Πλήρες βίντεο με <strong>2D Κινούμενα Σχέδια φυτών & εργαλείων</strong> που αναπαριστούν ακριβώς τις οδηγίες του άρθρου (πότισμα, ρίζες, ασφυξία, κλάδεμα, άνθιση) σε συνδυασμό με Kinetic Subtitles.
            </p>
          </div>

          {/* Voice Profile & Speed Controls - Clearly Visible & Interactive */}
          <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Mic className="w-4 h-4 text-emerald-400" />
                Ρυθμίσεις Ελληνικής Φωνής (Voiceover)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedVoiceProfile === 'deep_male' ? '🧔 Βαθιά Ανδρική' : selectedVoiceProfile === 'light_female' ? '👩 Φωτεινή Γυναικεία' : '🎙️ Ζεστή Ραδιοφωνική'} • {selectedVoiceSpeed}x
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
              {/* Profile Toggle */}
              <div className="space-y-1.5 lg:col-span-8">
                <label className="text-[11px] text-slate-400 font-bold block">Χροιά Φωνής AI (Ελληνικά):</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVoiceProfile('deep_male');
                      if (isPlaying && isSoundEnabled) {
                        speakGreekScript('deep_male', selectedVoiceSpeed);
                      }
                    }}
                    className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      selectedVoiceProfile === 'deep_male'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🧔</span>
                    <span>Ανδρική Βαθιά</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVoiceProfile('light_female');
                      if (isPlaying && isSoundEnabled) {
                        speakGreekScript('light_female', selectedVoiceSpeed);
                      }
                    }}
                    className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      selectedVoiceProfile === 'light_female'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>👩</span>
                    <span>Γυναικεία Clear</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVoiceProfile('warm_female');
                      if (isPlaying && isSoundEnabled) {
                        speakGreekScript('warm_female', selectedVoiceSpeed);
                      }
                    }}
                    className={`py-2 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      selectedVoiceProfile === 'warm_female'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🎙️</span>
                    <span>Γυναικεία Ζεστή</span>
                  </button>
                </div>
              </div>

              {/* Speed Toggle */}
              <div className="space-y-1.5 lg:col-span-4">
                <label className="text-[11px] text-slate-400 font-bold block">Ταχύτητα:</label>
                <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {[0.8, 1.0, 1.2, 1.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        setSelectedVoiceSpeed(speed);
                        if (isPlaying && isSoundEnabled) {
                          speakGreekScript(selectedVoiceProfile, speed);
                        }
                      }}
                      className={`py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedVoiceSpeed === speed
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scene list visualizer */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
            {script.scenes.map((scene, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3 hover:border-emerald-500/40 transition-colors"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-black text-white truncate">{scene.onScreenText}</h4>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">{scene.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{scene.voiceover}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleExportRemotionVideo}
              disabled={isExporting}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Παραγωγή Remotion ({renderProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>⚡ Κατέβασμα Remotion Video (1080x1920)</span>
                </>
              )}
            </button>

            <button
              onClick={copyRemotionCli}
              className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-colors active:scale-98"
              title="Αντιγραφή Remotion CLI εντολής για τοπικό rendering"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Αντιγράφηκε!' : 'Remotion CLI'}</span>
            </button>
          </div>

          {exportMessage && (
            <div className={`p-3 rounded-xl text-xs font-bold text-center ${
              exportMessage.includes('🎉') ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-red-950/80 text-red-300 border border-red-500/40'
            }`}>
              {exportMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
