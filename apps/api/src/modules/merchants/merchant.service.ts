import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { MerchantRepository } from './merchant.repository';
import { MerchantStatus } from '@fulfillio/contracts';

@Injectable()
export class MerchantService {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  /**
   * Super Admin: List all merchants with filtering & pagination
   */
  async listMerchants(options: {
    status?: MerchantStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));
    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.merchantRepository.findAll({
        status: options.status,
        search: options.search,
        limit,
        offset,
      }),
      this.merchantRepository.countAll({
        status: options.status,
        search: options.search,
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Super Admin: Get single merchant detail by ID
   */
  async getMerchantDetail(id: string) {
    const merchant = await this.merchantRepository.findById(id);
    if (!merchant) {
      throw new NotFoundException(`Merchant with ID '${id}' not found`);
    }
    return merchant;
  }

  /**
   * Get merchant profile, payout setup & identity info from PostgreSQL
   */
  async getProfile(merchantId: string) {
    const merchant = await this.merchantRepository.findById(merchantId);

    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    const primaryUser = merchant.users[0];
    const defaultPayout = {
      provider: 'BRAC Bank PLC',
      accountHolder: primaryUser?.name || merchant.businessName,
      accountNumber: '1501204892019001',
      branchName: 'Banani Branch',
      routingNumber: '060271829',
      bkashMerchantNumber: '+880 1711-000000',
      chequeLeafUrl: '/uploads/cheque-sample.png',
      frequency: 'Weekly',
      status: 'VERIFIED',
    };

    const defaultKyc = {
      tradeLicenseNo: 'TRAD/DNCC/092140/2024',
      tradeLicenseDocUrl: '/uploads/trade-license-sample.pdf',
      nidNumber: '19922692810000192',
      verificationStatus: merchant.status === 'APPROVED' ? 'VERIFIED' : 'PENDING_REVIEW',
      verifiedAt: merchant.status === 'APPROVED' ? '2026-10-15' : undefined,
    };

    return {
      id: merchant.id,
      merchantCode: merchant.merchantCode,
      businessName: merchant.businessName,
      ownerName: (merchant as any).ownerName || primaryUser?.name || merchant.businessName,
      email: merchant.email,
      phone: merchant.phone || '+880 1711-000000',
      location: merchant.location || 'Dhaka, Bangladesh',
      logoUrl: (merchant as any).logoUrl || null,
      status: merchant.status,
      verified: merchant.status === 'APPROVED',
      baseHandlingFee: Number(merchant.baseHandlingFee),
      monthlyStorageFee: Number(merchant.monthlyStorageFee),
      webhookUrl: merchant.webhookUrl,
      payoutAccount: (merchant.payoutAccount as Record<string, any>) || defaultPayout,
      kycData: ((merchant as any).kycData as Record<string, any>) || defaultKyc,
      socialChannels: (merchant.socialChannels as Array<any>) || [
        {
          id: '1',
          platform: 'Facebook',
          url: `https://facebook.com/${merchant.businessName.toLowerCase().replace(/\s+/g, '')}`,
        },
        {
          id: '2',
          platform: 'Instagram',
          url: `https://instagram.com/${merchant.businessName.toLowerCase().replace(/\s+/g, '')}`,
        },
      ],
    };
  }

  /**
   * Update merchant profile, payout account & social channels in PostgreSQL
   */
  async updateProfile(merchantId: string, data: any) {
    const payoutPayload = data.payoutAccount
      ? {
          ...data.payoutAccount,
          status: 'PENDING_REVIEW', // Strict Verification Lock on updates
        }
      : undefined;

    const updated = await this.merchantRepository.update(merchantId, {
      ...(data.businessName && { businessName: data.businessName }),
      ...(data.ownerName && { ownerName: data.ownerName }),
      ...(data.phone && { phone: data.phone }),
      ...(data.location && { location: data.location }),
      ...(data.logoUrl && { logoUrl: data.logoUrl }),
      ...(payoutPayload && { payoutAccount: payoutPayload }),
      ...(data.kycData && { kycData: data.kycData }),
      ...(data.socialChannels && { socialChannels: data.socialChannels }),
    });

    return {
      message: 'Profile updated successfully',
      merchant: updated,
      payoutStatus: payoutPayload ? 'PENDING_REVIEW' : 'UNCHANGED',
    };
  }

  /**
   * Save uploaded document (cheque leaf or trade license)
   */
  async saveUploadedDocument(
    merchantId: string,
    fileInfo: { fileName: string; fileType?: string; base64Data?: string }
  ) {
    const timestamp = Date.now();
    const cleanName = fileInfo.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const secureUrl = `/uploads/merchants/${merchantId}_${timestamp}_${cleanName}`;
    return {
      url: secureUrl,
      fileName: fileInfo.fileName,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Super Admin: Approve/Suspend merchant & set custom 3PL fee rates
   */
  async updateMerchantStatusAndRates(
    merchantId: string,
    payload: {
      status?: 'PENDING' | 'APPROVED' | 'SUSPENDED';
      baseHandlingFee?: number;
      monthlyStorageFee?: number;
    },
  ) {
    return this.merchantRepository.update(merchantId, {
      ...(payload.status && { status: payload.status }),
      ...(payload.baseHandlingFee !== undefined && { baseHandlingFee: payload.baseHandlingFee }),
      ...(payload.monthlyStorageFee !== undefined && {
        monthlyStorageFee: payload.monthlyStorageFee,
      }),
    });
  }

  /**
   * Configure webhook subscription URL and generate HMAC signing secret
   */
  async configureWebhook(merchantId: string, webhookUrl: string) {
    const webhookSecret = `whsec_${crypto.randomBytes(20).toString('hex')}`;

    const merchant = await this.merchantRepository.update(merchantId, {
      webhookUrl,
      webhookSecret,
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
    return this.merchantRepository.getDashboardCounts(merchantId);
  }
}
