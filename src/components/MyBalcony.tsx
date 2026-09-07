import React, { useEffect, useState } from 'react';
import { Sprout, Droplets, Leaf, Plus, X, CheckCircle2 } from 'lucide-react';
import { LiveWeatherData } from '../services/weatherService';

interface PlantProfile {
  emoji: string;
  wateringDays: number;
  fertilizingDays: number;
  frostSensitive: boolean;
}

const PLANT_CATALOG: Record<string, PlantProfile> = {
  'Λεμονιά / Εσπεριδοειδή': { emoji: '🍋', wateringDays: 3, fertilizingDays: 20, frostSensitive: true },
  'Ελιά (Μπονσάι/Γλάστρα)': { emoji: '🫒', wateringDays: 5, fertilizingDays: 30, frostSensitive: false },
  'Βασιλικός': { emoji: '🌿', wateringDays: 2, fertilizingDays: 14, frostSensitive: true },
  'Ντοματίνια': { emoji: '🍅', wateringDays: 2, fertilizingDays: 10, frostSensitive: true },
  'Γεράνι / Πελαργόνιο': { emoji: '🌸', wateringDays: 4, fertilizingDays: 21, frostSensitive: true },
  'Γαρδένια': { emoji: '🌼', wateringDays: 3, fertilizingDays: 21, frostSensitive: true },
  'Μαρούλι / Σαλατικά': { emoji: '🥬', wateringDays: 2, fertilizingDays: 14, frostSensitive: false },
  'Πιπεριά': { emoji: '🌶️', wateringDays: 2, fertilizingDays: 14, frostSensitive: true },
};

interface SavedPlant {
  name: string;
  lastWatered: string; // ISO date
  lastFertilized: string; // ISO date
}

const STORAGE_KEY = 'smartgarden_my_balcony';

function loadSaved(): SavedPlant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSaved(plants: SavedPlant[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
  } catch {
    // localStorage unavailable — silently no-op
  }
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function todayIso(): string {
  return new Date().toISOString();
}

interface MyBalconyProps {
  currentWeather: LiveWeatherData | null;
}

export const MyBalcony: React.FC<MyBalconyProps> = ({ currentWeather }) => {
  const [plants, setPlants] = useState<SavedPlant[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPlants(loadSaved());
    setHydrated(true);
  }, []);

  const addPlant = (name: string) => {
    if (plants.some((p) => p.name === name)) return;
    const next = [...plants, { name, lastWatered: todayIso(), lastFertilized: todayIso() }];
    setPlants(next);
    saveSaved(next);
  };

  const removePlant = (name: string) => {
    const next = plants.filter((p) => p.name !== name);
    setPlants(next);
    saveSaved(next);
  };

  const markWatered = (name: string) => {
    const next = plants.map((p) => (p.name === name ? { ...p, lastWatered: todayIso() } : p));
    setPlants(next);
    saveSaved(next);
  };

  const markFertilized = (name: string) => {
    const next = plants.map((p) => (p.name === name ? { ...p, lastFertilized: todayIso() } : p));
    setPlants(next);
    saveSaved(next);
  };

  const getTip = (plant: SavedPlant): { text: string; urgent: boolean } => {
    const profile = PLANT_CATALOG[plant.name];
    if (!profile) return { text: 'Άγνωστο φυτό.', urgent: false };

    const wDays = daysSince(plant.lastWatered);
    const fDays = daysSince(plant.lastFertilized);
    const heat = currentWeather?.heatAlert;
    const frost = currentWeather?.frostAlert;

    if (frost && profile.frostSensitive) {
      return { text: `❄️ Κίνδυνος παγετού απόψε — μετάφερέ το σε προστατευμένο σημείο.`, urgent: true };
    }
    if (heat && wDays >= 1) {
      return { text: `🔥 Καύσωνας σήμερα — χρειάζεται πότισμα στη ρίζα πριν τις 08:00.`, urgent: true };
    }
    if (wDays >= profile.wateringDays) {
      return { text: `💧 Πέρασαν ${wDays} μέρες από το τελευταίο πότισμα — ώρα για νερό.`, urgent: true };
    }
    if (fDays >= profile.fertilizingDays) {
      return { text: `🧪 Πέρασαν ${fDays} μέρες από την τελευταία λίπανση.`, urgent: false };
    }
    return { text: `✅ Όλα καλά — επόμενο πότισμα σε ${profile.wateringDays - wDays} μέρες.`, urgent: false };
  };

  if (!hydrated) return null;

  return (
    <div id="my-balcony" className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Το Μπαλκόνι μου</h3>
            <p className="text-xs text-slate-400">Καθημερινές υπενθυμίσεις για τα δικά σου φυτά — αποθηκεύεται στη συσκευή σου</p>
          </div>
        </div>
        <button
          onClick={() => setShowPicker((s) => !s)}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Προσθήκη
        </button>
      </div>

      {showPicker && (
        <div className="flex flex-wrap gap-2 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
          {Object.entries(PLANT_CATALOG)
            .filter(([name]) => !plants.some((p) => p.name === name))
            .map(([name, profile]) => (
              <button
                key={name}
                onClick={() => addPlant(name)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition-colors"
              >
                <span>{profile.emoji}</span>
                {name}
              </button>
            ))}
        </div>
      )}

      {plants.length === 0 && !showPicker && (
        <p className="text-sm text-slate-400">Δεν έχεις προσθέσει ακόμα φυτά. Πάτησε "Προσθήκη" για να ξεκινήσεις τις καθημερινές σου υπενθυμίσεις.</p>
      )}

      <div className="space-y-2.5">
        {plants.map((plant) => {
          const profile = PLANT_CATALOG[plant.name];
          const tip = getTip(plant);
          return (
            <div
              key={plant.name}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl p-3 border ${
                tip.urgent ? 'bg-amber-950/30 border-amber-500/30' : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{profile?.emoji || '🌱'}</span>
                <div>
                  <div className="text-sm font-bold text-white">{plant.name}</div>
                  <div className="text-xs text-slate-300">{tip.text}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => markWatered(plant.name)}
                  title="Πότισα σήμερα"
                  className="flex items-center gap-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <Droplets className="w-3 h-3" />
                  Πότισμα
                </button>
                <button
                  onClick={() => markFertilized(plant.name)}
                  title="Λίπανα σήμερα"
                  className="flex items-center gap-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <Leaf className="w-3 h-3" />
                  Λίπανση
                </button>
                <button
                  onClick={() => removePlant(plant.name)}
                  title="Αφαίρεση"
                  className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {plants.length > 0 && (
        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3" />
          Οι υπενθυμίσεις βασίζονται στα σημερινά δεδομένα καιρού & ET₀ του site.
        </p>
      )}
    </div>
  );
};
