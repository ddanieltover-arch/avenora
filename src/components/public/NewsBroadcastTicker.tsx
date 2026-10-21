/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Top header news broadcast ticker
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';

export const NewsBroadcastTicker: React.FC = () => {
  const { t } = useLocalization();
  const { label, items } = t.home.newsBroadcast;

  const loopTrack = [...items, ...items];

  return (
    <div
      className="bg-brand-gradient text-white/95 text-[11px] font-medium leading-none border-b border-[#003933]/20"
      role="region"
      aria-label={label}
    >
      <div className="flex items-stretch min-h-[2.125rem]">
        <div
          className="shrink-0 flex items-center gap-2 px-3 sm:px-4 bg-[#002a26]/90 border-r border-white/15"
          aria-hidden
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-red-500/30" />
          </span>
          <span className="uppercase tracking-[0.14em] text-[10px] font-bold text-white whitespace-nowrap">
            {label}
          </span>
        </div>

        <div
          className="flex-1 overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)]"
          aria-live="polite"
        >
          <div className="hidden motion-reduce:flex flex-wrap gap-x-4 gap-y-1 px-4">
            {items.map((headline) => (
              <span key={headline} className="inline-flex items-center gap-2">
                <span className="text-[#c6a568] font-semibold" aria-hidden>▸</span>
                {headline}
              </span>
            ))}
          </div>
          <div
            className="flex shrink-0 items-center gap-8 pr-8 whitespace-nowrap animate-news-broadcast motion-reduce:hidden"
          >
            {loopTrack.map((headline, index) => (
              <span key={`${headline}-${index}`} className="inline-flex items-center gap-2">
                <span className="text-[#c6a568] font-semibold" aria-hidden>▸</span>
                {headline}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
