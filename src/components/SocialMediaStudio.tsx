import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Video, 
  Instagram, 
  Facebook, 
  Smartphone, 
  Flame, 
  Layers, 
  Hash, 
  Play
} from 'lucide-react';
import { Language, SocialScript } from '../types';
import { SOCIAL_SCRIPTS_DATA } from '../data/mockData';

interface SocialMediaStudioProps {
  lang: Language;
}

export const SocialMediaStudio: React.FC<SocialMediaStudioProps> = ({ lang }) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>('script-1');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'tiktok' | 'instagram' | 'facebook'>('all');

  const filteredScripts = SOCIAL_SCRIPTS_DATA.filter((s) => {
    if (selectedPlatform === 'all') return true;
    return s.platform === selectedPlatform;
  });

  const activeScript = SOCIAL_SCRIPTS_DATA.find((s) => s.id === selectedScriptId) || SOCIAL_SCRIPTS_DATA[0];

  const handleCopy = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const fullScriptText = `🎬 TITLE: ${activeScript.title[lang]}\n\n🛑 HOOK:\n${activeScript.hook[lang]}\n\n📋 SCENES:\n${activeScript.scriptScenes.map((s) => `[${s.timestamp}]\nVisual: ${s.visual[lang]}\nVoiceover: ${s.voiceover[lang]}\nText: ${s.onScreenText[lang]}`).join('\n\n')}\n\n📝 CAPTION:\n${activeScript.caption[lang]}\n\n# HASHTAGS:\n${activeScript.hashtags.join(' ')}\n\n👉 CTA:\n${activeScript.callToAction[lang]}`;

  return (
    <section id="social-studio-section" className="py-14 sm:py-20 bg-neutral-900 text-slate-100 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-xs font-bold mb-3">
              <Share2 className="w-3.5 h-3.5" />
              <span>{lang === 'el' ? 'Viral Media Content Engine' : 'Viral Media Content Engine'}</span>
            </div>
            <h2 id="social-studio-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {lang === 'el' ? 'SmartGarden Social Media Studio' : 'SmartGarden Social Media Studio'}
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 mt-2 max-w-xl leading-relaxed">
              {lang === 'el'
                ? 'Έτοιμα scripts για TikTok & Instagram Reels, δομημένα ανά δευτερόλεπτο με hooks, σκηνικά πλάνα, λεζάντες και ελληνικά hashtags.'
                : 'Turnkey creator scripts for TikTok & Instagram Reels, formatted scene-by-scene with hooks, voiceovers, and hashtags.'}
            </p>
          </div>

          {/* Copy Full Package Button */}
          <button
            id="copy-full-script-btn"
            onClick={() => handleCopy(fullScriptText, 'full')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 shrink-0"
          >
            {copiedSection === 'full' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSection === 'full' ? (lang === 'el' ? 'Αντιγράφηκε όλο το Script!' : 'Entire Script Copied!') : (lang === 'el' ? 'Αντιγραφή Όλου του Πακέτου' : 'Copy Entire Package')}</span>
          </button>
        </div>

        {/* Script Selection Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {SOCIAL_SCRIPTS_DATA.map((script) => {
            const isSelected = script.id === selectedScriptId;
            return (
              <button
                key={script.id}
                onClick={() => setSelectedScriptId(script.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-500 shadow-md'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-slate-100 hover:border-neutral-600'
                }`}
              >
                {script.platform === 'tiktok' ? <Video className="w-3.5 h-3.5 text-pink-400" /> : <Instagram className="w-3.5 h-3.5 text-amber-400" />}
                <span>{script.title[lang]}</span>
              </button>
            );
          })}
        </div>

        {/* Studio Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Script Timeline & Scenes */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Hook Card */}
            <div className="p-5 rounded-2xl bg-neutral-800/90 border border-neutral-700 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  {lang === 'el' ? '1. The Viral Hook (Πρώτα 3 Δευτερόλεπτα)' : '1. The Viral Hook (First 3 Seconds)'}
                </span>
                <button
                  onClick={() => handleCopy(activeScript.hook[lang], 'hook')}
                  className="text-xs text-neutral-400 hover:text-slate-100 flex items-center gap-1"
                >
                  {copiedSection === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'hook' ? (lang === 'el' ? 'Αντιγράφηκε' : 'Copied') : (lang === 'el' ? 'Αντιγραφή Hook' : 'Copy')}</span>
                </button>
              </div>
              <p className="text-base font-bold text-slate-100 leading-relaxed">
                "{activeScript.hook[lang]}"
              </p>
            </div>

            {/* Step-by-Step Scenes Timeline */}
            <div className="p-6 rounded-3xl bg-neutral-800/60 border border-neutral-700 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 mb-4">
                <Play className="w-4 h-4" />
                {lang === 'el' ? '2. Σκηνοθετικό Πλάνο ανά Σκηνή' : '2. Shot-by-Shot Timeline'}
              </h3>

              <div className="space-y-4">
                {activeScript.scriptScenes.map((scene, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl bg-neutral-850 border border-neutral-700/80 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                      <span className="px-2 py-0.5 rounded bg-neutral-750 text-emerald-400 font-bold">
                        {scene.timestamp}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide">
                        Scene #{idx + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="sm:col-span-1">
                        <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-0.5">
                          {lang === 'el' ? '🎥 Πλάνο / Visual:' : '🎥 Visual Cue:'}
                        </span>
                        <p className="text-neutral-300">{scene.visual[lang]}</p>
                      </div>

                      <div className="sm:col-span-1">
                        <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-0.5">
                          {lang === 'el' ? '🎙️ Voiceover:' : '🎙️ Voiceover:'}
                        </span>
                        <p className="text-slate-100 font-medium">"{scene.voiceover[lang]}"</p>
                      </div>

                      <div className="sm:col-span-1">
                        <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-0.5">
                          {lang === 'el' ? '💬 Κείμενο Οθόνης:' : '💬 On-Screen Text:'}
                        </span>
                        <p className="text-amber-300 font-mono text-[11px]">{scene.onScreenText[lang]}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Caption, Hashtags, CTA */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Caption & Post Copy */}
            <div className="p-5 rounded-2xl bg-neutral-800/90 border border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {lang === 'el' ? 'Λεζάντα / Caption' : 'Post Caption'}
                </span>
                <button
                  onClick={() => handleCopy(activeScript.caption[lang], 'caption')}
                  className="text-xs text-neutral-400 hover:text-slate-100 flex items-center gap-1"
                >
                  {copiedSection === 'caption' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'caption' ? 'Done' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
                {activeScript.caption[lang]}
              </p>
            </div>

            {/* Greek & Mediterranean Hashtag Pack */}
            <div className="p-5 rounded-2xl bg-neutral-800/90 border border-neutral-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-emerald-400" />
                  {lang === 'el' ? 'Hashtags Πακέτο' : 'Hashtags Pack'}
                </span>
                <button
                  onClick={() => handleCopy(activeScript.hashtags.join(' '), 'tags')}
                  className="text-xs text-neutral-400 hover:text-slate-100 flex items-center gap-1"
                >
                  {copiedSection === 'tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'tags' ? 'Done' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeScript.hashtags.map((tag, i) => (
                  <span key={i} className="text-xs font-mono px-2 py-1 rounded bg-neutral-700 text-emerald-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Call to Action Box */}
            <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block mb-1">
                {lang === 'el' ? 'Call to Action (CTA)' : 'Call to Action (CTA)'}
              </span>
              <p className="text-xs text-neutral-200 font-medium">
                "{activeScript.callToAction[lang]}"
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
