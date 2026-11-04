'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PackingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/wms/pack');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-slate-400 font-mono">
      Redirecting to Fulfillio WMS Packing Desk...
    </div>
  );
}
