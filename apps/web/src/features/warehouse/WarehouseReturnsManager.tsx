'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Package,
  Search,
  Plus,
  MapPin,
  Truck,
  ArrowRight,
  SlidersHorizontal,
  ShieldAlert,
  Sparkles,
  Box,
  Clock,
  X,
} from 'lucide-react';
import { PRESET_THUMBNAILS, WarehouseProductItem } from './WarehouseProductsManager';

export type ReturnStatus = 'PENDING_INSPECTION' | 'RESTOCKED' | 'DAMAGED';

export interface WarehouseReturnRecord {
  id: string;
  orderId: string;
  trackingCode: string;
  courier: 'Steadfast' | 'Pathao' | 'RedX';
  merchantCode: string;
  merchantName: string;
  productTitle: string;
  fullSku: string;
  qty: number;
  targetBin: string;
  currentStockSnapshot: number;
  returnReason: string;
  status: ReturnStatus;
  receivedAt: string;
  processedAt?: string;
  inspectorNote?: string;
  imageUrl: string;
}

export interface StockAuditLogItem {
  id: string;
  timestamp: string;
  merchantCode: string;
  fullSku: string;
  productTitle: string;
  binCode: string;
  deltaQty: number;
  previousStock: number;
  newStock: number;
  type: 'RTO_RESTOCK' | 'CYCLE_SURPLUS' | 'DAMAGE_WRITEOFF' | 'MANUAL_RESTOCK';
  reason: string;
  referenceId: string;
}

const AVAILABLE_BINS = [
  'A-01-02',
  'A-01-04',
  'A-02-01',
  'B-01-03',
  'B-03-01',
  'B-03-04',
  'C-01-01',
  'C-01-02',
  'D-01-01',
];

const INITIAL_RETURNS: WarehouseReturnRecord[] = [
  {
    id: 'RTO-501',
    orderId: 'ORD-9825',
    trackingCode: 'RX-9902890',
    courier: 'RedX',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    productTitle: 'Ripstop Multi-Pocket Cargo Pants',
    fullSku: 'MC-102-CARGO-OLV-32',
    qty: 1,
    targetBin: 'B-03-01',
    currentStockSnapshot: 68,
    returnReason: 'Customer unreachable on phone (3 delivery attempts)',
    status: 'PENDING_INSPECTION',
    receivedAt: 'Today, 12:15 PM',
    imageUrl: PRESET_THUMBNAILS[5]?.url || '',
  },
  {
    id: 'RTO-502',
    orderId: 'ORD-9806',
    trackingCode: 'SF-8838420',
    courier: 'Steadfast',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    productTitle: 'Handcrafted Full-Grain Chelsea Boots',
    fullSku: 'MC-103-CHELSEA-BRN-42',
    qty: 1,
    targetBin: 'C-01-01',
    currentStockSnapshot: 34,
    returnReason: 'Customer requested size exchange at doorstep',
    status: 'PENDING_INSPECTION',
    receivedAt: 'Today, 11:40 AM',
    imageUrl: PRESET_THUMBNAILS[6]?.url || '',
  },
  {
    id: 'RTO-503',
    orderId: 'ORD-9819',
    trackingCode: 'PTH-5528319',
    courier: 'Pathao',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    productTitle: 'Arctic Fleece Heavyweight Hoodie',
    fullSku: 'MC-101-HOODIE-BLK-XL',
    qty: 2,
    targetBin: 'A-01-02',
    currentStockSnapshot: 84,
    returnReason: 'Customer away from Dhaka — refused delivery',
    status: 'PENDING_INSPECTION',
    receivedAt: 'Today, 10:05 AM',
    imageUrl: PRESET_THUMBNAILS[0]?.url || '',
  },
  {
    id: 'RTO-504',
    orderId: 'ORD-9812',
    trackingCode: 'SF-8837901',
    courier: 'Steadfast',
    merchantCode: 'MC-104',
    merchantName: 'Gadget Freak Online',
    productTitle: 'SonicWave Pro Hybrid ANC Earbuds',
    fullSku: 'MC-104-ANC-BUDS-BLK',
    qty: 1,
    targetBin: 'D-01-01',
    currentStockSnapshot: 95,
    returnReason: 'Duplicate order placed by customer',
    status: 'PENDING_INSPECTION',
    receivedAt: 'Yesterday, 06:20 PM',
    imageUrl: PRESET_THUMBNAILS[8]?.url || '',
  },
  {
    id: 'RTO-505',
    orderId: 'ORD-9794',
    trackingCode: 'PTH-5526110',
    courier: 'Pathao',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    productTitle: 'Royal Pique Classic Polo Shirt',
    fullSku: 'MC-101-POLO-NVY-L',
    qty: 2,
    targetBin: 'A-01-04',
    currentStockSnapshot: 110,
    returnReason: 'Customer unreachable — QC passed & restocked to Bin A-01-04',
    status: 'RESTOCKED',
    receivedAt: 'Yesterday, 03:10 PM',
    processedAt: 'Yesterday, 04:00 PM',
    inspectorNote: 'Polybag intact, tags verified. Added +2 units to Bin A-01-04.',
    imageUrl: PRESET_THUMBNAILS[1]?.url || '',
  },
  {
    id: 'RTO-506',
    orderId: 'ORD-9788',
    trackingCode: 'RX-9901402',
    courier: 'RedX',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    productTitle: 'AeroFoam Nitro Marathon Sneakers',
    fullSku: 'MC-103-RUNNER-TEAL-43',
    qty: 1,
    targetBin: 'C-01-02',
    currentStockSnapshot: 52,
    returnReason: 'Outer box crushed during courier return transit',
    status: 'DAMAGED',
    receivedAt: '2 days ago',
    processedAt: '2 days ago',
    inspectorNote: 'Box crushed & sole scuffed — held in Quarantine for courier claim.',
    imageUrl: PRESET_THUMBNAILS[7]?.url || '',
  },
];

