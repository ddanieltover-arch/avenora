/**
 * @license Apache-2.0
 * Avenora — Rates & APY
 */

import React from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { PublicPageHero } from './PublicPageHero.tsx';

export const RatesPage: React.FC = () => {
  const { t } = useLocalization();
  const p = t.ratesPage;

  return (
    <div className="bg-[#f8fbf9] text-[#0f1f1e]">
      <PublicPageHero kicker={p.kicker} title={p.title} subtitle={p.subtitle} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {p.products.map((product) => (
            <article
              key={product.title}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 flex flex-col"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#076c64] mb-3">
                {product.category}
              </span>
              <p className="text-3xl font-serif font-extrabold text-[#003933] tabular-nums">
                {product.rate}
                <span className="text-sm font-semibold text-[#5c6f6c] ml-1">{product.unit}</span>
              </p>
              <h3 className="text-base font-serif font-bold text-[#0f1f1e] mt-3">{product.title}</h3>
              <p className="text-xs text-[#5c6f6c] mt-2 leading-relaxed flex-1">{product.note}</p>
              {product.badge && (
                <span className="mt-4 inline-flex self-start text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-100">
                  {product.badge}
                </span>
              )}
            </article>
          ))}
        </div>

        <p className="text-xs text-center text-[#5c6f6c] max-w-3xl mx-auto leading-relaxed">{p.disclaimer}</p>
      </div>
    </div>
  );
};
