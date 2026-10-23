'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Layers,
  Truck,
  CreditCard,
  Key,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  Copy,
  Printer,
  Sparkles,
  ArrowUpRight,
  FileText,
  BadgePercent,
  Sliders,
  AlertCircle,
  User,
  ShieldCheck,
  Building2,
  MapPin,
  Mail,
  Phone,
  Pencil,
  Trash2,
  ChevronDown,
  Bell,
  Upload,
  X,
  Check,
  Lock,
  Globe,
  Share2,
  Image as ImageIcon,
  Barcode,
  Tag,
  Minus,
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';

type MerchantTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'memo-designer'
  | 'tracking'
  | 'billing'
  | 'api-keys'
  | 'profile';

export default function MerchantPortalPage() {
  const [activeTab, setActiveTab] = useState<MerchantTab>('profile');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Merchant Profile State (Module 02)
  const [profile, setProfile] = useState({
    merchantCode: 'MC-101',
    ownerName: 'Sabbir Ahmed',
    storeName: "Sabbir's Store",
    email: 'sabbir@example.com',
    phone: '01712 345678',
    location: 'Dhaka, Bangladesh',
    status: 'Active',
    verified: true,
    payoutMethod: 'Bank Transfer',
    payoutSchedule: 'Weekly (Every Friday)',
    payoutAccount: {
      provider: 'BRAC Bank PLC',
      accountHolder: 'Sabbir Ahmed',
      accountNumber: '1501204892019001',
      branchName: 'Banani Branch',
      routingNumber: '060271829',
      frequency: 'Weekly',
      status: 'VERIFIED', // 'VERIFIED' | 'PENDING_REVIEW'
      chequeLeafUrl: '/images/cheque_sample.png',
    },
    socialChannels: [
      { id: '1', platform: 'Facebook', url: 'https://facebook.com/sabbirstore' },
      { id: '2', platform: 'Instagram', url: 'https://instagram.com/sabbirstore' },
      { id: '3', platform: 'TikTok', url: 'https://tiktok.com/@sabbirstore' },
    ],
  });

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isManagePayoutOpen, setIsManagePayoutOpen] = useState(false);
  const [isViewChequeOpen, setIsViewChequeOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);

  // Form states
  const [editForm, setEditForm] = useState({
    ownerName: profile.ownerName,
    storeName: profile.storeName,
    phone: profile.phone,
    location: profile.location,
  });

  const [payoutForm, setPayoutForm] = useState({
    provider: profile.payoutAccount.provider,
    accountHolder: profile.payoutAccount.accountHolder,
    accountNumber: profile.payoutAccount.accountNumber,
    branchName: profile.payoutAccount.branchName,
    routingNumber: profile.payoutAccount.routingNumber,
    frequency: profile.payoutAccount.frequency,
    chequeFileName: 'cheque_leaf_verified_2026.png',
  });

  const [socialForm, setSocialForm] = useState({
    platform: 'Facebook',
    url: '',
  });

  const [profileNotification, setProfileNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setProfileNotification(msg);
    setTimeout(() => setProfileNotification(null), 4000);
  };

  // Custom Memo Designer State (Module 04 - Reseller Memo Engine)
  interface ResellerMemo {
    id: string;
    code: string;
    name: string;
    resellerName: string;
    phone: string;
    address: string;
    note: string;
    accentColor: string;
    paperSize: string;
    isDefault: boolean;
    created: string;
  }

  const [memoList, setMemoList] = useState<ResellerMemo[]>([
    {
      id: 'memo-1',
      code: 'MEMO-FESTIVE-01',
      name: 'Festive Season Branded Slip',
      resellerName: 'Urban Threads Official',
      phone: '+880 1711-234567',
      address: 'House 42, Road 11, Banani, Dhaka',
      note: 'Thank you for shopping! Return within 7 days with invoice.',
      accentColor: '#4f46e5',
      paperSize: 'THERMAL_4X6',
      isDefault: true,
      created: '2026-10-15',
    },
    {
      id: 'memo-2',
      code: 'MEMO-DARAZ-RES',
      name: 'Daraz Express Partner Slip',
      resellerName: 'Daraz Express BD Store',
      phone: '+880 1822-998877',
      address: 'Fulfilled via Daraz Partner Hub, Tejgaon',
      note: 'Daraz verified reseller dispatch. Fragile items handled.',
      accentColor: '#ea580c',
      paperSize: 'THERMAL_4X6',
      isDefault: false,
      created: '2026-10-18',
    },
    {
      id: 'memo-3',
      code: 'MEMO-DEFAULT',
      name: 'Standard Clean Invoice (4x6)',
      resellerName: "Sabbir's Store",
      phone: '+880 1712-345678',
      address: 'Central Warehouse Dispatch, Dhaka',
      note: 'Official warranty valid with this slip.',
      accentColor: '#059669',
      paperSize: 'THERMAL_4X6',
      isDefault: false,
      created: '2026-10-01',
    },
  ]);

  // Designer Form State
  const [designerCode, setDesignerCode] = useState('MEMO-VIP-SPECIAL');
  const [designerName, setDesignerName] = useState('VIP Black Card Reseller');
  const [resellerStoreName, setResellerStoreName] = useState('VIP Trends BD');
  const [resellerPhone, setResellerPhone] = useState('+880 1812-990011');
  const [resellerAddress, setResellerAddress] = useState('Dhanmondi 27, Dhaka');
  const [resellerNote, setResellerNote] = useState('Exclusive VIP packing. Please preserve tags.');
  const [resellerColor, setResellerColor] = useState('#4f46e5');
  const [paperSize, setPaperSize] = useState('THERMAL_4X6');
  const [memoSavedAlert, setMemoSavedAlert] = useState(false);

  // Orders State (Module 05 - Manual Order Creation with Stock Reservation)
  interface OrderItem {
    id: string;
    date: string;
    customer: string;
    phone: string;
    address: string;
    productId: string;
    items: string;
    qty: number;
    amount: number;
    memoCode: string;
    status: 'PENDING' | 'ALLOCATED' | 'PICKED' | 'PACKED' | 'DISPATCHED' | 'CANCELLED';
    courier: string;
  }

  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: 'ORD-9824',
      date: '2026-10-22',
      customer: 'Tariqul Islam',
      phone: '01812345678',
      address: 'House 12, Road 4, Dhanmondi, Dhaka',
      productId: 'p-1',
      items: 'Premium Heavyweight Hoodie (Black / XL)',
      qty: 1,
      amount: 3450,
      memoCode: 'MEMO-FESTIVE-01',
      status: 'PACKED',
      courier: 'Steadfast',
    },
    {
      id: 'ORD-9825',
      date: '2026-10-22',
      customer: 'Nabila Hasan',
      phone: '01798765432',
      address: 'Flat 4B, Sector 7, Uttara, Dhaka',
      productId: 'p-2',
      items: 'Embroidered Baseball Cap (Navy Blue / OS)',
      qty: 1,
      amount: 1200,
      memoCode: 'MEMO-DEFAULT',
      status: 'ALLOCATED',
      courier: 'Pathao',
    },
    {
      id: 'ORD-9826',
      date: '2026-10-21',
      customer: 'Sabbir Ahmed',
      phone: '01911223344',
      address: 'Plot 18, Block-D, Banani, Dhaka',
      productId: 'p-3',
      items: 'Raw Selvedge Denim Jacket (Raw Indigo / L)',
      qty: 1,
      amount: 4100,
      memoCode: 'MEMO-DARAZ-RES',
      status: 'DISPATCHED',
      courier: 'Steadfast',
    },
  ]);

  // Create Manual Order Modal State
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [orderCustomer, setOrderCustomer] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderAddress, setOrderAddress] = useState('');
  const [orderSelectedProductId, setOrderSelectedProductId] = useState('p-1');
  const [orderQty, setOrderQty] = useState(1);
  const [orderMemoCode, setOrderMemoCode] = useState('MEMO-FESTIVE-01');
  const [orderCourier, setOrderCourier] = useState('Steadfast');

  interface ProductItem {
    id: string;
    title: string;
    variantLabel: string;
    sku: string;
    barcode: string;
    stock: number;
    reserved: number;
    price: number;
    bin: string;
  }

  // Products State (Module 03 - 2-Part SKU System)
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: 'p-1',
      title: 'Premium Heavyweight Hoodie',
      variantLabel: 'Black / XL',
      sku: 'MC-101-HOODIE-BLK-XL',
      barcode: '8901010010015',
      stock: 45,
      reserved: 3,
      price: 3450,
      bin: 'A-01-02-03',
    },
    {
      id: 'p-2',
      title: 'Embroidered Baseball Cap',
      variantLabel: 'Navy Blue / OS',
      sku: 'MC-101-CAP-NVY-OS',
      barcode: '8901010020022',
      stock: 120,
      reserved: 2,
      price: 1200,
      bin: 'B-04-01-01',
    },
    {
      id: 'p-3',
      title: 'Raw Selvedge Denim Jacket',
      variantLabel: 'Raw Indigo / L',
      sku: 'MC-101-JKT-RAW-L',
      barcode: '8901010030039',
      stock: 18,
      reserved: 1,
      price: 4100,
      bin: 'A-02-01-04',
    },
  ]);

  const [productSearch, setProductSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK'>('ALL');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<ProductItem | null>(null);
  const [barcodeCopies, setBarcodeCopies] = useState(10);

  // Add Product Form State
  const [prodTitle, setProdTitle] = useState('');
  const [prodBaseSku, setProdBaseSku] = useState('');
  const [hasVariants, setHasVariants] = useState(true);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [colors, setColors] = useState(['Black', 'White']);
  const [sizes, setSizes] = useState(['M', 'L', 'XL']);
  const [singlePrice, setSinglePrice] = useState('950');
  const [singleStock, setSingleStock] = useState('25');
  const [binLocation, setBinLocation] = useState('A-01-02-05');

  const getColorCode = (name: string) => {
    const clean = name.trim().toUpperCase();
    if (clean === 'BLACK') return 'BLK';
    if (clean === 'WHITE') return 'WHT';
    if (clean === 'NAVY' || clean === 'NAVY BLUE') return 'NVY';
    if (clean === 'RED') return 'RED';
    if (clean === 'BLUE') return 'BLU';
    if (clean === 'GREEN') return 'GRN';
    return clean.substring(0, 3);
  };

  const getSizeCode = (name: string) => {
    return name.trim().toUpperCase();
  };

  const handleAddColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      setColors([...colors, colorInput.trim()]);
      setColorInput('');
    }
  };

  const handleAddSize = () => {
    if (sizeInput.trim() && !sizes.includes(sizeInput.trim().toUpperCase())) {
      setSizes([...sizes, sizeInput.trim().toUpperCase()]);
      setSizeInput('');
    }
  };

  const handleAdjustStock = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p))
    );
    showNotification(`Stock count adjusted.`);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showNotification('Product removed from warehouse catalog.');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodBaseSku) return;

    const baseClean = prodBaseSku.trim().toUpperCase().replace(/\s+/g, '-');
    const newItems: ProductItem[] = [];

    if (hasVariants && colors.length > 0 && sizes.length > 0) {
      colors.forEach((col) => {
        sizes.forEach((sz) => {
          const colCode = getColorCode(col);
          const szCode = getSizeCode(sz);
          const fullSku = `${profile.merchantCode}-${baseClean}-${colCode}-${szCode}`;
          const autoBarcode = `89010100${Math.floor(10000 + Math.random() * 90000)}`;
          newItems.push({
            id: `p-${Date.now()}-${colCode}-${szCode}`,
            title: prodTitle,
            variantLabel: `${col} / ${sz}`,
            sku: fullSku,
            barcode: autoBarcode,
            stock: Number(singleStock) || 20,
            reserved: 0,
            price: Number(singlePrice) || 950,
            bin: binLocation || 'A-01-02-05',
          });
        });
      });
    } else {
      const fullSku = `${profile.merchantCode}-${baseClean}`;
      const autoBarcode = `89010100${Math.floor(10000 + Math.random() * 90000)}`;
      newItems.push({
        id: `p-${Date.now()}`,
        title: prodTitle,
        variantLabel: 'Standard',
        sku: fullSku,
        barcode: autoBarcode,
        stock: Number(singleStock) || 20,
        reserved: 0,
        price: Number(singlePrice) || 950,
        bin: binLocation || 'A-01-02-05',
      });
    }

    setProducts([...newItems, ...products]);
    setIsAddProductOpen(false);
    setProdTitle('');
    setProdBaseSku('');
    showNotification(`Generated ${newItems.length} product SKU(s) with barcodes successfully!`);
  };

  const handleSaveMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designerCode) return;
    const newMemo: ResellerMemo = {
      id: `memo-${Date.now()}`,
      code: designerCode.toUpperCase(),
      name: designerName,
      resellerName: resellerStoreName,
      phone: resellerPhone,
      address: resellerAddress,
      note: resellerNote,
      accentColor: resellerColor,
      paperSize,
      isDefault: false,
      created: 'Just now',
    };
    setMemoList([newMemo, ...memoList]);
    setMemoSavedAlert(true);
    setTimeout(() => setMemoSavedAlert(false), 4000);
    showNotification(`Reseller Memo ${designerCode.toUpperCase()} created & compiled for 4x6 thermal printers!`);
  };

  const handleSetDefaultMemo = (id: string) => {
    setMemoList((prev) =>
      prev.map((m) => ({
        ...m,
        isDefault: m.id === id,
      }))
    );
    showNotification('Default Reseller Memo updated!');
  };

  const handleDeleteMemo = (id: string) => {
    setMemoList((prev) => prev.filter((m) => m.id !== id));
    showNotification('Reseller Memo removed.');
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.id === orderSelectedProductId);
    if (!product) {
      showNotification('Please select a valid product.');
      return;
    }

    if (product.stock < orderQty) {
      showNotification(`Insufficient stock! Available: ${product.stock}`);
      return;
    }

    // Atomically adjust stock & reservation
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              stock: p.stock - orderQty,
              reserved: p.reserved + orderQty,
            }
          : p
      )
    );

    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: OrderItem = {
      id: newOrderId,
      date: 'Today, Just now',
      customer: orderCustomer,
      phone: orderPhone,
      address: orderAddress,
      productId: product.id,
      items: `${product.title} (${product.variantLabel}) x ${orderQty}`,
      qty: orderQty,
      amount: product.price * orderQty,
      memoCode: orderMemoCode,
      status: 'PENDING',
      courier: orderCourier,
    };

    setOrders([newOrder, ...orders]);
    setIsCreateOrderOpen(false);
    setOrderCustomer('');
    setOrderPhone('');
    setOrderAddress('');
    setOrderQty(1);
    showNotification(`Manual order ${newOrderId} created with ${orderMemoCode}! Stock reserved.`);
  };

  const handleCancelOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.status === 'PENDING' || order.status === 'ALLOCATED') {
      // Return reserved stock
      setProducts((prev) =>
        prev.map((p) =>
          p.id === order.productId
            ? {
                ...p,
                stock: p.stock + order.qty,
                reserved: Math.max(0, p.reserved - order.qty),
              }
            : p
        )
      );
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'CANCELLED' } : o))
    );
    showNotification(`Order ${orderId} cancelled. Stock restored to warehouse inventory.`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      ownerName: editForm.ownerName,
      storeName: editForm.storeName,
      phone: editForm.phone,
      location: editForm.location,
    });
    setIsEditProfileOpen(false);
    showNotification('Profile details updated successfully!');
  };

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      payoutAccount: {
        provider: payoutForm.provider,
        accountHolder: payoutForm.accountHolder,
        accountNumber: payoutForm.accountNumber,
        branchName: payoutForm.branchName,
        routingNumber: payoutForm.routingNumber,
        frequency: payoutForm.frequency,
        status: 'PENDING_REVIEW', // Admin must review
        chequeLeafUrl: '/images/cheque_sample.png',
      },
    });
    setIsManagePayoutOpen(false);
    showNotification('Payout account update submitted for Admin verification!');
  };

  const handleSaveSocial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialForm.url) return;

    if (editingSocialId) {
      setProfile({
        ...profile,
        socialChannels: profile.socialChannels.map((c) =>
          c.id === editingSocialId ? { ...c, platform: socialForm.platform, url: socialForm.url } : c
        ),
      });
      showNotification('Social media link updated!');
    } else {
      const newChannel = {
        id: Date.now().toString(),
        platform: socialForm.platform,
        url: socialForm.url,
      };
      setProfile({
        ...profile,
        socialChannels: [...profile.socialChannels, newChannel],
      });
      showNotification('New social channel connected!');
    }

    setSocialForm({ platform: 'Facebook', url: '' });
    setEditingSocialId(null);
    setIsSocialModalOpen(false);
  };

  const handleDeleteSocial = (id: string) => {
    setProfile({
      ...profile,
      socialChannels: profile.socialChannels.filter((c) => c.id !== id),
    });
    showNotification('Social channel removed.');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3 py-4 mb-4 border-b border-slate-800">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-lg">
              F
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block">Fulfillio</span>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Merchant Portal
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Merchant Profile</span>
              <span className="ml-auto text-[10px] font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 border border-slate-700">
                {profile.merchantCode}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Package className="h-4 w-4" />
              Products & Stock
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              Orders & Sync
            </button>

            {/* Core Feature Tab */}
            <button
              onClick={() => setActiveTab('memo-designer')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'memo-designer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 border border-indigo-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4" />
                <span>Memo Code Designer</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                Unique
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'tracking'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Truck className="h-4 w-4" />
              Courier Tracking
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'billing'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Payout & Billing
            </button>

            <button
              onClick={() => setActiveTab('api-keys')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'api-keys'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Key className="h-4 w-4" />
              API Keys & Webhooks
            </button>
          </nav>
        </div>

        {/* Store & Nav Footer */}
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="px-2">
            <span className="text-xs font-semibold text-slate-200 block">{profile.storeName}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">Store Verified ({profile.merchantCode})</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 px-2">
            <Link href="/admin" className="hover:text-emerald-400 transition-colors">
              Admin Portal
            </Link>
            <Link href="/" className="hover:text-slate-200 transition-colors">
              Home
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 px-8 flex items-center justify-between bg-slate-900/40 sticky top-0 z-20 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">Merchant Portal</span>
            <ChevronRight className="h-4 w-4 text-slate-600" />
            <span className="font-bold text-sm uppercase tracking-wide text-slate-200">
              {activeTab === 'profile' ? 'Profile' : activeTab.replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/wms/packing"
              target="_blank"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <span>Packing Station</span>
              <ExternalLink className="h-3 w-3" />
            </Link>

            <button
              onClick={() => setActiveTab('memo-designer')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Memo</span>
            </button>

            {/* Notification Bell */}
            <button className="h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
            </button>

            {/* User Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors text-left"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  SA
                </div>
                <div className="hidden sm:block">
                  <span className="text-xs font-bold text-slate-200 block leading-tight">
                    {profile.ownerName}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 block leading-none">
                    {profile.merchantCode}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
              </button>

              {/* Dropdown Panel */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-30 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-200 block">{profile.storeName}</span>
                    <span className="text-[11px] text-slate-400 block truncate">{profile.email}</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                        Merchant ID: {profile.merchantCode}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-emerald-400" />
                    <span>My Profile & Identity</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setIsUserMenuOpen(false);
                      setIsManagePayoutOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Payout & Settlement Setup</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('api-keys');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <Key className="h-3.5 w-3.5 text-amber-400" />
                    <span>API Keys & Webhooks</span>
                  </button>

                  <div className="pt-1 border-t border-slate-800">
                    <Link
                      href="/"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Log Out Session</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Notification Toast */}
        {profileNotification && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-in slide-in-from-bottom duration-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>{profileNotification}</span>
          </div>
        )}

        {/* Dynamic Section Contents */}
        <div className="p-8 space-y-6">
          {/* ================= 0. MERCHANT PROFILE (MODULE 02 - REFERENCE UI MATCH) ================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-6xl">
              {/* Header Title & Action */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <User className="h-6 w-6 text-emerald-400" />
                    <span>Profile</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Manage your seller identity, payout info, and social channels.
                  </p>
                </div>

                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-400" />
                  <span>Edit profile</span>
                </button>
              </div>

              {/* Top Seller Identity Banner Card */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-5">
                  {/* Avatar with Status indicator */}
                  <div className="relative">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                      SA
                    </div>
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white font-bold" />
                    </span>
                  </div>

                  {/* Merchant Info */}
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-white tracking-tight">{profile.ownerName}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        VERIFIED MERCHANT
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-300 mt-1">{profile.storeName}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span>{profile.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        <span>{profile.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <span>Merchant ID: {profile.merchantCode}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Central Warehouse Delivery Tag */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Fulfillio Central Hub Intake</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Stock physically stored in Dhaka Warehouse. Couriers dispatch directly from central racks.
                  </p>
                </div>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: 60% (col-span-7) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Card 1: Personal Information */}
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                          <User className="h-4 w-4 text-emerald-400" />
                          <span>Personal information</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Your contact details.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Full name
                        </label>
                        <span className="text-sm font-semibold text-slate-200 mt-1 block">
                          {profile.ownerName}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Phone number
                        </label>
                        <span className="text-sm font-semibold text-slate-200 mt-1 block font-mono">
                          {profile.phone}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Email address
                        </label>
                        <span className="text-sm font-semibold text-slate-200 mt-1 block truncate">
                          {profile.email}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Location
                        </label>
                        <span className="text-sm font-semibold text-slate-200 mt-1 block">
                          {profile.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Default Payout Account */}
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-emerald-400" />
                          <span>Default Payout Account</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Account selected to receive seller COD earnings.
                        </p>
                      </div>

                      <button
                        onClick={() => setIsManagePayoutOpen(true)}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 group"
                      >
                        <span>Manage Payouts</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    {/* Styled Payout Card Container */}
                    <div className="p-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 border border-slate-800 relative overflow-hidden space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                              Bank Account
                            </span>
                            <span className="text-base font-bold text-slate-100">
                              {profile.payoutAccount.provider}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Default
                          </span>
                          {profile.payoutAccount.status === 'VERIFIED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Under Review
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Account Number:</span>
                          <span className="font-mono text-sm font-bold text-slate-100 tracking-wider">
                            {profile.payoutAccount.accountNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Account Holder:</span>
                          <span className="font-semibold text-slate-200">
                            {profile.payoutAccount.accountHolder}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Routing & Branch:</span>
                          <span className="text-slate-300">
                            {profile.payoutAccount.branchName} • Routing: {profile.payoutAccount.routingNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Payout Frequency:</span>
                          <span className="text-emerald-400 font-semibold">
                            {profile.payoutAccount.frequency} (Every Friday)
                          </span>
                        </div>
                      </div>

                      {/* Cheque Leaf Verification Row */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400">
                          <ImageIcon className="h-4 w-4 text-emerald-400" />
                          <span>Cheque Leaf Attachment:</span>
                          <span className="font-mono text-slate-300 text-[11px]">
                            {profile.payoutAccount.status === 'VERIFIED' ? 'cheque_leaf_verified_2026.png' : 'cheque_upload_pending.png'}
                          </span>
                        </div>

                        <button
                          onClick={() => setIsViewChequeOpen(true)}
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                        >
                          <Eye className="h-3 w-3 text-slate-400" />
                          <span>View Pic</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: 40% (col-span-5) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Card 3: Account Overview */}
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                    <div className="border-b border-slate-800 pb-4">
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span>Account Overview</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Merchant ID: <span className="font-mono text-emerald-400 font-bold">{profile.merchantCode}</span>
                      </p>
                    </div>

                    <div className="divide-y divide-slate-800 text-sm">
                      <div className="py-3 flex items-center justify-between">
                        <span className="text-slate-400 text-xs">Account Status</span>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {profile.status}
                        </span>
                      </div>

                      <div className="py-3 flex items-center justify-between">
                        <span className="text-slate-400 text-xs">Default Payout</span>
                        <span className="font-semibold text-slate-200 text-xs">
                          {profile.payoutMethod}
                        </span>
                      </div>

                      <div className="py-3 flex items-center justify-between">
                        <span className="text-slate-400 text-xs">Payout Schedule</span>
                        <span className="font-semibold text-slate-200 text-xs">
                          {profile.payoutSchedule}
                        </span>
                      </div>

                      <div className="py-3 flex items-center justify-between">
                        <span className="text-slate-400 text-xs">Connected Channels</span>
                        <span className="font-semibold text-emerald-400 text-xs">
                          {profile.socialChannels.length} Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Social Media Channels */}
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-emerald-400" />
                          <span>Social Media Channels</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Connected platforms for promotions.</p>
                      </div>

                      <button
                        onClick={() => {
                          setEditingSocialId(null);
                          setSocialForm({ platform: 'Facebook', url: '' });
                          setIsSocialModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Channel</span>
                      </button>
                    </div>

                    {/* Social List */}
                    <div className="space-y-3">
                      {profile.socialChannels.map((channel) => (
                        <div
                          key={channel.id}
                          className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">
                              {channel.platform === 'Facebook' && 'f'}
                              {channel.platform === 'Instagram' && '📷'}
                              {channel.platform === 'TikTok' && '🎵'}
                              {channel.platform === 'YouTube' && '▶'}
                              {channel.platform === 'Website' && '🌐'}
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-xs font-bold text-slate-200 block">
                                {channel.platform}
                              </span>
                              <a
                                href={channel.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-slate-400 hover:text-emerald-400 truncate block transition-colors"
                              >
                                {channel.url}
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingSocialId(channel.id);
                                setSocialForm({ platform: channel.platform, url: channel.url });
                                setIsSocialModalOpen(true);
                              }}
                              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                              title="Edit link"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSocial(channel.id)}
                              className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete link"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* MODAL 1: Edit Profile Details */}
              {isEditProfileOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-bold text-base text-slate-100">Edit Profile Details</h3>
                      <button
                        onClick={() => setIsEditProfileOpen(false)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Full Name / Owner Name
                        </label>
                        <input
                          type="text"
                          value={editForm.ownerName}
                          onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Store / Brand Name
                        </label>
                        <input
                          type="text"
                          value={editForm.storeName}
                          onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Business Location
                        </label>
                        <input
                          type="text"
                          value={editForm.location}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsEditProfileOpen(false)}
                          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 2: Manage Payouts & Upload Cheque Leaf */}
              {isManagePayoutOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-100">Update COD Payout Account</h3>
                        <p className="text-xs text-slate-400">Receive weekly earnings directly in your bank or MFS.</p>
                      </div>
                      <button
                        onClick={() => setIsManagePayoutOpen(false)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Security Warning Notice */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <span className="font-bold block">Admin Verification Protocol</span>
                        <span>
                          For fraud prevention, modifying settlement details requires Admin verification with a valid cheque leaf photo before future payouts switch.
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSavePayout} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Bank / Provider Name
                        </label>
                        <select
                          value={payoutForm.provider}
                          onChange={(e) => setPayoutForm({ ...payoutForm, provider: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="BRAC Bank PLC">BRAC Bank PLC</option>
                          <option value="The City Bank Limited">The City Bank Limited</option>
                          <option value="Dutch-Bangla Bank (DBBL)">Dutch-Bangla Bank (DBBL)</option>
                          <option value="Eastern Bank PLC (EBL)">Eastern Bank PLC (EBL)</option>
                          <option value="Islami Bank Bangladesh">Islami Bank Bangladesh</option>
                          <option value="bKash Merchant Account">bKash Merchant Account</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Account Holder Name (Must match cheque leaf exactly)
                        </label>
                        <input
                          type="text"
                          value={payoutForm.accountHolder}
                          onChange={(e) => setPayoutForm({ ...payoutForm, accountHolder: e.target.value })}
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={payoutForm.accountNumber}
                            onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            Branch & Routing Number
                          </label>
                          <input
                            type="text"
                            value={payoutForm.branchName}
                            onChange={(e) => setPayoutForm({ ...payoutForm, branchName: e.target.value })}
                            placeholder="e.g. Banani (060271829)"
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Cheque Leaf Upload Area */}
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Cheque Leaf / Bank Statement Photo (JPG, PNG max 5MB)
                        </label>
                        <div className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 text-center bg-slate-950/60 transition-colors cursor-pointer">
                          <Upload className="h-6 w-6 text-slate-500 mx-auto mb-1.5" />
                          <span className="text-xs font-semibold text-slate-300 block">
                            Click to replace cheque photo or drag & drop
                          </span>
                          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                            Selected: {payoutForm.chequeFileName}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsManagePayoutOpen(false)}
                          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>Submit for Admin Verification</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 3: View High-Res Cheque Leaf Photo */}
              {isViewChequeOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-emerald-400" />
                        <h3 className="font-bold text-base text-slate-100">Cheque Leaf Document</h3>
                      </div>
                      <button
                        onClick={() => setIsViewChequeOpen(false)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* High-res cheque preview container */}
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-6 flex flex-col justify-between h-64 relative overflow-hidden font-mono text-slate-800 select-none shadow-inner bg-gradient-to-r from-emerald-50/90 to-teal-50/90">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
                            B
                          </div>
                          <div>
                            <span className="font-bold text-sm block tracking-wider text-emerald-950">
                              BRAC BANK PLC
                            </span>
                            <span className="text-[10px] text-slate-600">Banani Branch, Dhaka</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Date: 24/10/2026</span>
                          <span className="text-xs font-bold text-slate-700 tracking-widest">
                            PAYEE ONLY
                          </span>
                        </div>
                      </div>

                      <div className="my-auto space-y-2">
                        <div className="border-b border-slate-400/80 pb-1 flex justify-between text-xs text-slate-700">
                          <span>Pay: Sabbir Ahmed</span>
                          <span>Or Bearer</span>
                        </div>
                        <div className="border-b border-slate-400/80 pb-1 flex justify-between text-xs text-slate-700">
                          <span>A/C No: 1501204892019001</span>
                          <span className="font-bold">৳ BDT</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end text-[10px] text-slate-600 border-t border-slate-400 pt-2">
                        <span className="tracking-widest">⑆060271829⑆ 1501204892019001⑈ 01</span>
                        <span className="font-serif italic font-bold text-sm text-slate-800">
                          Sabbir Ahmed
                        </span>
                      </div>

                      {/* Watermark Tag */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none">
                        <span className="text-2xl font-black text-emerald-700/25 tracking-widest border-2 border-emerald-700/30 px-4 py-1 rounded-lg uppercase">
                          FULFILLIO VERIFIED
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>File: cheque_leaf_verified_2026.png (1.4 MB)</span>
                      <button
                        onClick={() => setIsViewChequeOpen(false)}
                        className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL 4: Add / Edit Social Channel */}
              {isSocialModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-bold text-base text-slate-100">
                        {editingSocialId ? 'Edit Social Channel' : 'Add Social Channel'}
                      </h3>
                      <button
                        onClick={() => setIsSocialModalOpen(false)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveSocial} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Platform
                        </label>
                        <select
                          value={socialForm.platform}
                          onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Facebook">Facebook</option>
                          <option value="Instagram">Instagram</option>
                          <option value="TikTok">TikTok</option>
                          <option value="YouTube">YouTube</option>
                          <option value="Website">Website</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Profile / Page URL
                        </label>
                        <input
                          type="url"
                          value={socialForm.url}
                          onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
                          placeholder="https://..."
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsSocialModalOpen(false)}
                          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
                        >
                          Save Channel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 1. OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Merchant Store Performance</h1>
                <p className="text-sm text-slate-400">
                  Real-time inventory levels, orders fulfilled by Fulfillio, and COD settlement balance.
                </p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Total Fulfillments</span>
                  <div className="text-3xl font-bold mt-2">1,842</div>
                  <span className="text-xs text-emerald-400 mt-1 inline-block">99.8% on-time dispatch</span>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Warehouse In-Stock</span>
                  <div className="text-3xl font-bold mt-2">183 Units</div>
                  <span className="text-xs text-slate-400 mt-1 inline-block">Across 3 active SKUs</span>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Active Memo Codes</span>
                  <div className="text-3xl font-bold text-indigo-400 mt-2">{memoList.length} Designs</div>
                  <span className="text-xs text-slate-400 mt-1 inline-block">1 Default A4 / 1 Thermal</span>
                </div>

                <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs uppercase font-semibold text-slate-400">Available COD Balance</span>
                  <div className="text-3xl font-bold text-emerald-400 mt-2">৳ 184,500</div>
                  <span className="text-xs text-slate-400 mt-1 inline-block">Disbursement on Friday</span>
                </div>
              </div>

              {/* Quick Info Banner */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-800/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">Bespoke Branded Invoice Delivery</h3>
                    <p className="text-sm text-slate-400">
                      When your WooCommerce or Shopify store pushes orders, specify a <code className="text-xs font-mono text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">memo_code</code> to have our warehouse packers print your exact branded invoice.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('memo-designer')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors shrink-0"
                >
                  Manage Memo Designs
                </button>
              </div>
            </div>
          )}

          {/* ================= 2. PRODUCTS & INVENTORY (MODULE 03 - 2-PART SKU SYSTEM) ================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <Package className="h-6 w-6 text-emerald-400" />
                    <span>Products & 2-Part SKU Inventory</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Manage 2-part warehouse SKUs ({profile.merchantCode}-[SKU]), barcode stickers, and physical bin mapping.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Single Product</span>
                </button>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search product name, 2-part SKU, or barcode..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-xs text-slate-400">Stock Filter:</span>
                  <select
                    value={stockFilter}
                    onChange={(e: any) => setStockFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">All Items ({products.length})</option>
                    <option value="IN_STOCK">In Stock (&gt; 20)</option>
                    <option value="LOW_STOCK">Low Stock (≤ 20)</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Product Name & Variant</th>
                      <th className="p-4">2-Part SKU Code</th>
                      <th className="p-4">Barcode</th>
                      <th className="p-4">Storage Bin</th>
                      <th className="p-4">Warehouse Stock</th>
                      <th className="p-4 text-right">Unit Price</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {products
                      .filter((p) => {
                        const matchSearch =
                          p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.barcode.includes(productSearch);
                        if (!matchSearch) return false;
                        if (stockFilter === 'IN_STOCK') return p.stock > 20;
                        if (stockFilter === 'LOW_STOCK') return p.stock <= 20;
                        return true;
                      })
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-slate-200">{p.title}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                                {p.variantLabel}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                              {p.sku}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <Barcode className="h-3.5 w-3.5 text-slate-500" />
                              <span>{p.barcode}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs font-bold text-amber-400">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              {p.bin}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAdjustStock(p.id, -1)}
                                className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
                                title="Decrease Stock"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="font-bold text-sm text-slate-100 min-w-7 text-center">
                                {p.stock}
                              </span>
                              <button
                                onClick={() => handleAdjustStock(p.id, 1)}
                                className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
                                title="Increase Stock"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              {p.reserved > 0 && (
                                <span className="text-[10px] text-slate-500 ml-1">
                                  ({p.reserved} reserved)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-100">৳ {p.price.toLocaleString()}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setBarcodeProduct(p);
                                  setIsBarcodeModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="Print Barcode Thermal Label"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Sticker</span>
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Remove Product"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* MODAL: Add Single Product with 2-Part SKU Generator */}
              {isAddProductOpen && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-100">
                          Add New Product to Warehouse Catalog
                        </h3>
                        <p className="text-xs text-slate-400">
                          Automatically generates 2-part SKUs ({profile.merchantCode}-[SKU]) and 13-digit barcodes.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsAddProductOpen(false)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveProduct} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Product Title
                        </label>
                        <input
                          type="text"
                          value={prodTitle}
                          onChange={(e) => setProdTitle(e.target.value)}
                          placeholder="e.g. Heavyweight Oversized T-Shirt"
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            Base SKU Code (Your Internal Code)
                          </label>
                          <input
                            type="text"
                            value={prodBaseSku}
                            onChange={(e) => setProdBaseSku(e.target.value.toUpperCase())}
                            placeholder="e.g. TSHIRT"
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-emerald-400 uppercase focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            Merchant Code (System Locked)
                          </label>
                          <input
                            type="text"
                            value={profile.merchantCode}
                            readOnly
                            className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm font-mono text-slate-500 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            Unit Price (৳)
                          </label>
                          <input
                            type="number"
                            value={singlePrice}
                            onChange={(e) => setSinglePrice(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            Initial Stock
                          </label>
                          <input
                            type="number"
                            value={singleStock}
                            onChange={(e) => setSingleStock(e.target.value)}
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            Warehouse Bin
                          </label>
                          <input
                            type="text"
                            value={binLocation}
                            onChange={(e) => setBinLocation(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-amber-400 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Variant Toggle */}
                      <div className="pt-2 border-t border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                          <input
                            type="checkbox"
                            checked={hasVariants}
                            onChange={(e) => setHasVariants(e.target.checked)}
                            className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0 h-4 w-4"
                          />
                          <span>This product has variants (Color / Size)</span>
                        </label>
                      </div>

                      {hasVariants && (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                          {/* Colors Builder */}
                          <div>
                            <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                              Colors:
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {colors.map((c) => (
                                <span
                                  key={c}
                                  className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                                >
                                  <span>{c}</span>
                                  <button
                                    type="button"
                                    onClick={() => setColors(colors.filter((x) => x !== c))}
                                    className="text-slate-400 hover:text-rose-400"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={colorInput}
                                  onChange={(e) => setColorInput(e.target.value)}
                                  placeholder="+ Add Color"
                                  className="w-24 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddColor();
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={handleAddColor}
                                  className="p-1 rounded bg-slate-800 text-xs text-slate-300"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Sizes Builder */}
                          <div>
                            <span className="text-xs font-semibold text-slate-400 block mb-1.5">
                              Sizes:
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {sizes.map((s) => (
                                <span
                                  key={s}
                                  className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 flex items-center gap-1.5"
                                >
                                  <span>{s}</span>
                                  <button
                                    type="button"
                                    onClick={() => setSizes(sizes.filter((x) => x !== s))}
                                    className="text-slate-400 hover:text-rose-400"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={sizeInput}
                                  onChange={(e) => setSizeInput(e.target.value)}
                                  placeholder="+ Add Size"
                                  className="w-24 px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddSize();
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={handleAddSize}
                                  className="p-1 rounded bg-slate-800 text-xs text-slate-300"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Dynamic Generated SKU Preview */}
                          {prodBaseSku && colors.length > 0 && sizes.length > 0 && (
                            <div className="pt-2 border-t border-slate-800/80">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                Generated 2-Part SKUs Preview ({colors.length * sizes.length} variants):
                              </span>
                              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                {colors.map((col) =>
                                  sizes.map((sz) => (
                                    <div
                                      key={`${col}-${sz}`}
                                      className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-900/60"
                                    >
                                      <span className="text-slate-300">
                                        {col} / {sz}
                                      </span>
                                      <span className="font-mono text-emerald-400 font-semibold">
                                        {profile.merchantCode}-{prodBaseSku.trim().toUpperCase()}-{getColorCode(col)}-{getSizeCode(sz)}
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsAddProductOpen(false)}
                          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Generate & Save Products</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL: Print Thermal Barcode Sticker */}
              {isBarcodeModalOpen && barcodeProduct && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Printer className="h-4 w-4 text-emerald-400" />
                        <h3 className="font-bold text-base text-slate-100">
                          Print Thermal Barcode Label
                        </h3>
                      </div>
                      <button
                        onClick={() => setIsBarcodeModalOpen(false)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Realistic 2x1 Inch Thermal Label Simulation */}
                    <div className="bg-white text-black p-4 rounded-lg font-mono text-xs select-none shadow-xl border-2 border-slate-300 space-y-2">
                      <div className="text-center border-b border-black pb-1.5">
                        <span className="font-black text-sm block tracking-tight">
                          {profile.storeName}
                        </span>
                        <span className="text-[10px] text-gray-700 block truncate">
                          {barcodeProduct.title} ({barcodeProduct.variantLabel})
                        </span>
                      </div>

                      <div className="text-center space-y-1">
                        <span className="font-black text-xs block text-black">
                          SKU: {barcodeProduct.sku}
                        </span>

                        {/* Barcode visual bars */}
                        <div className="py-1 flex justify-center items-center gap-[2px] h-10 overflow-hidden">
                          {[4, 2, 6, 3, 5, 2, 4, 6, 2, 3, 6, 4, 3, 5, 2, 6, 3, 4, 2, 5, 3, 6, 2, 4, 5, 3, 6, 2].map(
                            (w, idx) => (
                              <div
                                key={idx}
                                className="bg-black h-full"
                                style={{ width: `${w}px` }}
                              />
                            )
                          )}
                        </div>

                        <span className="font-mono text-xs font-bold tracking-widest text-black block">
                          {barcodeProduct.barcode}
                        </span>
                      </div>

                      <div className="border-t border-black pt-1 flex justify-between items-center text-[11px] font-bold">
                        <span>PRICE: ৳ {barcodeProduct.price.toLocaleString()}</span>
                        <span>BIN: {barcodeProduct.bin}</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Label Format:</span>
                        <span className="font-bold text-slate-200">2x1 Inch Thermal Sticker</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Number of Copies:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setBarcodeCopies(Math.max(1, barcodeCopies - 5))}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                          >
                            -5
                          </button>
                          <span className="font-bold text-emerald-400 min-w-8 text-center font-mono">
                            {barcodeCopies}
                          </span>
                          <button
                            onClick={() => setBarcodeCopies(barcodeCopies + 5)}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                          >
                            +5
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsBarcodeModalOpen(false)}
                          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsBarcodeModalOpen(false);
                            showNotification(
                              `Sent ${barcodeCopies} barcode sticker(s) for ${barcodeProduct.sku} to warehouse printer!`
                            );
                          }}
                          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
                        >
                          <Printer className="h-4 w-4" />
                          <span>Print Label Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 3. ORDERS (MODULE 05 - MANUAL ORDER CREATION WITH STOCK RESERVATION) ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <ShoppingCart className="h-6 w-6 text-emerald-400" />
                    <span>Order Lifecycle & Reseller Attribution</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Orders received from store sync or manual entry with assigned Reseller Memo Codes.
                  </p>
                </div>

                <button
                  onClick={() => setIsCreateOrderOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Manual Order</span>
                </button>
              </div>

              {/* Orders Table */}
              <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Order ID & Date</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Items Ordered</th>
                      <th className="p-4">Reseller Memo Code</th>
                      <th className="p-4">Courier</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">COD Total</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <span className="font-mono text-xs font-bold text-slate-200 block">{o.id}</span>
                          <span className="text-[11px] text-slate-500">{o.date}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-200">{o.customer}</div>
                          <div className="text-xs text-slate-400">{o.phone}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{o.address}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-medium text-slate-200 block">{o.items}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">Qty: {o.qty}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs px-2.5 py-1 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold inline-block">
                            {o.memoCode}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-300">{o.courier}</td>
                        <td className="p-4">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              o.status === 'PACKED'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                : o.status === 'DISPATCHED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : o.status === 'CANCELLED'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-slate-200">৳ {o.amount.toLocaleString()}</td>
                        <td className="p-4 text-center">
                          {o.status !== 'CANCELLED' && o.status !== 'DISPATCHED' && (
                            <button
                              onClick={() => handleCancelOrder(o.id)}
                              className="px-2 py-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded text-xs transition-colors"
                              title="Cancel order and restore reserved stock"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODAL: Create Manual Order */}
              {isCreateOrderOpen && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-100">Create Manual Order</h3>
                        <p className="text-xs text-slate-400">
                          Reserves warehouse stock and assigns custom Reseller Memo for packing.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCreateOrderOpen(false)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateManualOrder} className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Customer Full Name
                        </label>
                        <input
                          type="text"
                          value={orderCustomer}
                          onChange={(e) => setOrderCustomer(e.target.value)}
                          placeholder="e.g. Mahfuz Rahman"
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={orderPhone}
                            onChange={(e) => setOrderPhone(e.target.value)}
                            placeholder="017xxxxxxxx"
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-400 block mb-1">
                            Courier Partner
                          </label>
                          <select
                            value={orderCourier}
                            onChange={(e) => setOrderCourier(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="Steadfast">Steadfast Courier</option>
                            <option value="Pathao">Pathao Logistics</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Delivery Address & City
                        </label>
                        <input
                          type="text"
                          value={orderAddress}
                          onChange={(e) => setOrderAddress(e.target.value)}
                          placeholder="House, Road, Area, Dhaka"
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Product Selector with Live Stock Display */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-slate-300 block">
                          Product & Warehouse Stock Reservation:
                        </span>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                              Select SKU
                            </label>
                            <select
                              value={orderSelectedProductId}
                              onChange={(e) => setOrderSelectedProductId(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.title} ({p.variantLabel}) — Avail: {p.stock} pcs (৳ {p.price})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={orderQty}
                              onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                              required
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Selected Product Summary & Stock Badge */}
                        {(() => {
                          const sel = products.find((p) => p.id === orderSelectedProductId);
                          if (!sel) return null;
                          return (
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                              <span className="text-slate-400">
                                SKU: <span className="font-mono text-emerald-400">{sel.sku}</span>
                              </span>
                              <span className="font-bold text-slate-200">
                                Total COD: ৳ {(sel.price * orderQty).toLocaleString()}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Reseller Memo Code Selector */}
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Assign Reseller Memo Template (4x6 Thermal Slip)
                        </label>
                        <select
                          value={orderMemoCode}
                          onChange={(e) => setOrderMemoCode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                        >
                          {memoList.map((m) => (
                            <option key={m.id} value={m.code}>
                              {m.code} — {m.resellerName} ({m.name}) {m.isDefault ? '[DEFAULT]' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsCreateOrderOpen(false)}
                          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Save & Reserve Stock</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 4. MEMO CODE DESIGNER (MODULE 04 - RESELLER MEMO 4X6 FOCUS) ================= */}
          {activeTab === 'memo-designer' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                    <Layers className="h-6 w-6 text-indigo-400" />
                    <span>Reseller Memo Designer (4x6 Thermal Focus)</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Design custom branded slips for your dropshippers & resellers. Automatically prints on 4x6 thermal paper at the packing station.
                  </p>
                </div>
              </div>

              {memoSavedAlert && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Reseller memo template successfully saved and compiled for edge thermal printers!</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Editor */}
                <div className="lg:col-span-6 space-y-4">
                  <form onSubmit={handleSaveMemo} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
                    <h3 className="font-bold text-base text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      <span>Reseller Slip Configuration</span>
                    </h3>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        Unique Memo Code (System Attribution)
                      </label>
                      <input
                        type="text"
                        value={designerCode}
                        onChange={(e) => setDesignerCode(e.target.value.toUpperCase())}
                        placeholder="e.g. MEMO-DARAZ-BD"
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Template Purpose
                        </label>
                        <input
                          type="text"
                          value={designerName}
                          onChange={(e) => setDesignerName(e.target.value)}
                          placeholder="e.g. Daraz Festive Slip"
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Reseller Store / Brand Name
                        </label>
                        <input
                          type="text"
                          value={resellerStoreName}
                          onChange={(e) => setResellerStoreName(e.target.value)}
                          placeholder="e.g. Daraz Partner Store"
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Reseller Contact Phone
                        </label>
                        <input
                          type="text"
                          value={resellerPhone}
                          onChange={(e) => setResellerPhone(e.target.value)}
                          placeholder="+880 18xx-xxxxxx"
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1">
                          Paper Size
                        </label>
                        <select
                          value={paperSize}
                          onChange={(e) => setPaperSize(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="THERMAL_4X6">4x6 Inch Thermal Sticker</option>
                          <option value="POS_80MM">80mm POS Slip</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        Reseller Return / Shop Address
                      </label>
                      <input
                        type="text"
                        value={resellerAddress}
                        onChange={(e) => setResellerAddress(e.target.value)}
                        placeholder="e.g. Tejgaon Industrial Area, Dhaka"
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        Footnote / Warranty Notice
                      </label>
                      <input
                        type="text"
                        value={resellerNote}
                        onChange={(e) => setResellerNote(e.target.value)}
                        placeholder="e.g. 7-day return guarantee with invoice."
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Brand Accent Color Selector */}
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                        Brand Accent Color:
                      </label>
                      <div className="flex items-center gap-2">
                        {[
                          { color: '#4f46e5', label: 'Indigo' },
                          { color: '#ea580c', label: 'Orange' },
                          { color: '#059669', label: 'Emerald' },
                          { color: '#db2777', label: 'Pink' },
                          { color: '#1e293b', label: 'Slate' },
                        ].map((c) => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setResellerColor(c.color)}
                            className={`h-7 px-2.5 rounded-lg text-[10px] font-bold text-white transition-all flex items-center gap-1.5 border ${
                              resellerColor === c.color ? 'ring-2 ring-white border-transparent' : 'border-slate-700'
                            }`}
                            style={{ backgroundColor: c.color }}
                          >
                            <span>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Save Reseller Memo</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Live 4x6 Thermal Slip Preview */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-bold text-base text-slate-200">
                          Thermal 4x6 Slip Real Preview
                        </h3>
                        <p className="text-xs text-slate-400">
                          Exact layout sent to Zebra/TSC thermal label printer at packing station.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          showNotification(`Triggered 4x6 thermal test print for ${designerCode}!`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print 4x6 Test</span>
                      </button>
                    </div>

                    {/* Realistic 4x6 Thermal Label Simulation */}
                    <div className="mx-auto w-[310px] bg-white text-black p-5 rounded-lg shadow-2xl font-mono text-[11px] leading-tight space-y-3 border-2 border-slate-300">
                      {/* Top Brand Banner */}
                      <div
                        className="p-2 text-center text-white rounded font-bold"
                        style={{ backgroundColor: resellerColor }}
                      >
                        <span className="text-sm tracking-wide block uppercase">{resellerStoreName}</span>
                        <span className="text-[10px] opacity-90 block">{resellerPhone}</span>
                      </div>

                      <div className="text-center">
                        <div className="inline-block border border-black px-2 py-0.5 font-bold text-[10px] bg-slate-100">
                          CODE: {designerCode || 'DEFAULT'}
                        </div>
                      </div>

                      <div className="border-b border-black pb-2 space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span>Order: #ORD-9824</span>
                          <span>24 Oct 2026</span>
                        </div>
                        <div className="font-bold">Customer: Tariqul Islam (01812345678)</div>
                        <div className="text-[10px] text-gray-700">Dhanmondi, Dhaka</div>
                      </div>

                      <table className="w-full text-left text-[10px]">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="py-1">Item / SKU</th>
                            <th className="text-center py-1">Qty</th>
                            <th className="text-right py-1">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="py-1">
                              <div>Heavyweight Hoodie (XL)</div>
                              <span className="text-[9px] text-gray-500 font-bold">MC-101-HOODIE-BLK-XL</span>
                            </td>
                            <td className="text-center py-1">1</td>
                            <td className="text-right py-1">৳ 3,450</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="border-t-2 border-black pt-2 flex justify-between font-black text-xs">
                        <span>Total Payable (COD):</span>
                        <span>৳ 3,450</span>
                      </div>

                      <div className="text-center pt-2 border-t border-dashed border-gray-400 text-[9px] text-gray-600">
                        {resellerNote}
                      </div>

                      <div className="text-center text-[9px] text-gray-500 font-bold">
                        Return: {resellerAddress}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Reseller Memo Cards Grid */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-400" />
                    <span>Active Reseller Memo Templates ({memoList.length})</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Assigned to your manual orders and WooCommerce webhooks.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {memoList.map((memo) => (
                    <div
                      key={memo.id}
                      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm"
                    >
                      {/* Accent Header Bar */}
                      <div
                        className="h-1.5 w-full absolute top-0 left-0"
                        style={{ backgroundColor: memo.accentColor }}
                      />

                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-indigo-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block">
                            {memo.code}
                          </span>
                          <h4 className="font-bold text-sm text-slate-100 mt-1">{memo.resellerName}</h4>
                          <span className="text-xs text-slate-400 block">{memo.name}</span>
                        </div>

                        {memo.isDefault && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
                        <div>Phone: <span className="text-slate-300 font-mono">{memo.phone}</span></div>
                        <div className="truncate">Return: <span className="text-slate-300">{memo.address}</span></div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                        {!memo.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultMemo(memo.id)}
                            className="text-slate-400 hover:text-emerald-400 text-xs font-semibold"
                          >
                            Set as Default
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-semibold">Primary Default</span>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              showNotification(`Printed 4x6 test for ${memo.code}`);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Print test slip"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMemo(memo.id)}
                            className="p-1 rounded hover:bg-rose-500/10 text-slate-500 hover:text-rose-400"
                            title="Delete memo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 5. COURIER TRACKING ================= */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Steadfast & Pathao Courier Live Tracking</h1>
                <p className="text-sm text-slate-400">
                  Consignment status synced automatically via courier webhook events.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">Consignment: CID-88491024</span>
                    <h3 className="text-lg font-bold text-slate-200">Steadfast Courier Delivery</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    IN TRANSIT
                  </span>
                </div>

                <div className="border-l-2 border-emerald-500 pl-4 space-y-3 text-xs">
                  <div className="flex gap-4 items-center">
                    <span className="text-slate-500 w-28">10:45 AM Today</span>
                    <span className="font-medium text-slate-300">Package handed over to Steadfast driver</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="text-slate-500 w-28">09:30 AM Today</span>
                    <span className="font-medium text-slate-300">Packed and verified at Fulfillio Station #3</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 6. BILLING & COD PAYOUT (MODULE 08 - SETTLEMENT STATEMENTS) ================= */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-emerald-400" />
                  <span>Billing & COD Settlement Statements</span>
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Itemized fulfillment fee deductions, storage billing, and net disbursement balance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <span className="text-xs uppercase font-semibold text-slate-400">Gross COD Collected</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-2">৳ 198,400</div>
                  <span className="text-xs text-slate-500">From Steadfast & Pathao</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <span className="text-xs uppercase font-semibold text-slate-400">Fulfillio 3PL Fees</span>
                  <div className="text-2xl font-bold text-rose-400 mt-2">- ৳ 13,900</div>
                  <span className="text-xs text-slate-500">৳ 50 per order pick & pack + shelf storage</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <span className="text-xs uppercase font-semibold text-slate-400">Net Payable Payout</span>
                  <div className="text-2xl font-bold text-slate-100 mt-2">৳ 184,500</div>
                  <span className="text-xs text-emerald-400 font-semibold">Scheduled for weekly bank deposit</span>
                </div>
              </div>

              {/* Itemized Settlement History Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span>Weekly Settlement Statements</span>
                  </h3>
                  <span className="text-xs text-slate-400">Directly deposited to BRAC Bank (A/C: 1501204892019001)</span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-4">Settlement Cycle</th>
                      <th className="p-4">Orders</th>
                      <th className="p-4">Gross COD</th>
                      <th className="p-4">3PL Pick & Pack</th>
                      <th className="p-4">Storage Fees</th>
                      <th className="p-4 font-bold text-emerald-400">Net Disbursed</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-200 block text-xs">15 Oct 2026 - 21 Oct 2026</span>
                        <span className="text-[11px] font-mono text-slate-500">SETTLE-2026-W42</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-300">228 Orders</td>
                      <td className="p-4 font-bold text-slate-200">৳ 198,400</td>
                      <td className="p-4 text-xs text-rose-400">- ৳ 11,400</td>
                      <td className="p-4 text-xs text-rose-400">- ৳ 2,500</td>
                      <td className="p-4 font-bold text-emerald-400">৳ 184,500</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Disbursed (Friday)
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-slate-200 block text-xs">08 Oct 2026 - 14 Oct 2026</span>
                        <span className="text-[11px] font-mono text-slate-500">SETTLE-2026-W41</span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-300">195 Orders</td>
                      <td className="p-4 font-bold text-slate-200">৳ 162,100</td>
                      <td className="p-4 text-xs text-rose-400">- ৳ 9,750</td>
                      <td className="p-4 text-xs text-rose-400">- ৳ 2,500</td>
                      <td className="p-4 font-bold text-emerald-400">৳ 149,850</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          Settled & Paid
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= 7. API KEYS & WEBHOOKS ================= */}
          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">API Key & Webhook Integration</h1>
                <p className="text-sm text-slate-400">
                  Connect your WooCommerce, Shopify, or custom store to Fulfillio using REST APIs.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="font-bold text-base text-slate-200">Active Production API Key</h3>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value="ful_live_948a9f82d1c34a98b29f01e847c210ab"
                    readOnly
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText('ful_live_948a9f82d1c34a98b29f01e847c210ab')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="font-semibold text-sm mb-2 text-slate-300">Sample WooCommerce / REST API Payload:</h4>
                  <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`POST /api/orders
Headers:
  X-Fulfillio-Api-Key: ful_live_948a9f82d1c34a98b29f...

Payload:
{
  "externalOrderId": "WC-10492",
  "customerName": "Tariqul Islam",
  "customerPhone": "01812345678",
  "customerAddress": "House 12, Road 4, Dhanmondi, Dhaka",
  "memoCode": "MEMO-FESTIVE-01",  // <-- Uses your custom memo design!
  "totalAmount": 3450,
  "codAmount": 3450,
  "items": [
    { "variantId": "var-hoodie-xl", "quantity": 1, "unitPrice": 3450 }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
