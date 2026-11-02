'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Printer,
  Search,
  Eye,
  PackageCheck,
  ArrowLeft,
  Truck,
  Tag,
  CheckCircle2,
  X,
  RotateCcw,
  Layers,
  Building2,
} from 'lucide-react';
import { UnifiedThermalSticker } from '@/features/thermal-print/UnifiedThermalSticker';

type PackingStatus = 'READY_TO_PACK' | 'PACKED';
type CourierProvider = 'Steadfast' | 'Pathao' | 'RedX';
type MerchantCode = 'MC-101' | 'MC-102' | 'MC-103';

interface PackingOrderItem {
  sku: string;
  title: string;
  color: string;
  size: string;
  qty: number;
  price: number;
}

interface PackingOrder {
  id: string;
  merchantCode: MerchantCode;
  merchantName: string;
  memoCode: string;
  resellerName: string;
  resellerPhone: string;
  resellerAddress: string;
  brandColor: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  courier: CourierProvider;
  consignmentId: string;
  trackingCode: string;
  packagingType: string;
  codAmount: number;
  status: PackingStatus;
  pickedRack: string;
  packedAt?: string;
  items: PackingOrderItem[];
}

const INITIAL_PACKING_ORDERS: PackingOrder[] = [
  {
    id: 'ORD-99201',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    memoCode: 'MEMO-DARAZ-BD',
    resellerName: 'Urban Style BD (Reseller)',
    resellerPhone: '01711-223344',
    resellerAddress: 'House 14, Road 5, Dhanmondi, Dhaka',
    brandColor: '#059669',
    customerName: 'Tanvir Hossain',
    customerPhone: '01712-984512',
    customerAddress: 'Flat 4B, House 22, Block C, Banani, Dhaka',
    city: 'Dhaka',
    courier: 'Steadfast',
    consignmentId: 'CN-849201',
    trackingCode: 'TRK-STE-99201',
    packagingType: 'POLY_MEDIUM',
    codAmount: 1450,
    status: 'READY_TO_PACK',
    pickedRack: 'Z1-R02-S1-B04',
    items: [
      {
        sku: 'MC-101-TSHIRT-BLK-XL',
        title: 'Heavyweight Drop-Shoulder Tee',
        color: 'Jet Black',
        size: 'XL',
        qty: 2,
        price: 725,
      },
    ],
  },
  {
    id: 'ORD-99202',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    memoCode: 'MEMO-FASHION-HUB',
    resellerName: 'Dhaka Fashion Hub',
    resellerPhone: '01819-556677',
    resellerAddress: 'Sector 7, Uttara, Dhaka-1230',
    brandColor: '#111827',
    customerName: 'Nusrat Jahan',
    customerPhone: '01833-412098',
    customerAddress: 'Road 3, O.R. Nizam Road, GEC Circle, Chattogram',
    city: 'Chattogram',
    courier: 'Pathao',
    consignmentId: 'CN-849202',
    trackingCode: 'TRK-PTH-99202',
    packagingType: 'POLY_SMALL',
    codAmount: 980,
    status: 'READY_TO_PACK',
    pickedRack: 'Z1-R03-S2-B01',
    items: [
      {
        sku: 'MC-101-POLO-NVY-L',
        title: 'Pique Cotton Classic Polo',
        color: 'Navy Blue',
        size: 'L',
        qty: 1,
        price: 980,
      },
    ],
  },
  {
    id: 'ORD-99203',
    merchantCode: 'MC-102',
    merchantName: 'TechGear BD',
    memoCode: 'MEMO-TECH-BD',
    resellerName: 'Gadget Express BD',
    resellerPhone: '01911-889900',
    resellerAddress: 'Level 4, Bashundhara City, Panthapath, Dhaka',
    brandColor: '#0284c7',
    customerName: 'Mahmudul Hasan',
    customerPhone: '01677-309182',
    customerAddress: 'Zindabazar Main Road, Sylhet Sadar',
    city: 'Sylhet',
    courier: 'Steadfast',
    consignmentId: 'CN-849203',
    trackingCode: 'TRK-STE-99203',
    packagingType: 'BOX_BUBBLE_SM',
    codAmount: 2250,
    status: 'READY_TO_PACK',
    pickedRack: 'Z2-R01-S1-B02',
    items: [
      {
        sku: 'MC-102-EARBUD-PRO-BLK',
        title: 'ANC Wireless Earbuds Pro V2',
        color: 'Matte Black',
        size: 'STD',
        qty: 1,
        price: 1850,
      },
      {
        sku: 'MC-102-CABLE-TYPEC-1M',
        title: '65W Braided PD Fast Cable',
        color: 'Black/Red',
        size: '1M',
        qty: 1,
        price: 400,
      },
    ],
  },
  {
    id: 'ORD-99204',
    merchantCode: 'MC-103',
    merchantName: 'Modest Wear BD',
    memoCode: 'MEMO-MODEST-01',
    resellerName: 'Noor Haya Collection',
    resellerPhone: '01755-667788',
    resellerAddress: 'Mirpur 10, Shah Ali Plaza, Dhaka',
    brandColor: '#7c3aed',
    customerName: 'Farzana Akter',
    customerPhone: '01922-674310',
    customerAddress: 'Shaheb Bazar Zero Point, Rajshahi',
    city: 'Rajshahi',
    courier: 'RedX',
    consignmentId: 'CN-849204',
    trackingCode: 'TRK-RDX-99204',
    packagingType: 'POLY_LARGE',
    codAmount: 2890,
    status: 'READY_TO_PACK',
    pickedRack: 'Z3-R04-S3-B05',
    items: [
      {
        sku: 'MC-103-ABAYA-MRN-54',
        title: 'Premium Dubai Cherry Abaya Set',
        color: 'Maroon',
        size: '54',
        qty: 1,
        price: 2890,
      },
    ],
  },
  {
    id: 'ORD-99205',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    memoCode: 'MEMO-MYSHOP-A',
    resellerName: 'Trendy Closet BD',
    resellerPhone: '01311-445566',
    resellerAddress: 'Moghbazar Wireless Gate, Dhaka',
    brandColor: '#059669',
    customerName: 'Rashedul Islam',
    customerPhone: '01521-409811',
    customerAddress: 'Chashara Balur Math, Narayanganj',
    city: 'Narayanganj',
    courier: 'Steadfast',
    consignmentId: 'CN-849205',
    trackingCode: 'TRK-STE-99205',
    packagingType: 'POLY_MEDIUM',
    codAmount: 1680,
    status: 'READY_TO_PACK',
    pickedRack: 'Z1-R01-S2-B03',
    items: [
      {
        sku: 'MC-101-CARGO-OLV-32',
        title: 'Six-Pocket Twill Cargo Trouser',
        color: 'Olive Green',
        size: '32',
        qty: 1,
        price: 1680,
      },
    ],
  },
  {
    id: 'ORD-99190',
    merchantCode: 'MC-102',
    merchantName: 'TechGear BD',
    memoCode: 'MEMO-DARAZ-BD',
    resellerName: 'Prime Electro Mart',
    resellerPhone: '01911-889900',
    resellerAddress: 'Level 4, Bashundhara City, Panthapath, Dhaka',
    brandColor: '#0284c7',
    customerName: 'Ashraful Alam',
    customerPhone: '01799-112233',
    customerAddress: 'Kandirpar, Cumilla',
    city: 'Cumilla',
    courier: 'Pathao',
    consignmentId: 'CN-849190',
    trackingCode: 'TRK-PTH-99190',
    packagingType: 'BOX_BUBBLE_SM',
    codAmount: 3150,
    status: 'PACKED',
    pickedRack: 'Z2-R02-S1-B01',
    packedAt: '11:20 AM',
    items: [
      {
        sku: 'MC-102-WATCH-AMOLED-SLV',
        title: 'Smart Watch AMOLED Calling Edition',
        color: 'Silver',
        size: '45MM',
        qty: 1,
        price: 3150,
      },
    ],
  },
];

