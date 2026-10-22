/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Payment Card Services (Phase 03)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useLocalization } from './LocalizationContext.tsx';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import { resolveFixedCardSpendLimits } from '../domain/cards/cardSpendLimits.ts';
import {
  CreditCard,
  Sliders,
  PlusCircle,
  Eye,
  EyeOff,
  Clock,
  Wifi,
} from 'lucide-react';
import { AvenoraLogo } from './branding/AvenoraLogo.tsx';

interface CardAuth {
  id: string;
  cardId: string;
  merchantName: string;
  mcc: string;
  currency: string;
  amountMinor: string;
  formattedAmount: string;
  holdStatus: 'PENDING_HOLD' | 'SETTLED_SIMULATED' | 'REVERSED' | 'EXPIRED_RELEASED';
  authCode: string;
  ledgerHoldJournalEntryId?: string;
  ledgerSettleJournalEntryId?: string;
  ledgerReversalJournalEntryId?: string;
  createdAt: string;
}

interface PaymentCard {
  id: string;
  userId: string;
  type: 'DEBIT' | 'CREDIT';
  form: 'VIRTUAL' | 'PHYSICAL';
  status:
    | 'REQUESTED'
    | 'PENDING_REVIEW'
    | 'ACTIVE_SIMULATED'
    | 'FROZEN'
    | 'TERMINATED'
    | 'ISSUANCE_DECLINED';
  currency: string;
  maskedPan: string;
  lastFour: string;
  syntheticPanFormatted: string;
  syntheticExpiry: string;
  syntheticCvv: string;
  syntheticCardholderName: string;
  dailySpendLimitMinor: string;
  singleTxLimitMinor: string;
  formattedDailyLimit: string;
  formattedSingleTxLimit: string;
  dailySpentMinor: string;
  providerRef: string;
  authorizations: CardAuth[];
}

