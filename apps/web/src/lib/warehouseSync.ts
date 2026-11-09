import {
  MerchantAsnRecord,
  MerchantOrderItem,
  MerchantProductItem,
  MerchantProfileData,
  ResellerMemo,
} from '@/features/merchant/portal/types';
import { StockRequestItem } from '@/features/merchant/portal/products/types';
import {
  INITIAL_MERCHANT_ASNS,
  INITIAL_MERCHANT_MEMOS,
  INITIAL_MERCHANT_ORDERS,
  INITIAL_MERCHANT_PRODUCTS,
  INITIAL_MERCHANT_PROFILE,
  INITIAL_STOCK_REQUESTS,
  STORAGE_KEY_MERCHANT_ASNS,
  STORAGE_KEY_MERCHANT_MEMOS,
  STORAGE_KEY_MERCHANT_ORDERS,
  STORAGE_KEY_MERCHANT_PRODUCTS,
  STORAGE_KEY_MERCHANT_PROFILE,
  STORAGE_KEY_STOCK_REQUESTS,
} from '@/features/merchant/portal/mockData';
import { MerchantMemoItem } from '@/features/admin/merchants/types';
import { ALL_MEMOS, STORAGE_KEY as STORAGE_KEY_MERCHANTS_DIRECTORY } from '@/features/admin/merchants/mockData';

export const STORAGE_KEY_ADMIN_MEMOS = 'fulfillio_admin_memos_v1';
import { WarehouseProductItem } from '@/features/admin/products/types';
import {
  INITIAL_PRODUCTS,
  PRESET_THUMBNAILS,
  STORAGE_KEY_PRODUCTS,
} from '@/features/admin/products/mockData';
import { CourierPartner, OrderStage, WarehousePipelineOrder } from '@/features/admin/orders/types';
import { INITIAL_PIPELINE_ORDERS, STORAGE_KEY_ORDERS } from '@/features/admin/orders/mockData';
import { MerchantRecord } from '@/features/admin/merchants/types';
import { MERCHANTS_DATA, STORAGE_KEY as STORAGE_KEY_MERCHANT_DIRECTORY } from '@/features/admin/merchants/mockData';

export const STORAGE_KEY_MERCHANT_CREDENTIALS = 'fulfillio_merchant_credentials_v1';
export const STORAGE_KEY_ACTIVE_MERCHANT_SESSION = 'fulfillio_active_merchant_session_v1';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface MerchantCredentialRecord {
  email: string;
  password: string;
  merchantCode: string;
  storeName: string;
  ownerName: string;
  phone: string;
  category?: string;
  orderVolume?: string;
  storeUrl?: string;
}

export interface ActiveMerchantSession {
  merchantCode: string;
  email: string;
  storeName: string;
  ownerName: string;
}

export interface RegisterMerchantInput {
  fullName: string;
  storeName: string;
  phone: string;
  email: string;
  category: string;
  orderVolume: string;
  storeUrl?: string;
  password: string;
}

const AVATAR_GRADIENTS = [
  'from-orange-500 to-amber-600',
  'from-emerald-600 to-teal-700',
  'from-indigo-600 to-violet-700',
  'from-sky-600 to-blue-700',
  'from-rose-600 to-pink-700',
];

const DEFAULT_SEED_MERCHANT_PRODUCT_IDS = new Set(INITIAL_MERCHANT_PRODUCTS.map((p) => p.id));
const DEFAULT_SEED_MERCHANT_ORDER_IDS = new Set(
  INITIAL_MERCHANT_ORDERS.map((o) => o.orderNumber || o.id)
);

/**
 * Scoped localStorage keys per merchantCode.
 * MC-101 uses the base keys for backward compatibility with existing demo data;
 * every other merchant (e.g. MC-106) gets its own isolated keys.
 */
export function getMerchantProfileKey(merchantCode = 'MC-101'): string {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  return code === 'MC-101'
    ? STORAGE_KEY_MERCHANT_PROFILE
    : `${STORAGE_KEY_MERCHANT_PROFILE}_${code}`;
}

export function getMerchantProductsKey(merchantCode = 'MC-101'): string {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  return code === 'MC-101'
    ? STORAGE_KEY_MERCHANT_PRODUCTS
    : `${STORAGE_KEY_MERCHANT_PRODUCTS}_${code}`;
}

export function getMerchantOrdersKey(merchantCode = 'MC-101'): string {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  return code === 'MC-101'
    ? STORAGE_KEY_MERCHANT_ORDERS
    : `${STORAGE_KEY_MERCHANT_ORDERS}_${code}`;
}

export function getMerchantMemosKey(merchantCode = 'MC-101'): string {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  return code === 'MC-101'
    ? STORAGE_KEY_MERCHANT_MEMOS
    : `${STORAGE_KEY_MERCHANT_MEMOS}_${code}`;
}

export function getMerchantAsnsKey(merchantCode = 'MC-101'): string {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  return code === 'MC-101'
    ? STORAGE_KEY_MERCHANT_ASNS
    : `${STORAGE_KEY_MERCHANT_ASNS}_${code}`;
}

export function getMerchantStockRequestsKey(merchantCode = 'MC-101'): string {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  return code === 'MC-101'
    ? STORAGE_KEY_STOCK_REQUESTS
    : `${STORAGE_KEY_STOCK_REQUESTS}_${code}`;
}

export function getStoredMerchantDirectory(): MerchantRecord[] {
  if (typeof window === 'undefined') return MERCHANTS_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MERCHANT_DIRECTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return MERCHANTS_DATA;
}

function getStoredMerchantCredentials(): MerchantCredentialRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MERCHANT_CREDENTIALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function getActiveMerchantSession(): ActiveMerchantSession {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_MERCHANT_SESSION);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.merchantCode) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return {
    merchantCode: INITIAL_MERCHANT_PROFILE.merchantCode,
    email: INITIAL_MERCHANT_PROFILE.email,
    storeName: INITIAL_MERCHANT_PROFILE.storeName,
    ownerName: INITIAL_MERCHANT_PROFILE.ownerName,
  };
}

export function setActiveMerchantSession(session: ActiveMerchantSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_MERCHANT_SESSION, JSON.stringify(session));
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AuthSession' } })
    );
  } catch {
    // ignore
  }
}

export function clearActiveMerchantSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_MERCHANT_SESSION);
    localStorage.removeItem('fulfillio_token');
    localStorage.removeItem('token');
  } catch {
    // ignore
  }
}

export function buildProfileFromMerchantRecord(record: MerchantRecord): MerchantProfileData {
  return {
    merchantCode: record.merchantCode,
    ownerName: record.ownerName,
    storeName: record.storeName,
    email: record.email,
    phone: record.phone,
    location: record.location || 'Dhaka, Bangladesh',
    status: record.status,
    verified: record.verified,
    logoUrl: record.avatarUrl,
    payoutMethod: 'Bank Transfer / bKash',
    payoutSchedule: record.payoutAccount.frequency || 'Weekly (Every Friday)',
    payoutAccount: {
      provider: record.payoutAccount.provider,
      accountHolder: record.payoutAccount.accountHolder,
      accountNumber: record.payoutAccount.accountNumber,
      branchName: record.payoutAccount.branchName,
      routingNumber: record.payoutAccount.routingNumber,
      bkashMerchantNumber: record.payoutAccount.bkashNumber,
      chequeLeafUrl: '',
      frequency: 'Weekly',
      status: record.payoutAccount.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING_REVIEW',
    },
    kycData: {
      tradeLicenseNo: '',
      nidNumber: '',
      verificationStatus: record.verified ? 'VERIFIED' : 'PENDING_REVIEW',
    },
    socialChannels: [],
  };
}

