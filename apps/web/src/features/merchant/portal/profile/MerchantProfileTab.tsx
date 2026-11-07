'use client';

import React, { useState } from 'react';
import { User } from 'lucide-react';
import { StoreProfileData, PayoutAccount, KycDocumentData, SocialChannel } from './types';
import { StoreIdentityHero } from './components/StoreIdentityHero';
import { StoreIdentityCard } from './components/StoreIdentityCard';
import { PayoutAccountCard } from './components/PayoutAccountCard';
import { KycVerificationCard } from './components/KycVerificationCard';
import { SocialChannelsCard } from './components/SocialChannelsCard';
import { AccountOverviewCard } from './components/AccountOverviewCard';
import { FulfillmentHubCard } from './components/FulfillmentHubCard';
import { EditProfileModal } from './modals/EditProfileModal';
import { ManagePayoutModal } from './modals/ManagePayoutModal';
import { KycUploadModal } from './modals/KycUploadModal';
import { SocialChannelModal } from './modals/SocialChannelModal';

export interface MerchantProfileTabProps {
  profile: StoreProfileData;
  onUpdateProfile: (updated: Partial<StoreProfileData>) => void;
  onTriggerToast: (msg: string) => void;
}

export function MerchantProfileTab({
  profile,
  onUpdateProfile,
  onTriggerToast,
}: MerchantProfileTabProps) {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isManagePayoutOpen, setIsManagePayoutOpen] = useState(false);
  const [isKycUploadOpen, setIsKycUploadOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState<SocialChannel | null>(null);

  const handleSaveProfileDetails = (updated: {
    ownerName: string;
    storeName: string;
    phone: string;
    location: string;
    logoUrl?: string;
  }) => {
    onUpdateProfile(updated);
    onTriggerToast('Store profile details updated successfully.');
  };

  const handleSavePayout = (updatedAccount: PayoutAccount) => {
    onUpdateProfile({ payoutAccount: updatedAccount });
    onTriggerToast('COD payout account updated. Locked as PENDING REVIEW for audit.');
  };

  const handleSaveKyc = (kyc: KycDocumentData) => {
    onUpdateProfile({ kycData: kyc });
    onTriggerToast('Business KYC documents submitted for verification audit.');
  };

  const handleSaveSocial = (channel: SocialChannel) => {
    const existing = profile.socialChannels || [];
    const index = existing.findIndex((c: SocialChannel) => c.id === channel.id);
    let next: SocialChannel[];
    if (index >= 0) {
      next = existing.map((c: SocialChannel) => (c.id === channel.id ? channel : c));
    } else {
      next = [...existing, channel];
    }
    onUpdateProfile({ socialChannels: next });
    onTriggerToast('Customer social sales channel updated.');
  };

  const handleDeleteSocial = (id: string) => {
    const next = (profile.socialChannels || []).filter((c: SocialChannel) => c.id !== id);
    onUpdateProfile({ socialChannels: next });
    onTriggerToast('Social channel removed.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Tab Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-400 shrink-0" />
          <span>My Store Profile &amp; Merchant Identity</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your verified store branding, COD disbursement account, compliance documents, and connected channels.
        </p>
      </div>

      {/* Prominent Seller Identity Hero Banner */}
      <StoreIdentityHero
        profile={profile}
        onEdit={() => setIsEditProfileOpen(true)}
      />

      {/* 2-Column Responsive Dashboard Grid (7 cols left / 5 cols right on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 60% on desktop (col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Official Business Contact Details */}
          <StoreIdentityCard
            profile={profile}
            onEdit={() => setIsEditProfileOpen(true)}
          />

          {/* Card 2: High-End Fintech COD Payout Account */}
          <PayoutAccountCard
            payoutAccount={profile.payoutAccount}
            onManagePayout={() => setIsManagePayoutOpen(true)}
          />

          {/* Card 3: Business KYC & Regulatory Compliance */}
          <KycVerificationCard
            kycData={profile.kycData}
            onOpenUpload={() => setIsKycUploadOpen(true)}
          />
        </div>

        {/* RIGHT COLUMN: 40% on desktop (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 4: Account Overview & Key Metrics */}
          <AccountOverviewCard profile={profile} />

          {/* Card 5: Social Media Marketing Channels */}
          <SocialChannelsCard
            channels={profile.socialChannels || []}
            onAddChannel={() => {
              setEditingSocial(null);
              setIsSocialModalOpen(true);
            }}
            onEditChannel={(ch) => {
              setEditingSocial(ch);
              setIsSocialModalOpen(true);
            }}
            onDeleteChannel={handleDeleteSocial}
          />

          {/* Card 6: Fulfillment Hub & Courier Dispatch Readiness */}
          <FulfillmentHubCard />
        </div>
      </div>

      {/* Scoped Profile Modals */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        initialData={{
          ownerName: profile.ownerName,
          storeName: profile.storeName,
          phone: profile.phone,
          location: profile.location,
          logoUrl: profile.logoUrl,
        }}
        onSave={handleSaveProfileDetails}
      />

      <ManagePayoutModal
        isOpen={isManagePayoutOpen}
        onClose={() => setIsManagePayoutOpen(false)}
        currentAccount={profile.payoutAccount}
        onSave={handleSavePayout}
      />

      <KycUploadModal
        isOpen={isKycUploadOpen}
        onClose={() => setIsKycUploadOpen(false)}
        currentKyc={profile.kycData}
        onSave={handleSaveKyc}
      />

      <SocialChannelModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        channel={editingSocial}
        onSave={handleSaveSocial}
      />
    </div>
  );
}
