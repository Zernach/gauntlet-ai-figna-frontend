import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Gauntlet AI',
  description: 'Archlife Industries AI Projects',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
