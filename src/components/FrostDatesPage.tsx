import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Snowflake, Sprout, CalendarDays, RotateCw, ThermometerSnowflake, ShieldCheck } from 'lucide-react';

interface FrostStat {
  doy: number;
  label: string;
  years_observed?: number;
}

interface ThresholdAnalysis {
  years_analysed: number;
  years_with_frost: number;
  frost_probability_pct: number;
  avg_frost_days_per_year: number;
  last_spring_frost: FrostStat | null;
  first_autumn_frost: FrostStat | null;
  safe_planting_date: FrostStat | null;
  first_risk_date_autumn: FrostStat | null;
  growing_season_days: number | null;
}

interface FrostLocation {
  id: string;
  name: string;
  region: string;
  elevation_m: number | null;
  absolute_min_c: number | null;
  absolute_min_date: string | null;
  hard_frost: ThresholdAnalysis;
  light_frost: ThresholdAnalysis;
}

interface FrostData {
  generated: string;
  source: string;
  period: string;
  thresholds: { hard_frost_c: number; light_frost_c: number };
  locations: FrostLocation[];
}

interface FrostDatesPageProps {
  onBack: () => void;
}

// Crops grouped by how much cold they tolerate. The frost dates only become useful advice
// once they're tied to "so what do I plant, and when" — this is that mapping.
const TENDER_CROPS = 'ντομάτα, πιπεριά, μελιτζάνα, αγγούρι, κολοκύθι, βασιλικός, φασόλια';
const HARDY_CROPS = 'σπανάκι, μαρούλι, ρόκα, ραπανάκι, κρεμμύδι, μπρόκολο, λάχανο, αρακάς';

