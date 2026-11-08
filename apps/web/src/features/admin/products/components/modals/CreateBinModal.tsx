'use client';

import React, { useState } from 'react';
import { Layers, X } from 'lucide-react';
import { Modal } from '@/components/admin/AdminModal';
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
            Bin Code (Format: Zone-Rack-Shelf) *
          </label>
          <input
            type="text"
            required
            value={newBinCode}
            onChange={(e) => setNewBinCode(e.target.value)}
            placeholder="e.g. E-01-01 or A-03-02"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm tabular-nums text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
              Warehouse Zone
            </label>
            <input
              type="text"
              value={newBinZone}
              onChange={(e) => setNewBinZone(e.target.value)}
              placeholder="Zone E"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
              Unit Capacity
            </label>
            <input
              type="number"
              value={newBinCapacity}
              onChange={(e) => setNewBinCapacity(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm tabular-nums text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1.5">
            Zone / Shelf Description
          </label>
          <input
            type="text"
            value={newBinDesc}
            onChange={(e) => setNewBinDesc(e.target.value)}
            placeholder="Zone E · Rack 01 · Shelf 01 (Seasonal Fast-Movers)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-sm text-navy-800 dark:text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-xs font-bold text-white shadow-lg shadow-orange-500/25 cursor-pointer"
          >
            Create &amp; Save Bin
          </button>
        </div>
      </form>
    </Modal>
  );
}