export function getStoredMerchantProfileForCode(merchantCode: string): MerchantProfileData {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(getMerchantProfileKey(code));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.merchantCode) return parsed;
      }
    } catch {
      // ignore
    }
  }
  const dirMatch = getStoredMerchantDirectory().find(
    (m) => m.merchantCode.toUpperCase() === code
  );
  if (dirMatch && code !== 'MC-101') {
    return buildProfileFromMerchantRecord(dirMatch);
  }
  return INITIAL_MERCHANT_PROFILE;
}

export function getStoredMerchantProductsForCode(merchantCode = 'MC-101'): MerchantProductItem[] {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  if (typeof window === 'undefined') {
    return code === 'MC-101' ? INITIAL_MERCHANT_PRODUCTS : [];
  }
  try {
    const raw = localStorage.getItem(getMerchantProductsKey(code));
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return code === 'MC-101' ? INITIAL_MERCHANT_PRODUCTS : [];
}

export function getStoredMerchantOrdersForCode(merchantCode = 'MC-101'): MerchantOrderItem[] {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  if (typeof window === 'undefined') {
    return code === 'MC-101' ? INITIAL_MERCHANT_ORDERS : [];
  }
  try {
    const raw = localStorage.getItem(getMerchantOrdersKey(code));
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return code === 'MC-101' ? INITIAL_MERCHANT_ORDERS : [];
}

export function getStoredMerchantMemosForCode(
  merchantCode = 'MC-101',
  profile?: MerchantProfileData
): ResellerMemo[] {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  if (typeof window === 'undefined') {
    return code === 'MC-101' ? INITIAL_MERCHANT_MEMOS : [];
  }
  try {
    const raw = localStorage.getItem(getMerchantMemosKey(code));
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  if (code === 'MC-101') return INITIAL_MERCHANT_MEMOS;
  const prof = profile || getStoredMerchantProfileForCode(code);
  return [
    {
      id: `m-${code.toLowerCase()}-1`,
      code: 'MEMO-DEFAULT',
      name: `${prof.storeName} Official Slip`,
      resellerName: prof.storeName,
      phone: prof.phone || '01700-000000',
      address: prof.location || 'Dhaka, Bangladesh',
      note: 'Thank you for shopping with us!',
      accentColor: '#10b981',
      paperSize: 'THERMAL_4X6',
      isDefault: true,
      created: 'Today',
    },
  ];
}

export function getStoredMerchantAsnsForCode(merchantCode = 'MC-101'): MerchantAsnRecord[] {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  if (typeof window === 'undefined') {
    return code === 'MC-101' ? INITIAL_MERCHANT_ASNS : [];
  }
  try {
    const raw = localStorage.getItem(getMerchantAsnsKey(code));
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return code === 'MC-101' ? INITIAL_MERCHANT_ASNS : [];
}

export function getStoredMerchantStockRequestsForCode(
  merchantCode = 'MC-101'
): StockRequestItem[] {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  if (typeof window === 'undefined') {
    return code === 'MC-101' ? INITIAL_STOCK_REQUESTS : [];
  }
  try {
    const raw = localStorage.getItem(getMerchantStockRequestsKey(code));
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return code === 'MC-101' ? INITIAL_STOCK_REQUESTS : [];
}

/**
 * Register a new Merchant Account:
 * 1. Calls Backend API `/auth/register` if running on localhost
 * 2. Adds Merchant to Admin Merchant Directory (`Pending` approval status)
 * 3. Creates isolated empty workspace (`0` products, `0` orders) for the new merchant
 */
export async function registerNewMerchantAccount(
  input: RegisterMerchantInput
): Promise<{ ok: boolean; error?: string; merchant?: MerchantRecord }> {
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanStoreName = input.storeName.trim();
  const cleanOwnerName = input.fullName.trim();
  const cleanPhone = input.phone.trim();

  if (!cleanEmail || !cleanStoreName || !cleanOwnerName || !input.password) {
    return { ok: false, error: 'অনুগ্রহ করে সকল আবশ্যক তথ্য পূরণ করুন।' };
  }

  const directory = getStoredMerchantDirectory();
  const credentials = getStoredMerchantCredentials();

  // Check duplicate email
  if (
    directory.some((m) => m.email.trim().toLowerCase() === cleanEmail) ||
    credentials.some((c) => c.email.trim().toLowerCase() === cleanEmail)
  ) {
    return {
      ok: false,
      error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি মার্চেন্ট একাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন।',
    };
  }

  // Try calling backend API if available (localhost)
  let backendMerchantCode: string | null = null;
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: cleanStoreName,
        ownerName: cleanOwnerName,
        email: cleanEmail,
        phone: cleanPhone,
        password: input.password,
      }),
    });
    if (res.status === 409) {
      return {
        ok: false,
        error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি মার্চেন্ট একাউন্ট খোলা হয়েছে।',
      };
    }
    if (res.ok) {
      const data = await res.json();
      if (data?.merchantCode) {
        backendMerchantCode = data.merchantCode;
      }
    }
  } catch {
    // Backend offline or on Vercel static deployment; continue with local storage engine
  }

  // Determine next sequential Merchant Code (MC-106, MC-107, ...)
  const maxNum = directory.reduce((max, m) => {
    const num = parseInt(m.merchantCode.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 105);
  const nextNum = maxNum + 1;
  const merchantCode = backendMerchantCode || `MC-${nextNum}`;

  const initials =
    cleanStoreName
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'MC';

  const avatarBg = AVATAR_GRADIENTS[nextNum % AVATAR_GRADIENTS.length];
  const joinedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const newMerchantRecord: MerchantRecord = {
    id: `m-${nextNum}`,
    merchantCode,
    storeName: cleanStoreName,
    ownerName: cleanOwnerName,
    email: input.email.trim(),
    phone: cleanPhone,
    location: 'Dhaka, Bangladesh',
    deliveryArea: 'Nationwide Bangladesh',
    status: 'Pending',
    verified: false,
    joinedDate,
    avatarInitials: initials,
    avatarBg,
    payoutAccount: {
      provider: 'Pending Bank Setup',
      accountHolder: cleanOwnerName,
      accountNumber: '0000000000000',
      branchName: 'Dhaka Main Branch',
      routingNumber: '000000000',
      bkashNumber: cleanPhone,
      frequency: 'Weekly (Every Friday)',
      status: 'PENDING_REVIEW',
      availableBalance: 0,
      lastPayoutAmount: 0,
    },
  };

  if (typeof window !== 'undefined') {
    try {
      // 1. Prepend to Admin Merchant Directory
      const updatedDirectory = [newMerchantRecord, ...directory];
      localStorage.setItem(STORAGE_KEY_MERCHANT_DIRECTORY, JSON.stringify(updatedDirectory));

      // 2. Save Credentials
      const newCred: MerchantCredentialRecord = {
        email: cleanEmail,
        password: input.password,
        merchantCode,
        storeName: cleanStoreName,
        ownerName: cleanOwnerName,
        phone: cleanPhone,
        category: input.category,
        orderVolume: input.orderVolume,
        storeUrl: input.storeUrl?.trim(),
      };
      localStorage.setItem(
        STORAGE_KEY_MERCHANT_CREDENTIALS,
        JSON.stringify([newCred, ...credentials])
      );

      // 3. Initialize isolated Merchant Portal profile & empty workspaces (0 products, 0 orders)
      const initialProfile: MerchantProfileData = {
        ...buildProfileFromMerchantRecord(newMerchantRecord),
        socialChannels: input.storeUrl?.trim()
          ? [{ id: '1', platform: 'Facebook', url: input.storeUrl.trim() }]
          : [],
      };
      localStorage.setItem(getMerchantProfileKey(merchantCode), JSON.stringify(initialProfile));
      localStorage.setItem(getMerchantProductsKey(merchantCode), JSON.stringify([]));
      localStorage.setItem(getMerchantOrdersKey(merchantCode), JSON.stringify([]));
      localStorage.setItem(
        getMerchantMemosKey(merchantCode),
        JSON.stringify(getStoredMerchantMemosForCode(merchantCode, initialProfile))
      );
      localStorage.setItem(getMerchantAsnsKey(merchantCode), JSON.stringify([]));
      localStorage.setItem(getMerchantStockRequestsKey(merchantCode), JSON.stringify([]));

      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantRegister' } })
      );
    } catch {
      // ignore storage errors
    }
  }

  return { ok: true, merchant: newMerchantRecord };
}

/**
 * Authenticate a Merchant Login:
 * - Verifies email & password
 * - Checks if the merchant is approved (`Active`) in Admin Merchant Directory
 * - Blocks `Pending` or `Suspended` merchants with clear guidance
 * - Sets the active merchant session so `/merchant` loads that merchant's isolated portal
 */
export async function authenticateMerchantLogin(
  emailInput: string,
  passwordInput: string
): Promise<{
  ok: boolean;
  error?: string;
  merchantCode?: string;
  merchant?: MerchantRecord;
}> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const directory = getStoredMerchantDirectory();
  const credentials = getStoredMerchantCredentials();

  // Check if user is logging in with the default demo preset (`merchant@urbanthreads.com` or `sabbir@example.com`)
  const isDefaultDemoPreset =
    cleanEmail === 'merchant@urbanthreads.com' || cleanEmail === 'sabbir@example.com';

  let matchedMerchant = directory.find(
    (m) =>
      m.email.trim().toLowerCase() === cleanEmail ||
      m.merchantCode.trim().toLowerCase() === cleanEmail
  );

  if (!matchedMerchant && isDefaultDemoPreset) {
    matchedMerchant = directory.find((m) => m.merchantCode === 'MC-101') || MERCHANTS_DATA[0];
  }

  // Also check credentials if not found in directory yet
  const matchedCred = credentials.find(
    (c) =>
      c.email.trim().toLowerCase() === cleanEmail ||
      (matchedMerchant && c.merchantCode === matchedMerchant.merchantCode)
  );

  if (!matchedMerchant && !matchedCred) {
    // Try backend login if running on localhost
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: passwordInput }),
      });
      if (res.status === 403) {
        return {
          ok: false,
          error:
            'আপনার একাউন্টটি এখনো এডমিন অনুমোদনের অপেক্ষায় আছে (Pending Approval)। এডমিন প্যানেল থেকে Approve করার পর লগইন করতে পারবেন।',
        };
      }
      if (res.ok) {
        const data = await res.json();
        if (data?.accessToken) {
          localStorage.setItem('fulfillio_token', data.accessToken);
        }
        const mCode = data?.user?.merchantCode || 'MC-101';
        const session: ActiveMerchantSession = {
          merchantCode: mCode,
          email: data?.user?.email || cleanEmail,
          storeName: data?.user?.businessName || data?.user?.name || 'Merchant Store',
          ownerName: data?.user?.name || 'Merchant Owner',
        };
        setActiveMerchantSession(session);
        return { ok: true, merchantCode: mCode };
      }
    } catch {
      // Backend offline
    }

    return {
      ok: false,
      error:
        'এই ইমেইলে কোনো মার্চেন্ট একাউন্ট পাওয়া যায়নি। নতুন মার্চেন্ট একাউন্ট খুলতে নিচের "এখানে একাউন্ট খুলুন" অপশনে যান।',
    };
  }

  // Verify password if credential exists for this merchant
  if (matchedCred && matchedCred.password !== passwordInput) {
    return {
      ok: false,
      error: 'পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।',
    };
  }

  // Check Admin Approval / Account Status
  const currentStatus = matchedMerchant?.status || 'Pending';
  const storeLabel = matchedMerchant?.storeName || matchedCred?.storeName || 'আপনার স্টোর';
  const codeLabel = matchedMerchant?.merchantCode || matchedCred?.merchantCode || '';

  if (currentStatus === 'Pending') {
    return {
      ok: false,
      error: `"${storeLabel}" (${codeLabel}) একাউন্টটি এখনো এডমিন অনুমোদনের অপেক্ষায় আছে (Pending Approval)। Admin Panel -> Merchants থেকে Approve করার পর লগইন করতে পারবেন।`,
    };
  }

  if (currentStatus === 'Suspended') {
    return {
      ok: false,
      error: `"${storeLabel}" (${codeLabel}) একাউন্টটি বর্তমানে স্থগিত (Suspended) রয়েছে। Admin Panel থেকে Active করার পর লগইন করতে পারবেন।`,
    };
  }

  // Optional: also authenticate against localhost backend to obtain JWT if running locally
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: passwordInput }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.accessToken) {
        localStorage.setItem('fulfillio_token', data.accessToken);
      }
    }
  } catch {
    // ignore when backend is not running
  }

  const finalMerchantCode = matchedMerchant?.merchantCode || matchedCred?.merchantCode || 'MC-101';
  const finalEmail = matchedMerchant?.email || matchedCred?.email || cleanEmail;
  const finalStoreName =
    matchedMerchant?.storeName || matchedCred?.storeName || INITIAL_MERCHANT_PROFILE.storeName;
  const finalOwnerName =
    matchedMerchant?.ownerName || matchedCred?.ownerName || INITIAL_MERCHANT_PROFILE.ownerName;

  // Ensure profile in storage reflects Active & Verified state
  if (matchedMerchant && finalMerchantCode !== 'MC-101') {
    const existingProf = getStoredMerchantProfileForCode(finalMerchantCode);
    const updatedProf: MerchantProfileData = {
      ...existingProf,
      merchantCode: finalMerchantCode,
      storeName: finalStoreName,
      ownerName: finalOwnerName,
      email: finalEmail,
      phone: matchedMerchant.phone || existingProf.phone,
      status: 'Active',
      verified: true,
    };
    try {
      localStorage.setItem(getMerchantProfileKey(finalMerchantCode), JSON.stringify(updatedProf));
    } catch {
      // ignore
    }
  }

  setActiveMerchantSession({
    merchantCode: finalMerchantCode,
    email: finalEmail,
    storeName: finalStoreName,
    ownerName: finalOwnerName,
  });

  return { ok: true, merchantCode: finalMerchantCode, merchant: matchedMerchant };
}

