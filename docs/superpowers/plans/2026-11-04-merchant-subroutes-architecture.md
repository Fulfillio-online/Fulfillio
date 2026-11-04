# Implementation Plan: Merchant Portal Next.js App Router Sub-routes Architecture

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the single-page `/merchant` tab setup into a first-class Next.js 15 App Router sub-routes architecture (`/merchant/*`) with a persistent `layout.tsx`, shared `MerchantContext`, clean semantic URLs, and backward compatibility redirect for legacy query parameters.

**Architecture:** Next.js 15 App Router sub-directory pattern mirroring `/admin/*`. `apps/web/src/app/merchant/layout.tsx` wraps all child routes in `<MerchantProvider>`, preserving sidebar and header navigation state. The 8 sub-pages reside in dedicated route directories.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS.

---

## Route Breakdown

1. `apps/web/src/app/merchant/page.tsx` $\rightarrow$ `/merchant` (Dashboard Overview + Legacy query redirect)
2. `apps/web/src/app/merchant/products/page.tsx` $\rightarrow$ `/merchant/products` (Product Master & 2-Part SKU)
3. `apps/web/src/app/merchant/orders/page.tsx` $\rightarrow$ `/merchant/orders` (Orders & Reseller Attribution)
4. `apps/web/src/app/merchant/memos/page.tsx` $\rightarrow$ `/merchant/memos` (Custom Memo / Invoice Slip)
5. `apps/web/src/app/merchant/inbound/page.tsx` $\rightarrow$ `/merchant/inbound` (Inbound ASNs & Warehouse)
6. `apps/web/src/app/merchant/billing/page.tsx` $\rightarrow$ `/merchant/billing` (Payout & Billing)
7. `apps/web/src/app/merchant/api-keys/page.tsx` $\rightarrow$ `/merchant/api-keys` (API Keys & Webhooks)
8. `apps/web/src/app/merchant/profile/page.tsx` $\rightarrow$ `/merchant/profile` (My Store Profile)

---

## Tasks

### Task 1: Create MerchantContext Provider
- [ ] Create `apps/web/src/features/merchant-portal/MerchantContext.tsx` holding shared merchant state (profile, products, orders, memos, asns, toast, mutators).
- [ ] Export `MerchantProvider` and `useMerchant()` hook.

### Task 2: Build Persistent Merchant Layout
- [ ] Create `apps/web/src/app/merchant/layout.tsx` wrapping all sub-routes with `MerchantProvider`.
- [ ] Render persistent `MerchantSidebar`, `MerchantHeader`, and toast notification banner.

### Task 3: Update Sidebar & Header for App Router Sub-routes
- [ ] Update `MerchantSidebar.tsx` navigation items to use Next.js `<Link href="...">` with sub-route paths.
- [ ] Update active link styling using `usePathname()`.
- [ ] Update `MerchantHeader.tsx` to detect the current page title via `usePathname()`.

### Task 4: Create the 8 Sub-Route Pages
- [ ] Implement `apps/web/src/app/merchant/page.tsx` (Dashboard Overview + Query redirect).
- [ ] Implement `apps/web/src/app/merchant/products/page.tsx`.
- [ ] Implement `apps/web/src/app/merchant/orders/page.tsx`.
- [ ] Implement `apps/web/src/app/merchant/memos/page.tsx`.
- [ ] Implement `apps/web/src/app/merchant/inbound/page.tsx`.
- [ ] Implement `apps/web/src/app/merchant/billing/page.tsx`.
- [ ] Implement `apps/web/src/app/merchant/api-keys/page.tsx`.
- [ ] Implement `apps/web/src/app/merchant/profile/page.tsx`.

### Task 5: Verification & Typecheck
- [ ] Run `pnpm --filter=@fulfillio/web exec tsc --noEmit` to verify 0 errors.
- [ ] Verify seamless navigation across all 8 sub-routes.
