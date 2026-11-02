'use client';

import React, { useState } from 'react';
import { Layers, X } from 'lucide-react';
import { Modal } from '@/components/ui';
import { WarehouseBin } from '../../types';

interface CreateBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  bins: WarehouseBin[];
  onCreateBin: (newBin: WarehouseBin) => void;
}

export function CreateBinModal({
  isOpen,
  onClose,
  bins,
  onCreateBin,
}: CreateBinModalProps) {
  const [newBinCode, setNewBinCode] = useState('');
  const [newBinZone, setNewBinZone] = useState('Zone E');
  const [newBinDesc, setNewBinDesc] = useState('');
  const [newBinCapacity, setNewBinCapacity] = useState('250');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = newBinCode.trim().toUpperCase();
    if (!formattedCode) return;

    if (!bins.some((b) => b.code === formattedCode)) {
      const created: WarehouseBin = {
        code: formattedCode,
        zone: newBinZone.trim() || `Zone ${formattedCode.charAt(0)}`,
        description:
          newBinDesc.trim() ||
          `${newBinZone.trim() || 'Zone'} · Bin ${formattedCode} (General Storage)`,
        capacityUnits: Math.max(50, parseInt(newBinCapacity, 10) || 250),
        createdAt: 'Just now',
      };
      onCreateBin(created);
    }

    setNewBinCode('');
    setNewBinDesc('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Physical Warehouse Bin"
      subtitle="Define a physical shelf location and maximum unit capacity"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Bin Code (Format: Zone-Rack-Shelf) *
          </label>
          <input
            type="text"
            required
            value={newBinCode}
            onChange={(e) => setNewBinCode(e.target.value)}
            placeholder="e.g. E-01-01 or A-03-02"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Warehouse Zone
            </label>
            <input
              type="text"
              value={newBinZone}
              onChange={(e) => setNewBinZone(e.target.value)}
              placeholder="Zone E"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Unit Capacity
            </label>
            <input
              type="number"
              value={newBinCapacity}
              onChange={(e) => setNewBinCapacity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Zone / Shelf Description
          </label>
          <input
            type="text"
            value={newBinDesc}
            onChange={(e) => setNewBinDesc(e.target.value)}
            placeholder="Zone E · Rack 01 · Shelf 01 (Seasonal Fast-Movers)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
          >
            Create &amp; Save Bin
          </button>
        </div>
      </form>
    </Modal>
  );
}
