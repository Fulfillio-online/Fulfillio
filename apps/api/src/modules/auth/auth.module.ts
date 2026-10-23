import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiKeyGuard } from './guards/api-key.guard';

@Global()
@Module({
  imports: [
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, ApiKeyGuard],
  exports: [AuthService, JwtAuthGuard, ApiKeyGuard, JwtModule],
})
export class AuthModule {}
