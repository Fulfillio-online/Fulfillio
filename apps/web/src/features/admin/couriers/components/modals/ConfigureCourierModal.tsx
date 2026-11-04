'use client';

import React from 'react';
import { X } from 'lucide-react';
import { CourierIntegrationItem } from '../../types';

interface ConfigureCourierModalProps {
  courier: CourierIntegrationItem | null;
  onClose: () => void;
  onSave: (updatedCourier: CourierIntegrationItem) => void;
}

export function ConfigureCourierModal({
  courier,
  onClose,
  onSave,
}: ConfigureCourierModalProps) {
  const [formData, setFormData] = React.useState<CourierIntegrationItem | null>(courier);

  React.useEffect(() => {
    setFormData(courier);
  }, [courier]);

  if (!formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
              {formData.code.slice(0, 3)}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configure {formData.name}</h3>
              <p className="text-xs text-slate-400">
                Update API credentials, Store/Hub ID, delivery charges, and webhook settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Connection Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
              >
                <option value="CONNECTED">CONNECTED (Active)</option>
                <option value="SANDBOX">SANDBOX (Testing)</option>
                <option value="DISCONNECTED">DISCONNECTED (Disabled)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">API Environment</label>
              <select
                value={formData.environment}
                onChange={(e) =>
                  setFormData({ ...formData, environment: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="Production Live">Production Live</option>
                <option value="Sandbox Test">Sandbox Test</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">API Base Endpoint URL *</label>
            <input
              type="text"
              required
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-300">API Key / Client ID *</label>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    apiKey: `${formData.code.toLowerCase()}_live_${Math.random()
                      .toString(36)
                      .slice(2, 14)}`,
                    secretKey:
                      formData.secretKey ||
                      `${formData.code.toLowerCase()}_sec_${Math.random()
                        .toString(36)
                        .slice(2, 14)}`,
                    status: 'CONNECTED',
                  })
                }
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                + Generate Demo Live Key
              </button>
            </div>
            <input
              type="text"
              required
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="Enter Courier API Key / Client Token"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                API Secret / Client Secret *
              </label>
              <input
                type="text"
                required
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                placeholder="Enter Secret Key"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Default Pickup Store / Hub ID *
              </label>
              <input
                type="text"
                required
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Inside Dhaka (৳)</label>
              <input
                type="number"
                min={0}
                value={formData.insideDhakaRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    insideDhakaRate: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Outside Dhaka (৳)</label>
              <input
                type="number"
                min={0}
                value={formData.outsideDhakaRate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    outsideDhakaRate: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">COD Fee (%)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={formData.codChargePercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    codChargePercent: Number(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
              />
            </div>
          </div>

          {/* Operational Checkboxes */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-slate-200 font-medium">
                Auto-generate tracking ID on Courier Booking
              </span>
              <input
                type="checkbox"
                checked={formData.autoBookingEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, autoBookingEnabled: e.target.checked })
                }
                className="h-4 w-4 accent-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-slate-200 font-medium">
                Allow switching/overriding to this courier in Orders Pipeline
              </span>
              <input
                type="checkbox"
                checked={formData.allowPipelineOverride}
                onChange={(e) =>
                  setFormData({ ...formData, allowPipelineOverride: e.target.checked })
                }
                className="h-4 w-4 accent-emerald-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              Save &amp; Apply Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
