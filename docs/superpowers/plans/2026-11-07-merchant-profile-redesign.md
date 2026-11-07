# Merchant Profile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Merchant Portal Profile page to restore and enhance its previous aesthetic beauty, rich financial card styling, and seller hero identity, while ensuring complete mobile and tablet responsiveness and modular SRP structure.

**Architecture:** Decompose the profile page into a responsive 2-column layout (7-col left, 5-col right on desktop, collapsing to 1-col on mobile) with a prominent Seller Identity Hero banner at the top. Feature-sliced modular components under `features/merchant/portal/profile/components/` with strict SRP (<300 lines each).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide icons.

---

## Task Structure

### Task 1: Create `StoreIdentityHero.tsx` with Hero Banner & Warehouse Tag
**Files:**
- Create/Modify: `apps/web/src/features/merchant/portal/profile/components/StoreIdentityHero.tsx`
- Produces: `StoreIdentityHero` component with responsive hero banner, avatar gradient, verification badge, quick contact pills, Dhaka Central Warehouse intake tag, and Edit Profile button.

- [ ] **Step 1: Implement `StoreIdentityHero`**
- [ ] **Step 2: Verify responsive styling on small and large screens**

### Task 2: Redesign `PayoutAccountCard.tsx` with Fintech Banking Card Aesthetics
**Files:**
- Modify: `apps/web/src/features/merchant/portal/profile/components/PayoutAccountCard.tsx`
- Produces: Enhanced fintech bank card container with dark gradient, emerald accents, copyable account number, routing/branch details, disbursement schedule, and cheque leaf preview.

- [ ] **Step 1: Implement fintech banking card styling and one-click copy**
- [ ] **Step 2: Verify Cheque Leaf viewer integration**

### Task 3: Enhance `KycVerificationCard.tsx` with Document Previews & Compliance Badges
**Files:**
- Modify: `apps/web/src/features/merchant/portal/profile/components/KycVerificationCard.tsx`
- Produces: Clean compliance card with Trade License & NID badges, DocumentViewerModal triggers, and animated active audit indicator.

- [ ] **Step 1: Refactor `KycVerificationCard` with responsive document inspection buttons**

### Task 4: Create `AccountOverviewCard.tsx` and `FulfillmentHubCard.tsx`
**Files:**
- Create: `apps/web/src/features/merchant/portal/profile/components/AccountOverviewCard.tsx`
- Create: `apps/web/src/features/merchant/portal/profile/components/FulfillmentHubCard.tsx`
- Produces: 
  - `AccountOverviewCard`: Key metrics (Merchant code, verification status, payout schedule, active channels, warehouse zone).
  - `FulfillmentHubCard`: Physical hub intake summary, courier auto-dispatch readiness (Pathao, Steadfast, RedX), and active memo template link.

- [ ] **Step 1: Implement `AccountOverviewCard`**
- [ ] **Step 2: Implement `FulfillmentHubCard`**

### Task 5: Upgrade `SocialChannelsCard.tsx` with Platform Badges & Responsive Actions
**Files:**
- Modify: `apps/web/src/features/merchant/portal/profile/components/SocialChannelsCard.tsx`
- Produces: Clean social channel management with branded platform tags (FB, IG, TikTok, WhatsApp, YouTube), copy/links, and quick edit/delete actions.

- [ ] **Step 1: Enhance `SocialChannelsCard`**

### Task 6: Orchestrate in `MerchantProfileTab.tsx` and Verify Next.js Build
**Files:**
- Modify: `apps/web/src/features/merchant/portal/profile/MerchantProfileTab.tsx`
- Modify: `apps/web/src/features/merchant/portal/profile/index.ts`

- [ ] **Step 1: Connect all components into the responsive 2-column layout**
- [ ] **Step 2: Run `pnpm --filter=@fulfillio/web build` to verify clean compilation**
- [ ] **Step 3: Test mobile responsiveness and interactive modals**
