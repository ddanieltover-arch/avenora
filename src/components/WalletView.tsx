/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Multicurrency Wallet View Component
 */

import React, { useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useLocalization } from './LocalizationContext.tsx';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import { getDepositRailsForCountry } from '../domain/country/countryDepositRails.ts';
import {
  getWithdrawalFieldsForRail,
  getWithdrawalRailsForCountry,
} from '../domain/country/withdrawalRailFields.ts';
import { PLATFORM_DEPOSIT_SUPPORT_EMAIL } from '../config/constants.ts';
import {
  fiatMajorToBtcDecimal,
  formatIllustrativeEquivalent,
  parsePositiveMajorAmount,
  walletAvailableMajor,
} from '../lib/illustrativeFx.ts';
import { getCurrency } from '../domain/money/Currency.ts';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Copy,
  UploadCloud,
} from 'lucide-react';

type WalletModalId = 'deposit' | 'withdraw' | 'convert';

/** Deep-link actions from dashboard quick actions into wallet modals. */
export type WalletDeepLinkModal = 'deposit' | 'withdraw';

interface WalletViewProps {
  initialModal?: WalletDeepLinkModal | null;
  onInitialModalConsumed?: () => void;
  /** Refresh portal dashboard charts / recent activity after wallet mutations. */
  onWalletActivity?: () => void;
}

function WalletModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex modal-overlay-scroll justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-panel-scroll portal-dark-panel max-w-xl w-full my-auto sm:my-0"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface WalletAccount {
  id: string;
  currency: string;
  currencyName: string;
  currencySymbol: string;
  minorUnits: number;
  isCrypto: boolean;
  ledgerAccountId: string;
  accountNumber: string;
  availableBalanceMinor: string;
  formattedBalance: string;
  pendingHoldMinor: string;
  formattedHold: string;
  status: string;
}