/**
 * Sync Admin Merchant Directory updates (Approve / Suspend / Profile Edit) to per-merchant profiles.
 */
export function syncMerchantDirectoryToProfiles(merchants: MerchantRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MERCHANT_DIRECTORY, JSON.stringify(merchants));
    for (const m of merchants) {
      const key = getMerchantProfileKey(m.merchantCode);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: MerchantProfileData = JSON.parse(raw);
        const updated: MerchantProfileData = {
          ...parsed,
          storeName: m.storeName,
          ownerName: m.ownerName,
          email: m.email,
          phone: m.phone,
          location: m.location || parsed.location,
          status: m.status,
          verified: m.verified,
          logoUrl: m.avatarUrl || parsed.logoUrl,
        };
        localStorage.setItem(key, JSON.stringify(updated));
      } else if (m.merchantCode !== 'MC-101') {
        localStorage.setItem(key, JSON.stringify(buildProfileFromMerchantRecord(m)));
      }
    }
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'AdminMerchantDirectory' } })
    );
  } catch {
    // ignore
  }
}

function mapCategoryToAdmin(
  category?: string,
  productType?: string
): WarehouseProductItem['category'] {
  const raw = `${category || ''} ${productType || ''}`.toLowerCase();
  if (raw.includes('electro') || raw.includes('gadget') || raw.includes('audio')) {
    return 'Electronics';
  }
  if (raw.includes('foot') || raw.includes('shoe') || raw.includes('boot') || raw.includes('sneaker')) {
    return 'Footwear';
  }
  if (
    raw.includes('access') ||
    raw.includes('bag') ||
    raw.includes('watch') ||
    raw.includes('beauty') ||
    raw.includes('grocery')
  ) {
    return 'Accessories';
  }
  return 'Apparel';
}

