import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '4Loki Dog Grooming',
  description: 'Management system for 4Loki dog grooming business',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navigation />
          <main className="flex-grow p-4 md:ml-20 pt-16 md:pt-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
} 