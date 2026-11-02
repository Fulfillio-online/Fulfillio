'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  Printer,
  Truck,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  Check,
  ChevronRight,
  LogOut,
  Sparkles,
  Barcode,
  ArrowRight,
  AlertCircle,
  Smartphone,
  Boxes,
  RotateCcw
} from 'lucide-react';
import { InboundAsnManager } from '@/features/inbound/InboundAsnManager';

type WorkerTab = 'pick' | 'pack' | 'courier' | 'dock';

export default function WarehouseWorkerApp() {
  const [activeTab, setActiveTab] = useState<WorkerTab>('pick');
  const [notification, setNotification] = useState<string | null>(null);

  // Worker profile state
  const [worker] = useState({
    name: 'Jasim Uddin',
    id: 'OP-04',
    station: 'Station #3 (Dhaka Central Hub)',
    shift: 'Morning Shift',
  });

  // Mock Active Orders for Warehouse Worker
  const [orders, setOrders] = useState([
    {
      id: 'ORD-9824',
      date: 'Today, 10:15 AM',
      customer: 'Tariqul Islam',
      phone: '01812345678',
      address: 'Dhanmondi, Dhaka',
      itemTitle: 'Heavyweight Hoodie',
      variant: 'Black / XL',
      sku: 'MC-101-HOODIE-BLK-XL',
      bin: 'A-01-02-03',
      qty: 1,
      memoCode: 'MEMO-FESTIVE-01',
      reseller: 'Urban Threads BD',
      courier: 'Steadfast',
      amount: 3450,
      stage: 'READY_TO_PICK', // 'READY_TO_PICK' | 'PICKED' | 'PACKED' | 'DISPATCHED'
      selectedForPack: false,
    },
    {
      id: 'ORD-9825',
      date: 'Today, 10:20 AM',
      customer: 'Nabila Hasan',
      phone: '01798765432',
      address: 'Uttara Sector 7, Dhaka',
      itemTitle: 'Embroidered Baseball Cap',
      variant: 'Navy Blue / OS',
      sku: 'MC-101-CAP-NVY-OS',
      bin: 'B-04-01-01',
      qty: 2,
      memoCode: 'MEMO-DEFAULT',
      reseller: 'Urban Threads BD',
      courier: 'Pathao',
      amount: 2400,
      stage: 'READY_TO_PICK',
      selectedForPack: false,
    },
    {
      id: 'ORD-9826',
      date: 'Today, 10:25 AM',
      customer: 'Sabbir Ahmed',
      phone: '01911223344',
      address: 'Banani Road 11, Dhaka',
      itemTitle: 'Raw Selvedge Denim Jacket',
      variant: 'Raw Indigo / L',
      sku: 'MC-101-JKT-RAW-L',
      bin: 'A-02-01-04',
      qty: 1,
      memoCode: 'MEMO-FESTIVE-01',
      reseller: 'Urban Threads BD',
      courier: 'Steadfast',
      amount: 4100,
      stage: 'PICKED', // Already picked, ready to pack
      selectedForPack: true,
    },
    {
      id: 'ORD-9827',
      date: 'Today, 10:30 AM',
      customer: 'Tanvir Hossain',
      phone: '01677889900',
      address: 'Mirpur 10, Dhaka',
      itemTitle: 'Heavyweight Hoodie',
      variant: 'Black / L',
      sku: 'MC-101-HOODIE-BLK-L',
      bin: 'A-01-02-02',
      qty: 1,
      memoCode: 'MEMO-DEFAULT',
      reseller: 'Urban Threads BD',
      courier: 'Steadfast',
      amount: 3450,
      stage: 'PACKED', // Ready for courier handover
      selectedForPack: false,
    },
  ]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Tab 1: Action Picked
  const handleMarkPicked = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, stage: 'PICKED', selectedForPack: true } : o
      )
    );
    showToast(`Order ${orderId} marked as PICKED from bin!`);
  };

  // Tab 2: Toggle Selection for Pack & Print
  const handleToggleSelectPack = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, selectedForPack: !o.selectedForPack } : o
      )
    );
  };

  const handleSelectAllForPack = () => {
    const pickedOrders = orders.filter((o) => o.stage === 'PICKED');
    const allSelected = pickedOrders.every((o) => o.selectedForPack);
    setOrders((prev) =>
      prev.map((o) =>
        o.stage === 'PICKED' ? { ...o, selectedForPack: !allSelected } : o
      )
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
        o.stage === 'PICKED' && o.selectedForPack ? { ...o, stage: 'PACKED', selectedForPack: false } : o
      )
    );
    showToast(
      `Printed ${selectedOrders.length} Reseller 4x6 Thermal Memo(s) & marked as PACKED!`
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
        o.stage === 'PACKED' && o.courier === courierName ? { ...o, stage: 'DISPATCHED' } : o
      )
    );
    showToast(
      `Handed over ${packedCount} parcel(s) to ${courierName} rider with manifest sheet!`
    );
  };

  const pickList = orders.filter((o) => o.stage === 'READY_TO_PICK');
  const packList = orders.filter((o) => o.stage === 'PICKED');
  const packedWaitingCourier = orders.filter((o) => o.stage === 'PACKED');
  const selectedPackCount = packList.filter((o) => o.selectedForPack).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 max-w-lg md:max-w-2xl lg:max-w-4xl w-full mx-auto border-x border-slate-800 shadow-2xl">
      {/* Mobile App Header */}
      <header className="p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              F
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">
                  Fulfillio WMS
                </span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  Worker App
                </span>
              </div>
              <span className="text-xs text-slate-400 block">
                {worker.name} • <span className="font-mono text-emerald-400 font-bold">{worker.id}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Exit App"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Shift Banner */}
        <div className="mt-3 p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Station: {worker.station}</span>
          </div>
          <span className="font-semibold text-slate-300">{worker.shift}</span>
        </div>

        {/* 4 Main Action Tabs */}
        <nav className="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('pick')}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 relative ${
              activeTab === 'pick'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              <PackageCheck className="h-4 w-4" />
              <span>1. Pick</span>
            </div>
            {pickList.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-emerald-300 font-bold">
                {pickList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pack')}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 relative ${
              activeTab === 'pack'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              <Printer className="h-4 w-4" />
              <span>2. Pack</span>
            </div>
            {packList.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-emerald-300 font-bold">
                {packList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('courier')}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 relative ${
              activeTab === 'courier'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              <span>3. Dispatch</span>
            </div>
            {packedWaitingCourier.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-emerald-300 font-bold">
                {packedWaitingCourier.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('dock')}
            className={`py-2 px-1 rounded-lg text-xs font-bold transition-colors flex flex-col items-center gap-1 relative ${
              activeTab === 'dock'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <div className="flex items-center gap-1">
              <Boxes className="h-4 w-4" />
              <span>4. ASN/RTO</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-indigo-300 font-bold">
              New
            </span>
          </button>
        </nav>
      </header>

      {/* Global Notification Toast */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200 max-w-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-24">
        {/* ================= TAB 1: PICK LIST ================= */}
        {activeTab === 'pick' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <PackageCheck className="h-4 w-4 text-emerald-400" />
                  <span>Items to Pick from Shelf</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Walk to assigned shelf bins and pick designated SKUs.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                {pickList.length} Left
              </span>
            </div>

            {pickList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-sm text-slate-200">All Items Picked!</h3>
                <p className="text-xs text-slate-400">
                  Switch to the Pack & Print tab to process thermal invoices.
                </p>
                <button
                  onClick={() => setActiveTab('pack')}
                  className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Go to Pack & Print →
                </button>
              </div>
            ) : (
              pickList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm hover:border-slate-700 transition-colors"
                >
                  {/* Bin Location Highlight Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">BIN LOCATION:</span>
                      <span className="font-mono text-sm font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {item.bin}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-indigo-300 font-bold">
                      {item.id}
                    </span>
                  </div>

                  {/* Product Details (Large fonts for worker readability) */}
                  <div>
                    <h3 className="font-extrabold text-base text-white tracking-tight leading-snug">
                      {item.itemTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {item.variant}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        Quantity: {item.qty} pcs
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/80 truncate">
                      SKU: <span className="text-slate-200 font-bold">{item.sku}</span>
                    </div>
                  </div>

                  {/* Pick Action Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      Attribution: <span className="font-mono text-indigo-400">{item.memoCode}</span>
                    </div>

                    <button
                      onClick={() => handleMarkPicked(item.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Check className="h-4 w-4" />
                      <span>Mark Picked</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= TAB 2: PACK & PRINT (4x6 MEMO) ================= */}
        {activeTab === 'pack' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Printer className="h-4 w-4 text-emerald-400" />
                  <span>Pack & Print Reseller Memo</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Select items packed into flyer bags and print 4x6 thermal slips.
                </p>
              </div>

              {packList.length > 0 && (
                <button
                  onClick={handleSelectAllForPack}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Toggle All
                </button>
              )}
            </div>

            {packList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-sm text-slate-200">No Items Awaiting Pack</h3>
                <p className="text-xs text-slate-400">
                  Go to Pick List to collect items from shelves.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {packList.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleToggleSelectPack(order.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      order.selectedForPack
                        ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={order.selectedForPack}
                          onChange={() => {}} // Controlled by container onClick
                          className="h-4 w-4 rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0"
                        />
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {order.id}
                        </span>
                      </div>

                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {order.memoCode}
                      </span>
                    </div>

                    <div>
                      <span className="font-extrabold text-sm text-slate-100 block">
                        {order.itemTitle} ({order.variant})
                      </span>
                      <span className="text-xs text-slate-400">
                        Customer: {order.customer} • {order.address}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">
                        Courier: <span className="font-semibold text-slate-200">{order.courier}</span>
                      </span>
                      <span className="font-bold text-emerald-400">৳ {order.amount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}

                {/* Big Action Button (Sticky for mobile packers) */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Selected for batch printing:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {selectedPackCount} parcel(s)
                    </span>
                  </div>

                  <button
                    onClick={handlePrintAndPackSelected}
                    disabled={selectedPackCount === 0}
                    className={`w-full py-3.5 px-4 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
                      selectedPackCount > 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-98'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Printer className="h-5 w-5" />
                    <span>Print 4x6 Thermal Memo ({selectedPackCount})</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: COURIER HANDOVER ================= */}
        {activeTab === 'courier' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-emerald-400" />
                <span>Courier Dispatch Handover</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Parcels packed with thermal invoices waiting for courier driver pickup.
              </p>
            </div>

            {/* Courier Dispatch Cards */}
            <div className="grid grid-cols-1 gap-3">
              {/* Steadfast Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      SF
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Steadfast Courier</h3>
                      <span className="text-[11px] text-slate-400">Direct warehouse API integrated</span>
                    </div>
                  </div>

                  <span className="font-mono text-sm font-black text-emerald-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    {orders.filter((o) => o.stage === 'PACKED' && o.courier === 'Steadfast').length} Ready
                  </span>
                </div>

                <button
                  onClick={() => handleHandoverToCourier('Steadfast')}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Truck className="h-4 w-4 text-emerald-400" />
                  <span>Handover Steadfast Driver</span>
                </button>
              </div>

              {/* Pathao Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm">
                      PT
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Pathao Logistics</h3>
                      <span className="text-[11px] text-slate-400">Express Dhaka coverage</span>
                    </div>
                  </div>

                  <span className="font-mono text-sm font-black text-rose-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    {orders.filter((o) => o.stage === 'PACKED' && o.courier === 'Pathao').length} Ready
                  </span>
                </div>

                <button
                  onClick={() => handleHandoverToCourier('Pathao')}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Truck className="h-4 w-4 text-rose-400" />
                  <span>Handover Pathao Driver</span>
                </button>
              </div>
            </div>

            {/* Manifest Summary */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Today Handover History</span>
              <div className="text-xs text-slate-400 space-y-1">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span>Steadfast Driver Handover (10:45 AM)</span>
                  <span className="font-semibold text-emerald-400">14 Parcels (Signed)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Pathao Courier Rider (09:30 AM)</span>
                  <span className="font-semibold text-emerald-400">8 Parcels (Signed)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: INBOUND ASN & COURIER RTO INTAKE ================= */}
        {activeTab === 'dock' && (
          <div className="space-y-4">
            <InboundAsnManager
              mode="WAREHOUSE"
              onStockReceived={(sku, good, dmg) =>
                showToast(`Received ${sku}: +${good} Sellable, ${dmg} Quarantine`)
              }
            />

            {/* Courier Return (RTO) Quarantine & Restock Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Courier Return (RTO) Intake</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Quarantine Guard
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Inspect returned courier parcels. Undamaged units return to sellable shelf; damaged units route to Quarantine Bin.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() =>
                    showToast('RTO Restocked: +1 MC-101-HOODIE-BLK-XL to Sellable Shelf A-01-02')
                  }
                  className="py-2.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
                >
                  ✓ Good → Restock Shelf
                </button>
                <button
                  onClick={() =>
                    showToast('RTO Damaged: Routed 1 unit to Quarantine Bin DMG-01')
                  }
                  className="py-2.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold"
                >
                  ⚠ Damaged → Quarantine
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
