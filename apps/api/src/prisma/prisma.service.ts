import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('[Prisma] Successfully connected to PostgreSQL database.');
      await this.runSelfHealingMigrations();
    } catch (err: any) {
      console.warn('[Prisma] Database connection skipped or offline. API running with offline resilience:', err.message);
    }
  }

  async runSelfHealingMigrations() {
    try {
      // Ensure products table has images column if it was created on an older schema
      await this.$executeRawUnsafe(`
        ALTER TABLE IF EXISTS "products" 
        ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT ARRAY[]::text[];
      `);
    } catch (err: any) {
      console.warn('[Prisma] Self-healing migration notice:', err?.message || err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
