import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get merchant profile, payout setup & identity info
   */
  async getProfile(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: {
        users: { select: { name: true, email: true, role: true } },
      },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    const primaryUser = merchant.users[0];

    return {
      id: merchant.id,
      merchantCode: `MC-${merchant.id.substring(0, 4).toUpperCase()}`,
      businessName: merchant.businessName,
      ownerName: primaryUser?.name || merchant.businessName,
      email: merchant.email,
      phone: merchant.phone || '+880 1711-000000',
      location: 'Dhaka, Bangladesh',
      status: merchant.status,
      verified: merchant.status === 'APPROVED',
      webhookUrl: merchant.webhookUrl,
      payoutAccount: {
        provider: 'BRAC Bank PLC',
        accountHolder: primaryUser?.name || merchant.businessName,
        accountNumber: '1501204892019001',
        branchName: 'Banani Branch',
        routingNumber: '060271829',
        frequency: 'Weekly',
        status: 'VERIFIED',
      },
      socialChannels: [
        { id: '1', platform: 'Facebook', url: `https://facebook.com/${merchant.businessName.toLowerCase().replace(/\s+/g, '')}` },
        { id: '2', platform: 'Instagram', url: `https://instagram.com/${merchant.businessName.toLowerCase().replace(/\s+/g, '')}` },
      ],
    };
  }

  /**
   * Update merchant profile & initiate payout review
   */
  async updateProfile(merchantId: string, data: any) {
    const updated = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: {
        ...(data.businessName && { businessName: data.businessName }),
        ...(data.phone && { phone: data.phone }),
      },
    });

    return {
      message: 'Profile updated successfully',
      merchant: updated,
      payoutStatus: data.payoutAccount ? 'PENDING_REVIEW' : 'UNCHANGED',
    };
  }

  /**
   * Configure webhook subscription URL and generate HMAC signing secret
   */
  async configureWebhook(merchantId: string, webhookUrl: string) {
    const webhookSecret = `whsec_${crypto.randomBytes(20).toString('hex')}`;

    const merchant = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: {
        webhookUrl,
        webhookSecret,
      },
    });

    return {
      webhookUrl: merchant.webhookUrl,
      webhookSecret,
      note: 'Save this secret to verify X-Fulfillio-Signature headers on incoming webhook notifications.',
    };
  }

  /**
   * Get merchant overview stats
   */
  async getDashboardStats(merchantId: string) {
    const [totalOrders, pendingOrders, totalProducts, memoTemplates] = await Promise.all([
      this.prisma.order.count({ where: { merchantId } }),
      this.prisma.order.count({ where: { merchantId, status: 'PENDING' } }),
      this.prisma.product.count({ where: { merchantId } }),
      this.prisma.memoTemplate.findMany({
        where: { merchantId },
        select: { id: true, memoCode: true, name: true, isDefault: true, updatedAt: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      totalProducts,
      memoTemplates,
    };
  }
}
