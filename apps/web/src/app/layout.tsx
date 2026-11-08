import './globals.css';
import type { Metadata } from 'next';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { ThemeRouteGuard } from '@/lib/providers/ThemeRouteGuard';

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
                  var p = location.pathname;
                  var themed = p === '/' || p === '/admin' || p.indexOf('/admin/') === 0;
                  var mode = localStorage.getItem('fulfillio-theme');
                  var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = !themed || mode === 'dark' || ((!mode || mode === 'system') && sysDark);
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
          <ThemeRouteGuard />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
