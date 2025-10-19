import { Metadata, Viewport } from 'next/types';

import '@/app/shared/styles/globals.css';
import '@/app/shared/styles/map.css';
import { fontSans } from '@/app/shared/styles/fonts';
import { getAppConfig } from '@/app/shared/lib/appConfig';
import { cn } from '../shared/lib/utils';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const generateMetadata = (): Metadata => {
  const appConfig = getAppConfig();
  return {
    icons: {
      icon: appConfig?.brand?.faviconUrl ?? '/favicon.ico',
    },
  };
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale}>
      <body className={cn('font-sans antialiased', fontSans.variable)}>
        {children}
      </body>
    </html>
  );
}
