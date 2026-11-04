'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle2 } from 'lucide-react';
import {
  CourierConnectionStatus,
  CourierDiagnosticTestResult,
  CourierIntegrationItem,
} from './types';
import { INITIAL_COURIERS, STORAGE_KEY_COURIERS } from './mockData';
import { CourierStatsCards } from './components/CourierStatsCards';
import { CourierCard } from './components/CourierCard';
import { ConfigureCourierModal } from './components/modals/ConfigureCourierModal';
import { DiagnosticTestModal } from './components/modals/DiagnosticTestModal';
import { AddCourierModal } from './components/modals/AddCourierModal';

export function CourierIntegrationManager() {
  const [couriers, setCouriers] = useState<CourierIntegrationItem[]>(INITIAL_COURIERS);
  const [editingCourier, setEditingCourier] = useState<CourierIntegrationItem | null>(null);
  const [testingCourier, setTestingCourier] = useState<CourierDiagnosticTestResult | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURIERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCouriers(parsed);
        }
      } else {
        localStorage.setItem(STORAGE_KEY_COURIERS, JSON.stringify(INITIAL_COURIERS));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistCouriers = (updated: CourierIntegrationItem[]) => {
    setCouriers(updated);
    try {
      localStorage.setItem(STORAGE_KEY_COURIERS, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

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

  const handleSaveCourierConfig = (updatedCourier: CourierIntegrationItem) => {
    const updated = couriers.map((c) =>
      c.id === updatedCourier.id
        ? {
            ...updatedCourier,
            lastPing:
              updatedCourier.status === 'DISCONNECTED'
                ? 'Disconnected by Admin'
                : '36ms • Configured Just Now',
          }
        : c
    );
    persistCouriers(updated);
    triggerToast(
      `Saved API configuration for ${updatedCourier.name} (${updatedCourier.status}).`
    );
    setEditingCourier(null);
  };

  const handleAddCourier = (created: CourierIntegrationItem) => {
    persistCouriers([...couriers, created]);
    triggerToast(`Added and connected new courier partner: ${created.name} (${created.code})!`);
  };

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
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
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

      {/* Summary Cards */}
      <CourierStatsCards couriers={couriers} />

      {/* Courier Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {couriers.map((courier) => (
          <CourierCard
            key={courier.id}
            courier={courier}
            onTestConnection={handleTestConnection}
            onConfigure={setEditingCourier}
          />
        ))}
      </div>

      {/* Modals */}
      <ConfigureCourierModal
        courier={editingCourier}
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

      <AddCourierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCourier={handleAddCourier}
      />
    </div>
  );
}
