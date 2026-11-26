'use client';

import React from 'react';
import { X, KeyRound, Copy, Check } from 'lucide-react';
import { CourierIntegrationItem } from '../../types';

interface ConfigureCourierModalProps {
  courier: CourierIntegrationItem | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (updatedCourier: CourierIntegrationItem) => void;
}

export function ConfigureCourierModal({
  courier,
  isSaving = false,
  onClose,
  onSave,
}: ConfigureCourierModalProps) {
  const [formData, setFormData] = React.useState<CourierIntegrationItem | null>(courier);
  const [copiedToken, setCopiedToken] = React.useState(false);

  React.useEffect(() => {
    if (courier) {
      setFormData({
        ...courier,
        // Clear masked placeholders so admin only types when replacing secrets
        apiKey: courier.apiKey?.includes('••') ? '' : courier.apiKey || '',
        secretKey: courier.secretKey?.includes('••') ? '' : courier.secretKey || '',
        webhookSecret: courier.webhookSecret?.includes('••') ? '' : courier.webhookSecret || '',
      });
    } else {
      setFormData(null);
    }
  }, [courier]);

  if (!formData) return null;

  const isSteadfast = formData.code === 'STEADFAST';
  const isPathao = formData.code === 'PATHAO';
  const isRedx = formData.code === 'REDX';

  const generateWebhookToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let token = 'flf_wh_';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, webhookSecret: token });
  };

  const copyWebhookToken = () => {
    if (!formData.webhookSecret) return;
    navigator.clipboard?.writeText(formData.webhookSecret).catch(() => {});
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 tabular-nums font-bold text-xs">
              {formData.code.slice(0, 3)}
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-800 dark:text-white">
                Configure {formData.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Credentials are encrypted (AES-256-GCM) in PostgreSQL. Leave key fields blank to keep existing saved keys.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-white hover:bg-navy-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Connection Mode
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const status = e.target.value as any;
                  setFormData({
                    ...formData,
                    status,
                    environment: status === 'SANDBOX' ? 'Sandbox Test' : 'Production Live',
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white font-semibold"
              >
                <option value="CONNECTED">CONNECTED (Strict Live API)</option>
                <option value="SANDBOX">SANDBOX (Local Simulation)</option>
                <option value="DISCONNECTED">DISCONNECTED (Disabled)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                API Base URL *
              </label>
              <input
                type="text"
                required
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white tabular-nums"
              />
            </div>
          </div>

          {/* Provider-specific credential fields */}
          {isSteadfast && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Steadfast Api-Key {courier?.hasCredentials ? '(saved — enter to replace)' : '*'}
                </label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder={courier?.apiKey || 'Paste Api-Key from steadfast.com.bd'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-orange-700 dark:text-orange-300 tabular-nums"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Steadfast Secret-Key {courier?.hasCredentials ? '(saved — enter to replace)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.secretKey}
                  onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  placeholder={courier?.secretKey || 'Paste Secret-Key'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white tabular-nums"
                />
              </div>
            </div>
          )}

          {isPathao && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Pathao Client ID
                  </label>
                  <input
                    type="text"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder={courier?.apiKey || 'Enter Pathao Client ID'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Pathao Client Secret
                  </label>
                  <input
                    type="password"
                    value={formData.secretKey}
                    onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                    placeholder={courier?.secretKey || 'Enter Client Secret'}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white tabular-nums"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Pathao Merchant Email / Username
                  </label>
                  <input
                    type="text"
                    value={formData.credentials?.username || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credentials: { ...(formData.credentials || {}), username: e.target.value },
                      })
                    }
                    placeholder="merchant@domain.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Pathao Password
                  </label>
                  <input
                    type="password"
                    value={formData.credentials?.password || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credentials: { ...(formData.credentials || {}), password: e.target.value },
                      })
                    }
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {isRedx && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                RedX API Access Token (Bearer)
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={courier?.apiKey || 'Paste RedX API-ACCESS-TOKEN'}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white tabular-nums"
              />
            </div>
          )}

          {/* Webhook Auth Token (for X-Signature HMAC-SHA256 & Bearer verification) */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-orange-500" />
                <span>Webhook Auth Token (for X-Signature HMAC-SHA256)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateWebhookToken}
                  className="text-orange-600 dark:text-orange-400 hover:underline font-semibold cursor-pointer"
                >
                  Generate
                </button>
                {formData.webhookSecret && (
                  <button
                    type="button"
                    onClick={copyWebhookToken}
                    className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              value={formData.webhookSecret || ''}
              onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
              placeholder={
                courier?.hasWebhookSecret
                  ? `${courier.webhookSecret} (leave blank to keep)`
                  : 'Optional — paste same token in Steadfast Webhook settings'
              }
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white tabular-nums"
            />
          </div>

          {!isSteadfast && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Default Pickup Store / Hub ID
              </label>
              <input
                type="text"
                value={formData.storeId}
                onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                placeholder="Optional store/hub ID"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-indigo-700 dark:text-indigo-300 tabular-nums"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Inside Dhaka (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.insideDhakaRate}
                onChange={(e) =>
                  setFormData({ ...formData, insideDhakaRate: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Outside Dhaka (৳)
              </label>
              <input
                type="number"
                min={0}
                value={formData.outsideDhakaRate}
                onChange={(e) =>
                  setFormData({ ...formData, outsideDhakaRate: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white tabular-nums"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                COD Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={formData.codChargePercent}
                onChange={(e) =>
                  setFormData({ ...formData, codChargePercent: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-navy-800 dark:text-white tabular-nums"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 space-y-2.5">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-navy-800 dark:text-slate-100 font-medium">
                Auto-generate tracking ID on Courier Booking
              </span>
              <input
                type="checkbox"
                checked={formData.autoBookingEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, autoBookingEnabled: e.target.checked })
                }
                className="h-4 w-4 accent-orange-500"
              />
            </label>

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-navy-800 dark:text-slate-100 font-medium">
                Allow switching/overriding to this courier in Orders Pipeline
              </span>
              <input
                type="checkbox"
                checked={formData.allowPipelineOverride}
                onChange={(e) =>
                  setFormData({ ...formData, allowPipelineOverride: e.target.checked })
                }
                className="h-4 w-4 accent-orange-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-xs font-bold text-white shadow-lg cursor-pointer"
            >
              {isSaving ? 'Encrypting & Saving...' : 'Save & Encrypt Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