export const FrostDatesPage: React.FC<FrostDatesPageProps> = ({ onBack }) => {
  const [data, setData] = useState<FrostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('athens');

  useEffect(() => {
    document.title = 'Ημερομηνίες Παγετού & Ασφαλής Φύτευση ανά Περιοχή στην Ελλάδα — SmartGarden.gr';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Πραγματικές ημερομηνίες πρώτου και τελευταίου παγετού για 50+ ελληνικές περιοχές, από 20 χρόνια μετεωρολογικών δεδομένων. Δείτε πότε μπορείτε με ασφάλεια να φυτέψετε ντομάτες, βασιλικό και άλλα ευαίσθητα φυτά στην περιοχή σας.'
      );
    }

    fetch('/frost_dates.json')
      .then((r) => r.json())
      .then((d: FrostData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selected = useMemo(
    () => data?.locations.find((l) => l.id === selectedId) ?? data?.locations[0] ?? null,
    [data, selectedId]
  );

  const byRegion = useMemo(() => {
    if (!data) return [];
    const groups = new Map<string, FrostLocation[]>();
    for (const loc of data.locations) {
      if (!groups.has(loc.region)) groups.set(loc.region, []);
      groups.get(loc.region)!.push(loc);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], 'el'));
  }, [data]);

  const ranked = useMemo(() => {
    if (!data) return [];
    return [...data.locations].sort(
      (a, b) => (b.hard_frost.last_spring_frost?.doy ?? -1) - (a.hard_frost.last_spring_frost?.doy ?? -1)
    );
  }, [data]);

  if (loading) {
    return (
      <div role="main" className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 gap-2">
        <RotateCw className="w-5 h-5 animate-spin" />
        Φόρτωση δεδομένων παγετού...
      </div>
    );
  }

  if (!data || !selected) {
    return (
      <div role="main" className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Τα δεδομένα παγετού δεν είναι προσωρινά διαθέσιμα.
      </div>
    );
  }

  const hf = selected.hard_frost;
  const lf = selected.light_frost;
  const noFrost = hf.frost_probability_pct === 0;

  return (
    <div role="main" className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην αρχική
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <Snowflake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Ημερομηνίες Παγετού & Ασφαλής Φύτευση στην Ελλάδα
            </h1>
            <p className="text-sm text-slate-400">
              Πότε τελειώνει ο παγετός στην περιοχή σας — από {hf.years_analysed} χρόνια πραγματικών δεδομένων
            </p>
          </div>
        </div>

        {/* Answer-first summary block: the direct answer before any methodology, both for
            readers and because AI search engines cite self-contained opening answers. */}
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-5 space-y-2">
          <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-wide">Σύντομη Απάντηση</h2>
          <p className="text-sm text-slate-200 leading-relaxed">
            {noFrost ? (
              <>
                Στην περιοχή <strong className="text-slate-100">{selected.name}</strong> δεν καταγράφηκε παγετός
                (≤0°C) σε καμία από τις {hf.years_analysed} χρονιές που εξετάστηκαν. Μπορείτε να φυτεύετε
                ευαίσθητα φυτά ({TENDER_CROPS}) σχεδόν όλο τον χρόνο, με μόνη επιφύλαξη τις πιο ψυχρές νύχτες
                του Ιανουαρίου — το απόλυτο ελάχιστο της 20ετίας ήταν {selected.absolute_min_c}°C.
              </>
            ) : (
              <>
                Στην περιοχή <strong className="text-slate-100">{selected.name}</strong> ο τελευταίος ανοιξιάτικος
                παγετός σημειώνεται κατά μέσο όρο στις{' '}
                <strong className="text-slate-100">{hf.last_spring_frost?.label}</strong>
                {hf.first_autumn_frost ? (
                  <> και ο πρώτος φθινοπωρινός στις <strong className="text-slate-100">{hf.first_autumn_frost.label}</strong>.</>
                ) : (
                  <>, ενώ πριν το τέλος του έτους δεν καταγράφεται συνήθως παγετός — ο κίνδυνος περιορίζεται στον Ιανουάριο και τον Φεβρουάριο.</>
                )}{' '}
                Για να είστε ασφαλείς σε 9 στις 10 χρονιές, φυτέψτε ευαίσθητα φυτά ({TENDER_CROPS}) μετά τις{' '}
                <strong className="text-slate-100">{hf.safe_planting_date?.label}</strong>. Ανθεκτικά λαχανικά
                ({HARDY_CROPS}) αντέχουν και νωρίτερα. Παγετός εμφανίστηκε σε {hf.frost_probability_pct}% των
                ετών, με {hf.avg_frost_days_per_year} ημέρες παγετού τον χρόνο κατά μέσο όρο.
              </>
            )}
          </p>
        </div>

        <div>
          <label htmlFor="frost-location" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Επιλέξτε περιοχή
          </label>
          <select
            id="frost-location"
            value={selected.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {byRegion.map(([region, locs]) => (
              <optgroup key={region} label={region}>
                {locs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Snowflake className="w-3.5 h-3.5 text-sky-400" />
              Τελευταίος παγετός
            </div>
            <div className="text-xl font-extrabold text-slate-100">{hf.last_spring_frost?.label ?? '—'}</div>
            <p className="text-[11px] text-slate-400 mt-1">Μέσος όρος άνοιξης (≤0°C)</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Ασφαλής φύτευση
            </div>
            <div className="text-xl font-extrabold text-emerald-400">{hf.safe_planting_date?.label ?? 'Όλο τον χρόνο'}</div>
            <p className="text-[11px] text-slate-400 mt-1">Ασφαλές σε 9 στις 10 χρονιές</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
              Πρώτος παγετός
            </div>
            <div className="text-xl font-extrabold text-slate-100">{hf.first_autumn_frost?.label ?? '—'}</div>
            <p className="text-[11px] text-slate-400 mt-1">Μέσος όρος φθινοπώρου</p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Sprout className="w-3.5 h-3.5 text-lime-400" />
              Περίοδος ανάπτυξης
            </div>
            <div className="text-xl font-extrabold text-slate-100">
              {hf.growing_season_days
                ? `${hf.growing_season_days} ημέρες`
                : noFrost
                  ? 'Όλο τον χρόνο'
                  : 'Χωρίς φθιν. παγετό'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {hf.growing_season_days
                ? 'Χωρίς κίνδυνο παγετού'
                : noFrost
                  ? 'Δεν καταγράφηκε παγετός'
                  : 'Ο παγετός εμφανίζεται Ιανουάριο-Φεβρουάριο, όχι πριν το τέλος του έτους'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ThermometerSnowflake className="w-4 h-4 text-sky-400" />
              Ελαφρύς παγετός (≤{data.thresholds.light_frost_c}°C)
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Η θερμοκρασία στην επιφάνεια του φυλλώματος και του χώματος πέφτει χαμηλότερα από αυτήν που
              μετρά ο μετεωρολογικός σταθμός στα 2 μέτρα. Γι' αυτό ευαίσθητα φυτά μπορεί να ζημιωθούν ακόμη
              και σε νύχτα «2°C». Αν καλλιεργείτε βασιλικό ή ντομάτα σε γλάστρα, χρησιμοποιήστε αυτές τις
              ημερομηνίες αντί για τις παραπάνω.
            </p>
            <dl className="text-xs space-y-1.5">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <dt className="text-slate-400">Τελευταίος ελαφρύς παγετός</dt>
                <dd className="text-slate-200 font-semibold">{lf.last_spring_frost?.label ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <dt className="text-slate-400">Πρώτος ελαφρύς παγετός</dt>
                <dd className="text-slate-200 font-semibold">{lf.first_autumn_frost?.label ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Ημέρες ≤{data.thresholds.light_frost_c}°C ανά έτος</dt>
                <dd className="text-slate-200 font-semibold">{lf.avg_frost_days_per_year}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-100">Στοιχεία περιοχής</h2>
            <dl className="text-xs space-y-1.5">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <dt className="text-slate-400">Υψόμετρο</dt>
                <dd className="text-slate-200 font-semibold">{selected.elevation_m ?? '—'} m</dd>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <dt className="text-slate-400">Απόλυτο ελάχιστο 20ετίας</dt>
                <dd className="text-slate-200 font-semibold">
                  {selected.absolute_min_c}°C {selected.absolute_min_date ? `(${selected.absolute_min_date})` : ''}
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <dt className="text-slate-400">Χρονιές με παγετό</dt>
                <dd className="text-slate-200 font-semibold">
                  {hf.years_with_frost} από {hf.years_analysed} ({hf.frost_probability_pct}%)
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Ημέρες παγετού ανά έτος</dt>
                <dd className="text-slate-200 font-semibold">{hf.avg_frost_days_per_year}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-base font-bold text-slate-100">Σύγκριση όλων των περιοχών</h2>
          <p className="text-xs text-slate-400">
            Ταξινομημένες από την περιοχή με τον πιο όψιμο ανοιξιάτικο παγετό (φυτεύετε τελευταίοι) προς την
            πιο ήπια.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] text-slate-500 uppercase tracking-wide border-b border-slate-800">
                  <th className="py-2 pr-3">Περιοχή</th>
                  <th className="py-2 pr-3">Υψόμ.</th>
                  <th className="py-2 pr-3">Τελευτ. παγετός</th>
                  <th className="py-2 pr-3">Ασφαλής φύτευση</th>
                  <th className="py-2 pr-3">Πρώτος παγετός</th>
                  <th className="py-2 pr-3">Ημ. παγετού/έτος</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className={`border-b border-slate-900 cursor-pointer transition-colors hover:bg-slate-900/60 ${
                      l.id === selected.id ? 'bg-emerald-950/30' : ''
                    }`}
                  >
                    <td className="py-2 pr-3">
                      <span className="text-slate-100 font-semibold">{l.name}</span>
                      <span className="text-slate-500 ml-1.5">{l.region}</span>
                    </td>
                    <td className="py-2 pr-3 text-slate-400">{l.elevation_m ?? '—'}m</td>
                    <td className="py-2 pr-3 text-slate-200">{l.hard_frost.last_spring_frost?.label ?? '—'}</td>
                    <td className="py-2 pr-3 text-emerald-400 font-semibold">
                      {l.hard_frost.safe_planting_date?.label ?? 'Όλο τον χρόνο'}
                    </td>
                    <td className="py-2 pr-3 text-slate-200">{l.hard_frost.first_autumn_frost?.label ?? '—'}</td>
                    <td className="py-2 pr-3 text-slate-400">{l.hard_frost.avg_frost_days_per_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-2">
          <h2 className="text-sm font-bold text-slate-100">Μεθοδολογία & πηγή δεδομένων</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Τα δεδομένα προέρχονται από την {data.source}, περίοδος {data.period}. Για κάθε έτος και κάθε
            τοποθεσία εντοπίζεται η τελευταία ημέρα πριν την 1η Ιουλίου και η πρώτη ημέρα μετά την 1η Ιουλίου
            με ελάχιστη θερμοκρασία ≤{data.thresholds.hard_frost_c}°C. Οι εμφανιζόμενες ημερομηνίες
            «τελευταίου» και «πρώτου» παγετού είναι η διάμεσος των ετών <em>στα οποία σημειώθηκε παγετός</em>.
            Η «ασφαλής ημερομηνία φύτευσης» είναι το 90ό εκατοστημόριο των ίδιων ετών: σε 9 στις 10 χρονιές με
            παγετό, ο τελευταίος παγετός είχε ήδη περάσει μέχρι αυτή την ημερομηνία. Σε περιοχές όπου ο
            παγετός δεν εμφανίζεται κάθε χρόνο, ο πραγματικός κίνδυνος είναι ακόμη μικρότερος από όσο δείχνει
            η ημερομηνία. Τελευταία ενημέρωση δεδομένων: {data.generated}.
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Προσοχή: πρόκειται για κλιματολογικούς μέσους όρους σε ανάλυση πλέγματος, όχι πρόγνωση. Το τοπικό
            μικροκλίμα (ρεματιά, πλαγιά, ταράτσα, αστικός ιστός) μπορεί να διαφέρει αισθητά. Ένα μπαλκόνι στον
            3ο όροφο είναι συνήθως 1-2°C θερμότερο από έναν κήπο στο έδαφος της ίδιας περιοχής.
          </p>
        </div>
      </div>
    </div>
  );
};
