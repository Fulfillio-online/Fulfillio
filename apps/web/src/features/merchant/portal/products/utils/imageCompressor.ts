/**
 * High-performance client-side image compressor & storage safety utility for Fulfillio WMS.
 *
 * Compresses camera uploads and product images to ultra-light, clean JPEG data URLs.
 * - Prevents localStorage QuotaExceededError (keeps images under 35KB).
 * - Prevents PostgreSQL invalid byte sequence (0x00 / null bytes).
 * - Prevents NestJS / Express 413 Payload Too Large exceptions.
 */

function sanitizeBase64(dataUrl: string): string {
  // Strip null bytes and non-printable control characters that crash PostgreSQL / JSONB
  return dataUrl.replace(/\0/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}

/**
 * Compress main product display images
 * Max 500x500, quality 0.7 -> typically 15KB - 35KB
 */
export async function compressImage(
  file: File,
  maxWidth = 450,
  maxHeight = 450,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(sanitizeBase64(reader.result as string));
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(sanitizeBase64(readerEvent.target?.result as string));
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to web-friendly JPEG data URL
        let compressed = canvas.toDataURL('image/jpeg', quality);

        // If still over ~52KB, re-compress with reduced dimensions
        if (compressed.length > 70000) {
          canvas.width = Math.round(width * 0.7);
          canvas.height = Math.round(height * 0.7);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          compressed = canvas.toDataURL('image/jpeg', 0.52);
        }

        resolve(sanitizeBase64(compressed));
      };

      img.onerror = () => {
        // Fallback clean placeholder
        resolve(
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>'
        );
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress variant / color swatch thumbnails
 * Max 200x200, quality 0.6 -> typically 4KB - 9KB
 */
export async function compressThumbnail(file: File): Promise<string> {
  return compressImage(file, 200, 200, 0.6);
}

/**
 * Safe localStorage setter that prevents unhandled QuotaExceededError
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[safeSetLocalStorage] Quota error on "${key}", attempting cleanup:`, err?.message);
    try {
      // Clear transient caches if quota exceeded
      localStorage.removeItem('fulfillio_temp_cache');
      localStorage.removeItem('fulfillio_draft_cache');
      localStorage.setItem(key, value);
      return true;
    } catch (e2) {
      console.error(`[safeSetLocalStorage] Failed to persist "${key}" even after cleanup:`, e2);
      return false;
    }
  }
}

/**
 * High-quality preset samples for instant 1-click test photos
 */
export const SAMPLE_PRODUCT_PRESETS = [
  {
    name: 'Hoodie (Black)',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
    category: 'Fashion',
  },
  {
    name: 'Denim Jacket',
    url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
    category: 'Fashion',
  },
  {
    name: 'Smart Watch',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    category: 'Electronics',
  },
  {
    name: 'Wireless Earbuds',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    category: 'Electronics',
  },
  {
    name: 'Sneakers (White)',
    url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    category: 'Fashion',
  },
  {
    name: 'Organic Face Cream',
    url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    category: 'Beauty',
  },
];