export default function PackingStationPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<PackingOrder[]>(INITIAL_PACKING_ORDERS);
  const [activeTab, setActiveTab] = useState<PackingStatus>('READY_TO_PACK');
  const [merchantFilter, setMerchantFilter] = useState<'ALL' | MerchantCode>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(['ORD-99201', 'ORD-99202']);
  const [previewOrder, setPreviewOrder] = useState<PackingOrder | null>(null);
  const [lastBatchNotice, setLastBatchNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const readyCount = useMemo(
    () => orders.filter((o) => o.status === 'READY_TO_PACK').length,
    [orders],
  );
  const packedCount = useMemo(
    () => orders.filter((o) => o.status === 'PACKED').length,
    [orders],
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (order.status !== activeTab) return false;
      if (merchantFilter !== 'ALL' && order.merchantCode !== merchantFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchesItem = order.items.some(
        (item) =>
          item.sku.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.color.toLowerCase().includes(q) ||
          item.size.toLowerCase().includes(q),
      );
      return (
        order.id.toLowerCase().includes(q) ||
        order.merchantCode.toLowerCase().includes(q) ||
        order.merchantName.toLowerCase().includes(q) ||
        order.memoCode.toLowerCase().includes(q) ||
        order.resellerName.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q) ||
        order.city.toLowerCase().includes(q) ||
        matchesItem
      );
    });
  }, [orders, activeTab, merchantFilter, searchQuery]);

  const visibleOrderIds = useMemo(() => filteredOrders.map((o) => o.id), [filteredOrders]);

  const allVisibleSelected =
    visibleOrderIds.length > 0 && visibleOrderIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleOrderIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleOrderIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Orders rendered inside the hidden 4x6" thermal print portal
  const ordersToPrint = useMemo(() => {
    if (previewOrder) {
      return [previewOrder];
    }
    return orders.filter((o) => selectedIds.includes(o.id));
  }, [orders, selectedIds, previewOrder]);

  const executeThermalPrintAndMarkPacked = (targetIds: string[]) => {
    if (targetIds.length === 0) return;

    document.body.classList.add('printing-single-invoice');
    window.print();
    document.body.classList.remove('printing-single-invoice');

    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    setOrders((prev) =>
      prev.map((order) =>
        targetIds.includes(order.id)
          ? {
              ...order,
              status: 'PACKED',
              packedAt: timestamp,
            }
          : order,
      ),
    );

    setSelectedIds((prev) => prev.filter((id) => !targetIds.includes(id)));
    setLastBatchNotice(
      `Printed ${targetIds.length} Reseller Branded 4x6" Thermal Slip(s) (${targetIds.join(', ')}) and marked as PACKED.`,
    );
  };

  const handleBatchPrintSelected = () => {
    if (selectedIds.length === 0) return;
    setPreviewOrder(null);
    executeThermalPrintAndMarkPacked(selectedIds);
  };

  const handleSinglePreviewPrint = (order: PackingOrder) => {
    executeThermalPrintAndMarkPacked([order.id]);
    setPreviewOrder(null);
  };

  const handleResetDemoOrders = () => {
    setOrders(INITIAL_PACKING_ORDERS);
    setSelectedIds(['ORD-99201', 'ORD-99202']);
    setActiveTab('READY_TO_PACK');
    setLastBatchNotice('Demo packing queue restored to initial picked orders.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              ← Back to Admin Panel
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                  Module 07 · Multi-Select Thermal Station
                </span>
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  4x6&quot; Reseller Memo Standard (Zero Scanner / Zero Weight Gate)
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-1">
                Packing &amp; Multi-Select 4x6&quot; Thermal Print Station
              </h1>
            </div>
          </div>

          {/* Primary Batch Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={handleResetDemoOrders}
              className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 inline-flex items-center justify-center gap-1.5 transition-colors"
              title="Reset Demo Orders"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Reset Queue
            </button>

            <button
              type="button"
              onClick={handleBatchPrintSelected}
              disabled={selectedIds.length === 0}
              className={`w-full sm:w-auto px-4 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all shadow-lg ${
                selectedIds.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none'
              }`}
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Print Selected 4x6&quot; Invoices &amp; Mark Packed ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col gap-5">
        {/* Workflow Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Ready to Pack (Picked)
              </p>
              <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{readyCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Physically packed on table, awaiting 4x6&quot; label
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Selected for Batch Print
              </p>
              <p className="text-2xl font-black font-mono text-white mt-1">{selectedIds.length}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                1-Click prints all selected reseller memos
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Printer className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Packed (Done Today)
              </p>
              <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{packedCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ready for courier manifest handover
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Thermal Spec
              </p>
              <p className="text-lg font-black font-mono text-white mt-1">4&quot; × 6&quot; Sticker</p>
              <p className="text-[11px] text-emerald-400 mt-0.5">
                Reseller Branded Memo + Courier Barcode
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Batch Print Success Toast / Notice */}
        {lastBatchNotice && (
          <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-emerald-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{lastBatchNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setLastBatchNotice(null)}
              className="text-xs text-emerald-300 hover:text-white px-2 py-1 rounded self-end sm:self-auto"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Tabs + Merchant Filter + Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          {/* Status Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('READY_TO_PACK')}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between sm:justify-start gap-2 ${
                activeTab === 'READY_TO_PACK'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>Ready to Pack (Picked)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                  activeTab === 'READY_TO_PACK'
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {readyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PACKED')}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between sm:justify-start gap-2 ${
                activeTab === 'PACKED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>Packed (Done)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                  activeTab === 'PACKED'
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {packedCount}
              </span>
            </button>
          </div>

          {/* Merchant Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1.5">
              <span className="text-[11px] font-semibold text-slate-400 px-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                Merchant:
              </span>
              {(['ALL', 'MC-101', 'MC-102', 'MC-103'] as const).map((mc) => (
                <button
                  key={mc}
                  type="button"
                  onClick={() => setMerchantFilter(mc)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                    merchantFilter === mc
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mc}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-auto sm:min-w-[260px] flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order ID, Memo Code, SKU, Customer..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Multi-Select Checkbox Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 w-12">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                        aria-label="Select All Orders"
                      />
                    </label>
                  </th>
                  <th className="py-3.5 px-3">Order ID</th>
                  <th className="py-3.5 px-3">Merchant</th>
                  <th className="py-3.5 px-3">Reseller Branded Memo Code</th>
                  <th className="py-3.5 px-3">Customer &amp; City</th>
                  <th className="py-3.5 px-3">Product, Color/Size, 2-Part SKU &amp; Qty</th>
                  <th className="py-3.5 px-3">Courier</th>
                  <th className="py-3.5 px-3 text-right">COD Amount</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">4x6&quot; Thermal Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No orders found matching the selected tab or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isSelected = selectedIds.includes(order.id);
                    return (
                      <tr
                        key={order.id}
                        onClick={() => toggleSelectOne(order.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/25 hover:bg-emerald-950/35'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Row Checkbox */}
                        <td
                          className="py-4 px-4 align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(order.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 mt-1"
                            aria-label={`Select ${order.id}`}
                          />
                        </td>

                        {/* Order ID */}
                        <td className="py-4 px-3 align-top">
                          <div className="font-mono font-bold text-emerald-400 text-sm">
                            {order.id}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            Rack: {order.pickedRack}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            PKG: {order.packagingType}
                          </div>
                        </td>

                        {/* Merchant */}
                        <td className="py-4 px-3 align-top">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                            {order.merchantCode} · {order.merchantName}
                          </span>
                        </td>

                        {/* Reseller Branded Memo Code */}
                        <td className="py-4 px-3 align-top">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <Tag className="w-3 h-3 text-emerald-400" />
                            {order.memoCode}
                          </span>
                          <div className="text-xs font-semibold text-slate-200 mt-1">
                            {order.resellerName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Hotline: {order.resellerPhone}
                          </div>
                        </td>

                        {/* Customer Name, Phone, City */}
                        <td className="py-4 px-3 align-top">
                          <div className="font-semibold text-slate-100">{order.customerName}</div>
                          <div className="text-xs font-mono text-slate-300 mt-0.5">
                            {order.customerPhone}
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                            {order.city}
                          </span>
                        </td>

                        {/* Product Title + Color + Size + 2-Part SKU + Qty */}
                        <td className="py-4 px-3 align-top">
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-950/70 border border-slate-800 rounded-lg p-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="font-semibold text-xs text-slate-100">
                                    {item.title}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xs shrink-0">
                                    Qty: {item.qty}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                                  <span className="font-mono text-emerald-400 font-semibold">
                                    SKU: {item.sku}
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-300">
                                    Color: <strong>{item.color}</strong>
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-300">
                                    Size: <strong>{item.size}</strong>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Courier */}
                        <td className="py-4 px-3 align-top">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200">
                            <Truck className="w-3.5 h-3.5 text-emerald-400" />
                            {order.courier}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-1">
                            {order.consignmentId}
                          </div>
                        </td>

                        {/* COD Amount */}
                        <td className="py-4 px-3 align-top text-right">
                          <span className="font-mono font-black text-base text-white">
                            ৳{order.codAmount.toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-3 align-top text-center">
                          {order.status === 'READY_TO_PACK' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              READY_TO_PACK
                            </span>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                PACKED
                              </span>
                              {order.packedAt && (
                                <span className="text-[10px] font-mono text-slate-400 mt-1">
                                  at {order.packedAt}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Preview 4x6 Slip Button */}
                        <td
                          className="py-4 px-4 align-top text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setPreviewOrder(order)}
                            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview 4x6 Slip
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Single Order 4x6" Thermal Slip Preview Modal */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl">
            <div className="flex items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  4x6&quot; Thermal Sticker Preview · {previewOrder.memoCode}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {previewOrder.id} — {previewOrder.resellerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOrder(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 overflow-x-auto flex justify-center">
              <UnifiedThermalSticker
                orderId={previewOrder.id}
                memoCode={previewOrder.memoCode}
                resellerName={previewOrder.resellerName}
                resellerPhone={previewOrder.resellerPhone}
                resellerAddress={previewOrder.resellerAddress}
                brandColor={previewOrder.brandColor}
                customerName={previewOrder.customerName}
                customerPhone={previewOrder.customerPhone}
                customerAddress={previewOrder.customerAddress}
                city={previewOrder.city}
                codAmount={previewOrder.codAmount}
                courierProvider={previewOrder.courier.toUpperCase()}
                consignmentId={previewOrder.consignmentId}
                trackingCode={previewOrder.trackingCode}
                packagingType={previewOrder.packagingType}
                items={previewOrder.items}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 mt-5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewOrder(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 text-center"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => handleSinglePreviewPrint(previewOrder)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white inline-flex items-center justify-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print 4x6&quot; Slip &amp; Mark Packed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden 4x6" Thermal Print Portal attached directly to document.body */}
      {mounted &&
        createPortal(
          <div id="fulfillio-print-invoice-root" className="hidden">
            {ordersToPrint.map((order) => (
              <div
                key={order.id}
                className="fulfillio-thermal-page-break"
                style={{ pageBreakAfter: 'always' }}
              >
                <UnifiedThermalSticker
                  orderId={order.id}
                  memoCode={order.memoCode}
                  resellerName={order.resellerName}
                  resellerPhone={order.resellerPhone}
                  resellerAddress={order.resellerAddress}
                  brandColor={order.brandColor}
                  customerName={order.customerName}
                  customerPhone={order.customerPhone}
                  customerAddress={order.customerAddress}
                  city={order.city}
                  codAmount={order.codAmount}
                  courierProvider={order.courier.toUpperCase()}
                  consignmentId={order.consignmentId}
                  trackingCode={order.trackingCode}
                  packagingType={order.packagingType}
                  items={order.items}
                />
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
