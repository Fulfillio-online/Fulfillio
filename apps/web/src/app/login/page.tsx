'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Package,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { authenticateMerchantLogin } from '@/lib/warehouseSync';
import { MerchantRegisterModal } from '@/features/marketing';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('sabbir@example.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<'MERCHANT' | 'WAREHOUSE_OPERATOR'>('MERCHANT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleRoleSelect = (role: 'MERCHANT' | 'WAREHOUSE_OPERATOR') => {
    setSelectedRole(role);
    setError(null);
    if (role === 'MERCHANT') {
      setEmail('sabbir@example.com');
      setPassword('password123');
    } else {
      setEmail('worker@fulfillio.online');
      setPassword('worker123');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (selectedRole === 'MERCHANT') {
      const res = await authenticateMerchantLogin(email, password);
      setLoading(false);
      if (!res.ok) {
        setError(res.error || 'লগইন করা সম্ভব হয়নি। সঠিক ইমেইল ও পাসওয়ার্ড দিন।');
        return;
      }
      router.push('/merchant');
      return;
    }

    setTimeout(() => {
      setLoading(false);
      router.push('/wms/pick');
    }, 450);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 flex-col justify-center items-center p-4 selection:bg-orange-500 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-orange-950">
              F
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Fulfill<span className="text-orange-500">io</span>
            </span>
          </Link>
          <p className="text-sm text-slate-400">
            Unified Warehouse Management &amp; Reseller Fulfillment
          </p>
        </div>

        {/* Card Container */}
        <div className="p-5 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {/* Quick Role Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              Select Workspace Portal:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('MERCHANT')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedRole === 'MERCHANT'
                    ? 'bg-orange-950/40 border-orange-500 text-orange-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="h-4 w-4" />
                <span className="text-xs font-bold">Merchant Portal</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('WAREHOUSE_OPERATOR')}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                  selectedRole === 'WAREHOUSE_OPERATOR'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-xs font-bold">Warehouse Staff</span>
              </button>
            </div>

            {selectedRole === 'MERCHANT' && (
              <div className="flex items-center gap-2 pt-2.5">
                <span className="text-[11px] text-slate-500 font-medium">Quick fill:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('azad@gmail.com');
                    setPassword('Azad?1');
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    email === 'azad@gmail.com'
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  Azad&apos;s Store
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('sabbir@example.com');
                    setPassword('password123');
                  }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    email === 'sabbir@example.com'
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  Sabbir&apos;s Store
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <span className="text-[11px] text-orange-400">Demo active</span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {selectedRole === 'MERCHANT' ? 'Enter Merchant Workspace' : 'Open Worker Station'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Trigger */}
          <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-400 space-y-3">
            <div>
              <span>New merchant? </span>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="text-orange-400 font-bold hover:underline cursor-pointer"
              >
                Become a Merchant Partner
              </button>
            </div>

            {/* Admin dedicated login link */}
            <div className="pt-2 border-t border-slate-800/60">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-orange-400 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Enterprise Administrator? Sign in via /admin/login &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <MerchantRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onOpenLogin={() => setIsRegisterModalOpen(false)}
      />
    </div>
  );
}
