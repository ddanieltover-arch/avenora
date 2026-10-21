/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Payment Card Services & POS Simulator (Phase 03)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useLocalization } from './LocalizationContext.tsx';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import {
  CreditCard,
  Lock,
  Unlock,
  Sliders,
  PlusCircle,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  ShieldCheck,
  Wifi,
  DollarSign,
  Coffee,
  Cloud,
  Plane,
  RotateCcw,
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
  status: 'ACTIVE_SIMULATED' | 'FROZEN' | 'TERMINATED' | 'REQUESTED';
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
  const { primaryFiat, fiatCurrencyCodes, currencySelectLabel } = useCustomerWalletScope();

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
  const [reqDailyLimit, setReqDailyLimit] = useState('1000.00');
  const [reqSingleLimit, setReqSingleLimit] = useState('500.00');
  const [issuingLoading, setIssuingLoading] = useState(false);

  // Limits adjustment state
  const [isAdjustingLimits, setIsAdjustingLimits] = useState(false);
  const [editDailyLimit, setEditDailyLimit] = useState('');
  const [editSingleLimit, setEditSingleLimit] = useState('');
  const [savingLimits, setSavingLimits] = useState(false);

  // POS Simulator State
  const [posMerchant, setPosMerchant] = useState('Blue Bottle Coffee & Roasters');
  const [posMcc, setPosMcc] = useState('5814');
  const [posAmount, setPosAmount] = useState('6.75');
  const [posAuthorizing, setPosAuthorizing] = useState(false);
  const [posFeedback, setPosFeedback] = useState<{ type: 'success' | 'error'; message: string; details?: any } | null>(null);

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
          const current = data.cards.find((c: PaymentCard) => c.id === selectedCard?.id) || data.cards[0];
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

  // Toggle Card Freeze
  const handleToggleFreeze = async (card: PaymentCard) => {
    if (!token) return;
    const newStatus = card.status === 'FROZEN' ? 'ACTIVE_SIMULATED' : 'FROZEN';
    const reason = newStatus === 'FROZEN' ? 'Customer requested card lock via dashboard' : 'Customer unlocked card';

    try {
      const res = await fetch(`/api/v1/cards/${card.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      const data = await res.json();
      if (res.ok && data.card) {
        fetchCards();
      } else {
        alert(data.detail || 'Status update failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        throw new Error(data.detail || data.title || 'Card issuance failed');
      }
      setIsRequestModalOpen(false);
      fetchCards();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIssuingLoading(false);
    }
  };

  // Simulate POS Authorization
  const handleSimulatePos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCard) return;

    setPosAuthorizing(true);
    setPosFeedback(null);

    try {
      const res = await fetch(`/api/v1/cards/${selectedCard.id}/simulate-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          merchantName: posMerchant,
          mcc: posMcc,
          amountDecimal: posAmount,
          currency: selectedCard.currency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Authorization failed');
      }

      setPosFeedback({
        type: 'success',
        message: `Authorization APPROVED (${data.authorization.authCode}). Placed pre-auth hold of ${data.authorization.formattedAmount}.`,
        details: data,
      });

      fetchCards();
    } catch (err: any) {
      setPosFeedback({
        type: 'error',
        message: `Authorization DECLINED: ${err.message}`,
      });
    } finally {
      setPosAuthorizing(false);
    }
  };

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

  // Preset Merchant Selection
  const applyPreset = (merchant: string, mcc: string, amount: string) => {
    setPosMerchant(merchant);
    setPosMcc(mcc);
    setPosAmount(amount);
  };

  return (
    <div className="space-y-6">
      {/* Main Grid: Card viewer and merchant authorizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Card, Controls, Limits (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card Selector / Top bar */}
          <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white">Active Cards ({cards.length})</span>
            </div>

            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-md shadow-cyan-950 text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Issue New Card</span>
            </button>
          </div>

          {/* Realistic Card Visual Component */}
          {selectedCard ? (
            <div className="relative group perspective-1000">
              <div
                className={`w-full max-w-md mx-auto aspect-[1.586/1] rounded-3xl p-6 sm:p-7 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300 border ${
                  selectedCard.status === 'FROZEN'
                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/60 border-amber-500/40 opacity-90'
                    : 'bg-gradient-to-br from-slate-900 via-cyan-950/60 to-slate-950 border-cyan-500/30'
                }`}
              >
                {/* Decorative Holographic Elements */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Row: Brand, Chip, Contactless, Form */}
                <div className="flex justify-between items-start z-10">
                  <div className="space-y-1">
                    <AvenoraLogo size="xs" className="rounded bg-white/90 p-0.5" />
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-cyan-400">
                      {selectedCard.type} • {selectedCard.form}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedCard.status === 'ACTIVE_SIMULATED'
                          ? 'bg-brand-accent-light0/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {selectedCard.status === 'ACTIVE_SIMULATED' ? 'ACTIVE' : selectedCard.status}
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
                      {showFullPan ? selectedCard.syntheticPanFormatted : selectedCard.maskedPan}
                    </span>
                    <button
                      onClick={() => setShowFullPan(!showFullPan)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                      title={showFullPan ? 'Mask PAN' : 'Reveal full PAN'}
                    >
                      {showFullPan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Cardholder, Expiry, CVV */}
                  <div className="flex justify-between items-end text-[10px] uppercase font-mono">
                    <div>
                      <span className="text-[8px] text-slate-400 block tracking-wider">Cardholder</span>
                      <span className="font-bold text-white tracking-wider">{selectedCard.syntheticCardholderName}</span>
                    </div>

                    <div>
                      <span className="text-[8px] text-slate-400 block tracking-wider">Expires</span>
                      <span className="font-bold text-white tracking-wider">{selectedCard.syntheticExpiry}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div>
                        <span className="text-[8px] text-slate-400 block tracking-wider">CVV (Demo)</span>
                        <span className="font-bold text-white tracking-wider">
                          {showCvv ? selectedCard.syntheticCvv : '•••'}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowCvv(!showCvv)}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        {showCvv ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">No active card available.</div>
          )}

          {/* Quick Controls: Freeze & Spending Limits */}
          {selectedCard && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="font-bold text-white block">Card State & Safeguards</span>
                  <span className="text-[11px] text-slate-400">Instantly lock or unlock card authorization processing</span>
                </div>

                <button
                  onClick={() => handleToggleFreeze(selectedCard)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition text-xs shadow-md ${
                    selectedCard.status === 'FROZEN'
                      ? 'bg-emerald-600 hover:bg-brand-accent-light0 text-white shadow-emerald-950'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950'
                  }`}
                >
                  {selectedCard.status === 'FROZEN' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  <span>{selectedCard.status === 'FROZEN' ? 'Unfreeze Card' : 'Freeze Card'}</span>
                </button>
              </div>

              {/* Spend Limits Display & Adjuster */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">Transaction & Daily Limits</span>
                  <button
                    onClick={() => setIsAdjustingLimits(!isAdjustingLimits)}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
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
                      <span className="text-[10px] text-slate-400 block">Daily Spend Limit</span>
                      <span className="text-sm font-bold font-mono text-cyan-300 mt-1 block">
                        {selectedCard.formattedDailyLimit}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Spent today: ${(Number(selectedCard.dailySpentMinor) / 100).toFixed(2)}
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
                        <label className="text-[10px] text-slate-400 block mb-1">Daily Limit ({selectedCard.currency})</label>
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
                      className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition text-[11px]"
                    >
                      {savingLimits ? 'Saving...' : 'Save New Limits'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: POS Terminal Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="font-bold text-white text-sm">Point-of-sale authorizations</h3>
                <span className="text-[11px] text-slate-400">Authorize merchant purchases and view pending holds</span>
              </div>
            </div>

            {/* Merchant Presets */}
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold block text-[11px]">Quick Merchant Presets</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('Blue Bottle Coffee & Roasters', '5814', '6.75')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition"
                >
                  <Coffee className="w-3.5 h-3.5 text-amber-400 mb-1" />
                  <span className="font-bold text-slate-200 block text-[11px]">Coffee Shop</span>
                  <span className="text-[10px] text-slate-500">$6.75 • MCC 5814</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('Amazon AWS Cloud Services', '5734', '125.00')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition"
                >
                  <Cloud className="w-3.5 h-3.5 text-cyan-400 mb-1" />
                  <span className="font-bold text-slate-200 block text-[11px]">AWS Cloud</span>
                  <span className="text-[10px] text-slate-500">$125.00 • MCC 5734</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('Delta Air Lines SkyClub', '4511', '350.00')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition"
                >
                  <Plane className="w-3.5 h-3.5 text-indigo-400 mb-1" />
                  <span className="font-bold text-slate-200 block text-[11px]">Delta Airlines</span>
                  <span className="text-[10px] text-slate-500">$350.00 • MCC 4511</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('Whole Foods Market', '5411', '84.20')}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 mb-1" />
                  <span className="font-bold text-slate-200 block text-[11px]">Whole Foods</span>
                  <span className="text-[10px] text-slate-500">$84.20 • MCC 5411</span>
                </button>
              </div>
            </div>

            {/* Custom POS Form */}
            <form onSubmit={handleSimulatePos} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Merchant Name</label>
                <input
                  type="text"
                  required
                  value={posMerchant}
                  onChange={(e) => setPosMerchant(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">MCC Code (4 digits)</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={posMcc}
                    onChange={(e) => setPosMcc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Amount ({selectedCard?.currency || primaryFiat})
                  </label>
                  <input
                    type="text"
                    required
                    value={posAmount}
                    onChange={(e) => setPosAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={posAuthorizing || !selectedCard}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4" />
                <span>{posAuthorizing ? 'Authorizing with network...' : 'Authorize purchase'}</span>
              </button>
            </form>

            {/* Feedback notification */}
            {posFeedback && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  posFeedback.type === 'success'
                    ? 'bg-brand-accent-light0/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {posFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
                )}
                <div>
                  <span className="font-bold block">{posFeedback.message}</span>
                  {posFeedback.details?.ledgerJournalEntryId && (
                    <span className="text-[10px] text-emerald-400/80 font-mono block mt-1">
                      Double-Entry Journal Entry: {posFeedback.details.ledgerJournalEntryId}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two-Step Bank Pre-Authorization Holds & Settlements Inspector */}
      {selectedCard && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
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
                      <td className="py-3 px-4 font-bold text-cyan-400">{auth.authCode}</td>
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
          <div className="modal-panel-scroll bg-slate-900 border border-slate-800 rounded-3xl max-w-md p-6 space-y-5 shadow-2xl my-auto sm:my-0">
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
                    <option value="PHYSICAL">Physical (Demo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Single Tx Limit</label>
                  <input
                    type="text"
                    required
                    value={reqSingleLimit}
                    onChange={(e) => setReqSingleLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Daily Limit</label>
                  <input
                    type="text"
                    required
                    value={reqDailyLimit}
                    onChange={(e) => setReqDailyLimit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

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
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow-md shadow-cyan-950 disabled:opacity-50"
                >
                  {issuingLoading ? 'Provisioning...' : 'Issue card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
