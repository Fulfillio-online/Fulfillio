'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  MapPin,
  Layers,
  Upload,
  Check,
  AlertTriangle,
  Sparkles,
  Box,
  Tag,
  Building2,
  Clock,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export type WarehouseProductSubTab = 'all' | 'approval' | 'bins';

export interface WarehouseBin {
  code: string;
  description: string;
  zone: string;
  capacityUnits: number;
  createdAt: string;
}

export interface MerchantInfo {
  code: string;
  name: string;
  categoryFocus: string;
}

export interface WarehouseProductItem {
  id: string;
  title: string;
  category: 'Apparel' | 'Footwear' | 'Electronics' | 'Accessories';
  merchantCode: string;
  merchantName: string;
  shortSku: string;
  fullSku: string;
  color: string;
  size: string;
  binCode: string;
  stock: number;
  price: number;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';
  submittedAt: string;
  imageUrl: string;
}

const MERCHANTS: MerchantInfo[] = [
  { code: 'MC-101', name: "Sabbir's Store", categoryFocus: 'Apparel & Bags' },
  { code: 'MC-102', name: 'Urban Threads BD', categoryFocus: 'Streetwear Apparel' },
  { code: 'MC-103', name: 'Apex Footwear Hub', categoryFocus: 'Footwear & Leather' },
  { code: 'MC-104', name: 'Gadget Freak Online', categoryFocus: 'Consumer Electronics' },
];

