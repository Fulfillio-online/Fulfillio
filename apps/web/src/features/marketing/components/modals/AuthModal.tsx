'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  HardHat,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
  initialRole?: 'MERCHANT' | 'SUPER_ADMIN' | 'WAREHOUSE_OPERATOR';
}

export function AuthModal({
  isOpen,
  onClose,
  onOpenRegister,
  initialRole = 'MERCHANT',
}: AuthModalProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'MERCHANT' | 'SUPER_ADMIN' | 'WAREHOUSE_OPERATOR'>(initialRole);
  const [email, setEmail] = useState('merchant@urbanthreads.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedRole(initialRole);
    applyPresetCredentials(initialRole);
  }, [initialRole, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const applyPresetCredentials = (role: 'MERCHANT' | 'SUPER_ADMIN' | 'WAREHOUSE_OPERATOR') => {
    setSelectedRole(role);
    if (role === 'SUPER_ADMIN') {
      setEmail('admin@fulfillio.online');
      setPassword('admin123');
    } else if (role === 'MERCHANT') {
      setEmail('merchant@urbanthreads.com');
      setPassword('password123');
    } else {
      setEmail('worker@fulfillio.online');
      setPassword('worker123');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onClose();
      if (selectedRole === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (selectedRole === 'MERCHANT') {
        router.push('/merchant');
      } else {
        router.push('/wms/pick');
      }
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 transition-colors"
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

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-800 dark:text-orange-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>পোর্টাল সাইন ইন</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              আপনার একাউন্টে প্রবেশ করুন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              রোল অনুযায়ী ড্যাশবোর্ড অ্যাক্সেস করতে নিচের ট্যাব নির্বাচন করুন।
            </p>
          </div>

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => applyPresetCredentials('MERCHANT')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                selectedRole === 'MERCHANT'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-900/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>মার্চেন্ট</span>
            </button>

            <button
              type="button"
              onClick={() => applyPresetCredentials('SUPER_ADMIN')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                selectedRole === 'SUPER_ADMIN'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>এডমিন</span>
            </button>

            <button
              type="button"
              onClick={() => applyPresetCredentials('WAREHOUSE_OPERATOR')}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                selectedRole === 'WAREHOUSE_OPERATOR'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>কর্মী</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ইমেইল বা ইউজারনেম
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">পাসওয়ার্ড</label>
                <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">ডেমো অটোফিল সক্রিয়</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {selectedRole === 'MERCHANT' ? 'মার্চেন্ট ড্যাশবোর্ডে প্রবেশ করুন' : selectedRole === 'SUPER_ADMIN' ? 'এডমিন প্যানেলে প্রবেশ করুন' : 'ওয়ার্কার প্যানেলে প্রবেশ করুন'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switcher */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            <span>নতুন মার্চেন্ট? </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenRegister) onOpenRegister();
              }}
              className="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
            >
              এখানে একাউন্ট খুলুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