function normalizeFullSku(sku: string, merchantCode: string): { shortSku: string; fullSku: string } {
  const cleanCode = (merchantCode || 'MC-101').trim().toUpperCase();
  const cleanSku = (sku || 'SKU-001').trim().toUpperCase();
  if (cleanSku.startsWith(`${cleanCode}-`)) {
    return {
      shortSku: cleanSku.slice(cleanCode.length + 1),
      fullSku: cleanSku,
    };
  }
  return {
    shortSku: cleanSku,
    fullSku: `${cleanCode}-${cleanSku}`,
  };
}

export function convertMerchantProductToWarehouse(
  item: MerchantProductItem,
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE,
  status: WarehouseProductItem['status'] = 'PENDING_APPROVAL'
): WarehouseProductItem {
  const merchantCode = profile.merchantCode || 'MC-101';
  const merchantName = profile.storeName || "Sabbir's Store";
  const { shortSku, fullSku } = normalizeFullSku(item.sku, merchantCode);

  const variantParts = (item.variantLabel || '').split('/').map((s) => s.trim());
  const color =
    item.colors?.[0]?.name ||
    item.variantsList?.[0]?.color ||
    variantParts[0] ||
    'Standard';
  const size =
    item.sizes?.[0] ||
    item.variantsList?.[0]?.size ||
    variantParts[1] ||
    'Standard';
  const binCode =
    item.bin &&
    item.bin !== 'Unassigned' &&
    item.bin !== 'PENDING' &&
    item.bin !== 'Pending Approval' &&
    item.bin !== 'Assigned on intake'
      ? item.bin.split('-').slice(0, 3).join('-') || 'A-01-02'
      : 'A-01-02';

  return {
    id: item.id,
    title: item.title,
    category: mapCategoryToAdmin(item.category, item.productType),
    merchantCode,
    merchantName,
    shortSku,
    fullSku,
    color,
    size,
    binCode,
    stock: item.stock,
    price: item.price,
    status,
    submittedAt: 'Just now',
    imageUrl: item.imageUrl || item.colors?.[0]?.imageUrl || PRESET_THUMBNAILS[0].url,
    barcode: item.barcode,
    description: item.description,
    colors: item.colors,
    sizes: item.sizes,
    variantsList: item.variantsList,
  };
}

function getStoredAdminProducts(): WarehouseProductItem[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_PRODUCTS;
}

function getStoredAdminOrders(): WarehousePipelineOrder[] {
  if (typeof window === 'undefined') return INITIAL_PIPELINE_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_PIPELINE_ORDERS;
}

function isMatchingProduct(
  merchantProd: MerchantProductItem,
  adminProd: WarehouseProductItem
): boolean {
  if (merchantProd.id === adminProd.id) return true;
  const mSku = (merchantProd.sku || '').toUpperCase();
  return (
    mSku === adminProd.fullSku.toUpperCase() ||
    mSku === adminProd.shortSku.toUpperCase() ||
    `${adminProd.merchantCode}-${mSku}`.toUpperCase() === adminProd.fullSku.toUpperCase()
  );
}

/**
 * Find the matching MerchantProductItem for an Admin WarehouseProductItem
 */
export function findMatchingMerchantProductForAdmin(
  adminProd: WarehouseProductItem
): MerchantProductItem | null {
  if (typeof window === 'undefined') return null;
  try {
    const merchantProducts = getStoredMerchantProductsForCode(adminProd.merchantCode || 'MC-101');
    return merchantProducts.find((mp) => isMatchingProduct(mp, adminProd)) || null;
  } catch {
    return null;
  }
}

/**
 * Get all real orders placed for a specific Admin WarehouseProductItem (from both Admin Pipeline Orders and Merchant Orders).
 */
export function getRealOrdersForAdminProduct(
  adminProd: WarehouseProductItem
): WarehousePipelineOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const allOrders = reconcileAdminOrdersWithMerchant(getStoredAdminOrders());
    const matchedMerchantProd = findMatchingMerchantProductForAdmin(adminProd);
    const fullSkuUpper = adminProd.fullSku.toUpperCase();
    const shortSkuUpper = adminProd.shortSku.toUpperCase();
    const merchantSkuUpper = (matchedMerchantProd?.sku || '').toUpperCase();
    const titleLower = adminProd.title.trim().toLowerCase();

    return allOrders.filter((order) => {
      const orderSkuUpper = (order.sku || '').toUpperCase();
      if (
        orderSkuUpper === fullSkuUpper ||
        orderSkuUpper === shortSkuUpper ||
        (merchantSkuUpper && orderSkuUpper === merchantSkuUpper) ||
        orderSkuUpper.startsWith(`${fullSkuUpper}-`) ||
        (shortSkuUpper && orderSkuUpper.endsWith(`-${shortSkuUpper}`))
      ) {
        return true;
      }

      const orderTitleLower = (order.productTitle || '').trim().toLowerCase();
      if (
        titleLower &&
        orderTitleLower &&
        (orderTitleLower === titleLower || orderTitleLower.includes(titleLower))
      ) {
        return true;
      }

      return false;
    });
  } catch {
    return [];
  }
}

/**
 * Merchant -> Admin: When Merchant uploads new products, add them to Admin's Pending Approval queue.
 */
export function syncMerchantProductsAddedToAdmin(
  newItems: MerchantProductItem[],
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
): void {
  if (typeof window === 'undefined' || newItems.length === 0) return;
  try {
    const currentAdmin = getStoredAdminProducts();
    const mappedNew = newItems
      .filter((item) => !currentAdmin.some((ap) => isMatchingProduct(item, ap)))
      .map((item) => convertMerchantProductToWarehouse(item, profile, 'PENDING_APPROVAL'));

    if (mappedNew.length === 0) return;

    const updatedAdmin = [...mappedNew, ...currentAdmin];
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedAdmin));
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore storage errors
  }
}

/**
 * Merchant -> Admin: When Merchant edits or adjusts stock of a product, sync to Admin catalog.
 */
