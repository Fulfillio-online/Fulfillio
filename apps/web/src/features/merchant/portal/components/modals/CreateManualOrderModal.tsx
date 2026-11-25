'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
  X,
  Package,
  Plus,
  Trash2,
  Sparkles,
  Truck,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Tag,
  DollarSign,
  HelpCircle,
  Phone,
  MapPin,
  User,
  Layers,
  Palette,
  Check,
} from 'lucide-react';
import { MerchantOrderItem, MerchantProductItem, ResellerMemo, OrderLineItem } from '../../types';
import { ProductThumbnail } from '../../products/components/ProductThumbnail';

interface OrderLineItemDraft {
  rowId: string;
  productId: string;
  variantLabel: string;
  sku: string;
  title: string;
  unitPrice: number;
  declaredPrice: number;
  qty: number;
  maxStock: number;
  imageUrl?: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariantId?: string;
}

interface CreateManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MerchantProductItem[];
  memoList: ResellerMemo[];
  baseHandlingFee?: number;
  onCreateOrder: (
    order: MerchantOrderItem,
    productIdOrItems?:
      | string
      | {
          productId: string;
          qty: number;
          variantId?: string;
          variantSku?: string;
          color?: string;
          size?: string;
        }[],
    qty?: number
  ) => void | Promise<{ ok: boolean; error?: string } | void>;
  onTriggerToast: (msg: string) => void;
}

export function getAttributeLabel(productType?: string): string {
  if (productType === 'FASHION') return 'Size';
  if (productType === 'ELECTRONICS') return 'Storage / Spec';
  if (productType === 'BEAUTY') return 'Volume / Shade';
  if (productType === 'GROCERY') return 'Pack Size';
  return 'Variant / Size';
}

export function getAvailableSizesForColor(
  p: MerchantProductItem,
  selectedColorName?: string
): string[] {
  // 1. If color has explicit sizes
  if (selectedColorName && p.colors && p.colors.length > 0) {
    const colorObj = p.colors.find((c) => c.name === selectedColorName);
    if (colorObj?.sizes && colorObj.sizes.length > 0) {
      return colorObj.sizes;
    }
  }

  // 2. If variantsList has matching entries for this color
  if (p.variantsList && p.variantsList.length > 0) {
    const matching = selectedColorName
      ? p.variantsList.filter((v) => !v.color || v.color === selectedColorName)
      : p.variantsList;
    const sizes = matching
      .map((v) => v.size || v.attributeValue)
      .filter((s): s is string => Boolean(s));
    if (sizes.length > 0) {
      return Array.from(new Set(sizes));
    }
  }

  // 3. Fallback to product sizes
  if (p.sizes && p.sizes.length > 0) {
    return p.sizes;
  }

  return [];
}

export function getOptionStock(
  p: MerchantProductItem,
  colorName?: string,
  sizeOrAttr?: string
): number {
  if (!p.variantsList || p.variantsList.length === 0) {
    return p.stock || 0;
  }
  const match = p.variantsList.find((v) => {
    const colorMatches = !colorName || !v.color || v.color === colorName;
    const sizeMatches =
      !sizeOrAttr ||
      v.size === sizeOrAttr ||
      v.attributeValue === sizeOrAttr;
    return colorMatches && sizeMatches;
  });
  return match ? match.stock : p.stock || 0;
}


export const POPULAR_COLORS: { name: string; hex: string }[] = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Charcoal Black', hex: '#1e293b' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Maroon', hex: '#881337' },
  { name: 'Olive Green', hex: '#3f6212' },
  { name: 'Beige', hex: '#d4b996' },
  { name: 'Grey', hex: '#64748b' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Pink', hex: '#ec4899' },
];

export const POPULAR_SIZES: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

export function getAllColorsForProduct(p?: MerchantProductItem): { name: string; hex: string }[] {
  const result: { name: string; hex: string }[] = [];
  const seen = new Set<string>();

  if (p?.colors && p.colors.length > 0) {
    for (const c of p.colors) {
      const lower = c.name.toLowerCase().trim();
      if (lower && !seen.has(lower)) {
        seen.add(lower);
        result.push({ name: c.name, hex: c.hex || '#1e293b' });
      }
    }
  }

  if (p?.variantsList && p.variantsList.length > 0) {
    for (const v of p.variantsList) {
      const vColor = (v.color || '').trim();
      if (vColor) {
        const lower = vColor.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          result.push({ name: vColor, hex: '#1e293b' });
        }
      }
    }
  }

  if (result.length === 0) {
    result.push({ name: 'Standard', hex: '#1e293b' });
  }

  return result;
}

export function getAllSizesForProduct(p?: MerchantProductItem, selectedColor?: string): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  if (p) {
    const pSizes = getAvailableSizesForColor(p, selectedColor);
    for (const s of pSizes) {
      const upper = s.toUpperCase().trim();
      if (upper && !seen.has(upper)) {
        seen.add(upper);
        result.push(s);
      }
    }
  }

  if (result.length === 0) {
    result.push('Standard');
  }

  return result;
}

