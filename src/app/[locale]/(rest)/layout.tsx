import initTranslations from '@/app/shared/i18n/i18n';

import {
  serverSideAppConfig,
  serverSideFlags,
} from '@/app/shared/lib/server-utils';
import { Providers } from '@/app/shared/components/providers';
import { cookies } from 'next/headers';
import { SESSION_ID } from '../../shared/lib/constants';
import { getSession } from '@/auth';

export default async function RestLayout({
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
    <div className="flex min-h-screen flex-col bg-primary/5">
      <Providers
        appConfig={resultAppConfig}
        auth={auth}
        flags={flags}
        session={session}
      >
        {children}
      </Providers>
    </div>
  );
}
