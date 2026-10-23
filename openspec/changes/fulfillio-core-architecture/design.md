# Design: Fulfillio Core Architecture & Technical Blueprint

## Context

Fulfillio is a greenfield 3PL platform and Warehouse Management System (WMS) operating at `fulfillio.online`. It requires high transactional guarantees for inventory, sub-millisecond query response for merchant analytics, flexible document storage for custom invoice layouts, and robust integration with external eCommerce platforms (WooCommerce, Shopify) and regional couriers (Steadfast, Pathao, RedX).

To balance velocity, operational reliability, and extreme performance without distributed systems overhead, Fulfillio is architected as a **Pragmatic Modular Monolith**.

See [proposal.md](file:///d:/Antigravity%20workspace/Fulfillio/openspec/changes/fulfillio-core-architecture/proposal.md) for overall motivation and capabilities.

## Goals / Non-Goals

**Goals:**
- **Zero Race Conditions on Stock**: Ensure atomic reservation and strict stock integrity during concurrent multi-store orders using PostgreSQL row-level locks (`SELECT ... FOR UPDATE`).
- **Unified Data Consistency**: Eliminate dual-database synchronization issues by using PostgreSQL 16+ as the single source of truth for both relational entities and dynamic memo layouts (via JSONB).
- **Fast In-Memory Execution**: Run domain modules in a single NestJS process where cross-module calls execute in-memory with sub-millisecond latency.
- **Extensible Memo Engine**: Support arbitrary merchant invoice designs mapped to unique `memo_code` keys with instant background rendering at warehouse packing stations.
- **Ergonomic Packing UI**: Deliver an audio-enabled, keyboard/scanner-friendly packing station web application using `html5-qrcode` and USB barcode scanner events.
- **Reliable Background Pipeline**: Guarantee webhook delivery and courier booking through BullMQ queues with exponential backoff and dead-letter handling.

**Non-Goals:**
- Kubernetes cluster management in early production (Docker Compose + Caddy on standard VPS is 10x more cost-effective and easier to maintain).
- Distributed gRPC network calls between internal services (in-memory TypeScript calls eliminate serialization and network latency).
- Dual-database CQRS with MongoDB (avoiding eventual consistency risks and sync lag on warehouse stock).
- Operating an in-house fleet of delivery vehicles (Fulfillio integrates with 3rd-party logistics couriers).

## Decisions

### 1. Unified PostgreSQL Data Architecture (Relational + JSONB)
- **Decision**: Use **PostgreSQL 16+** as the unified database engine. Relational tables manage structured entities (tenants, products, inventory, orders, billing), while `JSONB` columns store dynamic memo layout templates.
- **Rationale**:
  - Eliminates the complexity and failure modes of dual-writing to MongoDB.
  - PostgreSQL's `JSONB` with GIN indexing provides document-store flexibility with full ACID guarantees.
  - Row Level Security (RLS) ensures strict tenant data isolation by `merchant_id`.
- **Alternative Considered**: PostgreSQL for write + MongoDB for read. Rejected to avoid eventual consistency lag, dual-database maintenance, and sync failures in warehouse operations.

### 2. NestJS Modular Monolith Architecture
- **Decision**: Single NestJS backend process organized into explicit, clean domain modules:
  - `AuthModule`: Tenant registration, JWT, refresh tokens, API keys.
  - `MerchantModule`: Merchant profiles, webhook registrations.
  - `InventoryModule`: SKU catalog, location hierarchy, atomic stock reservations.
  - `OrderModule`: Order state machine, batch picking logic.
  - `PackingModule`: Barcode verification station, packing events.
  - `MemoEngineModule`: Template compiler and memo code resolver.
  - `LogisticsModule`: Courier adapters (Steadfast, RedX, Pathao).
  - `BillingModule`: Storage and fulfillment fee ledger, COD settlement.
- **Rationale**: In-memory module communication avoids network latency, simplifies transactions, and speeds up feature delivery. If a specific module needs to scale independently in the future, its clean boundary allows seamless extraction into a microservice.

### 3. Background Job Queues with Redis + BullMQ
- **Decision**: Offload non-blocking, heavy side-effects to **BullMQ** running on Redis 7+:
  - `jobs.pdf`: Asynchronous PDF/label generation for custom memo invoices and shipping slips.
  - `jobs.webhooks`: Outbound merchant notifications with retry and exponential backoff.
  - `jobs.couriers`: Asynchronous courier consignment creation and status polling.
- **Rationale**: Keeps REST API responses snappy (<50ms) while guaranteeing that slow third-party courier APIs or heavy PDF rendering never block warehouse packing operations.

### 4. Custom Memo / Invoice Code Architecture
- **Decision**: Store merchant invoice schemas in PostgreSQL as JSONB document ASTs. Assign each schema an immutable `memo_code` (e.g., `MEMO-FESTIVE-01`).
- **Execution Flow**:
  1. Merchant configures invoice components (logo, header, font size, border, terms) in the Next.js visual designer.
  2. Order ingestion receives `memo_code` in the payload.
  3. At the warehouse Packing Station, upon completing 100% item barcode verification, the packing station triggers the memo worker.
  4. The worker loads the memo template, binds order data, renders the PDF/ZPL label, and sends it directly to the packing station printer.

### 5. Frontend Architecture (Next.js + Tailwind + shadcn/ui)
- **Decision**: Unified Next.js App Router application with role-based access:
  - `/portal/*`: Merchant SaaS dashboard (inventory, orders, billing, memo designer, API keys).
  - `/wms/*`: Warehouse operator interface (inbound receiving, pick lists, packing station, courier dispatch).
  - `/admin/*`: Fulfillio platform administration (merchant approvals, courier credentials, system health).
- **Scanner Integration**: Web component wrapping `html5-qrcode` for camera devices, combined with global `keydown` event buffer listeners for standard USB/Bluetooth barcode scanners.

## Risks / Trade-offs

- **[Risk] High Concurrency on Hot SKUs During Flash Sales**:
  - *Mitigation*: Stock reservations in PostgreSQL execute within transactions using atomic SQL updates (`UPDATE inventory SET available = available - :qty, reserved = reserved + :qty WHERE id = :id AND available >= :qty`).
- **[Risk] PDF Rendering CPU Spikes**:
  - *Mitigation*: The BullMQ PDF worker runs in a separate worker container or thread pool with bounded concurrency, preventing CPU exhaustion on the main API process.

## Deployment Strategy

- **Containerization**: Standard Docker Compose file orchestrating:
  - `api`: NestJS Backend Monolith.
  - `web`: Next.js Frontend.
  - `postgres`: PostgreSQL 16 with persistent volume.
  - `redis`: Redis 7 Alpine with persistent AOF.
  - `caddy`: Reverse proxy providing automated Let's Encrypt SSL/TLS certificates for `fulfillio.online`.
