'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';

export function AdminLoginPage() {
  const router = useRouter();
  const { resolvedTheme, changeTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTheme = () => {
    changeTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please provide your admin email and password.');
      setLoading(false);
      return;
    }

    const isValidUser =
      cleanEmail === 'admin@fulfillio.online' ||
      cleanEmail === 'admin' ||
      cleanEmail === 'superadmin@fulfillio.com';

    if (!isValidUser || cleanPassword !== 'admin123') {
      setError('Invalid admin credentials. Please verify your email and password.');
      setLoading(false);
      return;
    }

    try {
      localStorage.setItem(
        'fulfillio_active_admin_session_v1',
        JSON.stringify({
          email: cleanEmail,
          role: 'SUPER_ADMIN',
          name: 'Super Administrator',
          authenticatedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore storage failure
    }

    setTimeout(() => {
      setLoading(false);
      router.push('/admin');
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-orange-500 selection:text-white transition-colors relative">
      {/* Ambient background glow for dark mode */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none hidden dark:block" />

      {/* Top right Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark and light mode"
          className="p-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 shadow-sm backdrop-blur-sm transition-all cursor-pointer"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-[380px] bg-white dark:bg-slate-900 rounded-3xl p-7 sm:p-8 shadow-xl shadow-slate-200/70 dark:shadow-2xl dark:shadow-black/70 border border-slate-100 dark:border-slate-800 space-y-6 relative z-10 transition-colors">
        {/* Centered Logo & Title */}
        <div className="text-center space-y-2.5">
          <Link href="/" className="inline-block group">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-orange-600 flex items-center justify-center font-black text-white text-xl shadow-md shadow-orange-600/25 group-hover:scale-105 transition-transform">
              F
            </div>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fulfillio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Admin sign in
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Clean Minimal Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fulfillio.online"
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

        {/* Footer */}
        <div className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          <span>Only admin staff can sign in here. </span>
          <Link
            href="/"
            className="text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium underline transition-colors"
          >
            Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