export function resolveVariantConfig(
  p: MerchantProductItem,
  colorName?: string,
  sizeOrAttr?: string
): {
  sku: string;
  variantLabel: string;
  maxStock: number;
  basePrice: number;
  imageUrl?: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedVariantId?: string;
} {
  const allColors = getAllColorsForProduct(p);
  const resolvedColor = colorName || p.colors?.[0]?.name || allColors[0]?.name || 'Standard';

  const colorObj = p.colors?.find((c) => c.name.toLowerCase() === resolvedColor.toLowerCase());
  const resolvedImage = colorObj?.imageUrl || p.imageUrl;

  const allSizes = getAllSizesForProduct(p, resolvedColor);
  const resolvedSize = sizeOrAttr || p.sizes?.[0] || allSizes[0] || 'L';

  const isGenericVal = (s?: string) =>
    ['', 'standard', 'free size', 'free', 'default', 'one size'].includes(
      (s || '').trim().toLowerCase()
    );
  const targetColor = resolvedColor.trim().toLowerCase();
  const targetSize = resolvedSize.trim().toLowerCase();

  // 1. Try finding explicit match in variantsList (never fall back across colors)
  const matchedVariant =
    p.variantsList?.find((v) => {
      const vColor = (v.color || '').trim().toLowerCase();
      const vSize = (v.size || v.attributeValue || '').trim().toLowerCase();
      return vColor === targetColor && vSize === targetSize;
    }) ||
    p.variantsList?.find((v) => {
      const vColor = (v.color || '').trim().toLowerCase();
      const vSize = (v.size || v.attributeValue || '').trim().toLowerCase();
      return vColor === targetColor && isGenericVal(targetSize) && isGenericVal(vSize);
    }) ||
    p.variantsList?.find((v) => (v.color || '').trim().toLowerCase() === targetColor) ||
    (isGenericVal(targetColor)
      ? p.variantsList?.find((v) => {
          const vSize = (v.size || v.attributeValue || '').trim().toLowerCase();
          return !v.color && (vSize === targetSize || isGenericVal(vSize));
        }) || p.variantsList?.[0]
      : undefined);

  if (matchedVariant) {
    const labelParts = [
      matchedVariant.color || resolvedColor,
      matchedVariant.size || matchedVariant.attributeValue || resolvedSize,
    ].filter(Boolean);
    const label = labelParts.length > 0 ? labelParts.join(' / ') : 'Standard';
    const basePrice =
      matchedVariant.price && matchedVariant.price > 0 ? matchedVariant.price : (p.price || 0);
    return {
      sku: matchedVariant.variantSku,
      variantLabel: label,
      maxStock: matchedVariant.stock ?? 0,
      basePrice,
      imageUrl: resolvedImage,
      selectedColor: resolvedColor,
      selectedSize: resolvedSize,
      selectedVariantId: matchedVariant.id,
    };
  }

  // 2. Generate clean dynamic variant SKU
  const colorCode = resolvedColor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'VAR';
  const sizeCode = resolvedSize.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'STD';
  const derivedSku = `${p.sku}-${colorCode}-${sizeCode}`;
  const label = `${resolvedColor} / ${resolvedSize}`;

  const stock =
    p.variantsList && p.variantsList.length > 0
      ? 0
      : typeof p.stock === 'number' && p.stock > 0
      ? p.stock
      : 0;

  return {
    sku: derivedSku,
    variantLabel: label,
    maxStock: stock,
    basePrice: p.price || 0,
    imageUrl: resolvedImage,
    selectedColor: resolvedColor,
    selectedSize: resolvedSize,
  };
}

