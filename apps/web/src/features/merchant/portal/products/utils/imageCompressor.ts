/**
 * Client-side image compressor & storage safety utility
 * Resizes large camera photos to max 600x600 and 75% JPEG quality.
 * Prevents localStorage QuotaExceededError and improves UI rendering speed.
 */
export async function compressImage(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, fallback to standard FileReader
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
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
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to web-friendly JPEG data URL
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        resolve(readerEvent.target?.result as string);
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
