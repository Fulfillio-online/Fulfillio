'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import { MerchantProfileData } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MerchantProfileData;
  onSave: (updated: {
    ownerName: string;
    storeName: string;
    phone: string;
    location: string;
  }) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  profile,
  onSave,
}: EditProfileModalProps) {
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [storeName, setStoreName] = useState(profile.storeName);
  const [phone, setPhone] = useState(profile.phone);
  const [location, setLocation] = useState(profile.location);

  useEffect(() => {
    if (isOpen) {
      setOwnerName(profile.ownerName);
      setStoreName(profile.storeName);
      setPhone(profile.phone);
      setLocation(profile.location);
    }
  }, [isOpen, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ownerName, storeName, phone, location });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile Details"
      subtitle="Update your personal contact information and store display name."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Full Name / Owner Name *
          </label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Store / Brand Name *
          </label>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Phone Number *
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Business Location *
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
