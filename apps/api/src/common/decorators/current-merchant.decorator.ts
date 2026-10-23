import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the merchantId from the JWT payload.
 * Usage: @CurrentMerchant() merchantId: string
 */
export const CurrentMerchant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.merchantId as string;
  },
);
