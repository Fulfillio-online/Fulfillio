export type PaymentRequestMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER' | 'CASH';

export type PaymentRequestStatus = 'PENDING' | 'ACCEPTED' | 'PAID' | 'REJECTED' | 'CANCELLED';

export interface PaymentRequest {
  id: string;
  requestCode: string;
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  ownerName: string;
  amount: number;
  method: PaymentRequestMethod;
  accountDetails: {
    provider: string;
    accountNumber: string;
    accountHolder?: string;
    branchName?: string;
    routingNumber?: string;
  };
  requestedAt: string;
  reviewedAt?: string;
  status: PaymentRequestStatus;
  rejectionReason?: string;
  trxId?: string;
  proofDocumentUrl?: string;
  proofDocumentName?: string;
  proofDocumentMime?: string;
  proofChannel?: string;
  proofNotes?: string;
  proofChecksum?: string;
  paidAt?: string;
  paidByAdminName?: string;
  remarks?: string;
}
