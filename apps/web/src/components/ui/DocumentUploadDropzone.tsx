'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, FileText, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DocumentUploadDropzoneProps {
  label?: string;
  sublabel?: string;
  currentUrl?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileSelected?: (file: File) => void;
  onUploadSuccess?: (url: string) => void;
  className?: string;
}

export function DocumentUploadDropzone({
  label = 'Upload Document or Photo',
  sublabel = 'Supports PNG, JPG, or PDF up to 5MB',
  currentUrl,
  accept = 'image/png,image/jpeg,image/webp,application/pdf',
  maxSizeMb = 5,
  onFileSelected,
  onUploadSuccess,
  className,
}: DocumentUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds maximum limit of ${maxSizeMb}MB`);
      return;
    }

    setError(null);
    setFileName(file.name);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreview(result);
        if (onUploadSuccess) onUploadSuccess(result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      if (onUploadSuccess) onUploadSuccess(`/uploads/${file.name}`);
    }

    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    if (onUploadSuccess) onUploadSuccess('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2',
          isDragging
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-slate-700 bg-slate-900/60 hover:bg-slate-800/40 hover:border-slate-600'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {preview ? (
          <div className="relative group w-full flex items-center justify-center">
            {/* Image Preview Thumbnail */}
            <div className="relative max-h-36 max-w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Document Preview" className="h-32 object-contain mx-auto" />
              <button
                type="button"
                onClick={clearSelection}
                className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                title="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : fileName ? (
          <div className="flex items-center gap-2 text-slate-200 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 text-xs">
            <FileText className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="font-mono truncate max-w-xs">{fileName}</span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-slate-400 hover:text-rose-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">{label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
