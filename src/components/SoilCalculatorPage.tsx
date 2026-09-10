import React, { useEffect } from 'react';
import { ArrowLeft, Leaf } from 'lucide-react';
import { SoilCalculator } from './SoilCalculator';

/**
 * Standalone landing target for a QR code at a physical nursery checkout counter —
 * a customer holding a bag of soil scans this, not the homepage. The full homepage has
 * dozens of widgets and a 66-article grid; this is one tool, full width, nothing else,
 * so it loads fast on whatever signal the store has and gets to an answer in one screen.
 */
export const SoilCalculatorPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  useEffect(() => {
    document.title = 'Υπολογιστής Χώματος & Γλάστρας: Πόσα Λίτρα Χρειάζεστε — SmartGarden.gr';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Δωρεάν υπολογιστής: δώστε τις διαστάσεις της γλάστρας σας και τον τύπο φυτού και μάθετε ακριβώς πόσα λίτρα χώμα, περλίτη και κομπόστ χρειάζεστε.'
      );
    }
  }, []);

  return (
    <div role="main" className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-md space-y-5">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          smartgarden.gr
        </button>

        <SoilCalculator />

        <div className="flex items-center gap-2 justify-center text-[11px] text-slate-500 pt-2">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          Δωρεάν εργαλείο από το SmartGarden.gr — δεκάδες ακόμη οδηγοί &amp; υπολογιστές κηπουρικής
        </div>
      </div>
    </div>
  );
};
