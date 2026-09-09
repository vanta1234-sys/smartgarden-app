import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Leaf, Search, Sun, Droplets, Thermometer, FlaskConical, AlertTriangle, Lightbulb, Snowflake, CalendarDays } from 'lucide-react';
import { PLANTS, PLANT_CATEGORY_LABELS, Plant, PlantCategory, getPlantBySlug } from '../data/plantDatabase';

interface PlantDatabasePageProps {
  onBack: () => void;
  /** Slug from /fyta/<slug>; when present the page opens straight on that plant. */
  initialSlug?: string;
}

const MONTH_SHORT = ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'];
const MONTH_FULL = ['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'];

interface FrostLocationLite {
  id: string;
  name: string;
  region: string;
  absolute_min_c: number | null;
  hard_frost: {
    frost_probability_pct: number;
    safe_planting_date: { label: string } | null;
  };
}

const MonthStrip: React.FC<{ months: number[]; color: string; label: string }> = ({ months, color, label }) => (
  <div>
    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{label}</div>
    <div className="flex gap-1">
      {MONTH_SHORT.map((m, i) => {
        const active = months.includes(i + 1);
        return (
          <div
            key={i}
            title={MONTH_FULL[i]}
            className={`flex-1 h-7 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
              active ? color : 'bg-slate-900 text-slate-600'
            }`}
          >
            {m}
          </div>
        );
      })}
    </div>
  </div>
);

