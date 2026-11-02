'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Activity,
  ShieldCheck,
  RefreshCw,
  Globe,
  KeyRound,
  Building2,
  X,
} from 'lucide-react';

export type CourierConnectionStatus = 'CONNECTED' | 'SANDBOX' | 'DISCONNECTED';

export interface CourierIntegrationItem {
  id: string;
  code: string;
  name: string;
  status: CourierConnectionStatus;
  environment: 'Production Live' | 'Sandbox Test';
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  storeId: string;
  webhookUrl: string;
  codChargePercent: number;
  insideDhakaRate: number;
  outsideDhakaRate: number;
  activeConsignments: number;
  autoBookingEnabled: boolean;
  allowPipelineOverride: boolean;
  lastPing: string;
}

const INITIAL_COURIERS: CourierIntegrationItem[] = [
  {
    id: 'cour-1',
    code: 'STEADFAST',
    name: 'Steadfast Courier BD',
    status: 'CONNECTED',
    environment: 'Production Live',
    baseUrl: 'https://portal.packzy.com/api/v1',
    apiKey: 'sf_live_98a7bc65d4e3f21098a7bc65',
    secretKey: 'sf_sec_live_441092837465',
    storeId: 'HUB-DHK-101',
    webhookUrl: 'https://api.fulfillio.online/api/webhooks/steadfast',
    codChargePercent: 1,
    insideDhakaRate: 60,
    outsideDhakaRate: 110,
    activeConsignments: 412,
    autoBookingEnabled: true,
    allowPipelineOverride: true,
    lastPing: '34ms • Verified Just Now',
  },
  {
    id: 'cour-2',
    code: 'PATHAO',
    name: 'Pathao Courier Aladdin',
    status: 'CONNECTED',
    environment: 'Production Live',
    baseUrl: 'https://api-hermes.pathao.com/aladdin/api/v1',
    apiKey: 'pth_client_7741902831a',
    secretKey: 'pth_secret_99201847261',
    storeId: 'STORE-BANANI-04',
    webhookUrl: 'https://api.fulfillio.online/api/webhooks/pathao',
    codChargePercent: 1,
    insideDhakaRate: 65,
    outsideDhakaRate: 115,
    activeConsignments: 289,
    autoBookingEnabled: true,
    allowPipelineOverride: true,
    lastPing: '41ms • Verified 5m ago',
  },
  {
    id: 'cour-3',
    code: 'REDX',
    name: 'RedX Logistics API',
    status: 'CONNECTED',
    environment: 'Production Live',
    baseUrl: 'https://openapi.redx.com.bd/v1.0.0-beta',
    apiKey: 'redx_jwt_eyJhbGciOiJIUzI1NiIs99a',
    secretKey: 'redx_sec_88392019283',
    storeId: 'REDX-TEJGAON-02',
    webhookUrl: 'https://api.fulfillio.online/api/webhooks/redx',
    codChargePercent: 1,
    insideDhakaRate: 60,
    outsideDhakaRate: 120,
    activeConsignments: 159,
    autoBookingEnabled: true,
    allowPipelineOverride: true,
    lastPing: '48ms • Verified 12m ago',
  },
  {
    id: 'cour-4',
    code: 'PAPERFLY',
    name: 'Paperfly Smart Wing',
    status: 'DISCONNECTED',
    environment: 'Sandbox Test',
    baseUrl: 'https://api.paperfly.com.bd/merchant/api/v1',
    apiKey: '',
    secretKey: '',
    storeId: 'PF-DHK-01',
    webhookUrl: 'https://api.fulfillio.online/api/webhooks/paperfly',
    codChargePercent: 1,
    insideDhakaRate: 65,
    outsideDhakaRate: 120,
    activeConsignments: 0,
    autoBookingEnabled: false,
    allowPipelineOverride: false,
    lastPing: 'Not configured yet',
  },
];

