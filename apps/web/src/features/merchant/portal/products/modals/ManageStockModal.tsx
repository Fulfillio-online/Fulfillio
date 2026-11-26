'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertCircle,
  ArrowUpRight,
  RotateCcw,
  Package,
  Plus,
  Minus,
  Trash2,
  SlidersHorizontal,
  Check,
  Loader2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { MerchantProductItem } from '../../types';
import {
  ManageStockMode,
  ManageVariantsAndStockPayload,
  NewVariantStockInput,
  StockRequestType,
  VariantQuantityAdjustmentInput,
} from '../types';

export interface SubmitStockRequestPayload {
  productId: string;
  type: StockRequestType;
  scope?: 'VARIANT' | 'ALL_VARIANTS';
  requestedQty: number;
  variantId?: string;
  variantSku?: string;
  color?: string;
  size?: string;
  note?: string;
  reason?: string;
  destination?: string;
  carrier?: string;
  trackingRef?: string;
}

interface ManageStockModalProps {
  isOpen: boolean;
  product: MerchantProductItem | null;
  products?: MerchantProductItem[];
  initialMode?: ManageStockMode;
  onClose: () => void;
  onSubmitRequest: (
    payload: SubmitStockRequestPayload
  ) => void | Promise<{ ok: boolean; error?: string } | void>;
  onManageVariantsAndStock?: (
    payload: ManageVariantsAndStockPayload
  ) => Promise<{ ok: boolean; error?: string }>;
}

const RETURN_REASONS = [
  'Shop / Retail Demand (দোকানের সরাসরি বিক্রির জন্য স্টক প্রত্যাহার)',
  'Defective / QC Inspection (ত্রুটিপূর্ণ পণ্য ওয়্যারহাউস থেকে ফেরত)',
  'Seasonal Pullout (মৌসুম শেষে অবিক্রিত পণ্য আউটলেটে স্থানান্তর)',
  'Outlet Relocation (অন্য শো-রুমে স্থানান্তর)',
  'Other Custom Reason (অন্যান্য কারণ)',
];

const COURIER_OPTIONS = [
  'Steadfast Courier Consignment',
  'Pathao Logistics',
  'RedX Parcel',
  'SA Paribahan Cargo',
  'Merchant Own Delivery Van / Agent',
];

const QUICK_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];
const EMPTY_PRODUCTS: MerchantProductItem[] = [];

interface StagedNewVariant extends NewVariantStockInput {
  tempId: string;
  previewSku: string;
}

