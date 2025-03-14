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
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-grow p-4">
            {children}
          </main>
          <footer className="bg-gray-100 py-4 text-center text-gray-600 text-sm">
            <p>© {new Date().getFullYear()} 4Loki Dog Grooming. All rights reserved.</p>
          </footer>
        </div>
      </body>
    </html>
  );
} 