export function isEligibleProductForOrder(p?: MerchantProductItem | null): boolean {
  if (!p) return false;
  if (Boolean((p as any).isSuspended)) return false;
  if (p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL') return false;
  const hasApprovedBin =
    Boolean(p.bin) &&
    p.bin !== 'Pending Approval' &&
    p.bin !== 'Assigned on intake';
  const hasStoredStock = typeof p.stock === 'number' && p.stock > 0;
  const isStockStoredStage =
    p.status === 'STOCK_STORED' ||
    ((p.status === 'PUBLISHED' || p.status === 'APPROVED') && hasStoredStock);
  return Boolean(hasApprovedBin && hasStoredStock && isStockStoredStage);
}

export function CreateManualOrderModal({
  isOpen,
  onClose,
  products,
  memoList,
  baseHandlingFee = 45,
  onCreateOrder,
  onTriggerToast,
}: CreateManualOrderModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  // 1. Customer Information
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [orderCity, setOrderCity] = useState('Dhaka');
  const [orderCourier, setOrderCourier] = useState('');
  const [orderMemoCode, setOrderMemoCode] = useState(() => {
    if (memoList && memoList.length > 0) {
      const def = memoList.find((m) => m.isDefault);
      return def ? def.code : memoList[0].code;
    }
    return '';
  });

  useEffect(() => {
    if (memoList && memoList.length > 0) {
      if (!orderMemoCode || !memoList.some((m) => m.code === orderMemoCode)) {
        const def = memoList.find((m) => m.isDefault);
        setOrderMemoCode(def ? def.code : memoList[0].code);
      }
    } else {
      setOrderMemoCode('');
    }
  }, [memoList, orderMemoCode]);

  const eligibleProducts = useMemo(() => {
    return products.filter(isEligibleProductForOrder);
  }, [products]);

  // 2. Multi-Product Line Items
  const [items, setItems] = useState<OrderLineItemDraft[]>(() => {
    const p = products.find(isEligibleProductForOrder) || products[0];
    if (!p) return [];
    const cfg = resolveVariantConfig(p);
    const basePrice = cfg.basePrice || p.price || 0;
    return [
      {
        rowId: `row-${Date.now()}-1`,
        productId: p.id,
        title: p.title,
        variantLabel: cfg.variantLabel,
        sku: cfg.sku,
        unitPrice: basePrice,
        declaredPrice: basePrice,
        qty: cfg.maxStock > 0 ? 1 : 0,
        maxStock: cfg.maxStock,
        imageUrl: cfg.imageUrl,
        selectedColor: cfg.selectedColor,
        selectedSize: cfg.selectedSize,
        selectedVariantId: cfg.selectedVariantId,
      },
    ];
  });

  // Re-sync line items when modal opens or products data is updated
  useEffect(() => {
    if (isOpen) {
      setItems((prev) => {
        if (prev.length === 0) {
          const p = products.find(isEligibleProductForOrder) || products[0];
          if (!p) return [];
          const cfg = resolveVariantConfig(p);
          const basePrice = cfg.basePrice || p.price || 0;
          return [
            {
              rowId: `row-${Date.now()}-1`,
              productId: p.id,
              title: p.title,
              variantLabel: cfg.variantLabel,
              sku: cfg.sku,
              unitPrice: basePrice,
              declaredPrice: basePrice,
              qty: cfg.maxStock > 0 ? 1 : 0,
              maxStock: cfg.maxStock,
              imageUrl: cfg.imageUrl,
              selectedColor: cfg.selectedColor,
              selectedSize: cfg.selectedSize,
              selectedVariantId: cfg.selectedVariantId,
            },
          ];
        }
        return prev.map((item) => {
          const p = products.find((prod) => prod.id === item.productId);
          if (!p) return item;
          const cfg = resolveVariantConfig(p, item.selectedColor, item.selectedSize);
          const nextMaxStock = cfg.maxStock;
          const nextQty = nextMaxStock <= 0 ? 0 : Math.min(item.qty > 0 ? item.qty : 1, nextMaxStock);
          const nextBasePrice = cfg.basePrice || p.price || 0;
          const prevDeclared = item.declaredPrice ?? nextBasePrice;
          const shouldSyncPrice = item.unitPrice === prevDeclared && nextBasePrice > 0;
          return {
            ...item,
            variantLabel: cfg.variantLabel,
            sku: cfg.sku,
            unitPrice: shouldSyncPrice ? nextBasePrice : item.unitPrice,
            declaredPrice: nextBasePrice,
            maxStock: nextMaxStock,
            qty: nextQty,
            imageUrl: cfg.imageUrl || item.imageUrl,
            selectedColor: cfg.selectedColor,
            selectedSize: cfg.selectedSize,
            selectedVariantId: cfg.selectedVariantId,
          };
        });
      });
    }
  }, [isOpen, products]);

  // 3. Pricing Adjustments: Delivery, Discount, Advance
  const [deliveryArea, setDeliveryArea] = useState<'INSIDE_DHAKA' | 'SUB_DHAKA' | 'OUTSIDE_DHAKA' | 'FREE' | 'CUSTOM'>('INSIDE_DHAKA');
  const [deliveryFee, setDeliveryFee] = useState<number>(60);
  const [discount, setDiscount] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [advanceMethod, setAdvanceMethod] = useState<string>('bKash');
  const [advanceTrxId, setAdvanceTrxId] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  if (!isOpen || !mounted) return null;

  // Real-time Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  const baseSubtotal = items.reduce((sum, item) => sum + (item.declaredPrice * item.qty), 0);
  const extraMarkup = subtotal - baseSubtotal;
  const orderTotal = Math.max(0, subtotal + deliveryFee - discount);
  const codAmount = Math.max(0, orderTotal - advancePayment);
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const estHandlingFee = Math.max(0, Number(baseHandlingFee) || 0);
  const estPackagingFee = 5;
  const estTotalFees = deliveryFee + estHandlingFee + estPackagingFee;
  const estNetEarning = Math.max(0, orderTotal - estTotalFees);

  // Delivery Presets Handler
  const handleSelectDeliveryPreset = (
    preset: 'INSIDE_DHAKA' | 'SUB_DHAKA' | 'OUTSIDE_DHAKA' | 'FREE',
    fee: number
  ) => {
    setDeliveryArea(preset);
    setDeliveryFee(fee);
  };

  // Advance Payment Presets Handler
  const handleSetAdvancePreset = (type: 'NONE' | 'DELIVERY' | 'FULL') => {
    if (type === 'NONE') {
      setAdvancePayment(0);
    } else if (type === 'DELIVERY') {
      setAdvancePayment(deliveryFee);
    } else if (type === 'FULL') {
      setAdvancePayment(orderTotal);
    }
  };

  // Line Item Handlers
  const handleAddItem = () => {
    const available = products.find((p) => !items.some((it) => it.productId === p.id)) || products[0];
    if (!available) {
      onTriggerToast('No more products available to add.');
      return;
    }
    const cfg = resolveVariantConfig(available);
    const basePrice = cfg.basePrice || available.price || 0;
    const newItem: OrderLineItemDraft = {
      rowId: `row-${Date.now()}-${items.length + 1}`,
      productId: available.id,
      title: available.title,
      variantLabel: cfg.variantLabel,
      sku: cfg.sku,
      unitPrice: basePrice,
      declaredPrice: basePrice,
      qty: cfg.maxStock > 0 ? 1 : 0,
      maxStock: cfg.maxStock,
      imageUrl: cfg.imageUrl,
      selectedColor: cfg.selectedColor,
      selectedSize: cfg.selectedSize,
      selectedVariantId: cfg.selectedVariantId,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (rowId: string) => {
    if (items.length <= 1) {
      onTriggerToast('An order must contain at least 1 product.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.rowId !== rowId));
  };

  const handleProductChange = (rowId: string, newProductId: string) => {
    const p = products.find((prod) => prod.id === newProductId);
    if (!p) return;
    const cfg = resolveVariantConfig(p);
    const nextQty = cfg.maxStock > 0 ? 1 : 0;
    const basePrice = cfg.basePrice || p.price || 0;
    setItems((prev) =>
      prev.map((it) =>
        it.rowId === rowId
          ? {
              ...it,
              productId: p.id,
              title: p.title,
              variantLabel: cfg.variantLabel,
              sku: cfg.sku,
              unitPrice: basePrice,
              declaredPrice: basePrice,
              qty: nextQty,
              maxStock: cfg.maxStock,
              imageUrl: cfg.imageUrl,
              selectedColor: cfg.selectedColor,
              selectedSize: cfg.selectedSize,
              selectedVariantId: cfg.selectedVariantId,
            }
          : it
      )
    );
  };

  const handleColorChange = (rowId: string, newColorName: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;
        const p = products.find((prod) => prod.id === it.productId);
        if (!p) return it;
        const cfg = resolveVariantConfig(p, newColorName, it.selectedSize);
        const nextQty = cfg.maxStock <= 0 ? 0 : Math.min(cfg.maxStock, Math.max(1, it.qty));
        const nextBase = cfg.basePrice || p.price || 0;
        const wasAtBase = it.unitPrice === it.declaredPrice;
        return {
          ...it,
          variantLabel: cfg.variantLabel,
          sku: cfg.sku,
          unitPrice: wasAtBase && nextBase > 0 ? nextBase : it.unitPrice,
          declaredPrice: nextBase,
          maxStock: cfg.maxStock,
          qty: nextQty,
          imageUrl: cfg.imageUrl,
          selectedColor: cfg.selectedColor,
          selectedSize: cfg.selectedSize,
          selectedVariantId: cfg.selectedVariantId,
        };
      })
    );
  };

  const handleSizeChange = (rowId: string, newSize: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;
        const p = products.find((prod) => prod.id === it.productId);
        if (!p) return it;
        const cfg = resolveVariantConfig(p, it.selectedColor, newSize);
        const nextQty = cfg.maxStock <= 0 ? 0 : Math.min(cfg.maxStock, Math.max(1, it.qty));
        const nextBase = cfg.basePrice || p.price || 0;
        const wasAtBase = it.unitPrice === it.declaredPrice;
        return {
          ...it,
          variantLabel: cfg.variantLabel,
          sku: cfg.sku,
          unitPrice: wasAtBase && nextBase > 0 ? nextBase : it.unitPrice,
          declaredPrice: nextBase,
          maxStock: cfg.maxStock,
          qty: nextQty,
          imageUrl: cfg.imageUrl,
          selectedSize: cfg.selectedSize,
          selectedVariantId: cfg.selectedVariantId,
        };
      })
    );
  };

  const handleUnitPriceChange = (rowId: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((it) =>
        it.rowId === rowId ? { ...it, unitPrice: Math.max(0, newPrice) } : it
      )
    );
  };

  const handleQtyChange = (rowId: string, newQty: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.rowId !== rowId) return it;
        if (it.maxStock <= 0) {
          return { ...it, qty: 0 };
        }
        const clamped = Math.min(it.maxStock, Math.max(1, newQty));
        return { ...it, qty: clamped };
      })
    );
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderCustomer.trim()) {
      onTriggerToast('Please enter customer name.');
      return;
    }
    if (!orderPhone.trim()) {
      onTriggerToast('Please enter customer phone number.');
      return;
    }
    if (!orderAddress.trim()) {
      onTriggerToast('Please enter customer delivery address.');
      return;
    }
    if (items.length === 0) {
      onTriggerToast('Please add at least one product.');
      return;
    }

    // Business rule validation: Product must be approved and physical stock accepted into warehouse
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!isEligibleProductForOrder(prod)) {
        const isPending =
          prod?.status === 'PENDING_APPROVAL' ||
          !prod?.bin ||
          prod?.bin === 'Pending Approval' ||
          prod?.bin === 'Assigned on intake';
        const msg = isPending
          ? `Cannot create order: "${item.title}" is pending warehouse admin approval. You can only create orders after admin approves the product.`
          : `Cannot create order: "${item.title}" has no accepted physical stock stored in warehouse bins. Please wait for warehouse intake to accept your shipment.`;
        onTriggerToast(msg);
        return;
      }
      if (item.maxStock <= 0 || item.qty <= 0) {
        onTriggerToast(
          `Cannot create order: "${item.title} (${item.variantLabel})" has 0 stored stock in warehouse.`
        );
        return;
      }
      if (item.qty > item.maxStock) {
        onTriggerToast(
          `Insufficient warehouse stock for "${item.title} (${item.variantLabel})"! Requested: ${item.qty} pcs, Available: ${item.maxStock} pcs.`
        );
        return;
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) {
        onTriggerToast(
          `Please enter a valid selling price (> ৳0) for "${item.title}".`
        );
        return;
      }
    }

    // Aggregated per-variant check (handles multiple rows referencing the same variant)
    const variantTotals = new Map<string, { requested: number; maxStock: number; label: string }>();
    for (const item of items) {
      const key = item.selectedVariantId || item.sku || `${item.productId}::${item.variantLabel}`;
      const existing = variantTotals.get(key);
      if (existing) {
        existing.requested += item.qty;
      } else {
        variantTotals.set(key, {
          requested: item.qty,
          maxStock: item.maxStock,
          label: `${item.title} (${item.variantLabel})`,
        });
      }
    }
    for (const entry of variantTotals.values()) {
      if (entry.requested > entry.maxStock) {
        onTriggerToast(
          `Insufficient combined warehouse stock for "${entry.label}"! Total requested: ${entry.requested} pcs, Available: ${entry.maxStock} pcs.`
        );
        return;
      }
    }

    if (!memoList || memoList.length === 0) {
      onTriggerToast('Cannot create order: You must create at least one custom Memo Template in Memo Designer first.');
      return;
    }

    if (!orderMemoCode || !orderMemoCode.trim()) {
      onTriggerToast('Please select an invoice memo template.');
      return;
    }

    if (!memoList.some((m) => m.code === orderMemoCode)) {
      onTriggerToast('Selected memo is invalid. Please select one of your created memos.');
      return;
    }

    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const isFullPaid = advancePayment >= orderTotal;
    const isPartialPaid = advancePayment > 0 && advancePayment < orderTotal;
    const paymentStatus: 'Paid' | 'Unpaid' | 'Partial' = isFullPaid
      ? 'Paid'
      : isPartialPaid
      ? 'Partial'
      : 'Unpaid';

    const paymentMethodLabel = isFullPaid
      ? `${advanceMethod} (100% Advance)`
      : isPartialPaid
      ? `Partial (${advanceMethod} Adv + COD)`
      : 'Cash on Delivery';

    const lineItems: OrderLineItem[] = items.map((it) => ({
      id: it.selectedVariantId || it.productId,
      productId: it.productId,
      variantId: it.selectedVariantId,
      title: it.title,
      variant: it.variantLabel,
      color: it.selectedColor,
      size: it.selectedSize,
      sku: it.sku,
      price: it.unitPrice,
      basePrice: it.declaredPrice,
      quantity: it.qty,
      total: it.unitPrice * it.qty,
      imageUrl: it.imageUrl,
    }));

    const newOrder: MerchantOrderItem = {
      id: newOrderId,
      orderNumber: newOrderId,
      date: 'Today, Just now',
      customer: orderCustomer.trim(),
      phone: orderPhone.trim(),
      address: orderAddress.trim(),
      city: orderCity.trim() || 'Dhaka',
      productId: items[0].productId,
      items: items.map((it) => `${it.title} (${it.variantLabel}) x ${it.qty}`).join(', '),
      qty: totalQty,
      amount: orderTotal,
      subtotal,
      deliveryFee,
      discount,
      advancePayment,
      codAmount,
      memoCode: orderMemoCode,
      status: 'PENDING',
      courier: orderCourier,
      paymentMethod: paymentMethodLabel,
      paymentStatus,
      advancePaymentMethod: advancePayment > 0 ? advanceMethod : undefined,
      advanceTrxId: advancePayment > 0 && advanceTrxId ? advanceTrxId.trim() : undefined,
      lineItems,
      timeline: [
        {
          title: 'Order Created (Manual)',
          description: `Order created by merchant. ${
            advancePayment > 0
              ? `Advance received: ৳${advancePayment.toLocaleString()} (${advanceMethod}). COD: ৳${codAmount.toLocaleString()}`
              : `Full COD collection: ৳${codAmount.toLocaleString()}`
          }`,
          timestamp: 'Just now',
          isCompleted: true,
        },
      ],
    };

    // Deduct stock for all items (including variant-level stock)
    const itemsToDeduct = items.map((it) => ({
      productId: it.productId,
      qty: it.qty,
      variantId: it.selectedVariantId,
      variantSku: it.sku,
      color: it.selectedColor,
      size: it.selectedSize,
    }));

    const result = await onCreateOrder(newOrder, itemsToDeduct);
    if (result && typeof result === 'object' && 'ok' in result && !result.ok) {
      return;
    }

    // Reset form fields for next manual order
    setOrderCustomer('');
    setOrderPhone('');
    setOrderAddress('');
    setDiscount(0);
    setAdvancePayment(0);
    setAdvanceTrxId('');
    const firstProd = products.find(isEligibleProductForOrder) || products[0];
    if (firstProd) {
      const cfg = resolveVariantConfig(firstProd);
      const basePrice = cfg.basePrice || firstProd.price || 0;
      setItems([
        {
          rowId: `row-${Date.now()}-1`,
          productId: firstProd.id,
          title: firstProd.title,
          variantLabel: cfg.variantLabel,
          sku: cfg.sku,
          unitPrice: basePrice,
          declaredPrice: basePrice,
          qty: cfg.maxStock > 0 ? 1 : 0,
          maxStock: cfg.maxStock,
          imageUrl: cfg.imageUrl,
          selectedColor: cfg.selectedColor,
          selectedSize: cfg.selectedSize,
          selectedVariantId: cfg.selectedVariantId,
        },
      ]);
    }
    onClose();

    onTriggerToast(
      `Order ${newOrderId} created with ${items.length} product(s)! ${
        codAmount === 0
          ? 'Full Paid (৳0 COD)'
          : `COD to Collect: ৳${codAmount.toLocaleString()}`
      }`
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-7 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white">
                Create Manual Order
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add products, configure delivery charges, and manage advance COD settlements.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Customer Details */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
              <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span>Customer &amp; Delivery Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orderCustomer}
                  onChange={(e) => setOrderCustomer(e.target.value)}
                  placeholder="e.g. Tanvir Hasan"
                  className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-mono text-slate-500">+88</span>
                  <input
                    type="text"
                    required
                    value={orderPhone}
                    onChange={(e) => setOrderPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full pl-10 pr-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City / District
                </label>
                <input
                  type="text"
                  value={orderCity}
                  onChange={(e) => setOrderCity(e.target.value)}
                  placeholder="Dhaka, Chittagong, Sylhet..."
                  className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Delivery Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={orderAddress}
                  onChange={(e) => setOrderAddress(e.target.value)}
                  placeholder="House 12, Road 4, Sector 7, Uttara, Dhaka"
                  className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Courier Partner
                </label>
                <select
                  value={orderCourier}
                  onChange={(e) => setOrderCourier(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer shadow-2xs"
                >
                  <option value="">Select Courier (Optional)</option>
                  <option value="Steadfast">Steadfast Courier</option>
                  <option value="Pathao">Pathao Logistics</option>
                  <option value="RedX">RedX Delivery</option>
                  <option value="Paperfly">Paperfly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Multiple Products List */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Order Products &amp; Stock Allocation ({items.length} items)</span>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Another Product</span>
              </button>
            </div>

            <div className="space-y-3">
              {eligibleProducts.length === 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 space-y-1.5 mb-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>No Approved Warehouse Stock Available for Orders</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90">
                    Orders can only be created for products that have been <strong>approved by warehouse admin</strong> and have <strong>physical stock verified and stored in warehouse bins</strong>. 
                    If your product is awaiting admin approval or your stock shipment is in transit, please wait for warehouse intake to accept your inventory.
                  </p>
                </div>
              )}

              {items.map((item, index) => {
                const p = products.find((prod) => prod.id === item.productId);
                const hasColors = Boolean(p && p.colors && p.colors.length > 0);
                const availableSizes = p ? getAvailableSizesForColor(p, item.selectedColor) : [];
                const hasSizes = availableSizes.length > 0;
                const isOutOfStock = item.maxStock === 0 || item.qty > item.maxStock;

                return (
                  <div
                    key={item.rowId}
                    className={`p-3.5 sm:p-4 rounded-xl bg-white dark:bg-navy-900 border transition-all space-y-3 shadow-xs ${
                      isOutOfStock
                        ? 'border-rose-400 dark:border-rose-500/60 bg-rose-50/40 dark:bg-rose-950/10'
                        : 'border-slate-200/90 dark:border-white/10'
                    }`}
                  >
                    {/* Top Row: Full-width Product Selector & Delete button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <ProductThumbnail src={item.imageUrl} alt={item.title} size="sm" />
                        <div className="flex-1 min-w-0">
                          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            Product #{index + 1}
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductChange(item.rowId, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
                          >
                            {eligibleProducts.length > 0 ? (
                              <optgroup label="Available in Warehouse (Approved with Stored Stock)">
                                {eligibleProducts.map((prod: MerchantProductItem) => (
                                  <option key={prod.id} value={prod.id}>
                                    {prod.title} — Stock: {prod.stock} pcs in Bin {prod.bin} (Declared: ৳{prod.price})
                                  </option>
                                ))}
                              </optgroup>
                            ) : null}

                            {products.some((prod) => !isEligibleProductForOrder(prod)) && (
                              <optgroup label="Unavailable for Orders (Unapproved or Awaiting Stock)">
                                {products
                                  .filter((prod) => !isEligibleProductForOrder(prod))
                                  .map((prod) => {
                                    const isPending =
                                      prod.status === 'PENDING_APPROVAL' ||
                                      !prod.bin ||
                                      prod.bin === 'Pending Approval' ||
                                      prod.bin === 'Assigned on intake';
                                    const reason = isPending
                                      ? 'Pending Admin Approval'
                                      : 'Approved · Awaiting Stock Arrival at Warehouse';
                                    return (
                                      <option key={prod.id} value={prod.id} disabled className="text-slate-400 bg-slate-100 dark:bg-navy-900">
                                        {prod.title} — [{reason}]
                                      </option>
                                    );
                                  })}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      </div>

                      {items.length > 1 && (
                        <div className="pt-5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.rowId)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                            title="Remove this product"
                            aria-label="Remove this product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Middle Row: Always Visible Variant Selectors (Color, Size), Unit Price, and Quantity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-white/10 items-end">
                      {/* Color Dropdown */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Palette className="h-3.5 w-3.5 text-orange-500" />
                            Color Variant
                          </span>
                          {(() => {
                            const allColors = getAllColorsForProduct(p);
                            const activeColor = allColors.find((c) => c.name.toLowerCase() === (item.selectedColor || '').toLowerCase());
                            return activeColor ? (
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-white/30"
                                style={{ backgroundColor: activeColor.hex }}
                                title={activeColor.name}
                              />
                            ) : null;
                          })()}
                        </label>
                        <select
                          value={item.selectedColor || 'Red'}
                          onChange={(e) => handleColorChange(item.rowId, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
                        >
                          {getAllColorsForProduct(p).map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Size / Spec Dropdown */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          {p ? getAttributeLabel(p.productType) : 'Size / Spec'}
                        </label>
                        <select
                          value={item.selectedSize || 'L'}
                          onChange={(e) => handleSizeChange(item.rowId, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
                        >
                          {getAllSizesForProduct(p, item.selectedColor).map((sizeName) => {
                            const optStock = p ? getOptionStock(p, item.selectedColor, sizeName) : 30;
                            return (
                              <option key={sizeName} value={sizeName}>
                                {sizeName} {optStock > 0 ? `(${optStock} in stock)` : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Selling / Order Price (৳) */}
                      <div>
                        <div className="flex items-center justify-between mb-1 gap-1">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            Selling Price (৳) <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[10px] text-slate-400 font-mono"
                              title="Declared Catalog Base Price"
                            >
                              Base: ৳{item.declaredPrice.toLocaleString()}
                            </span>
                            {item.unitPrice !== item.declaredPrice && (
                              <button
                                type="button"
                                onClick={() => handleUnitPriceChange(item.rowId, item.declaredPrice)}
                                className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          placeholder={String(item.declaredPrice)}
                          value={item.unitPrice === 0 ? '' : item.unitPrice}
                          onChange={(e) => {
                            const raw = e.target.value;
                            handleUnitPriceChange(
                              item.rowId,
                              raw === '' ? 0 : Math.max(0, Number(raw) || 0)
                            );
                          }}
                          aria-label="Order Selling Price"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-navy-900 dark:text-white text-right focus:outline-none focus:border-orange-500 shadow-2xs"
                        />
                      </div>

                      {/* Quantity with +/- */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Qty (Stock: {item.maxStock})
                        </label>
                        <div className="flex items-center shadow-2xs rounded-xl overflow-hidden border border-slate-200 dark:border-white/10">
                          <button
                            type="button"
                            disabled={item.qty <= 1 || item.maxStock <= 0}
                            onClick={() => handleQtyChange(item.rowId, item.qty - 1)}
                            className="px-3 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={item.maxStock > 0 ? 1 : 0}
                            max={item.maxStock}
                            disabled={item.maxStock <= 0}
                            value={item.qty}
                            onChange={(e) =>
                              handleQtyChange(item.rowId, Number(e.target.value) || 0)
                            }
                            className="w-full py-2 bg-slate-50 dark:bg-navy-950 text-xs font-mono font-bold text-center text-navy-900 dark:text-white focus:outline-none disabled:opacity-40"
                          />
                          <button
                            type="button"
                            disabled={item.qty >= item.maxStock || item.maxStock <= 0}
                            onClick={() => handleQtyChange(item.rowId, item.qty + 1)}
                            className="px-3 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Variant Pill, SKU, Stock Status & Line Total */}
                    <div className="pt-2.5 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 font-mono border border-slate-200 dark:border-white/10">
                          SKU: <strong className="text-navy-900 dark:text-white font-bold">{item.sku}</strong>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                          Variant: <strong className="text-navy-900 dark:text-slate-200">{item.variantLabel}</strong>
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-lg font-mono border font-bold ${
                            item.maxStock === 0
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                              : item.maxStock < 5
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                          }`}
                        >
                          {item.maxStock === 0 ? 'Out of Stock' : `${item.maxStock} in stock`}
                        </span>
                        {item.unitPrice > item.declaredPrice && (
                          <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            +৳{(item.unitPrice - item.declaredPrice).toLocaleString()}/unit (+৳{((item.unitPrice - item.declaredPrice) * Math.max(1, item.qty)).toLocaleString()} markup)
                          </span>
                        )}
                        {item.unitPrice > 0 && item.unitPrice < item.declaredPrice && (
                          <span className="px-2.5 py-0.5 rounded-lg font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            -৳{(item.declaredPrice - item.unitPrice).toLocaleString()}/unit below base
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Total:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          ৳{(item.unitPrice * item.qty).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Out of Stock Alert */}
                    {isOutOfStock && (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 font-medium">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>
                          {item.maxStock === 0
                            ? `এই ভ্যারিয়েন্টের কোনো স্টক নেই! ("${item.title} - ${item.variantLabel}")`
                            : `ওয়্যারহাউস স্টকে পর্যাপ্ত প্রোডাক্ট নেই! মোট স্টক: ${item.maxStock} টি (আপনি চেয়েছেন: ${item.qty} টি)`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pricing Engine (Delivery, Discount, Advance Payment & COD) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Pricing &amp; Payment Collection Engine</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Order Financials &amp; Payment Breakdown
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column (Inputs for Delivery, Discount, Advance) */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* 1. Delivery Charge with Presets & Custom Input */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-white/10 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-blue-500" />
                      <span>Delivery Charge</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Parcel destination rate</span>
                  </div>

                  {/* Preset Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('INSIDE_DHAKA', 60)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        deliveryFee === 60
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      Inside Dhaka ৳60
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('SUB_DHAKA', 100)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        deliveryFee === 100
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      Sub-Dhaka ৳100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('OUTSIDE_DHAKA', 120)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        deliveryFee === 120
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      Outside Dhaka ৳120
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectDeliveryPreset('FREE', 0)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        deliveryFee === 0
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      Free Delivery ৳0
                    </button>
                  </div>

                  {/* Custom Delivery Charge Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">Custom Charge:</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1.5 text-xs font-bold text-slate-500">৳</span>
                      <input
                        type="number"
                        min="0"
                        value={deliveryFee}
                        onChange={(e) => {
                          setDeliveryArea('CUSTOM');
                          setDeliveryFee(Number(e.target.value) || 0);
                        }}
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold text-navy-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-2xs"
                        placeholder="e.g. 150 for heavy parcel"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Discount */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-white/10 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-amber-500" />
                      <span>Special Discount</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Deducted from order total</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">৳</span>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-navy-900 dark:text-white focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* 3. Advance Payment */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-white/10 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Advance Received</span>
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Customer prepaid amount
                    </span>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetAdvancePreset('NONE')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        advancePayment === 0
                          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      No Advance (Full COD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAdvancePreset('DELIVERY')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        advancePayment === deliveryFee && deliveryFee > 0
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      Delivery Only (৳{deliveryFee})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAdvancePreset('FULL')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        advancePayment >= orderTotal && orderTotal > 0
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-navy-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      Full Paid (৳{orderTotal.toLocaleString()})
                    </button>
                  </div>

                  {/* Custom Advance Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">৳</span>
                      <input
                        type="number"
                        min="0"
                        max={orderTotal}
                        value={advancePayment}
                        onChange={(e) =>
                          setAdvancePayment(Math.max(0, Number(e.target.value) || 0))
                        }
                        placeholder="Advance Amount"
                        className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>

                    <select
                      value={advanceMethod}
                      onChange={(e) => setAdvanceMethod(e.target.value)}
                      disabled={advancePayment <= 0}
                      className="px-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash Handover</option>
                    </select>
                  </div>

                  {advancePayment > 0 && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={advanceTrxId}
                        onChange={(e) => setAdvanceTrxId(e.target.value)}
                        placeholder="Advance Trx ID / Reference (Optional, e.g. 9J83KA2)"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Order Summary Card */}
              <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-white/10 space-y-4 shadow-xs">
                <div>
                  <span className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider block mb-3">
                    Order Price Summary
                  </span>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Products Subtotal ({totalQty} pcs)</span>
                      <span className="font-semibold text-navy-900 dark:text-white font-mono">
                        ৳{subtotal.toLocaleString()}
                      </span>
                    </div>

                    {extraMarkup > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Extra Markup Above Base</span>
                        <span className="font-bold font-mono tabular-nums">
                          +৳{extraMarkup.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Delivery Charge</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                        +৳{deliveryFee.toLocaleString()}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400">
                        <span>Discount Applied</span>
                        <span className="font-semibold font-mono">
                          -৳{discount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Total Invoice Value:</span>
                      <span className="text-sm font-extrabold text-navy-900 dark:text-white font-mono">
                        ৳{orderTotal.toLocaleString()}
                      </span>
                    </div>

                    {advancePayment > 0 && (
                      <div className="flex justify-between items-center text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                        <span className="font-semibold">
                          Advance Received ({advanceMethod}):
                        </span>
                        <span className="font-bold font-mono">
                          -৳{advancePayment.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* COD Amount Banner */}
                <div
                  className={`p-4 rounded-xl border space-y-1.5 shadow-xs ${
                    codAmount === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                      : advancePayment > 0
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-500/40 text-sky-900 dark:text-sky-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-extrabold tracking-wider">
                      {codAmount === 0
                        ? 'Full Paid (No COD)'
                        : advancePayment > 0
                        ? 'Partial COD Collection'
                        : 'Cash on Delivery (COD)'}
                    </span>
                    <span className="text-lg font-black font-mono text-orange-600 dark:text-orange-400">
                      ৳{codAmount.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed opacity-90">
                    {codAmount === 0
                      ? '✅ Order fully prepaid. Courier will collect ৳0 on delivery.'
                      : advancePayment > 0
                      ? `⚠️ Customer paid ৳${advancePayment.toLocaleString()} advance. Courier will collect remaining ৳${codAmount.toLocaleString()} COD.`
                      : `📦 Full ৳${codAmount.toLocaleString()} will be collected by courier as COD.`}
                  </p>
                </div>

                {/* Estimated Net Merchant Earning */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px]">
                      Estimated Net Earning
                    </span>
                    <span className="text-base font-black font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                      ৳{estNetEarning.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700/90 dark:text-emerald-300/80 font-mono">
                    Invoice ৳{orderTotal.toLocaleString()} − Delivery ৳{deliveryFee.toLocaleString()} − Handling ৳{estHandlingFee.toLocaleString()} − Est. Packaging ৳{estPackagingFee}
                  </p>
                </div>

                {/* Thermal Memo Template Selector */}
                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                    <span>Assign Reseller Memo (4x6 Thermal Slip) *</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-normal">Required for packing</span>
                  </label>
                  {memoList && memoList.length > 0 ? (
                    <select
                      value={orderMemoCode}
                      onChange={(e) => setOrderMemoCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-semibold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      {memoList.map((m) => (
                        <option key={m.id} value={m.code}>
                          {m.code} — {m.resellerName} {m.isDefault ? '[DEFAULT]' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        ⚠️ <strong>No Memo Template Found:</strong> You must create a custom memo before creating orders.
                      </p>
                      <a
                        href="/merchant/memos"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        Create Memo Template
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={eligibleProducts.length === 0 || !memoList || memoList.length === 0}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {eligibleProducts.length === 0
                  ? 'Awaiting Approved Warehouse Stock'
                  : !memoList || memoList.length === 0
                  ? 'Create Memo Template First'
                  : `Confirm & Reserve Stock (${totalQty} Items)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
