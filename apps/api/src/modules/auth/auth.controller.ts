import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@fulfillio/contracts';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body()
    body: {
      businessName: string;
      email: string;
      phone?: string;
      password: string;
    },
  ) {
    return this.authService.registerMerchant(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('worker-pin-login')
  async workerPinLogin(@Body() body: { operatorCode: string; pin: string }) {
    return this.authService.loginWithWorkerPin(body.operatorCode, body.pin);
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT, UserRole.SUPER_ADMIN)
  async generateApiKey(@Request() req: any) {
    return this.authService.generateApiKey(req.user.merchantId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
