'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, CheckCircle2, Plus, MapPin, ShieldCheck } from 'lucide-react';
import {
  InboundStockReplenishment,
  StockWithdrawalRequest,
  StockMovementRecord,
  UnifiedApprovalItem,
  WarehouseBin,
  WarehouseProductItem,
  WarehouseProductSubTab,
} from './types';
import {
  INITIAL_BINS,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_REPLENISHMENTS,
  INITIAL_STOCK_WITHDRAWALS,
  INITIAL_STOCK_MOVEMENTS,
  STORAGE_KEY_BINS,
  STORAGE_KEY_PRODUCTS,
  STORAGE_KEY_STOCK_REQUESTS,
  STORAGE_KEY_STOCK_WITHDRAWALS,
  STORAGE_KEY_STOCK_LEDGER,
  cleanBinCode,
  generateDigitalProofHash,
} from './mockData';
import { ProductsStatsOverview } from './components/ProductsStatsOverview';
import { ProductsCatalogTab } from './components/tabs/ProductsCatalogTab';
import { ProductsApprovalTab } from './components/tabs/ProductsApprovalTab';
import { WarehouseBinsTab } from './components/tabs/WarehouseBinsTab';
import { WarehouseStockLedgerTab } from './components/tabs/WarehouseStockLedgerTab';
import { StockAdjustModal } from './components/modals/StockAdjustModal';
import { ApprovalActionModal } from './components/modals/ApprovalActionModal';
import { AcceptStockModal } from './components/modals/AcceptStockModal';
import { RestockIntakeModal } from './components/modals/RestockIntakeModal';
import { BulkSlotAssignment } from './components/modals/BulkApprovalModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { CreateBinModal } from './components/modals/CreateBinModal';
import {
  reconcileAdminProductsWithMerchant,
  syncAdminProductsToMerchant,
  approveProductInDatabase,
  acceptStockInDatabase,
  syncProductStatusToDatabase,
  deleteProductFromDatabase,
} from '@/lib/warehouseSync';

export interface ProductsManagerProps {
  activeTab?: WarehouseProductSubTab;
  onTabChange?: (tab: WarehouseProductSubTab) => void;
}