const INITIAL_AUDIT_LOG: StockAuditLogItem[] = [
  {
    id: 'AUD-901',
    timestamp: 'Yesterday, 04:00 PM',
    merchantCode: 'MC-101',
    fullSku: 'MC-101-POLO-NVY-L',
    productTitle: 'Royal Pique Classic Polo Shirt',
    binCode: 'A-01-04',
    deltaQty: 2,
    previousStock: 110,
    newStock: 112,
    type: 'RTO_RESTOCK',
    reason: 'Returned parcel RTO-505 (ORD-9794) passed QC inspection & restocked to Bin A-01-04',
    referenceId: 'RTO-505',
  },
  {
    id: 'AUD-902',
    timestamp: '2 days ago',
    merchantCode: 'MC-102',
    fullSku: 'MC-102-GTEE-PRP-L',
    productTitle: 'Tokyo Drift Oversized Drop-Shoulder Tee',
    binCode: 'B-01-03',
    deltaQty: 5,
    previousStock: 140,
    newStock: 145,
    type: 'CYCLE_SURPLUS',
    reason: 'Weekly shelf cycle count surplus verified in Zone B',
    referenceId: 'CYC-204',
  },
  {
    id: 'AUD-903',
    timestamp: '3 days ago',
    merchantCode: 'MC-101',
    fullSku: 'MC-101-HOODIE-BLK-XL',
    productTitle: 'Arctic Fleece Heavyweight Hoodie',
    binCode: 'A-01-02',
    deltaQty: -1,
    previousStock: 85,
    newStock: 84,
    type: 'DAMAGE_WRITEOFF',
    reason: 'Packaging tear found during wave picking inspection',
    referenceId: 'DMG-108',
  },
];

