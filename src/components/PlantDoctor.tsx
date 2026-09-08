import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  Stethoscope,
} from 'lucide-react';

interface DiagnosisResult {
  problem: string;
  confidence: 'high' | 'medium' | 'low' | string;
  cause: string;
  treatment: string;
  isHealthy: boolean;
}

const MAX_DIMENSION = 1024;

// Downscale + re-encode client-side before upload so a 12MP phone photo doesn't
// blow past the server's ~4MB base64 cap or take forever over a mobile connection.
function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Αποτυχία ανάγνωσης αρχείου'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Μη έγκυρη εικόνα'));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const PlantDoctor: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Παρακαλώ επιλέξτε αρχείο εικόνας (JPG, PNG).');
      return;
    }
    setError(null);
    setResult(null);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPreviewUrl(dataUrl);
    } catch (err) {
      setError('Δεν ήταν δυνατή η επεξεργασία της εικόνας.');
    }
  };

  const handleDiagnose = async () => {
    if (!previewUrl) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/plant-diagnosis.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: previewUrl, note }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Η διάγνωση απέτυχε');
      }
      setResult({
        problem: data.problem,
        confidence: data.confidence,
        cause: data.cause,
        treatment: data.treatment,
        isHealthy: data.isHealthy,
      });
    } catch (err) {
      setError('Δεν ήταν δυνατή η ανάλυση αυτή τη στιγμή. Δοκιμάστε ξανά σε λίγο.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confidenceLabel = (c: string) => {
    if (c === 'high') return 'Υψηλή Βεβαιότητα';
    if (c === 'low') return 'Χαμηλή Βεβαιότητα';
    return 'Μέτρια Βεβαιότητα';
  };

  return (
    <div id="plant-doctor" className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Stethoscope className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">AI Φυτοπαθολογικός Σύμβουλος</h3>
          <p className="text-xs text-slate-400">Ανεβάστε φωτογραφία ενός φύλλου ή φυτού για άμεση διάγνωση</p>
        </div>
      </div>

      {!previewUrl && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors bg-slate-900/60"
        >
          <div className="flex items-center gap-3 text-slate-500">
            <Camera className="w-8 h-8" />
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-300 font-medium">Πατήστε για να ανεβάσετε φωτογραφία</p>
          <p className="text-[11px] text-slate-400">JPG ή PNG, έως ~10MB (θα σμικρυνθεί αυτόματα)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
        </div>
      )}

      {previewUrl && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800">
            <img src={previewUrl} alt="Φωτογραφία φυτού προς διάγνωση" className="w-full max-h-72 object-contain bg-slate-900" />
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 bg-slate-950/80 hover:bg-slate-900 text-slate-300 hover:text-white p-1.5 rounded-lg border border-slate-700 cursor-pointer"
              title="Αφαίρεση εικόνας"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!result && (
            <>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Προαιρετικό: περιγράψτε σύντομα τι παρατηρείτε (π.χ. κιτρίνισμα φύλλων)"
                maxLength={200}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={handleDiagnose}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ανάλυση εικόνας...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Ανάλυση με AI
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="bg-rose-950/40 border border-rose-800/60 px-3.5 py-2.5 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className={`p-4 rounded-2xl border ${result.isHealthy ? 'bg-emerald-950/40 border-emerald-600/40' : 'bg-amber-950/40 border-amber-600/40'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.isHealthy ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <h4 className="text-sm font-extrabold text-white">{result.problem}</h4>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">
                {confidenceLabel(result.confidence)}
              </span>
            </div>
            {result.cause && (
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                <span className="font-bold text-slate-200">Αιτία: </span>{result.cause}
              </p>
            )}
            {result.treatment && (
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-200">Θεραπεία: </span>{result.treatment}
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            Νέα Ανάλυση
          </button>
          <p className="text-[10px] text-slate-500 text-center">
            Η διάγνωση δημιουργείται από AI και δεν υποκαθιστά επαγγελματία γεωπόνο σε σοβαρές περιπτώσεις.
          </p>
        </div>
      )}
    </div>
  );
};
