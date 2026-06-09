import type { Metadata } from 'next';

import type { ReactNode } from 'react';

import { Providers } from '@/app';

import './globals.css';

export const metadata: Metadata = {
  title: 'App',
  description: 'Next.js 16 + FSD',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
