'use client';

import React from 'react';
import { useMerchant } from '@/features/merchant/portal/MerchantContext';
import { MerchantMemoDesignerTab } from '@/features/merchant/portal/components/tabs/MerchantMemoDesignerTab';

export default function MerchantMemosPage() {
  const {
    profile,
    memoList,
    saveMemo,
    setDefaultMemo,
    deleteMemo,
    showToast,
  } = useMerchant();

  return (
    <MerchantMemoDesignerTab
      profile={profile}
      memoList={memoList}
      onSaveMemo={saveMemo}
      onSetDefaultMemo={setDefaultMemo}
      onDeleteMemo={deleteMemo}
      onTriggerToast={showToast}
    />
  );
}
