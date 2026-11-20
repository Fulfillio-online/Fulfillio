import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { JwtOrApiKeyGuard } from './guards/jwt-or-api-key.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtAuthGuard, ApiKeyGuard, JwtOrApiKeyGuard],
  exports: [AuthService, AuthRepository, JwtAuthGuard, ApiKeyGuard, JwtOrApiKeyGuard, JwtModule],
})
export class AuthModule {}
