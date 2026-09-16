import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!slot || pushed.current) return;
    pushed.current = true;
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // A blocker, or the script never loaded. Nothing to recover — the slot stays empty.
    }
  }, [slot]);

  if (!slot) return null;

  return (
    <div className={`my-6 ${className}`}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <ins
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
