/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Zero-Float Precision Interactive Lab
 */

import React, { useState } from 'react';
import { Calculator, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Money } from '../domain/money/Money.ts';

export const ZeroFloatDemo: React.FC = () => {
  const [valA, setValA] = useState('0.10');
  const [valB, setValB] = useState('0.20');

  // Standard IEEE-754 binary floating point addition
  const floatA = parseFloat(valA) || 0;
  const floatB = parseFloat(valB) || 0;
  const floatSum = floatA + floatB;

  // Avenora Zero-Float BigInt Money
  let moneySumDisplay = '';
  let moneyMinorA = 0n;
  let moneyMinorB = 0n;
  let hasMoneyError = false;

  try {
    const mA = Money.fromDecimalString(valA, 'USD');
    const mB = Money.fromDecimalString(valB, 'USD');
    const mSum = mA.add(mB);
    moneyMinorA = mA.amountMinor;
    moneyMinorB = mB.amountMinor;
    moneySumDisplay = mSum.toDecimalString();
  } catch (err) {
    hasMoneyError = true;
    moneySumDisplay = err instanceof Error ? err.message : 'Error';
  }

  const isFloatDrifted = floatSum.toString().length > 4;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">
            Monetary Math Standards: Zero-Floating-Point Precision
          </h2>
          <p className="text-xs text-slate-400">
            Why traditional <code className="text-rose-400">float / number</code> types corrupt financial ledgers and how Avenora solves it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Operand A ($)</label>
          <input
            type="text"
            value={valA}
            onChange={(e) => setValA(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
            placeholder="0.10"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Operand B ($)</label>
          <input
            type="text"
            value={valB}
            onChange={(e) => setValB(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
            placeholder="0.20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Traditional IEEE-754 Floats */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-rose-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> IEEE-754 Binary Float
            </span>
            <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Prohibited in Avenora
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            <div className="text-slate-400">
              Calculation: <span className="text-white">{floatA} + {floatB}</span>
            </div>
            <div className="text-slate-400">
              Raw Evaluation:
              <span className={`ml-1 font-bold ${isFloatDrifted ? 'text-rose-400 bg-rose-950/40 px-1 rounded' : 'text-white'}`}>
                {floatSum}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 text-[11px] text-rose-300">
            {isFloatDrifted
              ? 'Floating-point drift detected! 0.1 + 0.2 creates a phantom 0.00000000000000004 balance discrepancy, causing double-entry reconciliations to fail.'
              : 'Appears clean for these values, but unsafe under accumulated roundoff.'}
          </div>
        </div>

        {/* Avenora BigInt Zero-Float */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Avenora BigInt Minor Units
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-brand-accent-light0/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Fintech Standard
            </span>
          </div>

          <div className="space-y-1 font-mono text-xs">
            <div className="text-slate-400">
              Integer Minor Units: <span className="text-white">{moneyMinorA.toString()}n + {moneyMinorB.toString()}n = {(moneyMinorA + moneyMinorB).toString()}n cents</span>
            </div>
            <div className="text-slate-400">
              Formatted Output: <span className="text-emerald-400 font-bold ml-1">${moneySumDisplay} USD</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-[11px] text-emerald-300">
            Absolute mathematical determinism. BigInt minor units eliminate binary roundoff error and preserve exact penny/satoshi balances across all accounts.
          </div>
        </div>
      </div>
    </div>
  );
};
