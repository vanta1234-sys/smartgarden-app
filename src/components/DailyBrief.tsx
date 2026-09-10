import React, { useMemo } from 'react';
import { Droplets, Clock, AlertTriangle, Bug, Sun, CalendarCheck } from 'lucide-react';
import { LiveWeatherData } from '../services/weatherService';
import { buildDailyBrief, WateringUrgency } from '../services/dailyBriefService';

const URGENCY_STYLE: Record<WateringUrgency, { chip: string; label: string }> = {
  skip: { chip: 'bg-sky-900 text-sky-300 border-sky-300/30', label: 'Χωρίς πότισμα' },
  low: { chip: 'bg-emerald-900 text-emerald-600 border-emerald-600/30', label: 'Χαμηλή ανάγκη' },
  normal: { chip: 'bg-emerald-900 text-emerald-600 border-emerald-600/30', label: 'Κανονική ανάγκη' },
  high: { chip: 'bg-amber-900 text-amber-300 border-amber-300/30', label: 'Υψηλή ανάγκη' },
  // orange-400 on the pale orange wash measured 3.57:1; one stop darker clears 4.5.
  critical: { chip: 'bg-orange-900 text-orange-700 border-orange-400/30', label: 'Πολύ υψηλή ανάγκη' },
};

const DAYS = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
const MONTHS = ['Ιανουαρίου','Φεβρουαρίου','Μαρτίου','Απριλίου','Μαΐου','Ιουνίου','Ιουλίου','Αυγούστου','Σεπτεμβρίου','Οκτωβρίου','Νοεμβρίου','Δεκεμβρίου'];

export const DailyBrief: React.FC<{ weather: LiveWeatherData | null }> = ({ weather }) => {
  const brief = useMemo(() => (weather ? buildDailyBrief(weather) : null), [weather]);

  if (!weather || !brief) return null;

  const now = new Date();
  const style = URGENCY_STYLE[brief.watering.urgency];

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-slate-800 bg-slate-950/60">
        <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-emerald-600" />
          Το Πρωινό Δελτίο Κήπου
        </h2>
        <span className="text-xs text-slate-400">
          {weather.cityName} · {DAYS[now.getDay()]} {now.getDate()} {MONTHS[now.getMonth()]}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {brief.alert && (
          <div
            className={`flex items-start gap-2.5 rounded-xl p-3.5 border ${
              brief.alert.kind === 'frost'
                ? 'bg-sky-900 border-sky-300/30'
                : 'bg-orange-900 border-orange-400/30'
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 mt-0.5 shrink-0 ${brief.alert.kind === 'frost' ? 'text-sky-300' : 'text-orange-400'}`}
            />
            <p className="text-sm text-slate-200 leading-relaxed">{brief.alert.text}</p>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Droplets className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${style.chip}`}>
              {style.label}
            </span>
            <span className="text-[11px] text-slate-500">
              εξάτμιση {weather.evapotranspiration}mm · {Math.round(weather.temperature)}°C · υγρασία {weather.humidity}% · άνεμος {Math.round(weather.windSpeed)} km/h
            </span>
          </div>
          <p className="text-base font-bold text-slate-100 leading-snug">{brief.watering.verdict}</p>
        </div>

        <div className="flex items-start gap-2.5 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
          <Clock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-slate-200 leading-relaxed">{brief.watering.timing}</p>
            <p className="text-[11px] text-slate-500 mt-1">Ρυθμός: {brief.watering.interval}</p>
          </div>
        </div>

        <ul className="space-y-1.5">
          {brief.watering.adjustments.map((a) => (
            <li key={a} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              {a}
            </li>
          ))}
        </ul>

        {brief.risks.length > 0 && (
          <div className="pt-1 space-y-2.5">
            {brief.risks.map((r) => (
              <div
                key={r.name}
                className={`rounded-xl p-3.5 border ${
                  r.severity === 'act' ? 'bg-rose-900 border-rose-300/30' : 'bg-amber-900 border-amber-300/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Bug className={`w-3.5 h-3.5 shrink-0 ${r.severity === 'act' ? 'text-rose-300' : 'text-amber-300'}`} />
                  <span className="text-xs font-bold text-slate-100">{r.name}</span>
                  <span className="text-[11px] text-slate-500">— ευνοείται από {r.because}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{r.action}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800 pt-3">
          <Sun className="w-3 h-3 inline mr-1 text-amber-300" />
          Οι συστάσεις υπολογίζονται από τη ζωντανή εξατμισοδιαπνοή (ET₀) της περιοχής σας, που συνδυάζει
          θερμοκρασία, ήλιο, υγρασία και άνεμο. Είναι σημείο εκκίνησης, όχι υποκατάστατο του ελέγχου με το
          δάχτυλο στο χώμα.
        </p>
      </div>
    </div>
  );
};
