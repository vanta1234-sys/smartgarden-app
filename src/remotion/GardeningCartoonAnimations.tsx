import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

// Helper for smooth cyclical sine motion
const sineWave = (frame: number, speed: number, amplitude: number) => {
  return Math.sin(frame * speed) * amplitude;
};

// 1. FULL-SCREEN SCENE 1: OVERWATERING & WILTING CARTOON WORLD
export const FullscreenCartoonWilting: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const cloudFloat = sineWave(frame, 0.05, 15);
  const cloudFloat2 = sineWave(frame + 40, 0.04, 12);
  const lightningFlash = (frame % 45 === 0 || frame % 45 === 2) ? 0.9 : 0;
  const leafDroop = interpolate(frame, [0, fps * 2], [0, 35], { extrapolateRight: 'clamp' });
  const waterLevelRise = interpolate(frame, [0, fps * 3], [0, 45], { extrapolateRight: 'clamp' });
  const alertScale = spring({ frame: frame - 6, fps, config: { damping: 10, stiffness: 140 } });

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950">
      {/* Lightning Flash Overlay */}
      <div
        className="absolute inset-0 bg-cyan-200 pointer-events-none transition-opacity duration-75"
        style={{ opacity: lightningFlash }}
      />

      {/* SVG Canvas for Full-Screen Vector Scene */}
      <svg
        viewBox="0 0 1080 1920"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="potGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Balcony / Room Wooden Tiles Floor (Bottom 40%) */}
        <path d="M0 1250 L1080 1250 L1080 1920 L0 1920 Z" fill="url(#floorGrad)" />
        {/* Perspective Floor Slats */}
        <line x1="180" y1="1250" x2="60" y2="1920" stroke="#1e293b" strokeWidth="6" />
        <line x1="380" y1="1250" x2="320" y2="1920" stroke="#1e293b" strokeWidth="6" />
        <line x1="540" y1="1250" x2="540" y2="1920" stroke="#1e293b" strokeWidth="6" />
        <line x1="700" y1="1250" x2="760" y2="1920" stroke="#1e293b" strokeWidth="6" />
        <line x1="900" y1="1250" x2="1020" y2="1920" stroke="#1e293b" strokeWidth="6" />

        {/* Water Pool Puddle on Floor with Waves */}
        <ellipse
          cx="540"
          cy={1420 + waterLevelRise * 0.3}
          rx={360 + waterLevelRise * 2}
          ry={70 + waterLevelRise * 0.8}
          fill="url(#waterGrad)"
          stroke="#7dd3fc"
          strokeWidth="6"
        />

        {/* Big Animated Thunder Storm Clouds at the Top */}
        <g style={{ transform: `translate(0px, ${cloudFloat}px)` }}>
          {/* Main Dark Storm Cloud */}
          <path
            d="M240 380 C150 380 90 310 140 220 C110 120 220 50 320 100 C380 20 530 20 590 100 C690 40 840 100 810 210 C900 250 870 380 760 380 Z"
            fill="url(#cloudGrad)"
            stroke="#64748b"
            strokeWidth="10"
            filter="drop-shadow(0 20px 30px rgba(0,0,0,0.7))"
          />
          {/* Angry Cloud Expression */}
          <path d="M330 220 L420 260 M650 260 L740 220" stroke="#ef4444" strokeWidth="16" strokeLinecap="round" />
          <circle cx="380" cy="280" r="20" fill="#ef4444" />
          <circle cx="690" cy="280" r="20" fill="#ef4444" />
          <path d="M480 320 Q540 270 600 320" stroke="#ef4444" strokeWidth="12" fill="none" strokeLinecap="round" />
        </g>

        {/* Secondary Background Cloud */}
        <g style={{ transform: `translate(0px, ${cloudFloat2}px)`, opacity: 0.6 }}>
          <path
            d="M700 260 C640 260 600 210 630 150 C610 80 690 30 760 70 C800 10 900 10 940 70 C1010 30 1110 70 1090 150 C1150 180 1130 260 1060 260 Z"
            fill="#334155"
          />
        </g>

        {/* Torrential Rain Drops Gushing Down */}
        {[180, 290, 400, 510, 620, 730, 840, 950].map((xPos, idx) => {
          const dropY = ((frame * 36) + idx * 170) % 950 + 350;
          return (
            <g key={idx} opacity={0.85}>
              <line
                x1={xPos}
                y1={dropY}
                x2={xPos - 12}
                y2={dropY + 45}
                stroke="#38bdf8"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Giant Sad Plant in Pot (Center-Stage Full 2D Character) */}
        <g transform="translate(0, 150)">
          {/* Pot Shadow */}
          <ellipse cx="540" cy="1160" rx="260" ry="40" fill="#000000" opacity="0.5" />

          {/* Plant Stem & Drooping Leaves */}
          <g style={{ transformOrigin: '540px 920px' }}>
            {/* Main Trunk Bending with Weight of Water */}
            <path
              d={`M540 920 Q${540 + leafDroop * 2.2} 650 ${540 + leafDroop * 3.8} 440`}
              stroke="#4d7c0f"
              strokeWidth="28"
              strokeLinecap="round"
            />

            {/* Left Giant Drooping Leaf */}
            <path
              d={`M540 800 Q${320 + leafDroop * 2} 750 ${190 + leafDroop * 3.5} ${870 + leafDroop * 3}`}
              stroke="#65a30d"
              strokeWidth="18"
              fill="#3f6212"
              strokeLinecap="round"
            />
            {/* Left Leaf Veins */}
            <path
              d={`M540 800 Q360 780 230 ${850 + leafDroop * 2}`}
              stroke="#84cc16"
              strokeWidth="6"
              fill="none"
            />

            {/* Right Giant Yellowing Saturated Leaf */}
            <path
              d={`M540 700 Q${780 - leafDroop * 1.5} 660 ${900 - leafDroop * 3} ${780 + leafDroop * 3}`}
              stroke="#ca8a04"
              strokeWidth="18"
              fill="#a16207"
              strokeLinecap="round"
            />
            {/* Right Leaf Veins */}
            <path
              d={`M540 700 Q740 680 870 ${760 + leafDroop * 2}`}
              stroke="#eab308"
              strokeWidth="6"
              fill="none"
            />

            {/* Top Sick Drooping Blossom / Leaf Head */}
            <g transform={`translate(${540 + leafDroop * 3.8}, 440)`}>
              <circle cx="0" cy="0" r="65" fill="#84cc16" stroke="#3f6212" strokeWidth="10" />
              {/* Sad Plant Cartoon Face */}
              <circle cx="-22" cy="-10" r="10" fill="#1e293b" />
              <circle cx="22" cy="-10" r="10" fill="#1e293b" />
              {/* Sad Mouth */}
              <path d="M-26 26 Q0 8 26 26" stroke="#1e293b" strokeWidth="9" fill="none" strokeLinecap="round" />
              {/* Tear Drops Falling */}
              <circle cx="34" cy={10 + ((frame * 8) % 60)} r="9" fill="#38bdf8" />
              <circle cx="-34" cy={10 + ((frame * 7 + 25) % 60)} r="9" fill="#38bdf8" />
              {/* Thermometer / Sick Ice bag */}
              <text x="-30" y="-70" fontSize="55">🤒</text>
            </g>
          </g>

          {/* Plant Pot Body (Terracotta) */}
          <path
            d="M340 920 L740 920 L680 1160 L400 1160 Z"
            fill="url(#potGrad)"
            stroke="#451a03"
            strokeWidth="14"
          />
          {/* Pot Rim */}
          <rect
            x="310"
            y="870"
            width="460"
            height="65"
            rx="16"
            fill="#ea580c"
            stroke="#451a03"
            strokeWidth="12"
          />

          {/* Water Spilling Over Pot Rim */}
          <path
            d={`M320 890 Q430 ${875 + sineWave(frame, 0.2, 12)} 540 890 Q650 ${905 - sineWave(frame, 0.2, 12)} 760 890`}
            stroke="#38bdf8"
            strokeWidth="18"
            fill="none"
            strokeLinecap="round"
          />
          {/* Dripping Water Cascades */}
          <circle cx="330" cy={920 + ((frame * 15) % 240)} r="12" fill="#38bdf8" />
          <circle cx="750" cy={910 + ((frame * 18 + 40) % 240)} r="14" fill="#38bdf8" />
          <circle cx="540" cy={940 + ((frame * 20 + 80) % 240)} r="16" fill="#38bdf8" />
        </g>
      </svg>

      {/* Prominent Warning Badge Floating at Top */}
      <div
        className="absolute top-12 left-1/2 -translate-x-1/2 bg-rose-600/95 text-white font-black px-8 py-3.5 rounded-3xl border-4 border-white shadow-2xl flex items-center gap-3 text-lg uppercase tracking-wider backdrop-blur-md"
        style={{
          transform: `translateX(-50%) scale(${Math.max(0, alertScale)}) rotate(${sineWave(frame, 0.1, 4)}deg)`,
        }}
      >
        <span className="text-3xl">🛑</span>
        <span>ΠΡΟΣΟΧΗ: ΥΠΕΡΒΟΛΙΚΟ ΝΕΡΟ!</span>
      </div>
    </div>
  );
};

// 2. FULL-SCREEN SCENE 2: UNDERGROUND ROOT ASPHYXIA & ROT CARTOON WORLD
export const FullscreenCartoonRootRot: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const bubbleY = (frame * 12) % 600;
  const magnifyingScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const pulse = sineWave(frame, 0.1, 8);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-black">
      <svg
        viewBox="0 0 1080 1920"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="soilTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#573010" />
            <stop offset="100%" stopColor="#291404" />
          </linearGradient>
          <linearGradient id="waterLogGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0369a1" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="0.98" />
          </linearGradient>
          <pattern id="soilGranules" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="3" fill="#78350f" opacity="0.4" />
            <circle cx="30" cy="25" r="4" fill="#451a03" opacity="0.6" />
            <circle cx="20" cy="35" r="2.5" fill="#a16207" opacity="0.3" />
          </pattern>
        </defs>

        {/* Upper Soil Zone (Moist Earth) */}
        <rect x="60" y="200" width="960" height="600" rx="30" fill="url(#soilTop)" />
        <rect x="60" y="200" width="960" height="600" rx="30" fill="url(#soilGranules)" />

        {/* Lower Waterlogged Saturated Anoxic Zone (Blue/Black Swamp) */}
        <rect x="60" y="780" width="960" height="850" rx="30" fill="url(#waterLogGrad)" />
        <rect x="60" y="780" width="960" height="850" rx="30" fill="url(#soilGranules)" opacity="0.3" />

        {/* Flooded Water Line Surface Waves */}
        <path
          d={`M60 780 Q300 ${760 + pulse} 540 780 Q780 ${800 - pulse} 1020 780`}
          stroke="#38bdf8"
          strokeWidth="12"
          fill="none"
        />

        {/* Massive Root System branching throughout soil */}
        <g strokeLinecap="round">
          {/* Main Central Taproot */}
          <path
            d="M540 180 Q530 450 540 750 Q550 1050 545 1400"
            stroke="#78350f"
            strokeWidth="32"
          />

          {/* Healthy Upper Roots (Cream / Bright Tan) */}
          <path d="M540 320 Q360 380 220 480" stroke="#fde047" strokeWidth="18" />
          <path d="M360 380 Q280 460 200 560" stroke="#fde047" strokeWidth="10" />

          <path d="M540 420 Q720 460 880 540" stroke="#fde047" strokeWidth="18" />
          <path d="M720 460 Q820 540 920 620" stroke="#fde047" strokeWidth="10" />

          {/* Decaying Rotten Roots in Swamp Water (Blackened / Necrotic with Holes) */}
          <path
            d="M540 850 Q320 950 180 1150"
            stroke="#09090b"
            strokeWidth="24"
            strokeDasharray="30 15"
          />
          <path
            d="M540 980 Q760 1080 900 1280"
            stroke="#09090b"
            strokeWidth="24"
            strokeDasharray="30 15"
          />
          <path
            d="M545 1150 Q420 1300 300 1480"
            stroke="#09090b"
            strokeWidth="18"
            strokeDasharray="20 10"
          />
          <path
            d="M545 1250 Q680 1400 800 1540"
            stroke="#09090b"
            strokeWidth="18"
            strokeDasharray="20 10"
          />
        </g>

        {/* Trapped Oxygen Bubbles Floating & Popping */}
        <g fill="#38bdf8" opacity="0.75">
          <circle cx="340" cy={1400 - bubbleY} r="16" />
          <circle cx="700" cy={1550 - ((bubbleY + 200) % 700)} r="22" />
          <circle cx="480" cy={1300 - ((bubbleY + 400) % 700)} r="14" />
          <circle cx="820" cy={1450 - ((bubbleY + 100) % 700)} r="18" />
          <circle cx="240" cy={1600 - ((bubbleY + 300) % 700)} r="12" />
        </g>

        {/* Bacteria & Fungal Spores Swarming Roots */}
        <g fill="#ef4444" opacity="0.9">
          {[
            [280, 1050], [380, 1200], [720, 1150], [840, 1320], [450, 1420], [620, 1380]
          ].map(([bx, by], bIdx) => (
            <g key={bIdx} transform={`translate(${bx}, ${by})`}>
              <circle cx="0" cy="0" r="14" />
              <line x1="-20" y1="0" x2="20" y2="0" stroke="#ef4444" strokeWidth="5" />
              <line x1="0" y1="-20" x2="0" y2="20" stroke="#ef4444" strokeWidth="5" />
            </g>
          ))}
        </g>

        {/* Giant Futuristic Magnifying Glass Inspecting Rotten Tissue */}
        <g
          style={{
            transform: `scale(${magnifyingScale}) translate(${sineWave(frame, 0.05, 30)}px, ${sineWave(frame, 0.07, 20)}px)`,
            transformOrigin: '540px 1050px',
          }}
        >
          {/* Glass Lens Reflection */}
          <circle
            cx="540"
            cy="1050"
            r="220"
            fill="#0284c7"
            fillOpacity="0.28"
            stroke="#38bdf8"
            strokeWidth="20"
            filter="drop-shadow(0 25px 40px rgba(0,0,0,0.8))"
          />
          {/* Metallic Lens Handle */}
          <line
            x1="700"
            y1="1210"
            x2="920"
            y2="1430"
            stroke="#e2e8f0"
            strokeWidth="38"
            strokeLinecap="round"
          />
          {/* Red Death Cross inside Lens */}
          <line x1="460" y1="970" x2="620" y2="1130" stroke="#ef4444" strokeWidth="24" strokeLinecap="round" />
          <line x1="620" y1="970" x2="460" y2="1130" stroke="#ef4444" strokeWidth="24" strokeLinecap="round" />
        </g>
      </svg>

      {/* Moisture Gauge Widget Top Right */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-950/95 border-2 border-amber-500 rounded-3xl p-4 flex items-center gap-4 shadow-2xl backdrop-blur-xl">
        <span className="text-4xl">⚠️</span>
        <div>
          <div className="text-xs font-black text-amber-400 uppercase tracking-wide">
            ΥΠΟΓΕΙΑ ΑΣΦΥΞΙΑ ΡΙΖΑΣ
          </div>
          <div className="text-base font-mono font-black text-rose-400">
            99% ΥΓΡΑΣΙΑ • ΜΗΔΕΝ ΟΞΥΓΟΝΟ
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. FULL-SCREEN SCENE 3: SOLUTION / SUNLIGHT / SPRINKLER & BLOSSOM WORLD
export const FullscreenCartoonGrowth: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const sunRotation = frame * 1.2;
  const plantGrowth = spring({ frame: frame - 4, fps, config: { damping: 10, stiffness: 70 } });
  const waterStreamY = (frame * 35) % 400;
  const flowerPop = spring({ frame: frame - 20, fps, config: { damping: 7, stiffness: 150 } });
  const butterflyFloatX = sineWave(frame, 0.06, 90);
  const butterflyFloatY = sineWave(frame, 0.09, 45);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-sky-400 via-emerald-950 to-slate-950">
      <svg
        viewBox="0 0 1080 1920"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#052e16" />
          </linearGradient>
          <linearGradient id="healthyPot" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
          <linearGradient id="wateringCanGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* Sky Background */}
        <rect width="1080" height="1920" fill="url(#skyGrad)" />

        {/* Smiling Radiant Sun (Top Right Corner) */}
        <g transform="translate(860, 240)">
          {/* Rotating Sunrays */}
          <g style={{ transformOrigin: '0 0', transform: `rotate(${sunRotation}deg)` }}>
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
              <line
                key={i}
                x1="0"
                y1="140"
                x2="0"
                y2="190"
                stroke="#fde047"
                strokeWidth="14"
                strokeLinecap="round"
                transform={`rotate(${angle})`}
              />
            ))}
          </g>
          {/* Sun Core */}
          <circle cx="0" cy="0" r="110" fill="#f59e0b" stroke="#fef08a" strokeWidth="12" />
          {/* Happy Sun Eyes & Smile */}
          <circle cx="-35" cy="-20" r="14" fill="#78350f" />
          <circle cx="35" cy="-20" r="14" fill="#78350f" />
          <path d="M-38 25 Q0 60 38 25" stroke="#78350f" strokeWidth="12" fill="none" strokeLinecap="round" />
          {/* Cheerful Blushes */}
          <circle cx="-50" cy="15" r="16" fill="#fb7185" opacity="0.6" />
          <circle cx="50" cy="15" r="16" fill="#fb7185" opacity="0.6" />
        </g>

        {/* Fluffy White Summer Clouds */}
        <path
          d="M120 220 C80 220 50 190 70 150 C50 110 100 80 150 100 C180 60 250 60 280 100 C330 70 380 100 370 150 C410 170 390 220 350 220 Z"
          fill="#ffffff"
          opacity="0.8"
        />

        {/* Animated Green Watering Can Pouring Precision Water */}
        <g
          transform="translate(180, 480)"
          style={{
            transform: `translate(180px, 480px) rotate(${sineWave(frame, 0.08, 6) - 18}deg)`,
            transformOrigin: '50px 50px',
          }}
        >
          {/* Body */}
          <rect x="60" y="80" width="160" height="130" rx="25" fill="url(#wateringCanGrad)" stroke="#064e3b" strokeWidth="10" />
          {/* Handle */}
          <path d="M60 110 C-10 110 -10 190 60 190" stroke="#064e3b" strokeWidth="16" fill="none" strokeLinecap="round" />
          {/* Spout */}
          <path d="M220 160 L320 90" stroke="#064e3b" strokeWidth="20" strokeLinecap="round" />
          {/* Sprinkler Head */}
          <ellipse cx="330" cy="85" rx="20" ry="36" fill="#34d399" stroke="#064e3b" strokeWidth="8" />

          {/* Sparkling Streams of Droplets */}
          {[20, 50, 80].map((xOff, idx) => (
            <g key={idx}>
              <line
                x1={330 + xOff * 0.4}
                y1={110 + ((waterStreamY + idx * 70) % 280)}
                x2={330 + xOff * 0.4}
                y2={145 + ((waterStreamY + idx * 70) % 280)}
                stroke="#38bdf8"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>

        {/* Full-Grown Flourishing Plant (Center Character) */}
        <g transform="translate(0, 160)">
          {/* Pot Saucer Tray (Clean Drainage) */}
          <ellipse cx="540" cy="1320" rx="320" ry="45" fill="#78350f" stroke="#451a03" strokeWidth="10" />

          {/* Plant Growth Group with Spring Upward Surge */}
          <g
            style={{
              transformOrigin: '540px 1050px',
              transform: `scale(${Math.max(0.2, plantGrowth)})`,
            }}
          >
            {/* Massive Healthy Deep Emerald Stem */}
            <path d="M540 1050 Q540 750 540 480" stroke="#15803d" strokeWidth="32" strokeLinecap="round" />

            {/* Left Huge Lush Leaf */}
            <path
              d="M540 850 Q300 750 180 580 Q320 540 540 780"
              fill="#22c55e"
              stroke="#14532d"
              strokeWidth="12"
            />
            {/* Left Leaf Center Vein */}
            <path d="M540 850 Q360 720 220 600" stroke="#86efac" strokeWidth="7" fill="none" />

            {/* Right Huge Lush Leaf */}
            <path
              d="M540 680 Q780 580 900 410 Q760 370 540 610"
              fill="#22c55e"
              stroke="#14532d"
              strokeWidth="12"
            />
            {/* Right Leaf Center Vein */}
            <path d="M540 680 Q720 550 860 430" stroke="#86efac" strokeWidth="7" fill="none" />

            {/* Top Giant Blooming Flower */}
            <g
              transform="translate(540, 460)"
              style={{
                transform: `translate(540px, 460px) scale(${Math.max(0, flowerPop)})`,
              }}
            >
              {/* Petals */}
              {[0, 60, 120, 180, 240, 300].map((deg, pIdx) => (
                <circle
                  key={pIdx}
                  cx="0"
                  cy="-70"
                  r="50"
                  fill="#f43f5e"
                  stroke="#9f1239"
                  strokeWidth="10"
                  transform={`rotate(${deg})`}
                />
              ))}
              {/* Flower Core */}
              <circle cx="0" cy="0" r="55" fill="#facc15" stroke="#ca8a04" strokeWidth="10" />
              {/* Happy Flower Face */}
              <circle cx="-16" cy="-10" r="7" fill="#78350f" />
              <circle cx="16" cy="-10" r="7" fill="#78350f" />
              <path d="M-18 12 Q0 28 18 12" stroke="#78350f" strokeWidth="6" fill="none" strokeLinecap="round" />
            </g>

            {/* Sparkles Around Foliage */}
            <text x="180" y="480" fontSize="70">✨</text>
            <text x="820" y="580" fontSize="70">✨</text>
            <text x="480" y="320" fontSize="70">🌟</text>
          </g>

          {/* Plant Pot Body */}
          <path
            d="M320 1050 L760 1050 L700 1280 L380 1280 Z"
            fill="url(#healthyPot)"
            stroke="#451a03"
            strokeWidth="14"
          />
          {/* Pot Rim */}
          <rect
            x="290"
            y="1000"
            width="500"
            height="65"
            rx="16"
            fill="#ea580c"
            stroke="#451a03"
            strokeWidth="12"
          />
        </g>

        {/* Flying Friendly Butterfly */}
        <g
          transform={`translate(${540 + butterflyFloatX}, ${700 + butterflyFloatY})`}
        >
          <text x="0" y="0" fontSize="80">🦋</text>
        </g>
      </svg>

      {/* Floating Success Pill */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-black px-8 py-3.5 rounded-3xl border-4 border-white shadow-2xl flex items-center gap-3 text-lg uppercase tracking-wide">
        <span className="text-2xl">🌱</span>
        <span>ΧΡΥΣΟΣ ΚΑΝΟΝΑΣ ΦΟΥΝΤΩΜΑΤΟΣ</span>
      </div>
    </div>
  );
};

// 4. FULL-SCREEN SCENE 4: SMARTGARDEN.GR APP BALCONY OASIS CTA WORLD
export const FullscreenCartoonBalconyCTA: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const phoneSpring = spring({ frame, fps, config: { damping: 11, stiffness: 100 } });
  const pulse = spring({ frame: frame % 25, fps, config: { damping: 8, stiffness: 200 } });
  const leafWave = sineWave(frame, 0.08, 10);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-black">
      <svg
        viewBox="0 0 1080 1920"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* Balcony Railing in Background */}
        <line x1="0" y1="900" x2="1080" y2="900" stroke="#475569" strokeWidth="18" />
        <line x1="0" y1="1100" x2="1080" y2="1100" stroke="#475569" strokeWidth="18" />
        {[100, 250, 400, 550, 700, 850, 1000].map((rx, idx) => (
          <line key={idx} x1={rx} y1="850" x2={rx} y2="1350" stroke="#334155" strokeWidth="14" />
        ))}

        {/* Surrounding Lush Plants in Pots on Balcony */}
        <g transform="translate(100, 1050)">
          <text x="0" y="0" fontSize="160" style={{ transform: `rotate(${leafWave}deg)` }}>🪴</text>
        </g>
        <g transform="translate(820, 1050)">
          <text x="0" y="0" fontSize="160" style={{ transform: `rotate(${-leafWave}deg)` }}>🌻</text>
        </g>
        <g transform="translate(160, 500)">
          <text x="0" y="0" fontSize="90">✨</text>
        </g>
        <g transform="translate(860, 420)">
          <text x="0" y="0" fontSize="100">🌿</text>
        </g>
      </svg>

      {/* Giant Animated Modern Smartphone Center-Stage */}
      <div
        className="absolute inset-x-12 top-28 bottom-72 flex flex-col items-center justify-center pointer-events-none"
        style={{
          transform: `scale(${phoneSpring})`,
        }}
      >
        <div className="w-full max-w-md h-[720px] rounded-[52px] bg-slate-950 border-[10px] border-emerald-400 shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_50px_rgba(16,185,129,0.4)] p-6 flex flex-col items-center justify-between">
          {/* Dynamic Island / Speaker */}
          <div className="w-32 h-6 bg-slate-800 rounded-full mb-2 flex items-center justify-end px-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* App UI Screen Inside Smartphone */}
          <div className="w-full flex-1 rounded-[36px] bg-slate-900 border-2 border-slate-800 p-6 flex flex-col items-center justify-between text-center">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-5xl mb-3 shadow-lg shadow-emerald-500/30">
                🌿
              </div>
              <div className="text-3xl font-black text-white tracking-tight">SmartGarden.gr</div>
              <div className="text-base text-emerald-300 font-bold mt-1">Οδηγός Φυτών & Αυτοματισμοί</div>
            </div>

            {/* Pulsing Save Button Inside Phone */}
            <div
              style={{ transform: `scale(${pulse})` }}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-lg flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/50"
            >
              <span>🔖</span>
              <span>ΑΠΟΘΗΚΕΥΣΗ ΟΔΗΓΟΥ</span>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Βρες 70+ αναλυτικά άρθρα & μυστικά γεωπονίας
            </div>
          </div>

          {/* Bottom Home Line */}
          <div className="w-40 h-2 bg-slate-700 rounded-full mt-3" />
        </div>
      </div>
    </div>
  );
};

