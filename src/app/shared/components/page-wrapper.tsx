'use client';

import { PropsWithChildren } from 'react';
import { Provider as JotaiProvider } from 'jotai';
import { ErrorBoundary } from '@/app/features/error/components/error-boundary';
import { TmpCookiesObj } from 'cookies-next/lib/common/types';

import { GlobalDialogs } from './global-dialogs/global-dialogs';
import { Header } from './header';
import { JotaiHydration } from './jotai-hydration';
import { Footer } from './footer';
import { Toaster } from './ui/sonner';
import TranslationsProvider from '../i18n/TranslationsProvider';
import { GoogleTagManagerScript } from './google-tag-manager-script';
import { MatomoTagManagerScript } from './matomo-tag-manager-script';
import { DynamicHeightListener } from './dynamic-height-listener';

interface PageWrapperProps {
  cookies?: TmpCookiesObj;
  translationData: {
    i18nNamespaces: string[];
    locale: string;
    resources: any;
  };
  jotaiData?: Record<string, any>;
}

export const PageWrapper = ({
  children,
  cookies,
  jotaiData = {},
  translationData,
}: PropsWithChildren<PageWrapperProps>) => {
  return (
    <JotaiProvider>
      <TranslationsProvider
        namespaces={translationData.i18nNamespaces}
        locale={translationData.locale}
        resources={translationData.resources}
      >
        <JotaiHydration cookies={cookies} pageProps={jotaiData} />
        <ErrorBoundary>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
          <GlobalDialogs />
          <Toaster />
          <GoogleTagManagerScript />
          <MatomoTagManagerScript />
          <DynamicHeightListener />
        </ErrorBoundary>
      </TranslationsProvider>
    </JotaiProvider>
  );
};
