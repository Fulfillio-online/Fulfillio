'use client';

import React from 'react';
import { Building2, User, Phone, Mail, MapPin, Pencil } from 'lucide-react';
import { StoreProfileData } from '../types';

interface StoreIdentityCardProps {
  profile: StoreProfileData;
  onEdit: () => void;
}

export function StoreIdentityCard({ profile, onEdit }: StoreIdentityCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md relative overflow-hidden space-y-5">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Official Contact &amp; Dispatch</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified business addresses used for parcel pickup, returns &amp; invoicing.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto min-h-[38px]"
        >
          <Pencil className="h-3.5 w-3.5 text-teal-400" />
          <span>Edit Details</span>
        </button>
      </div>

      {/* Details Grid: 4 Styled Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1.5">
            <User className="h-3 w-3 text-slate-400" /> Owner / Manager Full Name
          </span>
          <p className="text-slate-100 font-semibold text-sm">{profile.ownerName}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-slate-400" /> Verified Contact Phone
          </span>
          <p className="text-slate-100 font-mono font-semibold text-sm">{profile.phone}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-slate-400" /> Notification &amp; Billing Email
          </span>
          <p className="text-slate-200 font-medium truncate" title={profile.email}>
            {profile.email}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
          <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-slate-400" /> Warehouse Dispatch Hub Location
          </span>
          <p className="text-slate-200 font-medium truncate" title={profile.location}>
            {profile.location}
          </p>
        </div>
      </div>
    </div>
  );
}
