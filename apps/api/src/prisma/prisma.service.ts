import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('[Prisma] Successfully connected to PostgreSQL database.');
      await this.ensureOrderSchemaCompatibility();
    } catch (err: any) {
      console.warn('[Prisma] Database connection skipped or offline:', err.message);
    }
  }

  async ensureOrderSchemaCompatibility() {
    try {
      await this.$executeRawUnsafe(`
        -- 1. Ensure Enums
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderStatus') THEN
            CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ON_HOLD_STOCK', 'ON_HOLD_FRAUD', 'ALLOCATED', 'PICKING', 'PACKED', 'DISPATCHED', 'DELIVERED', 'PARTIAL_DELIVERED', 'RETURNED', 'CANCELLED');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CourierProvider') THEN
            CREATE TYPE "CourierProvider" AS ENUM ('STEADFAST', 'PATHAO', 'REDX', 'PAPERFLY', 'CUSTOM');
          END IF;
        END $$;

        -- 2. Ensure orders table columns
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

        -- 3. Ensure order_items table columns
        ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "productTitle" TEXT;
        ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "variantLabel" TEXT;
        ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "sku" TEXT;
        ALTER TABLE "order_items" ALTER COLUMN "variantId" DROP NOT NULL;
      `);
      console.log('[Prisma] Orders and order_items database tables synchronized.');
    } catch (err: any) {
      console.warn('[Prisma] Schema auto-sync notice:', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