export function syncMerchantProductUpdatedToAdmin(
  updatedItem: MerchantProductItem,
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
): void {
  if (typeof window === 'undefined') return;
  try {
    const currentAdmin = getStoredAdminProducts();
    let matched = false;
    const nextAdmin = currentAdmin.map((ap) => {
      if (!isMatchingProduct(updatedItem, ap)) return ap;
      matched = true;
      const { shortSku, fullSku } = normalizeFullSku(updatedItem.sku, ap.merchantCode);
      const variantParts = (updatedItem.variantLabel || '').split('/').map((s) => s.trim());
      const color =
        updatedItem.colors?.[0]?.name ||
        updatedItem.variantsList?.[0]?.color ||
        variantParts[0] ||
        ap.color;
      const size =
        updatedItem.sizes?.[0] ||
        updatedItem.variantsList?.[0]?.size ||
        variantParts[1] ||
        ap.size;

      return {
        ...ap,
        title: updatedItem.title,
        shortSku,
        fullSku,
        color,
        size,
        stock: updatedItem.stock,
        price: updatedItem.price,
        imageUrl: updatedItem.imageUrl || ap.imageUrl,
        barcode: updatedItem.barcode || ap.barcode,
        description: updatedItem.description ?? ap.description,
        colors: updatedItem.colors ?? ap.colors,
        sizes: updatedItem.sizes ?? ap.sizes,
        variantsList: updatedItem.variantsList ?? ap.variantsList,
      };
    });

    if (!matched) {
      nextAdmin.unshift(
        convertMerchantProductToWarehouse(updatedItem, profile, 'PENDING_APPROVAL')
      );
    }

    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdmin));
    // Clear cached variant matrix override if merchant updated variants
    localStorage.removeItem(`fulfillio_variants_${updatedItem.id}`);
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore
  }
}

/**
 * Merchant -> Admin: When Merchant deletes product(s), remove them from Admin catalog as well.
 */
export function syncMerchantProductsDeletedToAdmin(deletedProducts: MerchantProductItem[]): void {
  if (typeof window === 'undefined' || deletedProducts.length === 0) return;
  try {
    const currentAdmin = getStoredAdminProducts();
    const nextAdmin = currentAdmin.filter(
      (ap) => !deletedProducts.some((mp) => isMatchingProduct(mp, ap))
    );
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdmin));
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore
  }
}

/**
 * Admin -> Merchant: When Admin approves, updates bin/stock, adds, or deletes products, sync back to all Merchants.
 */
export function syncAdminProductsToMerchant(
  adminProducts: WarehouseProductItem[],
  deletedAdminProducts: WarehouseProductItem[] = []
): void {
  if (typeof window === 'undefined') return;
  try {
    const directory = getStoredMerchantDirectory();
    const merchantCodes = new Set<string>([
      'MC-101',
      ...directory.map((m) => m.merchantCode.toUpperCase()),
      ...adminProducts.map((ap) => ap.merchantCode.toUpperCase()),
      ...deletedAdminProducts.map((ap) => ap.merchantCode.toUpperCase()),
    ]);

    for (const code of merchantCodes) {
      const storageKey = getMerchantProductsKey(code);
      const rawExisting = localStorage.getItem(storageKey);
      // Only initialize/touch non-MC-101 merchants if they have stored products or matching admin products
      if (
        code !== 'MC-101' &&
        rawExisting === null &&
        !adminProducts.some((ap) => ap.merchantCode.toUpperCase() === code)
      ) {
        continue;
      }

      let merchantProducts = getStoredMerchantProductsForCode(code);

      // 1. Remove any products deleted/rejected by Admin
      if (deletedAdminProducts.length > 0) {
        merchantProducts = merchantProducts.filter(
          (mp) => !deletedAdminProducts.some((delAp) => isMatchingProduct(mp, delAp))
        );
      }

      // 2. Update existing Merchant products from Admin products
      merchantProducts = merchantProducts.map((mp) => {
        const matchedAdmin = adminProducts.find((ap) => isMatchingProduct(mp, ap));
        if (!matchedAdmin) return mp;
        return {
          ...mp,
          title: matchedAdmin.title,
          stock: matchedAdmin.stock,
          price: matchedAdmin.price,
          variantsList: matchedAdmin.variantsList ?? mp.variantsList,
          bin: matchedAdmin.status === 'APPROVED' ? matchedAdmin.binCode : 'Pending Approval',
          status:
            matchedAdmin.status === 'APPROVED'
              ? ('PUBLISHED' as const)
              : ('DRAFT' as const),
        };
      });

      // 3. Add any new approved products created directly by Admin for this merchantCode
      const newFromAdmin = adminProducts.filter(
        (ap) =>
          ap.merchantCode.toUpperCase() === code &&
          ap.status === 'APPROVED' &&
          !INITIAL_PRODUCTS.some((seed) => seed.id === ap.id) &&
          !merchantProducts.some((mp) => isMatchingProduct(mp, ap))
      );

      if (newFromAdmin.length > 0) {
        const converted: MerchantProductItem[] = newFromAdmin.map((ap) => ({
          id: ap.id,
          title: ap.title,
          variantLabel: `${ap.color} / ${ap.size}`,
          category: ap.category,
          sku: ap.fullSku,
          barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          stock: ap.stock,
          reserved: 0,
          price: ap.price,
          bin: ap.binCode,
          status: 'PUBLISHED',
          totalOrders: 0,
          imageUrl: ap.imageUrl,
        }));
        merchantProducts = [...converted, ...merchantProducts];
      }

      localStorage.setItem(storageKey, JSON.stringify(merchantProducts));
    }
  } catch {
    // ignore
  }
}

/**
 * Reconcile any previously uploaded Merchant products (across all merchants) into Admin's product list on load.
 */
export function reconcileAdminProductsWithMerchant(
  adminProducts: WarehouseProductItem[]
): WarehouseProductItem[] {
  if (typeof window === 'undefined') return adminProducts;
  try {
    const directory = getStoredMerchantDirectory();
    const merchantCodes = new Set<string>([
      'MC-101',
      ...directory.map((m) => m.merchantCode.toUpperCase()),
    ]);

    const newlyConverted: WarehouseProductItem[] = [];

    for (const code of merchantCodes) {
      const raw = localStorage.getItem(getMerchantProductsKey(code));
      if (code !== 'MC-101' && raw === null) continue;

      const merchantProducts = getStoredMerchantProductsForCode(code);
      const profile = getStoredMerchantProfileForCode(code);

      const customMerchantItems = merchantProducts.filter(
        (mp) =>
          (code !== 'MC-101' || !DEFAULT_SEED_MERCHANT_PRODUCT_IDS.has(mp.id)) &&
          !adminProducts.some((ap) => isMatchingProduct(mp, ap)) &&
          !newlyConverted.some((ap) => isMatchingProduct(mp, ap))
      );

      for (const mp of customMerchantItems) {
        newlyConverted.push(
          convertMerchantProductToWarehouse(mp, profile, 'PENDING_APPROVAL')
        );
      }
    }

    if (newlyConverted.length === 0) return adminProducts;

    const merged = [...newlyConverted, ...adminProducts];
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(merged));
    return merged;
  } catch {
    return adminProducts;
  }
}

/**
 * Convert a MerchantOrderItem to an Admin WarehousePipelineOrder
 */
