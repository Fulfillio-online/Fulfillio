'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Server,
} from 'lucide-react';

export function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@fulfillio.online');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberTerminal, setRememberTerminal] = useState(true);

  const handleAutoFill = () => {
    setEmail('admin@fulfillio.online');
    setPassword('admin123');
    setError(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate admin credentials
    if (!email.trim() || !password.trim()) {
      setError('Please provide admin username and password.');
      setLoading(false);
      return;
    }

    const isValidUser =
      email.trim().toLowerCase() === 'admin@fulfillio.online' ||
      email.trim().toLowerCase() === 'admin' ||
      email.trim().toLowerCase() === 'superadmin@fulfillio.com';

    if (!isValidUser || password !== 'admin123') {
      setError('Invalid admin credentials. Use admin@fulfillio.online / admin123.');
      setLoading(false);
      return;
    }

    try {
      localStorage.setItem(
        'fulfillio_active_admin_session_v1',
        JSON.stringify({
          email: 'admin@fulfillio.online',
          role: 'SUPER_ADMIN',
          name: 'Super Administrator',
          authenticatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }

    setTimeout(() => {
      setLoading(false);
      router.push('/admin');
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none selection:bg-orange-500 selection:text-white">
      {/* Background radial ambient lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-orange-600/30 group-hover:scale-105 transition-all">
              F
            </div>
            <div className="text-left">
              <span className="font-black text-2xl tracking-tight text-white block leading-tight">
                Fulfill<span className="text-orange-500">io</span>
              </span>
              <span className="text-[11px] font-mono uppercase font-bold text-orange-400 tracking-wider block">
                Enterprise WMS
              </span>
            </div>
          </Link>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Admin Operations Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted Gateway · Multi-Tenant Warehouse &amp; 3PL System Administration
            </p>
          </div>
        </div>

        {/* Credentials Callout Card (Requested by User) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-navy-900/90 to-slate-900/90 border border-orange-500/30 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
              <KeyRound className="h-4 w-4 text-orange-400" />
              <span>Default Super Admin Credentials</span>
            </div>
            <button
              type="button"
              onClick={handleAutoFill}
              className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-[11px] font-bold border border-orange-500/40 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <Sparkles className="h-3 w-3" />
              <span>Auto-Fill</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Admin Username</span>
              <span className="text-white font-bold select-all">admin@fulfillio.online</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Admin Password</span>
              <span className="text-orange-400 font-bold select-all">admin123</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Admin Username or Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fulfillio.online"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-orange-400 font-medium">Full Console Access</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={rememberTerminal}
                  onChange={(e) => setRememberTerminal(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-orange-600 focus:ring-orange-500"
                />
                <span>Remember this admin terminal</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate &amp; Enter Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-3 border-t border-slate-800 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <Server className="h-3.5 w-3.5 text-emerald-500" />
              <span>TLS 1.3 Encrypted Session · Single Tenant DB Isolation</span>
            </div>
            <Link
              href="/"
              className="inline-block text-xs text-slate-400 hover:text-orange-400 transition-colors"
            >
              &larr; Return to Public Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
