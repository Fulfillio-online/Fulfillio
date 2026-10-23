import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MemoEngineService } from './memo-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemoTemplateLayout } from '@fulfillio/shared';

@Controller('memos')
export class MemoEngineController {
  constructor(
    private readonly memoEngineService: MemoEngineService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Save a custom memo template with unique memo_code
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTemplate(
    @Request() req: any,
    @Body()
    body: {
      memoCode: string;
      name: string;
      isDefault?: boolean;
      layout: MemoTemplateLayout;
    },
  ) {
    const merchantId = req.user.merchantId;
    return this.memoEngineService.createTemplate(merchantId, body);
  }

  /**
   * List all memo designs for merchant
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listTemplates(@Request() req: any) {
    const merchantId = req.user.merchantId;
    return this.prisma.memoTemplate.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Preview compiled invoice for an order
   */
  @Get('preview/:orderId')
  async previewInvoice(@Param('orderId') orderId: string) {
    return this.memoEngineService.compileInvoice(orderId);
  }
}
