/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Public Facing Website (Phase 04)
 */

import React, { useState } from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import { Navbar } from './Navbar.tsx';
import { HeroSection } from './HeroSection.tsx';
import { FeatureHighlights } from './FeatureHighlights.tsx';
import { TrustSecuritySection } from './TrustSecuritySection.tsx';
import { AboutPage } from './AboutPage.tsx';
import { HelpFaqPage } from './HelpFaqPage.tsx';
import { ContactPage } from './ContactPage.tsx';
import { BusinessBankingPage } from './BusinessBankingPage.tsx';
import { RatesPage } from './RatesPage.tsx';
import { MobileAppPage } from './MobileAppPage.tsx';
import { SecurityCenterPage } from './SecurityCenterPage.tsx';
import { PrivacyPolicyPage } from './PrivacyPolicyPage.tsx';
import { TermsPage } from './TermsPage.tsx';
import { CookiePreferencesModal } from './CookiePreferencesModal.tsx';
import { LoginPage } from '../auth/LoginPage.tsx';
import { RegisterPage } from '../auth/RegisterPage.tsx';
import { PublicFooter } from './PublicFooter.tsx';
import {
  Wallet,
  CreditCard,
  FileText,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Calculator,
  Layers,
} from 'lucide-react';
import type { PublicViewId } from '../../routing/appRoutes.ts';
import { AvenoraLogo } from '../branding/AvenoraLogo.tsx';

