import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AppHeader } from '../../components/organisms/app-header';
import { AppFooter } from '../../components/organisms/app-footer';
import { ResourceOverviewSection } from '../../components/organisms/resource-overview-section';
import { ResourceInformationSection } from '../../components/organisms/resource-information-section';
import { ResourceOrganizationSection } from '../../components/organisms/resource-organization-section';
import { usePrevUrl } from '../../lib/hooks/usePrevUrl';
import { useEffect, useRef, useState } from 'react';
import { ResourceNavigationSection } from '../../components/organisms/resource-navigation-section';
import { cacheControl } from '../../lib/server/cache-control';
import ResourceAdapter, {
  Resource,
} from '@/lib/server/adapters/resource-adapter';
import Head from 'next/head';
import { useAppConfig } from '@/lib/hooks/useAppConfig';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const resourceAdapter = ResourceAdapter();
  let notFound = false;
  let data = null;

  try {
    data = await resourceAdapter.getRecordById(ctx.query.id as string, {
      locale: ctx.locale,
    });
  } catch (err) {
    console.error(err);
  }

  // try {
  //   data = await resourceAdapter.getResource(ctx.query.id as string);
  // } catch (err) {
  //   if (isAxiosError(err)) {
  //     if (err?.response?.status === 404) {
  //       notFound = true;

  //       if (err.response.data.redirect) {
  //         return {
  //           redirect: {
  //             destination: `/${ctx.locale}${err.response.data.redirect}`,
  //             permanent: true,
  //           },
  //         };
  //       }
  //     }
  //   } else {
  //     console.error(err);
  //   }
  // }

  cacheControl(ctx);

  return {
    props: {
      resource: data,
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-resource',
        'common',
      ])),
    },
    notFound,
  };
}

type Props = {
  resource: Resource;
};

export default function SearchDetail({ resource }: Props) {
  const prevUrl = usePrevUrl();
  const [backUrl, setBackUrl] = useState('loading');
  const componentRef = useRef();
  const appConfig = useAppConfig();

  useEffect(() => {
    if (prevUrl && prevUrl.startsWith('/search')) {
      setBackUrl(prevUrl);
    } else {
      setBackUrl('/');
    }
  }, [prevUrl]);

  const metaTitle = resource.name;
  const metaDescription = resource.description;

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />

        <meta property="og:title" content={metaTitle} />
        <meta property="og:image" content={appConfig.brand.openGraphUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={metaDescription} />
      </Head>

      <div className="flex flex-col gap-0" ref={componentRef}>
        <AppHeader />

        <ResourceNavigationSection
          resourceId={resource.id}
          backUrl={backUrl}
          displayName={resource.name}
          serviceDescription={resource.description}
          componentToPrint={componentRef}
        />

        <div className="flex flex-col md:flex-row p-2 w-full h-full max-w-[1100px] mx-auto gap-2 print:flex-col">
          <div className="flex flex-col gap-2 w-full md:max-w-[50%]">
            <ResourceOverviewSection
              id={resource.id}
              displayName={resource.name}
              displayPhoneNumber={resource.phone}
              serviceName={resource.serviceName}
              serviceDescription={resource.description}
              phoneNumbers={resource.phoneNumbers}
              website={resource.website}
              location={resource.location}
              categories={resource.categories}
              lastAssuredOn={resource.lastAssuredOn}
            />
          </div>

          <div className="flex flex-col h-full w-full md:max-w-[50%]">
            <ResourceInformationSection
              addresses={resource.addresses}
              phoneNumbers={resource.phoneNumbers}
              website={resource.website}
              email={resource.email}
              hours={resource.hours}
              languages={resource.languages}
              applicationProcess={resource.applicationProcess}
              fees={resource.fees}
              requiredDocuments={resource.requiredDocuments}
              eligibilities={resource.eligibilities}
              serviceAreaDescription={resource.serviceAreaDescription}
              location={resource.location}
              serviceArea={resource.serviceArea}
            />
            <ResourceOrganizationSection
              organizationName={resource.organizationName}
              organizationDescription={resource.organizationDescription}
            />
          </div>
        </div>

        <AppFooter />
      </div>
    </>
  );
}
