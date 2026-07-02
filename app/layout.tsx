import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Providers } from './Providers';
import '../app/global.css';

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Berries Angeles';

export const metadata: Metadata = {
  title: appName,
  description: 'Sistema de gestión Berries Angeles',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: appName,
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#1a472a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
