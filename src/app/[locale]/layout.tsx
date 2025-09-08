import { Metadata, Viewport } from 'next/types';
import initTranslations from '@/app/shared/i18n/i18n';

import '@/app/shared/styles/globals.css';
import { fontSans } from '@/app/shared/styles/fonts';
import { cn } from '@/app/shared/lib/utils';
import { getAppConfig } from '@/app/shared/lib/appConfig';
import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/app/shared/lib/server-utils';
import { Providers } from '@/app/shared/components/providers';
import { cookies } from 'next/headers';
import { SESSION_ID } from '../shared/lib/constants';
import { getSession } from '@/auth';

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
  const cookieList = await cookies();
  const errorNamespaces = ['page-500', 'common', 'dynamic'];
  const { resources } = await initTranslations(locale, errorNamespaces);

  const { appConfig } = await serverSideAppConfig();
  const { flags } = await serverSideFlags();

  const resultAppConfig = {
    ...appConfig,
    errorTranslationData: { errorNamespaces, resources, locale },
  };

  const session = await getSession();
  const auth = {
    sessionId: cookieList.get(SESSION_ID)?.value,
  };

  return (
    <html lang={locale}>
      <body>
        <div
          className={cn(
            'flex min-h-screen flex-col bg-primary/5 font-sans antialiased',
            fontSans.variable,
          )}
        >
          <Providers
            appConfig={resultAppConfig}
            auth={auth}
            flags={flags}
            session={session}
          >
            {children}
          </Providers>
        </div>
      </body>
    </html>
  );
}
