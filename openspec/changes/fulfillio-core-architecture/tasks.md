# Tasks: Fulfillio Core Implementation

## 1. Project Scaffolding and Infrastructure

- [x] 1.1 Initialize monorepo workspace configuration with NestJS backend (`apps/api`), Next.js frontend (`apps/web`), and shared TypeScript packages
- [x] 1.2 Configure root `docker-compose.yml` with PostgreSQL 16, Redis 7, and Caddy reverse proxy, verifying containers start healthy
- [x] 1.3 Configure root environment configuration, shared tsconfig, and npm/pnpm workspace scripts, verifying `npm run build` succeeds

## 2. PostgreSQL Schema and Multi-Tenant Security

- [x] 2.1 Author PostgreSQL schema migrations using Prisma or TypeORM for `tenants`, `merchants`, `users`, `products`, `variants`, `inventory_items`, `orders`, `order_items`, `memo_templates`, and `settlements`
- [x] 2.2 Implement Row Level Security (RLS) policies and tenant isolation filters on `merchant_id` and verify isolation via automated unit tests
- [x] 2.3 Add composite indexes for hot query paths (e.g. `(merchant_id, sku)`, `(order_id, status)`) following `supabase-postgres-best-practices`

## 3. Redis and BullMQ Background Job Pipeline

- [x] 3.1 Configure Redis connection module and BullMQ queues (`jobs.pdf`, `jobs.webhooks`, `jobs.couriers`) in NestJS
- [x] 3.2 Implement job producers and idempotent consumers with exponential backoff and dead-letter queue handling, verified via integration tests

## 4. NestJS Authentication and Merchant Integration Gateway

- [x] 4.1 Implement JWT authentication, refresh token rotation, and role-based guards (Admin, Merchant, Warehouse Operator)
- [x] 4.2 Implement API key generation, hashing, and HMAC signature validation middleware for external merchant plugins (WooCommerce / Shopify)
- [x] 4.3 Implement webhook registration and outbound dispatch service with signature verification headers, verified via mock webhook receiver

## 5. Inventory Engine and Atomic Stock Allocation

- [ ] 5.1 Implement SKU catalog CRUD with variant attribute handling, barcode mapping, and physical bin coordinate assignments
- [ ] 5.2 Implement atomic stock reservation using PostgreSQL row-locking (`SELECT ... FOR UPDATE`) to prevent overselling, verified via concurrent stress tests
- [ ] 5.3 Implement stock adjustment and cycle count auditing endpoints with manager reason codes and verifiable audit logs

## 6. Order Lifecycle and Picking Engine

- [ ] 6.1 Implement order ingestion endpoints accepting order line items, recipient details, and optional `memo_code`
- [ ] 6.2 Implement order state machine transitions (`Pending`, `Allocated`, `Picking`, `Packed`, `Dispatched`, `Delivered`, `Returned`) with strict invariant guards
- [ ] 6.3 Implement batch and wave pick list generation algorithm optimized by warehouse zone and bin locations, verified via route test cases

## 7. Warehouse Packing Station and Barcode Scanning

- [ ] 7.1 Build Next.js packing station UI using `frontend-design` principles (high contrast, keyboard shortcuts, sound effects)
- [ ] 7.2 Integrate `html5-qrcode` camera scanner and USB HID scanner input buffer listeners, verifying barcode detection and input sanitization
- [ ] 7.3 Implement item-by-item barcode verification state logic preventing order completion until all lines are scanned and verified

## 8. Custom Memo Code Designer and Invoice Rendering

- [ ] 8.1 Build visual memo template designer in the merchant portal supporting custom logos, headers, layout sizing, and field toggles
- [ ] 8.2 Implement `memo_code` generator and unique slug validator saving layout schemas to PostgreSQL `JSONB`
- [ ] 8.3 Implement BullMQ PDF/label rendering worker that compiles order data into the merchant's memo layout upon packing completion and produces print-ready outputs

## 9. Courier Integration and Settlement

- [ ] 9.1 Implement modular courier adapters for regional services (Steadfast, Pathao, RedX) to book shipments and retrieve consignment tracking IDs
- [ ] 9.2 Implement courier handover manifest generator with barcode lists and driver signature sheets
- [ ] 9.3 Implement Return-to-Origin (RTO) intake scanning and restock workflow
- [ ] 9.4 Implement billing ledger calculating storage fees, pick-and-pack charges, and courier COD settlement reconciliations

## 10. Production Containerization and Deployment

- [ ] 10.1 Author optimized multi-stage Dockerfiles for `apps/api` and `apps/web`
- [ ] 10.2 Configure production Caddyfile with automated Let's Encrypt SSL/TLS for `fulfillio.online` and test reverse proxy routing
- [ ] 10.3 Configure GitHub Actions CI workflow running linting, database migrations, unit tests, and Docker image builds
