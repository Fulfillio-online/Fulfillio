import { Injectable, BadRequestException } from '@nestjs/common';
import { CourierProvider } from '@fulfillio/contracts';
import { CourierAdapter } from './courier-adapter.interface';
import { SteadfastAdapter } from './steadfast.adapter';
import { PathaoAdapter } from './pathao.adapter';
import { RedxAdapter } from './redx.adapter';

@Injectable()
export class CourierAdapterRegistry {
  private readonly adapters: Map<CourierProvider, CourierAdapter>;

  constructor(
    steadfast: SteadfastAdapter,
    pathao: PathaoAdapter,
    redx: RedxAdapter,
  ) {
    this.adapters = new Map<CourierProvider, CourierAdapter>([
      [CourierProvider.STEADFAST, steadfast],
      [CourierProvider.PATHAO, pathao],
      [CourierProvider.REDX, redx],
    ]);
  }

  getAdapter(provider: CourierProvider | string): CourierAdapter {
    const normalized = String(provider || '').toUpperCase() as CourierProvider;
    const adapter = this.adapters.get(normalized);
    if (!adapter) {
      throw new BadRequestException(`Unsupported courier provider: ${provider}`);
    }
    return adapter;
  }

  listAdapters(): CourierAdapter[] {
    return Array.from(this.adapters.values());
  }
}
