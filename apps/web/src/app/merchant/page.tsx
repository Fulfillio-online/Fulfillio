import React from 'react';
import { MerchantPortalManager } from '@/features/merchant-portal';

export const metadata = {
  title: 'Merchant Portal | Fulfillio WMS',
  description: 'Manage store orders, products, custom memo templates, and COD payouts.',
};

export default function MerchantPortalPage() {
  return <MerchantPortalManager />;
}