export function ManageStockModal({
  isOpen,
  product,
  products = EMPTY_PRODUCTS,
  initialMode = 'ADJUST',
  onClose,
  onSubmitRequest,
  onManageVariantsAndStock,
}: ManageStockModalProps) {
  const [activeProduct, setActiveProduct] = useState<MerchantProductItem | null>(product);
  const [activeMode, setActiveMode] = useState<ManageStockMode>(initialMode);

  // =========================================================================
  // ADJUST MODE STATE (Edit existing variant/size qty + add new variants)
  // =========================================================================
  const [adjustedQtys, setAdjustedQtys] = useState<Record<string, number>>({});
  const [addedQtys, setAddedQtys] = useState<Record<string, string>>({});
  const [stagedNewVariants, setStagedNewVariants] = useState<StagedNewVariant[]>([]);
  const [showAddVariantForm, setShowAddVariantForm] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#111827');
  const [newVariantImageUrl, setNewVariantImageUrl] = useState('');
  const [selectedQuickSizes, setSelectedQuickSizes] = useState<string[]>([]);
  const [perSizeQtys, setPerSizeQtys] = useState<Record<string, number>>({});
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [newVariantQty, setNewVariantQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isSavingAdjust, setIsSavingAdjust] = useState(false);

  // =========================================================================
  // RESTOCK / RETURN MODE STATE
  // =========================================================================
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  const [restockQty, setRestockQty] = useState(50);
  const [carrier, setCarrier] = useState(COURIER_OPTIONS[0]);
  const [trackingRef, setTrackingRef] = useState('');
  const [restockNote, setRestockNote] = useState('');

  const [returnQty, setReturnQty] = useState(1);
  const [recallScope, setRecallScope] = useState<'VARIANT' | 'ALL_VARIANTS'>('VARIANT');
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [destination, setDestination] = useState('Dhanmondi Branch, Road 27, Dhaka');
  const [recipientContact, setRecipientContact] = useState('01711-000000 (Outlet Manager)');
  const [returnNote, setReturnNote] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmittingOp, setIsSubmittingOp] = useState(false);

  const firstProduct = products.length > 0 ? products[0] : null;

  useEffect(() => {
    if (isOpen) {
      const target = product || firstProduct;
      setActiveProduct(target);
      setActiveMode(initialMode || 'ADJUST');
      setStagedNewVariants([]);
      setAddedQtys({});
      setShowAddVariantForm(false);
      setNewColorName('');
      setNewColorHex('#111827');
      setNewVariantImageUrl('');
      setSelectedQuickSizes([]);
      setPerSizeQtys({});
      setCustomSizeInput('');
      setNewVariantQty(10);
      setAdjustReason('');
      setAdjustError(null);
      setRequestError(null);
      setIsSubmittingOp(false);
      setRecallScope('VARIANT');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialMode, product?.id, firstProduct?.id]);

  // Initialize adjustedQtys whenever activeProduct changes
  useEffect(() => {
    if (!activeProduct) {
      setAdjustedQtys({});
      setAddedQtys({});
      return;
    }
    const map: Record<string, number> = {};
    if (activeProduct.variantsList && activeProduct.variantsList.length > 0) {
      activeProduct.variantsList.forEach((v) => {
        map[v.id] = Math.max(0, Number(v.stock) || 0);
      });
    } else {
      map['__default__'] = Math.max(0, Number(activeProduct.stock) || 0);
    }
    setAdjustedQtys(map);
    setAddedQtys({});
    setStagedNewVariants([]);
    setPerSizeQtys({});
    setAdjustError(null);
    setRecallScope('VARIANT');
  }, [activeProduct]);

  // Available colors (prefer live variantsList colors so stale/deleted ghost colors never appear)
  const availableColors = useMemo(() => {
    if (!activeProduct) return [];
    if (activeProduct.variantsList && activeProduct.variantsList.length > 0) {
      const fromVariants = Array.from(
        new Set(
          activeProduct.variantsList
            .map((v) => v.color)
            .filter((c): c is string => Boolean(c && c.trim()))
        )
      );
      if (fromVariants.length > 0) return fromVariants;
    }
    if (activeProduct.colors && activeProduct.colors.length > 0) {
      return activeProduct.colors.map((c) => c.name);
    }
    return [];
  }, [activeProduct]);

  useEffect(() => {
    if (availableColors.length > 0) {
      if (!selectedColor || !availableColors.includes(selectedColor)) {
        setSelectedColor(availableColors[0]);
      }
    } else {
      setSelectedColor('');
    }
  }, [availableColors, selectedColor]);

  // Available sizes for selectedColor
  const availableSizes = useMemo(() => {
    if (!activeProduct) return [];
    if (activeProduct.variantsList && activeProduct.variantsList.length > 0) {
      const filtered = selectedColor
        ? activeProduct.variantsList.filter(
            (v) => (v.color || '').toLowerCase() === selectedColor.toLowerCase()
          )
        : activeProduct.variantsList;
      return Array.from(
        new Set(
          filtered
            .map((v) => v.size || v.attributeValue || '')
            .filter((s): s is string => Boolean(s && s.trim()))
        )
      );
    }
    if (activeProduct.sizes && activeProduct.sizes.length > 0) {
      return activeProduct.sizes;
    }
    return [];
  }, [activeProduct, selectedColor]);

  useEffect(() => {
    if (availableSizes.length > 0) {
      if (!selectedSize || !availableSizes.includes(selectedSize)) {
        setSelectedSize(availableSizes[0]);
      }
    } else {
      setSelectedSize('');
    }
  }, [availableSizes, selectedSize]);

  const matchedVariant = useMemo(() => {
    if (!activeProduct?.variantsList || activeProduct.variantsList.length === 0) return null;
    const isGenericSize = (s?: string) =>
      ['', 'standard', 'free size', 'free', 'default', 'one size'].includes(
        (s || '').trim().toLowerCase()
      );
    const tColor = selectedColor.trim().toLowerCase();
    const tSize = selectedSize.trim().toLowerCase();
    return (
      activeProduct.variantsList.find((v) => {
        const vColor = (v.color || '').trim().toLowerCase();
        const vSize = (v.size || v.attributeValue || '').trim().toLowerCase();
        return (!tColor || vColor === tColor) && (!tSize || vSize === tSize);
      }) ||
      activeProduct.variantsList.find((v) => {
        const vColor = (v.color || '').trim().toLowerCase();
        const vSize = (v.size || v.attributeValue || '').trim().toLowerCase();
        return (!tColor || vColor === tColor) && isGenericSize(tSize) && isGenericSize(vSize);
      }) ||
      (tColor
        ? activeProduct.variantsList.find(
            (v) => (v.color || '').trim().toLowerCase() === tColor
          ) || null
        : null)
    );
  }, [activeProduct, selectedColor, selectedSize]);

  const currentVariantStock = useMemo(() => {
    if (!activeProduct) return 0;
    if (matchedVariant !== null) return matchedVariant.stock;
    return activeProduct.variantsList && activeProduct.variantsList.length > 0
      ? 0
      : activeProduct.stock;
  }, [activeProduct, matchedVariant]);

  const totalProductStock = useMemo(() => {
    if (!activeProduct) return 0;
    if (activeProduct.variantsList && activeProduct.variantsList.length > 0) {
      return activeProduct.variantsList.reduce(
        (sum, v) => sum + (Number(v.stock) || 0),
        0
      );
    }
    return Number(activeProduct.stock) || 0;
  }, [activeProduct]);

  const effectiveReturnAvailableStock =
    activeMode === 'RETURN' && recallScope === 'ALL_VARIANTS'
      ? totalProductStock
      : currentVariantStock;

  useEffect(() => {
    if (effectiveReturnAvailableStock > 0) {
      setReturnQty((prev) =>
        Math.min(prev > 0 ? prev : 1, effectiveReturnAvailableStock)
      );
    } else {
      setReturnQty(0);
    }
  }, [effectiveReturnAvailableStock]);

  const quickSizeOptions = useMemo(() => {
    const prodSizes = activeProduct?.sizes || [];
    return Array.from(new Set([...QUICK_SIZES, ...prodSizes.filter(Boolean)]));
  }, [activeProduct]);

  const parsedCustomSizes = useMemo(
    () =>
      customSizeInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [customSizeInput]
  );

  const activeChosenSizes = useMemo(
    () => Array.from(new Set([...selectedQuickSizes, ...parsedCustomSizes])),
    [selectedQuickSizes, parsedCustomSizes]
  );

  const checkVariantDuplicate = (colorName: string, sizeName: string) => {
    const cLower = colorName.trim().toLowerCase();
    const sLower = sizeName.trim().toLowerCase();
    const inExisting = (activeProduct?.variantsList || []).some(
      (v) =>
        (v.color || '').trim().toLowerCase() === cLower &&
        (v.size || v.attributeValue || '').trim().toLowerCase() === sLower
    );
    const inStaged = stagedNewVariants.some(
      (v) =>
        (v.color || '').trim().toLowerCase() === cLower &&
        (v.size || v.attributeValue || '').trim().toLowerCase() === sLower
    );
    return inExisting || inStaged;
  };

  const pendingFormResult = useMemo(() => {
    if (!showAddVariantForm || !activeProduct) {
      return { entries: [] as StagedNewVariant[], skipped: [] as string[] };
    }
    const trimmedColor = newColorName.trim();
    if (!trimmedColor && activeChosenSizes.length === 0) {
      return { entries: [] as StagedNewVariant[], skipped: [] as string[] };
    }

    const sizesToCreate = activeChosenSizes.length > 0 ? activeChosenSizes : [''];
    const existingList = activeProduct.variantsList || [];
    const entries: StagedNewVariant[] = [];
    const skipped: string[] = [];

    for (const sz of sizesToCreate) {
      if (checkVariantDuplicate(trimmedColor, sz)) {
        skipped.push([trimmedColor, sz].filter(Boolean).join(' / ') || 'Standard');
        continue;
      }

      const varCode =
        [trimmedColor, sz]
          .filter(Boolean)
          .join('-')
          .toUpperCase()
          .replace(/[^A-Z0-9_-]/g, '-') ||
        `V${existingList.length + stagedNewVariants.length + entries.length + 1}`;

      const qty = Math.max(
        0,
        Math.round(Number(sz ? perSizeQtys[sz] ?? newVariantQty : newVariantQty) || 0)
      );

      entries.push({
        tempId: `new-form-${trimmedColor}-${sz || 'std'}-${entries.length}`,
        color: trimmedColor || undefined,
        hex: newColorHex || '#111827',
        size: sz || undefined,
        price: activeProduct.price,
        imageUrl: newVariantImageUrl || undefined,
        stock: qty,
        previewSku: `${activeProduct.sku}-${varCode}`,
      });
    }

    return { entries, skipped };
  }, [
    showAddVariantForm,
    activeProduct,
    newColorName,
    newColorHex,
    newVariantImageUrl,
    activeChosenSizes,
    perSizeQtys,
    newVariantQty,
    stagedNewVariants,
  ]);

  // Calculate ADJUST mode totals & pending changes (includes unstaged form entries)
  const adjustSummary = useMemo(() => {
    if (!activeProduct) return { currentTotal: 0, newTotal: 0, changedCount: 0 };
    const existingList = activeProduct.variantsList || [];
    let currentTotal = 0;
    let existingNewTotal = 0;
    let changedCount = 0;

    if (existingList.length > 0) {
      for (const v of existingList) {
        const orig = Math.max(0, Number(v.stock) || 0);
        const next = adjustedQtys[v.id] !== undefined ? adjustedQtys[v.id] : orig;
        currentTotal += orig;
        existingNewTotal += next;
        if (next !== orig) changedCount += 1;
      }
    } else {
      const orig = Math.max(0, Number(activeProduct.stock) || 0);
      const next = adjustedQtys['__default__'] !== undefined ? adjustedQtys['__default__'] : orig;
      currentTotal = orig;
      existingNewTotal = next;
      if (next !== orig) changedCount = 1;
    }

    const stagedTotal = stagedNewVariants.reduce((s, nv) => s + (Number(nv.stock) || 0), 0);
    const pendingFormTotal = pendingFormResult.entries.reduce(
      (s, nv) => s + (Number(nv.stock) || 0),
      0
    );
    return {
      currentTotal,
      newTotal: existingNewTotal + stagedTotal + pendingFormTotal,
      changedCount,
    };
  }, [activeProduct, adjustedQtys, stagedNewVariants, pendingFormResult]);

  if (!isOpen || !activeProduct) return null;

  const isProductLocked =
    Boolean(activeProduct.isSuspended) || activeProduct.status === 'REJECTED';

  const handleToggleQuickSize = (sz: string) => {
    setSelectedQuickSizes((prev) => {
      if (prev.includes(sz)) {
        return prev.filter((item) => item !== sz);
      }
      setPerSizeQtys((qMap) =>
        qMap[sz] !== undefined ? qMap : { ...qMap, [sz]: newVariantQty }
      );
      return [...prev, sz];
    });
  };

  const handleOpenAddSizeForColor = (colorName: string) => {
    const matchedColorObj = activeProduct.colors?.find(
      (co) => co.name.toLowerCase() === colorName.toLowerCase()
    );
    setShowAddVariantForm(true);
    setNewColorName(colorName);
    if (matchedColorObj?.hex) setNewColorHex(matchedColorObj.hex);
    setNewVariantImageUrl(matchedColorObj?.imageUrl || '');
    setSelectedQuickSizes([]);
    setPerSizeQtys({});
    setCustomSizeInput('');
    setAdjustError(null);
  };

  const handleAddStagedVariants = () => {
    setAdjustError(null);
    const trimmedColor = newColorName.trim();

    if (!trimmedColor && activeChosenSizes.length === 0) {
      setAdjustError('Please enter a Color name or select/enter at least one Size.');
      return;
    }

    const { entries, skipped } = pendingFormResult;
    if (entries.length === 0 && skipped.length > 0) {
      setAdjustError(
        `Variant already exists: ${skipped.join(', ')}. Adjust its quantity in the list below.`
      );
      return;
    }

    if (entries.length > 0) {
      const stamped = entries.map((entry, idx) => ({
        ...entry,
        tempId: `new-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      }));
      setStagedNewVariants((prev) => [...prev, ...stamped]);
      setSelectedQuickSizes([]);
      setPerSizeQtys({});
      setCustomSizeInput('');
      setNewVariantImageUrl('');
      setShowAddVariantForm(false);
    }

    if (skipped.length > 0) {
      setAdjustError(`Skipped duplicate(s): ${skipped.join(', ')}`);
    }
  };

  const handleSaveAdjustments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProductLocked) return;

    const existingList = activeProduct.variantsList || [];
    const adjustments: VariantQuantityAdjustmentInput[] = [];

    if (existingList.length > 0) {
      for (const v of existingList) {
        const orig = Math.max(0, Number(v.stock) || 0);
        const next = adjustedQtys[v.id] !== undefined ? adjustedQtys[v.id] : orig;
        if (next !== orig) {
          adjustments.push({
            variantId: v.id,
            variantSku: v.variantSku,
            color: v.color,
            size: v.size,
            newQuantity: Math.max(0, Math.round(next)),
            reason: adjustReason.trim() || undefined,
          });
        }
      }
    } else {
      const orig = Math.max(0, Number(activeProduct.stock) || 0);
      const next = adjustedQtys['__default__'] !== undefined ? adjustedQtys['__default__'] : orig;
      if (next !== orig) {
        adjustments.push({
          variantSku: activeProduct.sku,
          newQuantity: Math.max(0, Math.round(next)),
          reason: adjustReason.trim() || undefined,
        });
      }
    }

    const combinedNewVariants = [...stagedNewVariants, ...pendingFormResult.entries];
    const newVariants: NewVariantStockInput[] = combinedNewVariants.map((nv) => ({
      color: nv.color,
      hex: nv.hex,
      size: nv.size,
      price: nv.price,
      imageUrl: nv.imageUrl,
      stock: Math.max(0, Math.round(Number(nv.stock) || 0)),
    }));

    if (adjustments.length === 0 && newVariants.length === 0) {
      if (pendingFormResult.skipped.length > 0) {
        setAdjustError(
          `Variant already exists: ${pendingFormResult.skipped.join(', ')}. Adjust its quantity directly in the list below.`
        );
      } else {
        setAdjustError('No quantity changes or new variants to save.');
      }
      return;
    }

    if (!onManageVariantsAndStock) {
      onClose();
      return;
    }

    setIsSavingAdjust(true);
    setAdjustError(null);
    const res = await onManageVariantsAndStock({
      productId: activeProduct.id,
      newVariants,
      adjustments,
      reason: adjustReason.trim() || undefined,
    });
    setIsSavingAdjust(false);

    if (res.ok) {
      onClose();
    } else if (res.error) {
      setAdjustError(res.error);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);

    if (activeMode === 'RESTOCK') {
      if (restockQty <= 0) {
        setRequestError('Restock quantity must be at least 1 unit.');
        return;
      }
      setIsSubmittingOp(true);
      try {
        const res = await onSubmitRequest({
          productId: activeProduct.id,
          type: 'RESTOCK',
          requestedQty: restockQty,
          variantId: matchedVariant?.id,
          variantSku: matchedVariant?.variantSku || activeProduct.sku,
          color: selectedColor || undefined,
          size: selectedSize || undefined,
          carrier,
          trackingRef: trackingRef.trim() || undefined,
          note: restockNote.trim() || undefined,
        });
        if (res && typeof res === 'object' && 'ok' in res && !res.ok) {
          setRequestError(res.error || 'Failed to submit inbound restock request.');
          return;
        }
        onClose();
      } finally {
        setIsSubmittingOp(false);
      }
    } else if (activeMode === 'RETURN') {
      const isAllVariantsScope =
        recallScope === 'ALL_VARIANTS' && existingVariants.length > 1;
      const availableForReturn = isAllVariantsScope
        ? totalProductStock
        : currentVariantStock;

      if (returnQty <= 0) {
        setRequestError('Recall / Return quantity must be at least 1 unit.');
        return;
      }
      if (returnQty > availableForReturn) {
        setRequestError(
          `Cannot recall more than available warehouse stock (${availableForReturn} units) for ${
            isAllVariantsScope
              ? 'all variants'
              : [selectedColor, selectedSize].filter(Boolean).join(' / ') || 'this product'
          }.`
        );
        return;
      }
      const finalReason =
        returnReason.startsWith('Other') && customReason.trim()
          ? customReason.trim()
          : returnReason;

      setIsSubmittingOp(true);
      try {
        const res = await onSubmitRequest({
          productId: activeProduct.id,
          type: 'RETURN',
          scope: isAllVariantsScope ? 'ALL_VARIANTS' : 'VARIANT',
          requestedQty: returnQty,
          variantId: isAllVariantsScope ? undefined : matchedVariant?.id,
          variantSku: isAllVariantsScope
            ? activeProduct.sku
            : matchedVariant?.variantSku || activeProduct.sku,
          color: isAllVariantsScope ? undefined : selectedColor || undefined,
          size: isAllVariantsScope ? undefined : selectedSize || undefined,
          reason: finalReason,
          destination: `${destination.trim()}${
            recipientContact.trim() ? ` (Contact: ${recipientContact.trim()})` : ''
          }`,
          note: returnNote.trim() || undefined,
          trackingRef: `RET-${Date.now().toString().slice(-6)}`,
        });
        if (res && typeof res === 'object' && 'ok' in res && !res.ok) {
          setRequestError(res.error || 'Failed to submit product recall / return request.');
          return;
        }
        onClose();
      } finally {
        setIsSubmittingOp(false);
      }
    }
  };

  const existingVariants = activeProduct.variantsList || [];
  const hasAdjustChanges =
    adjustSummary.changedCount > 0 ||
    stagedNewVariants.length > 0 ||
    pendingFormResult.entries.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-2xl p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 cursor-default max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                activeMode === 'ADJUST'
                  ? 'bg-orange-500/10 border border-orange-500/20 text-orange-500'
                  : activeMode === 'RESTOCK'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
              }`}
            >
              {activeMode === 'ADJUST' ? (
                <SlidersHorizontal className="h-5 w-5" />
              ) : activeMode === 'RESTOCK' ? (
                <ArrowUpRight className="h-5 w-5" />
              ) : (
                <RotateCcw className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-navy-900 dark:text-white">
                {activeMode === 'ADJUST'
                  ? 'Manage Variants & Stock Quantities'
                  : activeMode === 'RESTOCK'
                  ? 'Inbound Restock Request'
                  : 'Product Return & Recall Request'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeMode === 'ADJUST'
                  ? 'Add new color/size variants and adjust stock quantities per variant & size.'
                  : activeMode === 'RESTOCK'
                  ? 'Send additional inventory to warehouse dock for intake & slotting.'
                  : 'Withdraw inventory from warehouse back to your shop or physical outlet.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 3-Tab Switcher: Variants & Qty | Restock | Return */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-navy-950 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMode('ADJUST')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'ADJUST'
                ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-sm font-bold border border-orange-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Variants &amp; Qty</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('RESTOCK')}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'RESTOCK'
                ? 'bg-white dark:bg-navy-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold border border-emerald-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Restock (+)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRequestError(null);
              setActiveMode('RETURN');
            }}
            className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'RETURN'
                ? 'bg-white dark:bg-navy-800 text-amber-600 dark:text-amber-400 shadow-sm font-bold border border-amber-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Recall / Return (-)</span>
          </button>
        </div>

        {/* Product Selector Dropdown if multiple products exist */}
        {products.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Product:
            </label>
            <select
              value={activeProduct.id}
              onChange={(e) => {
                const found = products.find((p) => p.id === e.target.value);
                if (found) setActiveProduct(found);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.sku}) — Total Stock: {p.stock} pcs
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product summary card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10">
          <div className="relative h-12 w-12 rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
            {activeProduct.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeProduct.imageUrl}
                alt={activeProduct.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-slate-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-navy-900 dark:text-slate-200 text-xs sm:text-sm truncate">
              {activeProduct.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs flex-wrap">
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {activeProduct.sku}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 dark:text-slate-300">
                Total Stock:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {activeProduct.stock}
                </strong>{' '}
                units
              </span>
              {activeProduct.bin && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Bin: {activeProduct.bin}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MODE 1: VARIANTS & QTY ADJUSTMENT + ADD NEW VARIANT               */}
        {/* ================================================================= */}
        {activeMode === 'ADJUST' ? (
          <form onSubmit={handleSaveAdjustments} className="space-y-4">
            {isProductLocked && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  This product is {activeProduct.isSuspended ? 'suspended' : 'rejected'} and cannot be modified.
                </span>
              </div>
            )}

            {/* Add New Variant Toggle Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h4 className="text-xs font-bold text-navy-900 dark:text-white">
                  Variant &amp; Size Stock Matrix (
                  {existingVariants.length +
                    stagedNewVariants.length +
                    pendingFormResult.entries.length}
                  )
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Add stock via <strong className="text-emerald-600 dark:text-emerald-400">+Add</strong> or edit total directly, or add a new color / size variant.
                </p>
              </div>
              {!isProductLocked && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVariantForm((prev) => !prev);
                    setAdjustError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-orange-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{showAddVariantForm ? 'Close Form' : 'Add New Variant'}</span>
                </button>
              )}
            </div>

            {/* Quick 1-click "+ Size" strip for existing colors */}
            {!isProductLocked && availableColors.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap px-3 py-2 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Quick + Size:
                </span>
                {availableColors.map((colorName) => {
                  const matchedColorObj = activeProduct.colors?.find(
                    (co) => co.name.toLowerCase() === colorName.toLowerCase()
                  );
                  return (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => handleOpenAddSizeForColor(colorName)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 text-navy-900 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: matchedColorObj?.hex || '#64748b' }}
                      />
                      <span>{colorName}</span>
                      <Plus className="h-3 w-3 text-orange-500" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Inline Add New Variant / Size Form */}
            {showAddVariantForm && !isProductLocked && (
              <div className="p-4 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
                    New Variant / Size Configuration
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Set color, sizes, and exact quantity per size
                  </span>
                </div>

                {/* Color input + default qty */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Color / Variant Name (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={(e) => setNewColorHex(e.target.value)}
                        title="Pick color swatch"
                        className="h-8 w-9 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 cursor-pointer shrink-0 p-0.5"
                      />
                      <input
                        type="text"
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        placeholder="e.g. Navy Blue, Olive, Black"
                        className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    {availableColors.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="text-[10px] text-slate-500">Existing:</span>
                        {availableColors.map((c) => {
                          const matchedColorObj = activeProduct.colors?.find(
                            (co) => co.name.toLowerCase() === c.toLowerCase()
                          );
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setNewColorName(c);
                                if (matchedColorObj?.hex) setNewColorHex(matchedColorObj.hex);
                                setNewVariantImageUrl(matchedColorObj?.imageUrl || '');
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                                newColorName.toLowerCase() === c.toLowerCase()
                                  ? 'bg-orange-600 text-white border-orange-600'
                                  : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-orange-400'
                              }`}
                            >
                              <span
                                className="h-2 w-2 rounded-full border border-black/10"
                                style={{ backgroundColor: matchedColorObj?.hex || '#64748b' }}
                              />
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Default Qty
                      </label>
                      {activeChosenSizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next: Record<string, number> = {};
                            activeChosenSizes.forEach((sz) => {
                              next[sz] = newVariantQty;
                            });
                            setPerSizeQtys(next);
                          }}
                          className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                        >
                          Apply to all
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={newVariantQty}
                      onChange={(e) => setNewVariantQty(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold font-mono text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Color / Variant Image Upload */}
                <div className="pt-2 border-t border-orange-200/70 dark:border-orange-500/20">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Variant / Color Image (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    {newVariantImageUrl ? (
                      <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-orange-300 dark:border-orange-500/40 bg-white shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={newVariantImageUrl}
                          alt="Variant preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setNewVariantImageUrl('')}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-rose-600 text-white hover:bg-rose-500"
                          title="Remove image"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-lg border border-dashed border-slate-300 dark:border-white/15 bg-white dark:bg-navy-900 flex items-center justify-center text-slate-400 shrink-0">
                        <ImageIcon className="h-5 w-5 opacity-60" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-navy-900 hover:bg-slate-50 dark:hover:bg-navy-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-navy-900 dark:text-white cursor-pointer transition-colors">
                        <Upload className="h-3.5 w-3.5 text-orange-500" />
                        <span>{newVariantImageUrl ? 'Change Variant Photo' : 'Upload Variant Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await compressImage(file);
                              setNewVariantImageUrl(compressed);
                            } catch {
                              setAdjustError('Failed to process variant image.');
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        Upload a photo for this color/variant (auto-compressed for fast sync).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Size / Spec selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Size(s) or Enter Custom Size / Spec
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {quickSizeOptions.map((sz) => {
                      const active = selectedQuickSizes.includes(sz);
                      const alreadyExists = checkVariantDuplicate(newColorName, sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          disabled={alreadyExists}
                          onClick={() => handleToggleQuickSize(sz)}
                          title={
                            alreadyExists
                              ? `${newColorName || 'Standard'} / ${sz} already exists`
                              : `Select size ${sz}`
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                            alreadyExists
                              ? 'bg-slate-100 dark:bg-navy-950 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-white/5 cursor-not-allowed line-through'
                              : active
                              ? 'bg-orange-600 text-white border-orange-600 shadow-xs cursor-pointer'
                              : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-orange-400 cursor-pointer'
                          }`}
                        >
                          {sz}
                          {alreadyExists ? ' (Exists)' : ''}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customSizeInput}
                      onChange={(e) => setCustomSizeInput(e.target.value)}
                      placeholder="Custom size / spec (e.g. 42, 44 or 256GB, 500ml)"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddStagedVariants}
                      className="px-3.5 py-1.5 rounded-lg bg-navy-900 dark:bg-orange-600 hover:bg-navy-800 dark:hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Add to List</span>
                    </button>
                  </div>
                </div>

                {/* Per-Size Quantity Grid */}
                {activeChosenSizes.length > 0 && (
                  <div className="pt-2 border-t border-orange-200/70 dark:border-orange-500/20 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-navy-900 dark:text-white">
                        Quantity per Selected Size
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Customize stock for each size individually
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activeChosenSizes.map((sz) => {
                        const isDup = checkVariantDuplicate(newColorName, sz);
                        const qtyVal = perSizeQtys[sz] ?? newVariantQty;
                        return (
                          <div
                            key={sz}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border ${
                              isDup
                                ? 'bg-slate-100 dark:bg-navy-950 border-slate-200 dark:border-white/5 opacity-60'
                                : 'bg-white dark:bg-navy-900 border-orange-200 dark:border-orange-500/30'
                            }`}
                          >
                            <span className="text-[11px] font-mono font-bold text-navy-900 dark:text-white truncate">
                              {sz}
                            </span>
                            <input
                              type="number"
                              min="0"
                              disabled={isDup}
                              value={qtyVal}
                              onChange={(e) => {
                                const val = Math.max(0, Math.round(Number(e.target.value) || 0));
                                setPerSizeQtys((prev) => ({ ...prev, [sz]: val }));
                              }}
                              aria-label={`Quantity for size ${sz}`}
                              className="w-16 h-6 px-1.5 text-center bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded text-xs font-mono font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pendingFormResult.entries.length > 0 && (
                  <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-2">
                    <span>
                      <strong>{pendingFormResult.entries.length}</strong> new variant(s) ready (
                      <strong>
                        +{pendingFormResult.entries.reduce((s, e) => s + e.stock, 0)} pcs
                      </strong>
                      ). Click <strong>&ldquo;Add to List&rdquo;</strong> to add another color, or{' '}
                      <strong>&ldquo;Save Variants &amp; Stock&rdquo;</strong> below.
                    </span>
                  </div>
                )}
              </div>
            )}

            {adjustError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            {/* Variants & Sizes Table */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                {existingVariants.length > 0 ? (
                  existingVariants.map((v) => {
                    const origQty = Math.max(0, Number(v.stock) || 0);
                    const currentVal =
                      adjustedQtys[v.id] !== undefined ? adjustedQtys[v.id] : origQty;
                    const delta = currentVal - origQty;
                    const colorObj = activeProduct.colors?.find(
                      (c) => c.name.toLowerCase() === (v.color || '').toLowerCase()
                    );

                    return (
                      <div
                        key={v.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white dark:bg-navy-900/60 hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {v.color && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 dark:text-white">
                                <span
                                  className="h-2.5 w-2.5 rounded-full border border-black/15 shrink-0"
                                  style={{ backgroundColor: colorObj?.hex || '#64748b' }}
                                />
                                {v.color}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 text-[11px] font-mono font-bold text-navy-900 dark:text-slate-200">
                              {v.size || v.attributeValue || 'Standard'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Current: {origQty}
                            </span>
                            {delta !== 0 && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  delta > 0
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                }`}
                              >
                                {delta > 0 ? `+${delta}` : delta}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                            {v.variantSku}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Quick +Add Qty */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              +Add
                            </span>
                            <input
                              type="number"
                              min="0"
                              disabled={isProductLocked}
                              value={addedQtys[v.id] ?? ''}
                              placeholder="0"
                              onChange={(e) => {
                                const raw = e.target.value;
                                const addNum =
                                  raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0));
                                setAddedQtys((prev) => ({ ...prev, [v.id]: raw }));
                                setAdjustedQtys((prev) => ({
                                  ...prev,
                                  [v.id]: origQty + addNum,
                                }));
                              }}
                              title="Quickly add stock quantity to current count"
                              className="w-14 h-7 px-1.5 text-center bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-500/30 rounded-lg text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 placeholder-emerald-600/40 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Total Quantity Stepper */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isProductLocked || currentVal <= 0}
                              onClick={() => {
                                const nextVal = Math.max(0, currentVal - 1);
                                setAdjustedQtys((prev) => ({ ...prev, [v.id]: nextVal }));
                                setAddedQtys((prev) => ({
                                  ...prev,
                                  [v.id]: nextVal > origQty ? String(nextVal - origQty) : '',
                                }));
                              }}
                              className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              disabled={isProductLocked}
                              value={currentVal}
                              onChange={(e) => {
                                const nextVal = Math.max(0, Math.round(Number(e.target.value) || 0));
                                setAdjustedQtys((prev) => ({ ...prev, [v.id]: nextVal }));
                                setAddedQtys((prev) => ({
                                  ...prev,
                                  [v.id]: nextVal > origQty ? String(nextVal - origQty) : '',
                                }));
                              }}
                              aria-label={`Total quantity for ${v.variantSku}`}
                              className="w-16 h-7 px-2 text-center bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                            />
                            <button
                              type="button"
                              disabled={isProductLocked}
                              onClick={() => {
                                const nextVal = currentVal + 1;
                                setAdjustedQtys((prev) => ({ ...prev, [v.id]: nextVal }));
                                setAddedQtys((prev) => ({
                                  ...prev,
                                  [v.id]: nextVal > origQty ? String(nextVal - origQty) : '',
                                }));
                              }}
                              className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 py-3 bg-white dark:bg-navy-900/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-navy-900 dark:text-white">
                          Standard (Base SKU)
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Current: {Math.max(0, Number(activeProduct.stock) || 0)}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {activeProduct.sku}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          +Add
                        </span>
                        <input
                          type="number"
                          min="0"
                          disabled={isProductLocked}
                          value={addedQtys['__default__'] ?? ''}
                          placeholder="0"
                          onChange={(e) => {
                            const orig = Math.max(0, Number(activeProduct.stock) || 0);
                            const raw = e.target.value;
                            const addNum =
                              raw === '' ? 0 : Math.max(0, Math.round(Number(raw) || 0));
                            setAddedQtys((prev) => ({ ...prev, __default__: raw }));
                            setAdjustedQtys((prev) => ({
                              ...prev,
                              __default__: orig + addNum,
                            }));
                          }}
                          className="w-14 h-7 px-1.5 text-center bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300/80 dark:border-emerald-500/30 rounded-lg text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={
                            isProductLocked ||
                            (adjustedQtys['__default__'] ?? activeProduct.stock) <= 0
                          }
                          onClick={() => {
                            const orig = Math.max(0, Number(activeProduct.stock) || 0);
                            const nextVal = Math.max(
                              0,
                              (adjustedQtys['__default__'] ?? orig) - 1
                            );
                            setAdjustedQtys((prev) => ({ ...prev, __default__: nextVal }));
                            setAddedQtys((prev) => ({
                              ...prev,
                              __default__: nextVal > orig ? String(nextVal - orig) : '',
                            }));
                          }}
                          className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          disabled={isProductLocked}
                          value={adjustedQtys['__default__'] ?? activeProduct.stock}
                          onChange={(e) => {
                            const orig = Math.max(0, Number(activeProduct.stock) || 0);
                            const nextVal = Math.max(
                              0,
                              Math.round(Number(e.target.value) || 0)
                            );
                            setAdjustedQtys((prev) => ({ ...prev, __default__: nextVal }));
                            setAddedQtys((prev) => ({
                              ...prev,
                              __default__: nextVal > orig ? String(nextVal - orig) : '',
                            }));
                          }}
                          className="w-16 h-7 px-2 text-center bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          disabled={isProductLocked}
                          onClick={() => {
                            const orig = Math.max(0, Number(activeProduct.stock) || 0);
                            const nextVal = (adjustedQtys['__default__'] ?? orig) + 1;
                            setAdjustedQtys((prev) => ({ ...prev, __default__: nextVal }));
                            setAddedQtys((prev) => ({
                              ...prev,
                              __default__: nextVal > orig ? String(nextVal - orig) : '',
                            }));
                          }}
                          className="h-7 w-7 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-navy-950 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Staged New Variants */}
                {stagedNewVariants.map((nv) => (
                  <div
                    key={nv.tempId}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-emerald-50/60 dark:bg-emerald-950/20"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2.5">
                      {nv.imageUrl && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={nv.imageUrl}
                          alt={nv.color || 'Variant'}
                          className="h-8 w-8 rounded-lg object-cover border border-emerald-300 dark:border-emerald-500/40 shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider">
                          New
                        </span>
                        {nv.color && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-900 dark:text-white">
                            <span
                              className="h-2.5 w-2.5 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: nv.hex || '#111827' }}
                            />
                            {nv.color}
                          </span>
                        )}
                        {nv.size && (
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-navy-800 border border-emerald-300 dark:border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                            {nv.size}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 truncate">
                        {nv.previewSku}
                      </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={nv.stock <= 0}
                        onClick={() => {
                          setStagedNewVariants((prev) =>
                            prev.map((item) =>
                              item.tempId === nv.tempId
                                ? { ...item, stock: Math.max(0, item.stock - 1) }
                                : item
                            )
                          );
                        }}
                        className="h-7 w-7 rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-white dark:bg-navy-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 disabled:opacity-40 cursor-pointer"
                        aria-label="Decrease new variant quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={nv.stock}
                        onChange={(e) => {
                          const val = Math.max(0, Math.round(Number(e.target.value) || 0));
                          setStagedNewVariants((prev) =>
                            prev.map((item) =>
                              item.tempId === nv.tempId ? { ...item, stock: val } : item
                            )
                          );
                        }}
                        className="w-16 h-7 px-2 text-center bg-white dark:bg-navy-950 border border-emerald-300 dark:border-emerald-500/30 rounded-lg text-xs font-mono font-bold text-navy-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setStagedNewVariants((prev) =>
                            prev.map((item) =>
                              item.tempId === nv.tempId
                                ? { ...item, stock: item.stock + 1 }
                                : item
                            )
                          );
                        }}
                        className="h-7 w-7 rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-white dark:bg-navy-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 cursor-pointer"
                        aria-label="Increase new variant quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setStagedNewVariants((prev) =>
                            prev.filter((item) => item.tempId !== nv.tempId)
                          )
                        }
                        className="h-7 w-7 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove staged variant"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Stock Summary Footer */}
              <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Total Stock Summary:
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500">{adjustSummary.currentTotal} pcs</span>
                  <span className="text-slate-400">→</span>
                  <strong className="text-navy-900 dark:text-white text-sm">
                    {adjustSummary.newTotal} pcs
                  </strong>
                  {adjustSummary.newTotal !== adjustSummary.currentTotal && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        adjustSummary.newTotal > adjustSummary.currentTotal
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      {adjustSummary.newTotal > adjustSummary.currentTotal ? '+' : ''}
                      {adjustSummary.newTotal - adjustSummary.currentTotal}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Adjustment Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adjustment Reason / Note (Optional)
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Added new XL/XXL sizes and updated physical count"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProductLocked || !hasAdjustChanges || isSavingAdjust}
                className="px-5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-orange-500/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingAdjust ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Variants &amp; Stock</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ================================================================= */
          /* MODE 2 & 3: RESTOCK & RETURN REQUESTS (EXISTING FLOW)             */
          /* ================================================================= */
          <>
            {(availableColors.length > 0 ||
              availableSizes.length > 0 ||
              (activeMode === 'RETURN' && existingVariants.length > 1)) && (
              <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-navy-950/70 border border-slate-200 dark:border-white/10 space-y-3">
                {activeMode === 'RETURN' && existingVariants.length > 1 && (
                  <div className="space-y-1.5">
                    <span className="block text-[11px] font-bold text-navy-900 dark:text-slate-200">
                      Recall Scope:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRecallScope('VARIANT')}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          recallScope === 'VARIANT'
                            ? 'bg-orange-600 text-white border-orange-500 shadow-xs'
                            : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-orange-400'
                        }`}
                      >
                        Specific Variant
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecallScope('ALL_VARIANTS');
                          if (totalProductStock > 0) {
                            setReturnQty(totalProductStock);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          recallScope === 'ALL_VARIANTS'
                            ? 'bg-orange-600 text-white border-orange-500 shadow-xs'
                            : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-orange-400'
                        }`}
                      >
                        All Variants ({totalProductStock} pcs)
                      </button>
                    </div>
                  </div>
                )}

                {!(activeMode === 'RETURN' && recallScope === 'ALL_VARIANTS') &&
                  (availableColors.length > 0 || availableSizes.length > 0) && (
                    <>
                      <div className="flex items-center justify-between text-xs font-bold text-navy-900 dark:text-slate-200">
                        <span>Select Color &amp; Size Variant:</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {activeMode === 'RESTOCK' ? 'Target for restock' : 'Target for return'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableColors.length > 0 && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Color:
                            </label>
                            <select
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                            >
                              {availableColors.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {availableSizes.length > 0 && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              Size / Spec:
                            </label>
                            <select
                              value={selectedSize}
                              onChange={(e) => setSelectedSize(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                            >
                              {availableSizes.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                <div className="p-2.5 rounded-lg bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      {activeMode === 'RETURN' && recallScope === 'ALL_VARIANTS'
                        ? 'Target Scope'
                        : 'Target Variant SKU'}
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                      {activeMode === 'RETURN' && recallScope === 'ALL_VARIANTS'
                        ? `${activeProduct.sku} · All Variants (${existingVariants.length} variants)`
                        : matchedVariant?.variantSku || activeProduct.sku}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Available Warehouse Stock
                    </span>
                    <span
                      className={`font-mono font-extrabold text-sm block mt-0.5 ${
                        (activeMode === 'RETURN'
                          ? effectiveReturnAvailableStock
                          : currentVariantStock) > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-500 dark:text-rose-400'
                      }`}
                    >
                      {activeMode === 'RETURN'
                        ? effectiveReturnAvailableStock
                        : currentVariantStock}{' '}
                      units
                    </span>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {activeMode === 'RESTOCK' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Inbound Restock Quantity to Add <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        required
                        value={restockQty}
                        onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-navy-900 dark:text-white focus:outline-none focus:border-emerald-500"
                        placeholder="50"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-500">units</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[25, 50, 100, 250].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRestockQty(preset)}
                          className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer font-mono"
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Carrier / Logistics Partner
                      </label>
                      <select
                        value={carrier}
                        onChange={(e) => setCarrier(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white focus:outline-none focus:border-emerald-500"
                      >
                        {COURIER_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Consignment / Tracking Ref (Optional)
                      </label>
                      <input
                        type="text"
                        value={trackingRef}
                        onChange={(e) => setTrackingRef(e.target.value)}
                        placeholder="e.g. STDF-8839201"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier / Batch Reference Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={restockNote}
                      onChange={(e) => setRestockNote(e.target.value)}
                      placeholder="e.g. Winter batch #402 from Gazipur factory"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="block font-semibold mb-0.5">
                        Warehouse Inbound Protocol:
                      </strong>
                      Physical cargo arriving at warehouse dock will be verified and slotted by the admin for SKU{' '}
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {matchedVariant?.variantSku || activeProduct.sku}
                      </span>
                      . Once approved, live stock will update automatically.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {effectiveReturnAvailableStock <= 0 ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>
                          {recallScope === 'ALL_VARIANTS'
                            ? 'No Warehouse Stock Available for this Product'
                            : 'No Warehouse Stock Available for this Variant'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                        {recallScope === 'ALL_VARIANTS' ? (
                          <>এই প্রোডাক্টে বর্তমানে ওয়্যারহাউসে কোনো স্টক নেই (মোট স্টক ০)।</>
                        ) : (
                          <>
                            নির্বাচিত ভ্যারিয়েন্টে (<strong className="text-navy-900 dark:text-white">{selectedColor} · {selectedSize}</strong>) বর্তমানে ওয়্যারহাউসে কোনো পণ্য নেই (স্টক ০)। পণ্য ফেরত নেওয়ার পূর্বে ওয়্যারহাউসে পণ্য মজুদ থাকতে হবে।
                          </>
                        )}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Units to Withdraw / Return <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] text-slate-500">
                            {recallScope === 'ALL_VARIANTS'
                              ? 'Total Product Stock: '
                              : 'Available for Variant: '}
                            <strong className="font-mono text-orange-600 dark:text-orange-400">
                              {effectiveReturnAvailableStock}
                            </strong>
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max={Math.max(1, effectiveReturnAvailableStock)}
                            required
                            value={returnQty}
                            onChange={(e) =>
                              setReturnQty(
                                Math.min(
                                  effectiveReturnAvailableStock,
                                  Math.max(1, Number(e.target.value) || 1)
                                )
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                            placeholder="1"
                          />
                          <span className="absolute right-3 top-2 text-xs text-slate-500">units</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {[1, 5, 10]
                            .filter((n) => n <= effectiveReturnAvailableStock)
                            .map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setReturnQty(preset)}
                                className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer font-mono"
                              >
                                {preset} unit{preset > 1 ? 's' : ''}
                              </button>
                            ))}
                          {effectiveReturnAvailableStock > 0 && (
                            <button
                              type="button"
                              onClick={() => setReturnQty(effectiveReturnAvailableStock)}
                              className="px-2.5 py-1 text-xs rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 font-semibold transition-colors cursor-pointer font-mono"
                            >
                              All ({effectiveReturnAvailableStock})
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Reason for Return / Recall <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500"
                        >
                          {RETURN_REASONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        {returnReason.startsWith('Other') && (
                          <input
                            type="text"
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            placeholder="Please specify the reason..."
                            className="w-full mt-2 px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Return Destination Outlet / Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g. Dhanmondi Branch, Road 27, Dhaka"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Outlet Contact Person &amp; Phone
                          </label>
                          <input
                            type="text"
                            value={recipientContact}
                            onChange={(e) => setRecipientContact(e.target.value)}
                            placeholder="e.g. 01711-000000 (Store Manager)"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Additional Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={returnNote}
                          onChange={(e) => setReturnNote(e.target.value)}
                          placeholder="e.g. Please pick up and pack before weekend rush"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-800 dark:text-orange-300 flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                          <strong className="block font-semibold mb-0.5">
                            Warehouse Recall &amp; Gate Pass Approval Policy:
                          </strong>
                          This request to recall{' '}
                          <span className="font-bold text-orange-600 dark:text-orange-300">
                            {returnQty} units
                          </span>{' '}
                          of SKU{' '}
                          <strong className="font-mono">
                            {matchedVariant?.variantSku || activeProduct.sku}
                          </strong>{' '}
                          will be sent to the Warehouse Admin queue for approval. Live stock is deducted and an official <strong>Delivery Gate Pass</strong> is issued automatically once Admin approves.
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {requestError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{requestError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmittingOp ||
                    (activeMode === 'RETURN' && effectiveReturnAvailableStock <= 0)
                  }
                  className={`px-5 py-2 rounded-lg text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeMode === 'RESTOCK'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                      : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'
                  }`}
                >
                  {isSubmittingOp ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : activeMode === 'RESTOCK' ? (
                    <>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>Submit Restock for Admin Approval (+{restockQty})</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Submit Recall / Return for Approval (-{returnQty})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
