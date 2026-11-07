# Premium E-Commerce Fulfillment Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Fulfillio homepage into a world-class, conversion-focused 3PL fulfillment website with 16 distinct sections, interactive 3-variant Hero visual switcher, and popup modals for Universal Role-based Login and Merchant Registration.

**Architecture:** Decompose all 16 homepage sections into modular, type-safe components under `apps/web/src/features/marketing/components/` and `modals/`. Implement smooth scroll anchor navigation, CSS keyframe animations, interactive fulfillment simulators, and zero-loss integration with existing Admin, Merchant, and WMS dashboards.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS 3.4, Lucide React, TypeScript.

---

## Global Constraints

- **Existing Dashboards**: Do not modify or break `/admin`, `/merchant`, or `/wms` routes.
- **Theme**: Hybrid Contrast Mode (Deep Navy `#101828` & Dark Green `#123C32` for Hero, Tech Preview, COD, and CTA; Crisp off-white `#F8FAFC` & `#FFFFFF` for Services, Workflow, Problems/Solutions, and FAQs).
- **Hero Variant Switcher**: Provide an interactive live switcher on the Hero visual allowing the user to preview Variant A (Live Fulfillment Simulator), Variant B (Tech Card Stack), and Variant C (Isometric Flow) directly in the browser.
- **Popups on Homepage**:
  - `AuthModal`: Universal Login with Admin (`/admin`), Merchant (`/merchant`), and Worker (`/wms/pick`) role switcher.
  - `MerchantRegisterModal`: Merchant Onboarding Form with instant validation and pending review confirmation.
- **Dependencies**: No external 3D or heavy WebGL dependencies; utilize pure React 19, SVG, and Tailwind CSS animations for blistering speed and zero bundle bloat.

---

## Tasks

### Task 1: Modals & Supporting Types Scaffolding
- [ ] Create `apps/web/src/features/marketing/types.ts` for all homepage structures (Services, Steps, Testimonials, FAQ, Pricing, Quotes).
- [ ] Build `apps/web/src/features/marketing/components/modals/AuthModal.tsx` supporting Admin, Merchant, and Worker login with role selection and dashboard redirects.
- [ ] Build `apps/web/src/features/marketing/components/modals/MerchantRegisterModal.tsx` supporting full merchant onboarding, BD phone formatting, validation, and review confirmation.

### Task 2: Sticky Marketing Header & Navigation
- [ ] Implement `apps/web/src/features/marketing/components/MarketingHeader.tsx` with glassmorphic scroll transition, brand logo, in-page anchor links (`#services`, `#how-it-works`, `#pricing`, `#warehouse`, `#faq`, `#contact`), "Sign In" trigger for `AuthModal`, "Become a Merchant" CTA trigger for `MerchantRegisterModal`, and responsive mobile drawer.

### Task 3: Hero Section with 3 Live Interactive Visual Variants
- [ ] Build `apps/web/src/features/marketing/components/hero/LiveFulfillmentSimulator.tsx` (Variant A: 5-stage interactive animated parcel journey).
- [ ] Build `apps/web/src/features/marketing/components/hero/TechCardStack.tsx` (Variant B: Layered glassmorphism order and warehouse metrics).
- [ ] Build `apps/web/src/features/marketing/components/hero/IsometricLogisticsFlow.tsx` (Variant C: Isometric warehouse floor illustration).
- [ ] Assemble `apps/web/src/features/marketing/components/HeroSection.tsx` with bold headline, trust highlights, CTA triggers, and live interactive variant selector tab.

### Task 4: Problem/Solution & Trust Value Sections
- [ ] Build `apps/web/src/features/marketing/components/TrustValueSection.tsx` (5 operational strengths with icon cards).
- [ ] Build `apps/web/src/features/marketing/components/MerchantProblemsSolutionsSection.tsx` (6 interactive pain-point to solution cards).

### Task 5: Services Grid & How It Works Interactive Timeline
- [ ] Build `apps/web/src/features/marketing/components/ServicesGridSection.tsx` (8 fulfillment services with rich cards and hover animations).
- [ ] Build `apps/web/src/features/marketing/components/HowItWorksTimeline.tsx` (5-step fulfillment journey with horizontal desktop timeline and vertical mobile timeline).

### Task 6: Warehouse Showcase, Tech Dashboard Preview & COD Breakdown
- [ ] Build `apps/web/src/features/marketing/components/WarehouseShowcaseSection.tsx` (infrastructure gallery: storage aisles, packing stations, dispatch bays).
- [ ] Build `apps/web/src/features/marketing/components/TechPreviewSection.tsx` (interactive merchant dashboard preview with live demo tags).
- [ ] Build `apps/web/src/features/marketing/components/CodSettlementBreakdown.tsx` (6-stage cashflow and remittance diagram).

### Task 7: Why Choose Us, Pricing Calculator, Who We Serve, FAQ & Final CTA
- [ ] Build `apps/web/src/features/marketing/components/WhyChooseUsSection.tsx` (asymmetric 8-benefit grid).
- [ ] Build `apps/web/src/features/marketing/components/PricingSection.tsx` (service fee categories + interactive instant quote estimate calculator).
- [ ] Build `apps/web/src/features/marketing/components/WhoWeServeSection.tsx` (e-commerce merchant segments).
- [ ] Build `apps/web/src/features/marketing/components/TestimonialsSection.tsx` (curated merchant feedback & brand assurances).
- [ ] Build `apps/web/src/features/marketing/components/FaqAccordionSection.tsx` (accessible interactive accordion for 9 key questions).
- [ ] Build `apps/web/src/features/marketing/components/FinalCtaSection.tsx` and `MarketingFooter.tsx` (closing conversions, BD contact channels, links).

### Task 8: Assemble Page, Export & Verification
- [ ] Update `apps/web/src/features/marketing/index.ts` to export all sections and modals.
- [ ] Wire all components into `apps/web/src/app/page.tsx`.
- [ ] Verify TypeScript compilation with `pnpm --filter=@fulfillio/web exec tsc --noEmit`.
- [ ] Test mobile responsiveness, modal triggers, and interactive variant switcher.
