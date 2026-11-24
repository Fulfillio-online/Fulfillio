import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { MerchantService } from './merchant.service';
import { MerchantRepository } from './merchant.repository';
import { MerchantController } from './merchant.controller';

function createMockMerchantHarness() {
  const merchants: Array<Record<string, any>> = [
    {
      id: 'uuid-mc-102',
      merchantCode: 'MC-102',
      businessName: 'Azad Fashion House',
      ownerName: 'Azad Mia',
      email: 'azad@example.com',
      phone: '01711223344',
      location: 'Dhaka, Bangladesh',
      logoUrl: null,
      status: 'APPROVED',
      payoutAccount: null as Record<string, any> | null,
      kycData: null,
      socialChannels: null,
      baseHandlingFee: 50,
      monthlyStorageFee: 2500,
      webhookUrl: null,
      users: [{ name: 'Azad Mia', email: 'azad@example.com', role: 'MERCHANT' }],
      memoTemplates: [],
      _count: { orders: 0, products: 0, settlements: 0, inboundShipments: 0 },
    },
  ];

  const matchMerchant = (idOrCode: string) => {
    const clean = (idOrCode || '').trim();
    const upper = clean.toUpperCase();
    const fromLocal = clean.toLowerCase().startsWith('m-')
      ? `MC-${clean.slice(2)}`.toUpperCase()
      : upper;

    return (
      merchants.find(
        (m) =>
          m.id === clean ||
          m.merchantCode.toUpperCase() === upper ||
          m.merchantCode.toUpperCase() === fromLocal ||
          m.email.toLowerCase() === clean.toLowerCase(),
      ) || null
    );
  };

  const mockPrisma = {
    merchant: {
      findUnique: async ({ where }: any) =>
        merchants.find((m) => m.id === where.id || m.merchantCode === where.merchantCode) || null,
      findFirst: async ({ where }: any) => {
        const ors = where?.OR || [];
        for (const cond of ors) {
          if (cond.id) {
            const hit = merchants.find((m) => m.id === cond.id);
            if (hit) return hit;
          }
          if (cond.merchantCode?.equals) {
            const target = String(cond.merchantCode.equals).toUpperCase();
            const hit = merchants.find((m) => m.merchantCode.toUpperCase() === target);
            if (hit) return hit;
          }
          if (cond.email) {
            const hit = merchants.find((m) => m.email.toLowerCase() === cond.email.toLowerCase());
            if (hit) return hit;
          }
        }
        return null;
      },
      update: async ({ where, data }: any) => {
        const idx = merchants.findIndex((m) => m.id === where.id);
        if (idx < 0) throw new Error('Not found');
        merchants[idx] = { ...merchants[idx], ...data };
        return merchants[idx];
      },
    },
  } as any;

  const repository = new MerchantRepository(mockPrisma);
  const service = new MerchantService(repository);
  const controller = new MerchantController(service);

  return { merchants, repository, service, controller, matchMerchant };
}

describe('Merchant payout details submission & admin approval flow', () => {
  it('returns UNVERIFIED payout status and storeName when merchant has no payout details yet', async () => {
    const { service } = createMockMerchantHarness();

    const profile = await service.getProfile('MC-102');
    assert.equal(profile.merchantCode, 'MC-102');
    assert.equal(profile.storeName, 'Azad Fashion House');
    assert.equal(profile.businessName, 'Azad Fashion House');
    assert.equal(profile.payoutAccount.status, 'UNVERIFIED');
    assert.equal(profile.payoutAccount.accountNumber, '');
  });

  it('locks payoutAccount as PENDING_REVIEW on updateProfile and resolves by merchantCode', async () => {
    const { controller, service } = createMockMerchantHarness();

    const result = await controller.updateProfile(
      { headers: { 'x-merchant-code': 'MC-102' } },
      undefined,
      {
        storeName: 'Azad Couture',
        payoutAccount: {
          provider: 'BRAC Bank PLC',
          accountHolder: 'Azad Mia',
          accountNumber: '1501204892019001',
          branchName: 'Banani',
          routingNumber: '060271829',
          frequency: 'Weekly',
          chequeLeafUrl: '/uploads/cheque.png',
        },
      },
    );

    assert.equal(result.payoutStatus, 'PENDING_REVIEW');
    assert.equal(result.payoutAccount.status, 'PENDING_REVIEW');
    assert.equal(result.merchant.businessName, 'Azad Couture');
    assert.ok(result.payoutAccount.submittedAt);
    assert.ok(result.payoutAccount.updatedAt);

    const fetched = await service.getProfile('MC-102');
    assert.equal(fetched.storeName, 'Azad Couture');
    assert.equal(fetched.payoutAccount.status, 'PENDING_REVIEW');
    assert.equal(fetched.payoutAccount.accountNumber, '1501204892019001');
  });

  it('approves and rejects merchant payout details by merchantCode without 404', async () => {
    const { controller, service } = createMockMerchantHarness();

    await service.updateProfile('MC-102', {
      payoutAccount: {
        provider: 'bKash Merchant Wallet',
        accountHolder: 'Azad Mia',
        accountNumber: '01711223344',
        frequency: 'Weekly',
      },
    });

    const rejected = await controller.updatePayoutStatus('MC-102', {
      status: 'REJECTED',
      rejectionReason: 'Unclear cheque leaf',
    });
    assert.equal((rejected.payoutAccount as any).status, 'REJECTED');
    assert.equal((rejected.payoutAccount as any).rejectionReason, 'Unclear cheque leaf');

    const approved = await controller.updatePayoutStatus('MC-102', {
      status: 'VERIFIED',
    });
    assert.equal((approved.payoutAccount as any).status, 'VERIFIED');
    assert.equal((approved.payoutAccount as any).rejectionReason, null);
    assert.ok((approved.payoutAccount as any).verifiedAt);
  });

  it('extracts merchantId from expired/raw Bearer JWT payload cleanly when req.user is absent', async () => {
    const { controller } = createMockMerchantHarness();
    const fakePayload = Buffer.from(
      JSON.stringify({ merchantId: 'uuid-mc-102', merchantCode: 'MC-102' }),
    ).toString('base64url');
    const fakeJwt = `hdr.${fakePayload}.sig`;

    const profile = await controller.getProfile({
      headers: { authorization: `Bearer ${fakeJwt}` },
    });

    assert.equal(profile.id, 'uuid-mc-102');
    assert.equal(profile.merchantCode, 'MC-102');
  });
});
