import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MemoEngineRepository } from './memo-engine.repository';
import { MemoTemplateLayout, MemoPaperSize } from '@fulfillio/contracts';

@Injectable()
export class MemoEngineService {
  constructor(private readonly memoRepo: MemoEngineRepository) {}

  /**
   * Create or update a custom memo design with a unique Memo Code
   */
  async createTemplate(
    merchantId: string,
    data: {
      memoCode?: string;
      name: string;
      isDefault?: boolean;
      layout: MemoTemplateLayout;
    },
  ) {
    const memoCode = data.memoCode?.trim() || `MEMO-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await this.memoRepo.findByCode(merchantId, memoCode);

    if (existing) {
      throw new ConflictException(`Memo Code '${memoCode}' already exists for this merchant.`);
    }

    if (data.isDefault) {
      await this.memoRepo.unsetDefault(merchantId);
    }

    return this.memoRepo.create({
      merchantId,
      memoCode,
      name: data.name,
      isDefault: data.isDefault ?? false,
      layout: data.layout,
    });
  }

  /**
   * List templates for merchant
   */
  async listTemplates(merchantId: string) {
    return this.memoRepo.listByMerchant(merchantId);
  }

  /**
   * Get template by Memo Code, or fallback to default
   */
  async resolveTemplate(merchantId: string, memoCode?: string) {
    if (memoCode) {
      const template = await this.memoRepo.findByCode(merchantId, memoCode);
      if (template) return template;
    }

    const defaultTemplate = await this.memoRepo.findDefault(merchantId);
    if (defaultTemplate) return defaultTemplate;

    // Standard fallback layout if merchant has not designed any template yet
    return {
      memoCode: 'MEMO-SYSTEM-DEFAULT',
      name: 'System Default Invoice',
      layout: {
        header: {
          showLogo: false,
          storeName: 'Merchant Store',
        },
        fields: {
          showBarcode: true,
          showCustomerNotes: true,
          showSKU: true,
          showUnitPrice: true,
          showTaxTotal: false,
        },
        footer: {
          thankYouMessage: 'Thank you for your order!',
        },
        paperSize: MemoPaperSize.A4,
      },
    };
  }

  /**
   * Compile order data with template into printable payload
   */
  async compileInvoice(orderId: string) {
    const order = await this.memoRepo.findOrderWithItemsAndMerchant(orderId);

    if (!order) {
      throw new NotFoundException(`Order with id '${orderId}' not found.`);
    }

    const template = await this.resolveTemplate(order.merchantId, order.memoCode ?? undefined);

    return {
      orderId: order.id,
      memoCode: template.memoCode,
      template: template.layout,
      merchant: {
        name: order.merchant.businessName,
        phone: order.merchant.phone,
      },
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress,
        city: order.city,
      },
      items: order.items.map((item) => ({
        productTitle: item.variant.product.title,
        sku: item.variant.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: Number(item.unitPrice) * item.quantity,
      })),
      financials: {
        totalAmount: order.totalAmount,
        codAmount: order.codAmount,
      },
      compiledAt: new Date().toISOString(),
    };
  }
}
