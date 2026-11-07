'use client';

import React, { useState } from 'react';
import {
  HomeHeader,
  HomeHero,
  TrustSection,
  ProblemSolutionSection,
  ServicesSection,
  HowItWorksSection,
  ShowcaseSection,
  WhyChooseSection,
  OrderFlowSection,
  PricingSection,
  IndustriesSection,
  TestimonialsSection,
  FaqSection,
  CtaSection,
  HomeFooter,
  AuthModal,
  MerchantRegisterModal,
} from '@/features/marketing';

export default function HomePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const openLogin = () => setIsAuthModalOpen(true);
  const openRegister = () => setIsRegisterModalOpen(true);

  return (
    <div className="flex min-h-screen flex-col bg-white text-navy-800 dark:bg-navy-950 dark:text-white selection:bg-orange-500 selection:text-white">
      {/* 1. Navbar */}
      <HomeHeader onOpenLogin={openLogin} onOpenRegister={openRegister} />
      <main>
        {/* 2. Hero */}
        <HomeHero onOpenRegister={openRegister} onOpenLogin={openLogin} />
        {/* 3. Trust */}
        <TrustSection />
        {/* 4. Problem & Solution */}
        <ProblemSolutionSection />
        {/* 5. Our Services */}
        <ServicesSection onOpenRegister={openRegister} />
        {/* 6. How It Works */}
        <HowItWorksSection />
        {/* 7. Warehouse Showcase */}
        <ShowcaseSection />
        {/* 8. Why Choose Us */}
        <WhyChooseSection />
        {/* 9. Order Flow */}
        <OrderFlowSection />
        {/* 10. Pricing */}
        <PricingSection onOpenRegister={openRegister} />
        {/* 11. Industries */}
        <IndustriesSection />
        {/* 12. Testimonials */}
        <TestimonialsSection />
        {/* 13. FAQ */}
        <FaqSection />
        {/* 14. CTA */}
        <CtaSection onOpenRegister={openRegister} />
      </main>
      {/* 15. Footer */}
      <HomeFooter onOpenLogin={openLogin} onOpenRegister={openRegister} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenRegister={() => {
          setIsAuthModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <MerchantRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onOpenLogin={() => {
          setIsRegisterModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />
    </div>
  );
}
