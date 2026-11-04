'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  ShieldAlert,
  Smartphone,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Barcode,
  CheckCircle2,
} from 'lucide-react';

type LoginRole = 'MERCHANT' | 'SUPER_ADMIN' | 'WAREHOUSE_OPERATOR';

export function QuickLoginSection() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<LoginRole>('MERCHANT');
  const [email, setEmail] = useState('sabbir@sabbirstore.com');
  const [password, setPassword] = useState('admin123');
  const [workerPin, setWorkerPin] = useState('1234');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (role: LoginRole) => {
    setSelectedRole(role);
    if (role === 'MERCHANT') {
      setEmail('sabbir@sabbirstore.com');
      setPassword('admin123');
    } else if (role === 'SUPER_ADMIN') {
      setEmail('admin@fulfillio.online');
      setPassword('admin123');
    } else {
      setEmail('worker@fulfillio.online');
      setWorkerPin('1234');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (selectedRole === 'MERCHANT') {
        router.push('/merchant');
      } else if (selectedRole === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/wms/worker');
      }
    }, 500);
  };

  return (
    <section
      id="login"
      className="py-20 sm:py-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800 relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Portal Access
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-4">
            Sign In to Your Workspace
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300">
            Select your role below to launch the dedicated portal with pre-loaded demo credentials.
          </p>
        </div>

        {/* Card Box */}
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-sm max-w-xl mx-auto">
          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 mb-8">
            <button
              type="button"
              onClick={() => handleRoleChange('MERCHANT')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                selectedRole === 'MERCHANT'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="h-4 w-4 shrink-0" />
              <span>Merchant</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('SUPER_ADMIN')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                selectedRole === 'SUPER_ADMIN'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('WAREHOUSE_OPERATOR')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                selectedRole === 'WAREHOUSE_OPERATOR'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="h-4 w-4 shrink-0" />
              <span>Worker PIN</span>
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {selectedRole === 'WAREHOUSE_OPERATOR' ? (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Operator ID / Station Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                      placeholder="worker@fulfillio.online"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    4-Digit Fast Access PIN
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={4}
                      value={workerPin}
                      onChange={(e) => setWorkerPin(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white tracking-[0.5em] text-center font-bold focus:outline-none focus:border-emerald-500"
                      placeholder="••••"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Business Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="name@business.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {loading ? (
                <span>Authorizing Session...</span>
              ) : (
                <>
                  <span>
                    Launch{' '}
                    {selectedRole === 'MERCHANT'
                      ? 'Merchant Portal'
                      : selectedRole === 'SUPER_ADMIN'
                      ? 'Admin Control Panel'
                      : 'WMS Worker App'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Quick Demo Credentials Info */}
            <div className="pt-4 mt-4 border-t border-slate-800/80 text-center">
              <span className="text-[11px] text-slate-400">
                🚀 Demo credentials automatically set for instant evaluation.
              </span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
