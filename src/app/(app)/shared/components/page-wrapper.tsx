'use client';

import { TmpCookiesObj } from 'cookies-next';
import { PropsWithChildren } from 'react';

import { ErrorBoundary } from '@/app/(app)/features/error/components/error-boundary';

import { useAppConfig } from '../hooks/use-app-config';
import TranslationsProvider from '../i18n/TranslationsProvider';
import { MAIN_CONTENT_ID } from '../lib/constants';
import { cn } from '../lib/utils';
import { DynamicHeightListener } from './dynamic-height-listener';
import { Footer } from './footer';
import { GlobalDialogs } from './global-dialogs/global-dialogs';
import { Header } from './header';
import { MatomoTagManagerScript } from './matomo-tag-manager-script';
import { QuickExitButton } from './quick-exit-button';
import { PageSearchState, SearchStateSync } from './search-state-sync';
import { SyncLocalFavoritesOnAuthEffect } from './sync-local-favorites-on-auth-effect';
import { Toaster } from './ui/sonner';
import { UmamiScript } from './umami-script';
import { ArcjetScript } from './arcjet-script';

interface PageWrapperProps {
  cookies?: TmpCookiesObj;
  translationData: {
    i18nNamespaces: string[];
    locale: string;
    resources: any;
  };
  /** The page URL's search, used to reset the header search form. */
  search?: PageSearchState;
  nonce?: string;
  /**
   * md and up: the page is exactly the viewport tall and does not scroll as a whole; the page's own
   * panels scroll (the results page). The footer is hidden there. Phones are unchanged.
   */
  fitViewport?: boolean;
}

export const PageWrapper = ({
  children,
  cookies = {},
  search,
  translationData,
  nonce,
  fitViewport = false,
}: PropsWithChildren<PageWrapperProps>) => {
  const appConfig = useAppConfig();
  // The tenant's v2 switch: off keeps the v1 page frame (no Quick exit button, the page scrolls as a whole).
  const v2 = appConfig.featureFlags.enableV2Api;
  const fit = v2 && fitViewport;
  const page = (
    <>
      <Header />
      {v2 && <QuickExitButton />}
      <main
        id={MAIN_CONTENT_ID}
        className={cn('flex flex-1 flex-col', fit && 'md:min-h-0')}
      >
        {children}
      </main>
      {fit ? (
        <div className="md:hidden">
          <Footer />
        </div>
      ) : (
        <Footer />
      )}
    </>
  );

  return (
    <TranslationsProvider
      namespaces={translationData.i18nNamespaces}
      locale={translationData.locale}
      resources={translationData.resources}
    >
      <SyncLocalFavoritesOnAuthEffect />
      {/* Before <Header>: on the first render it seeds the atom the header reads. */}
      <SearchStateSync cookies={cookies} search={search} />
      <ErrorBoundary>
        <a
          href={`#${MAIN_CONTENT_ID}`}
          className="bg-background text-foreground focus:ring-ring sr-only z-50 m-3 inline-flex rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:ring-2"
        >
          Skip to content
        </a>
        {fit ? (
          <div className="flex min-h-0 flex-1 flex-col max-md:contents md:h-dvh md:flex-none md:overflow-hidden">
            {page}
          </div>
        ) : (
          page
        )}
        <GlobalDialogs />
        <Toaster />
        <MatomoTagManagerScript
          matamoContainerUrl={appConfig.matomoContainerUrl}
          nonce={nonce}
        />
        <UmamiScript
          scriptUrl={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
          websiteId={appConfig.umamiWebsiteId}
          nonce={nonce}
        />
        <ArcjetScript
          scriptUrl={process.env.NEXT_PUBLIC_ARCJET_SCRIPT_URL}
          nonce={nonce}
        />
        <DynamicHeightListener />
      </ErrorBoundary>
    </TranslationsProvider>
  );
};
