# Implementation Plan: My Store Profile Modularization & Full-Stack Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor and implement the "My Store Profile" module with full-stack capabilities: Prisma schema updates for KYC/Store Identity, NestJS file upload & profile endpoints, 3 shared UI primitives (`VerificationStatusBadge`, `DocumentUploadDropzone`, `DocumentViewerModal`), and a clean feature-sliced directory structure (`profile/`) where no component exceeds 200 lines.

**Architecture:** Hybrid PostgreSQL JSONB + top-level fields for Store Identity, Payout Account, and KYC. NestJS Multer upload endpoint for cheques and trade licenses. Next.js 15 feature-sliced profile folder with 4 dedicated cards (`StoreIdentityCard`, `PayoutAccountCard`, `KycVerificationCard`, `SocialChannelsCard`) orchestrated by a lean `< 150` line `MerchantProfileTab.tsx`.

**Tech Stack:** Next.js 15, Tailwind CSS, Lucide React, NestJS 11, Prisma ORM, PostgreSQL.

---

## Tasks

### Task 1: Shared Reusable UI Primitives
- [ ] Create `apps/web/src/components/ui/VerificationStatusBadge.tsx` supporting `VERIFIED`, `PENDING_REVIEW`, `REJECTED`, and `UNVERIFIED`.
- [ ] Create `apps/web/src/components/ui/DocumentUploadDropzone.tsx` with drag-and-drop, preview, and file upload progress.
- [ ] Create `apps/web/src/components/ui/DocumentViewerModal.tsx` for viewing cheque leaves and trade license docs.
- [ ] Export them in `apps/web/src/components/ui/index.ts`.

### Task 2: Backend & Database Schema
- [ ] Update `Merchant` model in `apps/api/prisma/schema.prisma` with `ownerName`, `logoUrl`, and `kycData` JSONB field.
- [ ] Update `apps/api/src/modules/merchants/merchant.service.ts` to support KYC submission, profile update, and verification lock.
- [ ] Add `POST /merchants/profile/upload` in `apps/api/src/modules/merchants/merchant.controller.ts` with Multer disk storage.

### Task 3: Profile Types & Modals
- [ ] Create `apps/web/src/features/merchant-portal/profile/types.ts` with typed interfaces for Store Profile, Payout, KYC, and Social channels.
- [ ] Create `apps/web/src/features/merchant-portal/profile/modals/EditProfileModal.tsx`.
- [ ] Create `apps/web/src/features/merchant-portal/profile/modals/ManagePayoutModal.tsx` utilizing `DocumentUploadDropzone`.
- [ ] Create `apps/web/src/features/merchant-portal/profile/modals/KycUploadModal.tsx` for Trade License & NID upload.
- [ ] Create `apps/web/src/features/merchant-portal/profile/modals/SocialChannelModal.tsx`.

### Task 4: Decomposed Profile Feature Cards
- [ ] Create `apps/web/src/features/merchant-portal/profile/components/StoreIdentityCard.tsx` (< 150 lines).
- [ ] Create `apps/web/src/features/merchant-portal/profile/components/PayoutAccountCard.tsx` (< 180 lines).
- [ ] Create `apps/web/src/features/merchant-portal/profile/components/KycVerificationCard.tsx` (< 150 lines).
- [ ] Create `apps/web/src/features/merchant-portal/profile/components/SocialChannelsCard.tsx` (< 140 lines).

### Task 5: Profile Orchestrator & Integration
- [ ] Create `apps/web/src/features/merchant-portal/profile/MerchantProfileTab.tsx` (< 150 lines) rendering the 4 cards and orchestrating state.
- [ ] Export the feature in `apps/web/src/features/merchant-portal/profile/index.ts`.
- [ ] Update `MerchantPortalManager.tsx` and `api.ts` to use the new profile module and upload handler.
- [ ] Clean up redundant monolithic profile files.

### Task 6: Verification & Typecheck
- [ ] Run `pnpm --filter=@fulfillio/web exec tsc --noEmit` to ensure 0 TypeScript errors.
- [ ] Verify responsive rendering across mobile and desktop.