export function convertMerchantOrderToWarehouse(
  order: MerchantOrderItem,
  merchantProducts: MerchantProductItem[],
  memoList: ResellerMemo[],
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
): WarehousePipelineOrder {
  const merchantCode = profile.merchantCode || 'MC-101';
  const merchantName = profile.storeName || "Sabbir's Store";
  const primaryLine = order.lineItems?.[0];
  const primaryProduct =
    merchantProducts.find((p) => p.id === (primaryLine?.id || order.productId)) ||
    merchantProducts[0];

  const rawSku = primaryLine?.sku || primaryProduct?.sku || 'SKU-001';
  const { fullSku } = normalizeFullSku(rawSku, merchantCode);

  const variantStr = primaryLine?.variant || primaryProduct?.variantLabel || 'Standard / L';
  const variantParts = variantStr.split('/').map((s) => s.trim());
  const color = variantParts[0] || 'Standard';
  const size = variantParts[1] || 'L';

  const productTitle =
    order.lineItems && order.lineItems.length > 1
      ? `${order.lineItems[0].title} (+${order.lineItems.length - 1} more)`
      : primaryLine?.title || primaryProduct?.title || order.items || 'Warehouse Order Item';

  const matchedMemo = memoList.find((m) => m.code === order.memoCode) || memoList[0];
  const addrLower = (order.address || '').toLowerCase();
  const city = addrLower.includes('chattogram') || addrLower.includes('chittagong')
    ? 'Chattogram'
    : addrLower.includes('sylhet')
    ? 'Sylhet'
    : addrLower.includes('rajshahi')
    ? 'Rajshahi'
    : 'Dhaka';

  const validCourier: CourierPartner =
    order.courier === 'Pathao' || order.courier === 'RedX' || order.courier === 'Steadfast'
      ? order.courier
      : 'Steadfast';

  const stageMap: Record<MerchantOrderItem['status'], OrderStage> = {
    PENDING: 'PICK',
    ALLOCATED: 'PICK',
    PICKED: 'PACK',
    PACKED: 'PACK',
    DISPATCHED: 'DISPATCH',
    DELIVERED: 'HANDED_OVER',
    CANCELLED: 'CANCELLED',
  };

  return {
    id: order.orderNumber || order.id,
    createdAt: order.date || 'Just now',
    merchantCode,
    merchantName,
    customerName: order.customer,
    customerPhone: order.phone,
    customerAddress: order.address,
    city,
    productTitle,
    productImage:
      primaryLine?.imageUrl || primaryProduct?.imageUrl || PRESET_THUMBNAILS[0].url,
    bin: primaryProduct?.bin?.split('-').slice(0, 3).join('-') || 'A-01-02',
    color,
    size,
    sku: fullSku,
    qty: order.qty || 1,
    stockAvailable: Math.max(0, primaryProduct?.stock ?? 50),
    memoCode: order.memoCode || 'MEMO-DEFAULT',
    resellerName: matchedMemo?.resellerName || merchantName,
    resellerPhone: matchedMemo?.phone || profile.phone || '01712-345678',
    resellerAddress: matchedMemo?.address || profile.location || 'Dhaka, Bangladesh',
    codAmount: order.codAmount ?? order.amount,
    courier: validCourier,
    trackingCode: order.trackingId,
    stage: stageMap[order.status] || 'PICK',
  };
}

/**
 * Merchant -> Admin: When Merchant creates a new order, add it to Admin Orders Pipeline and deduct Admin stock.
 */
export function syncMerchantOrderCreatedToAdmin(
  order: MerchantOrderItem,
  itemsToDeduct: { productId: string; qty: number }[],
  merchantProducts: MerchantProductItem[],
  memoList: ResellerMemo[],
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
): void {
  if (typeof window === 'undefined') return;
  try {
    const adminOrders = getStoredAdminOrders();
    const orderId = order.orderNumber || order.id;

    if (!adminOrders.some((ao) => ao.id === orderId)) {
      const pipelineOrder = convertMerchantOrderToWarehouse(
        order,
        merchantProducts,
        memoList,
        profile
      );
      const nextAdminOrders = [pipelineOrder, ...adminOrders];
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(nextAdminOrders));
    }

    // Deduct stock on matching Admin products
    if (itemsToDeduct.length > 0) {
      const adminProducts = getStoredAdminProducts();
      const nextAdminProducts = adminProducts.map((ap) => {
        const matchedMerchantProd = merchantProducts.find((mp) =>
          isMatchingProduct(mp, ap)
        );
        const deductEntry = itemsToDeduct.find(
          (d) =>
            d.productId === ap.id ||
            (matchedMerchantProd && d.productId === matchedMerchantProd.id)
        );
        if (!deductEntry) return ap;
        return {
          ...ap,
          stock: Math.max(0, ap.stock - deductEntry.qty),
        };
      });
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdminProducts));
    }

    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore
  }
}

/**
 * Merchant -> Admin: When Merchant cancels an order, mark it CANCELLED in Admin pipeline & restore stock.
 */
export function syncMerchantOrderCancelledToAdmin(
  orderId: string,
  itemsToRestore: { productId: string; qty: number }[],
  merchantProducts: MerchantProductItem[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const adminOrders = getStoredAdminOrders();
    const nextAdminOrders = adminOrders.map((ao) =>
      ao.id === orderId
        ? { ...ao, stage: 'CANCELLED' as const, stockAvailable: ao.stockAvailable + ao.qty }
        : ao
    );
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(nextAdminOrders));

    if (itemsToRestore.length > 0) {
      const adminProducts = getStoredAdminProducts();
      const nextAdminProducts = adminProducts.map((ap) => {
        const matchedMerchantProd = merchantProducts.find((mp) =>
          isMatchingProduct(mp, ap)
        );
        const restoreEntry = itemsToRestore.find(
          (r) =>
            r.productId === ap.id ||
            (matchedMerchantProd && r.productId === matchedMerchantProd.id)
        );
        if (!restoreEntry) return ap;
        return {
          ...ap,
          stock: ap.stock + restoreEntry.qty,
        };
      });
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdminProducts));
    }

    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
    );
  } catch {
    // ignore
  }
}

/**
 * Admin -> Merchant: Sync Admin pipeline order stage/courier/tracking changes back to all Merchants' orders.
 */
