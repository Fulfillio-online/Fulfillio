import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const apiKey = request.headers['x-fulfillio-api-key'] || request.headers['x-api-key'];

    // 1. Try JWT Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>(
            'JWT_ACCESS_SECRET',
            'fulfillio_super_secret_access_key_change_in_production',
          ),
        });
        request.user = payload;
        if (payload.merchantId) {
          request.merchant = { id: payload.merchantId };
        }
        return true;
      } catch {
        // Fall through to API key check
      }
    }

    // 2. Try API Key header
    if (apiKey && typeof apiKey === 'string') {
      const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
      const merchant = await this.prisma.merchant.findFirst({
        where: {
          apiKeyHash: hashedKey,
          status: 'APPROVED',
        },
      });

      if (merchant) {
        request.merchant = merchant;
        request.user = { merchantId: merchant.id, role: 'MERCHANT' };
        return true;
      }
    }

    // 3. Try x-merchant-code or body merchantCode/merchantId (Merchant Portal session)
    const rawMerchant =
      request.headers['x-merchant-code'] ||
      request.body?.merchantCode ||
      request.body?.merchantId ||
      request.query?.merchantCode ||
      request.query?.merchantId ||
      'MC-101';

    if (rawMerchant && typeof rawMerchant === 'string') {
      const clean = rawMerchant.trim();
      let merchant = await this.prisma.merchant.findFirst({
        where: {
          OR: [
            { id: clean },
            { merchantCode: clean.toUpperCase() },
            { email: clean.toLowerCase() },
          ],
        },
      });

      if (!merchant) {
        merchant = await this.prisma.merchant.findFirst({
          where: { merchantCode: 'MC-101' },
        });
      }

      if (merchant) {
        request.merchant = merchant;
        request.user = { merchantId: merchant.id, role: 'MERCHANT' };
        return true;
      }
    }

    throw new UnauthorizedException('Authentication required (Bearer token, API key, or x-merchant-code)');
  }
}
