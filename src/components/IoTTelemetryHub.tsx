import React, { useState } from 'react';
import { 
  Activity, 
  Droplets, 
  Sun, 
  Wind, 
  Compass, 
  Gauge, 
  Sparkles, 
  Calculator, 
  Clock, 
  Cpu, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { CityTelemetry, Language } from '../types';
import { CITIES_TELEMETRY } from '../data/mockData';

interface IoTTelemetryHubProps {
  lang: Language;
}

export const IoTTelemetryHub: React.FC<IoTTelemetryHubProps> = ({ lang }) => {
  const [selectedCityId, setSelectedCityId] = useState<string>('athens');

  // Interactive Irrigation Calculator State
  const [potDiameter, setPotDiameter] = useState<number>(30);
  const [potMaterial, setPotMaterial] = useState<'terracotta' | 'plastic' | 'fabric'>('terracotta');
  const [sunHours, setSunHours] = useState<number>(7);
  const [plantType, setPlantType] = useState<'vegetables' | 'herbs' | 'citrus' | 'succulents'>('vegetables');
  const [dripperFlowLPH, setDripperFlowLPH] = useState<number>(2);

  const city = CITIES_TELEMETRY.find((c) => c.id === selectedCityId) || CITIES_TELEMETRY[0];

  // Precise mathematical irrigation calculation based on ET, pot area, and crop coefficients
  const calculateWaterNeeds = () => {
    // Radius in meters
    const r = potDiameter / 200;
    const areaM2 = Math.PI * r * r;
    
    // Crop coefficient (Kc)
    const kc = plantType === 'vegetables' ? 1.15 : 
               plantType === 'citrus' ? 0.95 : 
               plantType === 'herbs' ? 0.8 : 0.3;

    // Material loss multiplier
    const materialFactor = potMaterial === 'terracotta' ? 1.35 : potMaterial === 'fabric' ? 1.45 : 1.0;
    
    // Sun exposure factor
    const sunFactor = (sunHours / 6) * 1.1;

    // Daily required water in Liters = ET (mm) * Area (m2) * Kc * MaterialFactor * SunFactor
    const dailyLiters = Math.max(0.2, (city.evapotranspiration * areaM2 * kc * materialFactor * sunFactor) * 1.8);
    
    // Minutes needed for dripper
    const timerMinutes = Math.round((dailyLiters / dripperFlowLPH) * 60);

    return {
      liters: dailyLiters.toFixed(2),
      minutes: Math.max(5, timerMinutes),
      schedule: city.recommendedWateringTime[lang],
      soilFrequency: potMaterial === 'terracotta' ? (lang === 'el' ? 'Καθημερινά (1-2 δόσεις)' : 'Daily (1-2 doses)') : (lang === 'el' ? 'Κάθε 1-2 ημέρες' : 'Every 1-2 days')
    };
  };

  const results = calculateWaterNeeds();

  return (
    <section id="telemetry-hub-section" className="py-14 sm:py-20 bg-white dark:bg-neutral-900 border-t border-neutral-200/80 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 shadow-2xs">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'el' ? 'Smart Garden Microclimate Engine' : 'Smart Garden Microclimate Engine'}</span>
          </div>

          <h2 id="telemetry-title" className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-slate-100 tracking-tight">
            {lang === 'el' ? 'Live Τηλεμετρία & Υπολογιστής Άρδευσης' : 'Live Telemetry & Smart Irrigation Hub'}
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 mt-3 leading-relaxed">
            {lang === 'el'
              ? 'Υπολογίστε με ακρίβεια πόσα λίτρα νερό και πόσα λεπτά πρέπει να τρέξει ο προγραμματιστής σας σήμερα βάσει πραγματικής εξατμισοδιαπνοής.'
              : 'Calculate exact water volumes and timer runtimes based on live evapotranspiration telemetry.'}
          </p>
        </div>

        {/* City Switcher Banner */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {CITIES_TELEMETRY.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCityId(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                c.id === selectedCityId
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {c.name[lang]}
            </button>
          ))}
        </div>

        {/* 2-Column Hub Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Live IoT Sensor Stream & Microclimate Indicators */}
          <div className="lg:col-span-6 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700 mb-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-slate-100">
                  {city.name[lang]}
                </h3>
                <p className="text-xs text-neutral-500">{city.region[lang]}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-neutral-900 dark:text-slate-100">
                  {city.temp}°C
                </span>
                <p className="text-xs text-amber-600 font-semibold">{city.condition[lang]}</p>
              </div>
            </div>

            {/* Microclimate Gauges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              
              <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  {lang === 'el' ? 'Εξάτμιση (ET)' : 'Evapotranspiration'}
                </span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {city.evapotranspiration} mm/d
                </span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">Υψηλή απώλεια</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  {lang === 'el' ? 'Ηλιακή Ακτινοβολία' : 'Solar Radiation'}
                </span>
                <span className="text-lg font-extrabold text-amber-600">
                  {city.solarRadiation} W/m²
                </span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">Μέγιστη φωτοσύνθεση</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  {lang === 'el' ? 'Ταχύτητα Ανέμου' : 'Wind Speed'}
                </span>
                <span className="text-lg font-extrabold text-neutral-800 dark:text-neutral-200">
                  {city.windSpeed} km/h
                </span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">Μελτέμι / Αύρα</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  {lang === 'el' ? 'Υγρασία Αέρα' : 'Relative Humidity'}
                </span>
                <span className="text-lg font-extrabold text-blue-600">
                  {city.humidity}%
                </span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">RH</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  {lang === 'el' ? 'Δείκτης UV' : 'UV Index'}
                </span>
                <span className="text-lg font-extrabold text-orange-600">
                  {city.uvIndex}
                </span>
                <span className="text-[10px] text-orange-500 font-semibold block mt-0.5">Very High</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700">
                <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">
                  {lang === 'el' ? 'Υγρασία Εδάφους' : 'Soil Moisture'}
                </span>
                <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {city.soilMoistureLevel}%
                </span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">IoT Probe avg</span>
              </div>

            </div>

            {/* Smart Advisory */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <strong className="font-bold flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'el' ? 'Γεωπονική Εκτίμηση 24ώρου:' : '24-Hour Agronomic Assessment:'}
              </strong>
              {city.smartTip[lang]}
            </div>
          </div>

          {/* Right Column: Interactive Smart Irrigation Calculator */}
          <div className="lg:col-span-6 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-200 dark:border-neutral-700 mb-6">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-slate-100">
                  {lang === 'el' ? 'Έξυπνος Υπολογιστής Ποτίσματος Γλάστρας' : 'Smart Pot Irrigation Calculator'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {lang === 'el' ? 'Προσαρμοσμένος στη σημερινή εξάτμιση' : 'Synchronized with current ET telemetry'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Diameter Slider */}
              <div>
                <div className="flex justify-between font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  <span>{lang === 'el' ? 'Διάμετρος Γλάστρας:' : 'Pot Diameter:'}</span>
                  <span className="text-emerald-600 font-extrabold">{potDiameter} cm</span>
                </div>
                <input
                  id="calc-slider-diameter"
                  type="range"
                  min="15"
                  max="60"
                  value={potDiameter}
                  onChange={(e) => setPotDiameter(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              {/* Pot Material */}
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {lang === 'el' ? 'Υλικό Γλάστρας:' : 'Pot Material:'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'terracotta', label: lang === 'el' ? 'Πήλινη' : 'Terracotta' },
                    { id: 'plastic', label: lang === 'el' ? 'Πλαστική' : 'Plastic' },
                    { id: 'fabric', label: lang === 'el' ? 'Υφασμάτινη' : 'Fabric' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPotMaterial(m.id as any)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        potMaterial === m.id
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plant Type & Sun Hours Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {lang === 'el' ? 'Είδος Φυτού:' : 'Plant Type:'}
                  </label>
                  <select
                    id="calc-select-plant"
                    value={plantType}
                    onChange={(e) => setPlantType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-slate-100 font-medium"
                  >
                    <option value="vegetables">{lang === 'el' ? 'Λαχανικά / Ντομάτες' : 'Vegetables / Tomatoes'}</option>
                    <option value="citrus">{lang === 'el' ? 'Εσπεριδοειδή / Ελιά' : 'Citrus / Olive Tree'}</option>
                    <option value="herbs">{lang === 'el' ? 'Αρωματικά / Βασιλικός' : 'Herbs / Basil'}</option>
                    <option value="succulents">{lang === 'el' ? 'Παχύφυτα / Κάκτοι' : 'Succulents'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {lang === 'el' ? 'Παροχή Σταλάκτη:' : 'Dripper Flow:'}
                  </label>
                  <select
                    id="calc-select-dripper"
                    value={dripperFlowLPH}
                    onChange={(e) => setDripperFlowLPH(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-slate-100 font-medium"
                  >
                    <option value={2}>2 Liters / ώρα (L/h)</option>
                    <option value={4}>4 Liters / ώρα (L/h)</option>
                    <option value={8}>8 Liters / ώρα (L/h)</option>
                  </select>
                </div>
              </div>

              {/* Calculator Calculated Results Card */}
              <div className="mt-6 p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-emerald-400 dark:border-emerald-700 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-2">
                  {lang === 'el' ? 'ΑΠΟΤΕΛΕΣΜΑΤΑ ΑΥΤΟΜΑΤΟΥ ΠΟΤΙΣΜΑΤΟΣ' : 'CALCULATED IRRIGATION SETTINGS'}
                </span>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500">{lang === 'el' ? 'Απαιτούμενο Νερό:' : 'Required Volume:'}</span>
                    <p className="text-xl font-extrabold text-neutral-900 dark:text-slate-100 mt-0.5">
                      {results.liters} <span className="text-xs font-semibold text-emerald-600">Liters / μέρα</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-neutral-500">{lang === 'el' ? 'Διάρκεια Προγραμματιστή:' : 'Timer Runtime:'}</span>
                    <p className="text-xl font-extrabold text-neutral-900 dark:text-slate-100 mt-0.5">
                      {results.minutes} <span className="text-xs font-semibold text-emerald-600">λεπτά (min)</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <strong>{results.schedule}</strong>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {results.soilFrequency}
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
