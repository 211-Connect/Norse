import { Suspense } from 'react';

import { DirectoryDownloadDialog } from '@/app/(app)/shared/components/directory-print/directory-download-dialog';
import { DataProviders } from '@/app/(app)/shared/components/data-providers';
import { TourProvider } from '@/app/(app)/shared/context/tour-provider';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';

import Alert from './alert';
import { CategoriesSection } from './categories-section';
import { HeroSection } from './hero-section';
import { HighlightsSection } from './highlights-section';
import { NewHomeContent } from './new-home-content';

/**
 * The home page's content, shared by the home route and the landing page (`/find`), which shows
 * its questions as a popup over this same background (Lucas, 2026-11-14).
 */
export async function HomePageBody({ locale }: { locale: string }) {
  const appConfig = await getAppConfigWithoutHost(locale);
  return (
    <>
      <h1 className="sr-only">Search by Keyword or Topic</h1>
      <Suspense fallback={null}>
        <DirectoryDownloadDialog locale={locale} />
      </Suspense>
      <TourProvider>
        {appConfig?.newLayout?.enabled ? (
          <NewHomeContent />
        ) : (
          <>
            <HeroSection />
            <Alert />
            <HighlightsSection />
            <CategoriesSection className="p-4 sm:p-8" />
            <DataProviders />
          </>
        )}
      </TourProvider>
    </>
  );
}