// Master 2D Animated Fullscreen Scene Router
export const SceneCartoonVisualizer: React.FC<{
  sceneOrder: number;
  totalScenes: number;
  onScreenText: string;
  voiceover: string;
}> = ({ sceneOrder, totalScenes, onScreenText, voiceover }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textLower = (onScreenText + ' ' + voiceover).toLowerCase();

  // Smart detect based on scene order or keywords
  if (sceneOrder === 1 || textLower.includes('λάθος') || textLower.includes('μην') || textLower.includes('σταμάτα')) {
    return <FullscreenCartoonWilting frame={frame} fps={fps} />;
  }

  if (
    sceneOrder === 2 ||
    textLower.includes('ρίζ') ||
    textLower.includes('ασφυξ') ||
    textLower.includes('πρόβλημα') ||
    textLower.includes('σαπίζ')
  ) {
    return <FullscreenCartoonRootRot frame={frame} fps={fps} />;
  }

  if (
    sceneOrder === 3 ||
    textLower.includes('tip') ||
    textLower.includes('βήμα') ||
    textLower.includes('στράγγιση') ||
    textLower.includes('ήλιος') ||
    textLower.includes('λίπασμα')
  ) {
    return <FullscreenCartoonGrowth frame={frame} fps={fps} />;
  }

  return <FullscreenCartoonBalconyCTA frame={frame} fps={fps} />;
};
