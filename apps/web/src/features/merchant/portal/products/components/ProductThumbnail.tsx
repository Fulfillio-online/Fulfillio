'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

interface ProductThumbnailProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  iconClassName?: string;
}

export function ProductThumbnail({
  src,
  alt,
  size = 'md',
  className = '',
  iconClassName = '',
}: ProductThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  // Automatically reset error state whenever src prop changes (e.g., after product edit/image replacement)
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Size mapping
  const sizeStyles = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }[size];

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  }[size];

  const cleanSrc = (src || '').trim();
  const isDataUrl = cleanSrc.startsWith('data:');
  const isValidUrl = cleanSrc.length > 0 && !hasError;

  return (
    <div
      className={`relative rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center ${sizeStyles} ${className}`}
    >
      {isValidUrl ? (
        isDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cleanSrc}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <Image
            src={cleanSrc}
            alt={alt}
            fill
            sizes="96px"
            unoptimized={true}
            className="object-cover"
            onError={() => setHasError(true)}
          />
        )
      ) : (
        <Package className={`text-slate-500 ${iconSizes} ${iconClassName}`} />
      )}
    </div>
  );
}
