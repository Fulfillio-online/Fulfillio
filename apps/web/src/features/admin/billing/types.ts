export type PaymentMethod = 'BKASH' | 'NAGAD' | 'BANK_TRANSFER' | 'CASH';
export type PaymentStatus = 'PAID' | 'UNPAID';

export interface SettlementTransaction {
  id: string;
  transactionRef: string;
  settlementId?: string;
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  ownerName: string;
  transactionDate: string; // e.g. "24 Oct 2026, 03:30 PM"
  paymentMethod: PaymentMethod;
  accountDetails: {
    provider: string; // e.g. "bKash", "BRAC Bank PLC"
    accountNumber: string;
    accountHolder: string;
  };
  amount: number;
  status: PaymentStatus;
  remarks?: string;
}

export interface MerchantFinancialProfile {
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  ownerName: string;
  phone: string;
  avatarBg: string;
  avatarInitials: string;
  totalCodEarned: number;
  totalPaid: number;
  unpaidBalance: number;
  payoutAccount: {
    provider: string;
    accountHolder: string;
    accountNumber: string;
    bkashNumber: string;
  };
  withdrawalsCount: number;
}
