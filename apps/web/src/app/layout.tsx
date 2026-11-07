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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('fulfillio-theme');
                  var isDark = mode === 'dark' || (!mode && window.matchMedia('(prefers-color-scheme: dark)').matches) || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
