---
name: fullstack-saas-builder
description: End-to-end framework for building modular SaaS & WMS applications in Next.js + NestJS without breaking styles, colliding agents, or stalling in planning. Contains strict anti-breakage rules for Tailwind CSS, Next.js cache management, micro-module decomposition, and multi-agent execution.
---

# Fullstack SaaS Builder: Zero-Error Rapid Delivery Protocol

> **Purpose:** Use this skill for designing and building fullstack Next.js + NestJS SaaS, Warehouse Management Systems (WMS), and multi-tenant platforms. It incorporates hard-earned lessons to guarantee rapid feature delivery without frontend styling breakage, cache corruption, or multi-agent conflict.

---

## 🧠 0. Autonomous Model & Multi-Skill Orchestration Engine

When `fullstack-saas-builder` is active, it **automatically routes each sub-task to the best model and pairs it with the exact specialized skill** from the matrix below:

| Project Phase | Primary Task | Mandatory Model | Complementary Skills to Activate | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **১. PRD & Architecture** | System Design, PRD, State Machine, Wireframing | 📐 **High-Reasoning** (Claude 3.5 Sonnet / Gemini Pro / Argon) | • `bmad-prd`<br>• `bmad-architecture`<br>• `writing-plans` | **Essential** |
| **২. Database & Schema** | PostgreSQL Schema, Migrations, Tenant Indexing, RLS | ⚡ **Mid / High** (Gemini Pro / Flash) | • `supabase-postgres-best-practices`<br>• `test-driven-development` | **Essential** |
| **৩. Premium UI & Dashboard** | Dark SaaS Layout, Card Grids, Modals, Responsive UI | ⚡ **Fast & Token-Saving** (Gemini Flash / Medium) | • `frontend-design`<br>• `react-best-practices`<br>• `web-design-guidelines` | **Essential** |
| **৪. Code Implementation** | Next.js Components, NestJS Controllers, Services | ⚡ **Fast & Token-Saving** (Gemini Flash / Medium) | • `executing-plans`<br>• `react-best-practices` | **Essential** |
| **৫. Bug Fixing & Diagnostics** | Style Breaking, CSS 404, Runtime Exceptions | ⚡ **Systematic Reasoning** (Gemini Flash / Pro) | • `systematic-debugging`<br>• `superpowers-systematic-debugging` | **Essential** |
| **৬. E2E Testing & Automation** | User Journey Simulation, Barcode & Form Flow | ⚡ **Fast** (Gemini Flash) | • `Playwright` E2E scripts<br>• `test-driven-development` | **Essential Tool** |
| **৭. CI/CD & Production Build** | Turbo Pipeline, Docker, Build Verification | ⚡ **Fast** (Gemini Flash) | • `GitHub Actions` Workflows<br>• Turborepo Pipeline | **Essential Tool** |

---

## 🎯 1. Micro-Module Planning Protocol (Bite-Sized Delivery)

Never attempt to build a full project or large feature in a single massive prompt. Always follow this 3-step loop:

1. **Deconstruct into Numbered Micro-Modules:**
   - Create a central checklist file: `STEP_BY_STEP_EXECUTION_CHECKLIST.md`.
   - Each module must have two clear sections:
     - **✅ What's Included (Scope):** 3-5 specific, testable functionalities.
     - **❌ What to Avoid (Anti-Scope):** Explicitly list features to skip for MVP (e.g. no OTP, no complex KYC, no multiple pickup hubs).
2. **Pre-Approved Grill-Me Decisions:**
   - When interviewing or planning architectural branches, automatically select and apply the **(Recommended)** best-practice options.
   - Do not halt execution for trivial styling or naming questions. Keep momentum.
3. **Check-off & Verify Loop:**
   - Build Module $\rightarrow$ Run Build $\rightarrow$ Verify HTTP 200 $\rightarrow$ Mark `[x]` in checklist $\rightarrow$ Proceed to next module.

---

## 🛡️ 2. Frontend Styling & Tailwind Anti-Breakage Rules

> [!CAUTION]
> **The #1 Cause of Broken Frontend (Unstyled Times New Roman & Plain HTML Buttons):**
> Running `next dev` and `next build` concurrently or switching modes without clearing `.next` cache corrupts chunk manifests, causing `/_next/static/css/...` to return `404 Not Found`.

Follow these mandatory rules on every Next.js 14/15 project:

### Rule A: Never Run Dev & Build Concurrently
- Before running `next build` or `pnpm build`, always stop/kill any background `next dev` processes.
- Never run `next dev` while a build is writing to `.next`.