function createProductSvgDataUri(
  bgStart: string,
  bgEnd: string,
  accent: string,
  label: string,
  iconType:
    | 'hoodie'
    | 'polo'
    | 'jacket'
    | 'bag'
    | 'tee'
    | 'cargo'
    | 'boots'
    | 'sneakers'
    | 'earbuds'
    | 'watch'
): string {
  let glyph = '';
  switch (iconType) {
    case 'hoodie':
      glyph = `<path d="M28 22 L38 18 L42 25 L46 25 L50 18 L60 22 L68 36 L60 42 L56 34 L56 66 L32 66 L32 34 L28 42 L20 36 Z" fill="${accent}" opacity="0.92"/><circle cx="40" cy="28" r="1.8" fill="#0f172a"/><circle cx="48" cy="28" r="1.8" fill="#0f172a"/>`;
      break;
    case 'polo':
      glyph = `<path d="M30 20 L39 18 L44 26 L49 18 L58 20 L66 34 L58 39 L55 32 L55 66 L33 66 L33 32 L30 39 L22 34 Z" fill="${accent}" opacity="0.92"/><rect x="42.5" y="26" width="3" height="11" rx="1.5" fill="#0f172a"/>`;
      break;
    case 'jacket':
      glyph = `<path d="M29 19 L39 17 L44 24 L49 17 L59 19 L66 37 L58 41 L55 32 L55 66 L45 66 L45 27 L43 27 L43 66 L33 66 L33 32 L30 41 L22 37 Z" fill="${accent}" opacity="0.92"/>`;
      break;
    case 'bag':
      glyph = `<rect x="26" y="32" width="36" height="30" rx="6" fill="${accent}" opacity="0.92"/><path d="M35 32 C35 20, 53 20, 53 32" stroke="${accent}" stroke-width="4" fill="none"/><rect x="38" y="43" width="12" height="6" rx="2" fill="#0f172a"/>`;
      break;
    case 'tee':
      glyph = `<path d="M30 21 L38 19 C40 24, 48 24, 50 19 L58 21 L66 33 L58 39 L54 33 L54 65 L34 65 L34 33 L30 39 L22 33 Z" fill="${accent}" opacity="0.92"/><text x="44" y="47" font-family="sans-serif" font-size="9" font-weight="bold" fill="#0f172a" text-anchor="middle">${label}</text>`;
      break;
    case 'cargo':
      glyph = `<path d="M32 20 L56 20 L60 66 L47 66 L44 38 L41 66 L28 66 Z" fill="${accent}" opacity="0.92"/><rect x="29" y="38" width="6" height="10" rx="1.5" fill="#0f172a" opacity="0.45"/><rect x="53" y="38" width="6" height="10" rx="1.5" fill="#0f172a" opacity="0.45"/>`;
      break;
    case 'boots':
      glyph = `<path d="M32 22 L46 22 L48 48 L64 52 C66 53, 67 58, 65 62 L28 62 L28 54 L32 48 Z" fill="${accent}" opacity="0.92"/><rect x="28" y="61" width="38" height="4" rx="2" fill="#0f172a"/>`;
      break;
    case 'sneakers':
      glyph = `<path d="M24 46 L38 32 L46 40 L64 45 C67 46, 68 53, 66 58 L22 58 C21 53, 22 48, 24 46 Z" fill="${accent}" opacity="0.92"/><rect x="21" y="56" width="46" height="5" rx="2.5" fill="#f8fafc"/><path d="M35 45 L49 50" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>`;
      break;
    case 'earbuds':
      glyph = `<rect x="26" y="28" width="36" height="36" rx="10" fill="${accent}" opacity="0.92"/><rect x="26" y="41" width="36" height="2.5" fill="#0f172a"/><circle cx="37" cy="23" r="5" fill="#f8fafc"/><rect x="35" y="26" width="4" height="8" rx="2" fill="#f8fafc"/><circle cx="51" cy="23" r="5" fill="#f8fafc"/><rect x="49" y="26" width="4" height="8" rx="2" fill="#f8fafc"/>`;
      break;
    case 'watch':
      glyph = `<rect x="37" y="16" width="14" height="56" rx="4" fill="#475569"/><rect x="31" y="27" width="26" height="32" rx="7" fill="${accent}"/><rect x="34" y="30" width="20" height="26" rx="5" fill="#0f172a"/><path d="M44 37 L44 43 L49 46" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`;
      break;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="88" height="88">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
    </defs>
    <rect width="88" height="88" rx="20" fill="url(#g)"/>
    <circle cx="44" cy="44" r="32" fill="#ffffff" opacity="0.06"/>
    ${glyph}
    <rect x="14" y="70" width="60" height="12" rx="6" fill="#020617" opacity="0.65"/>
    <text x="44" y="78.5" font-family="sans-serif" font-size="7.5" font-weight="700" fill="#e2e8f0" text-anchor="middle" letter-spacing="0.6">${label}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_THUMBNAILS: { id: string; name: string; category: string; url: string }[] = [
  {
    id: 'hoodie',
    name: 'Heavyweight Hoodie',
    category: 'Apparel',
    url: createProductSvgDataUri('#064e3b', '#0f172a', '#34d399', 'HOODIE', 'hoodie'),
  },
  {
    id: 'polo',
    name: 'Pique Polo Shirt',
    category: 'Apparel',
    url: createProductSvgDataUri('#1e3a8a', '#0f172a', '#60a5fa', 'POLO', 'polo'),
  },
  {
    id: 'jacket',
    name: 'Denim Trucker Jacket',
    category: 'Apparel',
    url: createProductSvgDataUri('#312e81', '#0f172a', '#818cf8', 'JACKET', 'jacket'),
  },
  {
    id: 'bag',
    name: 'Crossbody Sling Bag',
    category: 'Accessories',
    url: createProductSvgDataUri('#78350f', '#0f172a', '#fbbf24', 'BAG', 'bag'),
  },
  {
    id: 'tee',
    name: 'Oversized Graphic Tee',
    category: 'Apparel',
    url: createProductSvgDataUri('#4c1d95', '#0f172a', '#c084fc', 'TEE', 'tee'),
  },
  {
    id: 'cargo',
    name: 'Tactical Cargo Pants',
    category: 'Apparel',
    url: createProductSvgDataUri('#14532d', '#0f172a', '#4ade80', 'CARGO', 'cargo'),
  },
  {
    id: 'boots',
    name: 'Leather Chelsea Boots',
    category: 'Footwear',
    url: createProductSvgDataUri('#7c2d12', '#0f172a', '#fb923c', 'BOOTS', 'boots'),
  },
  {
    id: 'sneakers',
    name: 'Nitro Running Sneakers',
    category: 'Footwear',
    url: createProductSvgDataUri('#0f766e', '#0f172a', '#2dd4bf', 'SNEAKER', 'sneakers'),
  },
  {
    id: 'earbuds',
    name: 'ANC Wireless Earbuds',
    category: 'Electronics',
    url: createProductSvgDataUri('#0369a1', '#0f172a', '#38bdf8', 'ANC PRO', 'earbuds'),
  },
  {
    id: 'watch',
    name: 'AMOLED Smart Watch',
    category: 'Electronics',
    url: createProductSvgDataUri('#831843', '#0f172a', '#f472b6', 'WATCH', 'watch'),
  },
];

const INITIAL_BINS: WarehouseBin[] = [
  {
    code: 'A-01-02',
    description: 'Zone A · Rack 01 · Shelf 02 (Fast-Moving Apparel)',
    zone: 'Zone A',
    capacityUnits: 250,
    createdAt: '2026-09-12',
  },
  {
    code: 'A-01-04',
    description: 'Zone A · Rack 01 · Shelf 04 (Folded Knitwear & Polos)',
    zone: 'Zone A',
    capacityUnits: 250,
    createdAt: '2026-09-12',
  },
  {
    code: 'A-02-01',
    description: 'Zone A · Rack 02 · Shelf 01 (Outerwear & Denim)',
    zone: 'Zone A',
    capacityUnits: 200,
    createdAt: '2026-09-15',
  },
  {
    code: 'B-01-03',
    description: 'Zone B · Rack 01 · Shelf 03 (Streetwear & Graphic Tees)',
    zone: 'Zone B',
    capacityUnits: 300,
    createdAt: '2026-09-18',
  },
  {
    code: 'B-03-01',
    description: 'Zone B · Rack 03 · Shelf 01 (Bottoms & Tactical Cargo)',
    zone: 'Zone B',
    capacityUnits: 220,
    createdAt: '2026-09-20',
  },
  {
    code: 'B-03-04',
    description: 'Zone B · Rack 03 · Shelf 04 (Bags & Everyday Carry)',
    zone: 'Zone B',
    capacityUnits: 180,
    createdAt: '2026-09-22',
  },
  {
    code: 'C-01-01',
    description: 'Zone C · Rack 01 · Shelf 01 (Boxed Leather Boots)',
    zone: 'Zone C',
    capacityUnits: 150,
    createdAt: '2026-10-01',
  },
  {
    code: 'C-01-02',
    description: 'Zone C · Rack 01 · Shelf 02 (Athletic & Running Sneakers)',
    zone: 'Zone C',
    capacityUnits: 180,
    createdAt: '2026-10-03',
  },
  {
    code: 'D-01-01',
    description: 'Zone D · Rack 01 · Shelf 01 (High-Value Electronics Cage)',
    zone: 'Zone D',
    capacityUnits: 400,
    createdAt: '2026-10-10',
  },
];

const INITIAL_PRODUCTS: WarehouseProductItem[] = [
  {
    id: 'PRD-1001',
    title: 'Arctic Fleece Heavyweight Hoodie',
    category: 'Apparel',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    shortSku: 'HOODIE-BLK-XL',
    fullSku: 'MC-101-HOODIE-BLK-XL',
    color: 'Obsidian Black',
    size: 'XL',
    binCode: 'A-01-02',
    stock: 84,
    price: 1850,
    status: 'APPROVED',
    submittedAt: '2 days ago',
    imageUrl: PRESET_THUMBNAILS[0].url,
  },
  {
    id: 'PRD-1002',
    title: 'Royal Pique Classic Polo Shirt',
    category: 'Apparel',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    shortSku: 'POLO-NVY-L',
    fullSku: 'MC-101-POLO-NVY-L',
    color: 'Midnight Navy',
    size: 'L',
    binCode: 'A-01-04',
    stock: 112,
    price: 1290,
    status: 'APPROVED',
    submittedAt: '3 days ago',
    imageUrl: PRESET_THUMBNAILS[1].url,
  },
  {
    id: 'PRD-1003',
    title: 'Cordura Urban Crossbody Sling Bag',
    category: 'Accessories',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    shortSku: 'SLING-TAN-OS',
    fullSku: 'MC-101-SLING-TAN-OS',
    color: 'Coyote Tan',
    size: 'One Size',
    binCode: 'B-03-04',
    stock: 46,
    price: 1450,
    status: 'APPROVED',
    submittedAt: '4 days ago',
    imageUrl: PRESET_THUMBNAILS[3].url,
  },
  {
    id: 'PRD-1004',
    title: 'Tokyo Drift Oversized Drop-Shoulder Tee',
    category: 'Apparel',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    shortSku: 'GTEE-PRP-L',
    fullSku: 'MC-102-GTEE-PRP-L',
    color: 'Cyber Violet',
    size: 'L',
    binCode: 'B-01-03',
    stock: 145,
    price: 980,
    status: 'APPROVED',
    submittedAt: '5 days ago',
    imageUrl: PRESET_THUMBNAILS[4].url,
  },
  {
    id: 'PRD-1005',
    title: 'Ripstop Multi-Pocket Cargo Pants',
    category: 'Apparel',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    shortSku: 'CARGO-OLV-32',
    fullSku: 'MC-102-CARGO-OLV-32',
    color: 'Olive Drab',
    size: '32W',
    binCode: 'B-03-01',
    stock: 68,
    price: 1750,
    status: 'APPROVED',
    submittedAt: '6 days ago',
    imageUrl: PRESET_THUMBNAILS[5].url,
  },
  {
    id: 'PRD-1006',
    title: 'Handcrafted Full-Grain Chelsea Boots',
    category: 'Footwear',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    shortSku: 'CHELSEA-BRN-42',
    fullSku: 'MC-103-CHELSEA-BRN-42',
    color: 'Espresso Brown',
    size: 'EU 42',
    binCode: 'C-01-01',
    stock: 34,
    price: 3850,
    status: 'APPROVED',
    submittedAt: '1 week ago',
    imageUrl: PRESET_THUMBNAILS[6].url,
  },
  {
    id: 'PRD-1007',
    title: 'AeroFoam Nitro Marathon Sneakers',
    category: 'Footwear',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    shortSku: 'RUNNER-TEAL-43',
    fullSku: 'MC-103-RUNNER-TEAL-43',
    color: 'Electric Teal',
    size: 'EU 43',
    binCode: 'C-01-02',
    stock: 52,
    price: 3200,
    status: 'APPROVED',
    submittedAt: '1 week ago',
    imageUrl: PRESET_THUMBNAILS[7].url,
  },
  {
    id: 'PRD-1008',
    title: 'SonicWave Pro Hybrid ANC Earbuds',
    category: 'Electronics',
    merchantCode: 'MC-104',
    merchantName: 'Gadget Freak Online',
    shortSku: 'ANC-BUDS-BLK',
    fullSku: 'MC-104-ANC-BUDS-BLK',
    color: 'Matte Space Gray',
    size: 'Standard',
    binCode: 'D-01-01',
    stock: 95,
    price: 2450,
    status: 'APPROVED',
    submittedAt: '4 days ago',
    imageUrl: PRESET_THUMBNAILS[8].url,
  },
  // Pending approval items (Tab 2)
  {
    id: 'PRD-2001',
    title: 'Selvedge Indigo Denim Trucker Jacket',
    category: 'Apparel',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    shortSku: 'DENIM-JKT-M',
    fullSku: 'MC-101-DENIM-JKT-M',
    color: 'Raw Indigo',
    size: 'M',
    binCode: 'A-02-01',
    stock: 60,
    price: 2650,
    status: 'PENDING_APPROVAL',
    submittedAt: '18 mins ago',
    imageUrl: PRESET_THUMBNAILS[2].url,
  },
  {
    id: 'PRD-2002',
    title: 'Streetwear Acid-Wash Heavy Hoodie',
    category: 'Apparel',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    shortSku: 'ACID-HOOD-L',
    fullSku: 'MC-102-ACID-HOOD-L',
    color: 'Emerald Wash',
    size: 'L',
    binCode: 'B-01-03',
    stock: 90,
    price: 1950,
    status: 'PENDING_APPROVAL',
    submittedAt: '42 mins ago',
    imageUrl: PRESET_THUMBNAILS[0].url,
  },
  {
    id: 'PRD-2003',
    title: 'TrailBlaze Waterproof Trekking Sneakers',
    category: 'Footwear',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    shortSku: 'TRAIL-SNK-41',
    fullSku: 'MC-103-TRAIL-SNK-41',
    color: ' Glacier Teal',
    size: 'EU 41',
    binCode: 'C-01-02',
    stock: 40,
    price: 3490,
    status: 'PENDING_APPROVAL',
    submittedAt: '1 hour ago',
    imageUrl: PRESET_THUMBNAILS[7].url,
  },
  {
    id: 'PRD-2004',
    title: 'PulseFit Titanium AMOLED Smart Watch',
    category: 'Electronics',
    merchantCode: 'MC-104',
    merchantName: 'Gadget Freak Online',
    shortSku: 'PULSE-WATCH-S2',
    fullSku: 'MC-104-PULSE-WATCH-S2',
    color: 'Rose Titanium',
    size: '45mm',
    binCode: 'D-01-01',
    stock: 75,
    price: 3990,
    status: 'PENDING_APPROVAL',
    submittedAt: '2 hours ago',
    imageUrl: PRESET_THUMBNAILS[9].url,
  },
];

export function WarehouseProductsManager({
  activeTab = 'all',
  onTabChange,
}: {
  activeTab?: WarehouseProductSubTab;
  onTabChange?: (tab: WarehouseProductSubTab) => void;
}) {
  const [subTab, setSubTab] = useState<WarehouseProductSubTab>(activeTab);
  const [products, setProducts] = useState<WarehouseProductItem[]>(INITIAL_PRODUCTS);
  const [bins, setBins] = useState<WarehouseBin[]>(INITIAL_BINS);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate & sync with localStorage so Returns & RTO restocking updates live product stock
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const savedProds = localStorage.getItem('fulfillio_warehouse_products_v1');
        if (savedProds) {
          const parsed = JSON.parse(savedProds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
          }
        } else {
          localStorage.setItem('fulfillio_warehouse_products_v1', JSON.stringify(INITIAL_PRODUCTS));
        }

        const savedBins = localStorage.getItem('fulfillio_warehouse_bins_v1');
        if (savedBins) {
          const parsedBins = JSON.parse(savedBins);
          if (Array.isArray(parsedBins) && parsedBins.length > 0) {
            setBins(parsedBins);
          }
        } else {
          localStorage.setItem('fulfillio_warehouse_bins_v1', JSON.stringify(INITIAL_BINS));
        }
      } catch {
        // ignore storage errors
      }
      setHydrated(true);
    };

    loadFromStorage();
    window.addEventListener('fulfillio-warehouse-sync', loadFromStorage);
    return () => window.removeEventListener('fulfillio-warehouse-sync', loadFromStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('fulfillio_warehouse_products_v1', JSON.stringify(products));
    } catch {
      // ignore storage errors
    }
  }, [products, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('fulfillio_warehouse_bins_v1', JSON.stringify(bins));
    } catch {
      // ignore storage errors
    }
  }, [bins, hydrated]);

  // Sync with parent prop if changed
  useEffect(() => {
    setSubTab(activeTab);
  }, [activeTab]);

  const handleSelectTab = (tab: WarehouseProductSubTab) => {
    setSubTab(tab);
    onTabChange?.(tab);
  };

  // Filters for Tab 1 (All Products)
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [binFilter, setBinFilter] = useState<string>('ALL');

  // Toast Banner Feedback
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Pending Approval Bin Selections
  const [pendingBinSelection, setPendingBinSelection] = useState<Record<string, string>>({
    'PRD-2001': 'A-02-01',
    'PRD-2002': 'B-01-03',
    'PRD-2003': 'C-01-02',
    'PRD-2004': 'D-01-01',
  });

  // Approval / Rejection Confirmation Modal
  const [approvalModal, setApprovalModal] = useState<{
    mode: 'APPROVE' | 'REJECT';
    product: WarehouseProductItem;
    selectedBin: string;
  } | null>(null);
  const [approvalQty, setApprovalQty] = useState<number>(50);
  const [approvalSelectedBin, setApprovalSelectedBin] = useState<string>('A-01-02');

  // Create New Bin Modal (exclusively used in Warehouse Bins sub-tab)
  const [newBinModal, setNewBinModal] = useState<{
    open: boolean;
  }>({ open: false });
  const [newBinCode, setNewBinCode] = useState('');
  const [newBinZone, setNewBinZone] = useState('Zone E');
  const [newBinDesc, setNewBinDesc] = useState('');
  const [newBinCapacity, setNewBinCapacity] = useState('250');

  // Add Product (Under Merchant) Modal + Confirmation step
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [confirmAddProductStep, setConfirmAddProductStep] = useState(false);
  const [formMerchantCode, setFormMerchantCode] = useState('MC-101');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Apparel' | 'Footwear' | 'Electronics' | 'Accessories'>('Apparel');
  const [formShortSku, setFormShortSku] = useState('');
  const [formColor, setFormColor] = useState('Black');
  const [formSize, setFormSize] = useState('L');
  const [formPrice, setFormPrice] = useState('1650');
  const [formStock, setFormStock] = useState('50');
  const [formBinCode, setFormBinCode] = useState('A-01-02');
  const [formImageUrl, setFormImageUrl] = useState(PRESET_THUMBNAILS[0].url);

  // Computed lists
  const approvedProducts = useMemo(
    () => products.filter((p) => p.status === 'APPROVED'),
    [products]
  );
  const pendingProducts = useMemo(
    () => products.filter((p) => p.status === 'PENDING_APPROVAL'),
    [products]
  );

  const filteredApprovedProducts = useMemo(() => {
    return approvedProducts.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.fullSku.toLowerCase().includes(q) ||
        item.shortSku.toLowerCase().includes(q) ||
        item.merchantName.toLowerCase().includes(q);
      const matchesMerchant =
        merchantFilter === 'ALL' || item.merchantCode === merchantFilter;
      const matchesCategory =
        categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesBin = binFilter === 'ALL' || item.binCode === binFilter;
      return matchesSearch && matchesMerchant && matchesCategory && matchesBin;
    });
  }, [approvedProducts, searchQuery, merchantFilter, categoryFilter, binFilter]);

  // Adjust stock quantity inline
  const handleAdjustStock = (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p
      )
    );
  };

  // Change Bin inline in All Products table
  const handleChangeProductBin = (productId: string, nextBinCode: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, binCode: nextBinCode } : p))
    );
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      triggerToast(`Updated bin location for ${prod.fullSku} to ${nextBinCode}`);
    }
  };

  // Handle Custom Image Upload via FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generated 2-Part SKU preview
  const sanitizedShortSku = (formShortSku.trim() || 'ITEM-01')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-');
  const generatedFullSku = `${formMerchantCode}-${sanitizedShortSku}`;

  // Create New Bin Handler (exclusively from Warehouse Bins tab)
  const handleCreateNewBinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = newBinCode.trim().toUpperCase();
    if (!formattedCode) return;

    if (!bins.some((b) => b.code === formattedCode)) {
      const created: WarehouseBin = {
        code: formattedCode,
        zone: newBinZone.trim() || `Zone ${formattedCode.charAt(0)}`,
        description:
          newBinDesc.trim() ||
          `${newBinZone.trim() || 'Zone'} · Bin ${formattedCode} (General Storage)`,
        capacityUnits: Math.max(50, parseInt(newBinCapacity, 10) || 250),
        createdAt: 'Just now',
      };
      setBins((prev) => [created, ...prev]);
    }

    triggerToast(`Warehouse Bin ${formattedCode} created in Warehouse Bins.`);
    setNewBinCode('');
    setNewBinDesc('');
    setNewBinModal({ open: false });
  };

  // Confirm Approve or Reject Pending Product (with editable received quantity & bin)
  const handleConfirmApprovalAction = () => {
    if (!approvalModal) return;
    const { mode, product } = approvalModal;

    if (mode === 'APPROVE') {
      const finalApprovedStock = Math.max(1, approvalQty || 1);
      const finalBin = approvalSelectedBin || 'A-01-02';

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                status: 'APPROVED',
                binCode: finalBin,
                stock: finalApprovedStock,
                submittedAt: 'Approved just now',
              }
            : p
        )
      );

      // Trigger warehouse sync for Returns, Cycle count & Merchant tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('fulfillio-warehouse-sync'));
      }

      triggerToast(
        `Approved "${product.title}" (${product.fullSku}) under ${product.merchantCode} with ${finalApprovedStock} units in Bin ${finalBin}.`
      );
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      triggerToast(
        `Rejected product submission "${product.title}" (${product.fullSku}).`
      );
    }

    setApprovalModal(null);
  };

  // Finalize Adding Product Under Merchant
  const handleFinalizeAddProduct = () => {
    const merchantObj =
      MERCHANTS.find((m) => m.code === formMerchantCode) || MERCHANTS[0];

    const finalBin = formBinCode || bins[0]?.code || 'A-01-02';

    const newProd: WarehouseProductItem = {
      id: `PRD-${Math.floor(3000 + Math.random() * 6000)}`,
      title: formTitle.trim() || 'New Merchant Catalog Item',
      category: formCategory,
      merchantCode: merchantObj.code,
      merchantName: merchantObj.name,
      shortSku: sanitizedShortSku,
      fullSku: generatedFullSku,
      color: formColor.trim() || 'Standard',
      size: formSize.trim() || 'OS',
      binCode: finalBin,
      stock: Math.max(0, parseInt(formStock, 10) || 0),
      price: Math.max(0, parseInt(formPrice, 10) || 0),
      status: 'APPROVED',
      submittedAt: 'Added just now',
      imageUrl: formImageUrl,
    };

    setProducts((prev) => [newProd, ...prev]);
    setConfirmAddProductStep(false);
    setAddProductModalOpen(false);
    setFormTitle('');
    setFormShortSku('');
    triggerToast(
      `Added ${newProd.fullSku} under ${merchantObj.code} (${merchantObj.name}) in Bin ${finalBin}.`
    );
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Warehouse Master Product &amp; Bin Registry
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Multi-merchant 2-part SKU catalog, inbound product approvals, and physical bin slotting
              </p>
            </div>
          </div>
        </div>

        {/* 3 Sub-Tabs + Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleSelectTab('all')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                subTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>All Products</span>
              <span className="px-1.5 py-0.5 text-[11px] rounded-md bg-slate-900/70 text-emerald-300 font-mono">
                {approvedProducts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('approval')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                subTab === 'approval'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Pending Approval</span>
              {pendingProducts.length > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                  {pendingProducts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('bins')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                subTab === 'bins'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Warehouse Bins</span>
              <span className="px-1.5 py-0.5 text-[11px] rounded-md bg-slate-900/70 text-slate-300 font-mono">
                {bins.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmAddProductStep(false);
              setAddProductModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product (Under Merchant)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {bannerMessage && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =====================================================================
          TAB 1: ALL PRODUCTS
         ===================================================================== */}
      {subTab === 'all' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product title or 2-Part SKU (e.g. MC-101-HOODIE)..."
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
                <option value="ALL">All Merchants (MC-101 – MC-104)</option>
                {MERCHANTS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.code} — {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by Category"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Apparel">Apparel</option>
                <option value="Footwear">Footwear</option>
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <select
                value={binFilter}
                onChange={(e) => setBinFilter(e.target.value)}
                aria-label="Filter by Bin Location"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Storage Bins ({bins.length})</option>
                {bins.map((b) => (
                  <option key={b.code} value={b.code}>
                    Bin {b.code} ({b.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-950/50">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 font-medium">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span>
                  Showing <strong className="text-white">{filteredApprovedProducts.length}</strong>{' '}
                  approved SKUs across active warehouse bins
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/60">
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Merchant</th>
                    <th className="py-3.5 px-4">2-Part System SKU &amp; Variant</th>
                    <th className="py-3.5 px-4">Bin Location (Interactive)</th>
                    <th className="py-3.5 px-4 text-right">Stock Qty &amp; Unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {filteredApprovedProducts.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* 1. Product (48x48 rounded-xl Image Thumbnail + Title + Category) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700/80 bg-slate-950 shrink-0 shadow-md"
                          />
                          <div>
                            <div className="font-semibold text-white leading-snug">
                              {item.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {item.category}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                ID: {item.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Merchant */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-200">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-mono font-bold text-emerald-400">
                            {item.merchantCode}
                          </span>
                          <span className="text-slate-500">·</span>
                          <span>{item.merchantName}</span>
                        </div>
                      </td>

                      {/* 3. 2-Part System SKU & Variant */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg inline-block">
                          {item.fullSku}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Variant:{' '}
                          <span className="text-slate-200 font-medium">
                            {item.color} / {item.size}
                          </span>
                        </div>
                      </td>

                      {/* 4. Bin Location (Interactive dropdown) */}
                      <td className="py-3.5 px-4">
                        <div className="relative">
                          <select
                            value={item.binCode}
                            onChange={(e) =>
                              handleChangeProductBin(item.id, e.target.value)
                            }
                            aria-label={`Assign Bin for ${item.title}`}
                            className="bg-slate-950 border border-slate-700 hover:border-emerald-500/60 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            {bins.map((b) => (
                              <option key={b.code} value={b.code}>
                                📍 {b.code} ({b.zone})
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* 5. Stock Qty (- / + buttons) & Unit Price (৳) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="inline-flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item.id, -1)}
                              className="w-7 h-7 rounded-md hover:bg-slate-800 text-slate-300 font-bold text-sm flex items-center justify-center cursor-pointer"
                              title="Decrease stock"
                            >
                              -
                            </button>
                            <span
                              className={`px-2.5 font-mono text-xs font-bold ${
                                item.stock < 20
                                  ? 'text-amber-400'
                                  : 'text-white'
                              }`}
                            >
                              {item.stock} pcs
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustStock(item.id, 1)}
                              className="w-7 h-7 rounded-md hover:bg-slate-800 text-emerald-400 font-bold text-sm flex items-center justify-center cursor-pointer"
                              title="Increase stock"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right min-w-[78px]">
                            <div className="font-mono font-bold text-white text-sm">
                              ৳{item.price.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Unit Price
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredApprovedProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No approved products match your current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: PENDING APPROVAL
         ===================================================================== */}
      {subTab === 'approval' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Inbound Merchant Product Submissions Awaiting Bin Assignment</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Verify merchant 2-part SKU details, inspect received stock quantity, assign a physical warehouse bin, and approve.
              </p>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bins can be configured from <strong>Warehouse Bins</strong> tab</span>
            </div>
          </div>

          {pendingProducts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">
                All Merchant Product Submissions Approved!
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Every pending product has been assigned a warehouse storage bin and moved into the active catalog.
              </p>
              <button
                type="button"
                onClick={() => handleSelectTab('all')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                View All Approved Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingProducts.map((item) => {
                const chosenBin = pendingBinSelection[item.id] || item.binCode || bins[0]?.code || 'A-01-02';
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all shadow-lg flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
                  >
                    {/* Left: Thumbnail + Product + Merchant + 2-Part SKU */}
                    <div className="flex items-start sm:items-center gap-4">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-700 bg-slate-950 shrink-0 shadow-md"
                      />
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            PENDING_APPROVAL
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            Submitted {item.submittedAt}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white">
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-medium">
                            Merchant:{' '}
                            <strong className="text-emerald-400 font-mono">
                              {item.merchantCode}
                            </strong>{' '}
                            · {item.merchantName}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 font-mono font-bold text-emerald-300">
                            SKU: {item.fullSku}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                            Variant: {item.color} / {item.size}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono">
                            Initial Qty: <strong>{item.stock} pcs</strong>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300 font-mono font-bold">
                            ৳{item.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Select Bin to Store + Approve & Assign Bin + Reject */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      <div className="flex items-center gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                            Assign Target Bin
                          </label>
                          <select
                            value={chosenBin}
                            onChange={(e) =>
                              setPendingBinSelection((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            aria-label={`Select Bin to Store ${item.title}`}
                            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                          >
                            {bins.map((b) => (
                              <option key={b.code} value={b.code}>
                                {b.code} — {b.zone}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-end">
                        <button
                          type="button"
                          onClick={() => {
                            setApprovalQty(item.stock);
                            setApprovalSelectedBin(chosenBin);
                            setApprovalModal({
                              mode: 'APPROVE',
                              product: item,
                              selectedBin: chosenBin,
                            });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve &amp; Assign Bin</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setApprovalModal({
                              mode: 'REJECT',
                              product: item,
                              selectedBin: chosenBin,
                            })
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: WAREHOUSE BINS
         ===================================================================== */}
      {subTab === 'bins' && (
        <div className="space-y-5">
          {/* Header + Create Bin Trigger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Physical Warehouse Storage Bins &amp; Active Slotting</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Inspect every rack &amp; shelf location, total stored units, and assigned merchant SKUs. New bins immediately sync across all dropdowns.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setNewBinModal({ open: true })}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Bin</span>
            </button>
          </div>

          {/* Bins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {bins.map((bin) => {
              const storedProducts = approvedProducts.filter(
                (p) => p.binCode === bin.code
              );
              const totalUnits = storedProducts.reduce(
                (sum, p) => sum + p.stock,
                0
              );
              const utilizationPct = Math.min(
                100,
                Math.round((totalUnits / (bin.capacityUnits || 250)) * 100)
              );

              return (
                <div
                  key={bin.code}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="inline-flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-mono text-sm font-bold text-emerald-300">
                            📍 {bin.code}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {bin.zone}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-2">
                          {bin.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-white">
                          {totalUnits} <span className="text-xs text-slate-400">units</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {storedProducts.length} SKU{storedProducts.length === 1 ? '' : 's'} stored
                        </div>
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Bin Utilization</span>
                        <span className="font-mono">
                          {totalUnits} / {bin.capacityUnits} pcs ({utilizationPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            utilizationPct > 85
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${utilizationPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Stored Products Inside Bin */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Products Inside Bin ({storedProducts.length})
                      </div>
                      {storedProducts.length === 0 ? (
                        <div className="text-xs text-slate-500 italic py-2">
                          Empty bin — ready for product assignment
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {storedProducts.map((prod) => (
                            <div
                              key={prod.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/90"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.title}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-800 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-white truncate">
                                    {prod.title}
                                  </div>
                                  <div className="text-[11px] font-mono text-emerald-400 truncate">
                                    {prod.fullSku}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 font-mono text-xs font-semibold text-slate-200 shrink-0">
                                {prod.stock} pcs
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Created: {bin.createdAt}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBinFilter(bin.code);
                        handleSelectTab('all');
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      Filter in Catalog →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: CREATE NEW WAREHOUSE BIN
         ===================================================================== */}
      {newBinModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Create New Warehouse Bin
                  </h3>
                  <p className="text-xs text-slate-400">
                    Immediately available across all product &amp; approval dropdowns
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewBinModal({ open: false })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Bin Code *
                </label>
                <input
                  type="text"
                  required
                  value={newBinCode}
                  onChange={(e) => setNewBinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. E-01-01 or A-03-02"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Warehouse Zone
                  </label>
                  <input
                    type="text"
                    value={newBinZone}
                    onChange={(e) => setNewBinZone(e.target.value)}
                    placeholder="Zone E"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Unit Capacity
                  </label>
                  <input
                    type="number"
                    value={newBinCapacity}
                    onChange={(e) => setNewBinCapacity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Zone / Shelf Description
                </label>
                <input
                  type="text"
                  value={newBinDesc}
                  onChange={(e) => setNewBinDesc(e.target.value)}
                  placeholder="Zone E · Rack 01 · Shelf 01 (Seasonal Fast-Movers)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBinModal({ open: false })}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
                >
                  Create &amp; Save Bin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: APPROVE / REJECT CONFIRMATION MODAL
         ===================================================================== */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  approvalModal.mode === 'APPROVE'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}
              >
                {approvalModal.mode === 'APPROVE' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {approvalModal.mode === 'APPROVE'
                    ? 'Confirm Product Approval & Bin Assignment'
                    : 'Confirm Rejecting Product Submission'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {approvalModal.mode === 'APPROVE'
                    ? `Confirm approving "${approvalModal.product.title}" under ${approvalModal.product.merchantCode} (${approvalModal.product.merchantName}) and storing in Bin ${approvalModal.selectedBin}?`
                    : `Are you sure you want to reject "${approvalModal.product.title}" (${approvalModal.product.fullSku}) submitted by ${approvalModal.product.merchantName}?`}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <img
                src={approvalModal.product.imageUrl}
                alt={approvalModal.product.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
              />
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-white">
                  {approvalModal.product.title}
                </div>
                <div className="font-mono text-emerald-400">
                  {approvalModal.product.fullSku}
                </div>
                <div className="text-slate-400">
                  Merchant Declared Stock: {approvalModal.product.stock} pcs · Target Bin:{' '}
                  <strong className="text-emerald-300 font-mono">
                    {approvalSelectedBin}
                  </strong>
                </div>
              </div>
            </div>

            {approvalModal.mode === 'APPROVE' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Received &amp; Approved Quantity (Units) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={approvalQty}
                      onChange={(e) =>
                        setApprovalQty(
                          Math.max(1, parseInt(e.target.value, 10) || 1)
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-semibold">
                      pcs
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Merchant submitted: <strong>{approvalModal.product.stock} pcs</strong>. You can edit/verify the actual physical received count.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Assign Storage Bin *
                  </label>
                  <select
                    value={approvalSelectedBin}
                    onChange={(e) => setApprovalSelectedBin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                  >
                    {bins.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.code} — {b.zone} ({b.description})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setApprovalModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprovalAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer ${
                  approvalModal.mode === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                }`}
              >
                {approvalModal.mode === 'APPROVE'
                  ? `Confirm & Store ${approvalQty} pcs in ${approvalSelectedBin}`
                  : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: + ADD PRODUCT (UNDER MERCHANT) WITH PHOTO UPLOAD & BIN ASSIGNMENT
         ===================================================================== */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Add Product Under Merchant Account
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generates a 2-Part System SKU and assigns a physical warehouse bin immediately
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!confirmAddProductStep ? (
              <div className="space-y-4">
                {/* Merchant + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Select Merchant *
                    </label>
                    <select
                      value={formMerchantCode}
                      onChange={(e) => setFormMerchantCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      {MERCHANTS.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.code} — {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) =>
                        setFormCategory(
                          e.target.value as
                            | 'Apparel'
                            | 'Footwear'
                            | 'Electronics'
                            | 'Accessories'
                        )
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Apparel">Apparel</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                </div>

                {/* Product Photo Upload + Preset Illustrations */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={formImageUrl}
                        alt="Product preview"
                        className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/40 shadow-md shrink-0"
                      />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Product Thumbnail Photo
                        </div>
                        <p className="text-xs text-slate-400">
                          Upload custom image or pick a preset offline SVG illustration below
                        </p>
                      </div>
                    </div>

                    <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {PRESET_THUMBNAILS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`p-1 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 pr-2.5 ${
                          formImageUrl === preset.url
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <span className="text-[11px] text-slate-300 font-medium">
                          {preset.name.split(' ')[1] || preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Short SKU + Live 2-Part SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Heavyweight Zip Hoodie"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Merchant Short SKU *
                    </label>
                    <input
                      type="text"
                      value={formShortSku}
                      onChange={(e) => setFormShortSku(e.target.value)}
                      placeholder="e.g. ZIPHOOD-BLK-XL"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Live Generated 2-Part System SKU Banner */}
                <div className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-xs text-emerald-200 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live Generated 2-Part System SKU:</span>
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-300">
                    {generatedFullSku}
                  </span>
                </div>

                {/* Variant & Pricing & Stock */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Size
                    </label>
                    <input
                      type="text"
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Unit Price (৳)
                    </label>
                    <input
                      type="number"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Initial Stock
                    </label>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-white"
                    />
                  </div>
                </div>

                {/* Warehouse Bin Assignment */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Assign Warehouse Bin *
                  </label>
                  <select
                    value={formBinCode}
                    onChange={(e) => setFormBinCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  >
                    {bins.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.code} — {b.zone} ({b.description})
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Bins can be created and managed in the <strong>Warehouse Bins</strong> tab.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAddProductModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmAddProductStep(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
                  >
                    Review &amp; Confirm SKU →
                  </button>
                </div>
              </div>
            ) : (
              /* Confirmation Step before saving */
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center gap-4">
                  <img
                    src={formImageUrl}
                    alt="Confirm Preview"
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shrink-0"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="text-emerald-400 font-bold uppercase tracking-wider">
                      Confirm New Warehouse Product Registration
                    </div>
                    <div className="text-base font-bold text-white">
                      {formTitle.trim() || 'New Merchant Catalog Item'}
                    </div>
                    <div className="font-mono text-emerald-300 font-bold">
                      2-Part SKU: {generatedFullSku}
                    </div>
                    <div className="text-slate-400">
                      Merchant: {formMerchantCode} · Assigned Bin:{' '}
                      <strong className="text-white font-mono">
                        {formBinCode}
                      </strong>{' '}
                      · Initial Stock: <strong>{formStock} pcs</strong> · Price: ৳
                      {formPrice}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmAddProductStep(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    ← Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizeAddProduct}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 cursor-pointer"
                  >
                    Confirm &amp; Save to Warehouse Catalog
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default WarehouseProductsManager;
