'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Store,
  Save,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  UserCheck,
  Search,
  LayoutGrid,
  List,
  Printer,
  CheckCircle2,
  Eye,
  Plus,
  Truck,
  Landmark,
  Camera,
  Upload,
  Pencil,
  X,
  Calendar,
  Filter,
  RotateCcw,
  LayoutDashboard,
  TrendingUp,
  Boxes,
  Activity,
  ArrowRight,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { UnifiedThermalSticker } from '@/features/thermal-print/UnifiedThermalSticker';

export type MerchantSubTab = 'overview' | 'profile' | 'memo' | 'orders' | 'products' | 'payout';
export type OrderPeriodFilter = 'DAY' | 'WEEK' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type OverviewRangeFilter = OrderPeriodFilter;

const PERIOD_RANK: Record<OrderPeriodFilter, number> = {
  DAY: 1,
  WEEK: 2,
  '1M': 3,
  '3M': 4,
  '6M': 5,
  '1Y': 6,
  ALL: 7,
};

const PERIOD_FILTER_OPTIONS: { id: OrderPeriodFilter; label: string; periodLabel: string }[] = [
  { id: 'DAY', label: 'Day', periodLabel: 'today records' },
  { id: 'WEEK', label: 'Week', periodLabel: 'this week records' },
  { id: '1M', label: '1 Month', periodLabel: 'last 1 month' },
  { id: '3M', label: '3 Months', periodLabel: 'last 3 months' },
  { id: '6M', label: '6 Months', periodLabel: 'last 6 months' },
  { id: '1Y', label: '1 Year', periodLabel: 'last 1 year' },
  { id: 'ALL', label: 'All Time', periodLabel: 'all time records' },
];

export interface MerchantProductItem {
  id: string;
  merchantCode: string;
  title: string;
  category: 'Apparel' | 'Footwear' | 'Electronics' | 'Beauty';
  sku: string;
  barcode: string;
  color: string;
  size: string;
  price: number;
  wholesalePrice: number;
  stock: number;
  reserved: number;
  damaged: number;
  bin: string;
  imageUrl?: string;
}

function makeMerchantProductThumbnail(label: string, bgStart: string, bgEnd: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}" />
        <stop offset="100%" stop-color="${bgEnd}" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="22" fill="url(#g)" />
    <rect x="8" y="8" width="104" height="104" rx="16" fill="none" stroke="${accent}" stroke-opacity="0.35" stroke-width="2" />
    <circle cx="60" cy="48" r="22" fill="${accent}" fill-opacity="0.2" />
    <path d="M44 48h32M60 32v32" stroke="${accent}" stroke-width="3" stroke-linecap="round" opacity="0.35" />
    <text x="60" y="54" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="800" font-size="16">${label}</text>
    <rect x="24" y="82" width="72" height="16" rx="8" fill="#020617" fill-opacity="0.55" />
    <text x="60" y="93" text-anchor="middle" fill="${accent}" font-family="monospace" font-weight="700" font-size="9">FULFILLIO SKU</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface MerchantOrderItem {
  id: string;
  merchantCode: string;
  date: string;
  isoDate: string; // YYYY-MM-DD for date/week/month filtering
  periodBucket: OrderPeriodFilter;
  customer: string;
  phone: string;
  address: string;
  city: string;
  items: string;
  sku: string;
  qty: number;
  memoCode: string;
  courier: string;
  status: 'ALLOCATED' | 'PICKING' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  amount: number;
  fraudRatio: number;
}

export interface MerchantMemoItem {
  id: string;
  merchantCode: string;
  code: string;
  resellerName: string;
  brandColor: string;
  phone: string;
  address: string;
  terms: string;
  isDefault: boolean;
}

export interface MerchantRecord {
  id: string;
  merchantCode: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  deliveryArea: string;
  status: 'Active' | 'Pending' | 'Suspended';
  verified: boolean;
  joinedDate: string;
  avatarInitials: string;
  avatarBg: string;
  avatarUrl?: string;
  payoutAccount: {
    provider: string;
    accountHolder: string;
    accountNumber: string;
    branchName: string;
    routingNumber: string;
    bkashNumber: string;
    frequency: string;
    status: 'VERIFIED' | 'PENDING_REVIEW';
    availableBalance: number;
    lastPayoutAmount: number;
  };
}

const MERCHANTS_DATA: MerchantRecord[] = [
  {
    id: 'm-101',
    merchantCode: 'MC-101',
    storeName: "Sabbir's Store",
    ownerName: 'Sabbir Ahmed',
    email: 'sabbir@example.com',
    phone: '01712 345678',
    location: 'Dhaka, Bangladesh',
    deliveryArea: 'Nationwide Bangladesh',
    status: 'Active',
    verified: true,
    joinedDate: '12 Oct 2026',
    avatarInitials: 'SA',
    avatarBg: 'from-emerald-600 to-teal-700',
    payoutAccount: {
      provider: 'BRAC Bank PLC',
      accountHolder: 'Sabbir Ahmed',
      accountNumber: '1501204892019001',
      branchName: 'Banani Branch, Dhaka',
      routingNumber: '060271829',
      bkashNumber: '01712-345678',
      frequency: 'Weekly (Every Friday)',
      status: 'VERIFIED',
      availableBalance: 184500,
      lastPayoutAmount: 92400,
    },
  },
  {
    id: 'm-102',
    merchantCode: 'MC-102',
    storeName: 'Urban Threads BD',
    ownerName: 'Tariqul Rahman',
    email: 'founder@urbanthreads.com',
    phone: '01819 554433',
    location: 'Uttara, Dhaka, Bangladesh',
    deliveryArea: 'Nationwide Bangladesh',
    status: 'Active',
    verified: true,
    joinedDate: '15 Oct 2026',
    avatarInitials: 'UT',
    avatarBg: 'from-indigo-600 to-violet-700',
    payoutAccount: {
      provider: 'City Bank PLC',
      accountHolder: 'Urban Threads BD Ltd',
      accountNumber: '2102948192001',
      branchName: 'Gulshan Avenue Branch',
      routingNumber: '225271890',
      bkashNumber: '01819-554433',
      frequency: 'Weekly (Every Sunday)',
      status: 'VERIFIED',
      availableBalance: 246000,
      lastPayoutAmount: 118000,
    },
  },
  {
    id: 'm-103',
    merchantCode: 'MC-103',
    storeName: 'Apex Footwear Hub',
    ownerName: 'Mustafizur Karim',
    email: 'ops@apexfootwear.com',
    phone: '01912 334455',
    location: 'Tejgaon, Dhaka, Bangladesh',
    deliveryArea: 'Dhaka & Chattogram Metro',
    status: 'Active',
    verified: true,
    joinedDate: '18 Oct 2026',
    avatarInitials: 'AF',
    avatarBg: 'from-amber-600 to-orange-700',
    payoutAccount: {
      provider: 'Eastern Bank PLC (EBL)',
      accountHolder: 'Apex Retail Distribution',
      accountNumber: '1041060087421',
      branchName: 'Principal Branch',
      routingNumber: '095261432',
      bkashNumber: '01912-334455',
      frequency: 'Bi-Weekly',
      status: 'VERIFIED',
      availableBalance: 94200,
      lastPayoutAmount: 65000,
    },
  },
  {
    id: 'm-104',
    merchantCode: 'MC-104',
    storeName: 'Gadget Freak Online',
    ownerName: 'Rashedul Anam',
    email: 'admin@gadgetfreak.bd',
    phone: '01611 778899',
    location: 'Elephant Road, Dhaka',
    deliveryArea: 'Nationwide Bangladesh',
    status: 'Pending',
    verified: false,
    joinedDate: '21 Oct 2026',
    avatarInitials: 'GF',
    avatarBg: 'from-sky-600 to-blue-700',
    payoutAccount: {
      provider: 'Dutch-Bangla Bank PLC',
      accountHolder: 'Gadget Freak Tech',
      accountNumber: '1101050049281',
      branchName: 'Dhanmondi Branch',
      routingNumber: '090261124',
      bkashNumber: '01611-778899',
      frequency: 'Weekly (Every Friday)',
      status: 'PENDING_REVIEW',
      availableBalance: 41800,
      lastPayoutAmount: 0,
    },
  },
];

