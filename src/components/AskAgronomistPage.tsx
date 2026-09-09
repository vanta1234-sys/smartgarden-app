import React, { useEffect, useState } from 'react';
import { ArrowLeft, MessageCircleQuestion, Send, CheckCircle2, AlertCircle, RotateCw } from 'lucide-react';

interface PublicQuestion {
  id: string;
  slug: string;
  question: string;
  answer: string;
  askedBy: string;
  approvedAt: string;
}

interface AskAgronomistPageProps {
  onBack: () => void;
}

export const AskAgronomistPage: React.FC<AskAgronomistPageProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Ρωτήστε τον Γεωπόνο: Απαντήσεις σε Πραγματικές Ερωτήσεις Κηπουρικής — SmartGarden.gr';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'Στείλτε την ερώτησή σας για φυτά, γλάστρες, ασθένειες ή πότισμα και πάρτε τεκμηριωμένη απάντηση. Δείτε απαντήσεις σε πραγματικές ερωτήσεις άλλων αναγνωστών.'
      );
    }

    fetch('/qa.php?action=list')
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // FAQPage schema built from the questions actually rendered on this page. Google's
  // structured-data guidelines require the markup to match visible content — an earlier
  // templated FAQ schema on this site had no matching visible Q&A, which is a real risk.
  useEffect(() => {
    const existing = document.getElementById('qa-faq-schema');
    if (existing) existing.remove();
    if (questions.length === 0) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: questions.slice(0, 30).map((q) => ({
        '@type': 'Question',
        name: q.question,
        acceptedAnswer: { '@type': 'Answer', text: q.answer },
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'qa-faq-schema';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('qa-faq-schema');
      if (el) el.remove();
    };
  }, [questions]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 15) {
      setResult({ ok: false, message: 'Περιγράψτε λίγο περισσότερο το πρόβλημα (τουλάχιστον 15 χαρακτήρες).' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/qa.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), name: name.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ok: true, message: data.message });
        setQuestion('');
        setName('');
      } else {
        setResult({ ok: false, message: data.error || 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.' });
      }
    } catch {
      setResult({ ok: false, message: 'Πρόβλημα σύνδεσης. Δοκιμάστε ξανά σε λίγο.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div role="main" className="min-h-screen bg-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          Πίσω στην αρχική
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <MessageCircleQuestion className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">Ρωτήστε τον Γεωπόνο</h1>
            <p className="text-sm text-slate-400">Πραγματικές ερωτήσεις αναγνωστών, με τεκμηριωμένες απαντήσεις</p>
          </div>
        </div>

        <form onSubmit={submit} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <label htmlFor="qa-question" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Η ερώτησή σας
          </label>
          <textarea
            id="qa-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder="π.χ. Η λεμονιά μου σε γλάστρα έχει κίτρινα φύλλα με πράσινα νεύρα εδώ και έναν μήνα. Ποτίζω κάθε 3 μέρες και είναι σε νότιο μπαλκόνι στη Θεσσαλονίκη. Τι φταίει;"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 resize-y"
          />
          <p className="text-[11px] text-slate-500">
            Όσο πιο συγκεκριμένα περιγράψετε (είδος φυτού, περιοχή, συχνότητα ποτίσματος, πόσο καιρό κρατά το
            πρόβλημα), τόσο πιο χρήσιμη η απάντηση. {question.length}/600 χαρακτήρες.
          </p>

          <label htmlFor="qa-name" className="block text-xs font-bold text-slate-300 uppercase tracking-wider pt-1">
            Όνομα (προαιρετικό)
          </label>
          <input
            id="qa-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Πώς θέλετε να εμφανίζεστε"
            className="w-full max-w-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
          />

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
            >
              {submitting ? <RotateCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Στείλτε την ερώτηση
            </button>
            <span className="text-[11px] text-slate-500">Δεν ζητάμε email. Η απάντηση δημοσιεύεται εδώ.</span>
          </div>

          {result && (
            <div
              className={`flex items-start gap-2 text-sm rounded-xl p-3 ${
                result.ok
                  ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200'
                  : 'bg-rose-950/40 border border-rose-800/60 text-rose-200'
              }`}
            >
              {result.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              {result.message}
            </div>
          )}
        </form>

        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Κάθε απάντηση ελέγχεται από άνθρωπο πριν δημοσιευτεί. Δεν δημοσιεύουμε αυτόματα απαντήσεις
            τεχνητής νοημοσύνης χωρίς έλεγχο — μια λάθος γεωπονική συμβουλή μπορεί να κοστίσει ένα φυτό ή μια
            ολόκληρη σοδειά.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-100">
            Απαντημένες ερωτήσεις {questions.length > 0 && <span className="text-slate-500 font-semibold">({questions.length})</span>}
          </h2>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-6">
              <RotateCw className="w-4 h-4 animate-spin" />
              Φόρτωση ερωτήσεων...
            </div>
          ) : questions.length === 0 ? (
            <p className="text-sm text-slate-400 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              Δεν έχει δημοσιευτεί ακόμη καμία ερώτηση. Κάντε εσείς την πρώτη — απαντάμε σε κάθε ερώτηση που
              αφορά φυτά, γλάστρες, ασθένειες, πότισμα ή λίπανση.
            </p>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenId(openId === q.id ? null : q.id)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 leading-snug">{q.question}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {q.askedBy ? `${q.askedBy} · ` : ''}
                      {q.approvedAt?.slice(0, 10)}
                    </p>
                  </div>
                  <span className="text-slate-500 text-lg leading-none shrink-0">{openId === q.id ? '−' : '+'}</span>
                </button>
                {openId === q.id && (
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line border-t border-slate-900 pt-3">
                      {q.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
