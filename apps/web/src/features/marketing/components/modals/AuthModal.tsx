'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  X,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Store,
  HardHat,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { authenticateMerchantLogin } from '@/lib/warehouseSync';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
  initialRole?: 'MERCHANT' | 'STAFF';
}

export function AuthModal({
  isOpen,
  onClose,
  onOpenRegister,
  initialRole = 'MERCHANT',
}: AuthModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'MERCHANT' | 'STAFF'>(initialRole);
  const [email, setEmail] = useState('sabbir@example.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      handleSwitchRole(initialRole);
    }
  }, [isOpen, initialRole]);

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

  const handleSwitchRole = (role: 'MERCHANT' | 'STAFF') => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'MERCHANT') {
      setEmail('sabbir@example.com');
      setPassword('password123');
    } else {
      setEmail('worker@fulfillio.online');
      setPassword('worker123');
    }
  };

  const handleAutoFill = () => {
    if (selectedRole === 'MERCHANT') {
      setEmail('sabbir@example.com');
      setPassword('password123');
    } else {
      setEmail('worker@fulfillio.online');
      setPassword('worker123');
    }
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    if (selectedRole === 'MERCHANT') {
      const res = await authenticateMerchantLogin(email, password);
      setLoading(false);
      if (!res.ok) {
        setErrorMessage(res.error || 'লগইন করা সম্ভব হয়নি। সঠিক ইমেইল ও পাসওয়ার্ড দিন।');
        return;
      }

      onClose();
      router.push('/merchant');
      return;
    }

    // Warehouse Staff Authentication
    setTimeout(() => {
      setLoading(false);
      try {
        localStorage.setItem(
          'fulfillio_active_worker_session_v1',
          JSON.stringify({
            email,
            role: 'WAREHOUSE_OPERATOR',
            name: 'Station Operator',
            station: 'Dock Bay 1',
            authenticatedAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }
      onClose();
      router.push('/wms/pick');
    }, 350);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 transition-colors my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent top gradient stripe */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
          aria-label="Close login modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-5 text-navy-900 dark:text-white">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-800 dark:text-orange-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Operations Portal Sign In</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white tracking-tight">
              {selectedRole === 'MERCHANT' ? 'Sign in to Merchant Portal' : 'Warehouse Staff Sign In'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {selectedRole === 'MERCHANT'
                ? 'Access real-time orders, inventory stock, branded invoices & COD wallet.'
                : 'Access warehouse picking, barcode station packaging & dock intake.'}
            </p>
          </div>

          {/* 2-Role Switcher Tabs: Merchant & Warehouse Staff (Admin Removed) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => handleSwitchRole('MERCHANT')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedRole === 'MERCHANT'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Merchant Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchRole('STAFF')}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedRole === 'STAFF'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 font-extrabold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
              }`}
            >
              <HardHat className="w-4 h-4" />
              <span>Warehouse Staff</span>
            </button>
          </div>

          {/* Demo Credentials Callout */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {selectedRole === 'MERCHANT' ? 'Demo Merchant Login' : 'Demo Staff Login'}
              </span>
              <span className="font-mono text-navy-900 dark:text-slate-200 font-semibold truncate block">
                {selectedRole === 'MERCHANT'
                  ? 'sabbir@example.com · password123'
                  : 'worker@fulfillio.online · worker123'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 active:scale-95 ${
                selectedRole === 'MERCHANT'
                  ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 hover:bg-orange-100'
                  : 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100'
              }`}
            >
              Auto-Fill
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                {selectedRole === 'MERCHANT' ? 'Merchant Email or Username' : 'Staff Worker ID / Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={selectedRole === 'MERCHANT' ? 'e.g. sabbir@example.com' : 'e.g. worker@fulfillio.online'}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {selectedRole === 'MERCHANT' && (
                  <button
                    type="button"
                    onClick={() => {
                      alert('Password reset instructions simulated. You can use password123 to log in.');
                    }}
                    className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm text-navy-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 ${
                selectedRole === 'MERCHANT'
                  ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/25'
                  : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {selectedRole === 'MERCHANT' ? 'Sign In to Merchant Dashboard' : 'Enter Warehouse Station'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switcher: Register as Merchant */}
          {selectedRole === 'MERCHANT' ? (
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
              <span>Don&apos;t have a merchant account? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenRegister) onOpenRegister();
                }}
                className="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
              >
                Become a Merchant Partner
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400">
              <span>Warehouse badge missing? Contact Station Dock Master.</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
