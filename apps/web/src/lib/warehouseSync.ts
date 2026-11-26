import {
  MerchantAsnRecord,
  MerchantOrderItem,
  MerchantProductItem,
  MerchantCategoryItem,
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
  STORAGE_KEY_MERCHANT_CATEGORIES,
  INITIAL_MERCHANT_CATEGORIES,
} from '@/features/merchant/portal/mockData';
import { MerchantMemoItem } from '@/features/admin/merchants/types';
import { ALL_MEMOS, STORAGE_KEY as STORAGE_KEY_MERCHANTS_DIRECTORY } from '@/features/admin/merchants/mockData';
import type { ProductPendingEditInfo } from '@/lib/productRevision';

export const STORAGE_KEY_ADMIN_MEMOS = 'fulfillio_admin_memos_v1';
import { StockMovementRecord, WarehouseProductItem, InboundStockReplenishment, StockWithdrawalRequest } from '@/features/admin/products/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_STOCK_MOVEMENTS,
  PRESET_THUMBNAILS,
  STORAGE_KEY_PRODUCTS,
  STORAGE_KEY_STOCK_LEDGER,
  STORAGE_KEY_STOCK_WITHDRAWALS,
  INITIAL_STOCK_REPLENISHMENTS,
  INITIAL_STOCK_WITHDRAWALS,
  cleanBinCode,
  generateDigitalProofHash,
} from '@/features/admin/products/mockData';
import { CourierPartner, OrderItem, OrderStage, WarehousePipelineOrder } from '@/features/admin/orders/types';
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

export function getMerchantCategoriesKey(merchantCode = 'MC-101'): string {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  return code === 'MC-101'
    ? STORAGE_KEY_MERCHANT_CATEGORIES
    : `${STORAGE_KEY_MERCHANT_CATEGORIES}_${code}`;
}

function getTimestampMs(value?: string): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function hasPortalPayoutDetails(payout?: MerchantProfileData['payoutAccount'] | null): boolean {
  return Boolean(
    payout &&
      (String(payout.accountNumber || '').trim() ||
        String(payout.bkashMerchantNumber || '').trim())
  );
}

function hasAdminPayoutDetails(payout?: MerchantRecord['payoutAccount'] | null): boolean {
  return Boolean(
    payout &&
      (String(payout.accountNumber || '').trim() ||
        String(payout.bkashNumber || '').trim())
  );
}

function hasKycDocs(
  kyc?: { nidDocUrl?: string; selfieDocUrl?: string } | null
): boolean {
  return Boolean(
    kyc &&
      String(kyc.nidDocUrl || '').trim() &&
      String(kyc.selfieDocUrl || '').trim()
  );
}

function mapProfileToMerchantRecord(
  profile: MerchantProfileData,
  existing?: MerchantRecord
): MerchantRecord {
  const hasDetails = hasPortalPayoutDetails(profile.payoutAccount);
  const statusNorm = (profile.status || '').toUpperCase();
  const mappedStatus: MerchantRecord['status'] =
    statusNorm === 'SUSPENDED'
      ? 'Suspended'
      : statusNorm === 'PENDING'
      ? 'Pending'
      : existing?.status || 'Active';

  return {
    id: existing?.id || profile.id || `m-${profile.merchantCode.toLowerCase()}`,
    merchantCode: profile.merchantCode,
    storeName: profile.storeName || existing?.storeName || 'Merchant Store',
    ownerName: profile.ownerName || existing?.ownerName || 'Store Owner',
    email: profile.email || existing?.email || '',
    phone: profile.phone || existing?.phone || '',
    location: profile.location || existing?.location || 'Dhaka, Bangladesh',
    personalAddress:
      profile.personalAddress !== undefined
        ? profile.personalAddress
        : existing?.personalAddress || '',
    deliveryArea: existing?.deliveryArea || 'Nationwide Bangladesh',
    status: mappedStatus,
    verified: profile.verified !== undefined ? Boolean(profile.verified) : Boolean(existing?.verified),
    joinedDate:
      existing?.joinedDate ||
      new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    avatarInitials:
      existing?.avatarInitials ||
      (profile.storeName || 'MC').slice(0, 2).toUpperCase(),
    avatarBg: existing?.avatarBg || 'from-orange-500 to-amber-600',
    avatarUrl: profile.logoUrl || existing?.avatarUrl,
    payoutAccount: {
      provider: profile.payoutAccount?.provider || existing?.payoutAccount?.provider || '',
      accountHolder:
        profile.payoutAccount?.accountHolder ||
        existing?.payoutAccount?.accountHolder ||
        profile.ownerName ||
        '',
      accountNumber:
        profile.payoutAccount?.accountNumber || existing?.payoutAccount?.accountNumber || '',
      branchName: profile.payoutAccount?.branchName || existing?.payoutAccount?.branchName || '',
      routingNumber:
        profile.payoutAccount?.routingNumber || existing?.payoutAccount?.routingNumber || '',
      bkashNumber:
        profile.payoutAccount?.bkashMerchantNumber ||
        existing?.payoutAccount?.bkashNumber ||
        '',
      frequency:
        profile.payoutAccount?.frequency ||
        profile.payoutSchedule ||
        existing?.payoutAccount?.frequency ||
        'Weekly (Every Friday)',
      status: hasDetails
        ? profile.payoutAccount?.status || existing?.payoutAccount?.status || 'PENDING_REVIEW'
        : profile.payoutAccount?.status === 'REJECTED'
          ? 'REJECTED'
          : existing?.payoutAccount?.status || 'UNVERIFIED',
      chequeLeafUrl:
        profile.payoutAccount?.chequeLeafUrl || existing?.payoutAccount?.chequeLeafUrl || '',
      rejectionReason:
        (profile.payoutAccount?.status || existing?.payoutAccount?.status) === 'REJECTED'
          ? profile.payoutAccount?.rejectionReason || existing?.payoutAccount?.rejectionReason
          : undefined,
      submittedAt: profile.payoutAccount?.submittedAt || existing?.payoutAccount?.submittedAt,
      updatedAt:
        profile.payoutAccount?.updatedAt ||
        profile.payoutAccount?.submittedAt ||
        existing?.payoutAccount?.updatedAt,
      availableBalance: existing?.payoutAccount?.availableBalance ?? 0,
      lastPayoutAmount: existing?.payoutAccount?.lastPayoutAmount ?? 0,
    },
    kycData: (() => {
      const pKyc = profile.kycData;
      const eKyc = existing?.kycData;
      const pHas = hasKycDocs(pKyc);
      const eHas = hasKycDocs(eKyc);
      if (!pKyc && !eKyc) return undefined;
      const pTs = getTimestampMs(pKyc?.reviewedAt || pKyc?.submittedAt);
      const eTs = getTimestampMs(eKyc?.reviewedAt || eKyc?.submittedAt);
      const primary =
        pHas && !eHas
          ? pKyc
          : eHas && !pHas
            ? eKyc
            : pTs >= eTs
              ? pKyc || eKyc
              : eKyc || pKyc;
      if (!primary) return undefined;
      return {
        tradeLicenseNo: primary.tradeLicenseNo || '',
        tradeLicenseDocUrl: primary.tradeLicenseDocUrl || '',
        nidNumber: primary.nidNumber || '',
        nidDocUrl: primary.nidDocUrl || '',
        nidBackDocUrl: primary.nidBackDocUrl || '',
        selfieDocUrl: primary.selfieDocUrl || '',
        verificationStatus: hasKycDocs(primary)
          ? primary.verificationStatus || 'PENDING_REVIEW'
          : primary.verificationStatus === 'REJECTED'
            ? 'REJECTED'
            : 'UNVERIFIED',
        submittedAt: primary.submittedAt,
        verifiedAt: primary.verifiedAt,
        reviewedAt: primary.reviewedAt,
        rejectionReason:
          primary.verificationStatus === 'REJECTED' ? primary.rejectionReason : undefined,
      };
    })(),
  };
}

export function getStoredMerchantDirectory(): MerchantRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MERCHANT_DIRECTORY);
    const list: MerchantRecord[] = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list : [];

    const merged = safeList.map((m) => {
      if (!m?.merchantCode) return m;
      try {
        const pRaw = localStorage.getItem(getMerchantProfileKey(m.merchantCode));
        if (!pRaw) return m;
        const parsedProfile: MerchantProfileData = JSON.parse(pRaw);
        const profTs = getTimestampMs(
          parsedProfile.payoutAccount?.updatedAt || parsedProfile.payoutAccount?.submittedAt
        );
        const dirTs = getTimestampMs(
          m.payoutAccount?.updatedAt || m.payoutAccount?.submittedAt
        );
        const profHas = hasPortalPayoutDetails(parsedProfile.payoutAccount);
        const dirHas = hasAdminPayoutDetails(m.payoutAccount);

        const profKycTs = getTimestampMs(
          parsedProfile.kycData?.reviewedAt || parsedProfile.kycData?.submittedAt
        );
        const dirKycTs = getTimestampMs(
          m.kycData?.reviewedAt || m.kycData?.submittedAt
        );
        const profHasKyc = hasKycDocs(parsedProfile.kycData);
        const dirHasKyc = hasKycDocs(m.kycData);
        const addressChanged =
          parsedProfile.personalAddress !== undefined &&
          parsedProfile.personalAddress !== (m.personalAddress || '');

        if (
          (profHas && !dirHas) ||
          (profTs > dirTs && profTs > 0) ||
          (profHasKyc && !dirHasKyc) ||
          (profKycTs > dirKycTs && profKycTs > 0) ||
          addressChanged
        ) {
          return mapProfileToMerchantRecord(
            { ...parsedProfile, merchantCode: parsedProfile.merchantCode || m.merchantCode },
            m
          );
        }
      } catch {
        // ignore invalid per-merchant profile JSON
      }
      return m;
    });

    try {
      const session = getActiveMerchantSession();
      const sCode = (session?.merchantCode || '').trim().toUpperCase();
      if (sCode) {
        const pRaw = localStorage.getItem(getMerchantProfileKey(sCode));
        if (pRaw) {
          const parsedProfile: MerchantProfileData = JSON.parse(pRaw);
          if (parsedProfile && typeof parsedProfile === 'object') {
            const existsInList = merged.some(
              (m) => m.merchantCode?.toUpperCase() === sCode
            );
            if (!existsInList && (parsedProfile.merchantCode || hasPortalPayoutDetails(parsedProfile.payoutAccount))) {
              merged.unshift(
                mapProfileToMerchantRecord({
                  ...parsedProfile,
                  merchantCode: parsedProfile.merchantCode || sCode,
                  storeName: parsedProfile.storeName || session.storeName,
                  ownerName: parsedProfile.ownerName || session.ownerName,
                  email: parsedProfile.email || session.email,
                })
              );
            }
          }
        }
      }
    } catch {
      // ignore session fallback errors
    }

    return merged;
  } catch {
    return [];
  }
}

export const INITIAL_MERCHANT_CREDENTIALS: MerchantCredentialRecord[] = [];

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

export function getPortalAuthToken(): string {
  if (typeof window === 'undefined') return '';
  try {
    const pathname = window.location?.pathname || '';
    if (pathname.startsWith('/admin') || pathname.startsWith('/wms')) {
      return (
        localStorage.getItem('fulfillio_admin_token') ||
        localStorage.getItem('fulfillio_token') ||
        localStorage.getItem('token') ||
        ''
      );
    }
    if (pathname.startsWith('/merchant')) {
      return (
        localStorage.getItem('fulfillio_merchant_token') ||
        localStorage.getItem('fulfillio_token') ||
        localStorage.getItem('token') ||
        ''
      );
    }
    return (
      localStorage.getItem('fulfillio_token') ||
      localStorage.getItem('fulfillio_merchant_token') ||
      localStorage.getItem('fulfillio_admin_token') ||
      localStorage.getItem('token') ||
      ''
    );
  } catch {
    return '';
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getPortalAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isMerchantLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_MERCHANT_SESSION);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed && parsed.merchantCode && parsed.email);
  } catch {
    return false;
  }
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('fulfillio_active_admin_session_v1');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.email) return false;
    const token =
      localStorage.getItem('fulfillio_admin_token') ||
      localStorage.getItem('fulfillio_token');
    return Boolean(token);
  } catch {
    return false;
  }
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
    localStorage.removeItem('fulfillio_merchant_token');
    localStorage.removeItem('fulfillio_token');
    localStorage.removeItem('token');
  } catch {
    // ignore
  }
}

