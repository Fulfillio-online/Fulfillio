import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantStatus } from '@fulfillio/contracts';

@Injectable()
export class MerchantRepository {
  constructor(private readonly prisma: PrismaService) {}

  private isConnectionError(err: any): boolean {
    return (
      err?.name === 'PrismaClientInitializationError' ||
      err?.name === 'PrismaClientRustPanicError' ||
      err?.code === 'P1001' ||
      err?.code === 'P1002' ||
      err?.message?.includes("Can't reach database server") ||
      err?.message?.includes('connect ECONNREFUSED')
    );
  }

  async findAll(options: {
    status?: MerchantStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.findMerchants().map((m) => ({
        ...m,
        users: [],
        _count: { orders: 0, products: 0, memoTemplates: 0, inboundShipments: 0 },
      })) as any;
    }

    const { status, search, limit = 50, offset = 0 } = options;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { merchantCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    try {
      return await this.prisma.merchant.findMany({
        where,
        include: {
          users: { select: { name: true, email: true, role: true } },
          _count: {
            select: {
              orders: true,
              products: true,
              memoTemplates: true,
              inboundShipments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        return this.prisma.fallbackStore.findMerchants().map((m) => ({
          ...m,
          users: [],
          _count: { orders: 0, products: 0, memoTemplates: 0, inboundShipments: 0 },
        })) as any;
      }
      throw err;
    }
  }

  async countAll(options: { status?: MerchantStatus; search?: string }) {
    if (this.prisma.isOffline()) {
      return this.prisma.fallbackStore.findMerchants().length;
    }
    const { status, search } = options;
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { merchantCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    try {
      return await this.prisma.merchant.count({ where });
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        return this.prisma.fallbackStore.findMerchants().length;
      }
      throw err;
    }
  }

  async findById(id: string) {
    if (this.prisma.isOffline()) {
      const m = this.prisma.fallbackStore.findMerchantById(id);
      if (!m) return null;
      return {
        ...m,
        users: [],
        memoTemplates: [],
        _count: { orders: 0, products: 0, settlements: 0, inboundShipments: 0 },
      } as any;
    }

    try {
      return await this.prisma.merchant.findUnique({
        where: { id },
        include: {
          users: { select: { name: true, email: true, role: true } },
          memoTemplates: true,
          _count: {
            select: {
              orders: true,
              products: true,
              settlements: true,
              inboundShipments: true,
            },
          },
        },
      });
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        const m = this.prisma.fallbackStore.findMerchantById(id);
        if (!m) return null;
        return {
          ...m,
          users: [],
          memoTemplates: [],
          _count: { orders: 0, products: 0, settlements: 0, inboundShipments: 0 },
        } as any;
      }
      throw err;
    }
  }

  async findByCode(merchantCode: string) {
    if (this.prisma.isOffline()) {
      const m = this.prisma.fallbackStore.findMerchantById(merchantCode);
      if (!m) return null;
      return { ...m, users: [] } as any;
    }
    try {
      return await this.prisma.merchant.findUnique({
        where: { merchantCode },
        include: {
          users: { select: { name: true, email: true, role: true } },
        },
      });
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        const m = this.prisma.fallbackStore.findMerchantById(merchantCode);
        if (!m) return null;
        return { ...m, users: [] } as any;
      }
      throw err;
    }
  }

  async update(id: string, data: any) {
    if (this.prisma.isOffline()) {
      const m = this.prisma.fallbackStore.findMerchantById(id);
      if (m) Object.assign(m, data);
      return m as any;
    }
    try {
      return await this.prisma.merchant.update({
        where: { id },
        data,
      });
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        const m = this.prisma.fallbackStore.findMerchantById(id);
        if (m) Object.assign(m, data);
        return m as any;
      }
      throw err;
    }
  }

  async getDashboardCounts(merchantId: string) {
    if (this.prisma.isOffline()) {
      const prods = this.prisma.fallbackStore.findProducts(merchantId);
      return {
        totalOrders: 0,
        pendingOrders: 0,
        totalProducts: prods.length,
        inboundShipments: 0,
        memoTemplates: [],
      };
    }
    try {
      const [totalOrders, pendingOrders, totalProducts, memoTemplates, inboundShipments] =
        await Promise.all([
          this.prisma.order.count({ where: { merchantId } }),
          this.prisma.order.count({ where: { merchantId, status: 'PENDING' } }),
          this.prisma.product.count({ where: { merchantId } }),
          this.prisma.memoTemplate.findMany({
            where: { merchantId },
            select: { id: true, memoCode: true, name: true, isDefault: true, updatedAt: true },
          }),
          this.prisma.inboundShipment.count({ where: { merchantId } }),
        ]);

      return {
        totalOrders,
        pendingOrders,
        totalProducts,
        inboundShipments,
        memoTemplates,
      };
    } catch (err: any) {
      if (this.isConnectionError(err)) {
        this.prisma.isConnected = false;
        const prods = this.prisma.fallbackStore.findProducts(merchantId);
        return {
          totalOrders: 0,
          pendingOrders: 0,
          totalProducts: prods.length,
          inboundShipments: 0,
          memoTemplates: [],
        };
      }
      throw err;
    }
  }
}
