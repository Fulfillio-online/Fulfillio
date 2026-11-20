# Merchant Approval Stability & Product Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure merchant profile details are 100% preserved upon admin approval without reverting to demo/stub data, and ensure products uploaded by any merchant instantly show up across both Admin Products catalog (/admin/products) and the Merchant Profile products tab (/admin/merchants/[id]).

**Architecture:** 
1. Fix backend merchant persistence (`tx.merchant.create`) to store `ownerName` and allow updating status by UUID or `merchantCode`.
2. Fix frontend profile hydration in `api.ts` and `useMerchantDirectory.ts` to use scoped merchant storage keys and resilient identity matching (`id` or `merchantCode`).
3. Connect Admin Panel (`ProductsManager.tsx` and `useMerchantDirectory.ts`) to query `/api/inventory/products` from PostgreSQL alongside localStorage so any uploaded product is immediately visible under "All", "Pending Approval", and the merchant's profile tab.

**Tech Stack:** Next.js 15, React 19, NestJS 11, Prisma, PostgreSQL 16, TypeScript.

---

## Global Constraints
- Preserve tenant isolation (`merchantCode` / `merchantId`) across all queries.
- Do not lose local offline storage fallback for environments without PostgreSQL.
- Comply with Fulfillio brand UI and zero TypeScript compile errors (`tsc --noEmit`).

---

### Task 1: Backend Merchant Persistence & Flexible Status Update

**Files:**
- Modify: `apps/api/src/modules/auth/auth.repository.ts:65-85`
- Modify: `apps/api/src/modules/merchants/merchant.repository.ts:170-195`

- [ ] **Step 1: Ensure `ownerName` is saved directly to `Merchant` entity upon registration**
In `apps/api/src/modules/auth/auth.repository.ts`, ensure `tx.merchant.create` sets `ownerName: data.ownerName || data.businessName`.

- [ ] **Step 2: Update `merchant.repository.ts` `update` method to resolve merchant by ID or `merchantCode`**
In `apps/api/src/modules/merchants/merchant.repository.ts`, allow updating by either DB UUID, `merchantCode` (e.g. `MC-106`), or local ID (`m-106`).

- [ ] **Step 3: Verify TypeScript compilation in API**
Run `pnpm --filter=@fulfillio/api exec tsc --noEmit`.

---

### Task 2: Frontend Merchant Profile Isolation & Approval Stability

**Files:**
- Modify: `apps/web/src/features/merchant/portal/api.ts:55-75`
- Modify: `apps/web/src/features/merchant/portal/MerchantPortalManager.tsx:130-145`
- Modify: `apps/web/src/features/admin/merchants/useMerchantDirectory.ts:55-105, 160-185`
- Modify: `apps/web/src/features/admin/merchants/MerchantProfilePage.tsx:30-40`

- [ ] **Step 1: Fix `merchantApi.getProfile()` in `api.ts` to read per-merchant scoped profile key**
Replace un-scoped `STORAGE_KEY_MERCHANT_PROFILE` fallback with `getMerchantProfileKey(code)` so active merchant profile is never overwritten by MC-101 demo preset.

- [ ] **Step 2: Prevent `useMerchantDirectory.ts` `reload()` from overwriting merchant identity info**
When merging DB merchants (`dbList`) with local state in `useMerchantDirectory.ts`, preserve non-empty local fields (`ownerName`, `phone`, `location`, `payoutAccount`).

- [ ] **Step 3: Enable `MerchantProfilePage.tsx` to match merchant by `id` OR `merchantCode`**
Update `merchants.find((m) => m.id === merchantId || m.merchantCode === merchantId || m.merchantCode.toLowerCase() === merchantId.toLowerCase())`.

- [ ] **Step 4: Verify Admin Approval call in `handleUpdateMerchant`**
Pass `updatedMerchant.merchantCode || updatedMerchant.id` to backend PATCH `/merchants/:id/status`.

---

### Task 3: Product Upload & Two-Way Admin Catalog Sync

**Files:**
- Modify: `apps/web/src/lib/warehouseSync.ts:950-990, 1340-1380`
- Modify: `apps/web/src/features/admin/products/ProductsManager.tsx:300-345`
- Modify: `apps/web/src/features/admin/merchants/useMerchantDirectory.ts:100-115`

- [ ] **Step 1: Fix `convertMerchantProductToWarehouse` in `warehouseSync.ts`**
Check `item.merchantCode || profile.merchantCode` and `item.storeName || profile.storeName` instead of hardcoding `profile.merchantCode || 'MC-101'`.

- [ ] **Step 2: Connect `ProductsManager.tsx` to fetch `/api/inventory/products`**
In `ProductsManager.tsx`, add safe API fetch to `/api/inventory/products` on mount and merge with `products` state and `STORAGE_KEY_PRODUCTS` so all uploaded products appear under "ALL" and "Pending Approval" tabs.

- [ ] **Step 3: Connect `useMerchantDirectory.ts` to include PostgreSQL products in `productsList`**
Fetch `/api/inventory/products` and map to `MerchantProductItem` so `/admin/merchants/[id]` -> Products tab displays all submitted products for that merchant.

- [ ] **Step 4: Verify build and types across web and API**
Run `pnpm --filter=@fulfillio/web exec tsc --noEmit` and `pnpm --filter=@fulfillio/api exec tsc --noEmit`.
