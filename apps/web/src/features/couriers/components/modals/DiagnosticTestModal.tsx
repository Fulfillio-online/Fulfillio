'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { CourierDiagnosticTestResult, CourierIntegrationItem } from '../../types';

interface DiagnosticTestModalProps {
  testResult: CourierDiagnosticTestResult | null;
  onClose: () => void;
  onConfigureNow: (courier: CourierIntegrationItem) => void;
}

export function DiagnosticTestModal({
  testResult,
  onClose,
  onConfigureNow,
}: DiagnosticTestModalProps) {
  if (!testResult) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                testResult.success
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {testResult.courier.name} — API Test
              </h3>
              <p className="text-xs text-slate-400">
                {testResult.success
                  ? `Handshake verified in ${testResult.latencyMs}ms`
                  : 'Configuration required'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">1. Endpoint Reachability:</span>
            <span className="text-emerald-400 font-bold">200 OK</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">2. API Key &amp; Secret Auth:</span>
            <span
              className={
                testResult.success
                  ? 'text-emerald-400 font-bold'
                  : 'text-rose-400 font-bold'
              }
            >
              {testResult.success ? 'AUTHENTICATED ✓' : 'MISSING KEY ✕'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">3. Pickup Hub / Store ID:</span>
            <span className="text-indigo-300 font-bold">
              {testResult.courier.storeId}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">4. Webhook Listener:</span>
            <span className="text-emerald-400 font-bold">READY</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{testResult.message}</p>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          {!testResult.success && (
            <button
              type="button"
              onClick={() => onConfigureNow(testResult.courier)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
            >
              Configure Credentials Now
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
