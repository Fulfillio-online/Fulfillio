# Fulfillio — Project Guidelines & Architecture Standards

> **Domain:** fulfillio.online  
> **Platform Type:** Warehouse Management System (WMS) + 3PL Fulfillment Platform + Integration Layer (WooCommerce/Shopify Plugins & Public REST API).  
> **Architecture Pattern:** Pragmatic Modular Monolith (Single deployable backend process, clean domain boundaries).

---

## 1. Fast Directory Map (Direct Lookup — No Token Waste)

```
Fulfillio/
├── apps/
│   ├── api/                                # NestJS 11 Backend (port 4000)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/                   # JWT Auth, API Key Guard, RBAC
│   │   │   │   ├── merchants/              # Merchant profile, onboarding, approval
│   │   │   │   ├── warehouses/             # Warehouse zones, racks, shelf locations
│   │   │   │   ├── inventory/              # SKU stock, atomic reservations (FOR UPDATE)
│   │   │   │   ├── orders/                 # Order state machine, wave pick algorithms
│   │   │   │   ├── fulfillment/            # Pick-pack-ship orchestration & state transitions
│   │   │   │   ├── packing/                # Packing station barcode verification
│   │   │   │   ├── shipping/               # Courier API adapters (Steadfast, Pathao, RedX)
│   │   │   │   ├── returns/                # Returns intake & reverse logistics
│   │   │   │   ├── memo-engine/            # Custom invoice/memo template JSONB engine
│   │   │   │   ├── integrations/           # WooCommerce / Shopify webhooks receiver
│   │   │   │   ├── billing/                # Storage fees, handling fees, COD settlements
│   │   │   │   ├── notifications/          # Webhook event dispatch & in-app alerts
│   │   │   │   └── queue/                  # Infrastructure: BullMQ job producers ONLY
│   │   │   ├── common/                     # Decorators (@CurrentUser), Filters, Interceptors
│   │   │   ├── config/                     # Typed configuration (port, DB, Redis, JWT)
│   │   │   └── main.ts                     # NestJS bootstrap (prefix: /api)
│   │   └── prisma/                         # schema.prisma (Single PostgreSQL DB)
│   │
│   ├── web/                                # Next.js 15 App Router Frontend (port 3000)
│   │   ├── src/
│   │   │   ├── app/                        # Route pages: /, /admin, /merchant, /wms/packing
│   │   │   ├── features/                   # Feature-specific components (memo-designer, etc.)
│   │   │   ├── components/ui/              # Atomic Reusable UI: Button, Badge, Card, Input, StatCard
│   │   │   └── lib/                        # Utilities: cn(), helpers
│   │   └── package.json
│   │
│   └── worker/                             # BullMQ Background Job Processors
│       ├── src/                            # main.ts: jobs.pdf, jobs.webhooks, jobs.couriers
│       └── package.json
│
├── packages/
│   ├── contracts/                          # Shared Enums & TypeScript interfaces (@fulfillio/contracts)
│   ├── ui/                                 # Shared UI components package (@fulfillio/ui)
│   └── config/                             # Shared base tsconfig (@fulfillio/config)
│
├── infra/
│   ├── docker/                             # Dockerfile.api, Dockerfile.web
│   └── caddy/                              # Caddyfile (Reverse proxy + auto TLS)
│
├── docs/                                   # ARCHITECTURE.md, API specs
├── tests/                                  # E2E test suites
├── SETUP.md                                # Local run and setup guide
├── docker-compose.yml                      # PostgreSQL 16 + Redis 7 + Caddy
├── turbo.json                              # Turborepo task pipeline
├── pnpm-workspace.yaml                     # pnpm workspace config
└── package.json                            # Root scripts & turbo orchestration
```

---

## 2. Rules for Adding Any New Feature (Rule of Fast Navigation)

When a developer or AI adds new functionality, follow these exact rules without searching or guessing:

1. **Adding a Backend Feature / Entity:**
   - **Step A:** Check `schema.prisma`. If adding a table/field, always include `merchantId String` with `@@index([merchantId, ...])` for tenant isolation. Run `pnpm --filter=@fulfillio/api exec prisma generate`.
   - **Step B:** Go directly to `apps/api/src/modules/<module-name>/`.
   - **Step C:** Follow pattern: `controller.ts` (routes & guards) → `service.ts` (business logic) → `repository.ts` (Prisma queries).
   - **Step D:** If creating a new module, register it in `apps/api/src/app.module.ts`.

2. **Adding an API Endpoint / Contract:**
   - Put shared enums / DTO interfaces in `packages/contracts/src/index.ts`.
   - Run `pnpm --filter=@fulfillio/contracts build`.

3. **Adding a Background Task:**
   - Producer stays in domain module (e.g. `apps/api/src/modules/queue/queue.service.ts`).
   - Consumer/Worker stays in `apps/worker/src/main.ts`.

4. **Adding a Frontend Feature / Screen:**
   - Route goes in `apps/web/src/app/<route-name>/page.tsx`.
   - Reusable primitives go in `apps/web/src/components/ui/`.
   - Complex domain UI goes in `apps/web/src/features/<feature-name>/`.

---

## 3. Technology Stack & Directory Conventions

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **Backend:** NestJS 11 (Modular Monolith, BullMQ, Prisma).
- **Primary Database:** PostgreSQL 16+ (Tenant isolation via composite indexes).
- **Queue & Cache:** Redis 7+ & BullMQ.
- **Hardware Integration:** Barcode scanning with `html5-qrcode` & USB HID wedge scanners.
- **Package Manager:** `pnpm@12.15.0` + `Turborepo`.

---

## 4. Key Feature: Custom Memo / Invoice Code Workflow

1. **Merchant Customization:**
   - Merchants design branded invoice/packing slips in the Merchant Portal (`/merchant`).
   - Each design is stored in PostgreSQL as a JSONB schema with an immutable `memo_code` (e.g., `MEMO-DEFAULT`, `MEMO-PROMO-A4`).
2. **Order Sync & Attribution:**
   - When orders are placed via WooCommerce, Shopify, or REST API, the order payload contains `memo_code`.
3. **Warehouse Packing Execution:**
   - When warehouse packer scans an order barcode at Packing Station (`/wms/packing`), the system compiles the template for the specified `memo_code` and sends print-ready PDF/label to the station printer.
