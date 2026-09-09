import React, { useEffect, useState } from 'react';
import { ArrowLeft, Gauge, Droplets, RotateCw } from 'lucide-react';
import { POPULAR_GREEK_CITIES, fetchLiveWeatherData, LiveWeatherData } from '../services/weatherService';

interface ClimateComparisonPageProps {
  onBack: () => void;
}

interface CityResult extends LiveWeatherData {
  cityId: string;
}

export const ClimateComparisonPage: React.FC<ClimateComparisonPageProps> = ({ onBack }) => {
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Ζωντανή Σύγκριση Εξατμισοδιαπνοής (ET₀) Ελληνικών Πόλεων — SmartGarden.gr';
    let meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Ζωντανά δεδομένα εξατμισοδιαπνοής (ET₀), θερμοκρασίας και υγρασίας για 15 ελληνικές πόλεις — δείτε ποια περιοχή έχει τη μεγαλύτερη ανάγκη ποτίσματος σήμερα.');
    }

    Promise.all(POPULAR_GREEK_CITIES.map(async (city) => {
      try {
        const data = await fetchLiveWeatherData(city);
        return { ...data, cityId: city.id };
      } catch {
        return null;
      }
    })).then((all) => {
      setResults(all.filter((r): r is CityResult => r !== null).sort((a, b) => b.evapotranspiration - a.evapotranspiration));
      setLoading(false);
    });
  }, []);

  return (
    <div role="main" className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην αρχική
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">Ζωντανή Σύγκριση ET₀ Ελληνικών Πόλεων</h1>
            <p className="text-sm text-slate-400">Ποιες περιοχές έχουν τη μεγαλύτερη ανάγκη ποτίσματος σήμερα, με πραγματικά δεδομένα</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          Το ET₀ (εξατμισοδιαπνοή αναφοράς) μετρά πόσα χιλιοστά νερού χάνει καθημερινά μια τυπική καλλιέργεια λόγω εξάτμισης και διαπνοής. Όσο υψηλότερο το ET₀, τόσο μεγαλύτερη η ανάγκη ποτίσματος. Δεδομένα ζωντανά από μετεωρολογικό μοντέλο, ανανεώνονται σε κάθε φόρτωση.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <RotateCw className="w-5 h-5 animate-spin" />
            Φόρτωση ζωντανών δεδομένων για 15 πόλεις...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-800">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Πόλη</th>
                  <th className="py-2 pr-3">ET₀ (mm)</th>
                  <th className="py-2 pr-3">Θερμοκρασία</th>
                  <th className="py-2 pr-3">Υγρασία</th>
                  <th className="py-2">Σύσταση</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={r.cityId} className="border-b border-slate-800/60 hover:bg-slate-950/40">
                    <td className="py-2.5 pr-3 text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 pr-3 font-bold text-slate-100">{r.cityName}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`font-mono font-bold ${r.evapotranspiration >= 6 ? 'text-rose-400' : r.evapotranspiration >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {r.evapotranspiration}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">{r.temperature}°C</td>
                    <td className="py-2.5 pr-3 text-slate-300 flex items-center gap-1"><Droplets className="w-3 h-3 text-cyan-400" />{r.humidity}%</td>
                    <td className="py-2.5 text-xs text-slate-400">{r.evapotranspiration >= 6 ? 'Καθημερινό πότισμα απαραίτητο' : r.evapotranspiration >= 4 ? 'Πότισμα κάθε 1-2 μέρες' : 'Ελεγχος υγρασίας πριν πότισμα'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