export function clearActiveAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('fulfillio_active_admin_session_v1');
    localStorage.removeItem('fulfillio_admin_token');
    localStorage.removeItem('fulfillio_token');
    localStorage.removeItem('token');
  } catch {
    // ignore
  }
}

export function buildProfileFromMerchantRecord(record: MerchantRecord): MerchantProfileData {
  const hasDetails = hasAdminPayoutDetails(record.payoutAccount);
  return {
    id: record.id,
    merchantCode: record.merchantCode,
    ownerName: record.ownerName,
    storeName: record.storeName,
    email: record.email,
    phone: record.phone,
    location: record.location || 'Dhaka, Bangladesh',
    personalAddress: record.personalAddress || '',
    status: record.status,
    verified: record.verified,
    logoUrl: record.avatarUrl,
    payoutMethod: 'Bank Transfer / bKash',
    payoutSchedule: record.payoutAccount.frequency || 'Weekly (Every Friday)',
    payoutAccount: {
      provider: record.payoutAccount.provider || '',
      accountHolder: record.payoutAccount.accountHolder || record.ownerName || '',
      accountNumber: record.payoutAccount.accountNumber || '',
      branchName: record.payoutAccount.branchName || '',
      routingNumber: record.payoutAccount.routingNumber || '',
      bkashMerchantNumber: record.payoutAccount.bkashNumber || '',
      chequeLeafUrl: record.payoutAccount.chequeLeafUrl || '',
      frequency: record.payoutAccount.frequency || 'Weekly',
      status: hasDetails
        ? record.payoutAccount.status || 'PENDING_REVIEW'
        : record.payoutAccount.status === 'REJECTED'
          ? 'REJECTED'
          : 'UNVERIFIED',
      ...(record.payoutAccount.status === 'REJECTED' && record.payoutAccount.rejectionReason
        ? { rejectionReason: record.payoutAccount.rejectionReason }
        : {}),
      ...(record.payoutAccount.submittedAt
        ? { submittedAt: record.payoutAccount.submittedAt }
        : {}),
      ...(record.payoutAccount.updatedAt
        ? { updatedAt: record.payoutAccount.updatedAt }
        : {}),
    },
    kycData: record.kycData
      ? {
          ...record.kycData,
        }
      : {
          tradeLicenseNo: '',
          nidNumber: '',
          verificationStatus: 'UNVERIFIED',
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
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_MERCHANT_PROFILE,
            ...parsed,
            merchantCode: parsed.merchantCode || code,
            payoutAccount: {
              ...INITIAL_MERCHANT_PROFILE.payoutAccount,
              ...(parsed.payoutAccount || {}),
            },
          };
        }
      }
    } catch {
      // ignore
    }

    try {
      const session = getActiveMerchantSession();
      if (session && session.merchantCode.toUpperCase() === code) {
        const directory = getStoredMerchantDirectory();
        const dirMatch = directory.find(
          (m) =>
            (session.email && m.email.trim().toLowerCase() === session.email.trim().toLowerCase()) ||
            m.merchantCode.toUpperCase() === code
        );
        if (dirMatch) {
          return {
            ...buildProfileFromMerchantRecord(dirMatch),
            merchantCode: code,
            storeName: session.storeName || dirMatch.storeName,
            ownerName: session.ownerName || dirMatch.ownerName,
            email: session.email || dirMatch.email,
          };
        }
        return {
          ...INITIAL_MERCHANT_PROFILE,
          merchantCode: code,
          storeName: session.storeName || INITIAL_MERCHANT_PROFILE.storeName,
          ownerName: session.ownerName || INITIAL_MERCHANT_PROFILE.ownerName,
          email: session.email || INITIAL_MERCHANT_PROFILE.email,
        };
      }
    } catch {
      // ignore
    }
  }
  const dirMatch = getStoredMerchantDirectory().find(
    (m) => m.merchantCode.toUpperCase() === code
  );
  if (dirMatch) {
    return buildProfileFromMerchantRecord(dirMatch);
  }
  return {
    ...INITIAL_MERCHANT_PROFILE,
    merchantCode: code,
  };
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
      if (Array.isArray(parsed)) {
        if (parsed.length === 0 && code === 'MC-101') {
          return INITIAL_MERCHANT_PRODUCTS;
        }
        return parsed;
      }
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
      if (Array.isArray(parsed)) {
        // Sanitize any legacy '#' prefixes from order.id or order.orderNumber
        let hasModified = false;
        const sanitized = parsed.map((o) => {
          const cleanId = (o.id || o.orderNumber || '').replace(/^#/, '').trim();
          const cleanOrderNum = (o.orderNumber || cleanId).replace(/^#/, '').trim();
          if (o.id !== cleanId || o.orderNumber !== cleanOrderNum) {
            hasModified = true;
            return { ...o, id: cleanId, orderNumber: cleanOrderNum };
          }
          return o;
        });

        // Guarantee newly registered merchants (MC-106+) never retain seed pipeline orders
        const isSeedMerchant = ['MC-101', 'MC-102', 'MC-103', 'MC-104', 'MC-105'].includes(code);
        let finalOrders = sanitized;
        if (!isSeedMerchant) {
          finalOrders = sanitized.filter(
            (o) =>
              !INITIAL_PIPELINE_ORDERS.some(
                (seed) => seed.id === (o.orderNumber || o.id) || seed.id === o.id
              )
          );
          if (finalOrders.length !== sanitized.length) {
            hasModified = true;
          }
        }

        if (hasModified) {
          try {
            localStorage.setItem(getMerchantOrdersKey(code), JSON.stringify(finalOrders));
          } catch {}
        }
        if (finalOrders.length === 0 && code === 'MC-101') {
          return INITIAL_MERCHANT_ORDERS;
        }
        return finalOrders;
      }
    }
  } catch {
    // ignore
  }
  return code === 'MC-101' ? INITIAL_MERCHANT_ORDERS : [];
}

export function getStoredMerchantMemosForCode(
  merchantCode = 'MC-101',
  _profile?: MerchantProfileData
): ResellerMemo[] {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(getMerchantMemosKey(code));
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
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

export function getStoredMerchantCategoriesForCode(
  merchantCode = 'MC-101'
): MerchantCategoryItem[] {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  if (typeof window === 'undefined') {
    return INITIAL_MERCHANT_CATEGORIES;
  }
  try {
    const raw = localStorage.getItem(getMerchantCategoriesKey(code));
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return INITIAL_MERCHANT_CATEGORIES;
}

export function saveMerchantCategoriesForCode(
  merchantCode: string,
  categories: MerchantCategoryItem[]
): void {
  const code = (merchantCode || 'MC-101').trim().toUpperCase();
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getMerchantCategoriesKey(code), JSON.stringify(categories));
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantCategories' } })
    );
  } catch {
    // ignore
  }
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

    const data = await res.json().catch(() => ({}));

    if (res.status === 409) {
      return {
        ok: false,
        error: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি মার্চেন্ট একাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন।',
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: data?.message || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
      };
    }

    const merchantCode = data?.merchantCode || 'MC-NEW';
    const initials =
      cleanStoreName
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'MC';

    const newMerchantRecord: MerchantRecord = {
      id: data?.merchantId || merchantCode,
      merchantCode,
      storeName: cleanStoreName,
      ownerName: cleanOwnerName,
      email: cleanEmail,
      phone: cleanPhone,
      location: 'Dhaka, Bangladesh',
      deliveryArea: 'Nationwide Bangladesh',
      status: 'Pending',
      verified: false,
      joinedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      avatarInitials: initials,
      avatarBg: AVATAR_GRADIENTS[0],
      payoutAccount: {
        provider: 'Pending Bank Setup',
        accountHolder: cleanOwnerName,
        accountNumber: '',
        branchName: '',
        routingNumber: '',
        bkashNumber: cleanPhone,
        frequency: 'Weekly (Every Friday)',
        status: 'PENDING_REVIEW',
        availableBalance: 0,
        lastPayoutAmount: 0,
      },
    };

    return { ok: true, merchant: newMerchantRecord };
  } catch {
    return {
      ok: false,
      error: 'সার্ভার বা ডাটাবেজের সাথে সংযোগ করা যাচ্ছে না। অনুগ্রহ করে নিশ্চিত করুন API সার্ভার চালু আছে।',
    };
  }
}

/**
 * Authenticate a Merchant Login strictly against the backend PostgreSQL database.
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
  if (!cleanEmail || !passwordInput) {
    return { ok: false, error: 'ইমেইল এবং পাসওয়ার্ড দিন।' };
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: passwordInput }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403) {
      return {
        ok: false,
        error:
          data?.message ||
          'আপনার একাউন্টটি এখনো এডমিন অনুমোদনের অপেক্ষায় আছে (Pending Approval)। এডমিন প্যানেল থেকে Approve করার পর লগইন করতে পারবেন।',
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        error: data?.message || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
      };
    }

    if (data?.accessToken) {
      localStorage.setItem('fulfillio_merchant_token', data.accessToken);
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
  } catch {
    return {
      ok: false,
      error: 'সার্ভার বা ডাটাবেজের সাথে সংযোগ করা যাচ্ছে না। অনুগ্রহ করে নিশ্চিত করুন API সার্ভার চালু আছে।',
    };
  }
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
          merchantCode: parsed.merchantCode || m.merchantCode,
          storeName: m.storeName,
          ownerName: m.ownerName,
          email: m.email,
          phone: m.phone,
          location: m.location || parsed.location,
          personalAddress: m.personalAddress !== undefined ? m.personalAddress : parsed.personalAddress,
          status: m.status,
          verified: m.verified,
          logoUrl: m.avatarUrl || parsed.logoUrl,
          payoutAccount: m.payoutAccount
            ? {
                ...(parsed.payoutAccount || {}),
                provider: m.payoutAccount.provider ?? parsed.payoutAccount?.provider ?? '',
                accountHolder:
                  m.payoutAccount.accountHolder ?? parsed.payoutAccount?.accountHolder ?? m.ownerName,
                accountNumber:
                  m.payoutAccount.accountNumber ?? parsed.payoutAccount?.accountNumber ?? '',
                branchName: m.payoutAccount.branchName ?? parsed.payoutAccount?.branchName ?? '',
                routingNumber:
                  m.payoutAccount.routingNumber ?? parsed.payoutAccount?.routingNumber ?? '',
                bkashMerchantNumber:
                  m.payoutAccount.bkashNumber ?? parsed.payoutAccount?.bkashMerchantNumber ?? '',
                chequeLeafUrl:
                  m.payoutAccount.chequeLeafUrl ?? parsed.payoutAccount?.chequeLeafUrl ?? '',
                frequency:
                  (m.payoutAccount.frequency as any) ||
                  parsed.payoutAccount?.frequency ||
                  'Weekly',
                status: m.payoutAccount.status,
                submittedAt: m.payoutAccount.submittedAt || parsed.payoutAccount?.submittedAt,
                updatedAt: m.payoutAccount.updatedAt || parsed.payoutAccount?.updatedAt,
                rejectionReason:
                  m.payoutAccount.status === 'REJECTED'
                    ? m.payoutAccount.rejectionReason
                    : undefined,
              }
            : parsed.payoutAccount,
          kycData: m.kycData
            ? {
                ...(parsed.kycData || {}),
                ...m.kycData,
              }
            : parsed.kycData,
        };
        localStorage.setItem(key, JSON.stringify(updated));
      } else {
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

/**
 * Sync Merchant Portal profile & payout account updates to the Admin Merchant Directory.
 */
