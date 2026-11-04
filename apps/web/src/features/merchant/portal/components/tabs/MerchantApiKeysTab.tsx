'use client';

import React, { useState } from 'react';
import { Key, Copy, Check, Globe, Send, ShieldCheck, Activity } from 'lucide-react';
import { MerchantWebhookLog } from '../../types';
import { INITIAL_WEBHOOK_LOGS } from '../../mockData';

interface MerchantApiKeysTabProps {
  onTriggerToast: (msg: string) => void;
  apiKey?: string;
  webhookUrl?: string;
  onSaveWebhook?: (url: string) => void;
}

export function MerchantApiKeysTab({
  onTriggerToast,
  apiKey = 'ful_live_948a9f82d1c34a98b29f01e847c210ab',
  webhookUrl: initialWebhookUrl = 'https://myshop.com/webhooks/fulfillio',
  onSaveWebhook,
}: MerchantApiKeysTabProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [webhookSecret] = useState('whsec_98af7c201a4e9871bc294a008e1');
  const [logs, setLogs] = useState<MerchantWebhookLog[]>(INITIAL_WEBHOOK_LOGS);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopyKey = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      onTriggerToast('API Key copied to clipboard!');
    }
  };

  const handleCopySecret = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(webhookSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      onTriggerToast('Webhook signing secret copied!');
    }
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      if (onSaveWebhook) onSaveWebhook(webhookUrl);
      onTriggerToast('Webhook endpoint saved successfully.');
    }, 600);
  };

  const handleTestPing = () => {
    const testLog: MerchantWebhookLog = {
      id: `wh-${Date.now()}`,
      event: 'ping.test_event',
      endpoint: webhookUrl || 'https://myshop.com/webhooks/fulfillio',
      status: 'SUCCESS',
      httpCode: 200,
      payloadSummary: 'Test ping handshake verified by Fulfillio dispatcher',
      timestamp: 'Just now',
    };
    setLogs((prev) => [testLog, ...prev]);
    onTriggerToast('Test webhook event dispatched! Returned HTTP 200 OK.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Key className="h-6 w-6 text-emerald-400 shrink-0" />
          <span>API Key & Webhook Dispatcher</span>
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Connect your WooCommerce, Shopify, or custom store to Fulfillio via REST API & real-time webhooks.
        </p>
      </div>

      {/* Production API Key */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-200">Production REST API Key</h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Active
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            value={apiKey}
            readOnly
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none"
          />
          <button
            onClick={handleCopyKey}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors text-slate-200"
          >
            {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
          </button>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-200">Outbound Webhook Listener</h3>
          </div>
          <button
            onClick={handleTestPing}
            className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Send className="h-3 w-3" />
            <span>Send Test Ping</span>
          </button>
        </div>

        <form onSubmit={handleSaveWebhook} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Your Webhook Receiver URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://myshop.com/api/fulfillio-webhook"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                {isSaving ? 'Saving...' : 'Save Endpoint'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Webhook HMAC Signing Secret (X-Fulfillio-Signature)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={webhookSecret}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-800/60 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopySecret}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors text-slate-300"
              >
                {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSecret ? 'Copied' : 'Copy Secret'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Webhook Delivery Logs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">Recent Webhook Event Deliveries</h3>
          </div>
          <span className="text-xs text-slate-500">Auto-retries on HTTP 5xx errors</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Payload Summary</th>
                <th className="p-3.5 text-center">HTTP Status</th>
                <th className="p-3.5 text-right">Delivered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-indigo-400">{l.event}</td>
                  <td className="p-3.5 text-slate-300 truncate max-w-sm">{l.payloadSummary}</td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold ${
                        l.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {l.httpCode} OK
                    </span>
                  </td>
                  <td className="p-3.5 text-right text-slate-400">{l.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
