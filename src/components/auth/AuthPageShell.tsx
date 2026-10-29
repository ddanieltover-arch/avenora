/**
 * @license Apache-2.0
 * Shared layout shell for dedicated /login and /register pages.
 */

import React, { type ReactNode } from 'react';
import { AvenoraLogo } from '../branding/AvenoraLogo.tsx';

interface AuthPageShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthPageShell: React.FC<AuthPageShellProps> = ({ title, subtitle, children }) => {
  return (
    <section className="relative min-h-[calc(100dvh-8rem)] flex items-center justify-center px-4 py-10 sm:py-14">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 0%, rgba(7,108,100,0.12), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(198,165,104,0.14), transparent 45%), linear-gradient(180deg, #F1F4F1 0%, #FAFAF7 100%)',
        }}
        aria-hidden
      />

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-[#003933]/8">
        <div className="bg-[#003933] text-white px-6 py-6">
          <div className="flex items-center gap-2.5 mb-3">
            <AvenoraLogo size="sm" className="rounded-lg bg-white p-0.5" />
            <span className="font-serif font-bold text-lg tracking-tight">AVENORA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">{title}</h1>
          <p className="text-xs text-emerald-100/75 mt-1.5 leading-relaxed">{subtitle}</p>
        </div>
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </section>
  );
};
