-- PostgreSQL / pgAdmin Migration: Orders and Order Items Tables
-- Ensures orders and order_items tables exist with all columns for pgAdmin direct view & storage

-- 1. Ensure Enums exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
        CREATE TYPE "OrderStatus" AS ENUM (
            'PENDING',
            'ON_HOLD_STOCK',
            'ON_HOLD_FRAUD',
            'ALLOCATED',
            'PICKING',
            'PACKED',
            'DISPATCHED',
            'DELIVERED',
            'PARTIAL_DELIVERED',
            'RETURNED',
            'CANCELLED'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CourierProvider') THEN
        CREATE TYPE "CourierProvider" AS ENUM (
            'STEADFAST',
            'PATHAO',
            'REDX',
            'PAPERFLY',
            'CUSTOM'
        );
    END IF;
END $$;

-- 2. Create "orders" table if it does not exist
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "externalOrderId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "city" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "memoCode" TEXT DEFAULT 'MEMO-DEFAULT',
    "isMemoPrinted" BOOLEAN NOT NULL DEFAULT false,
    "memoPrintedAt" TIMESTAMP(3),
    "packagingType" TEXT DEFAULT 'POLY_SMALL',
    "packagingCost" DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    "customerRiskScore" INTEGER DEFAULT 92,
    "customerRiskLevel" TEXT DEFAULT 'SAFE',
    "courierProvider" "CourierProvider",
    "consignmentId" TEXT,
    "trackingCode" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "codAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(10,2) DEFAULT 0,
    "deliveryFee" DECIMAL(10,2) DEFAULT 0,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "advancePayment" DECIMAL(10,2) DEFAULT 0,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT DEFAULT 'Unpaid',
    "advancePaymentMethod" TEXT,
    "advanceTrxId" TEXT,
    "timeline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- 3. If table already exists, safely add any missing columns
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deliveryFee" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "advancePayment" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'Unpaid';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "advancePaymentMethod" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "advanceTrxId" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "timeline" JSONB;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "isMemoPrinted" BOOLEAN DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "memoPrintedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packagingType" TEXT DEFAULT 'POLY_SMALL';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "packagingCost" DECIMAL(10,2) DEFAULT 5.00;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerRiskScore" INTEGER DEFAULT 92;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customerRiskLevel" TEXT DEFAULT 'SAFE';

-- 4. Create "order_items" table if it does not exist
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT,
    "productTitle" TEXT,
    "variantLabel" TEXT,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "isVerifiedAtPacking" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- Safely add missing columns to order_items if table already existed
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "productTitle" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variantLabel" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "order_items" ALTER COLUMN "variantId" DROP NOT NULL;

-- 5. Foreign Keys & Indexes
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_merchantId_fkey'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_merchantId_fkey"
            FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_orderId_fkey'
    ) THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey"
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_variantId_fkey'
    ) THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey"
            FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "orders_merchantId_status_idx" ON "orders"("merchantId", "status");
CREATE INDEX IF NOT EXISTS "orders_memoCode_idx" ON "orders"("memoCode");
CREATE INDEX IF NOT EXISTS "orders_trackingCode_idx" ON "orders"("trackingCode");
CREATE INDEX IF NOT EXISTS "orders_customerPhone_idx" ON "orders"("customerPhone");
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX IF NOT EXISTS "order_items_variantId_idx" ON "order_items"("variantId");
