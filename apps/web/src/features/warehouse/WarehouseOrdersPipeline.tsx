'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Boxes,
  ClipboardList,
  PackageCheck,
  Truck,
  CheckCircle2,
  Printer,
  Search,
  ArrowRight,
  Eye,
  Plus,
  XCircle,
  FileText,
  RotateCcw,
  AlertTriangle,
  MapPin,
  ExternalLink,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { UnifiedThermalSticker } from '@/features/thermal-print/UnifiedThermalSticker';

export type PipelineMainTab = 'all' | 'pick' | 'pack' | 'dispatch';
export type OrderStage =
  | 'PICK'
  | 'WAITING'
  | 'PACK'
  | 'DISPATCH'
  | 'HANDED_OVER'
  | 'CANCELLED';

export type CourierPartner = 'Steadfast' | 'Pathao' | 'RedX';

export interface WarehousePipelineOrder {
  id: string;
  createdAt: string;
  merchantCode: string;
  merchantName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  city: string;
  productTitle: string;
  productImage: string;
  bin: string;
  color: string;
  size: string;
  sku: string;
  qty: number;
  stockAvailable: number;
  memoCode: string;
  resellerName: string;
  resellerPhone: string;
  resellerAddress: string;
  codAmount: number;
  courier: CourierPartner;
  trackingCode?: string;
  stage: OrderStage;
  holdReason?: string;
  isMemoPrinted?: boolean;
  isCourierBooked?: boolean;
  handedOverAt?: string;
}

