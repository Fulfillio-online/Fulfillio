---
name: fulfillio-workflow
description: >-
  Complete architecture standards, domain rules, and token-efficient coding workflow for Fulfillio 3PL WMS.
  Use whenever implementing or modifying any backend module, frontend feature, database schema, or bugfix in Fulfillio.
---

# Fulfillio Engineering Workflow & Domain Standards

This skill governs the development of **Fulfillio** (`fulfillio.online`), an enterprise Multi-Tenant 3PL Warehouse Management System & Merchant Fulfillment Platform.

---

## 1. Model Selection & Token Efficiency Rules

> **CRITICAL DIRECTIVE:**  
> Do **NOT** use heavy, slow, or expensive reasoning models for standard development tasks in Fulfillio.  
> Standard features, CRUD operations, UI components, API endpoints, and refactors MUST be handled directly using fast, efficient models (such as Gemini Flash, Flash-Lite, or standard paired coding models). Reserve heavy models only for multi-step algorithmic breakthroughs if explicitly requested.

### Strict Rules to Avoid Token Waste:
1. **Zero Blind Searching:** Never run recursive or open-ended directory searches across the repository. Use the **Fast Directory Map** below to jump directly to the target file.
2. **Follow Stored Specs:** Refer to `mvp-goals-and-progress/` for the exact requirements of each module before writing code.
3. **No Over-Engineering:** Implement strictly what is marked as MVP requirements. Never add speculative enterprise complexity that the user has explicitly postponed.

---

## 2. Fast Navigation & Directory Map

```
Fulfillio/
├── apps/
│   ├── api/                                # NestJS 11 Backend (port 4000)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/                   # JWT Auth, Roles, API Key Guard
│   │   │   │   ├── merchants/              # Merchant profile, bank details, approval
│   │   │   │   ├── warehouses/             # Simplified warehouse space
│   │   │   │   ├── inventory/              # 2-part SKU, stock, atomic FOR UPDATE locks
│   │   │   │   ├── orders/                 # Order lifecycle, variant details, status
│   │   │   │   ├── fulfillment/            # Pick-pack-ship flow coordination
│   │   │   │   ├── packing/                # Multi-select order packing & print
│   │   │   │   ├── shipping/               # Courier integrations (Steadfast, Pathao)
│   │   │   │   ├── returns/                # Returns intake & auto-restock
│   │   │   │   ├── memo-engine/            # Reseller custom invoice/memo JSONB engine
│   │   │   │   ├── integrations/           # WooCommerce & Shopify webhook receiver
│   │   │   │   ├── billing/                # Storage fees, courier charges, COD settlement
│   │   │   │   ├── notifications/          # Webhook event dispatch & alerts
│   │   │   │   └── queue/                  # Infrastructure: BullMQ job producers ONLY
│   │   │   ├── common/                     # Decorators (@CurrentUser), Filters, Interceptors
│   │   │   ├── config/                     # Typed configuration (configuration.ts)
│   │   │   └── main.ts                     # NestJS bootstrap (prefix: /api)
│   │   └── prisma/                         # schema.prisma (Single PostgreSQL DB)
│   │
│   ├── web/                                # Next.js 15 App Router (port 3000)
│   │   ├── src/
│   │   │   ├── app/                        # Pages: /, /admin, /merchant, /wms/packing
│   │   │   ├── features/                   # Domain features (memo-designer, etc.)
│   │   │   ├── components/ui/              # Atomic Reusable UI: Button, Badge, Card, Input, StatCard
│   │   │   └── lib/                        # Utilities: cn(), helpers
│   │   └── package.json
│   │
│   └── worker/                             # Standalone BullMQ Job Processors
│       ├── src/main.ts                     # jobs.pdf, jobs.webhooks, jobs.couriers
│       └── package.json
│
├── mvp-goals-and-progress/                 # Detailed module-by-module MVP requirements
├── packages/contracts/                     # Shared enums & types (@fulfillio/contracts)
├── packages/ui/                            # Shared UI package placeholder
├── packages/config/                        # Shared base tsconfig
└── pnpm-workspace.yaml                     # pnpm workspace config
```

---

## 3. Mandatory Business & Domain Rules (User-Defined)

