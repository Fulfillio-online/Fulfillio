'use client';

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { WorkerTab, WorkerOrder } from './types';
import { INITIAL_WORKER_PROFILE, INITIAL_WORKER_ORDERS } from './mockData';
import { WorkerHeader } from './components/WorkerHeader';
import { WorkerPickTab } from './components/tabs/WorkerPickTab';
import { WorkerPackTab } from './components/tabs/WorkerPackTab';
import { WorkerCourierTab } from './components/tabs/WorkerCourierTab';
import { WorkerDockTab } from './components/tabs/WorkerDockTab';

export function WorkerAppManager() {
  const [activeTab, setActiveTab] = useState<WorkerTab>('pick');
  const [notification, setNotification] = useState<string | null>(null);
  const [worker] = useState(INITIAL_WORKER_PROFILE);
  const [orders, setOrders] = useState<WorkerOrder[]>(INITIAL_WORKER_ORDERS);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Tab 1: Action Picked
  const handleMarkPicked = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, stage: 'PICKED', selectedForPack: true } : o,
      ),
    );
    showToast(`Order ${orderId} marked as PICKED from bin!`);
  };

  // Tab 2: Toggle Selection for Pack & Print
  const handleToggleSelectPack = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, selectedForPack: !o.selectedForPack } : o,
      ),
    );
  };

  const handleSelectAllForPack = () => {
    const pickedOrders = orders.filter((o) => o.stage === 'PICKED');
    const allSelected = pickedOrders.every((o) => o.selectedForPack);
    setOrders((prev) =>
      prev.map((o) =>
        o.stage === 'PICKED' ? { ...o, selectedForPack: !allSelected } : o,
      ),
    );
  };

  // Tab 2: Print 4x6 Thermal Memo & Advance to PACKED
  const handlePrintAndPackSelected = () => {
    const selectedOrders = orders.filter((o) => o.stage === 'PICKED' && o.selectedForPack);
    if (selectedOrders.length === 0) {
      showToast('Please select at least one picked order to print!');
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.stage === 'PICKED' && o.selectedForPack
          ? { ...o, stage: 'PACKED', selectedForPack: false }
          : o,
      ),
    );
    showToast(
      `Printed ${selectedOrders.length} Reseller 4x6 Thermal Memo(s) & marked as PACKED!`,
    );
  };

  // Tab 3: Courier Handover
  const handleHandoverToCourier = (courierName: string) => {
    const packedCount = orders.filter((o) => o.stage === 'PACKED' && o.courier === courierName).length;
    if (packedCount === 0) {
      showToast(`No packed parcels currently waiting for ${courierName}!`);
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.stage === 'PACKED' && o.courier === courierName ? { ...o, stage: 'DISPATCHED' } : o,
      ),
    );
    showToast(
      `Handed over ${packedCount} parcel(s) to ${courierName} rider with manifest sheet!`,
    );
  };

  const pickList = orders.filter((o) => o.stage === 'READY_TO_PICK');
  const packList = orders.filter((o) => o.stage === 'PICKED');
  const packedWaitingCourier = orders.filter((o) => o.stage === 'PACKED');
  const selectedPackCount = packList.filter((o) => o.selectedForPack).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 max-w-lg md:max-w-2xl lg:max-w-4xl w-full mx-auto border-x border-slate-800 shadow-2xl">
      <WorkerHeader
        worker={worker}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pickCount={pickList.length}
        packCount={packList.length}
        courierCount={packedWaitingCourier.length}
      />

      {/* Global Notification Toast */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200 max-w-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
        {activeTab === 'pick' && (
          <WorkerPickTab
            pickList={pickList}
            onMarkPicked={handleMarkPicked}
            onGoToPack={() => setActiveTab('pack')}
          />
        )}

        {activeTab === 'pack' && (
          <WorkerPackTab
            packList={packList}
            selectedPackCount={selectedPackCount}
            onToggleSelectPack={handleToggleSelectPack}
            onSelectAllForPack={handleSelectAllForPack}
            onPrintAndPackSelected={handlePrintAndPackSelected}
          />
        )}

        {activeTab === 'courier' && (
          <WorkerCourierTab
            orders={orders}
            onHandoverToCourier={handleHandoverToCourier}
          />
        )}

        {activeTab === 'dock' && (
          <WorkerDockTab onShowToast={showToast} />
        )}
      </main>
    </div>
  );
}

export default WorkerAppManager;