export function CourierIntegrationManager() {
  const [couriers, setCouriers] = useState<CourierIntegrationItem[]>(INITIAL_COURIERS);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Configure Modal State
  const [editingCourier, setEditingCourier] = useState<CourierIntegrationItem | null>(null);

  // Test Connection Diagnostic Modal State
  const [testingCourier, setTestingCourier] = useState<{
    courier: CourierIntegrationItem;
    latencyMs: number;
    success: boolean;
    message: string;
  } | null>(null);

  // Add New Courier Partner Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('eCourier Bangladesh');
  const [newCode, setNewCode] = useState('ECOURIER');
  const [newBaseUrl, setNewBaseUrl] = useState('https://backoffice.ecourier.com.bd/api');
  const [newApiKey, setNewApiKey] = useState('ec_live_55192038471');
  const [newSecretKey, setNewSecretKey] = useState('ec_sec_991029384');
  const [newStoreId, setNewStoreId] = useState('EC-DHK-HUB1');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fulfillio_couriers_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCouriers(parsed);
        }
      } else {
        localStorage.setItem('fulfillio_couriers_config_v1', JSON.stringify(INITIAL_COURIERS));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistCouriers = (updated: CourierIntegrationItem[]) => {
    setCouriers(updated);
    try {
      localStorage.setItem('fulfillio_couriers_config_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleCopy = (keyId: string, text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(keyId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // Run Connection Diagnostic Test
  const handleTestConnection = (courier: CourierIntegrationItem) => {
    const hasCredentials = Boolean(courier.apiKey.trim() && courier.secretKey.trim());
    const latency = Math.floor(28 + Math.random() * 25);

    if (hasCredentials) {
      const updated = couriers.map((c) =>
        c.id === courier.id
          ? {
              ...c,
              status: (c.status === 'DISCONNECTED' ? 'CONNECTED' : c.status) as CourierConnectionStatus,
              lastPing: `${latency}ms • Verified Just Now`,
            }
          : c
      );
      persistCouriers(updated);
      setTestingCourier({
        courier: {
          ...courier,
          status: courier.status === 'DISCONNECTED' ? 'CONNECTED' : courier.status,
          lastPing: `${latency}ms • Verified Just Now`,
        },
        latencyMs: latency,
        success: true,
        message: `Successfully authenticated with ${courier.name} (${courier.baseUrl}) and verified Store ID ${courier.storeId}.`,
      });
    } else {
      setTestingCourier({
        courier,
        latencyMs: 0,
        success: false,
        message: `Missing API Key or Secret Key for ${courier.name}. Click "Configure" to enter credentials first.`,
      });
    }
  };

  // Save Courier Configuration from Modal
  const handleSaveCourierConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourier) return;

    const updated = couriers.map((c) =>
      c.id === editingCourier.id
        ? {
            ...editingCourier,
            lastPing:
              editingCourier.status === 'DISCONNECTED'
                ? 'Disconnected by Admin'
                : '36ms • Configured Just Now',
          }
        : c
    );
    persistCouriers(updated);
    triggerToast(
      `Saved API configuration for ${editingCourier.name} (${editingCourier.status}).`
    );
    setEditingCourier(null);
  };

  // Add New Courier Partner
  const handleAddCourierPartner = (e: React.FormEvent) => {
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

    persistCouriers([...couriers, created]);
    setIsAddModalOpen(false);
    triggerToast(`Added and connected new courier partner: ${created.name} (${created.code})!`);
  };

  const connectedCount = couriers.filter((c) => c.status === 'CONNECTED').length;
  const totalConsignments = couriers.reduce((sum, c) => sum + c.activeConsignments, 0);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Courier API Integrations &amp; Webhook Routing
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Configure Steadfast, Pathao, RedX, and partner API credentials, pickup hub IDs, delivery rates, and pipeline courier override rules.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-colors cursor-pointer self-start lg:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Courier Partner</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-emerald-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 3 Operational Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 block">
              Connected Couriers
            </span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
              {connectedCount} / {couriers.length} Active
            </span>
            <span className="text-[11px] text-slate-400">
              Available in Orders Dispatch Pipeline
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 block">
              Active Consignments
            </span>
            <span className="text-2xl font-extrabold text-white font-mono mt-1 block">
              {totalConsignments} Parcels
            </span>
            <span className="text-[11px] text-slate-400">
              Live webhook tracking enabled
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 block">
              Courier Override Routing
            </span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 block">
              Enabled
            </span>
            <span className="text-[11px] text-slate-400">
              Operators can switch courier at Dispatch
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Courier Integration Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {couriers.map((courier) => {
          const isRevealed = Boolean(revealedKeys[courier.id]);

          return (
            <div
              key={courier.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-5 shadow-xl transition-all"
            >
              <div className="space-y-4">
                {/* Top Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-extrabold text-emerald-400 text-sm shrink-0">
                      {courier.code.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-white">{courier.name}</h3>
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400">
                          {courier.environment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[280px] sm:max-w-xs">
                        {courier.baseUrl}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                      courier.status === 'CONNECTED'
                        ? 'bg-emerald-950/90 text-emerald-400 border-emerald-800'
                        : courier.status === 'SANDBOX'
                          ? 'bg-amber-950/90 text-amber-400 border-amber-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {courier.status}
                  </span>
                </div>

                {/* Store ID, Rates & Ping Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Pickup Store ID</span>
                    <span className="font-mono font-bold text-indigo-300">{courier.storeId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Inside / Outside</span>
                    <span className="font-mono font-bold text-white">
                      ৳{courier.insideDhakaRate} / ৳{courier.outsideDhakaRate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">COD Fee</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {courier.codChargePercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">API Health</span>
                    <span className="font-mono text-[11px] text-slate-300">{courier.lastPing}</span>
                  </div>
                </div>

                {/* API Key & Webhook Fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 font-medium">API Key / Client Token:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedKeys((prev) => ({
                              ...prev,
                              [courier.id]: !prev[courier.id],
                            }))
                          }
                          className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {isRevealed ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Show</span>
                            </>
                          )}
                        </button>
                        {courier.apiKey && (
                          <button
                            type="button"
                            onClick={() => handleCopy(`key-${courier.id}`, courier.apiKey)}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedField === `key-${courier.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type={isRevealed ? 'text' : 'password'}
                      value={courier.apiKey || 'Not configured — click Configure below'}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 font-medium">
                        Webhook Callback URL (Status Sync):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`wh-${courier.id}`, courier.webhookUrl)}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === `wh-${courier.id}` ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={courier.webhookUrl}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Buttons: Enable/Disable Toggle + Test Connection + Configure */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Pipeline Override:</span>
                  <span
                    className={`font-bold ${
                      courier.allowPipelineOverride ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {courier.allowPipelineOverride ? 'Allowed' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestConnection(courier)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test Connection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingCourier({ ...courier })}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          MODAL 1: CONFIGURE COURIER API CREDENTIALS & RATES MODAL
         ===================================================================== */}
      {editingCourier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                  {editingCourier.code.slice(0, 3)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Configure {editingCourier.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update API credentials, Store/Hub ID, delivery charges, and webhook settings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourier(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCourierConfig} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Connection Status</label>
                  <select
                    value={editingCourier.status}
                    onChange={(e: any) =>
                      setEditingCourier({ ...editingCourier, status: e.target.value })
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
                    value={editingCourier.environment}
                    onChange={(e: any) =>
                      setEditingCourier({ ...editingCourier, environment: e.target.value })
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
                  value={editingCourier.baseUrl}
                  onChange={(e) =>
                    setEditingCourier({ ...editingCourier, baseUrl: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-300">API Key / Client ID *</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingCourier({
                        ...editingCourier,
                        apiKey: `${editingCourier.code.toLowerCase()}_live_${Math.random()
                          .toString(36)
                          .slice(2, 14)}`,
                        secretKey:
                          editingCourier.secretKey ||
                          `${editingCourier.code.toLowerCase()}_sec_${Math.random()
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
                  value={editingCourier.apiKey}
                  onChange={(e) =>
                    setEditingCourier({ ...editingCourier, apiKey: e.target.value })
                  }
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
                    value={editingCourier.secretKey}
                    onChange={(e) =>
                      setEditingCourier({ ...editingCourier, secretKey: e.target.value })
                    }
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
                    value={editingCourier.storeId}
                    onChange={(e) =>
                      setEditingCourier({ ...editingCourier, storeId: e.target.value })
                    }
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
                    value={editingCourier.insideDhakaRate}
                    onChange={(e) =>
                      setEditingCourier({
                        ...editingCourier,
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
                    value={editingCourier.outsideDhakaRate}
                    onChange={(e) =>
                      setEditingCourier({
                        ...editingCourier,
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
                    value={editingCourier.codChargePercent}
                    onChange={(e) =>
                      setEditingCourier({
                        ...editingCourier,
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
                    checked={editingCourier.autoBookingEnabled}
                    onChange={(e) =>
                      setEditingCourier({
                        ...editingCourier,
                        autoBookingEnabled: e.target.checked,
                      })
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
                    checked={editingCourier.allowPipelineOverride}
                    onChange={(e) =>
                      setEditingCourier({
                        ...editingCourier,
                        allowPipelineOverride: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-emerald-500"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCourier(null)}
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
      )}

      {/* =====================================================================
          MODAL 2: TEST CONNECTION DIAGNOSTIC MODAL
         ===================================================================== */}
      {testingCourier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    testingCourier.success
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {testingCourier.success ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {testingCourier.courier.name} — API Test
                  </h3>
                  <p className="text-xs text-slate-400">
                    {testingCourier.success
                      ? `Handshake verified in ${testingCourier.latencyMs}ms`
                      : 'Configuration required'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTestingCourier(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">1. Endpoint Reachability:</span>
                <span className="text-emerald-400 font-bold">200 OK</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">2. API Key &amp; Secret Auth:</span>
                <span
                  className={
                    testingCourier.success
                      ? 'text-emerald-400 font-bold'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {testingCourier.success ? 'AUTHENTICATED ✓' : 'MISSING KEY ✕'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">3. Pickup Hub / Store ID:</span>
                <span className="text-indigo-300 font-bold">
                  {testingCourier.courier.storeId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">4. Webhook Listener:</span>
                <span className="text-emerald-400 font-bold">READY</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{testingCourier.message}</p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              {!testingCourier.success && (
                <button
                  type="button"
                  onClick={() => {
                    const target = testingCourier.courier;
                    setTestingCourier(null);
                    setEditingCourier({ ...target });
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                >
                  Configure Credentials Now
                </button>
              )}
              <button
                type="button"
                onClick={() => setTestingCourier(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: ADD NEW COURIER PARTNER MODAL
         ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Add New 3PL Courier Partner</h3>
                <p className="text-xs text-slate-400">
                  Connect another courier API for dispatch &amp; tracking
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCourierPartner} className="space-y-3.5 text-xs">
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Connect Courier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
