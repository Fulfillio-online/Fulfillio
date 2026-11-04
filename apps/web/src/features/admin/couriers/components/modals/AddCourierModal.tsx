'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CourierIntegrationItem } from '../../types';

interface AddCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourier: (newCourier: CourierIntegrationItem) => void;
}

export function AddCourierModal({
  isOpen,
  onClose,
  onAddCourier,
}: AddCourierModalProps) {
  const [newName, setNewName] = useState('eCourier Bangladesh');
  const [newCode, setNewCode] = useState('ECOURIER');
  const [newBaseUrl, setNewBaseUrl] = useState('https://backoffice.ecourier.com.bd/api');
  const [newApiKey, setNewApiKey] = useState('ec_live_55192038471');
  const [newSecretKey, setNewSecretKey] = useState('ec_sec_991029384');
  const [newStoreId, setNewStoreId] = useState('EC-DHK-HUB1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'COURIER';
    const created: CourierIntegrationItem = {
      id: `cour-${Date.now()}`,
      code: cleanCode,
      name: newName.trim() || `${cleanCode} Courier`,
      status: newApiKey.trim() ? 'CONNECTED' : 'SANDBOX',
      environment: 'Production Live',
      baseUrl: newBaseUrl.trim() || `https://api.${cleanCode.toLowerCase()}.com.bd/v1`,
      apiKey: newApiKey.trim(),
      secretKey: newSecretKey.trim(),
      storeId: newStoreId.trim() || `${cleanCode}-DHK-01`,
      webhookUrl: `https://api.fulfillio.online/api/webhooks/${cleanCode.toLowerCase()}`,
      codChargePercent: 1,
      insideDhakaRate: 60,
      outsideDhakaRate: 115,
      activeConsignments: 0,
      autoBookingEnabled: true,
      allowPipelineOverride: true,
      lastPing: '39ms • Connected Just Now',
    };

    onAddCourier(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Add New 3PL Courier Partner</h3>
            <p className="text-xs text-slate-400">
              Connect another courier API for dispatch &amp; tracking
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Courier Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Short Code *</label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">API Base URL *</label>
            <input
              type="text"
              required
              value={newBaseUrl}
              onChange={(e) => setNewBaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">API Key *</label>
            <input
              type="text"
              required
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Secret Key *</label>
              <input
                type="text"
                required
                value={newSecretKey}
                onChange={(e) => setNewSecretKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Pickup Store ID *</label>
              <input
                type="text"
                required
                value={newStoreId}
                onChange={(e) => setNewStoreId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
            >
              Connect Courier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
