-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MERCHANT', 'WAREHOUSE_OPERATOR', 'COURIER_AGENT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ALLOCATED', 'PICKING', 'PACKED', 'DISPATCHED', 'DELIVERED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CourierProvider" AS ENUM ('STEADFAST', 'PATHAO', 'REDX', 'PAPERFLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "merchants" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "MerchantStatus" NOT NULL DEFAULT 'PENDING',
    "apiKeyHash" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MERCHANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "baseSku" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "title" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_locations" (
    "id" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "aisle" TEXT NOT NULL,
    "rack" TEXT NOT NULL,
    "shelf" TEXT NOT NULL,
    "binCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quantityAvailable" INTEGER NOT NULL DEFAULT 0,
    "quantityReserved" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "externalOrderId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "city" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "memoCode" TEXT DEFAULT 'MEMO-DEFAULT',
    "courierProvider" "CourierProvider",
    "consignmentId" TEXT,
    "trackingCode" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "codAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "isVerifiedAtPacking" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memo_templates" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "memoCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memo_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "cycleStart" TIMESTAMP(3) NOT NULL,
    "cycleEnd" TIMESTAMP(3) NOT NULL,
    "totalCodCollected" DECIMAL(10,2) NOT NULL,
    "storageFees" DECIMAL(10,2) NOT NULL,
    "handlingFees" DECIMAL(10,2) NOT NULL,
    "netPayout" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- Indexes for performance & RLS
CREATE UNIQUE INDEX "merchants_email_key" ON "merchants"("email");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_merchantId_idx" ON "users"("merchantId");

CREATE INDEX "products_merchantId_idx" ON "products"("merchantId");
CREATE UNIQUE INDEX "products_merchantId_baseSku_key" ON "products"("merchantId", "baseSku");

CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

CREATE UNIQUE INDEX "inventory_locations_binCode_key" ON "inventory_locations"("binCode");
CREATE INDEX "inventory_items_variantId_idx" ON "inventory_items"("variantId");
CREATE INDEX "inventory_items_locationId_idx" ON "inventory_items"("locationId");
CREATE UNIQUE INDEX "inventory_items_variantId_locationId_key" ON "inventory_items"("variantId", "locationId");

CREATE INDEX "orders_merchantId_status_idx" ON "orders"("merchantId", "status");
CREATE INDEX "orders_memoCode_idx" ON "orders"("memoCode");
CREATE INDEX "orders_trackingCode_idx" ON "orders"("trackingCode");

CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX "order_items_variantId_idx" ON "order_items"("variantId");

CREATE INDEX "memo_templates_merchantId_idx" ON "memo_templates"("merchantId");
CREATE UNIQUE INDEX "memo_templates_merchantId_memoCode_key" ON "memo_templates"("merchantId", "memoCode");
CREATE INDEX "idx_memo_templates_layout_gin" ON "memo_templates" USING gin ("layout");

CREATE INDEX "settlements_merchantId_idx" ON "settlements"("merchantId");

-- Foreign Keys
ALTER TABLE "users" ADD CONSTRAINT "users_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "inventory_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "memo_templates" ADD CONSTRAINT "memo_templates_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (RLS) for multi-tenant isolation
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memo_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settlements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY merchant_isolation_products ON "products"
  FOR ALL
  USING ("merchantId" = NULLIF(current_setting('app.current_merchant_id', true), ''))
  WITH CHECK ("merchantId" = NULLIF(current_setting('app.current_merchant_id', true), ''));

CREATE POLICY merchant_isolation_orders ON "orders"
  FOR ALL
  USING ("merchantId" = NULLIF(current_setting('app.current_merchant_id', true), ''))
  WITH CHECK ("merchantId" = NULLIF(current_setting('app.current_merchant_id', true), ''));

CREATE POLICY merchant_isolation_memo_templates ON "memo_templates"
  FOR ALL
  USING ("merchantId" = NULLIF(current_setting('app.current_merchant_id', true), ''))
  WITH CHECK ("merchantId" = NULLIF(current_setting('app.current_merchant_id', true), ''));

CREATE POLICY merchant_isolation_settlements ON "settlements"
  FOR ALL
  USING ("merchantId" = NULLIF(current_setting('app.current_merchant_id', true), ''))
  WITH CHECK ("merchantId" = NULLIF(current_setting('app.current_merchant_id', true), ''));
