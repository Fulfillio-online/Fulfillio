import React, { useRef, useState, useEffect } from 'react';
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
  CheckCircle2,
  Ban,
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
import { MerchantKycTab } from './profile-tabs/MerchantKycTab';
import { MerchantResellerMemosTab } from './profile-tabs/MerchantResellerMemosTab';
import { MerchantStockLedgerTab } from './profile-tabs/MerchantStockLedgerTab';

export interface MerchantProfileDrawerProps {
  merchant: MerchantRecord;
  allMerchants: MerchantRecord[];
  allOrders: MerchantOrderItem[];
  productsList: MerchantProductItem[];
  memosList: MerchantMemoItem[];
  onBack: () => void;
  onSwitchMerchant: (merchant: MerchantRecord) => void;
  onUpdateMerchant: (updated: MerchantRecord) => void;
  onReviewPayout?: (merchantId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) => void;
  onReviewKyc?: (merchantId: string, action: 'APPROVE' | 'REJECT', rejectionReason?: string) => void;
  onAdjustStock: (productId: string, delta: number) => void;
  onAddProduct: (newProduct: MerchantProductItem) => void;
  onApproveProduct: (productId: string, finalQty: number, finalBin: string) => void;
  onRejectProduct: (productId: string) => void;
}

const VALID_SUB_TABS: MerchantSubTab[] = [
  'overview',
  'profile',
  'kyc',
  'orders',
  'products',
  'payout',
  'ledger',
  'memo',
];

