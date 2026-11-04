# Merchant Portal 8-Module Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate all 8 core Merchant Portal modules into a high-performance, single-page modular tabbed architecture on `/merchant`, with URL query sync, deep-linking, rich interactive features, and full-stack API readiness with demo fallback.

**Architecture:** Single-page tabbed SPA on `/merchant` powered by Next.js 15 App Router. The lean `MerchantPortalManager` orchestrates 8 decoupled feature modules in `apps/web/src/features/merchant-portal/components/tabs/`. A unified `api.ts` layer handles data fetching from NestJS backend endpoints with seamless fallback to demo merchant data (`MC-101`) when running offline or unauthenticated.

**Tech Stack:** Next.js 15 (App Router, React 19), Tailwind CSS, Lucide React, TypeScript, NestJS 11 backend, Prisma ORM.

---

## Global Constraints
- Maximum component file size: < 350 lines per file (SRP decomposition).
- Emerald + Slate brand palette (`emerald-500`, `emerald-600`, `slate-900`, `slate-800`, `slate-100`).
- Strict URL query sync: switching tabs updates `?tab=<tab_id>` without page reload.
- Full responsive design (mobile drawer sidebar + desktop sticky sidebar).
- Zero broken styles, TypeScript errors, or build failures.

---

## 8 Modular Tabs Breakdown

1. **Dashboard Overview (`overview`)**: KPI cards (Total Fulfillments, Warehouse In-Stock, Active Memos, COD Balance), quick navigation banners, recent order trends.
2. **Product Master & 2-Part SKU (`products`)**: 2-Part SKU (`[MerchantCode]-[SKU]`), variant matrix generation, barcode label printer modal, bin location mapping.
3. **Orders & Reseller Attribution (`orders`)**: Multi-status orders table, Reseller Memo attribution badges, fraud ratio badge, 2-in-1 4x6 thermal memo print link, manual order creator.
4. **Custom Memo / Invoice Slip (`memo-designer`)**: Interactive memo customizer, brand color picker, paper size toggle (4x6 thermal vs A4), default template designation, live preview.
5. **Inbound ASNs & Warehouse (`inbound`)**: Full ASN management, advance shipment creation modal (carrier, tracking, arrival date, item quantities), warehouse dock receiving and physical bin put-away tracking.
6. **Payout & Billing (`billing`)**: COD revenue aggregate, itemized 3PL pick/pack and storage fee deductions, net payout disbursements history table, linked bank account details.
7. **API Keys & Webhooks (`api-keys`)**: Production API key copy/reveal, webhook URL registration with signing secret, real-time webhook delivery log monitor.
8. **My Store Profile (`profile`)**: Business profile information, payout bank details with cheque leaf verification modal, multi-platform social store channels.

---

## Tasks

### Task 1: Update Types and Contracts
- [ ] Add `inbound` to `MerchantTab` union type in `apps/web/src/features/merchant-portal/types.ts`.
- [ ] Add TypeScript interfaces for Inbound ASNs, ASN Items, and Webhook Delivery Logs.
- [ ] Ensure backward compatibility for any existing code referencing `tracking`.

### Task 2: Create API Integration Layer with Demo Fallback
- [ ] Create `apps/web/src/features/merchant-portal/api.ts` with typed methods for all 8 modules.
- [ ] Implement JWT token retrieval from cookies/localStorage with seamless fallback to seed data.
- [ ] Provide methods: `fetchDashboard()`, `fetchProducts()`, `fetchOrders()`, `fetchMemos()`, `fetchInboundAsns()`, `createInboundAsn()`, `fetchBilling()`, `fetchProfile()`, `updateProfile()`, `saveWebhook()`.

### Task 3: Build Dedicated Inbound ASNs & Warehouse Module
- [ ] Create `apps/web/src/features/merchant-portal/components/tabs/MerchantInboundAsnTab.tsx`.
- [ ] Implement ASN metrics cards (In-Transit, Arrived at Dock, Completed).
- [ ] Implement ASN list table with expected vs received quantities, carrier tracking, and bin put-away badges.
- [ ] Create `CreateInboundAsnModal.tsx` allowing merchants to submit shipments with SKU lines.

### Task 4: Enhance API Keys & Webhooks Tab with Delivery Logs
- [ ] Update `MerchantApiKeysTab.tsx` with Webhook URL saving and recent webhook delivery event logs (`order.dispatched`, `stock.low`, `payout.settled`).
- [ ] Include webhook secret display and test webhook simulation trigger.

### Task 5: Enhance Orders & Product Master Modules
- [ ] Ensure `MerchantProductsTab.tsx` and `AddSingleProductModal.tsx` strictly generate 2-part SKUs (`MC-101-[SKU]`).
- [ ] Ensure `MerchantOrdersTab.tsx` links to 2-in-1 thermal print slip and allows manual order creation with reseller memo code selection.

### Task 6: Connect URL Query Sync in MerchantPortalManager & Sidebar
- [ ] Update `MerchantSidebar.tsx` nav items to use `inbound` for "Inbound ASNs & Warehouse".
- [ ] Update `MerchantPortalManager.tsx` to read and push URL query parameter `?tab=` using Next.js `useSearchParams` and `useRouter` (wrapped in Suspense).
- [ ] Connect all 8 modular tabs to the unified manager state.

### Task 7: Verification & Build Check
- [ ] Verify TypeScript compilation with `pnpm --filter=@fulfillio/web typecheck` or Next.js build.
- [ ] Verify smooth switching across all 8 tabs.