function makeProductThumb(bgHex: string, accentHex: string, badgeText: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" rx="18" fill="${bgHex}"/>
    <rect x="6" y="6" width="68" height="68" rx="14" fill="none" stroke="${accentHex}" stroke-width="2" stroke-opacity="0.35"/>
    <path d="M26 22 L34 18 L46 18 L54 22 L62 32 L54 38 L50 32 L50 58 L30 58 L30 32 L26 38 L18 32 Z" fill="${accentHex}" fill-opacity="0.22" stroke="${accentHex}" stroke-width="2.2" stroke-linejoin="round"/>
    <rect x="14" y="52" width="52" height="16" rx="6" fill="#090d16" fill-opacity="0.82"/>
    <text x="40" y="63" text-anchor="middle" fill="#ffffff" font-family="monospace" font-weight="700" font-size="10">${badgeText}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const PRODUCT_THUMBS = {
  HOODIE: makeProductThumb('#0f172a', '#10b981', 'HOODIE'),
  TEE: makeProductThumb('#1e1b4b', '#818cf8', 'TEE'),
  DENIM: makeProductThumb('#172554', '#38bdf8', 'DENIM'),
  BOOTS: makeProductThumb('#271c19', '#f59e0b', 'BOOTS'),
  POLO: makeProductThumb('#0f291e', '#34d399', 'POLO'),
  CARGO: makeProductThumb('#1a2e05', '#a3e635', 'CARGO'),
};

const INITIAL_PIPELINE_ORDERS: WarehousePipelineOrder[] = [
  {
    id: 'ORD-9824',
    createdAt: 'Today, 10:15 AM',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    customerName: 'Tariqul Islam',
    customerPhone: '01812-345678',
    customerAddress: 'House 14, Road 7, Dhanmondi, Dhaka',
    city: 'Dhaka',
    productTitle: 'Heavyweight Winter Fleece Hoodie',
    productImage: PRODUCT_THUMBS.HOODIE,
    bin: 'A-01-02',
    color: 'Black',
    size: 'XL',
    sku: 'MC-101-HOODIE-BLK-XL',
    qty: 1,
    stockAvailable: 42,
    memoCode: 'MEMO-DARAZ-BD',
    resellerName: "Sabbir's Reseller Hub",
    resellerPhone: '+880 1819-554433',
    resellerAddress: 'Plot 22, Gulshan-1, Dhaka',
    codAmount: 1650,
    courier: 'Steadfast',
    stage: 'PICK',
  },
  {
    id: 'ORD-9825',
    createdAt: 'Today, 10:22 AM',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    customerName: 'Nabila Hasan',
    customerPhone: '01798-765432',
    customerAddress: 'Sector 7, Road 12, Uttara, Dhaka',
    city: 'Dhaka',
    productTitle: 'Oversized Drop-Shoulder Graphic Tee',
    productImage: PRODUCT_THUMBS.TEE,
    bin: 'B-03-01',
    color: 'White',
    size: 'M',
    sku: 'MC-102-DROPTEE-WHT-M',
    qty: 2,
    stockAvailable: 28,
    memoCode: 'MEMO-URBAN-MAIN',
    resellerName: 'Urban Threads Official',
    resellerPhone: '+880 1711-234567',
    resellerAddress: 'House 42, Road 11, Banani, Dhaka',
    codAmount: 1580,
    courier: 'Pathao',
    stage: 'PICK',
  },
  {
    id: 'ORD-9832',
    createdAt: 'Today, 10:30 AM',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    customerName: 'Tanvir Rahman',
    customerPhone: '01855-990011',
    customerAddress: 'Road 9, Block B, Bashundhara R/A, Dhaka',
    city: 'Dhaka',
    productTitle: 'Genuine Suede Chelsea Boots',
    productImage: PRODUCT_THUMBS.BOOTS,
    bin: 'C-01-01',
    color: 'Tan',
    size: 'EU 42',
    sku: 'MC-103-BOOT-TAN-42',
    qty: 1,
    stockAvailable: 14,
    memoCode: 'MEMO-APEX-DIRECT',
    resellerName: 'Apex Footwear Direct',
    resellerPhone: '+880 1912-334455',
    resellerAddress: 'Tejgaon I/A, Dhaka',
    codAmount: 3200,
    courier: 'RedX',
    stage: 'WAITING',
    holdReason: 'Item not found in Bin C-01-01 — awaiting restock from bulk pallet',
  },
  {
    id: 'ORD-9826',
    createdAt: 'Today, 10:40 AM',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    customerName: 'Sabbir Ahmed',
    customerPhone: '01911-223344',
    customerAddress: 'Banani Road 11, Block D, Dhaka',
    city: 'Dhaka',
    productTitle: 'Raw Selvedge Denim Jacket',
    productImage: PRODUCT_THUMBS.DENIM,
    bin: 'A-01-04',
    color: 'Indigo',
    size: 'L',
    sku: 'MC-101-JKT-RAW-L',
    qty: 1,
    stockAvailable: 19,
    memoCode: 'MEMO-SABBIR-VIP',
    resellerName: 'Luxury Attire Club',
    resellerPhone: '+880 1715-001122',
    resellerAddress: 'Banani 11, Dhaka',
    codAmount: 2450,
    courier: 'Steadfast',
    stage: 'PACK',
  },
  {
    id: 'ORD-9827',
    createdAt: 'Today, 11:05 AM',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    customerName: 'Mahmudul Hasan',
    customerPhone: '01677-889911',
    customerAddress: 'Mirpur DOHS, Avenue 3, Dhaka',
    city: 'Dhaka',
    productTitle: 'Genuine Suede Chelsea Boots',
    productImage: PRODUCT_THUMBS.BOOTS,
    bin: 'C-01-01',
    color: 'Tan',
    size: 'EU 42',
    sku: 'MC-103-BOOT-TAN-42',
    qty: 1,
    stockAvailable: 14,
    memoCode: 'MEMO-APEX-DIRECT',
    resellerName: 'Apex Footwear Direct',
    resellerPhone: '+880 1912-334455',
    resellerAddress: 'Tejgaon I/A, Dhaka',
    codAmount: 3200,
    courier: 'Pathao',
    stage: 'PACK',
  },
  {
    id: 'ORD-9828',
    createdAt: 'Today, 11:30 AM',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    customerName: 'Rafiqul Islam',
    customerPhone: '01715-443322',
    customerAddress: 'Agrabad Commercial Area, Chattogram',
    city: 'Chattogram',
    productTitle: 'Classic Pique Cotton Polo Shirt',
    productImage: PRODUCT_THUMBS.POLO,
    bin: 'A-02-01',
    color: 'Navy',
    size: 'L',
    sku: 'MC-101-POLO-NVY-L',
    qty: 2,
    stockAvailable: 34,
    memoCode: 'MEMO-DARAZ-BD',
    resellerName: "Sabbir's Reseller Hub",
    resellerPhone: '+880 1819-554433',
    resellerAddress: 'Plot 22, Gulshan-1, Dhaka',
    codAmount: 1900,
    courier: 'Steadfast',
    stage: 'PACK',
  },
  {
    id: 'ORD-9829',
    createdAt: 'Today, 12:00 PM',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    customerName: 'Farhan Sadik',
    customerPhone: '01844-556677',
    customerAddress: 'Zindabazar, Sylhet',
    city: 'Sylhet',
    productTitle: 'Cargo Tactical Jogger Pants',
    productImage: PRODUCT_THUMBS.CARGO,
    bin: 'B-02-03',
    color: 'Olive',
    size: '32',
    sku: 'MC-102-CARGO-OLV-32',
    qty: 1,
    stockAvailable: 21,
    memoCode: 'MEMO-URBAN-MAIN',
    resellerName: 'Urban Threads Official',
    resellerPhone: '+880 1711-234567',
    resellerAddress: 'House 42, Road 11, Banani, Dhaka',
    codAmount: 1350,
    courier: 'Steadfast',
    stage: 'DISPATCH',
    isMemoPrinted: true,
    isCourierBooked: false,
  },
  {
    id: 'ORD-9830',
    createdAt: 'Today, 12:25 PM',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    customerName: 'Anika Tabassum',
    customerPhone: '01722-998811',
    customerAddress: 'Bashundhara R/A, Block C, Dhaka',
    city: 'Dhaka',
    productTitle: 'Heavyweight Winter Fleece Hoodie',
    productImage: PRODUCT_THUMBS.HOODIE,
    bin: 'A-01-02',
    color: 'Black',
    size: 'XL',
    sku: 'MC-101-HOODIE-BLK-XL',
    qty: 1,
    stockAvailable: 42,
    memoCode: 'MEMO-DARAZ-BD',
    resellerName: "Sabbir's Reseller Hub",
    resellerPhone: '+880 1819-554433',
    resellerAddress: 'Plot 22, Gulshan-1, Dhaka',
    codAmount: 1650,
    courier: 'Pathao',
    trackingCode: 'TRK-PAT-552910',
    stage: 'DISPATCH',
    isMemoPrinted: true,
    isCourierBooked: true,
  },
  {
    id: 'ORD-9831',
    createdAt: 'Yesterday, 04:15 PM',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    customerName: 'Imran Hossain',
    customerPhone: '01711-002233',
    customerAddress: 'Gulshan-1, Road 24, Dhaka',
    city: 'Dhaka',
    productTitle: 'Raw Selvedge Denim Jacket',
    productImage: PRODUCT_THUMBS.DENIM,
    bin: 'A-01-04',
    color: 'Indigo',
    size: 'L',
    sku: 'MC-101-JKT-RAW-L',
    qty: 1,
    stockAvailable: 19,
    memoCode: 'MEMO-SABBIR-VIP',
    resellerName: 'Luxury Attire Club',
    resellerPhone: '+880 1715-001122',
    resellerAddress: 'Banani 11, Dhaka',
    codAmount: 2450,
    courier: 'Steadfast',
    trackingCode: 'TRK-STE-771209',
    stage: 'HANDED_OVER',
    isMemoPrinted: true,
    isCourierBooked: true,
    handedOverAt: 'Yesterday, 05:30 PM',
  },
];

const PRODUCT_CATALOG = [
  {
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    title: 'Heavyweight Winter Fleece Hoodie',
    productImage: PRODUCT_THUMBS.HOODIE,
    bin: 'A-01-02',
    color: 'Black',
    size: 'XL',
    sku: 'MC-101-HOODIE-BLK-XL',
    price: 1650,
    stock: 42,
  },
  {
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    title: 'Raw Selvedge Denim Jacket',
    productImage: PRODUCT_THUMBS.DENIM,
    bin: 'A-01-04',
    color: 'Indigo',
    size: 'L',
    sku: 'MC-101-JKT-RAW-L',
    price: 2450,
    stock: 19,
  },
  {
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    title: 'Classic Pique Cotton Polo Shirt',
    productImage: PRODUCT_THUMBS.POLO,
    bin: 'A-02-01',
    color: 'Navy',
    size: 'L',
    sku: 'MC-101-POLO-NVY-L',
    price: 950,
    stock: 34,
  },
  {
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    title: 'Oversized Drop-Shoulder Graphic Tee',
    productImage: PRODUCT_THUMBS.TEE,
    bin: 'B-03-01',
    color: 'White',
    size: 'M',
    sku: 'MC-102-DROPTEE-WHT-M',
    price: 790,
    stock: 28,
  },
  {
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    title: 'Genuine Suede Chelsea Boots',
    productImage: PRODUCT_THUMBS.BOOTS,
    bin: 'C-01-01',
    color: 'Tan',
    size: 'EU 42',
    sku: 'MC-103-BOOT-TAN-42',
    price: 3200,
    stock: 14,
  },
];

const RESELLER_MEMOS = [
  {
    code: 'MEMO-DARAZ-BD',
    resellerName: "Sabbir's Reseller Hub",
    phone: '+880 1819-554433',
    address: 'Plot 22, Gulshan-1, Dhaka',
  },
  {
    code: 'MEMO-SABBIR-VIP',
    resellerName: 'Luxury Attire Club',
    phone: '+880 1715-001122',
    address: 'Banani Road 11, Dhaka',
  },
  {
    code: 'MEMO-URBAN-MAIN',
    resellerName: 'Urban Threads Official',
    phone: '+880 1711-234567',
    address: 'House 42, Road 11, Banani, Dhaka',
  },
  {
    code: 'MEMO-APEX-DIRECT',
    resellerName: 'Apex Footwear Direct',
    phone: '+880 1912-334455',
    address: 'Tejgaon I/A, Dhaka',
  },
];

const HOLD_REASON_PRESETS = [
  'Item not found in assigned Bin — physical count mismatch',
  'Bin empty — awaiting restock from bulk pallet zone',
  'Damaged / defective unit in Bin — awaiting QC replacement',
  'Barcode label missing on garment — sent for relabeling',
];

type PendingConfirmationAction =
  | {
      type: 'MARK_PICKED';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'MARK_WAITING';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'RESUME_PICK';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'PRINT_AND_PACK';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'BOOK_COURIER';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'CONFIRM_HANDOVER';
      orders: WarehousePipelineOrder[];
    }
  | {
      type: 'CANCEL_ORDER';
      orders: WarehousePipelineOrder[];
    };

export interface WarehouseOrdersPipelineProps {
  initialTab?: PipelineMainTab;
  activeTab?: PipelineMainTab;
  onTabChange?: (tab: PipelineMainTab) => void;
  onOpenDeliveryTracker?: () => void;
}

export function WarehouseOrdersPipeline({
  initialTab = 'all',
  activeTab: controlledTab,
  onTabChange,
  onOpenDeliveryTracker,
}: WarehouseOrdersPipelineProps) {
  const [orders, setOrders] = useState<WarehousePipelineOrder[]>(INITIAL_PIPELINE_ORDERS);
  const [internalTab, setInternalTab] = useState<PipelineMainTab>(controlledTab ?? initialTab);
  const activeTab = controlledTab ?? internalTab;

  const [pickSubFilter, setPickSubFilter] = useState<'READY' | 'WAITING'>('READY');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Clean Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<'ALL' | OrderStage>('ALL');
  const [courierFilter, setCourierFilter] = useState<string>('ALL');

  // Modals & Isolated Print State
  const [toast, setToast] = useState<string | null>(null);
  const [previewMemoOrder, setPreviewMemoOrder] = useState<WarehousePipelineOrder | null>(null);
  const [printMode, setPrintMode] = useState<'MEMOS' | 'PICK_SHEET' | 'MANIFEST' | null>(null);
  const [printingOrders, setPrintingOrders] = useState<WarehousePipelineOrder[]>([]);

  // Mandatory Confirmation Modal State
  const [pendingAction, setPendingAction] = useState<PendingConfirmationAction | null>(null);
  const [holdReasonInput, setHoldReasonInput] = useState<string>(HOLD_REASON_PRESETS[0]);
  const [courierOverrideModalValue, setCourierOverrideModalValue] = useState<
    'KEEP_ORDER_COURIER' | CourierPartner
  >('KEEP_ORDER_COURIER');

  // Create Manual Order Modal State (05_ORDERS_MODULE.md)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCity, setNewCity] = useState('Dhaka');
  const [newSku, setNewSku] = useState(PRODUCT_CATALOG[0].sku);
  const [newQty, setNewQty] = useState(1);
  const [newMemoCode, setNewMemoCode] = useState(RESELLER_MEMOS[0].code);
  const [newCourier, setNewCourier] = useState<CourierPartner>('Steadfast');

  useEffect(() => {
    if (controlledTab) {
      setInternalTab(controlledTab);
      setSelectedIds([]);
    }
  }, [controlledTab]);

  useEffect(() => {
    if (!controlledTab) {
      setInternalTab(initialTab);
      setSelectedIds([]);
    }
  }, [initialTab, controlledTab]);

  const handleSelectTab = (tab: PipelineMainTab) => {
    setInternalTab(tab);
    setSelectedIds([]);
    onTabChange?.(tab);
  };

  // Keep body.printing-single-invoice active while previewMemoOrder modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (previewMemoOrder) {
      setPrintMode('MEMOS');
      setPrintingOrders([previewMemoOrder]);
      document.body.classList.add('printing-single-invoice');
    } else if (!printMode) {
      document.body.classList.remove('printing-single-invoice');
    }
  }, [previewMemoOrder, printMode]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3400);
  };

  // Trigger isolated browser print for 4x6" Memos, Pick Sheet, or Handover Manifest
  const triggerIsolatedPrint = (
    mode: 'MEMOS' | 'PICK_SHEET' | 'MANIFEST',
    targetOrders: WarehousePipelineOrder[],
  ) => {
    if (targetOrders.length === 0) return;
    setPrintMode(mode);
    setPrintingOrders(targetOrders);
    if (typeof document !== 'undefined') {
      document.body.classList.add('printing-single-invoice');
      setTimeout(() => {
        window.print();
        document.body.classList.remove('printing-single-invoice');
        setPrintMode(null);
      }, 90);
    }
  };

  // Filtered Orders for current tab (Strictly In-Warehouse Fulfillment Pipeline — excludes HANDED_OVER)
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Remove handed over / dispatched-to-courier orders from the active in-warehouse pipeline
      if (o.stage === 'HANDED_OVER') return false;

      const matchesMerchant = merchantFilter === 'ALL' || o.merchantCode === merchantFilter;
      const matchesCourier = courierFilter === 'ALL' || o.courier === courierFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone.includes(searchQuery) ||
        o.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.bin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.memoCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesMerchant || !matchesCourier || !matchesSearch) return false;

      if (activeTab === 'pick') {
        return pickSubFilter === 'READY' ? o.stage === 'PICK' : o.stage === 'WAITING';
      }
      if (activeTab === 'pack') return o.stage === 'PACK';
      if (activeTab === 'dispatch') return o.stage === 'DISPATCH';

      // 'all' tab (in-warehouse orders only)
      return stageFilter === 'ALL' || o.stage === stageFilter;
    });
  }, [orders, activeTab, pickSubFilter, merchantFilter, courierFilter, searchQuery, stageFilter]);

  // Stage Counts (Strictly In-Warehouse Pipeline vs Handed Over to Delivery Tracker)
  const counts = useMemo(
    () => ({
      all: orders.filter((o) => o.stage !== 'HANDED_OVER').length,
      pickReady: orders.filter((o) => o.stage === 'PICK').length,
      pickWaiting: orders.filter((o) => o.stage === 'WAITING').length,
      pickTotal: orders.filter((o) => o.stage === 'PICK' || o.stage === 'WAITING').length,
      pack: orders.filter((o) => o.stage === 'PACK').length,
      dispatch: orders.filter((o) => o.stage === 'DISPATCH').length,
      dispatchBooked: orders.filter((o) => o.stage === 'DISPATCH' && o.isCourierBooked).length,
      handedOver: orders.filter((o) => o.stage === 'HANDED_OVER').length,
    }),
    [orders],
  );

  // Selection helpers
  const allVisibleSelected =
    filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Inline Courier Change Handler (for Dispatch / All Orders before or during booking)
  const handleInlineCourierChange = (orderId: string, newCourierPartner: CourierPartner) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedTracking = o.isCourierBooked
          ? `TRK-${newCourierPartner.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`
          : o.trackingCode;
        return {
          ...o,
          courier: newCourierPartner,
          trackingCode: updatedTracking,
        };
      }),
    );
    showToast(`Courier for ${orderId} updated to ${newCourierPartner}.`);
  };

  // ================= MANDATORY CONFIRMATION LAUNCHERS =================

  const requestMarkPicked = (targetOrders: WarehousePipelineOrder[]) => {
    if (targetOrders.length === 0) return;
    setPendingAction({ type: 'MARK_PICKED', orders: targetOrders });
  };

  const requestMarkWaiting = (targetOrders: WarehousePipelineOrder[]) => {
    if (targetOrders.length === 0) return;
    setHoldReasonInput(HOLD_REASON_PRESETS[0]);
    setPendingAction({ type: 'MARK_WAITING', orders: targetOrders });
  };

  const requestResumePick = (targetOrders: WarehousePipelineOrder[]) => {
    if (targetOrders.length === 0) return;
    setPendingAction({ type: 'RESUME_PICK', orders: targetOrders });
  };

  const requestPrintAndPack = (targetOrders: WarehousePipelineOrder[]) => {
    if (targetOrders.length === 0) return;
    setPendingAction({ type: 'PRINT_AND_PACK', orders: targetOrders });
  };

  const requestBookCourier = (targetOrders: WarehousePipelineOrder[]) => {
    if (targetOrders.length === 0) return;
    setCourierOverrideModalValue(
      targetOrders.length === 1 ? targetOrders[0].courier : 'KEEP_ORDER_COURIER',
    );
    setPendingAction({ type: 'BOOK_COURIER', orders: targetOrders });
  };

  const requestConfirmHandover = (targetOrders: WarehousePipelineOrder[]) => {
    if (targetOrders.length === 0) return;
    setPendingAction({ type: 'CONFIRM_HANDOVER', orders: targetOrders });
  };

  const requestCancelOrder = (targetOrder: WarehousePipelineOrder) => {
    setPendingAction({ type: 'CANCEL_ORDER', orders: [targetOrder] });
  };

  // ================= CONFIRMED STAGE TRANSITION EXECUTION =================

  const executeConfirmedAction = () => {
    if (!pendingAction) return;
    const targetOrders = pendingAction.orders;
    const ids = targetOrders.map((o) => o.id);

    switch (pendingAction.type) {
      case 'MARK_PICKED': {
        setOrders((prev) =>
          prev.map((o) =>
            ids.includes(o.id) ? { ...o, stage: 'PACK', holdReason: undefined } : o,
          ),
        );
        setSelectedIds([]);
        showToast(`${ids.length} order(s) verified from Bin & moved to 2. Pack List!`);
        break;
      }

      case 'MARK_WAITING': {
        const reason = holdReasonInput.trim() || HOLD_REASON_PRESETS[0];
        setOrders((prev) =>
          prev.map((o) =>
            ids.includes(o.id) ? { ...o, stage: 'WAITING', holdReason: reason } : o,
          ),
        );
        setSelectedIds([]);
        showToast(
          `${ids.length} order(s) moved to Waiting / Not Found in Bin (${reason}).`,
        );
        break;
      }

      case 'RESUME_PICK': {
        setOrders((prev) =>
          prev.map((o) =>
            ids.includes(o.id) ? { ...o, stage: 'PICK', holdReason: undefined } : o,
          ),
        );
        setSelectedIds([]);
        setPickSubFilter('READY');
        showToast(`${ids.length} order(s) restored to Ready to Pick!`);
        break;
      }

      case 'PRINT_AND_PACK': {
        triggerIsolatedPrint('MEMOS', targetOrders);
        setOrders((prev) =>
          prev.map((o) =>
            ids.includes(o.id) ? { ...o, stage: 'DISPATCH', isMemoPrinted: true } : o,
          ),
        );
        setSelectedIds([]);
        showToast(
          `Printed ${targetOrders.length} 4x6" Thermal Invoice(s) & moved to 3. Courier Dispatch!`,
        );
        break;
      }

      case 'BOOK_COURIER': {
        setOrders((prev) =>
          prev.map((o) => {
            if (!ids.includes(o.id)) return o;
            const finalCourier: CourierPartner =
              courierOverrideModalValue === 'KEEP_ORDER_COURIER'
                ? o.courier
                : courierOverrideModalValue;
            const prefix = finalCourier.slice(0, 3).toUpperCase();
            const code = `TRK-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
            return {
              ...o,
              courier: finalCourier,
              stage: 'DISPATCH',
              isCourierBooked: true,
              trackingCode: code,
            };
          }),
        );
        setSelectedIds([]);
        showToast(`Booked ${ids.length} parcel(s) in Courier API with Tracking ID!`);
        break;
      }

      case 'CONFIRM_HANDOVER': {
        const nowStr = 'Just now';
        setOrders((prev) =>
          prev.map((o) => {
            if (!ids.includes(o.id)) return o;
            const prefix = o.courier.slice(0, 3).toUpperCase();
            const code =
              o.trackingCode || `TRK-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
            return {
              ...o,
              stage: 'HANDED_OVER',
              isCourierBooked: true,
              trackingCode: code,
              handedOverAt: nowStr,
            };
          }),
        );
        setSelectedIds([]);
        showToast(
          `${ids.length} parcel(s) handed over to courier & moved to Dispatched & Delivery Tracker!`,
        );
        break;
      }

      case 'CANCEL_ORDER': {
        setOrders((prev) =>
          prev.map((o) =>
            ids.includes(o.id)
              ? { ...o, stage: 'CANCELLED', stockAvailable: o.stockAvailable + o.qty }
              : o,
          ),
        );
        setSelectedIds([]);
        showToast(
          `Order ${ids.join(', ')} cancelled & reserved stock restored to warehouse bin.`,
        );
        break;
      }
    }

    setPendingAction(null);
  };

  // Create Manual Order (05_ORDERS_MODULE.md)
  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim() || !newCustomerAddress.trim()) {
      showToast('Please fill in customer name, phone, and address.');
      return;
    }
    const product = PRODUCT_CATALOG.find((p) => p.sku === newSku) || PRODUCT_CATALOG[0];
    const memo = RESELLER_MEMOS.find((m) => m.code === newMemoCode) || RESELLER_MEMOS[0];
    const nextOrderNum = 9833 + orders.length;

    const created: WarehousePipelineOrder = {
      id: `ORD-${nextOrderNum}`,
      createdAt: 'Just now',
      merchantCode: product.merchantCode,
      merchantName: product.merchantName,
      customerName: newCustomerName.trim(),
      customerPhone: newCustomerPhone.trim(),
      customerAddress: newCustomerAddress.trim(),
      city: newCity,
      productTitle: product.title,
      productImage: product.productImage,
      bin: product.bin,
      color: product.color,
      size: product.size,
      sku: product.sku,
      qty: newQty,
      stockAvailable: Math.max(0, product.stock - newQty),
      memoCode: memo.code,
      resellerName: memo.resellerName,
      resellerPhone: memo.phone,
      resellerAddress: memo.address,
      codAmount: product.price * newQty,
      courier: newCourier,
      stage: 'PICK', // Automatically enters Pick List if in stock (06_PICKING_MODULE.md)
    };

    setOrders((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerAddress('');
    showToast(`Order ${created.id} created (Bin ${created.bin}) & sent to 1. Pick List!`);
  };

  const selectedOrders = useMemo(
    () => filteredOrders.filter((o) => selectedIds.includes(o.id)),
    [filteredOrders, selectedIds],
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* =====================================================================
          HEADER & PRIMARY ACTIONS (WITH POST-DISPATCH DELIVERY TRACKER LINK)
         ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Warehouse Orders Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              In-Warehouse Fulfillment Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Active warehouse operations: All Orders → 1. Pick List (Bin Verified) → 2. Pack &amp;
            4x6&quot; Print → 3. Courier Dispatch. Handed-over parcels move to Delivery Tracker.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Post-Dispatch Delivery Tracker Bridge Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenDeliveryTracker) {
                onOpenDeliveryTracker();
              } else {
                showToast(
                  `${counts.handedOver} dispatched order(s) are tracked in Dispatched & Delivery Tracker.`,
                );
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-sky-500/40 text-xs font-bold text-sky-300 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Truck className="w-4 h-4 text-sky-400" />
            <span>View Dispatched &amp; Delivery Tracker</span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 font-mono text-[11px] border border-sky-500/30">
              {counts.handedOver} Sent
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Manual Order</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          4 CLEAN PIPELINE STAGE CARDS (All Orders | Pick | Pack | Dispatch)
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'all' as PipelineMainTab,
            label: 'All Active Orders',
            count: counts.all,
            subtitle: `${counts.handedOver} handed over to courier`,
            icon: Boxes,
          },
          {
            id: 'pick' as PipelineMainTab,
            label: '1. Pick List',
            count: counts.pickReady,
            subtitle:
              counts.pickWaiting > 0
                ? `${counts.pickReady} Ready · ${counts.pickWaiting} Waiting/Hold`
                : 'Bin-guided picking queue',
            icon: ClipboardList,
          },
          {
            id: 'pack' as PipelineMainTab,
            label: '2. Pack & 4x6" Print',
            count: counts.pack,
            subtitle: 'Select & print 4x6" memo',
            icon: PackageCheck,
          },
          {
            id: 'dispatch' as PipelineMainTab,
            label: '3. Courier Dispatch',
            count: counts.dispatch,
            subtitle: `${counts.dispatchBooked} booked · Ready handover`,
            icon: Truck,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSelectTab(tab.id)}
              className={`text-left rounded-2xl border p-4 transition-all flex items-center justify-between ${
                isActive
                  ? 'border-emerald-500 bg-emerald-950/25 shadow-lg'
                  : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
              }`}
            >
              <div>
                <span className="text-xs font-semibold text-slate-400 block">{tab.label}</span>
                <div className="text-2xl font-extrabold text-white mt-1 font-mono">{tab.count}</div>
                <span className="text-[11px] text-emerald-400 mt-0.5 block">{tab.subtitle}</span>
              </div>
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center border shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-950 text-emerald-400 border-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          PICK LIST SUB-FILTER BAR: Ready to Pick vs Waiting / Not Found in Bin
         ===================================================================== */}
      {activeTab === 'pick' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPickSubFilter('READY');
                setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                pickSubFilter === 'READY'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Ready to Pick ({counts.pickReady})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPickSubFilter('WAITING');
                setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                pickSubFilter === 'WAITING'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                  : 'bg-slate-950 text-amber-300 border-amber-500/30 hover:border-amber-500/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Waiting / Not Found in Bin ({counts.pickWaiting})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {pickSubFilter === 'READY'
                ? 'Verify Bin Location before picking. If an item is missing from the bin, click "Not Found / Hold".'
                : 'Orders on hold because items were missing or damaged in the assigned bin.'}
            </span>
          </div>
        </div>
      )}

      {/* =====================================================================
          CLEAN FILTER & BULK ACTION BAR
         ===================================================================== */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Search + Merchant + Courier / Stage Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64 min-w-[190px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order, Bin, SKU, Customer..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Merchants</option>
            <option value="MC-101">MC-101 — Sabbir&apos;s Store</option>
            <option value="MC-102">MC-102 — Urban Threads BD</option>
            <option value="MC-103">MC-103 — Apex Footwear Hub</option>
          </select>

          <select
            value={courierFilter}
            onChange={(e) => setCourierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Couriers</option>
            <option value="Steadfast">Steadfast</option>
            <option value="Pathao">Pathao</option>
            <option value="RedX">RedX</option>
          </select>

          {activeTab === 'all' && (
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as 'ALL' | OrderStage)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All In-Warehouse Stages</option>
              <option value="PICK">To Pick (Bin Ready)</option>
              <option value="WAITING">Waiting / Not Found in Bin</option>
              <option value="PACK">To Pack</option>
              <option value="DISPATCH">Ready Dispatch / Booked</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          )}

          {(searchQuery ||
            merchantFilter !== 'ALL' ||
            courierFilter !== 'ALL' ||
            stageFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setMerchantFilter('ALL');
                setCourierFilter('ALL');
                setStageFilter('ALL');
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Right: Stage-Specific Clean Actions (All actions open Confirmation Modal!) */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'pick' && (
            <>
              <button
                type="button"
                onClick={() =>
                  triggerIsolatedPrint(
                    'PICK_SHEET',
                    selectedOrders.length > 0 ? selectedOrders : filteredOrders,
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Pick Sheet (with Bins)</span>
              </button>

              {pickSubFilter === 'READY' ? (
                <>
                  <button
                    type="button"
                    disabled={selectedOrders.length === 0}
                    onClick={() => requestMarkWaiting(selectedOrders)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                      selectedOrders.length > 0
                        ? 'bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Not Found / Hold ({selectedOrders.length})</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedOrders.length === 0}
                    onClick={() => requestMarkPicked(selectedOrders)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      selectedOrders.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Selected Picked ({selectedOrders.length})</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={selectedOrders.length === 0}
                  onClick={() => requestResumePick(selectedOrders)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedOrders.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Found → Resume Pick ({selectedOrders.length})</span>
                </button>
              )}
            </>
          )}

          {activeTab === 'pack' && (
            <button
              type="button"
              disabled={selectedOrders.length === 0}
              onClick={() => requestPrintAndPack(selectedOrders)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                selectedOrders.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>
                Print Selected 4x6&quot; Invoices &amp; Mark Packed ({selectedOrders.length})
              </span>
            </button>
          )}

          {activeTab === 'dispatch' && (
            <>
              <button
                type="button"
                onClick={() =>
                  triggerIsolatedPrint(
                    'MANIFEST',
                    selectedOrders.length > 0 ? selectedOrders : filteredOrders,
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Print Handover Sheet</span>
              </button>

              <button
                type="button"
                disabled={selectedOrders.length === 0}
                onClick={() => requestBookCourier(selectedOrders)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  selectedOrders.length > 0
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Book Selected in Courier ({selectedOrders.length})</span>
              </button>

              <button
                type="button"
                disabled={selectedOrders.length === 0}
                onClick={() => requestConfirmHandover(selectedOrders)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  selectedOrders.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Courier Handover ({selectedOrders.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* =====================================================================
          CLEAN ORDERS TABLE (With Product Thumbnail, Bin Location, Courier Selector)
         ===================================================================== */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                    title="Select All"
                  />
                </th>
                <th className="p-4">Order ID &amp; Merchant</th>
                <th className="p-4">Product, Variant &amp; 2-Part SKU</th>
                <th className="p-4">Bin Location &amp; Stock</th>
                <th className="p-4">Memo / Invoice</th>
                <th className="p-4">Customer &amp; Courier (Editable)</th>
                <th className="p-4">Stage</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-xs text-slate-400">
                    No active warehouse orders found in this stage matching your filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-emerald-950/20'
                          : order.stage === 'WAITING'
                            ? 'bg-amber-950/10 hover:bg-amber-950/20'
                            : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(order.id)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-500"
                        />
                      </td>

                      {/* Order ID & Merchant */}
                      <td className="p-4">
                        <span className="font-mono text-xs font-extrabold text-white block">
                          {order.id}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                          {order.merchantCode} · {order.merchantName}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {order.createdAt}
                        </span>
                      </td>

                      {/* Product Thumbnail + Title, Variant & 2-Part SKU */}
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={order.productImage}
                            alt={order.productTitle}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-100 leading-snug">
                              {order.productTitle}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                                {order.color} / <strong>{order.size}</strong>
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
                                Qty: {order.qty}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 block mt-1">
                              {order.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Prominent Bin Location & Stock Availability */}
                      <td className="p-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold border ${
                              order.stage === 'WAITING'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>Bin: {order.bin}</span>
                          </span>

                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              order.stockAvailable > 0
                                ? 'bg-slate-950 text-slate-300 border-slate-800'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {order.stockAvailable > 0
                              ? `${order.stockAvailable} in stock`
                              : 'Stock Out'}
                          </span>
                        </div>
                      </td>

                      {/* Reseller Memo Code */}
                      <td className="p-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 inline-block">
                          {order.memoCode}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          {order.resellerName}
                        </span>
                      </td>

                      {/* Customer & Inline Courier Override Dropdown */}
                      <td className="p-4">
                        <div className="text-xs font-bold text-slate-200">{order.customerName}</div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {order.customerPhone} · {order.city}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs font-mono font-extrabold text-emerald-400">
                            ৳ {order.codAmount.toLocaleString()}
                          </span>

                          {/* Inline Courier Selector so Operator can switch courier anytime before handover */}
                          <select
                            value={order.courier}
                            onChange={(e) =>
                              handleInlineCourierChange(
                                order.id,
                                e.target.value as CourierPartner,
                              )
                            }
                            disabled={order.stage === 'CANCELLED'}
                            title="Change Courier Partner if merchant default courier has an issue"
                            className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-950 text-sky-300 border border-slate-700 hover:border-sky-500/60 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="Steadfast">Steadfast</option>
                            <option value="Pathao">Pathao</option>
                            <option value="RedX">RedX</option>
                          </select>
                        </div>
                        {order.trackingCode && (
                          <span className="text-[10px] font-mono text-amber-300 block mt-1">
                            {order.trackingCode}
                          </span>
                        )}
                      </td>

                      {/* Stage Badge + Waiting Reason */}
                      <td className="p-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-block ${
                            order.stage === 'PICK'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : order.stage === 'WAITING'
                                ? 'bg-rose-500/15 text-amber-200 border-amber-500/40'
                                : order.stage === 'PACK'
                                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                                  : order.stage === 'DISPATCH'
                                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {order.stage === 'PICK'
                            ? 'TO PICK'
                            : order.stage === 'WAITING'
                              ? 'WAITING: NOT IN BIN'
                              : order.stage === 'PACK'
                                ? 'TO PACK'
                                : order.stage === 'DISPATCH'
                                  ? order.isCourierBooked
                                    ? 'COURIER BOOKED'
                                    : 'READY DISPATCH'
                                  : order.stage}
                        </span>
                        {order.stage === 'WAITING' && order.holdReason && (
                          <p className="text-[10px] text-amber-300/90 mt-1 max-w-[180px] leading-tight">
                            {order.holdReason}
                          </p>
                        )}
                      </td>

                      {/* Clean Stage-Specific Action Buttons (All trigger Confirmation Modal) */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setPreviewMemoOrder(order)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1"
                            title="View or Print 4x6 Invoice"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Memo</span>
                          </button>

                          {order.stage === 'PICK' && (
                            <>
                              <button
                                type="button"
                                onClick={() => requestMarkWaiting([order])}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1"
                                title="Put on Waiting/Hold if item is not found in the assigned Bin"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Not Found / Hold</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => requestMarkPicked([order])}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
                              >
                                <span>Mark Picked</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {order.stage === 'WAITING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => requestResumePick([order])}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Found → Resume Pick</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => requestMarkPicked([order])}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
                              >
                                <span>Mark Picked</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {order.stage === 'PACK' && (
                            <button
                              type="button"
                              onClick={() => requestPrintAndPack([order])}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print 4x6&quot; &amp; Pack</span>
                            </button>
                          )}

                          {order.stage === 'DISPATCH' && !order.isCourierBooked && (
                            <button
                              type="button"
                              onClick={() => requestBookCourier([order])}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white flex items-center gap-1"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Book Courier</span>
                            </button>
                          )}

                          {order.stage === 'DISPATCH' && order.isCourierBooked && (
                            <button
                              type="button"
                              onClick={() => requestConfirmHandover([order])}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Handover</span>
                            </button>
                          )}

                          {(order.stage === 'PICK' ||
                            order.stage === 'WAITING' ||
                            order.stage === 'PACK') && (
                            <button
                              type="button"
                              onClick={() => requestCancelOrder(order)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60"
                              title="Cancel Order & Restore Stock"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          MODAL 0: MANDATORY ACTION CONFIRMATION NOTIFICATION MODAL
         ===================================================================== */}
      <Modal
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        title={
          pendingAction?.type === 'MARK_PICKED'
            ? 'Confirm Bin Pick Verification'
            : pendingAction?.type === 'MARK_WAITING'
              ? 'Confirm Waiting / Hold (Item Not Found in Bin)'
              : pendingAction?.type === 'RESUME_PICK'
                ? 'Confirm Item Found — Resume Pick List'
                : pendingAction?.type === 'PRINT_AND_PACK'
                  ? 'Confirm 4x6" Thermal Print & Pack Completion'
                  : pendingAction?.type === 'BOOK_COURIER'
                    ? 'Confirm Courier API Booking & Courier Selection'
                    : pendingAction?.type === 'CONFIRM_HANDOVER'
                      ? 'Confirm Physical Courier Handover & Dispatch'
                      : 'Confirm Order Cancellation & Stock Return'
        }
        subtitle={
          pendingAction
            ? `Please verify the ${pendingAction.orders.length} selected order(s) before proceeding.`
            : ''
        }
        size="md"
      >
        {pendingAction && (
          <div className="space-y-4 text-xs">
            {/* Action Summary Banner */}
            <div
              className={`rounded-xl border p-3.5 flex items-start gap-3 ${
                pendingAction.type === 'CANCEL_ORDER'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : pendingAction.type === 'MARK_WAITING'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-emerald-950/25 border-emerald-500/35 text-slate-200'
              }`}
            >
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div className="space-y-1">
                <div className="font-bold text-white">
                  {pendingAction.type === 'MARK_PICKED' &&
                    `Move ${pendingAction.orders.length} order(s) from 1. Pick List to 2. Pack & 4x6" Print.`}
                  {pendingAction.type === 'MARK_WAITING' &&
                    `Place ${pendingAction.orders.length} order(s) into Waiting / Not Found in Bin status.`}
                  {pendingAction.type === 'RESUME_PICK' &&
                    `Return ${pendingAction.orders.length} waiting order(s) back to Ready to Pick.`}
                  {pendingAction.type === 'PRINT_AND_PACK' &&
                    `Print ${pendingAction.orders.length} 4x6" Thermal Sticker(s) and move to 3. Courier Dispatch.`}
                  {pendingAction.type === 'BOOK_COURIER' &&
                    `Transmit ${pendingAction.orders.length} order(s) to Courier API and generate Tracking IDs.`}
                  {pendingAction.type === 'CONFIRM_HANDOVER' &&
                    `Confirm courier pickup rider handover for ${pendingAction.orders.length} parcel(s). They will leave the active warehouse pipeline and move to Dispatched & Delivery Tracker.`}
                  {pendingAction.type === 'CANCEL_ORDER' &&
                    `Cancel order and immediately restore reserved inventory units back to the assigned warehouse bin.`}
                </div>
              </div>
            </div>

            {/* Affected Orders List */}
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {pendingAction.orders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-xl bg-slate-950 border border-slate-800 p-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={ord.productImage}
                      alt={ord.productTitle}
                      className="h-9 w-9 rounded-lg object-cover border border-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-white">{ord.id}</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                          Bin: {ord.bin}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">{ord.productTitle}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {ord.sku} · Qty: {ord.qty} · Customer: {ord.customerName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-emerald-400 block">
                      ৳ {ord.codAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold text-sky-300">{ord.courier}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Extra Input: Hold Reason when marking Not Found / Waiting */}
            {pendingAction.type === 'MARK_WAITING' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block font-bold text-amber-300">
                  Select or Enter Reason Item Could Not Be Picked from Bin:
                </label>
                <select
                  value={
                    HOLD_REASON_PRESETS.includes(holdReasonInput) ? holdReasonInput : '__CUSTOM__'
                  }
                  onChange={(e) => {
                    if (e.target.value !== '__CUSTOM__') {
                      setHoldReasonInput(e.target.value);
                    }
                  }}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {HOLD_REASON_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                  <option value="__CUSTOM__">Custom reason...</option>
                </select>
                <input
                  type="text"
                  value={holdReasonInput}
                  onChange={(e) => setHoldReasonInput(e.target.value)}
                  placeholder="Describe why the item was not found in the bin..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Extra Input: Courier Override Selector when Booking Courier */}
            {pendingAction.type === 'BOOK_COURIER' && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block font-bold text-sky-300">
                  Courier Partner (Change here if merchant&apos;s default courier has an issue):
                </label>
                <select
                  value={courierOverrideModalValue}
                  onChange={(e) =>
                    setCourierOverrideModalValue(
                      e.target.value as 'KEEP_ORDER_COURIER' | CourierPartner,
                    )
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  {pendingAction.orders.length > 1 && (
                    <option value="KEEP_ORDER_COURIER">
                      Keep Each Order&apos;s Assigned Courier
                    </option>
                  )}
                  <option value="Steadfast">Steadfast Courier</option>
                  <option value="Pathao">Pathao Courier</option>
                  <option value="RedX">RedX Logistics</option>
                </select>
              </div>
            )}

            {/* Modal Footer: Cancel & Confirm & Proceed */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`px-4 py-2 rounded-xl font-bold text-white flex items-center gap-1.5 shadow-lg ${
                  pendingAction.type === 'CANCEL_ORDER'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : pendingAction.type === 'MARK_WAITING'
                      ? 'bg-amber-600 hover:bg-amber-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Proceed</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* =====================================================================
          MODAL 1: IN-PLACE 4x6" MEMO / INVOICE PREVIEW & SINGLE PRINT
         ===================================================================== */}
      <Modal
        isOpen={Boolean(previewMemoOrder)}
        onClose={() => setPreviewMemoOrder(null)}
        title={
          previewMemoOrder
            ? `4x6" Invoice Preview · ${previewMemoOrder.id} (${previewMemoOrder.memoCode})`
            : '4x6" Invoice Preview'
        }
        subtitle={
          previewMemoOrder
            ? `${previewMemoOrder.resellerName} — Ready for 4x6" Thermal Printer`
            : ''
        }
        size="lg"
      >
        {previewMemoOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">{previewMemoOrder.resellerName}</span> •{' '}
                <span className="font-mono text-emerald-400">{previewMemoOrder.memoCode}</span> •{' '}
                <span className="font-mono text-amber-300">Bin: {previewMemoOrder.bin}</span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print 4x6&quot; Invoice</span>
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto py-2">
              <UnifiedThermalSticker
                orderId={previewMemoOrder.id}
                memoCode={previewMemoOrder.memoCode}
                resellerName={previewMemoOrder.resellerName}
                resellerPhone={previewMemoOrder.resellerPhone}
                resellerAddress={previewMemoOrder.resellerAddress}
                customerName={previewMemoOrder.customerName}
                customerPhone={previewMemoOrder.customerPhone}
                customerAddress={previewMemoOrder.customerAddress}
                city={previewMemoOrder.city}
                codAmount={previewMemoOrder.codAmount}
                courierProvider={previewMemoOrder.courier.toUpperCase()}
                consignmentId={`CN-${previewMemoOrder.id.replace(/\D/g, '')}`}
                trackingCode={
                  previewMemoOrder.trackingCode ||
                  `TRK-${previewMemoOrder.courier.slice(0, 3).toUpperCase()}-${previewMemoOrder.id.replace(/\D/g, '')}`
                }
                items={[
                  {
                    sku: previewMemoOrder.sku,
                    title: previewMemoOrder.productTitle,
                    color: previewMemoOrder.color,
                    size: previewMemoOrder.size,
                    qty: previewMemoOrder.qty,
                    price: previewMemoOrder.codAmount,
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* =====================================================================
          MODAL 2: CREATE MANUAL ORDER (05_ORDERS_MODULE.md)
         ===================================================================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Manual Order"
        subtitle="Select product variant (Color/Size/Bin) and Reseller Memo Code. In-stock orders go directly to Pick List."
        size="md"
      >
        <form onSubmit={handleCreateManualOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="e.g. Tanvir Hasan"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="e.g. 01712-889900"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">Delivery Address</label>
              <input
                type="text"
                required
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                placeholder="House, Road, Area"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">City</label>
              <select
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Chattogram">Chattogram</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Khulna">Khulna</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">
                Product Variant (2-Part SKU · Bin · Stock)
              </label>
              <select
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {PRODUCT_CATALOG.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.sku} — {p.title} ({p.color}/{p.size}) · Bin: {p.bin} · Stock: {p.stock}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                max={20}
                value={newQty}
                onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Reseller Memo Code (4x6&quot; Branded Slip)
              </label>
              <select
                value={newMemoCode}
                onChange={(e) => setNewMemoCode(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {RESELLER_MEMOS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.resellerName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1">Courier Partner</label>
              <select
                value={newCourier}
                onChange={(e) => setNewCourier(e.target.value as CourierPartner)}
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Steadfast">Steadfast</option>
                <option value="Pathao">Pathao</option>
                <option value="RedX">RedX</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Create &amp; Send to Pick List
            </button>
          </div>
        </form>
      </Modal>

      {/* =====================================================================
          PORTALED ISOLATED PRINT ENGINE (#fulfillio-print-invoice-root)
          Prints ONLY the 4x6" Invoice(s), Pick Sheet (with Bins), or Manifest!
         ===================================================================== */}
      {printingOrders.length > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <div id="fulfillio-print-invoice-root" className="hidden">
            {printMode === 'MEMOS' &&
              printingOrders.map((ord) => (
                <div key={ord.id} className="fulfillio-thermal-page-break">
                  <UnifiedThermalSticker
                    orderId={ord.id}
                    memoCode={ord.memoCode}
                    resellerName={ord.resellerName}
                    resellerPhone={ord.resellerPhone}
                    resellerAddress={ord.resellerAddress}
                    customerName={ord.customerName}
                    customerPhone={ord.customerPhone}
                    customerAddress={ord.customerAddress}
                    city={ord.city}
                    codAmount={ord.codAmount}
                    courierProvider={ord.courier.toUpperCase()}
                    consignmentId={`CN-${ord.id.replace(/\D/g, '')}`}
                    trackingCode={
                      ord.trackingCode ||
                      `TRK-${ord.courier.slice(0, 3).toUpperCase()}-${ord.id.replace(/\D/g, '')}`
                    }
                    items={[
                      {
                        sku: ord.sku,
                        title: ord.productTitle,
                        color: ord.color,
                        size: ord.size,
                        qty: ord.qty,
                        price: ord.codAmount,
                      },
                    ]}
                  />
                </div>
              ))}

            {printMode === 'PICK_SHEET' && (
              <div className="bg-white text-black p-6 font-sans text-xs max-w-2xl mx-auto">
                <h2 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-3">
                  Fulfillio Warehouse — Bin-Guided Pick List Sheet ({printingOrders.length} Orders)
                </h2>
                <table className="w-full border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-black">
                      <th className="p-2 border-r border-black">Bin Location</th>
                      <th className="p-2 border-r border-black">Order ID</th>
                      <th className="p-2 border-r border-black">2-Part SKU</th>
                      <th className="p-2 border-r border-black">Product &amp; Variant</th>
                      <th className="p-2 text-center">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printingOrders.map((ord) => (
                      <tr key={ord.id} className="border-b border-black">
                        <td className="p-2 border-r border-black font-mono font-black">
                          {ord.bin}
                        </td>
                        <td className="p-2 border-r border-black font-mono font-bold">{ord.id}</td>
                        <td className="p-2 border-r border-black font-mono">{ord.sku}</td>
                        <td className="p-2 border-r border-black">
                          {ord.productTitle} ({ord.color} / {ord.size})
                        </td>
                        <td className="p-2 text-center font-bold">{ord.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {printMode === 'MANIFEST' && (
              <div className="bg-white text-black p-6 font-sans text-xs max-w-2xl mx-auto space-y-4">
                <div className="border-b-2 border-black pb-2 flex justify-between items-end">
                  <div>
                    <h2 className="text-lg font-black uppercase">
                      Courier Handover Manifest Sheet
                    </h2>
                    <p className="text-[11px]">
                      Total Parcels: {printingOrders.length} • Date:{' '}
                      {new Date().toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <span className="font-mono font-bold">FULFILLIO 3PL</span>
                </div>
                <table className="w-full border-collapse border border-black text-left">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-black">
                      <th className="p-2 border-r border-black">Order ID</th>
                      <th className="p-2 border-r border-black">Courier &amp; Tracking</th>
                      <th className="p-2 border-r border-black">Customer</th>
                      <th className="p-2 text-right">COD Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printingOrders.map((ord) => (
                      <tr key={ord.id} className="border-b border-black">
                        <td className="p-2 border-r border-black font-mono font-bold">{ord.id}</td>
                        <td className="p-2 border-r border-black font-mono">
                          {ord.courier} — {ord.trackingCode || 'BOOKED'}
                        </td>
                        <td className="p-2 border-r border-black">
                          {ord.customerName} ({ord.customerPhone})
                        </td>
                        <td className="p-2 text-right font-mono font-bold">
                          ৳ {ord.codAmount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pt-8 flex justify-between text-xs font-bold">
                  <span className="border-t border-black pt-1 px-4">
                    Warehouse Supervisor Signature
                  </span>
                  <span className="border-t border-black pt-1 px-4">
                    Courier Pickup Rider Signature
                  </span>
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
