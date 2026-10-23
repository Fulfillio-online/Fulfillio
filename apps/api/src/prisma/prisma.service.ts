import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('[Prisma] Successfully connected to PostgreSQL database.');
    } catch (err: any) {
      console.warn('[Prisma] Database connection skipped or offline. API running with offline resilience:', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
