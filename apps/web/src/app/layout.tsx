import './globals.css';
import type { Metadata } from 'next';
import { QueryProvider } from '@/lib/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Fulfillio — Modern 3PL & Warehouse Management System',
  description: 'Enterprise 3PL fulfillment, real-time multi-tenant inventory, and custom branded invoices.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 font-sans">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