const ALL_PRODUCTS: MerchantProductItem[] = [
  // MC-101 Products (Sabbir's Store)
  {
    id: 'p-101-1',
    merchantCode: 'MC-101',
    title: 'Heavyweight Winter Fleece Hoodie',
    category: 'Apparel',
    sku: 'MC-101-HOODIE-BLK-XL',
    barcode: '8941101001241',
    color: 'Jet Black',
    size: 'XL',
    price: 1650,
    wholesalePrice: 1150,
    stock: 94,
    reserved: 12,
    damaged: 2,
    bin: 'A-01-02',
    imageUrl: makeMerchantProductThumbnail('HD', '#064e3b', '#0f172a', '#34d399'),
  },
  {
    id: 'p-101-2',
    merchantCode: 'MC-101',
    title: 'Classic Pique Cotton Polo Shirt',
    category: 'Apparel',
    sku: 'MC-101-POLO-NVY-L',
    barcode: '8941101001258',
    color: 'Navy Blue',
    size: 'L',
    price: 950,
    wholesalePrice: 680,
    stock: 62,
    reserved: 8,
    damaged: 0,
    bin: 'A-01-04',
    imageUrl: makeMerchantProductThumbnail('PL', '#1e3a8a', '#0f172a', '#60a5fa'),
  },
  {
    id: 'p-101-3',
    merchantCode: 'MC-101',
    title: 'Raw Selvedge Denim Jacket',
    category: 'Apparel',
    sku: 'MC-101-JKT-RAW-L',
    barcode: '8941101001265',
    color: 'Raw Indigo',
    size: 'L',
    price: 2450,
    wholesalePrice: 1750,
    stock: 7,
    reserved: 3,
    damaged: 1,
    bin: 'A-02-01',
    imageUrl: makeMerchantProductThumbnail('JK', '#312e81', '#0f172a', '#818cf8'),
  },
  {
    id: 'p-101-4',
    merchantCode: 'MC-101',
    title: 'Minimalist Leather Crossbody Bag',
    category: 'Footwear',
    sku: 'MC-101-BAG-BRN-OS',
    barcode: '8941101001272',
    color: 'Chestnut Brown',
    size: 'OS',
    price: 1850,
    wholesalePrice: 1290,
    stock: 0,
    reserved: 0,
    damaged: 0,
    bin: 'B-01-03',
    imageUrl: makeMerchantProductThumbnail('BG', '#78350f', '#0f172a', '#fbbf24'),
  },

  // MC-102 Products (Urban Threads BD)
  {
    id: 'p-102-1',
    merchantCode: 'MC-102',
    title: 'Oversized Drop-Shoulder Graphic Tee',
    category: 'Apparel',
    sku: 'MC-102-DROPTEE-WHT-M',
    barcode: '8941102003110',
    color: 'Off White',
    size: 'M',
    price: 790,
    wholesalePrice: 520,
    stock: 140,
    reserved: 19,
    damaged: 0,
    bin: 'B-03-01',
    imageUrl: makeMerchantProductThumbnail('GT', '#065f46', '#0f172a', '#10b981'),
  },
  {
    id: 'p-102-2',
    merchantCode: 'MC-102',
    title: 'Cargo Tactical Jogger Pants',
    category: 'Apparel',
    sku: 'MC-102-CARGO-OLV-32',
    barcode: '8941102003127',
    color: 'Olive Drab',
    size: '32',
    price: 1350,
    wholesalePrice: 920,
    stock: 8,
    reserved: 4,
    damaged: 1,
    bin: 'B-03-04',
    imageUrl: makeMerchantProductThumbnail('CG', '#365314', '#0f172a', '#a3e635'),
  },

  // MC-103 Products (Apex Footwear Hub)
  {
    id: 'p-103-1',
    merchantCode: 'MC-103',
    title: 'Genuine Suede Chelsea Boots',
    category: 'Footwear',
    sku: 'MC-103-BOOT-TAN-42',
    barcode: '8941103005012',
    color: 'Desert Tan',
    size: 'EU 42',
    price: 3200,
    wholesalePrice: 2300,
    stock: 45,
    reserved: 6,
    damaged: 0,
    bin: 'C-01-01',
    imageUrl: makeMerchantProductThumbnail('BT', '#7c2d12', '#0f172a', '#fb923c'),
  },
  {
    id: 'p-103-2',
    merchantCode: 'MC-103',
    title: 'Ultralight Running Sneakers',
    category: 'Footwear',
    sku: 'MC-103-RUN-GRY-41',
    barcode: '8941103005029',
    color: 'Wolf Grey',
    size: 'EU 41',
    price: 2150,
    wholesalePrice: 1500,
    stock: 5,
    reserved: 2,
    damaged: 0,
    bin: 'C-01-02',
    imageUrl: makeMerchantProductThumbnail('SN', '#0f766e', '#0f172a', '#2dd4bf'),
  },

  // MC-104 Products (Gadget Freak Online)
  {
    id: 'p-104-1',
    merchantCode: 'MC-104',
    title: 'ANC Wireless Pro Earbuds Gen-3',
    category: 'Electronics',
    sku: 'MC-104-BUDS-BLK-PRO',
    barcode: '8941104008901',
    color: 'Matte Black',
    size: 'Standard',
    price: 1950,
    wholesalePrice: 1350,
    stock: 72,
    reserved: 11,
    damaged: 3,
    bin: 'D-01-01',
    imageUrl: makeMerchantProductThumbnail('EB', '#0c4a6e', '#0f172a', '#38bdf8'),
  },
];

