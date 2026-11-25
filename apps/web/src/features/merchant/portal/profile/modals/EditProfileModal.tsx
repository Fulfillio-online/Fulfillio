'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, User, Image as ImageIcon, Home } from 'lucide-react';
import { DocumentUploadDropzone } from '@/components/ui';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    ownerName: string;
    storeName: string;
    phone: string;
    location: string;
    personalAddress?: string;
    logoUrl?: string;
  };
  onSave: (updated: {
    ownerName: string;
    storeName: string;
    phone: string;
    location: string;
    personalAddress?: string;
    logoUrl?: string;
  }) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: EditProfileModalProps) {
  const [storeName, setStoreName] = useState(initialData.storeName);
  const [ownerName, setOwnerName] = useState(initialData.ownerName);
  const [phone, setPhone] = useState(initialData.phone);
  const [location, setLocation] = useState(initialData.location);
  const [personalAddress, setPersonalAddress] = useState(initialData.personalAddress || '');
  const [logoUrl, setLogoUrl] = useState(initialData.logoUrl || '');

  useEffect(() => {
    if (isOpen) {
      setStoreName(initialData.storeName);
      setOwnerName(initialData.ownerName);
      setPhone(initialData.phone);
      setLocation(initialData.location);
      setPersonalAddress(initialData.personalAddress || '');
      setLogoUrl(initialData.logoUrl || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ storeName, ownerName, phone, location, personalAddress: personalAddress.trim(), logoUrl });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-navy-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-900 dark:text-white">Edit Store Profile</h2>
              <p className="text-xs text-slate-400">Update business branding and warehouse dispatch location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-100 dark:bg-navy-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>Brand / Store Name</span>
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Store Owner / Primary Contact</span>
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>Contact Phone Number</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>Dispatch / Pickup Location Address</span>
            </label>
            <textarea
              rows={2}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-slate-400" />
              <span>Owner / Personal Address</span>
            </label>
            <textarea
              rows={2}
              placeholder="House / Road / Area / City (e.g. House 14, Road 6, Dhanmondi, Dhaka)"
              value={personalAddress}
              onChange={(e) => setPersonalAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-lg text-navy-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>Store Logo / Brand Avatar</span>
            </label>
            <DocumentUploadDropzone
              label="Upload Store Logo"
              sublabel="PNG or JPG square icon (recommended 400x400)"
              currentUrl={logoUrl}
              onUploadSuccess={(url) => setLogoUrl(url)}
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-300 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