export function ProductsManager({
  activeTab = 'all',
  onTabChange,
}: ProductsManagerProps) {
  const [subTab, setSubTab] = useState<WarehouseProductSubTab>(activeTab as any);
  const [catalogTab, setCatalogTab] = useState<any>(() => {
    const t = (activeTab || '').toUpperCase();
    if (t === 'APPROVAL') return 'APPROVAL';
    if (t === 'RESTOCK') return 'RESTOCK';
    if (t === 'PUBLIC') return 'PUBLIC';
    if (t === 'OUT_OF_STOCK') return 'OUT_OF_STOCK';
    if (t === 'DRAFT') return 'DRAFT';
    return 'ALL';
  });

  useEffect(() => {
    const t = (activeTab || '').toUpperCase();
    if (t === 'APPROVAL') setCatalogTab('APPROVAL');
    else if (t === 'RESTOCK') setCatalogTab('RESTOCK');
    else if (t === 'PUBLIC') setCatalogTab('PUBLIC');
    else if (t === 'OUT_OF_STOCK') setCatalogTab('OUT_OF_STOCK');
    else if (t === 'DRAFT') setCatalogTab('DRAFT');
    else if (t === 'ALL') setCatalogTab('ALL');
  }, [activeTab]);

  const handleCatalogTabChange = (tab: any) => {
    setCatalogTab(tab);
    onTabChange?.(tab.toLowerCase());
  };

  const handleBulkApproveProducts = (productIds: string[]) => {
    const idSet = new Set(productIds);
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (!idSet.has(p.id)) return p;
        const validBin = p.binCode && p.binCode !== 'Pending Approval' ? p.binCode : bins[0]?.code || 'A-01-02';
        return {
          ...p,
          status: 'APPROVED' as const,
          isDraft: false,
          binCode: validBin,
          submittedAt: 'Approved just now',
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });
    triggerToast(`Approved & published ${productIds.length} product(s).`);
    productIds.forEach((pid) => {
      const prod = products.find((p) => p.id === pid);
      const validBin = prod?.binCode && prod.binCode !== 'Pending Approval' ? prod.binCode : bins[0]?.code || 'A-01-02';
      approveProductInDatabase(pid, validBin, prod?.stock || 0, (prod?.stock || 0) > 0);
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkApproveWithSlots = (assignments: BulkSlotAssignment[]) => {
    const slotMap = new Map<string, BulkSlotAssignment>();
    assignments.forEach((a) => slotMap.set(a.productId, a));

    setProducts((prev) => {
      const next = prev.map((p) => {
        const slot = slotMap.get(p.id);
        if (!slot) return p;
        return {
          ...p,
          status: 'APPROVED' as const,
          isDraft: false,
          binCode: slot.binCode,
          stock: slot.qty,
          submittedAt: 'Approved just now',
        };
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    assignments.forEach((a) => {
      approveProductInDatabase(a.productId, a.binCode, a.qty, a.qty > 0);
      const prod = products.find((p) => p.id === a.productId);
      if (prod) {
        appendStockMovement({
          type: 'INITIAL_INTAKE',
          merchantCode: prod.merchantCode,
          merchantName: prod.merchantName,
          productId: prod.id,
          productTitle: prod.title,
          sku: prod.fullSku,
          deltaQty: a.qty,
          previousStock: 0,
          newStock: a.qty,
          binCode: a.binCode,
          referenceDocType: 'INWARD_CHALLAN',
          referenceNumber: `CHL-${Date.now().toString().slice(-6)}`,
          operator: 'Warehouse Receiving Officer',
          carrierOrCourier: 'Initial Catalog Intake Consignment',
          notes: `Bulk approved and slotted ${a.qty} units into Bin ${a.binCode}.`,
        });
      }
    });

    triggerToast(`Approved & slotted ${assignments.length} product(s) into warehouse bins.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkApproveRequests = (requestIds: string[]) => {
    const idSet = new Set(requestIds);
    setStockReplenishments((prev) => {
      const next = prev.map((r) =>
        idSet.has(r.id) || idSet.has(r.productId) ? { ...r, status: 'APPROVED' as const } : r
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    setStockWithdrawals((prev) => {
      const next = prev.map((w) =>
        idSet.has(w.id) || idSet.has(w.productId) ? { ...w, status: 'APPROVED' as const } : w
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(next));
      } catch {}
      return next;
    });

    setProducts((prev) => {
      const next = prev.map((p) => {
        let currentStock = p.stock;
        const matchingRepl = stockReplenishments.find(
          (r) => (idSet.has(r.id) || idSet.has(r.productId)) && (r.productId === p.id || r.productSku === p.fullSku)
        );
        if (matchingRepl) {
          currentStock += matchingRepl.requestedQty;
        }
        const matchingWith = stockWithdrawals.find(
          (w) => (idSet.has(w.id) || idSet.has(w.productId)) && (w.productId === p.id || w.productSku === p.fullSku)
        );
        if (matchingWith) {
          currentStock = Math.max(0, currentStock - matchingWith.withdrawQty);
        }
        return { ...p, stock: currentStock };
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    triggerToast(`Approved ${requestIds.length} inventory request(s).`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkRejectRequests = (requestIds: string[]) => {
    const idSet = new Set(requestIds);
    setStockReplenishments((prev) => {
      const next = prev.map((r) =>
        idSet.has(r.id) || idSet.has(r.productId) ? { ...r, status: 'REJECTED' as const } : r
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    setStockWithdrawals((prev) => {
      const next = prev.map((w) =>
        idSet.has(w.id) || idSet.has(w.productId) ? { ...w, status: 'REJECTED' as const } : w
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(next));
      } catch {}
      return next;
    });

    triggerToast(`Declined ${requestIds.length} inventory request(s).`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkRejectProducts = (productIds: string[]) => {
    const idSet = new Set(productIds);
    const targetProducts = products.filter((p) => idSet.has(p.id));
    const deletableRejected = targetProducts.filter((p) => (p.stock || 0) === 0);
    const draftRestoredRejected = targetProducts.filter((p) => (p.stock || 0) > 0);
    const deletableIdSet = new Set(deletableRejected.map((p) => p.id));
    const draftRestoredIdSet = new Set(draftRestoredRejected.map((p) => p.id));

    setProducts((prev) => {
      const next = prev
        .filter((p) => !deletableIdSet.has(p.id))
        .map((p) =>
          draftRestoredIdSet.has(p.id)
            ? { ...p, status: 'DRAFT' as const, isDraft: true }
            : p
        );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next, deletableRejected);
      } catch {}
      return next;
    });
    deletableRejected.forEach((p) => {
      deleteProductFromDatabase(p.id, p.merchantCode);
    });
    draftRestoredRejected.forEach((p) => {
      fetch(`${API_BASE}/inventory/products/${encodeURIComponent(p.id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' }),
      }).catch(() => {});
    });
    triggerToast(`Rejected ${productIds.length} product submission(s).`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };
  const [products, setProducts] = useState<WarehouseProductItem[]>(INITIAL_PRODUCTS);
  const [bins, setBins] = useState<WarehouseBin[]>(INITIAL_BINS);
  const [stockReplenishments, setStockReplenishments] = useState<InboundStockReplenishment[]>(
    INITIAL_STOCK_REPLENISHMENTS
  );
  const [stockWithdrawals, setStockWithdrawals] = useState<StockWithdrawalRequest[]>(
    INITIAL_STOCK_WITHDRAWALS
  );
  const [stockMovements, setStockMovements] = useState<StockMovementRecord[]>(
    INITIAL_STOCK_MOVEMENTS
  );
  const [hydrated, setHydrated] = useState(false);

  // Toast Banner
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Modals
  const [stockAdjustProduct, setStockAdjustProduct] = useState<WarehouseProductItem | null>(null);
  const [acceptStockProduct, setAcceptStockProduct] = useState<WarehouseProductItem | null>(null);
  const [approvalModalData, setApprovalModalData] = useState<{
    mode: 'APPROVE' | 'REJECT';
    product: WarehouseProductItem;
    selectedBin: string;
  } | null>(null);
  const [restockModalData, setRestockModalData] = useState<InboundStockReplenishment | null>(null);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [newBinModalOpen, setNewBinModalOpen] = useState(false);

  // Hydrate & sync with localStorage
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const savedProds = localStorage.getItem(STORAGE_KEY_PRODUCTS);
        let baseProds = INITIAL_PRODUCTS;
        if (savedProds) {
          const parsed = JSON.parse(savedProds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const healed = parsed.map((p: any) => {
              const init = INITIAL_PRODUCTS.find((ip) => ip.id === p.id || ip.fullSku === p.fullSku);
              const isDraft = p.status === 'DRAFT' || Boolean(p.isDraft);
              const isPending = !isDraft && p.status === 'PENDING_APPROVAL';
              const isRejected = !isDraft && p.status === 'REJECTED';
              const cleanedBin = isPending
                ? p.binCode || 'Pending Approval'
                : cleanBinCode(p.binCode) || (init ? cleanBinCode(init.binCode) : 'A-01-02');
              const safeStock = typeof p.stock === 'number' && !isNaN(p.stock) ? p.stock : (init?.stock ?? 100);
              const safeStatus = isDraft
                ? ('DRAFT' as const)
                : isPending
                ? ('PENDING_APPROVAL' as const)
                : isRejected
                ? ('REJECTED' as const)
                : ('APPROVED' as const);
              return {
                ...p,
                binCode: cleanedBin,
                stock: safeStock,
                status: safeStatus,
                isDraft,
              };
            });
            baseProds = healed;
          }
        } else {
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
        }
        const reconciled = reconcileAdminProductsWithMerchant(baseProds);
        setProducts(reconciled);

        // Fetch products directly from PostgreSQL backend to ensure all merchant uploads are present
        fetch(`${API_BASE}/inventory/products`)
          .then((res) => (res.ok ? res.json() : null))
          .then((backendProds) => {
            if (backendProds && Array.isArray(backendProds) && backendProds.length > 0) {
              const mappedBackend: WarehouseProductItem[] = backendProds.map((p: any) => {
                const variants = p.variants || [];
                const totalStock = variants.reduce(
                  (sum: number, v: any) => sum + (v.inventoryItems?.[0]?.quantityAvailable ?? 0),
                  0
                );
                const mCode = p.merchant?.merchantCode || p.merchantCode || 'MC-101';
                const mName = p.merchant?.businessName || `Merchant (${mCode})`;
                const firstVariant = variants[0];
                const rawDbStatus = (p.status || '').trim().toUpperCase();
                const isDraft = rawDbStatus === 'DRAFT';
                const isPending =
                  rawDbStatus === 'PENDING_APPROVAL' ||
                  (!rawDbStatus && variants.some((v: any) => v.defaultBinCode === 'Pending Approval'));
                const isApproved =
                  !isDraft &&
                  !isPending &&
                  (rawDbStatus === 'APPROVED' ||
                    rawDbStatus === 'PUBLISHED' ||
                    variants.some(
                      (v: any) =>
                        v.defaultBinCode &&
                        v.defaultBinCode !== 'Pending Approval' &&
                        v.defaultBinCode !== 'Assigned on intake'
                    ));

                const computedStatus = isDraft
                  ? ('DRAFT' as const)
                  : isPending
                    ? ('PENDING_APPROVAL' as const)
                    : ('APPROVED' as const);

                const hasValidAssignedBin =
                  Boolean(firstVariant?.defaultBinCode) &&
                  firstVariant.defaultBinCode !== 'Pending Approval' &&
                  firstVariant.defaultBinCode !== 'Assigned on intake';

                const assignedBin = hasValidAssignedBin && (isApproved || isDraft || totalStock > 0)
                  ? firstVariant.defaultBinCode
                  : isApproved
                    ? 'A-01-02'
                    : 'Pending Approval';

                const stockAccepted = isApproved && totalStock > 0;
                const stockStatus = isApproved
                  ? totalStock > 0
                    ? ('IN_STOCK' as const)
                    : ('AWAITING_STOCK' as const)
                  : undefined;

                const variantParts = (firstVariant?.title || '').split(/[/•·|-]/).map((s: string) => s.trim());
                const color = firstVariant?.attributes?.color || variantParts[0] || 'Standard';
                const size = firstVariant?.attributes?.size || variantParts[1] || 'Standard';

                return {
                  id: p.id,
                  title: p.title,
                  category: (firstVariant?.attributes as any)?.category || 'Fashion',
                  merchantCode: mCode,
                  merchantName: mName,
                  shortSku: p.baseSku,
                  fullSku: firstVariant?.sku || `${mCode}-${p.baseSku}-STD`,
                  color,
                  size,
                  binCode: assignedBin,
                  stock: totalStock,
                  stockAccepted,
                  stockStatus,
                  price: Number(firstVariant?.price) || 0,
                  status: computedStatus,
                  isDraft,
                  submittedAt: new Date(p.createdAt || Date.now()).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }),
                  imageUrl: p.imageUrl || '',
                  images: p.images || [],
                  barcode: firstVariant?.barcode || '',
                  description: p.description,
                  colors: (firstVariant?.attributes as any)?.allColors || [],
                  sizes: (firstVariant?.attributes as any)?.sizes || [],
                  variantsList: variants.map((v: any) => ({
                    id: v.id,
                    sku: v.sku,
                    color: v.attributes?.color || v.title?.split('/')[0]?.trim() || '',
                    size: v.attributes?.size || v.title?.split('/')[1]?.trim() || '',
                    stock: v.inventoryItems?.[0]?.quantityAvailable ?? 0,
                    imageUrl: v.imageUrl || p.imageUrl || '',
                  })),
                };
              });

              setProducts((prev) => {
                const combined = [...prev];
                for (const bp of mappedBackend) {
                  const idx = combined.findIndex((cp) => cp.id === bp.id || cp.fullSku === bp.fullSku);
                  if (idx >= 0) {
                    combined[idx] = { ...combined[idx], ...bp, status: bp.status, isDraft: bp.isDraft };
                  } else {
                    combined.unshift(bp);
                  }
                }
                try {
                  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(combined));
                } catch {}
                return combined;
              });
            }
          })
          .catch(() => {});

        const savedBins = localStorage.getItem(STORAGE_KEY_BINS);
        if (savedBins) {
          const parsedBins = JSON.parse(savedBins);
          if (Array.isArray(parsedBins) && parsedBins.length > 0) {
            const healedBins = parsedBins.map((b: any) => ({
              ...b,
              code: cleanBinCode(b.code),
            }));
            setBins(healedBins);
            localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(healedBins));
          } else {
            setBins(INITIAL_BINS);
            localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(INITIAL_BINS));
          }
        } else {
          localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(INITIAL_BINS));
        }

        const savedReqs = localStorage.getItem(STORAGE_KEY_STOCK_REQUESTS);
        if (savedReqs) {
          const parsedReqs = JSON.parse(savedReqs);
          if (Array.isArray(parsedReqs) && parsedReqs.length > 0) {
            setStockReplenishments(parsedReqs);
          }
        } else {
          localStorage.setItem(
            STORAGE_KEY_STOCK_REQUESTS,
            JSON.stringify(INITIAL_STOCK_REPLENISHMENTS)
          );
        }

        const savedWths = localStorage.getItem(STORAGE_KEY_STOCK_WITHDRAWALS);
        if (savedWths) {
          const parsedWths = JSON.parse(savedWths);
          if (Array.isArray(parsedWths) && parsedWths.length > 0) {
            setStockWithdrawals(parsedWths);
          }
        } else {
          localStorage.setItem(
            STORAGE_KEY_STOCK_WITHDRAWALS,
            JSON.stringify(INITIAL_STOCK_WITHDRAWALS)
          );
        }

        const savedLedger = localStorage.getItem(STORAGE_KEY_STOCK_LEDGER);
        if (savedLedger) {
          const parsedLedger = JSON.parse(savedLedger);
          if (Array.isArray(parsedLedger) && parsedLedger.length > 0) {
            setStockMovements(parsedLedger);
          } else {
            setStockMovements(INITIAL_STOCK_MOVEMENTS);
            localStorage.setItem(STORAGE_KEY_STOCK_LEDGER, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
          }
        } else {
          localStorage.setItem(
            STORAGE_KEY_STOCK_LEDGER,
            JSON.stringify(INITIAL_STOCK_MOVEMENTS)
          );
        }
      } catch {
        // ignore storage errors
      }
      setHydrated(true);
    };

    loadFromStorage();

    const handleWarehouseSync = (e: Event) => {
      const ce = e as CustomEvent;
      // Do not sync if this event was dispatched by this component itself
      if (ce.detail?.source === 'ProductsManager') return;
      loadFromStorage();
    };

    window.addEventListener('fulfillio-warehouse-sync', handleWarehouseSync);
    window.addEventListener('storage', handleWarehouseSync);
    return () => {
      window.removeEventListener('fulfillio-warehouse-sync', handleWarehouseSync);
      window.removeEventListener('storage', handleWarehouseSync);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
      syncAdminProductsToMerchant(products);
    } catch {
      // ignore
    }
  }, [products, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(bins));
    } catch {
      // ignore
    }
  }, [bins, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(stockReplenishments));
    } catch {
      // ignore
    }
  }, [stockReplenishments, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(stockWithdrawals));
    } catch {
      // ignore
    }
  }, [stockWithdrawals, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY_STOCK_LEDGER, JSON.stringify(stockMovements));
    } catch {
      // ignore
    }
  }, [stockMovements, hydrated]);

  const appendStockMovement = (
    movement: Omit<StockMovementRecord, 'id' | 'timestamp' | 'digitalProofHash' | 'verifiedAt'>
  ) => {
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const id = `PRF-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const hash = generateDigitalProofHash(`${id}-${movement.sku}-${movement.deltaQty}-${timeStr}`);
    const newRecord: StockMovementRecord = {
      ...movement,
      id,
      timestamp: timeStr,
      digitalProofHash: hash,
      verifiedAt: timeStr,
    };
    setStockMovements((prev) => [newRecord, ...prev]);
  };

  useEffect(() => {
    setSubTab(activeTab);
  }, [activeTab]);

  const handleSelectTab = (tab: WarehouseProductSubTab) => {
    setSubTab(tab);
    onTabChange?.(tab);
  };

  const handleAdjustStock = (productId: string, delta: number) => {
    const prod = products.find((p) => p.id === productId);
    if (prod && delta !== 0) {
      const prev = prod.stock;
      const nextSt = Math.max(0, prod.stock + delta);
      appendStockMovement({
        type: 'AUDIT_ADJUSTMENT',
        merchantCode: prod.merchantCode,
        merchantName: prod.merchantName,
        productId: prod.id,
        productTitle: prod.title,
        sku: prod.fullSku,
        deltaQty: nextSt - prev,
        previousStock: prev,
        newStock: nextSt,
        binCode: prod.binCode,
        referenceDocType: 'INTERNAL_AUDIT',
        referenceNumber: `AUD-${Date.now().toString().slice(-6)}`,
        operator: 'Warehouse Inventory Controller',
        carrierOrCourier: 'Internal Shelf Cycle Count',
        notes: `Manual stock adjustment of ${delta > 0 ? `+${delta}` : delta} pcs.`,
      });
    }

    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleSaveVariantStocks = (
    productId: string,
    updatedVariants: {
      id: string;
      variantSku: string;
      color?: string;
      size?: string;
      attributeName?: string;
      attributeValue?: string;
      stock: number;
    }[],
    totalStock: number,
    reason?: string
  ) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              stock: totalStock,
              variantsList: updatedVariants,
            }
          : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        localStorage.setItem(
          `fulfillio_variants_${productId}`,
          JSON.stringify(
            updatedVariants.map((v) => ({
              id: v.id,
              sku: v.variantSku,
              colorName: v.color || 'Standard',
              colorHex: '#ea580c',
              size: v.size || v.attributeValue || 'Standard',
              binCode: 'A-01-01',
              stock: v.stock,
              reserved: 0,
              available: v.stock,
            }))
          )
        );
        syncAdminProductsToMerchant(next);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
          );
        }
      } catch {
        // ignore
      }
      return next;
    });

    const target = products.find((p) => p.id === productId);
    triggerToast(
      `Stock updated for "${target?.title || productId}" to ${totalStock} pcs across ${updatedVariants.length} variants.`
    );
    setStockAdjustProduct(null);
  };

  const handleChangeProductBin = (productId: string, nextBinCode: string) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === productId ? { ...p, binCode: nextBinCode } : p));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      triggerToast(`Updated bin location for ${prod.fullSku} to ${nextBinCode}`);
      approveProductInDatabase(productId, nextBinCode, prod.stock || 0, (prod.stock || 0) > 0);
    }
  };

  // Direct One-Click Approval for a Pending Product -> Moves status directly to "Waiting for Stock"
  const handleApproveToAwaitingStock = (productId: string, binCode?: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const assignedBin =
      binCode ||
      (target.binCode && target.binCode !== 'Pending Approval' && target.binCode !== 'Assigned on intake'
        ? target.binCode
        : bins[0]?.code || 'A-01-02');

    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: 'APPROVED' as const,
              isDraft: false,
              binCode: assignedBin,
              stock: 0,
              stockAccepted: false,
              stockStatus: 'AWAITING_STOCK' as const,
              submittedAt: 'Approved just now',
            }
          : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    approveProductInDatabase(productId, assignedBin, 0, false);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }

    triggerToast(`Product "${target.title}" approved! Status changed to Waiting for Stock.`);
  };

  // Confirm Approval for a New Catalog Product or Draft-to-Publish Request
  const handleConfirmApproval = (
    mode: 'APPROVE' | 'REJECT',
    product: WarehouseProductItem,
    finalQty: number,
    finalBin: string,
    acceptStockNow?: boolean
  ) => {
    setApprovalModalData(null);
    if (mode === 'APPROVE') {
      const isStockAccepted = acceptStockNow === true;
      const actualStock = isStockAccepted ? finalQty : 0;

      setProducts((prev) => {
        const next = prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                status: 'APPROVED' as const,
                isDraft: false,
                binCode: finalBin,
                stock: actualStock,
                stockAccepted: isStockAccepted,
                stockStatus: isStockAccepted ? ('IN_STOCK' as const) : ('AWAITING_STOCK' as const),
                submittedAt: 'Approved just now',
              }
            : p
        );
        try {
          localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
          syncAdminProductsToMerchant(next);
        } catch {
          // ignore
        }
        return next;
      });

      // Persist directly to PostgreSQL database
      approveProductInDatabase(product.id, finalBin, actualStock, isStockAccepted);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
        );
      }

      triggerToast(
        `Product "${product.title}" approved! Status changed to Waiting for Stock.`
      );
    } else {
      const wasAlreadyStored = (product.stock || 0) > 0;
      if (wasAlreadyStored) {
        // Draft-to-Publish Rejection: Do NOT delete a product that already has warehouse stock; return it to Draft
        setProducts((prev) => {
          const next = prev.map((p) =>
            p.id === product.id ? { ...p, status: 'DRAFT' as const, isDraft: true } : p
          );
          try {
            localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
            syncAdminProductsToMerchant(next);
          } catch {}
          return next;
        });
        fetch(`${API_BASE}/inventory/products/${encodeURIComponent(product.id)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DRAFT' }),
        }).catch(() => {});
        triggerToast(
          `Rejected publish request for "${product.title}". Returned to Draft (${product.stock} units remain in warehouse).`
        );
      } else {
        // First-Time Product Rejection: Remove 0-stock first-time submission
        setProducts((prev) => {
          const next = prev.filter((p) => p.id !== product.id);
          try {
            localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
            syncAdminProductsToMerchant(next, [product]);
          } catch {
            // ignore
          }
          return next;
        });
        deleteProductFromDatabase(product.id, product.merchantCode);
        triggerToast(`Rejected product submission "${product.title}" (${product.fullSku}).`);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
        );
      }
    }
  };

  // Dedicated Stock Inbound Acceptance ("Accept Stock / Store Stock")
  const handleAcceptStock = (
    productId: string,
    quantity: number,
    binCode: string,
    challanOrTracking?: string,
    note?: string
  ) => {
    setAcceptStockProduct(null);
    let targetProduct: WarehouseProductItem | undefined;
    let newStockTotal = 0;

    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === productId) {
          targetProduct = p;
          newStockTotal = (p.stock || 0) + quantity;
          return {
            ...p,
            stock: newStockTotal,
            binCode: binCode || p.binCode,
            status: 'STOCK_STORED' as const,
            stockAccepted: true,
            stockStatus: 'IN_STOCK' as const,
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    // Persist stock intake directly to PostgreSQL database
    acceptStockInDatabase(productId, quantity, binCode, challanOrTracking, note);

    if (targetProduct) {
      appendStockMovement({
        type: 'INITIAL_INTAKE',
        merchantCode: targetProduct.merchantCode,
        merchantName: targetProduct.merchantName,
        productId: targetProduct.id,
        productTitle: targetProduct.title,
        sku: targetProduct.fullSku,
        deltaQty: quantity,
        previousStock: targetProduct.stock || 0,
        newStock: newStockTotal,
        binCode: binCode || targetProduct.binCode,
        referenceDocType: 'INWARD_CHALLAN',
        referenceNumber: challanOrTracking || `INW-${Date.now().toString().slice(-6)}`,
        operator: 'Warehouse Inbound Officer',
        carrierOrCourier: 'Direct Merchant Inbound Consignment',
        notes: note || `Stock accepted and stored into Bin ${binCode}. Ready for merchant orders.`,
      });

      triggerToast(
        `Stock received (+${quantity} pcs) for "${targetProduct.title}" into Bin ${binCode}. Product is now Active and Published!`
      );
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }

    setApprovalModalData(null);
  };

  // Inbound Stock Restock Handlers
  const handleApproveReplenishment = (
    replenishment: InboundStockReplenishment,
    finalQty: number,
    targetBin: string
  ) => {
    let updatedStock = 0;
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === replenishment.productId || p.fullSku === replenishment.productSku) {
          updatedStock = p.stock + finalQty;
          return {
            ...p,
            stock: updatedStock,
            binCode: targetBin || p.binCode,
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });

    setStockReplenishments((prev) => {
      const next = prev.map((r) =>
        r.id === replenishment.id
          ? {
              ...r,
              status: 'APPROVED' as const,
              requestedQty: finalQty,
              binCode: targetBin,
            }
          : r
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    appendStockMovement({
      type: 'RESTOCK',
      merchantCode: replenishment.merchantCode,
      merchantName: replenishment.merchantName,
      productId: replenishment.productId,
      productTitle: replenishment.productTitle,
      sku: replenishment.productSku,
      deltaQty: finalQty,
      previousStock: replenishment.currentStock,
      newStock: replenishment.currentStock + finalQty,
      binCode: targetBin || replenishment.binCode,
      referenceDocType: 'INWARD_CHALLAN',
      referenceNumber: replenishment.trackingRef || `CHL-${Date.now().toString().slice(-6)}`,
      operator: 'Inbound Receiving Officer',
      carrierOrCourier: replenishment.trackingRef ? `Tracking: ${replenishment.trackingRef}` : 'Steadfast Courier',
      notes: replenishment.note || `Approved inbound stock replenishment of +${finalQty} units.`,
    });

    triggerToast(
      `Approved & added +${finalQty} units to "${replenishment.productTitle}" in Bin ${targetBin}. New stock: ${updatedStock} units.`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleRejectReplenishment = (
    replenishment: InboundStockReplenishment,
    reason?: string
  ) => {
    setStockReplenishments((prev) => {
      const next = prev.map((r) =>
        r.id === replenishment.id ? { ...r, status: 'REJECTED' as const } : r
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    triggerToast(`Declined restock request for "${replenishment.productTitle}".`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  // Stock Withdrawal Handlers
  const handleApproveWithdrawal = (
    withdrawal: StockWithdrawalRequest,
    verifiedQty: number,
    dispatchNote?: string
  ) => {
    let remainingStock = 0;
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === withdrawal.productId || p.fullSku === withdrawal.productSku) {
          remainingStock = Math.max(0, p.stock - verifiedQty);
          return {
            ...p,
            stock: remainingStock,
          };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    setStockWithdrawals((prev) => {
      const next = prev.map((w) =>
        w.id === withdrawal.id
          ? {
              ...w,
              status: 'APPROVED' as const,
              withdrawQty: verifiedQty,
            }
          : w
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(next));
      } catch {}
      return next;
    });

    appendStockMovement({
      type: 'WITHDRAWAL',
      merchantCode: withdrawal.merchantCode,
      merchantName: withdrawal.merchantName,
      productId: withdrawal.productId,
      productTitle: withdrawal.productTitle,
      sku: withdrawal.productSku,
      deltaQty: -verifiedQty,
      previousStock: withdrawal.currentStock,
      newStock: Math.max(0, withdrawal.currentStock - verifiedQty),
      binCode: withdrawal.binCode,
      referenceDocType: 'GATE_PASS',
      referenceNumber: withdrawal.trackingRef || `GP-OUT-${Date.now().toString().slice(-6)}`,
      operator: 'Fulfillment Supervisor',
      carrierOrCourier: 'Merchant Authorized Transport',
      notes: dispatchNote || withdrawal.reason || `Stock withdrawal / recall of ${verifiedQty} pcs authorized.`,
    });

    triggerToast(
      `Approved & released -${verifiedQty} units of "${withdrawal.productTitle}". Remaining warehouse stock: ${remainingStock} units.`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleRejectWithdrawal = (
    withdrawal: StockWithdrawalRequest,
    reason?: string
  ) => {
    setStockWithdrawals((prev) => {
      const next = prev.map((w) =>
        w.id === withdrawal.id ? { ...w, status: 'REJECTED' as const } : w
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(next));
      } catch {}
      return next;
    });

    triggerToast(`Declined stock withdrawal for "${withdrawal.productTitle}".`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  // Unified Bulk Handlers
  const handleBulkApproveUnified = (items: UnifiedApprovalItem[]) => {
    const approvedProductIds = new Set<string>();
    const restockQtyMap = new Map<string, number>();
    const withdrawalQtyMap = new Map<string, number>();

    items.forEach((item) => {
      if (item.approvalType === 'NEW_PRODUCT') {
        approvedProductIds.add(item.id);
      } else if (item.approvalType === 'RESTOCK' && item.productId) {
        restockQtyMap.set(
          item.productId,
          (restockQtyMap.get(item.productId) || 0) + item.inboundQty
        );
      } else if (item.approvalType === 'WITHDRAWAL' && item.productId) {
        withdrawalQtyMap.set(
          item.productId,
          (withdrawalQtyMap.get(item.productId) || 0) + item.inboundQty
        );
      }
    });

    setProducts((prev) => {
      const next = prev.map((p) => {
        let updated = { ...p };
        if (approvedProductIds.has(p.id)) {
          updated.status = 'APPROVED';
          updated.binCode = p.binCode && p.binCode !== 'Pending Approval' ? p.binCode : bins[0]?.code || 'A-01-02';
        }
        if (restockQtyMap.has(p.id)) {
          updated.stock += restockQtyMap.get(p.id)!;
        }
        if (withdrawalQtyMap.has(p.id)) {
          updated.stock = Math.max(0, updated.stock - withdrawalQtyMap.get(p.id)!);
        }
        return updated;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {}
      return next;
    });

    const itemIds = new Set(items.map((i) => i.id));
    setStockReplenishments((prev) => {
      const next = prev.map((r) =>
        itemIds.has(r.id) ? { ...r, status: 'APPROVED' as const } : r
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    setStockWithdrawals((prev) => {
      const next = prev.map((w) =>
        itemIds.has(w.id) ? { ...w, status: 'APPROVED' as const } : w
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(next));
      } catch {}
      return next;
    });

    triggerToast(`Successfully processed and approved ${items.length} requests.`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkRejectUnified = (items: UnifiedApprovalItem[]) => {
    const productIdsToReject = new Set(
      items.filter((i) => i.approvalType === 'NEW_PRODUCT').map((i) => i.id)
    );
    const restockIdsToReject = new Set(
      items.filter((i) => i.approvalType === 'RESTOCK').map((i) => i.id)
    );
    const withdrawalIdsToReject = new Set(
      items.filter((i) => i.approvalType === 'WITHDRAWAL').map((i) => i.id)
    );

    setProducts((prev) => {
      const next = prev.filter((p) => !productIdsToReject.has(p.id));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    setStockReplenishments((prev) => {
      const next = prev.map((r) =>
        restockIdsToReject.has(r.id) ? { ...r, status: 'REJECTED' as const } : r
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    setStockWithdrawals((prev) => {
      const next = prev.map((w) =>
        withdrawalIdsToReject.has(w.id) ? { ...w, status: 'REJECTED' as const } : w
      );
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(next));
      } catch {}
      return next;
    });

    triggerToast(`Declined ${items.length} requests.`);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleSendRestockNotice = (productId: string, suggestedQty: number, note?: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      triggerToast(
        `Restock notice sent to ${prod.merchantName} for "${prod.title}" (${suggestedQty} units requested).`
      );
    }
  };

  const handleRecordManualRestock = (
    productId: string,
    quantity: number,
    binCode: string,
    note?: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    let updatedStock = prod.stock + quantity;

    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, stock: updatedStock, binCode: binCode || p.binCode } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    const newRecord: InboundStockReplenishment = {
      id: `SR-${Date.now()}`,
      productId: prod.id,
      productTitle: prod.title,
      productSku: prod.fullSku,
      merchantCode: prod.merchantCode,
      merchantName: prod.merchantName,
      category: prod.category,
      currentStock: prod.stock,
      requestedQty: quantity,
      binCode: binCode || prod.binCode,
      status: 'APPROVED',
      note: note || 'Walk-in / direct courier dock delivery',
      submittedAt: 'Just now',
      imageUrl: prod.imageUrl,
    };

    setStockReplenishments((prev) => {
      const next = [newRecord, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    appendStockMovement({
      type: 'RESTOCK',
      merchantCode: prod.merchantCode,
      merchantName: prod.merchantName,
      productId: prod.id,
      productTitle: prod.title,
      sku: prod.fullSku,
      deltaQty: quantity,
      previousStock: prod.stock,
      newStock: updatedStock,
      binCode: binCode || prod.binCode,
      referenceDocType: 'INWARD_CHALLAN',
      referenceNumber: `CHL-MAN-${Date.now().toString().slice(-6)}`,
      operator: 'Receiving Dock Operator',
      carrierOrCourier: 'Direct Dock Drop-off / Walk-in Restock',
      notes: note || 'Walk-in / direct courier dock delivery',
    });

    triggerToast(
      `Received & added +${quantity} units to "${prod.title}" in Bin ${binCode}. New stock: ${updatedStock} units.`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleRecordManualWithdrawal = (
    productId: string,
    quantity: number,
    reason?: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const remaining = Math.max(0, prod.stock - quantity);

    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, stock: remaining } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
      } catch {}
      return next;
    });

    const newWithdrawal: StockWithdrawalRequest = {
      id: `SW-${Date.now()}`,
      productId: prod.id,
      productTitle: prod.title,
      productSku: prod.fullSku,
      merchantCode: prod.merchantCode,
      merchantName: prod.merchantName,
      category: prod.category,
      currentStock: prod.stock,
      withdrawQty: quantity,
      binCode: prod.binCode,
      status: 'APPROVED',
      reason: reason || 'Direct merchant pickup / offline stock recall',
      submittedAt: 'Just now',
      imageUrl: prod.imageUrl,
    };

    setStockWithdrawals((prev) => {
      const next = [newWithdrawal, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(next));
      } catch {}
      return next;
    });

    appendStockMovement({
      type: 'WITHDRAWAL',
      merchantCode: prod.merchantCode,
      merchantName: prod.merchantName,
      productId: prod.id,
      productTitle: prod.title,
      sku: prod.fullSku,
      deltaQty: -quantity,
      previousStock: prod.stock,
      newStock: remaining,
      binCode: prod.binCode,
      referenceDocType: 'GATE_PASS',
      referenceNumber: `GP-MAN-${Date.now().toString().slice(-6)}`,
      operator: 'Fulfillment Supervisor',
      carrierOrCourier: 'Merchant Authorized Direct Pickup',
      notes: reason || 'Direct merchant pickup / offline stock recall',
    });

    triggerToast(
      `Deducted & released -${quantity} units of "${prod.title}" from Bin ${prod.binCode}. Remaining stock: ${remaining} units.`
    );

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleAddProduct = (newProduct: WarehouseProductItem) => {
    setProducts((prev) => {
      const next = [newProduct, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast(
      `Added ${newProduct.fullSku} under ${newProduct.merchantCode} in Bin ${newProduct.binCode}.`
    );
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleMoveToDraft = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, status: 'DRAFT' as const, isDraft: true } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });

    // Sync to PostgreSQL (pgAdmin) database
    fetch(`${API_BASE}/inventory/products/${encodeURIComponent(productId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DRAFT' }),
    }).catch(() => {});

    if (prod) {
      triggerToast(`Product "${prod.title}" moved to Draft. You can restore it anytime.`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleRestoreProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, status: 'PENDING_APPROVAL' as const, isDraft: false } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });

    // Sync to PostgreSQL (pgAdmin) database — requires Admin Approval again
    fetch(`${API_BASE}/inventory/products/${encodeURIComponent(productId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PENDING_APPROVAL' }),
    }).catch(() => {});

    if (prod) {
      triggerToast(`Product "${prod.title}" moved to Product Approval queue for review.`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkMoveToDraft = (productIds: string[]) => {
    const idSet = new Set(productIds);
    setProducts((prev) => {
      const next = prev.map((p) =>
        idSet.has(p.id) ? { ...p, status: 'DRAFT' as const, isDraft: true } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });

    // Sync each to PostgreSQL (pgAdmin) database
    productIds.forEach((id) => {
      fetch(`${API_BASE}/inventory/products/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' }),
      }).catch(() => {});
    });

    triggerToast(`Moved ${productIds.length} products to Draft.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleBulkRestore = (productIds: string[]) => {
    const idSet = new Set(productIds);
    setProducts((prev) => {
      const next = prev.map((p) =>
        idSet.has(p.id) ? { ...p, status: 'PENDING_APPROVAL' as const, isDraft: false } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });

    // Sync each to PostgreSQL (pgAdmin) database — requires Admin Approval again
    productIds.forEach((id) => {
      fetch(`${API_BASE}/inventory/products/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PENDING_APPROVAL' }),
      }).catch(() => {});
    });

    triggerToast(`Moved ${productIds.length} products to Product Approval queue.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod && (prod.stock || 0) >= 1) {
      triggerToast(
        `Cannot delete "${prod.title}": Warehouse currently holds ${prod.stock} pcs in stock. Product stock must be 0 before deleting.`
      );
      return;
    }

    setProducts((prev) => {
      const removed = prev.filter((p) => p.id === productId);
      const next = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next, removed);
      } catch {
        // ignore
      }
      return next;
    });
    deleteProductFromDatabase(productId, prod?.merchantCode);
    if (prod) {
      triggerToast(`Product "${prod.title}" (${prod.fullSku}) deleted from database.`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleDeleteProducts = (productIds: string[]) => {
    const idSet = new Set(productIds);
    const selected = products.filter((p) => idSet.has(p.id));
    const withStock = selected.filter((p) => (p.stock || 0) >= 1);
    const deletable = selected.filter((p) => (p.stock || 0) === 0);

    if (withStock.length > 0 && deletable.length === 0) {
      triggerToast(
        `Cannot delete: ${withStock.length} selected product(s) have stock in the warehouse (> 0 pcs). Stock must be 0 to delete.`
      );
      return;
    }

    const deletableIds = new Set(deletable.map((p) => p.id));
    setProducts((prev) => {
      const removed = prev.filter((p) => deletableIds.has(p.id));
      const next = prev.filter((p) => !deletableIds.has(p.id));
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next, removed);
      } catch {
        // ignore
      }
      return next;
    });
    deletable.forEach((p) => {
      deleteProductFromDatabase(p.id, p.merchantCode);
    });
    if (withStock.length > 0) {
      triggerToast(
        `Deleted ${deletable.length} product(s) with 0 stock. Skipped ${withStock.length} product(s) that have warehouse stock.`
      );
    } else {
      triggerToast(`Successfully deleted ${deletable.length} product(s) from database.`);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleAllowEdit = (productId: string) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, editState: 'EDIT_ALLOWED' as const } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast('Edit access granted to merchant.');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleApproveRevision = (productId: string) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, editState: null } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast('Product revision approved.');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleRejectRevision = (productId: string) => {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === productId ? { ...p, editState: null } : p
      );
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast('Product revision rejected.');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleToggleSuspend = (productId: string) => {
    let nextStatusText = '';
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === productId) {
          const willSuspend = !p.isSuspended;
          nextStatusText = willSuspend ? 'suspended' : 'reactivated';
          return { ...p, isSuspended: willSuspend };
        }
        return p;
      });
      try {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
        syncAdminProductsToMerchant(next);
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast(`Product has been ${nextStatusText}.`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'ProductsManager' } })
      );
    }
  };

  const handleCreateBin = (newBin: WarehouseBin) => {
    setBins((prev) => {
      const next = [newBin, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_BINS, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    triggerToast(`Warehouse Bin ${newBin.code} created successfully.`);
  };

  const totalPendingQueue =
    products.filter((p) => p.status === 'PENDING_APPROVAL').length +
    stockReplenishments.filter((r) => r.status === 'PENDING_APPROVAL').length +
    stockWithdrawals.filter((w) => w.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 text-navy-800 dark:text-navy-800 dark:text-white">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white/90 dark:bg-navy-900/90 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
              Warehouse Master Products Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Multi-merchant catalog, physical stock levels, and product approval workflow
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product (Under Merchant)</span>
          </Link>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {bannerMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm font-semibold shadow-md shadow-emerald-950/5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Summary Stats Cards */}
      <ProductsStatsOverview
        products={products}
        bins={bins}
        pendingRestockCount={
          stockReplenishments.filter((r) => r.status === 'PENDING_APPROVAL').length +
          stockWithdrawals.filter((w) => w.status === 'PENDING_APPROVAL').length
        }
      />

      {/* The Single Master Table with All Products & Approvals */}
      <ProductsCatalogTab
        products={products}
        bins={bins}
        initialFilterTab={catalogTab}
        onFilterTabChange={handleCatalogTabChange}
        onAdjustStock={handleAdjustStock}
        onOpenStockAdjustModal={(prod) => setStockAdjustProduct(prod)}
        onChangeProductBin={handleChangeProductBin}
        onOpenAddProduct={() => setAddProductModalOpen(true)}
        onApproveProduct={handleApproveToAwaitingStock}
        onOpenAcceptStockModal={(prod) => setAcceptStockProduct(prod)}
        onOpenApprovalModal={(mode, product, selectedBin) =>
          setApprovalModalData({ mode, product, selectedBin })
        }
        onBulkApproveProductsWithSlots={handleBulkApproveWithSlots}
        onBulkApproveProducts={handleBulkApproveProducts}
        onBulkRejectProducts={handleBulkRejectProducts}
        onMoveToDraft={handleMoveToDraft}
        onRestoreProduct={handleRestoreProduct}
        onPermanentDelete={handleDeleteProduct}
        onBulkMoveToDraft={handleBulkMoveToDraft}
        onBulkRestore={handleBulkRestore}
        onBulkPermanentDelete={handleDeleteProducts}
        onDeleteProduct={handleDeleteProduct}
        onDeleteProducts={handleDeleteProducts}
        onAllowEdit={handleAllowEdit}
        onApproveRevision={handleApproveRevision}
        onRejectRevision={handleRejectRevision}
        onToggleSuspend={handleToggleSuspend}
      />

      {/* Modals */}
      <StockAdjustModal
        isOpen={Boolean(stockAdjustProduct)}
        onClose={() => setStockAdjustProduct(null)}
        product={stockAdjustProduct}
        onAdjustStock={(id, delta) => handleAdjustStock(id, delta)}
        onSaveVariantStocks={handleSaveVariantStocks}
      />

      <ApprovalActionModal
        isOpen={Boolean(approvalModalData)}
        onClose={() => setApprovalModalData(null)}
        approvalData={approvalModalData}
        bins={bins}
        onConfirm={handleConfirmApproval}
      />

      <AcceptStockModal
        isOpen={Boolean(acceptStockProduct)}
        onClose={() => setAcceptStockProduct(null)}
        product={acceptStockProduct}
        bins={bins}
        onConfirm={handleAcceptStock}
      />

      <RestockIntakeModal
        isOpen={Boolean(restockModalData)}
        onClose={() => setRestockModalData(null)}
        replenishment={restockModalData}
        bins={bins}
        onConfirm={handleApproveReplenishment}
      />

      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        bins={bins}
        onAddProduct={handleAddProduct}
      />

      <CreateBinModal
        isOpen={newBinModalOpen}
        onClose={() => setNewBinModalOpen(false)}
        bins={bins}
        onCreateBin={handleCreateBin}
      />
    </div>
  );
}

export default ProductsManager;