export function WarehouseReturnsManager({
  onOpenProducts,
}: {
  onOpenProducts?: () => void;
}) {
  const [returnsList, setReturnsList] = useState<WarehouseReturnRecord[]>(INITIAL_RETURNS);
  const [liveProducts, setLiveProducts] = useState<WarehouseProductItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReturnStatus>('ALL');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [rowBinSelections, setRowBinSelections] = useState<Record<string, string>>({
    'RTO-501': 'B-03-01',
    'RTO-502': 'C-01-01',
    'RTO-503': 'A-01-02',
    'RTO-504': 'D-01-01',
  });

  // Confirmation Modal for QC Pass (Restock) or Damaged (Quarantine)
  const [qcModal, setQcModal] = useState<{
    mode: 'RESTOCK' | 'DAMAGED';
    item: WarehouseReturnRecord;
    selectedBin: string;
    note: string;
  } | null>(null);

  // Modal for Logging a New Return Parcel
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [newRetOrderId, setNewRetOrderId] = useState('ORD-9849');
  const [newRetTracking, setNewRetTracking] = useState('SF-8842910');
  const [newRetCourier, setNewRetCourier] = useState<'Steadfast' | 'Pathao' | 'RedX'>('Steadfast');
  const [newRetSku, setNewRetSku] = useState('MC-101-HOODIE-BLK-XL');
  const [newRetQty, setNewRetQty] = useState('1');
  const [newRetReason, setNewRetReason] = useState('Customer unreachable on phone');

  // Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 5000);
  };

  // Load returns & live products from localStorage
  useEffect(() => {
    const syncData = () => {
      try {
        const savedRet = localStorage.getItem('fulfillio_warehouse_returns_v1');
        if (savedRet) {
          const parsed = JSON.parse(savedRet);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReturnsList(parsed);
          }
        } else {
          localStorage.setItem('fulfillio_warehouse_returns_v1', JSON.stringify(INITIAL_RETURNS));
        }

        const savedProds = localStorage.getItem('fulfillio_warehouse_products_v1');
        if (savedProds) {
          const parsedProds = JSON.parse(savedProds);
          if (Array.isArray(parsedProds)) {
            setLiveProducts(parsedProds);
          }
        }
      } catch {
        // ignore storage errors
      }
    };

    syncData();
    window.addEventListener('fulfillio-warehouse-sync', syncData);
    return () => window.removeEventListener('fulfillio-warehouse-sync', syncData);
  }, []);

  const persistReturns = (updated: WarehouseReturnRecord[]) => {
    setReturnsList(updated);
    try {
      localStorage.setItem('fulfillio_warehouse_returns_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Helper to get current live stock of any SKU
  const getLiveStockForSku = (fullSku: string, fallback: number): number => {
    const match = liveProducts.find((p) => p.fullSku === fullSku);
    return match ? match.stock : fallback;
  };

  // Scan handler: finds matching tracking code or order ID and opens QC modal immediately
  const handleScanLookup = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const query = (customCode ?? scanInput).trim().toUpperCase();
    if (!query) return;

    const found = returnsList.find(
      (r) =>
        r.trackingCode.toUpperCase() === query ||
        r.orderId.toUpperCase() === query ||
        r.id.toUpperCase() === query
    );

    if (found) {
      setScanInput(found.trackingCode);
      const bin = rowBinSelections[found.id] || found.targetBin;
      setQcModal({
        mode: 'RESTOCK',
        item: found,
        selectedBin: bin,
        note: 'Barcode scanned at RTO station — item intact & ready for bin restock.',
      });
    } else {
      triggerToast(`No return parcel found matching "${query}". Try scanning RX-9902890 or SF-8838420, or click "+ Log New Return".`);
    }
  };

  // Confirm QC Pass (Restock to Bin + Increment Live Product Stock) or Mark Damaged
  const handleExecuteQcDecision = () => {
    if (!qcModal) return;
    const { mode, item, selectedBin, note } = qcModal;
    const currentLiveStock = getLiveStockForSku(item.fullSku, item.currentStockSnapshot);

    if (mode === 'RESTOCK') {
      const updatedStock = currentLiveStock + item.qty;

      // 1. Update live warehouse products in localStorage (`fulfillio_warehouse_products_v1`)
      try {
        const savedProds = localStorage.getItem('fulfillio_warehouse_products_v1');
        if (savedProds) {
          const parsedProds: WarehouseProductItem[] = JSON.parse(savedProds);
          const nextProds = parsedProds.map((p) =>
            p.fullSku === item.fullSku
              ? { ...p, stock: p.stock + item.qty, binCode: selectedBin }
              : p
          );
          localStorage.setItem('fulfillio_warehouse_products_v1', JSON.stringify(nextProds));
          setLiveProducts(nextProds);
        }
      } catch {
        // ignore
      }

      // 2. Also update merchant directory products in localStorage (`fulfillio_merchant_products_v4`) if present
      try {
        const savedMerchantProds = localStorage.getItem('fulfillio_merchant_products_v4');
        if (savedMerchantProds) {
          const parsedMProds = JSON.parse(savedMerchantProds);
          if (Array.isArray(parsedMProds)) {
            const nextMProds = parsedMProds.map((mp: any) =>
              mp.sku === item.fullSku
                ? { ...mp, stock: (Number(mp.stock) || 0) + item.qty, bin: selectedBin }
                : mp
            );
            localStorage.setItem('fulfillio_merchant_products_v4', JSON.stringify(nextMProds));
          }
        }
      } catch {
        // ignore
      }

      // 3. Append to Stock Audit Log (`fulfillio_stock_audit_log_v1`)
      try {
        const rawLog = localStorage.getItem('fulfillio_stock_audit_log_v1');
        const currentLog: StockAuditLogItem[] = rawLog ? JSON.parse(rawLog) : INITIAL_AUDIT_LOG;
        const newEntry: StockAuditLogItem = {
          id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: 'Just now',
          merchantCode: item.merchantCode,
          fullSku: item.fullSku,
          productTitle: item.productTitle,
          binCode: selectedBin,
          deltaQty: item.qty,
          previousStock: currentLiveStock,
          newStock: updatedStock,
          type: 'RTO_RESTOCK',
          reason: note.trim() || `Returned parcel ${item.id} (${item.orderId}) restocked to Bin ${selectedBin}`,
          referenceId: item.id,
        };
        localStorage.setItem('fulfillio_stock_audit_log_v1', JSON.stringify([newEntry, ...currentLog]));
      } catch {
        // ignore
      }

      // 4. Update Return status to RESTOCKED
      const nextReturns = returnsList.map((r) =>
        r.id === item.id
          ? {
              ...r,
              status: 'RESTOCKED' as ReturnStatus,
              targetBin: selectedBin,
              currentStockSnapshot: updatedStock,
              processedAt: 'Just now',
              inspectorNote:
                note.trim() || `QC Passed. Added +${item.qty} units to Bin ${selectedBin} (New Stock: ${updatedStock}).`,
            }
          : r
      );
      persistReturns(nextReturns);
      window.dispatchEvent(new Event('fulfillio-warehouse-sync'));

      triggerToast(
        `Restocked +${item.qty} pcs of ${item.fullSku} into Bin ${selectedBin}! Stock increased from ${currentLiveStock} → ${updatedStock} units.`
      );
    } else {
      // DAMAGED / QUARANTINE
      const nextReturns = returnsList.map((r) =>
        r.id === item.id
          ? {
              ...r,
              status: 'DAMAGED' as ReturnStatus,
              processedAt: 'Just now',
              inspectorNote:
                note.trim() || 'Marked as Damaged during RTO inspection — quarantined for merchant/courier claim.',
            }
          : r
      );
      persistReturns(nextReturns);
      triggerToast(
        `Parcel ${item.id} (${item.orderId}) marked as DAMAGED / QUARANTINE. Sellable stock was NOT modified.`
      );
    }

    setQcModal(null);
  };

  // Log a brand new Return Parcel
  const handleCreateNewReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedProd = liveProducts.find((p) => p.fullSku === newRetSku);
    const qtyNum = Math.max(1, Number(newRetQty) || 1);
    const newId = `RTO-${500 + returnsList.length + 1}`;
    const defaultBin = matchedProd?.binCode || 'A-01-02';

    const newRecord: WarehouseReturnRecord = {
      id: newId,
      orderId: newRetOrderId.trim() || `ORD-${Math.floor(9850 + Math.random() * 100)}`,
      trackingCode: newRetTracking.trim() || `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      courier: newRetCourier,
      merchantCode: matchedProd?.merchantCode || 'MC-101',
      merchantName: matchedProd?.merchantName || "Sabbir's Store",
      productTitle: matchedProd?.title || 'Arctic Fleece Heavyweight Hoodie',
      fullSku: newRetSku,
      qty: qtyNum,
      targetBin: defaultBin,
      currentStockSnapshot: matchedProd?.stock ?? 84,
      returnReason: newRetReason.trim() || 'Customer returned parcel via courier',
      status: 'PENDING_INSPECTION',
      receivedAt: 'Just now',
      imageUrl: matchedProd?.imageUrl || PRESET_THUMBNAILS[0]?.url || '',
    };

    setRowBinSelections((prev) => ({ ...prev, [newId]: defaultBin }));
    persistReturns([newRecord, ...returnsList]);
    setIsNewReturnModalOpen(false);
    triggerToast(`Logged new return parcel ${newRecord.id} (${newRecord.orderId}) for QC inspection.`);
  };

  // Computed KPI stats
  const stats = useMemo(() => {
    const pendingCount = returnsList.filter((r) => r.status === 'PENDING_INSPECTION').length;
    const restockedCount = returnsList.filter((r) => r.status === 'RESTOCKED').length;
    const damagedCount = returnsList.filter((r) => r.status === 'DAMAGED').length;
    const totalUnitsRestocked = returnsList
      .filter((r) => r.status === 'RESTOCKED')
      .reduce((sum, r) => sum + r.qty, 0);

    return { pendingCount, restockedCount, damagedCount, totalUnitsRestocked };
  }, [returnsList]);

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returnsList.filter((r) => {
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesMerchant = merchantFilter === 'ALL' || r.merchantCode === merchantFilter;
      const q = scanInput.trim().toLowerCase();
      const matchesQuery =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.trackingCode.toLowerCase().includes(q) ||
        r.fullSku.toLowerCase().includes(q) ||
        r.productTitle.toLowerCase().includes(q);
      return matchesStatus && matchesMerchant && matchesQuery;
    });
  }, [returnsList, statusFilter, merchantFilter, scanInput]);

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header & "+ Log New Return" Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Returns &amp; RTO Intake (Auto-Restock to Bin)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Scan returned courier parcels, inspect product condition (QC), select target Warehouse Bin, and add good units directly back to live stock.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenProducts && (
            <button
              type="button"
              onClick={onOpenProducts}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-400" />
              <span>View Live Product Stock</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsNewReturnModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log New Return (RTO)</span>
          </button>
        </div>
      </div>

      {/* 3-Step Visual Explanation Strip: How Returned Products are Added to Stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
            1
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              1. Scan Return Consignment
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Scan the courier tracking barcode (`RX-9902890`, `SF-8838420`) or Order ID when the courier rider hands over returned parcels.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
            2
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              2. QC Inspection &amp; Bin Selection
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify if the item is intact (`QC Pass`) or damaged in transit, and confirm the target Warehouse Bin (`B-03-01`, `A-01-02`, etc.).
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
            3
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              3. Instant Stock Addition (+Qty)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Click <strong className="text-slate-200">QC Pass → Add to Stock</strong> to automatically add the returned quantity back into the product&apos;s live warehouse stock.
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenProducts && (
              <button
                type="button"
                onClick={onOpenProducts}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Check Updated Stock in Products →
              </button>
            )}
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs text-emerald-300 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 4 Interactive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('PENDING_INSPECTION')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PENDING_INSPECTION'
              ? 'bg-amber-950/30 border-amber-500/60 shadow-lg'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Pending QC Intake</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2 font-mono">
            {stats.pendingCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Awaiting inspection &amp; restock
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('RESTOCKED')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'RESTOCKED'
              ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Restocked to Bin</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            {stats.restockedCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Added back to sellable stock
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('DAMAGED')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'DAMAGED'
              ? 'bg-rose-950/30 border-rose-500/60 shadow-lg'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Damaged / Quarantine</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-2 font-mono">
            {stats.damagedCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Excluded from sellable stock
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-indigo-950/30 border-indigo-500/60 shadow-lg'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Units Restocked</span>
            <Box className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">
            +{stats.totalUnitsRestocked} pcs
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            Live synced with Warehouse Bins
          </span>
        </button>
      </div>

      {/* Inbound RTO Barcode Scanner Station + Quick Demo Scan Chips */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <form onSubmit={(e) => handleScanLookup(e)} className="flex flex-col sm:flex-row gap-2.5 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan or type Return Consignment ID (e.g. RX-9902890, SF-8838420, ORD-9825)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors shrink-0 cursor-pointer"
            >
              Scan &amp; Inspect Parcel
            </button>
            {scanInput && (
              <button
                type="button"
                onClick={() => setScanInput('')}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
              >
                Clear
              </button>
            )}
          </form>

          {/* Merchant Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Merchant:</span>
            <select
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Merchants</option>
              <option value="MC-101">MC-101 (Sabbir&apos;s Store)</option>
              <option value="MC-102">MC-102 (Urban Threads BD)</option>
              <option value="MC-103">MC-103 (Apex Footwear Hub)</option>
              <option value="MC-104">MC-104 (Gadget Freak Online)</option>
            </select>
          </div>
        </div>

        {/* Quick 1-Click Demo Scan Barcodes */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium">Quick Test Scan:</span>
          {returnsList
            .filter((r) => r.status === 'PENDING_INSPECTION')
            .map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleScanLookup(undefined, r.trackingCode)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 font-mono text-[11px] text-emerald-400 transition-colors cursor-pointer"
              >
                {r.trackingCode} ({r.orderId} • +{r.qty} pcs)
              </button>
            ))}
        </div>
      </div>

      {/* Returns & RTO Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: `All Returns (${returnsList.length})` },
                { id: 'PENDING_INSPECTION', label: `Pending QC (${stats.pendingCount})` },
                { id: 'RESTOCKED', label: `Restocked to Bin (${stats.restockedCount})` },
                { id: 'DAMAGED', label: `Damaged / Quarantine (${stats.damagedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredReturns.length}</strong> return records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-950/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Return &amp; Order ID</th>
                <th className="py-3.5 px-4">Merchant</th>
                <th className="py-3.5 px-4">Product &amp; 2-Part SKU</th>
                <th className="py-3.5 px-4 text-center">Return Qty</th>
                <th className="py-3.5 px-4">Target Bin (Restock Location)</th>
                <th className="py-3.5 px-4 text-center">QC &amp; Stock Status</th>
                <th className="py-3.5 px-4 text-right">Warehouse Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm">
              {filteredReturns.map((ret) => {
                const currentStock = getLiveStockForSku(ret.fullSku, ret.currentStockSnapshot);
                const selectedBin = rowBinSelections[ret.id] || ret.targetBin;

                return (
                  <tr key={ret.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">{ret.id}</span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                          {ret.orderId}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-emerald-400 mt-1">
                        {ret.courier}: {ret.trackingCode}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 max-w-[230px]">
                        Reason: {ret.returnReason}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/70 font-mono text-xs font-bold">
                        {ret.merchantCode}
                      </span>
                      <div className="text-xs font-semibold text-slate-200 mt-1">
                        {ret.merchantName}
                      </div>
                      <div className="text-[11px] text-slate-500">{ret.receivedAt}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {ret.imageUrl ? (
                          <img
                            src={ret.imageUrl}
                            alt={ret.productTitle}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white">{ret.productTitle}</div>
                          <span className="font-mono text-xs text-emerald-400 block mt-0.5">
                            {ret.fullSku}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Current Warehouse Stock: <strong className="text-white font-mono">{currentStock} pcs</strong>
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs font-extrabold text-emerald-300">
                        +{ret.qty} pcs
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {ret.status === 'PENDING_INSPECTION' ? (
                        <div className="space-y-1">
                          <select
                            value={selectedBin}
                            onChange={(e) =>
                              setRowBinSelections((prev) => ({
                                ...prev,
                                [ret.id]: e.target.value,
                              }))
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                          >
                            {AVAILABLE_BINS.map((b) => (
                              <option key={b} value={b}>
                                Bin: {b}
                              </option>
                            ))}
                          </select>
                          <span className="text-[10px] text-slate-500 block">
                            Select shelf bin for restock
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 font-mono text-xs font-bold text-indigo-300">
                          <MapPin className="w-3 h-3" />
                          Bin: {ret.targetBin}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {ret.status === 'PENDING_INSPECTION' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          PENDING QC
                        </span>
                      )}
                      {ret.status === 'RESTOCKED' && (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            RESTOCKED (+{ret.qty})
                          </span>
                          {ret.inspectorNote && (
                            <div className="text-[10px] text-slate-400 max-w-[180px] mx-auto">
                              {ret.inspectorNote}
                            </div>
                          )}
                        </div>
                      )}
                      {ret.status === 'DAMAGED' && (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            QUARANTINED
                          </span>
                          {ret.inspectorNote && (
                            <div className="text-[10px] text-rose-300/80 max-w-[180px] mx-auto">
                              {ret.inspectorNote}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      {ret.status === 'PENDING_INSPECTION' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setQcModal({
                                mode: 'RESTOCK',
                                item: ret,
                                selectedBin,
                                note: `QC Passed — intact return restocked into Bin ${selectedBin}`,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            QC Pass → Add to Stock (+{ret.qty})
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setQcModal({
                                mode: 'DAMAGED',
                                item: ret,
                                selectedBin,
                                note: 'Damaged in courier transit — quarantined for merchant claim',
                              })
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Damaged
                          </button>
                        </div>
                      ) : ret.status === 'DAMAGED' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setQcModal({
                              mode: 'RESTOCK',
                              item: ret,
                              selectedBin,
                              note: 'Repackaged & passed secondary QC — moved to sellable stock',
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                        >
                          Repackage → Add to Stock (+{ret.qty})
                        </button>
                      ) : (
                        <span className="text-xs font-mono text-emerald-400 font-semibold">
                          ✓ Added to Bin {ret.targetBin}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          MODAL 1: QC PASS (ADD TO STOCK) / DAMAGED CONFIRMATION MODAL
         ===================================================================== */}
      {qcModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                    qcModal.mode === 'RESTOCK'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {qcModal.mode === 'RESTOCK' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {qcModal.mode === 'RESTOCK'
                      ? `Confirm QC Pass & Add +${qcModal.item.qty} Units to Stock`
                      : 'Confirm Damaged Return Quarantine'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Return {qcModal.item.id} • Order {qcModal.item.orderId} ({qcModal.item.courier}: {qcModal.item.trackingCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQcModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Summary Card */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
              {qcModal.item.imageUrl && (
                <img
                  src={qcModal.item.imageUrl}
                  alt={qcModal.item.productTitle}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-800">
                    {qcModal.item.merchantCode}
                  </span>
                  <span className="font-mono text-xs text-emerald-400 font-bold truncate">
                    {qcModal.item.fullSku}
                  </span>
                </div>
                <div className="text-sm font-bold text-white truncate mt-0.5">
                  {qcModal.item.productTitle}
                </div>
              </div>
            </div>

            {qcModal.mode === 'RESTOCK' ? (
              <>
                {/* Live Stock Addition Preview Box */}
                <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Automatic Warehouse Inventory Calculation
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Current Stock</span>
                      <span className="text-base font-mono font-bold text-slate-200">
                        {getLiveStockForSku(qcModal.item.fullSku, qcModal.item.currentStockSnapshot)} pcs
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 block">Returned Qty</span>
                      <span className="text-base font-mono font-extrabold text-emerald-400">
                        +{qcModal.item.qty} pcs
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40">
                      <span className="text-[10px] text-emerald-300 block">New Stock</span>
                      <span className="text-base font-mono font-black text-white">
                        {getLiveStockForSku(qcModal.item.fullSku, qcModal.item.currentStockSnapshot) +
                          qcModal.item.qty}{' '}
                        pcs
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bin Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Select Warehouse Bin to Store Returned Units
                  </label>
                  <select
                    value={qcModal.selectedBin}
                    onChange={(e) =>
                      setQcModal((prev) =>
                        prev ? { ...prev, selectedBin: e.target.value } : null
                      )
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    {AVAILABLE_BINS.map((b) => (
                      <option key={b} value={b}>
                        Bin {b}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200">
                Quarantined items are logged for merchant/courier damage claims and will <strong>NOT</strong> be added to sellable warehouse stock.
              </div>
            )}

            {/* Inspector Note */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                QC Inspector Note
              </label>
              <input
                type="text"
                value={qcModal.note}
                onChange={(e) =>
                  setQcModal((prev) => (prev ? { ...prev, note: e.target.value } : null))
                }
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setQcModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteQcDecision}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer ${
                  qcModal.mode === 'RESTOCK'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {qcModal.mode === 'RESTOCK'
                  ? `Confirm & Add +${qcModal.item.qty} to Bin ${qcModal.selectedBin}`
                  : 'Confirm Quarantine'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: LOG NEW RETURN PARCEL (RTO)
         ===================================================================== */}
      {isNewReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Log Inbound Courier Return (RTO)</h3>
                <p className="text-xs text-slate-400">
                  Register a returned parcel into the QC inspection queue
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewReturnModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewReturn} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Order ID *</label>
                  <input
                    type="text"
                    required
                    value={newRetOrderId}
                    onChange={(e) => setNewRetOrderId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Courier Partner</label>
                  <select
                    value={newRetCourier}
                    onChange={(e: any) => setNewRetCourier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Steadfast">Steadfast</option>
                    <option value="Pathao">Pathao</option>
                    <option value="RedX">RedX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Tracking Barcode *</label>
                  <input
                    type="text"
                    required
                    value={newRetTracking}
                    onChange={(e) => setNewRetTracking(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Returned Qty *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newRetQty}
                    onChange={(e) => setNewRetQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Product &amp; 2-Part SKU</label>
                <select
                  value={newRetSku}
                  onChange={(e) => setNewRetSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                >
                  {liveProducts.map((p) => (
                    <option key={p.id} value={p.fullSku}>
                      {p.fullSku} — {p.title} (Bin {p.binCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Courier Return Reason</label>
                <input
                  type="text"
                  value={newRetReason}
                  onChange={(e) => setNewRetReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Add to Return Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   COMPONENT 2: STOCK ADJUSTMENTS & CYCLE COUNTS (Synchronized with Returns & Products)
   ============================================================================ */
export function WarehouseStockCycleManager({
  onOpenReturns,
}: {
  onOpenReturns?: () => void;
}) {
  const [auditLog, setAuditLog] = useState<StockAuditLogItem[]>(INITIAL_AUDIT_LOG);
  const [products, setProducts] = useState<WarehouseProductItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState('MC-101-HOODIE-BLK-XL');
  const [adjustType, setAdjustType] = useState<'CYCLE_SURPLUS' | 'MANUAL_RESTOCK' | 'DAMAGE_WRITEOFF'>('CYCLE_SURPLUS');
  const [adjustQty, setAdjustQty] = useState('5');
  const [adjustReason, setAdjustReason] = useState('Weekly shelf cycle count verification');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      try {
        const rawLog = localStorage.getItem('fulfillio_stock_audit_log_v1');
        if (rawLog) {
          setAuditLog(JSON.parse(rawLog));
        } else {
          localStorage.setItem('fulfillio_stock_audit_log_v1', JSON.stringify(INITIAL_AUDIT_LOG));
        }

        const rawProds = localStorage.getItem('fulfillio_warehouse_products_v1');
        if (rawProds) {
          setProducts(JSON.parse(rawProds));
        }
      } catch {
        // ignore
      }
    };
    load();
    window.addEventListener('fulfillio-warehouse-sync', load);
    return () => window.removeEventListener('fulfillio-warehouse-sync', load);
  }, []);

  const handleApplyCycleAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const target = products.find((p) => p.fullSku === selectedSku);
    if (!target) return;

    const rawNum = Math.max(1, Number(adjustQty) || 1);
    const signedDelta = adjustType === 'DAMAGE_WRITEOFF' ? -rawNum : rawNum;
    const nextStock = Math.max(0, target.stock + signedDelta);

    const updatedProducts = products.map((p) =>
      p.fullSku === selectedSku ? { ...p, stock: nextStock } : p
    );
    setProducts(updatedProducts);
    try {
      localStorage.setItem('fulfillio_warehouse_products_v1', JSON.stringify(updatedProducts));
    } catch {
      // ignore
    }

    const newEntry: StockAuditLogItem = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      merchantCode: target.merchantCode,
      fullSku: target.fullSku,
      productTitle: target.title,
      binCode: target.binCode,
      deltaQty: signedDelta,
      previousStock: target.stock,
      newStock: nextStock,
      type: adjustType,
      reason: adjustReason.trim() || 'Supervisor cycle count adjustment',
      referenceId: `CYC-${Math.floor(100 + Math.random() * 900)}`,
    };

    const nextLog = [newEntry, ...auditLog];
    setAuditLog(nextLog);
    try {
      localStorage.setItem('fulfillio_stock_audit_log_v1', JSON.stringify(nextLog));
    } catch {
      // ignore
    }

    window.dispatchEvent(new Event('fulfillio-warehouse-sync'));
    setIsModalOpen(false);
    setToast(`Updated ${target.fullSku} in Bin ${target.binCode}: ${target.stock} → ${nextStock} units.`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Stock Adjustments &amp; Cycle Counts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Live audit ledger of all Return (RTO) restocks, shelf cycle counts, and supervisor inventory adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenReturns && (
            <button
              type="button"
              onClick={onOpenReturns}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer"
            >
              Open Returns &amp; RTO
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Cycle Count / Adjustment</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base text-white">
            Warehouse Stock Movement &amp; Return Restock Audit Log
          </h3>
          <span className="text-xs text-slate-400 font-mono">{auditLog.length} entries</span>
        </div>

        <div className="divide-y divide-slate-800">
          {auditLog.map((entry) => (
            <div
              key={entry.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {entry.fullSku}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-300">
                    Bin: {entry.binCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      entry.type === 'RTO_RESTOCK'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : entry.type === 'DAMAGE_WRITEOFF'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                    }`}
                  >
                    {entry.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Ref: {entry.referenceId} • {entry.timestamp}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white">{entry.productTitle}</div>
                <p className="text-xs text-slate-400">Reason: {entry.reason}</p>
              </div>

              <div className="text-right shrink-0">
                <div
                  className={`text-base font-mono font-extrabold ${
                    entry.deltaQty >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {entry.deltaQty >= 0 ? `+${entry.deltaQty}` : entry.deltaQty} Units
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Stock: {entry.previousStock} → <strong className="text-white">{entry.newStock}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">New Cycle Count / Stock Adjustment</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyCycleAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Select Product SKU</label>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.fullSku}>
                      {p.fullSku} (Bin {p.binCode} • Current: {p.stock} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={(e: any) => setAdjustType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="CYCLE_SURPLUS">Cycle Count Surplus (+Qty)</option>
                    <option value="MANUAL_RESTOCK">Manual Restock (+Qty)</option>
                    <option value="DAMAGE_WRITEOFF">Damaged Write-Off (-Qty)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Supervisor Reason Note</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
