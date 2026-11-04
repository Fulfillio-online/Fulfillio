import React from 'react';
import {
  MarketingHeader,
  HeroSection,
  AboutSection,
  ServicesSection,
  HowItWorksSection,
  WhyUsSection,
  TestimonialsSection,
  FaqSection,
  QuickLoginSection,
  MarketingFooter,
} from '@/features/marketing';

export const metadata = {
  title: 'Fulfillio — Automated 3PL Warehouse & Reseller WMS Platform',
  description:
    'Scale your Bangladeshi e-commerce brand with automated warehouse fulfillment, custom Memo Code invoices, barcode packing verification, and multi-courier dispatch.',
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Sticky Marketing Header with Navigation & Sign In CTA */}
      <MarketingHeader />

      {/* Hero Section */}
      <HeroSection />

      {/* About Section */}
      <AboutSection />

      {/* Services Section */}
      <ServicesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Why Us Comparison Section */}
      <WhyUsSection />

      {/* Merchant Testimonials Section */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FaqSection />

      {/* Interactive Quick Portal Access / Login Section */}
      <QuickLoginSection />

      {/* Marketing Footer */}
      <MarketingFooter />
    </div>
  );
}
