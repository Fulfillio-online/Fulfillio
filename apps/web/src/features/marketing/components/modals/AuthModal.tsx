'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialRole);
      setErrorMessage(null);
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
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please provide both your email and password.');
      setLoading(false);
      return;
    }

    if (selectedRole === 'MERCHANT') {
      const res = await authenticateMerchantLogin(cleanEmail, cleanPassword);
      setLoading(false);
      if (!res.ok) {
        setErrorMessage(res.error || 'Authentication failed. Please verify your credentials.');
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
            email: cleanEmail,
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[380px] bg-white dark:bg-slate-900 rounded-3xl p-7 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-150 my-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close login modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Centered Logo & Title */}
        <div className="text-center space-y-2.5">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-orange-600/25">
            F
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fulfillio
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {selectedRole === 'MERCHANT' ? 'Merchant sign in' : 'Staff sign in'}
            </p>
          </div>
        </div>

        {/* Minimal Role Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSwitchRole('MERCHANT')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedRole === 'MERCHANT'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Merchant
          </button>
          <button
            type="button"
            onClick={() => handleSwitchRole('STAFF')}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedRole === 'STAFF'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Staff
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Clean Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {selectedRole === 'MERCHANT' ? 'Email' : 'Staff ID or Email'}
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                selectedRole === 'MERCHANT' ? 'merchant@example.com' : 'worker@fulfillio.online'
              }
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white dark:focus:bg-slate-950 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:bg-white dark:focus:bg-slate-950 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl font-semibold text-sm bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 shadow-md shadow-orange-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Sign in</span>
              </>
            )}
          </button>
        </form>

        {/* Minimal Footer */}
        <div className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {selectedRole === 'MERCHANT' ? (
            <div>
              <span>Don&apos;t have an account? </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenRegister) onOpenRegister();
                }}
                className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium underline transition-colors cursor-pointer"
              >
                Register
              </button>
            </div>
          ) : (
            <div>
              <span>Warehouse staff portal</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
