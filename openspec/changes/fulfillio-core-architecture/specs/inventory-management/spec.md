# Spec Delta: Inventory Management

## Purpose

Provides real-time warehouse inventory tracking, multi-tenant SKU and variant management, physical bin/shelf location mapping, atomic stock allocation, and cycle counts.

## ADDED Requirements

### Requirement: Product SKU and Variant Catalog
The system SHALL maintain a product catalog per merchant supporting unique SKUs, barcode mappings, attribute variants, and product images.

#### Scenario: Create new product with variants
- **WHEN** a merchant submits a product with distinct size and color variants and unique SKUs
- **THEN** the system registers each variant with an independent barcode and stock tracking record

### Requirement: Real-Time Stock Allocation and Reservation
The system SHALL atomically reserve available warehouse stock upon order creation to prevent negative inventory and double-selling.

#### Scenario: Successful stock reservation
- **WHEN** an order is placed for an in-stock SKU
- **THEN** the system decrements available quantity, increments reserved quantity, and confirms allocation atomically

#### Scenario: Insufficient stock handling
- **WHEN** an order requests quantity exceeding currently available stock
- **THEN** the system marks the order as backordered or out-of-stock without reducing available inventory below zero

### Requirement: Warehouse Location Tracking
The system SHALL assign inventory units to discrete physical warehouse locations consisting of zone, aisle, rack, shelf, and bin coordinates.

#### Scenario: Inbound stock put-away
- **WHEN** a warehouse operator scans an incoming product barcode and target bin barcode
- **THEN** the system records the item quantity at that specific bin location and updates total warehouse stock

### Requirement: Stock Adjustment and Cycle Count
The system SHALL allow warehouse managers to perform periodic cycle counts and record auditable stock adjustments with reason codes.

#### Scenario: Record cycle count discrepancy
- **WHEN** a cycle count reveals a mismatch between physical count and system records
- **THEN** the system adjusts the stock balance, logs an immutable audit event with manager notes, and notifies the merchant
