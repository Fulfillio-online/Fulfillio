'use client';

import React, { useState } from 'react';
import { X, Check, Warehouse, User, ShieldCheck } from 'lucide-react';
import { useWms } from '../WmsContext';

interface StationSwitchModalProps {
  onClose: () => void;
}

const AVAILABLE_STATIONS = [
  { id: 'PACK-01', name: 'Pack Station 01 (Central Hub)', zone: 'Zone A (Apparel & Footwear)' },
  { id: 'PACK-02', name: 'Pack Station 02 (Bulk & Boxes)', zone: 'Zone B (Large Parcel & Fragile)' },
  { id: 'PICK-RUNNER-01', name: 'Pick Runner Cart #1', zone: 'Zone A (Racks 01 - 10)' },
  { id: 'DISPATCH-DOCK', name: 'Courier Handover Bay 01', zone: 'Outbound Loading Dock' },
];

const REGISTERED_OPERATORS = [
  { id: 'OP-04', name: 'Jasim Uddin' },
  { id: 'OP-07', name: 'Faruk Hossain' },
  { id: 'OP-12', name: 'Sharmin Akter' },
  { id: 'OP-19', name: 'Rashid Khan' },
];

export function StationSwitchModal({ onClose }: StationSwitchModalProps) {
  const { station, updateStation, switchOperator } = useWms();
  const [selectedStationId, setSelectedStationId] = useState(station.stationId);
  const [selectedOperatorId, setSelectedOperatorId] = useState(station.operatorId);
  const [badgeScanInput, setBadgeScanInput] = useState('');

  const handleSave = () => {
    const targetStation = AVAILABLE_STATIONS.find((s) => s.id === selectedStationId);
    const targetOp = REGISTERED_OPERATORS.find((o) => o.id === selectedOperatorId);

    if (targetStation) {
      updateStation(targetStation.name, targetStation.zone);
    }
    if (targetOp) {
      switchOperator(targetOp.name, targetOp.id);
    }
    onClose();
  };

  const handleBadgeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && badgeScanInput.trim()) {
      const scanned = badgeScanInput.trim().toUpperCase();
      const match = REGISTERED_OPERATORS.find(
        (o) => o.id.toUpperCase() === scanned || o.name.toLowerCase().includes(scanned.toLowerCase()),
      );
      if (match) {
        setSelectedOperatorId(match.id);
        setBadgeScanInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Warehouse className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Workstation &amp; Operator Switch</h3>
              <p className="text-[11px] text-slate-400">Select active packing station or scan employee badge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Badge Barcode Scanner Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Quick Badge Scan / PIN</span>
              <span className="text-[10px] text-emerald-400 font-mono">USB/HID Ready</span>
            </label>
            <input
              type="text"
              placeholder="Scan badge barcode or type OP ID (e.g. OP-07)..."
              value={badgeScanInput}
              onChange={(e) => setBadgeScanInput(e.target.value)}
              onKeyDown={handleBadgeScan}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Station Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Select Workstation:</label>
            <div className="grid grid-cols-1 gap-2">
              {AVAILABLE_STATIONS.map((st) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedStationId === st.id
                      ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span className="font-bold text-xs block">{st.name}</span>
                    <span className="text-[10px] text-slate-400">{st.zone}</span>
                  </div>
                  {selectedStationId === st.id && <Check className="h-4 w-4 text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Operator Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Logged-in Operator:</label>
            <div className="grid grid-cols-2 gap-2">
              {REGISTERED_OPERATORS.map((op) => (
                <div
                  key={op.id}
                  onClick={() => setSelectedOperatorId(op.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedOperatorId === op.id
                      ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <div>
                      <span className="font-bold text-xs block text-slate-200">{op.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400">{op.id}</span>
                    </div>
                  </div>
                  {selectedOperatorId === op.id && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}
