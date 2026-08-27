import React, { useState } from 'react';
import { 
  BookOpen, 
  Share2, 
  Sun, 
  Wind, 
  Droplets, 
  Sparkles, 
  Radio, 
  ArrowUpRight,
  TrendingUp,
  Cpu,
  CheckCircle2,
  Film
} from 'lucide-react';
import { CityTelemetry, Language } from '../types';
import { CITIES_TELEMETRY } from '../data/mockData';

interface HeroProps {
  lang: Language;
  onReadArticles: () => void;
  onOpenSocialStudio: () => void;
  onOpenAgronomist: () => void;
  onOpenTelemetryHub: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  lang,
  onReadArticles,
  onOpenSocialStudio,
  onOpenAgronomist,
  onOpenTelemetryHub,
}) => {
  const [selectedCityId, setSelectedCityId] = useState<string>('athens');

  const currentCity = CITIES_TELEMETRY.find((c) => c.id === selectedCityId) || CITIES_TELEMETRY[0];

  return (
    <section id="hero-section" className="relative pt-6 pb-12 lg:py-16 overflow-hidden bg-radial from-emerald-50/40 via-transparent to-transparent dark:from-emerald-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Badges Row */}
        <div id="hero-badges" className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-6">
          <div 
            id="badge-hub"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{lang === 'el' ? 'SmartGarden Digital Magazine & Media Hub' : 'SmartGarden Digital Magazine & Media Hub'}</span>
          </div>

          <div 
            id="badge-daily-scripts"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100/90 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium shadow-2xs"
          >
            <span className="text-neutral-500 dark:text-neutral-400">📋</span>
            <span>{lang === 'el' ? '3x Καθημερινά Άρθρα + Έτοιμα Social Media Scripts' : '3x Daily Articles + Ready Social Media Scripts'}</span>
          </div>
        </div>

        {/* Hero Main Grid (Left Content + Right Telemetry Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Heading, Subtitle, CTAs, Metrics */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            <h1 id="hero-heading" className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.15] mb-5">
              {lang === 'el' ? (
                <>
                  Οδηγοί για <span className="text-[#0d9488] dark:text-[#14b8a6]">Μπαλκόνι &amp; Κήπο</span> με Τεχνητή Νοημοσύνη.
                </>
              ) : (
                <>
                  Guides for <span className="text-[#0d9488] dark:text-[#14b8a6]">Balcony &amp; Garden</span> powered by Artificial Intelligence.
                </>
              )}
            </h1>

            <p id="hero-subtitle" className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl mb-8">
              {lang === 'el'
                ? 'Ψηφιακό περιοδικό για το ελληνικό μπαλκόνι, τις γλάστρες, τον λαχανόκηπο και τον κήπο. Καθημερινή ανάλυση καιρού, reviews κορυφαίου εξοπλισμού και έτοιμο viral περιεχόμενο για Facebook, Instagram & TikTok.'
                : 'Digital magazine for the Mediterranean balcony, container gardens, vegetable patches, and lawns. Daily weather analysis, smart gear reviews, and ready viral content for Facebook, Instagram & TikTok.'}
            </p>

            {/* Action Buttons */}
            <div id="hero-cta-buttons" className="flex flex-wrap items-center gap-3.5 mb-10">
              <button
                id="hero-read-today-btn"
                onClick={onReadArticles}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-bold text-sm tracking-tight shadow-md shadow-emerald-900/20 hover:shadow-lg transition-all active:scale-98"
              >
                <BookOpen className="w-4 h-4 stroke-[2.4]" />
                <span>{lang === 'el' ? 'Διαβάστε τα Σημερινά Άρθρα' : 'Read Today\'s Articles'}</span>
              </button>

              <button
                id="hero-social-studio-btn"
                onClick={onOpenSocialStudio}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-100 font-semibold text-sm shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition-all active:scale-98"
              >
                <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'el' ? 'Social Media Studio' : 'Social Media Studio'}</span>
              </button>
            </div>

            {/* Key Metrics / Stats Row */}
            <div id="hero-metrics-row" className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200/80 dark:border-neutral-800">
              <div id="metric-articles" className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  3×/ημέρα
                </span>
                <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {lang === 'el' ? 'ΝΕΑ ΑΡΘΡΑ' : 'NEW ARTICLES'}
                </span>
              </div>

              <div id="metric-social" className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  100%
                </span>
                <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {lang === 'el' ? 'SOCIAL MEDIA READY' : 'SOCIAL MEDIA READY'}
                </span>
              </div>

              <div id="metric-gear" className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  Top Gear
                </span>
                <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {lang === 'el' ? 'AFFILIATE REVIEWS' : 'AFFILIATE REVIEWS'}
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Live Telemetry & Evapotranspiration Card (exact matching screenshot) */}
          <div className="lg:col-span-5">
            <div 
              id="live-telemetry-card"
              className="bg-white dark:bg-neutral-850 border border-neutral-200/90 dark:border-neutral-700/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-neutral-900/5 transition-all relative overflow-hidden"
            >
              {/* Telemetry Header */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    {lang === 'el' ? 'ΖΩΝΤΑΝΗ ΤΗΛΕΜΕΤΡΙΑ & ΕΞΑΤΜΙΣΗ' : 'LIVE TELEMETRY & EVAPOTRANSPIRATION'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
                  IoT Live Feed
                </span>
              </div>

              {/* City Selection Tabs */}
              <div id="telemetry-city-tabs" className="flex items-center gap-1.5 mt-4 p-1 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/80 overflow-x-auto no-scrollbar">
                {CITIES_TELEMETRY.map((city) => {
                  const isSelected = city.id === selectedCityId;
                  const label = city.id === 'athens' ? 'Athens' : 
                               city.id === 'mykonos' ? 'Mykonos' : 
                               city.id === 'thessaloniki' ? 'Thessaloniki' : 
                               city.id === 'chania' ? 'Chania' : 'Patras';
                  return (
                    <button
                      key={city.id}
                      id={`tab-city-${city.id}`}
                      onClick={() => setSelectedCityId(city.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                        isSelected
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* City Info & Temperature */}
              <div className="flex items-start justify-between mt-6">
                <div>
                  <h3 id="telemetry-city-name" className="text-xl font-bold text-neutral-900 dark:text-white">
                    {currentCity.name[lang]}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {lang === 'el' ? 'Τοπική Εξάτμιση Εδάφους (ET)' : 'Local Soil Evapotranspiration (ET)'}
                  </p>
                </div>

                <div id="telemetry-temperature" className="flex items-center gap-1.5 text-neutral-900 dark:text-white">
                  <Sun className="w-6 h-6 text-amber-500 stroke-[2.2]" />
                  <span className="text-3xl font-extrabold tracking-tight">
                    {currentCity.temp}°C
                  </span>
                </div>
              </div>

              {/* 3 Metric Value Boxes */}
              <div id="telemetry-metrics-grid" className="grid grid-cols-3 gap-2.5 mt-5">
                
                {/* Humidity Box */}
                <div id="box-humidity" className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-750 flex flex-col">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    {lang === 'el' ? 'Υγρασία' : 'Humidity'}
                  </span>
                  <span className="text-base font-bold text-neutral-900 dark:text-white mt-1">
                    {currentCity.humidity}%
                  </span>
                </div>

                {/* UV Index Box */}
                <div id="box-uv" className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-750 flex flex-col">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    {lang === 'el' ? 'Δείκτης UV' : 'UV Index'}
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1.5 leading-tight">
                    {currentCity.uvLevel[lang]}
                  </span>
                </div>

                {/* Evapotranspiration Box */}
                <div id="box-et" className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-750 flex flex-col">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    {lang === 'el' ? 'Εξάτμιση ET' : 'Evap. ET'}
                  </span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {currentCity.evapotranspiration} mm
                  </span>
                </div>

              </div>

              {/* Smart Tip Highlight Box */}
              <div 
                id="telemetry-smart-tip-box"
                className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/70"
              >
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                    <strong className="font-bold text-emerald-900 dark:text-emerald-300">Smart Tip: </strong>
                    {currentCity.smartTip[lang]}
                  </div>
                </div>
              </div>

              {/* Interactive footer links on card */}
              <div className="mt-4 pt-3 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  {lang === 'el' ? 'Προτεινόμενο πότισμα: ' : 'Recommended watering: '}
                  <strong className="text-neutral-700 dark:text-neutral-200 font-semibold">{currentCity.recommendedWateringTime[lang]}</strong>
                </span>
                <button
                  onClick={onOpenTelemetryHub}
                  className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                >
                  <span>{lang === 'el' ? 'Πλήρης Ανάλυση' : 'Full Analysis'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
