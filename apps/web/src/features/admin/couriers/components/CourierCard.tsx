'use client';

import React, { useState } from 'react';
import { Copy, Check, Activity, Settings, Wallet, ShieldCheck, Loader2 } from 'lucide-react';
import { CourierIntegrationItem } from '../types';

interface CourierCardProps {
  courier: CourierIntegrationItem;
  isTesting?: boolean;
  onTestConnection: (courier: CourierIntegrationItem) => void;
  onConfigure: (courier: CourierIntegrationItem) => void;
}

export function CourierCard({
  courier,
  isTesting = false,
  onTestConnection,
  onConfigure,
}: CourierCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (keyId: string, text: string) => {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedField(keyId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/15 flex flex-col justify-between gap-5 shadow-xl transition-all">
      <div className="space-y-4">
        {/* Top Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center justify-center tabular-nums font-extrabold text-orange-600 dark:text-orange-400 text-sm shrink-0">
              {courier.code.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-navy-800 dark:text-white">{courier.name}</h3>
                <span className="px-2 py-0.5 rounded bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 tabular-nums text-[11px] text-slate-600 dark:text-slate-300">
                  {courier.environment}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums mt-0.5 truncate max-w-[280px] sm:max-w-xs">
                {courier.baseUrl}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
              courier.status === 'CONNECTED'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                : courier.status === 'SANDBOX'
                ? 'bg-amber-50 dark:bg-amber-950/90 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-white/15'
            }`}
          >
            {courier.status}
          </span>
        </div>

        {/* Balance, Rates & Ping Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50/90 dark:bg-navy-950/90 border border-slate-200/80 dark:border-white/10 text-xs">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase block">
              {courier.code === 'STEADFAST' ? 'Withdrawable Balance' : 'Pickup Store ID'}
            </span>
            {courier.code === 'STEADFAST' ? (
              <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                {courier.lastBalance != null ? `৳${courier.lastBalance.toLocaleString()}` : '—'}
              </span>
            ) : (
              <span className="tabular-nums font-bold text-indigo-700 dark:text-indigo-300">
                {courier.storeId || 'Not set'}
              </span>
            )}
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase block">Inside / Outside</span>
            <span className="tabular-nums font-bold text-navy-800 dark:text-white">
              ৳{courier.insideDhakaRate} / ৳{courier.outsideDhakaRate}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase block">COD Fee</span>
            <span className="tabular-nums font-bold text-orange-600 dark:text-orange-400">
              {courier.codChargePercent}%
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase block">API Health</span>
            <span
              className={`tabular-nums text-xs font-semibold ${
                courier.lastHealthStatus === 'OK'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : courier.lastHealthStatus === 'ERROR'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {courier.lastPing}
            </span>
          </div>
        </div>

        {/* Masked Credentials & Webhook Fields */}
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {courier.code === 'STEADFAST'
                  ? 'Encrypted Api-Key / Secret-Key:'
                  : courier.code === 'PATHAO'
                  ? 'Encrypted Client ID / Secret:'
                  : 'Encrypted API Token:'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                {courier.hasCredentials ? 'AES-256 Stored' : 'Not Configured'}
              </span>
            </div>
            <input
              type="text"
              value={courier.apiKey || 'Not configured — click Configure below'}
              readOnly
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-navy-800 dark:text-slate-100 tabular-nums text-xs focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Webhook Callback URL {courier.hasWebhookSecret ? '(HMAC Verified)' : ''}:
              </span>
              <button
                type="button"
                onClick={() => handleCopy(`wh-${courier.id}`, courier.webhookUrl)}
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedField === `wh-${courier.id}` ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={courier.webhookUrl}
              readOnly
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-300 tabular-nums text-xs focus:outline-none"
            />
          </div>

          {courier.lastError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed">
              <strong>Last Error:</strong> {courier.lastError}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span>Active Parcels:</span>
          <span className="font-bold text-navy-800 dark:text-white tabular-nums">
            {courier.activeConsignments}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isTesting}
            onClick={() => onTestConnection(courier)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-navy-800 dark:text-slate-100 border border-slate-300 dark:border-white/15 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
          >
            {isTesting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            )}
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <button
            type="button"
            onClick={() => onConfigure(courier)}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure</span>
          </button>
        </div>
      </div>
    </div>
  );
}
