import color from 'color';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { Metadata } from 'next/types';

import { fontSans } from '@/app/(app)/shared/styles/fonts';
import '@/app/(app)/shared/styles/globals.css';
import '@/app/(app)/shared/styles/map.css';
import { AppConfig } from '@/types/appConfig';
import { getContrastColor } from '@/utils';

import { GoogleTagManagerNoscript } from '../shared/components/google-tag-manager-noscript';
import { GoogleTagManagerScript } from '../shared/components/google-tag-manager-script';
import { Providers } from '../shared/components/providers';
import { USER_PREF_FONT_SIZE } from '../shared/lib/constants';
import { getServerDevice } from '../shared/lib/get-server-device';
import { cn } from '../shared/lib/utils';
import {
  resolveBrandTheme,
  resolveHeaderGradient,
} from '../shared/theme/theme-config';
import { getAppConfigWithoutHost } from '../shared/utils/appConfig';
import { getGoogleSiteVerification } from '../shared/utils/googleSiteVerification';
import { getSession } from '../shared/utils/getServerSession';
import { sanitizeSessionForClient } from '../shared/utils/sanitizeSession';
import { shouldBlockCrawlers } from '../shared/utils/shouldBlockCrawlers';

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);

  const favicon = appConfig.brand.faviconUrl ?? '/favicon.ico';

  // Block search engines when the global env gate blocks indexing or this
  // specific branded tenant has opted out via `tenants.seo.noindex`.
  const blockCrawlers = shouldBlockCrawlers(appConfig.noindex ?? false);

  // Search Console ownership proof for every tenant's branded site. Rendered
  // as `<meta name="google-site-verification">` inside <head>.
  const googleSiteVerification = getGoogleSiteVerification();

  return {
    description: appConfig.meta.description,
    ...(googleSiteVerification && {
      verification: { google: googleSiteVerification },
    }),
    icons: {
      icon: favicon,
    },
    title: appConfig.meta.title,
    ...(blockCrawlers && {
      robots: {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
        },
      },
    }),
  };
};

async function prepareTheme(appConfig: AppConfig) {
  const cookieList = await cookies();

  const { borderRadius, primaryColor, secondaryColor } = resolveBrandTheme(
    appConfig.brand.theme,
  );
  const { headerStart, headerEnd } = resolveHeaderGradient(appConfig.newLayout);

  const primary = color(primaryColor).hsl();
  const primaryHsl = primary.array();
  const primaryForeground = primary.isDark() ? '0 0% 100%' : '0 0% 0%';

  // Compute a focus-ring color guaranteed to contrast with the primary surface.
  // getContrastColor applies the WCAG relative-luminance formula and returns
  // '#FFFFFF' (white) for dark primaries and '#000000' (black) for light ones.
  const ringOnPrimaryHex = getContrastColor(primaryColor);
  const ringOnPrimary =
    ringOnPrimaryHex === '#FFFFFF' ? '0 0% 100%' : '0 0% 3.9%';

  const secondary = color(secondaryColor).hsl();
  const secondaryHsl = secondary.array();
  const secondaryForeground = secondary.isDark() ? '0 0% 100%' : '0 0% 0%';

  let savedFontSize: string | undefined = undefined;

  if (appConfig.accessibility.fontSize.allowedValues.length > 1) {
    const fontSizeCookie = cookieList.get(USER_PREF_FONT_SIZE);

    if (
      fontSizeCookie &&
      appConfig.accessibility.fontSize.allowedValues.includes(
        fontSizeCookie.value,
      )
    ) {
      savedFontSize = fontSizeCookie.value;
    }
  }

  return {
    savedFontSize,
    style: {
      '--primary': `${primaryHsl[0]} ${primaryHsl[1]}% ${primaryHsl[2]}%`,
      '--primary-foreground': primaryForeground,
      '--ring-on-primary': ringOnPrimary,
      '--secondary': `${secondaryHsl[0]} ${secondaryHsl[1]}% ${secondaryHsl[2]}%`,
      '--secondary-foreground': secondaryForeground,
      '--border-radius': borderRadius,
      '--header-start': headerStart,
      '--header-end': headerEnd,
      'font-size': savedFontSize,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appConfig = await getAppConfigWithoutHost(locale);

  const session = await getSession();
  const clientSession = sanitizeSessionForClient(session);

  if (appConfig.brand.name === '') {
    notFound();
  }

  const [{ savedFontSize, style }, headersList] = await Promise.all([
    prepareTheme(appConfig),
    headers(),
  ]);
  const device = getServerDevice(headersList.get('user-agent') ?? '');
  const nonce = headersList.get('x-nonce') ?? '';

  return (
    <html lang={locale} style={style as any} className="max-sm:!text-[100%]">
      <head>
        {/* Must be server-rendered inside <head> for Search Console GTM verification. */}
        <GoogleTagManagerScript
          containerId={appConfig.gtmContainerId}
          nonce={nonce}
        />
      </head>
      <body
        className={cn('font-sans antialiased', fontSans.variable)}
        id="app-root"
      >
        {/* Must stay the first child of <body> for Search Console GTM verification. */}
        <GoogleTagManagerNoscript containerId={appConfig.gtmContainerId} />
        <Providers
          appConfig={appConfig}
          device={device}
          fontSize={savedFontSize ?? '1rem'}
          session={clientSession}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
