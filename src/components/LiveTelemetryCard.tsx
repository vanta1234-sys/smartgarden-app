import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Droplets, 
  Sun, 
  Wind, 
  Gauge, 
  RotateCw, 
  MapPin, 
  Navigation, 
  Sparkles, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  POPULAR_GREEK_CITIES, 
  WeatherCity, 
  LiveWeatherData, 
  fetchLiveWeatherData 
} from '../services/weatherService';

interface LiveTelemetryCardProps {
  onWeatherUpdate?: (data: LiveWeatherData) => void;
  compact?: boolean;
}

export const LiveTelemetryCard: React.FC<LiveTelemetryCardProps> = ({ 
  onWeatherUpdate,
  compact = false 
}) => {
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    return localStorage.getItem('smartgarden_weather_city') || 'athens';
  });
  
  const [customCity, setCustomCity] = useState<{ name: string; region: string; lat: number; lon: number } | null>(null);
  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadWeather = async (cityConfig?: WeatherCity | { name: string; region: string; lat: number; lon: number }) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let target = cityConfig;
      if (!target) {
        if (customCity) {
          target = customCity;
        } else {
          target = POPULAR_GREEK_CITIES.find(c => c.id === selectedCityId) || POPULAR_GREEK_CITIES[0];
        }
      }
      const data = await fetchLiveWeatherData(target);
      setWeatherData(data);
      if (onWeatherUpdate) {
        onWeatherUpdate(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Αδυναμία ανανέωσης δεδομένων.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
    // Refresh every 10 minutes
    const interval = setInterval(() => {
      loadWeather();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCityId, customCity]);

  const handleCityChange = (newCityId: string) => {
    setCustomCity(null);
    setSelectedCityId(newCityId);
    localStorage.setItem('smartgarden_weather_city', newCityId);
  };

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Το GPS δεν υποστηρίζεται στον φυλλομετρητή σας.');
      return;
    }

    setIsLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocating(false);
        const custom = {
          name: 'Η Τοποθεσία μου',
          region: 'GPS Συντεταγμένες',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        setCustomCity(custom);
        await loadWeather(custom);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setErrorMsg('Δεν δόθηκε άδεια τοποθεσίας. Επιλέξτε πόλη από τη λίστα.');
        setTimeout(() => setErrorMsg(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  if (!weatherData && isLoading) {
    return (
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[220px] text-center space-y-3">
        <RotateCw className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-300 font-medium">Σύνδεση με Μετεωρολογικό Σταθμό & Υπολογισμός Εξάτμισης...</p>
      </div>
    );
  }

  const uvBadge = (uv: number) => {
    if (uv < 3) return { text: `${uv} (Χαμηλός)`, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' };
    if (uv < 6) return { text: `${uv} (Μέτριος)`, color: 'text-amber-300 bg-amber-950/40 border-amber-800' };
    if (uv < 8) return { text: `${uv} (Υψηλός)`, color: 'text-orange-400 bg-orange-950/40 border-orange-800' };
    if (uv < 11) return { text: `${uv} (Πολύ Υψηλός)`, color: 'text-rose-400 bg-rose-950/40 border-rose-800' };
    return { text: `${uv} (Ακραίος)`, color: 'text-purple-400 bg-purple-950/40 border-purple-800' };
  };

  const uv = weatherData ? uvBadge(weatherData.uvIndex) : { text: '6.5', color: 'text-amber-400' };

  return (
    <div id="live-telemetry-card" className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Top Bar with Live Tag, City Selector, and Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wide">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Ζωντανή Τηλεμετρία & Εξάτμιση (Live)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUseGPS}
            disabled={isLocating}
            title="Χρήση GPS Τοποθεσίας"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-colors text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline text-[11px]">GPS</span>
          </button>

          <button
            onClick={() => loadWeather()}
            disabled={isLoading}
            title="Ανανέωση Μετεωρολογικών Δεδομένων"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg text-xs text-amber-300 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* City Dropdown & Main Temperature / Weather Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={customCity ? 'custom' : selectedCityId}
              onChange={(e) => handleCityChange(e.target.value)}
              aria-label="Επιλογή πόλης για τηλεμετρία καιρού"
              className="bg-slate-900 text-white font-bold text-sm sm:text-base rounded-lg px-2.5 py-1 border border-slate-700 hover:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {customCity && (
                <option value="custom">📍 {customCity.name}</option>
              )}
              {POPULAR_GREEK_CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name} ({city.region})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 pl-6">
            <span>Τοπική Εξάτμιση Εδάφους (ET₀)</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">Ώρα {weatherData?.lastUpdated || 'Τώρα'}</span>
          </div>
        </div>

        {/* Big Temperature Display */}
        <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-900/90 border border-slate-800/80 px-4 py-2 rounded-xl">
          <span className="text-3xl">{weatherData?.weatherIcon || '☀️'}</span>
          <div>
            <div className="text-2xl font-black text-amber-400 tracking-tight flex items-baseline gap-1">
              <span>{weatherData?.temperature ?? 26}°C</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {weatherData?.weatherDescription}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        {/* Humidity */}
        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] mb-1">
            <Droplets className="w-3 h-3 text-cyan-400" />
            <span>Υγρασία</span>
          </div>
          <div className="font-extrabold text-white text-sm">
            {weatherData?.humidity}%
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {weatherData && weatherData.humidity < 40 ? 'Ξηρή' : weatherData && weatherData.humidity > 70 ? 'Υγρή' : 'Ισορροπημένη'}
          </div>
        </div>

        {/* UV Index */}
        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] mb-1">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Δείκτης UV</span>
          </div>
          <div className="font-extrabold text-amber-400 text-sm">
            {weatherData?.uvIndex}
          </div>
          <div className="text-[9px] text-slate-400 mt-0.5 truncate">
            {weatherData && weatherData.uvIndex >= 8 ? 'Πολύ Υψηλός' : weatherData && weatherData.uvIndex >= 6 ? 'Υψηλός' : 'Μέτριος'}
          </div>
        </div>

        {/* Evapotranspiration */}
        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] mb-1">
            <Gauge className="w-3 h-3 text-emerald-400" />
            <span>Εξάτμιση ET₀</span>
          </div>
          <div className="font-extrabold text-emerald-400 text-sm font-mono">
            {weatherData?.evapotranspiration} mm
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {weatherData && weatherData.evapotranspiration > 6.0 ? 'Έντονη Απώλεια' : 'Κανονική'}
          </div>
        </div>

        {/* Wind Speed */}
        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] mb-1">
            <Wind className="w-3 h-3 text-sky-400" />
            <span>Άνεμος</span>
          </div>
          <div className="font-extrabold text-sky-300 text-sm">
            {weatherData?.windSpeed} km/h
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            {weatherData && weatherData.windSpeed > 25 ? 'Ισχυρός' : 'Ήπιος'}
          </div>
        </div>
      </div>

      {/* Severe Weather Alert Banner — only shown for real heatwave/frost risk */}
      {weatherData?.heatAlert && (
        <div className="bg-rose-950/50 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-200 leading-relaxed flex items-start gap-2.5 shadow-inner animate-pulse">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-rose-300 mr-1.5">🔥 Προειδοποίηση Καύσωνα:</span>
            <span>Απαιτείται πότισμα στη ρίζα πριν τις 08:00 & τοποθέτηση δίχτυ σκίασης στα ευαίσθητα φυτά. Αποφύγετε μεσημεριανό πότισμα.</span>
          </div>
        </div>
      )}
      {weatherData?.frostAlert && (
        <div className="bg-blue-950/50 border border-blue-500/40 p-3 rounded-xl text-xs text-blue-200 leading-relaxed flex items-start gap-2.5 shadow-inner animate-pulse">
          <AlertCircle className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-blue-300 mr-1.5">❄️ Κίνδυνος Παγετού:</span>
            <span>Αναμένεται ελάχιστη θερμοκρασία {weatherData.minTempToday}°C απόψε. Μεταφέρετε αμέσως ευαίσθητα φυτά (εσπεριδοειδή, φίκους, βασιλικό) σε προστατευμένο εσωτερικό χώρο ή καλύψτε τα με αντιπαγετική μεμβράνη.</span>
          </div>
        </div>
      )}

      {/* Dynamic Botanical Smart Tip */}
      <div className="bg-emerald-950/40 border border-emerald-500/25 p-3 rounded-xl text-xs text-emerald-200 leading-relaxed flex items-start gap-2.5 shadow-inner">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-emerald-300 mr-1.5">🌱 Έξυπνη Γεωπονική Σύσταση:</span>
          <span>{weatherData?.smartTip}</span>
        </div>
      </div>
    </div>
  );
};
