/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Contact Us
 */

import React, { useState } from 'react';
import { useLocalization } from '../LocalizationContext.tsx';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';

interface ContactPageProps {
  onNavigateHelp?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateHelp }) => {
  const { t } = useLocalization();
  const c = t.contactPage;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const ref = `AVN-${Date.now().toString(36).toUpperCase().slice(-8)}`;
    setReference(ref);
    setSubmitted(true);
    setFullName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="bg-[#f8fbf9] text-[#0f1f1e]">
      {/* Hero */}
      <section className="bg-brand-gradient text-white py-14 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            {c.kicker}
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-extrabold tracking-tight">{c.title}</h1>
          <p className="text-sm sm:text-base text-emerald-50/90 max-w-2xl mx-auto leading-relaxed">
            {c.subtitle}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#076c64]">
                  <MessageSquare className="w-5 h-5" aria-hidden />
                  <h2 className="text-xl font-serif font-bold text-[#003933]">{c.formTitle}</h2>
                </div>
                <p className="text-sm text-[#5c6f6c] leading-relaxed">{c.formIntro}</p>
              </div>

              {submitted && reference && (
                <div
                  className="p-4 rounded-xl bg-brand-accent-light border border-brand-accent/30 flex gap-3 text-sm text-emerald-900"
                  role="status"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#076c64] shrink-0" />
                  <div>
                    <p>{c.success}</p>
                    <p className="mt-1 font-mono text-xs text-[#003933]">{reference}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0f1f1e] mb-1.5">{c.fullName}</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f1f1e] mb-1.5">{c.email}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f1f1e] mb-1.5">{c.subject}</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f1f1e] mb-1.5">{c.message}</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#076c64]/30 focus:border-[#076c64]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#076c64] hover:bg-[#003933] text-white text-sm font-semibold shadow-sm transition cursor-pointer"
                >
                  <Send className="w-4 h-4" aria-hidden />
                  {c.send}
                </button>
              </form>
            </div>
          </div>

          {/* Contact details */}
          <aside className="lg:col-span-2 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-serif font-bold text-[#003933]">{c.asideTitle}</h2>
              <p className="text-sm text-[#5c6f6c] leading-relaxed">{c.asideIntro}</p>
            </div>

            <ul className="space-y-4">
              <li className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-brand-accent-light text-[#076c64] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6f6c]">{c.phoneTitle}</p>
                  <p className="text-sm font-semibold text-[#003933] mt-0.5">{c.phoneValue}</p>
                  <p className="text-xs text-[#5c6f6c] mt-1">{c.phoneNote}</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-brand-accent-light text-[#076c64] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6f6c]">{c.emailTitle}</p>
                  <a
                    href={`mailto:${c.emailValue}`}
                    className="text-sm font-semibold text-[#076c64] hover:text-[#003933] mt-0.5 inline-block"
                  >
                    {c.emailValue}
                  </a>
                  <p className="text-xs text-[#5c6f6c] mt-1">{c.emailNote}</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-brand-accent-light text-[#076c64] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6f6c]">{c.visitTitle}</p>
                  <address className="text-sm text-[#0f1f1e] not-italic mt-0.5 leading-relaxed whitespace-pre-line">
                    {c.visitAddress}
                  </address>
                </div>
              </li>
              <li className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5c6f6c]">{c.hoursTitle}</p>
                  <p className="text-sm text-[#0f1f1e] mt-0.5 leading-relaxed whitespace-pre-line">{c.hours}</p>
                </div>
              </li>
            </ul>

            {onNavigateHelp && (
              <button
                type="button"
                onClick={onNavigateHelp}
                className="text-sm font-semibold text-[#076c64] hover:text-[#003933] hover:underline cursor-pointer"
              >
                {c.helpLink}
              </button>
            )}
          </aside>
        </div>

        {/* Map placeholder */}
        <section className="space-y-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-serif font-bold text-[#003933]">{c.mapTitle}</h2>
            <p className="text-sm text-[#5c6f6c]">{c.mapSubtitle}</p>
          </div>
          <div
            className="rounded-3xl border border-slate-200/80 bg-[#eef4f2] min-h-[220px] sm:min-h-[280px] flex items-center justify-center text-center px-6"
            role="img"
            aria-label={c.mapPlaceholder}
          >
            <div className="space-y-2">
              <MapPin className="w-8 h-8 text-[#076c64] mx-auto opacity-70" aria-hidden />
              <p className="text-sm text-[#5c6f6c] max-w-md">{c.mapPlaceholder}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
