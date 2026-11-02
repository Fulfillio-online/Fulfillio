'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Warehouse,
  Boxes,
  ClipboardList,
  PackageCheck,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  CreditCard,
  Settings,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  ShieldAlert,
  FileText,
  BadgeDollarSign,
  ChevronRight,
  ChevronDown,
  Printer,
  Eye,
  Building2,
  Phone,
  MapPin,
  Landmark,
  X,
  Tag,
  Copy,
  Menu,
  Package,
} from 'lucide-react';
import { MerchantDirectoryManager } from '@/features/merchants/MerchantDirectoryManager';
import { WarehouseOrdersPipeline, PipelineMainTab } from '@/features/warehouse/WarehouseOrdersPipeline';
import { WarehouseProductsManager, WarehouseProductSubTab } from '@/features/warehouse/WarehouseProductsManager';
import { WarehouseDeliveryTracker } from '@/features/warehouse/WarehouseDeliveryTracker';
import { WarehouseReturnsManager, WarehouseStockCycleManager } from '@/features/warehouse/WarehouseReturnsManager';
import { CourierIntegrationManager } from '@/features/warehouse/CourierIntegrationManager';
import { UnifiedThermalSticker } from '@/features/thermal-print/UnifiedThermalSticker';

type SectionType =
  | 'dashboard'
  | 'merchants'
  | 'memos'
  | 'warehouse-products'
  | 'warehouse-orders'
  | 'warehouse-delivery'
  | 'warehouse-pick'
  | 'warehouse-dispatch'
  | 'warehouse-returns'
  | 'warehouse-stock'
  | 'billing'
  | 'settings-couriers';