export function syncMerchantProfileToAdminDirectory(profile: MerchantProfileData): void {
  if (typeof window === 'undefined' || !profile?.merchantCode) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MERCHANT_DIRECTORY);
    const list: MerchantRecord[] = raw ? JSON.parse(raw) : [...MERCHANTS_DATA];
    const codeLower = profile.merchantCode.trim().toLowerCase();
    const emailLower = (profile.email || '').trim().toLowerCase();

    const idx = list.findIndex(
      (m) =>
        m.merchantCode.toLowerCase() === codeLower ||
        (emailLower && m.email.toLowerCase() === emailLower)
    );

    const hasDetails = hasPortalPayoutDetails(profile.payoutAccount);
    const buildUpdatedPayout = (
      existing?: MerchantRecord['payoutAccount']
    ): MerchantRecord['payoutAccount'] => {
      const nextStatus: MerchantRecord['payoutAccount']['status'] = hasDetails
        ? profile.payoutAccount?.status || existing?.status || 'PENDING_REVIEW'
        : profile.payoutAccount?.status === 'REJECTED'
          ? 'REJECTED'
          : existing?.status || 'UNVERIFIED';

      return {
        provider: profile.payoutAccount?.provider ?? existing?.provider ?? '',
        accountHolder:
          profile.payoutAccount?.accountHolder ??
          existing?.accountHolder ??
          profile.ownerName,
        accountNumber: profile.payoutAccount?.accountNumber ?? existing?.accountNumber ?? '',
        branchName: profile.payoutAccount?.branchName ?? existing?.branchName ?? '',
        routingNumber: profile.payoutAccount?.routingNumber ?? existing?.routingNumber ?? '',
        bkashNumber:
          profile.payoutAccount?.bkashMerchantNumber ?? existing?.bkashNumber ?? '',
        frequency:
          profile.payoutAccount?.frequency ||
          profile.payoutSchedule ||
          existing?.frequency ||
          'Weekly (Every Friday)',
        status: nextStatus,
        chequeLeafUrl: profile.payoutAccount?.chequeLeafUrl ?? existing?.chequeLeafUrl ?? '',
        rejectionReason:
          nextStatus === 'REJECTED'
            ? profile.payoutAccount?.rejectionReason || existing?.rejectionReason
            : undefined,
        submittedAt: profile.payoutAccount?.submittedAt || existing?.submittedAt,
        updatedAt:
          profile.payoutAccount?.updatedAt ||
          profile.payoutAccount?.submittedAt ||
          existing?.updatedAt,
        availableBalance: existing?.availableBalance ?? 0,
        lastPayoutAmount: existing?.lastPayoutAmount ?? 0,
      };
    };

    if (idx >= 0) {
      const existing = list[idx];
      list[idx] = {
        ...existing,
        storeName: profile.storeName || existing.storeName,
        ownerName: profile.ownerName || existing.ownerName,
        phone: profile.phone || existing.phone,
        location: profile.location || existing.location,
        avatarUrl: profile.logoUrl || existing.avatarUrl,
        payoutAccount: buildUpdatedPayout(existing.payoutAccount),
      };
    } else {
      list.unshift({
        id: profile.id || `m-${profile.merchantCode.toLowerCase()}`,
        merchantCode: profile.merchantCode,
        storeName: profile.storeName || 'Merchant Store',
        ownerName: profile.ownerName || 'Store Owner',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || 'Dhaka, Bangladesh',
        deliveryArea: 'Nationwide Bangladesh',
        status:
          profile.status === 'Suspended' || profile.status === 'SUSPENDED'
            ? 'Suspended'
            : profile.status === 'Pending' || profile.status === 'PENDING'
            ? 'Pending'
            : 'Active',
        verified: Boolean(profile.verified),
        joinedDate: new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        avatarInitials: (profile.storeName || 'MC').slice(0, 2).toUpperCase(),
        avatarBg: 'from-orange-500 to-amber-600',
        avatarUrl: profile.logoUrl,
        payoutAccount: buildUpdatedPayout(),
      });
    }

    localStorage.setItem(STORAGE_KEY_MERCHANT_DIRECTORY, JSON.stringify(list));
    window.dispatchEvent(
      new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantProfileUpdate' } })
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
  const merchantCode = (item as any).merchantCode || profile.merchantCode || 'MC-101';
  const merchantName = (item as any).storeName || profile.storeName || "Sabbir's Store";
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
    status === 'PENDING_APPROVAL'
      ? 'Pending Approval'
      : item.bin &&
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
    isDraft: status === 'DRAFT',
    submittedAt: 'Just now',
    imageUrl: item.imageUrl || item.colors?.[0]?.imageUrl || PRESET_THUMBNAILS[0]?.url || '',
    images: item.images,
    barcode: item.barcode,
    description: item.description,
    colors: item.colors,
    sizes: item.sizes,
    variantsList: item.variantsList,
    editState: item.editState ?? null,
    pendingEdit: item.pendingEdit ?? null,
    lastEditRejectionReason: item.lastEditRejectionReason,
    isSuspended: item.isSuspended,
    rejectionReason: item.rejectionReason,
  };
}

