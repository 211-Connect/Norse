import { useAppConfig } from '@/shared/hooks/use-app-config';
import Head from 'next/head';
import { Navigation } from '../components/navigation';
import { Overview } from '../components/overview';
import { Information } from '../components/information';
import { OrganizationInformation } from '../components/organization-information';
import { useRef } from 'react';

export function ResourceView({ resource }) {
  const appConfig = useAppConfig();
  const componentToPrintRef = useRef();

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
          className="flex flex-col gap-2 lg:flex-row"
          ref={componentToPrintRef}
        >
          <Overview resource={resource} />

          <div className="flex flex-1 flex-col gap-2">
            <Information resource={resource} />
            <OrganizationInformation resource={resource} />
          </div>
        </div>
      </div>
    </>
  );
}
