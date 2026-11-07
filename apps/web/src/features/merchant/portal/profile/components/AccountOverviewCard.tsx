'use client';

import React from 'react';
import { ShieldCheck, Warehouse, Sparkles, CheckCircle2 } from 'lucide-react';
import { StoreProfileData } from '../types';

interface AccountOverviewCardProps {
  profile: StoreProfileData;
}

export function AccountOverviewCard({ profile }: AccountOverviewCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-5">
      <div className="border-b border-slate-800 pb-4">
        <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Account Overview</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Merchant Code:{' '}
          <span className="font-mono text-emerald-400 font-bold">
            {profile.merchantCode}
          </span>
        </p>
      </div>

      <div className="divide-y divide-slate-800/80 text-xs">
        <div className="py-2.5 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Account Status</span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {profile.status}
          </span>
        </div>

        <div className="py-2.5 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Default Payout</span>
          <span className="font-semibold text-slate-200">
            {profile.payoutMethod || 'Bank Transfer'}
          </span>
        </div>

        <div className="py-2.5 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Disbursement Schedule</span>
          <span className="font-semibold text-emerald-400">
            {profile.payoutSchedule || profile.payoutAccount.frequency || 'Weekly (Every Friday)'}
          </span>
        </div>

        <div className="py-2.5 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Marketing Channels</span>
          <span className="font-semibold text-teal-300">
            {profile.socialChannels?.length || 0} Connected
          </span>
        </div>

        <div className="py-2.5 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Assigned Hub</span>
          <span className="font-semibold text-slate-200 flex items-center gap-1">
            <Warehouse className="h-3 w-3 text-emerald-400" />
            Dhaka Central Hub
          </span>
        </div>

        <div className="py-2.5 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Seller Tier</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Tier-1 Priority Fulfillment
          </span>
        </div>
      </div>
    </div>
  );
}
