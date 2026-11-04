'use client';

import React, { useState } from 'react';
import { User, ShieldCheck } from 'lucide-react';
import { StoreProfileData, PayoutAccount, KycDocumentData, SocialChannel } from './types';
import { StoreIdentityCard } from './components/StoreIdentityCard';
import { PayoutAccountCard } from './components/PayoutAccountCard';
import { KycVerificationCard } from './components/KycVerificationCard';
import { SocialChannelsCard } from './components/SocialChannelsCard';
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
    <div className="space-y-6">
      {/* Tab Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-400 shrink-0" />
          <span>My Store Profile & Compliance</span>
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Store identity, COD disbursement bank account, regulatory KYC documents, and marketing channels.
        </p>
      </div>

      {/* 4 Modular Profile Cards */}
      <div className="space-y-6">
        <StoreIdentityCard
          profile={profile}
          onEdit={() => setIsEditProfileOpen(true)}
        />

        <PayoutAccountCard
          payoutAccount={profile.payoutAccount}
          onManagePayout={() => setIsManagePayoutOpen(true)}
        />

        <KycVerificationCard
          kycData={profile.kycData}
          onOpenUpload={() => setIsKycUploadOpen(true)}
        />

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
