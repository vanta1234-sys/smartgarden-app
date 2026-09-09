import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Download, Copy, Check, Instagram, RotateCw } from 'lucide-react';
import { PLANTS, PLANT_CATEGORY_LABELS, Plant } from '../data/plantDatabase';

// Instagram's tallest feed format. Taller than 1:1 means more screen space in the
// feed for the same scroll distance, which matters more than any caption trick.
const W = 1080;
const H = 1350;

type PostType = 'frost' | 'plant' | 'mistake' | 'month';

interface FrostLocation {
  id: string;
  name: string;
  region: string;
  absolute_min_c: number | null;
  hard_frost: {
    frost_probability_pct: number;
    avg_frost_days_per_year: number;
    last_spring_frost: { label: string } | null;
    safe_planting_date: { label: string } | null;
  };
}

const MONTHS = ['Ιανουάριο','Φεβρουάριο','Μάρτιο','Απρίλιο','Μάιο','Ιούνιο','Ιούλιο','Αύγουστο','Σεπτέμβριο','Οκτώβριο','Νοέμβριο','Δεκέμβριο'];

const BASE_TAGS = '#κηπουρική #φυτά #μπαλκόνι #κήπος #γλάστρες #λαχανόκηπος #κηπουρικη #ελλάδα #gardening #balconygarden #urbangardening #plantcare';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Shared background + brand footer, so every post type reads as one account. */
function drawShell(ctx: CanvasRenderingContext2D, accent: string, deep: string) {
  const g = ctx.createLinearGradient(0, 0, W * 0.6, H);
  g.addColorStop(0, deep);
  g.addColorStop(1, '#020617');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Soft accent glow, keeps the flat gradient from looking like a slide deck.
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.12, 0, W * 0.85, H * 0.12, W * 0.75);
  glow.addColorStop(0, accent + '38');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, 10);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '600 30px system-ui, -apple-system, sans-serif';
  ctx.fillText('smartgarden.gr', 72, H - 62);

  ctx.textAlign = 'right';
  ctx.fillStyle = accent;
  ctx.font = '700 30px system-ui, -apple-system, sans-serif';
  // The Instagram handle, not the TikTok one (@smartgarden68) — these posts go to
  // instagram.com/smartgarden.gr and a mismatched handle is unsearchable.
  ctx.fillText('@smartgarden.gr', W - 72, H - 62);
  ctx.textAlign = 'left';
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, accent: string) {
  ctx.font = '800 28px system-ui, -apple-system, sans-serif';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = accent + '2A';
  roundRect(ctx, 72, 96, tw + 52, 62, 31);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillText(text, 98, 136);
}

