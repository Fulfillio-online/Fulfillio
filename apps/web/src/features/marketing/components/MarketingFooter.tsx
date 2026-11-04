import React from 'react';
import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center font-black text-white text-base">
                F
              </div>
              <span className="font-extrabold text-lg text-white">
                Fulfillio<span className="text-emerald-400">.online</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated 3PL Warehouse Management &amp; Reseller Custom Memo Slip Platform for Bangladeshi E-Commerce.
            </p>
            <p className="text-[11px] text-slate-400">
              Banani C/A, Dhaka-1213, Bangladesh
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 mb-3">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="hover:text-emerald-400 transition-colors">
                  About Fulfillio
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-emerald-400 transition-colors">
                  Fulfillment Services
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-emerald-400 transition-colors">
                  Why Us (Comparison)
                </a>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 mb-3">
              Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#login" className="hover:text-emerald-400 transition-colors">
                  Merchant Portal Sign In
                </a>
              </li>
              <li>
                <a href="#login" className="hover:text-emerald-400 transition-colors">
                  Admin Control Panel
                </a>
              </li>
              <li>
                <a href="#login" className="hover:text-emerald-400 transition-colors">
                  WMS Handheld Worker App
                </a>
              </li>
              <li>
                <Link href="/wms/packing" className="hover:text-emerald-400 transition-colors">
                  Packing Thermal Station
                </Link>
              </li>
            </ul>
          </div>

          {/* Integrations */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200 mb-3">
              Courier Partners
            </h4>
            <ul className="space-y-2">
              <li>Steadfast Courier API</li>
              <li>Pathao Courier API</li>
              <li>RedX Logistics API</li>
              <li>Paperfly Delivery</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <span>
            &copy; {new Date().getFullYear()} Fulfillio Technologies Ltd. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <a href="#about" className="hover:text-slate-300 transition-colors">
              Terms &amp; SLAs
            </a>
            <a href="#faqs" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#login" className="hover:text-emerald-400 transition-colors font-medium">
              Demo Access
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