export default function AdminPanelPage() {
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard');
  const [warehouseProductTab, setWarehouseProductTab] = useState<WarehouseProductSubTab>('all');
  const [warehouseOrderTab, setWarehouseOrderTab] = useState<PipelineMainTab>('all');
  const [isProductsExpanded, setIsProductsExpanded] = useState(false);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [merchantListResetTrigger, setMerchantListResetTrigger] = useState<number>(0);
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const [memoFilter, setMemoFilter] = useState<string>('ALL');
  const [printingMemo, setPrintingMemo] = useState<any | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handlePrintSingleMemo = (memo: any) => {
    setPrintingMemo(memo);
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-single-invoice');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-single-invoice');
      }, 80);
    }
  };

  // Mock State for Merchants with Full Profile Data
  const [merchants, setMerchants] = useState([
    {
      id: 'm-1',
      code: 'MC-101',
      name: 'Urban Threads BD',
      owner: 'Tariqul Rahman',
      email: 'founder@urbanthreads.com',
      phone: '+880 1711-234567',
      address: 'House 42, Road 11, Block-D, Banani, Dhaka-1213',
      bankDetails: {
        bankName: 'BRAC Bank PLC',
        accountName: 'Urban Threads BD Ltd.',
        accountNumber: '1501204892019001',
        routingNumber: '060271829',
        bkashMerchant: '01711234567',
      },
      joined: '2026-10-12',
      status: 'APPROVED',
      activeOrders: 142,
      totalProducts: 48,
      memoTemplates: ['MEMO-FESTIVE-01', 'MEMO-DARAZ-RES', 'MEMO-DEFAULT'],
    },
    {
      id: 'm-2',
      code: 'MC-102',
      name: 'Apex Footwear Store',
      owner: 'Mustafizur Karim',
      email: 'ops@apexfootwear.com',
      phone: '+880 1912-334455',
      address: 'Plot 18, Tejgaon Industrial Area, Dhaka-1208',
      bankDetails: {
        bankName: 'Eastern Bank Ltd (EBL)',
        accountName: 'Apex Retail Distribution',
        accountNumber: '1041060087421',
        routingNumber: '095261432',
        bkashMerchant: '01912334455',
      },
      joined: '2026-10-18',
      status: 'PENDING',
      activeOrders: 0,
      totalProducts: 24,
      memoTemplates: ['MEMO-APEX-POS'],
    },
    {
      id: 'm-3',
      code: 'MC-103',
      name: 'Gadget Freak Online',
      owner: 'Rashedul Anam',
      email: 'admin@gadgetfreak.bd',
      phone: '+880 1611-778899',
      address: 'Shop 402, Multiplan Center, Elephant Road, Dhaka-1205',
      bankDetails: {
        bankName: 'City Bank Ltd',
        accountName: 'Gadget Freak Technologies',
        accountNumber: '1102948201001',
        routingNumber: '225271890',
        bkashMerchant: '01611778899',
      },
      joined: '2026-09-30',
      status: 'APPROVED',
      activeOrders: 89,
      totalProducts: 112,
      memoTemplates: ['MEMO-TECH-SLIP', 'MEMO-WARRANTY-A4'],
    },
    {
      id: 'm-4',
      code: 'MC-104',
      name: 'Shajgoj Cosmetics Co.',
      owner: 'Nazia Tabassum',
      email: 'supply@shajgoj.com',
      phone: '+880 1799-112233',
      address: 'House 8, Road 27, Dhanmondi, Dhaka-1209',
      bankDetails: {
        bankName: 'Dutch-Bangla Bank (DBBL)',
        accountName: 'Shajgoj Beauty Retail',
        accountNumber: '1151200084729',
        routingNumber: '090271120',
        bkashMerchant: '01799112233',
      },
      joined: '2026-08-15',
      status: 'SUSPENDED',
      activeOrders: 0,
      totalProducts: 65,
      memoTemplates: ['MEMO-PINK-DEFAULT'],
    },
  ]);

  // Mock State for Reseller Memo Cards
  const [memos, setMemos] = useState([
    {
      id: 'memo-1',
      code: 'MEMO-FESTIVE-01',
      resellerName: 'Urban Threads Official',
      merchantName: 'Urban Threads BD',
      merchantCode: 'MC-101',
      phone: '+880 1711-234567',
      address: 'Banani, Dhaka',
      paperSize: '4x6 Thermal Sticker',
      isDefault: true,
      color: '#4f46e5',
      note: 'Thank you for shopping! Return within 7 days with invoice.',
      sampleItems: [
        { name: 'Heavyweight Hoodie (XL)', qty: 1, price: '৳ 3,450' },
      ],
      created: '2026-10-15',
    },
    {
      id: 'memo-2',
      code: 'MEMO-DARAZ-RES',
      resellerName: 'Daraz Express BD Store',
      merchantName: 'Urban Threads BD',
      merchantCode: 'MC-101',
      phone: '+880 1822-998877',
      address: 'Fulfilled via Daraz Partner Hub, Tejgaon',
      paperSize: '4x6 Thermal Sticker',
      isDefault: false,
      color: '#ea580c',
      note: 'Daraz verified reseller dispatch. Fragile items handled.',
      sampleItems: [
        { name: 'Oversized Tee (L)', qty: 2, price: '৳ 1,800' },
      ],
      created: '2026-10-18',
    },
    {
      id: 'memo-3',
      code: 'MEMO-APEX-POS',
      resellerName: 'Apex Footwear Outlet',
      merchantName: 'Apex Footwear Store',
      merchantCode: 'MC-102',
      phone: '+880 1912-334455',
      address: 'Tejgaon I/A, Dhaka',
      paperSize: '4x6 Thermal Sticker',
      isDefault: true,
      color: '#059669',
      note: '100% Genuine Leather Guarantee. Preserve box for claim.',
      sampleItems: [
        { name: 'Formal Oxford Shoes (Size 42)', qty: 1, price: '৳ 4,890' },
      ],
      created: '2026-10-18',
    },
    {
      id: 'memo-4',
      code: 'MEMO-TECH-SLIP',
      resellerName: 'Gadget Freak BD Reseller',
      merchantName: 'Gadget Freak Online',
      merchantCode: 'MC-103',
      phone: '+880 1611-778899',
      address: 'Elephant Road, Multiplan Center, Dhaka',
      paperSize: '4x6 Thermal Sticker',
      isDefault: true,
      color: '#0284c7',
      note: 'Official 1-Year Warranty. Unboxing video mandatory.',
      sampleItems: [
        { name: 'Wireless ANC Headphones', qty: 1, price: '৳ 6,500' },
      ],
      created: '2026-10-02',
    },
    {
      id: 'memo-5',
      code: 'MEMO-PINK-DEFAULT',
      resellerName: 'Shajgoj Beauty Hub',
      merchantName: 'Shajgoj Cosmetics Co.',
      merchantCode: 'MC-104',
      phone: '+880 1799-112233',
      address: 'Dhanmondi 27, Dhaka',
      paperSize: '4x6 Thermal Sticker',
      isDefault: true,
      color: '#db2777',
      note: 'Authentic Imported Cosmetics. Keep in cool dry place.',
      sampleItems: [
        { name: 'Hydrating Face Serum 50ml', qty: 1, price: '৳ 1,950' },
      ],
      created: '2026-08-20',
    },
  ]);

  // Mock State for Orders
  const [orders, setOrders] = useState([
    {
      id: 'ORD-9824',
      merchant: 'Urban Threads BD',
      customer: 'Tariqul Islam',
      itemsCount: 2,
      amount: '৳ 3,450',
      stockStatus: 'AVAILABLE',
      orderStatus: 'PICKING',
      memoCode: 'MEMO-FESTIVE-01',
      courier: 'Steadfast',
    },
    {
      id: 'ORD-9825',
      merchant: 'Urban Threads BD',
      customer: 'Nabila Hasan',
      itemsCount: 1,
      amount: '৳ 1,200',
      stockStatus: 'AVAILABLE',
      orderStatus: 'ALLOCATED',
      memoCode: 'MEMO-DEFAULT',
      courier: 'Pathao',
    },
    {
      id: 'ORD-9826',
      merchant: 'Gadget Freak Online',
      customer: 'Kazi Mahbub',
      itemsCount: 4,
      amount: '৳ 8,900',
      stockStatus: 'STOCK_OUT',
      orderStatus: 'BACKORDERED',
      memoCode: 'MEMO-TECH-SLIP',
      courier: 'RedX',
    },
    {
      id: 'ORD-9827',
      merchant: 'Urban Threads BD',
      customer: 'Sabbir Ahmed',
      itemsCount: 3,
      amount: '৳ 4,100',
      stockStatus: 'AVAILABLE',
      orderStatus: 'PACKED',
      memoCode: 'MEMO-FESTIVE-01',
      courier: 'Steadfast',
    },
  ]);

  // Couriers status
  const [couriers, setCouriers] = useState([
    { name: 'Steadfast Courier', code: 'STEADFAST', status: 'CONNECTED', activeConsignments: 284 },
    { name: 'Pathao Logistics', code: 'PATHAO', status: 'CONNECTED', activeConsignments: 195 },
    { name: 'RedX Express', code: 'REDX', status: 'CONNECTED', activeConsignments: 76 },
    { name: 'Paperfly 3PL', code: 'PAPERFLY', status: 'DISCONNECTED', activeConsignments: 0 },
  ]);

  const toggleMerchantStatus = (id: string, currentStatus: string) => {
    setMerchants(
      merchants.map((m) => {
        if (m.id === id) {
          const nextStatus = currentStatus === 'APPROVED' ? 'SUSPENDED' : 'APPROVED';
          return { ...m, status: nextStatus };
        }
        return m;
      }),
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Mobile / Tablet Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Slide-over Drawer on Mobile/Tablet, Fixed Sidebar on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-900 p-4 flex flex-col justify-between shrink-0 overflow-y-auto transition-transform duration-200 lg:static lg:w-64 lg:bg-slate-900/60 lg:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Header */}
          <div className="flex items-center justify-between gap-2.5 px-3 py-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-lg">
                F
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight block">Fulfillio</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Admin Control Panel
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {/* General */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3">
                Overview
              </span>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => {
                    setActiveSection('dashboard');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'dashboard'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </button>
              </div>
            </div>

            {/* Merchant Section */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3">
                Merchant Section
              </span>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => {
                    setActiveSection('merchants');
                    setMerchantListResetTrigger((prev) => prev + 1);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'merchants'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Merchant List
                </button>

                <button
                  onClick={() => {
                    setActiveSection('memos');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'memos'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Printer className="h-4 w-4" />
                  Memo / Invoice
                </button>
              </div>
            </div>

            {/* Warehouse Section */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3">
                Warehouse Section
              </span>
              <div className="mt-2 space-y-1">
                {/* 1. Primary Products Option (Above Orders) + Sub-Navigation (All Products, Product Approval, Warehouse Bins) */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (activeSection !== 'warehouse-products') {
                        setActiveSection('warehouse-products');
                        setIsProductsExpanded(true);
                      } else {
                        setIsProductsExpanded((prev) => !prev);
                      }
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === 'warehouse-products'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Package className="h-4 w-4" />
                      Products
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                        SKUs &amp; Bins
                      </span>
                      {isProductsExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-white/80" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Sub-options under Products: only visible when clicked / expanded */}
                  {isProductsExpanded && (
                    <div className="ml-4 pl-3 border-l border-slate-800 space-y-0.5 py-1">
                      {([
                        { id: 'all', label: 'All Products' },
                        { id: 'approval', label: 'Product Approval' },
                        { id: 'bins', label: 'Warehouse Bins' },
                      ] as { id: WarehouseProductSubTab; label: string }[]).map((sub) => {
                        const isSubActive =
                          activeSection === 'warehouse-products' && warehouseProductTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setActiveSection('warehouse-products');
                              setWarehouseProductTab(sub.id);
                              setIsProductsExpanded(true);
                              setIsMobileSidebarOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              isSubActive
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            <span>{sub.label}</span>
                            {isSubActive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Primary Orders Option + Sub-Navigation (All Orders, Pick, Pack, Dispatch) */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      if (activeSection !== 'warehouse-orders') {
                        setActiveSection('warehouse-orders');
                        setIsOrdersExpanded(true);
                      } else {
                        setIsOrdersExpanded((prev) => !prev);
                      }
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === 'warehouse-orders'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Boxes className="h-4 w-4" />
                      Orders
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                        Pipeline
                      </span>
                      {isOrdersExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-white/80" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Sub-options under Orders: only visible when clicked / expanded */}
                  {isOrdersExpanded && (
                    <div className="ml-4 pl-3 border-l border-slate-800 space-y-0.5 py-1">
                      {([
                        { id: 'all', label: 'All Orders' },
                        { id: 'pick', label: 'Pick' },
                        { id: 'pack', label: 'Pack' },
                        { id: 'dispatch', label: 'Dispatch' },
                      ] as { id: PipelineMainTab; label: string }[]).map((sub) => {
                        const isSubActive =
                          activeSection === 'warehouse-orders' && warehouseOrderTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              setActiveSection('warehouse-orders');
                              setWarehouseOrderTab(sub.id);
                              setIsOrdersExpanded(true);
                              setIsMobileSidebarOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              isSubActive
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                          >
                            <span>{sub.label}</span>
                            {isSubActive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Dedicated Post-Dispatch Delivery & Merchant Parcel Tracker (Separate from Orders Pipeline) */}
                <button
                  onClick={() => {
                    setActiveSection('warehouse-delivery');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'warehouse-delivery'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Truck className="h-4 w-4" />
                    Delivery & Dispatch
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20">
                    Tracker
                  </span>
                </button>

                {/* Direct Link to Packing Station */}
                <Link
                  href="/wms/packing"
                  target="_blank"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <PackageCheck className="h-4 w-4" />
                    <span>Packing Station</span>
                  </div>
                  <ExternalLink className="h-3 w-3" />
                </Link>

                <button
                  onClick={() => {
                    setActiveSection('warehouse-returns');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'warehouse-returns'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                  Returns & RTO
                </button>

                <button
                  onClick={() => {
                    setActiveSection('warehouse-stock');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'warehouse-stock'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Stock & Cycle Count
                </button>
              </div>
            </div>

            {/* Billing & Settings */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3">
                Financials & Settings
              </span>
              <div className="mt-2 space-y-1">
                <button
                  onClick={() => {
                    setActiveSection('billing');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'billing'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Billing & COD Settlement
                </button>

                <button
                  onClick={() => {
                    setActiveSection('settings-couriers');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === 'settings-couriers'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Courier Integration
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* User Badge & Switcher */}
        <div className="border-t border-slate-800 pt-3 space-y-2 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-200 block">Super Admin</span>
              <span>admin@fulfillio.online</span>
            </div>
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Exit
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-800/60">
            <Link
              href="/merchant"
              className="w-full flex items-center justify-between p-2 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 text-indigo-300 font-semibold transition-colors"
            >
              <span>Open Merchant Portal</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 bg-slate-900/40 sticky top-0 z-10 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 hover:text-emerald-400 shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden sm:inline text-slate-500 text-sm">Fulfillio 3PL</span>
            <ChevronRight className="hidden sm:inline h-4 w-4 text-slate-600" />
            <span className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-200 truncate">
              {activeSection.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search orders, SKU, merchants..."
                className="pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2.5 sm:px-3 py-1.5 rounded-lg shrink-0">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">All 3PL Nodes Healthy</span>
              <span className="sm:hidden">Live</span>
            </div>
          </div>
        </header>

        {/* Section Content */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ================= 1. DASHBOARD OVERVIEW ================= */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Executive 3PL Dashboard</h1>
                <p className="text-sm text-slate-400">
                  Real-time warehouse metrics, active merchant integrations, and pending dispatches.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs uppercase font-semibold text-slate-400">Today's Orders</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold mt-2">1,248</div>
                  <span className="text-xs text-emerald-400 mt-1 inline-block">+14.2% from yesterday</span>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs uppercase font-semibold text-slate-400">Ready for Pick</span>
                    <ClipboardList className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-bold mt-2">384</div>
                  <span className="text-xs text-indigo-400 mt-1 inline-block">Across 4 zones</span>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs uppercase font-semibold text-slate-400">Dispatched Today</span>
                    <Truck className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-bold mt-2">860</div>
                  <span className="text-xs text-slate-400 mt-1 inline-block">3 courier collection waves</span>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex justify-between items-start">
                    <span className="text-xs uppercase font-semibold text-slate-400">Pending COD Remittance</span>
                    <BadgeDollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold mt-2">৳ 4.82M</div>
                  <span className="text-xs text-slate-400 mt-1 inline-block">Settlement scheduled Friday</span>
                </div>
              </div>

              {/* Quick Actions & Recent Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-base">Warehouse Operational Flow</h2>
                    <span className="text-xs text-slate-500 font-mono">Live Sync</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-xs text-slate-400 font-medium">1. Wave Picking</span>
                      <div className="text-xl font-bold text-slate-100 mt-1">42 Waves</div>
                      <span className="text-[11px] text-emerald-400">12 Processing</span>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-xs text-slate-400 font-medium">2. Packing Station</span>
                      <div className="text-xl font-bold text-slate-100 mt-1">6 Active Stations</div>
                      <span className="text-[11px] text-indigo-400">Barcode Scan Live</span>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60">
                      <span className="text-xs text-slate-400 font-medium">3. Courier Handover</span>
                      <div className="text-xl font-bold text-slate-100 mt-1">3 Manifests Ready</div>
                      <span className="text-[11px] text-amber-400">Awaiting Drivers</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Atomic inventory locks active: 0 oversold items recorded this month.</span>
                    <button
                      onClick={() => setActiveSection('warehouse-orders')}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      View All Orders <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h2 className="font-bold text-base mb-3">Operator Quick Access</h2>
                    <div className="space-y-2">
                      <Link
                        href="/wms/packing"
                        target="_blank"
                        className="w-full p-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-sm text-white flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <PackageCheck className="h-4 w-4" />
                          <span>Open Packing Station #1</span>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        onClick={() => setActiveSection('merchants')}
                        className="w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-sm text-slate-200 flex items-center justify-between transition-colors border border-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-400" />
                          <span>Approve Pending Merchants (1)</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setActiveSection('settings-couriers')}
                        className="w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-sm text-slate-200 flex items-center justify-between transition-colors border border-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-amber-400" />
                          <span>Courier Sync Status</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 mt-4 block">
                    Fulfillio Modular Monolith v0.1.0 • Node v25
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. MERCHANT LIST & DRILL-DOWN PROFILE SECTION ================= */}
          {activeSection === 'merchants' && (
            <MerchantDirectoryManager resetTrigger={merchantListResetTrigger} />
          )}

          {false && activeSection === 'merchants' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Merchant Profiles & Verification</h1>
                  <p className="text-sm text-slate-400">
                    Inspect verified merchant profiles, auto-assigned Merchant Codes, payout bank accounts, and active products.
                  </p>
                </div>
              </div>

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Total Registered</span>
                  <div className="text-2xl font-bold mt-1 text-slate-100">{merchants.length} Stores</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Active (Approved)</span>
                  <div className="text-2xl font-bold mt-1 text-emerald-400">
                    {merchants.filter((m) => m.status === 'APPROVED').length}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Pending Review</span>
                  <div className="text-2xl font-bold mt-1 text-amber-400">
                    {merchants.filter((m) => m.status === 'PENDING').length}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Total Active SKUs</span>
                  <div className="text-2xl font-bold mt-1 text-indigo-400">
                    {merchants.reduce((acc, m) => acc + (m.totalProducts || 0), 0)} SKUs
                  </div>
                </div>
              </div>

              {/* Merchant Profiles Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Merchant Code & Store</th>
                      <th className="p-4">Owner Contact</th>
                      <th className="p-4">Bank / Payout Info</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">SKUs</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {merchants.map((merchant) => (
                      <tr key={merchant.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-1 rounded bg-indigo-950/80 text-indigo-300 font-mono text-xs font-bold border border-indigo-800/80">
                              {merchant.code}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-200">{merchant.name}</div>
                              <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 text-slate-500" />
                                {merchant.address.split(',')[0]}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-xs text-slate-300 font-medium">{merchant.owner}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{merchant.phone}</div>
                          <div className="text-xs text-slate-500 font-mono">{merchant.email}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                            <Landmark className="h-3.5 w-3.5 text-emerald-400" />
                            <span>{merchant.bankDetails.bankName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            A/C: ••••{merchant.bankDetails.accountNumber.slice(-4)}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-mono">
                            bKash: {merchant.bankDetails.bkashMerchant}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              merchant.status === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : merchant.status === 'PENDING'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {merchant.status}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-300">
                          {merchant.totalProducts}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedMerchant(merchant)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5 text-indigo-400" />
                              View Profile
                            </button>
                            <button
                              onClick={() => toggleMerchantStatus(merchant.id, merchant.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                merchant.status === 'APPROVED'
                                  ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              {merchant.status === 'APPROVED' ? 'Suspend' : 'Approve'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2.1 MEMO / INVOICE SECTION ================= */}
          {activeSection === 'memos' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Memo / Invoice</h1>
                  <p className="text-sm text-slate-400">
                    All custom branded 4x6&quot; invoice &amp; memo slips designed by merchants. Click Print Test to print only the selected 4x6&quot; invoice.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filter Merchant:</span>
                  <select
                    value={memoFilter}
                    onChange={(e) => setMemoFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">All Merchants ({memos.length})</option>
                    {merchants.map((m) => (
                      <option key={m.id} value={m.code}>
                        {m.name} ({m.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Memo Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memos
                  .filter((m) => memoFilter === 'ALL' || m.merchantCode === memoFilter)
                  .map((memo) => (
                    <div
                      key={memo.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                    >
                      {/* Card Header */}
                      <div className="p-4 border-b border-slate-800/80 bg-slate-900 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[11px] font-bold border border-indigo-800">
                              {memo.code}
                            </span>
                            {memo.isDefault && (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-semibold border border-emerald-800">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block mt-1">
                            Owner: <span className="text-slate-200 font-semibold">{memo.merchantName}</span> ({memo.merchantCode})
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">
                          {memo.paperSize}
                        </span>
                      </div>

                      {/* Card Body — Visual 4x6 Thermal Sticker Preview */}
                      <div className="p-4 flex-1">
                        <div className="rounded-xl border-2 border-dashed border-slate-700 bg-white text-slate-950 p-4 shadow-inner space-y-3 font-sans text-xs">
                          {/* Reseller Branding Header */}
                          <div className="text-center pb-2 border-b border-slate-200">
                            <div
                              className="font-black text-sm uppercase tracking-wide"
                              style={{ color: memo.color }}
                            >
                              {memo.resellerName}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">{memo.phone}</div>
                            <div className="text-[10px] text-slate-500">{memo.address}</div>
                          </div>

                          {/* Sample Order Data */}
                          <div className="space-y-1.5 py-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                              <span>Customer: Tariqul Islam</span>
                              <span className="font-mono">#ORD-9824</span>
                            </div>
                            <div className="text-[10px] text-slate-600">Banani Block-D, Dhaka</div>
                          </div>

                          {/* Line Items Table Mockup */}
                          <div className="border-t border-b border-slate-200 py-1.5 space-y-1">
                            {memo.sampleItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-[11px]">
                                <span>{item.name} x {item.qty}</span>
                                <span className="font-mono font-bold">{item.price}</span>
                              </div>
                            ))}
                          </div>

                          {/* COD Amount Banner */}
                          <div className="bg-slate-100 rounded p-1.5 flex justify-between items-center font-bold text-[11px]">
                            <span>Cash on Delivery (COD):</span>
                            <span className="font-mono text-sm text-slate-900">৳ 3,450</span>
                          </div>

                          {/* Reseller Policy Footer */}
                          <div className="text-[9px] text-center text-slate-500 italic pt-1">
                            "{memo.note}"
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 font-mono">Created: {memo.created}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(memo.code);
                              alert(`Copied Memo Code: ${memo.code}`);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            Copy Code
                          </button>
                          <button
                            onClick={() => handlePrintSingleMemo(memo)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Printer className="h-3 w-3" />
                            Print Test
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Isolated 4x6" Print Portal for Admin Memo / Invoice Section */}
              {printingMemo &&
                typeof document !== 'undefined' &&
                createPortal(
                  <div id="fulfillio-print-invoice-root" className="hidden">
                    <UnifiedThermalSticker
                      orderId="ORD-9824"
                      memoCode={printingMemo.code}
                      resellerName={printingMemo.resellerName}
                      resellerPhone={printingMemo.phone}
                      resellerAddress={printingMemo.address}
                      brandColor={printingMemo.color}
                      footerTerms={printingMemo.note}
                      customerName="Tariqul Islam"
                      customerPhone="01711-234567"
                      customerAddress="Banani Block-D, Dhaka"
                      city="Dhaka"
                      codAmount={3450}
                      courierProvider="STEADFAST"
                      consignmentId="CN-982401"
                      trackingCode="TRK-STE-982401"
                      packagingType="POLY_SMALL"
                      items={printingMemo.sampleItems.map((it: any, idx: number) => ({
                        sku: `${printingMemo.merchantCode}-ITEM-0${idx + 1}`,
                        title: it.name,
                        color: 'STD',
                        size: 'XL',
                        qty: it.qty,
                        price: Number(String(it.price).replace(/[^\d]/g, '')) || 1800,
                      }))}
                    />
                  </div>,
                  document.body,
                )}
            </div>
          )}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3.0 WAREHOUSE: PRODUCTS (All Products, Product Approval, Warehouse Bins) ================= */}
          {activeSection === 'warehouse-products' && (
            <WarehouseProductsManager
              activeTab={warehouseProductTab}
              onTabChange={setWarehouseProductTab}
            />
          )}

          {/* ================= 3.1 WAREHOUSE: ORDERS PIPELINE (All Orders, Pick, Pack, Dispatch) ================= */}
          {activeSection === 'warehouse-orders' && (
            <WarehouseOrdersPipeline
              activeTab={warehouseOrderTab}
              onTabChange={setWarehouseOrderTab}
              onOpenDeliveryTracker={() => setActiveSection('warehouse-delivery')}
            />
          )}

          {/* ================= 3.2 WAREHOUSE: DELIVERY & DISPATCH TRACKER (Post-Dispatch Parcel Status & Merchant Stats) ================= */}
          {activeSection === 'warehouse-delivery' && (
            <WarehouseDeliveryTracker
              onOpenReturns={() => setActiveSection('warehouse-returns')}
            />
          )}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 4. WAREHOUSE: PICK LIST ================= */}
          {activeSection === 'warehouse-pick' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Wave Picking Management</h1>
                <p className="text-sm text-slate-400">
                  Batched warehouse travel routes grouped by zone and bin coordinates.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">Active Wave #WAVE-1092</h3>
                    <p className="text-xs text-slate-400">Assigned Operator: Picker 04 • Zone A & B</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-950 text-indigo-400 border border-indigo-800">
                    IN PROGRESS (18/24 Items)
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-400">BIN: A-01-02-03</span>
                      <h4 className="font-semibold text-sm">Premium Heavyweight Hoodie (Black / XL)</h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
                      Picked (x3)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="font-mono text-xs font-bold text-amber-400">BIN: B-04-01-01</span>
                      <h4 className="font-semibold text-sm">Embroidered Baseball Cap (Navy / OS)</h4>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-700 px-2.5 py-1 rounded">
                      Pending Pick (x2)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. WAREHOUSE: DISPATCH ================= */}
          {activeSection === 'warehouse-dispatch' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Courier Dispatch & Manifests</h1>
                <p className="text-sm text-slate-400">
                  Handover manifests ready for courier driver collection and signature.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {couriers.map((courier) => (
                  <div key={courier.code} className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-base">{courier.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {courier.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold mt-3">{courier.activeConsignments} Parcels</p>
                      <span className="text-xs text-slate-400">Ready for 4:00 PM Handover</span>
                    </div>

                    <button className="mt-6 w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 transition-colors">
                      Print Driver Manifest (PDF)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. WAREHOUSE: RETURNS & RTO INTAKE (Auto-Restock to Bin) ================= */}
          {activeSection === 'warehouse-returns' && (
            <WarehouseReturnsManager
              onOpenProducts={() => {
                setActiveSection('warehouse-products');
                setWarehouseProductTab('all');
              }}
            />
          )}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 7. WAREHOUSE: STOCK ADJUSTMENT & CYCLE COUNTS ================= */}
          {activeSection === 'warehouse-stock' && (
            <WarehouseStockCycleManager
              onOpenReturns={() => setActiveSection('warehouse-returns')}
            />
          )}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 8. BILLING & COD SETTLEMENT ================= */}
          {activeSection === 'billing' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Billing & COD Settlement</h1>
                <p className="text-sm text-slate-400">
                  Reconcile courier COD remittance, deduct warehouse storage & pick-and-pack fees, and issue merchant payouts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Gross COD Collected</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-2">৳ 4,821,500</div>
                  <span className="text-xs text-slate-500">Last 7 days from Steadfast & Pathao</span>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Fulfillment & Storage Fees</span>
                  <div className="text-2xl font-bold text-indigo-400 mt-2">৳ 328,400</div>
                  <span className="text-xs text-slate-500">Pick-and-pack & shelf rental fees</span>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Net Merchant Payout</span>
                  <div className="text-2xl font-bold text-slate-100 mt-2">৳ 4,493,100</div>
                  <span className="text-xs text-emerald-400 font-semibold">Ready for bank disbursement</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 9. SETTINGS: COURIER INTEGRATION ================= */}
          {activeSection === 'settings-couriers' && <CourierIntegrationManager />}

          {/* ================= MERCHANT PROFILE DETAILS MODAL ================= */}
          {selectedMerchant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 font-mono text-base">
                      {selectedMerchant.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-100">{selectedMerchant.name}</h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            selectedMerchant.status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : selectedMerchant.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {selectedMerchant.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered on {selectedMerchant.joined} • Merchant ID: {selectedMerchant.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Profile Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Owner & Contact
                    </span>
                    <div className="text-slate-200 font-medium text-sm">{selectedMerchant.owner}</div>
                    <div className="text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-400" />
                      {selectedMerchant.phone}
                    </div>
                    <div className="text-slate-400 font-mono">{selectedMerchant.email}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">
                      Verified Pickup Address
                    </span>
                    <div className="text-slate-300 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{selectedMerchant.address}</span>
                    </div>
                  </div>
                </div>

                {/* Payout & Settlement Setup */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                      <Landmark className="h-4 w-4 text-emerald-400" />
                      <span>COD Payout & Settlement Account</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Cheque Leaf
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Provider / Bank:</span>
                      <span className="font-semibold text-slate-200">{selectedMerchant.bankDetails.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Name:</span>
                      <span className="font-medium text-slate-200">{selectedMerchant.bankDetails.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Account Number:</span>
                      <span className="font-mono text-emerald-400 font-semibold">{selectedMerchant.bankDetails.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Routing Number:</span>
                      <span className="font-mono text-slate-300">{selectedMerchant.bankDetails.routingNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">bKash Merchant:</span>
                      <span className="font-mono text-rose-400 font-bold">{selectedMerchant.bankDetails.bkashMerchant}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cheque Leaf Document:</span>
                      <span className="font-mono text-[11px] text-indigo-300 font-medium">cheque_leaf_verified_2026.png</span>
                    </div>
                  </div>
                </div>

                {/* Merchant Store Stats & Reseller Memos */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Assigned Reseller Memo Templates ({selectedMerchant.memoTemplates.length})
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedMerchant.memoTemplates.map((code: string) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono font-medium text-indigo-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedMerchant(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      toggleMerchantStatus(selectedMerchant.id, selectedMerchant.status);
                      setSelectedMerchant(null);
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      selectedMerchant.status === 'APPROVED'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {selectedMerchant.status === 'APPROVED' ? 'Suspend Merchant' : 'Approve Merchant'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
