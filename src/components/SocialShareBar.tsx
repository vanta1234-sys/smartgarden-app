import React, { useState } from 'react';
import { 
  Share2, 
  Check, 
  Copy, 
  MessageCircle, 
  Facebook, 
  Send
} from 'lucide-react';

interface SocialShareBarProps {
  title: string;
  url?: string;
  summary?: string;
  image?: string;
  className?: string;
}

export const SocialShareBar: React.FC<SocialShareBarProps> = ({
  title,
  url = typeof window !== 'undefined' ? window.location.href : 'https://smartgarden.gr',
  summary = '',
  image = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedSummary = encodeURIComponent(summary);
  const encodedImage = encodeURIComponent(image);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: summary || title,
          url,
        });
      } catch (e) {
        // user cancelled or failed
      }
    } else {
      handleCopy();
    }
  };

  // Greek channels: Viber, WhatsApp, Facebook, Pinterest, Twitter/X
  const viberUrl = `viber://forward?text=${encodedTitle}%20${encodedUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 border border-slate-800/90 rounded-xl backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
        <Share2 className="w-4 h-4 text-emerald-400" />
        <span>Κοινοποίηση Οδηγού:</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Viber */}
        <a
          href={viberUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Κοινοποίηση στο Viber"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#7360f2]/20 hover:bg-[#7360f2]/30 text-[#a89bff] border border-[#7360f2]/40 text-xs font-medium transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Viber</span>
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Κοινοποίηση στο WhatsApp"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        {/* Facebook */}
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Κοινοποίηση στο Facebook"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors"
        >
          <Facebook className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Facebook</span>
        </a>

        {/* Pinterest */}
        <a
          href={pinterestUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Αποθήκευση στο Pinterest"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-medium transition-colors"
        >
          <span className="font-bold text-xs">P</span>
          <span className="hidden sm:inline">Pinterest</span>
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 scale-105'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title="Αντιγραφή Συνδέσμου"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Αντιγράφηκε!' : 'Αντιγραφή Link'}</span>
        </button>
      </div>
    </div>
  );
};