const ALL_ORDERS: MerchantOrderItem[] = [
  // ===================== MC-101 (Sabbir's Store) =====================
  {
    id: 'ORD-9041',
    merchantCode: 'MC-101',
    date: '02 Nov 2026, 11:20 AM',
    isoDate: '2026-11-02',
    periodBucket: 'DAY',
    customer: 'Tanvir Hasan',
    phone: '01712889900',
    address: 'House 14, Road 7, Sector 4, Uttara',
    city: 'Dhaka',
    items: 'Heavyweight Winter Fleece Hoodie (XL)',
    sku: 'MC-101-HOODIE-BLK-XL',
    qty: 1,
    memoCode: 'MEMO-DARAZ-BD',
    courier: 'Steadfast',
    status: 'PACKED',
    amount: 1650,
    fraudRatio: 94,
  },
  {
    id: 'ORD-9042',
    merchantCode: 'MC-101',
    date: '02 Nov 2026, 10:05 AM',
    isoDate: '2026-11-02',
    periodBucket: 'DAY',
    customer: 'Nusrat Jahan',
    phone: '01819334455',
    address: 'Flat 4B, Dhanmondi Road 9/A',
    city: 'Dhaka',
    items: 'Classic Pique Cotton Polo Shirt (L)',
    sku: 'MC-101-POLO-NVY-L',
    qty: 2,
    memoCode: 'MEMO-SABBIR-VIP',
    courier: 'Pathao',
    status: 'DISPATCHED',
    amount: 1900,
    fraudRatio: 91,
  },
  {
    id: 'ORD-9043',
    merchantCode: 'MC-101',
    date: '28 Oct 2026, 09:15 AM',
    isoDate: '2026-10-28',
    periodBucket: 'WEEK',
    customer: 'Kamrul Islam',
    phone: '01900112000',
    address: 'Chawkbazar, Chattogram',
    city: 'Chattogram',
    items: 'Raw Selvedge Denim Jacket (L)',
    sku: 'MC-101-JKT-RAW-L',
    qty: 1,
    memoCode: 'MEMO-DARAZ-BD',
    courier: 'Steadfast',
    status: 'ALLOCATED',
    amount: 2450,
    fraudRatio: 84,
  },
  {
    id: 'ORD-9044',
    merchantCode: 'MC-101',
    date: '26 Oct 2026, 03:30 PM',
    isoDate: '2026-10-26',
    periodBucket: 'WEEK',
    customer: 'Mahmudul Hasan',
    phone: '01711445566',
    address: 'Block C, Bashundhara R/A, Dhaka',
    city: 'Dhaka',
    items: 'Classic Pique Cotton Polo Shirt (L)',
    sku: 'MC-101-POLO-NVY-L',
    qty: 1,
    memoCode: 'MEMO-DARAZ-BD',
    courier: 'Steadfast',
    status: 'DISPATCHED',
    amount: 950,
    fraudRatio: 95,
  },
  {
    id: 'ORD-9045',
    merchantCode: 'MC-101',
    date: '15 Oct 2026, 04:40 PM',
    isoDate: '2026-10-15',
    periodBucket: '1M',
    customer: 'Rafiqul Bari',
    phone: '01744556677',
    address: 'Zindabazar, Sylhet',
    city: 'Sylhet',
    items: 'Heavyweight Winter Fleece Hoodie (XL)',
    sku: 'MC-101-HOODIE-BLK-XL',
    qty: 2,
    memoCode: 'MEMO-DARAZ-BD',
    courier: 'RedX',
    status: 'DELIVERED',
    amount: 3300,
    fraudRatio: 97,
  },
  {
    id: 'ORD-9046',
    merchantCode: 'MC-101',
    date: '10 Oct 2026, 02:10 PM',
    isoDate: '2026-10-10',
    periodBucket: '1M',
    customer: 'Sadia Afrin',
    phone: '01622334411',
    address: 'Mirpur-10, Dhaka',
    city: 'Dhaka',
    items: 'Minimalist Leather Crossbody Bag',
    sku: 'MC-101-BAG-BRN-OS',
    qty: 1,
    memoCode: 'MEMO-SABBIR-VIP',
    courier: 'Pathao',
    status: 'PICKING',
    amount: 1850,
    fraudRatio: 88,
  },
  {
    id: 'ORD-9047',
    merchantCode: 'MC-101',
    date: '12 Sep 2026, 01:20 PM',
    isoDate: '2026-09-12',
    periodBucket: '3M',
    customer: 'Tariq Anam',
    phone: '01812998877',
    address: 'Khulshi, Chattogram',
    city: 'Chattogram',
    items: 'Raw Selvedge Denim Jacket (L)',
    sku: 'MC-101-JKT-RAW-L',
    qty: 1,
    memoCode: 'MEMO-DARAZ-BD',
    courier: 'Steadfast',
    status: 'DELIVERED',
    amount: 2450,
    fraudRatio: 93,
  },
  {
    id: 'ORD-9048',
    merchantCode: 'MC-101',
    date: '25 Aug 2026, 06:15 PM',
    isoDate: '2026-08-25',
    periodBucket: '3M',
    customer: 'Sharmeen Akter',
    phone: '01914223344',
    address: 'Wari, Dhaka',
    city: 'Dhaka',
    items: 'Heavyweight Winter Fleece Hoodie (XL)',
    sku: 'MC-101-HOODIE-BLK-XL',
    qty: 1,
    memoCode: 'MEMO-SABBIR-VIP',
    courier: 'Pathao',
    status: 'DELIVERED',
    amount: 1650,
    fraudRatio: 96,
  },
  {
    id: 'ORD-9049',
    merchantCode: 'MC-101',
    date: '18 Jun 2026, 11:00 AM',
    isoDate: '2026-06-18',
    periodBucket: '6M',
    customer: 'Ashraful Alam',
    phone: '01733221100',
    address: 'Boalia, Rajshahi',
    city: 'Rajshahi',
    items: 'Classic Pique Cotton Polo Shirt (L)',
    sku: 'MC-101-POLO-NVY-L',
    qty: 2,
    memoCode: 'MEMO-DARAZ-BD',
    courier: 'Steadfast',
    status: 'DELIVERED',
    amount: 1900,
    fraudRatio: 92,
  },
  {
    id: 'ORD-9052',
    merchantCode: 'MC-101',
    date: '04 Mar 2026, 05:00 PM',
    isoDate: '2026-03-04',
    periodBucket: '1Y',
    customer: 'Rezaul Karim',
    phone: '01552334455',
    address: 'Sonadanga, Khulna',
    city: 'Khulna',
    items: 'Raw Selvedge Denim Jacket (L)',
    sku: 'MC-101-JKT-RAW-L',
    qty: 1,
    memoCode: 'MEMO-DARAZ-BD',
    courier: 'RedX',
    status: 'DELIVERED',
    amount: 2450,
    fraudRatio: 90,
  },
  {
    id: 'ORD-9053',
    merchantCode: 'MC-101',
    date: '14 Sep 2025, 02:30 PM',
    isoDate: '2025-09-14',
    periodBucket: 'ALL',
    customer: 'Habibur Rahman',
    phone: '01788997766',
    address: 'Sector 11, Uttara, Dhaka',
    city: 'Dhaka',
    items: 'Heavyweight Winter Fleece Hoodie (XL)',
    sku: 'MC-101-HOODIE-BLK-XL',
    qty: 2,
    memoCode: 'MEMO-SABBIR-VIP',
    courier: 'Steadfast',
    status: 'DELIVERED',
    amount: 3300,
    fraudRatio: 98,
  },

  // ===================== MC-102 (Urban Threads BD) =====================
  {
    id: 'ORD-9050',
    merchantCode: 'MC-102',
    date: '02 Nov 2026, 12:10 PM',
    isoDate: '2026-11-02',
    periodBucket: 'DAY',
    customer: 'Farhan Sadik',
    phone: '01755667788',
    address: 'Banani Road 11, Dhaka',
    city: 'Dhaka',
    items: 'Oversized Drop-Shoulder Graphic Tee',
    sku: 'MC-102-DROPTEE-WHT-M',
    qty: 3,
    memoCode: 'MEMO-URBAN-MAIN',
    courier: 'Steadfast',
    status: 'PACKED',
    amount: 2370,
    fraudRatio: 96,
  },
  {
    id: 'ORD-9051',
    merchantCode: 'MC-102',
    date: '27 Oct 2026, 05:30 PM',
    isoDate: '2026-10-27',
    periodBucket: 'WEEK',
    customer: 'Imran Hossain',
    phone: '01833445566',
    address: 'Agrabad, Chattogram',
    city: 'Chattogram',
    items: 'Cargo Tactical Jogger Pants (32)',
    sku: 'MC-102-CARGO-OLV-32',
    qty: 1,
    memoCode: 'MEMO-URBAN-MAIN',
    courier: 'Pathao',
    status: 'DISPATCHED',
    amount: 1350,
    fraudRatio: 92,
  },
  {
    id: 'ORD-9054',
    merchantCode: 'MC-102',
    date: '14 Oct 2026, 04:15 PM',
    isoDate: '2026-10-14',
    periodBucket: '1M',
    customer: 'Nayeem Islam',
    phone: '01677889922',
    address: 'Moghbazar, Dhaka',
    city: 'Dhaka',
    items: 'Oversized Drop-Shoulder Graphic Tee',
    sku: 'MC-102-DROPTEE-WHT-M',
    qty: 2,
    memoCode: 'MEMO-URBAN-MAIN',
    courier: 'Steadfast',
    status: 'DELIVERED',
    amount: 1580,
    fraudRatio: 95,
  },
  {
    id: 'ORD-9055',
    merchantCode: 'MC-102',
    date: '20 Aug 2026, 01:45 PM',
    isoDate: '2026-08-20',
    periodBucket: '3M',
    customer: 'Rubel Mia',
    phone: '01922334466',
    address: 'Savar, Dhaka',
    city: 'Dhaka',
    items: 'Cargo Tactical Jogger Pants (32)',
    sku: 'MC-102-CARGO-OLV-32',
    qty: 1,
    memoCode: 'MEMO-URBAN-MAIN',
    courier: 'Pathao',
    status: 'DELIVERED',
    amount: 1350,
    fraudRatio: 91,
  },
  {
    id: 'ORD-9056',
    merchantCode: 'MC-102',
    date: '11 Feb 2026, 03:10 PM',
    isoDate: '2026-02-11',
    periodBucket: '1Y',
    customer: 'Sohel Rana',
    phone: '01799887711',
    address: 'Bogra Sadar',
    city: 'Bogra',
    items: 'Oversized Drop-Shoulder Graphic Tee',
    sku: 'MC-102-DROPTEE-WHT-M',
    qty: 2,
    memoCode: 'MEMO-URBAN-MAIN',
    courier: 'RedX',
    status: 'DELIVERED',
    amount: 1580,
    fraudRatio: 94,
  },

  // ===================== MC-103 (Apex Footwear Hub) =====================
  {
    id: 'ORD-9061',
    merchantCode: 'MC-103',
    date: '02 Nov 2026, 01:00 PM',
    isoDate: '2026-11-02',
    periodBucket: 'DAY',
    customer: 'Mehedi Hasan',
    phone: '01688990011',
    address: 'Mirpur DOHS, Road 4, Dhaka',
    city: 'Dhaka',
    items: 'Genuine Suede Chelsea Boots (42)',
    sku: 'MC-103-BOOT-TAN-42',
    qty: 1,
    memoCode: 'MEMO-APEX-DIRECT',
    courier: 'Pathao',
    status: 'DISPATCHED',
    amount: 3200,
    fraudRatio: 89,
  },
  {
    id: 'ORD-9062',
    merchantCode: 'MC-103',
    date: '19 Oct 2026, 11:40 AM',
    isoDate: '2026-10-19',
    periodBucket: '1M',
    customer: 'Zahid Hasan',
    phone: '01766554433',
    address: 'Gulshan-1, Dhaka',
    city: 'Dhaka',
    items: 'Ultralight Running Sneakers (41)',
    sku: 'MC-103-RUN-GRY-41',
    qty: 1,
    memoCode: 'MEMO-APEX-DIRECT',
    courier: 'Steadfast',
    status: 'DELIVERED',
    amount: 2150,
    fraudRatio: 97,
  },
];

const ALL_MEMOS: MerchantMemoItem[] = [
  {
    id: 'memo-1',
    merchantCode: 'MC-101',
    code: 'MEMO-DARAZ-BD',
    resellerName: "Sabbir's Reseller Hub BD",
    brandColor: '#10b981',
    phone: '+880 1712-345678',
    address: 'Plot 22, Banani, Dhaka-1213',
    terms: 'ডেলিভারি ম্যানের সামনে পণ্য চেক করে নিন। ৭ দিনের মধ্যে এক্সচেঞ্জ সুবিধা।',
    isDefault: true,
  },
  {
    id: 'memo-2',
    merchantCode: 'MC-101',
    code: 'MEMO-SABBIR-VIP',
    resellerName: 'Luxury Attire Club (White-Label)',
    brandColor: '#6366f1',
    phone: '+880 1811-998877',
    address: 'Gulshan-2 Circle, Dhaka',
    terms: 'আনবক্সিং ভিডিও ছাড়া কোনো রিটার্ন ক্লেম গ্রহণযোগ্য নয়।',
    isDefault: false,
  },
  {
    id: 'memo-3',
    merchantCode: 'MC-102',
    code: 'MEMO-URBAN-MAIN',
    resellerName: 'Urban Threads Official',
    brandColor: '#8b5cf6',
    phone: '+880 1819-554433',
    address: 'Sector 7, Uttara, Dhaka',
    terms: 'Exchange available within 7 days with tag intact.',
    isDefault: true,
  },
  {
    id: 'memo-4',
    merchantCode: 'MC-103',
    code: 'MEMO-APEX-DIRECT',
    resellerName: 'Apex Footwear Direct',
    brandColor: '#f59e0b',
    phone: '+880 1912-334455',
    address: 'Tejgaon Industrial Area, Dhaka',
    terms: '30 Days sole warranty included with this thermal memo.',
    isDefault: true,
  },
];

const STORAGE_KEY = 'fulfillio_merchants_directory_v2';

const resizeAvatar = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export interface MerchantDirectoryManagerProps {
  onNavigateTab?: (tabName: any) => void;
  resetTrigger?: number;
}