export function syncAdminOrdersToMerchant(adminOrders: WarehousePipelineOrder[]): void {
  if (typeof window === 'undefined') return;
  try {
    const directory = getStoredMerchantDirectory();
    const merchantCodes = new Set<string>([
      'MC-101',
      ...directory.map((m) => m.merchantCode.toUpperCase()),
      ...adminOrders.map((ao) => ao.merchantCode.toUpperCase()),
    ]);

    const stageToStatus: Record<OrderStage, MerchantOrderItem['status']> = {
      PICK: 'PENDING',
      WAITING: 'PENDING',
      PACK: 'PACKED',
      DISPATCH: 'DISPATCHED',
      HANDED_OVER: 'DELIVERED',
      CANCELLED: 'CANCELLED',
    };

    for (const code of merchantCodes) {
      const storageKey = getMerchantOrdersKey(code);
      const rawExisting = localStorage.getItem(storageKey);
      if (
        code !== 'MC-101' &&
        rawExisting === null &&
        !adminOrders.some((ao) => ao.merchantCode.toUpperCase() === code)
      ) {
        continue;
      }

      let merchantOrders = getStoredMerchantOrdersForCode(code);

      merchantOrders = merchantOrders.map((mo) => {
        const moId = mo.orderNumber || mo.id;
        const matchedAdmin = adminOrders.find((ao) => ao.id === moId || ao.id === mo.id);
        if (!matchedAdmin) return mo;
        return {
          ...mo,
          status: stageToStatus[matchedAdmin.stage] || mo.status,
          courier: matchedAdmin.courier,
          trackingId: matchedAdmin.trackingCode || mo.trackingId,
        };
      });

      // Add any new orders created from Admin Panel for this merchantCode
      const newAdminOrders = adminOrders.filter(
        (ao) =>
          ao.merchantCode.toUpperCase() === code &&
          !INITIAL_PIPELINE_ORDERS.some((seed) => seed.id === ao.id) &&
          !merchantOrders.some((mo) => (mo.orderNumber || mo.id) === ao.id || mo.id === ao.id)
      );

      if (newAdminOrders.length > 0) {
        const converted: MerchantOrderItem[] = newAdminOrders.map((ao) => ({
          id: ao.id,
          orderNumber: ao.id,
          date: ao.createdAt || 'Today, Just now',
          customer: ao.customerName,
          phone: ao.customerPhone,
          address: ao.customerAddress,
          productId: 'p-1',
          items: `${ao.productTitle} (${ao.color} / ${ao.size}) x ${ao.qty}`,
          qty: ao.qty,
          amount: ao.codAmount,
          codAmount: ao.codAmount,
          memoCode: ao.memoCode,
          status: stageToStatus[ao.stage] || 'PENDING',
          courier: ao.courier,
          trackingId: ao.trackingCode,
          paymentMethod: 'Cash on Delivery',
          paymentStatus: 'Unpaid',
        }));
        merchantOrders = [...converted, ...merchantOrders];
      }

      localStorage.setItem(storageKey, JSON.stringify(merchantOrders));
    }
  } catch {
    // ignore
  }
}

/**
 * Reconcile any previously created Merchant orders (across all merchants) into Admin's pipeline order list on load.
 */
export function reconcileAdminOrdersWithMerchant(
  adminOrders: WarehousePipelineOrder[]
): WarehousePipelineOrder[] {
  if (typeof window === 'undefined') return adminOrders;
  try {
    const directory = getStoredMerchantDirectory();
    const merchantCodes = new Set<string>([
      'MC-101',
      ...directory.map((m) => m.merchantCode.toUpperCase()),
    ]);

    const newlyConverted: WarehousePipelineOrder[] = [];

    for (const code of merchantCodes) {
      const raw = localStorage.getItem(getMerchantOrdersKey(code));
      if (code !== 'MC-101' && raw === null) continue;

      const merchantOrders = getStoredMerchantOrdersForCode(code);
      const merchantProducts = getStoredMerchantProductsForCode(code);
      const profile = getStoredMerchantProfileForCode(code);
      const memos = getStoredMerchantMemosForCode(code, profile);

      const customMerchantOrders = merchantOrders.filter((mo) => {
        const moId = mo.orderNumber || mo.id;
        return (
          (code !== 'MC-101' || !DEFAULT_SEED_MERCHANT_ORDER_IDS.has(moId)) &&
          !adminOrders.some((ao) => ao.id === moId || ao.id === mo.id) &&
          !newlyConverted.some((ao) => ao.id === moId || ao.id === mo.id)
        );
      });

      for (const mo of customMerchantOrders) {
        newlyConverted.push(
          convertMerchantOrderToWarehouse(mo, merchantProducts, memos, profile)
        );
      }
    }

    if (newlyConverted.length === 0) return adminOrders;

    const merged = [...newlyConverted, ...adminOrders];
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(merged));
    return merged;
  } catch {
    return adminOrders;
  }
}

/**
 * Sync Admin Merchant Directory's per-merchant products & orders view with latest warehouse storage.
 */
export function getSyncedMerchantDirectoryLists(
  baseProducts: import('@/features/admin/merchants/types').MerchantProductItem[],
  baseOrders: import('@/features/admin/merchants/types').MerchantOrderItem[]
): {
  products: import('@/features/admin/merchants/types').MerchantProductItem[];
  orders: import('@/features/admin/merchants/types').MerchantOrderItem[];
} {
  if (typeof window === 'undefined') {
    return { products: baseProducts, orders: baseOrders };
  }
  try {
    const adminProds = reconcileAdminProductsWithMerchant(getStoredAdminProducts());
    const adminOrders = reconcileAdminOrdersWithMerchant(getStoredAdminOrders());

    const extraProds: import('@/features/admin/merchants/types').MerchantProductItem[] = adminProds
      .filter(
        (ap) =>
          ap.status === 'APPROVED' &&
          !baseProducts.some((bp) => bp.sku === ap.fullSku || bp.id === ap.id)
      )
      .map((ap) => ({
        id: ap.id,
        merchantCode: ap.merchantCode,
        title: ap.title,
        category: ap.category === 'Accessories' ? 'Beauty' : ap.category,
        sku: ap.fullSku,
        barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        color: ap.color,
        size: ap.size,
        price: ap.price,
        wholesalePrice: Math.round(ap.price * 0.75),
        stock: ap.stock,
        reserved: 0,
        damaged: 0,
        bin: ap.binCode,
        imageUrl: ap.imageUrl,
      }));

    const syncedProds = [
      ...extraProds,
      ...baseProducts.map((bp) => {
        const match = adminProds.find((ap) => ap.fullSku === bp.sku || ap.id === bp.id);
        return match ? { ...bp, stock: match.stock, bin: match.binCode, price: match.price } : bp;
      }),
    ];

    const stageMap: Record<
      OrderStage,
      import('@/features/admin/merchants/types').MerchantOrderItem['status']
    > = {
      PICK: 'ALLOCATED',
      WAITING: 'PICKING',
      PACK: 'PACKED',
      DISPATCH: 'DISPATCHED',
      HANDED_OVER: 'DELIVERED',
      CANCELLED: 'CANCELLED',
    };

    const extraOrders: import('@/features/admin/merchants/types').MerchantOrderItem[] = adminOrders
      .filter((ao) => !baseOrders.some((bo) => bo.id === ao.id))
      .map((ao) => ({
        id: ao.id,
        merchantCode: ao.merchantCode,
        date: ao.createdAt || 'Just now',
        isoDate: new Date().toISOString().slice(0, 10),
        periodBucket: 'DAY',
        customer: ao.customerName,
        phone: ao.customerPhone,
        address: ao.customerAddress,
        city: ao.city,
        items: `${ao.productTitle} (${ao.color} / ${ao.size})`,
        sku: ao.sku,
        qty: ao.qty,
        memoCode: ao.memoCode,
        courier: ao.courier,
        status: stageMap[ao.stage] || 'ALLOCATED',
        amount: ao.codAmount,
        fraudRatio: 96,
      }));

    const syncedOrders = [
      ...extraOrders,
      ...baseOrders.map((bo) => {
        const match = adminOrders.find((ao) => ao.id === bo.id);
        return match
          ? { ...bo, status: stageMap[match.stage] || bo.status, courier: match.courier }
          : bo;
      }),
    ];

    return { products: syncedProds, orders: syncedOrders };
  } catch {
    return { products: baseProducts, orders: baseOrders };
}

export interface SyncedAdminMemoItem {
  id: string;
  code: string;
  resellerName: string;
  merchantName: string;
  merchantCode: string;
  phone: string;
  address: string;
  paperSize: string;
  isDefault: boolean;
  color: string;
  note: string;
  sampleItems: { name: string; qty: number; price: string }[];
  created: string;
}

export function getStoredMerchantMemos(): ResellerMemo[] {
  if (typeof window === 'undefined') return INITIAL_MERCHANT_MEMOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MERCHANT_MEMOS);
    if (!raw) return INITIAL_MERCHANT_MEMOS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MERCHANT_MEMOS;
  } catch {
    return INITIAL_MERCHANT_MEMOS;
  }
}

