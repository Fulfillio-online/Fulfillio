import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { UserRole } from '@fulfillio/contracts';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new merchant user & tenant profile with auto-generated Merchant Code (MC-101, MC-102...)
   */
  async registerMerchant(data: {
    businessName: string;
    ownerName?: string;
    email: string;
    phone?: string;
    password: string;
  }) {
    const existing = await this.authRepo.findUserByEmail(data.email);
    if (existing) {
      throw new ConflictException(`User with email '${data.email}' already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const result = await this.authRepo.registerMerchantWithUser({
      businessName: data.businessName,
      ownerName: data.ownerName,
      email: data.email,
      phone: data.phone,
      passwordHash,
    });

    return {
      ...result,
      message: 'Registration submitted. Account pending admin approval.',
    };
  }

  /**
   * Authenticate user with password and return JWT
   */
  async login(email: string, pass: string) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.role === UserRole.MERCHANT && user.merchant) {
      if (user.merchant.status === 'PENDING') {
        throw new ForbiddenException(
          'Your merchant account is pending admin approval. Please wait for approval before signing in.',
        );
      }
      if (user.merchant.status === 'SUSPENDED') {
        throw new ForbiddenException(
          'Your merchant account is currently suspended. Please contact warehouse administration.',
        );
      }
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

    const user = await this.authRepo.findOperatorByCodeOrEmail(operatorCode);
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
        businessName: user.merchant?.businessName || user.name,
        phone: user.merchant?.phone || '',
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

    await this.authRepo.updateMerchantApiKey(merchantId, apiKeyHash);

    return {
      apiKey: rawKey,
      note: 'Store this key safely; it will not be displayed again.',
    };
  }
}