export const PlantDatabasePage: React.FC<PlantDatabasePageProps> = ({ onBack, initialSlug }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PlantCategory | 'all'>('all');
  const [selected, setSelected] = useState<Plant | null>(initialSlug ? getPlantBySlug(initialSlug) ?? null : null);
  const [frostLocations, setFrostLocations] = useState<FrostLocationLite[]>([]);
  const [frostLocationId, setFrostLocationId] = useState('athens');

  useEffect(() => {
    const title = selected
      ? `${selected.name} (${selected.botanical}): Καλλιέργεια & Φροντίδα στην Ελλάδα — SmartGarden.gr`
      : 'Βάση Δεδομένων Φυτών: Καλλιέργεια & Φροντίδα στο Ελληνικό Κλίμα — SmartGarden.gr';
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        selected
          ? `${selected.name} (${selected.botanical}): αντοχή στο κρύο έως ${selected.minTempC}°C, pH ${selected.ph}, ${selected.sun.toLowerCase()}. Πότε φυτεύεται και τι πάει στραβά συχνότερα.`
          : `Αναλυτικά δεδομένα καλλιέργειας για ${PLANTS.length} φυτά προσαρμοσμένα στο ελληνικό κλίμα: αντοχή στον παγετό, pH, μέγεθος γλάστρας, μήνες σποράς και το συχνότερο λάθος για κάθε φυτό.`
      );
    }
  }, [selected]);

  useEffect(() => {
    fetch('/frost_dates.json')
      .then((r) => r.json())
      .then((d) => setFrostLocations(d.locations ?? []))
      .catch(() => setFrostLocations([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLANTS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.botanical.toLowerCase().includes(q) ||
        p.family.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  const frostLocation = frostLocations.find((l) => l.id === frostLocationId) ?? frostLocations[0] ?? null;

  const openPlant = (p: Plant) => {
    setSelected(p);
    window.history.pushState(null, '', `/fyta/${p.slug}`);
    window.scrollTo({ top: 0 });
  };

  const closePlant = () => {
    setSelected(null);
    window.history.pushState(null, '', '/fyta');
  };

  if (selected) {
    // Turns the plant's own cold tolerance into a concrete date for the reader's region,
    // which is the whole point of keeping minTempC on every entry.
    const tender = selected.minTempC > 0;
    const regionSafeDate = frostLocation?.hard_frost.safe_planting_date?.label ?? null;
    const regionHasFrost = (frostLocation?.hard_frost.frost_probability_pct ?? 0) > 0;
    const regionMin = frostLocation?.absolute_min_c ?? null;
    const survivesRecordLow = regionMin !== null && selected.minTempC <= regionMin;

    return (
      <div role="main" className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <button onClick={closePlant} className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Όλα τα φυτά
          </button>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-600/20 text-emerald-300 border border-emerald-600/30">
              {PLANT_CATEGORY_LABELS[selected.category]}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mt-3">{selected.name}</h1>
            <p className="text-sm text-slate-400 italic">{selected.botanical} · Οικογένεια {selected.family}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { icon: <Thermometer className="w-3.5 h-3.5 text-sky-400" />, label: 'Αντοχή στο κρύο', value: `${selected.minTempC}°C` },
              { icon: <Sun className="w-3.5 h-3.5 text-amber-400" />, label: 'Φως', value: selected.sun },
              { icon: <Droplets className="w-3.5 h-3.5 text-blue-400" />, label: 'Πότισμα', value: selected.water },
              { icon: <FlaskConical className="w-3.5 h-3.5 text-purple-400" />, label: 'pH', value: selected.ph },
              { icon: <Leaf className="w-3.5 h-3.5 text-lime-400" />, label: 'Γλάστρα', value: selected.potLitres },
            ].map((s) => (
              <div key={s.label} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {s.icon}
                  {s.label}
                </div>
                <div className="text-sm font-bold text-slate-100 leading-snug">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-sky-950/30 border border-sky-800/50 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-sky-300 flex items-center gap-2">
              <Snowflake className="w-4 h-4" />
              Πότε να το φυτέψετε στην περιοχή σας
            </h2>
            {frostLocations.length > 0 && (
              <select
                aria-label="Επιλογή περιοχής για υπολογισμό ασφαλούς ημερομηνίας φύτευσης"
                value={frostLocation?.id}
                onChange={(e) => setFrostLocationId(e.target.value)}
                className="w-full max-w-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {frostLocations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.region})</option>
                ))}
              </select>
            )}
            <p className="text-sm text-slate-200 leading-relaxed">
              {!frostLocation ? (
                'Φόρτωση δεδομένων περιοχής...'
              ) : !tender ? (
                <>
                  Το φυτό αντέχει έως <strong className="text-slate-100">{selected.minTempC}°C</strong>
                  {survivesRecordLow ? (
                    <> — χαμηλότερα από το απόλυτο ελάχιστο 20ετίας της περιοχής {frostLocation.name} ({regionMin}°C). Μπορείτε να το φυτέψετε οποιαδήποτε εποχή προβλέπεται για το είδος, χωρίς φόβο ζημιάς από παγετό.</>
                  ) : (
                    <> ενώ το απόλυτο ελάχιστο 20ετίας στην περιοχή {frostLocation.name} ήταν {regionMin}°C. Σε μια εξαιρετικά ψυχρή χρονιά μπορεί να χρειαστεί προστασία με αντιπαγετικό ύφασμα.</>
                  )}
                </>
              ) : regionHasFrost && regionSafeDate ? (
                <>
                  Ευαίσθητο φυτό — καταστρέφεται κάτω από{' '}
                  <strong className="text-slate-100">{selected.minTempC}°C</strong>. Στην περιοχή{' '}
                  <strong className="text-slate-100">{frostLocation.name}</strong> φυτέψτε το με ασφάλεια{' '}
                  <strong className="text-emerald-400">μετά τις {regionSafeDate}</strong>. Νωρίτερη φύτευση
                  απαιτεί προστασία (θερμοκήπιο, αντιπαγετικό ύφασμα ή μεταφορά της γλάστρας σε στεγασμένο χώρο τις ψυχρές νύχτες).
                </>
              ) : (
                <>
                  Ευαίσθητο φυτό (όριο {selected.minTempC}°C), αλλά στην περιοχή{' '}
                  <strong className="text-slate-100">{frostLocation.name}</strong> δεν καταγράφηκε παγετός την
                  τελευταία 20ετία — με απόλυτο ελάχιστο {regionMin}°C. Μπορείτε να το καλλιεργείτε
                  εκτός σχεδόν όλο τον χρόνο.
                </>
              )}
            </p>
            <a
              href="/pagetos"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/pagetos'); window.location.reload(); }}
              className="inline-block text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Δείτε αναλυτικά τις ημερομηνίες παγετού της περιοχής σας →
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <MonthStrip months={selected.sowMonths} color="bg-emerald-600 text-white" label="Σπορά / Φύτευση" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <MonthStrip
                months={selected.harvestMonths}
                color="bg-amber-600 text-white"
                label={selected.category === 'anthofora' ? 'Ανθοφορία' : 'Συγκομιδή'}
              />
            </div>
          </div>

          <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-rose-300 flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" />
              Τι πάει στραβά συχνότερα
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">{selected.commonProblem}</p>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-emerald-300 flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4" />
              Η πιο χρήσιμη συμβουλή
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed">{selected.keyTip}</p>
          </div>

          {selected.companions && selected.companions.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-slate-100 mb-2">Καλοί γείτονες στη συγκαλλιέργεια</h2>
              <div className="flex flex-wrap gap-2">
                {selected.companions.map((c) => (
                  <span key={c} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-bold text-slate-100 mb-3">Άλλα φυτά της ίδιας κατηγορίας</h2>
            <div className="flex flex-wrap gap-2">
              {PLANTS.filter((p) => p.category === selected.category && p.slug !== selected.slug).slice(0, 10).map((p) => (
                <button
                  key={p.slug}
                  onClick={() => openPlant(p)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="main" className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην αρχική
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400 shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">Βάση Δεδομένων Φυτών</h1>
            <p className="text-sm text-slate-400">
              {PLANTS.length} φυτά με πραγματικά δεδομένα καλλιέργειας για το ελληνικό κλίμα
            </p>
          </div>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-5">
          <p className="text-sm text-slate-200 leading-relaxed">
            Κάθε φυτό συνοδεύεται από την πραγματική του αντοχή στο κρύο σε °C, που συνδυάζεται αυτόματα με τις{' '}
            <a
              href="/pagetos"
              onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/pagetos'); window.location.reload(); }}
              className="text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              ημερομηνίες παγετού της περιοχής σας
            </a>{' '}
            — έτσι δεν βλέπετε γενικές οδηγίες αλλά συγκεκριμένη ημερομηνία για το πού μένετε.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Αναζήτηση φυτού (π.χ. ντομάτα, βασιλικός, Ocimum)"
              aria-label="Αναζήτηση φυτού"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PlantCategory | 'all')}
            aria-label="Φίλτρο κατηγορίας φυτών"
            className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Όλες οι κατηγορίες</option>
            {(Object.keys(PLANT_CATEGORY_LABELS) as PlantCategory[]).map((c) => (
              <option key={c} value={c}>{PLANT_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>

        <p className="text-xs text-slate-500">{filtered.length} φυτά</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <button
              key={p.slug}
              onClick={() => openPlant(p)}
              className="text-left bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h2 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{p.name}</h2>
                  <p className="text-[11px] text-slate-500 italic">{p.botanical}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0">
                  {p.difficulty}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-sky-400" />
                  {p.minTempC}°C
                </span>
                <span className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-400" />
                  {p.sun}
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  {p.water}
                </span>
              </div>
              {p.sowMonths.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                  <CalendarDays className="w-3 h-3" />
                  Σπορά: {p.sowMonths.map((m) => MONTH_FULL[m - 1].slice(0, 3)).join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">
            Δεν βρέθηκε φυτό με αυτά τα κριτήρια. Δοκιμάστε άλλον όρο αναζήτησης.
          </p>
        )}
      </div>
    </div>
  );
};
