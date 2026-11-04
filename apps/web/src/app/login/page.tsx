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
  Sparkles
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('merchant@urbanthreads.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<'SUPER_ADMIN' | 'MERCHANT' | 'WAREHOUSE_OPERATOR'>('MERCHANT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (role: 'SUPER_ADMIN' | 'MERCHANT' | 'WAREHOUSE_OPERATOR') => {
    setSelectedRole(role);
    if (role === 'SUPER_ADMIN') {
      setEmail('admin@fulfillio.online');
    } else if (role === 'MERCHANT') {
      setEmail('merchant@urbanthreads.com');
    } else {
      setEmail('worker@fulfillio.online');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    setTimeout(() => {
      setLoading(false);
      if (selectedRole === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (selectedRole === 'MERCHANT') {
        router.push('/merchant');
      } else {
        router.push('/wms/pick');
      }
    }, 600);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-950">
              F
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Fulfillio<span className="text-emerald-400">.online</span>
            </span>
          </Link>
          <p className="text-sm text-slate-400">
            Unified Warehouse Management & Reseller Fulfillment
          </p>
        </div>

        {/* Card Container */}
        <div className="p-5 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {/* Quick Role Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              Select Demo Role / Destination:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('MERCHANT')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedRole === 'MERCHANT'
                    ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Package className="h-4 w-4" />
                <span className="text-[11px] font-bold">Merchant</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('SUPER_ADMIN')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedRole === 'SUPER_ADMIN'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px] font-bold">Super Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('WAREHOUSE_OPERATOR')}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  selectedRole === 'WAREHOUSE_OPERATOR'
                    ? 'bg-teal-950/60 border-teal-500 text-teal-300 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-[11px] font-bold">Worker App</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to {selectedRole.replace('_', ' ')}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <span className="text-xs text-slate-500">
              Protected by JWT Role-Based Access Control
            </span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link href="/" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
