import React, { useState } from 'react';
import { 
  Sprout, 
  Mail, 
  Send, 
  Check, 
  Heart, 
  Globe, 
  Shield, 
  FileText, 
  Sparkles 
} from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  lang: Language;
  onNavigate: (sectionId: string) => void;
  onOpenAgronomist: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  lang,
  onNavigate,
  onOpenAgronomist,
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.includes('@')) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setNewsletterEmail('');
    }, 4000);
  };

  return (
    <footer id="site-footer" className="bg-neutral-950 text-neutral-300 border-t border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-14">
          
          {/* Brand Col */}
          <div className="lg:col-span-5 space-y-4">
            <div 
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => onNavigate('hero')}
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-100">
                  SmartGarden<span className="text-emerald-400">.gr</span>
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-sm">
              {lang === 'el'
                ? 'Το 1ο ελληνικό ψηφιακό περιοδικό κηπουρικής & μπαλκονιού με ζωντανή τηλεμετρία εξάτμισης, τεχνητή νοημοσύνη και έτοιμα social media scripts.'
                : 'The premier Greek digital magazine for urban gardening, microclimate evapotranspiration telemetry, and AI botanical assistants.'}
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'el' ? '3 Καθημερινά Άρθρα + Έτοιμα Scripts' : '3 Daily Articles + Turnkey Scripts'}</span>
            </div>
          </div>

          {/* Nav Col 1 */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {lang === 'el' ? 'Θεματικές' : 'Sections'}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <button onClick={() => onNavigate('articles')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'el' ? 'Μπαλκόνι & Γλάστρες' : 'Balcony & Containers'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('articles')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'el' ? 'Βιολογικός Λαχανόκηπος' : 'Organic Veggie Patch'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('telemetry')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'el' ? 'Αυτόματο Πότισμα IoT' : 'Smart Irrigation IoT'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('mowers')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'el' ? 'Ρομποτικά Mowers 2026' : 'Wire-free Robot Mowers'}
                </button>
              </li>
            </ul>
          </div>

          {/* Nav Col 2 */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {lang === 'el' ? 'Εργαλεία AI' : 'AI Tools'}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <button onClick={onOpenAgronomist} className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold flex items-center gap-1">
                  <span>{lang === 'el' ? 'AI Γεωπόνος' : 'AI Agronomist'}</span>
                  <span className="text-[10px] px-1 bg-emerald-900 border border-emerald-700 rounded">PRO</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('social-studio')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'el' ? 'Social Media Studio' : 'Social Media Studio'}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('telemetry')} className="hover:text-emerald-400 transition-colors">
                  {lang === 'el' ? 'Υπολογιστής Εξάτμισης' : 'Evapotranspiration Calc'}
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              {lang === 'el' ? 'Καθημερινό Newsletter' : 'Daily Newsletter'}
            </h4>
            <p className="text-xs text-neutral-400">
              {lang === 'el' ? 'Λάβετε την πρωινή πρόγνωση εξάτμισης & 1 νέο οδηγό κάθε μέρα.' : 'Receive morning ET telemetry alerts & 1 daily guide.'}
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="name@example.gr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-slate-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={subscribed}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                {subscribed ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{subscribed ? (lang === 'el' ? 'Εγγραφήκατε με επιτυχία!' : 'Subscribed!') : (lang === 'el' ? 'Εγγραφή Δωρεάν' : 'Subscribe Free')}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-neutral-850 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© 2026 SmartGarden.gr — Όλα τα δικαιώματα διατηρούνται.</p>
          <div className="flex items-center gap-4">
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-neutral-400">
              {lang === 'el' ? 'Πολιτική Απορρήτου' : 'Privacy Policy'}
            </a>
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-neutral-400">
              {lang === 'el' ? 'Όροι Χρήσης' : 'Terms'}
            </a>
            <a href="#editorial" onClick={(e) => e.preventDefault()} className="hover:text-neutral-400">
              {lang === 'el' ? 'Συντακτική Ομάδα' : 'Editorial Team'}
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
