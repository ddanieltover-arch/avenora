/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Architecture & Trust Boundaries Visualizer
 */

import React from 'react';
import { Layers, Shield, Database, Lock, Server, Cpu, ArrowDown, ExternalLink } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">System Architecture & Trust Boundaries</h2>
          <p className="text-xs text-slate-400">
            Multi-tier zero-trust topology, domain encapsulation, and data flow.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Tier 1: Client Layer (Untrusted Zone) */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Tier 1: Client Applications (Untrusted Zone)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Public Internet / Web & Mobile</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-white block">Next.js / Vite SPA</span>
              <span className="text-[11px] text-slate-400">Desktop & Mobile Web Frontend</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-white block">React Native / Expo</span>
              <span className="text-[11px] text-slate-400">iOS & Android Customer App</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-white block">Internal Ops Portal</span>
              <span className="text-[11px] text-slate-400">Compliance & KYC Operations</span>
            </div>
          </div>
        </div>

        {/* Boundary 1: Perimeter & Gateway */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-400 py-1">
          <ArrowDown className="w-4 h-4 animate-bounce" />
          <span>HTTPS / TLS 1.3 • Idempotency-Key • X-Correlation-ID • Zod Schema Validation</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </div>

        {/* Tier 2: Application & API Gateway (DMZ) */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
              <Server className="w-4 h-4" /> Tier 2: Server API & Validation Boundary
            </span>
            <span className="text-[10px] font-mono text-slate-400">Stateless Express / NestJS Runtime</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
              <span className="font-semibold text-slate-200 block">PII Redactor</span>
              <span className="text-[10px] text-slate-400">Masks PAN, SSN, tokens in logs</span>
            </div>
            <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
              <span className="font-semibold text-slate-200 block">Idempotency Filter</span>
              <span className="text-[10px] text-slate-400">Prevents double-charging</span>
            </div>
            <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
              <span className="font-semibold text-slate-200 block">Health Probes</span>
              <span className="text-[10px] text-slate-400">/health & /ready diagnostics</span>
            </div>
            <div className="p-2 rounded bg-slate-900/70 border border-slate-800">
              <span className="font-semibold text-slate-200 block">RFC 7807 Errors</span>
              <span className="text-[10px] text-slate-400">Standardized Problem Details</span>
            </div>
          </div>
        </div>

        {/* Boundary 2: Domain Boundary */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400 py-1">
          <ArrowDown className="w-4 h-4" />
          <span>Core Domain Invariant Guards • Transaction FSM • BigInt Money</span>
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Tier 3: Core Financial Domain Services (Secure Isolated Enclave) */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Tier 3: Financial Domain & Double-Entry Ledger Engine
            </span>
            <span className="text-[10px] font-mono text-slate-400">Zero-Float • Invariant Guarded</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-emerald-300 block">Ledger Invariant Engine</span>
              <span className="text-[11px] text-slate-400">
                Asserts Sum(Debits) === Sum(Credits) on every journal line before commit
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-emerald-300 block">Finite State Machine</span>
              <span className="text-[11px] text-slate-400">
                Guards transaction progression (DRAFT -&gt; PENDING -&gt; POSTED -&gt; REVERSED)
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-emerald-300 block">BigInt Monetary Math</span>
              <span className="text-[11px] text-slate-400">
                Pro-rata allocation without penny loss. Exact integer minor units.
              </span>
            </div>
          </div>
        </div>

        {/* Tier 4: Storage & External Partners */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-2 mb-2">
              <Database className="w-4 h-4" /> Persistence Tier (PostgreSQL / Neon)
            </span>
            <ul className="text-xs space-y-1.5 text-slate-300">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Prisma ORM with reproducible versioned SQL migrations</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Append-only Journal Entries & Audit Trails (no UPDATE/DELETE on posted)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>Connection pooler for serverless concurrency & direct URL for DDL</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4" /> Future Integration Boundaries (Phase 02+)
            </span>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span>Banking Partner Rails (ACH / FedNow / SEPA / Pix Webhooks)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span>Licensed Bitcoin Custody Partner API & HSM Key Management</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span>Regulated Card Issuing Partner & Verified Grant Providers</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