### Rule B: Clean Cache on Mode Switch
When switching between dev mode and production mode, or if styles look broken:
```powershell
Remove-Item -Recurse -Force apps\web\.next -ErrorAction SilentlyContinue
pnpm --filter=@fulfillio/web build
```

### Rule C: Mandatory Dark Mode Configuration
In Next.js App Router projects with dark themes:
1. In `apps/web/src/app/layout.tsx`:
   ```tsx
   <html lang="en" className="dark">
     <body className="antialiased min-h-screen bg-slate-950 text-slate-100 font-sans">
       {children}
     </body>
   </html>
   ```
2. In `tailwind.config.js`:
   ```javascript
   module.exports = {
     darkMode: 'class',
     content: [
       './src/app/**/*.{js,ts,jsx,tsx,mdx}',
       './src/components/**/*.{js,ts,jsx,tsx,mdx}',
       './src/**/*.{js,ts,jsx,tsx,mdx}',
     ],
     // ...
   };
   ```

### Rule D: Post-Build Automated CSS Verification
Before reporting that the UI is ready, always verify that the browser actually receives compiled CSS:
```javascript
// Quick verification script:
const res = await fetch('http://localhost:3000/merchant');
const html = await res.text();
const match = html.match(/href="([^"]+\.css[^"]*)"/);
if (match) {
  const css = await fetch('http://localhost:3000' + match[1]);
  console.log('CSS Status:', css.status, 'Size:', (await css.text()).length);
  // Status MUST be 200 and Size MUST be > 10,000 bytes
}
```

---

## 👥 3. Multi-Agent Collision Prevention Protocol

When delegating tasks to multiple agents or subagents:

1. **Strict File Isolation (One Agent, One Domain):**
   - **Agent 1 (Admin):** Modifies ONLY `apps/web/src/app/admin/`.
   - **Agent 2 (Merchant):** Modifies ONLY `apps/web/src/app/merchant/`.
   - **Agent 3 (Worker/Mobile):** Modifies ONLY `apps/web/src/app/wms/worker/`.
   - **Agent 4 (API Backend):** Modifies ONLY `apps/api/src/modules/<module>/`.
2. **Shared Package Sync:**
   - Any changes to `packages/contracts/` must be built first (`pnpm --filter=@fulfillio/contracts build`) before consuming agents touch it.
3. **No Concurrent Git/File Overwrites:**
   - Never let two agents touch root layout (`layout.tsx`) or global styles (`globals.css`) at the same time.

---

## 🏭 4. Core SaaS & WMS Architecture Patterns

When building warehouse management, inventory, or fulfillment SaaS:

### A. 2-Part SKU Standard
Always lock the tenant/merchant identifier at the front of every SKU:
$$\text{Full SKU} = \text{[TenantCode]}-\text{[BaseSKU]}-\text{[Color]}-\text{[Size]}$$
- Example: `MC-101-HOODIE-BLK-XL`
- Auto-generate a 13-digit EAN/Code128 barcode for every variant.

### B. Atomic Stock Reservation Pattern
During order creation:
- Deduct from available `stock`: `stock = stock - qty`.
- Increment `reserved`: `reserved = reserved + qty`.
- If order is cancelled before dispatch: refund `stock = stock + qty` and decrement `reserved = reserved - qty`.

### C. Thermal Printer Engine (4x6 & 2x1 Labels)
- **4x6 Thermal Packing Slips:** Format for standard shipping label printers (288 DPI, 4x6 inch aspect ratio, high contrast black-and-white or single accent color).
- **2x1 Barcode Stickers:** Compact thermal sticker format with store name, SKU, price, bin location, and scannable visual barcode bars.

### D. Dedicated Lightweight Worker App (`/wms/worker`)
- Keep warehouse operator apps extremely lightweight (PWA style).
- Large touch targets, minimal inputs.
- 3 Clear Steps: **1. Pick List** (Shelf Bin navigation) $\rightarrow$ **2. Pack & Print** (Multi-select 4x6 thermal slip print) $\rightarrow$ **3. Courier Handover** (Handover to Steadfast/Pathao driver).

---

## 🚀 5. Checklist for Starting Any New Project

Before writing code on a fresh project or major feature:
- [ ] Initialize `STEP_BY_STEP_EXECUTION_CHECKLIST.md` with numbered micro-modules.
- [ ] Confirm Tailwind config has `darkMode: 'class'` and `content` covers all source paths.
- [ ] Confirm `layout.tsx` sets `<html lang="en" className="dark">`.
- [ ] Run backend on dedicated port (`4000`) and frontend on (`3000`).
- [ ] Verify both HTTP status and CSS payload status using automated script.
