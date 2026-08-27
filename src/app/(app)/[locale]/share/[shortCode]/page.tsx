import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { expandShortUrl } from '@/app/(app)/shared/serverActions/shortUrl/expandShortUrl';
import { getAppConfigWithoutHost } from '@/app/(app)/shared/utils/appConfig';
import { getSession } from '@/app/(app)/shared/utils/getServerSession';
import { parseHost } from '@/app/(app)/shared/utils/parseHost';
import { getPublicPageCategory } from '@/app/(app)/shared/utils/publicPageCategory';
import { createLogger } from '@/lib/logger';
import { findTenantByHost } from '@/payload/collections/Tenants/actions';

interface SharePageProps {
  params: Promise<{ locale: string; shortCode: string }>;
}

const log = createLogger('SharePage');

function getUrlPathname(url: string): string {
  try {
    return new URL(url, 'http://localhost').pathname;
  } catch {
    return url;
  }
}

export default async function SharePage({ params }: SharePageProps) {
  const { locale, shortCode } = await params;

  if (!shortCode) {
    notFound();
  }

  const appConfig = await getAppConfigWithoutHost(locale);

  let url: string | null = null;

  try {
    url = await expandShortUrl(shortCode, appConfig.tenantId);
    log.debug({ shortCode, url }, 'Expanded short code');
  } catch (error) {
    log.error({ shortCode, error }, 'Failed to expand short code');
    notFound();
  }

  if (!url) {
    log.debug({ shortCode }, 'No URL found for short code');
    notFound();
  }

  // `/share/[shortCode]` always bypasses the edge login wall (the short
  // code carries no category info until it's expanded), so re-apply the
  // same public-page check here against the resolved destination before
  // following it.
  const headersList = await headers();
  const host =
    process.env.CUSTOM_AUTH_HOST ||
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    'localhost';
  const tenant = await findTenantByHost(parseHost(host));

  if (tenant?.auth?.requiresLogin) {
    const session = await getSession();

    if (!session) {
      const category = getPublicPageCategory(getUrlPathname(url));
      const isPublicPage = Boolean(
        category && tenant.auth.publicPages?.includes(category),
      );

      if (!isPublicPage) {
        log.debug(
          { shortCode, url },
          'Anonymous share link target requires login',
        );
        redirect(
          `/${locale}/auth/signin?redirect=${encodeURIComponent(`/share/${shortCode}`)}`,
        );
      }
    }
  }

  log.debug({ shortCode, url }, 'Redirecting to URL');
  redirect(url);
}
