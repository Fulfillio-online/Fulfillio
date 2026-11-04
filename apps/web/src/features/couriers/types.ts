export type CourierConnectionStatus = 'CONNECTED' | 'SANDBOX' | 'DISCONNECTED';

export interface CourierIntegrationItem {
  id: string;
  code: string;
  name: string;
  status: CourierConnectionStatus;
  environment: 'Production Live' | 'Sandbox Test';
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  storeId: string;
  webhookUrl: string;
  codChargePercent: number;
  insideDhakaRate: number;
  outsideDhakaRate: number;
  activeConsignments: number;
  autoBookingEnabled: boolean;
  allowPipelineOverride: boolean;
  lastPing: string;
}

export interface CourierDiagnosticTestResult {
  courier: CourierIntegrationItem;
  latencyMs: number;
  success: boolean;
  message: string;
}
