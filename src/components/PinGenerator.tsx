import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Image as ImageIcon, RefreshCw, Sparkles } from 'lucide-react';
import { Article, Language } from '../types';

interface PinGeneratorProps {
  articlesList: Article[];
  lang: Language;
}

const PIN_WIDTH = 1000;
const PIN_HEIGHT = 1500;

// Simple canvas word-wrap helper: splits text into lines that fit maxWidth.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const testLine = `${currentLine} ${words[i]}`;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export const PinGenerator: React.FC<PinGeneratorProps> = ({ articlesList, lang }) => {
  const [selectedId, setSelectedId] = useState<string>(articlesList[0]?.id || '');
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedArticle = articlesList.find((a) => a.id === selectedId) || articlesList[0];

  const renderPin = useCallback(() => {
    const canvas = canvasRef.current;
    const article = selectedArticle;
    if (!canvas || !article) return;

    setIsRendering(true);
    setError(null);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = PIN_WIDTH;
    canvas.height = PIN_HEIGHT;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Cover-fit crop: scale image to fully cover the canvas, centered
      const scale = Math.max(PIN_WIDTH / img.width, PIN_HEIGHT / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const dx = (PIN_WIDTH - drawW) / 2;
      const dy = (PIN_HEIGHT - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);

      // Dark gradient overlay (bottom 60%) for text legibility
      const gradient = ctx.createLinearGradient(0, PIN_HEIGHT * 0.35, 0, PIN_HEIGHT);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.55, 'rgba(0,0,0,0.55)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.88)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, PIN_WIDTH, PIN_HEIGHT);

      // Category pill (top-left)
      const categoryText = (article.categoryLabel?.[lang] || '').toUpperCase();
      if (categoryText) {
        ctx.font = '700 28px Arial, sans-serif';
        const pillPaddingX = 28;
        const pillWidth = ctx.measureText(categoryText).width + pillPaddingX * 2;
        const pillHeight = 64;
        const pillX = 48;
        const pillY = 48;
        ctx.fillStyle = 'rgba(5, 150, 105, 0.95)'; // emerald-600
        ctx.beginPath();
        // @ts-ignore - roundRect has broad browser support
        if (ctx.roundRect) {
          // @ts-ignore
          ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 32);
        } else {
          ctx.rect(pillX, pillY, pillWidth, pillHeight);
        }
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(categoryText, pillX + pillPaddingX, pillY + pillHeight / 2 + 2);
      }

      // Title (bottom area, word-wrapped, bold white)
      const title = article.title[lang] || '';
      const maxTextWidth = PIN_WIDTH - 96;
      let fontSize = 76;
      ctx.textBaseline = 'alphabetic';
      let lines: string[] = [];

      // Shrink font until it fits in max 5 lines
      do {
        ctx.font = `800 ${fontSize}px Arial, sans-serif`;
        lines = wrapText(ctx, title, maxTextWidth);
        if (lines.length <= 5) break;
        fontSize -= 4;
      } while (fontSize > 36);

      const lineHeight = fontSize * 1.18;
      const brandBarHeight = 140;
      let textY = PIN_HEIGHT - brandBarHeight - 40 - (lines.length - 1) * lineHeight;

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 12;
      lines.forEach((line) => {
        ctx.fillText(line, 48, textY);
        textY += lineHeight;
      });
      ctx.shadowBlur = 0;

      // Bottom brand bar
      ctx.fillStyle = 'rgba(4, 47, 33, 0.92)'; // deep emerald-950
      ctx.fillRect(0, PIN_HEIGHT - brandBarHeight, PIN_WIDTH, brandBarHeight);
      ctx.font = '800 42px Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌱 SmartGarden', 48, PIN_HEIGHT - brandBarHeight / 2 - 8);
      ctx.font = '400 26px Arial, sans-serif';
      ctx.fillStyle = '#a7f3d0'; // emerald-200
      ctx.fillText(lang === 'el' ? 'Οδηγοί Μπαλκονιού & Κήπου' : 'Balcony & Garden Guides', 48, PIN_HEIGHT - brandBarHeight / 2 + 30);

      setIsRendering(false);
    };

    img.onerror = () => {
      setError(lang === 'el' ? 'Δεν φορτώθηκε η εικόνα του άρθρου. Δοκίμασε άλλο άρθρο.' : 'Could not load the article image. Try another article.');
      setIsRendering(false);
    };

    img.src = article.image;
  }, [selectedArticle, lang]);

  useEffect(() => {
    renderPin();
  }, [renderPin]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedArticle) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pin-${selectedArticle.slug || selectedArticle.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div id="pin-generator" className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-wider">
          {lang === 'el' ? 'Δημιουργός Pinterest Pin' : 'Pinterest Pin Generator'}
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: controls */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              {lang === 'el' ? 'Επίλεξε άρθρο' : 'Select article'}
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              {articlesList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title[lang]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={renderPin}
              disabled={isRendering}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:border-slate-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRendering ? 'animate-spin' : ''}`} />
              {lang === 'el' ? 'Ανανέωση' : 'Refresh'}
            </button>
            <button
              onClick={handleDownload}
              disabled={isRendering || !!error}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {lang === 'el' ? 'Λήψη PNG' : 'Download PNG'}
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800 rounded-xl p-3">{error}</p>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed">
            {lang === 'el'
              ? '1000×1500px — το προτεινόμενο μέγεθος από το ίδιο το Pinterest. Κατέβασε και ανέβασέ το κανονικά ως νέο Pin, με σύνδεσμο προς το άρθρο.'
              : '1000×1500px — Pinterest\'s own recommended size. Download and upload it as a new Pin, linking to the article.'}
          </p>
        </div>

        {/* Right: live preview */}
        <div className="flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800 p-4">
          {isRendering && (
            <div className="text-slate-500 text-xs flex items-center gap-2">
              <ImageIcon className="w-4 h-4 animate-pulse" />
              {lang === 'el' ? 'Δημιουργία...' : 'Rendering...'}
            </div>
          )}
          <canvas
            ref={canvasRef}
            className={`w-full max-w-[280px] rounded-lg shadow-2xl ${isRendering ? 'hidden' : 'block'}`}
          />
        </div>
      </div>
    </div>
  );
};