### Rule A: Reseller Branded Memo Engine (MOST IMPORTANT)
- Merchants can have multiple **Resellers / White-label partners**.
- Products ship under the reseller's brand name, website, logo, and contact info.
- Merchants pre-design distinct memo templates for each reseller in the Merchant Portal.
- Each template has an immutable `memo_code` (e.g. `MEMO-DARAZ-BD`, `MEMO-SHOP-XYZ`).
- When placing orders (manually or via WooCommerce), the merchant selects the reseller's `memo_code`.
- **4x6 Thermal Sticker Standard:** Invoices MUST be optimized for **4x6 inch thermal label printers** (`@page { size: 4in 6in; margin: 0; }`).
- Do **NOT** render barcodes or QR codes inside the memo for MVP.

### Rule B: 2-Part SKU Structure
Every SKU in the system MUST follow this strict 2-part structure:
```
[Merchant Code] - [Product SKU]
Example: M101-TSHIRT-BLK-XL
```
- **Part 1 (Merchant Code):** Auto-assigned to each merchant (visible in their profile, e.g. `M101`).
- **Part 2 (Product SKU):** Provided by the merchant during product upload.
- This guarantees zero SKU collisions in the shared multi-tenant warehouse.

### Rule C: Simplified Warehousing for MVP
- **Out of Scope for MVP:** Do NOT create complex Aisle, Rack, Shelf, or Bin codes (`A-01-R2-S3`).
- Single primary warehouse stock location is used. Stock belongs directly to the warehouse.

### Rule D: Simplified Picking List
- When an order is placed and products are in stock, they automatically show up on the warehouse **Pick List**.
- Warehouse operators simply view the list or print a paper pick sheet to gather items from shelves.
- No complex multi-stage batching or RFID/GPS worker tracking.

### Rule E: Multi-Select Packing Desk
- **NO camera scanning, NO audio beeps, and NO parcel weight input** (courier measures weight).
- The packing screen shows packed/ready orders.
- The operator selects one or multiple orders via **Checkboxes**.
- The operator clicks **"Print Selected Invoices (4x6 Thermal)"** to immediately print the selected orders' reseller memos.

### Rule F: Multi-Tenant Database Isolation
- Every tenant-owned table MUST include `merchantId String`.
- MUST include composite index `@@index([merchantId, ...])`.
- Atomic reservations MUST use `SELECT ... FOR UPDATE` via raw SQL or transaction locks to eliminate negative stock.

---

## 4. Backend Module Architecture: Controller → Service → Repository

Every module in `apps/api/src/modules/<name>/` MUST follow this pattern:
1. `<name>.controller.ts`: Handles HTTP routes, route decorators, and guards (`@UseGuards(JwtAuthGuard)`).
2. `<name>.service.ts`: Implements business logic, validation, state machine transitions, and orchestrates calls.
3. `<name>.repository.ts`: Encapsulates all database queries via `PrismaService`.
4. `<name>.module.ts`: Declares controllers, providers, and exports. Registered in `app.module.ts`.

---

## 5. Frontend Guidelines: Reusable UI & Atomic Components

- Reusable primitives MUST be imported from `@/components` or `apps/web/src/components/ui/`:
  - `Button` (supports variants: `primary`, `secondary`, `outline`, `danger`, `ghost`, `success`, sizes, `isLoading`)
  - `Badge` (supports: `success`, `warning`, `danger`, `info`, `purple`, `neutral`)
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
  - `Input` (with label, helperText, error state)
  - `StatCard` (with trend positive/negative, metric value, icon)
- Feature-specific UI goes in `apps/web/src/features/<feature-name>/`.
- Route pages in `apps/web/src/app/<route>/page.tsx` should remain thin layouts that compose features.

---

## 6. How to Run & Verify

```powershell
# From root directory:
pnpm build                                     # Builds all packages with turbo
pnpm --filter=@fulfillio/web dev               # Next.js frontend on port 3000
pnpm --filter=@fulfillio/api dev               # NestJS API on port 4000
pnpm --filter=@fulfillio/contracts build       # Rebuild shared contracts
pnpm --filter=@fulfillio/api exec prisma generate # Generate Prisma client
```
