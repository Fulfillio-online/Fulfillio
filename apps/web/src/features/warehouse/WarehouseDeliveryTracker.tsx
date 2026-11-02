'use client';

import React, { useState, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  RotateCcw,
  PackageCheck,
  Search,
  Building2,
  MapPin,
  Clock,
  AlertTriangle,
  ExternalLink,
  Filter,
  X,
} from 'lucide-react';

export type DeliveryTrackingStatus = 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';
export type CourierPartner = 'Steadfast' | 'Pathao' | 'RedX';

export interface DispatchedOrderRecord {
  id: string;
  dispatchedAt: string;
  merchantCode: string;
  merchantName: string;
  productTitle: string;
  fullSku: string;
  qtySent: number;
  customerName: string;
  customerPhone: string;
  city: string;
  courier: CourierPartner;
  trackingCode: string;
  codAmount: number;
  status: DeliveryTrackingStatus;
}

const MERCHANTS_LIST = [
  { code: 'MC-101', name: "Sabbir's Store" },
  { code: 'MC-102', name: 'Urban Threads BD' },
  { code: 'MC-103', name: 'Apex Footwear Hub' },
  { code: 'MC-104', name: 'Gadget Freak Online' },
];

const INITIAL_DISPATCHED_ORDERS: DispatchedOrderRecord[] = [
  {
    id: 'ORD-9841',
    dispatchedAt: 'Today, 11:20 AM',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    productTitle: 'Arctic Fleece Heavyweight Hoodie',
    fullSku: 'MC-101-HOODIE-BLK-XL',
    qtySent: 2,
    customerName: 'Tanvir Ahmed',
    customerPhone: '01711-849201',
    city: 'Dhaka (Uttara)',
    courier: 'Steadfast',
    trackingCode: 'SF-8841209',
    codAmount: 3700,
    status: 'IN_TRANSIT',
  },
  {
    id: 'ORD-9839',
    dispatchedAt: 'Today, 10:45 AM',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    productTitle: 'Tokyo Drift Oversized Drop-Shoulder Tee',
    fullSku: 'MC-102-GTEE-PRP-L',
    qtySent: 3,
    customerName: 'Nusrat Jahan',
    customerPhone: '01819-334510',
    city: 'Chattogram (Agrabad)',
    courier: 'Pathao',
    trackingCode: 'PTH-5529018',
    codAmount: 2940,
    status: 'IN_TRANSIT',
  },
  {
    id: 'ORD-9836',
    dispatchedAt: 'Today, 09:30 AM',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    productTitle: 'Handcrafted Full-Grain Chelsea Boots',
    fullSku: 'MC-103-CHELSEA-BRN-42',
    qtySent: 1,
    customerName: 'Mahmudul Hasan',
    customerPhone: '01912-674390',
    city: 'Dhaka (Dhanmondi)',
    courier: 'RedX',
    trackingCode: 'RX-9903142',
    codAmount: 3850,
    status: 'DELIVERED',
  },
  {
    id: 'ORD-9832',
    dispatchedAt: 'Yesterday, 06:15 PM',
    merchantCode: 'MC-104',
    merchantName: 'Gadget Freak Online',
    productTitle: 'SonicWave Pro Hybrid ANC Earbuds',
    fullSku: 'MC-104-ANC-BUDS-BLK',
    qtySent: 2,
    customerName: 'Farhan Sadiq',
    customerPhone: '01674-908123',
    city: 'Sylhet (Zindabazar)',
    courier: 'Steadfast',
    trackingCode: 'SF-8840981',
    codAmount: 4900,
    status: 'IN_TRANSIT',
  },
  {
    id: 'ORD-9828',
    dispatchedAt: 'Yesterday, 04:50 PM',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    productTitle: 'Royal Pique Classic Polo Shirt',
    fullSku: 'MC-101-POLO-NVY-L',
    qtySent: 2,
    customerName: 'Rashedul Islam',
    customerPhone: '01715-221984',
    city: 'Dhaka (Mirpur 10)',
    courier: 'Pathao',
    trackingCode: 'PTH-5528741',
    codAmount: 2580,
    status: 'DELIVERED',
  },
  {
    id: 'ORD-9825',
    dispatchedAt: 'Yesterday, 03:10 PM',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    productTitle: 'Ripstop Multi-Pocket Cargo Pants',
    fullSku: 'MC-102-CARGO-OLV-32',
    qtySent: 1,
    customerName: 'Ashikur Rahman',
    customerPhone: '01521-449087',
    city: 'Rajshahi (Shaheb Bazar)',
    courier: 'RedX',
    trackingCode: 'RX-9902890',
    codAmount: 1750,
    status: 'RETURNED',
  },
  {
    id: 'ORD-9821',
    dispatchedAt: 'Yesterday, 01:40 PM',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    productTitle: 'AeroFoam Nitro Marathon Sneakers',
    fullSku: 'MC-103-RUNNER-TEAL-43',
    qtySent: 2,
    customerName: 'Sadia Afrin',
    customerPhone: '01788-550129',
    city: 'Dhaka (Banani)',
    courier: 'Steadfast',
    trackingCode: 'SF-8839710',
    codAmount: 6400,
    status: 'DELIVERED',
  },
  {
    id: 'ORD-9817',
    dispatchedAt: '2 days ago',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    productTitle: 'Cordura Urban Crossbody Sling Bag',
    fullSku: 'MC-101-SLING-TAN-OS',
    qtySent: 1,
    customerName: 'Imran Hossain',
    customerPhone: '01841-993210',
    city: 'Khulna (Sonadanga)',
    courier: 'Steadfast',
    trackingCode: 'SF-8839104',
    codAmount: 1450,
    status: 'DELIVERED',
  },
  {
    id: 'ORD-9814',
    dispatchedAt: '2 days ago',
    merchantCode: 'MC-104',
    merchantName: 'Gadget Freak Online',
    productTitle: 'SonicWave Pro Hybrid ANC Earbuds',
    fullSku: 'MC-104-ANC-BUDS-BLK',
    qtySent: 1,
    customerName: 'Mehedi Hasan',
    customerPhone: '01799-112233',
    city: 'Cumilla (Kandirpar)',
    courier: 'Pathao',
    trackingCode: 'PTH-5527902',
    codAmount: 2450,
    status: 'DELIVERED',
  },
  {
    id: 'ORD-9810',
    dispatchedAt: '2 days ago',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    productTitle: 'Tokyo Drift Oversized Drop-Shoulder Tee',
    fullSku: 'MC-102-GTEE-PRP-L',
    qtySent: 2,
    customerName: 'Kazi Nabil',
    customerPhone: '01611-778899',
    city: 'Dhaka (Bashundhara)',
    courier: 'RedX',
    trackingCode: 'RX-9902115',
    codAmount: 1960,
    status: 'DELIVERED',
  },
  {
    id: 'ORD-9806',
    dispatchedAt: '3 days ago',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    productTitle: 'Handcrafted Full-Grain Chelsea Boots',
    fullSku: 'MC-103-CHELSEA-BRN-42',
    qtySent: 1,
    customerName: 'Shafiqul Alam',
    customerPhone: '01933-445566',
    city: 'Barishal (Sadar)',
    courier: 'Steadfast',
    trackingCode: 'SF-8838420',
    codAmount: 3850,
    status: 'RETURNED',
  },
  {
    id: 'ORD-9802',
    dispatchedAt: '3 days ago',
    merchantCode: 'MC-104',
    merchantName: 'Gadget Freak Online',
    productTitle: 'SonicWave Pro Hybrid ANC Earbuds',
    fullSku: 'MC-104-ANC-BUDS-BLK',
    qtySent: 3,
    customerName: 'Tareq Aziz',
    customerPhone: '01722-889900',
    city: 'Dhaka (Gulshan 2)',
    courier: 'Pathao',
    trackingCode: 'PTH-5527011',
    codAmount: 7350,
    status: 'DELIVERED',
  },
];

