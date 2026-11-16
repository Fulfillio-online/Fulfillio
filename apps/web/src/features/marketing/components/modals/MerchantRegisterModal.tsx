'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  Phone,
  Mail,
  User,
  Globe,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Truck,
  Zap,
  BadgeDollarSign,
  MapPin,
  Eye,
  EyeOff,
} from 'lucide-react';
import { registerNewMerchantAccount } from '@/lib/warehouseSync';

interface MerchantRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}

export function MerchantRegisterModal({
  isOpen,
  onClose,
  onOpenLogin,
}: MerchantRegisterModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Fashion & Apparel');
  const [orderVolume, setOrderVolume] = useState('100 - 500 orders/mo');
  const [city, setCity] = useState('Dhaka');
  const [storeUrl, setStoreUrl] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdCode, setCreatedCode] = useState<string>('MC-106');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setErrorMessage('Please agree to terms and conditions to proceed.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const res = await registerNewMerchantAccount({
      fullName,
      storeName,
      phone,
      email,
      category,
      orderVolume,
      storeUrl,
      password,
    });

    setLoading(false);
    if (!res.ok) {
      setErrorMessage(res.error || 'সাইন-আপ সম্পন্ন করা যায়নি। অনুগ্রহ করে সকল তথ্য সঠিকভাবে পূরণ করুন।');
      return;
    }

    if (res.merchant?.merchantCode) {
      setCreatedCode(res.merchant.merchantCode);
    }
    setSubmitted(true);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-5 sm:p-8 animate-in zoom-in-95 duration-150 text-navy-900 dark:text-white my-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top gradient stripe */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          aria-label="Close registration modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-800 dark:text-orange-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Become a Merchant Partner</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white tracking-tight">
                Create Your Fulfillio Merchant Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Store inventory in central warehouse, automate barcode packaging, and receive weekly direct COD payouts.
              </p>
            </div>

            {/* 3 Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-navy-950/70 border border-orange-200/60 dark:border-white/10 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-navy-900 dark:text-white block leading-tight">
                    24h Express Intake
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Same-day slotting</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-navy-950/70 border border-emerald-200/60 dark:border-white/10 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-navy-900 dark:text-white block leading-tight">
                    Zero Setup Fees
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Pay as you fulfill</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-navy-950/70 border border-blue-200/60 dark:border-white/10 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BadgeDollarSign className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-navy-900 dark:text-white block leading-tight">
                    Weekly Payouts
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Direct COD to bank/MFS</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Application Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {/* Group 1: Store & Brand Identity */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-orange-500" />
                  <span>1. Store &amp; Brand Identity</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Store or Brand Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Threads BD"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Product Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
                    >
                      <option value="Fashion & Apparel">Fashion &amp; Apparel</option>
                      <option value="Electronics & Gadgets">Electronics &amp; Gadgets</option>
                      <option value="Health, Skin & Cosmetics">Skin Care &amp; Cosmetics</option>
                      <option value="Footwear & Bags">Footwear &amp; Bags</option>
                      <option value="Lifestyle & Home">Lifestyle &amp; Home Decor</option>
                      <option value="Grocery & Foods">Grocery &amp; Packaged Foods</option>
                      <option value="Other">Other Products</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Website or Facebook / Instagram Page URL
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="facebook.com/yourstore or store.com"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Contact Representative */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-500" />
                  <span>2. Merchant Representative Contact</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Owner / Manager Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tanvir Hasan"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Phone Number (WhatsApp Active) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">+88</span>
                      <input
                        type="tel"
                        required
                        placeholder="01712-345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-navy-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Business Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="tanvir@store.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Operating City / Primary Hub
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-navy-900 dark:text-white focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
                      >
                        <option value="Dhaka">Dhaka (Central Warehouse Hub)</option>
                        <option value="Chattogram">Chattogram</option>
                        <option value="Sylhet">Sylhet</option>
                        <option value="Khulna">Khulna</option>
                        <option value="Rajshahi">Rajshahi</option>
                        <option value="Outside Dhaka">Other Districts</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 3: Expected Volume & Credentials */}
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-navy-950/70 border border-slate-200/80 dark:border-white/10 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span>3. Logistics Volume &amp; Account Security</span>
                </span>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                    Expected Monthly Parcel Volume <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { label: '< 100/mo', desc: 'Startup' },
                      { label: '100 - 500/mo', desc: 'Growth' },
                      { label: '500 - 2,000/mo', desc: 'Scale' },
                      { label: '2,000+/mo', desc: 'Enterprise' },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setOrderVolume(opt.label)}
                        className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                          orderVolume === opt.label
                            ? 'bg-orange-50 dark:bg-orange-500/20 border-orange-500 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                            : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span className="block font-bold text-xs">{opt.label}</span>
                        <span className="block text-[10px] opacity-75">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Create Portal Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-xl text-navy-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500"
                  />
                  <span>
                    I agree to Fulfillio Warehouse Terms of Service, safe custody rules, and weekly automated COD settlements.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !agreeTerms}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit Partner Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
              <span>Already a registered merchant partner? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLogin) onOpenLogin();
                }}
                className="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
              >
                Sign In here
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="py-8 px-4 text-center space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-orange-600 dark:text-orange-400 block">
                Application Received · Assigned Code: {createdCode}
              </span>
              <h3 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
                Welcome to Fulfillio, {storeName || 'Merchant'}!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                আপনার মার্চেন্ট প্রোফাইলটি সফলভাবে তৈরি হয়ে <strong>Admin Verification Queue</strong>-তে যুক্ত হয়েছে। এডমিন প্যানেল থেকে ভেরিফিকেশন সম্পন্ন হওয়ার পর আপনার ইমেইল (<span className="font-mono font-bold text-orange-600 dark:text-orange-400">{email}</span>) ও পাসওয়ার্ড দিয়ে সরাসরি মার্চেন্ট পোর্টালে লগইন করতে পারবেন।
              </p>
            </div>

            {/* Verification Steps Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 text-left max-w-md mx-auto space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>1. Application Registered &amp; Account Code Issued</span>
              </div>
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold">
                <ClockIcon className="h-4 w-4 shrink-0" />
                <span>2. Warehouse Team Review &amp; Onboarding Call (24 hrs)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 font-semibold">
                <span className="h-4 w-4 rounded-full border border-slate-300 dark:border-white/20 flex items-center justify-center text-[10px]">3</span>
                <span>3. Ready for Inbound Product Stocking &amp; Fulfillment</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {onOpenLogin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-900 dark:text-white transition-all cursor-pointer border border-slate-200 dark:border-white/10"
                >
                  Go to Merchant Sign In
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-500/20 cursor-pointer"
              >
                Done &amp; Return to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
