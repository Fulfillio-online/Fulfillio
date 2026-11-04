'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ScanBarcode, CornerDownLeft, Sparkles } from 'lucide-react';
import { useWms } from '../WmsContext';

interface BarcodeScannerBarProps {
  placeholder?: string;
  onScan: (scannedCode: string) => void;
  autoFocus?: boolean;
}

export function BarcodeScannerBar({
  placeholder = 'Scan item SKU barcode or Order ID (e.g. ORD-9824)...',
  onScan,
  autoFocus = true,
}: BarcodeScannerBarProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { playAudio } = useWms();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setCode('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center w-full bg-slate-900 border border-slate-700 focus-within:border-emerald-500 rounded-xl shadow-lg transition-all overflow-hidden"
    >
      <div className="pl-3.5 pr-2 text-emerald-400 flex items-center gap-1.5 shrink-0">
        <ScanBarcode className="h-4 w-4" />
        <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline text-slate-400">
          Wedge Scanner:
        </span>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2.5 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
      />

      <button
        type="submit"
        className="mr-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 text-xs font-mono flex items-center gap-1 border border-slate-700 transition-colors shrink-0"
        title="Execute scan"
      >
        <span className="hidden md:inline text-[10px]">ENTER</span>
        <CornerDownLeft className="h-3 w-3" />
      </button>
    </form>
  );
}
