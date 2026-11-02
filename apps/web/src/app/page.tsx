import Link from 'next/link';
import { Box, Layers, Barcode, ShieldCheck, ArrowRight, Zap, RefreshCw, Package, Smartphone } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-lg">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Fulfillio<span className="text-emerald-500">.online</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/admin"
              className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Admin Panel</span>
            </Link>

            <Link
              href="/merchant"
              className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700 transition-colors flex items-center gap-1.5"
            >
              <Package className="h-4 w-4 text-indigo-400" />
              <span>Merchant Portal</span>
            </Link>

            <Link
              href="/wms/worker"
              className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-700 transition-colors flex items-center gap-1.5"
            >
              <Smartphone className="h-4 w-4 text-teal-400" />
              <span>Worker App</span>
            </Link>

            <Link
              href="/wms/packing"
              className="text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Barcode className="h-4 w-4" />
              <span>Packing Station</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="h-3.5 w-3.5 text-emerald-500" />
          Modular Monolith 3PL Fulfillment
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-tight">
          Next-Gen Warehouse Management & Custom Memo Invoices
        </h1>

        <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Connect your WooCommerce, Shopify, or custom store to Fulfillio. Enjoy atomic inventory reservation, rapid barcode-driven packing stations, and branded invoices using custom <strong>Memo Codes</strong>.
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Custom Memo Code Engine</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Merchants create and save branded invoice layouts. Orders pass a unique Memo Code, and our packing station renders the exact template instantly upon scanning.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
              <Barcode className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Packing Station Verification</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Ergonomic, high-speed operator UI supporting USB HID scanners and camera scanning with audio confirmation, ensuring 100% order accuracy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-2">Zero Stock Race Conditions</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Powered by PostgreSQL atomic row-locking (<code className="text-xs">SELECT FOR UPDATE</code>) guaranteeing zero overselling and immediate stock sync across all merchant stores.
            </p>
          </div>
        </div>

        {/* Quick Demo CTA */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-lg transition-all text-base"
          >
            <Layers className="h-5 w-5 text-emerald-400" />
            Admin Panel
          </Link>

          <Link
            href="/merchant"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all text-base"
          >
            <Package className="h-5 w-5 text-white" />
            Merchant Portal & Memo Designer
          </Link>

          <Link
            href="/wms/packing"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all text-base"
          >
            <Barcode className="h-5 w-5" />
            Packing Station
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        Fulfillio (fulfillio.online) — Modular Monolith 3PL Fulfillment Platform
      </footer>
    </div>
  );
}
