import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'GrowEasy AI CSV Importer - Enterprise CRM Ingestion',
  description: 'Clean Architecture AI-powered CSV mapping engine. Processes messy datasets into standard GrowEasy CRM records in real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
