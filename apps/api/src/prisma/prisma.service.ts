import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UserRole, MerchantStatus } from '@fulfillio/contracts';
import * as bcrypt from 'bcrypt';
import { FallbackStore } from './fallback-store';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public isConnected = false;
  public readonly fallbackStore = FallbackStore.getInstance();

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      console.log('[Prisma] Successfully connected to PostgreSQL database at localhost:5432.');
      await this.runSelfHealingMigrations();
      await this.ensureOrderSchemaCompatibility();
      await this.ensureCoreSeedData();
    } catch (err: any) {
      this.isConnected = false;
      console.error('[Prisma] Failed to connect to PostgreSQL at localhost:5432:', err?.message || err);
    }
  }

  isOffline(): boolean {
    return false;
  }

  async runSelfHealingMigrations() {
    try {
      // Ensure products table has images and status columns if it was created on an older schema
      await this.$executeRawUnsafe(`
        ALTER TABLE IF EXISTS "products" 
        ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT ARRAY[]::text[];
        ALTER TABLE IF EXISTS "products" 
        ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PUBLISHED';
      `);
    } catch (err: any) {
      console.warn('[Prisma] Self-healing migration notice:', err?.message || err);
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

  async ensureCoreSeedData() {
    try {
      const passwordHash = await bcrypt.hash('admin123', 10);

      await this.user.upsert({
        where: { email: 'admin@fulfillio.online' },
        update: {},
        create: {
          name: 'Super Admin',
          email: 'admin@fulfillio.online',
          passwordHash,
          role: UserRole.SUPER_ADMIN,
        },
      });

      const defaultMerchants = [
        {
          merchantCode: 'MC-101',
          businessName: "Sabbir's Store",
          email: 'sabbir@sabbirstore.com',
          phone: '01711-223344',
          location: 'Dhanmondi, Dhaka',
        },
        {
          merchantCode: 'MC-102',
          businessName: 'TechGear BD',
          email: 'contact@techgearbd.com',
          phone: '01911-889900',
          location: 'Bashundhara City, Panthapath, Dhaka',
        },
        {
          merchantCode: 'MC-103',
          businessName: 'Modest Wear BD',
          email: 'orders@modestwearbd.com',
          phone: '01755-667788',
          location: 'Shah Ali Plaza, Mirpur 10, Dhaka',
        },
        {
          merchantCode: 'MC-106',
          businessName: 'Fulfillio Partner Store',
          email: 'merchant106@fulfillio.online',
          phone: '01700-000106',
          location: 'Dhaka, Bangladesh',
        },
      ];

      for (const m of defaultMerchants) {
        const merchant = await this.merchant.upsert({
          where: { merchantCode: m.merchantCode },
          update: {},
          create: {
            merchantCode: m.merchantCode,
            businessName: m.businessName,
            email: m.email,
            phone: m.phone,
            location: m.location,
            status: MerchantStatus.APPROVED,
          },
        });

        await this.user.upsert({
          where: { email: m.email },
          update: {},
          create: {
            name: m.businessName,
            email: m.email,
            passwordHash,
            merchantId: merchant.id,
            role: UserRole.MERCHANT,
          },
        });
      }

      await this.inventoryLocation.upsert({
        where: { binCode: 'A-01-01' },
        update: {},
        create: {
          zone: 'Z1',
          aisle: 'A01',
          rack: 'R01',
          shelf: 'S01',
          binCode: 'A-01-01',
          isDamaged: false,
        },
      });

      console.log('[Prisma] Core merchants (MC-101, MC-102, MC-103, MC-106) and Super Admin verified in PostgreSQL.');
    } catch (err: any) {
      console.warn('[Prisma] Core seed check notice:', err?.message || err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
