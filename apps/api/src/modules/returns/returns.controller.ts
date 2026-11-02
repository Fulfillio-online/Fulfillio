import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('intake')
  async intakeReturn(
    @Body('orderId') orderId: string,
    @Body('isUndamaged') isUndamaged: boolean,
    @Body('reasonNotes') reasonNotes?: string,
  ) {
    return this.returnsService.processInboundRTO(orderId, isUndamaged, reasonNotes);
  }
}
