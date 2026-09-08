import React, { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX, Sparkles, Film, Cpu } from 'lucide-react';

interface AnimatedShortVideoProps {
  title: string;
  category: string;
  summary?: string;
  staticImage: string;
  isHovered: boolean;
  /** True only for the handful of cards visible above the fold on load — these get
   * eager+high-priority loading so the browser prioritizes the real LCP candidate
   * instead of racing it against dozens of below-the-fold card images. */
  priority?: boolean;
}

export const AnimatedShortVideo: React.FC<AnimatedShortVideoProps> = ({
  title,
  category,
  summary,
  staticImage,
  isHovered,
  priority = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound generator using Web Audio API with soothing organic harmonies & cyber chimes
  const playSoundBeat = (timeSec: number, sceneType: string) => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (sceneType === 'mower' || sceneType === 'iot') {
        // Tech chime
        osc.type = 'triangle';
        const techNotes = [523.25, 659.25, 783.99, 1046.5];
        const n = techNotes[Math.floor(timeSec * 2) % techNotes.length];
        osc.frequency.setValueAtTime(n, ctx.currentTime);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      } else {
        // Organic botanical harmonic
        osc.type = 'sine';
        const notes = [329.63, 392.0, 440.0, 493.88, 587.33, 659.25]; // E minor / G major pentatonic
        const noteIdx = Math.floor(timeSec / 1.5) % notes.length;
        osc.frequency.setValueAtTime(notes[noteIdx], ctx.currentTime);
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch {
      // Audio playback safety catch
    }
  };

  useEffect(() => {
    if (!isHovered) {
      setIsPlaying(false);
      setSecondsLeft(15);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimeRef.current = null;
      return;
    }

    setIsPlaying(true);
    startTimeRef.current = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect exact scene archetype from title, category & summary
    const textCorpus = (title + ' ' + category + ' ' + (summary || '')).toLowerCase();
    
    let sceneType = 'botanical';
    if (textCorpus.includes('ακτινιδ') || textCorpus.includes('kiwi') || textCorpus.includes('actinidia')) {
      sceneType = 'kiwi';
    } else if (textCorpus.includes('χλοοκοπτ') || textCorpus.includes('mower') || textCorpus.includes('lidar') || textCorpus.includes('rtk') || category === 'robotic_mowers') {
      sceneType = 'mower';
    } else if (textCorpus.includes('αισθητηρ') || textCorpus.includes('iot') || textCorpus.includes('zigbee') || textCorpus.includes('ποτισμ') || category === 'irrigation_iot') {
      sceneType = 'iot';
    } else if (textCorpus.includes('ντοματ') || textCorpus.includes('πιπερι') || textCorpus.includes('λαχανο') || category === 'vegetable_garden') {
      sceneType = 'vegetables';
    } else if (textCorpus.includes('καθετ') || textCorpus.includes('vertical') || textCorpus.includes('wall') || textCorpus.includes('πανελ')) {
      sceneType = 'vertical_garden';
    } else if (textCorpus.includes('τετρανυχ') || textCorpus.includes('μελιγκρ') || textCorpus.includes('neem') || textCorpus.includes('πασχαλιτσ') || textCorpus.includes('βιολογικ')) {
      sceneType = 'pest_defense';
    } else if (textCorpus.includes('bokashi') || textCorpus.includes('κομποστ') || textCorpus.includes('σκουληκ') || textCorpus.includes('worm')) {
      sceneType = 'bokashi';
    } else if (textCorpus.includes('γαρδενι') || textCorpus.includes('καμελι') || textCorpus.includes('ορτανσι') || textCorpus.includes('οξυφιλ') || textCorpus.includes('χλωρωσ')) {
      sceneType = 'acidophilic';
    } else if (textCorpus.includes('μεσογειακ') || textCorpus.includes('βουκαμβιλ') || textCorpus.includes('καυσων') || textCorpus.includes('γιασεμ') || textCorpus.includes('πυξαρ')) {
      sceneType = 'mediterranean_heat';
    } else if (textCorpus.includes('ελια') || textCorpus.includes('ελιά') || textCorpus.includes('olive') || textCorpus.includes('μπονσαι') || textCorpus.includes('bonsai') || textCorpus.includes('λεμον')) {
      sceneType = 'bonsai_citrus';
    }

    let lastBeat = -1;

    const render = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;
      const loopTime = elapsed % 15; // 15 seconds full loop
      const currentRemaining = Math.max(0, 15 - Math.floor(loopTime));
      setSecondsLeft(currentRemaining);

      // Sound beat trigger
      if (Math.floor(loopTime) !== lastBeat) {
        lastBeat = Math.floor(loopTime);
        if (lastBeat % 2 === 0) {
          playSoundBeat(loopTime, sceneType);
        }
      }

      const w = canvas.width;
      const h = canvas.height;

      // ==========================================
      // 1. DYNAMIC CINEMATIC BACKGROUNDS & AMBIENCE
      // ==========================================
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      
      if (sceneType === 'mower') {
        // High-tech emerald cyan grid
        bgGrad.addColorStop(0, '#022c22');
        bgGrad.addColorStop(0.5, '#064e3b');
        bgGrad.addColorStop(1, '#020617');
      } else if (sceneType === 'mediterranean_heat') {
        // Aegean Summer Sky with warm terracotta sunset transition
        if (loopTime < 7) {
          bgGrad.addColorStop(0, '#0284c7');
          bgGrad.addColorStop(0.5, '#38bdf8');
          bgGrad.addColorStop(1, '#fef08a');
        } else {
          bgGrad.addColorStop(0, '#7c2d12');
          bgGrad.addColorStop(0.5, '#c2410c');
          bgGrad.addColorStop(1, '#1e1b4b');
        }
      } else if (sceneType === 'iot') {
        // Cyber-Telemetry Deep Indigo & Aqua
        bgGrad.addColorStop(0, '#0b132b');
        bgGrad.addColorStop(0.5, '#1c2541');
        bgGrad.addColorStop(1, '#0f172a');
      } else if (sceneType === 'acidophilic') {
        // Rich twilight jade to amethyst
        bgGrad.addColorStop(0, '#134e4a');
        bgGrad.addColorStop(0.5, '#0f766e');
        bgGrad.addColorStop(1, '#3b0764');
      } else {
        // Fresh Morning Greenhouse Sunrise
        bgGrad.addColorStop(0, '#064e3b');
        bgGrad.addColorStop(0.6, '#065f46');
        bgGrad.addColorStop(1, '#0f172a');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Atmospheric glowing particles / spores / fireflies
      const particleCount = 24;
      for (let i = 0; i < particleCount; i++) {
        const px = (Math.sin(loopTime * 0.7 + i * 1.8) * 0.5 + 0.5) * w;
        const py = ((i * 32 + loopTime * 22) % h);
        const pAlpha = 0.15 + (Math.sin(loopTime * 3 + i) * 0.1 + 0.1);
        ctx.fillStyle = sceneType === 'mower' ? `rgba(56, 189, 248, ${pAlpha})` : `rgba(167, 243, 208, ${pAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, (i % 3) + 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();

      // ==========================================
      // 2. SCENE-SPECIFIC HIGH-CRAFT ANIMATIONS
      // ==========================================

      // ------------------------------------------
      // A. KIWI (Actinidia deliciosa) ORCHARD SCENE
      // ------------------------------------------
      if (sceneType === 'kiwi') {
        // 1. T-Bar Trellis Structure with depth perspective
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        // Center Pillar
        ctx.moveTo(w * 0.5, h * 0.95);
        ctx.lineTo(w * 0.5, h * 0.32);
        // Diagonal braces
        ctx.moveTo(w * 0.5, h * 0.48);
        ctx.lineTo(w * 0.32, h * 0.32);
        ctx.moveTo(w * 0.5, h * 0.48);
        ctx.lineTo(w * 0.68, h * 0.32);
        // Top Horizontal Crossbeam
        ctx.moveTo(w * 0.12, h * 0.32);
        ctx.lineTo(w * 0.88, h * 0.32);
        ctx.stroke();

        // 3 High-Tensile Steel Galvanized Wires vibrating in the breeze
        const wireWave = Math.sin(loopTime * 5) * 1.5;
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
        ctx.lineWidth = 1.8;
        [-16, 0, 16].forEach((offsetY) => {
          ctx.beginPath();
          ctx.moveTo(w * 0.08, h * 0.32 + offsetY + wireWave);
          ctx.lineTo(w * 0.92, h * 0.32 + offsetY - wireWave);
          ctx.stroke();
        });

        // 2. Dynamic Climbing Vine Trunk Wrapping Upwards
        const growthProg = Math.min(1, loopTime / 8);
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(w * 0.5, h * 0.95);
        const steps = 36;
        for (let s = 0; s <= steps * growthProg; s++) {
          const tNorm = s / steps;
          const vy = h * 0.95 - tNorm * (h * 0.63);
          const vx = w * 0.5 + Math.sin(tNorm * Math.PI * 7 + loopTime * 2) * 14;
          ctx.lineTo(vx, vy);
        }
        ctx.stroke();

        // Lateral Canes across the wires
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(w * 0.5 - (w * 0.38 * growthProg), h * 0.32 + Math.sin(loopTime) * 3);
        ctx.lineTo(w * 0.5 + (w * 0.38 * growthProg), h * 0.32 - Math.sin(loopTime) * 3);
        ctx.stroke();

        // 3. Cordate (Heart-Shaped) Broad Leaves Fluttering
        const leafPositions = [
          { x: w * 0.22, y: h * 0.28, rot: -0.3, s: 1.1 },
          { x: w * 0.36, y: h * 0.26, rot: 0.2, s: 0.9 },
          { x: w * 0.5, y: h * 0.24, rot: 0, s: 1.3 },
          { x: w * 0.64, y: h * 0.27, rot: -0.2, s: 1.0 },
          { x: w * 0.78, y: h * 0.29, rot: 0.4, s: 1.15 },
        ];

        leafPositions.forEach((lp, i) => {
          const sway = Math.sin(loopTime * 3.5 + i * 1.5) * 0.15;
          ctx.save();
          ctx.translate(lp.x, lp.y);
          ctx.rotate(lp.rot + sway);
          ctx.scale(lp.s, lp.s);

          // Deep green leaf blade
          ctx.fillStyle = i % 2 === 0 ? '#166534' : '#15803d';
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 16, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // Golden leaf edge highlight
          ctx.strokeStyle = '#4ade80';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(18, 0);
          ctx.stroke();
          ctx.restore();
        });

        // 4. Hanging Kiwi Fruits with Fuzzy Skin & Cut-Section Reveal
        const fruits = [
          { x: w * 0.28, y: h * 0.46, phase: 0 },
          { x: w * 0.5, y: h * 0.48, phase: 2 },
          { x: w * 0.72, y: h * 0.44, phase: 4 },
        ];

        fruits.forEach((f, idx) => {
          const fruitSway = Math.sin(loopTime * 3 + f.phase) * 6;
          const fx = f.x + fruitSway;
          const fy = f.y;

          // Pedicel (Stem)
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(f.x, h * 0.32);
          ctx.lineTo(fx, fy - 18);
          ctx.stroke();

          // Reveal Cut Kiwi on Center Fruit at Phase 3 (loopTime > 7.5s)
          if (loopTime > 7.5 && idx === 1) {
            // Cut Cross Section
            ctx.fillStyle = '#65a30d'; // vibrant kiwi green
            ctx.beginPath();
            ctx.ellipse(fx, fy, 22, 28, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#78350f'; // fuzzy skin border
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Light sun rays in flesh
            ctx.strokeStyle = '#84cc16';
            ctx.lineWidth = 1.2;
            for (let r = 0; r < 14; r++) {
              const ang = (r / 14) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(fx + Math.cos(ang) * 7, fy + Math.sin(ang) * 9);
              ctx.lineTo(fx + Math.cos(ang) * 18, fy + Math.sin(ang) * 23);
              ctx.stroke();
            }

            // White central core
            ctx.fillStyle = '#fef9c3';
            ctx.beginPath();
            ctx.ellipse(fx, fy, 6, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ring of crunchy black seeds
            for (let sd = 0; sd < 10; sd++) {
              const ang = (sd / 10) * Math.PI * 2;
              const sx = fx + Math.cos(ang) * 13;
              const sy = fy + Math.sin(ang) * 17;
              ctx.fillStyle = '#0f172a';
              ctx.beginPath();
              ctx.arc(sx, sy, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Whole Oval Kiwi with Fuzzy Skin Texture
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(fx, fy, 19, 26, fruitSway * 0.04, 0, Math.PI * 2);
            ctx.fill();

            // Highlights
            ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
            ctx.beginPath();
            ctx.ellipse(fx - 5, fy - 6, 8, 14, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // 5. Automatic IoT Drip Irrigation Droplets + Soil Halo
        const dripDropY = (loopTime * 120) % (h * 0.65);
        ctx.fillStyle = '#38bdf8';
        [w * 0.35, w * 0.5, w * 0.65].forEach((dx, dIdx) => {
          const dy = h * 0.32 + (dripDropY + dIdx * 35) % (h * 0.63);
          ctx.beginPath();
          ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Moisture rings in soil
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.95, 60 + Math.sin(loopTime * 3) * 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();

      // ------------------------------------------
      // B. ROBOTIC MOWERS / 3D LIDAR / RTK-GPS SCENE
      // ------------------------------------------
      } else if (sceneType === 'mower') {
        // 1. Manicured Lawn with Dynamic Striped Cutting Pattern
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, h * 0.4, w, h * 0.6);

        // Striped pattern
        const stripeWidth = 36;
        for (let sx = 0; sx < w + stripeWidth; sx += stripeWidth) {
          ctx.fillStyle = (Math.floor(sx / stripeWidth) % 2 === 0) ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(sx - (loopTime * 15 % stripeWidth), h * 0.4, stripeWidth, h * 0.6);
        }

        // 2. Overhead Satellite Orbit & RTK Precision Beam
        const satX = (Math.sin(loopTime * 0.8) * 0.35 + 0.5) * w;
        const satY = h * 0.12;

        // Satellite body
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(satX - 12, satY - 6, 24, 12);
        // Solar panels
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(satX - 32, satY - 4, 18, 8);
        ctx.fillRect(satX + 14, satY - 4, 18, 8);

        // RTK Pulsed Laser Guide Beam down to Mower
        const mowerX = (Math.sin(loopTime * 1.5) * 0.38 + 0.5) * w;
        const mowerY = h * 0.68 + Math.sin(loopTime * 3) * 10;
        const movingRight = Math.cos(loopTime * 1.5) >= 0;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(satX, satY);
        ctx.lineTo(mowerX, mowerY - 18);
        ctx.stroke();
        ctx.setLineDash([]);

        // RTK Target Accuracy HUD Ring
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mowerX, mowerY - 18, 8 + Math.sin(loopTime * 8) * 3, 0, Math.PI * 2);
        ctx.stroke();

        // 3. 360° 3D LiDAR Rotating Scanning Cone
        const lidarAngle = loopTime * 8;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
        ctx.beginPath();
        ctx.moveTo(mowerX, mowerY);
        ctx.arc(mowerX, mowerY, 70, lidarAngle, lidarAngle + Math.PI * 0.45);
        ctx.closePath();
        ctx.fill();

        // 4. Robotic Mower Chassis (Sleek aerodynamic body)
        ctx.save();
        ctx.translate(mowerX, mowerY);
        if (!movingRight) ctx.scale(-1, 1);

        // Body Shell
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(-30, -18, 60, 36, 10);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Glowing Cyber Accent Strip
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, -12);
        ctx.lineTo(15, -12);
        ctx.stroke();

        // LED Headlights Beam
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.moveTo(25, -6);
        ctx.lineTo(90, -35);
        ctx.lineTo(90, 20);
        ctx.closePath();
        ctx.fill();

        // Headlight bulbs
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(26, -6, 3.5, 0, Math.PI * 2);
        ctx.arc(26, 6, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // All-Terrain Heavy Tread Wheels
        ctx.fillStyle = '#334155';
        ctx.fillRect(-26, -22, 14, 6);
        ctx.fillRect(-26, 16, 14, 6);
        ctx.fillRect(12, -22, 14, 6);
        ctx.fillRect(12, 16, 14, 6);

        ctx.restore();

        // 5. Grass Clippings flying out
        for (let g = 0; g < 12; g++) {
          const gx = mowerX - (movingRight ? 1 : -1) * (25 + (g * 5 + loopTime * 40) % 50);
          const gy = mowerY + (Math.sin(loopTime * 10 + g) * 12);
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(gx, gy, 3, 2);
        }

      // ------------------------------------------
      // C. SMART IOT IRRIGATION & SOIL SENSORS SCENE
      // ------------------------------------------
      } else if (sceneType === 'iot') {
        // Soil Layer & Root System Cross Section
        ctx.fillStyle = '#451a03';
        ctx.fillRect(0, h * 0.55, w, h * 0.45);

        // Capillary Root System
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.25, h * 0.55);
        ctx.lineTo(w * 0.22, h * 0.72);
        ctx.lineTo(w * 0.16, h * 0.88);
        ctx.moveTo(w * 0.22, h * 0.72);
        ctx.lineTo(w * 0.32, h * 0.85);
        ctx.stroke();

        // 7-in-1 Soil Sensor Stainless Steel Probes
        const sensorX = w * 0.45;
        const sensorY = h * 0.42;

        // Sensor Head Module
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(sensorX - 18, sensorY - 35, 36, 40, 6);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        // OLED Display on Sensor Head
        ctx.fillStyle = '#022c22';
        ctx.fillRect(sensorX - 14, sensorY - 30, 28, 18);
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`${(45 + Math.sin(loopTime * 3) * 8).toFixed(0)}%`, sensorX - 11, sensorY - 18);

        // Stainless Steel Probes into soil
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(sensorX - 10, sensorY + 5, 4, 55);
        ctx.fillRect(sensorX - 2, sensorY + 5, 4, 55);
        ctx.fillRect(sensorX + 6, sensorY + 5, 4, 55);

        // Pulsing IoT Radio Waves (Zigbee 3.0 Telemetry)
        const waveR = (loopTime * 35) % 65;
        ctx.strokeStyle = `rgba(52, 211, 153, ${Math.max(0, 1 - waveR / 65)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sensorX, sensorY - 35, waveR, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();

        // Smart Dripper Pipe & Micro-Sprinkler
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, h * 0.53, w, 8); // Lateral line

        // Water droplet diffusion halos deep in soil
        const diffuseAlpha = Math.sin(loopTime * 4) * 0.2 + 0.3;
        ctx.fillStyle = `rgba(56, 189, 248, ${diffuseAlpha})`;
        ctx.beginPath();
        ctx.ellipse(w * 0.75, h * 0.75, 45, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Micro-Drip Emitter Dropping Water
        const dropY = (h * 0.54 + (loopTime * 90) % (h * 0.35));
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(w * 0.75, dropY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Holographic Telemetry HUD Panel
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.roundRect(w * 0.62, h * 0.08, 105, 70, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('📡 IOT TELEMETRY', w * 0.65, h * 0.16);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '8px monospace';
        ctx.fillText(`VWC:  ${(55 + Math.sin(loopTime) * 4).toFixed(1)}%`, w * 0.65, h * 0.24);
        ctx.fillText(`EC:   1.42 mS/cm`, w * 0.65, h * 0.31);
        ctx.fillText(`TEMP: 21.8 °C`, w * 0.65, h * 0.38);

      // ------------------------------------------
      // D. MEDITERRANEAN HEATWAVE & BOUGAINVILLEA
      // ------------------------------------------
      } else if (sceneType === 'mediterranean_heat') {
        // Sea horizon & White Greek Balcony Balustrade
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, h * 0.35, w, h * 0.3);

        // White Balustrade
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, h * 0.55, w, 10);
        for (let b = 15; b < w; b += 35) {
          ctx.fillRect(b, h * 0.55, 12, 45);
        }
        ctx.fillRect(0, h * 0.7, w, h * 0.3);

        // Cascading Vibrant Magenta Bougainvillea Vine
        const bougX = w * 0.2;
        const bougY = h * 0.15;
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bougX, 0);
        ctx.quadraticCurveTo(w * 0.45, h * 0.35, w * 0.65, h * 0.7);
        ctx.stroke();

        // Magenta Petals Clusters
        const flowerClusters = 18;
        for (let fc = 0; fc < flowerClusters; fc++) {
          const tFrac = fc / flowerClusters;
          const cx = bougX + (w * 0.45 * tFrac) + Math.sin(loopTime * 3 + fc) * 6;
          const cy = (h * 0.15) + (h * 0.55 * tFrac) + Math.cos(loopTime * 2 + fc) * 4;

          // 3-Bract magenta flower
          ctx.fillStyle = fc % 3 === 0 ? '#ec4899' : '#db2777';
          for (let bp = 0; bp < 3; bp++) {
            const bAng = (bp / 3) * Math.PI * 2 + loopTime * 0.5;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(bAng) * 9, cy + Math.sin(bAng) * 9, 8, 12, bAng, 0, Math.PI * 2);
            ctx.fill();
          }
          // White flower center
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // 40% Shading Net (Agrotextile) Deploying from Top in Midday Sun
        if (loopTime > 4 && loopTime < 12) {
          const shadeProg = Math.min(1, (loopTime - 4) / 2);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
          ctx.fillRect(0, 0, w * shadeProg, h * 0.45);
          // Net grid lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          for (let nx = 0; nx < w * shadeProg; nx += 12) {
            ctx.beginPath();
            ctx.moveTo(nx, 0);
            ctx.lineTo(nx, h * 0.45);
            ctx.stroke();
          }
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('☀️ 40% ΔΙΧΤΥ ΣΚΙΑΣΗΣ (-6°C)', 15, 22);
        }

      // ------------------------------------------
      // E. URBAN VEGETABLE GARDEN & CHERRY TOMATOES
      // ------------------------------------------
      } else if (sceneType === 'vegetables') {
        // Balcony Planter Box
        const potX = w * 0.5;
        const potY = h * 0.82;
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(w * 0.15, potY, w * 0.7, 45, 6);
        ctx.fill();

        // Lush Tomato Vine
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(potX, potY);
        ctx.quadraticCurveTo(potX - 30, h * 0.5, potX, h * 0.25);
        ctx.stroke();

        // Tomato Clusters Ripening (Green -> Yellow -> Deep Red)
        const toms = [
          { x: potX - 35, y: h * 0.42 },
          { x: potX - 20, y: h * 0.46 },
          { x: potX + 25, y: h * 0.35 },
          { x: potX + 38, y: h * 0.39 },
        ];

        toms.forEach((tm, i) => {
          const ripenProg = Math.min(1, (loopTime + i * 2) / 10);
          ctx.fillStyle = ripenProg < 0.4 ? '#84cc16' : ripenProg < 0.7 ? '#facc15' : '#ef4444';
          ctx.beginPath();
          ctx.arc(tm.x, tm.y, 11, 0, Math.PI * 2);
          ctx.fill();

          // Green sepals (star top)
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.arc(tm.x, tm.y - 10, 4, 0, Math.PI * 2);
          ctx.fill();

          // Shine highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(tm.x - 3, tm.y - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Animated Honeybee Flying with flapping wings
        const beeX = (Math.sin(loopTime * 2) * 0.35 + 0.5) * w;
        const beeY = h * 0.28 + Math.sin(loopTime * 8) * 8;
        
        // Bee body
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(beeX, beeY, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Black stripes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(beeX - 3, beeY - 5, 2.5, 10);
        ctx.fillRect(beeX + 2, beeY - 5, 2.5, 10);
        // Wings flapping
        const wingFlap = Math.sin(loopTime * 35) * 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(beeX - 2, beeY - 6 + wingFlap, 5, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

      // ------------------------------------------
      // F. BONSAI & CITRUS / OLIVE SCENE
      // ------------------------------------------
      } else if (sceneType === 'bonsai_citrus') {
        // Ceramic Bonsai Tray
        const trayX = w * 0.5;
        const trayY = h * 0.85;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(trayX - 65, trayY, 130, 22, 4);
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Gnarled Ancient Bonsai Trunk
        ctx.strokeStyle = '#573010';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(trayX, trayY);
        ctx.quadraticCurveTo(trayX - 25, h * 0.65, trayX + 15, h * 0.45);
        ctx.lineTo(trayX + 35, h * 0.32);
        ctx.stroke();

        // Secondary Jin Deadwood Branch
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(trayX - 15, h * 0.62);
        ctx.lineTo(trayX - 38, h * 0.52);
        ctx.stroke();

        // Dense Foliage Pads (Clouds of leaves)
        const pads = [
          { x: trayX + 35, y: h * 0.3 },
          { x: trayX - 20, y: h * 0.42 },
          { x: trayX + 50, y: h * 0.45 },
        ];

        pads.forEach((pad, pIdx) => {
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.ellipse(pad.x, pad.y, 28, 14, Math.sin(loopTime + pIdx) * 0.05, 0, Math.PI * 2);
          ctx.fill();

          // Golden Olives / Lemons
          const fruitX = pad.x + (pIdx === 0 ? 8 : -8);
          const fruitY = pad.y + 12;
          ctx.fillStyle = title.toLowerCase().includes('λεμον') ? '#facc15' : '#65a30d';
          ctx.beginPath();
          ctx.ellipse(fruitX, fruitY, 6, 8, 0.2, 0, Math.PI * 2);
          ctx.fill();
        });

      // ------------------------------------------
      // G. UNIVERSAL BOTANICAL & GREENHOUSE SCENE
      // ------------------------------------------
      } else {
        // Sprouting Seedling to Glorious Blossom
        const seedX = w * 0.5;
        const seedY = h * 0.85;

        // Pot
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(seedX - 35, seedY - 25);
        ctx.lineTo(seedX + 35, seedY - 25);
        ctx.lineTo(seedX + 24, seedY + 20);
        ctx.lineTo(seedX - 24, seedY + 20);
        ctx.closePath();
        ctx.fill();

        // Growing Stem
        const growthT = Math.min(1, loopTime / 10);
        const stemHeight = 90 * growthT;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(seedX, seedY - 25);
        ctx.quadraticCurveTo(
          seedX + Math.sin(loopTime * 2) * 10,
          seedY - 25 - stemHeight * 0.5,
          seedX + Math.sin(loopTime) * 6,
          seedY - 25 - stemHeight
        );
        ctx.stroke();

        // Sprouting leaves
        for (let l = 0; l < 5; l++) {
          const lFrac = (l + 1) / 6;
          if (growthT >= lFrac) {
            const side = l % 2 === 0 ? 1 : -1;
            const lx = seedX + side * 22;
            const ly = seedY - 25 - stemHeight * lFrac;
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.ellipse(lx, ly, 15, 8, side * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Flower Bloom after 6s
        if (loopTime > 5.5) {
          const bloomScale = Math.min(1, (loopTime - 5.5) / 4);
          const topX = seedX + Math.sin(loopTime) * 6;
          const topY = seedY - 25 - stemHeight;

          // Petals
          ctx.fillStyle = '#38bdf8';
          for (let p = 0; p < 6; p++) {
            const pAng = (p / 6) * Math.PI * 2 + loopTime * 0.4;
            const px = topX + Math.cos(pAng) * (14 * bloomScale);
            const py = topY + Math.sin(pAng) * (14 * bloomScale);
            ctx.beginPath();
            ctx.arc(px, py, 7 * bloomScale, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(topX, topY, 6 * bloomScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // ==========================================
      // 3. MOTION GRAPHICS HUD & DYNAMIC BANNER
      // ==========================================
      // Bottom Progress Subtitle Bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, h - 38, w, 38);

      // Progress Bar Line (0-15s)
      const progWidth = (loopTime / 15) * w;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, h - 40, progWidth, 2);

      // Phase Description Label
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';

      let phaseText = '🌱 Φάση 1: Εγκατάσταση & Βιολογία Φυτού';
      if (loopTime >= 5 && loopTime < 10) {
        phaseText = sceneType === 'mower' 
          ? '🛰️ Φάση 2: RTK-GPS Δορυφορική Πλοήγηση & LiDAR'
          : '💧 Φάση 2: Έξυπνο Πότισμα & Αυτοματισμοί IoT';
      } else if (loopTime >= 10) {
        phaseText = sceneType === 'mower'
          ? '✨ Φάση 3: Τέλειο Κούρεμα & Εξοικονόμηση Χρόνου'
          : '✨ Φάση 3: Μέγιστη Ανθοφορία, Απόδοση & Συγκομιδή';
      }

      ctx.fillText(phaseText, 14, h - 16);

      // Top Glass Banner with Title
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, w, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`🎬 15s Animated Short • ${title.slice(0, 36)}...`, 12, 18);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered, title, category, summary, soundEnabled]);

  // The grid card renders this image at ~350px CSS width, but every staticImage URL
  // requests Unsplash's full w=1200 render — 3-4x more bytes than the card ever
  // displays, across up to dozens of cards on the homepage. Downscale the request to
  // a size that's still sharp on a 2x/retina card without paying for pixels no one
  // sees (found via a real PageSpeed Insights run: 2026-09-09, LCP was 9-16s).
  // Card is a fixed h-52 (208px) box at a ~1.95:1 width:height ratio on mobile, but
  // Unsplash's fit=crop only actually crops when both w and h are given — without h
  // it just proportionally resizes the source, so the delivered image keeps whatever
  // portrait/landscape ratio the original photo had. That mismatch between the
  // image's natural size and its displayed CSS box is what Lighthouse's "Displays
  // images with correct aspect ratio" Best Practices audit flags (only visible once
  // the LCP candidate is eager-loaded and actually finishes before the trace ends).
  // Requesting a matching h here crops server-side to the real display ratio, fixing
  // the audit and shaving a few more bytes; object-cover still handles any further
  // fit on wider desktop grid columns exactly as it does today.
  const cardImageWidth = 700;
  const cardImageHeight = Math.round(cardImageWidth / 1.95);
  let cardImageSrc = (staticImage || "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80")
    .replace(/([?&])w=\d+/, `$1w=${cardImageWidth}`);
  cardImageSrc = /[?&]h=\d+/.test(cardImageSrc)
    ? cardImageSrc.replace(/([?&])h=\d+/, `$1h=${cardImageHeight}`)
    : cardImageSrc.replace(/([?&])w=\d+/, `$1w=${cardImageWidth}&h=${cardImageHeight}`);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
      {/* Static Image when not hovered */}
      <img
        src={cardImageSrc}
        alt={title}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&auto=format&fit=crop&q=80";
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100 group-hover:scale-105'
        }`}
      />

      {/* Short Video Animated Canvas when hovered */}
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className={`w-full h-full absolute inset-0 object-cover transition-opacity duration-300 ${
          isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Live 15s Video Badge & Timer */}
      {isPlaying ? (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            className="p-1.5 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-slate-200 text-[10px] border border-slate-700 backdrop-blur transition-all flex items-center gap-1 cursor-pointer"
            title={soundEnabled ? 'Σίγαση' : 'Ενεργοποίηση Ήχου'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          <div className="px-2.5 py-1 rounded-lg bg-rose-600/90 text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow-lg animate-pulse border border-rose-400/40 backdrop-blur">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            LIVE 15s • {secondsLeft}s
          </div>
        </div>
      ) : (
        <div className="absolute bottom-3 right-3 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1.5 backdrop-blur shadow-lg">
            <Film className="w-3 h-3 text-emerald-400" />
            Hover για 15s AI Video
          </span>
        </div>
      )}
    </div>
  );
};
