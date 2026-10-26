/**
 * @license Apache-2.0
 * Avenora — Help Center & FAQ
 */

import React, { useState } from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import {
  Search,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Send,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

export const HelpFaqPage: React.FC = () => {
  const { t } = useLocalization();
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState('wallets');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [ticketReference, setTicketReference] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const faqs = [
    {
      category: 'Accounts & eligibility',
      question: 'Who can open an Avenora account?',
      answer:
        'Avenora serves individuals and businesses in supported countries. You will need valid identification, contact details, and completion of our verification (KYC) process where required by regulation.',
    },
    {
      category: 'Accounts & eligibility',
      question: 'Are my deposits insured?',
      answer:
        'Deposit protection depends on your jurisdiction and product type. Details appear in your account agreement and regional disclosures. Contact support if you need help understanding coverage for your account.',
    },
    {
      category: 'Multicurrency wallets & FX',
      question: 'Which currencies can I hold?',
      answer:
        'You can hold and transact in USD, EUR, GBP, and BRL. Exchange rates and fees are shown before you confirm a conversion or transfer.',
    },
    {
      category: 'Payment cards',
      question: 'How do card pre-authorizations work?',
      answer:
        'When you pay at a merchant, an authorization may temporarily reduce your available balance. When the merchant completes settlement, the hold is replaced by the final charge, or released if the transaction is cancelled.',
    },
    {
      category: 'Credit & loans',
      question: 'How are loan payments calculated?',
      answer:
        'We provide an amortization schedule before you accept an offer so you can see principal, interest, and each installment. Your portal shows remaining balance and payment history after funding.',
    },
    {
      category: 'Grants & programs',
      question: 'What are verified grant programs?',
      answer:
        'These are curated public and institutional funding opportunities. You can review requirements, submit applications, and track review status. Disbursements to your Avenora wallet follow program rules and compliance review.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryMessage) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/v1/contact/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inquiryName,
          email: inquiryEmail || undefined,
          subject: `Help Center: ${inquiryCategory}`,
          message: inquiryMessage,
          category: inquiryCategory,
          priority: 'STANDARD',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Unable to submit inquiry.');
      }
      setTicketReference(data.ticketId || `TKT-${Date.now().toString(36).toUpperCase()}`);
      setInquiryMessage('');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-16 bg-[#f8fbf9] text-[#0f1f1e]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#076c64]">
            {t.nav.help}
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-extrabold text-[#003933] tracking-tight">
            {t.help.title}
          </h1>
          <p className="text-base text-[#5c6f6c]">{t.help.subtitle}</p>

          <div className="relative max-w-xl mx-auto pt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c6f6c]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.help.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#076c64]/30"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={`${faq.question}-${index}`}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-slate-50/50 transition"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#076c64] block mb-1">
                      {faq.category}
                    </span>
                    <span className="font-serif font-bold text-base text-[#003933] block">{faq.question}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[#5c6f6c] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#5c6f6c] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-[#5c6f6c] leading-relaxed border-t border-slate-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-brand-accent-light text-[#076c64] flex items-center justify-center border border-brand-accent/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#003933]">{t.help.contactSupport}</h2>
            <p className="text-sm text-[#5c6f6c]">
              Send a message to our support team. We will respond using the email address you provide.
            </p>
            {ticketReference && (
              <div className="p-4 rounded-xl bg-brand-accent-light border border-brand-accent/30 text-sm text-[#003933] flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#159d79] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t.help.ticketSent}</p>
                  <p className="font-mono text-xs mt-1">{ticketReference}</p>
                </div>
              </div>
            )}
            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800" role="alert">
                {submitError}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSupportSubmit}
            className="p-8 rounded-3xl bg-[#003933] text-white space-y-4 shadow-lg"
          >
            <div className="flex items-center gap-2 text-[#C6A568] text-xs font-semibold uppercase tracking-wider">
              <MessageSquare className="w-4 h-4" />
              <span>Contact form</span>
            </div>
            <input
              required
              value={inquiryName}
              onChange={(e) => setInquiryName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-emerald-100/50 focus:outline-none focus:ring-2 focus:ring-[#C6A568]/40"
            />
            <input
              type="email"
              required
              value={inquiryEmail}
              onChange={(e) => setInquiryEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-emerald-100/50 focus:outline-none focus:ring-2 focus:ring-[#C6A568]/40"
            />
            <select
              value={inquiryCategory}
              onChange={(e) => setInquiryCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-sm focus:outline-none"
            >
              <option value="wallets" className="text-[#0f1f1e]">Accounts & wallets</option>
              <option value="cards" className="text-[#0f1f1e]">Cards</option>
              <option value="loans" className="text-[#0f1f1e]">Lending</option>
              <option value="grants" className="text-[#0f1f1e]">Grants</option>
              <option value="security" className="text-[#0f1f1e]">Security</option>
            </select>
            <textarea
              required
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              rows={4}
              placeholder="How can we help?"
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-sm placeholder:text-emerald-100/50 focus:outline-none focus:ring-2 focus:ring-[#C6A568]/40 resize-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#C6A568] hover:bg-amber-600 text-[#003933] font-semibold text-sm py-3 rounded-xl transition disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending…' : t.help.contactSupport}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
