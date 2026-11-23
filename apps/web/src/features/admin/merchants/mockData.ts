import {
  MerchantRecord,
  MerchantProductItem,
  MerchantOrderItem,
  MerchantMemoItem,
} from './types';

export function makeMerchantProductThumbnail(
  label: string,
  bgStart: string,
  bgEnd: string,
  accent: string
): string {
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

export const MERCHANTS_DATA: MerchantRecord[] = [];
export const ALL_PRODUCTS: MerchantProductItem[] = [];
export const ALL_ORDERS: MerchantOrderItem[] = [];
export const ALL_MEMOS: MerchantMemoItem[] = [];

export const STORAGE_KEY = 'fulfillio_merchants_directory_v2';

export const resizeAvatar = (file: File): Promise<string> => {
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
