import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  ShieldCheck,
  Mail,
  Phone,
  LayoutDashboard,
  Store,
  ShoppingCart,
  Package,
  CreditCard,
  Printer,
} from 'lucide-react';
import {
  MerchantRecord,
  MerchantSubTab,
  MerchantOrderItem,
  MerchantProductItem,
  MerchantMemoItem,
  OrderPeriodFilter,
} from '../types';
import { resizeAvatar } from '../mockData';
import { MerchantOverviewTab } from './profile-tabs/MerchantOverviewTab';
import { MerchantStoreInfoTab } from './profile-tabs/MerchantStoreInfoTab';
import { MerchantOrdersTab } from './profile-tabs/MerchantOrdersTab';
import { MerchantProductsTab } from './profile-tabs/MerchantProductsTab';
import { MerchantBankDetailsTab } from './profile-tabs/MerchantBankDetailsTab';
import { MerchantResellerMemosTab } from './profile-tabs/MerchantResellerMemosTab';

export interface MerchantProfileDrawerProps {
  merchant: MerchantRecord;
  allMerchants: MerchantRecord[];
  allOrders: MerchantOrderItem[];
  productsList: MerchantProductItem[];
  memosList: MerchantMemoItem[];
  onBack: () => void;
  onSwitchMerchant: (merchant: MerchantRecord) => void;
  onUpdateMerchant: (updated: MerchantRecord) => void;
  onAdjustStock: (productId: string, delta: number) => void;
  onAddProduct: (newProduct: MerchantProductItem) => void;
}

export function MerchantProfileDrawer({
  merchant,
  allMerchants,
  allOrders,
  productsList,
  memosList,
  onBack,
  onSwitchMerchant,
  onUpdateMerchant,
  onAdjustStock,
  onAddProduct,
}: MerchantProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<MerchantSubTab>('overview');
  const [orderPeriodFilter, setOrderPeriodFilter] = useState<OrderPeriodFilter>('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeAvatar(file);
      onUpdateMerchant({ ...merchant, avatarUrl: dataUrl });
    } catch (err) {
      console.error('Avatar upload failed', err);
    }
  };

  const merchantProductsCount = productsList.filter(
    (p) => p.merchantCode === merchant.merchantCode
  ).length;

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Avatar */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      {/* Top Back Navigation & Merchant Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Merchant List</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Quick Switch:</span>
          <select
            value={merchant.id}
            onChange={(e) => {
              const target = allMerchants.find((m) => m.id === e.target.value);
              if (target) onSwitchMerchant(target);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
          >
            {allMerchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.merchantCode} — {m.storeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* HERO IDENTITY CARD */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              {merchant.avatarUrl ? (
                <img
                  src={merchant.avatarUrl}
                  alt={merchant.storeName}
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg border-2 border-emerald-500/40"
                />
              ) : (
                <div
                  className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${merchant.avatarBg} flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-white/10`}
                >
                  {merchant.avatarInitials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Profile Picture"
                className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-slate-900 transition-transform hover:scale-105 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Merchant Identity Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {merchant.storeName}
                </h1>
                {merchant.verified && (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                )}
              </div>

              <p className="text-xs text-slate-400">
                Owned by <strong className="text-slate-200">{merchant.ownerName}</strong> • ID:{' '}
                <span className="font-mono font-bold text-emerald-400">
                  {merchant.merchantCode}
                </span>
              </p>

              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {merchant.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Verified Merchant
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {merchant.deliveryArea}
                </span>
              </div>

              {/* Contact coordinates */}
              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {merchant.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {merchant.phone}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 HORIZONTAL SUB-TABS */}
        <div className="flex items-center border-t border-slate-800 px-6 overflow-x-auto bg-slate-950/60">
          {[
            { id: 'overview' as const, label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'profile' as const, label: 'Store Profile', icon: <Store className="w-4 h-4" /> },
            { id: 'orders' as const, label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
            { id: 'products' as const, label: `Products (${merchantProductsCount})`, icon: <Package className="w-4 h-4" /> },
            { id: 'payout' as const, label: 'Payout Info', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'memo' as const, label: 'Reseller Memos', icon: <Printer className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 font-extrabold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE SUB-TAB CONTENT */}
      {activeTab === 'overview' && (
        <MerchantOverviewTab
          merchant={merchant}
          orderPeriodFilter={orderPeriodFilter}
          onPeriodChange={setOrderPeriodFilter}
          onNavigateSubTab={setActiveTab}
          onSelectOrderStatusFilter={setOrderStatusFilter}
          allOrders={allOrders}
          allProducts={productsList}
        />
      )}

      {activeTab === 'profile' && (
        <MerchantStoreInfoTab
          merchant={merchant}
          onSave={onUpdateMerchant}
        />
      )}

      {activeTab === 'orders' && (
        <MerchantOrdersTab
          merchant={merchant}
          allOrders={allOrders}
          defaultStatusFilter={orderStatusFilter}
        />
      )}

      {activeTab === 'products' && (
        <MerchantProductsTab
          merchant={merchant}
          productsList={productsList}
          onAdjustStock={onAdjustStock}
          onAddProduct={onAddProduct}
        />
      )}

      {activeTab === 'payout' && (
        <MerchantBankDetailsTab merchant={merchant} />
      )}

      {activeTab === 'memo' && (
        <MerchantResellerMemosTab merchant={merchant} memos={memosList} />
      )}
    </div>
  );
}
