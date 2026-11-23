import { SettlementTransaction, MerchantFinancialProfile } from './types';

export const STORAGE_KEY_BILLING_TRANSACTIONS = 'fulfillio_settlement_transactions';
export const STORAGE_KEY_BILLING_PROFILES = 'fulfillio_billing_profiles';

export const MERCHANT_FINANCIAL_PROFILES: Record<string, MerchantFinancialProfile> = {};
export const INITIAL_SETTLEMENT_TRANSACTIONS: SettlementTransaction[] = [];
