import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantStatus } from '@fulfillio/contracts';

@Injectable()
export class MerchantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(options: {
    status?: MerchantStatus;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
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

    return this.prisma.merchant.findMany({
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
  }

  async countAll(options: { status?: MerchantStatus; search?: string }) {
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
    return this.prisma.merchant.count({ where });
  }

  async findById(id: string) {
    return this.prisma.merchant.findUnique({
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
  }

  async findByCode(merchantCode: string) {
    return this.prisma.merchant.findUnique({
      where: { merchantCode },
      include: {
        users: { select: { name: true, email: true, role: true } },
      },
    });
  }

  async update(idOrCode: string, data: any) {
    const clean = (idOrCode || '').trim();
    const codeCandidate = clean.toUpperCase();
    const codeFromLocalId = clean.toLowerCase().startsWith('m-')
      ? `MC-${clean.slice(2)}`.toUpperCase()
      : codeCandidate;

    const existing = await this.prisma.merchant.findFirst({
      where: {
        OR: [
          { id: clean },
          { merchantCode: codeCandidate },
          { merchantCode: codeFromLocalId },
          { email: clean.toLowerCase() },
        ],
      },
    });

    if (!existing) {
      throw new Error(`Merchant '${idOrCode}' not found to update.`);
    }

    return this.prisma.merchant.update({
      where: { id: existing.id },
      data,
    });
  }

  async getDashboardCounts(merchantId: string) {
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
  }
}
