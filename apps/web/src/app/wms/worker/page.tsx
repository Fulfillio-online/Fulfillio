'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WorkerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/wms/pick');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-slate-400 font-mono">
      Redirecting to Fulfillio WMS Pick List...
    </div>
  );
}