export const WalletView: React.FC<WalletViewProps> = ({
  initialModal = null,
  onInitialModalConsumed,
  onWalletActivity,
}) => {
  const { user, token } = useAuth();
  const { t } = useLocalization();

  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<WalletModalId | null>(null);
  const [walletActionsOpen, setWalletActionsOpen] = useState(false);

  // Form states
  const {
    countryCode,
    primaryFiat,
    walletCurrencyCodes: allowedCurrencies,
    filterAccounts,
  } = useCustomerWalletScope();

  const depositRails = useMemo(() => getDepositRailsForCountry(countryCode), [countryCode]);
  const withdrawalRails = useMemo(() => getWithdrawalRailsForCountry(countryCode), [countryCode]);

  const [opCurrency, setOpCurrency] = useState(primaryFiat);
  const [opAmount, setOpAmount] = useState('100.00');
  const [opSourceRail, setOpSourceRail] = useState('');
  const [opWithdrawRail, setOpWithdrawRail] = useState('');
  const [withdrawBankingDetails, setWithdrawBankingDetails] = useState<Record<string, string>>({});
  const [btcWithdrawAddress, setBtcWithdrawAddress] = useState('');

  const isBtcDeposit = opCurrency === 'BTC';
  const isBtcWithdraw = opCurrency === 'BTC';
  const activeDepositRail =
    depositRails.find((rail) => rail.code === opSourceRail) ?? depositRails[0];
  const activeWithdrawalRail =
    withdrawalRails.find((rail) => rail.code === opWithdrawRail) ?? withdrawalRails[0];
  const withdrawalFields = useMemo(() => {
    if (isBtcWithdraw) return [];
    return getWithdrawalFieldsForRail(activeWithdrawalRail?.code ?? 'LOCAL_BANK');
  }, [isBtcWithdraw, activeWithdrawalRail?.code]);

  const [fiatDepositNotice, setFiatDepositNotice] = useState<{
    currency: string;
    amount: string;
    railLabel: string;
  } | null>(null);

  const [btcDepositOpen, setBtcDepositOpen] = useState(false);
  const [btcDepositAmount, setBtcDepositAmount] = useState('0.001');
  const [btcDepositFiatAmount, setBtcDepositFiatAmount] = useState('');
  const [btcDepositFiatCurrency, setBtcDepositFiatCurrency] = useState(primaryFiat);
  const [btcAddress, setBtcAddress] = useState('');
  const [btcProofFile, setBtcProofFile] = useState<File | null>(null);
  const [btcProofPreview, setBtcProofPreview] = useState<string | null>(null);
  const [btcProofSubmitting, setBtcProofSubmitting] = useState(false);
  const btcProofInputRef = useRef<HTMLInputElement>(null);

  // FX Quote states
  const [fxSrcCurrency, setFxSrcCurrency] = useState(primaryFiat);
  const [fxDestCurrency, setFxDestCurrency] = useState('BTC');
  const [fxAmount, setFxAmount] = useState('100.00');
  const [currentQuote, setCurrentQuote] = useState<{
    id: string;
    sourceAmountMinor: string;
    destinationAmountMinor: string;
    exchangeRate: string;
    feeMinor: string;
    rateSource: string;
    expiresAt: string;
  } | null>(null);

  // Feedback states
  const currencyOptions = useMemo(() => {
    if (accounts.length > 0) {
      return accounts.map((a) => ({
        code: a.currency,
        label: `${a.currency} — ${a.currencyName}`,
      }));
    }
    return allowedCurrencies.map((code) => ({ code, label: code }));
  }, [accounts, allowedCurrencies]);

  const [feedback, setFeedback] = useState<{
    success: boolean;
    title: string;
    message: string;
    details?: any;
  } | null>(null);

  const fetchWallet = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/wallets/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.wallet?.accounts) {
        setAccounts(filterAccounts(data.wallet.accounts as WalletAccount[]));
      }
    } catch (err) {
      console.error('Failed to fetch wallet', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [token, allowedCurrencies.join(',')]);

  useEffect(() => {
    setOpCurrency(primaryFiat);
    setFxSrcCurrency(primaryFiat);
    setFxDestCurrency('BTC');
    setBtcDepositFiatCurrency(primaryFiat);
  }, [primaryFiat]);

  useEffect(() => {
    if (depositRails.length > 0) {
      setOpSourceRail(depositRails[0].code);
    }
  }, [countryCode, depositRails]);

  useEffect(() => {
    if (withdrawalRails.length > 0) {
      setOpWithdrawRail(withdrawalRails[0].code);
    }
  }, [countryCode, withdrawalRails]);

  useEffect(() => {
    setWithdrawBankingDetails({});
  }, [opWithdrawRail, opCurrency]);

  useEffect(() => {
    return () => {
      if (btcProofPreview) {
        URL.revokeObjectURL(btcProofPreview);
      }
    };
  }, [btcProofPreview]);

  const btcDepositFiatMajor = useMemo(() => {
    if (opCurrency !== 'BTC') return null;
    return parsePositiveMajorAmount(opAmount);
  }, [opCurrency, opAmount]);

  const btcDepositEquivalentDisplay = useMemo(() => {
    if (btcDepositFiatMajor == null) return null;
    try {
      return formatIllustrativeEquivalent(btcDepositFiatMajor, primaryFiat, 'BTC');
    } catch {
      return null;
    }
  }, [btcDepositFiatMajor, primaryFiat]);

  const primaryFiatLabel = useMemo(() => {
    try {
      const def = getCurrency(primaryFiat);
      return `${primaryFiat} · ${def.symbol}`;
    } catch {
      return primaryFiat;
    }
  }, [primaryFiat]);

  const openBtcDepositFlow = async (btcAmountDecimal: string, fiatAmount: string, fiatCurrency: string) => {
    setBtcDepositAmount(btcAmountDecimal);
    setBtcDepositFiatAmount(fiatAmount);
    setBtcDepositFiatCurrency(fiatCurrency);
    setBtcProofFile(null);
    if (btcProofPreview) {
      URL.revokeObjectURL(btcProofPreview);
      setBtcProofPreview(null);
    }
    setActiveModal(null);
    try {
      const res = await fetch('/api/v1/wallets/deposit/btc-instructions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.address) {
        setBtcAddress(data.address);
      } else {
        setBtcAddress('');
      }
    } catch {
      setBtcAddress('');
    }
    setBtcDepositOpen(true);
  };

  const applyBtcProofFile = (file: File | null) => {
    if (btcProofPreview) {
      URL.revokeObjectURL(btcProofPreview);
    }
    setBtcProofFile(null);
    setBtcProofPreview(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback({
        success: false,
        title: 'Invalid file',
        message: 'Please upload a JPEG, PNG, or WebP image of your payment.',
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({
        success: false,
        title: 'File too large',
        message: 'Payment proof must be 10 MB or smaller.',
      });
      return;
    }
    setBtcProofFile(file);
    setBtcProofPreview(URL.createObjectURL(file));
  };

  const submitBtcDepositProof = async () => {
    if (!btcProofFile) {
      setFeedback({
        success: false,
        title: 'Proof required',
        message: 'Upload a screenshot of your Bitcoin payment before submitting.',
      });
      return;
    }
    setBtcProofSubmitting(true);
    try {
      const res = await fetch('/api/v1/wallets/deposit/btc-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountDecimal: btcDepositAmount,
          fileName: btcProofFile.name,
          mimeType: btcProofFile.type || 'image/jpeg',
          fileSize: btcProofFile.size,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBtcDepositOpen(false);
        const fiatPart = btcDepositFiatAmount
          ? `${getCurrency(btcDepositFiatCurrency).symbol}${btcDepositFiatAmount} ${btcDepositFiatCurrency} (≈ ${btcDepositAmount} BTC)`
          : `${btcDepositAmount} BTC`;
        setFeedback({
          success: true,
          title: 'Bitcoin deposit submitted',
          message:
            data.message ||
            `Your request for ${fiatPart} is pending review and will appear under Hold until approved.`,
        });
        fetchWallet();
        onWalletActivity?.();
      } else {
        setFeedback({
          success: false,
          title: data.title || 'Submission failed',
          message: data.detail || 'Could not submit payment proof.',
        });
      }
    } catch (err: any) {
      setFeedback({ success: false, title: 'Network Error', message: err.message });
    } finally {
      setBtcProofSubmitting(false);
    }
  };

  const copyBtcAddress = async () => {
    if (!btcAddress) return;
    try {
      await navigator.clipboard.writeText(btcAddress);
      setFeedback({
        success: true,
        title: 'Address copied',
        message: 'Bitcoin deposit address copied to your clipboard.',
      });
    } catch {
      setFeedback({
        success: false,
        title: 'Copy failed',
        message: 'Select and copy the address manually.',
      });
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isBtcDeposit) {
      const fiatMajor = parsePositiveMajorAmount(opAmount);
      if (fiatMajor == null) {
        setFeedback({
          success: false,
          title: 'Invalid amount',
          message: `Enter a valid ${primaryFiat} amount to convert into Bitcoin.`,
        });
        return;
      }
      try {
        const btcDecimal = fiatMajorToBtcDecimal(fiatMajor, primaryFiat);
        await openBtcDepositFlow(btcDecimal, opAmount.trim(), primaryFiat);
      } catch (err: unknown) {
        setFeedback({
          success: false,
          title: 'Conversion failed',
          message: err instanceof Error ? err.message : 'Could not convert amount to Bitcoin.',
        });
      }
      return;
    }

    const railLabel = activeDepositRail?.label ?? 'Local bank transfer';
    try {
      const res = await fetch('/api/v1/wallets/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': `dep_${user?.id ?? 'anon'}_${opCurrency}_${opAmount}_${Date.now()}`,
        },
        body: JSON.stringify({
          currency: opCurrency,
          amountDecimal: opAmount,
          sourceRail: opSourceRail,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveModal(null);
        fetchWallet();
        onWalletActivity?.();
        setFeedback({
          success: true,
          title: 'Deposit on hold',
          message:
            data.message ||
            'Your requested amount is shown under Hold until our team approves the deposit.',
        });
        setFiatDepositNotice({
          currency: opCurrency,
          amount: opAmount,
          railLabel,
        });
      } else {
        setFeedback({
          success: false,
          title: data.title || 'Deposit failed',
          message: data.detail || data.message || 'Could not submit deposit request.',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setFeedback({ success: false, title: 'Network Error', message });
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const body: Record<string, unknown> = {
        currency: opCurrency,
        amountDecimal: opAmount,
      };
      if (isBtcWithdraw) {
        body.btcAddress = btcWithdrawAddress.trim();
      } else {
        body.destinationRail = opWithdrawRail || activeWithdrawalRail?.code;
        body.bankingDetails = withdrawBankingDetails;
      }

      const res = await fetch('/api/v1/wallets/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': `wth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          success: true,
          title: 'Withdrawal submitted',
          message:
            data.message ||
            'Your withdrawal is pending review. The amount is reserved under Hold until operations approves payout.',
          details: data,
        });
        fetchWallet();
        onWalletActivity?.();
        setActiveModal(null);
        setBtcWithdrawAddress('');
        setWithdrawBankingDetails({});
      } else {
        setFeedback({
          success: false,
          title: data.title || 'Withdrawal Failed',
          message: data.detail || data.message || 'The withdrawal could not be submitted.',
          details: data,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setFeedback({ success: false, title: 'Network Error', message });
    }
  };

  const handleGetFxQuote = async () => {
    setCurrentQuote(null);
    try {
      const res = await fetch('/api/v1/wallets/fx/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sourceCurrency: fxSrcCurrency,
          destinationCurrency: fxDestCurrency,
          sourceAmountDecimal: fxAmount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.quote) {
        setCurrentQuote(data.quote);
      } else {
        setFeedback({
          success: false,
          title: 'FX Quote Failed',
          message: data.detail || 'Could not fetch rate.',
        });
      }
    } catch (err: any) {
      setFeedback({ success: false, title: 'Network Error', message: err.message });
    }
  };

  const handleExecuteFxConversion = async () => {
    if (!currentQuote) return;
    try {
      const res = await fetch('/api/v1/wallets/fx/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quoteId: currentQuote.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          success: true,
          title: 'Currency Conversion Executed',
          message: `Converted ${fxAmount} ${fxSrcCurrency} to ${data.formattedAmount}. Ref: ${data.referenceNumber}`,
          details: data,
        });
        setCurrentQuote(null);
        fetchWallet();
        onWalletActivity?.();
        setActiveModal(null);
      } else {
        setFeedback({
          success: false,
          title: data.title || 'Conversion Failed',
          message: data.detail || 'Could not execute conversion.',
          details: data,
        });
      }
    } catch (err: any) {
      setFeedback({ success: false, title: 'Network Error', message: err.message });
    }
  };

  const openWalletModal = (modal: WalletModalId) => {
    setWalletActionsOpen(false);
    setActiveModal(modal);
    setFeedback(null);
  };

  useEffect(() => {
    if (!initialModal) return;
    if (
      user?.status === 'SUSPENDED' ||
      user?.status === 'LOCKED' ||
      user?.status === 'PENDING_VERIFICATION' ||
      (user?.role === 'CUSTOMER' && user?.kycStatus !== 'APPROVED')
    ) {
      onInitialModalConsumed?.();
      return;
    }
    setActiveModal(initialModal);
    setFeedback(null);
    onInitialModalConsumed?.();
  }, [initialModal, user?.status, onInitialModalConsumed]);

  const walletActionButtons: {
    id: WalletModalId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }[] = [
    {
      id: 'deposit',
      label: t.actions.deposit,
      icon: ArrowDownLeft,
      className:
        'bg-brand-primary hover:bg-brand-deep text-white border border-brand-accent/40',
    },
    {
      id: 'withdraw',
      label: t.actions.withdraw,
      icon: ArrowUpRight,
      className:
        'bg-brand-deep/40 hover:bg-brand-deep/60 text-brand-accent-light border border-brand-primary/40',
    },
  ];

  const transactionsFrozen =
    user?.status === 'SUSPENDED' ||
    user?.status === 'LOCKED' ||
    user?.status === 'PENDING_VERIFICATION' ||
    (user?.role === 'CUSTOMER' && user?.kycStatus !== 'APPROVED');
  const frozenForKyc =
    transactionsFrozen &&
    user?.status !== 'SUSPENDED' &&
    user?.status !== 'LOCKED';

  return (
    <div className="space-y-6">
      {transactionsFrozen && (
        <div
          className={`rounded-xl border-2 px-4 py-3 text-sm ${
            frozenForKyc
              ? 'border-[#076c64] bg-[#eef7f5] text-[#003933]'
              : 'border-amber-500 bg-amber-50 text-amber-950'
          }`}
          role="status"
        >
          <p
            className={`font-bold uppercase tracking-wide ${
              frozenForKyc ? 'text-[#003933]' : 'text-amber-900'
            }`}
          >
            {frozenForKyc ? 'Account inactive — KYC required' : 'Transactions frozen'}
          </p>
          <p className={`text-xs mt-1 ${frozenForKyc ? 'text-[#3d5c56]' : 'text-amber-900/90'}`}>
            {frozenForKyc
              ? 'Deposits and withdrawals are blocked until an administrator approves your identity verification.'
              : 'Your account status blocks deposits and withdrawals. Contact support@avenorabank.com.'}
          </p>
        </div>
      )}
      {/* Wallet Header & Quick Operations Bar */}
      <div className="portal-dark-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-primary/25 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 portal-dark-icon">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {user ? `${user.fullName}'s Wallets` : t.tabs.wallets}
              </h2>
              <p className="text-xs text-slate-400">
                {primaryFiat} account for your region ({user?.countryCode ?? 'US'}) and Bitcoin (BTC).
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setWalletActionsOpen(true)}
              disabled={transactionsFrozen}
              className="lg:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-deep/50 border border-brand-primary/40 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Wallet className="w-4 h-4" aria-hidden />
              Wallet actions
            </button>
            <div className="hidden lg:flex flex-wrap items-center gap-2">
              {walletActionButtons.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => openWalletModal(action.id)}
                    disabled={transactionsFrozen}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${action.className}`}
                  >
                    <Icon className="w-3.5 h-3.5" aria-hidden />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Currency Cards Grid — identical brand shell for fiat and BTC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 max-w-3xl">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="portal-dark-card p-5 space-y-3 relative overflow-hidden min-h-[11.5rem] flex flex-col"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 shrink-0 flex items-center justify-center font-bold text-sm portal-dark-icon">
                    {acc.currencySymbol}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block">{acc.currency}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{acc.currencyName}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono portal-dark-badge px-2 py-0.5 shrink-0">
                  {acc.status}
                </span>
              </div>

              <div className="flex-1">
                <span className="text-[11px] text-slate-400 block">Available Balance</span>
                <span className="text-lg font-bold text-white font-mono tracking-tight break-all">
                  {acc.formattedBalance}
                </span>
                <span className="text-[11px] text-brand-accent font-mono block mt-1 tabular-nums break-all">
                  ≈{' '}
                  {formatIllustrativeEquivalent(
                    walletAvailableMajor(acc),
                    acc.currency,
                    acc.currency === 'BTC' ? primaryFiat : 'BTC',
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-brand-primary/20 text-[11px] text-slate-400 font-mono">
                <span title="Pending deposits and outbound withdrawals until admin approval">
                  Hold: {acc.formattedHold}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-2 ${
            feedback.success
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{feedback.title}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300">{feedback.message}</p>
        </div>
      )}

      {/* MODAL 1: Deposit */}
      {activeModal === 'deposit' && (
        <WalletModalOverlay onClose={() => setActiveModal(null)}>
          <div className="modal-panel-body p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              Deposit funds
            </h3>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <form onSubmit={handleDeposit} className="space-y-4 text-xs">
            <p className="text-[11px] text-slate-400">
              Deposit methods are limited to local banking options for your signup country ({countryCode}).
            </p>
            <div className={`grid gap-3 ${isBtcDeposit ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div>
                <label className="block text-slate-300 mb-1">Currency</label>
                <select
                  value={opCurrency}
                  onChange={(e) => setOpCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  {currencyOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {!isBtcDeposit && (
                <div>
                  <label className="block text-slate-300 mb-1">Local deposit method</label>
                  <select
                    value={opSourceRail}
                    onChange={(e) => setOpSourceRail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    {depositRails.map((rail) => (
                      <option key={rail.code} value={rail.code}>{rail.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                {opCurrency === 'BTC' ? `Amount (${primaryFiatLabel})` : 'Amount'}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={opAmount}
                onChange={(e) => setOpAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                placeholder="100.00"
                aria-describedby={opCurrency === 'BTC' ? 'btc-deposit-equivalent' : undefined}
              />
              {opCurrency === 'BTC' && (
                <p
                  id="btc-deposit-equivalent"
                  className="mt-2 text-[12px] leading-relaxed text-brand-accent"
                  aria-live="polite"
                >
                  {btcDepositEquivalentDisplay ? (
                    <>
                      ≈{' '}
                      <span className="font-mono font-semibold text-white">{btcDepositEquivalentDisplay}</span>
                    </>
                  ) : (
                    <span className="text-slate-400">
                      Enter a {primaryFiat} amount to see the Bitcoin equivalent.
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-deep text-white font-medium shadow"
              >
                Confirm deposit
              </button>
            </div>
          </form>
          </div>
        </WalletModalOverlay>
      )}

      {fiatDepositNotice && (
        <WalletModalOverlay onClose={() => setFiatDepositNotice(null)}>
          <div className="modal-panel-body p-6 space-y-4 text-xs border-t border-amber-500/20">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Deposit instructions</h3>
            <button
              type="button"
              onClick={() => setFiatDepositNotice(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-300 leading-relaxed">
            You requested a <strong className="text-white">{fiatDepositNotice.amount}</strong>{' '}
            <strong className="text-white">{fiatDepositNotice.currency}</strong> deposit via{' '}
            <strong className="text-white">{fiatDepositNotice.railLabel}</strong>. This amount is already
            shown under <strong className="text-white">Hold</strong> on your wallet until operations approves it.
          </p>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-100 space-y-2">
            <p className="font-semibold text-amber-200">Complete your transfer with support</p>
            <p>
              Email{' '}
              <a
                href={`mailto:${PLATFORM_DEPOSIT_SUPPORT_EMAIL}?subject=${encodeURIComponent(
                  `Deposit request — ${fiatDepositNotice.currency} ${fiatDepositNotice.amount}`,
                )}`}
                className="text-brand-accent underline"
              >
                {PLATFORM_DEPOSIT_SUPPORT_EMAIL}
              </a>{' '}
              with your account email, the amount, and your chosen local method (
              {fiatDepositNotice.railLabel}). Our team will reply with wire or transfer details for your region.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFiatDepositNotice(null)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            Close
          </button>
          </div>
        </WalletModalOverlay>
      )}

      {btcDepositOpen && (
        <WalletModalOverlay onClose={() => setBtcDepositOpen(false)}>
          <div className="modal-panel-body p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Bitcoin deposit</h3>
            <button
              type="button"
              onClick={() => setBtcDepositOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="rounded-xl border border-brand-primary/30 bg-brand-deep/40 p-3 space-y-1">
            {btcDepositFiatAmount && (
              <p className="text-slate-300">
                You requested{' '}
                <span className="font-mono text-white">
                  {getCurrency(btcDepositFiatCurrency).symbol}
                  {btcDepositFiatAmount} {btcDepositFiatCurrency}
                </span>
              </p>
            )}
            <p className="text-slate-400">
              Send exactly{' '}
              <span className="font-mono text-white">{btcDepositAmount} BTC</span> to the platform
              address below, then upload your payment screenshot.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-500">Admin BTC address</span>
            <div className="flex items-start gap-2">
              <code className="flex-1 break-all text-[11px] text-brand-accent font-mono">{btcAddress}</code>
              <button
                type="button"
                onClick={copyBtcAddress}
                className="shrink-0 rounded-md border border-slate-700 p-1.5 text-slate-300 hover:bg-slate-800"
                title="Copy address"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => btcProofInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                btcProofInputRef.current?.click();
              }
            }}
            className="cursor-pointer rounded-xl border border-dashed border-slate-700 bg-slate-950 p-5 text-center hover:border-brand-accent/60"
          >
            <input
              ref={btcProofInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => applyBtcProofFile(e.target.files?.[0] ?? null)}
            />
            {btcProofPreview ? (
              <img
                src={btcProofPreview}
                alt="Payment proof"
                className="mx-auto max-h-40 rounded-lg border border-slate-800 object-contain"
              />
            ) : (
              <div className="space-y-2">
                <UploadCloud className="mx-auto h-8 w-8 text-brand-accent" />
                <p className="text-sm text-white">Upload payment screenshot</p>
                <p className="text-[10px] text-slate-500">JPEG, PNG, or WebP · Max 10 MB</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBtcDepositOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={btcProofSubmitting || !btcProofFile}
              onClick={submitBtcDepositProof}
              className="px-4 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-deep disabled:opacity-50 text-white font-medium"
            >
              {btcProofSubmitting ? 'Submitting…' : 'Submit payment proof'}
            </button>
          </div>
          </div>
        </WalletModalOverlay>
      )}

      {/* MODAL 2: Withdrawal */}
      {activeModal === 'withdraw' && (
        <WalletModalOverlay onClose={() => setActiveModal(null)}>
          <div className="modal-panel-body p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-brand-accent" />
              Withdraw funds
            </h3>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <form onSubmit={handleWithdrawal} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-brand-deep/40 border border-brand-primary/35 text-brand-accent-light text-[11px]">
              Funds are reserved from your available balance and shown under Hold until operations approves the payout.
              Rejected requests return the amount to available balance.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Currency</label>
                <select
                  value={opCurrency}
                  onChange={(e) => setOpCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  {currencyOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Amount</label>
                <input
                  type="text"
                  value={opAmount}
                  onChange={(e) => setOpAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  placeholder="50.00"
                />
              </div>
            </div>

            {isBtcWithdraw ? (
              <div>
                <label className="block text-slate-300 mb-1">Bitcoin withdrawal address</label>
                <input
                  type="text"
                  value={btcWithdrawAddress}
                  onChange={(e) => setBtcWithdrawAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                  placeholder="bc1q… or 1… or 3…"
                  autoComplete="off"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Double-check the address. Approved withdrawals are sent to this destination.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-slate-300 mb-1">Local withdrawal method</label>
                  <select
                    value={opWithdrawRail || activeWithdrawalRail?.code}
                    onChange={(e) => setOpWithdrawRail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    {withdrawalRails.map((rail) => (
                      <option key={rail.code} value={rail.code}>{rail.label}</option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">Payout banking details</p>
                  {withdrawalFields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-slate-300 mb-1">
                        {field.label}
                        {field.required ? '' : ' (optional)'}
                      </label>
                      {field.type === 'select' && field.options ? (
                        <select
                          value={withdrawBankingDetails[field.key] ?? ''}
                          onChange={(e) =>
                            setWithdrawBankingDetails((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                        >
                          <option value="">Select…</option>
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={withdrawBankingDetails[field.key] ?? ''}
                          onChange={(e) =>
                            setWithdrawBankingDetails((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          placeholder={field.placeholder}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-deep text-white font-medium shadow"
              >
                Confirm withdrawal
              </button>
            </div>
          </form>
          </div>
        </WalletModalOverlay>
      )}

      {/* MODAL 3: FX Currency Exchange */}
      {activeModal === 'convert' && (
        <WalletModalOverlay onClose={() => setActiveModal(null)}>
          <div className="modal-panel-body p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-brand-accent" />
              Illustrative Currency Conversion (FX Swap)
            </h3>
            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Source Currency (From)</label>
                <select
                  value={fxSrcCurrency}
                  onChange={(e) => {
                    setFxSrcCurrency(e.target.value);
                    setCurrentQuote(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  {currencyOptions.map((opt) => (
                    <option key={opt.code} value={opt.code}>{opt.code}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Destination Currency (To)</label>
                <select
                  value={fxDestCurrency}
                  onChange={(e) => {
                    setFxDestCurrency(e.target.value);
                    setCurrentQuote(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  {currencyOptions
                    .filter((opt) => opt.code !== fxSrcCurrency)
                    .map((opt) => (
                      <option key={opt.code} value={opt.code}>{opt.code}</option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Source Amount</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fxAmount}
                  onChange={(e) => {
                    setFxAmount(e.target.value);
                    setCurrentQuote(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  placeholder="100.00"
                />
                <button
                  type="button"
                  onClick={handleGetFxQuote}
                  className="px-3 py-1.5 rounded-lg bg-brand-primary hover:bg-brand-deep text-white font-medium shrink-0"
                >
                  Get Quote
                </button>
              </div>
            </div>

            {/* Active Quote Card */}
            {currentQuote && (
              <div className="p-4 rounded-xl bg-slate-950 border border-brand-primary/40 space-y-2 font-mono">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Illustrative Rate:</span>
                  <span className="text-brand-accent font-bold">1 {fxSrcCurrency} = {currentQuote.exchangeRate} {fxDestCurrency}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Estimated Received:</span>
                  <span className="text-emerald-400 font-bold">
                    {(Number(currentQuote.destinationAmountMinor) / 100).toFixed(2)} {fxDestCurrency}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Source: {currentQuote.rateSource}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Expires in 60s
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteFxConversion}
                  className="w-full mt-3 py-2 rounded-lg bg-brand-primary hover:bg-brand-deep text-white font-sans font-semibold text-xs transition"
                >
                  Execute Conversion Now
                </button>
              </div>
            )}
          </div>
          </div>
        </WalletModalOverlay>
      )}

      {walletActionsOpen && (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-[calc(var(--portal-mobile-bottom-nav-height)+0.75rem)] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Wallet actions"
          onClick={() => setWalletActionsOpen(false)}
        >
          <div
            className="w-full max-w-lg portal-dark-panel p-3 space-y-2"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs font-semibold text-slate-400 px-2 pt-1">Choose an action</p>
            {walletActionButtons.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  onClick={() => openWalletModal(action.id)}
                  className={`w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold ${action.className}`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden />
                  {action.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setWalletActionsOpen(false)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
