import React, { useEffect, useRef, useState } from 'react';
import { AD_CLIENT } from '../config/ads';

interface AdSlotProps {
  /** data-ad-slot from AdSense. Empty renders nothing — see src/config/ads.ts. */
  slot: string;
  /** Shown above the unit. Required by AdSense policy to not look like site content. */
  label?: string;
  className?: string;
}

/**
 * One placed AdSense unit.
 *
 * Renders nothing when no slot is configured, so the site never ships an empty grey box
 * or a "Διαφήμιση" heading with nothing under it. Pushes once per mount and guards the
 * push, because React runs effects twice in StrictMode and AdSense throws
 * "adsbygoogle.push() error: All ins elements ... already have ads in them" on the second.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ slot, label = 'Διαφήμιση', className = '' }) => {
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement | null>(null);
  const [unfilled, setUnfilled] = useState(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // A blocker, or the script never loaded. Nothing to recover — the slot stays empty.
    }
  }, [slot]);

  // AdSense marks a unit it had nothing to fill with data-ad-status="unfilled" and leaves
  // the reserved height behind. On a site with no fill yet that is a 280px hole under a
  // heading that says "Διαφήμιση" — worse than showing nothing, so the whole block goes.
  useEffect(() => {
    const el = insRef.current;
    if (!slot || !el) return;
    const check = () => {
      const status = el.getAttribute('data-ad-status');
      if (status === 'unfilled') setUnfilled(true);
      else if (status === 'filled') setUnfilled(false);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });
    // A unit the script never touches at all — blocked, or no script — is also nothing.
    const giveUp = window.setTimeout(() => {
      if (!el.getAttribute('data-ad-status')) setUnfilled(true);
    }, 6000);
    return () => { observer.disconnect(); window.clearTimeout(giveUp); };
  }, [slot]);

  if (!slot) return null;

  return (
    <div className={`my-6 ${className}`} hidden={unfilled}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
