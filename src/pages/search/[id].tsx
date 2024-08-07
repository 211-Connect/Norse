import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ResourceDetailsPageLayout } from '../../components/layouts/ResourceDetailsPage';
import { AppHeader } from '../../components/organisms/AppHeader';
import { AppFooter } from '../../components/organisms/AppFooter';
import { ResourceOverviewSection } from '../../components/organisms/ResourceOverviewSection';
import { ResourceInformationSection } from '../../components/organisms/ResourceInformationSection';
import { ResourceOrganizationSection } from '../../components/organisms/ResourceOrganizationSection';
import { usePrevUrl } from '../../lib/hooks/usePrevUrl';
import { useEffect, useRef, useState } from 'react';
import { ResourceNavigationSection } from '../../components/organisms/ResourceNavigationSection';
import { getServerSideAxios } from '../../lib/server/axios';
import { IResource, ResourceAdapter } from '../../lib/adapters/ResourceAdapter';
import { isAxiosError } from 'axios';
import { cacheControl } from '../../lib/server/cacheControl';
import { useSession } from 'next-auth/react';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const axios = getServerSideAxios(ctx);
  const resourceAdapter = new ResourceAdapter(axios);
  let notFound = false;
  let data = null;

  try {
    data = await resourceAdapter.getResource(ctx.query.id as string);
  } catch (err) {
    if (isAxiosError(err)) {
      if (err?.response?.status === 404) {
        notFound = true;

        if (err.response.data.redirect) {
          return {
            redirect: {
              destination: `/${ctx.locale}${err.response.data.redirect}`,
              permanent: true,
            },
          };
        }
      }
    } else {
      console.error(err);
    }
  }

  cacheControl(ctx);

  return {
    props: {
      resource: data,
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-resource',
        'common',
        'dynamic',
      ])),
    },
    notFound,
  };
}

type Props = {
  resource: IResource;
};

export default function SearchDetail({ resource }: Props) {
  const session = useSession();
  const prevUrl = usePrevUrl();
  const [backUrl, setBackUrl] = useState('loading');
  const componentRef = useRef();

  useEffect(() => {
    if (prevUrl && prevUrl.startsWith('/search')) {
      setBackUrl(prevUrl);
    } else {
      setBackUrl('/');
    }
  }, [prevUrl]);

  if (session.status === 'loading') return null;

  return (
    <>
      <ResourceDetailsPageLayout
        ref={componentRef}
        metaTitle={resource.name}
        metaDescription={resource.description}
        headerSection={<AppHeader />}
        resourceNavigationSection={
          <ResourceNavigationSection
            resourceId={resource.id}
            backUrl={backUrl}
            displayName={resource.name}
            serviceDescription={resource.description}
            componentToPrint={componentRef}
          />
        }
        resourceOverviewSection={
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
            attribution={resource.attribution}
          />
        }
        resourceInformationSection={
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
        }
        resourceOrganizationSection={
          <ResourceOrganizationSection
            organizationName={resource.organizationName}
            organizationDescription={resource.organizationDescription}
          />
        }
        footerSection={<AppFooter />}
      />
    </>
  );
}
