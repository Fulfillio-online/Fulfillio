# Fulfillio — Local Development Setup Guide

> **For any AI assistant or developer continuing this project**

## Project Overview
Fulfillio is a multi-tenant 3PL Warehouse Management System built as a **pnpm + Turborepo monorepo**.

```
apps/
  api/        → NestJS backend (port 4000)
  web/        → Next.js 15 frontend (port 3000)
  worker/     → BullMQ background job processor
packages/
  contracts/  → Shared TypeScript types/enums
  ui/         → Shared UI components (placeholder)
  config/     → Shared TypeScript configs
infra/
  docker/     → Dockerfiles for production
  caddy/      → Caddy reverse proxy config
```

---

## Prerequisites

```
Node.js >= 18 (currently using v25.5.0)
pnpm >= 8 (currently using 12.15.0)
PostgreSQL 16 (local or Docker)
Redis 7 (local or Docker)
```

---

## Step 1 — Install Dependencies

```powershell
# From the project root:
pnpm install
```

---

## Step 2 — Environment Variables

Copy `.env.example` to `.env` and fill in values:

```powershell
Copy-Item .env.example .env
```

**Required values in `.env`:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fulfillio
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d
PORT=4000
NODE_ENV=development
```

---

## Step 3 — Database Setup

### Option A: Docker (recommended for production-like env)
```powershell
docker compose up -d db redis
```

### Option B: Local PostgreSQL
1. Create database: `CREATE DATABASE fulfillio;`
2. Create user or use postgres superuser

### Run Prisma migrations:
```powershell
# Generate Prisma client
pnpm --filter=@fulfillio/api exec prisma generate

# Push schema to DB (dev only, no migration files)
pnpm --filter=@fulfillio/api exec prisma db push

# OR run migration files
pnpm --filter=@fulfillio/api exec prisma migrate deploy
```

---

## Step 4 — Build Shared Packages First

```powershell
# Build contracts package (shared types)
pnpm --filter=@fulfillio/contracts build
```

---

## Step 5 — Run Development Servers

### Terminal 1 — API (NestJS on port 4000):
```powershell
pnpm --filter=@fulfillio/api dev
```

### Terminal 2 — Web (Next.js on port 3000):
```powershell
pnpm --filter=@fulfillio/web dev
```

### Terminal 3 — Worker (BullMQ, optional):
```powershell
pnpm --filter=@fulfillio/worker dev
```

### OR run all together with Turborepo:
```powershell
pnpm dev
```

---

## Step 6 — Access the Application

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Home page |
| http://localhost:3000/admin | Admin Control Panel |
| http://localhost:3000/merchant | Merchant Portal |
| http://localhost:3000/wms/packing | Packing Station |
| http://localhost:4000/api | Backend API root |

---

## Step 7 — Build for Production

```powershell
# Build everything
pnpm build

# OR build individually
pnpm --filter=@fulfillio/contracts build
pnpm --filter=@fulfillio/api build
pnpm --filter=@fulfillio/web build
```

---

## Architecture Notes

### Backend Module Structure (`apps/api/src/modules/`)
Each module follows: **controller → service → repository** pattern

| Module | Description |
|--------|-------------|
| `auth/` | JWT auth, API key guard, login/register |
| `merchants/` | Merchant management, approval/suspend |
| `warehouses/` | Warehouse & bin/shelf locations |
| `inventory/` | SKU catalog, stock levels, atomic reservations |
| `orders/` | Order lifecycle state machine, wave picking |
| `fulfillment/` | Order fulfillment workflow coordination |
| `packing/` | Barcode verification at packing station |
| `shipping/` | Courier API adapters (Steadfast, Pathao, RedX) |
| `returns/` | Return intake and processing |
| `memo-engine/` | Custom invoice/label template engine |
| `integrations/` | WooCommerce/Shopify webhook receiver |
| `billing/` | Storage fees, COD settlement |
| `notifications/` | Webhook dispatch, in-app notifications |
| `queue/` | BullMQ queue infrastructure (producers only) |

### Frontend Pages (`apps/web/src/app/`)
- `/` — Home/landing page
- `/admin` — Super Admin Control Panel (manage merchants, warehouses)
- `/merchant` — Merchant Portal + Custom Memo Designer
- `/wms/packing` — Warehouse Packing Station (barcode scanner UI)

### Common Files (`apps/api/src/common/`)
- `decorators/current-user.decorator.ts` — Extract JWT user
- `decorators/current-merchant.decorator.ts` — Extract merchantId
- `filters/http-exception.filter.ts` — Global error handler
- `interceptors/logging.interceptor.ts` — Request/response logger

---

## Prisma Schema Location
```
apps/api/prisma/schema.prisma
```

**Models:** Merchant, User, Product, ProductVariant, InventoryLocation, InventoryItem, Order, OrderItem, Fulfillment, MemoTemplate, Settlement

---

## Known Limitations (to implement next)

1. **Authentication**: Currently skeleton implementation — needs real password hashing + JWT token issuance in `auth.service.ts`
2. **Courier APIs**: `shipping.service.ts` has mock implementations — needs real Steadfast/Pathao/RedX API integration
3. **PDF Generation**: `queue/pdf.processor.ts` needs real PDF library (e.g., `pdf-lib` or `puppeteer`)
4. **Real-time**: No WebSocket/SSE yet for live order updates
5. **Frontend API calls**: Pages are currently UI-only — need to connect to backend via `fetch`/`axios`
6. **Feature modules**: `apps/web/src/features/` not yet created (pages are monolithic)
7. **Tests**: No tests written yet — use TDD approach for state machines

---

## Troubleshooting

### pnpm install fails
```powershell
# Clear pnpm store and reinstall
pnpm store prune
pnpm install --force
```

### Prisma generate fails (no DB)
```powershell
# Generate client without DB connection (schema only)
pnpm --filter=@fulfillio/api exec prisma generate
```

### TypeScript build errors
```powershell
# Check for errors without building
pnpm --filter=@fulfillio/api exec tsc --noEmit
pnpm --filter=@fulfillio/web exec tsc --noEmit
```

### Port already in use
```powershell
# Kill process on port 4000 or 3000
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Queue | Redis 7 + BullMQ |
| Monorepo | pnpm Workspaces + Turborepo |
| Auth | JWT (HS256) + API Key (HMAC) |
| Infra | Docker Compose + Caddy (production) |

---

*Last updated: 2026-10-23 by Antigravity AI*
