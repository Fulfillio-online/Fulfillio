import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoTemplateLayout, MemoPaperSize } from '@fulfillio/shared';

@Injectable()
export class MemoEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or update a custom memo design with a unique Memo Code
   */
  async createTemplate(
    merchantId: string,
    data: {
      memoCode: string;
      name: string;
      isDefault?: boolean;
      layout: MemoTemplateLayout;
    },
  ) {
    const existing = await this.prisma.memoTemplate.findUnique({
      where: {
        merchantId_memoCode: {
          merchantId,
          memoCode: data.memoCode.toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Memo Code '${data.memoCode}' already exists for this merchant.`);
    }

    if (data.isDefault) {
      // Unset previous defaults
      await this.prisma.memoTemplate.updateMany({
        where: { merchantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.memoTemplate.create({
      data: {
        merchantId,
        memoCode: data.memoCode.toUpperCase(),
        name: data.name,
        isDefault: data.isDefault ?? false,
        layout: data.layout as any,
      },
    });
  }

  /**
   * Get template by Memo Code, or fallback to default
   */
  async resolveTemplate(merchantId: string, memoCode?: string) {
    if (memoCode) {
      const template = await this.prisma.memoTemplate.findUnique({
        where: {
          merchantId_memoCode: {
            merchantId,
            memoCode: memoCode.toUpperCase(),
          },
        },
      });
      if (template) return template;
    }

    // Fallback to default template
    const defaultTemplate = await this.prisma.memoTemplate.findFirst({
      where: { merchantId, isDefault: true },
    });

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
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

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
