---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality for Fulfillio. Use this skill whenever building web components, pages, dashboards, tables, modals, cards, charts, or styling any UI across Fulfillio Admin, Merchant, and Marketing landing pages. Guarantees 100% design consistency with Fulfillio's White & Orange theme, portaled dropdowns, informative status badges, and authentic charts.
---

# Fulfillio Master Frontend Design System & Style Guide

This skill governs all UI/UX design, component architecture, and visual aesthetics across **Fulfillio** (`fulfillio.online`), synthesized directly from the **Landing Page**, the **Admin Panel**, and the **Merchant Portal**.

Whenever the user asks to "design", "style", "build UI", or "create components" in this codebase, **ALWAYS** adhere to this design specification.

---

## 🎨 1. Core Color Palette & Visual Theme

Fulfillio uses a distinctive **Clean White & Navy substrate with Vibrant Orange primary branding**.

### A. Brand & Surface Colors
| Token / Usage | Light Mode | Dark Mode (`.dark`) | Hex Code |
| :--- | :--- | :--- | :--- |
| **Primary Brand Accent** | `bg-orange-600 hover:bg-orange-500` | `bg-orange-600 dark:hover:bg-orange-500` | `#F26B1D` |
| **Brand Text Accent** | `text-orange-600` | `dark:text-orange-400` | `#F26B1D` / `#FB923C` |
| **Subtle Brand Tint** | `bg-orange-500/10 border-orange-500/20` | `dark:bg-orange-500/10 dark:border-orange-500/20` | Soft Orange Tint |
| **Primary Page Background** | `bg-white` / `bg-slate-50/50` | `dark:bg-navy-950` / `dark:bg-navy-900` | `#FFFFFF` / `#0D1F3C` |
| **Card / Surface Container** | `bg-white` | `dark:bg-navy-900` / `dark:bg-navy-900/60` | `#FFFFFF` / `#12284C` |
| **Primary Heading Text** | `text-navy-900` / `text-slate-900` | `dark:text-white` | `#0F172A` / `#FFFFFF` |
| **Body & Subtitle Text** | `text-slate-500` / `text-slate-600` | `dark:text-slate-400` | `#64748B` / `#94A3B8` |
| **Dividers & Borders** | `border-slate-200/80` | `dark:border-white/10` | `#E2E8F0` / `rgba(255,255,255,0.1)` |

### B. Semantic Status Colors (Universal Standard)
Never guess colors for statuses. Always follow this exact mapping:
- **PUBLISHED / IN STOCK / NET PAYOUT / ACTIVE:**  
  `bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30` (Emerald Green `#10b981`)
- **PENDING APPROVAL / COURIER CHARGES / LOW STOCK:**  
  `bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30` (Amber Yellow `#f59e0b`)
- **OUT OF STOCK / 3PL FEES / REJECTED / DELETE:**  
  `bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30` (Rose Red `#f43f5e`)
- **DRAFT / ARCHIVED / INACTIVE:**  
  `bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10` (Neutral Slate)
- **THERMAL BARCODE / PRINTING / DETAILS:**  
  `bg-indigo-50 dark:bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30` (Indigo `#6366f1`)

---

## 📊 2. Data Table Architecture & Strict Interaction Rules

Tables in Fulfillio (e.g. Products, Orders, Inventory, ASNs) must follow these strict UX rules:

