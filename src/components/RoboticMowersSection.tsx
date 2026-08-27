import React, { useState } from 'react';
import { 
  Scissors, 
  Check, 
  X, 
  Star, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Mountain, 
  Navigation, 
  BatteryCharging 
} from 'lucide-react';
import { Language, RoboticMower } from '../types';
import { ROBOTIC_MOWERS_DATA } from '../data/mockData';

interface RoboticMowersSectionProps {
  lang: Language;
}

export const RoboticMowersSection: React.FC<RoboticMowersSectionProps> = ({ lang }) => {
  const [selectedMowerId, setSelectedMowerId] = useState<string>(ROBOTIC_MOWERS_DATA[0].id);

  return (
    <section id="mowers-section" className="py-14 sm:py-20 bg-neutral-50 dark:bg-neutral-900/60 border-t border-neutral-200/80 dark:border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 shadow-2xs">
            <Scissors className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'el' ? 'Top Gear & Hardware Reviews 2026' : 'Top Gear & Hardware Reviews 2026'}</span>
          </div>

          <h2 id="mowers-title" className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {lang === 'el' ? 'Τα Καλύτερα Ρομποτικά Χλοοκοπτικά Χωρίς Καλώδιο' : 'Best Wire-Free Robotic Lawn Mowers'}
          </h2>

          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 mt-3 leading-relaxed">
            {lang === 'el'
              ? 'Δοκιμάζουμε και συγκρίνουμε τα κορυφαία μοντέλα με RTK-GPS και AI LiDAR σε πραγματικές συνθήκες ελληνικών κήπων.'
              : 'Tested on Mediterranean terrain with olive trees, gravel pathways, and slopes.'}
          </p>
        </div>

        {/* 3-Cards Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {ROBOTIC_MOWERS_DATA.map((mower) => (
            <div
              key={mower.id}
              id={`mower-card-${mower.id}`}
              className="bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-750 rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:border-emerald-500/80 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Product Image & Badge */}
                <div className="relative h-52 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={mower.image}
                    alt={mower.name}
                    className="w-full h-full object-cover"
                  />
                  {mower.badge && (
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-700 text-white text-[11px] font-bold shadow-md">
                      {mower.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white font-extrabold text-sm">
                    {mower.price}
                  </span>
                </div>

                {/* Body Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {mower.brand}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{mower.rating}</span>
                      <span className="text-neutral-400 font-normal">({mower.reviewsCount})</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    {mower.name}
                  </h3>

                  {/* Quick Specs Grid */}
                  <div className="grid grid-cols-2 gap-2.5 my-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-medium">Έκταση</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">{mower.coverageM2} m²</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <Mountain className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-medium">Μέγιστη Κλίση</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">{mower.maxSlope}%</p>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center gap-2 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800">
                      <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-medium">Πλοήγηση</p>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate">{mower.navigation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pros List */}
                  <div className="space-y-1.5 mb-4">
                    <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                      {lang === 'el' ? 'Πλεονεκτήματα:' : 'Key Advantages:'}
                    </span>
                    {mower.pros[lang].slice(0, 2).map((pro, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-neutral-700 dark:text-neutral-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>

                  {/* Best For Tag */}
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 italic bg-neutral-50 dark:bg-neutral-800 p-2.5 rounded-xl">
                    "{mower.bestFor[lang]}"
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <a
                  href="#affiliate"
                  onClick={(e) => e.preventDefault()}
                  className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>{lang === 'el' ? 'Αναλυτικό Review & Τιμές' : 'Full Review & Specs'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
