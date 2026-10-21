/**
 * @license Apache-2.0
 * Avenora — Interactive wallet preview (homepage)
 */

import React, { useState } from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { CheckCircle2, Lock } from 'lucide-react';

export const WalletPreviewInteractive: React.FC = () => {
  const { t } = useLocalization();
  const copy = t.home.walletPreview;
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'BRL'>('USD');
  const [amountInput, setAmountInput] = useState<number>(2500);

  const rates = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    BRL: 5.15,
  };

  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    BRL: 'R$',
  };

  const convertedValue = (amountInput * rates[selectedCurrency]).toFixed(2);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl relative overflow-hidden text-[#0f1f1e]">
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-brand-accent-light rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-[#076c64] uppercase tracking-wider block">
            {copy.kicker}
          </span>
          <h3 className="text-lg font-serif font-bold text-[#003933]">{copy.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-brand-accent-light px-2.5 py-1 rounded-full border border-brand-accent/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#159d79]" />
          <span>{copy.statusBadge}</span>
        </div>
      </div>

      <div className="my-6 p-6 rounded-2xl bg-[#f8fbf9] border border-slate-200/70">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs text-[#5c6f6c] font-medium">{copy.balanceLabel}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-serif font-extrabold text-[#003933] font-tabular">
            {currencySymbols[selectedCurrency]}{' '}
            {Number(convertedValue).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-sm font-bold text-[#C6A568]">{selectedCurrency}</span>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {(['USD', 'EUR', 'GBP', 'BRL'] as const).map((curr) => (
            <button
              key={curr}
              type="button"
              onClick={() => setSelectedCurrency(curr)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                selectedCurrency === curr
                  ? 'bg-[#076c64] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-[#0f1f1e] border border-slate-200'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#5c6f6c] font-medium">{copy.transferLabel}:</span>
          <span className="font-semibold text-[#003933] font-tabular">
            ${amountInput.toLocaleString()} USD
          </span>
        </div>
        <input
          type="range"
          min="100"
          max="10000"
          step="100"
          value={amountInput}
          onChange={(e) => setAmountInput(Number(e.target.value))}
          className="w-full accent-[#076c64] cursor-pointer"
          aria-label={copy.transferLabel}
        />
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#5c6f6c]">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-[#076c64]" />
          <span>{copy.footerSecurity}</span>
        </div>
        <span>{copy.footerStandards}</span>
      </div>
    </div>
  );
};
