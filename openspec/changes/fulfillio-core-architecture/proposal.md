# Proposal: Fulfillio Core Architecture & Domain Foundations

## Why

E-commerce businesses need fast, dependable 3PL fulfillment while maintaining control over their storefronts, stock visibility, and customer-facing brand experience. Traditional WMS solutions are either rigid, single-tenant, or offer generic, unbranded packing slips.

Fulfillio solves this by providing a high-speed, multi-tenant 3PL and WMS platform (`fulfillio.online`) built on a **Pragmatic Modular Monolith architecture**. Merchants connect their stores (WooCommerce, Shopify, custom APIs), synchronize inventory in real time, and customize their branded invoices using unique **Memo Codes**. For warehouse operations, it provides an ergonomic, scan-driven order fulfillment workflow (Pick Lists -> Packing Station -> Courier Dispatch -> Returns) with zero race conditions on inventory.

## What Changes

This change introduces the foundational architecture, domain models, database schemas, and integration contracts for Fulfillio:
- **Pragmatic Modular Monolith Architecture**: A single NestJS backend process organized into high-cohesion domain modules, eliminating distributed network overhead and gRPC microservice complexity.
- **Unified Transactional Data Layer**: PostgreSQL 16+ as the single source of truth for both relational entities and dynamic memo layout schemas (using JSONB), eliminating dual-database sync lag and ensuring strict ACID guarantees.
- **Asynchronous Event Pipeline**: BullMQ + Redis for background job execution (`jobs.pdf` for invoice rendering, `jobs.webhooks` for merchant event dispatch, and `jobs.couriers` for consignment booking).
- **Merchant Plugin / Integration Layer**: Public REST API, API key authentication with HMAC signature verification, webhook subscription engine, and eCommerce store sync hooks.
- **Warehouse Execution Engine**: Mobile/desktop barcode scanning (`html5-qrcode` & USB scanner), wave/batch pick lists, item-level scan verification at packing stations, and automated courier manifest handovers.
- **Custom Memo Code Engine**: Merchant-designed invoice/memo templates with assigned `memo_code` attributes, rendered and printed dynamically during warehouse packing.
- **Logistics & Settlement**: Courier API gateways (Steadfast, RedX, Pathao), automated shipping labels, tracking sync, and COD settlement reconciliation.

## Capabilities

### New Capabilities
- `merchant-integration`: Merchant registration, approval, API keys, Webhook subscriptions, and plugin connectors (WooCommerce, Shopify, custom REST).
- `inventory-management`: Multi-tenant SKU and variant catalog, warehouse bin/shelf/aisle locations, atomic stock reservation, and cycle counts.
- `order-fulfillment`: End-to-end order state machine, batch/wave pick list generation, and barcode-driven packing station verification.
- `memo-engine`: Custom visual invoice/memo designer, unique `Memo Code` assignment, and dynamic PDF/label generation during packing.
- `dispatch-logistics`: Courier API integrations, shipping label generation, courier handover manifesting, and RTO/return processing.
- `billing-settlement`: Storage fee calculation, pick-and-pack handling charges, COD collection tracking, and merchant payout reconciliations.

### Modified Capabilities
*(None - Initial baseline)*

## Impact
- **Backend**: Establishes NestJS modular monolith architecture with BullMQ job queues and REST endpoints.
- **Database**: Creates PostgreSQL relational tables with RLS and JSONB columns for memo templates.
- **Frontend**: Next.js App Router workspace with Tailwind CSS, shadcn/ui components, and barcode scanning modules.
- **Infrastructure**: Multi-container Docker Compose setup with Caddy reverse proxy for automated TLS on standard VPS.
