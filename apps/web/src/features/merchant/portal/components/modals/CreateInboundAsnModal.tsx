'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Truck, PackagePlus } from 'lucide-react';
import { MerchantAsnItem, MerchantAsnRecord, MerchantProductItem } from '../../types';

interface CreateInboundAsnModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MerchantProductItem[];
  onCreateAsn: (asn: MerchantAsnRecord) => void;
  onTriggerToast: (msg: string) => void;
}

export function CreateInboundAsnModal({
  isOpen,
  onClose,
  products,
  onCreateAsn,
  onTriggerToast,
}: CreateInboundAsnModalProps) {
  const [carrierName, setCarrierName] = useState('SA Paribahan Parcel');
  const [trackingRef, setTrackingRef] = useState('');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<MerchantAsnItem[]>([
    {
      sku: products[0]?.sku || 'MC-101-HOODIE-BLK-XL',
      title: products[0]?.title || 'Product SKU',
      expectedQty: 50,
      receivedGoodQty: 0,
      receivedDamagedQty: 0,
      binCode: products[0]?.bin || 'A-01-01',
    },
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const fallbackProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        sku: fallbackProd?.sku || '',
        title: fallbackProd?.title || 'Selected Product',
        expectedQty: 20,
        receivedGoodQty: 0,
        receivedDamagedQty: 0,
        binCode: fallbackProd?.bin || 'A-01-01',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, selectedSku: string) => {
    const prod = products.find((p) => p.sku === selectedSku);
    if (!prod) return;
    setItems((prev) =>
      prev.map((it, i) =>
        i === index
          ? {
              ...it,
              sku: prod.sku,
              title: `${prod.title} (${prod.variantLabel})`,
              binCode: prod.bin,
            }
          : it
      )
    );
  };

  const handleQtyChange = (index: number, qty: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, expectedQty: Math.max(1, qty) } : it))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one SKU to the ASN shipment.');
      return;
    }

    const newAsn: MerchantAsnRecord = {
      id: `asn-${Date.now()}`,
      asnCode: `ASN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      carrierName,
      trackingRef: trackingRef || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      expectedArrivalDate: expectedDate,
      status: 'IN_TRANSIT',
      notes,
      items,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onCreateAsn(newAsn);
    onTriggerToast(`Inbound shipment ${newAsn.asnCode} created and marked IN_TRANSIT.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Create Inbound Stock ASN</h2>
              <p className="text-xs text-slate-400">
                Notify warehouse of incoming parcels and advance stock quantities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Carrier / Transport Method
              </label>
              <select
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="SA Paribahan Parcel">SA Paribahan Parcel</option>
                <option value="Sundarban Courier Service">Sundarban Courier Service</option>
                <option value="Korotoa Courier">Korotoa Courier</option>
                <option value="Merchant Direct Van">Merchant Direct Van</option>
                <option value="Factory Truck Delivery">Factory Truck Delivery</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Carrier Chalan / Tracking Ref
              </label>
              <input
                type="text"
                placeholder="e.g. SAP-992014"
                value={trackingRef}
                onChange={(e) => setTrackingRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Expected Arrival Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Shipment Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 2 boxes, fragile cartons"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Shipment SKU Contents
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Add SKU</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <label className="block text-[11px] text-slate-400 mb-0.5">Select Product</label>
                    <select
                      value={it.sku}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.sku}>
                          {p.sku} — {p.title} ({p.variantLabel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="block text-[11px] text-slate-400 mb-0.5">Qty Units</label>
                    <input
                      type="number"
                      min={1}
                      value={it.expectedQty}
                      onChange={(e) => handleQtyChange(idx, parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="w-24">
                    <label className="block text-[11px] text-slate-400 mb-0.5">Target Bin</label>
                    <input
                      type="text"
                      readOnly
                      value={it.binCode || 'A-01-01'}
                      className="w-full px-2 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 mt-4 sm:mt-0 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <PackagePlus className="h-4 w-4" />
              <span>Submit Inbound ASN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
