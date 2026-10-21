/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Secure Mock Webhook Console & Replay Simulator
 */

import React, { useState, useEffect } from 'react';
import { useCustomerWalletScope } from '../hooks/useCustomerWalletScope.ts';
import {
  Webhook,
  ShieldAlert,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  History,
} from 'lucide-react';

export const WebhookConsole: React.FC = () => {
  const { primaryFiat } = useCustomerWalletScope();
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<'mock.deposit.cleared' | 'mock.wire.inbound' | 'mock.compliance.flag'>('mock.deposit.cleared');
  const [customAmount, setCustomAmount] = useState('250.00');

  // Test simulation result
  const [testResult, setTestResult] = useState<{
    status: number;
    title: string;
    message: string;
    details?: any;
  } | null>(null);

  const fetchRecentEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/webhooks/events');
      const data = await res.json();
      if (res.ok && data.events) {
        setRecentEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to load webhook events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentEvents();
  }, []);

  const dispatchWebhookTest = async (testMode: 'VALID' | 'EXPIRED_REPLAY' | 'TAMPERED' | 'DUPLICATE') => {
    setTestResult(null);

    const eventId = testMode === 'DUPLICATE' ? 'evt_duplicate_sample_001' : `evt_mock_${Date.now()}`;
    const payload = {
      eventId,
      eventType: selectedEventType,
      timestamp: new Date().toISOString(),
      data: {
        referenceNumber: `DEP-${primaryFiat}-${Date.now().toString().slice(-6)}`,
        currency: primaryFiat,
        amountDecimal: customAmount,
        providerTxId: `prov_tx_${Date.now()}`,
      },
    };

    try {
      // Step 1: Generate valid HMAC signature from backend signing utility
      const sigRes = await fetch('/api/v1/webhooks/generate-test-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const sigData = await sigRes.json();
      let signatureHeader = sigData.signatureHeader;
      let bodyToSend = JSON.stringify(payload);

      // Step 2: Apply attack simulation mutations
      if (testMode === 'EXPIRED_REPLAY') {
        // Send signature with timestamp 1 hour ago
        const oldTimestamp = Math.floor(Date.now() / 1000) - 3600;
        signatureHeader = `t=${oldTimestamp},v1=${signatureHeader.split(',')[1]?.split('=')[1] || 'expired'}`;
      } else if (testMode === 'TAMPERED') {
        // Tamper payload body (e.g. increase amount) while keeping original signature
        const tampered = { ...payload, data: { ...payload.data, amountDecimal: '999999.00' } };
        bodyToSend = JSON.stringify(tampered);
      }

      // Step 3: Dispatch to webhook gateway
      const res = await fetch('/api/v1/webhooks/mock-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Avenora-Signature': signatureHeader,
        },
        body: bodyToSend,
      });

      const resJson = await res.json();

      setTestResult({
        status: res.status,
        title: res.ok ? 'Webhook Processed' : resJson.title || 'Signature Rejection',
        message: resJson.detail || resJson.message || 'Complete',
        details: resJson,
      });

      fetchRecentEvents();
    } catch (err: any) {
      setTestResult({
        status: 500,
        title: 'Execution Error',
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Console Header */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Secure webhook gateway & signature verifier
              </h2>
              <p className="text-xs text-slate-400">
                HMAC-SHA256 signature verification over raw request bytes. Replay tolerance: 300s.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-brand-accent-light0/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ALGORITHM: HMAC-SHA256
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              TIMING-SAFE: TRUE
            </span>
          </div>
        </div>

        {/* Attack & Validation Simulator Buttons */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-300 block">
            Interactive Test Actions (Test HMAC verification & attack defenses in real time)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => dispatchWebhookTest('VALID')}
              className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 text-left transition group space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">1. Valid Event</span>
                <Send className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Fresh timestamp & valid HMAC-SHA256 signature. (HTTP 200 OK)
              </p>
            </button>

            <button
              onClick={() => dispatchWebhookTest('EXPIRED_REPLAY')}
              className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-rose-500/30 text-left transition group space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400">2. Replay Attack</span>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Timestamp &gt; 300s old. Blocked by freshness window. (HTTP 401)
              </p>
            </button>

            <button
              onClick={() => dispatchWebhookTest('TAMPERED')}
              className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-amber-500/30 text-left transition group space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">3. Tampered Payload</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Payload modified in flight; signature mismatch. (HTTP 401)
              </p>
            </button>

            <button
              onClick={() => dispatchWebhookTest('DUPLICATE')}
              className="p-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-cyan-500/30 text-left transition group space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">4. Duplicate Event</span>
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Reused eventId handled idempotently. (Status: DUPLICATE)
              </p>
            </button>
          </div>
        </div>

        {/* Live Test Outcome Banner */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 font-mono ${
              testResult.status === 200
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">
                HTTP {testResult.status} — {testResult.title}
              </span>
              <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-slate-300 font-sans">{testResult.message}</p>
            {testResult.details && (
              <pre className="p-2.5 rounded bg-slate-950 text-[11px] overflow-x-auto text-slate-400">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Webhook Events Audit Log */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Received Webhook Audit History</h3>
          </div>
          <button
            onClick={fetchRecentEvents}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh Log
          </button>
        </div>

        {recentEvents.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No webhook events recorded yet. Click one of the test buttons above to dispatch a signed event.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Event ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Received At</th>
                  <th className="py-2.5 px-3">Processing Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {recentEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-cyan-400 font-semibold">{evt.eventId}</td>
                    <td className="py-2.5 px-3 text-white">{evt.eventType}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          evt.status === 'PROCESSED'
                            ? 'bg-brand-accent-light0/10 text-emerald-400 border border-emerald-500/20'
                            : evt.status === 'DUPLICATE'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(evt.receivedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">{evt.processingLog}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
