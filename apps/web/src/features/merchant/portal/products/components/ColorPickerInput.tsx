'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Palette, Copy, Check, Pipette } from 'lucide-react';

export interface ColorPickerInputProps {
  colorHex: string;
  colorName?: string;
  onChange: (hex: string, suggestedName?: string) => void;
  className?: string;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = (hex || '').replace(/^#/, '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) {
    return { r: 17, g: 24, b: 39 }; // default dark
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 17, g: 24, b: 39 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Popular e-commerce garment & product palette
const PRESET_COLORS = [
  { name: 'Jet Black', hex: '#000000' },
  { name: 'Charcoal', hex: '#1F2937' },
  { name: 'Slate Grey', hex: '#4B5563' },
  { name: 'Heather Grey', hex: '#9CA3AF' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Sky Blue', hex: '#0284C7' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Forest Green', hex: '#166534' },
  { name: 'Olive Green', hex: '#4D7C0F' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Maroon', hex: '#831843' },
  { name: 'Rust Orange', hex: '#EA580C' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Deep Violet', hex: '#7C3AED' },
  { name: 'Rose Pink', hex: '#E11D48' },
  { name: 'Warm Beige', hex: '#D4A373' },
];

export function ColorPickerInput({
  colorHex,
  colorName,
  onChange,
  className = '',
}: ColorPickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'HEX' | 'RGB'>('HEX');
  const [hexInput, setHexInput] = useState(colorHex || '#111827');
  const [rgb, setRgb] = useState(hexToRgb(colorHex || '#111827'));
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const nativePickerRef = useRef<HTMLInputElement>(null);

  // Sync external colorHex changes
  useEffect(() => {
    if (colorHex) {
      setHexInput(colorHex);
      setRgb(hexToRgb(colorHex));
    }
  }, [colorHex]);

  // Handle outside click to close popover
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleHexChange = (val: string) => {
    setHexInput(val);
    const cleaned = val.startsWith('#') ? val : `#${val}`;
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      setRgb(hexToRgb(cleaned));
      onChange(cleaned.toUpperCase());
    } else if (/^#[0-9A-Fa-f]{3}$/.test(cleaned)) {
      const full = `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`;
      setRgb(hexToRgb(full));
      onChange(full.toUpperCase());
    }
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const updated = {
      ...rgb,
      [channel]: Math.max(0, Math.min(255, Number(val) || 0)),
    };
    setRgb(updated);
    const hex = rgbToHex(updated.r, updated.g, updated.b);
    setHexInput(hex);
    onChange(hex);
  };

  const handleSelectPreset = (presetHex: string, presetName: string) => {
    setHexInput(presetHex);
    setRgb(hexToRgb(presetHex));
    onChange(presetHex, presetName);
  };

  const handleCopyHex = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(hexInput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {/* Visual Swatch Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-8 w-8 rounded-lg border-2 border-white/20 shadow-xs shrink-0 cursor-pointer overflow-hidden transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500"
        style={{ backgroundColor: colorHex || '#111827' }}
        title="Click to open Color Picker (HEX / RGB)"
        aria-label="Color Picker"
      >
        <span className="sr-only">Choose color</span>
        <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
      </button>

      {/* Inline Hex Input for quick keyboard editing */}
      <div className="relative flex items-center">
        <span className="absolute left-2 text-[11px] font-mono font-bold text-slate-400 select-none">
          #
        </span>
        <input
          type="text"
          value={hexInput.replace(/^#/, '')}
          onChange={(e) => handleHexChange(e.target.value)}
          maxLength={6}
          placeholder="000000"
          className="w-20 pl-5 pr-1.5 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-navy-900 dark:text-slate-200 uppercase focus:outline-none focus:border-orange-500"
          title="Direct HEX Code"
        />
      </div>

      {/* Quick Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-slate-500 hover:text-navy-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
        title="Open HEX & RGB Color Picker"
      >
        <Palette className="h-3.5 w-3.5 text-orange-500" />
      </button>

      {/* Hidden Native Picker as Fallback / Browser Tool */}
      <input
        ref={nativePickerRef}
        type="color"
        value={colorHex && /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : '#111827'}
        onChange={(e) => {
          const hex = e.target.value.toUpperCase();
          setHexInput(hex);
          setRgb(hexToRgb(hex));
          onChange(hex);
        }}
        className="hidden"
      />

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 shadow-2xl p-3.5 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Preview & Mode Switch */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-lg border border-slate-300 dark:border-white/20 shadow-xs"
                style={{ backgroundColor: colorHex || '#111827' }}
              />
              <span className="text-xs font-bold font-mono text-navy-900 dark:text-slate-200">
                {colorHex || '#111827'}
              </span>
            </div>

            {/* Mode Switcher: HEX vs RGB */}
            <div className="flex items-center bg-slate-100 dark:bg-navy-950 p-0.5 rounded-lg border border-slate-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => setMode('HEX')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  mode === 'HEX'
                    ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                HEX
              </button>
              <button
                type="button"
                onClick={() => setMode('RGB')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  mode === 'RGB'
                    ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                RGB
              </button>
            </div>
          </div>

          {/* Mode 1: HEX Option */}
          {mode === 'HEX' ? (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Hex Color Code
              </label>
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-xs font-mono font-bold text-slate-400">
                    #
                  </span>
                  <input
                    type="text"
                    value={hexInput.replace(/^#/, '')}
                    onChange={(e) => handleHexChange(e.target.value)}
                    maxLength={6}
                    placeholder="FF5500"
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-navy-900 dark:text-slate-200 uppercase focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopyHex}
                  title="Copy Hex Code"
                  className="p-2 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Type standard 6-digit hex code (e.g. <code>#111827</code>, <code>#EA580C</code>).
              </p>
            </div>
          ) : (
            /* Mode 2: RGB Option */
            <div className="space-y-2.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                RGB Color Channels (0 - 255)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="block text-[10px] font-bold text-rose-500 mb-0.5">R (Red)</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.r}
                    onChange={(e) => handleRgbChange('r', Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-navy-900 dark:text-slate-200 text-center focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-emerald-500 mb-0.5">G (Green)</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.g}
                    onChange={(e) => handleRgbChange('g', Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-navy-900 dark:text-slate-200 text-center focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-blue-500 mb-0.5">B (Blue)</span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.b}
                    onChange={(e) => handleRgbChange('b', Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-mono font-bold text-navy-900 dark:text-slate-200 text-center focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              {/* Sliders */}
              <div className="space-y-1 pt-1">
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) => handleRgbChange('r', Number(e.target.value))}
                  className="w-full h-1.5 bg-rose-200 dark:bg-rose-950/60 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) => handleRgbChange('g', Number(e.target.value))}
                  className="w-full h-1.5 bg-emerald-200 dark:bg-emerald-950/60 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) => handleRgbChange('b', Number(e.target.value))}
                  className="w-full h-1.5 bg-blue-200 dark:bg-blue-950/60 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          )}

          {/* Quick Garment & Product Color Presets */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Popular Garment Palettes
              </span>
              <button
                type="button"
                onClick={() => nativePickerRef.current?.click()}
                className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Pipette className="h-3 w-3" />
                <span>Eyedropper</span>
              </button>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {PRESET_COLORS.map((p) => {
                const isSelected = (colorHex || '').toUpperCase() === p.hex.toUpperCase();
                return (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => handleSelectPreset(p.hex, p.name)}
                    className={`h-6 w-6 rounded-md border transition-transform hover:scale-110 cursor-pointer relative ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/40 shadow-xs'
                        : 'border-slate-300 dark:border-white/20'
                    }`}
                    style={{ backgroundColor: p.hex }}
                    title={`${p.name} (${p.hex})`}
                  />
                );
              })}
            </div>
          </div>

          {/* Done Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
