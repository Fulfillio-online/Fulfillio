import { MerchantInfo, ProductPresetThumbnail, WarehouseBin, WarehouseProductItem } from './types';

export const STORAGE_KEY_PRODUCTS = 'fulfillio_warehouse_products_v1';
export const STORAGE_KEY_BINS = 'fulfillio_warehouse_bins_v1';

export const MERCHANTS: MerchantInfo[] = [
  { code: 'MC-101', name: "Sabbir's Store", categoryFocus: 'Apparel & Bags' },
  { code: 'MC-102', name: 'Urban Threads BD', categoryFocus: 'Streetwear Apparel' },
  { code: 'MC-103', name: 'Apex Footwear Hub', categoryFocus: 'Footwear & Leather' },
  { code: 'MC-104', name: 'Gadget Freak Online', categoryFocus: 'Consumer Electronics' },
];

export function createProductSvgDataUri(
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
      glyph = `<path d="M30 20 L48 20 L48 42 L62 46 C66 48, 66 58, 60 62 L26 62 C24 55, 24 35, 30 20 Z" fill="${accent}" opacity="0.92"/><path d="M32 62 L32 66 L58 66 L58 62" stroke="#0f172a" stroke-width="2"/>`;
      break;
    case 'sneakers':
      glyph = `<path d="M24 40 C34 34, 44 32, 54 36 L66 44 C70 48, 68 58, 60 60 L20 60 C18 52, 18 44, 24 40 Z" fill="${accent}" opacity="0.92"/><path d="M34 40 L44 48" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/><path d="M42 36 L52 44" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>`;
      break;
    case 'earbuds':
      glyph = `<rect x="28" y="24" width="32" height="40" rx="14" fill="${accent}" opacity="0.92"/><ellipse cx="44" cy="40" rx="10" ry="12" fill="#0f172a"/><circle cx="44" cy="38" r="4" fill="${accent}"/>`;
      break;
    case 'watch':
      glyph = `<rect x="36" y="16" width="16" height="56" rx="4" fill="${accent}" opacity="0.5"/><rect x="30" y="28" width="28" height="32" rx="8" fill="${accent}" opacity="0.95"/><circle cx="44" cy="44" r="10" fill="#0f172a"/><line x1="44" y1="44" x2="44" y2="38" stroke="${accent}" stroke-width="2" stroke-linecap="round"/><line x1="44" y1="44" x2="49" y2="44" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>`;
      break;
    default:
      glyph = `<rect x="24" y="24" width="40" height="40" rx="8" fill="${accent}" opacity="0.9"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="88" height="88">
    <defs>
      <linearGradient id="g_${label.replace(/[^a-zA-Z0-9]/g, '')}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgStart}"/>
        <stop offset="100%" stop-color="${bgEnd}"/>
      </linearGradient>
    </defs>
    <rect width="88" height="88" rx="16" fill="url(#g_${label.replace(/[^a-zA-Z0-9]/g, '')})"/>
    ${glyph}
    <text x="44" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="700" fill="#f8fafc" letter-spacing="0.5" text-anchor="middle" opacity="0.95">${label}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_THUMBNAILS: ProductPresetThumbnail[] = [
  {
    id: 'hoodie',
    name: 'Oversized Fleece Hoodie',
    category: 'Apparel',
    url: createProductSvgDataUri('#064e3b', '#0f172a', '#10b981', 'HOODIE', 'hoodie'),
  },
  {
    id: 'polo',
    name: 'Pique Cotton Polo',
    category: 'Apparel',
    url: createProductSvgDataUri('#1e3a8a', '#0f172a', '#3b82f6', 'POLO', 'polo'),
  },
  {
    id: 'jacket',
    name: 'Windbreaker Utility Jacket',
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

export const INITIAL_BINS: WarehouseBin[] = [
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
    createdAt: '2026-10-01',
  },
  {
    code: 'D-01-01',
    description: 'Zone D · Rack 01 · Shelf 01 (High-Value Smart Electronics)',
    zone: 'Zone D',
    capacityUnits: 350,
    createdAt: '2026-10-05',
  },
  {
    code: 'D-02-02',
    description: 'Zone D · Rack 02 · Shelf 02 (Accessories & Audio Wear)',
    zone: 'Zone D',
    capacityUnits: 280,
    createdAt: '2026-10-05',
  },
];

export const INITIAL_PRODUCTS: WarehouseProductItem[] = [
  {
    id: 'PRD-1001',
    title: 'Drop-Shoulder Heavyweight Fleece Hoodie',
    category: 'Apparel',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    shortSku: 'HEAVY-HOOD-BLK-L',
    fullSku: 'MC-101-HEAVY-HOOD-BLK-L',
    color: 'Obsidian Black',
    size: 'L',
    binCode: 'A-01-02',
    stock: 142,
    price: 1850,
    status: 'APPROVED',
    submittedAt: '2 days ago',
    imageUrl: PRESET_THUMBNAILS[0].url,
  },
  {
    id: 'PRD-1002',
    title: 'Drop-Shoulder Heavyweight Fleece Hoodie',
    category: 'Apparel',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    shortSku: 'HEAVY-HOOD-BLK-M',
    fullSku: 'MC-101-HEAVY-HOOD-BLK-M',
    color: 'Obsidian Black',
    size: 'M',
    binCode: 'A-01-02',
    stock: 88,
    price: 1850,
    status: 'APPROVED',
    submittedAt: '2 days ago',
    imageUrl: PRESET_THUMBNAILS[0].url,
  },
  {
    id: 'PRD-1003',
    title: 'Breathable Honeycomb Pique Polo Shirt',
    category: 'Apparel',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    shortSku: 'PIQUE-POLO-NVY-XL',
    fullSku: 'MC-101-PIQUE-POLO-NVY-XL',
    color: 'Midnight Navy',
    size: 'XL',
    binCode: 'A-01-04',
    stock: 210,
    price: 1250,
    status: 'APPROVED',
    submittedAt: '4 days ago',
    imageUrl: PRESET_THUMBNAILS[1].url,
  },
  {
    id: 'PRD-1004',
    title: 'Urban Explorer Waterproof Windbreaker',
    category: 'Apparel',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    shortSku: 'URBAN-WIND-OLV-L',
    fullSku: 'MC-102-URBAN-WIND-OLV-L',
    color: 'Olive Drab',
    size: 'L',
    binCode: 'A-02-01',
    stock: 64,
    price: 2450,
    status: 'APPROVED',
    submittedAt: '1 week ago',
    imageUrl: PRESET_THUMBNAILS[2].url,
  },
  {
    id: 'PRD-1005',
    title: 'Raw Hem Vintage Acid Wash Tee',
    category: 'Apparel',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    shortSku: 'ACID-TEE-WSH-M',
    fullSku: 'MC-102-ACID-TEE-WSH-M',
    color: 'Acid Charcoal',
    size: 'M',
    binCode: 'B-01-03',
    stock: 195,
    price: 950,
    status: 'APPROVED',
    submittedAt: '3 days ago',
    imageUrl: PRESET_THUMBNAILS[4].url,
  },
  {
    id: 'PRD-1006',
    title: 'Tactical Multi-Pocket Ripstop Cargo Pants',
    category: 'Apparel',
    merchantCode: 'MC-102',
    merchantName: 'Urban Threads BD',
    shortSku: 'TACT-CARGO-BLK-32',
    fullSku: 'MC-102-TACT-CARGO-BLK-32',
    color: 'Matte Black',
    size: '32',
    binCode: 'B-03-01',
    stock: 112,
    price: 1950,
    status: 'APPROVED',
    submittedAt: '5 days ago',
    imageUrl: PRESET_THUMBNAILS[5].url,
  },
  {
    id: 'PRD-1007',
    title: 'Minimalist Cordura Crossbody Sling Bag',
    category: 'Accessories',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    shortSku: 'SLING-BAG-COY-OS',
    fullSku: 'MC-101-SLING-BAG-COY-OS',
    color: 'Coyote Tan',
    size: 'One Size',
    binCode: 'B-03-04',
    stock: 76,
    price: 1100,
    status: 'APPROVED',
    submittedAt: '6 days ago',
    imageUrl: PRESET_THUMBNAILS[3].url,
  },
  {
    id: 'PRD-1008',
    title: 'Handcrafted Goodyear-Welt Chelsea Boots',
    category: 'Footwear',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    shortSku: 'CHELSEA-BT-BRN-42',
    fullSku: 'MC-103-CHELSEA-BT-BRN-42',
    color: 'Cognac Brown',
    size: 'EU 42',
    binCode: 'C-01-01',
    stock: 35,
    price: 4850,
    status: 'APPROVED',
    submittedAt: '1 week ago',
    imageUrl: PRESET_THUMBNAILS[6].url,
  },
  {
    id: 'PRD-1009',
    title: 'NitroBoost Cushion Lightweight Running Shoes',
    category: 'Footwear',
    merchantCode: 'MC-103',
    merchantName: 'Apex Footwear Hub',
    shortSku: 'NITRO-RUN-WHT-41',
    fullSku: 'MC-103-NITRO-RUN-WHT-41',
    color: 'Triple White',
    size: 'EU 41',
    binCode: 'C-01-02',
    stock: 92,
    price: 3200,
    status: 'APPROVED',
    submittedAt: '2 days ago',
    imageUrl: PRESET_THUMBNAILS[7].url,
  },
  {
    id: 'PRD-1010',
    title: 'Active Noise Cancelling True Wireless Earbuds',
    category: 'Electronics',
    merchantCode: 'MC-104',
    merchantName: 'Gadget Freak Online',
    shortSku: 'ANC-BUDS-PRO-BLK',
    fullSku: 'MC-104-ANC-BUDS-PRO-BLK',
    color: 'Space Grey',
    size: 'Universal',
    binCode: 'D-02-02',
    stock: 160,
    price: 2750,
    status: 'APPROVED',
    submittedAt: '3 days ago',
    imageUrl: PRESET_THUMBNAILS[8].url,
  },
  {
    id: 'PRD-1011',
    title: '1.43-inch AMOLED GPS Rugged Smart Watch',
    category: 'Electronics',
    merchantCode: 'MC-104',
    merchantName: 'Gadget Freak Online',
    shortSku: 'AMOLED-WATCH-TIT-OS',
    fullSku: 'MC-104-AMOLED-WATCH-TIT-OS',
    color: 'Titanium Grey',
    size: '46mm',
    binCode: 'D-01-01',
    stock: 78,
    price: 4500,
    status: 'APPROVED',
    submittedAt: '4 days ago',
    imageUrl: PRESET_THUMBNAILS[9].url,
  },
  {
    id: 'PRD-2001',
    title: 'Waterproof Oversized Windbreaker (Batch 2)',
    category: 'Apparel',
    merchantCode: 'MC-101',
    merchantName: "Sabbir's Store",
    shortSku: 'WIND-PRO-XL',
    fullSku: 'MC-101-WIND-PRO-XL',
    color: 'Forest Green',
    size: 'XL',
    binCode: 'A-02-01',
    stock: 50,
    price: 2250,
    status: 'PENDING_APPROVAL',
    submittedAt: '18 mins ago',
    imageUrl: PRESET_THUMBNAILS[2].url,
  },
  {
    id: 'PRD-2002',
    title: 'Vintage Acid Wash Heavy Hoodie',
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