export function getStoredAdminProducts(): WarehouseProductItem[] {
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
      .filter((item) => item.status !== 'DRAFT' && !currentAdmin.some((ap) => isMatchingProduct(item, ap)))
      .map((item) => convertMerchantProductToWarehouse(item, profile, 'PENDING_APPROVAL'));

    if (mappedNew.length === 0) return;

    const updatedAdmin = [...mappedNew, ...currentAdmin];
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedAdmin));
    } catch {
      try {
        // If quota exceeded, trim large base64 strings from older items
        const leanAdmin = updatedAdmin.map((p, idx) => {
          if (idx > 15 && p.imageUrl?.startsWith('data:')) {
            return { ...p, imageUrl: '' };
          }
          return p;
        });
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(leanAdmin));
      } catch {
        // Gracefully ignore
      }
    }
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

      const isDraftStatus = updatedItem.status === 'DRAFT';
      const isRejectedStatus = updatedItem.status === 'REJECTED';
      const isPendingStatus =
        updatedItem.status === 'PENDING_APPROVAL' ||
        (!isDraftStatus && !isRejectedStatus && ap.status === 'PENDING_APPROVAL');
      const isStockStoredStatus =
        updatedItem.status === 'STOCK_STORED' ||
        ((updatedItem.status === 'PUBLISHED' || updatedItem.status === 'APPROVED') && updatedItem.stock > 0);
      const nextAdminStatus = isDraftStatus
        ? ('DRAFT' as const)
        : isRejectedStatus
          ? ('REJECTED' as const)
          : isPendingStatus
            ? ('PENDING_APPROVAL' as const)
            : isStockStoredStatus
              ? ('STOCK_STORED' as const)
              : ('APPROVED' as const);

      return {
        ...ap,
        title: updatedItem.title,
        shortSku,
        fullSku,
        color,
        size,
        stock: updatedItem.stock,
        price: updatedItem.price,
        status: nextAdminStatus,
        isDraft: isDraftStatus,
        rejectionReason: isRejectedStatus
          ? (updatedItem.rejectionReason ?? ap.rejectionReason)
          : undefined,
        imageUrl: updatedItem.imageUrl !== undefined ? updatedItem.imageUrl : ap.imageUrl,
        images: updatedItem.images !== undefined ? updatedItem.images : (ap.images || []),
        barcode: updatedItem.barcode || ap.barcode,
        description: updatedItem.description ?? ap.description,
        colors: updatedItem.colors ?? ap.colors,
        sizes: updatedItem.sizes ?? ap.sizes,
        variantsList: updatedItem.variantsList ?? ap.variantsList,
        editState: updatedItem.editState !== undefined ? updatedItem.editState : ap.editState,
        pendingEdit: updatedItem.pendingEdit !== undefined ? updatedItem.pendingEdit : ap.pendingEdit,
        lastEditRejectionReason:
          updatedItem.lastEditRejectionReason !== undefined
            ? updatedItem.lastEditRejectionReason
            : ap.lastEditRejectionReason,
      };
    });

    if (!matched) {
      const fallbackStatus = updatedItem.status === 'DRAFT'
        ? 'DRAFT'
        : updatedItem.status === 'REJECTED'
          ? 'REJECTED'
          : updatedItem.status === 'PUBLISHED'
            ? 'APPROVED'
            : 'PENDING_APPROVAL';
      nextAdmin.unshift(
        convertMerchantProductToWarehouse(updatedItem, profile, fallbackStatus)
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
          category: matchedAdmin.category ?? mp.category,
          stock: matchedAdmin.stock,
          stockAccepted: matchedAdmin.stockAccepted ?? false,
          stockStatus:
            matchedAdmin.stockStatus ??
            (matchedAdmin.stockAccepted && matchedAdmin.stock > 0
              ? ('IN_STOCK' as const)
              : ('AWAITING_STOCK' as const)),
          price: matchedAdmin.price,
          imageUrl: matchedAdmin.imageUrl !== undefined ? (matchedAdmin.imageUrl || mp.imageUrl) : mp.imageUrl,
          images: (matchedAdmin.images && matchedAdmin.images.length > 0) ? matchedAdmin.images : mp.images,
          colors: matchedAdmin.colors ?? mp.colors,
          sizes: matchedAdmin.sizes ?? mp.sizes,
          variantsList: matchedAdmin.variantsList ?? mp.variantsList,
          description: matchedAdmin.description ?? mp.description,
          editState: matchedAdmin.editState ?? null,
          pendingEdit: matchedAdmin.pendingEdit ?? null,
          lastEditRejectionReason: matchedAdmin.lastEditRejectionReason,
          isSuspended: matchedAdmin.isSuspended ?? mp.isSuspended,
          bin:
            matchedAdmin.status === 'APPROVED' ||
            matchedAdmin.status === 'STOCK_STORED' ||
            (matchedAdmin.binCode &&
              matchedAdmin.binCode !== 'Pending Approval' &&
              matchedAdmin.binCode !== 'Assigned on intake' &&
              (matchedAdmin.status === 'DRAFT' || matchedAdmin.isDraft || (matchedAdmin.stock || 0) > 0))
              ? matchedAdmin.binCode
              : 'Pending Approval',
          // Synchronize status accurately between Admin and Merchant
          status:
            matchedAdmin.status === 'DRAFT' || matchedAdmin.isDraft
              ? ('DRAFT' as const)
              : matchedAdmin.status === 'REJECTED'
                ? ('REJECTED' as const)
                : (matchedAdmin.status === 'STOCK_STORED' || matchedAdmin.status === 'APPROVED') &&
                  matchedAdmin.stockAccepted === true &&
                  matchedAdmin.stock > 0
                  ? ('STOCK_STORED' as const)
                  : matchedAdmin.status === 'APPROVED'
                    ? ('APPROVED' as const)
                    : ('PENDING_APPROVAL' as const),
          rejectionReason:
            matchedAdmin.status === 'REJECTED'
              ? matchedAdmin.rejectionReason ?? mp.rejectionReason
              : undefined,
        };
      });

      // 3. Add any new approved or rejected products created/updated by Admin for this merchantCode
      const newFromAdmin = adminProducts.filter(
        (ap) =>
          ap.merchantCode.toUpperCase() === code &&
          (ap.status === 'APPROVED' || ap.status === 'STOCK_STORED' || ap.status === 'PENDING_APPROVAL' || ap.status === 'REJECTED') &&
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
          barcode: ap.barcode || `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          stock: ap.stock,
          reserved: 0,
          price: ap.price,
          bin: ap.binCode,
          status: ap.status === 'REJECTED' ? 'REJECTED' : 'PUBLISHED',
          totalOrders: 0,
          imageUrl: ap.imageUrl,
          colors: ap.colors,
          sizes: ap.sizes,
          variantsList: ap.variantsList,
          description: ap.description,
          editState: ap.editState ?? null,
          pendingEdit: ap.pendingEdit ?? null,
          lastEditRejectionReason: ap.lastEditRejectionReason,
          isSuspended: ap.isSuspended,
          rejectionReason: ap.rejectionReason,
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
    // Self-heal any record where isDraft is true but status was overwritten to APPROVED
    let didHealDraft = false;
    const normalizedAdmin = adminProducts.map((ap) => {
      if (ap.status === 'DRAFT' || ap.isDraft) {
        if (ap.status !== 'DRAFT' || ap.isDraft !== true) {
          didHealDraft = true;
          return { ...ap, status: 'DRAFT' as const, isDraft: true };
        }
      }
      return ap;
    });

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
          mp.status !== 'DRAFT' && // DRAFTS MUST NEVER BE RECONCILED INTO ADMIN CATALOG!
          !normalizedAdmin.some((ap) => isMatchingProduct(mp, ap)) &&
          !newlyConverted.some((ap) => isMatchingProduct(mp, ap))
      );

      for (const mp of customMerchantItems) {
        newlyConverted.push(
          convertMerchantProductToWarehouse(
            mp,
            profile,
            mp.status === 'DRAFT'
              ? 'DRAFT'
              : mp.status === 'REJECTED'
                ? 'REJECTED'
                : mp.status === 'PUBLISHED'
                  ? 'APPROVED'
                  : 'PENDING_APPROVAL'
          )
        );
      }
    }

    if (newlyConverted.length === 0) {
      if (didHealDraft) {
        localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(normalizedAdmin));
      }
      return normalizedAdmin;
    }

    const merged = [...newlyConverted, ...normalizedAdmin];
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
  const variantParts = variantStr.split(/[/•·|-]/).map((s) => s.trim()).filter(Boolean);
  const color = variantParts[0] || 'Standard';
  const size = variantParts[1] || 'L';

  // Build clean items array: EVERY single line item / variant gets its own distinct OrderItem row!
  // NEVER use "+ 1 more" or "(+1 more)" in title or squash variants into a single row!
  let orderItems: OrderItem[] = [];

  if (order.lineItems && order.lineItems.length > 0) {
    orderItems = order.lineItems.map((li) => {
      const rawItemSku = li.sku || primaryProduct?.sku || 'SKU-001';
      const { fullSku: itemFullSku } = normalizeFullSku(rawItemSku, merchantCode);
      const vStr = li.variant || 'Standard / L';
      const vParts = vStr.split(/[/•·|-]/).map((s) => s.trim()).filter(Boolean);
      const itemColor = vParts[0] || 'Standard';
      const itemSize = vParts[1] || 'L';
      const matchedProd =
        merchantProducts.find((p) => {
          if (p.id === li.id || p.sku === li.sku) return true;
          const { fullSku: pFull } = normalizeFullSku(p.sku || '', merchantCode);
          return pFull.toUpperCase() === itemFullSku.toUpperCase();
        }) ||
        merchantProducts.find(
          (p) =>
            li.title &&
            p.title &&
            p.title.trim().toLowerCase() === li.title.trim().toLowerCase(),
        );
      const matchedAdmin = getStoredAdminProducts().find((ap) => {
        const { fullSku: aFull } = normalizeFullSku(
          ap.fullSku || ap.shortSku || '',
          ap.merchantCode || merchantCode,
        );
        return (
          ap.fullSku === li.sku ||
          ap.shortSku === li.sku ||
          aFull.toUpperCase() === itemFullSku.toUpperCase() ||
          (li.title && ap.title?.trim().toLowerCase() === li.title.trim().toLowerCase())
        );
      });
      const rawBin =
        (matchedAdmin?.binCode &&
        matchedAdmin.binCode !== 'Pending Approval' &&
        matchedAdmin.binCode !== 'Assigned on intake'
          ? matchedAdmin.binCode
          : '') ||
        (matchedProd?.bin &&
        matchedProd.bin !== 'Pending Approval' &&
        matchedProd.bin !== 'Assigned on intake'
          ? matchedProd.bin
          : '');
      const itemBin = cleanBinCode(rawBin) || rawBin || 'Unassigned';
      const cleanTitle = (li.title || primaryProduct?.title || 'Warehouse Order Item')
        .replace(/\s*\(\+\d+\s*more\)/gi, '')
        .replace(/\s*\+\s*\d+\s*more/gi, '')
        .trim();

      const unitPrice =
        li.price > 0
          ? li.price
          : li.total && li.quantity
          ? Math.round(li.total / li.quantity)
          : Math.round((order.codAmount ?? order.amount) / (order.qty || 1));

      return {
        sku: itemFullSku,
        title: cleanTitle,
        image: li.imageUrl || matchedProd?.imageUrl || primaryProduct?.imageUrl || PRESET_THUMBNAILS[0]?.url || '',
        color: itemColor,
        size: itemSize,
        qty: li.quantity || 1,
        unitPrice,
        bin: itemBin,
      };
    });
  } else if (order.items && typeof order.items === 'string' && order.items.includes(',')) {
    // If order.items is a serialized list of variants, parse each one separately
    const parts = order.items.split(',').map((p) => p.trim()).filter(Boolean);
    orderItems = parts.map((part, idx) => {
      // Format: "Title (Variant) x Qty" or "Title (Variant)"
      const match = part.match(/^(.*?)(?:\s*\((.*?)\))?(?:\s*x\s*(\d+))?$/i);
      const title = (match?.[1] || part)
        .replace(/\s*\(\+\d+\s*more\)/gi, '')
        .replace(/\s*\+\s*\d+\s*more/gi, '')
        .trim();
      const vStr = match?.[2] || 'Standard / L';
      const vParts = vStr.split(/[/•·|-]/).map((s) => s.trim()).filter(Boolean);
      const parsedColor = vParts[0] || color;
      const parsedSize = vParts[1] || size;
      const parsedQty = match?.[3] ? parseInt(match[3], 10) : 1;
      const parsedSku = `${fullSku}-${idx + 1}`;

      return {
        sku: parsedSku,
        title: title || 'Warehouse Order Item',
        image: primaryLine?.imageUrl || primaryProduct?.imageUrl || PRESET_THUMBNAILS[0]?.url || '',
        color: parsedColor,
        size: parsedSize,
        qty: parsedQty,
        unitPrice: Math.round((order.codAmount ?? order.amount) / Math.max(1, order.qty || 1)),
        bin: primaryProduct?.bin?.split('-').slice(0, 3).join('-') || 'A-01-02',
      };
    });
  } else {
    // Single item fallback - strip any "(+1 more)" or "+ 1 more" that might have been stored
    const singleTitle = (primaryLine?.title || primaryProduct?.title || order.items || 'Warehouse Order Item')
      .replace(/\s*\(\+\d+\s*more\)/gi, '')
      .replace(/\s*\+\s*\d+\s*more/gi, '')
      .trim();

    orderItems = [
      {
        sku: fullSku,
        title: singleTitle,
        image: primaryLine?.imageUrl || primaryProduct?.imageUrl || PRESET_THUMBNAILS[0]?.url || '',
        color,
        size,
        qty: order.qty || 1,
        unitPrice: Math.round((order.codAmount ?? order.amount) / (order.qty || 1)),
        bin: primaryProduct?.bin?.split('-').slice(0, 3).join('-') || 'A-01-02',
      },
    ];
  }

  const cleanPrimaryTitle = orderItems[0]?.title || primaryProduct?.title || 'Warehouse Order Item';

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

  const calculatedSubtotal =
    order.subtotal ?? orderItems.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  const calculatedDeliveryFee = order.deliveryFee ?? 80;
  const calculatedDiscount = order.discount ?? 0;
  const calculatedAdvancePayment = order.advancePayment ?? 0;
  const calculatedCod =
    order.codAmount ??
    Math.max(
      0,
      calculatedSubtotal + calculatedDeliveryFee - calculatedDiscount - calculatedAdvancePayment
    );

  const cleanOrderId = (order.id || order.orderNumber || `ORD-${Date.now()}`).replace(/^#/, '').trim();
  const parsedDate = (() => {
    const raw = (order.date || '').trim();
    if (!raw || raw.toLowerCase().includes('just now') || raw.toLowerCase().includes('today')) {
      return new Date();
    }
    if (raw.toLowerCase().includes('yesterday')) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d;
    }
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  })();

  return {
    id: cleanOrderId,
    createdAt: order.date || 'Just now',
    createdAtIso: parsedDate.toISOString(),
    dbStatus: order.status,
    merchantCode,
    merchantName,
    customerName: order.customer,
    customerPhone: order.phone,
    customerAddress: order.address,
    city,
    productTitle: cleanPrimaryTitle,
    productImage:
      orderItems[0]?.image || primaryLine?.imageUrl || primaryProduct?.imageUrl || PRESET_THUMBNAILS[0]?.url || '',
    bin: orderItems[0]?.bin || primaryProduct?.bin?.split('-').slice(0, 3).join('-') || 'A-01-02',
    color: orderItems[0]?.color || color,
    size: orderItems[0]?.size || size,
    sku: orderItems[0]?.sku || fullSku,
    qty: order.qty || orderItems.reduce((acc, it) => acc + it.qty, 0),
    stockAvailable: Math.max(0, primaryProduct?.stock ?? 50),
    items: orderItems,
    memoCode: order.memoCode || 'MEMO-DEFAULT',
    resellerName: matchedMemo?.resellerName || merchantName,
    resellerPhone: matchedMemo?.phone || profile.phone || '01712-345678',
    resellerAddress: matchedMemo?.address || profile.location || 'Dhaka, Bangladesh',
    resellerLogo: matchedMemo?.logoUrl || profile.logoUrl,
    codAmount: calculatedCod,
    totalAmount:
      order.amount ?? Math.max(0, calculatedSubtotal + calculatedDeliveryFee - calculatedDiscount),
    subtotal: calculatedSubtotal,
    deliveryFee: calculatedDeliveryFee,
    discount: calculatedDiscount,
    advancePayment: calculatedAdvancePayment,
    advancePaymentMethod: order.advancePaymentMethod,
    paymentStatus: order.paymentStatus ?? (order.status === 'DELIVERED' ? 'Paid' : 'Unpaid'),
    courier: validCourier,
    trackingCode: order.trackingId,
    stage: stageMap[order.status] || 'PICK',
  };
}

/**
 * Merchant -> Admin: When Merchant creates a new order, add it to Admin Orders Pipeline and deduct Admin stock.
 */
type AdminOrderStockDeltaOp = {
  productId?: string;
  qty: number;
  variantId?: string;
  variantSku?: string;
  color?: string;
  size?: string;
};

function applyAdminProductsOrderStockDelta(
  items: AdminOrderStockDeltaOp[],
  merchantProducts: MerchantProductItem[],
  orderId: string,
  mode: 'WITHDRAWAL' | 'RESTOCK',
  profile?: MerchantProfileData
): void {
  if (items.length === 0) return;
  const adminProducts = getStoredAdminProducts();
  const cleanOrderRef = orderId.replace(/^#/, '').trim();
  const isGenericSize = (s?: string) =>
    ['', 'standard', 'free size', 'free', 'default', 'one size'].includes(
      (s || '').trim().toLowerCase()
    );

  const nextAdminProducts = adminProducts.map((ap) => {
    const matchedMerchantProd = merchantProducts.find((mp) => isMatchingProduct(mp, ap));
    const matchingEntries = items.filter(
      (entry) =>
        entry.productId === ap.id ||
        (matchedMerchantProd && entry.productId === matchedMerchantProd.id) ||
        (entry.variantId && ap.variantsList?.some((v) => v.id === entry.variantId)) ||
        (entry.variantSku &&
          (ap.fullSku === entry.variantSku ||
            ap.variantsList?.some(
              (v) => v.variantSku?.toUpperCase() === entry.variantSku?.toUpperCase()
            )))
    );
    if (matchingEntries.length === 0) return ap;

    const totalQty = matchingEntries.reduce((s, e) => s + (Number(e.qty) || 0), 0);
    const prevStock = ap.stock;
    const newStock = mode === 'WITHDRAWAL' ? Math.max(0, ap.stock - totalQty) : ap.stock + totalQty;
    let updatedVariants = ap.variantsList;

    if (ap.variantsList && ap.variantsList.length > 0) {
      updatedVariants = ap.variantsList.map((v) => {
        const varMatches = matchingEntries.filter((entry) => {
          if (entry.variantId && ap.variantsList?.some((x) => x.id === entry.variantId)) {
            return v.id === entry.variantId;
          }
          if (
            entry.variantSku &&
            ap.variantsList?.some(
              (x) => x.variantSku?.toUpperCase() === entry.variantSku?.toUpperCase()
            )
          ) {
            return v.variantSku?.toUpperCase() === entry.variantSku.toUpperCase();
          }
          if (entry.color) {
            const colorMatch = (v.color || '').toLowerCase() === entry.color.toLowerCase();
            if (!colorMatch) return false;
            return (
              !entry.size ||
              (v.size || '').toLowerCase() === entry.size.toLowerCase() ||
              (isGenericSize(entry.size) && isGenericSize(v.size))
            );
          }
          return ap.variantsList?.length === 1;
        });

        if (varMatches.length === 0) return v;

        const vQty = varMatches.reduce((s, e) => s + (Number(e.qty) || 0), 0);
        const firstEntry = varMatches[0];
        const prevVar = v.stock;
        const newVar = mode === 'WITHDRAWAL' ? Math.max(0, v.stock - vQty) : v.stock + vQty;

        appendStockLedgerRecord({
          type: mode,
          merchantCode: ap.merchantCode || profile?.merchantCode || 'MC-101',
          merchantName: ap.merchantName || profile?.storeName || "Sabbir's Store",
          productId: ap.id,
          productTitle: `${ap.title}${
            firstEntry.color || firstEntry.size
              ? ` (${[firstEntry.color, firstEntry.size].filter(Boolean).join(' · ')})`
              : ''
          }`,
          sku: v.variantSku || firstEntry.variantSku || ap.fullSku,
          deltaQty: mode === 'WITHDRAWAL' ? -vQty : vQty,
          previousStock: prevVar,
          newStock: newVar,
          binCode: ap.binCode || 'A-01-01',
          referenceDocType: 'INTERNAL_AUDIT',
          referenceNumber: cleanOrderRef,
          notes:
            mode === 'WITHDRAWAL'
              ? `Order reservation: #${cleanOrderRef} (${vQty} units reserved)`
              : `Stock released from cancelled order #${cleanOrderRef} (+${vQty} units restored)`,
          operator:
            mode === 'WITHDRAWAL'
              ? 'System / Order Allocation'
              : 'Warehouse Admin / Order Cancel',
        });
        return { ...v, stock: newVar };
      });
    } else {
      appendStockLedgerRecord({
        type: mode,
        merchantCode: ap.merchantCode || profile?.merchantCode || 'MC-101',
        merchantName: ap.merchantName || profile?.storeName || "Sabbir's Store",
        productId: ap.id,
        productTitle: ap.title,
        sku: ap.fullSku,
        deltaQty: mode === 'WITHDRAWAL' ? -totalQty : totalQty,
        previousStock: prevStock,
        newStock: newStock,
        binCode: ap.binCode || 'A-01-01',
        referenceDocType: 'INTERNAL_AUDIT',
        referenceNumber: cleanOrderRef,
        notes:
          mode === 'WITHDRAWAL'
            ? `Order reservation: #${cleanOrderRef} (${totalQty} units reserved)`
            : `Stock released from cancelled order #${cleanOrderRef} (+${totalQty} units restored)`,
        operator:
          mode === 'WITHDRAWAL'
            ? 'System / Order Allocation'
            : 'Warehouse Admin / Order Cancel',
      });
    }

    return {
      ...ap,
      stock: newStock,
      reserved:
        mode === 'WITHDRAWAL'
          ? (ap.reserved || 0) + totalQty
          : Math.max(0, (ap.reserved || 0) - totalQty),
      variantsList: updatedVariants,
    };
  });
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdminProducts));
}

