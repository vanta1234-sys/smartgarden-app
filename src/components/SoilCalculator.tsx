import React, { useState } from 'react';
import { Layers, Droplets, Sprout, RectangleHorizontal, Circle } from 'lucide-react';

type PotShape = 'rectangular' | 'round';
type PlantType = 'mediterranean' | 'vegetable' | 'acidLoving';

const PLANT_PROFILES: Record<PlantType, { label: string; drainagePct: number; compostPct: number; note: string }> = {
  mediterranean: {
    label: 'Μεσογειακά / Οξύφιλα (ελιά, λεβάντα, δεντρολίβανο)',
    drainagePct: 25,
    compostPct: 15,
    note: 'Απαιτούν άριστη στράγγιση — υψηλό ποσοστό ελαφρόπετρας/περλίτη.',
  },
  vegetable: {
    label: 'Λαχανικά (ντομάτα, πιπεριά, μελιτζάνα)',
    drainagePct: 15,
    compostPct: 30,
    note: 'Χρειάζονται πλούσιο, γόνιμο υπόστρωμα με υψηλή οργανική ουσία.',
  },
  acidLoving: {
    label: 'Εσπεριδοειδή & καλλωπιστικά γλάστρας',
    drainagePct: 20,
    compostPct: 20,
    note: 'Ισορροπία στράγγισης και συγκράτησης υγρασίας.',
  },
};

export const SoilCalculator: React.FC = () => {
  const [shape, setShape] = useState<PotShape>('round');
  const [length, setLength] = useState(40);
  const [width, setWidth] = useState(25);
  const [diameter, setDiameter] = useState(35);
  const [height, setHeight] = useState(30);
  const [plantType, setPlantType] = useState<PlantType>('mediterranean');

  const volumeLiters =
    shape === 'rectangular'
      ? (length * width * height) / 1000
      : (Math.PI * (diameter / 2) ** 2 * height) / 1000;

  const profile = PLANT_PROFILES[plantType];
  const drainageLiters = (volumeLiters * profile.drainagePct) / 100;
  const compostLiters = (volumeLiters * profile.compostPct) / 100;
  const soilLiters = volumeLiters - drainageLiters - compostLiters;

  return (
    <div id="soil-calculator" className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Υπολογιστής Χώματος &amp; Γλάστρας</h3>
          <p className="text-xs text-slate-400">Πόσα λίτρα χώμα, περλίτη &amp; κομπόστ χρειάζεστε</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShape('round')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
            shape === 'round' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 text-slate-300 border-slate-800'
          }`}
        >
          <Circle className="w-3.5 h-3.5" />
          Στρογγυλή Γλάστρα
        </button>
        <button
          onClick={() => setShape('rectangular')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
            shape === 'rectangular' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 text-slate-300 border-slate-800'
          }`}
        >
          <RectangleHorizontal className="w-3.5 h-3.5" />
          Ζαρντινιέρα
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {shape === 'round' ? (
          <label className="col-span-1 text-xs text-slate-400 space-y-1">
            <span>Διάμετρος (cm)</span>
            <input
              type="number"
              value={diameter}
              onChange={(e) => setDiameter(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </label>
        ) : (
          <>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Μήκος (cm)</span>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Πλάτος (cm)</span>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </label>
          </>
        )}
        <label className="text-xs text-slate-400 space-y-1">
          <span>Βάθος / Ύψος (cm)</span>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          />
        </label>
      </div>

      <label className="block text-xs text-slate-400 space-y-1">
        <span>Τύπος Φυτού</span>
        <select
          value={plantType}
          onChange={(e) => setPlantType(e.target.value as PlantType)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer"
        >
          {Object.entries(PLANT_PROFILES).map(([key, p]) => (
            <option key={key} value={key}>{p.label}</option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-emerald-950/40 border border-emerald-500/25 rounded-xl p-3">
          <Sprout className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <div className="text-lg font-black text-emerald-300">{soilLiters.toFixed(1)}L</div>
          <div className="text-[10px] text-slate-400">Χώμα Φύτευσης</div>
        </div>
        <div className="bg-amber-950/40 border border-amber-500/25 rounded-xl p-3">
          <Droplets className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-lg font-black text-amber-300">{drainageLiters.toFixed(1)}L</div>
          <div className="text-[10px] text-slate-400">Ελαφρόπετρα/Περλίτης</div>
        </div>
        <div className="bg-purple-950/40 border border-purple-500/25 rounded-xl p-3">
          <Layers className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <div className="text-lg font-black text-purple-300">{compostLiters.toFixed(1)}L</div>
          <div className="text-[10px] text-slate-400">Κομπόστ/Χούμος</div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        <span className="font-bold text-slate-400">Σύνολο υποστρώματος: {volumeLiters.toFixed(1)}L. </span>
        {profile.note}
      </p>
    </div>
  );
};
