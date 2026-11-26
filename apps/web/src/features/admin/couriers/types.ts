export type CourierConnectionStatus = 'CONNECTED' | 'SANDBOX' | 'DISCONNECTED';

export interface CourierIntegrationItem {
  id: string;
  code: string; // Provider enum: STEADFAST | PATHAO | REDX
  name: string;
  status: CourierConnectionStatus;
  environment: 'Production Live' | 'Sandbox Test';
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  // Additional provider-specific credentials (Pathao: clientId/clientSecret/username/password, RedX: apiToken)
  credentials?: Record<string, string>;
  hasCredentials?: boolean;
  storeId: string;
  webhookUrl: string;
  webhookSecret?: string;
  hasWebhookSecret?: boolean;
  codChargePercent: number;
  insideDhakaRate: number;
  outsideDhakaRate: number;
  activeConsignments: number;
  autoBookingEnabled: boolean;
  allowPipelineOverride: boolean;
  lastPing: string;
  lastBalance?: number | null;
  lastHealthStatus?: string | null;
  lastError?: string | null;
}

export interface CourierDiagnosticTestResult {
  courier: CourierIntegrationItem;
  latencyMs: number;
  success: boolean;
  reachable?: boolean;
  authenticated?: boolean;
  balance?: number | null;
  statusCode?: number;
  message: string;
}
