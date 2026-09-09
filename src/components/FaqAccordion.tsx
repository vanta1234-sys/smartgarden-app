import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FaqItem } from '../data/categoryFaqs';

interface FaqAccordionProps {
  faqs: FaqItem[];
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ faqs }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="space-y-3 pt-4 border-t border-slate-800">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
        <HelpCircle className="w-4 h-4 text-emerald-400" />
        Συχνές Ερωτήσεις
      </div>
      <div className="space-y-2">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-200">{faq.question}</span>
              <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === idx && (
              <div className="px-4 pb-3 text-xs text-slate-400 leading-relaxed">{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