export function syncMerchantOrderCreatedToAdmin(
  order: MerchantOrderItem,
  itemsToDeduct: AdminOrderStockDeltaOp[],
  merchantProducts: MerchantProductItem[],
  memoList: ResellerMemo[],
  profile: MerchantProfileData = INITIAL_MERCHANT_PROFILE
): void {
  if (typeof window === 'undefined') return;
  try {
    const adminOrders = getStoredAdminOrders();
    const orderId = (order.id || order.orderNumber || '').replace(/^#/, '').trim();

    const pipelineOrder = convertMerchantOrderToWarehouse(
      order,
      merchantProducts,
      memoList,
      profile
    );

    // Update existing or prepend new order with full items array preserved
    const existingIndex = adminOrders.findIndex((ao) => ao.id === orderId);
    let nextAdminOrders: WarehousePipelineOrder[];
    if (existingIndex >= 0) {
      nextAdminOrders = [...adminOrders];
      nextAdminOrders[existingIndex] = pipelineOrder;
    } else {
      nextAdminOrders = [pipelineOrder, ...adminOrders];
    }
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(nextAdminOrders));

    // Deduct stock on matching Admin products and variants (supports multiple variants per product)
    applyAdminProductsOrderStockDelta(
      itemsToDeduct,
      merchantProducts,
      orderId,
      'WITHDRAWAL',
      profile
    );

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
  itemsToRestore: AdminOrderStockDeltaOp[],
  merchantProducts: MerchantProductItem[]
): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanId = orderId.replace(/^#/, '').toLowerCase().trim();
    const adminOrders = getStoredAdminOrders();
    const nextAdminOrders = adminOrders.map((ao) => {
      const aoClean = (ao.id || '').replace(/^#/, '').toLowerCase().trim();
      return aoClean === cleanId || ao.id === cleanId || ao.id === orderId
        ? { ...ao, stage: 'CANCELLED' as const, stockAvailable: ao.stockAvailable + ao.qty }
        : ao;
    });
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(nextAdminOrders));

    applyAdminProductsOrderStockDelta(
      itemsToRestore,
      merchantProducts,
      cleanId,
      'RESTOCK'
    );

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
        const converted: MerchantOrderItem[] = newAdminOrders.map((ao) => {
          const cleanId = (ao.id || '').replace(/^#/, '').trim();
          return {
            id: cleanId,
            orderNumber: cleanId,
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
        };
      });
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

    // Approved, pending-approval, and draft products are synced with their true status.
    const extraProds: import('@/features/admin/merchants/types').MerchantProductItem[] = adminProds
      .filter(
        (ap) =>
          (ap.status === 'APPROVED' ||
            ap.status === 'STOCK_STORED' ||
            ap.status === 'PENDING_APPROVAL' ||
            ap.status === 'REJECTED' ||
            ap.status === 'DRAFT' ||
            ap.isDraft) &&
          !baseProducts.some((bp) => bp.sku === ap.fullSku || bp.id === ap.id)
      )
      .map((ap) => {
        const isDraft = ap.status === 'DRAFT' || Boolean(ap.isDraft);
        const isRejected = !isDraft && ap.status === 'REJECTED';
        return {
          id: ap.id,
          merchantCode: ap.merchantCode,
          title: ap.title,
          category: ap.category as any,
          sku: ap.fullSku,
          barcode: ap.barcode || '8900000000000',
          color: ap.color,
          size: ap.size,
          price: ap.price,
          wholesalePrice: Math.round(ap.price * 0.75),
          stock: ap.stock,
          reserved: 0,
          damaged: 0,
          bin: ap.status === 'PENDING_APPROVAL' ? 'Pending Approval' : ap.binCode,
          imageUrl: ap.imageUrl,
          isDraft,
          rejectionReason: ap.rejectionReason,
          status: isDraft
            ? ('DRAFT' as const)
            : isRejected
              ? ('REJECTED' as const)
              : ap.status === 'PENDING_APPROVAL'
                ? ('PENDING_APPROVAL' as const)
                : ('APPROVED' as const),
        };
      });

    const syncedProds = [
      ...extraProds,
      ...baseProducts.map((bp) => {
        const match = adminProds.find((ap) => ap.fullSku === bp.sku || ap.id === bp.id);
        if (!match) return bp;
        const isDraft = match.status === 'DRAFT' || Boolean(match.isDraft);
        const isRejected = !isDraft && match.status === 'REJECTED';
        return {
          ...bp,
          stock: match.stock,
          bin: match.binCode,
          price: match.price,
          isDraft,
          rejectionReason: isRejected ? (match.rejectionReason ?? bp.rejectionReason) : undefined,
          status: isDraft
            ? ('DRAFT' as const)
            : isRejected
              ? ('REJECTED' as const)
              : match.status === 'PENDING_APPROVAL'
                ? ('PENDING_APPROVAL' as const)
                : ('APPROVED' as const),
        };
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
      .filter(
        (ao) =>
          !baseOrders.some((bo) => bo.id === ao.id) &&
          !INITIAL_PIPELINE_ORDERS.some((seed) => seed.id === ao.id)
      )
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
  logoUrl?: string;
}

export function getStoredMerchantMemos(): ResellerMemo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MERCHANT_MEMOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
      logoUrl: memo.logoUrl || undefined,
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
        logoUrl: mm.logoUrl || undefined,
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
        logoUrl: am.logoUrl,
      });
    });

    return Array.from(memoMap.values());
  } catch {
    return baseMemos;
  }
}

// ---------------------------------------------------------------------------
// Admin Merchant Profile -> Warehouse catalog actions
// (approve / reject pending submissions, stock adjust, admin-created products)
// ---------------------------------------------------------------------------

function emitWarehouseSync(source: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('fulfillio-warehouse-sync', { detail: { source } }));
}

function loadAdminProductsReconciled(): WarehouseProductItem[] {
  return reconcileAdminProductsWithMerchant(getStoredAdminProducts());
}

