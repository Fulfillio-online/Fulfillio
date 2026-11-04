import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-2xl mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The warehouse or admin route you requested could not be located in the Fulfillio system.
      </p>
      <Link
        href="/admin"
        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors"
      >
        ← Back to Admin Panel
      </Link>
    </div>
  );
}
