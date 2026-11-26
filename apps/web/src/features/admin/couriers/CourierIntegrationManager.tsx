'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Truck, CheckCircle2, Sliders, Activity, RefreshCw, AlertTriangle } from 'lucide-react';
import type { CourierIntegrationSummaryDto } from '@fulfillio/contracts';
import { shippingApi } from '@/lib/api/shippingApi';
import {
  CourierConnectionStatus,
  CourierDiagnosticTestResult,
  CourierIntegrationItem,
} from './types';
import { CourierStatsCards } from './components/CourierStatsCards';
import { CourierCard } from './components/CourierCard';
import { ConfigureCourierModal } from './components/modals/ConfigureCourierModal';
import { DiagnosticTestModal } from './components/modals/DiagnosticTestModal';
import { CourierSimulatorConsole } from './components/CourierSimulatorConsole';

function mapDtoToItem(dto: CourierIntegrationSummaryDto): CourierIntegrationItem {
  const creds = dto.credentialsMasked || {};
  const primaryKey =
    dto.provider === 'STEADFAST'
      ? creds.apiKey || ''
      : dto.provider === 'PATHAO'
      ? creds.clientId || ''
      : dto.provider === 'REDX'
      ? creds.apiToken || ''
      : creds.apiKey || '';

  const secondarySecret =
    dto.provider === 'STEADFAST'
      ? creds.secretKey || ''
      : dto.provider === 'PATHAO'
      ? creds.clientSecret || ''
      : '';

  let lastPing = 'Not tested yet';
  if (dto.lastHealthStatus === 'OK' && dto.lastLatencyMs != null) {
    lastPing = `${dto.lastLatencyMs}ms • Verified`;
  } else if (dto.lastHealthStatus === 'ERROR') {
    lastPing = 'Auth / Health Error';
  } else if (dto.status === 'SANDBOX') {
    lastPing = 'Sandbox Mode Active';
  }

  return {
    id: dto.id,
    code: dto.provider,
    name: dto.displayName,
    status: dto.status as CourierConnectionStatus,
    environment: dto.isSandbox || dto.status === 'SANDBOX' ? 'Sandbox Test' : 'Production Live',
    baseUrl: dto.baseUrl,
    apiKey: primaryKey,
    secretKey: secondarySecret,
    credentials: creds,
    hasCredentials: dto.hasCredentials,
    storeId: dto.storeId || '',
    webhookUrl: dto.webhookUrl,
    webhookSecret: dto.webhookSecretMasked || '',
    hasWebhookSecret: dto.hasWebhookSecret,
    codChargePercent: dto.codChargePercent,
    insideDhakaRate: dto.insideDhakaRate,
    outsideDhakaRate: dto.outsideDhakaRate,
    activeConsignments: dto.activeConsignments,
    autoBookingEnabled: dto.autoBookingEnabled,
    allowPipelineOverride: dto.allowPipelineOverride,
    lastPing,
    lastBalance: dto.lastBalance ?? null,
    lastHealthStatus: dto.lastHealthStatus ?? null,
    lastError: dto.lastError ?? null,
  };
}

