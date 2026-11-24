export type PaymentMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER' | 'CASH';
export type PaymentStatus = 'PAID' | 'UNPAID';

export interface SettlementTransaction {
  id: string;
  transactionRef: string;
  settlementId?: string;
  requestCode?: string;
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  ownerName: string;
  transactionDate: string;
  paymentMethod: PaymentMethod;
  accountDetails: {
    provider: string;
    accountNumber: string;
    accountHolder: string;
  };
  amount: number;
  status: PaymentStatus;
  remarks?: string;
  proofDocumentUrl?: string;
  proofDocumentName?: string;
  proofDocumentMime?: string;
  proofChannel?: string;
  proofNotes?: string;
  proofChecksum?: string;
  paidByAdminName?: string;
  paidAt?: string;
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
