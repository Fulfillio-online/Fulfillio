export type PaymentRequestMethod = 'BKASH' | 'NAGAD' | 'BANK_TRANSFER' | 'CASH';

export type PaymentRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PAID';

export interface PaymentRequest {
  id: string; // e.g. "PR-901"
  merchantId: string;
  merchantCode: string; // e.g. "MC-101"
  merchantName: string; // e.g. "Sabbir's Store"
  ownerName: string;
  amount: number;
  method: PaymentRequestMethod;
  accountDetails: {
    provider: string; // e.g. "bKash Personal", "BRAC Bank PLC", "Nagad Merchant"
    accountNumber: string;
    accountHolder?: string;
  };
  requestedAt: string; // e.g. "05 Nov 2026, 11:20 AM"
  status: PaymentRequestStatus;
  trxId?: string;
  paidAt?: string;
  remarks?: string;
}
