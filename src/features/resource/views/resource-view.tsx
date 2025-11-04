import { useAppConfig } from '@/shared/hooks/use-app-config';
import Head from 'next/head';
import { Navigation } from '../components/navigation';
import { Overview } from '../components/overview';
import { OrganizationInformation } from '../components/organization-information';
import { useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { fontSans } from '@/shared/styles/fonts';
import { DescriptionSection } from '../components/description-section';
import { MapSection } from '../components/map-section';

export function ResourceView({ resource }) {
  const appConfig = useAppConfig();
  const componentToPrintRef = useRef();

  if (!resource) {
    // Handle the case where resource is null or undefined.
    return (
      <div>
        <h1>Resource not found</h1>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{resource.name}</title>
        <meta name="description" content={resource.description} />

        <meta property="og:title" content={resource.name} />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={resource.description} />
      </Head>

      <div className="container mx-auto flex flex-col gap-2 pb-2 pt-2">
        <Navigation
          componentToPrintRef={componentToPrintRef}
          resource={resource}
        />

        <div
          className={cn(
            'flex flex-col gap-3 font-sans md:flex-row',
            fontSans.variable,
          )}
          ref={componentToPrintRef}
        >
          <Overview resource={resource} />

          <div className="flex flex-1 flex-col gap-3">
            <DescriptionSection resource={resource} />
            <MapSection resource={resource} />
            <OrganizationInformation resource={resource} />
          </div>
        </div>
      </div>
    </>
  );
}