function appendStockLedgerRecord(
  movement: Omit<StockMovementRecord, 'id' | 'timestamp' | 'digitalProofHash' | 'verifiedAt'>
): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STOCK_LEDGER);
    let ledger: StockMovementRecord[] = INITIAL_STOCK_MOVEMENTS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) ledger = parsed;
    }
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const id = `PRF-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const record: StockMovementRecord = {
      ...movement,
      id,
      timestamp: timeStr,
      digitalProofHash: generateDigitalProofHash(
        `${id}-${movement.sku}-${movement.deltaQty}-${timeStr}`
      ),
      verifiedAt: timeStr,
    };
    localStorage.setItem(STORAGE_KEY_STOCK_LEDGER, JSON.stringify([record, ...ledger]));
  } catch {
    // ignore
  }
}

/**
 * Admin approves a merchant-submitted product: it becomes APPROVED (published) in the
 * warehouse catalog and is pushed back to the merchant as PUBLISHED.
 */
export function approveAdminProductSubmission(
  productId: string,
  finalQty: number,
  finalBin: string
): WarehouseProductItem | null {
  if (typeof window === 'undefined') return null;
  try {
    const current = loadAdminProductsReconciled();
    const target = current.find((p) => p.id === productId);
    if (!target) return null;

    const qty = Math.max(0, Math.floor(finalQty));
    const bin = cleanBinCode(finalBin) || 'A-01-02';
    const approved: WarehouseProductItem = {
      ...target,
      status: 'APPROVED',
      isDraft: false,
      binCode: bin,
      stock: qty,
      submittedAt: 'Approved just now',
    };
    const next = current.map((p) => (p.id === productId ? approved : p));
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
    syncAdminProductsToMerchant(next);

    appendStockLedgerRecord({
      type: 'INITIAL_INTAKE',
      merchantCode: target.merchantCode,
      merchantName: target.merchantName,
      productId: target.id,
      productTitle: target.title,
      sku: target.fullSku,
      deltaQty: qty,
      previousStock: 0,
      newStock: qty,
      binCode: bin,
      referenceDocType: 'INWARD_CHALLAN',
      referenceNumber: `CHL-${Date.now().toString().slice(-6)}`,
      operator: 'Warehouse Receiving Officer',
      carrierOrCourier: 'Initial Catalog Intake Consignment',
      notes: `Catalog submission approved. Slotted ${qty} units into Bin ${bin}.`,
    });

    emitWarehouseSync('AdminMerchantDirectory');
    return approved;
  } catch {
    return null;
  }
}

/**
 * Admin rejects a pending submission: saves in REJECTED state with rejectionReason and syncs to merchant.
 */
export function rejectAdminProductSubmission(
  productId: string,
  reason?: string
): WarehouseProductItem | null {
  if (typeof window === 'undefined') return null;
  try {
    const current = loadAdminProductsReconciled();
    const target = current.find((p) => p.id === productId);
    if (!target) return null;
    const rejectedItem: WarehouseProductItem = {
      ...target,
      status: 'REJECTED',
      isDraft: false,
      rejectionReason: reason?.trim() || target.rejectionReason || 'Rejected by admin',
    };
    const next = current.map((p) => (p.id === productId ? rejectedItem : p));
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
    syncAdminProductsToMerchant(next);
    emitWarehouseSync('AdminMerchantDirectory');
    return rejectedItem;
  } catch {
    return null;
  }
}

/**
 * Persist a +/- stock adjustment for an approved warehouse product.
 * Returns false when the product is not in the warehouse catalog (or is still pending).
 */
export function adjustAdminProductStock(productId: string, delta: number): boolean {
  if (typeof window === 'undefined' || delta === 0) return false;
  try {
    const current = loadAdminProductsReconciled();
    const target = current.find((p) => p.id === productId);
    if (!target || target.status === 'PENDING_APPROVAL') return false;

    const previous = target.stock;
    const nextStock = Math.max(0, previous + delta);
    const next = current.map((p) => (p.id === productId ? { ...p, stock: nextStock } : p));
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
    syncAdminProductsToMerchant(next);

    appendStockLedgerRecord({
      type: 'AUDIT_ADJUSTMENT',
      merchantCode: target.merchantCode,
      merchantName: target.merchantName,
      productId: target.id,
      productTitle: target.title,
      sku: target.fullSku,
      deltaQty: nextStock - previous,
      previousStock: previous,
      newStock: nextStock,
      binCode: target.binCode,
      referenceDocType: 'INTERNAL_AUDIT',
      referenceNumber: `AUD-${Date.now().toString().slice(-6)}`,
      operator: 'Warehouse Inventory Controller',
      carrierOrCourier: 'Internal Shelf Cycle Count',
      notes: `Manual stock adjustment of ${delta > 0 ? `+${delta}` : delta} pcs.`,
    });

    emitWarehouseSync('AdminMerchantDirectory');
    return true;
  } catch {
    return false;
  }
}

/**
 * Admin adds a product directly under a merchant (already approved / published).
 */
export function addAdminCatalogProductForMerchant(
  item: import('@/features/admin/merchants/types').MerchantProductItem,
  merchantName: string
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = loadAdminProductsReconciled();
    const { shortSku, fullSku } = normalizeFullSku(item.sku, item.merchantCode);
    const created: WarehouseProductItem = {
      id: item.id,
      title: item.title,
      category: item.category === 'Beauty' ? 'Accessories' : item.category,
      merchantCode: item.merchantCode,
      merchantName,
      shortSku,
      fullSku,
      color: item.color,
      size: item.size,
      binCode: cleanBinCode(item.bin) || 'A-01-02',
      stock: item.stock,
      price: item.price,
      status: 'APPROVED',
      submittedAt: 'Added by admin',
      imageUrl: item.imageUrl || PRESET_THUMBNAILS[0]?.url || '',
      barcode: item.barcode,
    };
    const next = [created, ...current];
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(next));
    syncAdminProductsToMerchant(next);
    emitWarehouseSync('AdminMerchantDirectory');
    return true;
  } catch {
    return false;
  }
}


/**
 * Sync Merchant Inbound Restock or Stock Return / Recall request to Admin Storage
 */
export function syncMerchantStockRequestToAdmin(
  request: StockRequestItem,
  profile: MerchantProfileData
): void {
  if (typeof window === 'undefined') return;
  try {
    const isReturn = request.type === 'RETURN';
    if (isReturn) {
      const raw = localStorage.getItem(STORAGE_KEY_STOCK_WITHDRAWALS);
      let list: StockWithdrawalRequest[] = INITIAL_STOCK_WITHDRAWALS;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
      const existingIdx = list.findIndex((w) => w.id === request.id);
      const withdrawalItem: StockWithdrawalRequest = {
        id: request.id,
        productId: request.productId,
        productTitle: request.productTitle,
        productSku: request.productSku,
        merchantCode: profile.merchantCode,
        merchantName: profile.storeName,
        category: 'Fashion',
        currentStock: request.currentStock,
        withdrawQty: request.requestedQty,
        binCode: 'A-01-04',
        status: request.status,
        reason: request.reason || request.note || 'Merchant requested stock return to outlet.',
        destination: request.destination,
        trackingRef: request.trackingRef || `RET-${Date.now().toString().slice(-6)}`,
        submittedAt: 'Just now',
        imageUrl: request.imageUrl || PRESET_THUMBNAILS[0]?.url || '',
      };
      const next = existingIdx >= 0
        ? list.map((w, idx) => (idx === existingIdx ? withdrawalItem : w))
        : [withdrawalItem, ...list];
      localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(next));
    } else {
      const raw = localStorage.getItem(STORAGE_KEY_STOCK_REQUESTS);
      let list: InboundStockReplenishment[] = INITIAL_STOCK_REPLENISHMENTS;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
      const existingIdx = list.findIndex((r) => r.id === request.id);
      const replenishmentItem: InboundStockReplenishment = {
        id: request.id,
        productId: request.productId,
        productTitle: request.productTitle,
        productSku: request.productSku,
        merchantCode: profile.merchantCode,
        merchantName: profile.storeName,
        category: 'Fashion',
        currentStock: request.currentStock,
        requestedQty: request.requestedQty,
        binCode: 'A-01-02',
        status: request.status,
        note: request.note || 'Merchant inbound restock consignment',
        trackingRef: request.trackingRef || `INB-${Date.now().toString().slice(-6)}`,
        submittedAt: 'Just now',
        imageUrl: request.imageUrl || PRESET_THUMBNAILS[0]?.url || '',
      };
      const next = existingIdx >= 0
        ? list.map((r, idx) => (idx === existingIdx ? replenishmentItem : r))
        : [replenishmentItem, ...list];
      localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(next));
    }
    emitWarehouseSync('MerchantStockRequest');
  } catch {}
}

/**
 * Admin approves Inbound Stock Replenishment: adds stock to warehouse catalog,
 * syncs to merchant, updates replenishment status, logs to audit ledger.
 */
export function approveAdminStockReplenishment(
  replenishmentId: string,
  finalQty: number,
  targetBin: string
): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawRepl = localStorage.getItem(STORAGE_KEY_STOCK_REQUESTS);
    let replenishments: InboundStockReplenishment[] = INITIAL_STOCK_REPLENISHMENTS;
    if (rawRepl) {
      const parsed = JSON.parse(rawRepl);
      if (Array.isArray(parsed) && parsed.length > 0) replenishments = parsed;
    }
    const target = replenishments.find((r) => r.id === replenishmentId);
    if (!target) return false;

    const cleanBin = cleanBinCode(targetBin) || target.binCode || 'A-01-02';

    // 1. Update product stock in warehouse catalog
    const prods = loadAdminProductsReconciled();
    const updatedProds = prods.map((p) => {
      if (p.id === target.productId || p.fullSku === target.productSku) {
        return {
          ...p,
          stock: p.stock + finalQty,
          binCode: cleanBin,
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProds));
    syncAdminProductsToMerchant(updatedProds);

    // 2. Mark replenishment as APPROVED in admin storage
    const updatedRepls = replenishments.map((r) =>
      r.id === replenishmentId
        ? {
            ...r,
            status: 'APPROVED' as const,
            requestedQty: finalQty,
            binCode: cleanBin,
          }
        : r
    );
    localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(updatedRepls));

    // 3. Update merchant's scoped stock requests
    const merchantKey = getMerchantStockRequestsKey(target.merchantCode);
    const rawMerchantReqs = localStorage.getItem(merchantKey);
    if (rawMerchantReqs) {
      try {
        const parsedM = JSON.parse(rawMerchantReqs);
        if (Array.isArray(parsedM)) {
          const nextM = parsedM.map((mr) =>
            mr.id === replenishmentId || mr.productId === target.productId
              ? { ...mr, status: 'APPROVED' as const, requestedQty: finalQty }
              : mr
          );
          localStorage.setItem(merchantKey, JSON.stringify(nextM));
        }
      } catch {}
    }

    // 4. Append stock movement ledger entry
    appendStockLedgerRecord({
      type: 'RESTOCK',
      merchantCode: target.merchantCode,
      merchantName: target.merchantName,
      productId: target.productId,
      productTitle: target.productTitle,
      sku: target.productSku,
      deltaQty: finalQty,
      previousStock: target.currentStock,
      newStock: target.currentStock + finalQty,
      binCode: cleanBin,
      referenceDocType: 'INWARD_CHALLAN',
      referenceNumber: target.trackingRef || `CHL-${Date.now().toString().slice(-6)}`,
      operator: 'Receiving Dock Officer',
      carrierOrCourier: target.note || 'Steadfast Cargo Consignment',
      notes: `Restock consignment received. Slotted ${finalQty} units into Bin ${cleanBin}.`,
    });

    emitWarehouseSync('AdminInboundIntake');
    return true;
  } catch {
    return false;
  }
}

/**
 * Admin rejects Inbound Stock Replenishment
 */
export function rejectAdminStockReplenishment(replenishmentId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawRepl = localStorage.getItem(STORAGE_KEY_STOCK_REQUESTS);
    let replenishments: InboundStockReplenishment[] = INITIAL_STOCK_REPLENISHMENTS;
    if (rawRepl) {
      const parsed = JSON.parse(rawRepl);
      if (Array.isArray(parsed)) replenishments = parsed;
    }
    const target = replenishments.find((r) => r.id === replenishmentId);
    if (!target) return false;

    const updatedRepls = replenishments.map((r) =>
      r.id === replenishmentId ? { ...r, status: 'REJECTED' as const } : r
    );
    localStorage.setItem(STORAGE_KEY_STOCK_REQUESTS, JSON.stringify(updatedRepls));

    // Also update merchant scoped
    const merchantKey = getMerchantStockRequestsKey(target.merchantCode);
    const rawM = localStorage.getItem(merchantKey);
    if (rawM) {
      try {
        const parsedM = JSON.parse(rawM);
        if (Array.isArray(parsedM)) {
          const nextM = parsedM.map((mr) =>
            mr.id === replenishmentId ? { ...mr, status: 'REJECTED' as const } : mr
          );
          localStorage.setItem(merchantKey, JSON.stringify(nextM));
        }
      } catch {}
    }

    emitWarehouseSync('AdminInboundIntake');
    return true;
  } catch {
    return false;
  }
}

/**
 * Admin approves Merchant Stock Return / Recall: deducts stock from warehouse catalog,
 * syncs to merchant, issues delivery gate pass, logs to audit ledger.
 */
export function approveAdminStockWithdrawal(
  withdrawalId: string,
  approvedQty?: number
): { ok: boolean; gatePassNo?: string } {
  if (typeof window === 'undefined') return { ok: false };
  try {
    const rawWith = localStorage.getItem(STORAGE_KEY_STOCK_WITHDRAWALS);
    let withdrawals: StockWithdrawalRequest[] = INITIAL_STOCK_WITHDRAWALS;
    if (rawWith) {
      const parsed = JSON.parse(rawWith);
      if (Array.isArray(parsed) && parsed.length > 0) withdrawals = parsed;
    }
    const target = withdrawals.find((w) => w.id === withdrawalId);
    if (!target) return { ok: false };

    const withdrawAmount = approvedQty && approvedQty > 0 ? approvedQty : target.withdrawQty;
    const gatePassNo = `GP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Deduct stock from warehouse catalog
    const prods = loadAdminProductsReconciled();
    const updatedProds = prods.map((p) => {
      if (p.id === target.productId || p.fullSku === target.productSku) {
        return {
          ...p,
          stock: Math.max(0, p.stock - withdrawAmount),
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(updatedProds));
    syncAdminProductsToMerchant(updatedProds);

    // 2. Mark withdrawal as APPROVED in admin storage
    const updatedWiths = withdrawals.map((w) =>
      w.id === withdrawalId
        ? {
            ...w,
            status: 'APPROVED' as const,
            withdrawQty: withdrawAmount,
            gatePassNo,
          }
        : w
    );
    localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(updatedWiths));

    // 3. Update merchant's scoped stock requests
    const merchantKey = getMerchantStockRequestsKey(target.merchantCode);
    const rawMerchantReqs = localStorage.getItem(merchantKey);
    if (rawMerchantReqs) {
      try {
        const parsedM = JSON.parse(rawMerchantReqs);
        if (Array.isArray(parsedM)) {
          const nextM = parsedM.map((mr) =>
            mr.id === withdrawalId || (mr.productId === target.productId && mr.type === 'RETURN')
              ? { ...mr, status: 'APPROVED' as const, requestedQty: withdrawAmount, gatePassNo }
              : mr
          );
          localStorage.setItem(merchantKey, JSON.stringify(nextM));
        }
      } catch {}
    }

    // 4. Append stock movement ledger entry
    appendStockLedgerRecord({
      type: 'WITHDRAWAL',
      merchantCode: target.merchantCode,
      merchantName: target.merchantName,
      productId: target.productId,
      productTitle: target.productTitle,
      sku: target.productSku,
      deltaQty: -withdrawAmount,
      previousStock: target.currentStock,
      newStock: Math.max(0, target.currentStock - withdrawAmount),
      binCode: target.binCode || 'A-01-04',
      referenceDocType: 'INTERNAL_AUDIT',
      referenceNumber: gatePassNo,
      operator: 'Warehouse Dispatch Controller',
      carrierOrCourier: 'Merchant Outlet Courier Transfer',
      notes: `Merchant stock return approved. Issued Gate Pass ${gatePassNo}. Dispatched ${withdrawAmount} units to ${target.destination || 'Merchant Outlet'}. Reason: ${target.reason || 'Recall'}.`,
    });

    emitWarehouseSync('AdminStockWithdrawal');
    return { ok: true, gatePassNo };
  } catch {
    return { ok: false };
  }
}

