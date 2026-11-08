import React, { useState, useMemo } from 'react';
import { Store, Pencil, X, Save, Truck } from 'lucide-react';
import { MerchantRecord } from '../../types';

export interface MerchantStoreInfoTabProps {
  merchant: MerchantRecord;
  onSave: (updated: MerchantRecord) => void;
}

export function MerchantStoreInfoTab({ merchant, onSave }: MerchantStoreInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [storeName, setStoreName] = useState(merchant.storeName);
  const [ownerName, setOwnerName] = useState(merchant.ownerName);
  const [email, setEmail] = useState(merchant.email);
  const [phone, setPhone] = useState(merchant.phone);
  const [location, setLocation] = useState(merchant.location);
  const [deliveryArea, setDeliveryArea] = useState(merchant.deliveryArea);

  const hasChanges = useMemo(() => {
    return (
      storeName.trim() !== merchant.storeName ||
      ownerName.trim() !== merchant.ownerName ||
      email.trim() !== merchant.email ||
      phone.trim() !== merchant.phone ||
      location.trim() !== merchant.location ||
      deliveryArea.trim() !== merchant.deliveryArea
    );
  }, [merchant, storeName, ownerName, email, phone, location, deliveryArea]);

  const handleCancel = () => {
    setStoreName(merchant.storeName);
    setOwnerName(merchant.ownerName);
    setEmail(merchant.email);
    setPhone(merchant.phone);
    setLocation(merchant.location);
    setDeliveryArea(merchant.deliveryArea);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave({
      ...merchant,
      storeName: storeName.trim() || merchant.storeName,
      ownerName: ownerName.trim() || merchant.ownerName,
      email: email.trim() || merchant.email,
      phone: phone.trim() || merchant.phone,
      location: location.trim() || merchant.location,
      deliveryArea: deliveryArea.trim() || merchant.deliveryArea,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-navy-900/80 p-6 space-y-6 shadow-xl">
        {/* Header & Edit / Save Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-800 dark:text-white">Store Information</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Update store name, contact coordinates, or coverage area preferences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-navy-800 dark:bg-navy-700 hover:bg-navy-700 dark:hover:bg-navy-600 border border-slate-300 dark:border-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-300 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                {hasChanges && (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save changes</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-navy-800 dark:text-slate-100 mb-1.5">
              Store name
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-navy-800 dark:text-white focus:outline-none transition-colors ${
                isEditing
                  ? 'border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 focus:border-orange-500'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/50 text-slate-700 dark:text-slate-200 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-800 dark:text-slate-100 mb-1.5">
              Owner name
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-navy-800 dark:text-white focus:outline-none transition-colors ${
                isEditing
                  ? 'border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 focus:border-orange-500'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/50 text-slate-700 dark:text-slate-200 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-800 dark:text-slate-100 mb-1.5">
              Business email
            </label>
            <input
              type="email"
              disabled={!isEditing}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-navy-800 dark:text-white focus:outline-none transition-colors ${
                isEditing
                  ? 'border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 focus:border-orange-500'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/50 text-slate-700 dark:text-slate-200 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-800 dark:text-slate-100 mb-1.5">
              Phone number
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-navy-800 dark:text-white focus:outline-none transition-colors ${
                isEditing
                  ? 'border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 focus:border-orange-500'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/50 text-slate-700 dark:text-slate-200 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-800 dark:text-slate-100 mb-1.5">
              Business location
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-navy-800 dark:text-white focus:outline-none transition-colors ${
                isEditing
                  ? 'border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 focus:border-orange-500'
                  : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/50 text-slate-700 dark:text-slate-200 cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-800 dark:text-slate-100 mb-1.5">
              Default delivery area
            </label>
            <div className="relative">
              <Truck className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                disabled={!isEditing}
                value={deliveryArea}
                onChange={(e) => setDeliveryArea(e.target.value)}
                className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm text-navy-800 dark:text-white focus:outline-none transition-colors ${
                  isEditing
                    ? 'border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-navy-950 focus:border-orange-500'
                    : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-navy-950/50 text-slate-700 dark:text-slate-200 cursor-not-allowed'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
