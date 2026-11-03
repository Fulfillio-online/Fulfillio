'use client';

import React from 'react';
import { Key, Copy } from 'lucide-react';

interface MerchantApiKeysTabProps {
  onTriggerToast: (msg: string) => void;
}

export function MerchantApiKeysTab({ onTriggerToast }: MerchantApiKeysTabProps) {
  const apiKey = 'ful_live_948a9f82d1c34a98b29f01e847c210ab';

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(apiKey);
      onTriggerToast('API Key copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Key className="h-6 w-6 text-emerald-400 shrink-0" />
          <span>API Key & Webhook Integration</span>
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Connect your WooCommerce, Shopify, or custom store to Fulfillio using REST APIs.
        </p>
      </div>

      <div className="p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-slate-200">Active Production API Key</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            value={apiKey}
            readOnly
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition-colors text-slate-200"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Key</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <h4 className="font-semibold text-sm mb-2 text-slate-300">Sample WooCommerce / REST API Payload:</h4>
          <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`POST /api/orders
Headers:
  X-Fulfillio-Api-Key: ful_live_948a9f82d1c34a98b29f...

Payload:
{
  "externalOrderId": "WC-10492",
  "customerName": "Tariqul Islam",
  "customerPhone": "01812345678",
  "customerAddress": "House 12, Road 4, Dhanmondi, Dhaka",
  "memoCode": "MEMO-FESTIVE-01",  // <-- Uses your custom memo design!
  "totalAmount": 3450,
  "codAmount": 3450,
  "items": [
    { "variantId": "var-hoodie-xl", "quantity": 1, "unitPrice": 3450 }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
