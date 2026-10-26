/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Authenticated Help, FAQ & Support Inquiries (Phase 04)
 */

import React, { useState } from 'react';
import { useLocalization } from './LocalizationContext.tsx';
import {
  HelpCircle,
  Search,
  MessageSquare,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Lock,
  PhoneCall,
  Mail,
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: 'wallets' | 'cards' | 'loans' | 'grants' | 'security';
}

const FAQS: FaqItem[] = [
  {
    category: 'wallets',
    question: 'How does Avenora achieve zero float drift across currencies?',
    answer:
      'All balances and ledger line items are stored as 64-bit BigInt minor units (e.g., cents for USD, centavos for EUR and BRL). Decimal calculations are strictly forbidden in ledger transitions, completely eliminating the cumulative floating-point errors inherent in standard IEEE 754 representations.',
  },
  {
    category: 'wallets',
    question: 'How do deposits and withdrawals work?',
    answer:
      'Deposits credit your available balance after inbound funds are recognized on the selected rail (wire, Pix, ACH, SEPA, etc.). Withdrawals verify that your available balance covers the requested amount (overdraft prevention) before debiting your wallet and initiating outbound settlement.',
  },
  {
    category: 'cards',
    question: 'What is a two-step point-of-sale (POS) pre-authorization hold?',
    answer:
      'When a card authorization occurs, funds are moved from your Available balance into a Pending Hold account without altering the safeguarding bank asset. When the merchant settles or expires the transaction, the hold is resolved into a final debit or released back to your available balance.',
  },
  {
    category: 'loans',
    question: 'Are the amortization calculator results binding loan agreements?',
    answer:
      'No. Calculator results and pre-qualification scores are estimates. A binding loan requires completed application, verification, and signed loan documents.',
  },
  {
    category: 'grants',
    question: 'Where do the verified grant programs come from?',
    answer:
      'Programs in the directory reflect institutional, municipal, and philanthropic initiatives. Approved awards are credited to your wallet after eligibility and compliance review.',
  },
  {
    category: 'security',
    question: 'How are customer passwords and sessions safeguarded?',
    answer:
      'Passwords are salted and hashed using Node.js Scrypt key derivation with constant-time verification. Session tokens are hashed with SHA-256 and verified strictly in server memory without persisting raw bearer credentials in local storage.',
  },
];

export const HelpSupportView: React.FC = () => {
  const { t } = useLocalization();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Ticket Form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Wallets & Transfers');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'STANDARD' | 'HIGH' | 'CRITICAL'>('STANDARD');
  const [submitting, setSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<{ id: string; message: string } | null>(null);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCat = activeCategory === 'all' || faq.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTicketSuccess(null);

    try {
      const res = await fetch('/api/v1/contact/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage,
          category: ticketCategory,
          priority: ticketPriority,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Unable to submit inquiry.');
      }
      setTicketSuccess({
        id: data.ticketId,
        message:
          data.message ||
          'Your inquiry has been logged. A support specialist will respond using the contact details on your profile.',
      });
      setTicketSubject('');
      setTicketMessage('');
    } catch (err: unknown) {
      setTicketSuccess({
        id: 'ERROR',
        message: err instanceof Error ? err.message : 'Unable to submit inquiry.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold text-[#076c64] tracking-wider block">
            Customer Assistance & Knowledge Base
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#003933]">
            Help & Customer Support
          </h1>
          <p className="text-xs text-[#5c6f6c] mt-1">
            Search financial topics, review platform architecture guides, or register a customer inquiry.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#f8fbf9] border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#003933]">
          <Mail className="w-3.5 h-3.5 text-[#076c64]" />
          <span>support@avenorabank.com</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FAQs Accordion */}
        <div className="lg:col-span-7 space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics, zero-float formulas, card holds..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'wallets', label: 'Wallets & FX' },
              { id: 'cards', label: 'Cards & Holds' },
              { id: 'loans', label: 'Loans & Amortization' },
              { id: 'grants', label: 'Grants' },
              { id: 'security', label: 'Security & Invariants' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#076c64] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-[#5c6f6c] hover:text-[#003933]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-serif font-bold text-xs sm:text-sm text-[#003933] hover:bg-slate-50/60 transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#076c64] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-[#5c6f6c] leading-relaxed border-t border-slate-100 bg-[#f8fbf9]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFaqs.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-[#5c6f6c]">
                No topics matched your search query. Try searching for "zero float", "cards", or "amortization".
              </div>
            )}
          </div>
        </div>

        {/* Support Inquiry Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-2 text-[#003933]">
            <MessageSquare className="w-4 h-4 text-[#076c64]" />
            <h2 className="text-base font-serif font-bold">
              Submit Customer Inquiry
            </h2>
          </div>

          <p className="text-xs text-[#5c6f6c] leading-relaxed">
            Have questions about your account? Submit an inquiry and our team will open a support ticket for you.
          </p>

          {ticketSuccess && (
            <div
              className={`p-4 rounded-2xl space-y-2 text-xs animate-in fade-in ${
                ticketSuccess.id === 'ERROR'
                  ? 'bg-rose-50 border border-rose-200 text-rose-900'
                  : 'bg-brand-accent-light border border-brand-accent/30 text-emerald-900'
              }`}
              role={ticketSuccess.id === 'ERROR' ? 'alert' : 'status'}
            >
              <div
                className={`flex items-center gap-2 font-bold ${
                  ticketSuccess.id === 'ERROR' ? 'text-rose-700' : 'text-[#076c64]'
                }`}
              >
                <CheckCircle2
                  className={`w-4 h-4 ${ticketSuccess.id === 'ERROR' ? 'text-rose-600' : 'text-[#159d79]'}`}
                />
                <span>
                  {ticketSuccess.id === 'ERROR' ? 'Unable to submit inquiry' : 'Ticket Registered Successfully'}
                </span>
              </div>
              <p className="text-[11px]">{ticketSuccess.message}</p>
              {ticketSuccess.id !== 'ERROR' && (
                <div className="bg-white p-2.5 rounded-xl border border-brand-accent/30 font-mono text-xs font-bold text-[#003933] text-center">
                  Protocol: {ticketSuccess.id}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0f1f1e] mb-1">
                Category
              </label>
              <select
                value={ticketCategory}
                onChange={(e) => setTicketCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#076c64]"
              >
                <option value="Wallets & Transfers">Wallets & Multicurrency Transfers</option>
                <option value="Cards & POS">Virtual Cards & POS Authorization Holds</option>
                <option value="Loans & Amortization">Loans & Credit Inquiries</option>
                <option value="Grants">Non-Dilutive Grant Programs</option>
                <option value="Identity & KYC">Identity Verification & KYC</option>
                <option value="Security & Compliance">Security & compliance</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#0f1f1e] mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of inquiry"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0f1f1e] mb-1">
                Priority
              </label>
              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#076c64]"
              >
                <option value="STANDARD">Standard (24h response target)</option>
                <option value="HIGH">High (4h response target)</option>
                <option value="CRITICAL">Critical (priority escalation)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#0f1f1e] mb-1">
                Detailed Message
              </label>
              <textarea
                required
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your inquiry, transaction reference, or unexpected behavior..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white font-semibold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{submitting ? 'Registering Ticket...' : 'Submit Inquiry'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