export function MerchantDirectoryManager({
  onNavigateTab,
  resetTrigger = 0,
}: MerchantDirectoryManagerProps) {
  const [merchants, setMerchants] = useState<MerchantRecord[]>(MERCHANTS_DATA);
  const [productsList, setProductsList] = useState<MerchantProductItem[]>(ALL_PRODUCTS);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<MerchantSubTab>('profile');

  // Load persisted merchants from localStorage on initial client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMerchants(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load merchants from localStorage', e);
    }
  }, []);

  // Whenever sidebar "Merchant List" is clicked, resetTrigger increments -> return to Merchant List view!
  useEffect(() => {
    if (resetTrigger > 0) {
      setSelectedMerchantId(null);
      setIsEditingProfile(false);
    }
  }, [resetTrigger]);

  // Directory Search & Filter
  const [merchantSearch, setMerchantSearch] = useState('');
  const [merchantStatusFilter, setMerchantStatusFilter] = useState<
    'ALL' | 'Active' | 'Pending' | 'Suspended'
  >('ALL');

  // Product Tab Filters, View Mode (List Default vs Grid) & Add Product Modal
  const [productViewMode, setProductViewMode] = useState<'list' | 'grid'>('list');
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState<string>('ALL');
  const [productStockFilter, setProductStockFilter] = useState<
    'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'
  >('ALL');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<MerchantProductItem['category']>('Apparel');
  const [newProdBaseSku, setNewProdBaseSku] = useState('');
  const [newProdColor, setNewProdColor] = useState('');
  const [newProdSize, setNewProdSize] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('25');
  const [newProdBin, setNewProdBin] = useState('A-01-02');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');

  // Order & Overview Synchronized Filters (Status, 7-Range Period, Start/End Date Range, Search)
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [orderPeriodFilter, setOrderPeriodFilter] = useState<OrderPeriodFilter>('ALL');
  const [orderStartDate, setOrderStartDate] = useState<string>('');
  const [orderEndDate, setOrderEndDate] = useState<string>('');

  // Toast & Modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isChequePreviewOpen, setIsChequePreviewOpen] = useState(false);
  const [previewMemoTemplate, setPreviewMemoTemplate] = useState<MerchantMemoItem | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (previewMemoTemplate) {
      document.body.classList.add('printing-single-invoice');
    } else {
      document.body.classList.remove('printing-single-invoice');
    }
    return () => {
      document.body.classList.remove('printing-single-invoice');
    };
  }, [previewMemoTemplate]);

  // Edit Profile Mode & Form Fields
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editStoreName, setEditStoreName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDeliveryArea, setEditDeliveryArea] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const selectedMerchant = useMemo(
    () => merchants.find((m) => m.id === selectedMerchantId) || null,
    [merchants, selectedMerchantId],
  );

  // Check if any field in Store Info has been modified compared to saved merchant record
  const hasProfileChanges = useMemo(() => {
    if (!selectedMerchant) return false;
    return (
      editStoreName.trim() !== selectedMerchant.storeName ||
      editOwnerName.trim() !== selectedMerchant.ownerName ||
      editEmail.trim() !== selectedMerchant.email ||
      editPhone.trim() !== selectedMerchant.phone ||
      editLocation.trim() !== selectedMerchant.location ||
      editDeliveryArea.trim() !== selectedMerchant.deliveryArea ||
      editAvatarUrl !== (selectedMerchant.avatarUrl || '')
    );
  }, [
    selectedMerchant,
    editStoreName,
    editOwnerName,
    editEmail,
    editPhone,
    editLocation,
    editDeliveryArea,
    editAvatarUrl,
  ]);

  const handleOpenMerchantProfile = (
    merchant: MerchantRecord,
    defaultSubTab: MerchantSubTab = 'overview',
  ) => {
    setSelectedMerchantId(merchant.id);
    setActiveSubTab(defaultSubTab);
    setIsEditingProfile(false);
    setEditStoreName(merchant.storeName);
    setEditOwnerName(merchant.ownerName);
    setEditEmail(merchant.email);
    setEditPhone(merchant.phone);
    setEditLocation(merchant.location);
    setEditDeliveryArea(merchant.deliveryArea);
    setEditAvatarUrl(merchant.avatarUrl || '');
    // Reset product & order filters when switching merchants
    setProductSearch('');
    setProductCategory('ALL');
    setProductStockFilter('ALL');
    setOrderSearch('');
    setOrderStatusFilter('ALL');
    setOrderPeriodFilter('ALL');
    setOrderStartDate('');
    setOrderEndDate('');
  };

  const handleAdjustProductStock = (productId: string, delta: number) => {
    setProductsList((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;
        const nextStock = Math.max(0, item.stock + delta);
        return { ...item, stock: nextStock };
      }),
    );
  };

  const handleCreateMerchantProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant || !newProdTitle.trim()) return;
    const cleanBase = (newProdBaseSku.trim() || newProdTitle.trim().split(' ')[0] || 'ITEM')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const cleanColor = (newProdColor.trim() || 'STD')
      .toUpperCase()
      .slice(0, 3)
      .replace(/[^A-Z0-9]/g, '');
    const cleanSize = (newProdSize.trim() || 'OS').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const generatedSku = `${selectedMerchant.merchantCode}-${cleanBase}-${cleanColor}-${cleanSize}`;

    const created: MerchantProductItem = {
      id: `p-${Date.now()}`,
      merchantCode: selectedMerchant.merchantCode,
      title: newProdTitle.trim(),
      category: newProdCategory,
      sku: generatedSku,
      barcode: `894${Math.floor(1000000000 + Math.random() * 8999999999)}`,
      color: newProdColor.trim() || 'Standard',
      size: newProdSize.trim() || 'OS',
      price: Math.max(0, Number(newProdPrice) || 950),
      wholesalePrice: Math.round(Math.max(0, Number(newProdPrice) || 950) * 0.7),
      stock: Math.max(0, Number(newProdStock) || 0),
      reserved: 0,
      damaged: 0,
      bin: newProdBin || 'A-01-02',
      imageUrl:
        newProdImageUrl ||
        makeMerchantProductThumbnail(
          cleanBase.slice(0, 2) || 'PR',
          '#064e3b',
          '#0f172a',
          '#34d399',
        ),
    };

    setProductsList((prev) => [created, ...prev]);
    setNewProdTitle('');
    setNewProdBaseSku('');
    setNewProdColor('');
    setNewProdSize('');
    setNewProdPrice('');
    setNewProdStock('25');
    setNewProdBin('A-01-02');
    setNewProdImageUrl('');
    setIsAddProductOpen(false);
    triggerToast(`Added ${created.title} (${created.sku}) to ${selectedMerchant.storeName}`);
  };

  const handleCancelEditProfile = () => {
    if (!selectedMerchant) return;
    setEditStoreName(selectedMerchant.storeName);
    setEditOwnerName(selectedMerchant.ownerName);
    setEditEmail(selectedMerchant.email);
    setEditPhone(selectedMerchant.phone);
    setEditLocation(selectedMerchant.location);
    setEditDeliveryArea(selectedMerchant.deliveryArea);
    setEditAvatarUrl(selectedMerchant.avatarUrl || '');
    setIsEditingProfile(false);
  };

  const handleSaveMerchantSettings = () => {
    if (!selectedMerchant) return;
    const updated = merchants.map((m) =>
      m.id === selectedMerchant.id
        ? {
            ...m,
            storeName: editStoreName.trim() || m.storeName,
            ownerName: editOwnerName.trim() || m.ownerName,
            email: editEmail.trim() || m.email,
            phone: editPhone.trim() || m.phone,
            location: editLocation.trim() || m.location,
            deliveryArea: editDeliveryArea.trim() || m.deliveryArea,
            avatarUrl: editAvatarUrl || undefined,
          }
        : m,
    );
    setMerchants(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not persist to localStorage', err);
    }
    setIsEditingProfile(false);
    triggerToast(
      `Saved updated profile for ${editStoreName} (${selectedMerchant.merchantCode})`,
    );
  };

  // Handle Profile Picture Upload (Optimized & Persisted to localStorage)
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedMerchant) return;

    try {
      const dataUrl = await resizeAvatar(file);
      setEditAvatarUrl(dataUrl);
      const updated = merchants.map((m) =>
        m.id === selectedMerchant.id ? { ...m, avatarUrl: dataUrl } : m,
      );
      setMerchants(updated);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not persist to localStorage', err);
      }
      triggerToast(`Profile picture updated for ${selectedMerchant.storeName}!`);
    } catch (err) {
      triggerToast('Failed to process image. Please try another image.');
    }
  };

  const toggleMerchantStatus = (merchantId: string) => {
    const updated: MerchantRecord[] = merchants.map((m) => {
      if (m.id !== merchantId) return m;
      const nextStatus: 'Active' | 'Suspended' = m.status === 'Active' ? 'Suspended' : 'Active';
      triggerToast(`${m.storeName} (${m.merchantCode}) status changed to ${nextStatus}`);
      return { ...m, status: nextStatus, verified: nextStatus === 'Active' };
    });
    setMerchants(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not persist to localStorage', err);
    }
  };

  // Filtered Merchants for Directory List
  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      const matchesSearch =
        m.storeName.toLowerCase().includes(merchantSearch.toLowerCase()) ||
        m.ownerName.toLowerCase().includes(merchantSearch.toLowerCase()) ||
        m.merchantCode.toLowerCase().includes(merchantSearch.toLowerCase()) ||
        m.phone.includes(merchantSearch);
      const matchesStatus =
        merchantStatusFilter === 'ALL' || m.status === merchantStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [merchants, merchantSearch, merchantStatusFilter]);

  // All Products for Selected Merchant (Unfiltered for KPI cards)
  const allMerchantProducts = useMemo(() => {
    if (!selectedMerchant) return [];
    return productsList.filter((p) => p.merchantCode === selectedMerchant.merchantCode);
  }, [selectedMerchant, productsList]);

  // Scoped Products ONLY for the Selected Merchant (Filtered)
  const merchantProducts = useMemo(() => {
    return allMerchantProducts.filter((p) => {
      const matchesQuery =
        p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.barcode.includes(productSearch) ||
        p.color.toLowerCase().includes(productSearch.toLowerCase());

      const matchesCategory = productCategory === 'ALL' || p.category === productCategory;

      const matchesStock =
        productStockFilter === 'ALL'
          ? true
          : productStockFilter === 'OUT_OF_STOCK'
            ? p.stock === 0
            : productStockFilter === 'LOW_STOCK'
              ? p.stock > 0 && p.stock <= 10
              : p.stock > 10;

      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [allMerchantProducts, productSearch, productCategory, productStockFilter]);

  // Available unique dates with orders for this merchant (for quick 1-click date selection)
  const availableMerchantOrderDates = useMemo(() => {
    if (!selectedMerchant) return [];
    const map = new Map<string, { isoDate: string; label: string; count: number }>();
    ALL_ORDERS.filter((o) => o.merchantCode === selectedMerchant.merchantCode).forEach((ord) => {
      const existing = map.get(ord.isoDate);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(ord.isoDate, {
          isoDate: ord.isoDate,
          label: ord.date.split(',')[0] || ord.isoDate,
          count: 1,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.isoDate.localeCompare(a.isoDate));
  }, [selectedMerchant]);

  // Scoped Orders ONLY for the Selected Merchant + Synchronized 7-Range Period Filter (Day, Week, 1M, 3M, 6M, 1Y, All)
  const periodFilteredOrders = useMemo(() => {
    if (!selectedMerchant) return [];
    const maxRank = PERIOD_RANK[orderPeriodFilter];
    return ALL_ORDERS.filter(
      (ord) =>
        ord.merchantCode === selectedMerchant.merchantCode &&
        PERIOD_RANK[ord.periodBucket] <= maxRank,
    );
  }, [selectedMerchant, orderPeriodFilter]);

  // Orders Tab Filtered List:
  // If custom Date / Date Range (orderStartDate or orderEndDate) is active, search across ALL orders of this merchant
  // so a previous "Day" or "Week" quick pill never blocks the selected calendar date!
  const merchantOrders = useMemo(() => {
    if (!selectedMerchant) return [];
    const hasCustomDate = Boolean(orderStartDate || orderEndDate);
    const basePool = hasCustomDate
      ? ALL_ORDERS.filter((ord) => ord.merchantCode === selectedMerchant.merchantCode)
      : periodFilteredOrders;

    return basePool.filter((ord) => {
      const matchesSearch =
        !orderSearch.trim() ||
        ord.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        ord.customer.toLowerCase().includes(orderSearch.toLowerCase()) ||
        ord.phone.includes(orderSearch) ||
        ord.sku.toLowerCase().includes(orderSearch.toLowerCase());

      const matchesStatus =
        orderStatusFilter === 'ALL'
          ? true
          : orderStatusFilter === 'PENDING_FULFILLMENT'
            ? ord.status === 'ALLOCATED' || ord.status === 'PICKING' || ord.status === 'PACKED'
            : ord.status === orderStatusFilter;

      let matchesDate = true;
      if (orderStartDate && orderEndDate) {
        const minD = orderStartDate <= orderEndDate ? orderStartDate : orderEndDate;
        const maxD = orderStartDate <= orderEndDate ? orderEndDate : orderStartDate;
        matchesDate = ord.isoDate >= minD && ord.isoDate <= maxD;
      } else if (orderStartDate && !orderEndDate) {
        // If exact date exists in merchant's orders, match that exact day; otherwise match from that date onwards
        const hasExactMatch = basePool.some((o) => o.isoDate === orderStartDate);
        matchesDate = hasExactMatch
          ? ord.isoDate === orderStartDate
          : ord.isoDate >= orderStartDate;
      } else if (!orderStartDate && orderEndDate) {
        matchesDate = ord.isoDate <= orderEndDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [
    selectedMerchant,
    periodFilteredOrders,
    orderSearch,
    orderStatusFilter,
    orderStartDate,
    orderEndDate,
  ]);

  const merchantMemos = useMemo(() => {
    if (!selectedMerchant) return [];
    return ALL_MEMOS.filter((m) => m.merchantCode === selectedMerchant.merchantCode);
  }, [selectedMerchant]);

  // Dynamic Overview Orders KPI Metrics calculated directly from periodFilteredOrders (Single Source of Truth!)
  const overviewOrderStats = useMemo(() => {
    const totalOrders = periodFilteredOrders.length;
    const pendingFulfillment = periodFilteredOrders.filter(
      (o) => o.status === 'ALLOCATED' || o.status === 'PICKING' || o.status === 'PACKED',
    ).length;
    const inDelivery = periodFilteredOrders.filter((o) => o.status === 'DISPATCHED').length;
    const delivered = periodFilteredOrders.filter((o) => o.status === 'DELIVERED').length;

    const currentOption =
      PERIOD_FILTER_OPTIONS.find((opt) => opt.id === orderPeriodFilter) ||
      PERIOD_FILTER_OPTIONS[PERIOD_FILTER_OPTIONS.length - 1];

    const deliveryRate =
      totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;

    return {
      totalOrders,
      pendingFulfillment,
      inDelivery,
      delivered,
      totalTrend: `+${Math.max(8, totalOrders * 2)}%`,
      deliveredTrend: `${deliveryRate}% rate`,
      periodLabel: currentOption.periodLabel,
    };
  }, [periodFilteredOrders, orderPeriodFilter]);

  // ============================================================================
  // VIEW 1: MERCHANT LIST (CLASSIC LIST / TABLE VIEW AS BEFORE)
  // ============================================================================
  if (!selectedMerchant) {
    return (
      <div className="space-y-6">
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Merchant List</h1>
            <p className="text-sm text-slate-400">
              Inspect verified merchant profiles, auto-assigned Merchant Codes, payout bank accounts, and active products.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                placeholder="Search store, MC-101, owner..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={merchantStatusFilter}
              onChange={(e: any) => setMerchantStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Status ({merchants.length})</option>
              <option value="Active">Active (Approved)</option>
              <option value="Pending">Pending Review</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Quick Summary KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs uppercase font-semibold text-slate-400">Total Registered</span>
            <div className="text-xl sm:text-2xl font-bold mt-1 text-slate-100">{merchants.length} Stores</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs uppercase font-semibold text-slate-400">Active (Approved)</span>
            <div className="text-xl sm:text-2xl font-bold mt-1 text-emerald-400">
              {merchants.filter((m) => m.status === 'Active').length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs uppercase font-semibold text-slate-400">Pending Review</span>
            <div className="text-xl sm:text-2xl font-bold mt-1 text-amber-400">
              {merchants.filter((m) => m.status === 'Pending').length}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs uppercase font-semibold text-slate-400">Total Active SKUs</span>
            <div className="text-xl sm:text-2xl font-bold mt-1 text-emerald-400">
              {productsList.length} SKUs
            </div>
          </div>
        </div>

        {/* Merchant List View Table (Classic List View) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
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
              {filteredMerchants.map((m) => {
                const prodCount = productsList.filter(
                  (p) => p.merchantCode === m.merchantCode,
                ).length;

                return (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {m.avatarUrl ? (
                          <img
                            src={m.avatarUrl}
                            alt={m.storeName}
                            className="h-10 w-10 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div
                            className={`h-10 w-10 rounded-xl bg-gradient-to-br ${m.avatarBg} flex items-center justify-center text-white font-bold text-xs shrink-0`}
                          >
                            {m.avatarInitials}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 font-mono text-xs font-bold border border-indigo-800/80">
                              {m.merchantCode}
                            </span>
                            <span className="font-semibold text-slate-100">{m.storeName}</span>
                            {m.verified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </div>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            {m.location}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-xs text-slate-200 font-medium">{m.ownerName}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{m.phone}</div>
                      <div className="text-xs text-slate-500 font-mono">{m.email}</div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                        <Landmark className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{m.payoutAccount.provider}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        A/C: ••••{m.payoutAccount.accountNumber.slice(-4)}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono">
                        bKash: {m.payoutAccount.bkashNumber}
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          m.status === 'Active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : m.status === 'Pending'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {m.status === 'Active' ? 'APPROVED' : m.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="p-4 text-center font-bold text-slate-200 font-mono">
                      {prodCount}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenMerchantProfile(m, 'profile')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-indigo-400" />
                          <span>View Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleMerchantStatus(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            m.status === 'Active'
                              ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {m.status === 'Active' ? 'Suspend' : 'Approve'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: SELECTED MERCHANT DRILL-DOWN VIEW (5 TABS: PROFILE, MEMO, ORDERS, PRODUCTS, PAYOUT INFO)
  // ============================================================================
  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Profile Picture Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePictureUpload}
        className="hidden"
      />

      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setSelectedMerchantId(null);
            setIsEditingProfile(false);
          }}
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Merchant List</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Quick Switch Merchant:</span>
          <select
            value={selectedMerchant.id}
            onChange={(e) => {
              const target = merchants.find((m) => m.id === e.target.value);
              if (target) handleOpenMerchantProfile(target, activeSubTab);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.merchantCode} — {m.storeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MERCHANT HERO IDENTITY CARD + 6 HORIZONTAL TABS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Profile Picture with Upload Option */}
            <div className="relative group shrink-0">
              {selectedMerchant.avatarUrl || editAvatarUrl ? (
                <img
                  src={editAvatarUrl || selectedMerchant.avatarUrl}
                  alt={selectedMerchant.storeName}
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg border-2 border-emerald-500/40"
                />
              ) : (
                <div
                  className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${selectedMerchant.avatarBg} flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-white/10`}
                >
                  {selectedMerchant.avatarInitials}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Profile Picture"
                className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-slate-900 transition-transform hover:scale-105"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {selectedMerchant.storeName}
                </h1>
                {selectedMerchant.verified && (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                )}
              </div>

              <p className="text-xs text-slate-400">
                Owned by <strong className="text-slate-200">{selectedMerchant.ownerName}</strong> •
                ID:{' '}
                <span className="font-mono font-bold text-emerald-400">
                  {selectedMerchant.merchantCode}
                </span>
              </p>

              {/* Status & Verification Pills */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {selectedMerchant.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Verified Seller
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedMerchant.deliveryArea}
                </span>
              </div>

              {/* Contact Row */}
              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" /> {selectedMerchant.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {selectedMerchant.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {selectedMerchant.location}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 SUB-NAVIGATION TABS: Overview | Merchant Profile | Memo | Orders | Products | Payout Info */}
        <div className="px-6 border-t border-slate-800/90 bg-slate-950/40 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'overview'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'profile'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Merchant Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('memo')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'memo'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Memo ({merchantMemos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('orders')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'orders'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Orders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('products')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'products'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products ({allMerchantProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('payout')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeSubTab === 'payout'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payout Info</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB 0: OVERVIEW (Fulfillio Emerald + Slate Brand Theme + Monotonic 7-Range Filter)
         ===================================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* ORDERS OVERVIEW SECTION (Fulfillio Emerald + Slate Brand Palette) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
            {/* Top Header + Synchronized Day / Week / 1M / 3M / 6M / 1Y / All Time Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Orders</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage, track, and fulfill your customer orders.
                  </p>
                </div>
              </div>

              {/* Synchronized 7-Range Timeframe Filter Buttons: Day, Week, 1 Month, 3 Months, 6 Months, 1 Year, All Time */}
              <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-950 p-1.5 border border-slate-800 self-start lg:self-auto">
                {PERIOD_FILTER_OPTIONS.map((item) => {
                  const active = orderPeriodFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setOrderPeriodFilter(item.id);
                        setOrderStartDate('');
                        setOrderEndDate('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        active
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4 KPI Cards Grid (Total Orders | Pending Fulfillment | In Delivery | Delivered) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Orders */}
              <div
                onClick={() => {
                  setOrderStatusFilter('ALL');
                  setActiveSubTab('orders');
                }}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-emerald-500/40 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">Total Orders</span>
                    <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                      {overviewOrderStats.totalOrders}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-400">
                    {overviewOrderStats.totalTrend}
                  </span>
                  <span className="text-slate-500">{overviewOrderStats.periodLabel}</span>
                </div>
              </div>

              {/* Card 2: Pending Fulfillment */}
              <div
                onClick={() => {
                  setOrderStatusFilter('PENDING_FULFILLMENT');
                  setActiveSubTab('orders');
                }}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-emerald-500/40 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">
                      Pending Fulfillment
                    </span>
                    <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                      {overviewOrderStats.pendingFulfillment}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">need attention</span>
                </div>
              </div>

              {/* Card 3: In Delivery */}
              <div
                onClick={() => {
                  setOrderStatusFilter('DISPATCHED');
                  setActiveSubTab('orders');
                }}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-emerald-500/40 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">In Delivery</span>
                    <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                      {overviewOrderStats.inDelivery}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500">on the way</span>
                </div>
              </div>

              {/* Card 4: Delivered */}
              <div
                onClick={() => {
                  setOrderStatusFilter('DELIVERED');
                  setActiveSubTab('orders');
                }}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-emerald-500/40 p-5 flex flex-col justify-between gap-5 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">Delivered</span>
                    <div className="text-3xl font-extrabold text-white mt-1.5 tracking-tight">
                      {overviewOrderStats.delivered}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-400">
                    {overviewOrderStats.deliveredTrend}
                  </span>
                  <span className="text-slate-500">successfully completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Store Highlights & Recent Activity Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Store Snapshot */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Store Identity & Coverage</h3>
                  <p className="text-xs text-slate-400">Registered merchant profile attributes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('profile')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <span>Edit Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Merchant Code</span>
                  <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                    {selectedMerchant.merchantCode}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Store Name</span>
                  <span className="font-bold text-white">{selectedMerchant.storeName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Owner Name</span>
                  <span className="font-bold text-slate-200">{selectedMerchant.ownerName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Primary Contact</span>
                  <span className="font-mono text-slate-200">{selectedMerchant.phone}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Location</span>
                  <span className="text-slate-200">{selectedMerchant.location}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 font-medium">Delivery Area</span>
                  <span className="text-slate-300">{selectedMerchant.deliveryArea}</span>
                </div>
              </div>
            </div>

            {/* Right: Recent Orders Preview */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Orders</h3>
                  <p className="text-xs text-slate-400">
                    Latest orders placed by {selectedMerchant.storeName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('orders')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <span>View All Orders</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {merchantOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No orders recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {merchantOrders.slice(0, 4).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{ord.id}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                            {ord.memoCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {ord.customer} • {ord.items}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400 block">
                          ৳ {ord.amount.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 1: MERCHANT PROFILE
          - Redundant Business Info & Settings sidebar removed
          - Store Information box includes Owner Name input, Edit Profile toggle,
            and Save Changes button ONLY when edited & dirty!
         ===================================================================== */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
            {/* Store Information Header + Edit Profile / Save Changes Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Store Information</h3>
                  <p className="text-xs text-slate-400">
                    Click &ldquo;Edit Profile&rdquo; to update store details, owner name, or delivery preferences.
                  </p>
                </div>
              </div>

              {/* Edit Profile & Conditional Save Changes Buttons inside Store Info Box */}
              <div className="flex items-center gap-2.5">
                {!isEditingProfile ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEditProfile}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>

                    {/* Save Changes appears ONLY when Edit Profile is active AND changes were made */}
                    {hasProfileChanges && (
                      <button
                        type="button"
                        onClick={handleSaveMerchantSettings}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save changes</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Store Info Input Grid (Includes Store Name, Owner Name, Email, Phone, Location, Delivery Area) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Store name
                </label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    isEditingProfile
                      ? 'border-slate-700 bg-slate-950 focus:border-emerald-500'
                      : 'border-slate-800/80 bg-slate-950/50 text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Owner name
                </label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    isEditingProfile
                      ? 'border-slate-700 bg-slate-950 focus:border-emerald-500'
                      : 'border-slate-800/80 bg-slate-950/50 text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Business email
                </label>
                <input
                  type="email"
                  disabled={!isEditingProfile}
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    isEditingProfile
                      ? 'border-slate-700 bg-slate-950 focus:border-emerald-500'
                      : 'border-slate-800/80 bg-slate-950/50 text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Phone number
                </label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    isEditingProfile
                      ? 'border-slate-700 bg-slate-950 focus:border-emerald-500'
                      : 'border-slate-800/80 bg-slate-950/50 text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Business location
                </label>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    isEditingProfile
                      ? 'border-slate-700 bg-slate-950 focus:border-emerald-500'
                      : 'border-slate-800/80 bg-slate-950/50 text-slate-300 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Default delivery area
                </label>
                <div className="relative">
                  <Truck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    disabled={!isEditingProfile}
                    value={editDeliveryArea}
                    onChange={(e) => setEditDeliveryArea(e.target.value)}
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                      isEditingProfile
                        ? 'border-slate-700 bg-slate-950 focus:border-emerald-500'
                        : 'border-slate-800/80 bg-slate-950/50 text-slate-300 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: MEMO (Scoped to Selected Merchant)
          - Button named "View Template" and opens safe in-place Modal Preview!
         ===================================================================== */}
      {activeSubTab === 'memo' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                Memo / Invoice Templates for {selectedMerchant.storeName} (
                {selectedMerchant.merchantCode})
              </h3>
              <p className="text-xs text-slate-400">
                4x6&quot; White-Label thermal memo / invoice codes configured by this merchant.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('memo-designer')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Open Memo Designer</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {merchantMemos.map((memo) => (
              <div
                key={memo.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {memo.code}
                    </span>
                    {memo.isDefault && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Default 4x6 Slip
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white pt-1">{memo.resellerName}</h4>
                  <p className="text-xs text-slate-400">{memo.address}</p>
                  <p className="text-xs font-mono text-slate-300">Hotline: {memo.phone}</p>
                  <p className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    {memo.terms}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <span className="text-[11px] text-slate-500">Format: 4x6&quot; Thermal Sticker</span>
                  <button
                    type="button"
                    onClick={() => setPreviewMemoTemplate(memo)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Template</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: ORDERS (Scoped to Selected Merchant)
          - Synchronized 7-Range Time Filter (Day, Week, 1M, 3M, 6M, 1Y, All Time)
          - Fixed Date / Date Range Picker + Quick Order Date Selector
         ===================================================================== */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {/* Orders Filter Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Orders Placed by {selectedMerchant.storeName} ({selectedMerchant.merchantCode})
                </h3>
                <p className="text-xs text-slate-400">
                  Filter orders by quick timeframe, exact order date, or custom date range.
                </p>
              </div>

              {/* Synchronized 7-Range Timeframe Quick Filter Pills */}
              <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-slate-950 p-1.5 border border-slate-800 self-start lg:self-auto">
                {PERIOD_FILTER_OPTIONS.map((period) => {
                  const isCustomDateActive = Boolean(orderStartDate || orderEndDate);
                  const isActive = !isCustomDateActive && orderPeriodFilter === period.id;
                  return (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => {
                        setOrderPeriodFilter(period.id);
                        setOrderStartDate('');
                        setOrderEndDate('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {period.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search + Status + Quick Date Dropdown + From/To Date Range Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search Order ID, Customer, Phone, SKU..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING_FULFILLMENT">Pending Fulfillment</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="PICKING">Picking</option>
                <option value="PACKED">Packed</option>
                <option value="DISPATCHED">In Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              {/* Quick Select Existing Order Date */}
              <select
                value={
                  orderStartDate && orderStartDate === orderEndDate ? orderStartDate : ''
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setOrderStartDate('');
                    setOrderEndDate('');
                  } else {
                    setOrderStartDate(val);
                    setOrderEndDate(val);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="">Jump to Order Date...</option>
                {availableMerchantOrderDates.map((d) => (
                  <option key={d.isoDate} value={d.isoDate}>
                    {d.label} ({d.count} {d.count === 1 ? 'order' : 'orders'})
                  </option>
                ))}
              </select>

              {/* From Date -> To Date Range Picker (Dark Mode Calendar Enabled) */}
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-400 font-medium">From:</span>
                <input
                  type="date"
                  style={{ colorScheme: 'dark' }}
                  value={orderStartDate}
                  onChange={(e) => setOrderStartDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
                />
                <span className="text-slate-600">→</span>
                <span className="text-[11px] text-slate-400 font-medium">To:</span>
                <input
                  type="date"
                  style={{ colorScheme: 'dark' }}
                  value={orderEndDate}
                  onChange={(e) => setOrderEndDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
                />
              </div>

              {(orderSearch ||
                orderStatusFilter !== 'ALL' ||
                orderPeriodFilter !== 'ALL' ||
                orderStartDate ||
                orderEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderSearch('');
                    setOrderStatusFilter('ALL');
                    setOrderPeriodFilter('ALL');
                    setOrderStartDate('');
                    setOrderEndDate('');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Active Filter Result Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/50 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <span>
                  Showing <strong className="text-white">{merchantOrders.length}</strong> orders
                </span>
                {(orderStartDate || orderEndDate) && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                    Date Filter: {orderStartDate || 'Start'} → {orderEndDate || orderStartDate}
                  </span>
                )}
              </div>
              <div className="font-mono text-slate-300">
                Total Filtered COD:{' '}
                <strong className="text-emerald-400">
                  ৳ {merchantOrders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase border-b border-slate-800">
                <tr>
                  <th className="p-4">Order ID & Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Product & 2-Part SKU</th>
                  <th className="p-4">Memo Code</th>
                  <th className="p-4">Courier</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">COD Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {merchantOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center space-y-2">
                      <div className="text-xs font-semibold text-slate-300">
                        No orders found for the selected date or status filter.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderSearch('');
                          setOrderStatusFilter('ALL');
                          setOrderPeriodFilter('ALL');
                          setOrderStartDate('');
                          setOrderEndDate('');
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600/30"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Show All Orders</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  merchantOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-xs font-bold text-white block">
                          {ord.id}
                        </span>
                        <span className="text-[11px] text-slate-400">{ord.date}</span>
                      </td>
                      <td className="p-4 space-y-0.5">
                        <div className="font-bold text-slate-200">{ord.customer}</div>
                        <div className="text-xs text-slate-400 font-mono">{ord.phone}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-white">{ord.items}</div>
                        <div className="text-[11px] font-mono text-emerald-400">
                          {ord.sku} (Qty: {ord.qty})
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-800">
                          {ord.memoCode}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-slate-300">{ord.courier}</td>
                      <td className="p-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : ord.status === 'CANCELLED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-white">
                        ৳ {ord.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 4: PRODUCTS (Redesigned Clean UI — Fulfillio Emerald + Slate Theme)
          - 4 Interactive Stock Summary Cards
          - Clean 2-Part SKU Table & Card View (No Bin / Damaged / EAN Clutter)
          - Live Stock Adjustment (- / +) & Add Product Modal
         ===================================================================== */}
      {activeSubTab === 'products' && (
        <div className="space-y-5">
          {/* 4 Interactive Product Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setProductStockFilter('ALL')}
              className={`text-left rounded-2xl border p-4 transition-all ${
                productStockFilter === 'ALL'
                  ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Products</span>
                <Package className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white mt-1.5 font-mono">
                {allMerchantProducts.length} SKUs
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {allMerchantProducts.reduce((sum, p) => sum + p.stock, 0)} total units in warehouse
              </span>
            </button>

            <button
              type="button"
              onClick={() => setProductStockFilter('IN_STOCK')}
              className={`text-left rounded-2xl border p-4 transition-all ${
                productStockFilter === 'IN_STOCK'
                  ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">In Stock (&gt;10)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1.5 font-mono">
                {allMerchantProducts.filter((p) => p.stock > 10).length}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Ready for instant pick</span>
            </button>

            <button
              type="button"
              onClick={() => setProductStockFilter('LOW_STOCK')}
              className={`text-left rounded-2xl border p-4 transition-all ${
                productStockFilter === 'LOW_STOCK'
                  ? 'border-amber-500/60 bg-amber-950/20 shadow-md'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Low Stock (1–10)</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1.5 font-mono">
                {allMerchantProducts.filter((p) => p.stock > 0 && p.stock <= 10).length}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Needs restock soon</span>
            </button>

            <button
              type="button"
              onClick={() => setProductStockFilter('OUT_OF_STOCK')}
              className={`text-left rounded-2xl border p-4 transition-all ${
                productStockFilter === 'OUT_OF_STOCK'
                  ? 'border-rose-500/60 bg-rose-950/20 shadow-md'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Stock Out (0)</span>
                <X className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold text-rose-400 mt-1.5 font-mono">
                {allMerchantProducts.filter((p) => p.stock === 0).length}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Unavailable for orders</span>
            </button>
          </div>

          {/* Clean Products Filter & Action Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={`Search product or ${selectedMerchant.merchantCode} SKU...`}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Clean Category Pills */}
              <div className="inline-flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
                {(['ALL', 'Apparel', 'Footwear', 'Electronics'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProductCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      productCategory === cat
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Controls: Table/Cards View Switcher + Add Product Button */}
            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setProductViewMode('list')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    productViewMode === 'list'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductViewMode('grid')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    productViewMode === 'grid'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* EMPTY STATE */}
          {merchantProducts.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center space-y-3">
              <Package className="w-8 h-8 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">
                No products match your filter for {selectedMerchant.storeName}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setProductSearch('');
                  setProductCategory('ALL');
                  setProductStockFilter('ALL');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          ) : productViewMode === 'list' ? (
            /* ================= CLEAN TABLE VIEW (DEFAULT) ================= */
            <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-left text-sm">
                <thead className="bg-slate-950/90 text-slate-400 text-xs uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-4">Product & Image</th>
                    <th className="p-4">2-Part System SKU</th>
                    <th className="p-4">Bin Location</th>
                    <th className="p-4">Variant (Color / Size)</th>
                    <th className="p-4 text-right">Unit Price</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Quick Stock Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {merchantProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="h-11 w-11 rounded-xl object-cover border border-slate-700/80 shadow-sm shrink-0 bg-slate-950"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white">{prod.title}</div>
                            <span className="text-[11px] text-slate-400">{prod.category}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-emerald-400 border border-slate-800">
                          {prod.sku}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                          Bin: {prod.bin}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-200">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                            {prod.color}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-bold text-white">
                            {prod.size}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-white">
                        ৳ {prod.price.toLocaleString()}
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            prod.stock === 0
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : prod.stock <= 10
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {prod.stock === 0
                            ? 'Stock Out'
                            : prod.stock <= 10
                              ? 'Low Stock'
                              : 'In Stock'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleAdjustProductStock(prod.id, -1)}
                            className="h-7 w-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center transition-colors"
                            title="Decrease Stock (-1)"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-mono text-xs font-extrabold text-white">
                            {prod.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustProductStock(prod.id, 1)}
                            className="h-7 w-7 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center transition-colors"
                            title="Increase Stock (+1)"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ) : (
            /* ================= CLEAN CARD GRID VIEW ================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {merchantProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-emerald-500/40 p-5 flex flex-col justify-between gap-4 shadow-lg transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-950 text-emerald-400 border border-slate-800">
                        {prod.sku}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          prod.stock === 0
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : prod.stock <= 10
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {prod.stock === 0
                          ? 'Stock Out'
                          : prod.stock <= 10
                            ? 'Low Stock'
                            : 'In Stock'}
                      </span>
                    </div>

                    <div className="flex items-start gap-3.5">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          className="h-14 w-14 rounded-xl object-cover border border-slate-700/80 shadow-sm shrink-0 bg-slate-950"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {prod.category} • <span className="font-mono text-indigo-300">Bin {prod.bin}</span>
                        </span>
                        <h4 className="text-base font-bold text-white leading-snug mt-0.5">
                          {prod.title}
                        </h4>
                      </div>
                    </div>

                    {/* Clean Variant Pills */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                        Color: <strong className="text-white">{prod.color}</strong>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                        Size: <strong className="text-white">{prod.size}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Price + Live Stock Stepper */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 font-semibold block">
                        Unit Price
                      </span>
                      <span className="text-base font-black text-white font-mono">
                        ৳ {prod.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleAdjustProductStock(prod.id, -1)}
                        className="h-7 w-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-mono text-xs font-extrabold text-white">
                        {prod.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustProductStock(prod.id, 1)}
                        className="h-7 w-7 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ADD PRODUCT MODAL WITH AUTO 2-PART SKU GENERATOR */}
          <Modal
            isOpen={isAddProductOpen}
            onClose={() => setIsAddProductOpen(false)}
            title={`Add Product for ${selectedMerchant.storeName}`}
            subtitle={`Automatically generates a 2-Part System SKU with prefix ${selectedMerchant.merchantCode}`}
            size="md"
          >
            <form onSubmit={handleCreateMerchantProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  placeholder="e.g. Premium Cotton Oversized Tee"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e: any) => setNewProdCategory(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Apparel">Apparel</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Beauty">Beauty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Short SKU Code
                  </label>
                  <input
                    type="text"
                    value={newProdBaseSku}
                    onChange={(e) => setNewProdBaseSku(e.target.value)}
                    placeholder="e.g. TEE"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Color</label>
                  <input
                    type="text"
                    value={newProdColor}
                    onChange={(e) => setNewProdColor(e.target.value)}
                    placeholder="e.g. Black"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Size</label>
                  <input
                    type="text"
                    value={newProdSize}
                    onChange={(e) => setNewProdSize(e.target.value)}
                    placeholder="e.g. XL"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white uppercase focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Retail Price (৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="1250"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Initial Stock Qty *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Product Image Upload & Bin Location Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Assigned Warehouse Bin
                  </label>
                  <select
                    value={newProdBin}
                    onChange={(e) => setNewProdBin(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="A-01-02">Bin A-01-02 (Apparel Zone)</option>
                    <option value="A-01-04">Bin A-01-04 (Apparel Zone)</option>
                    <option value="A-02-01">Bin A-02-01 (Apparel Zone)</option>
                    <option value="B-01-03">Bin B-01-03 (Accessories)</option>
                    <option value="B-03-01">Bin B-03-01 (Fast Moving)</option>
                    <option value="C-01-01">Bin C-01-01 (Footwear Rack)</option>
                    <option value="D-01-01">Bin D-01-01 (Electronics Vault)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Product Image (Optional)
                  </label>
                  <label className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500/60 px-3 py-2 text-xs text-slate-300 cursor-pointer transition-colors">
                    <Camera className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{newProdImageUrl ? 'Image Selected ✓' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setNewProdImageUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Live 2-Part SKU Preview Box */}
              <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">Generated 2-Part SKU:</span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {selectedMerchant.merchantCode}-
                  {(newProdBaseSku.trim() || newProdTitle.trim().split(' ')[0] || 'ITEM')
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')}
                  -
                  {(newProdColor.trim() || 'STD')
                    .toUpperCase()
                    .slice(0, 3)
                    .replace(/[^A-Z0-9]/g, '')}
                  -{(newProdSize.trim() || 'OS').toUpperCase().replace(/[^A-Z0-9]/g, '')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                >
                  Save Product
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 5: PAYOUT INFO (Scoped to Selected Merchant)
         ===================================================================== */}
      {activeSubTab === 'payout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Default Payout Account ({selectedMerchant.merchantCode})
                </h3>
                <p className="text-xs text-slate-400">
                  Verified bank and mobile financial account for weekly COD disbursements.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {selectedMerchant.payoutAccount.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  BANK NAME
                </span>
                <span className="font-bold text-white mt-0.5 block">
                  {selectedMerchant.payoutAccount.provider}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  ACCOUNT HOLDER
                </span>
                <span className="font-bold text-white mt-0.5 block">
                  {selectedMerchant.payoutAccount.accountHolder}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  ACCOUNT NUMBER
                </span>
                <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
                  {selectedMerchant.payoutAccount.accountNumber}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  BRANCH & ROUTING NO
                </span>
                <span className="font-medium text-slate-200 mt-0.5 block">
                  {selectedMerchant.payoutAccount.branchName} (
                  {selectedMerchant.payoutAccount.routingNumber})
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  BKASH MERCHANT NUMBER
                </span>
                <span className="font-mono font-bold text-pink-400 mt-0.5 block">
                  {selectedMerchant.payoutAccount.bkashNumber}
                </span>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  DISBURSEMENT SCHEDULE
                </span>
                <span className="font-bold text-indigo-400 mt-0.5 block">
                  {selectedMerchant.payoutAccount.frequency}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsChequePreviewOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>View Verified Cheque Leaf</span>
              </button>
            </div>
          </div>

          {/* Payout Ledger Summary */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-emerald-950/60 to-slate-900 p-6 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Available COD Balance
              </span>
              <div className="text-3xl font-black text-white font-mono">
                ৳ {selectedMerchant.payoutAccount.availableBalance.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400">
                Net payable after 3PL Pick-Pack & Storage fee deductions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Last Disbursed Payout
              </span>
              <div className="text-2xl font-bold text-slate-200 font-mono">
                ৳ {selectedMerchant.payoutAccount.lastPayoutAmount.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500">
                Settled via BEFTN to {selectedMerchant.payoutAccount.provider}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* IN-PLACE MEMO TEMPLATE PREVIEW MODAL ("View Template" — No redirect to Merchant Dashboard!) */}
      <Modal
        isOpen={Boolean(previewMemoTemplate)}
        onClose={() => setPreviewMemoTemplate(null)}
        title={
          previewMemoTemplate
            ? `Memo Template Preview · ${previewMemoTemplate.code}`
            : 'Memo Template Preview'
        }
        subtitle={
          previewMemoTemplate
            ? `${previewMemoTemplate.resellerName} — 4x6" White-Label Thermal Slip`
            : ''
        }
        size="lg"
      >
        {previewMemoTemplate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">{previewMemoTemplate.resellerName}</span> •{' '}
                <span className="font-mono text-indigo-400">{previewMemoTemplate.code}</span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Template</span>
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto py-2">
              <UnifiedThermalSticker
                orderId="ORD-SAMPLE-4X6"
                memoCode={previewMemoTemplate.code}
                resellerName={previewMemoTemplate.resellerName}
                resellerPhone={previewMemoTemplate.phone}
                resellerAddress={previewMemoTemplate.address}
                brandColor={previewMemoTemplate.brandColor}
                footerTerms={previewMemoTemplate.terms}
                customerName="Sample Customer"
                customerPhone="01700-000000"
                customerAddress="House 14, Road 7, Sector 4, Uttara"
                city="Dhaka"
                codAmount={1650}
                courierProvider="STEADFAST"
                consignmentId="CN-849201"
                trackingCode="TRK-STE-849201"
                packagingType="POLY_SMALL"
                items={[
                  {
                    sku: `${selectedMerchant.merchantCode}-SAMPLE-SKU`,
                    title: 'Sample Fulfillio Warehouse Item',
                    color: 'BLACK',
                    size: 'XL',
                    qty: 1,
                    price: 1650,
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ISOLATED 4x6" PRINT MOUNT PORTALED TO DOCUMENT.BODY (Prints ONLY the Invoice!) */}
      {previewMemoTemplate &&
        typeof document !== 'undefined' &&
        createPortal(
          <div id="fulfillio-print-invoice-root" className="hidden">
            <UnifiedThermalSticker
              orderId="ORD-SAMPLE-4X6"
              memoCode={previewMemoTemplate.code}
              resellerName={previewMemoTemplate.resellerName}
              resellerPhone={previewMemoTemplate.phone}
              resellerAddress={previewMemoTemplate.address}
              brandColor={previewMemoTemplate.brandColor}
              footerTerms={previewMemoTemplate.terms}
              customerName="Sample Customer"
              customerPhone="01700-000000"
              customerAddress="House 14, Road 7, Sector 4, Uttara"
              city="Dhaka"
              codAmount={1650}
              courierProvider="STEADFAST"
              consignmentId="CN-849201"
              trackingCode="TRK-STE-849201"
              packagingType="POLY_SMALL"
              items={[
                {
                  sku: `${selectedMerchant.merchantCode}-SAMPLE-SKU`,
                  title: 'Sample Fulfillio Warehouse Item',
                  color: 'BLACK',
                  size: 'XL',
                  qty: 1,
                  price: 1650,
                },
              ]}
            />
          </div>,
          document.body,
        )}

      {/* VERIFIED CHEQUE LEAF MODAL */}
      <Modal
        isOpen={isChequePreviewOpen}
        onClose={() => setIsChequePreviewOpen(false)}
        title={`Verified Bank Cheque Leaf · ${selectedMerchant.storeName}`}
        subtitle={`${selectedMerchant.payoutAccount.provider} — A/C: ${selectedMerchant.payoutAccount.accountNumber}`}
        size="md"
      >
        <div className="rounded-xl border border-slate-700 p-6 flex flex-col justify-between h-56 relative overflow-hidden font-mono text-slate-800 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-bold text-sm block text-emerald-950">
                {selectedMerchant.payoutAccount.provider}
              </span>
              <span className="text-[10px] text-slate-600">
                {selectedMerchant.payoutAccount.branchName}
              </span>
            </div>
            <span className="text-xs font-bold text-slate-700">ACCOUNT PAYEE ONLY</span>
          </div>

          <div className="space-y-1.5 my-auto">
            <div className="border-b border-slate-400 pb-1 text-xs">
              Pay: <strong>{selectedMerchant.payoutAccount.accountHolder}</strong>
            </div>
            <div className="border-b border-slate-400 pb-1 text-xs">
              A/C No: <strong>{selectedMerchant.payoutAccount.accountNumber}</strong>
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-600 border-t border-slate-400 pt-2">
            <span>⑆{selectedMerchant.payoutAccount.routingNumber}⑆</span>
            <span className="font-bold text-emerald-800">FULFILLIO KYC VERIFIED</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