export function CardManagementView() {
  const { user, token } = useAuth();
  const { t } = useLocalization();
  const { primaryFiat, fiatCurrencyCodes, currencySelectLabel, countryCode } =
    useCustomerWalletScope();

  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<PaymentCard | null>(null);
  const [loading, setLoading] = useState(false);

  // Sensitive Details Toggle
  const [showFullPan, setShowFullPan] = useState(false);
  const [showCvv, setShowCvv] = useState(false);

  // New Card Modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqCurrency, setReqCurrency] = useState(primaryFiat);
  const [reqType, setReqType] = useState<'DEBIT' | 'CREDIT'>('DEBIT');
  const [reqForm, setReqForm] = useState<'VIRTUAL' | 'PHYSICAL'>('VIRTUAL');
  const [issuingLoading, setIssuingLoading] = useState(false);

  const fixedRequestLimits = useMemo(
    () =>
      resolveFixedCardSpendLimits({
        currency: reqCurrency,
        countryCode,
      }),
    [reqCurrency, countryCode]
  );
  const reqSingleLimit = fixedRequestLimits.singleTxLimitDecimal;
  const reqDailyLimit = fixedRequestLimits.monthlyLimitDecimal;

  // Limits adjustment state
  const [isAdjustingLimits, setIsAdjustingLimits] = useState(false);
  const [editDailyLimit, setEditDailyLimit] = useState('');
  const [editSingleLimit, setEditSingleLimit] = useState('');
  const [savingLimits, setSavingLimits] = useState(false);

  // Two-step hold resolution
  const [resolvingAuthId, setResolvingAuthId] = useState<string | null>(null);

  // Fetch Cards
  const fetchCards = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/cards', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.cards) {
        setCards(data.cards);
        if (data.cards.length > 0) {
          const current =
            data.cards.find((c: PaymentCard) => c.id === selectedCard?.id) ||
            data.cards.find(
              (c: PaymentCard) => c.status === 'ACTIVE_SIMULATED' || c.status === 'FROZEN'
            ) ||
            data.cards.find(
              (c: PaymentCard) => c.status === 'PENDING_REVIEW' || c.status === 'REQUESTED'
            ) ||
            data.cards[0];
          setSelectedCard(current);
          setEditDailyLimit((Number(current.dailySpendLimitMinor) / 100).toFixed(2));
          setEditSingleLimit((Number(current.singleTxLimitMinor) / 100).toFixed(2));
        }
      }
    } catch (err) {
      console.error('Failed to load payment cards', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [token]);

  useEffect(() => {
    setReqCurrency(primaryFiat);
  }, [primaryFiat]);

  // Save Card Limits
  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCard) return;
    setSavingLimits(true);
    try {
      const res = await fetch(`/api/v1/cards/${selectedCard.id}/limits`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dailyLimitDecimal: editDailyLimit,
          singleTxLimitDecimal: editSingleLimit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Failed to update limits');
      }
      setIsAdjustingLimits(false);
      fetchCards();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingLimits(false);
    }
  };

  // Issue New Card
  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIssuingLoading(true);
    try {
      const res = await fetch('/api/v1/cards/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currency: reqCurrency,
          cardholderName: user?.fullName || 'Valued Customer',
          type: reqType,
          form: reqForm,
          dailyLimitDecimal: reqDailyLimit,
          singleTxLimitDecimal: reqSingleLimit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Card request failed');
      }
      setIsRequestModalOpen(false);
      alert(
        data.message ||
          'Your card request was submitted and is awaiting administrator approval before it is issued.'
      );
      fetchCards();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIssuingLoading(false);
    }
  };

  const isCardIssued =
    selectedCard?.status === 'ACTIVE_SIMULATED' || selectedCard?.status === 'FROZEN';
  const isPendingIssuance =
    selectedCard?.status === 'PENDING_REVIEW' || selectedCard?.status === 'REQUESTED';

  // Settle Hold
  const handleSettleAuth = async (authId: string) => {
    if (!token) return;
    setResolvingAuthId(authId);
    try {
      const res = await fetch(`/api/v1/cards/authorizations/${authId}/settle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Settlement failed');
      }
      fetchCards();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResolvingAuthId(null);
    }
  };

  // Release / Reverse Hold
  const handleReleaseAuth = async (authId: string) => {
    if (!token) return;
    setResolvingAuthId(authId);
    try {
      const res = await fetch(`/api/v1/cards/authorizations/${authId}/release`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Release failed');
      }
      fetchCards();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResolvingAuthId(null);
    }
  };

  const selectCard = (card: PaymentCard) => {
    setSelectedCard(card);
    setShowFullPan(false);
    setShowCvv(false);
    setIsAdjustingLimits(false);
    setEditDailyLimit((Number(card.dailySpendLimitMinor) / 100).toFixed(2));
    setEditSingleLimit((Number(card.singleTxLimitMinor) / 100).toFixed(2));
  };

  const cardStatusShortLabel = (status: PaymentCard['status']) => {
    if (status === 'ACTIVE_SIMULATED') return 'Active';
    if (status === 'PENDING_REVIEW' || status === 'REQUESTED') return 'Pending';
    if (status === 'ISSUANCE_DECLINED') return 'Declined';
    if (status === 'FROZEN') return 'Frozen';
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 max-w-3xl">
          {/* Card Selector / Top bar */}
          <div className="flex justify-between items-center portal-dark-panel p-4 text-xs">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-accent" />
              <span className="font-bold text-white">Your cards ({cards.length})</span>
            </div>

            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold transition shadow-md text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Apply for card</span>
            </button>
          </div>

          {cards.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="listbox" aria-label="Select a card">
              {cards.map((card) => {
                const isSelected = selectedCard?.id === card.id;
                const pending =
                  card.status === 'PENDING_REVIEW' || card.status === 'REQUESTED';
                return (
                  <button
                    key={card.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectCard(card)}
                    className={`text-left rounded-xl border px-3 py-3 transition cursor-pointer ${
                      isSelected
                        ? 'border-brand-accent bg-brand-primary/20 ring-1 ring-brand-accent/40'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-white tracking-wide">
                        {card.status === 'ACTIVE_SIMULATED' || card.status === 'FROZEN'
                          ? card.maskedPan
                          : '•••• •••• •••• ••••'}
                      </span>
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          card.status === 'ACTIVE_SIMULATED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : pending
                              ? 'bg-amber-500/20 text-amber-300'
                              : card.status === 'FROZEN'
                                ? 'bg-amber-500/20 text-amber-200'
                                : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {cardStatusShortLabel(card.status)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span>
                        {card.type} · {card.form} · {card.currency}
                      </span>
                      <span className="font-mono">{card.lastFour !== '••••' ? `****${card.lastFour}` : 'Pending'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Realistic Card Visual Component */}
          {selectedCard ? (
            <div className="relative group perspective-1000">
              <div
                className={`w-full max-w-md mx-auto aspect-[1.586/1] rounded-3xl p-6 sm:p-7 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300 border ${
                  selectedCard.status === 'FROZEN'
                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/60 border-amber-500/40 opacity-90'
                    : isPendingIssuance
                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-amber-500/30 opacity-95'
                    : selectedCard.status === 'ISSUANCE_DECLINED'
                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950/40 border-rose-500/30 opacity-90'
                    : 'bg-gradient-to-br from-slate-900 via-brand-deep to-slate-950 border-brand-primary/40'
                }`}
              >
                {/* Decorative Holographic Elements */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-accent/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Row: Brand, Chip, Contactless, Form */}
                <div className="flex justify-between items-start z-10">
                  <div className="space-y-1">
                    <AvenoraLogo size="xs" className="rounded bg-white/90 p-0.5" />
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-brand-accent">
                      {selectedCard.type} • {selectedCard.form}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedCard.status === 'ACTIVE_SIMULATED'
                          ? 'bg-brand-accent-light0/20 text-emerald-400 border border-emerald-500/40'
                          : isPendingIssuance
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : selectedCard.status === 'ISSUANCE_DECLINED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {selectedCard.status === 'ACTIVE_SIMULATED'
                        ? 'ACTIVE'
                        : isPendingIssuance
                          ? 'PENDING APPROVAL'
                          : selectedCard.status === 'ISSUANCE_DECLINED'
                            ? 'DECLINED'
                            : selectedCard.status}
                    </span>
                  </div>
                </div>

                {/* Middle: EMV Chip */}
                <div className="z-10 flex items-center gap-4">
                  <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 border border-amber-500/50 shadow-inner flex flex-col justify-around p-1">
                    <div className="w-full h-0.5 bg-amber-600/40" />
                    <div className="w-full h-0.5 bg-amber-600/40" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">{selectedCard.currency} WALLET</span>
                </div>

                {/* Card Number & Sensitive details */}
                <div className="z-10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-lg sm:text-xl font-bold tracking-widest text-slate-100">
                      {isCardIssued
                        ? showFullPan
                          ? selectedCard.syntheticPanFormatted
                          : selectedCard.maskedPan
                        : '•••• •••• •••• ••••'}
                    </span>
                    {isCardIssued && (
                      <button
                        onClick={() => setShowFullPan(!showFullPan)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                        title={showFullPan ? 'Mask PAN' : 'Reveal full PAN'}
                      >
                        {showFullPan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>

                  {/* Cardholder, Expiry, CVV */}
                  <div className="flex justify-between items-end text-[10px] uppercase font-mono">
                    <div>
                      <span className="text-[8px] text-slate-400 block tracking-wider">Cardholder</span>
                      <span className="font-bold text-white tracking-wider">{selectedCard.syntheticCardholderName}</span>
                    </div>

                    <div>
                      <span className="text-[8px] text-slate-400 block tracking-wider">Expires</span>
                      <span className="font-bold text-white tracking-wider">
                        {isCardIssued ? selectedCard.syntheticExpiry : '••/••'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div>
                        <span className="text-[8px] text-slate-400 block tracking-wider">CVV (Demo)</span>
                        <span className="font-bold text-white tracking-wider">
                          {isCardIssued && showCvv ? selectedCard.syntheticCvv : '•••'}
                        </span>
                      </div>
                      {isCardIssued && (
                        <button
                          onClick={() => setShowCvv(!showCvv)}
                          className="text-slate-400 hover:text-white p-0.5"
                        >
                          {showCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {isPendingIssuance && (
                <p className="mt-3 text-center text-[11px] text-amber-200/90 max-w-md mx-auto">
                  This card request is awaiting administrator approval. Card details become available after issuance.
                </p>
              )}
              {selectedCard.status === 'ISSUANCE_DECLINED' && (
                <p className="mt-3 text-center text-[11px] text-rose-300/90 max-w-md mx-auto">
                  This card request was declined. You may submit a new request if eligible.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">No cards yet. Request a new card to get started.</div>
          )}

          {/* Spending limits — only for issued cards */}
          {selectedCard && isCardIssued && (
            <div className="portal-dark-panel p-5 space-y-5 text-xs">
              <div className="border-b border-slate-800 pb-4">
                <span className="font-bold text-white block">Card safeguards</span>
                <span className="text-[11px] text-slate-400">Set single-transaction and monthly spend limits</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">Transaction & Monthly Limits</span>
                  <button
                    onClick={() => setIsAdjustingLimits(!isAdjustingLimits)}
                    className="text-brand-accent hover:text-brand-accent font-semibold flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isAdjustingLimits ? 'Cancel' : 'Adjust Limits'}</span>
                  </button>
                </div>

                {!isAdjustingLimits ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Single Transaction Limit</span>
                      <span className="text-sm font-bold font-mono text-white mt-1 block">
                        {selectedCard.formattedSingleTxLimit}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Monthly Spend Limit</span>
                      <span className="text-sm font-bold font-mono text-brand-accent mt-1 block">
                        {selectedCard.formattedDailyLimit}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Spent this month: ${(Number(selectedCard.dailySpentMinor) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveLimits} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Single Tx Limit ({selectedCard.currency})</label>
                        <input
                          type="text"
                          value={editSingleLimit}
                          onChange={(e) => setEditSingleLimit(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Monthly Limit ({selectedCard.currency})</label>
                        <input
                          type="text"
                          value={editDailyLimit}
                          onChange={(e) => setEditDailyLimit(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={savingLimits}
                      className="px-4 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-deep text-white font-bold transition text-[11px]"
                    >
                      {savingLimits ? 'Saving...' : 'Save New Limits'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Two-Step Bank Pre-Authorization Holds & Settlements Inspector */}
      {selectedCard && isCardIssued && (
        <div className="portal-dark-panel p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-accent" />
                Authorization Holds & Settlement Lifecycle
              </h3>
              <span className="text-[11px] text-slate-400">
                Track pending pre-authorization holds vs settled merchant clearing
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Total Transactions: {selectedCard.authorizations.length}
            </span>
          </div>

          <div className="overflow-x-auto text-xs scrollbar-thin">
            <table className="w-full text-left">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Auth Code</th>
                  <th className="py-2.5 px-4 font-semibold">Merchant</th>
                  <th className="py-2.5 px-4 font-semibold">MCC</th>
                  <th className="py-2.5 px-4 font-semibold">Amount</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Hold Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {selectedCard.authorizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500 font-sans">
                      No authorization activity recorded for this card yet.
                    </td>
                  </tr>
                ) : (
                  selectedCard.authorizations.map((auth) => (
                    <tr key={auth.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-brand-accent">{auth.authCode}</td>
                      <td className="py-3 px-4 font-sans text-white font-medium">{auth.merchantName}</td>
                      <td className="py-3 px-4 text-slate-400">{auth.mcc}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{auth.formattedAmount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            auth.holdStatus === 'PENDING_HOLD'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : auth.holdStatus === 'SETTLED_SIMULATED'
                              ? 'bg-brand-accent-light0/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {auth.holdStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {auth.holdStatus === 'PENDING_HOLD' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSettleAuth(auth.id)}
                              disabled={resolvingAuthId === auth.id}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-brand-accent-light0 text-white font-bold text-[10px] transition disabled:opacity-50"
                              title="Clears hold and posts immutable journal entry"
                            >
                              Settle (Clear)
                            </button>
                            <button
                              onClick={() => handleReleaseAuth(auth.id)}
                              disabled={resolvingAuthId === auth.id}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 font-semibold text-[10px] transition disabled:opacity-50"
                              title="Restores held funds to customer available balance"
                            >
                              Release Hold
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-sans">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ISSUE NEW CARD MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex modal-overlay-scroll justify-center p-4">
          <div className="modal-panel-scroll portal-dark-panel max-w-md p-6 space-y-5 shadow-2xl my-auto sm:my-0">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">Request payment card</h3>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueCard} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Currency Vault Account</label>
                <select
                  value={reqCurrency}
                  onChange={(e) => setReqCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  {fiatCurrencyCodes.map((code) => (
                    <option key={code} value={code}>
                      {currencySelectLabel(code)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Card Type</label>
                  <select
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="DEBIT">Debit</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Form Factor</label>
                  <select
                    value={reqForm}
                    onChange={(e) => setReqForm(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="VIRTUAL">Virtual</option>
                    <option value="PHYSICAL">Physical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Single Tx Limit</label>
                  <input
                    type="text"
                    readOnly
                    value={reqSingleLimit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono opacity-90 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Monthly Limit</label>
                  <input
                    type="text"
                    readOnly
                    value={reqDailyLimit}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono opacity-90 cursor-not-allowed"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                {countryCode === 'BR' || reqCurrency.toUpperCase() === 'BRL'
                  ? 'Brazil accounts: fixed single 1,000 / monthly 10,000 (local).'
                  : 'Fixed policy: single ≈ 20 USD and monthly ≈ 2,000 USD, converted to your local currency and rounded up to the nearest 10 / 100 / 1,000 / 10,000.'}
              </p>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuingLoading}
                  className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-deep text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {issuingLoading ? 'Submitting...' : 'Submit for approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
