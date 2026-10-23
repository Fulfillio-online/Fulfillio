# Fulfillio — Architecture & Engineering Specification

## 1. High-Level System Architecture

Fulfillio is designed as a **Pragmatic Modular Monolith** with a single backend process, asynchronous worker, unified Next.js web application, and shared package contracts.

```
                      +-----------------------------+
                      |   Caddy Reverse Proxy       |
                      |   (Auto SSL, VPS Entry)     |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v :3000                                       v :4000
    +-------------------+                         +-------------------+
    |    apps/web       |                         |    apps/api       |
    |  Next.js 15 App   |  === REST / JSON ===>   |  NestJS Modular   |
    |  (Admin, Merchant,|                         |    Monolith       |
    |   Packing WMS)    |                         +---------+---------+
    +-------------------+                                   |
                                              +-------------+-------------+
                                              |                           |
                                              v                           v
                                     +-----------------+         +-----------------+
                                     |  PostgreSQL 16  |         |     Redis 7     |
                                     |  Single DB      |         |  BullMQ Queues  |
                                     |  (Multi-tenant) |         +--------+--------+
                                     +-----------------+                  |
                                                                          v
                                                                 +-----------------+
                                                                 |   apps/worker   |
                                                                 |  BullMQ Worker  |
                                                                 |  (PDF, Webhooks)|
                                                                 +-----------------+
```

---

## 2. Directory Navigation Map

| Directory | Purpose | Primary Tech |
| :--- | :--- | :--- |
| `apps/api/src/modules/` | 13 business domain modules | NestJS 11, TypeScript |
| `apps/api/src/common/` | Decorators, HTTP filters, logging interceptors | NestJS |
| `apps/api/src/config/` | Environment & typed configuration | `@nestjs/config` |
| `apps/api/prisma/` | Single source of truth database schema | Prisma ORM, PostgreSQL |
| `apps/web/src/app/` | Thin route handlers & layouts | Next.js 15 App Router |
| `apps/web/src/components/ui/` | Reusable design system primitives | React, Tailwind, Lucide |
| `apps/web/src/features/` | Complex domain widgets & views | React 19 |
| `apps/worker/src/` | Background workers (PDF generation, webhooks) | BullMQ, ioredis |
| `packages/contracts/src/` | Shared enums, types, interfaces | TypeScript |
| `infra/` | Docker Compose, Dockerfiles, Caddyfile | Docker, Caddy |

---

## 3. Module Cheat Sheet (Where to edit?)

- **User login, roles, or API keys:** `apps/api/src/modules/auth/`
- **Merchant onboarding or approvals:** `apps/api/src/modules/merchants/`
- **Warehouse, zones, racks, bin codes:** `apps/api/src/modules/warehouses/`
- **Inventory levels, SKU reservations, stock adjustments:** `apps/api/src/modules/inventory/`
- **Order creation, batch picking, wave pick algorithm:** `apps/api/src/modules/orders/`
- **Order fulfillment lifecycle & transitions:** `apps/api/src/modules/fulfillment/`
- **Barcode verification at packing desk:** `apps/api/src/modules/packing/`
- **Steadfast, Pathao, RedX courier dispatch:** `apps/api/src/modules/shipping/`
- **Returns & reverse logistics:** `apps/api/src/modules/returns/`
- **Custom invoice / memo template layout:** `apps/api/src/modules/memo-engine/`
- **WooCommerce / Shopify webhooks:** `apps/api/src/modules/integrations/`
- **COD settlement & fees calculation:** `apps/api/src/modules/billing/`
- **Webhook dispatch & alerts:** `apps/api/src/modules/notifications/`
- **Job scheduling & queue publishing:** `apps/api/src/modules/queue/`
