import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-fulfillio-api-key'] || request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Missing X-Fulfillio-Api-Key header');
    }

    // Hash incoming key using SHA-256
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    const merchant = await this.prisma.merchant.findFirst({
      where: {
        apiKeyHash: hashedKey,
        status: 'APPROVED',
      },
    });

    if (!merchant) {
      throw new UnauthorizedException('Invalid or inactive API Key');
    }

    // Attach authenticated merchant to request context
    request.merchant = merchant;
    return true;
  }
}
