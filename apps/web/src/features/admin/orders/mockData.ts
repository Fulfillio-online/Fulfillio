import {
  CatalogProductItem,
  ResellerMemoItem,
  WarehousePipelineOrder,
} from './types';

export const STORAGE_KEY_ORDERS = 'fulfillio_warehouse_pipeline_orders_v2';

export function makeProductThumb(bgHex: string, accentHex: string, badgeText: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" rx="18" fill="${bgHex}"/>
    <rect x="6" y="6" width="68" height="68" rx="14" fill="none" stroke="${accentHex}" stroke-width="2" stroke-opacity="0.35"/>
    <path d="M26 22 L34 18 L46 18 L54 22 L62 32 L54 38 L50 32 L50 58 L30 58 L30 32 L26 38 L18 32 Z" fill="${accentHex}" fill-opacity="0.22" stroke="${accentHex}" stroke-width="2.2" stroke-linejoin="round"/>
    <rect x="14" y="52" width="52" height="16" rx="6" fill="#090d16" fill-opacity="0.82"/>
    <text x="40" y="63" text-anchor="middle" fill="#ffffff" font-family="monospace" font-weight="700" font-size="10">${badgeText}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRODUCT_THUMBS = {
  HOODIE: makeProductThumb('#0f172a', '#10b981', 'HOODIE'),
  TEE: makeProductThumb('#1e1b4b', '#818cf8', 'TEE'),
  DENIM: makeProductThumb('#172554', '#38bdf8', 'DENIM'),
  BOOTS: makeProductThumb('#271c19', '#f59e0b', 'BOOTS'),
  POLO: makeProductThumb('#0f291e', '#34d399', 'POLO'),
  CARGO: makeProductThumb('#1a2e05', '#a3e635', 'CARGO'),
  SHIRT: makeProductThumb('#31102f', '#f472b6', 'SHIRT'),
  JACKET: makeProductThumb('#1c1917', '#fb923c', 'JACKET'),
};

export const INITIAL_PIPELINE_ORDERS: WarehousePipelineOrder[] = [];

export const MOCK_CATALOG_PRODUCTS: CatalogProductItem[] = [
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

export const MOCK_RESELLER_MEMOS: ResellerMemoItem[] = [
  {
    code: 'MEMO-DEFAULT',
    resellerName: "Sabbir's Store Official",
    phone: '+880 1711-234567',
    address: 'Gulshan-1, Dhaka',
  },
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

export const PRODUCT_CATALOG: CatalogProductItem[] = MOCK_CATALOG_PRODUCTS;
export const RESELLER_MEMOS: ResellerMemoItem[] = MOCK_RESELLER_MEMOS;

export const HOLD_REASON_PRESETS: string[] = [
  'Awaiting merchant stock delivery',
  'Product defect / quality inspection',
  'Item not found in assigned Bin',
  'Physical count mismatch vs system stock',
  'Damaged packaging or torn poly mailer',
  'Barcode sticker unscannable at dock',
  'Stock reserved by concurrent wave batch',
  'Awaiting merchant ASN stock delivery',
];
