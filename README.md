# 📦 Fulfillio — Enterprise 3PL Warehouse Management & Fulfillment Platform

[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-ef4444?style=flat-square&logo=turborepo)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-ea2845?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Queue-Redis%207%20%2B%20BullMQ-dc382d?style=flat-square&logo=redis)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-blue?style=flat-square)]()

> **Domain:** [fulfillio.online](https://fulfillio.online)  
> **Target Audience:** Third-Party Logistics (3PL) Operators, D2C Brands, Resellers & E-Commerce Merchants.  
> **Platform Type:** Warehouse Management System (WMS) + 3PL Fulfillment Engine + Multi-Channel Integrations (WooCommerce/Shopify/REST).

---

## 🧭 Vision, Mission & Goals

### 🎯 Our Vision
To become the premier operating system for modern e-commerce logistics across emerging and high-growth markets, turning warehouse friction into automated, high-velocity order fulfillment.

### 🚀 Our Mission
To empower independent e-commerce merchants and 3PL warehouse operators with enterprise-grade warehousing technology: automated 2-part SKU intelligence, real-time stock reservation locks, custom thermal reseller memos, warehouse worker handheld workflows, and instant courier dispatch.

### 🏆 Core Strategic Goals
1. **Zero Stock Collision:** Atomic PostgreSQL `FOR UPDATE` transaction locks guaranteeing 100% reservation integrity under high-concurrency flash sales.
2. **Sub-60s Pick-Pack-Ship Cycle:** Streamlined handheld mobile interface for warehouse workers to pick by shelf bins and verify items with barcode scanners.
3. **Reseller Brand Protection:** Built-in 4x6 thermal memo designer with custom merchant branding, preventing 3PL warehouse identity leaks to end customers.
4. **Transparent Financial Reconciliation:** Automated weekly COD settlements subtracting 3PL handling/storage fees with instant disbursal tracking.

---

## 🏗️ Architecture & Monorepo Topology

Fulfillio is architected as a **Pragmatic Modular Monolith** inside a high-speed `pnpm` + `Turborepo` workspace. This guarantees zero network microservice overhead while enforcing strict domain separation and shared type safety.

```mermaid
flowchart TD
    subgraph Clients["User Portals & Integrations"]
        Admin["Super Admin Portal\n(:3000/admin)"]
        Merchant["Merchant Dashboard\n(:3000/merchant)"]
        Worker["WMS Handheld App\n(:3000/wms/worker)"]
        Packing["Packing Station Scanner\n(:3000/wms/packing)"]
        StoreWebhooks["WooCommerce / Shopify\n(REST Webhooks)"]
    end

    subgraph Gateway["Reverse Proxy & Gateway"]
        Caddy["Caddy Reverse Proxy / Gateway\n(Auto TLS / Port 80, 443)"]
    end

    subgraph Backend["NestJS 11 Modular Monolith (:4000)"]
        Auth["Auth & RBAC Module"]
        Merchants["Merchants & Kyc Module"]
        Inventory["Inventory & 2-Part SKU"]
        Orders["Order State Machine"]
        Fulfillment["Pick & Pack Orchestrator"]
        MemoEngine["Memo & Thermal Template Engine"]
        Shipping["Courier Adapters (Steadfast, Pathao, RedX)"]
        Billing["Billing & COD Settlements"]
        Integrations["Public Webhook Receiver"]
    end

    subgraph Infrastructure["Data & Workers"]
        Postgres[("PostgreSQL 16\n(Multi-tenant Composite Indexes)")]
        Redis[("Redis 7 Cache & BullMQ")]
        WorkerQueue["Background Job Processor\n(@fulfillio/worker)"]
    end

    Clients --> Caddy
    Caddy --> Backend
    Backend --> Postgres
    Backend --> Redis
    Redis --> WorkerQueue
```

### 📂 Directory Map
```
Fulfillio/
├── apps/
│   ├── api/                   # NestJS 11 Core Backend API (Port 4000)
│   │   ├── prisma/            # Single PostgreSQL schema & migrations
│   │   └── src/modules/       # Domain modules (auth, merchants, inventory, orders, etc.)
│   ├── web/                   # Next.js 15 App Router Frontend (Port 3000)
│   │   ├── src/app/           # Routes: /admin, /merchant, /wms/worker, /wms/packing, /login
│   │   ├── src/components/ui/ # Atomic dark-mode UI library (Button, Card, Badge, Input, etc.)
│   │   └── src/features/      # Domain components (Memo designer, SKU generator, etc.)
│   └── worker/                # BullMQ Background Job Processors (Port 4001)
├── packages/
│   ├── contracts/             # Shared TypeScript DTOs, Enums, Interfaces (@fulfillio/contracts)
│   ├── ui/                    # Monorepo shared React UI library (@fulfillio/ui)
│   └── config/                # Shared ESLint and TypeScript configs
├── docs/                      # Technical specifications, state machines & architecture docs
├── infra/                     # Dockerfiles & Caddy configuration
├── docker-compose.yml         # Local development database and Redis stack
└── turbo.json                 # Turborepo task pipeline
```

---

## ⚡ Key Modules & Features Live in Codebase

| # | Module | Description & Capabilities | Portal Route |
|---|---|---|---|
| **01** | **Auth & RBAC** | Multi-role JWT authentication supporting `SUPER_ADMIN`, `MERCHANT`, and `WAREHOUSE_WORKER`. | `/login` |
| **02** | **Merchant Identity** | Merchant profiles (`MC-101`), verified cheque leaf uploads for payout verification, and balance ledger. | `/merchant` |
| **03** | **Products & 2-Part SKU** | Dynamic SKU formatting (`MC-101-PRODUCT-VAR`), EAN-13 barcodes, stock adjusters & 2x1" thermal stickers. | `/merchant` |
| **04** | **Custom Memo Designer** | Custom reseller memo codes (`MEMO-DARAZ-BD`), brand color picker, and live 4x6 thermal invoice compiler. | `/merchant` |
| **05** | **Order & Stock Lock** | Real-time stock validation modal, atomic stock reservation on placement, and instant stock refund on cancel. | `/merchant` |
| **06** | **WMS Handheld App** | Mobile-responsive worker UI: Shelf bin picking, multi-order 4x6 packing slip printing, and courier handovers. | `/wms/worker` |
| **07** | **Courier Shipping** | Multi-courier dispatch (Steadfast, Pathao, RedX), real-time tracking webhook logs, and dispatch manifests. | `/admin` |
| **08** | **Billing & Settlements**| Automated weekly COD statements subtracting fulfillment fees with clear breakdown ($\text{COD} - \text{Fees} = \text{Payout}$). | `/admin` |
| **09** | **Integrations & REST** | Secure WooCommerce & Shopify webhook ingestion endpoints with secret signature validation. | `/api/integrations` |

---

## 🚀 Quickstart for Team Members

Follow these steps to run the complete Fulfillio stack locally on your workstation.

### 1. Prerequisites
Ensure you have the following installed:
- **Node.js:** v18.0.0 or higher (Recommended: v20+ or v25+)
- **pnpm:** v9.0.0 or higher (`corepack enable && corepack prepare pnpm@latest --activate`)
- **Docker Desktop:** For running PostgreSQL and Redis containers.

---

### 2. Clone the Repository
```bash
git clone https://github.com/Fulfillio-online/Fulfillio.git
cd Fulfillio
```

---

### 3. Install Workspace Dependencies
```bash
pnpm install
```

---

### 4. Setup Environment Variables
Create your local environment file from `.env.example`:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Ensure `.env` contains:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fulfillio
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=super-secret-jwt-key-fulfillio-2026
PORT=4000
NODE_ENV=development
```

---

### 5. Launch Local Services (Postgres & Redis)
Start the PostgreSQL 16 and Redis 7 containers using Docker Compose:
```bash
docker compose up -d
```

Verify containers are running:
```bash
docker ps
```

---

### 6. Run Database Migrations & Prisma Client
Generate the Prisma Client and sync the database schema:
```bash
# Generate Prisma Client
pnpm --filter=@fulfillio/api exec prisma generate

# Apply Migrations
pnpm --filter=@fulfillio/api exec prisma migrate deploy
```

---

### 7. Build Shared Packages
Build shared TypeScript contracts used across frontend and backend:
```bash
pnpm --filter=@fulfillio/contracts build
```

---

### 8. Run the Application
You can run the entire monorepo simultaneously using Turborepo:
```bash
pnpm dev
```

Or run services individually in dedicated terminals:
```bash
# Terminal 1 — Backend API (NestJS)
pnpm --filter=@fulfillio/api start:dev

# Terminal 2 — Frontend Portal (Next.js)
pnpm --filter=@fulfillio/web dev
```

---

## 🌐 Local Endpoints & Test Credentials

Once running, access the portals using the URLs below:

| Application / Screen | URL | Recommended Role |
|---|---|---|
| **Role Selector / Auth** | [http://localhost:3000/login](http://localhost:3000/login) | Switch between Admin, Merchant, Worker |
| **Merchant Dashboard** | [http://localhost:3000/merchant](http://localhost:3000/merchant) | Merchant (`MC-101`) |
| **Super Admin Portal** | [http://localhost:3000/admin](http://localhost:3000/admin) | Super Admin (`ADMIN-01`) |
| **WMS Worker Handheld** | [http://localhost:3000/wms/worker](http://localhost:3000/wms/worker) | Warehouse Worker |
| **Packing Station Scanner** | [http://localhost:3000/wms/packing](http://localhost:3000/wms/packing) | Warehouse Packer |
| **NestJS REST API** | [http://localhost:4000/api](http://localhost:4000/api) | API Consumer / Postman |

### 🔑 Instant Test Logins
- **Super Admin:** `admin@fulfillio.online` / `admin123`
- **Merchant:** `merchant@daraz-seller.com` / `merchant123`
- **Warehouse Worker:** `worker1@fulfillio.online` / `worker123`

---

## 🛠️ Engineering Standards & Contributing Workflow

To maintain code velocity and prevent breaking changes across teams, all developers must adhere to the rules outlined in [`GEMINI.md`](./GEMINI.md) and [`CONTRIBUTING.md`](./CONTRIBUTING.md):

1. **Branching Strategy:**
   - Feature branches: `feat/<module-name>-<short-description>` (e.g. `feat/memo-engine-template-preview`)
   - Bugfix branches: `fix/<module-name>-<issue-description>`
   - Hotfixes: `hotfix/<description>`
2. **Commit Convention:**
   - Follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `chore:`.
3. **Frontend Rules:**
   - **Never** run `next dev` and `next build` concurrently in the same directory (prevents chunk manifest corruption).
   - Use atomic components from `apps/web/src/components/ui/`.
   - All interactive controls must support high-contrast dark mode styling.
4. **Backend Rules:**
   - Every multi-tenant entity must include `merchantId String` with `@@index([merchantId, ...])`.
   - Inventory stock changes must use atomic PostgreSQL transactions with row-level locks.

---

## 🗺️ Roadmap & Milestones

- [x] **Phase 1: Foundation & Monorepo Scaffold** — Turborepo, NestJS 11, Next.js 15, Prisma schema.
- [x] **Phase 2: Core 3PL WMS Execution** — 2-part SKU generator, custom 4x6 memo designer, worker handheld interface.
- [x] **Phase 3: Financials & Couriers** — COD settlement reconciliation, courier adapters (Steadfast, Pathao).
- [ ] **Phase 4: Official Plugin Distribution** — Official WordPress/WooCommerce plugin and Shopify App Store listing.
- [ ] **Phase 5: Automated Billing Invoicing** — Automated bKash/Nagad merchant payout integration.

---

## 📄 License & Attribution

Copyright © 2026 **Fulfillio Technologies Ltd.** All rights reserved.  
Maintained with ❤️ by the **Fulfillio Core Engineering Team** ([@Fulfillio-online](https://github.com/Fulfillio-online)).
