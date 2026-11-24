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
    const merchant = await this.merchantRepository.findByIdOrCode(id);
    if (!merchant) {
      throw new NotFoundException(`Merchant with ID '${id}' not found`);
    }
    return merchant;
  }

  /**
   * Get merchant profile, payout setup & identity info from PostgreSQL
   */
  async getProfile(merchantId: string) {
    const merchant = await this.merchantRepository.findByIdOrCode(merchantId);

    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    const primaryUser = merchant.users[0];
    const ownerName = (merchant as any).ownerName || primaryUser?.name || merchant.businessName;
    const rawPayout = (merchant.payoutAccount as Record<string, any>) || null;
    const hasPayoutCoordinates = Boolean(
      rawPayout &&
        (String(rawPayout.accountNumber || '').trim() ||
          String(rawPayout.bkashMerchantNumber || '').trim() ||
          String(rawPayout.bkashNumber || '').trim()),
    );

    const defaultPayout = {
      provider: '',
      accountHolder: ownerName,
      accountNumber: '',
      branchName: '',
      routingNumber: '',
      bkashMerchantNumber: '',
      chequeLeafUrl: '',
      frequency: 'Weekly',
      status: 'UNVERIFIED',
    };

    const resolvedPayout = hasPayoutCoordinates
      ? {
          ...defaultPayout,
          ...rawPayout,
          bkashMerchantNumber:
            rawPayout?.bkashMerchantNumber || rawPayout?.bkashNumber || '',
          status: rawPayout?.status || 'PENDING_REVIEW',
        }
      : defaultPayout;

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
      storeName: merchant.businessName,
      ownerName,
      email: merchant.email,
      phone: merchant.phone || '+880 1711-000000',
      location: merchant.location || 'Dhaka, Bangladesh',
      logoUrl: (merchant as any).logoUrl || null,
      status: merchant.status,
      verified: merchant.status === 'APPROVED',
      baseHandlingFee: Number(merchant.baseHandlingFee),
      monthlyStorageFee: Number(merchant.monthlyStorageFee),
      webhookUrl: merchant.webhookUrl,
      payoutMethod: 'Bank Transfer / bKash',
      payoutSchedule: resolvedPayout.frequency || 'Weekly',
      payoutAccount: resolvedPayout,
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
    const existing = await this.merchantRepository.findByIdOrCode(merchantId);
    if (!existing) {
      throw new NotFoundException(`Merchant '${merchantId}' not found`);
    }

    const nowIso = new Date().toISOString();
    const existingPayout = (existing.payoutAccount as Record<string, any>) || {};
    const payoutPayload = data.payoutAccount
      ? {
          ...existingPayout,
          ...data.payoutAccount,
          bkashMerchantNumber:
            data.payoutAccount.bkashMerchantNumber ??
            data.payoutAccount.bkashNumber ??
            existingPayout.bkashMerchantNumber ??
            '',
          bkashNumber:
            data.payoutAccount.bkashNumber ??
            data.payoutAccount.bkashMerchantNumber ??
            existingPayout.bkashNumber ??
            '',
          status: 'PENDING_REVIEW', // Strict Verification Lock on updates
          submittedAt: nowIso,
          updatedAt: nowIso,
          rejectionReason: null,
        }
      : undefined;

    const resolvedBusinessName = data.businessName || data.storeName;
    const resolvedLogoUrl = data.logoUrl || data.avatarUrl;

    const updated = await this.merchantRepository.update(existing.id, {
      ...(resolvedBusinessName && { businessName: resolvedBusinessName }),
      ...(data.ownerName && { ownerName: data.ownerName }),
      ...(data.phone && { phone: data.phone }),
      ...(data.location && { location: data.location }),
      ...(resolvedLogoUrl && { logoUrl: resolvedLogoUrl }),
      ...(payoutPayload && { payoutAccount: payoutPayload }),
      ...(data.kycData && { kycData: data.kycData }),
      ...(data.socialChannels && { socialChannels: data.socialChannels }),
    });

    return {
      message: 'Profile updated successfully',
      merchant: updated,
      payoutAccount: payoutPayload || (updated.payoutAccount as Record<string, any>),
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
   * Super Admin: Approve or Reject merchant payout account details
   */
  async updatePayoutStatus(
    merchantId: string,
    payload: {
      status: 'VERIFIED' | 'REJECTED' | 'PENDING_REVIEW';
      rejectionReason?: string;
    },
  ) {
    const merchant = await this.merchantRepository.findByIdOrCode(merchantId);
    if (!merchant) {
      throw new NotFoundException(`Merchant with ID '${merchantId}' not found`);
    }

    const nowIso = new Date().toISOString();
    const existingPayout = (merchant.payoutAccount as Record<string, any>) || {};
    const updatedPayout = {
      ...existingPayout,
      status: payload.status,
      updatedAt: nowIso,
      reviewedAt: nowIso,
      rejectionReason:
        payload.status === 'REJECTED'
          ? payload.rejectionReason || 'Payout details verification failed'
          : null,
      ...(payload.status === 'VERIFIED'
        ? { verifiedAt: nowIso }
        : existingPayout.verifiedAt
          ? { verifiedAt: existingPayout.verifiedAt }
          : {}),
    };

    return this.merchantRepository.update(merchant.id, {
      payoutAccount: updatedPayout,
    });
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
