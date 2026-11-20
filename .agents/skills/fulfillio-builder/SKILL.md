---
name: fulfillio-builder
description: >-
  Fast, token-efficient code implementation, UI component building, and API development for Fulfillio 3PL WMS.
  USE THIS SKILL whenever implementing code, writing React/Next.js components, NestJS services/controllers, or fixing bugs.
  MANDATORY MODEL: Use fast, efficient models (Gemini Flash, Flash-Lite, or standard paired coding models) to save tokens and quota.
---

# Fulfillio Builder — Fast Code Implementation Skill

This skill is dedicated exclusively to **Writing Code, Building UI Screens, Implementing APIs, and Bugfixing** for the Fulfillio platform.

---

## 🎯 Task, Model & Complementary Skills Pairing Matrix

প্রতিটি কোডিং কাজের জন্য কোন মডেলের সাথে কোন কোন স্কিল একসাথে ব্যবহার করলে সবচেয়ে দ্রুত ও টোকেন-সেভার কোড পাওয়া যাবে:

| কোন কাজের জন্য (Task) | কোন মডেল ব্যবহার করবে (Model) | সাথে কোন কোন স্কিল কম্বাইন করবে (Paired Skills) | কেন এই কম্বিনেশন বেস্ট? |
| :--- | :--- | :--- | :--- |
| **১. React/Next.js UI ও স্ক্রিন কোডিং** | **Gemini Flash / Medium / Flash-Lite** | `fulfillio-builder` + `frontend-design` + `react-best-practices` | সুপার ফাস্ট কোড তৈরি হবে, অপ্রয়োজনীয় রি-রেন্ডার কমবে এবং Fulfillio ডিজাইন সিস্টেম অক্ষুণ্ণ থাকবে। |
| **২. NestJS API ও মডিউল ক্রাড (CRUD)** | **Gemini Flash / Medium** | `fulfillio-builder` + `superpowers-executing-plans` | কন্ট্রোলার-সার্ভিস-রিপোজিটরি প্যাটার্নে সুনির্দিষ্ট গাইডলাইন মেনে দ্রুত কোড হবে। |
| **৩. বাগফিক্সিং ও টাইপ এরর সমাধান** | **Gemini Flash / Medium** | `fulfillio-builder` + `superpowers-systematic-debugging` | ট্রেইস এরর দেখে সরাসরি সঠিক লাইন ফিক্স করবে, অনুমানের ওপর টোকেন নষ্ট করবে না। |
| **৪. ডেটাবেস মাইগ্রেশন ও প্রিজমা ক্লায়েন্ট** | **Gemini Flash-Lite / Flash** | `fulfillio-builder` + `supabase-postgres-best-practices` | ইনডেক্স ও স্ক্রিপ্ট ঠিক রেখে একদম কম টোকেনে কমান্ড চালিয়ে ক্লায়েন্ট তৈরি করবে। |

---

## ⚡ Model Selection Rule (CRITICAL)

> **MANDATORY MODEL DIRECTIVE:**  
> When activating this skill for writing code, building React components, NestJS modules, or running tests:  
> **MUST USE FAST, EFFICIENT MODELS (e.g. Gemini Flash, Flash-Lite, or paired coding models).**  
> *Reason:* Architecture and planning have already been finalized. Execution should be rapid, highly token-efficient, and prevent burning weekly quotas on routine coding tasks.

---

## 🛠️ Implementation Rules & Guardrails

1. **Direct Navigation (No Token Waste):**
   - Jump straight to target files using the directory map:
     - Auth: `apps/api/src/modules/auth/`
     - Merchants: `apps/api/src/modules/merchants/`
     - Orders: `apps/api/src/modules/orders/`
     - Packing: `apps/api/src/modules/packing/`
     - Memo Engine: `apps/api/src/modules/memo-engine/`
     - Web UI: `apps/web/src/app/`
2. **Backend Architecture Pattern:**
   - Always adhere to `Controller → Service → Repository`.
   - Never write Prisma database queries directly inside controllers or services.
3. **Frontend Reusable Primitives:**
   - Always import primitives from `@/components` (`Button`, `Badge`, `Card`, `Input`, `StatCard`).
4. **Reseller Memo & 4x6 Thermal Focus:**
   - Keep memo styles optimized for `@page { size: 4in 6in; margin: 0; }`.
   - Never render barcodes or QR codes inside invoices for MVP.

---

## 🎨 5. Mandatory Fulfillio Frontend Design Rules (Strict Compliance)

Whenever designing or implementing any frontend UI in Fulfillio (Admin, Merchant, or Landing):

1. **Theme & Palette:**
   - **Light Mode:** Pure White (`bg-white`), Soft Slate (`bg-slate-50`), Clean Slate borders (`border-slate-200/80`).
   - **Dark Mode:** Deep Navy (`dark:bg-navy-950`, `dark:bg-navy-900`), Soft white borders (`dark:border-white/10`).
   - **Brand Accent:** Fulfillio Vibrant Orange (`#F26B1D` / `bg-orange-600`, `text-orange-600`, `dark:text-orange-400`).
   - **Status Badges:** Emerald (`#10b981`) for Published/In Stock; Amber (`#f59e0b`) for Pending Approval/Low Stock; Rose (`#f43f5e`) for Out of Stock/Delete; Neutral Slate for Drafts.

2. **Data Tables:**
   - **Status Column:** MUST be an informative non-clickable text badge (`<span>`). NEVER a button.
   - **Actions Column:** MUST contain ONLY the 3-dots trigger button (`MoreVertical`). NEVER place outside buttons in the table cell.
   - **Floating Dropdown:** MUST be portaled via `createPortal(..., document.body)` with clamped viewport coordinates. Auto upward flip when near bottom. Never causes horizontal or vertical scrollbars. Clamped so it NEVER disappears even when there is only 1 row!

3. **Charts & Graphs:**
   - Financial Settlements MUST be authentic solid SVG Pie Charts (triangular wedges meeting at center `(cx, cy)`), NOT hollow donuts.
   - Order/Revenue Analytics use vertical column/bar charts with timeframe dropdowns (`Today`, `7d`, `30d`, `3m`, `6m`, `1y`).

4. **Bulk Actions:**
   - WordPress/Admin-style toolbar: `Bulk Actions` select (`Publish`, `Draft`, `Delete`) + `Apply` button + `X selected` counter.

5. **Pagination:**
   - Bottom bar with "Showing X to Y of Z products", Rows per page (10, 25, 50, 100), Previous/Next, and numbered page buttons.

6. **Full Parity:**
   - Grid View and Desktop Table View must maintain 100% feature parity.
