'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  User,
  Globe,
  Package,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

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
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Fashion & Apparel');
  const [orderVolume, setOrderVolume] = useState('100 - 500 orders/mo');
  const [storeUrl, setStoreUrl] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-800 dark:text-orange-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>মার্চেন্ট অনবোর্ডিং</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Fulfillio মার্চেন্ট একাউন্ট খুলুন
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                ঢাকার সেন্ট্রাল ওয়্যারহাউসে ইনভেন্টরি সংরক্ষণ, বারকোড প্যাকিং এবং দ্রুত COD সেটেলমেন্ট পান।
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">আপনার পূর্ণ নাম *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. তানভীর হাসান"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">স্টোর বা ব্র্যান্ডের নাম *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Threads BD"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ফোন নাম্বার (হোয়াটসঅ্যাপ) *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="017XX-XXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ইমেইল এড্রেস *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="tanvir@store.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">প্রোডাক্ট ক্যাটাগরি *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Fashion & Apparel">ফ্যাশন ও ক্লোথিং</option>
                    <option value="Electronics & Gadgets">ইলেকট্রনিক্স ও গ্যাজেটস</option>
                    <option value="Health, Skin & Cosmetics">স্কিন কেয়ার ও কসমেটিক্স</option>
                    <option value="Footwear & Bags">জুতা ও ব্যাগ</option>
                    <option value="Lifestyle & Home">লাইফস্টাইল ও হোম ডেকোর</option>
                    <option value="Other">অন্যান্য প্রোডাক্ট</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">মাসিক আনুমানিক পার্সেল *</label>
                  <select
                    value={orderVolume}
                    onChange={(e) => setOrderVolume(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="< 100 orders/mo">&lt; ১০০ পার্সেল / মাস (স্টার্টআপ)</option>
                    <option value="100 - 500 orders/mo">১০০ - ৫০০ পার্সেল / মাস</option>
                    <option value="500 - 2,000 orders/mo">৫০০ - ২,০০০ পার্সেল / মাস</option>
                    <option value="2,000+ orders/mo">২,০০০+ পার্সেল / মাস (হাই ভলিউম)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">ফেসবুক পেজ বা ওয়েবসাইট লিংক</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="facebook.com/yourpage"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">পাসওয়ার্ড সেট করুন *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="কমপক্ষে ৬ ক্যারেক্টার"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Agreement */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-[11px] text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500"
                  />
                  <span>
                    আমি Fulfillio ওয়্যারহাউস টার্মস ও সাপ্তাহিক COD সেটেলমেন্ট নিয়মনীতিতে সম্মতি দিচ্ছি।
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !agreeTerms}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>আবেদন সাবমিট করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              <span>ইতিমধ্যে মার্চেন্ট আছেন? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLogin) onOpenLogin();
                }}
                className="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
              >
                ড্যাশবোর্ডে লগইন করুন
              </button>
            </div>
          </div>
        ) : (
          /* Confirmation Screen */
          <div className="py-8 px-4 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/15 border border-orange-300 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-orange-600 dark:text-orange-400 block mb-1">
                আবেদন সফল হয়েছে
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                স্বাগতম, {storeName || 'মার্চেন্ট'}!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                আপনার অনবোর্ডিং রিকোয়েস্ট রিসিভ করা হয়েছে। আমাদের ওয়্যারহাউস টিম শীঘ্রই আপনার দেওয়া হোয়াটসঅ্যাপ নাম্বারে (<span className="text-orange-600 dark:text-orange-400 font-mono font-semibold">{phone || 'প্রদত্ত নাম্বার'}</span>) যোগাযোগ করে প্রথম প্রোডাক্ট ইনবাউন্ড শিডিউল বুঝিয়ে দেবে।
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md cursor-pointer"
            >
              সম্পন্ন &amp; হোমপেজে ফিরুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