export function MerchantProfileDrawer({
  merchant,
  allMerchants,
  allOrders,
  productsList,
  memosList,
  onBack,
  onSwitchMerchant,
  onUpdateMerchant,
  onReviewPayout,
  onReviewKyc,
  onAdjustStock,
  onAddProduct,
  onApproveProduct,
  onRejectProduct,
}: MerchantProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<MerchantSubTab>('overview');
  const [orderPeriodFilter, setOrderPeriodFilter] = useState<OrderPeriodFilter>('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tabParam = new URLSearchParams(window.location.search).get('tab') as MerchantSubTab | null;
    if (tabParam && VALID_SUB_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [merchant.id]);

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

  const merchantAllProducts = productsList.filter(
    (p) => p.merchantCode === merchant.merchantCode
  );
  const merchantPendingCount = merchantAllProducts.filter(
    (p) => p.status === 'PENDING_APPROVAL' && !p.isDraft
  ).length;
  const merchantDraftCount = merchantAllProducts.filter(
    (p) => p.status === 'DRAFT' || Boolean(p.isDraft)
  ).length;
  const merchantProductsCount = Math.max(
    0,
    merchantAllProducts.length - merchantPendingCount - merchantDraftCount
  );
  // Overview metrics should only count live (approved / published) catalog items (exclude pending & draft).
  const liveProductsList = productsList.filter(
    (p) => p.status !== 'PENDING_APPROVAL' && p.status !== 'DRAFT' && !p.isDraft
  );

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
          className="inline-flex items-center gap-2 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Merchant List</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-300">Quick Switch:</span>
          <select
            value={merchant.id}
            onChange={(e) => {
              const target = allMerchants.find((m) => m.id === e.target.value);
              if (target) onSwitchMerchant(target);
            }}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
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
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-navy-900/90 shadow-xl overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              {merchant.avatarUrl ? (
                <img
                  src={merchant.avatarUrl}
                  alt={merchant.storeName}
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg border-2 border-orange-500/40"
                />
              ) : (
                <div
                  className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${merchant.avatarBg} flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border-2 border-white/10`}
                >
                  {merchant.avatarInitials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Profile Picture"
                className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-lg border-2 border-slate-100 dark:border-white/5 transition-transform hover:scale-105 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Merchant Identity Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-navy-800 dark:text-white tracking-tight">
                  {merchant.storeName}
                </h1>
                {merchant.verified && (
                  <ShieldCheck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                Owned by <strong className="text-navy-800 dark:text-slate-100">{merchant.ownerName}</strong> • ID:{' '}
                <span className="tabular-nums font-bold text-orange-600 dark:text-orange-400">
                  {merchant.merchantCode}
                </span>
              </p>

              {/* Status Badges */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    merchant.status === 'Active'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : merchant.status === 'Pending'
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  }`}
                >
                  {merchant.status}
                </span>
                {merchant.verified && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    Verified Merchant
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-white/15">
                  {merchant.deliveryArea}
                </span>
              </div>

              {/* Contact coordinates */}
              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 dark:text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> {merchant.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> {merchant.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Admin Actions (Direct 1-Click Approve / Suspend / Active) */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-white/10">
            {merchant.status === 'Pending' && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateMerchant({
                      ...merchant,
                      status: 'Active',
                      verified: true,
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                  title="Approve this merchant account"
                >
                  <CheckCircle2 className="w-4 h-4 pointer-events-none" />
                  <span>Approve Merchant</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateMerchant({
                      ...merchant,
                      status: 'Suspended',
                      verified: false,
                    });
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Reject or suspend merchant"
                >
                  <Ban className="w-3.5 h-3.5 pointer-events-none" />
                  <span>Reject</span>
                </button>
              </div>
            )}

            {merchant.status === 'Active' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved &amp; Active</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateMerchant({
                      ...merchant,
                      status: 'Suspended',
                      verified: false,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-navy-800 dark:hover:bg-rose-950/30 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 text-xs font-medium transition-colors cursor-pointer"
                  title="Suspend Merchant Account"
                >
                  Suspend
                </button>
              </div>
            )}

            {merchant.status === 'Suspended' && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-bold">
                  <Ban className="w-3.5 h-3.5" />
                  <span>Account Suspended</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateMerchant({
                      ...merchant,
                      status: 'Active',
                      verified: true,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                  title="Re-activate Merchant Account"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 pointer-events-none" />
                  <span>Re-activate Account</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 6 HORIZONTAL SUB-TABS */}
        <div className="flex items-center border-t border-slate-200 dark:border-white/10 px-6 overflow-x-auto bg-slate-50/60 dark:bg-navy-950/60">
          {[
            { id: 'overview' as const, label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'profile' as const, label: 'Store Profile', icon: <Store className="w-4 h-4" /> },
            {
              id: 'kyc' as const,
              label: 'KYC Verification',
              icon: <ShieldCheck className="w-4 h-4" />,
              pendingCount: merchant.kycData?.verificationStatus === 'PENDING_REVIEW' ? 1 : 0,
            },
            {
              id: 'orders' as const,
              label: 'Orders',
              icon: <ShoppingCart className="w-4 h-4" />,
              count: allOrders.filter((o) => o.merchantCode === merchant.merchantCode).length,
            },
            {
              id: 'products' as const,
              label: 'Products',
              icon: <Package className="w-4 h-4" />,
              count: merchantProductsCount,
              pendingCount: merchantPendingCount,
            },
            {
              id: 'payout' as const,
              label: 'Payout Info',
              icon: <CreditCard className="w-4 h-4" />,
              pendingCount: merchant.payoutAccount?.status === 'PENDING_REVIEW' ? 1 : 0,
            },
            { id: 'ledger' as const, label: 'Stock Proof Ledger', icon: <ShieldCheck className="w-4 h-4" /> },
            {
              id: 'memo' as const,
              label: 'Reseller Memos',
              icon: <Printer className="w-4 h-4" />,
              count: memosList.filter((m) => m.merchantCode === merchant.merchantCode).length,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-navy-800 dark:hover:text-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                        : 'bg-slate-200/80 dark:bg-navy-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.pendingCount && tab.pendingCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                    {tab.pendingCount} Pending
                  </span>
                ) : null}
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
          allProducts={liveProductsList}
        />
      )}

      {activeTab === 'profile' && (
        <MerchantStoreInfoTab
          merchant={merchant}
          onSave={onUpdateMerchant}
        />
      )}

      {activeTab === 'kyc' && (
        <MerchantKycTab
          merchant={merchant}
          onApproveKyc={
            onReviewKyc ? () => onReviewKyc(merchant.id, 'APPROVE') : undefined
          }
          onRejectKyc={
            onReviewKyc ? (reason) => onReviewKyc(merchant.id, 'REJECT', reason) : undefined
          }
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
          onApproveProduct={onApproveProduct}
          onRejectProduct={onRejectProduct}
          onNavigateSubTab={setActiveTab}
        />
      )}

      {activeTab === 'payout' && (
        <MerchantBankDetailsTab
          merchant={merchant}
          onApprovePayout={
            onReviewPayout ? () => onReviewPayout(merchant.id, 'APPROVE') : undefined
          }
          onRejectPayout={
            onReviewPayout ? (reason) => onReviewPayout(merchant.id, 'REJECT', reason) : undefined
          }
        />
      )}

      {activeTab === 'ledger' && (
        <MerchantStockLedgerTab merchant={merchant} />
      )}

      {activeTab === 'memo' && (
        <MerchantResellerMemosTab merchant={merchant} memos={memosList} />
      )}
    </div>
  );
}
