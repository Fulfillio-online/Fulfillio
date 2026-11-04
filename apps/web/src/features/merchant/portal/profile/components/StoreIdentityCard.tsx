'use client';

import React from 'react';
import { Building2, User, Phone, Mail, MapPin, Pencil } from 'lucide-react';
import { StoreProfileData } from '../types';
import { VerificationStatusBadge } from '@/components/ui';

interface StoreIdentityCardProps {
  profile: StoreProfileData;
  onEdit: () => void;
}

export function StoreIdentityCard({ profile, onEdit }: StoreIdentityCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm relative overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-4">
          {/* Logo / Initials */}
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-500/30 flex items-center justify-center text-xl font-black text-white shadow-md shrink-0 overflow-hidden">
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt={profile.storeName} className="h-full w-full object-cover" />
            ) : (
              profile.storeName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'ST'
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">{profile.storeName}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-bold">
                {profile.merchantCode}
              </span>
              <VerificationStatusBadge status={profile.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Managed by <strong className="text-slate-200">{profile.ownerName}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onEdit}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Pencil className="h-3.5 w-3.5 text-emerald-400" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs">
        <div className="space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1">
            <Mail className="h-3 w-3 text-slate-400" /> Email Address
          </span>
          <p className="text-slate-200 font-medium truncate">{profile.email}</p>
        </div>

        <div className="space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1">
            <Phone className="h-3 w-3 text-slate-400" /> Contact Phone
          </span>
          <p className="text-slate-200 font-medium">{profile.phone}</p>
        </div>

        <div className="space-y-1 sm:col-span-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1">
            <MapPin className="h-3 w-3 text-slate-400" /> Dispatch Location
          </span>
          <p className="text-slate-200 font-medium truncate" title={profile.location}>
            {profile.location}
          </p>
        </div>
      </div>
    </div>
  );
}
