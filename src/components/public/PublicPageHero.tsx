/**
 * @license Apache-2.0
 * Shared hero for public marketing pages
 */

import React from 'react';

interface PublicPageHeroProps {
  kicker: string;
  title: string;
  subtitle: string;
}

export const PublicPageHero: React.FC<PublicPageHeroProps> = ({ kicker, title, subtitle }) => (
  <section className="bg-brand-gradient text-white py-14 sm:py-16">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/90">{kicker}</span>
      <h1 className="text-4xl sm:text-5xl font-serif font-extrabold tracking-tight">{title}</h1>
      <p className="text-sm sm:text-base text-emerald-50/90 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
    </div>
  </section>
);
