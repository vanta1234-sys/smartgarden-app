import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Img
} from 'remotion';
import { SceneCartoonVisualizer } from './GardeningCartoonAnimations';

export interface VideoScene {
  order: number;
  timestamp: string;
  visualCue: string;
  onScreenText: string;
  voiceover: string;
}

export interface TikTokScriptData {
  title: string;
  hook: string;
  targetDuration: string;
  hashtags: string[];
  scenes: VideoScene[];
  audioStyle?: string;
  captionGreek?: string;
}

export interface TikTokCompositionProps {
  script: TikTokScriptData;
  imageUrl?: string;
  brandName?: string;
  brandHandle?: string;
  primaryColor?: string;
}

// Scene sub-component with Animated 2D Drawings, Spring physics & kinetic typography
const SceneFrame: React.FC<{
  scene: VideoScene;
  index: number;
  totalScenes: number;
  imageUrl?: string;
  primaryColor: string;
}> = ({ scene, index, totalScenes, imageUrl, primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for the Main Hook Box
  const boxScale = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 120,
      mass: 0.8,
    },
  });

  // Entrance spring for the Cartoon Container
  const cartoonSpring = spring({
    frame,
    fps,
    config: {
      damping: 10,
      stiffness: 110,
    },
  });

  // Entrance spring for the Voiceover Subtitle Box
  const textTranslateY = spring({
    frame: frame - 6,
    fps,
    config: {
      damping: 14,
      stiffness: 90,
    },
  });

  // Dynamic Ken-Burns pan and zoom for ambient background
  const imageScale = interpolate(frame, [0, fps * 4], [1.05, 1.2], {
    extrapolateRight: 'clamp',
  });

  const imageTranslateY = interpolate(frame, [0, fps * 4], [0, -25], {
    extrapolateRight: 'clamp',
  });

  // Pulse effect for the badge
  const pulse = Math.sin(frame * 0.15) * 0.05 + 1;

  // Words breakdown for kinetic highlight
  const words = scene.voiceover.split(' ');
  const wordsCount = words.length;
  const wordProg = Number(interpolate(frame, [5, fps * 3], [0, wordsCount], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const activeWordIndex = Math.min(wordsCount - 1, Math.max(0, Math.floor(wordProg)));

  // Badge Color Map
  const badgeColors = [
    { bg: '#ef4444', text: '#ffffff', icon: '🛑' }, // Hook
    { bg: '#f59e0b', text: '#000000', icon: '⚠️' }, // Problem
    { bg: '#10b981', text: '#ffffff', icon: '💡' }, // Solution
    { bg: '#059669', text: '#ffffff', icon: '🌿' }, // Tips
    { bg: '#3b82f6', text: '#ffffff', icon: '📲' }, // CTA
  ];
  const activeColor = badgeColors[index % badgeColors.length];

  return (
    <AbsoluteFill className="bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. FULLSCREEN 2D ANIMATED CARTOON WORLD (CANVAS 100% W/H) */}
      <AbsoluteFill className="z-10">
        <SceneCartoonVisualizer
          sceneOrder={scene.order || index + 1}
          totalScenes={totalScenes}
          onScreenText={scene.onScreenText}
          voiceover={scene.voiceover}
        />
      </AbsoluteFill>

      {/* 2. Top & Bottom Cinematic Subtle Vignette Overlays */}
      <div
        className="absolute inset-x-0 top-0 h-40 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-96 pointer-events-none z-20"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* 3. Top Scene Indicator Pill */}
      <div className="absolute top-16 left-6 z-30 pointer-events-none">
        <div
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg border border-white/20"
          style={{
            backgroundColor: activeColor.bg,
            color: activeColor.text,
            transform: `scale(${pulse})`,
          }}
        >
          <span>{activeColor.icon}</span>
          <span>{scene.timestamp || `ΣΚΗΝΗ ${index + 1}/${totalScenes}`}</span>
        </div>
      </div>

      {/* 4. Bottom Kinetic Captions & Step Title Overlay (TikTok Safe Zone) */}
      <div className="absolute inset-x-5 bottom-24 flex flex-col items-center justify-center pointer-events-none z-30">
        {/* Punchy On-Screen Title Card */}
        <div
          style={{
            transform: `scale(${boxScale})`,
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.9), 0 0 25px rgba(16, 185, 129, 0.3)',
          }}
          className="w-full max-w-md rounded-2xl px-4 py-3 border-2 border-emerald-400/60 backdrop-blur-xl bg-slate-950/85 text-center mb-3"
        >
          <h2 className="text-xl font-black leading-snug text-slate-100 drop-shadow-md">
            {scene.onScreenText}
          </h2>
        </div>

        {/* Word-by-Word Kinetic Subtitles (TikTok Style) */}
        <div
          className="w-full max-w-md px-4 py-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-center shadow-2xl"
          style={{
            transform: `translateY(${interpolate(textTranslateY, [0, 1], [20, 0])}px)`,
            opacity: interpolate(textTranslateY, [0, 1], [0, 1]),
          }}
        >
          <p className="text-base font-bold leading-relaxed tracking-wide">
            {words.map((word, wIdx) => {
              const isHighlight = wIdx === activeWordIndex;
              const isPast = wIdx < activeWordIndex;
              return (
                <span
                  key={wIdx}
                  className={`inline-block mx-1 transition-all duration-150 ${
                    isHighlight
                      ? 'text-yellow-300 scale-110 font-black underline decoration-yellow-400 decoration-2'
                      : isPast
                      ? 'text-slate-100'
                      : 'text-slate-400'
                  }`}
                  style={{
                    transform: isHighlight ? 'scale(1.18)' : 'scale(1)',
                    textShadow: isHighlight ? '0 0 16px rgba(253, 224, 71, 0.95)' : 'none',
                  }}
                >
                  {word}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TikTokComposition: React.FC<TikTokCompositionProps> = ({
  script,
  imageUrl,
  brandName = 'SmartGarden.gr',
  brandHandle = '@smartgarden68',
  primaryColor = '#10b981',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const scenes = script?.scenes || [
    {
      order: 1,
      timestamp: '00:00',
      visualCue: 'Close-up botanical shot',
      onScreenText: 'ΜΥΣΤΙΚΟ ΓΙΑ ΤΕΛΕΙΟ ΚΗΠΟ!',
      voiceover: 'Αυτό είναι το νο1 μυστικό που αλλάζει τα πάντα στα φυτά σου.',
    },
  ];

  const totalScenes = Math.max(1, scenes.length);
  const sceneDurationInFrames = Math.floor(durationInFrames / totalScenes);

  // Overall progress bar
  const progressPercent = Math.min(100, (frame / durationInFrames) * 100);

  return (
    <AbsoluteFill className="bg-slate-950 font-sans">
      {/* Render Each Scene in Sequence */}
      {scenes.map((scene, idx) => (
        <Sequence
          key={idx}
          from={idx * sceneDurationInFrames}
          durationInFrames={
            idx === totalScenes - 1
              ? durationInFrames - idx * sceneDurationInFrames
              : sceneDurationInFrames
          }
        >
          <SceneFrame
            scene={scene}
            index={idx}
            totalScenes={totalScenes}
            imageUrl={imageUrl}
            primaryColor={primaryColor}
          />
        </Sequence>
      ))}

      {/* Global Header Bar (Persistent Branding) */}
      <div className="absolute top-8 inset-x-8 flex items-center justify-between z-50 pointer-events-none">
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-600/90 backdrop-blur-md shadow-lg border border-emerald-400/40">
          <span className="text-xl">🌿</span>
          <span className="text-base font-black tracking-wide text-slate-100">{brandName}</span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-amber-400 text-sm font-bold shadow-md">
          <span>{brandHandle}</span>
        </div>
      </div>

      {/* Global Bottom Call-To-Action */}
      <div className="absolute bottom-14 inset-x-6 flex flex-col items-center z-50 pointer-events-none">
        <div className="w-full max-w-xs py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl border border-emerald-300/30 flex items-center justify-center gap-2 text-white font-black text-sm">
          <span>📲</span>
          <span>Διαβάστε τον οδηγό στο smartgarden.gr</span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full max-w-sm mt-4 h-2 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