export function WarehouseDeliveryTracker({
  onOpenReturns,
}: {
  onOpenReturns?: () => void;
}) {
  const [orders, setOrders] = useState<DispatchedOrderRecord[]>(
    INITIAL_DISPATCHED_ORDERS
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    order: DispatchedOrderRecord;
    nextStatus: DeliveryTrackingStatus;
  } | null>(null);

  // Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Top 4 KPI Metrics
  const kpiStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalProductsSent = orders.reduce((sum, o) => sum + o.qtySent, 0);
    const inTransitCount = orders.filter((o) => o.status === 'IN_TRANSIT').length;
    const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
    const returnedCount = orders.filter((o) => o.status === 'RETURNED').length;
    const completedParcels = deliveredCount + returnedCount;
    const deliverySuccessRate =
      completedParcels > 0
        ? Math.round((deliveredCount / completedParcels) * 100)
        : 100;

    return {
      totalOrders,
      totalProductsSent,
      inTransitCount,
      deliveredCount,
      returnedCount,
      deliverySuccessRate,
    };
  }, [orders]);

  // Merchant-Wise Summary Metrics
  const merchantSummaryRows = useMemo(() => {
    return MERCHANTS_LIST.map((m) => {
      const mOrders = orders.filter((o) => o.merchantCode === m.code);
      const dispatchedOrders = mOrders.length;
      const totalQty = mOrders.reduce((sum, o) => sum + o.qtySent, 0);
      const inTransit = mOrders.filter((o) => o.status === 'IN_TRANSIT').length;
      const delivered = mOrders.filter((o) => o.status === 'DELIVERED').length;
      const returned = mOrders.filter((o) => o.status === 'RETURNED').length;
      const totalCodValue = mOrders.reduce((sum, o) => sum + o.codAmount, 0);

      return {
        ...m,
        dispatchedOrders,
        totalQty,
        inTransit,
        delivered,
        returned,
        totalCodValue,
      };
    });
  }, [orders]);

  // Filtered Dispatched Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.trackingCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.fullSku.toLowerCase().includes(q) ||
        o.productTitle.toLowerCase().includes(q);
      const matchesMerchant =
        merchantFilter === 'ALL' || o.merchantCode === merchantFilter;
      const matchesCourier =
        courierFilter === 'ALL' || o.courier === courierFilter;
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

      return (
        matchesSearch && matchesMerchant && matchesCourier && matchesStatus
      );
    });
  }, [orders, searchQuery, merchantFilter, courierFilter, statusFilter]);

  // Confirm status update
  const handleConfirmStatusUpdate = () => {
    if (!confirmModal) return;
    const { order, nextStatus } = confirmModal;

    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id ? { ...item, status: nextStatus } : item
      )
    );

    showToast(
      `Order ${order.id} (${order.courier} · ${order.trackingCode}) marked as ${
        nextStatus === 'DELIVERED' ? 'DELIVERED' : 'RETURNED / RTO'
      }.`
    );
    setConfirmModal(null);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Courier Dispatch &amp; Post-Handover Delivery Tracker
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Dedicated tracking for parcels handed over to Steadfast, Pathao, and RedX — keeping the Warehouse Orders Pipeline focused on in-warehouse fulfillment
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-medium">
            Active Couriers:{' '}
            <strong className="text-emerald-400">Steadfast · Pathao · RedX</strong>
          </span>
          {onOpenReturns && (
            <button
              type="button"
              onClick={onOpenReturns}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Returns &amp; RTO Restock ({kpiStats.returnedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          1. TOP 4 KPI CARDS
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Dispatched Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Dispatched Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {kpiStats.totalOrders}
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              Orders · {kpiStats.totalProductsSent} Products Sent
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Handed over from packing stations to 3PL couriers
          </p>
        </div>

        {/* Card 2: In Transit with Courier */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              In Transit with Courier
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-400 font-mono">
              {kpiStats.inTransitCount}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Parcels on the way
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Out for last-mile hub sorting &amp; doorstep delivery
          </p>
        </div>

        {/* Card 3: Successfully Delivered */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Successfully Delivered
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {kpiStats.deliveredCount}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-300">
              {kpiStats.deliverySuccessRate}% Success Rate
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            COD collected &amp; verified by courier webhook
          </p>
        </div>

        {/* Card 4: Returned / RTO */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Returned / RTO
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-mono">
              {kpiStats.returnedCount}
            </span>
            <span className="text-xs font-semibold text-rose-300">
              Parcels returned
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Marked for reverse logistics restocking intake
          </p>
        </div>
      </div>

      {/* =====================================================================
          2. MERCHANT-WISE DISPATCH & DELIVERY SUMMARY TABLE
         ===================================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Merchant-Wise Dispatch &amp; Delivery Summary</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any merchant row below to filter the detailed dispatched orders table for that merchant
            </p>
          </div>
          {merchantFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setMerchantFilter('ALL')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
            >
              Showing {merchantFilter} · Click to Show All Merchants
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[780px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4 text-center">Orders Dispatched</th>
                <th className="py-3 px-4 text-center">Product Units Sent</th>
                <th className="py-3 px-4 text-center">In Transit</th>
                <th className="py-3 px-4 text-center">Delivered</th>
                <th className="py-3 px-4 text-center">Returned / RTO</th>
                <th className="py-3 px-4 text-right">Dispatched COD Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-sm">
              {merchantSummaryRows.map((row) => {
                const isSelected = merchantFilter === row.code;
                return (
                  <tr
                    key={row.code}
                    onClick={() =>
                      setMerchantFilter((prev) =>
                        prev === row.code ? 'ALL' : row.code
                      )
                    }
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs font-bold text-emerald-400">
                          {row.code}
                        </span>
                        <span className="font-semibold text-white">
                          {row.name}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Filtered
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                      {row.dispatchedOrders}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 font-mono text-xs font-semibold text-emerald-300">
                        {row.totalQty} pcs
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-sky-400">
                      {row.inTransit}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-emerald-400">
                      {row.delivered}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-rose-400">
                      {row.returned}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ৳{row.totalCodValue.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          3. DISPATCHED ORDERS & DELIVERY STATUS TABLE
         ===================================================================== */}
      <div className="space-y-4">
        {/* Filter Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Tracking ID, Customer, or SKU..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
              aria-label="Filter by Merchant"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Merchants</option>
              {MERCHANTS_LIST.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.code} — {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              aria-label="Filter by Courier"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Couriers (Steadfast, Pathao, RedX)</option>
              <option value="Steadfast">Steadfast Courier</option>
              <option value="Pathao">Pathao Courier</option>
              <option value="RedX">RedX Logistics</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by Delivery Status"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="RETURNED">RETURNED</option>
            </select>
          </div>
        </div>

        {/* Detailed Dispatched Orders Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/50">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
              <Filter className="w-4 h-4 text-emerald-400" />
              <span>
                Showing <strong className="text-white">{filteredOrders.length}</strong>{' '}
                dispatched shipments
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1040px]">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/60">
                  <th className="py-3.5 px-4">Order ID &amp; Dispatched Time</th>
                  <th className="py-3.5 px-4">Merchant</th>
                  <th className="py-3.5 px-4">Product &amp; Qty Sent</th>
                  <th className="py-3.5 px-4">Customer &amp; City</th>
                  <th className="py-3.5 px-4">Courier &amp; Tracking Code</th>
                  <th className="py-3.5 px-4 text-right">COD Amount</th>
                  <th className="py-3.5 px-4 text-center">Delivery Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Order ID & Dispatched Time */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white">
                        {order.id}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{order.dispatchedAt}</span>
                      </div>
                    </td>

                    {/* Merchant */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-bold text-emerald-400">
                        {order.merchantCode}
                      </div>
                      <div className="text-xs text-slate-300">
                        {order.merchantName}
                      </div>
                    </td>

                    {/* Product & Qty Sent */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">
                        {order.productTitle}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {order.fullSku}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          × {order.qtySent} pcs
                        </span>
                      </div>
                    </td>

                    {/* Customer & City */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-100">
                        {order.customerName}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{order.city}</span>
                      </div>
                    </td>

                    {/* Courier & Tracking Code */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200">
                        <Truck className="w-3 h-3 text-emerald-400" />
                        <span>{order.courier}</span>
                      </div>
                      <div className="font-mono text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <span>{order.trackingCode}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </div>
                    </td>

                    {/* COD Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ৳{order.codAmount.toLocaleString()}
                    </td>

                    {/* Delivery Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {order.status === 'IN_TRANSIT' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                          IN TRANSIT
                        </span>
                      )}
                      {order.status === 'DELIVERED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          DELIVERED
                        </span>
                      )}
                      {order.status === 'RETURNED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                          RETURNED
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={order.status === 'DELIVERED'}
                          onClick={() =>
                            setConfirmModal({
                              order,
                              nextStatus: 'DELIVERED',
                            })
                          }
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            order.status === 'DELIVERED'
                              ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                              : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 cursor-pointer'
                          }`}
                        >
                          Mark Delivered
                        </button>
                        {order.status === 'RETURNED' && onOpenReturns ? (
                          <button
                            type="button"
                            onClick={onOpenReturns}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Intake &amp; Restock</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={order.status === 'RETURNED'}
                            onClick={() =>
                              setConfirmModal({
                                order,
                                nextStatus: 'RETURNED',
                              })
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              order.status === 'RETURNED'
                                ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                                : 'bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 cursor-pointer'
                            }`}
                          >
                            Mark Returned
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No dispatched orders match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CONFIRMATION MODAL FOR MARK DELIVERED / MARK RETURNED
         ===================================================================== */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    confirmModal.nextStatus === 'DELIVERED'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {confirmModal.nextStatus === 'DELIVERED' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {confirmModal.nextStatus === 'DELIVERED'
                      ? 'Confirm Delivery Completion'
                      : 'Confirm Parcel Return (RTO)'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                    {confirmModal.nextStatus === 'DELIVERED'
                      ? `Confirm marking Order ${confirmModal.order.id} (${confirmModal.order.courier} · ${confirmModal.order.trackingCode}) as DELIVERED with ৳${confirmModal.order.codAmount.toLocaleString()} COD collected?`
                      : `Confirm marking Order ${confirmModal.order.id} (${confirmModal.order.courier} · ${confirmModal.order.trackingCode}) as RETURNED / RTO for ${confirmModal.order.merchantName}?`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Merchant:</span>
                <span className="font-semibold text-white">
                  {confirmModal.order.merchantCode} · {confirmModal.order.merchantName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Product &amp; Qty:</span>
                <span className="font-mono text-emerald-300">
                  {confirmModal.order.fullSku} × {confirmModal.order.qtySent} pcs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="text-slate-200">
                  {confirmModal.order.customerName} ({confirmModal.order.city})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusUpdate}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer ${
                  confirmModal.nextStatus === 'DELIVERED'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                }`}
              >
                {confirmModal.nextStatus === 'DELIVERED'
                  ? 'Confirm Mark Delivered'
                  : 'Confirm Mark Returned'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default WarehouseDeliveryTracker;