export function getStoredAdminMemos(): SyncedAdminMemoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_MEMOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function syncMerchantMemoToAdmin(
  memo: ResellerMemo,
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
) {
  if (typeof window === 'undefined') return;
  try {
    const merchantCode = (memo.merchantCode || profile.merchantCode || 'MC-101').trim();
    const merchantName = (memo.merchantName || profile.storeName || "Sabbir's Store").trim();

    const adminItem: SyncedAdminMemoItem = {
      id: memo.id,
      code: (memo.code || 'MEMO-DEFAULT').trim().toUpperCase(),
      resellerName: memo.resellerName || merchantName,
      merchantName,
      merchantCode,
      phone: memo.phone || profile.phone || '+880 1711-000000',
      address: memo.address || profile.location || 'Dhaka, Bangladesh',
      paperSize: memo.paperSize === 'POS_80MM' ? '80mm POS Slip' : '4x6 Thermal Sticker',
      isDefault: Boolean(memo.isDefault),
      color: memo.color || memo.accentColor || '#4f46e5',
      note: memo.note || 'Thank you for shopping! Return within 7 days with invoice.',
      sampleItems: memo.sampleItems && memo.sampleItems.length > 0
        ? memo.sampleItems
        : [{ name: 'Heavyweight Hoodie (XL)', qty: 1, price: '৳ 3,450' }],
      created: memo.created || new Date().toISOString().slice(0, 10),
    };

    // Upsert into admin memos storage
    const storedAdmin = getStoredAdminMemos();
    const filteredAdmin = storedAdmin.filter(
      (m) => m.id !== adminItem.id && !(m.code === adminItem.code && m.merchantCode === adminItem.merchantCode)
    );
    const updatedAdmin = [adminItem, ...filteredAdmin];
    localStorage.setItem(STORAGE_KEY_ADMIN_MEMOS, JSON.stringify(updatedAdmin));

    // Also update merchant memos to ensure merchantCode and merchantName are retained
    const storedMerchant = getStoredMerchantMemos();
    const filteredMerchant = storedMerchant.filter(
      (m) => m.id !== memo.id && m.code !== memo.code
    );
    const memoToStore: ResellerMemo = {
      ...memo,
      merchantCode,
      merchantName,
    };
    localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify([memoToStore, ...filteredMerchant]));

    // Dispatch global sync events
    window.dispatchEvent(new CustomEvent('fulfillio-warehouse-sync'));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_ADMIN_MEMOS }));
  } catch (err) {
    console.error('Failed to sync memo to admin:', err);
  }
}

export function syncMerchantMemoDeletedToAdmin(memoId: string, memoCode: string) {
  if (typeof window === 'undefined') return;
  try {
    const storedAdmin = getStoredAdminMemos();
    const nextAdmin = storedAdmin.filter((m) => m.id !== memoId && m.code !== memoCode);
    localStorage.setItem(STORAGE_KEY_ADMIN_MEMOS, JSON.stringify(nextAdmin));

    const storedMerchant = getStoredMerchantMemos();
    const nextMerchant = storedMerchant.filter((m) => m.id !== memoId && m.code !== memoCode);
    localStorage.setItem(STORAGE_KEY_MERCHANT_MEMOS, JSON.stringify(nextMerchant));

    window.dispatchEvent(new CustomEvent('fulfillio-warehouse-sync'));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY_ADMIN_MEMOS }));
  } catch (err) {
    console.error('Failed to sync memo deletion to admin:', err);
  }
}

export function getSyncedAdminMemos(baseMemos: SyncedAdminMemoItem[]): SyncedAdminMemoItem[] {
  if (typeof window === 'undefined') return baseMemos;
  try {
    const storedAdmin = getStoredAdminMemos();
    const storedMerchant = getStoredMerchantMemos();

    // In case there are merchant memos not yet in admin memos
    const merchantConverted: SyncedAdminMemoItem[] = storedMerchant.map((mm) => {
      let mCode = mm.merchantCode;
      let mName = mm.merchantName;
      if (!mCode || !mName) {
        try {
          const rawProf = localStorage.getItem(STORAGE_KEY_MERCHANT_PROFILE);
          if (rawProf) {
            const p = JSON.parse(rawProf);
            mCode = mCode || p.merchantCode;
            mName = mName || p.storeName;
          }
        } catch {}
      }
      return {
        id: mm.id,
        code: mm.code,
        resellerName: mm.resellerName || mName || 'Reseller Store',
        merchantName: mName || "Sabbir's Store",
        merchantCode: mCode || 'MC-101',
        phone: mm.phone || '+880 1711-000000',
        address: mm.address || 'Dhaka, Bangladesh',
        paperSize: mm.paperSize === 'POS_80MM' ? '80mm POS Slip' : '4x6 Thermal Sticker',
        isDefault: Boolean(mm.isDefault),
        color: mm.color || mm.accentColor || '#4f46e5',
        note: mm.note || 'Thank you for shopping! Return within 7 days with invoice.',
        sampleItems: mm.sampleItems || [{ name: 'Standard Item Sample', qty: 1, price: '৳ 1,500' }],
        created: mm.created || new Date().toISOString().slice(0, 10),
      };
    });

    const memoMap = new Map<string, SyncedAdminMemoItem>();

    // 1. Put baseMemos first
    baseMemos.forEach((bm) => {
      const key = `${bm.merchantCode}-${bm.code}`.toUpperCase();
      memoMap.set(key, bm);
    });

    // 2. Override/add with merchant converted
    merchantConverted.forEach((mc) => {
      const key = `${mc.merchantCode}-${mc.code}`.toUpperCase();
      memoMap.set(key, mc);
    });

    // 3. Override/add with storedAdmin
    storedAdmin.forEach((sa) => {
      const key = `${sa.merchantCode}-${sa.code}`.toUpperCase();
      memoMap.set(key, sa);
    });

    return Array.from(memoMap.values());
  } catch {
    return baseMemos;
  }
}

export function getSyncedMerchantMemos(baseMemos: MerchantMemoItem[]): MerchantMemoItem[] {
  if (typeof window === 'undefined') return baseMemos;
  try {
    const adminMemos = getSyncedAdminMemos([]);
    const memoMap = new Map<string, MerchantMemoItem>();

    // Put baseMemos first
    baseMemos.forEach((bm) => {
      const key = `${bm.merchantCode}-${bm.code}`.toUpperCase();
      memoMap.set(key, bm);
    });

    // Convert and add adminMemos
    adminMemos.forEach((am) => {
      const key = `${am.merchantCode}-${am.code}`.toUpperCase();
      memoMap.set(key, {
        id: am.id,
        merchantCode: am.merchantCode,
        code: am.code,
        resellerName: am.resellerName,
        brandColor: am.color,
        phone: am.phone,
        address: am.address,
        terms: am.note,
        isDefault: am.isDefault,
      });
    });

    return Array.from(memoMap.values());
  } catch {
    return baseMemos;
  }
}
