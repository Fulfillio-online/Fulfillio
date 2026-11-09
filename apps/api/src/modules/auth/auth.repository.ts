import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@fulfillio/contracts';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { merchant: true },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { merchant: true },
    });
  }

  async findOperatorByCodeOrEmail(operatorCode: string) {
    return this.prisma.user.findFirst({
      where: {
        role: UserRole.WAREHOUSE_OPERATOR,
        OR: [{ email: operatorCode }, { name: { contains: operatorCode, mode: 'insensitive' } }],
      },
      include: { merchant: true },
    });
  }

  async registerMerchantWithUser(data: {
    businessName: string;
    ownerName?: string;
    email: string;
    phone?: string;
    passwordHash: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.merchant.count();
      const merchantCode = `MC-${101 + count}`;

      const merchant = await tx.merchant.create({
        data: {
          merchantCode,
          businessName: data.businessName,
          email: data.email,
          phone: data.phone,
          status: 'PENDING',
        },
      });

      const user = await tx.user.create({
        data: {
          merchantId: merchant.id,
          name: data.ownerName || data.businessName,
          email: data.email,
          passwordHash: data.passwordHash,
          role: UserRole.MERCHANT,
        },
      });

      return {
        merchantId: merchant.id,
        merchantCode: merchant.merchantCode,
        businessName: merchant.businessName,
        ownerName: user.name,
        email: merchant.email,
        phone: merchant.phone,
        userId: user.id,
        status: merchant.status,
      };
    });
  }

  async updateMerchantApiKey(merchantId: string, apiKeyHash: string) {
    return this.prisma.merchant.update({
      where: { id: merchantId },
      data: { apiKeyHash },
    });
  }
}
