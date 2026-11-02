import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@fulfillio/contracts';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new merchant user & tenant profile with auto-generated Merchant Code (MC-101, MC-102...)
   */
  async registerMerchant(data: {
    businessName: string;
    email: string;
    phone?: string;
    password: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException(`User with email '${data.email}' already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.merchant.count();
      const merchantCode = `MC-${101 + count}`;

      const merchant = await tx.merchant.create({
        data: {
          merchantCode,
          businessName: data.businessName,
          email: data.email,
          phone: data.phone,
          status: 'PENDING',
        },
      });

      const user = await tx.user.create({
        data: {
          merchantId: merchant.id,
          name: data.businessName,
          email: data.email,
          passwordHash,
          role: UserRole.MERCHANT,
        },
      });

      return {
        merchantId: merchant.id,
        merchantCode: merchant.merchantCode,
        userId: user.id,
        status: merchant.status,
        message: 'Registration submitted. Account pending admin approval.',
      };
    });
  }

  /**
   * Authenticate user with password and return JWT
   */
  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { merchant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.issueTokens(user);
  }

  /**
   * Fast 4-digit PIN authentication for Warehouse Handheld Operators
   */
  async loginWithWorkerPin(operatorCode: string, pin: string) {
    if (!pin || pin.length < 4) {
      throw new UnauthorizedException('Invalid 4-digit worker PIN.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        role: UserRole.WAREHOUSE_OPERATOR,
        OR: [{ email: operatorCode }, { name: { contains: operatorCode, mode: 'insensitive' } }],
      },
      include: { merchant: true },
    });

    if (!user || (user.workerPin && user.workerPin !== pin)) {
      throw new UnauthorizedException('Invalid operator code or PIN.');
    }

    return this.issueTokens(user);
  }

  private async issueTokens(user: any) {
    const payload = {
      sub: user.id,
      merchantId: user.merchantId,
      merchantCode: user.merchant?.merchantCode || 'MC-101',
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'fulfillio_super_secret_access_key_change_in_production',
      ),
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'fulfillio_super_secret_refresh_key_change_in_production',
      ),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        merchantId: user.merchantId,
        merchantCode: user.merchant?.merchantCode || 'MC-101',
        merchantStatus: user.merchant?.status,
      },
    };
  }

  /**
   * Generate a scoped API key for a merchant store integration
   */
  async generateApiKey(merchantId: string) {
    const rawKey = `ful_live_${crypto.randomBytes(24).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { apiKeyHash },
    });

    return {
      apiKey: rawKey,
      note: 'Store this key safely; it will not be displayed again.',
    };
  }
}
