import { getCookies } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next/types';
import { ResourcePageContent } from '@/app/(app)/features/resource/components/content';
import { DEFAULT_RESOURCE_LAYOUT } from '@/app/(app)/features/resource/types/layout-config';
import { PageWrapper } from '@/app/(app)/shared/components/page-wrapper';
import initTranslations from '@/app/(app)/shared/i18n/i18n';
import { redirectIfRekeyed } from '@/app/(app)/shared/lib/rekeyedRedirect';
import { getResource } from '@/app/(app)/shared/services/resource-service';
import {
  canonicalOrigin,
  resourceCanonicalUrl,
} from '@/app/(app)/features/resource/seo/resourceSeo';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getHost } from '@/app/(app)/shared/utils/getHost';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { isValidUUID } from '@/app/(app)/shared/utils/uuid';
import { protectPage } from '@/lib/arcjet-page';
import { getTenantByHost } from '@/lib/cms/tenants';
import { createLogger } from '@/lib/logger';
import { Resource } from '@/types/resource';

const log = createLogger('resource-page');

const i18nNamespaces = ['page-resource', 'page-list', 'common'];

/**
 * The page's canonical URL (ISS-2678): the record's own id on the tenant's primary (first trusted) domain, so an
 * `_id` or cross-tenant fallback lookup, or a second domain, never declares itself the canonical page. Falls back
 * to the request's host when the tenant cannot be read.
 */
async function canonicalFor(
  locale: string,
  defaultLocale: string,
  resourceId: string,
) {
  const { host, protocol } = await getHost();
  let trustedDomains: string[] = [];
  try {
    const tenant = await getTenantByHost(parseHost(host));
    trustedDomains = (tenant?.trustedDomains ?? []).map(({ domain }) => domain);
  } catch (err) {
    log.warn(
      { err, host },
      'Tenant lookup failed; canonical uses the request host',
    );
  }
  return resourceCanonicalUrl({
    ...canonicalOrigin({ trustedDomains, host, protocol }),
    locale,
    defaultLocale,
    id: resourceId,
  });
}

export const generateMetadata = async ({ params }): Promise<Metadata> => {
  const { id, locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);

  let resource: Resource | null = null;

  if (id && isValidUUID(id)) {
    // Runs in parallel with the page: gate the resource fetch on the same
    // Arcjet decision, so a denied bot causes no Norse API call and its 403
    // carries no resource title.
    await protectPage(`/${locale}/search/${id}`);
    try {
      resource = await getResource(id, locale, appConfig.tenantId);
    } catch {}
  }

  if (!resource) {
    return {};
  }

  const canonical = await canonicalFor(
    locale,
    appConfig.i18n.defaultLocale,
    resource.id,
  );

  return {
    alternates: { canonical },
    openGraph: {
      description: resource.description ?? undefined,
      images: appConfig.brand.openGraphUrl
        ? [
            {
              url: appConfig.brand.openGraphUrl,
            },
          ]
        : undefined,
      type: 'website',
      title: resource.name ?? undefined,
    },
    description: resource.description ?? undefined,
    title: resource.name ?? undefined,
  };
};

export default async function ResourcePage({ params }) {
  const { id, locale } = await params;

  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? '';
  const userAgent = headersList.get('user-agent') || 'unknown';
  const referer = headersList.get('referer') || 'unknown';
  const xForwardedFor = headersList.get('x-forwarded-for') || 'unknown';

  if (!id || !isValidUUID(id)) {
    log.debug(
      { id, userAgent, referer, xForwardedFor },
      'Invalid UUID accessed',
    );
    notFound();
  }

  // Before any data fetch or streaming, so a denial is a real 403.
  await protectPage(`/${locale}/search/${id}`);

  const [cookieList, appConfig] = await Promise.all([
    getCookies({ cookies }),
    getAppConfigWithoutHost(locale),
  ]);

  const { resources } = await initTranslations(
    locale,
    i18nNamespaces,
    appConfig.i18n.locales,
    appConfig.i18n.defaultLocale,
  );

  let resource: Resource | null = null;

  try {
    resource = await getResource(id, locale, appConfig.tenantId);
  } catch (err) {
    // A re-keyed id: 308 to the record's new URL (ISS-2514).
    redirectIfRekeyed(err, locale);
  }

  if (!resource) {
    log.debug({ id, userAgent, referer, xForwardedFor }, 'Resource not found');
    notFound();
  }

  const layout = appConfig.resource.layout ?? DEFAULT_RESOURCE_LAYOUT;

  return (
    <PageWrapper
      cookies={cookieList}
      translationData={{ i18nNamespaces, locale, resources }}
      nonce={nonce}
    >
      <ResourcePageContent
        resource={resource}
        layout={layout}
        resourceId={id}
        tenantId={appConfig.tenantId ?? ''}
        locale={locale}
      />
    </PageWrapper>
  );
}