/**
 * Admin rejects Merchant Stock Return / Recall
 */
export function rejectAdminStockWithdrawal(withdrawalId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const rawWith = localStorage.getItem(STORAGE_KEY_STOCK_WITHDRAWALS);
    let withdrawals: StockWithdrawalRequest[] = INITIAL_STOCK_WITHDRAWALS;
    if (rawWith) {
      const parsed = JSON.parse(rawWith);
      if (Array.isArray(parsed)) withdrawals = parsed;
    }
    const target = withdrawals.find((w) => w.id === withdrawalId);
    if (!target) return false;

    const updatedWiths = withdrawals.map((w) =>
      w.id === withdrawalId ? { ...w, status: 'REJECTED' as const } : w
    );
    localStorage.setItem(STORAGE_KEY_STOCK_WITHDRAWALS, JSON.stringify(updatedWiths));

    // Also update merchant scoped
    const merchantKey = getMerchantStockRequestsKey(target.merchantCode);
    const rawM = localStorage.getItem(merchantKey);
    if (rawM) {
      try {
        const parsedM = JSON.parse(rawM);
        if (Array.isArray(parsedM)) {
          const nextM = parsedM.map((mr) =>
            mr.id === withdrawalId ? { ...mr, status: 'REJECTED' as const } : mr
          );
          localStorage.setItem(merchantKey, JSON.stringify(nextM));
        }
      } catch {}
    }

    emitWarehouseSync('AdminStockWithdrawal');
    return true;
  } catch {
    return false;
  }
}

/**
 * Sync product draft/published status directly to PostgreSQL (pgAdmin) database
 */
export async function syncProductStatusToDatabase(
  productId: string,
  status: 'PUBLISHED' | 'STOCK_STORED' | 'APPROVED' | 'DRAFT' | 'PENDING_APPROVAL',
  merchantCode?: string
): Promise<boolean> {
  if (!productId) return false;
  try {
    const res = await fetch(`${API_BASE}/inventory/products/${encodeURIComponent(productId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(merchantCode ? { 'x-merchant-code': merchantCode } : {}),
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Failed to update product status in PostgreSQL:', err);
    return false;
  }
}

/**
 * Merchant -> Admin: Sync a pending product edit (or cancellation) without mutating live product fields.
 */
export function syncMerchantProductRevisionToAdmin(
  productId: string,
  pendingEdit: ProductPendingEditInfo | null,
  editState: 'EDIT_APPROVAL_PENDING' | null,
  lastEditRejectionReason?: string
): void {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const currentAdmin = getStoredAdminProducts();
    let changed = false;
    const nextAdmin = currentAdmin.map((ap) => {
      if (ap.id !== productId && ap.shortSku !== productId && ap.fullSku !== productId) {
        return ap;
      }
      changed = true;
      return {
        ...ap,
        editState,
        pendingEdit,
        lastEditRejectionReason,
      };
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdmin));
      window.dispatchEvent(
        new CustomEvent('fulfillio-warehouse-sync', { detail: { source: 'MerchantContext' } })
      );
    }
  } catch {
    // ignore
  }
}

/**
 * Admin reviews a pending product edit (APPROVE applies snapshot to live product; REJECT discards edit).
 */
export async function reviewProductRevisionInDatabase(
  productId: string,
  action: 'APPROVE' | 'REJECT',
  reason?: string
): Promise<{ ok: boolean; data?: any; error?: string }> {
  if (!productId) return { ok: false, error: 'Missing product ID' };
  try {
    const res = await fetch(
      `${API_BASE}/inventory/products/${encodeURIComponent(productId)}/review-revision`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ action, reason }),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message || `HTTP ${res.status}`,
      };
    }
    const data = await res.json().catch(() => null);
    return { ok: true, data };
  } catch (err: any) {
    console.warn('[Sync] Failed to review product revision in PostgreSQL:', err);
    return { ok: false, error: err?.message || 'Network request failed' };
  }
}

/**
 * Persist product rejection state and reason to PostgreSQL (pgAdmin) database
 */
export async function rejectProductInDatabase(
  productId: string,
  reason?: string
): Promise<boolean> {
  if (!productId) return false;
  try {
    const res = await fetch(
      `${API_BASE}/inventory/products/${encodeURIComponent(productId)}/reject-submission`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          reason: reason?.trim() || 'Rejected by admin',
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Failed to reject product in PostgreSQL:', err);
    return false;
  }
}

/**
 * Permanently delete a product from PostgreSQL (pgAdmin) database (only allowed when stock === 0)
 */
export async function deleteProductFromDatabase(
  productId: string,
  merchantCode?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!productId) return { ok: false, error: 'Missing product ID' };
  try {
    const res = await fetch(`${API_BASE}/inventory/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(merchantCode ? { 'x-merchant-code': merchantCode } : {}),
        ...getAuthHeaders(),
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data?.message || 'Failed to delete product from database' };
    }
    return { ok: true };
  } catch (err: any) {
    console.warn('[Sync] Failed to delete product from PostgreSQL:', err);
    return { ok: false, error: err?.message };
  }
}

/**
 * Step 1: Sync catalog approval & slotting to PostgreSQL (pgAdmin) database
 */
export async function approveProductInDatabase(
  productId: string,
  binCode: string,
  finalQty: number,
  acceptStockNow: boolean,
  variantStocks?: Record<string, number>
): Promise<boolean> {
  if (!productId) return false;
  try {
    const res = await fetch(`${API_BASE}/inventory/products/${encodeURIComponent(productId)}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        binCode,
        finalQty,
        acceptStockNow,
        variantStocks,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Failed to approve product in PostgreSQL:', err);
    return false;
  }
}

/**
 * Step 2: Sync physical stock acceptance into warehouse bin (Store Done) to PostgreSQL
 */
export async function acceptStockInDatabase(
  productId: string,
  quantity: number,
  binCode: string,
  challanOrTracking?: string,
  note?: string
): Promise<boolean> {
  if (!productId) return false;
  try {
    const res = await fetch(`${API_BASE}/inventory/products/${encodeURIComponent(productId)}/accept-stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        quantity,
        binCode,
        challanOrTracking,
        note,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Failed to accept stock in PostgreSQL:', err);
    return false;
  }
}

/**
 * Update order stage/status in PostgreSQL (pgAdmin) database
 */
export async function updateOrderStatusInDatabase(
  orderId: string,
  status: string,
  options?: { isMemoPrinted?: boolean }
): Promise<boolean> {
  if (!orderId) return false;
  const cleanId = orderId.replace(/^#/, '').trim();
  try {
    const payload: Record<string, any> = { status };
    if (options?.isMemoPrinted !== undefined) {
      payload.isMemoPrinted = options.isMemoPrinted;
    }
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(cleanId)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Failed to update order status in PostgreSQL:', err);
    return false;
  }
}

/**
 * Cancel order in PostgreSQL database: triggers atomic reserved stock release & audit log
 */
export async function cancelOrderInDatabase(
  orderId: string,
  reason?: string
): Promise<boolean> {
  if (!orderId) return false;
  const cleanId = orderId.replace(/^#/, '').trim();
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(cleanId)}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ reason: reason || '' }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Sync] Failed to cancel order in PostgreSQL:', err);
    return false;
  }
}

const DB_STAGE_MAP: Record<string, OrderStage> = {
  ALLOCATED: 'PICK',
  PICKING: 'PICK',
  ON_HOLD_STOCK: 'WAITING',
  ON_HOLD_FRAUD: 'WAITING',
  PACKED: 'PACK',
  DISPATCHED: 'DISPATCH',
  DELIVERED: 'HANDED_OVER',
  PARTIAL_DELIVERED: 'HANDED_OVER',
  RETURNED: 'CANCELLED',
  CANCELLED: 'CANCELLED',
  PENDING: 'PICK',
};

function resolveDbOrderItemBin(it: any): string {
  const invItems = Array.isArray(it?.variant?.inventoryItems) ? it.variant.inventoryItems : [];
  const activeStockInv = invItems.find(
    (inv: any) =>
      !inv?.location?.isDamaged &&
      inv?.location?.binCode &&
      (Number(inv.quantityAvailable || 0) + Number(inv.quantityReserved || 0)) > 0,
  );
  if (activeStockInv?.location?.binCode) {
    return String(activeStockInv.location.binCode);
  }
  const anyLocInv = invItems.find((inv: any) => inv?.location?.binCode);
  if (anyLocInv?.location?.binCode) {
    return String(anyLocInv.location.binCode);
  }
  if (it?.variant?.defaultBinCode) {
    return String(it.variant.defaultBinCode);
  }
  // Cross-reference Admin/Merchant local catalog by SKU if variant relation wasn't linked
  const itemSku = String(it?.sku || '').trim().toUpperCase();
  if (itemSku) {
    const adminMatch = getStoredAdminProducts().find(
      (ap) =>
        String(ap.fullSku || '').trim().toUpperCase() === itemSku ||
        String(ap.shortSku || '').trim().toUpperCase() === itemSku,
    );
    if (
      adminMatch?.binCode &&
      adminMatch.binCode !== 'Pending Approval' &&
      adminMatch.binCode !== 'Assigned on intake'
    ) {
      return adminMatch.binCode;
    }
  }
  return 'Unassigned';
}

