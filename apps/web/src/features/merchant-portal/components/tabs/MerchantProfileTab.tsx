'use client';

import React, { useState } from 'react';
import {
  User,
  Pencil,
  Check,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Share2,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { MerchantProfileData, PayoutAccount, SocialChannel } from '../../types';
import { EditProfileModal } from '../modals/EditProfileModal';
import { ManagePayoutModal } from '../modals/ManagePayoutModal';
import { ViewChequeModal } from '../modals/ViewChequeModal';
import { SocialChannelModal } from '../modals/SocialChannelModal';

interface MerchantProfileTabProps {
  profile: MerchantProfileData;
  onUpdateProfile: (updated: Partial<MerchantProfileData>) => void;
  onTriggerToast: (msg: string) => void;
}

export function MerchantProfileTab({
  profile,
  onUpdateProfile,
  onTriggerToast,
}: MerchantProfileTabProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isManagePayoutOpen, setIsManagePayoutOpen] = useState(false);
  const [isViewChequeOpen, setIsViewChequeOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocialChannel, setEditingSocialChannel] = useState<SocialChannel | null>(null);

  const handleSaveProfileDetails = (updated: {
    ownerName: string;
    storeName: string;
    phone: string;
    location: string;
  }) => {
    onUpdateProfile(updated);
    onTriggerToast('Store profile details updated successfully.');
  };

  const handleSavePayout = (updatedAccount: PayoutAccount) => {
    onUpdateProfile({ payoutAccount: updatedAccount });
    onTriggerToast('COD payout details submitted for Admin review.');
  };

  const handleSaveSocial = (channel: SocialChannel) => {
    const existing = profile.socialChannels.some((c) => c.id === channel.id);
    const updated = existing
      ? profile.socialChannels.map((c) => (c.id === channel.id ? channel : c))
      : [...profile.socialChannels, channel];
    onUpdateProfile({ socialChannels: updated });
    onTriggerToast(`Social channel ${channel.platform} saved.`);
  };

  const handleDeleteSocial = (channelId: string) => {
    const updated = profile.socialChannels.filter((c) => c.id !== channelId);
    onUpdateProfile({ socialChannels: updated });
    onTriggerToast('Social channel removed.');
  };

  const initials =
    profile.ownerName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'SA';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <User className="h-6 w-6 text-emerald-400" />
            <span>Store Profile &amp; Merchant Identity</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage your verified seller profile, payout destination, and connected marketing channels.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditProfileOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5 text-slate-400" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Top Seller Identity Banner Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-lg">
        <div className="flex items-center gap-5">
          {/* Avatar with Status indicator */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-lg">
              {initials}
            </div>
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <Check className="h-3 w-3 text-white font-bold" />
            </span>
          </div>

          {/* Merchant Info */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight">{profile.ownerName}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                VERIFIED MERCHANT
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-300 mt-1">{profile.storeName}</p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400 mt-2">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                <span>{profile.location}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                <span>Merchant ID: {profile.merchantCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Central Warehouse Delivery Tag */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 space-y-1 self-stretch md:self-auto max-w-sm">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Fulfillio Central Hub Intake</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Your stock is physically stored in Dhaka Central Warehouse. Couriers dispatch directly
            from central warehouse racks.
          </p>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: 60% (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Personal Information */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-md">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                <span>Personal Information</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Your official contact details.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Full Name
                </span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">
                  {profile.ownerName}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Phone Number
                </span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block font-mono">
                  {profile.phone}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Email Address
                </span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block truncate">
                  {profile.email}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Location
                </span>
                <span className="text-sm font-semibold text-slate-200 mt-1 block">
                  {profile.location}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Default Payout Account */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span>Default Payout Account</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Designated account receiving weekly seller COD earnings.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsManagePayoutOpen(true)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 group cursor-pointer"
              >
                <span>Manage Payouts</span>
                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Styled Payout Card Container */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 border border-slate-800 relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Bank Account
                    </span>
                    <span className="text-base font-bold text-slate-100">
                      {profile.payoutAccount.provider}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Default
                  </span>
                  {profile.payoutAccount.status === 'VERIFIED' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Under Review
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Account Number:</span>
                  <span className="font-mono text-sm font-bold text-slate-100 tracking-wider">
                    {profile.payoutAccount.accountNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Account Holder:</span>
                  <span className="font-semibold text-slate-200">
                    {profile.payoutAccount.accountHolder}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Routing &amp; Branch:</span>
                  <span className="text-slate-300">
                    {profile.payoutAccount.branchName} • Routing: {profile.payoutAccount.routingNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Payout Frequency:</span>
                  <span className="text-emerald-400 font-semibold">
                    {profile.payoutAccount.frequency} (Every Friday)
                  </span>
                </div>
              </div>

              {/* Cheque Leaf Verification Row */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  <span>Cheque Leaf Attachment:</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    {profile.payoutAccount.status === 'VERIFIED'
                      ? 'cheque_leaf_verified_2026.png'
                      : 'cheque_upload_pending.png'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsViewChequeOpen(true)}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                >
                  <Eye className="h-3 w-3 text-slate-400" />
                  <span>View Pic</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 40% (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 3: Account Overview */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-md">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Account Overview</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Merchant ID:{' '}
                <span className="font-mono text-emerald-400 font-bold">
                  {profile.merchantCode}
                </span>
              </p>
            </div>

            <div className="divide-y divide-slate-800 text-sm">
              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Account Status</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {profile.status}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Default Payout</span>
                <span className="font-semibold text-slate-200 text-xs">
                  {profile.payoutMethod}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Payout Schedule</span>
                <span className="font-semibold text-slate-200 text-xs">
                  {profile.payoutSchedule}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <span className="text-slate-400 text-xs">Connected Channels</span>
                <span className="font-semibold text-emerald-400 text-xs">
                  {profile.socialChannels.length} Active
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Social Media Channels */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-emerald-400" />
                  <span>Social Media Channels</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Connected platforms for promotions.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingSocialChannel(null);
                  setIsSocialModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Channel</span>
              </button>
            </div>

            {/* Social List */}
            {profile.socialChannels.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No social channels connected yet.</p>
            ) : (
              <div className="space-y-2">
                {profile.socialChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block">{channel.platform}</span>
                      <a
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 hover:underline truncate block"
                      >
                        {channel.url}
                      </a>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSocialChannel(channel);
                          setIsSocialModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSocial(channel.id)}
                        className="p-1 rounded text-rose-400 hover:text-rose-300"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        profile={profile}
        onSave={handleSaveProfileDetails}
      />

      <ManagePayoutModal
        isOpen={isManagePayoutOpen}
        onClose={() => setIsManagePayoutOpen(false)}
        payoutAccount={profile.payoutAccount}
        onSave={handleSavePayout}
      />

      <ViewChequeModal
        isOpen={isViewChequeOpen}
        onClose={() => setIsViewChequeOpen(false)}
        payoutAccount={profile.payoutAccount}
      />

      <SocialChannelModal
        isOpen={isSocialModalOpen}
        onClose={() => {
          setIsSocialModalOpen(false);
          setEditingSocialChannel(null);
        }}
        channel={editingSocialChannel}
        onSave={handleSaveSocial}
      />
    </div>
  );
}
