'use client';

import React, { useState } from 'react';
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

  const isDataUrl = src && src.startsWith('data:');

  return (
    <div
      className={`relative rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center ${sizeStyles} ${className}`}
    >
      {src && !hasError ? (
        isDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <Image
            src={src}
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