export function CourierIntegrationManager() {
  const [activeTab, setActiveTab] = useState<'INTEGRATIONS' | 'SIMULATOR'>('INTEGRATIONS');
  const [couriers, setCouriers] = useState<CourierIntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingCode, setTestingCode] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [editingCourier, setEditingCourier] = useState<CourierIntegrationItem | null>(null);
  const [testingCourier, setTestingCourier] = useState<CourierDiagnosticTestResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 5000);
  };

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const list = await shippingApi.listIntegrations();
      setCouriers(list.map(mapDtoToItem));
    } catch (err: any) {
      setErrorBanner(
        err?.message || 'Failed to load courier integrations from backend API. Check API connection and admin login.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleTestConnection = async (courier: CourierIntegrationItem) => {
    setTestingCode(courier.code);
    try {
      const result = await shippingApi.testConnection(courier.code);
      await fetchIntegrations();
      setTestingCourier({
        courier: {
          ...courier,
          lastBalance: result.balance ?? courier.lastBalance,
          lastPing: result.success ? `${result.latencyMs}ms • Verified` : 'Connection Failed',
        },
        latencyMs: result.latencyMs,
        success: result.success,
        reachable: result.reachable,
        authenticated: result.authenticated,
        balance: result.balance,
        statusCode: result.statusCode,
        message: result.message,
      });
    } catch (err: any) {
      setTestingCourier({
        courier,
        latencyMs: 0,
        success: false,
        reachable: false,
        authenticated: false,
        message: err?.message || `Failed to run diagnostic test for ${courier.name}.`,
      });
    } finally {
      setTestingCode(null);
    }
  };

  const handleSaveCourierConfig = async (updatedCourier: CourierIntegrationItem) => {
    setSaving(true);
    setErrorBanner(null);
    try {
      const credentials: Record<string, string> = {};
      if (updatedCourier.code === 'STEADFAST') {
        if (updatedCourier.apiKey) credentials.apiKey = updatedCourier.apiKey;
        if (updatedCourier.secretKey) credentials.secretKey = updatedCourier.secretKey;
      } else if (updatedCourier.code === 'PATHAO') {
        if (updatedCourier.apiKey) credentials.clientId = updatedCourier.apiKey;
        if (updatedCourier.secretKey) credentials.clientSecret = updatedCourier.secretKey;
        if (updatedCourier.credentials?.username) credentials.username = updatedCourier.credentials.username;
        if (updatedCourier.credentials?.password) credentials.password = updatedCourier.credentials.password;
      } else if (updatedCourier.code === 'REDX') {
        if (updatedCourier.apiKey) credentials.apiToken = updatedCourier.apiKey;
      } else {
        if (updatedCourier.apiKey) credentials.apiKey = updatedCourier.apiKey;
        if (updatedCourier.secretKey) credentials.secretKey = updatedCourier.secretKey;
      }

      const saved = await shippingApi.saveIntegration(updatedCourier.code, {
        displayName: updatedCourier.name,
        status: updatedCourier.status,
        isSandbox: updatedCourier.status === 'SANDBOX' || updatedCourier.environment === 'Sandbox Test',
        baseUrl: updatedCourier.baseUrl,
        storeId: updatedCourier.storeId || null,
        webhookSecret: updatedCourier.webhookSecret,
        credentials,
        codChargePercent: updatedCourier.codChargePercent,
        insideDhakaRate: updatedCourier.insideDhakaRate,
        outsideDhakaRate: updatedCourier.outsideDhakaRate,
        autoBookingEnabled: updatedCourier.autoBookingEnabled,
        allowPipelineOverride: updatedCourier.allowPipelineOverride,
      });

      const mapped = mapDtoToItem(saved);
      setCouriers((prev) => prev.map((c) => (c.code === mapped.code ? mapped : c)));
      triggerToast(`Saved encrypted API configuration for ${mapped.name} (${mapped.status}).`);
      setEditingCourier(null);
    } catch (err: any) {
      setErrorBanner(err?.message || `Failed to save configuration for ${updatedCourier.name}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-navy-800 dark:text-white">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-800 dark:text-white">
              Courier API Integrations &amp; Sandbox Simulator
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              Platform-level encrypted credentials for Steadfast (Live API v1), Pathao, and RedX with real balance checks &amp; verified webhooks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          {activeTab === 'INTEGRATIONS' && (
            <button
              type="button"
              onClick={fetchIntegrations}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-xs font-bold text-navy-800 dark:text-white border border-slate-200 dark:border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('INTEGRATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'INTEGRATIONS'
              ? 'bg-orange-600 text-white shadow'
              : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 border border-slate-200 dark:border-white/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Live API Credentials &amp; Status</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SIMULATOR')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'SIMULATOR'
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100 border border-slate-200 dark:border-white/10'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Internal Sandbox &amp; Webhook Simulator</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: INTEGRATIONS */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="space-y-6">
          <CourierStatsCards couriers={couriers} />

          {loading && couriers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs text-slate-500 animate-pulse">
              Loading courier integrations from PostgreSQL...
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {couriers.map((courier) => (
                <CourierCard
                  key={courier.id}
                  courier={courier}
                  isTesting={testingCode === courier.code}
                  onTestConnection={handleTestConnection}
                  onConfigure={setEditingCourier}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIMULATOR */}
      {activeTab === 'SIMULATOR' && <CourierSimulatorConsole />}

      {/* Modals */}
      <ConfigureCourierModal
        courier={editingCourier}
        isSaving={saving}
        onClose={() => setEditingCourier(null)}
        onSave={handleSaveCourierConfig}
      />

      <DiagnosticTestModal
        testResult={testingCourier}
        onClose={() => setTestingCourier(null)}
        onConfigureNow={(c) => {
          setTestingCourier(null);
          setEditingCourier({ ...c });
        }}
      />
    </div>
  );
}

export default CourierIntegrationManager;
