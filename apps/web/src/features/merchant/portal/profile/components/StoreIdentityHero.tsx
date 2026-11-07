'use client';

import React, { useState } from 'react';
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Pencil,
  Check,
  Copy,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { StoreProfileData } from '../types';
import { VerificationStatusBadge } from '@/components/ui';

interface StoreIdentityHeroProps {
  profile: StoreProfileData;
  onEdit: () => void;
}

export function StoreIdentityHero({ profile, onEdit }: StoreIdentityHeroProps) {
  const [copiedId, setCopiedId] = useState(false);

  const initials =
    profile.storeName
      ? profile.storeName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : profile.ownerName
      ? profile.ownerName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'MR';

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(profile.merchantCode);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl p-5 sm:p-7">
      {/* Subtle top emerald ambient glow */}
      <div className="absolute top-0 right-1/4 -mt-12 h-36 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Avatar & Identity details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
          {/* Avatar with Status indicator */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 border-2 border-emerald-500/30 flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-lg overflow-hidden shadow-emerald-950/40">
              {profile.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logoUrl}
                  alt={profile.storeName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Verification tick ring */}
            <span
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center shadow-sm"
              title="Verified Merchant Account"
            >
              <Check className="h-3.5 w-3.5 text-white font-bold stroke-[3]" />
            </span>
          </div>

          {/* Store Info */}
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                {profile.storeName}
              </h1>

              <VerificationStatusBadge status={profile.status} />

              {/* Copyable Merchant ID Pill */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-mono text-xs font-bold transition-colors cursor-pointer group"
                title="Click to copy Merchant ID"
              >
                <span>{profile.merchantCode}</span>
                {copiedId ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Owned &amp; Managed by{' '}
              <strong className="text-white font-semibold">{profile.ownerName}</strong>
            </p>

            {/* Quick Contact Chips */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pt-1 text-xs text-slate-400">
              <div className="inline-flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
                <Mail className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-none">{profile.email}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
                <Phone className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span className="font-mono">{profile.phone}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
                <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <span className="truncate max-w-[180px] sm:max-w-xs">{profile.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions & Warehouse Tag */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer min-h-[40px]"
          >
            <Pencil className="h-3.5 w-3.5 text-emerald-400" />
            <span>Edit Profile</span>
          </button>

          {/* Central Hub Tag */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1 w-full sm:w-auto lg:max-w-xs shadow-inner">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Dhaka Central Hub Intake</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Stock stored in Fulfillio Central Warehouse. Orders auto-dispatched to Steadfast, Pathao &amp; RedX.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
