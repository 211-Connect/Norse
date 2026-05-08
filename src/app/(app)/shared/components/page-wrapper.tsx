'use client';

import { ErrorBoundary } from '@/app/(app)/features/error/components/error-boundary';
import { TmpCookiesObj } from 'cookies-next';
import { PropsWithChildren } from 'react';

import { useAppConfig } from '../hooks/use-app-config';
import TranslationsProvider from '../i18n/TranslationsProvider';
import { MAIN_CONTENT_ID } from '../lib/constants';
import { DynamicHeightListener } from './dynamic-height-listener';
import { Footer } from './footer';
import { GlobalDialogs } from './global-dialogs/global-dialogs';
import { GoogleTagManagerScript } from './google-tag-manager-script';
import { Header } from './header';
import { JotaiHydration } from './jotai-hydration';
import { MatomoTagManagerScript } from './matomo-tag-manager-script';
import { Toaster } from './ui/sonner';
import { UmamiScript } from './umami-script';

interface PageWrapperProps {
  cookies?: TmpCookiesObj;
  translationData: {
    i18nNamespaces: string[];
    locale: string;
    resources: any;
  };
  jotaiData?: Record<string, any>;
  nonce?: string;
}

export const PageWrapper = ({
  children,
  cookies,
  jotaiData = {},
  translationData,
  nonce,
}: PropsWithChildren<PageWrapperProps>) => {
  const appConfig = useAppConfig();

  return (
    <TranslationsProvider
      namespaces={translationData.i18nNamespaces}
      locale={translationData.locale}
      resources={translationData.resources}
    >
      <JotaiHydration cookies={cookies} pageProps={jotaiData} />
      <ErrorBoundary>
        <a
          href={`#${MAIN_CONTENT_ID}`}
          className="sr-only z-50 m-3 inline-flex rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:absolute focus:left-0 focus:top-0 focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <Header />
        <main id={MAIN_CONTENT_ID} className="flex flex-1 flex-col">
          {children}
        </main>
        <Footer />
        <GlobalDialogs />
        <Toaster />
        <GoogleTagManagerScript
          containerId={appConfig.gtmContainerId}
          nonce={nonce}
        />
        <MatomoTagManagerScript
          matamoContainerUrl={appConfig.matomoContainerUrl}
          nonce={nonce}
        />
        <UmamiScript
          scriptUrl={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
          websiteId={appConfig.umamiWebsiteId}
          nonce={nonce}
        />
        <DynamicHeightListener />
      </ErrorBoundary>
    </TranslationsProvider>
  );
};