export const InstagramStudio: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [type, setType] = useState<PostType>('frost');
  const [locations, setLocations] = useState<FrostLocation[]>([]);
  const [locId, setLocId] = useState('kozani');
  const [plantSlug, setPlantSlug] = useState('ntomata');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Instagram Studio — SmartGarden.gr';
    fetch('/frost_dates.json')
      .then((r) => r.json())
      .then((d) => { setLocations(d.locations ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loc = locations.find((l) => l.id === locId) ?? locations[0] ?? null;
  const plant = PLANTS.find((p) => p.slug === plantSlug) ?? PLANTS[0];

  const monthPlants = useMemo(
    () => PLANTS.filter((p) => p.sowMonths.includes(month)),
    [month]
  );

  const caption = useMemo(() => {
    if (type === 'frost' && loc) {
      const d = loc.hard_frost.safe_planting_date?.label;
      return `📍 ${loc.name}\n\n${d
        ? `Μη φυτέψεις ντομάτες, πιπεριές ή βασιλικό πριν τις ${d}. Σε 9 στις 10 χρονιές ο παγετός έχει ήδη περάσει μέχρι τότε.`
        : `Δεν καταγράφηκε καθόλου παγετός τα τελευταία 20 χρόνια — μπορείς να καλλιεργείς ευαίσθητα φυτά σχεδόν όλο τον χρόνο.`}\n\nΤα δεδομένα βγαίνουν από 20 χρόνια πραγματικών μετρήσεων θερμοκρασίας, όχι από γενικές οδηγίες.\n\nΔες την περιοχή σου: smartgarden.gr/pagetos\n\n${BASE_TAGS}`;
    }
    if (type === 'plant') {
      return `🌱 ${plant.name} (${plant.botanical})\n\n❄️ Αντέχει έως ${plant.minTempC}°C\n☀️ ${plant.sun}\n💧 Πότισμα: ${plant.water.toLowerCase()}\n🧪 pH ${plant.ph}\n🪴 Γλάστρα ${plant.potLitres}\n\n${plant.keyTip}\n\nΠλήρης καρτέλα: smartgarden.gr/fyta/${plant.slug}\n\n${BASE_TAGS}`;
    }
    if (type === 'mistake') {
      return `⚠️ ${plant.name} — το πιο συχνό λάθος\n\n${plant.commonProblem}\n\n✅ Τι να κάνεις: ${plant.keyTip}\n\nsmartgarden.gr/fyta/${plant.slug}\n\n${BASE_TAGS}`;
    }
    const names = monthPlants.slice(0, 12).map((p) => p.name).join(' • ');
    return `📅 Τι σπέρνουμε τον ${MONTHS[month - 1]}\n\n${names}\n\nΑποθήκευσε το post για να το έχεις όταν πιάσεις χώμα.\n\nΠλήρες ημερολόγιο: smartgarden.gr/imerologio-sporas\n\n${BASE_TAGS}`;
  }, [type, loc, plant, month, monthPlants]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;
    ctx.textBaseline = 'alphabetic';

    if (type === 'frost') {
      if (!loc) return;
      const accent = '#38bdf8';
      drawShell(ctx, accent, '#082f49');
      drawLabel(ctx, 'ΗΜΕΡΟΜΗΝΙΕΣ ΠΑΓΕΤΟΥ', accent);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 76px system-ui, -apple-system, sans-serif';
      ctx.fillText(loc.name, 72, 268);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '500 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(loc.region, 72, 316);

      const safe = loc.hard_frost.safe_planting_date?.label;
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = '600 36px system-ui, -apple-system, sans-serif';
      ctx.fillText(safe ? 'Φύτεψε ευαίσθητα φυτά μετά τις' : 'Παγετός τα τελευταία 20 χρόνια', 72, 470);

      ctx.fillStyle = accent;
      ctx.font = '800 124px system-ui, -apple-system, sans-serif';
      const heroLines = wrap(ctx, safe ?? 'Καθόλου', W - 144);
      let hy = 604;
      for (const l of heroLines) { ctx.fillText(l, 72, hy); hy += 132; }

      // Without this the hero date leaves an obvious hole above the stats. A supporting
      // line is a better way to close it than padding, and it answers the question the
      // date immediately raises: "so what can I plant before then?"
      ctx.fillStyle = 'rgba(255,255,255,0.62)';
      ctx.font = '500 34px system-ui, -apple-system, sans-serif';
      const support = safe
        ? 'Ανθεκτικά λαχανικά — σπανάκι, μαρούλι, ρόκα, κρεμμύδι — αντέχουν και αρκετά νωρίτερα.'
        : 'Ούτε μία χρονιά με παγετό στα τελευταία 20 χρόνια μετρήσεων.';
      let py2 = hy + 14;
      for (const l of wrap(ctx, support, W - 160)) { ctx.fillText(l, 72, py2); py2 += 46; }

      const stats: [string, string][] = safe
        ? [
            ['Τελευταίος παγετός', loc.hard_frost.last_spring_frost?.label ?? '—'],
            ['Ημέρες παγετού / έτος', String(loc.hard_frost.avg_frost_days_per_year)],
            ['Ρεκόρ 20ετίας', `${loc.absolute_min_c}°C`],
          ]
        : [
            ['Χρονιές με παγετό', '0 από 20'],
            ['Χαμηλότερη θερμοκρασία', `${loc.absolute_min_c}°C`],
            ['Ευαίσθητα φυτά', 'Όλο τον χρόνο'],
          ];
      let sy = Math.max(hy + 40, 880);
      for (const [k, v] of stats) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        roundRect(ctx, 72, sy, W - 144, 92, 22);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '500 32px system-ui, -apple-system, sans-serif';
        ctx.fillText(k, 104, sy + 58);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 34px system-ui, -apple-system, sans-serif';
        ctx.fillText(v, W - 104, sy + 58);
        ctx.textAlign = 'left';
        sy += 108;
      }
    }

    if (type === 'plant') {
      const accent = '#4ade80';
      drawShell(ctx, accent, '#052e16');
      drawLabel(ctx, PLANT_CATEGORY_LABELS[plant.category].toUpperCase(), accent);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 82px system-ui, -apple-system, sans-serif';
      let y = 280;
      for (const l of wrap(ctx, plant.name, W - 144)) { ctx.fillText(l, 72, y); y += 92; }
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = 'italic 500 36px system-ui, -apple-system, sans-serif';
      ctx.fillText(plant.botanical, 72, y + 6);

      const rows: [string, string][] = [
        ['Αντοχή στο κρύο', `${plant.minTempC}°C`],
        ['Φως', plant.sun],
        ['Πότισμα', plant.water],
        ['pH', plant.ph],
        ['Γλάστρα', plant.potLitres],
      ];
      let ry = y + 76;
      for (const [k, v] of rows) {
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        roundRect(ctx, 72, ry, W - 144, 84, 20);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '500 31px system-ui, -apple-system, sans-serif';
        ctx.fillText(k, 104, ry + 54);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 33px system-ui, -apple-system, sans-serif';
        ctx.fillText(v, W - 104, ry + 54);
        ctx.textAlign = 'left';
        ry += 96;
      }

      ctx.fillStyle = accent + '1F';
      const tipLines = wrap(ctx, plant.keyTip, W - 220);
      const boxH = 56 + tipLines.length * 44;
      roundRect(ctx, 72, ry + 16, W - 144, Math.min(boxH, H - ry - 140), 24);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.font = '700 30px system-ui, -apple-system, sans-serif';
      ctx.fillText('ΣΥΜΒΟΥΛΗ', 104, ry + 68);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '500 32px system-ui, -apple-system, sans-serif';
      let ty = ry + 116;
      for (const l of tipLines.slice(0, 5)) { ctx.fillText(l, 104, ty); ty += 44; }
    }

    if (type === 'mistake') {
      const accent = '#fb7185';
      drawShell(ctx, accent, '#4c0519');
      drawLabel(ctx, 'ΤΟ ΠΙΟ ΣΥΧΝΟ ΛΑΘΟΣ', accent);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 84px system-ui, -apple-system, sans-serif';
      let y = 296;
      for (const l of wrap(ctx, plant.name, W - 144)) { ctx.fillText(l, 72, y); y += 94; }

      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '600 42px system-ui, -apple-system, sans-serif';
      let py = y + 40;
      for (const l of wrap(ctx, plant.commonProblem, W - 168).slice(0, 8)) { ctx.fillText(l, 72, py); py += 58; }

      ctx.fillStyle = '#4ade8022';
      const fixLines = wrap(ctx, plant.keyTip, W - 220);
      roundRect(ctx, 72, py + 24, W - 144, 56 + Math.min(fixLines.length, 5) * 44, 24);
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.font = '700 30px system-ui, -apple-system, sans-serif';
      ctx.fillText('Η ΛΥΣΗ', 104, py + 76);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.font = '500 31px system-ui, -apple-system, sans-serif';
      let fy = py + 124;
      for (const l of fixLines.slice(0, 5)) { ctx.fillText(l, 104, fy); fy += 44; }
    }

    if (type === 'month') {
      const accent = '#fbbf24';
      drawShell(ctx, accent, '#422006');
      drawLabel(ctx, 'ΗΜΕΡΟΛΟΓΙΟ ΣΠΟΡΑΣ', accent);

      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.font = '600 40px system-ui, -apple-system, sans-serif';
      ctx.fillText('Τι σπέρνουμε τον', 72, 262);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 96px system-ui, -apple-system, sans-serif';
      ctx.fillText(MONTHS[month - 1], 72, 366);

      const list = monthPlants.slice(0, 10);
      let ly = 470;
      for (const p of list) {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(88, ly - 12, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 44px system-ui, -apple-system, sans-serif';
        ctx.fillText(p.name, 118, ly);
        ly += 70;
      }
      if (monthPlants.length > list.length) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '500 34px system-ui, -apple-system, sans-serif';
        ctx.fillText(`+ ${monthPlants.length - list.length} ακόμη στο smartgarden.gr`, 118, ly + 8);
      }
    }
  }, [type, loc, plant, month, monthPlants]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ig-${type}-${type === 'month' ? month : type === 'frost' ? locId : plantSlug}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const copyCaption = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const TYPES: { id: PostType; label: string }[] = [
    { id: 'frost', label: 'Παγετός ανά περιοχή' },
    { id: 'plant', label: 'Καρτέλα φυτού' },
    { id: 'mistake', label: 'Συχνό λάθος' },
    { id: 'month', label: 'Τι σπέρνουμε' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην αρχική
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shrink-0">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Instagram Studio</h1>
            <p className="text-sm text-slate-400">Έτοιμα post 1080×1350 από τα δεδομένα του site, με λεζάντα</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${
                type === t.id
                  ? 'bg-emerald-700 text-white border-emerald-500'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {type === 'frost' && (
              <div>
                <label htmlFor="ig-loc" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Περιοχή</label>
                {loading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm"><RotateCw className="w-4 h-4 animate-spin" />Φόρτωση...</div>
                ) : (
                  <select id="ig-loc" value={loc?.id} onChange={(e) => setLocId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer">
                    {locations.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.region})</option>)}
                  </select>
                )}
              </div>
            )}

            {(type === 'plant' || type === 'mistake') && (
              <div>
                <label htmlFor="ig-plant" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Φυτό</label>
                <select id="ig-plant" value={plantSlug} onChange={(e) => setPlantSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer">
                  {PLANTS.map((p: Plant) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                </select>
              </div>
            )}

            {type === 'month' && (
              <div>
                <label htmlFor="ig-month" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Μήνας</label>
                <select id="ig-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
                <p className="text-xs text-slate-500 mt-2">{monthPlants.length} φυτά σπέρνονται αυτόν τον μήνα</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={download} className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer">
                <Download className="w-4 h-4" />
                Κατέβασμα PNG
              </button>
              <button onClick={copyCaption} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Αντιγράφηκε' : 'Αντιγραφή λεζάντας'}
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Λεζάντα</div>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{caption}</pre>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <canvas ref={canvasRef} className="w-full h-auto rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
