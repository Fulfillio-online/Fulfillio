import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { FallbackStore } from './fallback-store';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public isConnected = false;
  public readonly fallbackStore = FallbackStore.getInstance();

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      console.log('[Prisma] Successfully connected to PostgreSQL database.');
      await this.runSelfHealingMigrations();
    } catch (err: any) {
      this.isConnected = false;
      console.warn('[Prisma] PostgreSQL database server is offline (no local Docker/PostgreSQL detected).');
      console.log('[Prisma] Activated Zero-Setup Local Persistence Engine. Products & merchants will be saved seamlessly!');
    }
  }

  isOffline(): boolean {
    return !this.isConnected;
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
