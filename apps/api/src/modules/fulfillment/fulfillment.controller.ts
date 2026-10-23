import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FulfillmentService, FulfillmentStatus } from './fulfillment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('fulfillments')
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Get()
  getAll(@Request() req: any, @Query('status') status?: string) {
    return this.fulfillmentService.getAll(req.user.merchantId, status);
  }

  @Get('order/:orderId')
  getByOrder(@Request() req: any, @Param('orderId') orderId: string) {
    return this.fulfillmentService.getByOrder(req.user.merchantId, orderId);
  }

  @Post()
  initiate(@Request() req: any, @Body() body: { orderId: string; warehouseId: string; assignedTo?: string }) {
    return this.fulfillmentService.initiate(req.user.merchantId, body);
  }

  @Patch(':id/status')
  transition(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: FulfillmentStatus,
  ) {
    return this.fulfillmentService.transition(req.user.merchantId, id, status);
  }
}
