import {
  InboundStockReplenishment,
  StockWithdrawalRequest,
  MerchantInfo,
  ProductPresetThumbnail,
  WarehouseBin,
  WarehouseProductItem,
  StockMovementRecord,
} from './types';

export const STORAGE_KEY_PRODUCTS = 'fulfillio_warehouse_products_v1';
export const STORAGE_KEY_BINS = 'fulfillio_warehouse_bins_v1';
export const STORAGE_KEY_STOCK_REQUESTS = 'fulfillio_merchant_stock_requests_v1';
export const STORAGE_KEY_STOCK_WITHDRAWALS = 'fulfillio_merchant_stock_withdrawals_v1';
export const STORAGE_KEY_STOCK_LEDGER = 'fulfillio_stock_ledger_v1';

export function cleanBinCode(code?: string | null): string {
  if (!code) return '';
  return code.replace(/^bin\s*[-_:]?\s*/i, '').trim().toUpperCase();
}

export function generateDigitalProofHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0');
  return `FL-SHA256-${hex.slice(0, 6)}`;
}

export const MERCHANTS: MerchantInfo[] = [];

export function createProductSvgDataUri(
  bgStart: string,
  bgEnd: string,
  accent: string,
  label: string,
  _iconType:
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="20" fill="${bgStart}"/><text x="60" y="64" text-anchor="middle" fill="${accent}" font-family="monospace" font-weight="700" font-size="14">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_THUMBNAILS: ProductPresetThumbnail[] = [];
export const INITIAL_BINS: WarehouseBin[] = [];
export const INITIAL_PRODUCTS: WarehouseProductItem[] = [];
export const INITIAL_STOCK_REPLENISHMENTS: InboundStockReplenishment[] = [];
export const INITIAL_STOCK_WITHDRAWALS: StockWithdrawalRequest[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovementRecord[] = [];
