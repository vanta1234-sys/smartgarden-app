import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

export const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/newsletter-subscribe.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Κάτι πήγε στραβά');
      }
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Η εγγραφή απέτυχε. Δοκιμάστε ξανά.');
    }
  };

  if (status === 'success') {
    return (
      <div id="newsletter-signup" className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 flex items-center gap-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
        <p className="text-sm text-emerald-200 font-medium">Εγγραφήκατε επιτυχώς! Θα λαμβάνετε τις καλύτερες συμβουλές κηπουρικής στο email σας.</p>
      </div>
    );
  }

  return (
    <div id="newsletter-signup" className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/20 rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Μείνετε ενημερωμένοι</h3>
          <p className="text-xs text-slate-400">Εβδομαδιαίες συμβουλές κηπουρικής &amp; ειδοποιήσεις καιρού στο email σας, δωρεάν.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="το-email-σας@example.com"
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {status === 'loading' ? 'Εγγραφή...' : 'Εγγραφή'}
        </button>
      </form>
      {status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  );
};