interface PublicWebsiteProps {
  currentView: PublicViewId;
  onNavigate: (view: string) => void;
  onOpenPortal: (tab?: string) => void;
  onOpenAdmin?: () => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  currentView,
  onNavigate,
  onOpenPortal,
  onOpenAdmin,
}) => {
  const { t } = useLocalization();
  const [isCookieModalOpen, setIsCookieModalOpen] = useState<boolean>(false);

  // Mini loan calculator state for the public loans showcase page
  const [loanAmount, setLoanAmount] = useState<number>(10000);
  const [loanTerm, setLoanTerm] = useState<number>(24);
  const interestRate = 0.085; // 8.5%

  const monthlyRate = interestRate / 12;
  const monthlyPayment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm))) /
    (Math.pow(1 + monthlyRate, loanTerm) - 1);
  const totalRepayment = monthlyPayment * loanTerm;
  const totalInterest = totalRepayment - loanAmount;

  return (
    <div className="public-site-shell bg-[#f8fbf9] text-[#0f1f1e] font-sans selection:bg-[#076c64]/20 selection:text-[#003933]">
      {/* Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={onNavigate}
        onOpenPortal={() => onOpenPortal('overview')}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Main View Router */}
      <main className="public-site-main">
        {currentView === 'home' && (
          <>
            <HeroSection
              onOpenPortal={() => onOpenPortal('overview')}
              onNavigate={onNavigate}
            />
            <FeatureHighlights
              onNavigate={onNavigate}
              onOpenPortal={() => onOpenPortal('overview')}
            />
            <TrustSecuritySection />
          </>
        )}

        {/* Dedicated Showcase: Personal Wallets */}
        {currentView === 'personal' && (
          <div className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#076c64]">
                Global Accounts & FX
              </span>
              <h1 className="text-4xl font-serif font-bold text-[#003933]">
                Multicurrency Digital Vaults
              </h1>
              <p className="text-sm text-[#5c6f6c]">
                Hold balances in USD, EUR, GBP, and BRL with competitive FX rates and accurate balance reporting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="font-serif font-bold text-lg text-[#003933]">
                    Exact Integer Monetary Arithmetic
                  </h3>
                  <p className="text-xs text-[#5c6f6c] leading-relaxed">
                    By enforcing 64-bit BigInt minor units for every monetary balance, Avenora avoids the IEEE 754 floating-point drift that causes fractional discrepancies in standard systems.
                  </p>
                  <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#159d79]" />
                      <span>Instant transfers between Avenora accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#159d79]" />
                      <span>Multi-asset conversions with transparent mid-market spreads</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#159d79]" />
                      <span>Immutable double-entry journal records for every movement</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => onOpenPortal('wallets')}
                  className="bg-[#076c64] hover:bg-[#003933] text-white px-6 py-3 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Launch Multicurrency Wallets in Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Currency Cards Preview */}
              <div className="space-y-3">
                {[
                  { code: 'USD', name: 'US Dollar', symbol: '$', rate: '1.0000', flag: '🇺🇸' },
                  { code: 'EUR', name: 'Euro', symbol: '€', rate: '0.9250', flag: '🇪🇺' },
                  { code: 'GBP', name: 'British Pound', symbol: '£', rate: '0.7920', flag: '🇬🇧' },
                  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: '5.1480', flag: '🇧🇷' },
                ].map((c) => (
                  <div
                    key={c.code}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <span className="font-bold text-sm text-[#003933] block">
                          {c.code} · {c.name}
                        </span>
                        <span className="text-[11px] text-[#5c6f6c]">
                          1 USD = {c.rate} {c.code}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#076c64] bg-brand-accent-light px-2.5 py-1 rounded-lg">
                      Active Corridor
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Showcase: Payment Cards */}
        {currentView === 'cards' && (
          <div className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#076c64]">
                Smart Debit & Virtual Cards
              </span>
              <h1 className="text-4xl font-serif font-bold text-[#003933]">
                Instant Controls & Point-of-Sale Holds
              </h1>
              <p className="text-sm text-[#5c6f6c]">
                Issue virtual or debit cards with customizable spending limits, instant freeze toggles, and standard pre-authorization at checkout.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Card Graphic */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-[#003933] via-[#076c64] to-[#002e2c] text-white shadow-xl relative overflow-hidden aspect-8/5 flex flex-col justify-between border border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <AvenoraLogo size="xs" className="rounded bg-white/95 p-0.5" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#C6A568] bg-white/10 px-2 py-0.5 rounded">
                    Virtual Debit
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-xl sm:text-2xl tracking-widest block drop-shadow-sm">
                    •••• •••• •••• 8821
                  </span>
                  <div className="flex items-center gap-4 text-[11px] text-emerald-200">
                    <span>EXP: 12/29</span>
                    <span>CVC: •••</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-emerald-800/60">
                  <span className="text-xs font-medium tracking-wide">ALEX VANCE</span>
                  <span className="text-xs font-serif font-bold italic text-emerald-300">DEBIT</span>
                </div>
              </div>

              {/* Feature Points & Action */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-xl text-[#003933]">
                    Two-Step Pre-Authorization Architecture
                  </h3>
                  <p className="text-xs text-[#5c6f6c] leading-relaxed">
                    When a purchase occurs, our engine creates an authorization hold that isolates customer funds without immediate settlement. Merchant capture or settlement releases the hold into the double-entry ledger.
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="font-medium text-[#0f1f1e]">Instant Card Freeze/Unfreeze</span>
                    <span className="text-[#076c64] font-semibold">Real-time Toggle</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="font-medium text-[#0f1f1e]">Daily Spend Limits</span>
                    <span className="text-[#076c64] font-semibold">Enforced at POS</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="font-medium text-[#0f1f1e]">Merchant authorization preview</span>
                    <span className="text-[#076c64] font-semibold">Interactive Tester</span>
                  </div>
                </div>

                <button
                  onClick={() => onOpenPortal('cards')}
                  className="bg-[#076c64] hover:bg-[#003933] text-white px-6 py-3 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <span>Open Card Management</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Showcase: Credit & Loans */}
        {currentView === 'loans' && (
          <div className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#076c64]">
                Transparent Underwriting
              </span>
              <h1 className="text-4xl font-serif font-bold text-[#003933]">
                Credit & Loan Application Engine
              </h1>
              <p className="text-sm text-[#5c6f6c]">
                Personal and business borrowing with clear repayment schedules and transparent credit decisions.
              </p>
            </div>

            {/* Interactive Loan Estimator Card */}
            <div className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-md grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-7 space-y-6">
                <h3 className="font-serif font-bold text-lg text-[#003933]">
                  Interactive Repayment Calculator
                </h3>

                {/* Amount Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5c6f6c] font-medium">Borrowing Amount:</span>
                    <span className="font-bold text-[#003933]">${loanAmount.toLocaleString()} USD</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="500"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full accent-[#076c64] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#5c6f6c]">
                    <span>$1,000</span>
                    <span>$50,000</span>
                  </div>
                </div>

                {/* Term Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5c6f6c] font-medium">Repayment Term:</span>
                    <span className="font-bold text-[#003933]">{loanTerm} Months</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="60"
                    step="6"
                    value={loanTerm}
                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                    className="w-full accent-[#076c64] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#5c6f6c]">
                    <span>6 mos</span>
                    <span>60 mos</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#f8fbf9] border border-slate-200/70 text-xs space-y-2 text-[#5c6f6c]">
                  <div className="flex justify-between">
                    <span>Indicative Interest Rate:</span>
                    <span className="font-bold text-[#003933]">8.50% APR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Estimated Interest:</span>
                    <span className="font-bold text-[#003933]">${totalInterest.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Scheduled Repayment:</span>
                    <span className="font-bold text-[#003933]">${totalRepayment.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Estimate Result Box */}
              <div className="md:col-span-5 flex flex-col justify-between p-6 rounded-2xl bg-[#003933] text-white">
                <div className="space-y-4">
                  <span className="text-[11px] uppercase tracking-wider text-[#C6A568] font-bold block">
                    Calculated Monthly Installment
                  </span>
                  <div className="text-3xl sm:text-4xl font-serif font-extrabold text-[#f8fbf9]">
                    ${monthlyPayment.toFixed(2)}
                    <span className="text-xs font-normal text-emerald-200 block mt-1">/ month for {loanTerm} months</span>
                  </div>
                  <p className="text-xs text-emerald-100/70 leading-relaxed pt-2 border-t border-emerald-800">
                    Underwriting uses consistent calculation methods so your payment schedule matches what you see before you sign.
                  </p>
                </div>

                <button
                  onClick={() => onOpenPortal('loans')}
                  className="mt-6 bg-[#C6A568] hover:bg-amber-600 text-[#003933] font-semibold text-xs px-5 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Apply for Loan in Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Showcase: Verified Grants */}
        {currentView === 'grants' && (
          <div className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#076c64]">
                Non-Dilutive Funding
              </span>
              <h1 className="text-4xl font-serif font-bold text-[#003933]">
                Verified Grant Opportunities
              </h1>
              <p className="text-sm text-[#5c6f6c]">
                Discover institutional and government non-dilutive grant programs with eligibility guidance and tracked disbursements.
              </p>
            </div>

            {/* Featured Grants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Clean Tech Innovation Accelerator 2026',
                  issuer: 'Global Climate Innovation Fund',
                  country: 'US · North America',
                  maxAward: '$150,000 USD',
                  focus: 'Renewable energy, battery storage, and carbon-reduction technologies.',
                },
                {
                  title: 'Global Microenterprise Resilience Fund',
                  issuer: 'International Economic Growth Initiative',
                  country: 'Global · Emerging Markets',
                  maxAward: '$50,000 USD',
                  focus: 'Direct working-capital microgrants for vulnerable independent businesses.',
                },
                {
                  title: 'Latin America Digital Inclusion Fellowship',
                  issuer: 'Pan-American Digital Access Trust',
                  country: 'BR · Latin America',
                  maxAward: 'R$ 200,000 BRL',
                  focus: 'Last-mile connectivity and digital literacy infrastructure in underserved communities.',
                },
                {
                  title: 'Community Solar Infrastructure Grant',
                  issuer: 'European Sustainable Development Alliance',
                  country: 'DE / EU · Europe',
                  maxAward: '€100,000 EUR',
                  focus: 'Decentralized municipal solar power projects and community co-ops.',
                },
              ].map((grant, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#076c64]">{grant.issuer}</span>
                      <span className="text-[#C6A568] font-bold">{grant.country}</span>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-[#003933]">
                      {grant.title}
                    </h3>
                    <p className="text-xs text-[#5c6f6c] leading-relaxed">
                      {grant.focus}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#5c6f6c] block font-medium">Max Award</span>
                      <span className="font-bold text-sm text-[#003933]">{grant.maxAward}</span>
                    </div>
                    <button
                      onClick={() => onOpenPortal('grants')}
                      className="text-xs font-semibold text-[#076c64] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Apply in Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => onOpenPortal('grants')}
                className="bg-[#076c64] hover:bg-[#003933] text-white px-8 py-3.5 rounded-xl text-xs font-semibold shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Browse Full Verified Grant Catalog in Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dedicated View: About */}
        {currentView === 'about' && (
          <AboutPage onOpenPortal={() => onOpenPortal('overview')} />
        )}

        {currentView === 'contact' && (
          <ContactPage onNavigateHelp={() => onNavigate('help')} />
        )}

        {currentView === 'business' && (
          <BusinessBankingPage onOpenPortal={() => onOpenPortal('overview')} />
        )}

        {currentView === 'rates' && <RatesPage />}

        {currentView === 'mobile' && (
          <MobileAppPage onOpenPortal={() => onOpenPortal('overview')} />
        )}

        {currentView === 'security' && (
          <SecurityCenterPage onNavigateContact={() => onNavigate('contact')} />
        )}

        {/* Dedicated View: Help & FAQs */}
        {currentView === 'help' && <HelpFaqPage />}

        {/* Dedicated View: Privacy Policy (Draft) */}
        {currentView === 'privacy' && (
          <PrivacyPolicyPage onOpenPortal={() => onOpenPortal('overview')} />
        )}

        {/* Terms of service */}
        {currentView === 'terms' && (
          <TermsPage onOpenPortal={() => onOpenPortal('overview')} />
        )}

        {currentView === 'login' && <LoginPage onNavigate={onNavigate} />}

        {currentView === 'register' && <RegisterPage onNavigate={onNavigate} />}
      </main>

      {/* Footer — omit on auth pages for a focused layout */}
      {currentView !== 'login' && currentView !== 'register' && (
        <PublicFooter
          onNavigate={(view) => {
            if (view === 'cookies') {
              setIsCookieModalOpen(true);
            } else {
              onNavigate(view);
            }
          }}
          onOpenPortal={() => onOpenPortal('overview')}
          onOpenCookies={() => setIsCookieModalOpen(true)}
        />
      )}

      {/* Cookie Consent Modal */}
      <CookiePreferencesModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
      />
    </div>
  );
};
