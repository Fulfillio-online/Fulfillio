# Payment Requests & Billing Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new "Payment Requests" section in the Admin Panel (`/admin/payouts`) where merchant payout requests are received, tracked, bulk accepted/rejected, and paid with a Transaction ID (TrxID) modal, automatically syncing settled payouts into Billing & COD Settlement with actions removed and all statuses marked as Paid.

**Architecture:**
- Route: `/admin/payouts` accessible via the Admin Sidebar under "Financials & Settings".
- Modular feature directory: `apps/web/src/features/admin/payouts/` with typed interfaces, mock data, and focused UI components following SRP.
- Dual-table synchronization: Upon paying an accepted request with TrxID, a `SettlementTransaction` is created and committed to `STORAGE_KEY_BILLING_TRANSACTIONS` and dispatched across tabs via `fulfillio-warehouse-sync`.
- Billing refactor: Remove the action column from `AdminBillingManager` and guarantee all records display as `PAID`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide icons.

---

### Tasks

- [ ] **Task 1: Payment Requests Types & Initial Mock Data**
  - Define `PaymentRequest`, `PaymentRequestMethod`, `PaymentRequestStatus` in `apps/web/src/features/admin/payouts/types.ts`.
  - Create realistic initial mock data and localStorage storage key `STORAGE_KEY_PAYMENT_REQUESTS` in `apps/web/src/features/admin/payouts/mockData.ts`.
  - Update `apps/web/src/features/admin/billing/mockData.ts` to export `STORAGE_KEY_BILLING_TRANSACTIONS` and ensure initial mock records have status `PAID`.

- [ ] **Task 2: Payment Requests Filter Bar & Multi-Select Header**
  - Implement `PaymentRequestsFiltersBar.tsx` with:
    - TrxID / Merchant search input
    - Status `<select>` filter (All, Pending, Accepted, Paid, Rejected)
    - Payment Method `<select>` filter (All, bKash, Nagad, Bank Transfer)
    - Bulk action bar when checkboxes are selected: "Bulk Accept (X)" and "Bulk Reject (X)".

- [ ] **Task 3: Payment Requests Table & Action Buttons**
  - Implement `PaymentRequestsTable.tsx` with:
    - Multi-select checkbox column
    - Merchant Name & Code
    - Requested Amount (with ৳ formatting)
    - Payment Method & Account info badge (bKash/Nagad/Bank Transfer)
    - Request Date
    - Status Badge (`PENDING`, `ACCEPTED`, `PAID`, `REJECTED`)
    - Dynamic Actions:
      - `PENDING`: Accept and Reject buttons
      - `ACCEPTED`: "Pay / Mark Paid" button
      - `PAID`: Displays TrxID with settled checkmark
      - `REJECTED`: Displays rejection indicator

- [ ] **Task 4: Payout Transaction ID (TrxID) Modal**
  - Implement `PayTransactionModal.tsx`:
    - Clean, focused modal
    - Title showing merchant and amount to pay
    - Transaction ID (TrxID) input field with validation
    - "Confirm Payout & Settle" button

- [ ] **Task 5: Payment Requests Orchestrator & Pagination**
  - Implement `PaymentRequestsPagination.tsx` with limit selector (10, 25, 50, 100) and page counter.
  - Implement `PaymentRequestsManager.tsx`:
    - Hydration and persistence to `STORAGE_KEY_PAYMENT_REQUESTS`
    - Single and bulk Accept / Reject handlers
    - Pay modal submission handler: marks request as `PAID` with `trxId`, creates a new `SettlementTransaction`, appends to `STORAGE_KEY_BILLING_TRANSACTIONS`, and dispatches `fulfillio-warehouse-sync`.
  - Export via `index.ts`.

- [ ] **Task 6: Create Admin Route & Update Admin Sidebar**
  - Create `apps/web/src/app/admin/payouts/page.tsx`.
  - In `AdminSidebar.tsx`, add "Payment Requests" under "Financials & Settings" linking to `/admin/payouts`.

- [ ] **Task 7: Update Billing & COD Settlement (`AdminBillingManager.tsx`)**
  - Remove the "Action" column and buttons from the desktop table and mobile card view.
  - Ensure all transactions display as `PAID`.
  - Hydrate transactions from `STORAGE_KEY_BILLING_TRANSACTIONS` on mount and sync via `fulfillio-warehouse-sync`.

- [ ] **Task 8: Verification & TypeScript Compile Check**
  - Run `pnpm --filter=@fulfillio/web exec tsc --noEmit`.
  - Verify complete workflow and state transitions.