export function mapDbOrderToWarehouseOrder(o: any): WarehousePipelineOrder {
  const cleanId = String(o.externalOrderId || o.id || '').replace(/^#/, '').trim();
  const firstItem = (o.items && o.items[0]) || {};
  const itemTitle =
    firstItem.productTitle ||
    firstItem.variant?.title ||
    firstItem.variant?.product?.title ||
    'Product Item';
  const itemSku = firstItem.sku || firstItem.variant?.sku || 'SKU-001';
  const totalQty =
    (o.items || []).reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1;

  const mappedItems: OrderItem[] = (o.items || []).map((it: any) => {
    const vLabel = it.variantLabel || '';
    const color = vLabel.includes('·') ? vLabel.split('·')[0].trim() : 'Standard';
    const size = vLabel.includes('·') ? vLabel.split('·')[1].trim() : 'Standard';
    return {
      sku: it.sku || it.variant?.sku || '',
      title: it.productTitle || it.variant?.title || 'Product Item',
      image: it.variant?.imageUrl || it.variant?.product?.imageUrl || '',
      color,
      size,
      qty: it.quantity || 1,
      unitPrice: Number(it.unitPrice) || 0,
      bin: resolveDbOrderItemBin(it),
    };
  });

  const firstColor = firstItem.variantLabel?.includes('·')
    ? firstItem.variantLabel.split('·')[0].trim()
    : 'Standard';
  const firstSize = firstItem.variantLabel?.includes('·')
    ? firstItem.variantLabel.split('·')[1].trim()
    : 'Standard';

  const dbSubtotal = Number(o.subtotal ?? 0);
  const dbDeliveryFee = Number(o.deliveryFee ?? 0);
  const dbDiscount = Number(o.discount ?? 0);
  const dbAdvancePayment = Number(o.advancePayment ?? 0);
  const dbTotalAmount = Number(o.totalAmount ?? 0);
  const itemsSubtotal = mappedItems.reduce((sum, it) => sum + it.unitPrice * it.qty, 0);
  const resolvedSubtotal =
    dbSubtotal > 0
      ? dbSubtotal
      : itemsSubtotal > 0
      ? itemsSubtotal
      : Math.max(0, dbTotalAmount - dbDeliveryFee + dbDiscount);
  const resolvedTotalAmount =
    dbTotalAmount > 0
      ? dbTotalAmount
      : Math.max(0, resolvedSubtotal + dbDeliveryFee - dbDiscount);
  const resolvedCodAmount =
    o.codAmount !== null && o.codAmount !== undefined
      ? Number(o.codAmount)
      : Math.max(0, resolvedTotalAmount - dbAdvancePayment);

  return {
    id: cleanId,
    createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Today',
    createdAtIso: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    dbStatus: o.status || undefined,
    merchantCode: o.merchant?.merchantCode || 'MC-101',
    merchantName: o.merchant?.businessName || "Sabbir's Store",
    customerName: o.customerName || 'Customer',
    customerPhone: o.customerPhone || '',
    customerAddress: o.customerAddress || '',
    city: o.city || 'Dhaka',
    productTitle:
      o.items && o.items.length > 1 ? `${itemTitle} (+${o.items.length - 1} more)` : itemTitle,
    productImage: firstItem.variant?.imageUrl || firstItem.variant?.product?.imageUrl || '',
    bin: mappedItems[0]?.bin || resolveDbOrderItemBin(firstItem),
    color: firstColor,
    size: firstSize,
    sku: itemSku,
    qty: totalQty,
    stockAvailable: 15,
    items: mappedItems.length > 0 ? mappedItems : undefined,
    memoCode: o.memoCode || 'MEMO-DEFAULT',
    resellerName: o.merchant?.businessName || "Sabbir's Store",
    resellerPhone: o.merchant?.phone || '',
    resellerAddress: o.merchant?.location || 'Dhaka, Bangladesh',
    resellerLogo: o.merchant?.logoUrl || undefined,
    codAmount: resolvedCodAmount,
    totalAmount: resolvedTotalAmount,
    subtotal: resolvedSubtotal,
    deliveryFee: dbDeliveryFee,
    discount: dbDiscount,
    advancePayment: dbAdvancePayment,
    advancePaymentMethod: o.advancePaymentMethod || undefined,
    paymentStatus:
      resolvedCodAmount === 0 && resolvedTotalAmount > 0
        ? 'Paid'
        : dbAdvancePayment > 0
        ? 'Partial'
        : 'Unpaid',
    courier: (() => {
      const upper = String(o.courierProvider || '').toUpperCase();
      if (upper === 'STEADFAST') return 'Steadfast';
      if (upper === 'PATHAO') return 'Pathao';
      if (upper === 'REDX') return 'RedX';
      return '';
    })() as CourierPartner,
    trackingCode: o.trackingCode || undefined,
    stage:
      o.status === 'PACKED' && o.isMemoPrinted
        ? 'DISPATCH'
        : DB_STAGE_MAP[o.status] || 'PICK',
    isMemoPrinted: Boolean(o.isMemoPrinted),
    isCourierBooked: Boolean(o.trackingCode),
  };
}

/**
 * Fetch single order directly from PostgreSQL database with real bin slotting
 */
export async function fetchOrderByIdFromDatabase(
  orderId: string,
): Promise<WarehousePipelineOrder | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.id) return null;
    return mapDbOrderToWarehouseOrder(data);
  } catch (err) {
    console.warn('[Sync] Failed to fetch single order from database:', err);
    return null;
  }
}

/**
 * Fetch all warehouse orders directly from PostgreSQL database
 */
export async function fetchOrdersFromDatabase(params?: {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: string;
  merchantCode?: string;
  courier?: string;
  limit?: number;
}): Promise<WarehousePipelineOrder[]> {
  try {
    const qs = new URLSearchParams();
    qs.set('limit', String(params?.limit ?? 500));
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    if (params?.merchantCode && params.merchantCode !== 'ALL') {
      qs.set('merchantCode', params.merchantCode);
    }
    if (params?.courier && params.courier !== 'ALL') qs.set('courier', params.courier);

    const res = await fetch(`${API_BASE}/orders?${qs.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    if (items.length === 0) return [];

    return items.map(mapDbOrderToWarehouseOrder);
  } catch (err) {
    console.warn('[Sync] Failed to fetch orders from database:', err);
    return [];
  }
}

/**
 * When Admin cancels an order in Orders Pipeline:
 * Restores variant & product stock and appends a RESTOCK proof movement to the Stock Ledger.
 */
export function restoreOrderStockAndLogLedger(
  order: WarehousePipelineOrder | { id: string; qty: number; sku?: string; productTitle?: string; color?: string; size?: string; bin?: string; items?: any[] }
): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanOrderId = (order.id || '').replace(/^#/, '').trim();
    const adminProducts = getStoredAdminProducts();

    const itemsToRestore: Array<{ sku: string; title: string; color: string; size: string; qty: number; bin: string }> = [];
    if ('items' in order && order.items && order.items.length > 0) {
      order.items.forEach((it) => {
        itemsToRestore.push({
          sku: it.sku,
          title: it.title,
          color: it.color || 'Standard',
          size: it.size || 'Standard',
          qty: it.qty || 1,
          bin: it.bin || 'A-01-01',
        });
      });
    } else {
      itemsToRestore.push({
        sku: order.sku || 'SKU-001',
        title: order.productTitle || 'Product',
        color: order.color || 'Standard',
        size: order.size || 'Standard',
        qty: order.qty || 1,
        bin: order.bin || 'A-01-01',
      });
    }

    let modifiedAdmin = false;
    const nextAdminProducts = adminProducts.map((ap) => {
      let prodModified = false;
      let newApStock = ap.stock;
      let newApReserved = ap.reserved;
      const updatedVariants = (ap.variantsList || []).map((v) => {
        const match = itemsToRestore.find(
          (it) =>
            (it.sku && v.variantSku.toUpperCase() === it.sku.toUpperCase()) ||
            (it.color &&
              it.size &&
              (v.color || '').toLowerCase().includes(it.color.toLowerCase()) &&
              (v.size || '').toLowerCase().includes(it.size.toLowerCase()))
        );
        if (match) {
          prodModified = true;
          const prevVarStock = v.stock;
          const newVarStock = v.stock + match.qty;
          appendStockLedgerRecord({
            type: 'RESTOCK',
            merchantCode: ap.merchantCode || 'MC-101',
            merchantName: ap.merchantName || "Sabbir's Store",
            productId: ap.id,
            productTitle: `${ap.title} (${[match.color, match.size].filter(Boolean).join(' · ')})`,
            sku: v.variantSku || match.sku,
            deltaQty: match.qty,
            previousStock: prevVarStock,
            newStock: newVarStock,
            binCode: ap.binCode || 'A-01-01',
            referenceDocType: 'INTERNAL_AUDIT',
            referenceNumber: cleanOrderId,
            notes: `Stock released from cancelled order #${cleanOrderId} (+${match.qty} units restored to available)`,
            operator: 'Warehouse Admin / Order Cancel',
          });
          return { ...v, stock: newVarStock };
        }
        return v;
      });

      const prodMatch = itemsToRestore.find(
        (it) =>
          it.sku &&
          (ap.fullSku.toUpperCase() === it.sku.toUpperCase() ||
            ap.shortSku.toUpperCase() === it.sku.toUpperCase() ||
            it.sku.toUpperCase().includes(ap.fullSku.toUpperCase()))
      );

      if (prodMatch) {
        prodModified = true;
        newApStock = ap.stock + prodMatch.qty;
        newApReserved = Math.max(0, (ap.reserved || 0) - prodMatch.qty);
        if (updatedVariants.length === 0) {
          appendStockLedgerRecord({
            type: 'RESTOCK',
            merchantCode: ap.merchantCode || 'MC-101',
            merchantName: ap.merchantName || "Sabbir's Store",
            productId: ap.id,
            productTitle: ap.title,
            sku: ap.fullSku,
            deltaQty: prodMatch.qty,
            previousStock: ap.stock,
            newStock: newApStock,
            binCode: ap.binCode || 'A-01-01',
            referenceDocType: 'INTERNAL_AUDIT',
            referenceNumber: cleanOrderId,
            notes: `Stock released from cancelled order #${cleanOrderId} (+${prodMatch.qty} units restored to available)`,
            operator: 'Warehouse Admin / Order Cancel',
          });
        }
      }

      if (prodModified) {
        modifiedAdmin = true;
        return {
          ...ap,
          stock: newApStock,
          reserved: newApReserved,
          variantsList: updatedVariants.length > 0 ? updatedVariants : ap.variantsList,
        };
      }
      return ap;
    });

    if (modifiedAdmin) {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(nextAdminProducts));
    }

    // Also restore in Merchant products
    const directory = getStoredMerchantDirectory();
    const codes = ['MC-101', ...directory.map((m) => m.merchantCode.toUpperCase())];
    for (const code of codes) {
      const mProducts = getStoredMerchantProductsForCode(code);
      let mModified = false;
      const nextMProducts = mProducts.map((mp) => {
        let pMod = false;
        let newStock = mp.stock;
        let newReserved = mp.reserved;
        const nextVariants = (mp.variantsList || []).map((mv) => {
          const match = itemsToRestore.find(
            (it) =>
              (it.sku && mv.variantSku.toUpperCase() === it.sku.toUpperCase()) ||
              (it.color &&
                it.size &&
                (mv.color || '').toLowerCase() === it.color.toLowerCase() &&
                (mv.size || '').toLowerCase() === it.size.toLowerCase())
          );
          if (match) {
            pMod = true;
            return { ...mv, stock: mv.stock + match.qty };
          }
          return mv;
        });

        const prodMatch = itemsToRestore.find(
          (it) =>
            it.sku &&
            (mp.sku.toUpperCase() === it.sku.toUpperCase() ||
              it.sku.toUpperCase().includes(mp.sku.toUpperCase()))
        );
        if (prodMatch) {
          pMod = true;
          newStock = mp.stock + prodMatch.qty;
          newReserved = Math.max(0, (mp.reserved || 0) - prodMatch.qty);
        }

        if (pMod) {
          mModified = true;
          return {
            ...mp,
            stock: newStock,
            reserved: newReserved,
            variantsList: nextVariants.length > 0 ? nextVariants : mp.variantsList,
          };
        }
        return mp;
      });

      if (mModified) {
        localStorage.setItem(getMerchantProductsKey(code), JSON.stringify(nextMProducts));
      }
    }
  } catch (err) {
    console.warn('[Sync] Failed to restore stock & log ledger:', err);
  }
}
