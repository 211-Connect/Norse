import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AppHeader } from '../../components/app-header';
import { AppFooter } from '../../components/app-footer';
import { useRef } from 'react';
import { cacheControl } from '../../lib/server/cache-control';
import ResourceAdapter, {
  Resource as IResource,
} from '@/lib/server/adapters/resource-adapter';
import Head from 'next/head';
import { useAppConfig } from '@/hooks/use-app-config';
import Resource from '@/components/resource';
import { serverSideAppConfig } from '@/lib/server/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  const resourceAdapter = ResourceAdapter();
  let notFound = false;
  let data = null;

  try {
    data = await resourceAdapter.getRecordById(ctx.params.id as string, {
      locale: ctx.locale,
    });
  } catch (err) {
    if (err.message === '404') {
      notFound = true;
      const redirect = await resourceAdapter.getRedirect(
        ctx.params.id as string,
      );

      if (redirect) {
        let redirectUrl = '/search';
        if (ctx.locale !== ctx.defaultLocale) {
          redirectUrl += `'/${ctx.locale}`;
        }
        redirectUrl += `/${redirect.newId}`;

        return {
          redirect: {
            destination: redirectUrl,
            permanent: true,
          },
        };
      }
    }
  }

  cacheControl(ctx);

  return {
    props: {
      session,
      resource: data,
      ...(await serverSideAppConfig()),
      ...(await serverSideTranslations(ctx.locale as string, [
        'page-resource',
        'common',
        'menus',
      ])),
    },
    notFound,
  };
}

type Props = {
  resource: IResource;
};

export default function SearchDetail({ resource }: Props) {
  const componentRef = useRef();
  const appConfig = useAppConfig();

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

      <div className="flex flex-col gap-0 min-h-screen" ref={componentRef}>
        <AppHeader />

        <Resource data={resource} />

        <AppFooter />
      </div>
    </>
  );
}
