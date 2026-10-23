'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PackageCheck, Barcode, Printer, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { OrderStatus } from '@fulfillio/shared';

interface LineItem {
  id: string;
  sku: string;
  barcode: string;
  title: string;
  quantity: number;
  isVerified: boolean;
}

export default function PackingStationPage() {
  const [orderId, setOrderId] = useState('ORD-9824');
  const [memoCode, setMemoCode] = useState('MEMO-FESTIVE-01');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' }>({
    text: 'Scan an item barcode or enter it manually below.',
    type: 'info',
  });

  const [items, setItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      sku: 'HOODIE-BLK-XL',
      barcode: '8901234567890',
      title: 'Premium Heavyweight Hoodie (Black / XL)',
      quantity: 1,
      isVerified: false,
    },
    {
      id: 'item-2',
      sku: 'CAP-NVY-OS',
      barcode: '8901234567891',
      title: 'Embroidered Baseball Cap (Navy / OS)',
      quantity: 1,
      isVerified: false,
    },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus barcode input for rapid scanning
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allVerified = items.every((i) => i.isVerified);

  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const targetItemIndex = items.findIndex(
      (item) => (item.barcode === code || item.sku === code) && !item.isVerified,
    );

    if (targetItemIndex !== -1) {
      const updated = [...items];
      updated[targetItemIndex].isVerified = true;
      setItems(updated);
      setStatusMessage({
        text: `Verified: ${updated[targetItemIndex].title}`,
        type: 'success',
      });
    } else {
      setStatusMessage({
        text: `Error: Barcode "${code}" does not match any pending items!`,
        type: 'error',
      });
    }

    setBarcodeInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-6">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xl">
            F
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Packing Station #3</h1>
            <p className="text-sm text-slate-400">Operator: Warehouse Operator 01</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-xs uppercase text-slate-400 font-semibold block">Active Order</span>
            <span className="text-lg font-mono font-bold text-emerald-400">{orderId}</span>
          </div>

          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <span className="text-xs uppercase text-slate-400 font-semibold block">Memo Code</span>
            <span className="text-lg font-mono font-bold text-indigo-400">{memoCode}</span>
          </div>
        </div>
      </header>

      {/* Main Packing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Left 2 Cols: Order Verification Checklist */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 transition-colors ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            {statusMessage.type === 'success' && <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />}
            {statusMessage.type === 'info' && <Barcode className="h-6 w-6 text-slate-400 shrink-0" />}
            <span className="font-medium text-base">{statusMessage.text}</span>
          </div>

          {/* Scanner Input Bar */}
          <form onSubmit={handleScanSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan item barcode (USB Scanner or Keyboard)..."
                className="w-full pl-13 pr-4 py-4 bg-slate-800 border-2 border-slate-700 rounded-xl text-lg font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl text-base transition-colors shrink-0"
            >
              Verify Scan
            </button>
          </form>

          {/* Line Items List */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-800 p-4 flex-1 flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Items To Verify ({items.filter((i) => i.isVerified).length}/{items.length})
            </h2>

            {items.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  item.isVerified
                    ? 'bg-emerald-950/40 border-emerald-600/60 text-slate-200'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-bold ${
                      item.isVerified ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {item.isVerified ? '✓' : item.quantity}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{item.title}</h3>
                    <div className="flex gap-3 text-xs text-slate-400 font-mono mt-0.5">
                      <span>SKU: {item.sku}</span>
                      <span>•</span>
                      <span>Barcode: {item.barcode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.isVerified
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        : 'bg-amber-900/40 text-amber-300 border border-amber-700'
                    }`}
                  >
                    {item.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Invoice & Action Panel */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Printer className="h-5 w-5 text-indigo-400" />
              Automated Invoice & Label
            </h2>

            <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-800 text-sm space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Memo:</span>
                <span className="font-mono font-bold text-indigo-400">{memoCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Design Size:</span>
                <span className="font-semibold">POS Thermal (80mm)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Store Name:</span>
                <span className="font-semibold">Urban Threads BD</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 leading-relaxed">
              When all item barcodes are scanned, Fulfillio will compile the order payload with the merchant's custom memo design and trigger the station printer automatically.
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-700">
            <button
              disabled={!allVerified}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                allVerified
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50 cursor-pointer'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <PackageCheck className="h-6 w-6" />
              Complete Packing & Print Invoice
            </button>

            <button
              onClick={() => {
                setItems(items.map((i) => ({ ...i, isVerified: false })));
                setStatusMessage({ text: 'Packing reset. Ready to scan.', type: 'info' });
                inputRef.current?.focus();
              }}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset Order Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