### Rule 1: Status Column is PURE INFORMATIVE TEXT (NEVER A BUTTON)
- **NEVER** put clickable `<button>` elements inside the Status column.
- The Status column must ALWAYS be a clean, non-clickable, centered text badge (`<span>`):
  ```tsx
  <td className="py-3.5 px-3.5 text-center">
    <span
      className={`inline-flex items-center justify-center text-[11px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border select-none ${
        isPendingApproval
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
          : !isPublished || isDraft
          ? 'bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
          : isOutOfStock
          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      }`}
    >
      {isPendingApproval ? 'Pending Approval' : isDraft ? 'Draft' : isOutOfStock ? 'Out of Stock' : 'Published'}
    </span>
  </td>
  ```

### Rule 2: Actions Column Has ONLY ONE 3-Dots Trigger (NO OUTSIDE BUTTONS)
- **NEVER** place outside buttons (like "+ Stock", "Publish", or "Delete") directly inside the Actions column.
- The Actions column must contain ONLY the clean 3-dots trigger button (`MoreVertical`):
  ```tsx
  <td className="py-3.5 px-3.5 text-center">
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={(e) => handleToggleMenu(p.id, e)}
        className="p-2 rounded-xl text-slate-500 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
        aria-label="Actions menu"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  </td>
  ```

### Rule 3: Floating Dropdown Menu (React Portal + Viewport Clamping)
To prevent table overflow clipping, horizontal/vertical scrollbars, and menu disappearance:
1. **Always use `createPortal(..., document.body)`**: Completely decouples the menu from table overflow.
2. **Calculate dynamic coordinates with clamping**:
   - Open upwards if `spaceBelow < menuHeight && spaceAbove >= spaceBelow`.
   - **Clamp `top` position**: `Math.max(10, Math.min(top, window.innerHeight - menuHeight - 10))`. This guarantees the menu is NEVER clipped, even if there is only 1 row or on short viewports.
   - Include `maxHeight: calc(100vh - 20px)` and `overflow-y-auto`.
   - Auto-close on window scroll, resize, or outside click.
3. **Structured Dropdown Action Hierarchy**:
   1. `View Details` (Eye icon)
   2. `Publish to Store` (Emerald CheckCircle2) IF Draft, OR `Move to Drafts` (Amber FileText) IF Published
   3. `Manage Stock / Inbound` (Layers icon)
   4. `Print Thermal Sticker` (Printer icon)
   5. `Edit Product & Valuation` (Edit2 icon)
   6. Divider (`border-t border-slate-100 dark:border-white/10`)
   7. `Permanently Delete` (Rose Trash2) IF Draft, OR `Move to Drafts (Safe Delete)` IF Published

### Rule 4: Desktop Table & Mobile Accordion Parity
- On screens `< md`, hide the full table and render `MerchantExpandableCard` components.
- Mobile cards must support selection, expanding details, and the full action menu.

---

## 📦 3. Product Grid View Design Standards

When providing a Grid View toggle alongside a Table View:
- Grid cards must have **100% functional parity** with Table rows.
- **Top-right of card**: Informative non-clickable status badge (`<span>`, NEVER a button).
- **Top-left of card**: Selection checkbox.
- **Card Body**:
  - Image thumbnail with fallback `Package` icon.
  - Title linking to detail page with hover orange accent.
  - SKU badge in font-mono (`bg-slate-100 dark:bg-navy-950 font-bold`).
  - Warehouse bin location pill.
  - Declared value card (`৳ amount` in bold).
  - Warehouse stock units counter.
- **Card Footer Actions**:
  - Status Toggle button (`Draft` for published, `Publish to Store` for draft with emerald styling).
  - Quick Print Barcode button.
  - Edit button.
  - Safe Delete / Permanent Delete button.

---

## 🛠️ 4. Bulk Actions & Selection Toolbar (Admin-Pattern)

Follow the WordPress/Admin-style bulk actions bar:
1. **Bulk Actions Dropdown**:
   - Standard Tab: `Set as Published`, `Move to Draft`, `Permanently Delete`.
   - Drafts Tab: `Restore / Publish to Store`, `Permanently Delete`.
2. **Apply Button**:
   - Disabled when `selectedCount === 0 || !bulkAction`.
   - Active: `bg-orange-600 hover:bg-orange-500 text-white font-bold px-3.5 py-1.5 rounded-xl`.
3. **Selection Counter Badge**:
   - Displays `(X selected)` with a `Clear` button.
4. **Floating Bottom Action Bar**:
   - Also render `ProductBulkActionBar` at the bottom of the screen as a convenient floating overlay when items are selected.

---

## 📈 5. Graphical Visualizations & Charts Architecture

### A. Financial Settlement Pie Chart (COD & Deductions)
- **MUST be an authentic solid SVG Pie Chart**, NOT a hollow donut circle.
- Sector wedges meet at the center `(cx, cy)`:
  `d = "M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z"`.
- Slices:
  - **Net Merchant Payout**: `#10b981` (Emerald ~82.5%)
  - **Courier Delivery Charges**: `#f59e0b` (Amber ~13%)
  - **3PL Pick, Pack & Handling Fee**: `#f43f5e` (Rose ~4.5%)
- Dividing borders: `stroke="currentColor" className="text-white dark:text-navy-900" strokeWidth="2.5"`.
- Hover interaction: Slices highlight with scale/opacity, and an interactive badge below displays the exact ৳ amount and percentage.
- Empty state: Render placeholder sector slices with muted opacity showing authentic pie slices.

### B. Order Velocity & Revenue Column Chart
- Vertical bars (খাড়া খাড়া বার চার্ট) representing daily/weekly/monthly revenue and order volume.
- Timeframe dropdown options: `Today (Live Hourly)`, `Last 7 Days (Daily)`, `Last 30 Days (Weekly)`, `Last 3 Months`, `Last 6 Months`, `This Year (12 Months)`.
- Bars use gradient `bg-gradient-to-t from-orange-600 to-amber-400` with subtle top highlight.
- Hover tooltip shows period label, gross ৳ amount, and order count.

---

## 📄 6. Pagination & Limit Selector Specification

Always include complete pagination at the bottom of data-heavy views:
```tsx
<div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
  {/* Showing X to Y of Z */}
  <div>
    Showing <strong className="text-navy-900 dark:text-white font-mono">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
    <strong className="text-navy-900 dark:text-white font-mono">{Math.min(currentPage * pageSize, total)}</strong> of{' '}
    <strong className="text-navy-900 dark:text-white font-mono">{total}</strong> products
  </div>

  <div className="flex items-center gap-4">
    {/* Rows per page selector: 10, 25, 50, 100 */}
    <div className="flex items-center gap-1.5">
      <span>Rows per page:</span>
      <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-lg border ...">
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>

    {/* Prev, Page Number Pills (active = bg-orange-600 text-white), Next */}
    <div className="flex items-center gap-1">
      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>...</button>
      {/* Dynamic page numbers with ellipsis */}
      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>...</button>
    </div>
  </div>
</div>
```

---

## 🌟 7. Landing Page Marketing Aesthetic Elements

When building or updating marketing / landing pages:
1. **Hero Section**:
   - Soft gradient: `bg-gradient-to-b from-cream via-white to-white dark:from-navy-950 dark:via-navy-950 dark:to-navy-900`.
   - Subtle dot grid background with mask fade: `[background-image:radial-gradient(#12284C22_1px,transparent_1px)] [background-size:26px_26px]`.
   - Micro-animations: SVG delivery truck moving along dashed road line.
   - Live badge pill with animated pulse ring (`fx-pulse-ring`).
2. **Typography**:
   - Large display headlines (`text-[2.6rem] sm:text-6xl font-extrabold tracking-tight`).
   - Hand-drawn SVG decorative underline beneath key words in orange opacity.
3. **Primary CTA Buttons**:
   - Large rounded-full button: `rounded-full bg-orange-500 hover:bg-orange-600 px-7 h-12 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 active:scale-95`.
   - Secondary portal button: `rounded-full border border-navy-800/15 dark:border-white/20 px-7 h-12 text-sm font-semibold`.

---

## 🔒 8. Golden Rules (Never Break These)

1. **NEVER use generic purple/indigo AI themes.** Fulfillio is strictly **White & Navy with Vibrant Orange (`#F26B1D`) accents**.
2. **NEVER turn Status badges into action buttons.** Status is purely informative text (`<span>`).
3. **NEVER clutter the Actions column.** Only the 3-dots trigger button lives in the table cell; all operations reside in the floating portaled dropdown.
4. **NEVER render unportaled dropdowns in overflow containers.** Always use `createPortal(..., document.body)` with clamped viewport coordinates.
5. **NEVER substitute a Donut chart when a Pie Chart is requested.** Solid SVG Pie Charts use triangular wedge sectors meeting at center `(cx, cy)`.
