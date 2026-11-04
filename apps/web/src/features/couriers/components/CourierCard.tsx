'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  Activity,
  Settings,
} from 'lucide-react';
import { CourierIntegrationItem } from '../types';

interface CourierCardProps {
  courier: CourierIntegrationItem;
  onTestConnection: (courier: CourierIntegrationItem) => void;
  onConfigure: (courier: CourierIntegrationItem) => void;
}

export function CourierCard({
  courier,
  onTestConnection,
  onConfigure,
}: CourierCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
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
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-5 shadow-xl transition-all">
      <div className="space-y-4">
        {/* Top Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-extrabold text-emerald-400 text-sm shrink-0">
              {courier.code.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-white">{courier.name}</h3>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400">
                  {courier.environment}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[280px] sm:max-w-xs">
                {courier.baseUrl}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
              courier.status === 'CONNECTED'
                ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800'
                : courier.status === 'SANDBOX'
                ? 'bg-amber-950/90 text-amber-400 border-amber-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {courier.status}
          </span>
        </div>

        {/* Store ID, Rates & Ping Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Pickup Store ID</span>
            <span className="font-mono font-bold text-indigo-300">{courier.storeId}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Inside / Outside</span>
            <span className="font-mono font-bold text-white">
              ৳{courier.insideDhakaRate} / ৳{courier.outsideDhakaRate}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">COD Fee</span>
            <span className="font-mono font-bold text-emerald-400">
              {courier.codChargePercent}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">API Health</span>
            <span className="font-mono text-[11px] text-slate-300">{courier.lastPing}</span>
          </div>
        </div>

        {/* API Key & Webhook Fields */}
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-medium">API Key / Client Token:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRevealed(!isRevealed)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {isRevealed ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>
                {courier.apiKey && (
                  <button
                    type="button"
                    onClick={() => handleCopy(`key-${courier.id}`, courier.apiKey)}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === `key-${courier.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            <input
              type={isRevealed ? 'text' : 'password'}
              value={courier.apiKey || 'Not configured — click Configure below'}
              readOnly
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 font-medium">Webhook Callback URL:</span>
              <button
                type="button"
                onClick={() => handleCopy(`wh-${courier.id}`, courier.webhookUrl)}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
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
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-mono text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Pipeline Override:</span>
          <span
            className={`font-bold ${
              courier.allowPipelineOverride ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {courier.allowPipelineOverride ? 'Allowed' : 'Disabled'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onTestConnection(courier)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Connection</span>
          </button>

          <button
            type="button"
            onClick={() => onConfigure(courier)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure</span>
          </button>
        </div>
      </div>
    </div>
  );
}
